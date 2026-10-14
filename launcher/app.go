package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type app struct {
	home   string
	client *client
	out    io.Writer
	force  bool
}

func (a *app) say(format string, args ...any) { fmt.Fprintf(a.out, format+"\n", args...) }

func (a *app) gameDir() string { return filepath.Join(a.home, "game") }
func (a *app) tmpDir() string  { return filepath.Join(a.home, "tmp") }

func (a *app) progress(label string) func(done, total int64) {
	var last time.Time
	return func(done, total int64) {
		if time.Since(last) < 100*time.Millisecond && done != total {
			return
		}
		last = time.Now()
		if total <= 0 {
			fmt.Fprintf(a.out, "\r  %s %.1f MB", label, float64(done)/1e6)
			return
		}
		const width = 24
		filled := int(float64(done) / float64(total) * width)
		fmt.Fprintf(a.out, "\r  %s [%s%s] %3d%%  %.1f/%.1f MB", label,
			strings.Repeat("#", filled), strings.Repeat(".", width-filled),
			done*100/total, float64(done)/1e6, float64(total)/1e6)
	}
}

// fetchVerified scarica l'asset in tmp e controlla lo SHA-256 con quello pubblicato nella release.
func (a *app) fetchVerified(ctx context.Context, rel release, as asset, label string) (string, error) {
	want, err := a.client.checksumFor(ctx, rel, as.Name)
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(a.tmpDir(), 0o755); err != nil {
		return "", err
	}
	dst := filepath.Join(a.tmpDir(), as.Name)
	got, err := a.client.download(ctx, as, dst, a.progress(label))
	fmt.Fprintln(a.out)
	if err != nil {
		os.Remove(dst)
		return "", err
	}
	if got != want {
		os.Remove(dst)
		return "", fmt.Errorf("controllo di integrità fallito per %s (SHA-256 diverso da quello pubblicato)", as.Name)
	}
	return dst, nil
}

// updateGame installa l'ultima versione del gioco se è più recente di quella presente.
func (a *app) updateGame(ctx context.Context, rels []release) (bool, error) {
	rel, ver, ok := latest(rels, "v")
	if !ok {
		return false, fmt.Errorf("nessuna release del gioco trovata")
	}
	st := loadState(a.home)
	installed, hasVer := parseSemver(st.GameVersion)
	_, err := os.Stat(filepath.Join(a.gameDir(), gameEntry()))
	present := err == nil && hasVer
	if present && !installed.less(ver) && !a.force {
		a.say("Gioco aggiornato (versione %s).", installed)
		return false, nil
	}
	as, ok := rel.asset(gameAssetName(ver))
	if !ok {
		return false, fmt.Errorf("la release %s non contiene %s per questo sistema", rel.Tag, gameAssetName(ver))
	}
	if present {
		a.say("Aggiornamento del gioco: %s → %s", installed, ver)
	} else {
		a.say("Installazione del gioco, versione %s", ver)
	}
	zipPath, err := a.fetchVerified(ctx, rel, as, "gioco")
	if err != nil {
		return false, err
	}
	defer os.Remove(zipPath)

	fresh := a.gameDir() + ".new"
	os.RemoveAll(fresh)
	a.say("  Estrazione…")
	if err := extractZip(zipPath, fresh); err != nil {
		os.RemoveAll(fresh)
		return false, err
	}
	if _, err := os.Stat(filepath.Join(fresh, gameEntry())); err != nil {
		os.RemoveAll(fresh)
		return false, fmt.Errorf("lo zip non contiene %s", gameEntry())
	}
	if err := swapDir(fresh, a.gameDir()); err != nil {
		os.RemoveAll(fresh)
		return false, err
	}
	if err := saveState(a.home, state{GameVersion: ver.String()}); err != nil {
		return true, err
	}
	a.say("Gioco aggiornato alla versione %s.", ver)
	return true, nil
}

// updateLauncher scarica la versione più recente del launcher e la mette al posto di exe.
func (a *app) updateLauncher(ctx context.Context, rels []release, exe string) (bool, error) {
	cur, ok := parseSemver(version)
	if !ok { // build di sviluppo: nessun aggiornamento automatico
		return false, nil
	}
	rel, ver, ok := latest(rels, "launcher-v")
	if !ok || !cur.less(ver) {
		return false, nil
	}
	as, ok := rel.asset(launcherAssetName())
	if !ok {
		return false, nil
	}
	a.say("Aggiornamento del launcher: %s → %s", cur, ver)
	tmp, err := a.fetchVerified(ctx, rel, as, "launcher")
	if err != nil {
		return false, err
	}
	// Lo metto accanto all'eseguibile così il rename resta sullo stesso disco.
	next := exe + ".new"
	if err := os.Rename(tmp, next); err != nil {
		if err := copyFile(tmp, next); err != nil {
			return false, fmt.Errorf("non posso scrivere accanto a %s: %w", exe, err)
		}
		os.Remove(tmp)
	}
	if err := os.Chmod(next, 0o755); err != nil {
		os.Remove(next)
		return false, err
	}
	if err := replaceExecutable(exe, next); err != nil {
		os.Remove(next)
		return false, fmt.Errorf("non riesco a sostituire il launcher: %w", err)
	}
	return true, nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}

func (a *app) launchGame(extra []string) error {
	dir := a.gameDir()
	entry := filepath.Join(dir, gameEntry())
	if _, err := os.Stat(entry); err != nil {
		return fmt.Errorf("gioco non installato")
	}
	os.Chmod(entry, 0o755)
	cmd := exec.Command(entry, append(extraGameArgs(dir), extra...)...)
	cmd.Dir = dir
	detach(cmd)
	if err := cmd.Start(); err != nil {
		return err
	}
	return cmd.Process.Release()
}

// cleanup toglie gli avanzi di aggiornamenti interrotti o di file che erano in uso.
func (a *app) cleanup(exe string) {
	os.RemoveAll(a.tmpDir())
	os.RemoveAll(a.gameDir() + ".new")
	os.RemoveAll(a.gameDir() + ".old")
	if exe != "" {
		os.Remove(exe + ".old")
		os.Remove(exe + ".new")
	}
}
