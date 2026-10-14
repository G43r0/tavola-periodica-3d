package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strings"
	"time"
)

// apiRoot è una variabile solo per poterla sostituire in compilazione nei test end-to-end.
var apiRoot = "https://api.github.com"

const stallTimeout = 60 * time.Second // nessun byte ricevuto per questo tempo = download bloccato

type asset struct {
	Name string `json:"name"`
	URL  string `json:"url"` // URL API dell'asset: l'unico scaricabile da un repository privato
	Size int64  `json:"size"`
}

type release struct {
	Tag        string  `json:"tag_name"`
	Name       string  `json:"name"`
	Draft      bool    `json:"draft"`
	Prerelease bool    `json:"prerelease"`
	Assets     []asset `json:"assets"`
}

func (r release) asset(name string) (asset, bool) {
	for _, a := range r.Assets {
		if a.Name == name {
			return a, true
		}
	}
	return asset{}, false
}

// apiError è una risposta HTTP diversa da 200.
type apiError struct {
	Status int
	URL    string
}

func (e *apiError) Error() string { return fmt.Sprintf("GitHub ha risposto %d", e.Status) }

// authProblem dice se l'errore dipende dal token (o dai suoi permessi) e non dalla rete.
func authProblem(err error) bool {
	var ae *apiError
	if !errors.As(err, &ae) {
		return false
	}
	return ae.Status == 401 || ae.Status == 403 || ae.Status == 404
}

type client struct {
	base  string
	repo  string
	token string
	http  *http.Client
}

func newClient(repo, token string) *client {
	tr := &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		DialContext:           (&net.Dialer{Timeout: 15 * time.Second}).DialContext,
		TLSHandshakeTimeout:   15 * time.Second,
		ResponseHeaderTimeout: 30 * time.Second,
	}
	return &client{base: apiRoot, repo: repo, token: token, http: &http.Client{Transport: tr}}
}

func (c *client) do(ctx context.Context, url, accept string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Accept", accept)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "tp3d-launcher/"+version)
	// Il token non viene mai inoltrato ai redirect verso altri host (lo toglie net/http).
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, &apiError{Status: resp.StatusCode, URL: url}
	}
	return resp, nil
}

// releases elenca le release pubblicate (le bozze e le pre-release sono escluse).
func (c *client) releases(ctx context.Context) ([]release, error) {
	resp, err := c.do(ctx, c.base+"/repos/"+c.repo+"/releases?per_page=50", "application/vnd.github+json")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var all []release
	if err := json.NewDecoder(io.LimitReader(resp.Body, 32<<20)).Decode(&all); err != nil {
		return nil, fmt.Errorf("risposta di GitHub non valida: %w", err)
	}
	out := all[:0]
	for _, r := range all {
		if !r.Draft && !r.Prerelease {
			out = append(out, r)
		}
	}
	return out, nil
}

// latest restituisce la release con la versione più alta tra quelle il cui tag è prefisso + MAGGIORE.MINORE.PATCH.
func latest(rels []release, prefix string) (release, semver, bool) {
	var best release
	var bestV semver
	found := false
	for _, r := range rels {
		rest, ok := strings.CutPrefix(r.Tag, prefix)
		if !ok {
			continue
		}
		v, ok := parseSemver(rest)
		if !ok {
			continue
		}
		if !found || bestV.less(v) {
			best, bestV, found = r, v, true
		}
	}
	return best, bestV, found
}

// fetchText scarica un asset piccolo (il file .sha256).
func (c *client) fetchText(ctx context.Context, a asset) (string, error) {
	resp, err := c.do(ctx, a.URL, "application/octet-stream")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
	return string(b), err
}

// download scarica un asset in dst e ne restituisce lo SHA-256.
func (c *client) download(ctx context.Context, a asset, dst string, progress func(done, total int64)) (string, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	stalled := false
	watchdog := time.AfterFunc(stallTimeout, func() { stalled = true; cancel() })
	defer watchdog.Stop()

	resp, err := c.do(ctx, a.URL, "application/octet-stream")
	if err != nil {
		if stalled {
			return "", errors.New("connessione bloccata")
		}
		return "", err
	}
	defer resp.Body.Close()

	f, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	defer f.Close()

	total := a.Size
	if resp.ContentLength > 0 {
		total = resp.ContentLength
	}
	h := sha256.New()
	buf := make([]byte, 128<<10)
	var done int64
	for {
		n, rerr := resp.Body.Read(buf)
		if n > 0 {
			watchdog.Reset(stallTimeout)
			if _, werr := f.Write(buf[:n]); werr != nil {
				return "", werr
			}
			h.Write(buf[:n])
			done += int64(n)
			if progress != nil {
				progress(done, total)
			}
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			if stalled {
				return "", errors.New("connessione bloccata")
			}
			return "", rerr
		}
	}
	if total > 0 && done != total {
		return "", fmt.Errorf("download incompleto (%d di %d byte)", done, total)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// checksumFor legge l'hash atteso dall'asset «<nome>.sha256» (formato di sha256sum: «hash  nome»).
func (c *client) checksumFor(ctx context.Context, rel release, name string) (string, error) {
	a, ok := rel.asset(name + ".sha256")
	if !ok {
		return "", fmt.Errorf("nella release %s manca %s.sha256: aggiornamento rifiutato", rel.Tag, name)
	}
	txt, err := c.fetchText(ctx, a)
	if err != nil {
		return "", err
	}
	fields := strings.Fields(txt)
	if len(fields) == 0 || len(fields[0]) != 64 {
		return "", fmt.Errorf("%s.sha256 non è valido", name)
	}
	return strings.ToLower(fields[0]), nil
}
