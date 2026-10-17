# Gioco base — piano

Data: 2026-10-14 · Stato: **in corso — G1, G2, G3, G4 e G5 completate** · Parte dal prototipo del simulatore
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

## Le cinque parti

### 1. Grafica più avanzata

**Luce e contrasto (prima cosa da fare, risolve il «troppo luminoso»)**

- Aula più scura e calda: pareti verde-grigio medio, pavimento in linoleum scuro, mobili in legno o grigio antracite;
  il bancone nero resta e diventa il punto più contrastato della scena.
- Luci ridotte a uno schema chiaro: plafoniere sopra i banconi (luce principale, morbida), finestra come luce di
  riempimento fredda, emisferica bassa. Esposizione da tarare con gli screenshot dei tre preset (obiettivo: nessuna
  superficie grande vicina al bianco).
- Tone mapping **neutro** (Khronos PBR Neutral) in tutti i preset del gioco, al posto di ACES: non brucia i chiari e
  conserva tinta e saturazione, quindi i colori veri delle soluzioni (AgX, previsto all'inizio, tende a desaturarli).
- Gerarchia visiva: ciò che si può prendere è più saturo e illuminato dello sfondo; strumenti in grigio scuro e acciaio
  invece che bianchi; il contorno dell'oggetto guardato resta l'unico «bagliore».
- Ombre di contatto (disco sfumato) sotto ogni oggetto in tutti i preset, più leggere nel Professionale che ha già le
  ombre vere: gli oggetti non «galleggiano» e, in mano, si vede sopra quale punto sono. L'occlusione ambientale
  (GTAO) passa alla rifinitura (G8), perché chiede il post-processing che il gioco oggi non ha.

**Vetro e liquidi**

- Vetro leggibile in tutti i preset: bordo (labbro) più spesso e più chiaro, effetto Fresnel sui contorni, leggera
  tinta verde-azzurra, riflesso finto dell'ambiente nel Medio; nel Professionale trasmissione con spessore vero e
  rifrazione dei liquidi dietro.
- Liquidi: menisco, torbidità per i precipitati, colori dagli ioni (Cu²⁺, Ni²⁺, Co²⁺, Fe³⁺, MnO₄⁻…) come nella sandbox.

**Effetti delle reazioni** (vedi parte 4): bolle e schiuma, precipitato che si forma a nuvola e si deposita, cambi di
colore graduali, fumi colorati (NO₂ bruno, Cl₂ giallo-verde, I₂ viola), vapore, fiamme colorate, scintille, esplosioni
con scossa della camera (breve, disattivabile).

**Stanza**: il poster della tavola periodica c'è già (ora con i numeri atomici giusti), armadio dei reagenti con ante di vetro, armadio di
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
| Bombola con valvola e manometro | gas (H₂, O₂, N₂, Cl₂, CO₂, NH₃) | solo sotto la cappa per i tossici; con gli strumenti per i gas (G4) |
| Ampolla o barattolo sotto olio | Na, K, Li; P bianco sotto acqua | si aprono con la pinza; con i metalli che reagiscono con l'acqua sullo scaffale (G3) |

- **Tappi colorati per famiglia**, con una legenda sullo scaffale: acidi rosso, basi blu, sali bianco, ossidanti
  giallo, metalli grigio, organici verde, indicatori viola, gas arancione. Un colpo d'occhio dice cos'è.
- **Etichette** ridisegnate: fascia del colore della famiglia, nome, formula grande, concentrazione, i **9 pittogrammi
  GHS** disegnati in vettoriale (non emoji) presi dai dati delle sostanze (infiammabile, esplosivo, ossidante, corrosivo,
  tossico…). Testo sempre su fondo scuro o chiaro pieno, mai sul vetro.
- **Livello e quantità**: si vede quanto ne resta; la finestrella accanto all'oggetto dà grammi o millilitri.
- **Scaffale ordinato** per famiglia, da sinistra a destra come la legenda; gli armadi con i reagenti sbloccati dalla
  Carriera arrivano con la Carriera (G6).

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

### 5. Libro «Come si fa» (How to)

Un libro del laboratorio, nella Carriera e nel Laboratorio libero, che spiega come si fa tutto: gli strumenti, le
tecniche, come si ottiene un elemento e le reazioni sotto forma di ricette. Istruzioni semplici, passo per passo, con
illustrazioni stilizzate; solo chimica vera.

**Come si apre**: è un libro vero, sulla cattedra e su ogni bancone, che si prende e si sfoglia; oppure con il tasto `B`
(oggi libero) o dal menu di pausa. Si può tenere aperto in un riquadro laterale mentre si lavora, con il passo corrente
evidenziato.

| Capitolo del libro | Contenuto | Come nasce |
|---|---|---|
| Strumenti | ogni oggetto del laboratorio: a cosa serve, come si usa, gli errori tipici | scritto a mano, una pagina per strumento |
| Tecniche | pesare con la tara, leggere il menisco, sciogliere, diluire, scaldare, filtrare, titolare, evaporare e cristallizzare, raccogliere un gas, saggio alla fiamma, misurare il pH, lavare e smaltire, spegnere un fuoco | scritte a mano, circa 15 pagine |
| Ottenere gli elementi | per ognuno dei 118 elementi: dove si trova in natura, come lo si ottiene davvero (laboratorio, industria, reattore o acceleratore) e, se il gioco lo permette, la ricetta | dati nuovi con la fonte, più le ricette generate |
| Ricette delle reazioni | le reazioni del catalogo che si possono fare nel gioco, divise nei 14 gruppi | generate dai dati |
| Sicurezza | i 9 pittogrammi GHS, le sostanze incompatibili, cosa fare negli incidenti, dove va ogni rifiuto | scritta a mano |

**Ottenere un elemento, detto in modo vero**: una reazione chimica non crea elementi, li libera dai composti in cui si
trovano (il rame dal solfato di rame con lo zinco, l'idrogeno dall'acido cloridrico con lo zinco, l'ossigeno dall'acqua
ossigenata con il diossido di manganese). Gli elementi nuovi si fanno solo con le reazioni nucleari: il libro lo spiega
e rimanda alla sandbox (decadimenti e fissione). Nel catalogo **374 reazioni liberano un elemento, per 56 elementi
diversi**; per ognuna il libro dice se si fa a scuola o solo nell'industria (altoforno, elettrolisi ignea, processo
Kroll) e perché. Gli altri elementi hanno la pagina «come si ottiene davvero», con un nuovo campo dei dati scritto in
`data-sources/curated/` e la sua fonte (CRC Handbook, Greenwood & Earnshaw), come gli altri dati dell'app.

