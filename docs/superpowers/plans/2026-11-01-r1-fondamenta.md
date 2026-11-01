# R1 — Fondamenta: piano di implementazione

> **Per chi esegue (agenti):** SOTTO-SKILL OBBLIGATORIA: superpowers:subagent-driven-development (consigliata) oppure
> superpowers:executing-plans, un compito alla volta. I passi usano le caselle (`- [ ]`) per il tracciamento.

**Obiettivo:** ogni modifica controllata da una macchina (formato, lint, tipi, test unitari ed end-to-end, build
Windows), dipendenze sorvegliate, Electron più chiuso, licenze e documenti di progetto in ordine.

**Architettura:** strumenti standard come `devDependencies` (Prettier, ESLint, TypeScript solo come controllore di JSDoc,
Playwright), configurati nella radice; i ganci di test del renderer passano da un modulo solo (`src/test-hooks.js`),
attivo solo con `vite` o con la build `--mode e2e`; la CI in GitHub Actions ha un job Linux per i controlli e un job
Windows per la build dell'app e l'E2E di Electron.

**Tecnologie:** Node 24 (locale) e 22 (CI, come `release.yml`), Vite 8, Electron 44.10, electron-builder 26.18,
Prettier 3.9.10, ESLint 10.14 con `@eslint/js` 10.0.1 e `globals` 17.14, TypeScript 7.0.2, `@playwright/test` 1.64.1,
Rapier 0.21.0.

**Specifica:** [docs/superpowers/specs/2026-10-29-versione-1.0-piano.md](../specs/2026-10-29-versione-1.0-piano.md), fase R1.

## Vincoli globali

