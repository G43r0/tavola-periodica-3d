# Tavola Periodica 3D

Applicazione desktop (Electron + Three.js) con la tavola periodica interattiva dei 118 elementi,
schede informative in italiano e modelli 3D degli atomi esplorabili fino alle singole particelle
(protoni, neutroni, elettroni e quark), più un **laboratorio molecolare** in cui si collegano gli atomi per formare
molecole e composti e una **sandbox degli elementi** in stile *The Powder Toy*: i 118 elementi, le 554 sostanze della
libreria e i materiali di base (legno, carbone, calcestruzzo, muro indistruttibile) cadono, fondono, bollono, si sciolgono,
bruciano e reagiscono secondo i loro dati reali e le reazioni del catalogo.
L'interfaccia è in **italiano**, in **inglese** e in **«Spiegamelo come se avessi 6 anni»** (le stesse spiegazioni con parole
semplici), e la **modalità Spiega** (`F1`) apre una scheda su qualsiasi parola evidenziata o cosa cliccata col tasto destro.
Tre **preset grafici** (Semplice, Medio, Professionale) adattano la grafica al computer; il Professionale mostra anche
l'**aspetto reale** di ogni elemento (colori e materiali veri) in un campione 3D.
Il **simulatore di laboratorio** è un gioco in prima persona nel laboratorio di chimica della scuola, nello stile di
*Cooking Simulator*: si prendono becher e bottiglie, si pesa, si versa inclinando, si scalda e si consegna il preparato
all'insegnante, con la fisica vera degli oggetti e la chimica delle 554 sostanze e delle reazioni del catalogo.
Funziona **completamente offline**: dati, font e codice sono inclusi nell'app.

| Fase | Contenuto | Stato |
|------|-----------|-------|
| 1 | Tavola periodica, ricerca, filtri, scheda dell'elemento | ✅ completata |
| 2 | Visualizzatore 3D dell'atomo (Bohr e orbitali, nucleo, isotopi) | ✅ completata |
| 3 | Analisi delle singole particelle (protoni, neutroni, elettroni, quark) | ✅ completata |
| 4 | Laboratorio molecolare: costruzione di molecole (3D + Lewis, Combina/Separa, libreria) | ✅ completata |
| 5 | Laboratorio: reazioni (animazione, bilanciamento, energia di reazione) | ✅ completata |
| 6 | Sandbox degli elementi: polveri, liquidi e gas con temperatura, reazioni, elettricità, radioattività | ✅ completata |
| 7 | Lingue (italiano, inglese, «Spiegamelo come se avessi 6 anni») e modalità Spiega | ✅ completata |
| 8 | Preset grafici (Semplice, Medio, Professionale) e aspetto reale degli elementi | ✅ completata |
| 9 | Simulatore di laboratorio: il gioco in prima persona nel laboratorio della scuola | 🧪 prototipo giocabile |

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
- **Esempi**: 554 sostanze pronte in 14 gruppi, con ricerca per nome o formula: almeno un composto per ogni elemento
  che ne forma fino all'einsteinio (esclusi He, Ne, Ar, Rn, At, Fr), idrocarburi, composti organici, biomolecole
  (amminoacidi, zuccheri, basi del DNA), farmaci e aromi, ioni (anche monoatomici e complessi: Na⁺, Cl⁻, Fe³⁺,
  [Cu(NH₃)₄]²⁺), sali, idrati, composti dei metalli di transizione, di lantanidi e attinidi.
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