**Com'è fatta una ricetta**

- Titolo (cosa si ottiene, es. «Rame dal solfato di rame»), difficoltà da 1 a 3 provette, tempo, capitolo della
  Carriera in cui si sblocca.
- Equazione bilanciata con gli stati fisici e il ΔH°; nella chimica semplificata anche solo con i nomi.
- Ingredienti con le **quantità vere**, calcolate dalle masse molari per una dose da scuola (es. 50 mL di CuSO₄ 0,5 M e
  2 g di zinco in polvere), con l'eccesso giusto del reagente non limitante.
- Vetreria, strumenti e condizioni (scaldare, in soluzione, catalizzatore, sotto la cappa).
- **Passi numerati**, una frase ciascuno, ognuno con la sua illustrazione. Nascono da modelli per tipo di reazione
  (precipitazione, sviluppo di un gas, neutralizzazione, spostamento di un metallo, decomposizione termica, combustione,
  elettrolisi, sintesi dagli elementi, esterificazione con distillazione…).
- **Cosa osservi**: colore, bolle, precipitato, calore, dagli stessi segnali della parte 4.
- **Sicurezza** (pittogrammi di reagenti e prodotti, cappa per i gas tossici) e **smaltimento** (il contenitore giusto).
- **Nella realtà**: dove il gioco semplifica (tempi accelerati, rese), lo dice.
- Collegamenti alla scheda dell'elemento nella tavola, alla reazione nel laboratorio molecolare e alla voce del quaderno.

