package main

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

const testToken = "ghp_test"

func TestSemver(t *testing.T) {
	for _, bad := range []string{"", "1", "1.2", "1.2.3.4", "1.2.x", "01.2.3", "1.2.3-rc1", "-1.0.0"} {
		if _, ok := parseSemver(bad); ok {
			t.Errorf("%q non dovrebbe essere valida", bad)
		}
	}
	a, _ := parseSemver("0.9.0")
	b, _ := parseSemver("0.10.0")
	if !a.less(b) || b.less(a) || a.less(a) {
		t.Error("confronto sbagliato (0.9.0 < 0.10.0)")
	}
	if b.String() != "0.10.0" {
		t.Error(b.String())
	}
}

func TestLatestIgnoresOtherPrefixesAndPicksHighest(t *testing.T) {
	rels := []release{{Tag: "v0.8.0"}, {Tag: "v0.10.0"}, {Tag: "v0.9.5"}, {Tag: "launcher-v9.0.0"}, {Tag: "v1.0.0-beta"}, {Tag: "nightly"}}
	r, v, ok := latest(rels, "v")
	if !ok || r.Tag != "v0.10.0" || v.String() != "0.10.0" {
		t.Fatalf("gioco: %v %v %v", r.Tag, v, ok)
	}
	r, _, ok = latest(rels, "launcher-v")
	if !ok || r.Tag != "launcher-v9.0.0" {
		t.Fatalf("launcher: %v", r.Tag)
	}
	if _, _, ok := latest(nil, "v"); ok {
		t.Error("lista vuota")
	}
}

func makeZip(t *testing.T, files map[string]string) []byte {
	t.Helper()
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for name, body := range files {
		h := &zip.FileHeader{Name: name, Method: zip.Deflate}
		h.SetMode(0o755)
		w, err := zw.CreateHeader(h)
		if err != nil {
			t.Fatal(err)
		}
		w.Write([]byte(body))
	}
	zw.Close()
	return buf.Bytes()
}

func TestExtractZip(t *testing.T) {
	dir := t.TempDir()
	zp := filepath.Join(dir, "a.zip")
	os.WriteFile(zp, makeZip(t, map[string]string{"x.txt": "1", "sub/y.txt": "2"}), 0o644)
	out := filepath.Join(dir, "out")
	if err := extractZip(zp, out); err != nil {
		t.Fatal(err)
	}
	if b, _ := os.ReadFile(filepath.Join(out, "sub", "y.txt")); string(b) != "2" {
		t.Error("file annidato non estratto")
	}
}

func TestExtractZipRejectsTraversal(t *testing.T) {
	dir := t.TempDir()
	zp := filepath.Join(dir, "evil.zip")
	os.WriteFile(zp, makeZip(t, map[string]string{"../evil.txt": "x"}), 0o644)
	if err := extractZip(zp, filepath.Join(dir, "out")); err == nil {
		t.Fatal("percorso con .. accettato")
	}
	if _, err := os.Stat(filepath.Join(dir, "evil.txt")); err == nil {
		t.Fatal("file scritto fuori dalla cartella")
	}
}

func TestSwapDir(t *testing.T) {
	root := t.TempDir()
	cur, fresh := filepath.Join(root, "game"), filepath.Join(root, "game.new")
	os.MkdirAll(cur, 0o755)
	os.WriteFile(filepath.Join(cur, "v"), []byte("1"), 0o644)
	os.MkdirAll(fresh, 0o755)
	os.WriteFile(filepath.Join(fresh, "v"), []byte("2"), 0o644)
	if err := swapDir(fresh, cur); err != nil {
		t.Fatal(err)
	}
	if b, _ := os.ReadFile(filepath.Join(cur, "v")); string(b) != "2" {
		t.Error("versione non sostituita")
	}
	if _, err := os.Stat(cur + ".old"); err == nil {
		t.Error("resta la cartella .old")
	}
	// prima installazione: nessuna cartella precedente
	os.RemoveAll(cur)
	os.MkdirAll(fresh, 0o755)
	if err := swapDir(fresh, cur); err != nil {
		t.Fatal(err)
	}
}

