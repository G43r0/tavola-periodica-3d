package main

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// gameEntry è il file da avviare dentro la cartella del gioco.
func gameEntry() string {
	if runtime.GOOS == "windows" {
		return "Tavola Periodica 3D.exe"
	}
	return "tavola-periodica-3d"
}

func gameAssetName(ver semver) string {
	return fmt.Sprintf("TavolaPeriodica3D-%s-%s-%s.zip", runtime.GOOS, runtime.GOARCH, ver)
}

func launcherAssetName() string {
	name := fmt.Sprintf("tp3d-launcher-%s-%s", runtime.GOOS, runtime.GOARCH)
	if runtime.GOOS == "windows" {
		name += ".exe"
	}
	return name
}

// extractZip estrae lo zip in dest rifiutando percorsi che escono dalla cartella e collegamenti simbolici.
func extractZip(zipPath, dest string) error {
	zr, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer zr.Close()
	if err := os.MkdirAll(dest, 0o755); err != nil {
		return err
	}
	root := filepath.Clean(dest) + string(os.PathSeparator)
	for _, f := range zr.File {
		target := filepath.Join(dest, filepath.FromSlash(f.Name))
		if !strings.HasPrefix(target, root) {
			return fmt.Errorf("percorso non valido nello zip: %q", f.Name)
		}
		mode := f.Mode()
		switch {
		case mode&os.ModeSymlink != 0:
			return fmt.Errorf("collegamento simbolico non ammesso nello zip: %q", f.Name)
		case f.FileInfo().IsDir():
			if err := os.MkdirAll(target, 0o755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		if err := extractFile(f, target, mode.Perm()|0o600); err != nil {
			return err
		}
	}
	return nil
}

func extractFile(f *zip.File, target string, perm os.FileMode) error {
	src, err := f.Open()
	if err != nil {
		return err
	}
	defer src.Close()
	out, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, perm)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, src); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}

// swapDir sostituisce cur con fresh; se qualcosa va storto ripristina la versione precedente.
func swapDir(fresh, cur string) error {
	old := cur + ".old"
	if err := os.RemoveAll(old); err != nil {
		return err
	}
	hadOld := true
	if err := os.Rename(cur, old); err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("non riesco a sostituire la versione installata (il gioco è aperto?): %w", err)
		}
		hadOld = false
	}
	if err := os.Rename(fresh, cur); err != nil {
		if hadOld {
			os.Rename(old, cur)
		}
		return err
	}
	os.RemoveAll(old) // se un file è ancora in uso resta e lo si toglie al prossimo avvio
	return nil
}

// replaceExecutable mette newPath al posto dell'eseguibile in esecuzione.
// Su Windows un exe in uso non si può sovrascrivere ma si può rinominare.
func replaceExecutable(exe, newPath string) error {
	if runtime.GOOS != "windows" {
		return os.Rename(newPath, exe)
	}
	old := exe + ".old"
	os.Remove(old)
	if err := os.Rename(exe, old); err != nil {
		return err
	}
	if err := os.Rename(newPath, exe); err != nil {
		os.Rename(old, exe)
		return err
	}
	return nil
}