Pulsante **Reazioni** nella barra del laboratorio: 47 reazioni in 5 gruppi (sintesi, combustioni, decomposizioni,
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

### Simula reazione

Pulsante **Simula reazione** nella barra in basso (tasto `R`): le molecole sul banco — oppure solo quelle selezionate
con Ctrl+clic, se sono almeno due — si agitano, si avvicinano e si urtano. Se l'urto è efficace i legami che si rompono
diventano rossi, quelli nuovi verdi, un bagliore arancione (energia liberata) o azzurro (energia assorbita) segna la
reazione e sopra le molecole compare il ΔH. A destra un resoconto elenca le reazioni avvenute e le molecole avanzate.

- **Quale reazione**: tra le reazioni della libreria possibili con le molecole presenti si sceglie quella che consuma più
  molecole (poi la più esotermica): 2 C + O₂ → 2 CO, ma C + O₂ → CO₂. Tutte le reazioni possibili subito avvengono
  insieme; i prodotti possono reagire al passo successivo (N₂ + 3 H₂ + 2 HCl → 2 NH₃, poi 2 NH₄Cl).
- **Reagente limitante**: 3 H₂ + O₂ → 2 H₂O e resta 1 H₂ «in eccesso».
- **Nessuna reazione**: le molecole rimbalzano e il resoconto spiega perché: reagenti mancanti (H₂ + O₂: per l'acqua
  manca 1 H₂, con il pulsante «Aggiungi e simula»), reazione endotermica (2 H₂O → elettrolisi solo con
  «Fornisci energia e simula»), condizioni particolari (la fermentazione richiede i lieviti).
- **Fuori libreria** il modello prova le sintesi per addizione: 2 o 3 molecole che, insieme, hanno gli atomi di una
  sostanza nota (H₂ + Br₂ → 2 HBr, SO₃ + H₂O → H₂SO₄, 2 NO₂ → N₂O₄). L'urto è efficace solo se ΔH < −40 kJ
  (entalpie di formazione o, in mancanza, energie di legame tabulate) e se la libreria non descrive già la reazione
  di quelle specie (H₂ + O₂ non dà H₂O₂).
- `Ctrl+Z` annulla l'intera simulazione.

Il bilanciamento è algebrico (spazio nullo intero della matrice degli atomi), quindi funziona per qualsiasi equazione;
i test verificano che tutte le 1349 reazioni della libreria siano bilanciate (atomi e carica) con i coefficienti minimi.

Il [catalogo delle reazioni](docs/catalogo-reazioni.md) elenca le 1349 reazioni del laboratorio: tutte reali,
bilanciate e scritte solo con sostanze della libreria (o elementi), divise in 14 sezioni, con condizioni ed entalpia di
reazione dove è nota. Il motore le carica tutte.

Test automatici del motore chimico:

```bash
npm test
```

## 8. Sandbox degli elementi

Si apre dal pulsante **Sandbox** nella barra in alto, oppure con «Sandbox» nella scheda di un elemento (l'elemento è già
nel pennello). È una «sabbiera» a particelle ispirata a *The Powder Toy*: una griglia di celle (240 × 135, 320 × 180 o
400 × 225), ognuna un granello di sostanza con la sua temperatura.

- **Sostanze**: i 118 elementi (tavola periodica nella tavolozza), i materiali di base — **legno**, **carbone**,
  **calcestruzzo**, **muro indistruttibile** — più il **generatore elettrico** e **tutte le 554 sostanze della libreria
  del laboratorio** (molecole, acidi, basi, sali, ossidi, ioni, composti organici ed esplosivi), divise per gruppi e
  con una ricerca per nome o formula (`CuSO4` trova il solfato di rame). Ogni sostanza ha i suoi dati fisici: temperature
  di fusione ed ebollizione, densità, colore, solubilità in acqua, infiammabilità e temperatura di accensione
  (`src/sandbox/data/compounds.js`). Le reazioni «a mano» producono i sali, gli ossidi e gli idrossidi della libreria
  (Na + Cl₂ → NaCl, Mg + O₂ → MgO, Na + H₂O → NaOH(aq)); se il composto non c'è, nome e formula sono generati
  (es. «Cloruro di ferro(III)», FeCl₃).
- **Soluzioni**: i sali solubili, gli acidi e le basi si sciolgono nell'acqua (o si posano direttamente «In soluzione»)
  e diffondono nel liquido, colorandolo (Cu²⁺ azzurro, Ni²⁺ verde, KMnO₄ viola); gli ioni esistono solo in acqua.
  Facendo bollire una soluzione l'acqua evapora e il soluto **cristallizza**; le soluzioni di ioni conducono la corrente.
- **Reazioni del catalogo**: le 1349 reazioni del laboratorio sono simulate nella sandbox con i loro coefficienti, le
  condizioni scritte (soluzione acquosa, riscaldamento, innesco, luce, scintilla) e il calore dal ΔH°: precipitazioni
  (AgNO₃ + NaCl → AgCl, Pb(NO₃)₂ + KI → PbI₂ giallo), neutralizzazioni, metalli e acidi (lo zinco sviluppa idrogeno,
  il rame no), combustioni dei combustibili (metano, etanolo, benzina…), decomposizioni termiche (CaCO₃ → CaO + CO₂),
  **catalizzatori** (H₂O₂ si decompone solo vicino a MnO₂) e detonazioni (nitroglicerina, TNT, nitrometano). 1149
  reazioni usano il motore del catalogo, 93 coincidono con le regole «a mano» (combustioni, metallo + alogeno, metallo +
  acqua); restano escluse, con il motivo, solo 107: equilibri (⇌), reazioni con catalizzatori non specificati o assenti
  e quelle che richiedono un organismo vivente. Un composto infiammabile senza combustione in catalogo brucia comunque, e
  quelli organici che si decompongono **carbonizzano** (lo zucchero scaldato lascia carbonio).
- **Stati fisici reali**: ogni elemento è solido, liquido o gas in base a temperatura di fusione e di ebollizione
  (sublimazione per carbonio e arsenico). Nella scheda «Posa come» si sceglie lo stato (es. azoto liquido, ferro
  fuso, vapore di sodio) o la temperatura, e se un solido va posato come **polvere** (cade e si ammucchia) o come **blocco**
  (resta fermo). Il fuso che si raffredda solidifica in un blocco; i vapori si condensano in gocce.
- **Densità**: liquidi e polveri si stratificano con le densità reali (il mercurio va sotto l'acqua, il piombo vi galleggia,
  l'oro affonda); i gas salgono o scendono rispetto all'aria secondo la massa molare e la temperatura (idrogeno ed elio in
  alto, cloro e radon in basso, i gas caldi salgono).
- **Calore**: conduzione tra celle (i metalli conducono di più, il muro isola), raffreddamento verso i 22 °C dell'aria,
  incandescenza dei corpi oltre il punto di Draper (525 °C) e vista termica (`H`).
- **Combustione** (serve aria o ossigeno): legno (fiamma, fumo, cenere; senza ossigeno **pirolisi** in carbone), carbone
  (brace lenta), carbonio, zolfo (fiamma blu, SO₂), fosforo (si accende a 34 °C), idrogeno (brucia di colpo e diventa
  vapore acqueo), metalli in polvere (magnesio, alluminio, ferro…). Ogni metallo colora la fiamma (**saggio alla fiamma**:
  litio rosso, sodio giallo, potassio lilla, bario verde, rame verde-azzurro…). Acqua e CO₂ fredda spengono il fuoco.
- **Reazioni chimiche**: metalli alcalini e alcalino-terrosi + acqua (idrogeno, idrossido, calore; rubidio e cesio
  esplodono), metallo + alogeno → sale (più veloce quanto più grande è la differenza di elettronegatività), alluminotermia
  (2 Al + Fe₂O₃, innesco con il magnesio), ruggine del ferro bagnato.
- **Elettricità**: lo strumento Scintilla e il generatore mandano impulsi nei conduttori (metalli, grafite, acqua, sali fusi;
  silicio e germanio solo da caldi); i gas nobili si illuminano con i colori dei tubi a scarica (neon rosso-arancio, argon
  violetto, xeno blu…); la corrente scalda per effetto Joule, accende l'idrogeno ed elettrolizza acqua e sali fusi.
- **Radioattività**: gli elementi senza isotopi stabili decadono (α, β⁻, cattura elettronica, fissione spontanea) secondo
  l'isotopo principale, con il tempo accelerato in **scala logaritmica** (il radio, 1 600 anni, dimezza in circa 2 minuti e
  mezzo; l'uranio-238 in 43 minuti): si formano le catene reali (U → Th → Ra → Rn → Po → Pb), il decadimento α libera elio
  e la radiazione è fermata dal piombo.
- **Fissione**: i neutroni (strumento Neutroni) spezzano uranio, plutonio e gli altri attinidi fissili in coppie di
  frammenti reali (Ba + Kr, Xe + Sr…) liberando altri neutroni e calore: reazione a catena. Acqua e grafite rallentano i
  neutroni (moderatori), cadmio, boro e gadolinio li assorbono (barre di controllo), il berillio li riflette.
- **Esplosioni** (strumento Esplosione, cesio in acqua, fissione, esplosivi): lanciano le particelle, frantumano i
  blocchi deboli; l'onda d'urto fa detonare gli esplosivi vicini; il calcestruzzo resiste, il muro indistruttibile non si
  scalfisce.
- **Registro delle reazioni**: a destra compaiono, con l'equazione bilanciata e il numero di volte, le reazioni avvenute
  (per quelle del catalogo anche condizioni, ΔH° e numero nel catalogo), le soluzioni e le cristallizzazioni, i
  decadimenti (²²⁶Ra → ²²²Rn + ⁴He), le fissioni e i cambiamenti di stato (con la temperatura).
- **Esempi** pronti (19): metalli alcalini in acqua, saggio alla fiamma, termite, reazione a catena, scarica nei gas,
  decadimento radioattivo, legno e carbone, idrogeno e ossigeno, galleggiare sul mercurio, elettrolisi dell'acqua,
  precipitazioni colorate, combustibili, acqua ossigenata e catalizzatore, metalli e acido cloridrico, acqua salata ed
  evaporazione, esplosivi, miscele con Mescola, sorgenti-pozzi-vento, sodio e cloro.

| Strumento | Effetto |
|---|---|
| Gomma | cancella (anche il tasto destro) |
| Calore / Freddo | ± 30 K per passo (fino a 9 999 K / zero assoluto) |
| Fuoco | fiamme a circa 900 °C |
| Scintilla | impulso elettrico nei conduttori |
| Neutroni | sorgente di neutroni veloci |
| Esplosione | un'esplosione al clic |
| **Mescola** (`M`) | rimescola polveri, liquidi, gas e soluzioni nel pennello e ne uguaglia la temperatura: forma miscele (ferro + zolfo, polvere nera…) che poi reagiscono; i liquidi di densità diversa si separano di nuovo |
| **Vento** (`W`) | spinge gas, polveri e liquidi nella direzione in cui trascini il cursore; fermo, li spinge via dal centro |
| **Ambiente** | riporta le celle a 22 °C e ne spegne le braci |
| **Estintore** | spegne fiamme e braci e raffredda sotto l'accensione |
| **Pipetta** | sceglie la sostanza (con temperatura e stato) su cui clicchi |

Altri materiali: la **Sorgente** clona all'infinito la prima sostanza che tocca (posala accanto all'acqua, alla sabbia o a un
gas) e il **Pozzo** cancella tutto ciò che lo tocca, per svuotare vasche e smaltire i gas.

**Modi di disegno** (in basso a sinistra): *Pennello* a mano libera, *Riempi* (secchiello: riempie la regione chiusa che
tocca con la sostanza scelta; il clic destro la svuota), *Linea*, *Rettangolo* ed *Ellisse* trascinando il mouse (con
«Pieno» o solo contorno, spesso quanto il pennello: ideale per vasche e contenitori). **Annulla** e **Ripeti**
(`Ctrl + Z` / `Ctrl + Y`, anche i pulsanti in alto) tornano indietro di 12 modifiche, compreso «Svuota» e il caricamento
di un esempio.

Limiti dichiarati: una cella è un «granello», non un atomo; le reazioni, le conducibilità e le velocità sono semplificate
e scelte per il gioco (una cella di prodotto per ogni cella di reagente, in proporzione ai coefficienti); i prodotti
generici (sali, ossidi) hanno temperature di fusione indicative; la solubilità è «sì o no», senza concentrazioni né
equilibri; la radioattività segue il solo isotopo principale. Il motore è un modulo puro (`src/sandbox/world.js`, con
`chemistry.js` per il catalogo) provato dai test (`npm test`).

## 9. Lingue e modalità Spiega

**Lingue.** Il globo nella barra in alto sceglie la lingua; la scelta resta salvata e l'app si ricarica riaprendo
l'elemento che si stava guardando (anche il menu dell'app desktop cambia lingua).