// fakeGitHub imita l'API delle release di un repository privato: ogni richiesta senza token riceve 404.
type fakeGitHub struct {
	srv     *httptest.Server
	assets  map[string][]byte // nome -> contenuto
	tags    map[string][]string
	hits    int
	tamper  bool
	missing map[string]bool
}

func newFakeGitHub(t *testing.T) *fakeGitHub {
	f := &fakeGitHub{assets: map[string][]byte{}, tags: map[string][]string{}, missing: map[string]bool{}}
	f.srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f.hits++
		if r.Header.Get("Authorization") != "Bearer "+testToken {
			http.NotFound(w, r)
			return
		}
		switch {
		case strings.HasSuffix(r.URL.Path, "/releases"):
			var rels []map[string]any
			for tag, names := range f.tags {
				var as []map[string]any
				for _, n := range names {
					as = append(as, map[string]any{"name": n, "url": f.srv.URL + "/assets/" + n, "size": len(f.assets[n])})
				}
				rels = append(rels, map[string]any{"tag_name": tag, "assets": as})
			}
			json.NewEncoder(w).Encode(rels)
		case strings.HasPrefix(r.URL.Path, "/assets/"):
			name := strings.TrimPrefix(r.URL.Path, "/assets/")
			body, ok := f.assets[name]
			if !ok {
				http.NotFound(w, r)
				return
			}
			if f.tamper && !strings.HasSuffix(name, ".sha256") {
				body = append([]byte("X"), body[1:]...)
			}
			w.Write(body)
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(f.srv.Close)
	return f
}

func (f *fakeGitHub) publish(tag, name string, body []byte) {
	sum := sha256.Sum256(body)
	f.assets[name] = body
	f.tags[tag] = append(f.tags[tag], name)
	if !f.missing[name] {
		f.assets[name+".sha256"] = []byte(hex.EncodeToString(sum[:]) + "  " + name + "\n")
		f.tags[tag] = append(f.tags[tag], name+".sha256")
	}
}

func (f *fakeGitHub) app(t *testing.T, token string) *app {
	c := newClient("o/r", token)
	c.base = f.srv.URL
	return &app{home: t.TempDir(), client: c, out: io.Discard}
}

func gameZip(t *testing.T, marker string) []byte {
	return makeZip(t, map[string]string{gameEntry(): "#!/bin/sh\n", "marker.txt": marker})
}

func TestReleasesNeedValidToken(t *testing.T) {
	f := newFakeGitHub(t)
	f.publish("v0.1.0", "x", []byte("x"))
	a := f.app(t, "sbagliato")
	_, err := a.client.releases(context.Background())
	if !authProblem(err) {
		t.Fatalf("atteso errore di autorizzazione, ottenuto %v", err)
	}
	a = f.app(t, testToken)
	if rels, err := a.client.releases(context.Background()); err != nil || len(rels) != 1 {
		t.Fatalf("%v %v", rels, err)
	}
}

func TestInstallThenUpdateGame(t *testing.T) {
	f := newFakeGitHub(t)
	f.publish("v0.8.0", gameAssetName(semver{0, 8, 0}), gameZip(t, "8"))
	a := f.app(t, testToken)
	ctx := context.Background()

	rels, _ := a.client.releases(ctx)
	if up, err := a.updateGame(ctx, rels); err != nil || !up {
		t.Fatalf("installazione: %v %v", up, err)
	}
	marker := func() string { b, _ := os.ReadFile(filepath.Join(a.gameDir(), "marker.txt")); return string(b) }
	if marker() != "8" || loadState(a.home).GameVersion != "0.8.0" {
		t.Fatal("versione 0.8.0 non installata")
	}

	// nessuna novità: niente download
	hits := f.hits
	if up, err := a.updateGame(ctx, rels); err != nil || up || f.hits != hits {
		t.Fatalf("aggiornamento inutile: %v %v", up, err)
	}

	// nuova release (0.10.0 > 0.9.0 anche se come testo sarebbe minore)
	f.publish("v0.9.0", gameAssetName(semver{0, 9, 0}), gameZip(t, "9"))
	f.publish("v0.10.0", gameAssetName(semver{0, 10, 0}), gameZip(t, "10"))
	rels, _ = a.client.releases(ctx)
	if up, err := a.updateGame(ctx, rels); err != nil || !up {
		t.Fatalf("aggiornamento: %v %v", up, err)
	}
	if marker() != "10" || loadState(a.home).GameVersion != "0.10.0" {
		t.Fatalf("atteso 0.10.0, trovato marker %q", marker())
	}
}

func TestTamperedDownloadIsRejectedAndOldGameKept(t *testing.T) {
	f := newFakeGitHub(t)
	f.publish("v0.8.0", gameAssetName(semver{0, 8, 0}), gameZip(t, "8"))
	a := f.app(t, testToken)
	ctx := context.Background()
	rels, _ := a.client.releases(ctx)
	if _, err := a.updateGame(ctx, rels); err != nil {
		t.Fatal(err)
	}

	f.publish("v0.9.0", gameAssetName(semver{0, 9, 0}), gameZip(t, "9"))
	f.tamper = true
	rels, _ = a.client.releases(ctx)
	if _, err := a.updateGame(ctx, rels); err == nil || !strings.Contains(err.Error(), "integrità") {
		t.Fatalf("download manomesso accettato: %v", err)
	}
	if b, _ := os.ReadFile(filepath.Join(a.gameDir(), "marker.txt")); string(b) != "8" {
		t.Error("la versione installata è stata toccata")
	}
	if loadState(a.home).GameVersion != "0.8.0" {
		t.Error("stato cambiato")
	}
}

func TestMissingChecksumIsRejected(t *testing.T) {
	f := newFakeGitHub(t)
	name := gameAssetName(semver{0, 8, 0})
	f.missing[name] = true
	f.publish("v0.8.0", name, gameZip(t, "8"))
	a := f.app(t, testToken)
	rels, _ := a.client.releases(context.Background())
	if _, err := a.updateGame(context.Background(), rels); err == nil || !strings.Contains(err.Error(), ".sha256") {
		t.Fatalf("release senza checksum accettata: %v", err)
	}
}

func TestZipWithoutEntryIsRejected(t *testing.T) {
	f := newFakeGitHub(t)
	f.publish("v0.8.0", gameAssetName(semver{0, 8, 0}), makeZip(t, map[string]string{"altro.txt": "x"}))
	a := f.app(t, testToken)
	rels, _ := a.client.releases(context.Background())
	if _, err := a.updateGame(context.Background(), rels); err == nil {
		t.Fatal("zip senza eseguibile accettato")
	}
	if _, err := os.Stat(a.gameDir()); err == nil {
		t.Error("cartella del gioco creata da uno zip non valido")
	}
}

func TestUpdateLauncher(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("il rename di un exe in uso è coperto a mano su Windows")
	}
	old := version
	defer func() { version = old }()
	f := newFakeGitHub(t)
	f.publish("launcher-v1.1.0", launcherAssetName(), []byte("NUOVO"))
	a := f.app(t, testToken)
	exe := filepath.Join(t.TempDir(), "launcher")
	os.WriteFile(exe, []byte("VECCHIO"), 0o755)
	rels, _ := a.client.releases(context.Background())

	version = "dev" // build di sviluppo: non si aggiorna
	if up, _ := a.updateLauncher(context.Background(), rels, exe); up {
		t.Fatal("la build dev non deve aggiornarsi")
	}
	version = "1.1.0" // già aggiornato
	if up, _ := a.updateLauncher(context.Background(), rels, exe); up {
		t.Fatal("stessa versione")
	}
	version = "1.0.0"
	up, err := a.updateLauncher(context.Background(), rels, exe)
	if err != nil || !up {
		t.Fatalf("%v %v", up, err)
	}
	b, _ := os.ReadFile(exe)
	st, _ := os.Stat(exe)
	if string(b) != "NUOVO" || st.Mode()&0o100 == 0 {
		t.Fatalf("launcher non sostituito: %q %v", b, st.Mode())
	}
}

func TestTokenSealRoundTrip(t *testing.T) {
	s, err := sealToken("abc123")
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(s, "abc123") && secretScheme != "plain" {
		t.Error("token in chiaro nel file")
	}
	if got := (config{Token: s}).savedToken(); got != "abc123" {
		t.Fatalf("riletto %q", got)
	}
	if (config{Token: "dpapi:!!"}).savedToken() != "" || (config{}).savedToken() != "" {
		t.Error("valori non validi devono dare stringa vuota")
	}
}
