# Simulatore di laboratorio — design

Data: 2026-10-13 · Stato: prototipo giocabile (fase 9)

## Obiettivo

Un terzo laboratorio che sia un **gioco** con l'interazione di *Cooking Simulator*, ma in un laboratorio di chimica:
si cammina nella stanza, si prendono la vetreria e i reagenti, si pesa, si versa inclinando il contenitore, si scalda,
si consegnano i preparati e si viene valutati con stelle e soldi. Sotto il gioco la chimica resta quella dell'app
(le 554 sostanze della libreria con i dati fisici della sandbox, le 1349 reazioni del catalogo). Modelli e grafica sono
costruiti nel codice: nulla viene preso dal gioco commerciale.

## Decisioni prese con l'utente

| Tema | Scelta |
|------|--------|
| Visuale | Prima persona **e** vista dall'alto del bancone (`Tab` per passare dall'una all'altra) |
| Modalità | Carriera, Laboratorio libero, Tutorial guidato, Sfide a tempo |
| Fisica | Realistica: motore fisico vero (Rapier), oggetti che cadono, si rovesciano, si rompono; si versa inclinando |
| Chimica | Due modalità scelte all'inizio: **realistica** (grammi, mL, concentrazioni, tolleranze strette) e **semplificata** (dosi esatte, aiuti, tolleranze larghe) |
| Sicurezza | **Incidenti** (fuoco, esplosioni, gas tossici, vetro rotto; estintore, cappa, doccia di emergenza) e **pulizia e rifiuti** (lavare la vetreria, smaltire nel contenitore giusto). Niente DPI obbligatori, niente salute del personaggio |
| Progressi | Soldi e negozio; reputazione che sblocca clienti più difficili |
| Ambientazione | **Laboratorio scolastico**: lo studente fa le esercitazioni assegnate dall'insegnante |
| Prima versione | **Prototipo giocabile**: stanza, controlli e fisica con pochi strumenti e 5 ordini, per provare i comandi |

## Prototipo (questa fase)

Contiene: la stanza, le due visuali, la fisica, il motore chimico dei contenitori, gli incidenti, la pulizia,
5 esercitazioni della Carriera con stelle e soldi e il Laboratorio libero (magazzino con tutte le sostanze).
Rimandati alle fasi successive: negozio e ampliamenti, reputazione, tutorial completo, sfide a tempo, buretta, pipetta,
filtrazione, distillazione, audio.

### Comandi

| | Prima persona | Vista del bancone |
|---|---|---|
| Muoversi | `W A S D` (`Maiusc` corre), mouse per guardare | `A` / `D` cambia postazione |
| Prendere / posare | clic sinistro | clic sinistro (l'oggetto segue il puntatore) |
| Versare | tieni premuto il tasto destro e muovi il mouse in su/giù: l'inclinazione segue il mouse; lasciando il tasto il recipiente torna dritto; di lato si corregge la mira | uguale |
| Lanciare | `Q` | — |
| Usare | `E` (manopole, rubinetto, bilancia, campanello, cappa, doccia; con uno strumento in mano: spatola, ansa, carta, cartina, estintore) | uguale |
| Distanza / altezza | rotella | rotella |
| Altro | `Tab` cambia visuale, `I` finestrelle accanto agli oggetti, `L` legenda dei comandi, `H` comandi, `Esc` pausa | |

### Moduli (`src/game/`)

| File | Contenuto |
|------|-----------|
| `game-view.js` | interfaccia a schermo intero, menu, ciclo di gioco, caricamento su richiesta di Rapier |
| `game-strings.js` | testi nelle tre lingue |
| `mixture.js` | **motore chimico dei contenitori** (puro, testato): moli per sostanza, fasi (sciolta, liquida, solida, gas), temperatura, volume, massa, pH (bilancio delle cariche con acidi e basi forti e deboli), colore, solubilità con la temperatura, cristallizzazione e idrati, reazioni del catalogo con le loro condizioni, calore di reazione, evaporazione |
| `reagents.js` | dati del gioco: solubilità, costanti acide/basiche, indicatori, reagenti dello scaffale, prezzi, classi dei rifiuti |
| `orders.js` | le 5 esercitazioni: testi, preparazione del banco, avanzamento dei passi, valutazione (stelle, soldi, resoconto) |
| `physics.js` | Rapier: mondo, corpi, sensori, eventi di contatto per la rottura, controllore del personaggio |
| `room.js` | l'aula di chimica: pavimento, pareti, finestre, banconi, lavandino, cappa, cattedra, lavagna, contenitori dei rifiuti, doccia, scaffali |
| `items.js` | vetreria e strumenti: forme (profili di rivoluzione), collisori, capacità, bordo e becco |
| `liquid.js` | disegno dei liquidi (superficie sempre orizzontale), livello del liquido da campioni del volume interno, versamento |
| `effects.js` | fiamme, fuoco, fumo e gas, vapore, schizzi, gocce, pozze, frammenti di vetro, esplosioni |
| `player.js` | camera in prima persona (capsula con il controllore del personaggio) e camera del bancone |
| `controls.js` | legenda dei comandi (funzione pura `legendRows`), ritorno e sensibilità dell'inclinazione |

L'HUD (mirino, legenda, finestrelle accanto agli oggetti, scheda dell'esercitazione, soldi, avvisi) è in `game-view.js`.

### Liquidi e versamento

Il volume interno di ogni contenitore è campionato con ~300 punti. Il livello del liquido è il quantile dei punti
(in altezza nel mondo) pari alla frazione riempita: resta orizzontale qualunque sia l'inclinazione. Il liquido sopra il
punto più basso del bordo esce da lì: la portata cresce con il volume che sporge (poche gocce se si inclina appena,
un getto se si inclina molto). Il getto cade con una parabola; se attraversa la bocca di un altro contenitore il liquido
vi passa, altrimenti forma una pozza dove tocca. Lo shader del liquido scarta i frammenti sopra il livello e disegna le
facce interne come superficie.

