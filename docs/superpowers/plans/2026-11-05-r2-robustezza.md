# R2 — Robustezza: piano di implementazione

> **Per chi esegue (agenti):** un compito alla volta, ognuno con il suo test che fallisce prima e passa dopo. I passi
> usano le caselle (`- [ ]`) per il tracciamento.

**Obiettivo:** l'app non si rompe in silenzio e non perde i progressi. Un errore imprevisto apre una finestra che dice
cosa fare; nell'app desktop resta in un registro locale. Un contesto grafico perso si recupera senza riavviare. I
salvataggi hanno un formato documentato, si leggono da ogni versione dalla 0.8, si portano da un PC all'altro con un
file e sopravvivono a un file rovinato. L'app gira da una chiavetta con i progressi accanto.

**Specifica:** [docs/superpowers/specs/2026-10-29-versione-1.0-piano.md](../specs/2026-10-29-versione-1.0-piano.md),
fase R2.

**Fatto quando** (dalla specifica):

- nessun percorso E2E lascia errori in console (già controllato dalla R1: la fixture `consoleErrors` di
  `tests/e2e/fixtures.mjs` fa fallire ogni prova con un `pageerror` o un `console.error`);
- si apre un salvataggio di ogni versione (un file per versione in `tests/fixtures/salvataggi/`);
- un contesto WebGL perso si recupera senza riavviare (un E2E lo provoca con `WEBGL_lose_context`).

## Vincoli globali

- Base: branch della R1 (`claude/r1-fondamenta`, PR #81), che a sua volta parte dalla #80. La PR della R2 va verso
  `main` dopo quelle due.
- Nessuna dipendenza nuova. Il controllo d'integrità dei file di profilo è un CRC-32 scritto a mano (serve a scoprire un
  file troncato o modificato, non a proteggerlo da chi lo falsifica di proposito).
- La logica sta in moduli puri provati con `node --test` (`// @ts-check` quando sono nel perimetro dei tipi): la vista e
  il processo principale di Electron li usano e basta, come `electron/save-file.cjs` e `electron/recover.cjs`.
- Ogni correzione di un bug ha prima un test che fallisce. Il comportamento del gioco non cambia, salvo dove il compito
  lo dice.
- Testi dell'interfaccia in italiano, inglese e «6 anni» (ripiego sull'italiano dove non serve una versione semplice).
- Commit e testi del repository in italiano. Ogni commit termina con `Co-Authored-By: Claude Opus 5.5
  <noreply@anthropic.com>`.

## Da dove partiamo (misurato il 05/11/2026 sul branch della R1)

- **Errori.** Nessun gestore globale: un'eccezione fuori dai `try` dei caricamenti dei moduli finisce solo nella console,
  che nell'app desktop nessuno vede. L'app desktop non scrive registri.
- **Contesto WebGL.** Nessun modulo ascolta `webglcontextlost` / `webglcontextrestored`. Three.js chiama già
  `preventDefault()` e al ripristino ricarica da sé geometrie e texture, ma le mappe d'ambiente generate con
  `PMREMGenerator` (visualizzatore, simulatore, campioni 3D) sono immagini disegnate dalla scheda grafica: dopo il
  ripristino restano nere e i metalli e il vetro perdono i riflessi. La qualità adattiva del visualizzatore conta i
  fotogrammi del contesto perso come lenti e abbassa la grafica.
- **Salvataggi.** Formato 2 (`src/game/save.js`), descritto solo nel commento in testa al modulo. In `localStorage`
  (`tp3d.game`) e, nell'app desktop, in `simulatore-salvataggio.json` con una sola copia `.bak`. Nessun file di prova
  di una versione vecchia; `migrate()` è provata con oggetti scritti a mano. Un salvataggio con la chiave `__proto__`
  dentro `results` passa da `Object.entries` a un'assegnazione che cambia il prototipo dell'oggetto.