**Illustrazioni stilizzate**: disegnate nel codice in SVG (nessuna immagine scaricata), in uno stile piatto coerente
con le icone dell'app: vetreria a contorno, liquidi con il colore vero della soluzione, frecce di versamento, fiamma,
bolle, precipitato, numero del passo. Una ventina di vignette con parametri (pesa, versa, aggiungi a gocce, mescola,
scalda, filtra, raccogli il gas, osserva, smaltisci…) si riempiono con i colori e le forme dei barattoli della parte 2,
così il libro e il bancone si somigliano. Accanto all'equazione, le molecole in piccolo (palline e bastoncini, dal
laboratorio molecolare).

**Carriera e Laboratorio libero**

- **Carriera**: le pagine si sbloccano con i capitoli e i reagenti; l'insegnante indica la pagina della tecnica che
  serve; nelle verifiche il libro mostra i metodi ma non la soluzione (non dice qual è il campione incognito).
- **Laboratorio libero**: tutto il libro è aperto e ogni ricetta ha il pulsante **«Prepara sul banco»**, che mette sul
  bancone reagenti e vetreria.
- **Segui la ricetta**: con il libro nel riquadro, i passi si spuntano da soli quando il motore dei contenitori li
  riconosce (come nelle esercitazioni di oggi), con un avviso se si sbaglia dose o ordine (es. «l'acido nell'acqua, mai
  l'acqua nell'acido»).
- **Ricerca** per nome, formula ed elemento («come ottengo il rame?») e per ciò che c'è sullo scaffale («cosa posso fare
  con questi reagenti?»).
- Tre lingue come il resto dell'app: italiano, inglese e «Spiegamelo come se avessi 6 anni» (frasi corte, niente formule).

**Veridicità**: solo reazioni del catalogo (reali e bilanciate, già controllate dai test); quantità calcolate, non
scritte a mano; dati sulla produzione degli elementi con la fonte. Un test fa eseguire ogni ricetta al motore dei
contenitori, passo per passo e con le dosi del libro, e controlla che si ottengano i prodotti e le osservazioni scritte:
il libro non promette nulla che il gioco non faccia.

## Fasi

Ogni fase è giocabile da sola, con test e screenshot nei tre preset prima di passare alla successiva.

| Fase | Contenuto | Dipende da |
|---|---|---|
| **G1** ✅ | Luce, colori della stanza, tone mapping neutro, vetro leggibile, ombre di contatto | — |
| **G2** ✅ | Barattoli e bottiglie nuovi (vetro chiaro, ambrato, plastica); tappi colorati; etichette GHS; scaffale ordinato | G1 |
| **G3** ✅ | Reazioni al centro: effetti osservabili, equazione nella finestrella, quaderno, condizioni nuove, scaffale ampliato con test di copertura, vista molecolare | G2 |
| **G4** ✅ | Strumenti nuovi (buretta, pipetta, filtrazione, crogiolo, termometro, pH-metro, elettrolisi, distillazione) | G3 |
| **G5** ✅ | Libro «Come si fa»: lettore e riquadro, strumenti, tecniche, sicurezza, pagine dei 118 elementi, ricette generate con le vignette SVG, «Prepara sul banco», «Segui la ricetta», test che esegue ogni ricetta | G4 |
| **G6** | Carriera: capitoli 0–4 (~25 esercitazioni) scritti come dati, pagine del libro sbloccate, relazione, negozio, reputazione, salvataggi versionati | G5 |
| **G7** | Carriera: capitoli 5–9, verifiche, pagella, sfide a tempo, richieste extra | G6 |
| **G8** | Rifinitura: dettagli della stanza, effetti, audio (se lo vogliamo), prestazioni, inglese e «Spiegamelo come se avessi 6 anni», modalità Spiega, README e CHANGELOG | G7 |

