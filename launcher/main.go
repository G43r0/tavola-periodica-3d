// Launcher di Tavola Periodica 3D: scarica e aggiorna il gioco (e se stesso) dalle release di un
// repository GitHub privato, poi avvia il gioco. Usa solo la libreria standard.
package main

import (
	"bufio"
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"time"
)

var (
	version     = "dev" // impostata in compilazione: -ldflags "-X main.version=1.2.3"
	defaultRepo = "G43r0/tavola-periodica-3d"
)

const (
	envToken     = "TP3D_TOKEN"
	envSkipSelf  = "TP3D_LAUNCHER_UPDATED"
	maxAuthTries = 3
)

func main() {
	code := run()
	if code != 0 && pauseOnError {
		fmt.Print("\nPremi Invio per chiudere…")
		stdin.ReadString('\n')
	}
	os.Exit(code)
}

func run() int {
	var (
		showVersion = flag.Bool("version", false, "mostra la versione del launcher")
		noUpdate    = flag.Bool("no-update", false, "non cercare aggiornamenti: avvia il gioco installato")
		updateOnly  = flag.Bool("update-only", false, "aggiorna senza avviare il gioco")
		force       = flag.Bool("force", false, "reinstalla il gioco anche se è già aggiornato")
		resetToken  = flag.Bool("reset-token", false, "dimentica il token salvato e chiedilo di nuovo")
	)
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Launcher di Tavola Periodica 3D %s\n\nUso: launcher [opzioni] [-- argomenti per il gioco]\n\n", version)
		flag.PrintDefaults()
	}
	flag.Parse()
	if *showVersion {
		fmt.Println(version)
		return 0
	}

	home, err := dataDir()
	if err == nil {
		err = os.MkdirAll(home, 0o700)
	}
	if err != nil {
		return fail("cartella dati non disponibile: %v", err)
	}
	exe, _ := os.Executable()
	if resolved, err := filepath.EvalSymlinks(exe); err == nil {
		exe = resolved
	}

	a := &app{home: home, out: os.Stdout, force: *force}
	a.cleanup(exe)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	cfg := loadConfig(home)
	repo := cfg.Repo
	if repo == "" {
		repo = defaultRepo
	}
	if *resetToken {
		cfg.Token = ""
		saveConfig(home, cfg)
	}

	installed := func() bool {
		_, err := os.Stat(filepath.Join(a.gameDir(), gameEntry()))
		return err == nil
	}

	var rels []release
	online := false
	if !*noUpdate {
		var err error
		a.client, rels, err = a.connect(ctx, repo, &cfg)
		switch {
		case err == nil:
			online = true
		case errors.Is(err, context.Canceled):
			return 1
		case installed() && !authProblem(err):
			a.say("Impossibile controllare gli aggiornamenti (%v): avvio la versione installata.", err)
		default:
			return fail("%v", err)
		}
	}

	if online {
		// 1. il launcher stesso (una sola volta: il processo rilanciato salta questo passo)
		if os.Getenv(envSkipSelf) == "" {
			switch updated, err := a.updateLauncher(ctx, rels, exe); {
			case err != nil:
				a.say("Launcher non aggiornato: %v", err)
			case updated:
				a.say("Riavvio con il launcher nuovo…")
				return rerun(exe)
			}
		}
		// 2. il gioco
		if _, err := a.updateGame(ctx, rels); err != nil {
			if !installed() {
				return fail("%v", err)
			}
			a.say("Gioco non aggiornato: %v\nAvvio la versione installata.", err)
		}
	}

	if *updateOnly {
		return 0
	}
	if err := a.launchGame(flag.Args()); err != nil {
		return fail("impossibile avviare il gioco: %v", err)
	}
	a.say("Buon divertimento!")
	return 0
}

// rerun lancia di nuovo il launcher (ora aggiornato) con gli stessi argomenti e ne propaga l'esito.
func rerun(exe string) int {
	cmd := exec.Command(exe, os.Args[1:]...)
	cmd.Stdin, cmd.Stdout, cmd.Stderr = os.Stdin, os.Stdout, os.Stderr
	cmd.Env = append(os.Environ(), envSkipSelf+"=1")
	if err := cmd.Run(); err != nil {
		var ee *exec.ExitError
		if errors.As(err, &ee) {
			return ee.ExitCode()
		}
		return fail("impossibile riavviare il launcher: %v", err)
	}
	return 0
}

func fail(format string, args ...any) int {
	fmt.Fprintf(os.Stderr, "Errore: "+format+"\n", args...)
	return 1
}

// connect ottiene l'elenco delle release; se manca o non vale il token lo chiede all'utente.
func (a *app) connect(ctx context.Context, repo string, cfg *config) (*client, []release, error) {
	token := os.Getenv(envToken)
	fromEnv := token != ""
	if !fromEnv {
		token = cfg.savedToken()
	}
	for try := 0; ; try++ {
		if token == "" {
			if try >= maxAuthTries {
				return nil, nil, errNoToken
			}
			t, err := a.askToken(repo)
			if err != nil {
				return nil, nil, err
			}
			token = t
		}
		c := newClient(repo, token)
		cctx, cancel := context.WithTimeout(ctx, 30*time.Second)
		rels, err := c.releases(cctx)
		cancel()
		if err == nil {
			if !fromEnv && cfg.savedToken() != token {
				sealed, serr := sealToken(token)
				if serr == nil {
					cfg.Token = sealed
					serr = saveConfig(a.home, *cfg)
				}
				if serr != nil {
					a.say("Attenzione: non riesco a salvare il token (%v).", serr)
				}
			}
			return c, rels, nil
		}
		if !authProblem(err) {
			return nil, nil, err
		}
		if fromEnv {
			return nil, nil, fmt.Errorf("il token in %s non è valido o non ha accesso a %s (%v)", envToken, repo, err)
		}
		a.say("Il token non è valido o non ha accesso in lettura a %s (%v).", repo, err)
		token = ""
	}
}

var stdin = bufio.NewReader(os.Stdin) // unico lettore: più bufio.Reader sulla stessa pipe si "mangiano" le righe

func (a *app) askToken(repo string) (string, error) {
	a.say("Il repository %s è privato: serve un token GitHub con sola lettura.", repo)
	a.say("Crealo su https://github.com/settings/personal-access-tokens/new")
	a.say("  - Repository access: solo questo repository")
	a.say("  - Permissions → Repository → Contents: Read-only")
	a.say("Il token resta su questo computer e non viene mai mostrato.\n")
	fmt.Fprint(a.out, "Incolla il token e premi Invio: ")
	line, err := readSecretLine(func() (string, error) { return stdin.ReadString('\n') })
	fmt.Fprintln(a.out)
	token := strings.TrimSpace(line)
	if token == "" {
		if err == nil {
			err = errNoToken
		}
		return "", err
	}
	return token, nil
}
