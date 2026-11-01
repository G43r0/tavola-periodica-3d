# Come contribuire

Grazie dell'interesse per **Tavola Periodica 3D**. Questa pagina dice come preparare il progetto, quali controlli
lanciare prima di aprire una pull request e le regole su test, commit e lingue. Per l'installazione e la struttura del
progetto vedi il [README](README.md).

## Segnalare un problema o proporre un'idea

Apri una issue scegliendo uno dei moduli:

- **Errore dell'app**: qualcosa non funziona o si blocca (servono versione, sistema, scheda grafica e i passi per
  riprodurlo);
- **Errore nei contenuti**: un dato, un nome, una reazione o una ricetta sbagliati (servono dove, che cosa c'è scritto,
  che cosa dovrebbe esserci e la fonte);
- **Proposta**: un'idea per migliorare l'app.

Per una vulnerabilità di sicurezza non aprire una issue pubblica: vedi [SECURITY.md](SECURITY.md).

## Preparare il progetto

Serve Node.js 22 o successivo. Dalla cartella del progetto:

```bash
npm install
npm run dev        # app desktop con ricaricamento automatico
npm run dev:web    # solo l'interfaccia, nel browser
```

Il commit che ha riformattato tutto il codice con Prettier non cambia il comportamento, ma `git blame` lo mostrerebbe
come autore di quasi ogni riga. Per fargli saltare quel commit, una volta sola dopo aver clonato il progetto:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

## Comandi

| Comando                | Che cosa fa                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| `npm test`             | test unitari (`node:test`, file `tests/**/*.test.mjs`)                       |
| `npm run lint`         | ESLint sul codice                                                            |
| `npm run format`       | formatta il codice con Prettier (`npm run format:check` controlla soltanto)  |
| `npm run typecheck`    | controlla i tipi dei commenti JSDoc con TypeScript                           |
| `npm run e2e`          | test end-to-end con Playwright (interfaccia nel browser e app Electron)      |
| `npm run data`         | rigenera i dati degli elementi da `data-sources/`                            |

Prima di aprire una pull request `npm test`, `npm run lint`, `npm run format:check` e `npm run typecheck` devono
passare. I file generati da `npm run data` (come `src/data/elements.json`) non si modificano a mano.

## Test

- Ogni modifica va con il suo test, in `tests/<area>/<nome>.test.mjs`, scritto con `node:test` e `node:assert/strict`.
- Per correggere un errore si scrive prima un test che fallisce per il motivo giusto, poi la correzione che lo fa
  passare.
- Alcuni test controllano i documenti: i numeri del README (`tests/docs/readme.test.mjs`) e le licenze
  (`tests/docs/licenses.test.mjs`). Se cambi un dato che il README cita, o aggiungi una libreria, un suono o una fonte
  di dati, aggiorna anche `README.md` o `THIRD_PARTY_NOTICES.md` e `src/data/third-party.js`.
- I test end-to-end stanno in `tests/e2e/*.spec.mjs` e `npm test` non li raccoglie.

## Commit

- Una riga di sintesi, al presente e senza il punto finale (per esempio «Sandbox: l'acqua non attraversa più il
  vetro»), poi una riga vuota e un testo che spiega **perché** e che cosa cambia per chi usa l'app.
- Un commit per ogni cambiamento che ha senso da solo.
- Se chiude una issue, scrivi `Fixes #123`; se ci lavora soltanto, `Refs #123`.
- Se hai scritto il codice con l'aiuto di un assistente, finisci il messaggio con la riga `Co-Authored-By: Nome
  <indirizzo>`.

## Lingue

- Commenti nel codice, documenti, messaggi di commit, issue e pull request sono in **italiano**; i nomi di funzioni e
  variabili sono in inglese.
- L'interfaccia ha tre lingue: italiano, inglese e «Spiegamelo come se avessi 6 anni» (italiano con parole semplici).
  Ogni testo nuovo ha almeno la versione italiana e quella inglese, con `createT` o `pick` da `src/i18n/index.js`;
  se manca la versione semplice, l'app ripiega sull'italiano.

## Pull request

- Una pull request per ogni cambiamento, verso `main`, con il modulo che si apre da solo: che cosa cambia, la issue,
  come l'hai provato e gli screenshot per ciò che si vede.
- Contribuendo accetti che il tuo lavoro sia distribuito con la licenza MIT del progetto (vedi [LICENSE](LICENSE)).