- **Chiavetta.** `TP3D_USER_DATA` (R1) sposta già la cartella dei dati, ma solo da una variabile d'ambiente.

## Attenzione in revisione

1. **La finestra d'errore non deve aprirsi per gli errori innocui** (`ResizeObserver loop…`, estensioni del browser,
   `play()` interrotto) né a raffica: una volta, poi il contatore. Test `error-logic: errori da ignorare` e
   `error-logic: stesso errore contato una volta`.
2. **Il registro non deve riempire il disco**: due file da 512 KB al massimo, voci troncate a 8 KB, e al massimo 60
   voci al minuto dal renderer. Test `log-file: non supera 1 MB`.
3. **Un file di profilo importato non deve poter rompere il salvataggio**: si controlla il CRC, la versione e poi passa
   da `migrate()` come ogni salvataggio. Test `profile-file: file rovinati` e la prova a caso del compito 4.
4. **Le tre copie non devono essere tre copie dello stesso minuto**: si spostano solo se la più recente ha più di
   10 minuti. Test `save-file: copie distanziate`.
5. **La cartella `dati/` della chiavetta si usa solo se è scrivibile** (una chiavetta protetta da scrittura, un CD,
   `Program Files`): altrimenti la cartella solita. Test `portable: cartella non scrivibile`.

---

### Compito 0: piano

- Crea: `docs/superpowers/plans/2026-11-05-r2-robustezza.md` (questo file).
- [ ] Commit «R2: piano di implementazione».

### Compito 1: tre copie di sicurezza a rotazione

**File:** modifica `electron/save-file.cjs`; test in `tests/electron/save-file.test.mjs`.

- Le copie sono `simulatore-salvataggio.json.1`, `.2`, `.3` (la `.1` la più recente). A ogni scrittura, se la `.1` non
  c'è o ha più di 10 minuti, si spostano `.2 → .3`, `.1 → .2` e il file di prima diventa `.1`; altrimenti le copie non
  si toccano. Così coprono la sessione in corso e le due prima, non gli ultimi tre secondi.
- La lettura prova il file, poi `.1`, `.2`, `.3` e infine il `.bak` delle versioni 0.9.x: il primo JSON valido.
- Test: file rotto → `.1`; file e `.1` rotti → `.2`; il vecchio `.bak` letto se non c'è altro; scritture ravvicinate
  non spostano le copie; dopo 10 minuti (orologio finto) sì, e la `.3` più vecchia sparisce.

### Compito 2: versione portabile su chiavetta

**File:** crea `electron/portable.cjs`; modifica `electron/main.cjs`; test `tests/electron/portable.test.mjs`;
README, sezione sull'installazione.

- `portableDataDir({ env, execPath, fs })`: la cartella `dati` accanto all'eseguibile. Per l'eseguibile «portable» di
  electron-builder l'eseguibile vero è in `PORTABLE_EXECUTABLE_DIR` (quello che gira è estratto in una cartella
  temporanea). Restituisce la cartella solo se esiste, è una cartella e ci si può scrivere davvero (si crea e cancella
  un file di prova); altrimenti `null`.
- `main.cjs`: `TP3D_USER_DATA` vince (serve agli E2E), poi la cartella della chiavetta, poi quella solita. Prima di
  `ready`, come oggi.
- Con la cartella della chiavetta, salvataggi, registri, impostazioni e la cache di Chromium stanno lì.

### Compito 3: errori — finestra «Qualcosa è andato storto» e registro

**File:** crea `src/ui/error-logic.js` (puro), `src/ui/error-report.js` (DOM), `src/styles/error.css`,
`electron/log-file.cjs`; modifica `src/main.js`, `electron/main.cjs`, `electron/preload.cjs`, `electron/menu.cjs`;
test `tests/ui/error-logic.test.mjs`, `tests/electron/log-file.test.mjs`, `tests/electron/desktop.test.mjs` (menu),
E2E `tests/e2e/errori.spec.mjs`.