- **Italiano** e **inglese**: tutta l'interfaccia, le schede dei 118 elementi (origine del nome, scoperta, usi, dove si
  trova, decadimenti), il visualizzatore 3D e l'analisi delle particelle, il laboratorio con le 554 sostanze e le 1349
  reazioni (nomi, descrizioni, condizioni, nomi IUPAC generati), la sandbox con le sue schede e il registro.
  La ricerca trova gli elementi e le sostanze per nome in entrambe le lingue.
- **«Spiegamelo come se avessi 6 anni»**: italiano con parole semplici e paragoni di tutti i giorni, senza linguaggio
  infantile. Riscrive le spiegazioni (introduzione semplice di ogni elemento, usi, dove si trova, particelle, strumenti
  del laboratorio e della sandbox, modalità Spiega); i dati numerici restano quelli veri. Le descrizioni della libreria
  del laboratorio (sostanze e note delle reazioni) restano nell'italiano normale.

Ogni modulo ha la sua tabella di testi (`createT({ it, en, eli6 })` in `src/i18n/index.js`): la versione semplice ricade
sull'italiano per i testi che non ridefinisce. I dati tradotti sono in `src/i18n/data/`. I test (`tests/i18n/`) controllano
che ogni testo italiano abbia la traduzione inglese, che i segnaposto coincidano e che ogni voce dell'interfaccia abbia
una spiegazione in tutte e tre le lingue.