### G1 — fatto

| Prima | Dopo |
|---|---|
| pareti `#dfe6dc`, pavimento `#b9b4a8`, soffitto e mobili quasi bianchi | pareti verde salvia `#93a39a`, zoccolo `#4d5f56`, linoleum `#6e6862`, mobili grigio ardesia `#56606b`, soffitto `#b9bbb6` |
| bilancia e piastra bianche `#f4f4f2` | grigio chiaro `#aeb4bb`; piano della cappa nero come i banconi |
| emisferica 0,9 + sole 1,6 + una lampada da 6 al centro | emisferica 0,5 (1,3 senza riflessi dell'ambiente, nel Semplice), finestra 1,2, due plafoniere sopra i banconi (4,5 e 3) |
| ACES con esposizione 1,05 (Semplice e Medio) | tone mapping neutro con esposizione 1 in tutti i preset |
| vetro opaco al 20 % che sembrava plastica grigia | vetro al 7 % al centro con i bordi più chiari e opachi (Fresnel, `glassEdges` in `items.js`), labbro sul bordo della bocca, nel Professionale una tinta verde-azzurra nello spessore |
| oggetti che galleggiano senza ombre (Semplice e Medio) | ombra di contatto sotto ogni oggetto (disco o ellisse orientata per gli strumenti), che sbiadisce e si allarga sollevandolo |

Verificato con gli screenshot della stessa inquadratura (prima persona, bancone, scaffale, cappa) nei tre preset.

### G2 — fatto

- **Scelta dai dati** (`src/game/stock.js`, puro e testato): per ogni reagente dello scaffale e per ognuna delle
  sostanze del magazzino del Laboratorio libero (568 combinazioni di sostanza e forma, nessun errore) il contenitore, la
  famiglia e i pericoli.
  - Contenitori: barattolo di vetro (solidi), di vetro ambrato (sensibili alla luce: AgNO₃, KMnO₄, I₂, KI, alogenuri
    d'argento), di plastica (idrossidi); bottiglia di vetro, di vetro ambrato (AgNO₃, KI, H₂O₂, HNO₃), flacone di plastica
    (basi forti e HF); contagocce e spruzzetta come prima.
  - Famiglia → colore del tappo e della fascia dell'etichetta, con la legenda sul pannello dello scaffale. I carbonati
    sono sali, non organici; un nitrato diluito è un sale, solido è un ossidante.
- **Pericoli veri** per i 17 reagenti dello scaffale: pittogrammi, frasi H e avvertenza delle schede di sicurezza alla
  concentrazione del gioco (HCl 1 M: GHS05, H290, «Attenzione»; Pb(NO₃)₂ 0,1 M: GHS08 e GHS09, «Pericolo»). Per le altre
  sostanze sono dedotti dai dati (infiammabile, esplosivo, ossidante, reattivo con l'acqua, acidi e basi forti, metalli
  pesanti, cianuri, cromati) e la modalità Spiega dice che sono indicativi.
- **I nove pittogrammi GHS** disegnati come tracciati SVG (`src/game/ghs.js`): servono alle etichette e serviranno al libro.
- **Etichette** ridisegnate: fascia della famiglia, nome (che si rimpicciolisce prima di troncarsi), formula, concentrazione,
  avvertenza e fino a tre pittogrammi; rivolte verso il giocatore (dalla G4 sul lato che in mano guarda chi tiene il
  barattolo; girati di 180° i reagenti di scaffale e bancone B).
- **Tappi** a vite del colore della famiglia (ghiera sul contagocce): si tolgono mentre il reagente è in mano o appena usato
  con spatola, ansa o cartina, e tornano dopo 2,5 s.
- **Contenuto visibile** nei barattoli di vetro, con una grana per polveri e cristalli (i cristalli blu del solfato di rame).
- La soluzione di HCl si chiama «Acido cloridrico» sull'etichetta (non «Cloruro di idrogeno», il gas).
- Le esercitazioni riconoscono i contenitori dei reagenti dal segno `stock`, non più dal nome del tipo.
- Rimandati: bombole (G4, con gli strumenti per i gas), ampolle sotto olio (G3, con i metalli alcalini sullo scaffale).

### G3 — fatto

- **Segnali osservabili** (`src/game/signals.js`, puro e testato): per ogni reazione, dai dati, i gas che si liberano (e
  se si vedono: Cl₂, Br₂, I₂, NO₂), i prodotti insolubili (precipitato o metallo che si deposita), i solidi che si
  consumano, il colore della soluzione prima e dopo, il calore (si scalda molto, si scalda, si raffredda), fiamma e luce.
  L'equazione con gli stati fisici (s, l, g, aq) e il ΔH°.
- **Effetti nel gioco**: bolle che salgono dal fondo, più fitte quanto più è veloce la reazione; fiocchi del colore del
  precipitato che scendono; colori del liquido che cambiano in pochi decimi di secondo; gas colorati; fiammella del
  potassio (e di Rb, Cs) sull'acqua.
- **Finestrella del contenitore**: le ultime reazioni con equazione, ΔH° e cosa si vede; **perché non reagisce?** (nel
  Laboratorio libero e nella chimica semplificata): la condizione che manca (calore con la temperatura, fiamma,
  catalizzatore, luce, acqua), il reagente non sciolto o l'unico che manca, la serie di attività (potenziali standard
  del CRC Handbook in `reagents.js`), le reazioni che il simulatore non fa (corrente, UV, vapore, equilibri, organismi).
- **Quaderno** (`src/game/notebook.js`, `N`): salvato con la versione nel salvataggio del gioco; 1349 pagine nei 14
  gruppi, percentuale tra le 1220 che il simulatore sa fare; le pagine scoperte hanno equazione, ΔH°, condizioni, cosa si
  è visto, dove e quando, e il collegamento al laboratorio molecolare (che si apre sopra il gioco); le altre sono
  raggruppate per sottogruppo, con il motivo per quelle che il simulatore non fa. Le combustioni nel fuoco contano.
- **Condizioni nuove**: la lampada a luce forte sul bancone A fa avvenire le 16 reazioni fotochimiche del catalogo (lente:
  circa l'1 % al minuto, il gas è in tracce). Le reazioni che chiedono una scintilla si innescano già con la fiamma del
  Bunsen; restano fuori corrente e scarica: le elettrolisi (con l'alimentatore, G4), i gas nobili con il fluoro, l'ozono
  e la pila al piombo.
- **Velocità**: fattore di Arrhenius (Ea ≈ 50 kJ/mol) per le reazioni dei solidi e quelle lente; quelle tra ioni sciolti
  restano istantanee. Le polveri più veloci dei pezzi restano da fare (serve la granulometria nei dati).
- **ΔH°**: 176 entalpie di formazione tabulate (NBS, CRC, NIST) in `src/lab/data/formation-enthalpies.js`: il ΔH° c'è per
  1045 reazioni del catalogo invece di 599, anche nel laboratorio molecolare e nella sandbox. La neutralizzazione vale
  −55,8 kJ per mole d'acqua solo con le basi forti.
- **Scaffale e armadio**: sodio, potassio e litio sullo scaffale, sotto olio di paraffina (barattolo `jarOil`, chiuso
  all'aria; la spatola prende il metallo e lascia l'olio). L'**armadio della scuola** (`CABINET`, 47 reagenti d'uso) è nel
  magazzino del Laboratorio libero, diviso per famiglia. `src/game/coverage.js` calcola le reazioni realizzabili, anche a
  catena con i prodotti che restano nel contenitore: 144 con lo scaffale, 383 con l'armadio, 1166 con tutto il magazzino
  (`node scripts/coverage.mjs`); un test fissa il minimo per gruppo. Da circa 120 reagenti previsti ne sono bastati 67
  per triplicare la copertura; i pericoli dell'armadio sono dedotti dai dati: quelli delle schede di sicurezza arrivano
  con i capitoli della Carriera che li sbloccano (G6).
- **Richieste in corso d'opera**: camminata più veloce (3 m/s, corsa 5,2 m/s), campo visivo regolabile (55°–100°, nel
  menu e nella pausa, salvato), barattoli +15 % e bottiglie +10 % (legenda dello scaffale alzata).

### G4 — fatto

- **Regole pure** in `src/game/apparatus-logic.js` (testate in `tests/game/apparatus.test.mjs`): portate del rubinetto
  della buretta (0; 0,12; 0,8; 3 mL/s), lettura con lo zero in alto arrotondata a 0,05 mL, tensioni 0–12 V, livelli del
  mantello come la piastra, lettura delle sonde che insegue il valore vero (termometro τ = 2,5 s, pH-metro τ = 0,4 s),
  vapori che condensano nel refrigerante (acqua e sostanze che bollono sopra 300 K), corrente sul display.
- **Apparecchi fissi** (`src/game/apparatus.js`, supporti in `apparatus-room.js`): buretta, imbuto e pallone sono
  recipienti veri con un corpo fisso (`physics.fix`), contorno ambra; un clic li usa invece di prenderli. La buretta
  (profilo interno di 50,6 mL tra la base del tubo e lo zero) si riempie versandoci dentro dall'alto e versa dalla punta,
  goccia a goccia (gocce da 0,05 mL), a filo o aperta; la finestrella legge la scala o dice che il liquido è sopra lo
  zero. L'imbuto filtra per gravità (2 mL/s, più lento quando resta poco liquido): passa tutto ciò che è sciolto, il
  solido resta sulla carta, che si toglie con un clic diventando un oggetto da buttare. Il pallone sul mantello
  (riscaldamento fino a 275 W, recipiente chiuso) manda nel refrigerante i vapori: quelli che condensano gocciolano
  dall'uscita a 5 °C sopra l'ambiente, gli altri escono; la testa ha un display con la temperatura del vapore.
- **Sonde** (termometro, pH-metro, pipetta): corpi che attraversano gli oggetti (gruppo di collisione `ghost`), con una
  scatola invisibile per prenderli; tenute in mano si inclinano verso il basso e, guardando un recipiente, la punta
  scende vicino al fondo. Tornano al loro posto se finiscono nei rifiuti o a ogni nuova partita. La pipetta preleva fino
  a 10 mL (il reagente si paga), li rilascia tutti o un millilitro (`Maiusc+E`), si lava al lavandino e si svuota nei
  rifiuti.
- **Calore**: il bagno di ghiaccio porta l'ambiente del recipiente a 0 °C con uno scambio forte; la porcellana (calore
  specifico 0,85 J/g·K, materiale suo) diventa rossa sopra i 500 °C e irraggia; sopra i 60 °C un recipiente scotta e
  senza la pinza (sul suo supporto accanto alla buretta) non si prende. La pinza si vede in mano e stringe l'oggetto.