Aggiornamento dopo la ricerca su *Cooking Simulator* (`reports/Oggetti e fluidi in Cooking Simulator.md`): la
portata è in `pourRate` (`liquid.js`) con una zona morta di 0,5 mm e un massimo di 150 · flow mL/s; vicino al bordo il
mouse inclina più finemente; un anello verde o rosso mostra il punto d'arrivo prima della prima goccia; il getto è un
tubo che si assottiglia (continuità) e si ferma sugli ostacoli lungo la parabola; il liquido arriva dopo il tempo di
volo. Una pozza evaporata lascia un alone di residuo secco da pulire.

### Interfaccia

Come in *Cooking Simulator*: in basso a destra una legenda piccola (icona del tasto e azione) che cambia con l'oggetto
in mano e con ciò che si guarda; le informazioni importanti in finestrelle agganciate agli oggetti (a sinistra di ciò
che si guarda: nome in una fascia, millilitri e contenuto; a destra dell'oggetto in mano: millilitri e dove si sta
versando); contorno sull'oggetto guardato. Gli sgabelli sono arredi dinamici che il giocatore spinge.

Rimandato (passi 10–14 del piano nel report): anteprima del punto di posa, lancio a carica, rotazione con `R`,
manipolazione precisa con `Maiusc` e corsa con la barra spaziatrice, rubinetto che riempie tenendo premuto `E`.

### Chimica dei contenitori

- Sostanze: quelle della sandbox (`createSubstances`), quindi gli stessi dati fisici; le reazioni da `buildChemistry`
  con le stesse condizioni (soluzione, Δ, innesco, catalizzatori).
- Solubilità in g/100 g d'acqua in funzione della temperatura per i sali usati (CRC Handbook), 50 g/100 g per gli altri
  sali solubili; gli insolubili precipitano. L'eccesso cristallizza (CuSO₄ come pentaidrato).
- pH: bilancio delle cariche risolto per bisezione con acidi e basi forti e deboli (Ka, Kb). Indicatori: fenolftaleina
  (incolore sotto 8,2, rosa sopra) e cartina universale.
- Calore: capacità termica di contenuto e vetro; piastra e becco Bunsen come potenze; raffreddamento verso 22 °C;
  ebollizione ed evaporazione. Il tempo termico è accelerato (×4) perché il gioco non sia lento.
- Calore di reazione: ΔH° del catalogo; in soluzione la neutralizzazione usa −55,8 kJ per mole d'acqua formata.

### Esercitazioni (Carriera)

1. **Soluzione di cloruro di sodio** — 100 mL di NaCl 0,50 M (pesata con tara, acqua distillata, scioglimento).
2. **Titolazione acido-base** — 25 mL di HCl 0,10 M con fenolftaleina, NaOH 0,10 M fino al primo rosa.
3. **Pioggia d'oro** — Pb(NO₃)₂ + 2 KI → PbI₂ giallo; smaltimento nei metalli pesanti.
4. **Cristalli di solfato di rame** — sciogliere a caldo, evaporare, raffreddare; se si scalda troppo i cristalli perdono
   l'acqua e diventano bianchi.
5. **Saggio alla fiamma** — tre campioni incogniti riconosciuti dal colore della fiamma.

Valutazione: precisione del preparato, pulizia del banco (pozze, vetri, rifiuti abbandonati), incidenti, tempo.
1–5 stelle e soldi (paga − reagenti − vetreria rotta − multe). Il contenitore consegnato torna sul vassoio da svuotare
nel contenitore giusto e lavare.

### Incidenti

- **Vetro rotto**: urto oltre ~3,5 m/s → frammenti (da raccogliere e buttare nel contenitore del vetro) e pozza.
- **Pozze**: si puliscono con la carta assorbente, che poi va nei rifiuti giusti; un liquido infiammabile vicino a una
  fiamma prende fuoco. Evaporando, una pozza con almeno 0,05 g di soluto lascia un alone che va pulito anch'esso.
- **Fuoco**: si propaga a carta e liquidi infiammabili; si spegne con l'estintore a CO₂.
- **Gas tossici** (Cl₂, NO₂, H₂S, SO₂, NH₃, HCN, CO, Br₂…): fuori dalla cappa accesa fanno scattare l'allarme.
- **Esplosioni**: reazioni molto esotermiche o esplosivi scaldati; spingono gli oggetti e rompono la vetreria vicina.
- **Schizzi**: un contenitore corrosivo che si rompe vicino al giocatore → doccia di emergenza entro 15 s.

### Rifiuti

Lavandino (solo soluzioni innocue e diluite), metalli pesanti (Pb, Cu, Ag, Hg, Cd, Cr, Ni, Co, Ba…), acidi e basi,
solventi organici, vetro rotto, rifiuti solidi (carta, cartine). Il contenitore sbagliato costa una multa.

### Grafica

Segue i preset dell'app: Semplice senza ombre; Medio; Professionale con ombre, riflessi dell'ambiente e vetro fisico
con trasmissione.

### Verifiche

`npm test` (tests/game): scioglimento e concentrazione, pH di acidi e basi, titolazione e fenolftaleina, pioggia d'oro,
cristallizzazione ed eccesso di calore, conservazione della massa nei travasi, classi dei rifiuti, livello del liquido
e versamento, rottura della vetreria con Rapier, valutazione delle esercitazioni, corridoio libero con gli sgabelli
spingibili, portata e getto, aloni, righe della legenda. Prova nel browser con screenshot.