**Modalità Spiega.** Si attiva con `F1` o con il pulsante a fumetto (nella barra in alto, nel laboratorio e nella
sandbox). Quando è attiva:

- **evidenzia** una parola o una frase, oppure fai **clic destro** su qualsiasi cosa: si apre una scheda che la spiega;
- riconosce gli **81 termini** di chimica e fisica del glossario (con sinonimi e plurali), le **famiglie**, i **gruppi** e i
  **periodi**, i **118 elementi** (con «Apri la scheda»), le **554 sostanze** del laboratorio (con la formula), le
  **funzioni** dell'interfaccia (ogni pulsante, interruttore e area) e i **tasti**: su un `<kbd>` la scheda dice cosa fa
  quel tasto in ogni parte dell'app;
- ogni scheda ha le scorciatoie utili e i «Vedi anche»; anche le parole dentro la scheda si possono spiegare (con
  «Indietro» per tornare); `Esc` chiude la scheda, `F1` esce dalla modalità;
- il tasto destro in modalità Spiega non cancella nella sandbox, non ruota la vista e non rompe legami nel laboratorio.

Il glossario (`src/i18n/data/glossary-*.js`) si carica solo al primo uso, come la libreria delle sostanze.

## 10. Grafica: Semplice, Medio, Professionale

Il pulsante con lo schermo nella barra in alto sceglie il preset grafico; la scelta resta salvata e l'app si ricarica
riaprendo l'elemento che si stava guardando. Se il computer scende sotto una soglia di fotogrammi al secondo, il
visualizzatore 3D e il laboratorio tolgono da soli un effetto alla volta (`F` nel visualizzatore mostra fps e qualità).

| | Semplice | Medio (predefinito) | Professionale |
|---|---|---|---|
| Risoluzione 3D | 1 pixel per pixel | come lo schermo (max 2×) | sovracampionata (almeno 1,5×, max 2,5×) |
| Antialiasing | — | del canvas | MSAA 4× sulle immagini intermedie |
| Effetti | nessun post-processing | bloom | bloom, riflessi di uno studio fotografico, ombre morbide, occlusione ambientale tra le sfere |
| Materiali | standard | standard | fisici con vernice trasparente (nucleoni, modellini molecolari in plastica lucida) |
| Dettaglio | sfere e anelli con meno segmenti, metà dei punti negli orbitali | — | sfere con il doppio dei segmenti, 2,2× punti più fini negli orbitali, più coppie virtuali nei nucleoni |
| Colore | ACES | ACES | *Khronos PBR Neutral*: tinta e saturazione dei colori di base restano quelle vere |
| Sandbox | senza bagliore, 1 pixel per pixel | bagliore | trame dei materiali (3×3 pixel per granello), rilievo, liquidi più scuri in profondità e lucidi in superficie, alone ampio |
| Interfaccia | niente sfocature dietro i pannelli né animazioni continue | — | tasselli con riflesso lucido |

