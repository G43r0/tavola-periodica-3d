# Changelog

Storico delle versioni di **Tavola Periodica 3D**. Ogni versione corrisponde a una fase di sviluppo
(vedi anche la tabella all'inizio del [README](README.md)). Formato ispirato a
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); il progetto usa il versionamento semantico (`0.<fase>.0`).

> **Nota sulla cronologia git.** Lo sviluppo è avvenuto prima della creazione di questo repository, quindi le fasi
> non hanno commit separati: questo file è la cronologia ufficiale. Il codice di ogni fase è tutto presente
> nella release più recente.

## [Non rilasciato]

### Aggiunto
- **Versione web per Chrome**: il workflow `.github/workflows/pages.yml` esegue i test, compila l'app con Vite e la
  pubblica su GitHub Pages a ogni push su `main` (<https://g43r0.github.io/tavola-periodica-3d/>). Va attivata una
  volta da **Settings → Pages → Source: GitHub Actions**.
- Icona dell'app nella scheda del browser; script `npm run preview` per provare in locale la versione web di produzione.

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
