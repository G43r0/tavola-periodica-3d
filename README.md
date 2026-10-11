# Tavola Periodica 3D

Applicazione desktop (Electron + Three.js) con la tavola periodica interattiva dei 118 elementi,
schede informative in italiano e modelli 3D degli atomi esplorabili fino alle singole particelle
(protoni, neutroni, elettroni e quark), più un **laboratorio molecolare** in cui si collegano gli atomi per formare
molecole e composti. Funziona **completamente offline**: dati, font e codice sono inclusi nell'app.

**Versione web** — la stessa app si apre anche in una scheda di Chrome, senza installare nulla:
<https://g43r0.github.io/tavola-periodica-3d/> (pubblicata da GitHub Pages a ogni push su `main`, vedi
[Versione web](#versione-web-chrome-github-pages)).

| Fase | Contenuto | Stato |
|------|-----------|-------|
| 1 | Tavola periodica, ricerca, filtri, scheda dell'elemento | ✅ completata |
| 2 | Visualizzatore 3D dell'atomo (Bohr e orbitali, nucleo, isotopi) | ✅ completata |
| 3 | Analisi delle singole particelle (protoni, neutroni, elettroni, quark) | ✅ completata |
| 4 | Laboratorio molecolare: costruzione di molecole (3D + Lewis, Combina/Separa, libreria) | ✅ completata |
| 5 | Laboratorio: reazioni (animazione, bilanciamento, energia di reazione) | ✅ completata |

---

## 1. Requisiti

- **Node.js 22 o successivo** (consigliato l'LTS più recente) — <https://nodejs.org>
- **npm** (incluso in Node.js)
- Windows 10/11 per generare il `.exe` (macOS e Linux sono supportati per sviluppo e build native)

Verifica:

```bash
node -v
npm -v
```

## 2. Installazione delle dipendenze

Dalla cartella del progetto:

```bash
npm install
```

Installa Electron, Vite, electron-builder, Three.js e i font IBM Plex (inclusi nell'app, nessun download a runtime).

## 3. Avvio in sviluppo

```bash
npm run dev
```

Avvia il server Vite (`http://127.0.0.1:5173`) e apre la finestra Electron con ricaricamento automatico
delle modifiche. Per lavorare solo sull'interfaccia nel browser:

```bash
npm run dev:web
```

Per provare la versione di produzione senza creare l'installer:

```bash
npm start
```

## 4. Generare l'eseguibile

### Windows (.exe)

```bash
npm run dist
```

Nella cartella `release/` trovi:

- `Tavola Periodica 3D Setup <versione>.exe` — installer (permette di scegliere la cartella di installazione)
- `TavolaPeriodica3D-portable-<versione>.exe` — versione portabile, si avvia senza installazione
- `win-unpacked/` — l'app non impacchettata (utile per test)

La prima build scarica una volta i binari di Electron e NSIS (serve Internet solo in questa fase).

### macOS / Linux (opzionale)

```bash
npm run dist:mac
```

```bash
npm run dist:linux
```

Vanno eseguiti sul rispettivo sistema operativo (producono `.dmg` e `.AppImage`).

### Problemi comuni

- **`EPERM: operation not permitted, rename ... win-unpacked.tmp`** — un antivirus o un altro processo
  sta bloccando i file appena estratti. Chiudi eventuali istanze dell'app, attendi qualche secondo e rilancia
  `npm run dist`; se persiste, aggiungi la cartella del progetto alle esclusioni dell'antivirus.
- **Avviso SmartScreen all'avvio dell'exe** — l'eseguibile non è firmato digitalmente: scegli
  «Ulteriori informazioni → Esegui comunque». Per la distribuzione pubblica serve un certificato di firma del codice.

### Versione web (Chrome, GitHub Pages)

L'interfaccia non dipende da Electron: la build di Vite (`dist/`) funziona così com'è in Chrome, Edge e negli altri
browser basati su Chromium (serve WebGL 2 per il visualizzatore 3D e il laboratorio). Il workflow
`.github/workflows/pages.yml` la pubblica su GitHub Pages a ogni push su `main`, dopo aver eseguito i test:

**<https://g43r0.github.io/tavola-periodica-3d/>**

Attivazione (una sola volta): nel repository su GitHub apri **Settings → Pages** e in «Build and deployment»
scegli **Source: GitHub Actions**. Al push successivo su `main` (oppure da **Actions → Versione web (GitHub Pages)
→ Run workflow**) il sito viene pubblicato; l'indirizzo compare anche nella pagina **Settings → Pages**.

- GitHub Pages per i repository **privati** richiede un piano GitHub Pro (o Team/Enterprise); con il piano gratuito
  il repository deve essere pubblico. In ogni caso il sito pubblicato è visibile a chiunque ne conosca l'indirizzo.
- Tutto (dati, font, Three.js) è servito dallo stesso sito: nessuna richiesta a server esterni.

Per provare in locale la versione web di produzione:

```bash
npm run preview
```

e apri `http://127.0.0.1:4173` in Chrome.

## 5. Dati scientifici

Il file `src/data/elements.json` è **generato** da `scripts/build-data.mjs` a partire da:

| Sorgente | Contenuto |
|----------|-----------|
| `data-sources/pubchem-periodictable.json` | PubChem (NCBI): punti di fusione/ebollizione, densità, elettronegatività (Pauling), raggi di van der Waals, affinità elettronica |
| `data-sources/curated/*.mjs` | Nomi italiani, pesi atomici standard IUPAC/CIAAW, isotopi (abbondanze IUPAC, emivite NUBASE), raggi covalenti (Cordero 2008), stati di ossidazione, storia, origine del nome, usi, presenza in natura, correzioni NIST/CRC dove PubChem è impreciso |
| `src/chem/electron-config.js` | Configurazioni elettroniche (regola di Madelung + eccezioni NIST) ed elettroni per guscio |
| `data-sources/xray-data-booklet/` | X-ray Data Booklet (LBNL), tab. 1-1: energie di legame degli elettroni interni, Z = 1–92 (→ `src/data/binding-energies.json`) |
| `src/chem/particles.js`, `nuclear.js` | Costanti CODATA 2022 e PDG 2024 (masse, cariche, quark, vita media del neutrone); energie di legame nucleari AME2020 per A ≤ 22 |

Dopo aver modificato un file in `data-sources/`, rigenera i JSON (`elements.json` e `binding-energies.json`):

```bash
npm run data
```

Lo script valida i dati (118 elementi, campi obbligatori, un solo isotopo principale, somma delle
abbondanze, elettroni per guscio) e si interrompe in caso di errori.

Convenzioni principali:

- **Massa atomica** tra parentesi quadre (es. `[98]`) = numero di massa dell'isotopo più longevo, per gli elementi senza isotopi stabili.
- **Neutroni** riferiti all'isotopo più abbondante o, per gli elementi radioattivi, al più stabile (es. Og-294 → 176 neutroni).
- **Elementi con dati stimati o previsti** (At, Fr, Fm–Lr; tutti gli elementi da Z = 104) sono segnalati nella scheda
  con un avviso e con le etichette «stima»/«previsto»; nella tavola gli elementi da Z = 104 hanno il bordo tratteggiato.

## 6. Visualizzatore 3D

Si apre dalla scheda dell'elemento (pulsante «Visualizza atomo in 3D» o icona dell'atomo).

- **Modello di Bohr**: nucleo al centro, un anello per guscio (K, L, M, …) con il numero corretto di elettroni.
- **Modello quantistico**: nuvole di probabilità degli orbitali occupati, attivabili singolarmente
  (es. 2p<sub>x</sub>, 3d<sub>z²</sub>, 4f<sub>xyz</sub>). I punti sono campionati dalla densità |ψ|² delle funzioni d'onda
  idrogenoidi (polinomi di Laguerre × armoniche sferiche reali); il colore indica il segno di ψ. Riempimento con la regola di Hund.
- **Nucleo**: protoni (rossi) e neutroni (grigio-azzurri) impacchettati per rilassamento di sfere rigide;
  «Esplodi il nucleo» separa tutte le particelle; il selettore di isotopo aggiunge o toglie neutroni in tempo reale.
- **Controlli**: rotazione/zoom/spostamento con il mouse (OrbitControls), pausa e velocità, interruttori per etichette,
  gusci, orbitali e assi. Passando sopra una particella compare una descrizione (per gli elettroni anche guscio, orbitale e numeri quantici).
- **Scala**: una nota sempre visibile riporta, per ogni elemento, quante volte il nucleo reale è più piccolo dell'atomo.
- **Prestazioni**: protoni, neutroni ed elettroni sono `InstancedMesh` (una chiamata di disegno per tipo); il raycasting
  usa sfere di contenimento e viene limitato ai movimenti del puntatore. Con Oganesson (294 nucleoni, 118 elettroni, 59 orbitali)
  il visualizzatore resta ben sopra i 60 fps; se il computer è lento la qualità si riduce da sola (prima il bagliore, poi la risoluzione).
  Premi `F` per vedere gli fps.

Three.js viene caricato solo alla prima apertura del visualizzatore (file separato), così l'avvio della tavola resta rapido.

### Analisi delle particelle

**Clic** su un protone, un neutrone o un elettrone (nel modello di Bohr): la particella viene evidenziata da un mirino,
la camera si avvicina in modo fluido e poi la segue (anche mentre l'elettrone gira o il nucleo esplode), e a sinistra
si apre la scheda della particella. `Esc` o ✕ chiudono l'analisi e riportano la vista sull'atomo.

| Particella | Dati mostrati |
|------------|---------------|
| Protone | carica (+1 e, in coulomb), massa in kg, MeV/c² e u (CODATA 2022), spin, quark uud, raggio di carica, stabilità; ruolo: Z identifica l'elemento (con gli elementi Z ± 1); energia di legame del nucleo |
| Neutrone | carica 0 (udd), massa e differenza con il protone, decadimento β⁻ del neutrone libero (vita media 878 s, PDG 2024), stabilità nell'isotopo scelto (β⁻, β⁺, cattura elettronica, α, fissione), isotopi naturali, N/Z |
| Elettrone | carica, massa, spin; guscio, sottolivello e orbitale; i quattro numeri quantici n, l, mₗ, mₛ spiegati; principio di Pauli o regola di Hund; energia di legame e Z efficace |

**Energia di legame dell'elettrone** — dalla fonte migliore disponibile:
1. elettroni più esterni → prima energia di ionizzazione misurata (NIST);
2. elettroni interni, Z ≤ 92 → X-ray Data Booklet (con i livelli separati dallo spin-orbita, es. 2p₁/₂ e 2p₃/₂);
3. dove i dati mancano → stima con le regole di Slater (indicata con ≈, solo ordine di grandezza).

**Quark** — avvicinandosi con la rotella a un protone o a un neutrone selezionato (oppure con «Guarda dentro: i quark»)
il nucleone diventa trasparente e mostra i tre quark di valenza (u, d) con la loro carica di colore, i gluoni disegnati
come molle e le coppie quark–antiquark virtuali. I gluoni scambiano il colore tra i quark: un impulso colorato viaggia
lungo la molla e, a scambio concluso, i tre colori sono di nuovo rosso + verde + blu. È una rappresentazione schematica.

## 7. Laboratorio molecolare

Si apre dal pulsante con la beuta nella barra in alto, oppure con «Usa nel laboratorio» nella scheda di un elemento
(l'atomo è già sul banco).

- **Aggiungere atomi**: clic su un elemento della tavolozza (o trascinamento sul banco). I simboli `~` e `?` indicano
  gli elementi per cui il modello è meno affidabile (metalli d/f) o la chimica è sconosciuta (Z ≥ 104).
- **Legare**: trascina un atomo vicino a un altro; un'anteprima verde o rossa spiega se il legame è possibile e perché.
  Con lo strumento **Lega** (`B`) si fa clic su due atomi, anche della stessa molecola (anelli).
- **Ordine del legame**: clic sul legame (singolo → doppio → triplo). **Rompere**: tasto destro o strumento **Forbici** (`X`).
- **Combina** (`C`): costruisce automaticamente la struttura più stabile dagli atomi selezionati (o da tutti gli atomi liberi):
  2 H + O → H₂O, Na + Cl → NaCl, 4 H + 2 O → 2 H₂O, C₂H₆O → etanolo (con l'etere dimetilico come isomero alternativo).
- **Separa** (`S`): scompone la molecola in atomi (H₂ → 2 H); per i composti ionici anche «In ioni» (Na⁺ e Cl⁻).
- **±e⁻**: aggiunge o toglie un elettrone (es. NH₃ + H⁺ → NH₄⁺, OH + e⁻ → OH⁻).
- **Esempi**: 445 sostanze pronte in 14 gruppi, con ricerca per nome o formula: almeno un composto per ogni elemento
  che ne forma fino all'einsteinio (esclusi He, Ne, Ar, Rn, At, Fr), idrocarburi, composti organici, biomolecole
  (amminoacidi, zuccheri, basi del DNA), farmaci e aromi, ioni, sali, composti dei metalli di transizione, di lantanidi e attinidi.
- **Formula** (`F`, oppure `Ctrl+V` direttamente sul banco): si scrive o si incolla una composizione chimica e la si
  costruisce sul banco. Accetta formule con parentesi, idrati e cariche (`H2SO4`, `Ca(OH)2`, `K4[Fe(CN)6]`,
  `CuSO4·5H2O`, `NH4+`, `SO4^2-`, `SO₄²⁻`), più sostanze (`2 H2 + O2`, anche mescolando nomi: `P4O10 + 2 acqua`),
  nomi italiani (`acqua`, `aspirina`) e SMILES (`CCO`). L'anteprima mostra cosa verrà costruito, la massa molare e la
  composizione percentuale in massa; «Solo atomi» mette gli atomi senza legami, da collegare a mano.

| Cosa calcola | Come |
|---|---|
| Legami possibili | valenze dei gruppi principali (ottetto espanso dal 3° periodo); stati di ossidazione dei dati per i metalli d/f |
| Tipo di legame | differenza di elettronegatività di Pauling: < 0,4 apolare, 0,4–1,7 polare, > 1,7 con un metallo ionico |
| Struttura di Lewis | conservazione degli elettroni, ottetti (duetto per H), cariche formali, radicali; disegno 2D in SVG |
| Forma 3D | VSEPR (AXₙEₘ) con rilassamento: lunghezze dai raggi covalenti (ionici per gli ioni), angoli VSEPR o sperimentali |
| Riconoscimento | impronta del grafo (Weisfeiler–Lehman) confrontata con la libreria in `src/lab/data/molecules.js` |
| «Combina» | libreria per formula (anche più unità uguali: 4 H + 2 O → 2 H₂O); sali dei metalli scomposti in ioni noti con le cariche bilanciate (Fe₂(SO₄)₃ = 2 Fe³⁺ + 3 SO₄²⁻); alcani lineari lunghi; altrimenti ricerca della struttura con meno elettroni spaiati, meno frammenti e maggiore energia di legame |
| Nomi generati | composti ionici (bromuro di ferro(III), solfato di potassio e alluminio), molecole binarie (pentossido di diazoto), alcani lineari (dodecano) |
| Composizione | massa molare e percentuale in massa di ogni elemento, nella scheda e nell'anteprima della formula |

Limiti dichiarati nell'app: le soglie di ΔEN sono una convenzione; per i metalli d/f le strutture sono «non verificate»;
le geometrie fuori libreria sono stime (≈); il legame metallico non è simulato.

### Reazioni

Pulsante **Reazioni** nella barra del laboratorio: 45 reazioni in 5 gruppi (sintesi, combustioni, decomposizioni,
acidi e basi, altre: fotosintesi, fermentazione, termite, idrogenazione…).

- **Equazione** con gli stati fisici, es. `CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(l)`.
- **Bilancia tu**: si parte da tutti i coefficienti a 1; una tabella conta gli atomi di ogni elemento nei due lati e
  segnala quando l'equazione è bilanciata (o semplificabile). «Mostra la soluzione» rivela i coefficienti.
- **Energia**: ΔH° dalle entalpie di formazione standard (NIST, CRC) con il diagramma energetico (esotermica/endotermica;
  l'energia di attivazione è solo indicativa) e, per le molecole covalenti, la stima «legami rotti − legami formati».
- **Avvia la reazione**: le molecole dei reagenti si avvicinano, i legami che si rompono si colorano di rosso, gli atomi si
  riorganizzano e i nuovi legami compaiono in verde. Se i reagenti sono già sul banco (es. costruiti a mano) la reazione
  usa proprio quelli, e la scheda del banco propone le «Reazioni possibili». `Ctrl+Z` annulla l'intera reazione.
- Anche **Combina** indica l'energia: es. 2 H₂ + O₂ → 2 H₂O, ΔH ≈ −482 kJ/mol dalle energie di legame.

Il bilanciamento è algebrico (spazio nullo intero della matrice degli atomi), quindi funziona per qualsiasi equazione;
i test verificano che tutte le 45 reazioni della libreria siano bilanciate con i coefficienti minimi.

Test automatici del motore chimico:

```bash
npm test
```

## 8. Struttura del progetto

```
.github/workflows/
  pages.yml           build e pubblicazione della versione web su GitHub Pages
electron/
  main.cjs            processo principale (finestra, menu, sicurezza: contextIsolation, sandbox)
  preload.cjs         ponte minimo verso il renderer
src/
  main.js             avvio dell'interfaccia e scorciatoie globali
  chem/               logica chimica pura (configurazioni, numeri quantici, regole di Slater, costanti delle particelle, formattazione)
  data/               elements.json (generato) e categorie/colori
  state/              store dello stato e logica di ricerca/filtri
  ui/                 tavola, anteprima, barra filtri, scheda elemento, icone, dialog
  viewer/             visualizzatore 3D
    atom-viewer.js    interfaccia, stato, raycasting, tastiera
    engine.js         renderer, camera, OrbitControls, bloom, etichette, qualità adattiva
    nucleus.js        protoni/neutroni (InstancedMesh), isotopi, esplosione
    packing.js        impacchettamento dei nucleoni
    bohr-model.js     gusci ed elettroni del modello di Bohr
    orbital-clouds.js nuvole di probabilità (shader a punti)
    orbital-math.js   funzioni d'onda idrogenoidi e campionamento di |ψ|²
    quark-view.js     interno dei nucleoni: quark, gluoni, coppie virtuali
    particle-panel.js scheda di analisi di protoni, neutroni, elettroni e quark
    selection-marker.js mirino della particella selezionata
  lab/                laboratorio molecolare
    lab-view.js       interfaccia, azioni (Combina, Separa, cariche), annulla/ripeti
    bench-scene.js    scena 3D: atomi, legami, coppie solitarie, trascinamento
    palette.js        tavolozza degli elementi
    molecule-panel.js scheda della molecola
    lewis-svg.js      disegno della struttura di Lewis
    chem/             motore chimico puro (valenze, Lewis, VSEPR, SMILES, riconoscimento, Combina)
    reaction-panel.js elenco e scheda delle reazioni, diagramma energetico
    data/molecules.js libreria di molecole, ioni e composti ionici (con ΔHf°)
    data/reactions.js libreria delle reazioni
tests/lab/            test del motore chimico (npm test)
  styles/             token di design, layout, tavola, scheda, visualizzatore
scripts/
  build-data.mjs      genera e valida elements.json
  build-binding.mjs   genera binding-energies.json (X-ray Data Booklet)
  make-icon.mjs       genera build/icon.png (icona dell'app)
data-sources/         dati di origine (PubChem + dati curati in italiano)
build/icon.png        icona usata da electron-builder
```

## 9. Uso

- **Passa il mouse** su un elemento: anteprima in alto e cella in rilievo.
  Passando su un numero di gruppo/periodo o su una categoria della legenda si evidenzia l'intera colonna/riga/categoria.
- **Clic** su un elemento: si apre la scheda laterale; frecce ‹ › per scorrere gli elementi.
- **Ricerca** per nome (anche senza accenti), simbolo o numero atomico; `Invio` apre il risultato migliore.
- **Filtri** per categoria (clic sulla legenda), stato fisico a 25 °C e blocco s/p/d/f; «Azzera» li rimuove.

| Tasto | Azione |
|-------|--------|
| `/` oppure `Ctrl+F` | cerca |
| `← → ↑ ↓` | muovi tra gli elementi della tavola |
| `Invio` | apri la scheda |
| `Esc` | chiudi la scheda / svuota la ricerca |
| `F11` | schermo intero |
| `B` / `Q` | (3D) modello di Bohr / quantistico |
| `E` | (3D) esplodi o ricompatta il nucleo |
| `L` | (3D) etichette |
| `Spazio` | (3D) pausa / riproduci |
| `F` | (3D) mostra gli fps |
| clic su una particella | (3D) analisi della particella; `Esc` la chiude |
| `V` / `B` / `X` | (laboratorio) sposta / lega / forbici |
| `C` / `S` | (laboratorio) combina / separa |
| `F` / `Ctrl+V` | (laboratorio) scrivi o incolla una formula, un nome o uno SMILES |
| `Ctrl+Z` / `Ctrl+Y` | (laboratorio) annulla / ripeti |
| `Canc` | (laboratorio) elimina la selezione |