- `error-logic.js`:
  - `describeError(value, extra)`: messaggio, nome e pila da un `Error`, da una stringa o da qualunque valore lanciato;
  - `isIgnorable(info)`: `ResizeObserver loop…`, file `chrome-extension://` e `moz-extension://`, «Script error.» senza
    file, `AbortError` e `NotAllowedError` (audio e video interrotti);
  - `createErrorLog({ max: 20 })`: gli errori della sessione, con lo stesso errore contato una volta (`count`);
  - `reportText(entries, about)`: il testo di «Copia i dettagli» (versione, sistema, grafica, lingua, modulo aperto,
    errori con la pila tagliata a 15 righe);
  - `issueUrl(text, about)`: il modulo «Errore dell'app» su GitHub già compilato (versione, sistema, «Dove succede»
    e i dettagli), al massimo 6000 caratteri.
- `error-report.js`: `installErrorReporting()` ascolta `error` e `unhandledrejection`; al primo errore vero apre la
  finestra con «Riprova» (ricarica l'app, come il cambio di lingua: la scheda aperta resta), «Copia i dettagli»,
  «Segnala» e «Chiudi». Errori nuovi a finestra aperta aggiornano il contatore; chiusa, si riapre al più ogni 30 s.
  Nell'app desktop ogni errore va anche nel registro.
- `log-file.cjs`: `createLogFile(dir, { max, now })` scrive righe di testo in `logs/app.log`; oltre metà del limite il
  file diventa `app.1.log` (quello di prima sparisce). Scritture una alla volta. Voci troncate a 8 KB.
- `main.cjs`: `ipcMain.on('app-log:write')` con il limite di 60 voci al minuto; nel registro vanno anche
  `render-process-gone`, `child-process-gone` e gli errori di scrittura del salvataggio. Menu «Aiuto → Apri la cartella
  dei registri».
- E2E: un errore lanciato dalla pagina apre la finestra con il messaggio, «Copia i dettagli» mette il testo negli
  appunti, «Chiudi» la chiude. La fixture degli errori in console accetta gli errori attesi con
  `test.use({ allowedErrors: [/…/] })`.

### Compito 4: contesto WebGL perso e recuperato

**File:** crea `src/gfx/context-loss.js`; modifica `src/viewer/engine.js`, `src/viewer/atom-viewer.js`,
`src/game/game.js`, `src/game/game-view.js`, `src/gfx/specimen.js`; test `tests/gfx/context-loss.test.mjs`, E2E
`tests/e2e/contesto.spec.mjs`.

- `watchContextLoss(canvas, { onLost, onRestored })`: ascolta i due eventi (three.js chiama già `preventDefault()`) e
  dice se il contesto è perso.
- `swapTexture(roots, materials, oldTex, newTex)`: sostituisce una texture in ogni materiale della scena e in quelli
  passati (i materiali del simulatore che non sono ancora nella scena) e in `scene.environment`.
- Visualizzatore: al ripristino rigenera la mappa d'ambiente; mentre il contesto è perso la qualità adattiva si ferma.
- Simulatore: `LabGame.restoreContext()` rigenera la mappa d'ambiente e la sostituisce nei materiali dell'aula e degli
  oggetti; la partita continua (fisica e chimica non dipendono dalla scheda grafica).
- Campioni 3D della scheda: rigenera lo studio; le miniature aspettano il ripristino e rifanno quella persa.
- Un avviso «La grafica si è interrotta: la sto ripristinando…» e poi «Grafica ripristinata».
- E2E: nell'atomo 3D e nel simulatore, `WEBGL_lose_context.loseContext()`, l'avviso, `restoreContext()`, poi il
  contesto è vivo, i fotogrammi riprendono, la mappa d'ambiente è nuova e la console è pulita.

### Compito 5: salvataggi 1.0 — formato, file di ogni versione, salvataggi rovinati

**File:** crea `docs/salvataggi.md`, `tests/fixtures/salvataggi/{0.8.0,0.9.0,0.9.1,0.9.2}.json` e il loro
`LEGGIMI.md`, `scripts/make-save-fixtures.mjs`; modifica `src/game/save.js`; test `tests/game/save-compat.test.mjs`,
`tests/game/save-fuzz.test.mjs`.

- `docs/salvataggi.md`: dove stanno i salvataggi (browser, app desktop, chiavetta), il formato 2 campo per campo, le
  copie, il file di profilo e la promessa: la 1.0 e tutte le 1.x leggono ogni salvataggio dalla 0.8 in poi.
- I file di prova sono veri: `scripts/make-save-fixtures.mjs` estrae con `git archive` il codice di ogni versione e
  gioca una piccola partita con le sue funzioni pure (`migrate`, `recordResult`, `recordChallenge`, `buy`,
  `addProfile`, `recordReaction`), come fa la sua vista. Per la 0.8.0, che non aveva `save.js`, l'oggetto è quello che
  scriveva `game-view.js` di allora.
- `save.js`: `isValidSave(save)` controlla la forma completa; le chiavi `__proto__`, `constructor` e `prototype` si
  scartano (test che fallisce prima).
- Prova a caso (`save-fuzz`): 3000 salvataggi rovinati a partire dai file di prova (chiavi tolte, tipi cambiati, numeri
  enormi o `NaN`, liste troncate, chiavi pericolose, JSON troncato): `migrate()` non lancia mai e il risultato passa
  `isValidSave`. Il generatore è riproducibile (seme fisso).

### Compito 6: esporta e importa un profilo

**File:** crea `src/game/profile-file.js` (puro); modifica `src/game/game-view.js`, `src/game/game-strings.js`,
`src/styles/game.css`; test `tests/game/profile-file.test.mjs`.

- File `tp3d-profilo-<nome>-<data>.json`: `{ format: 'tp3d-profilo', version: 1, app, exported, settings, profile,
  check }`, con `check` = CRC-32 del contenuto in JSON con le chiavi in ordine.
- `parseProfileFile(text)` → `{ ok: true, … }` oppure `{ ok: false, error }` con `json`, `format`, `version` (file di
  un'app più nuova), `check` (file rovinato o modificato), `size` (oltre 2 MB).
- `importProfile(save, file)`: stesso profilo (stesso `id` e stessa data di creazione) → si sostituisce, dopo una
  conferma; altrimenti un profilo nuovo (al massimo 8). Il quaderno e la Carriera passano da `migrate()`.
- Nella schermata dei profili del simulatore: «Esporta» per ogni profilo e «Importa un profilo…».

### Compito 7: memoria e GPU (PR successiva della R2)

- Misurare con tutti i moduli aperti uno dopo l'altro (Playwright, `performance.memory` e `renderer.info`), in
  `docs/prestazioni.md`.
- Un modulo chiuso da qualche minuto, o quando se ne apre un altro pesante, libera scena, fisica e contesto grafico se
  si supera il budget della R4.

### Compito 8: `game.js` in pezzi (PR successiva della R2)

- Presa e posa, versamento, strumenti, calore, incidenti, rifiuti, esercitazione in corso, con la logica pura estratta e
  provata come `apparatus-logic.js` nella G4. Nessun cambiamento di comportamento: lo dimostrano gli E2E e gli
  screenshot della R1.

### Compito 9: impostazioni comuni nel salvataggio (con la R3)

- Lingua, grafica e accessibilità in un record con la versione, passando dal salvataggio. Si fa insieme alla finestra
  «Impostazioni» della R3, che introduce le impostazioni di accessibilità: farlo prima vorrebbe dire migrare due volte.

### Compito 10: verifica finale

- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npx vite build && npm run check:dist`,
  gli E2E web.
- [ ] CHANGELOG, sotto la 1.0.0 non pubblicata. Niente cambio di versione e niente release.
