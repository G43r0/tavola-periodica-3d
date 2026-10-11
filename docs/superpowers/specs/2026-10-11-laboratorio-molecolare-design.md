# Laboratorio molecolare — design

Data: 2026-10-11 · Stato: fasi 4 e 5 completate

## Obiettivo

Simulatore in cui lo studente prende atomi specifici e li collega per formare molecole
(2 H + O → H₂O) o spezza molecole in atomi (H₂ → 2 H). Stesso pubblico dell'app (superiori,
università), stessa base tecnica (Electron + Three.js, offline, italiano). Deve essere corretto:
quando un risultato non è affidabile, lo dice.

## Decisioni prese con l'utente

| Tema | Scelta |
|------|--------|
| Legami | Costruzione libera con regole di valenza **e** modalità reazioni |
| Vista | 3D con geometria reale + struttura di Lewis 2D affiancata |
| Elementi | Tutti i 118, su tre livelli di affidabilità (vedi sotto) |
| Reazioni | Animazione, bilanciamento, energia di reazione, reazioni avviate dal banco |
| Interazione | Manuale (trascina, clic sul legame, forbici) + automatica (Combina / Separa) |
| Motore | Approccio A: regole chimiche + libreria verificata (niente chimica quantistica) |

## Livelli di affidabilità degli elementi

1. **Gruppi principali** (blocchi s e p, Z ≤ 86 escluso il blocco d/f): regole di valenza,
   Lewis, VSEPR affidabili.
2. **Metalli di transizione, lantanidi, attinidi**: valenze dagli stati di ossidazione dei dati;
   niente coppie solitarie né VSEPR; risultato marcato «struttura non verificata».
3. **Z ≥ 104** (proprietà previste): come il livello 2, con avviso «chimica sconosciuta».

## Fase 4 — banco di costruzione

### Interfaccia
- Ingresso: pulsante «Laboratorio» nella barra della tavola; «Usa nel laboratorio» nella scheda elemento.
- Schermo intero, caricato su richiesta (chunk separato come il visualizzatore 3D).
- Sinistra: tavolozza (mini tavola dei 118 elementi + ricerca + elementi frequenti).
- Centro: banco 3D (motore `viewer/engine.js` riusato).
- Destra: scheda della molecola selezionata (o riepilogo del banco).
- Basso: Combina · Separa · Carica ± · Elimina · Svuota · Annulla/Ripeti · Esempi.
- Modalità del puntatore: Sposta (trascina = sposta molecola; avvicinare un atomo a un altro = legame;
  clic sul legame = ordine 1→2→3→1), Lega (clic su due atomi, anche nella stessa molecola: anelli),
  Forbici (clic su un legame = lo rompe). Tasto destro su un legame = rompe.

### Motore chimico (`src/lab/chem/`, logica pura testata in Node)
- `elements-lab.js`: elettroni di valenza, legami massimi, metallo/non metallo, livello, raggi
  covalenti (Cordero; Pyykkö per Z ≥ 97, stima) e ionici (Shannon, NC 6), elettronegatività (Pauling).
- `molecule.js`: banco come grafo (atomi, legami covalenti con ordine, legami ionici con elettroni trasferiti),
  frammenti connessi, istantanee per annulla/ripeti.
- `bonding.js`: verifica di un nuovo legame con motivo in italiano; tipo di legame da ΔEN
  (< 0,4 apolare, 0,4–1,7 polare, > 1,7 con un metallo = ionico).
- `lewis.js`: conservazione degli elettroni (elettroni = Σ valenza − carica), distribuzione delle coppie
  (prima gli atomi più elettronegativi, poi ottetto espanso dal 3° periodo), cariche formali,
  ottetti incompleti, radicali.
- `geometry.js`: VSEPR (AXₙEₘ e nome della forma) e posizioni 3D per rilassamento: molle sui legami,
  repulsione tra domini elettronici (coppie solitarie più forti), planarità dei doppi legami,
  repulsione tra atomi non legati. Le molecole della libreria usano lunghezze e angoli sperimentali.
- `smiles.js`: lettore SMILES ridotto per scrivere la libreria.
- `identify.js`: formula di Hill e impronta del grafo (Weisfeiler–Lehman) per riconoscere le molecole.
- `bond-energy.js`: energie di legame medie (kJ/mol); stima di Pauling per le coppie mancanti.
- `combine.js`: «Combina» = libreria per formula, altrimenti ricerca della struttura che soddisfa le
  valenze con la **massima energia di legame totale** (più stabile); composti ionici con bilancio
  delle cariche; spiegazione se impossibile.

### Dati
- `src/lab/data/molecules.js` + `molecules-more.js`: 445 voci (molecole, ioni, composti ionici) con nome italiano, SMILES,
  stato a 25 °C, descrizione/usi; geometria e momento dipolare sperimentali solo se certi
  (NIST CCCBDB / CRC Handbook).

### Verifiche
- `npm test` (node:test): SMILES → formule; Lewis (H₂O, NH₄⁺, CO, NO radicale, O₃); geometrie (CH₄ 109,5°,
  H₂O 104,5°, CO₂ 180°, BF₃ 120°, SF₆, XeF₄ quadrato planare, SF₄ altalena, ClF₃ a T, benzene planare);
  Combina (2H+O, 2H, C+4H, N+3H, Na+Cl, 2Na+O, Mg+2Cl, 4H+2O → 2 H₂O, 3H+O → H₂O + H, C₂H₆O isomeri);
  divieti (H con 2 legami, gas nobili leggeri).
- Prova nel browser e in Electron (fps, nessun errore).

## Fase 5 — reazioni (da confermare dopo la fase 4)
Libreria di ~40 reazioni con entalpie di formazione standard (NIST); bilanciamento algebrico generale
(spazio nullo intero) con modalità «bilancia tu»; ΔH da entalpie di formazione o, in mancanza, da energie
di legame (stima); grafico energetico; animazione rottura/formazione dei legami; avvio dal banco quando le
molecole presenti corrispondono ai reagenti di una reazione nota.