- **Elettrolisi**: un recipiente posato sotto gli elettrodi (con almeno 8 mL di liquido) riceve la tensione
  dell'alimentatore; la corrente dipende dalla conducibilità degli ioni sciolti (Na₂SO₄ 0,5 M a 6 V: circa 0,65 A) e fa
  avvenire la più specifica delle 11 elettrolisi del catalogo che sono possibili, con l'estensione della legge di
  Faraday in un tempo 20 volte più veloce del reale. Bolle sui due elettrodi; «perché non reagisce?» dice se manca la
  corrente o se la soluzione non conduce. Limite: il catalogo non ha l'elettrolisi del solfato di rame, che quindi dà
  l'elettrolisi dell'acqua (idrogeno e ossigeno) invece del rame al catodo.
- **Bombole** sotto la cappa (O₂, H₂, CO₂, Cl₂, NH₃, con il colore dell'ogiva della norma EN 1089-3): il volantino apre
  e chiude, il gas (4·10⁻⁴ mol/s) esce dal tubo pescante nel recipiente posato all'uscita e lì si scioglie o reagisce;
  verificati Na + Cl₂, Zn caldo + Cl₂, NaOH + CO₂, NaOH + Cl₂ (ipoclorito), CuO caldo + H₂ → Cu, acqua di calce + CO₂,
  KBr + Cl₂, HCl + NH₃. L'azoto è rimasto fuori: aggiungerebbe 5 reazioni (litio e magnesio con l'azoto, la sintesi
  dell'ammoniaca con il catalizzatore).
- **Copertura** (`coverage.js` conta la corrente e i gas delle bombole): 315 reazioni con lo scaffale (153 senza
  alimentatore e bombole), 494 con l'armadio (395), 1174 con tutto il magazzino, su 1231 che il simulatore sa fare.
- **Legenda, finestrelle e testi**: righe per ogni strumento (rubinetto, carta da filtro, pinza, mantello, alimentatore,
  volantini, sonde, pipetta), lettura grande delle sonde nella finestrella, testi in italiano e inglese; voci della
  modalità Spiega «Strumenti del laboratorio», «Titolazione», «Filtrazione», «Distillazione», «Elettrolisi» (anche nella
  versione semplice).
- **Richieste in corso d'opera**: con un oggetto in mano `A` e `D` lo ruotano (in prima persona al posto dei passi di
  lato, nella vista del bancone al posto del cambio di postazione); barattoli e bottiglie presi in mano mostrano sempre
  l'etichetta a chi li tiene; il quaderno è un oggetto sul bancone A (si apre con un clic) con un tutorial di 17 pagine
  illustrate in SVG (`src/game/tutorial.js`); camminata 3,6 m/s e corsa 6,2 m/s (+20 %).