**Aspetto reale (solo Professionale).** La scheda dell'elemento ha un campione 3D dell'elemento puro a 25 °C, che ruota da
solo e si trascina, con una didascalia; le stesse immagini compaiono in piccolo nelle celle della tavola e in grande
nell'anteprima. I dati sono in `src/gfx/appearance.js`:

- **metalli**: cubetti da collezione spazzolati, lucidati o grezzi, con la riflettanza misurata della superficie (i valori
  «F0» del rendering fisico): solo oro, rame, cesio e osmio sono colorati; il bismuto ha i cristalli a gradini con i
  colori iridescenti dell'ossido; i metalli alcalini sono sotto vetro, il mercurio è una goccia a specchio;
- **non metalli**: grafite nera e lucida, zolfo in cristalli gialli, fosforo bianco ceroso e traslucido, iodio in scaglie
  viola-nere, silicio e boro in pezzi dalla lucentezza metallica;
- **gas**: ampolle di vetro (con rifrazione) in cui il gas brilla del colore della sua scarica elettrica (neon rosso-arancio,
  argon viola, xeno blu…); cloro e fluoro sono gas colorati; il bromo è un liquido rosso-bruno con i suoi vapori;
- gli elementi molto radioattivi (radio, attinio, polonio, einsteinio…) hanno la loro debole luce propria; quelli mai visti
  in quantità visibili sono un cubo di vetro smerigliato con un punto interrogativo.

I campioni si disegnano in `src/gfx/specimen.js` (studio con `RoomEnvironment`, ombre, materiali fisici con anisotropia,
iridescenza e trasmissione); le miniature si generano all'avvio, poche per fotogramma, poi il contesto grafico si libera.
Protoni, neutroni ed elettroni mantengono invece i colori convenzionali: sono molto più piccoli della lunghezza d'onda
della luce e quindi non hanno un colore visibile.

## 11. Simulatore di laboratorio

Si apre dal pulsante **Simulatore** (occhiali di protezione) nella barra in alto. È un gioco in prima persona ispirato a
*Cooking Simulator*, ambientato nel laboratorio di chimica di una scuola: lo studente riceve le esercitazioni
dall'insegnante, le prepara al bancone e le consegna alla cattedra. Modelli e grafica sono costruiti nel codice; la
fisica è quella di [Rapier](https://rapier.rs) (WebAssembly incluso nell'app, caricato solo alla prima apertura).
Design e decisioni: `docs/superpowers/specs/2026-10-13-simulatore-laboratorio-design.md`.

**Stato: prototipo giocabile** per provare comandi e fisica. Negozio e ampliamenti del laboratorio, reputazione,
tutorial completo, sfide a tempo, buretta, pipetta, filtrazione e distillazione arriveranno nelle prossime versioni.

- **Modalità**: *Carriera* (5 esercitazioni valutate con stelle e soldi, progressi salvati) e *Laboratorio libero*
  (tutti gli strumenti e un magazzino con le 554 sostanze della libreria come solidi, liquidi o soluzioni 0,1 M e 1 M).
- **Chimica** scelta all'inizio: *realistica* (si legge la bilancia, la graduazione e le etichette; la spatola prende
  quantità variabili; tolleranze strette) o *semplificata* (un cucchiaino = 1 g, quantità e pH sempre visibili,
  tolleranze larghe).
- **Due visuali**: prima persona (`W A S D` e mouse) e vista dall'alto del bancone (`Tab`; `A`/`D` cambia postazione:
  bancone, scaffale, lavandino, cappa, cattedra, rifiuti; l'oggetto in mano viaggia con il giocatore).
- **Interfaccia come in *Cooking Simulator***: in basso a destra una legenda piccola (icona del tasto e azione) mostra
  sempre i comandi del momento, cambia con l'oggetto in mano e con ciò che si guarda, attenua le azioni che lì non
  funzionano e illumina il tasto premuto (`L` la nasconde). Le informazioni importanti sono in finestrelle accanto agli
  oggetti: ciò che si guarda (nome in una fascia, millilitri e contenuto; stato di piastra, Bunsen, rubinetto, bilancia,
  rifiuti) e ciò che si tiene in mano (millilitri e dove si sta versando). L'oggetto guardato ha un contorno.
- **Fisica vera**: gli oggetti si prendono, si posano dove si guarda, si lanciano, cadono e si rovesciano; la vetreria che
  urta oltre ~3,3 m/s si rompe (un becher che cade dal bancone sì, uno posato no). Gli sgabelli si spingono camminandoci
  contro; la vetreria a terra non ferma il giocatore.
