//go:build windows

package main

import (
	"os/exec"
	"syscall"
)

// Il gioco deve sopravvivere alla chiusura della finestra del launcher.
func detach(cmd *exec.Cmd) {
	const detachedProcess, newProcessGroup = 0x00000008, 0x00000200
	cmd.SysProcAttr = &syscall.SysProcAttr{CreationFlags: detachedProcess | newProcessGroup}
}

// Su Windows il launcher si apre con un doppio clic: tiene la finestra aperta se c'è un errore da leggere.
const pauseOnError = true

// Su Windows non servono opzioni aggiuntive.
func extraGameArgs(dir string) []string { return nil }
