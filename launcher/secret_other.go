//go:build !windows

package main

import (
	"os"
	"os/exec"
)

// Fuori da Windows il token resta in chiaro nel file di configurazione, leggibile solo dal proprietario (0600).
const secretScheme = "plain"

func protectSecret(b []byte) ([]byte, error)   { return b, nil }
func unprotectSecret(b []byte) ([]byte, error) { return b, nil }

// readSecretLine legge una riga senza mostrarla a schermo (se c'è un terminale).
func readSecretLine(read func() (string, error)) (string, error) {
	off := exec.Command("stty", "-echo")
	off.Stdin = os.Stdin
	if off.Run() == nil {
		defer func() {
			on := exec.Command("stty", "echo")
			on.Stdin = os.Stdin
			on.Run()
		}()
	}
	return read()
}