- **Comandi come in *Cooking Simulator***: clic sinistro per prendere, usare gli elementi fissi e posare (dove lo si
  poserà compare la sagoma dell'oggetto, nel punto d'appoggio vero: verde se lì si può, rossa se il piano è inclinato o
  mobile, troppo lontano, a sbalzo o occupato; al clic l'oggetto ci scivola in meno di 0,3 s). Destro tenuto + mouse
  ruota l'oggetto (per un recipiente anche il beccuccio da cui si versa); un clic destro annulla la rotazione o rimette
  l'oggetto dove lo si era preso. Il tasto centrale tenuto carica il lancio (da 1,5 a 8 m/s in un secondo, con un anello
  attorno al mirino). `Maiusc` tenuto con un oggetto in mano apre la manipolazione precisa: lo sguardo e i passi si
  fermano, il mouse sposta l'oggetto (fino a 35 cm), sinistro + mouse lo alza o lo abbassa, destro + mouse lo ruota (un
  recipiente si inclina e versa goccia a goccia), il tasto centrale lo lascia lì fermo. `Spazio` corre, `Ctrl`
  accovaccia. Un clic sul lavandino con un recipiente in mano lo porta sotto il rubinetto: l'acqua scorre finché si tiene
  premuto il sinistro (la rotella regola il getto da 5 a 50 mL/s), il clic destro smette. `E` pulisce e usa gli
  strumenti (al lavandino lava il recipiente, che si svuota nello scarico).
- **Versare**: tenendo premuto il tasto sinistro e muovendo il mouse si inclina il recipiente; lasciando il tasto torna
  dritto e smette di versare, e di lato si corregge la mira. Il livello del liquido resta orizzontale (quantile di ~300
  punti campionati nel volume interno) e il liquido esce dal punto più basso del bordo con la portata di uno stramazzo
  (Q ≈ 1,77 · b · h^1,5, fino a 150 mL/s per un becher): sotto 0,5 mm di carico resta attaccato al bordo, poi esce
  goccia a goccia, e vicino al bordo il mouse inclina più finemente. Guardando un altro recipiente, la bocca si porta
  sopra la sua apertura. Un anello mostra dove cadrà il getto già prima della prima goccia: verde in un recipiente, nel
  lavandino o nei rifiuti, rosso se farà una pozza. Il getto è un filo continuo che si assottiglia cadendo e si ferma
  sugli ostacoli (il bordo di un altro becher); il liquido arriva quando il getto tocca il bersaglio.
- **Strumenti**: becher da 100 e 250 mL, beuta, cilindro graduato (tacche da 1 mL), bottiglie di reagenti con etichetta e
  pittogrammi, spruzzetta di acqua distillata, contagocce di fenolftaleina, barattoli, spatola (un cucchiaino o un pizzico),
  bilancia con tara, piastra riscaldante con agitatore (5 livelli), becco Bunsen con treppiede e reticella, ansa di
  nichel-cromo per il saggio alla fiamma, cartine indicatrici universali, carta assorbente, lavandino con rubinetto,
  cappa aspirante, doccia di emergenza, estintore a CO₂, contenitori dei rifiuti, vassoio delle consegne e campanello.
- **Grafica**: aula in toni medi (pareti verde salvia, mobili grigio ardesia, banconi neri) e luce moderata, perché la
  vetreria e i reagenti si stacchino dallo sfondo; vetro limpido al centro e più chiaro sui bordi, con il labbro della
  bocca; ombra di contatto sotto ogni oggetto; tone mapping neutro, che conserva i colori veri delle soluzioni.
- **Chimica dei contenitori** (`src/game/mixture.js`, testata): moli per sostanza e quanto è sciolto, temperatura,
  volume, massa, pH dal bilancio delle cariche (acidi e basi forti e deboli), colore (ioni dei metalli di transizione,
  indicatori, precipitati in sospensione), solubilità con la temperatura (CRC Handbook) e cristallizzazione anche come
  idrato (CuSO₄·5H₂O azzurro, che scaldato troppo torna bianco), ebollizione ed evaporazione, gas che si liberano, le
  reazioni del catalogo con le loro condizioni e il loro calore. Il tempo termico scorre 4 volte più veloce del reale.
- **Incidenti**: vetro rotto (i vetri vanno raccolti e buttati nel contenitore del vetro), pozze da asciugare con la carta
  (evaporando, quelle di una soluzione lasciano un alone di residuo secco da pulire),
  fuoco (un liquido infiammabile vicino alla fiamma; si propaga alla carta; si spegne con l'estintore), gas tossici (NO₂,
  Cl₂, H₂S, NH₃… fanno scattare l'allarme fuori dalla cappa accesa), esplosioni, schizzi corrosivi (doccia di emergenza
  entro 15 s).
- **Pulizia e rifiuti**: la vetreria sporca contamina il preparato successivo e si lava al lavandino; i rifiuti vanno nel
  contenitore giusto — lavandino (solo soluzioni innocue e diluite), metalli pesanti, acidi basi e sali, solventi organici,
  vetro rotto, rifiuti solidi — altrimenti si prende una multa.

