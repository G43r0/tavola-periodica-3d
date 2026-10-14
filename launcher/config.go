package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

// dataDir è la cartella dove vivono configurazione, gioco installato e file temporanei.
func dataDir() (string, error) {
	if d := os.Getenv("TP3D_HOME"); d != "" {
		return d, nil
	}
	base, err := os.UserConfigDir() // %AppData% su Windows
	if err != nil {
		return "", err
	}
	return filepath.Join(base, "TavolaPeriodica3D"), nil
}

type config struct {
	Repo  string `json:"repo,omitempty"`
	Token string `json:"token,omitempty"` // «<schema>:<base64>»
}

type state struct {
	GameVersion string `json:"gameVersion"`
}

func readJSON(path string, v any) error {
	b, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, v)
}

// writeJSON scrive in modo atomico e con permessi riservati al proprietario.
func writeJSON(path string, v any) error {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, b, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func loadConfig(home string) config {
	var c config
	readJSON(filepath.Join(home, "config.json"), &c)
	return c
}

func saveConfig(home string, c config) error {
	return writeJSON(filepath.Join(home, "config.json"), c)
}

func (c config) savedToken() string {
	scheme, payload, ok := strings.Cut(c.Token, ":")
	if !ok {
		return ""
	}
	raw, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return ""
	}
	if scheme == "dpapi" {
		raw, err = unprotectSecret(raw)
		if err != nil {
			return ""
		}
	} else if scheme != "plain" {
		return ""
	}
	return string(raw)
}

func sealToken(token string) (string, error) {
	raw, err := protectSecret([]byte(token))
	if err != nil {
		return "", err
	}
	return secretScheme + ":" + base64.StdEncoding.EncodeToString(raw), nil
}

func loadState(home string) state {
	var s state
	readJSON(filepath.Join(home, "state.json"), &s)
	return s
}

func saveState(home string, s state) error {
	return writeJSON(filepath.Join(home, "state.json"), s)
}

var errNoToken = errors.New("nessun token")
