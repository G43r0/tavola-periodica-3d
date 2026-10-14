//go:build !windows

package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

func detach(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
}

const pauseOnError = false

// Electron scompattato non ha chrome-sandbox con SUID root: senza quel bit Chromium rifiuta di partire.
func extraGameArgs(dir string) []string {
	st, err := os.Stat(filepath.Join(dir, "chrome-sandbox"))
	if err != nil {
		return nil
	}
	if sys, ok := st.Sys().(*syscall.Stat_t); ok && sys.Uid == 0 && st.Mode()&os.ModeSetuid != 0 {
		return nil
	}
	return []string{"--no-sandbox"}
}