| Esercitazione | Cosa si fa | Cosa si valuta |
|---------------|-----------|----------------|
| 1. Soluzione di cloruro di sodio | pesare 2,92 g di NaCl (3 g in semplificata), acqua distillata fino a 100 mL, sciogliere | concentrazione, volume, sale non sciolto, acqua del rubinetto o vetreria sporca |
| 2. Titolazione acido-base | fenolftaleina in 25 mL di HCl 0,10 M, NaOH 0,10 M fino al primo rosa | mL aggiunti rispetto al punto equivalente (25 mL), pH, indicatore |
| 3. Pioggia d'oro | Pb(NO₃)₂ + 2 KI → PbI₂ giallo; resti nei metalli pesanti | massa del precipitato, eccesso di reagente |
| 4. Cristalli di solfato di rame | sciogliere a caldo, evaporare metà dell'acqua, raffreddare (anche a bagnomaria) | grammi di cristalli, cristalli «bruciati», preparato ancora caldo |
| 5. Saggio alla fiamma | riconoscere tre campioni incogniti dal colore della fiamma, pulendo l'ansa nell'HCl | risposte giuste |

Ogni consegna vale fino a 5 stelle: 3 per il preparato, 1 per sicurezza e pulizia (pozze, vetri, rifiuti abbandonati,
incidenti, bidoni sbagliati) e 1 per il tempo. La paga è proporzionale alle stelle, meno reagenti, vetreria rotta e multe.

## 12. Struttura del progetto

```
electron/
  main.cjs            processo principale (finestra, menu, sicurezza: contextIsolation, sandbox)
  preload.cjs         ponte minimo verso il renderer
src/
  main.js             avvio dell'interfaccia e scorciatoie globali
  gfx/                preset grafici e aspetto reale degli elementi
    preset.js         impostazioni di Semplice, Medio e Professionale; scelta salvata
    appearance.js     aspetto reale dei 118 elementi (forma, colore, materiale) e didascalie
    specimen.js       campioni 3D realistici: vista nella scheda e miniature della tavola
  i18n/               lingue: index.js (lingua corrente, createT, pick), elements.js e lab-data.js (dati tradotti),
                      glossary.js (voci, indice delle parole e scorciatoie della modalità Spiega)
    data/             testi tradotti: elementi, sostanze, reazioni, glossario in italiano/inglese/versione semplice
  chem/               logica chimica pura (configurazioni, numeri quantici, regole di Slater, costanti delle particelle, formattazione)
  data/               elements.json (generato) e categorie/colori
  state/              store dello stato e logica di ricerca/filtri
  ui/                 tavola, anteprima, barra filtri, scheda elemento, icone, dialog
    explain.js        modalità Spiega: riconoscimento di parole e oggetti, scheda di spiegazione
  viewer/             visualizzatore 3D
    atom-viewer.js    interfaccia, stato, raycasting, tastiera
    engine.js         renderer, camera, OrbitControls, bloom, etichette, qualità adattiva; effetti per preset
    sphere-ao.js      occlusione ambientale analitica tra sfere (preset Professionale)
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
    lab-strings.js    testi dell'interfaccia del laboratorio nelle tre lingue
    bench-scene.js    scena 3D: atomi, legami, coppie solitarie, trascinamento
    palette.js        tavolozza degli elementi
    molecule-panel.js scheda della molecola
    lewis-svg.js      disegno della struttura di Lewis
    chem/             motore chimico puro (valenze, Lewis, VSEPR, SMILES, riconoscimento, Combina, reazioni,
                      simulate.js: quali reazioni avvengono tra le molecole sul banco)
    reaction-panel.js elenco e scheda delle reazioni, diagramma energetico, resoconto di «Simula reazione»
    data/reactions.js reazioni scritte a mano (nome, descrizione) e unione con il catalogo
    data/reactions-catalogo.js le 1349 reazioni del catalogo (ordine, gruppi, condizioni)
    data/molecules.js libreria di molecole, ioni e composti ionici (con ΔHf°)
    data/molecules-reazioni.js sostanze aggiunte per il catalogo delle reazioni (ioni monoatomici, complessi, silice…)
    data/reactions.js libreria delle reazioni
  game/               simulatore di laboratorio (il gioco)
    game-view.js      interfaccia: menu, HUD (legenda, finestrelle accanto agli oggetti), finestre, comandi; carica Rapier
    controls.js       legenda dei comandi in basso a destra (funzione pura), inclinazione, lancio a carica, clic o trascinamento
    game.js           il gioco: oggetti, presa e versamento, strumenti, calore, incidenti, rifiuti, esercitazioni
    mixture.js        chimica dei contenitori: fasi, pH, colore, solubilità, cristallizzazione, reazioni, calore
    reagents.js       solubilità, acidi e basi, idrati, gas tossici, metalli pesanti, reagenti dello scaffale, prezzi
    orders.js         le esercitazioni: preparazione del banco, passi, valutazione, stelle e soldi
    physics.js        Rapier: mondo a passo fisso, corpi, urti (rottura del vetro), raggi, controllore del personaggio
    room.js           l'aula di chimica: banconi, lavandino, cappa, cattedra, lavagna, rifiuti, doccia, luci
    items.js          vetreria e strumenti: profili reali, collisori, graduazioni, etichette
    liquid.js         livello del liquido a qualunque inclinazione, versamento, shader del liquido
    effects.js        gocce, vapore, fumo, gas, fiamme, pozze
    player.js         camminata in prima persona e camera della vista del bancone
    game-strings.js   testi del simulatore nelle tre lingue
  sandbox/            sandbox degli elementi
    substances.js     sostanze: elementi (dati reali), materiali, prodotti, sostanze della libreria; proprietà per il motore
    data/compounds.js dati fisici delle 554 sostanze della libreria (fusione, ebollizione, densità, colore, solubilità…)
    chemistry.js      le reazioni del catalogo per il motore: specie, condizioni, catalizzatori, indici per coppia
    world.js          motore: movimento, calore, cambi di stato, soluzioni, combustione, reazioni, elettricità, radioattività, esplosioni
    render.js         disegno: colori, incandescenza, fiamme colorate, scariche, vista termica, bagliore
    describe.js       nomi e formule generati, equazioni del registro, note sulle sostanze
    describe-strings.js, sandbox-strings.js  testi della sandbox nelle tre lingue
    shapes.js         linea, rettangolo, ellisse come elenco di celle
    presets.js        esempi pronti
    sandbox-view.js   interfaccia: tavolozza, strumenti, pennello, scheda, registro, tastiera
tests/lab/            test del motore chimico (npm test)
tests/sandbox/        test della sandbox (fisica, reazioni, equazioni bilanciate, esempi, sostanze e reazioni del catalogo, strumenti)
tests/i18n/           test delle lingue e del glossario della modalità Spiega
tests/gfx/            test dei preset grafici e dell'aspetto reale degli elementi
tests/game/           test del simulatore (chimica dei contenitori, fisica, liquidi e getto, legenda, esercitazioni e valutazione)
  styles/             token di design, layout, tavola, scheda, visualizzatore
scripts/
  build-data.mjs      genera e valida elements.json
  build-binding.mjs   genera binding-energies.json (X-ray Data Booklet)
  make-icon.mjs       genera build/icon.png (icona dell'app)
data-sources/         dati di origine (PubChem + dati curati in italiano)
build/icon.png        icona usata da electron-builder
```

