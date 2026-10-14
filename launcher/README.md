# Launcher di Tavola Periodica 3D

Piccolo programma (un solo eseguibile di pochi MB, scritto in Go, nessuna dipendenza) che **scarica e aggiorna il gioco**
dalle release di questo repository, che resta **privato**, e poi lo avvia. Sa aggiornare anche **se stesso**.

## Come funziona

```
launcher ──(token in sola lettura)──▶ GitHub Releases (repository privato)
   │  1. controlla se c'è un launcher più nuovo → lo scarica, lo sostituisce e si riavvia
   │  2. controlla se c'è un gioco più nuovo    → lo scarica, lo estrae, sostituisce la versione installata
   └─ 3. avvia il gioco
```

- **Repository privato:** ogni richiesta porta un token GitHub *fine-grained* con permesso **solo lettura**
  (`Contents: Read-only`) limitato a questo unico repository. Senza token GitHub risponde 404 anche se la repo esiste.
- **Integrità:** ogni file scaricato (gioco o launcher) viene confrontato con lo SHA-256 pubblicato nella release
  (`<file>.sha256`). Se manca o non coincide, l'aggiornamento è rifiutato e la versione installata non viene toccata.
- **Aggiornamenti sicuri:** il gioco nuovo viene estratto in una cartella a parte e scambiato con quello vecchio solo a
  estrazione riuscita; in caso di errore resta la versione precedente. Lo zip non può scrivere fuori dalla cartella.
- **Offline:** se GitHub non è raggiungibile e il gioco è già installato, parte la versione presente.
- **Token:** su Windows è cifrato con DPAPI (lo rilegge solo il tuo utente, su questo PC); su Linux è nel file di
  configurazione con permessi `0600`. Non viene mai mostrato né inoltrato ad altri host (il download dei file passa da un
  redirect verso lo storage di GitHub e il token non lo segue).

## Primo uso

1. **Crea il token** (una volta sola, per ogni utente del gioco) su
   <https://github.com/settings/personal-access-tokens/new>: *Repository access* → solo `tavola-periodica-3d`;
   *Permissions* → *Repository* → **Contents: Read-only**. Scegli una scadenza e annotala: alla scadenza il launcher
   chiederà un token nuovo.
2. **Scarica il launcher** dalla pagina *Releases* del repository (tag `launcher-vX.Y.Z`): `tp3d-launcher-windows-amd64.exe`
   (oppure `tp3d-launcher-linux-amd64`). Mettilo in una cartella **tua** e scrivibile (non `Program Files`, altrimenti non può
   aggiornarsi) e crea un collegamento sul desktop.
3. **Avvialo.** Alla prima esecuzione chiede il token, scarica il gioco e lo avvia. Dalla seconda volta controlla gli
   aggiornamenti e parte.

Dati installati in `%AppData%\TavolaPeriodica3D\` (Linux: `~/.config/TavolaPeriodica3D/`): `config.json`, `state.json`,
`game/`. Per cambiare cartella imposta `TP3D_HOME`.

## Opzioni

| Opzione | Effetto |
|---------|---------|
| `--no-update` | non controlla nulla, avvia il gioco installato |
| `--update-only` | aggiorna senza avviare il gioco |
| `--force` | reinstalla il gioco anche se è già all'ultima versione |
| `--reset-token` | dimentica il token salvato e lo richiede |
| `--version` | mostra la versione del launcher |
| `-- <argomenti>` | tutto ciò che segue `--` viene passato al gioco |

La variabile d'ambiente `TP3D_TOKEN` ha la precedenza sul token salvato (utile per script e CI).

## Pubblicare le release (per chi sviluppa)

La pipeline `.github/workflows/release.yml` parte quando si crea un tag:

| Tag | Cosa pubblica |
|-----|---------------|
| `vX.Y.Z` (uguale a `version` in `package.json`) | `TavolaPeriodica3D-<os>-<arch>-X.Y.Z.zip` + `.sha256` per Windows e Linux; le note sono `docs/release-X.Y.Z.md` se esiste |
| `launcher-vX.Y.Z` | `tp3d-launcher-<os>-<arch>[.exe]` + `.sha256` per Windows e Linux |

```bash
git tag v0.8.1 && git push origin v0.8.1                 # nuova versione del gioco
git tag launcher-v1.0.1 && git push origin launcher-v1.0.1   # nuova versione del launcher
```

Il launcher sceglie la release con la versione più alta tra quelle con quel prefisso (le bozze e le pre-release sono
ignorate). Il numero di versione del launcher viene iniettato in compilazione dal tag, quindi non c'è un file da aggiornare.

Il launcher è versionato **separatamente** dal gioco: si può aggiornare l'uno senza rilasciare l'altro.

## Sviluppo

```bash
cd launcher
go vet ./... && go test ./...
go build -ldflags "-X main.version=1.0.0" -o launcher .          # Linux / macOS
GOOS=windows GOARCH=amd64 go build -ldflags "-s -w -X main.version=1.0.0" -o launcher.exe .
```

Una build senza `-X main.version=…` è una build di sviluppo (`dev`) e non si aggiorna da sola. I test usano un finto server
GitHub (`httptest`) e coprono token, confronto delle versioni, checksum manomessi o mancanti, zip malevoli, scambio della
cartella e auto-aggiornamento.

## Limiti noti

- Il token è di sola lettura ma dà accesso al **codice** del repository, non solo alle release: tratta il token come una
  password e dallo ai soli utenti fidati. Si revoca dalle impostazioni di GitHub.
- Ogni aggiornamento del gioco riscarica lo zip completo (Electron incluso, ~100 MB).
- Non sono previste build per macOS; gli eseguibili non sono firmati (SmartScreen può avvisare al primo avvio).
- Se il gioco è aperto mentre il launcher prova ad aggiornarlo, Windows non permette la sostituzione: il launcher lo segnala
  e avvia la versione già installata.