- Base: branch `claude/r1-fondamenta` creato da `claude/qa-testing-debugging-9d79b3` (PR #80, non ancora in `main`).
  La PR della R1 va verso `main` dopo il merge della #80. Fino ad allora mostrerà anche i commit della #80.
- Una PR per tutta la R1, come nella serie G: «ogni fase entra da sola, in una PR, con test e screenshot».
- Build di prova dell'app in CI **solo su Windows** (decisione dell'utente, 01/11/2026). macOS e Linux si decidono nella R9.
- **Prettier con una riformattazione unica** (decisione dell'utente):
  - `printWidth: 120`, `singleQuote: true`, il resto ai valori di Prettier, `endOfLine: 'lf'`;
  - restano fuori i dati, cioè `src/data/`, `src/**/data/` e `data-sources/`, altrimenti +45 000 righe di tabelle;
  - restano fuori anche Markdown e JSON;
  - la riformattazione è un commit a sé, elencato in `.git-blame-ignore-revs`.
- ESLint: solo `@eslint/js` `recommended`, nessuna regola di stile: lo stile lo decide Prettier.
- Tipi: `tsc --noEmit` con `checkJs: false` e `// @ts-check` in testa ai moduli inclusi, allargato un modulo alla volta.
  Si correggono i tipi, non il comportamento. Un errore che è un bug vero richiede prima un test che fallisce.
- Nessuna dipendenza oltre a quelle elencate in «Tecnologie». Per i fusibili si usa `build.electronFuses` di
  electron-builder (usa `@electron/fuses` 1.8.0, già installato), non un pacchetto nuovo.
- Test unitari con `node:test` in `tests/**/*.test.mjs`, come oggi. Gli E2E vanno in `tests/e2e/*.spec.mjs` e
  `npm test` non li raccoglie.
- Testi del repository e dei commit in italiano, come il resto del progetto. Ogni commit termina con
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Fatto quando:
  - una PR con un test rotto, un errore di tipo o una dipendenza vulnerabile resta rossa;
  - `npm audit --omit=dev` è pulito (lo è già il 01/11/2026);
  - in CI, `npm audit --audit-level=high` su tutte le dipendenze è pulito.

## Da dove partiamo (misurato il 01/11/2026 sul branch della #80)

- Già fatto:
  - Electron 44.10;
  - CSP senza `ws://`, e il plugin `dev-csp` lo aggiunge solo con `vite`;
  - permessi negati tranne `pointerLock`, `fullscreen` e `clipboard-sanitized-write` (`electron/security.cjs`);
  - `release.yml` (build Windows a mano).
- Manca tutto il resto. Le misure su una copia del codice:
  - **ESLint `recommended`**: 21 segnalazioni, cioè 10 `no-useless-assignment`, 8 `no-unused-vars`,
    2 `no-control-regex` e 1 `no-irregular-whitespace` (elenco nel compito 3).
  - **tsc sui moduli puri della specifica**: 236 errori, 190 dei quali TS2339, quasi tutti `@param {object}` troppo
    vaghi (`Property 'z' does not exist on type 'object'`):
    - per file: `book.js` 62, `elements-lab.js` 31, `geometry.js` 20, `lewis.js` 13, `simulate.js` 11, `naming.js` 10,
      `mixture.js` 8, `combine.js` 7, `electron-binding.js` 6, `identify.js` 5, `chemistry.js` 4;
    - 2 o meno: `world.js`, `reactions.js`.
  - **Prettier sul codice**, esclusi dati e Markdown: circa 12 700 righe aggiunte in circa 160 file.
  - **`npm audit` con le devDependencies**: 18 avvisi (15 moderati, 3 alti, `undici` e altri) che si risolvono
    con `npm audit fix`.

## Attenzione in revisione

I casi che nessun test dei compiti copre da solo e che farebbero più danni, con il test che li fissa e il compito
che lo contiene:

1. **Renderer che si chiude subito dopo il ricaricamento**: deve ricaricare una volta, non all'infinito. Se si
   richiude entro 30 s, niente più ricaricamenti e un messaggio d'errore. Test `watchRenderer: secondo crash entro
   30 s non ricarica` (compito 5).
2. **La riformattazione non deve cambiare il comportamento.** I file JS e CSS di `dist/assets/` costruiti prima e dopo
   Prettier devono essere identici, byte per byte (compito 2, passo 5).
3. **Gli E2E non devono toccare i dati veri di chi sviluppa.** L'E2E di Electron usa una cartella temporanea
   (`TP3D_USER_DATA`) e controlla che `app.getPath('userData')` sia quella (compito 8). Gli E2E web usano il
   contesto pulito di Playwright.
4. **I ganci di test non devono finire nella build vera.** `scripts/check-dist.mjs` fallisce se `dist/assets/*.js`
   contiene `__tp3d`, `__lab`, `__sandbox` o `__atomViewer`, o se la CSP di `dist/index.html` contiene `ws:`; gira in
   CI dopo `vite build` (compito 6).
5. **Contributori su Windows con `core.autocrlf=true`**: `format:check` non deve fallire per i CRLF della copia di
   lavoro. `.gitattributes` con `eol=lf` e la rinormalizzazione; il job Windows della CI lancia anche
   `npm run format:check` (compiti 2 e 11).

---

### Compito 0: branch e piano

**File:**
- Crea: `docs/superpowers/plans/2026-11-01-r1-fondamenta.md` (questo file)

- [ ] **Passo 1:** `git switch -c claude/r1-fondamenta` dal branch `claude/qa-testing-debugging-9d79b3` pulito.
- [ ] **Passo 2:** commit «R1: piano di implementazione».

### Compito 1: licenze, documenti di progetto, moduli per le issue

**File:**
- Crea: `LICENSE`, `THIRD_PARTY_NOTICES.md`, `CONTRIBUTING.md`, `SECURITY.md`
- Crea: `.github/ISSUE_TEMPLATE/bug.yml`, `contenuti.yml`, `proposta.yml`, `config.yml`
- Crea: `.github/pull_request_template.md`
- Crea: `src/data/third-party.js`
- Modifica: `src/ui/info-dialog.js` (sezione «Licenze»)
- Sposta: `reports/` e `research_notes/` in `docs/ricerca/` con `git mv`, e aggiorna i due collegamenti in
  `docs/superpowers/specs/2026-10-13-simulatore-laboratorio-design.md` e `2026-10-29-versione-1.0-piano.md`
- Test: `tests/docs/licenses.test.mjs`

**Interfacce:**
- Produce: `export const THIRD_PARTY` in `src/data/third-party.js`, una lista di oggetti
  `{ name: string, license: string, url: string, use: { it: string, en: string } }`.

- [ ] **Passo 1: scrivi il test che fallisce** `tests/docs/licenses.test.mjs`, con quattro test.
  - `ogni pacchetto che finisce nell'app è in THIRD_PARTY con la sua licenza`:
    - pacchetti: `three`, `@dimforge/rapier3d-compat`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`,
      `electron`, `electron-updater`;
    - per ognuno, `THIRD_PARTY.find((x) => x.name === p).license` è uguale a `license` di
      `node_modules/<p>/package.json`;
    - per i due `@fontsource` la licenza attesa è `OFL-1.1`.
  - `i suoni CC0 sono tutti citati`: `THIRD_PARTY` ha una voce `Freesound` con licenza `CC0-1.0`, e
    `THIRD_PARTY_NOTICES.md` contiene, per ogni voce di `SOUNDS` (`src/game/audio/sound-list.js`), l'id e il nome
    dell'utente.
  - `THIRD_PARTY_NOTICES.md elenca ogni voce di THIRD_PARTY`: il nome e la licenza di ogni voce compaiono nel file.
  - `LICENSE è MIT come package.json`: il file contiene `MIT License`, e `package.json` ha `license === 'MIT'`.
- [ ] **Passo 2:** `node --test tests/docs/licenses.test.mjs` fallisce: `Cannot find module …/third-party.js`.
- [ ] **Passo 3: scrivi i file.**
  - `THIRD_PARTY` contiene le 6 voci del passo 1, più `Freesound (21 suoni)` con `CC0-1.0` e le fonti dei dati come
    sono citate nella finestra «Fonti dei dati e guida».
  - `THIRD_PARTY_NOTICES.md`: un paragrafo per voce, con la tabella dei suoni (nome, id, utente, titolo).
  - `LICENSE`: MIT, «Copyright (c) 2026 Gabriele Ferrante». **Da confermare con l'utente in revisione.**
  - `info-dialog.js`: una sezione «Licenze» (in inglese «Licenses») che elenca `THIRD_PARTY`, con nome, licenza,
    collegamento e uso.
  - Moduli per le issue (YAML form):
    - `bug.yml`: campi obbligatori versione, sistema, scheda grafica, passi, atteso, ottenuto;
    - `contenuti.yml`: errore nei contenuti, con dove (elemento, sostanza, reazione, ricetta…), cosa c'è scritto,
      cosa dovrebbe esserci e la fonte;
    - `proposta.yml`;
    - `config.yml`: `blank_issues_enabled: false`.
  - PR template: cosa cambia, issue, come è stato provato, screenshot.
  - `CONTRIBUTING.md`: comandi `npm test`, `npm run lint`, `npm run format`, `npm run typecheck`, `npm run e2e`, e le
    regole su test, commit e lingue.
  - `SECURITY.md`: segnalazione privata dalle GitHub Security Advisories, versioni supportate (l'ultima 0.9.x).
- [ ] **Passo 4:** `npm test` è tutto verde.
- [ ] **Passo 5:** commit «R1: licenze, avvisi di terze parti, documenti e moduli per le issue».

### Compito 2: Prettier e riformattazione unica

**File:**
- Crea: `.gitattributes`, `.prettierrc.json`, `.prettierignore`, `.git-blame-ignore-revs`
- Modifica: `package.json` (`prettier` 3.9.10 in `devDependencies`; script `format` e `format:check`)

**Valori:**
- `.gitattributes`:
  ```
  * text=auto eol=lf
  *.png binary
  *.ico binary
  *.ogg binary
  *.woff2 binary
  ```
  più le altre estensioni binarie che `git ls-files --eol` segna `-text`.
- `.prettierrc.json`: `{ "printWidth": 120, "singleQuote": true, "endOfLine": "lf" }`.
- `.prettierignore`: `node_modules/`, `dist/`, `dist-e2e/`, `release/`, `build/`, `test-results/`,
  `playwright-report/`, `src/data/`, `src/**/data/`, `data-sources/`, `*.md`, `*.json`.
- Script:
  - `"format": "prettier --write ."`
  - `"format:check": "prettier --check ."`

- [ ] **Passo 1:** prima di toccare il codice, `npx vite build` e salva gli hash:
  `sha256sum dist/assets/*.js dist/assets/*.css | sort -k2 > <scratchpad>/dist-prima.txt`.
- [ ] **Passo 2:** aggiungi `.gitattributes`, poi `git add --renormalize .`. Controlla che
  `git ls-files --eol | grep -v "i/lf\|-text\|i/none"` sia vuoto. Commit «Fine riga LF nel repository».
- [ ] **Passo 3:** `npm i -D prettier@3.9.10`, i file di configurazione e gli script. `npm run format:check`
  fallisce e elenca circa 160 file.
- [ ] **Passo 4:** `npm run format`, poi `npm run format:check` passa.
- [ ] **Passo 5 (attenzione 2):** `npx vite build`, rifai gli hash in `dist-dopo.txt`. Il comando
  `diff dist-prima.txt dist-dopo.txt` non deve stampare niente: i bundle sono identici byte per byte.
  - Se un file differisce, trova l'origine (un template o una stringa toccata dalla riformattazione) e sistemala
    prima di andare avanti.
  - Se cambia solo un nome di chunk per un hash del contenuto, confronta il contenuto, non il nome.
- [ ] **Passo 6:** `npm test` è tutto verde.
- [ ] **Passo 7:** due commit.
  - «Prettier: configurazione» con la configurazione, gli script e il lockfile.
  - «Prettier: riformattazione unica» con i soli file riformattati.
  - Poi `.git-blame-ignore-revs` con lo SHA del secondo commit e il commento `# Prettier: riformattazione unica`, in un
    terzo commit. Il CONTRIBUTING dice di usare `git config blame.ignoreRevsFile .git-blame-ignore-revs`.

### Compito 3: ESLint

**File:**
- Crea: `eslint.config.js`
- Modifica: `package.json` (`eslint` 10.14.0, `@eslint/js` 10.0.1, `globals` 17.14.0; script `"lint": "eslint ."`)
- Modifica: i file delle 21 segnalazioni (elenco sotto)

**Configurazione** (flat config):
- `ignores`: le stesse cartelle generate di `.prettierignore` (`dist/`, `dist-e2e/`, `release/`, `build/`,
  `test-results/`, `playwright-report/`, `node_modules/`).
- `js.configs.recommended`.
- File `**/*.js` e `**/*.mjs`:
  - `sourceType: 'module'`, `ecmaVersion: 'latest'`;
  - globali: `globals.browser`, più `__APP_VERSION__: 'readonly'` e `__RELEASES_URL__: 'readonly'`.
- `scripts/**`, `tests/**`, `data-sources/**` e `vite.config.js`: anche `globals.node`.
- `**/*.cjs`: `sourceType: 'commonjs'` e `globals.node`.

**Le 21 segnalazioni da sistemare.** Per ogni variabile inutilizzata, prima di toglierla controlla che non sia un
bug: un valore calcolato e mai usato può essere una funzione che non fa quello che dice. Se lo è, scrivi prima un
test che fallisce.
- `src/game/game.js:19` `FLAME_SALTS` mai usato. Controlla che il saggio alla fiamma usi i colori da un'altra parte;
  se no, è un bug.
- `src/game/game.js:2726` `it`; `src/game/mixture.js:452` `mol`; `src/lab/chem/geometry.js:247` `singles`;
  `src/lab/molecule-panel.js:364` `i`; `src/ui/sparks.js:207` `table`; `tests/game/physics.test.mjs:9` `Mixture`
  e `:14` `ctx`.
- `no-useless-assignment`:
  - `src/game/book-view.js:33` `h`; `src/game/game-view.js:400` `note`;
  - `src/lab/chem/lewis.js:56`, `:59` e `:98` `R`;
  - `src/lab/lab-view.js:532` `ok`; `src/lab/reaction-panel.js:237` `body`; `src/sandbox/chemistry.js:80` `dH`;
  - `src/ui/periodic-table.js:293` `target`; `tests/lab/smiles-writer.test.mjs:34` `back`.
- `no-control-regex`:
  - `src/game/save.js:26`: la pulizia dei caratteri di controllo è voluta, quindi
    `// eslint-disable-next-line no-control-regex` con il motivo;
  - `src/i18n/data/reactions-en.js:341`: controlla se `\x00` è un segnaposto voluto; se sì, stesso commento.
- `no-irregular-whitespace` `src/lab/chem/formula.js:56`: sostituisci lo spazio speciale letterale con il suo escape
  `\u…`, senza cambiare il comportamento.

I numeri di riga sono quelli prima della riformattazione. Dopo il compito 2 rifai l'elenco con `npm run lint`.

- [ ] **Passo 1:** installa e configura. `npm run lint` fallisce con 21 problemi.
- [ ] **Passo 2:** sistema le segnalazioni, con un test che fallisce prima di ogni bug vero. `npm run lint` esce con 0.
- [ ] **Passo 3:** `npm test` è tutto verde.
- [ ] **Passo 4:** commit «ESLint (regole di correttezza) e le 21 segnalazioni».

### Compito 4: controllo dei tipi sui moduli puri

**File:**
- Crea: `tsconfig.json`, `src/types.d.ts`
- Modifica: `package.json` (`typescript` 7.0.2; script `"typecheck": "tsc -p tsconfig.json"`)
- Modifica: i moduli dell'elenco, con `// @ts-check` sulla prima riga e i tipi JSDoc
- Test: `tests/docs/typecheck.test.mjs`

**Valori:**
- `tsconfig.json` `compilerOptions`:
  - `allowJs: true`, `checkJs: false`, `noEmit: true`, `strict: false`;
  - `target: "es2023"`, `module: "esnext"`, `moduleResolution: "bundler"`, `lib: ["es2023", "dom"]`;
  - `resolveJsonModule: true`, `skipLibCheck: true`;
  - `include: ["src/**/*.js", "src/types.d.ts"]`.
- Moduli controllati (l'elenco `CHECKED` del test):
  - `src/chem/*.js` (7 file);
  - `src/lab/chem/*.js` (tutti i file della cartella);
  - `src/sandbox/world.js`, `src/sandbox/chemistry.js`;
  - `src/game/mixture.js`, `career.js`, `save.js`, `book.js`.
- `src/types.d.ts` dichiara le forme condivise, che i moduli usano con `@param {import('../types').Element} el` e
  simili:
  - `Element`, la voce di `src/data/elements.json` con i campi letti dai moduli: `z`, `symbol`, `block`,
    `category`, `atomicMass`, `ionizationEnergyEv`, `electronAffinityEv`, `estimated`…;
  - `LabElement` (`createLabElements`), `Molecule` (`src/lab/data/molecules.js`), `Reaction`, `Graph`
    (`{ atoms, bonds }`), `Mixture`, `Exercise`, `Snapshot`.

- [ ] **Passo 1: scrivi il test che fallisce** `tests/docs/typecheck.test.mjs`.
  - `i moduli controllati iniziano con // @ts-check`: per ogni file di `CHECKED`, la prima riga è `// @ts-check`.
    Così un modulo non esce in silenzio dal controllo.
- [ ] **Passo 2:** il test fallisce, perché nessun file ha ancora `// @ts-check`.
- [ ] **Passo 3:** un modulo alla volta, dal più piccolo:
  - aggiungi `// @ts-check` e lancia `npm run typecheck`;
  - correggi i tipi JSDoc finché il modulo non ha più errori;
  - poi `npm test`.
  - Un errore che rivela un bug, come `el.Z` al posto di `el.z`, si corregge solo dopo un test che lo mostra.
  - `// @ts-expect-error` è ammesso solo con il motivo sulla stessa riga, e al massimo 5 in tutta la R1.
- [ ] **Passo 4:** `npm run typecheck` esce con 0, e il test del passo 1 e `npm test` sono verdi.
- [ ] **Passo 5:** commit «Controllo dei tipi (tsc --checkJs) sui moduli puri», o un commit per gruppo di moduli se
  il diff è grande.

### Compito 5: Electron più chiuso

**File:**
- Modifica: `package.json`, con `build.electronFuses`:
  - `runAsNode: false`;
  - `enableNodeOptionsEnvironmentVariable: false`;
  - `enableNodeCliInspectArguments: false`;
  - `enableEmbeddedAsarIntegrityValidation: true`;
  - `onlyLoadAppFromAsar: true`.
- Modifica: `electron/security.cjs`:
  - `lockWebContents(contents)` blocca `will-attach-webview` con `event.preventDefault()`;
  - `webviewTag: false` esplicito nelle `webPreferences` di `main.cjs`.
- Crea: `electron/recover.cjs`, il renderer che si chiude (`render-process-gone`).
- Modifica: `electron/main.cjs`:
  - collega `watchRenderer` e `lockWebContents`;
  - `TP3D_USER_DATA`: se la variabile c'è, `app.setPath('userData', process.env.TP3D_USER_DATA)` prima di `ready`.
    Serve all'E2E del compito 8 ed è la base per la chiavetta della R2.
- Modifica: `electron/preload.cjs`: `desktop.onRecovered(fn)` (canale `app:recovered`).
- Modifica: `src/main.js`: con `desktop.onRecovered`, un avviso «L'app si era chiusa per un errore ed è stata
  ricaricata» (in inglese «The app closed because of an error and was reloaded»).
- Modifica: `index.html`, CSP più `object-src 'none'; base-uri 'none'`.
- Test: `tests/electron/desktop.test.mjs` (esteso)

**Interfacce:**
- Produce: `watchRenderer(win, { now = Date.now, onGiveUp })` in `electron/recover.cjs`, che restituisce
  `{ handle(details) }`:
  - `handle` è il gestore di `win.webContents.on('render-process-gone', (_e, d) => …)`;
  - con `d.reason === 'clean-exit'` non fa nulla;
  - altrimenti, se l'ultimo ricaricamento è di più di 30 000 ms fa, chiama `win.webContents.reload()` e, a
    `did-finish-load`, `win.webContents.send('app:recovered')`;
  - se no, chiama `onGiveUp(d)`, cioè `dialog.showErrorBox` in `main.cjs`.
- Produce: `lockWebContents(contents)` in `electron/security.cjs`.

- [ ] **Passo 1: scrivi i test che falliscono**, in `tests/electron/desktop.test.mjs`, con finti `win` e `webContents`.
  - `watchRenderer: un crash ricarica e avvisa`: un `handle({ reason: 'crashed' })` porta a `reload` chiamato una
    volta e a `send('app:recovered')` dopo `did-finish-load`.
  - `watchRenderer: secondo crash entro 30 s non ricarica` (attenzione 1):
    - due `handle` con `now` a 0 e 10 000 portano a una sola `reload` e a `onGiveUp` chiamato una volta;
    - con `now` a 0 e 31 000 le `reload` sono due.
  - `watchRenderer: clean-exit non fa nulla`.
  - `lockWebContents blocca le webview`: il finto evento `will-attach-webview` riceve `preventDefault`.
  - `fusibili nella configurazione di electron-builder`: `pkg.build.electronFuses` ha esattamente i cinque valori sopra.
  - `CSP: object-src e base-uri none`: la CSP di `index.html` contiene `object-src 'none'` e `base-uri 'none'`.
- [ ] **Passo 2:** i test falliscono, per i moduli e le chiavi che mancano.
- [ ] **Passo 3:** implementa.
- [ ] **Passo 4:** `npm test` è verde. Poi `npx vite build && npx electron-builder --win --dir --publish never` e
  `npx @electron/fuses read --app "release/win-unpacked/Tavola Periodica 3D.exe"`: deve mostrare i cinque fusibili
  come sopra.
- [ ] **Passo 5:** commit «Electron: fusibili, niente webview, CSP più stretta, ricarica dopo un crash».

### Compito 6: E2E della versione web (tavola, atomo 3D, laboratorio, sandbox)

**File:**
- Crea: `playwright.config.mjs`, `tests/e2e/fixtures.mjs`
- Crea: `tests/e2e/tavola.spec.mjs`, `atomo.spec.mjs`, `laboratorio.spec.mjs`, `sandbox.spec.mjs`
- Crea: `src/test-hooks.js`, `scripts/check-dist.mjs`
- Modifica: `src/lab/lab-view.js:2197`, `src/sandbox/sandbox-view.js:1161`, `src/viewer/atom-viewer.js:868`. Usano
  `exposeForTests` al posto di `if (import.meta.env.DEV) window.__x = …`.
- Modifica: `package.json`:
  - `@playwright/test` 1.64.1;
  - `"build:e2e": "vite build --mode e2e --outDir dist-e2e"`;
  - `"e2e": "playwright test"`;
  - `"check:dist": "node scripts/check-dist.mjs"`.
- Modifica: `.gitignore`, con `dist-e2e/`, `test-results/` e `playwright-report/`.

**Interfacce:**
- Produce: `export const TEST_HOOKS = import.meta.env.DEV || import.meta.env.MODE === 'e2e'` e
  `export function exposeForTests(name, value)` in `src/test-hooks.js`. Mette `window[name] = value` solo se
  `TEST_HOOKS`.
- Produce: in `tests/e2e/fixtures.mjs`, `test` esteso con un controllo automatico.
  - Raccoglie `pageerror` e i `console` di tipo `error`.
  - A fine test fallisce se ce n'è almeno uno, con il testo nell'errore.
  - Gli avvisi (`warning`) non contano: per esempio il «deprecated parameters» di Rapier.
  - Esporta anche `openModule(page, name)` per i cinque moduli.
- `playwright.config.mjs`:
  - `testDir: 'tests/e2e'`, `testMatch: '*.spec.mjs'`;
  - `webServer`: `npm run build:e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort`, con
    `url: http://127.0.0.1:4173`;
  - progetto `web`:
    - `use: { browserName: 'chromium', channel: process.env.PW_CHANNEL, viewport: { width: 1366, height: 768 } }`;
    - `launchOptions.args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']`, cioè il rendering
      software come nelle misure della specifica;
    - in locale `PW_CHANNEL=chrome` usa il Chrome installato, senza scaricare Chromium;
  - il progetto `electron` arriva nel compito 8;
  - `retries: process.env.CI ? 1 : 0`, `timeout: 60_000`.

- [ ] **Passo 1: scrivi gli E2E**. Ogni spec usa la fixture e i percorsi sono quelli della specifica.
  - `tavola.spec.mjs` `ricerca, scheda, frecce, filtri, Spiega`:
    - scrivi `ferro` nella ricerca e premi Invio: la scheda mostra `Fe` e `26`;
    - freccia destra: la scheda mostra `Co`;
    - il filtro «Gas nobili» lascia evidenziati i 7 elementi del gruppo 18 (He, Ne, Ar, Kr, Xe, Rn, Og);
    - modalità Spiega, poi clic su una parola del glossario nella scheda: si apre la sua spiegazione.
  - `atomo.spec.mjs` `Bohr, quantistico, isotopo, nucleo, particella`:
    - apri l'atomo 3D del carbonio e passa da Bohr a quantistico e ritorno;
    - scegli l'isotopo ¹⁴C: l'etichetta dell'isotopo cambia;
    - «Esplodi il nucleo»;
    - seleziona un protone: il pannello di analisi mostra «protone»;
    - `window.__atomViewer.state` conferma ogni passaggio.
  - `laboratorio.spec.mjs` `formula, Combina, reazione avviata e annullata`:
    - scrivi `H2SO4` nella formula: il banco ha 7 atomi e la scheda dice «Acido solforico»;
    - Svuota, poi 2 H e 1 O e Combina: la scheda dice «Acqua»;
    - apri dal catalogo una reazione, avviala e annullala: il banco torna ai reagenti;
    - `window.__lab` conferma lo stato.
  - `sandbox.spec.mjs` `esempio termite, registro, annulla e ripeti`:
    - carica l'esempio `termite` e lascia scorrere 10 s;
    - il registro delle reazioni contiene la reazione della termite;
    - Annulla: la griglia torna come prima dell'esempio;
    - Ripeti: torna l'esempio.
  - Si aspetta sempre una condizione (`expect.poll`, `waitForFunction`), mai una `waitForTimeout` fissa, tranne i
    10 s della sandbox chiesti dalla specifica.
- [ ] **Passo 2:** `PW_CHANNEL=chrome npm run e2e -- --project=web` fallisce: nella build `e2e` i ganci
  `window.__lab`, `__sandbox` e `__atomViewer` sono `undefined`.
- [ ] **Passo 3:** `src/test-hooks.js` e i tre punti di chiamata.
- [ ] **Passo 4: `scripts/check-dist.mjs`** (attenzione 4).
  - Legge `dist/assets/*.js` ed esce con 1 se trova `__tp3d`, `__lab`, `__sandbox` o `__atomViewer`.
  - Esce con 1 anche se il `content` della CSP in `dist/index.html` contiene `ws:`.
  - Verifica: `npx vite build && npm run check:dist` esce con 0. Poi, per prova, con un `window.__lab` messo a mano
    nel bundle esce con 1.
- [ ] **Passo 5:** `PW_CHANNEL=chrome npm run e2e -- --project=web` è verde, ripetuto 3 volte di fila senza fallimenti.
- [ ] **Passo 6:** commit «E2E con Playwright: tavola, atomo 3D, laboratorio, sandbox».

### Compito 7: E2E del simulatore

**File:**
- Modifica: `src/game/game-view.js`, con `exposeForTests('__tp3d', …)`
- Crea: `tests/e2e/simulatore.spec.mjs`

**Interfacce:**
- Consuma: `exposeForTests` (compito 6); `runSolution`, `EXERCISE_BY_ID` e `PASS_STARS` da `src/game/career.js`;
  `game.startExercise`, `game.spawn`, `game.ringBell`, `game.finishReport` e `game.prepareRecipe` (`src/game/game.js`).
- Produce: `window.__tp3d`, con le proprietà
  `{ game, startFree(), startExercise(id), prepareRecipe(recipe), pause(), deliverSolution(), lastResult }`.
  - `deliverSolution()`:
    - calcola `runSolution(game.chem, game.order.ex, game.chemMode)`;
    - mette il contenitore consegnato dalla soluzione sul vassoio, con `spawn` alla posizione di `fx.tray.zone`;
    - copia `ev`, `rx`, `gas` e `phRead` dello stato della soluzione nell'ordine in corso;
    - chiama `ringBell()`, poi `finishReport` con le risposte giuste;
    - risolve con il `result` emesso.
  - `lastResult` è l'ultimo `result` emesso.
  - Il puntatore bloccato non si comanda da un test, quindi il gioco si guida da qui.

- [ ] **Passo 1: scrivi l'E2E** `simulatore.spec.mjs`.
  - `laboratorio libero: Prepara sul banco e 20 s di gioco`:
    - apri il simulatore e scegli Laboratorio libero;
    - `prepareRecipe` con la prima ricetta verificata del libro: gli oggetti attesi sono sul banco;
    - 20 s di gioco senza errori in console.
  - `Carriera: measure50 consegnata con la soluzione dei dati`:
    - `startExercise('measure50')`, poi `deliverSolution()`;
    - `result.stars >= PASS_STARS`.
  - `pausa, libro, quaderno, uscita`:
    - Esc apre la pausa;
    - il libro si apre e si chiude, il quaderno si apre e si chiude;
    - «Esci» torna alla tavola.
- [ ] **Passo 2:** l'E2E fallisce perché `window.__tp3d` è `undefined`.
- [ ] **Passo 3:** implementa il gancio.
- [ ] **Passo 4:** `PW_CHANNEL=chrome npm run e2e -- --project=web` è verde 3 volte di fila.
- [ ] **Passo 5:** commit «E2E del simulatore con il gancio di test».

### Compito 8: E2E dell'app Electron

**File:**
- Crea: `tests/e2e/electron.spec.mjs`
- Modifica: `playwright.config.mjs`. Il progetto `electron` ha `testMatch: 'electron.spec.mjs'` e niente `webServer`:
  usa `dist/`, costruita prima con `npx vite build`.

**Interfacce:**
- Consuma: `TP3D_USER_DATA` (compito 5); `window.desktop` (`electron/preload.cjs`).

- [ ] **Passo 1: scrivi l'E2E**.
  - `_electron.launch({ args: ['.'], env: { ...process.env, TP3D_USER_DATA: tmp } })`, con `tmp` creato da
    `fs.mkdtempSync`.
  - `userData è la cartella temporanea` (attenzione 3):
    `await app.evaluate(({ app }) => app.getPath('userData'))` è uguale a `tmp`.
  - `preload`: `typeof window.desktop.gameSave.read` è `'function'`, e `window.desktop.platform` è uguale a
    `process.platform`.
  - `salvataggio su file`:
    - `desktop.gameSave.write('{"v":1}')`, poi `read()` restituisce `'{"v":1}'`;
    - il file `simulatore-salvataggio.json` esiste in `tmp`.
  - `menu nella lingua scelta`: dopo il passaggio all'inglese dalla barra, le etichette di
    `Menu.getApplicationMenu()` contengono `Help` e non `Aiuto`.
  - In chiusura, `app.close()` e `fs.rmSync(tmp, { recursive: true })`.
- [ ] **Passo 2:** l'E2E fallisce. Se il binario di Electron manca nella copia locale, va prima
  `node node_modules/electron/install.js`.
- [ ] **Passo 3:** sistema finché è verde. Niente fusibili qui: `electron .` non è impacchettato, e Playwright ha
  bisogno di `--inspect`, che i fusibili spengono solo nell'app impacchettata.
- [ ] **Passo 4:** commit «E2E dell'app Electron: preload, salvataggio, menu».

### Compito 9: screenshot di controllo nei tre preset

**File:**
- Crea: `tests/e2e/screens.spec.mjs`

- [ ] **Passo 1:** per ogni preset di `PRESETS` (`src/gfx/preset.js`: `simple`, `medium` e `pro`, che vanno in
  `localStorage['tp3d.gfx']` prima del caricamento con `addInitScript`), fai uno screenshot di cinque inquadrature:
  tavola con la scheda del ferro, atomo 3D del carbonio, laboratorio con H₂SO₄, sandbox con l'esempio `termite`
  dopo 5 s, simulatore in Laboratorio libero.
  - I file vanno in `test-results/screens/<preset>-<vista>.png`.
  - Il test controlla solo che i 15 file esistano e pesino più di 10 kB, cioè che non siano neri o vuoti. Nessun
    confronto con un'immagine di riferimento: la specifica dice che all'inizio si allegano senza bloccare la PR.
- [ ] **Passo 2:** `PW_CHANNEL=chrome npm run e2e -- screens.spec.mjs` è verde; apri a mano 3 delle immagini e
  controlla che non siano nere.
- [ ] **Passo 3:** commit «Screenshot di controllo nei tre preset».

### Compito 10: dipendenze

**File:**
- Crea: `.github/dependabot.yml`
- Modifica: `package.json`, `package-lock.json`

- [ ] **Passo 1:** `npm audit fix`, senza `--force`. Poi `npm audit` riporta 0 vulnerabilità alte. Le moderate
  rimaste vanno elencate nel messaggio di commit con il motivo.
- [ ] **Passo 2: `dependabot.yml`**:
  - `version: 2`;
  - `npm` e `github-actions` ogni settimana, il lunedì;
  - per npm, `groups` `devtools` (prettier, eslint, typescript, @playwright/test) e `runtime` (tutto il resto);
  - `open-pull-requests-limit: 5`.
- [ ] **Passo 3:** Rapier da `^0.19.3` a `^0.21.0`, solo con gli E2E del compito 7 verdi.
  - Leggi il changelog di `@dimforge/rapier3d-compat` dalla 0.19 alla 0.21 e adatta le chiamate cambiate.
  - Poi `npm test` e `npm run e2e -- --project=web` verdi.
  - Annota se l'avviso «deprecated parameters» all'avvio c'è ancora.
- [ ] **Passo 4:** commit «Dipendenze: npm audit fix, Dependabot, Rapier 0.21».

### Compito 11: integrazione continua

**File:**
- Crea: `.github/workflows/ci.yml`
- Modifica: `CONTRIBUTING.md`, con cosa controlla la CI

**Struttura di `ci.yml`:**
- Si avvia con `on: { pull_request: {}, push: { branches: [main] } }`.
- `concurrency`: per ref, con `cancel-in-progress: true`.
- `permissions: contents: read`.
- Job `check`, su `ubuntu-latest`, Node 22 con la cache npm. I passi:
  - `npm ci`;
  - `npm run format:check`;
  - `npm run lint`;
  - `npm run typecheck`;
  - `npm test`;
  - `npm audit --audit-level=high`. Questo controlla tutte le dipendenze, non solo quelle con `--omit=dev`:
    Electron, three e Rapier sono `devDependencies`, e un avviso alto di Electron come
    GHSA-jr5w-w6x2-84p9 deve bloccare;
  - `npx vite build`;
  - `npm run check:dist`;
  - `npx playwright install --with-deps chromium`;
  - `npm run e2e -- --project=web`.
  - Sempre, anche se fallisce: `actions/upload-artifact@v4` con `test-results/screens/` (nome `screenshot`) e
    `playwright-report/` (nome `e2e-report`).
- Job `windows`, su `windows-latest`, Node 22. I passi:
  - `npm ci`;
  - `npm run format:check` (attenzione 5);
  - `npx vite build`;
  - `npx electron-builder --win --dir --publish never`;
  - `npx @electron/fuses read --app "release/win-unpacked/Tavola Periodica 3D.exe"`;
  - `npm run e2e -- --project=electron`.

- [ ] **Passo 1:** scrivi `ci.yml`. Controllalo con `npx --yes actionlint` se è disponibile; altrimenti basta che
  GitHub lo accetti.
- [ ] **Passo 2:** commit «CI: controlli, test, E2E e build Windows a ogni PR».

### Compito 12: verifica finale e PR

- [ ] **Passo 1:** in locale, tutti verdi:
  - `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`;
  - `npx vite build`, poi `npm run check:dist`;
  - `PW_CHANNEL=chrome npm run e2e`.
- [ ] **Passo 2:** CHANGELOG, voce «R1» sotto la 1.0.0 non pubblicata. Niente cambio di versione e niente release.
- [ ] **Passo 3:** push di `claude/r1-fondamenta`. PR verso `main` con, nella descrizione:
  - che dipende dalla #80;
  - le misure di «Da dove partiamo»;
  - cosa resta fuori.
  - Poi `mcp__ccd_pr__get_status` e i controlli della CI.
- [ ] **Passo 4:** la CI della PR è verde, in entrambi i job.
- [ ] **Passo 5:** la prova «resta rossa» della specifica, **solo con il permesso dell'utente**.
  - Su un branch di prova, una PR in bozza con tre commit separati: un `assert` rotto, un errore di tipo in un modulo
    `// @ts-check`, ed Electron riportato alla 44.7.0, che ha l'avviso alto GHSA-jr5w-w6x2-84p9.
  - Si guarda che la CI diventi rossa ogni volta.
  - Poi si chiudono la PR e il branch.
