# Gioco base — piano

Data: 2026-10-14 · Stato: **proposta da confermare** · Parte dal prototipo del simulatore
([design](2026-10-13-simulatore-laboratorio-design.md), branch `ccr-9fd85180-nfjaik`, fase 9)

## Da dove partiamo

Il prototipo funziona: stanza, prima persona e vista del bancone, fisica Rapier, versamento, motore chimico dei
contenitori (`mixture.js`, già collegato alle reazioni del catalogo), incidenti, rifiuti, 5 esercitazioni e laboratorio
libero; 144 test verdi. Provandolo (screenshot nel preset Medio) e leggendo il codice si vede cosa manca per farne un
gioco:

| Problema | Causa nel codice |
|---|---|
| Tutto troppo luminoso, gli oggetti si confondono con lo sfondo | pareti `#dfe6dc`, pavimento `#b9b4a8`, soffitto e mobili quasi bianchi; quattro luci sommate (emisferica 0,9 + sole 1,6 + lampada 6 + riflessi dell'ambiente) con esposizione 1,05; bilancia e piastra bianche |
| La vetreria sembra plastica grigia | nel Medio il vetro è un materiale opaco al 20 % senza bordi né riflessi; nel Professionale la trasmissione su un fondo chiaro lo rende quasi invisibile |
| Barattoli tutti uguali | barattolo di plastica bianca (`#f4f6f8`) con etichetta bianca, bottiglie tutte marroni, pittogrammi disegnati con emoji |
| Carriera corta | 5 esercitazioni in fila; negozio, reputazione, tutorial e sfide a tempo erano rinviati |
| Reazioni poco presenti | le reazioni avvengono, ma il giocatore vede solo un avviso di 7 secondi con l'equazione, che non viene ricordato; lo scaffale ha 17 reagenti, quindi in Carriera quasi tutte le 1349 reazioni sono irraggiungibili; sono escluse quelle che chiedono luce, scintilla, scarica elettrica, vapore o urto |

## Le quattro parti

### 1. Grafica più avanzata

**Luce e contrasto (prima cosa da fare, risolve il «troppo luminoso»)**

- Aula più scura e calda: pareti verde-grigio medio, pavimento in linoleum scuro, mobili in legno o grigio antracite;
  il bancone nero resta e diventa il punto più contrastato della scena.
- Luci ridotte a uno schema chiaro: plafoniere sopra i banconi (luce principale, morbida), finestra come luce di
  riempimento fredda, emisferica bassa. Esposizione da tarare con gli screenshot dei tre preset (obiettivo: nessuna
  superficie grande vicina al bianco).
- Tone mapping **AgX** (Three.js r186) al posto di ACES nel gioco: satura meno i chiari e tiene i colori delle soluzioni.
- Gerarchia visiva: ciò che si può prendere è più saturo e illuminato dello sfondo; strumenti in grigio scuro e acciaio
  invece che bianchi; il contorno dell'oggetto guardato resta l'unico «bagliore».
- Occlusione ambientale (GTAO di Three.js) e ombre di contatto sotto gli oggetti nel Professionale; ombra finta
  (disco sfumato) nel Semplice e nel Medio, così gli oggetti non «galleggiano».

**Vetro e liquidi**

- Vetro leggibile in tutti i preset: bordo (labbro) più spesso e più chiaro, effetto Fresnel sui contorni, leggera
  tinta verde-azzurra, riflesso finto dell'ambiente nel Medio; nel Professionale trasmissione con spessore vero e
  rifrazione dei liquidi dietro.
- Liquidi: menisco, torbidità per i precipitati, colori dagli ioni (Cu²⁺, Ni²⁺, Co²⁺, Fe³⁺, MnO₄⁻…) come nella sandbox.

**Effetti delle reazioni** (vedi parte 4): bolle e schiuma, precipitato che si forma a nuvola e si deposita, cambi di
colore graduali, fumi colorati (NO₂ bruno, Cl₂ giallo-verde, I₂ viola), vapore, fiamme colorate, scintille, esplosioni
con scossa della camera (breve, disattivabile).

**Stanza**: tavola periodica appesa (disegnata dai dati dell'app), armadio dei reagenti con ante di vetro, armadio di
sicurezza giallo per gli infiammabili, orologio, cartelli di sicurezza, vista esterna dalla finestra, macchie e usura.

Tutto resta generato nel codice (nessun modello o texture scaricati) e rispetta i preset: Semplice senza AO, ombre né
trasmissione; adattamento automatico se gli fps scendono.

### 2. Oggetti e barattoli

**Contenitori dei reagenti, ognuno con la sua forma**

| Contenitore | Per | Note |
|---|---|---|
| Barattolo a bocca larga, vetro o HDPE, tappo a vite | solidi, polveri, cristalli | il contenuto si vede con il suo colore e la sua grana |
| Bottiglia di vetro con tappo smerigliato | soluzioni, acidi | vetro chiaro o ambrato |
| Bottiglia ambrata | sostanze sensibili alla luce (AgNO₃, H₂O₂, KMnO₄, I₂…) | |
| Flacone di plastica | basi forti, HF | il vetro non va bene |
| Contagocce | indicatori, reagenti per i saggi | |
| Bombola con valvola e manometro | gas (H₂, O₂, N₂, Cl₂, CO₂, NH₃) | solo sotto la cappa per i tossici |
| Ampolla o barattolo sotto olio | Na, K, Li; P bianco sotto acqua | si aprono con la pinza |

- **Tappi colorati per famiglia**, con una legenda sullo scaffale: acidi rosso, basi blu, sali bianco, ossidanti
  giallo, metalli grigio, organici verde, indicatori viola, gas arancione. Un colpo d'occhio dice cos'è.
- **Etichette** ridisegnate: fascia del colore della famiglia, nome, formula grande, concentrazione, i **9 pittogrammi
  GHS** disegnati in vettoriale (non emoji) presi dai dati delle sostanze (infiammabile, esplosivo, ossidante, corrosivo,
  tossico…). Testo sempre su fondo scuro o chiaro pieno, mai sul vetro.
- **Livello e quantità**: si vede quanto ne resta; la finestrella accanto all'oggetto dà grammi o millilitri.
- **Scaffale ordinato** per famiglia con cartellini sui ripiani; negli armadi i reagenti sbloccati con la Carriera.

**Nuova vetreria e nuovi strumenti** (servono per le reazioni e le esercitazioni)

provette e portaprovette · buretta su sostegno · pipetta tarata con propipetta · imbuto con carta da filtro e beuta da
vuoto (filtrazione dei precipitati) · crogiolo con pinza e triangolo · capsula di porcellana · termometro · pH-metro ·
pinza e pinzette · lampada UV/luce forte · accenditore piezoelettrico · alimentatore con elettrodi (elettrolisi, pile) ·
apparecchio di distillazione semplice · bagno di ghiaccio · tubo di raccolta dei gas su acqua.

Ogni oggetto ha profili di rivoluzione con le misure vere (come la vetreria attuale), collisori Rapier e una scheda
nella modalità Spiega (`F1`).

### 3. Modalità Carriera più piena

Resta l'ambientazione decisa: **laboratorio scolastico, lo studente fa le esercitazioni dell'insegnante**. Diventa un
anno scolastico in capitoli.

| Cap. | Tema | Esercitazioni (esempi) |
|---|---|---|
| 0 | Tutorial: comandi e sicurezza | prendere, versare, pesare, lavare, smaltire, spegnere un fuoco |
| 1 | Misure e soluzioni | pesata, diluizione, densità, soluzione di NaCl (esiste) |
| 2 | Acidi e basi | pH con cartina e pH-metro, indicatori, neutralizzazione, titolazione (esiste), aceto del supermercato |
| 3 | Precipitazioni e analisi | pioggia d'oro (esiste), AgCl e alogenuri, BaSO₄, filtrazione e resa, riconoscere ioni incogniti |
| 4 | Gas | H₂ da Zn + HCl e prova dello «schiocco», CO₂ da bicarbonato e aceto, O₂ da H₂O₂ + MnO₂ e brace che si riaccende |
| 5 | Calore e cristalli | reazioni eso/endotermiche col termometro, calorimetro, cristalli di CuSO₄ (esiste), idrati |
| 6 | Ossidoriduzioni ed elettrochimica | Zn in CuSO₄, permanganato, pila Daniell, elettrolisi dell'acqua |
| 7 | Fiamme e combustioni | saggio alla fiamma (esiste), combustibili, estintori giusti |
| 8 | Chimica organica | esterificazione con distillazione, saponificazione |
| 9 | Esame di fine anno | campioni incogniti da identificare con tutto ciò che si è imparato |

Circa **45 esercitazioni** (4–6 per capitolo), ognuna con 1–5 stelle. In più:

- **Verifica di fine capitolo** con campioni incogniti e voto (4–10) che finisce in una **pagella**.
- **Relazione di laboratorio** dopo l'esercitazione: 2–3 domande sul perché, che usano gli strumenti dell'app
  («bilancia tu» del laboratorio molecolare, reagente limitante, nome del precipitato). Dà stelle in più, non blocca.
- **Soldi e negozio**: vetreria di ricambio e di qualità (buretta di classe A, bilancia più precisa), strumenti nuovi,
  ampliamenti del laboratorio (seconda postazione, cappa più potente, armadio dei reagenti).
- **Reputazione** con l'insegnante: sblocca i capitoli e le esercitazioni «extra» (club di chimica, richieste di altri
  professori, gara di chimica).
- **Sfide a tempo** e **Laboratorio libero** (esiste, con tutto lo scaffale) come modalità a parte.
- Esercitazioni scritte come **dati** (passi, obiettivi controllati sul contenuto dei contenitori, tolleranze per la
  chimica realistica e semplificata), non come codice per ognuna: così aggiungerne è facile e i test le provano tutte.
- **Salvataggi** con versione e migrazione (più profili), anche su file nell'app Electron.

### 4. Reazioni al centro del gioco

- **Scaffale ampliato** da 17 a circa 120 reagenti scelti per coprire il catalogo: uno script calcola quante delle 1349
  reazioni sono realizzabili con i reagenti, gli strumenti e le condizioni disponibili; un test fissa la copertura
  minima per gruppo, così non si perde aggiungendo reagenti. Nella Carriera i reagenti si sbloccano capitolo per capitolo.
- **Condizioni che oggi mancano**: luce (lampada), scintilla (accenditore), scarica elettrica ed elettrolisi
  (alimentatore), vapore; le reazioni d'urto degli esplosivi restano incidenti, non esperimenti.
- **Si vede che cosa succede**: ogni reazione produce segnali osservabili presi dai dati (gas → bolle e colore del gas;
  prodotto insolubile → precipitato del suo colore; ioni colorati → cambio di colore; ΔH → temperatura, vapore, fiamma);
  la finestrella del contenitore mostra l'equazione bilanciata con gli stati fisici e il ΔH°.
- **Quaderno di laboratorio**: ogni reazione osservata la prima volta viene scritta nel quaderno (equazione,
  condizioni, ΔH°, cosa si è visto, dove); il quaderno ha le 1349 pagine del catalogo divise nei 14 gruppi e mostra la
  percentuale scoperta. È la «collezione» del gioco e resta tra una partita e l'altra.
- **Vista molecolare**: dal quaderno o dal contenitore si apre la reazione nel laboratorio molecolare, con l'animazione
  dei legami che si rompono e si formano (già esistente): dal barattolo alle molecole.
- **Velocità**: la temperatura accelera le reazioni (fattore di tipo Arrhenius), le polveri reagiscono più in fretta dei
  pezzi, mescolare aiuta; le reazioni lente restano lente ma visibili.
- **Perché non reagisce?**: come «Simula reazione» del laboratorio, il gioco sa spiegare cosa manca (un reagente, il
  calore, il catalizzatore, l'acqua), usato come aiuto nella chimica semplificata.

## Fasi

Ogni fase è giocabile da sola, con test e screenshot nei tre preset prima di passare alla successiva.

| Fase | Contenuto | Dipende da |
|---|---|---|
| **G1** | Luce, colori della stanza, AgX, vetro leggibile, ombre di contatto (anche nel laboratorio molecolare se serve) | — |
| **G2** | Barattoli, bottiglie, bombole e ampolle nuovi; tappi colorati; etichette GHS; scaffale ordinato | G1 |
| **G3** | Reazioni al centro: effetti osservabili, equazione nella finestrella, quaderno, condizioni nuove, scaffale ampliato con test di copertura, vista molecolare | G2 |
| **G4** | Strumenti nuovi (buretta, pipetta, filtrazione, crogiolo, termometro, pH-metro, elettrolisi, distillazione) | G3 |
| **G5** | Carriera: capitoli 0–4 (~25 esercitazioni) scritti come dati, relazione, negozio, reputazione, salvataggi versionati | G4 |
| **G6** | Carriera: capitoli 5–9, verifiche, pagella, sfide a tempo, richieste extra | G5 |
| **G7** | Rifinitura: dettagli della stanza, effetti, audio (se lo vogliamo), prestazioni, inglese e «Spiegamelo come se avessi 6 anni», modalità Spiega, README e CHANGELOG | G6 |

## Verifiche

- `npm test`: copertura delle reazioni dello scaffale, segnali osservabili delle reazioni (es. AgNO₃ + NaCl → precipitato
  bianco, Zn + HCl → bolle di H₂, Cu + HCl → niente, con il motivo), quaderno e salvataggi (migrazione delle versioni),
  ogni esercitazione risolvibile da una «soluzione» scritta nei dati, valutazione e prezzi.
- Screenshot automatici (Playwright) della stessa inquadratura nei tre preset, per confrontare luce e leggibilità prima
  e dopo ogni fase.

## Da decidere con l'utente

1. Ordine: iniziare da **G1** (luce e leggibilità), che risolve subito il problema segnalato?
2. Carriera: va bene l'anno scolastico in 10 capitoli e circa 45 esercitazioni, con stelle, soldi, reputazione e pagella?
3. Audio: suoni generati nel codice (versamento, bolle, fiamma, vetro rotto, allarme) sì o no?
4. Una PR per fase oppure tutte le fasi in questa PR?
