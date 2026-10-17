# Changelog

Storico delle versioni di **Tavola Periodica 3D**. Ogni versione corrisponde a una fase di sviluppo
(vedi anche la tabella all'inizio del [README](README.md)). Formato ispirato a
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); il progetto usa il versionamento semantico (`0.<fase>.0`).

> **Nota sulla cronologia git.** Lo sviluppo è avvenuto prima della creazione di questo repository, quindi le fasi
> non hanno commit separati: questo file è la cronologia ufficiale. Il codice di ogni fase è tutto presente
> nella release più recente.

## [Non rilasciato]

### Aggiunto
- **Simulatore di laboratorio** (pulsante «Simulatore» nella barra in alto) — *prototipo giocabile*: un gioco in prima
  persona nel laboratorio di chimica della scuola, nello stile di *Cooking Simulator*.
  - Due visuali (prima persona e vista del bancone), fisica vera con Rapier (prendere, posare dove si guarda, lanciare,
    rovesciare, rompere la vetreria), versamento inclinando il recipiente con il livello del liquido sempre orizzontale e
    la portata che cresce con l'inclinazione (fino alla goccia singola).
  - Chimica dei contenitori: scioglimento con la solubilità alla temperatura, cristallizzazione anche come idrato, pH
    dal bilancio delle cariche, colori di ioni, indicatori e precipitati, ebollizione ed evaporazione, reazioni del
    catalogo con condizioni e calore. Modalità *realistica* e *semplificata*.
  - Carriera con 5 esercitazioni (soluzione di NaCl, titolazione, pioggia d'oro, cristalli di solfato di rame, saggio alla
    fiamma) valutate con stelle e soldi; Laboratorio libero con il magazzino delle 554 sostanze.
  - Incidenti (vetro rotto, pozze, fuoco ed estintore, gas tossici e cappa, esplosioni, schizzi e doccia di emergenza),
    pulizia della vetreria e contenitori dei rifiuti con le multe.
  - Testi in italiano, inglese e versione semplice; voce «Simulatore di laboratorio» nella modalità Spiega.
  - Test del simulatore (`tests/game/`): chimica dei contenitori, fisica, liquidi, esercitazioni e valutazione.
  - Interfaccia come in *Cooking Simulator*: legenda dei comandi piccola in basso a destra (icona del mouse o del
    tasto e azione) che cambia con l'oggetto in mano e con ciò che si guarda, attenua le azioni che con quel bersaglio
    non funzionano e illumina il tasto premuto (`L` la nasconde). Le informazioni importanti sono in finestrelle accanto
    agli oggetti: ciò che si guarda (nome nella fascia gialla, millilitri e contenuto, stato di piastra, rubinetto,
    bilancia…) e ciò che si tiene in mano (millilitri e «Versando»). Prendono il posto delle schede in basso.
  - Versamento più facile da controllare: il recipiente torna dritto quando si lascia il tasto sinistro (e smette di
    versare); un anello mostra dove cadrà il getto già prima della prima goccia (verde dentro un recipiente, nel
    lavandino o nei rifiuti, rosso se fa una pozza); la finestrella dice dove si sta versando. La portata ha una zona
    morta (il liquido resta attaccato al bordo fino a 0,5 mm di carico), una corsa del mouse più fine vicino al bordo e
    un massimo di 150 mL/s per un becher. Mentre si versa si può correggere la mira girando lo sguardo.
  - Getto continuo che si assottiglia cadendo e si ferma sugli ostacoli (il bordo di un altro becher, un oggetto in
    mezzo); il liquido arriva nel recipiente quando il getto lo tocca. L'oggetto guardato ha un contorno (verde per gli
    oggetti, ambra per gli elementi fissi).
  - Le pozze di una soluzione, evaporando, lasciano un alone di residuo secco (anche la polvere versata) da pulire
    con la carta: finché resta conta nel disordine della valutazione. L'aiuto (`H`) spiega legenda, finestrelle e anello.
  - Sgabelli spingibili: il giocatore li sposta camminandoci contro e non ci resta più bloccato nel corridoio tra i
    banconi; tornano al loro posto a ogni partita. La vetreria a terra non ferma più il giocatore.
  - Comandi uguali a quelli di *Cooking Simulator*: clic sinistro per prendere, usare gli elementi fissi e posare, con
    una sagoma verde (o rossa) dove si poserà l'oggetto, che al clic ci scivola in meno di 0,3 s; sinistro tenuto + mouse
    per versare; destro tenuto + mouse per ruotare (anche il beccuccio da cui si versa) e clic destro per annullare la
    rotazione o rimettere l'oggetto dove lo si era preso; tasto centrale tenuto per caricare il lancio (anello attorno
    al mirino); `Maiusc` tenuto con un oggetto in mano per la manipolazione precisa (il mouse sposta, sinistro + mouse
    alza, destro + mouse ruota e versa goccia a goccia, il tasto centrale lascia l'oggetto fermo); `Spazio` per correre
    e `Ctrl` per accovacciarsi; clic sul lavandino con un recipiente per portarlo sotto il rubinetto (l'acqua scorre
    tenendo premuto il sinistro, la rotella regola il getto, il clic destro smette); `E` pulisce e usa gli strumenti.
- **Preset grafici** (pulsante con lo schermo nella barra in alto): *Semplice* per i computer poco potenti (niente
  post-processing, meno segmenti e punti, sandbox senza bagliore, niente sfocature e animazioni continue
  nell'interfaccia), *Medio* (la grafica di prima, predefinito) e *Professionale*: sovracampionamento, MSAA 4×, tone
  mapping *Khronos PBR Neutral*, riflessi di uno studio fotografico, ombre morbide, occlusione ambientale analitica tra
  le sfere, materiali fisici con vernice trasparente, sfere più dettagliate e orbitali con 2,2× punti; nella sandbox trame
  dei materiali, rilievo e liquidi con profondità e superficie lucida. La qualità scende da sola se il computer non regge.
- **Aspetto reale degli elementi** (preset Professionale): campione 3D di ogni elemento puro con colori e materiali veri
  (metalli con la riflettanza misurata, cristalli, gas che brillano del colore della loro scarica in ampolle di vetro,
  bromo liquido, goccia di mercurio, bismuto iridescente), nella scheda, nell'anteprima e in miniatura nelle celle.
- Test dei preset grafici e dell'aspetto reale (`tests/gfx/gfx.test.mjs`).
- **Lingue**: italiano, inglese e «Spiegamelo come se avessi 6 anni» (italiano con parole semplici), dal globo nella
  barra in alto. Tradotti interfaccia, schede dei 118 elementi, visualizzatore 3D e analisi delle particelle, laboratorio
  (554 sostanze, 1349 reazioni, nomi IUPAC generati), sandbox (strumenti, schede, registro, esempi) e menu dell'app
  desktop. La scelta resta salvata; cambiando lingua l'app riapre l'elemento che si stava guardando.
- **Modalità Spiega** (`F1` o pulsante a fumetto): evidenziando un testo o facendo clic destro su qualsiasi cosa si apre
  una scheda che spiega termini di chimica e fisica, famiglie, gruppi, periodi, elementi, sostanze, funzioni
  dell'interfaccia e tasti, con scorciatoie, «Vedi anche» e cronologia. Glossario di 144 voci in tre lingue.
- Test delle lingue e del glossario (`tests/i18n/i18n.test.mjs`).
- **Sandbox degli elementi** (pulsante «Sandbox» nella barra in alto e nella scheda dell'elemento): una sabbiera a
  particelle in stile *The Powder Toy* con i 118 elementi e i materiali di base — legno, carbone, calcestruzzo, muro
  indistruttibile — più generatore elettrico, acqua, sale, ruggine e CO₂.
  - Stati fisici dalle temperature reali di fusione ed ebollizione (posa come solido, liquido o gas, polvere o blocco,
    a una temperatura scelta), stratificazione con le densità reali, galleggiamento dei gas secondo massa molare e
    temperatura, conduzione del calore, incandescenza e vista termica.
  - Combustione con l'aria (legno, carbone, carbonio, zolfo, fosforo, idrogeno, metalli in polvere), pirolisi del legno,
    fiamme colorate dei metalli (saggio alla fiamma), estinzione con acqua e CO₂.
  - Reazioni: metalli alcalini e alcalino-terrosi + acqua, metallo + alogeno → sale, alluminotermia, ruggine;
    nomi e formule dei prodotti generati (es. cloruro di ferro(III), FeCl₃).
  - Elettricità: scintille e generatore nei conduttori, scarica colorata nei gas nobili, effetto Joule, elettrolisi
    dell'acqua e dei sali fusi; semiconduttori che conducono solo da caldi.
  - Radioattività dell'isotopo principale con tempo accelerato in scala logaritmica (catene reali, elio dal decadimento α,
    radiazione schermata dal piombo); fissione indotta da neutroni con frammenti reali, moderatori, assorbitori e
    riflettori; esplosioni (il calcestruzzo resiste, il muro è indistruttibile).
  - Registro delle reazioni osservate con equazioni bilanciate, decadimenti, fissioni e cambiamenti di stato; scheda della
    sostanza selezionata; 11 esempi pronti; pausa, passo singolo, velocità, bordi aperti, tre dimensioni della griglia.
  - Test: `tests/sandbox/sandbox.test.mjs` (fisica, reazioni, determinismo, equazioni bilanciate, esempi).
- **Tutte le 554 sostanze della libreria nella sandbox**: nuova sezione «Sostanze della libreria» nella tavolozza, per
  gruppi e con ricerca per nome o formula. Ogni sostanza ha dati fisici propri (`src/sandbox/data/compounds.js`:
  fusione, ebollizione, densità, colore, solubilità, infiammabilità, accensione) e note nella scheda.
  - **Soluzioni acquose**: i sali solubili, gli acidi e le basi si sciolgono e diffondono nell'acqua colorandola (posa
    «In soluzione»); bollendo, il soluto cristallizza; gli ioni esistono solo in acqua; le soluzioni ioniche conducono.
  - **Reazioni del catalogo nella sandbox** (`src/sandbox/chemistry.js`): 1149 delle 1349 reazioni girano con
    coefficienti, condizioni (soluzione, calore, innesco, luce, scintilla), catalizzatori e calore dal ΔH°; 93 sono già
    coperte dalle regole «a mano»; 107 restano escluse con il motivo (equilibri, catalizzatori non specificati o assenti,
    organismi viventi). Precipitazioni, neutralizzazioni, metalli e acidi, combustioni, decomposizioni termiche,
    carbonizzazione dei composti organici, detonazioni a catena degli esplosivi.
  - Le regole «a mano» producono le sostanze della libreria (NaCl, MgO, Fe₂O₃, NaOH in soluzione…).
  - 6 nuovi esempi: precipitazioni colorate, combustibili, acqua ossigenata e catalizzatore, metalli e acido cloridrico,
    acqua salata ed evaporazione, esplosivi.
  - Test: `tests/sandbox/compounds.test.mjs` (dati delle 554 sostanze, catalogo, soluzioni, precipitazione,
    combustione, catalizzatore, decomposizione, detonazione, metalli e acidi, carbonizzazione).
- **Nuovi strumenti nella sandbox**:
  - **Mescola** (`M`): rimescola polveri, liquidi, gas e soluzioni nel pennello e ne uguaglia in parte la temperatura,
    per formare miscele (ferro + zolfo, polvere nera) che poi reagiscono; i blocchi restano fermi e i liquidi di
    densità diversa si separano di nuovo da soli.
  - **Vento** (`W`), **Ambiente** (riporta a 22 °C), **Estintore** (spegne fiamme e braci), **Pipetta** (sceglie la sostanza).
  - Materiali **Sorgente** (clona all'infinito la sostanza che tocca) e **Pozzo** (cancella ciò che lo tocca).
  - **Modi di disegno**: Pennello, Riempi (secchiello sulla regione chiusa), Linea, Rettangolo ed Ellisse (pieni o solo
    contorno, con anteprima); **Annulla / Ripeti** (`Ctrl + Z` / `Ctrl + Y`, 12 passi).
  - 2 nuovi esempi: «Miscele con Mescola» e «Sorgenti, pozzi e vento».
  - Test: `tests/sandbox/tools.test.mjs`; modulo `src/sandbox/shapes.js`.
- **Tutte le 1349 reazioni del catalogo nel laboratorio**: il pulsante «Reazioni» le elenca in 14 gruppi divisi in
  sottogruppi (si aprono uno alla volta) e una **ricerca** trova una reazione da formula, sostanza o parola. Le 1302
  nuove hanno equazione, condizioni e nota; le 47 già presenti conservano nome e descrizione. Per ognuna sono
  disponibili scheda, «Bilancia tu», ΔH° (dove le entalpie sono note), diagramma energetico e «Avvia la reazione».
- Dati: `src/lab/data/reactions-catalogo.js` (generato dal catalogo); `reactions.js` unisce le due liste.

### Modificato
- **Simulatore: luce e leggibilità** (fase G1 del [piano del gioco base](docs/superpowers/specs/2026-10-14-gioco-base-piano.md)).
  L'aula non è più quasi bianca: pareti verde salvia, linoleum e mobili grigio ardesia, strumenti grigio chiaro, piano
  della cappa nero. Meno luce (emisferica bassa, finestra, due plafoniere sopra i banconi al posto di una lampada forte)
  e tone mapping neutro in tutti i preset, che conserva i colori veri delle soluzioni. Il vetro è limpido al centro e
  più chiaro sui bordi (effetto Fresnel), con il labbro della bocca in evidenza: non sembra più plastica grigia. Ogni
  oggetto ha un'ombra di contatto, che sbiadisce sollevandolo e mostra sopra quale punto lo si tiene.
- **Simulatore: reagenti riconoscibili** (fase G2 del piano). Ogni reagente ha il suo contenitore, scelto dai dati:
  barattoli di vetro, di vetro ambrato e di plastica per i solidi; bottiglie di vetro, di vetro ambrato (ciò che la luce
  decompone) e flaconi di plastica (basi forti, HF) per le soluzioni. Il tappo ha il colore della famiglia (rosso acidi,
  blu basi, bianco sali, giallo ossidanti, grigio metalli, verde organici, viola indicatori, azzurro acqua), spiegato da
  una legenda sullo scaffale, e si toglie mentre si usa il reagente. Le etichette hanno la fascia della famiglia, nome,
  formula, concentrazione, l'avvertenza e i pittogrammi GHS veri dei reagenti dello scaffale (dalle schede di
  sicurezza, alla concentrazione del gioco); per le altre sostanze del magazzino i pericoli sono dedotti dai dati. Il
  contenuto dei barattoli si vede, con la grana di polveri e cristalli. Lo scaffale del Laboratorio libero è in ordine
  di famiglia. Nuove voci della modalità Spiega: «Colore del tappo» e «Pittogrammi di pericolo».
- **Simulatore: reazioni al centro del gioco** (fase G3 del piano). Le reazioni si vedono: bolle di gas che salgono dal
  fondo, gas colorati del loro colore, fiocchi di precipitato che scendono, cambi di colore graduali, la fiammella lilla
  del potassio nell'acqua. La finestrella del contenitore mostra le reazioni appena avvenute con l'equazione bilanciata e
  gli stati fisici, il ΔH° e che cosa si osserva; se non succede niente (nel Laboratorio libero e nella chimica
  semplificata) spiega perché: calore, fiamma, catalizzatore, luce, acqua o un reagente che mancano, un metallo meno
  attivo nella serie di attività (potenziali standard del CRC Handbook), o una reazione che chiede corrente, raggi UV o
  vapore. Nuovo **quaderno di laboratorio** (`N`): le reazioni scoperte restano tra una partita e l'altra, divise nei 14
  gruppi del catalogo con la percentuale, e si aprono nel laboratorio molecolare. Nuova **lampada a luce forte** sul
  bancone per le reazioni fotochimiche (lente, come nella realtà). La temperatura accelera le reazioni lente (fattore di
  Arrhenius). Nuovo **armadio della scuola** nel magazzino (47 reagenti d'uso divisi per famiglia): con lo scaffale si
  fanno 383 reazioni invece di 144 (`scripts/coverage.mjs`, test della copertura per gruppo). Sodio, potassio e litio
  sullo scaffale, sotto olio di paraffina. Più veloce camminare (3 m/s) e correre (5,2 m/s); campo visivo regolabile nel
  menu e nella pausa; barattoli +15 % e bottiglie +10 %. Voci della modalità Spiega «Quaderno di laboratorio» e «Serie di
  attività dei metalli».
- **Simulatore: strumenti del laboratorio** (fase G4 del piano). **Termometro** e **pH-metro** che si immergono nel
  recipiente e si leggono nella finestrella; **pipetta graduata** da 10 mL (tutta o un millilitro alla volta);
  **buretta** da 50 mL su sostegno con lo zero in alto, la scala a 0,05 mL e il rubinetto a quattro posizioni (chiuso,
  goccia a goccia, a filo, aperto); **imbuto con la carta da filtro**, che trattiene il precipitato; nuova postazione di
  **distillazione** con il pallone sul mantello riscaldante, la testa con il termometro e il refrigerante, da cui
  gocciolano i vapori che condensano (da acqua ed etanolo distilla prima l'etanolo, a 78 °C); **bagno di ghiaccio**;
  **crogiolo** e **capsula di porcellana**, che reggono il Bunsen fino al rosso; la **pinza** per i recipienti che
  scottano (sopra i 60 °C a mani nude non si prendono). Sotto la cappa l'**alimentatore** da 0 a 12 V con gli elettrodi di
  grafite fa le **elettrolisi** del catalogo con la legge di Faraday (corrente solo con un elettrolita; se l'acqua è
  distillata il gioco spiega che non conduce) e cinque **bombole** (O₂, H₂, CO₂, Cl₂, NH₃) fanno gorgogliare il gas nel
  recipiente all'uscita. Con l'alimentatore e le bombole le reazioni realizzabili diventano 315 con lo scaffale (erano
  153) e 494 con l'armadio (erano 395); il simulatore ne sa fare 1231. Il **quaderno** è un oggetto sul bancone e ha un
  **tutorial** di 17 pagine illustrate, dai comandi alle tecniche. Con un oggetto in mano `A` e `D` lo ruotano; barattoli e
  bottiglie presi in mano mostrano l'etichetta a chi li tiene; camminata a 3,6 m/s e corsa a 6,2 m/s (+20 %). Nuove voci
  della modalità Spiega: strumenti del laboratorio, titolazione, filtrazione, distillazione, elettrolisi.
- **Entalpie di formazione** standard di 176 sostanze comuni (NBS, CRC Handbook, NIST: sali, ossidi, alogenuri, ioni in
  acqua, alcuni composti organici; `src/lab/data/formation-enthalpies.js`): il ΔH° si conosce per 1045 reazioni del
  catalogo invece di 599, nel laboratorio molecolare, nella sandbox e nel simulatore.
- Simulatore: la neutralizzazione libera 55,8 kJ per mole d'acqua solo con una base forte; aceto e bicarbonato usano il
  ΔH° della reazione e raffreddano un po', come nella realtà. Le soluzioni quasi incolori (acido nitrico diluito) non
  prendono più la tinta del solido. Gli elementi biatomici si scrivono H₂, O₂, Cl₂ nelle equazioni e negli avvisi.
- La Content Security Policy permette la compilazione di WebAssembly (`'wasm-unsafe-eval'`, non `eval` di JavaScript):
  serve al motore fisico Rapier del simulatore.
- «Simula reazione» non esegue le reazioni che richiedono altro (catalizzatori, soluzione acquosa, enzimi) né gli
  equilibri (⇌), e li segnala nel resoconto. Con più reazioni note, alcune catene cambiano (es. dopo la calcinazione e
  lo spegnimento della calce, l'acqua di calce riassorbe la CO₂).
- «Avvia la reazione»: il numero di atomi dei reagenti tiene conto dei coefficienti; se supera i 150 atomi del banco il
  pulsante è disattivato e la scheda lo spiega.
- Test: bilanciamento e conservazione della carica per tutte le 1349 reazioni; il modello di «sintesi per addizione» si
  prova con le sole reazioni scritte a mano.

### Corretto
- Simulatore: il poster della tavola periodica mostrava «undefined» al posto dei numeri atomici.
- Simulatore: la modalità Spiega elencava i vecchi comandi (versare con il tasto destro, lanciare con `Q`).
- Simulatore: la soluzione di HCl dello scaffale si chiamava «Cloruro di idrogeno» (il gas) invece di «Acido cloridrico»,
  sull'etichetta e, dopo un travaso, nella finestrella del contenitore.
- Simulatore: un pezzo di metallo sul fondo (lo zinco nell'acido) era descritto come «precipitato».

## [0.7.0] — 2026-10-11 — Catalogo delle reazioni

Note di release complete (con l'elenco delle 109 sostanze e delle 1349 reazioni): [docs/release-0.7.0.md](docs/release-0.7.0.md).

### Aggiunto
- **Catalogo delle reazioni** ([docs/catalogo-reazioni.md](docs/catalogo-reazioni.md)): 1349 reazioni reali e
  bilanciate, scritte solo con sostanze della libreria o elementi, in 14 sezioni (sintesi, combustioni,
  decomposizioni, acqua, acidi e basi, ioni, precipitazioni, spostamento, ossidoriduzioni, metallurgia, industria,
  chimica organica, biochimica), con condizioni, note ed entalpia di reazione dove è nota. Comprende tutte le
  47 reazioni attuali; il motore non lo carica ancora.
- **109 nuove sostanze** nella libreria «Esempi» (ora 554), necessarie alle reazioni del catalogo: ioni monoatomici
  (Na⁺, K⁺, Ag⁺, Ca²⁺, Ba²⁺, Pb²⁺, Cu²⁺, Zn²⁺, Fe²⁺, Fe³⁺, Mn²⁺, Cr³⁺, Cl⁻, Br⁻, I⁻, con ΔHf° in soluzione), complessi
  ([Cu(NH₃)₄]²⁺, [Ag(NH₃)₂]⁺, [Fe(SCN)]²⁺, [Ag(S₂O₃)₂]³⁻), ione tetrationato, silice e silicati, sali di manganese,
  cromo, piombo, ferro, rame e argento, idrati (CuSO₄·5H₂O, CoCl₂·6H₂O, gesso), acidi dell'oro e del platino,
  composti dell'uranio, composti organici di base (nitrobenzene, etilbenzene, cumene, tristearina, sapone,
  sorbitolo, glicilglicina…). Un atomo isolato con carica (es. Na⁺ ottenuto con ±e⁻) ora è riconosciuto come lo ione
  della libreria.
- **Reazione della polvere nera** (2 KNO₃ + S + 3 C → K₂S + N₂ + 3 CO₂, ΔH° ≈ −572 kJ) nel gruppo «Altre
  reazioni»; il nitrato di potassio ha ora l'entalpia di formazione (−494,6 kJ/mol).

### Modificato
- Struttura di Lewis: un metallo con carica in un frammento (es. Fe³⁺ nel complesso [Fe(SCN)]²⁺) tiene solo gli
  elettroni che gli restano dopo averne ceduti come ione. Non cambia nessuna voce della libreria esistente.

## [0.6.0] — 2026-10-11 — Simula reazione

### Aggiunto
- **Simula reazione** (`R`): le molecole sul banco (o quelle selezionate) si agitano e si urtano; con un urto efficace
  i legami rotti diventano rossi, i nuovi verdi, un bagliore e un'etichetta mostrano l'energia liberata o assorbita (ΔH).
  Sceglie le reazioni della libreria possibili con le molecole presenti (reagente limitante, molecole in eccesso,
  reazioni contemporanee e a catena); fuori libreria prevede le sintesi per addizione verso sostanze note
  (H₂ + Br₂ → 2 HBr, SO₃ + H₂O → H₂SO₄) se sono abbastanza esotermiche. Se non succede nulla le molecole rimbalzano
  e il resoconto spiega perché, con «Aggiungi e simula» (reagenti mancanti) e «Fornisci energia e simula»
  (reazioni endotermiche). `Ctrl+Z` annulla l'intera simulazione.
- Test della simulazione (`tests/lab/simulate.test.mjs`).

### Corretto
- Gli oggetti 3D del banco appena ricreati (legami, coppie solitarie) non compaiono più per un fotogramma ingranditi
  al centro della scena durante le reazioni.
- `Ctrl+Z` / `Ctrl+Y` durante l'animazione di una reazione non lasciano più il banco in uno stato incoerente.

## [0.5.0] — 2026-10-11 — Fase 5: Reazioni

Il laboratorio molecolare passa dalle molecole alle trasformazioni chimiche.

### Aggiunto
- **Libreria di 45 reazioni** in 5 gruppi: sintesi, combustioni, decomposizioni, acidi e basi, altre
  (fotosintesi, fermentazione, termite, idrogenazione…).
- **Equazioni con stati fisici**, es. `CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(l)`.
- **Modalità «Bilancia tu»**: si parte con tutti i coefficienti a 1; una tabella conta gli atomi di ogni elemento
  nei due lati e segnala quando l'equazione è bilanciata (o semplificabile); «Mostra la soluzione» rivela i coefficienti.
- **Bilanciamento algebrico** (spazio nullo intero della matrice degli atomi): vale per qualsiasi equazione.
  I test verificano che tutte le 45 reazioni siano bilanciate con i coefficienti minimi.
- **Energia di reazione**: ΔH° dalle entalpie di formazione standard (NIST, CRC), diagramma energetico
  (esotermica/endotermica, energia di attivazione solo indicativa) e, per le molecole covalenti, stima
  «legami rotti − legami formati».
- **Animazione «Avvia la reazione»**: i reagenti si avvicinano, i legami che si rompono diventano rossi, gli atomi si
  riorganizzano e i nuovi legami compaiono in verde. Se i reagenti sono già sul banco la reazione usa proprio quelli;
  la scheda del banco propone le «Reazioni possibili». `Ctrl+Z` annulla l'intera reazione.
- **Combina** mostra ora anche l'energia (es. 2 H₂ + O₂ → 2 H₂O, ΔH ≈ −482 kJ/mol).

## [0.4.0] — 2026-10-11 — Fase 4: Laboratorio molecolare

Nuovo ambiente in cui si collegano gli atomi per formare molecole e composti (e si scompongono in atomi).

### Aggiunto
- **Banco di lavoro 3D** con tavolozza degli elementi (clic o trascinamento); apertura dalla barra in alto o con
  «Usa nel laboratorio» nella scheda di un elemento.
- **Legami**: trascinamento di un atomo vicino a un altro con anteprima verde/rossa che spiega se il legame è
  possibile; strumento **Lega** (anche per gli anelli); ordine del legame (singolo → doppio → triplo); **Forbici** / tasto destro per rompere.
- **Combina** (`C`): costruisce la struttura più stabile dagli atomi (2 H + O → H₂O, Na + Cl → NaCl,
  C₂H₆O → etanolo con l'etere dimetilico come isomero alternativo). **Separa** (`S`): scompone in atomi o, per i
  composti ionici, in ioni. **±e⁻** per ioni e radicali (NH₃ + H⁺ → NH₄⁺).
- **Motore chimico** (valenze, Lewis, VSEPR, SMILES, riconoscimento con impronta del grafo Weisfeiler–Lehman):
  tipo di legame da ΔEN di Pauling, struttura di Lewis con cariche formali e disegno 2D in SVG, forma 3D con
  rilassamento (raggi covalenti, angoli VSEPR o sperimentali).
- **Libreria «Esempi»**: 445 sostanze in 14 gruppi con ricerca per nome o formula — almeno un composto per ogni
  elemento che ne forma fino all'einsteinio, idrocarburi, composti organici, biomolecole (amminoacidi, zuccheri,
  basi del DNA), farmaci e aromi, ioni, sali, composti di metalli di transizione, lantanidi e attinidi.
- **Formula** (`F` / `Ctrl+V`): formule con parentesi, idrati e cariche (`K4[Fe(CN)6]`, `CuSO4·5H2O`, `SO₄²⁻`),
  più sostanze (`2 H2 + O2`), nomi italiani (`acqua`, `aspirina`) e SMILES; anteprima con massa molare e
  composizione percentuale in massa.
- **Nomi generati** per composti ionici, molecole binarie e alcani lineari; annulla/ripeti (`Ctrl+Z` / `Ctrl+Y`).
- **Test automatici** del motore chimico (`npm test`).

### Note
- Limiti dichiarati nell'app: le soglie di ΔEN sono una convenzione; per i metalli d/f le strutture sono
  «non verificate»; le geometrie fuori libreria sono stime; il legame metallico non è simulato.
- Documento di progetto: [docs/superpowers/specs/2026-10-11-laboratorio-molecolare-design.md](docs/superpowers/specs/2026-10-11-laboratorio-molecolare-design.md).

## [0.3.0] — 2026-10-11 — Fase 3: Analisi delle particelle

### Aggiunto
- **Clic su protone, neutrone o elettrone**: mirino sulla particella, camera che si avvicina e la segue
  (anche mentre l'elettrone orbita o il nucleo esplode), scheda di analisi a sinistra; `Esc` chiude.
- **Protone**: carica, massa (kg, MeV/c², u – CODATA 2022), spin, quark uud, raggio di carica, stabilità,
  ruolo di Z e energia di legame del nucleo.
- **Neutrone**: carica 0 (udd), differenza di massa col protone, decadimento β⁻ del neutrone libero (878 s, PDG 2024),
  stabilità nell'isotopo scelto, isotopi naturali, N/Z.
- **Elettrone**: guscio, sottolivello, orbitale, i quattro numeri quantici spiegati, Pauli / Hund,
  **energia di legame** da fonti a priorità (1ª ionizzazione NIST → X-ray Data Booklet per Z ≤ 92, con livelli
  separati dallo spin-orbita → stima con le regole di Slater).
- **Quark**: avvicinandosi a un nucleone (o «Guarda dentro: i quark») compaiono i tre quark di valenza con carica di
  colore, i gluoni come molle che scambiano colore e le coppie quark–antiquark virtuali (rappresentazione schematica).
- Nuove sorgenti dati: `binding-energies.json` (X-ray Data Booklet, LBNL), energie di legame nucleari AME2020 (A ≤ 22).

## [0.2.0] — 2026-10-11 — Fase 2: Visualizzatore 3D dell'atomo

### Aggiunto
- **Modello di Bohr**: nucleo e un anello per guscio (K, L, M…) con il numero corretto di elettroni.
- **Modello quantistico**: nuvole di probabilità degli orbitali occupati (|ψ|² idrogenoide, polinomi di Laguerre ×
  armoniche sferiche reali, colore = segno di ψ), regola di Hund, orbitali attivabili singolarmente.
- **Nucleo**: protoni e neutroni impacchettati per rilassamento di sfere rigide; «Esplodi il nucleo»;
  selettore di isotopo che aggiunge o toglie neutroni in tempo reale.
- Controlli con mouse (OrbitControls), pausa e velocità, interruttori per etichette, gusci, orbitali e assi;
  descrizioni al passaggio del mouse; nota di scala (nucleo vs atomo).
- **Prestazioni**: `InstancedMesh` per protoni/neutroni/elettroni, raycasting con sfere di contenimento,
  qualità adattiva (prima bagliore, poi risoluzione); Oganesson (294 nucleoni, 118 elettroni, 59 orbitali) ben oltre 60 fps.
  Three.js caricato solo alla prima apertura del visualizzatore.

## [0.1.0] — 2026-10-11 — Fase 1: Tavola periodica

Prima versione dell'applicazione desktop (Electron + Vite), interamente offline e in italiano.

### Aggiunto
- **Tavola periodica interattiva** dei 118 elementi con anteprima al passaggio del mouse e navigazione da tastiera.
- **Scheda dell'elemento** con dati in italiano: pesi atomici IUPAC/CIAAW, isotopi (abbondanze IUPAC, emivite
  NUBASE), configurazione elettronica, stati di ossidazione, punti di fusione/ebollizione, densità,
  elettronegatività, raggi, storia, origine del nome, usi, presenza in natura.
- **Ricerca** per nome (anche senza accenti), simbolo o numero atomico; **filtri** per categoria, stato fisico a
  25 °C e blocco s/p/d/f; evidenziazione di gruppi, periodi e categorie.
- **Pipeline dati**: `npm run data` genera e valida `elements.json` (PubChem + dati curati; 118 elementi, campi
  obbligatori, somma delle abbondanze, elettroni per guscio). Elementi con dati stimati o previsti segnalati con avviso.
- **Eseguibile Windows** (installer NSIS e versione portabile) tramite electron-builder; sicurezza Electron
  (`contextIsolation`, sandbox); font IBM Plex inclusi.

[0.5.0]: https://github.com/G43r0/tavola-periodica-3d/releases/tag/v0.5.0