## 13. Uso

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
| `F1` | modalità Spiega: poi evidenzia una parola o fai clic destro su qualsiasi cosa |
| `B` / `Q` | (3D) modello di Bohr / quantistico |
| `E` | (3D) esplodi o ricompatta il nucleo |
| `L` | (3D) etichette |
| `Spazio` | (3D) pausa / riproduci |
| `F` | (3D) mostra gli fps |
| clic su una particella | (3D) analisi della particella; `Esc` la chiude |
| `V` / `B` / `X` | (laboratorio) sposta / lega / forbici |
| `C` / `S` | (laboratorio) combina / separa |
| `R` | (laboratorio) simula la reazione tra le molecole sul banco (o selezionate) |
| `F` / `Ctrl+V` | (laboratorio) scrivi o incolla una formula, un nome o uno SMILES |
| `Ctrl+Z` / `Ctrl+Y` | (laboratorio) annulla / ripeti |
| `Canc` | (laboratorio) elimina la selezione |
| `Spazio` / `F` | (sandbox) pausa / avanza di un passo |
| `H` / `G` | (sandbox) vista termica / bagliore |
| `E` | (sandbox) gomma |
| `[` / `]`, rotella | (sandbox) pennello più piccolo / più grande |
| clic destro / centrale | (sandbox) cancella / preleva la sostanza |
| `Maiusc` + clic | (sandbox) linea dal punto precedente |
| `W A S D`, mouse | (simulatore) cammina e guarda (`Spazio`: corri; `Ctrl`: accovacciati) |
| clic sinistro | (simulatore) prendi, usa gli elementi fissi, posa (la sagoma mostra dove); sul lavandino con un recipiente: riempi |
| sinistro tenuto + mouse | (simulatore) con un recipiente: inclina per versare (lasciando il tasto torna dritto) |
| destro tenuto + mouse / clic destro | (simulatore) ruota l'oggetto / annulla la rotazione o rimetti a posto (sulla piastra: abbassa) |
| tasto centrale (tenuto) / rotella | (simulatore) carica e lancia / distanza o altezza dell'oggetto |
| `Maiusc` (tenuto) | (simulatore) con un oggetto in mano: manipolazione precisa (mouse sposta, sinistro + mouse alza, destro + mouse ruota, centrale lascia) |
| `E` / `Maiusc+E` | (simulatore) pulisci e usa gli strumenti: spatola, ansa, carta, cartina, estintore (un pizzico con la spatola); con un recipiente agita, al lavandino lava, sui rifiuti svuota |
| `Tab` / `A` `D` | (simulatore) vista del bancone / postazione precedente o successiva |
| `I` / `L` / `H` / `Esc` | (simulatore) finestrelle accanto agli oggetti / legenda dei comandi / tutti i comandi / pausa |
