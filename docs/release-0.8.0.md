## Tavola Periodica 3D v0.8.0 — Sandbox, lingue, preset grafici e simulatore di laboratorio

La release più grande finora: dopo il catalogo della 0.7.0 il progetto diventa un piccolo universo di chimica da
esplorare, giocare e leggere in tre lingue. Dettagli completi nel [CHANGELOG](https://github.com/G43r0/tavola-periodica-3d/blob/v0.8.0/CHANGELOG.md).

### Novità principali

**Simulatore di laboratorio** (prototipo giocabile) — un gioco in prima persona nel laboratorio di chimica della scuola,
nello stile di *Cooking Simulator*.
- Fisica vera con Rapier: si prende, si posa dove si guarda, si lancia, si rovescia, si rompe la vetreria.
- Versamento inclinando il recipiente, con livello sempre orizzontale, getto continuo e anello di mira.
- Chimica dei contenitori: solubilità, cristallizzazione, pH, indicatori, precipitati, ebollizione e le reazioni del catalogo.
- Carriera con 5 esercitazioni (NaCl, titolazione, pioggia d'oro, cristalli di solfato di rame, saggio alla fiamma) e
  Laboratorio libero con le 554 sostanze.
- Incidenti (vetro, fuoco ed estintore, gas tossici, esplosioni), pulizia e rifiuti con le multe.
- Comandi e legenda come in *Cooking Simulator*; testi in italiano, inglese e versione semplice.

**Sandbox degli elementi** — una sabbiera a particelle in stile *The Powder Toy* con i 118 elementi e le 554 sostanze:
stati fisici dalle temperature reali, combustione, fiamme colorate, soluzioni acquose, 1149 delle 1349 reazioni del
catalogo, elettricità, radioattività con decadimento accelerato, fissione ed esplosioni. Strumenti Mescola, Vento,
Estintore, Pipetta, Sorgente, Pozzo, forme, secchiello e Annulla/Ripeti; 19 esempi pronti.

**Lingue e modalità Spiega** — italiano, inglese e «Spiegamelo come se avessi 6 anni». La modalità Spiega (`F1`) apre
una scheda su qualsiasi parola evidenziata o elemento cliccato col tasto destro (glossario di 144 voci in tre lingue).

**Preset grafici e aspetto reale** — *Semplice*, *Medio* e *Professionale*; il Professionale mostra ogni elemento con
colori e materiali veri (metalli, cristalli, gas che brillano nelle ampolle, mercurio, bromo, bismuto iridescente).

**Laboratorio molecolare** — tutte le **1349 reazioni** del catalogo sono ora eseguibili (elenco in 14 gruppi con ricerca).

### Limiti noti
- Il simulatore è un prototipo: le esercitazioni sono 5 e la fisica dei liquidi è una semplificazione.
- 107 reazioni del catalogo restano escluse dalla sandbox (equilibri, catalizzatori non specificati, organismi viventi).

### Come usarla
Questa release contiene il codice sorgente (nessun eseguibile allegato). Per avviare o generare l'`.exe`:

```bash
npm install
npm start        # avvio
npm run dist     # installer e versione portabile in release/
```

Vedi il [README](https://github.com/G43r0/tavola-periodica-3d/blob/v0.8.0/README.md) per i dettagli.