- Rimandati: provette e portaprovette, propipetta, beuta da vuoto, triangolo, accenditore piezoelettrico, raccolta dei
  gas su acqua; arriveranno con le esercitazioni che li usano (G6).

### G5 — fatto

- **Ricette generate** (`src/game/book.js`, puro e testato): per ogni reazione del simulatore gli ingredienti nelle forme
  che il magazzino dà davvero (`storeIndex`: solido, liquido, soluzione 0,1 o 1 M, i gas delle bombole, l'aria; si
  preferiscono i reagenti dello scaffale e dell'armadio), le dosi da una dose di riferimento di 0,01 mol per coefficiente
  con un eccesso del 20 % (acidi e basi alla pari), limitate a 60 mL di soluzione, 6 g di solido e 20 mL di liquido
  puro, arrotondate a 0,05 g e a 1 mL (0,1 mL con la pipetta) e poi ribilanciate; il recipiente; il livello della piastra
  scelto con la temperatura a cui si ferma il recipiente (`plateEquilibrium`, con le sue perdite) o il Bunsen con la
  fiamma; catalizzatori e reagenti ausiliari; i passi da modelli per tipo (cappa, pesa, misura, catalizzatore, agita,
  piastra, Bunsen, fiamma, lampada, alimentatore, bombola, aspetta, osserva, filtra, pinza, smaltisci) con il controllo
  che li spunta nel gioco; difficoltà da 1 a 3 provette; pittogrammi dei reagenti; cappa per i gas tossici.
- **Veridicità**: `runRecipe` esegue ogni ricetta con il motore dei contenitori (una combustione è il fuoco nel
  recipiente, come nel gioco) e la considera riuscita quando ha consumato almeno il 5 % del reagente limitante;
  `scripts/book.mjs` scrive le 668 riuscite (su 806 costruite) in `src/game/data/book-verified.js` con i secondi di gioco
  e il rifiuto finale, e un test controlla che il file corrisponda al motore. Le altre 425 reazioni non si fanno nel
  laboratorio: gas che non ci sono (F₂, CO, H₂S…), forni oltre i 900 °C, sali fusi, esplosivi; quelle costruite ma non
  riuscite sono soprattutto reazioni tra solidi in cui l'aria arriva prima (il ferro con lo zolfo si ossida).
- **Pagine scritte a mano** (`src/game/data/book-pages.js`): 24 strumenti, 15 tecniche (con gli esempi numerici di
  diluizione e titolazione), 5 di sicurezza, in italiano, inglese e versione semplice, con la frase su come si fa nel
  gioco controllata sul codice; vignette in `src/game/book-figures.js` (le primitive del tutorial).
- **Elementi**: `src/game/data/element-production.js`, una voce per elemento con la via principale (miniera e industria,
  aria liquida, elettrolisi, sottoprodotto, reattore, acceleratore, decadimento) e due o tre frasi in italiano e in
  inglese (fonti CRC Handbook, Greenwood ed Earnshaw, rapporti IUPAC/IUPAP per 101–118); la pagina mostra le ricette che
  liberano l'elemento e le altre reazioni del catalogo con il motivo.
- **Nel gioco**: libro sul bancone A e sulla cattedra, tasto `B`, pulsante nella pausa, collegamento dal quaderno;
  lettore con indice, ricerca per nome, formula ed elemento, filtro «solo con lo scaffale»; «Prepara sul banco» (solo nel
  Laboratorio libero: nella Carriera il banco lo prepara l'insegnante) e «Segui la ricetta» con il riquadro in basso a
  sinistra; pagina del tutorial e voce Spiega.
- **Richieste in corso d'opera**: i solidi non si comportano più come liquidi (angolo di riposo nel recipiente, getto di
  grani, mucchietto conico su bancone e pavimento).
- **Correzioni**: il calore delle reazioni passa anche al recipiente; il catalogo del magazzino mostra i metalli in pezzi
  (leggeva `el.Z` invece di `el.z`); `LAB_MAX_T` sale a 1173 K (crogiolo nella fiamma del Bunsen).
- Rimandati: le pagine sbloccate dai capitoli e il libro nelle verifiche (G6, con la Carriera); i collegamenti alla
  scheda dell'elemento nella tavola; le molecole in piccolo accanto all'equazione.

## Verifiche

- `npm test`: copertura delle reazioni dello scaffale, segnali osservabili delle reazioni (es. AgNO₃ + NaCl → precipitato
  bianco, Zn + HCl → bolle di H₂, Cu + HCl → niente, con il motivo), quaderno e salvataggi (migrazione delle versioni),
  ogni esercitazione risolvibile da una «soluzione» scritta nei dati, valutazione e prezzi.
- Libro: ogni ricetta eseguita dal motore dei contenitori dà i prodotti e le osservazioni scritte; le quantità tornano
  con le masse molari; ogni elemento ha la sua pagina con la fonte; nessuna pagina manca in una delle tre lingue.
- Screenshot automatici (Playwright) della stessa inquadratura nei tre preset, per confrontare luce e leggibilità prima
  e dopo ogni fase.

## Da decidere con l'utente

1. Ordine: iniziare da **G1** (luce e leggibilità), che risolve subito il problema segnalato?
2. Carriera: va bene l'anno scolastico in 10 capitoli e circa 45 esercitazioni, con stelle, soldi, reputazione e pagella?
3. Audio: suoni generati nel codice (versamento, bolle, fiamma, vetro rotto, allarme) sì o no?
4. Una PR per fase oppure tutte le fasi in questa PR?
5. Libro: va bene che nelle verifiche della Carriera mostri i metodi ma non la soluzione? Lo anticipiamo prima di G5
   (ad esempio solo strumenti e tecniche insieme a G4)?
