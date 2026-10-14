# Portare in laboratorio i gesti di Cooking Simulator

Cooking Simulator (Big Cheese Studio, 2019) gestisce oggetti e liquidi con uno schema semplice: **una mano sola più la mira**. Con il clic sinistro si prende e si posa, il tasto destro ruota o annulla, il tasto centrale lancia (più lo tieni premuto, più forte), Maiusc tenuto premuto apre una "manipolazione precisa". I liquidi sono **quantità in millilitri e grammi dentro ogni contenitore**, non fluidi simulati. Si versano in una modalità a parte, con un **cerchio rosso** che segna dove cadrà il getto e l'inclinazione regolata dal mouse. Una **legenda dei comandi in basso a destra** mostra sempre cosa si può fare in quel momento. Il nostro simulatore ha già una fisica più rigorosa in diversi punti (livello del liquido sempre orizzontale, portata calcolata come uno stramazzo), ma ha due problemi concreti, entrambi verificati sul codice. I due sgabelli sono cilindri statici pieni che chiudono il corridoio tra i banconi: il giocatore resta chiuso tra x = −0,49 e x = 0,59. E il basso a destra è già occupato dalla scheda `.gm-card--looked`. Le correzioni sono piccole e sicure. Basta accostare gli sgabelli al bancone (z = 0,25 invece di 0,45) per liberare il passaggio, come ho verificato con Rapier 0.19.3; poi si possono rendere spingibili. La legenda va in una colonna in basso a destra, con la scheda "guardi" sopra. **Nota sulle fonti:** tutte le pagine web (guide, thread Steam, note di patch, recensioni) sono state lette **tramite gli estratti e i riassunti del motore di ricerca**, perché l'accesso diretto ai siti era bloccato. Nessuno ha osservato il gioco in prima persona. Per questo ogni affermazione sul gioco porta un'etichetta di affidabilità.

**Come leggere le etichette.** **[Documentato]** vuol dire che una guida, un thread o una nota di patch sul gioco lo riporta, letto tramite l'estratto del motore di ricerca. **[Attribuzione incerta]** vuol dire che l'estratto mescolava più thread. **[Dedotto]** è un'inferenza nostra, che nessuna fonte conferma. **[Ignoto]** vuol dire che nessuna fonte trovata ne parla. **[Codice]** è un fatto verificato leggendo il nostro repository. **[Prova Rapier]** è un esperimento eseguito in Node con il WASM vero di `@dimforge/rapier3d-compat` 0.19.3: alcuni li hanno fatti i ricercatori, quelli sugli sgabelli li ho rifatti io scrivendo questo report, con uno script temporaneo fuori dal progetto. I numeri di riga si riferiscono al codice attuale: i file di `src/` e `tests/` sono identici tra il commit delle note (`27bd862`) e quello di oggi (`09c3837`). Il report descrive **solo meccaniche**: non si propone di copiare codice o asset del gioco.

## Cooking Simulator governa gli oggetti con tre tasti del mouse e un modificatore

**Prendere.** Si prende con **un clic sinistro sull'oggetto mirato**, senza tenerlo premuto. Il clic sinistro è descritto come "Confirm / Interaction / Take / Put down to container or plate" ([Gamepressure, Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8)) [Documentato]. In mano va **un solo ingrediente alla volta**. Per prenderne di più si impugna un contenitore (piatto, tagliere, pentola) e si mira un pezzo, che **si evidenzia**. Con la rotella si allarga la selezione ad altri pezzi **dello stesso tipo**, poi si clicca per prenderli tutti ([Steam: Picking up multiple items](https://steamcommunity.com/app/641320/discussions/3/1638661595057742051/); [Steam: how to pick up multiple pieces?](https://steamcommunity.com/app/641320/discussions/3/1638661595060400955/)) [Documentato]. Un'abilità sbloccabile, "Long Reach", aumenta la distanza a cui si può prendere e posare ([Fandom: Perks](https://cooking-simulator.fandom.com/wiki/Perks)) [Documentato]. La distanza di presa in metri, la forma esatta dell'evidenziazione e la posizione dell'oggetto rispetto alla camera **non risultano da nessuna fonte** [Ignoto].

**Trasportare.** Nessuna fonte descrive come l'oggetto tenuto segue la camera. Ci sono però indizi chiari che **il contenuto dei contenitori resta fisico**. I giocatori lamentano "food flying off my plate while walking" ([Steam: Physic fix?](https://steamcommunity.com/app/641320/discussions/0/2439210120851694449)). La guida più citata sconsiglia di correre perché quello che porti "tends to fly to god knows where" ([Steam Guide: Making The Game Work With You](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)) [Documentato]. Che l'oggetto tenuto sia guidato in modo "morbido" verso un punto davanti alla camera mentre il contenuto resta dinamico è un'inferenza [Dedotto].

**Ruotare.** Il tasto destro tenuto premuto più il movimento del mouse ruota l'oggetto. La guida lo elenca come "Rotate the item / Cancel rotation" ([Gamepressure, Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8)) e lo conferma per la modalità precisa ([Gamepressure: Accurate handling](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50658)) [Documentato]. **Gli assi di rotazione e la sensibilità non sono documentati** [Ignoto]. Nel seguito, Cooking Simulator 2, i giocatori hanno criticato una rotazione lenta e che si azzera a ogni ingrediente ([Steam CS2 Demo: Precision placement?](https://steamcommunity.com/app/2455360/discussions/1/800091752203749137/)) [Documentato]. È un difetto da evitare.

**Posare.** La posa normale è un **clic sinistro sul piano o su un contenitore**, mentre il tasto destro "rimette a posto" ([Gamepressure, Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8)) [Documentato]. Se il clic non posa, la community consiglia di verificare che sia attiva l'opzione "context control" ([Steam discussion](https://steamcommunity.com/app/641320/discussions/0/2257935717984301665)) [Documentato]. I pezzi messi in un piatto "gravitate towards the center" ([Steam: Stuff falls off plates?](https://steamcommunity.com/app/641320/discussions/0/3195801972006513639/)) [Documentato]. Nel tutorial un pomodoro va posato "exactly below the arrow point", quindi esiste almeno un **indicatore a freccia del punto di appoggio** ([Steam: Tutorial controls showing Xbox buttons](https://steamcommunity.com/app/641320/discussions/1/1638661595060190901/)) [Attribuzione incerta]. In Cooking Simulator 2 c'è un'anteprima "fantasma" sospesa, criticata perché **non mostra dove l'oggetto atterrerà** ([Steam CS2 Demo](https://steamcommunity.com/app/2455360/discussions/1/800091752203749137/)) [Documentato]. La lezione per noi: un'anteprima deve mostrare il punto di appoggio vero.

**Manipolazione precisa.** Tenendo **Maiusc** con un oggetto in mano, il mouse sposta l'oggetto liberamente e la camera resta ferma. Clic sinistro più mouse su o giù cambia l'altezza, tasto destro più mouse ruota, e il tasto centrale (che normalmente lancia) **lascia l'oggetto lì dov'è** ([Gamepressure: Accurate handling](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50658); [ChapterCheats, Control Guide PC](https://www.chaptercheats.com/cheat/pc/387592/cooking-simulator/hint/157381)) [Documentato]. In questa modalità l'oggetto **urta e sposta** quelli vicini, e i giocatori si lamentano di "how easy it is to knock everything around" ([Steam: Add Height Adjustment to Context Controls](https://steamcommunity.com/app/641320/discussions/2/1636410430547949865/)) [Documentato].

**Lanciare e rompere.** Il **tasto centrale lancia** e "held longer throws harder" ([Gamepressure, Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8)) [Documentato]. Si può lanciare qualunque oggetto preso. I piatti si rompono facilmente: secondo una fonte "even if you do so much as shake them quickly" ([TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/CookingSimulator)). C'è anche un obiettivo per averne rotti dieci ([TrueAchievements](https://www.trueachievements.com/a305064/shattered-memories-achievement)) [Documentato]. La forza del lancio e la soglia di rottura non sono quantificate da nessuna fonte [Ignoto].

**Spingere oggetti e muoversi.** Gli oggetti si urtano e si rovesciano tra loro, ma **nessuna fonte parla del giocatore che spinge mobili o sedie camminandoci contro** [Ignoto]. Gli sgabelli spingibili proposti più avanti sono quindi una scelta nostra, non una copia del gioco. Ci si muove con **WASD**. La **barra spaziatrice** dà il movimento veloce: una guida dice solo con l'abilità "Fast Feet" attiva ([Gamepressure, Controls](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50632)). Ci si accovaccia con **Ctrl** ([Steam: how to crouch](https://steamcommunity.com/app/641320/discussions/3/2638497042767867986/)), e **Maiusc resta riservato alla precisione** ([Steam discussion](https://steamcommunity.com/app/641320/discussions/0/1640917625017091566)) [Documentato]. La patch 7.5.0 ha rifatto i comandi PC, con tasti completamente personalizzabili ([Steam News 7.5.0](https://store.steampowered.com/news/app/641320/view/710032085365031166)) [Documentato]. Dal post ufficiale che la annuncia si ricava la data del 13 agosto 2026 ([X @cookingsim](https://x.com/cookingsim/status/2087858812258578897)), ma le fonti non sono concordi. Per questo i tasti "classici" descritti dalle guide del 2019 potrebbero non essere più quelli predefiniti.

| Meccanica | Cosa fa Cooking Simulator | Affidabilità |
|---|---|---|
| Presa | Clic sinistro sull'oggetto mirato, un oggetto in mano; più pezzi solo dentro un contenitore, con la rotella | Documentato |
| Evidenziazione | L'oggetto mirato si evidenzia; forma e colore ignoti | Documentato (forma ignota) |
| Trasporto | Contenuto dei contenitori fisico (cade correndo); guida dell'oggetto tenuto non descritta | Documentato / Dedotto |
| Rotazione | Tasto destro + mouse; assi e velocità ignoti | Documentato (dettagli ignoti) |
| Posa | Clic sul punto mirato; indicatore a freccia nel tutorial; in CS2 fantasma sospeso criticato | Documentato / Attribuzione incerta |
| Precisione | Maiusc tenuto: mouse sposta, sinistro + mouse alza, destro + mouse ruota, centrale lascia | Documentato |
| Lancio | Tasto centrale, più a lungo = più forte; piatti fragili | Documentato |
| Spinta | Gli oggetti si urtano; nessuna spinta di mobili da parte del giocatore | Ignoto |
| Movimento | WASD, Spazio veloce, Ctrl accovacciato, Maiusc per la precisione | Documentato |

## I liquidi sono millilitri in un contenitore, versati sotto un cerchio rosso

**Versare.** Sul PC si apre la bottiglia con **E** e la si porta sopra la padella finché compare un **cerchio rosso**. Poi si **tiene premuto il clic sinistro e si muove leggermente il mouse su o giù** per regolare quanto olio esce. "The oil will flow out quickly, so be prepared" ([Twinfinite: How to Pour Oil](https://twinfinite.net/guides/cooking-simulator-oil-pour-how/)) [Documentato]. Un'altra risposta descrive la variante "clic sulla padella, poi inclina tenendo il sinistro e muovendo il mouse in giù" ([Steam: how to pour the oil](https://steamcommunity.com/app/641320/discussions/0/2564160288798713913/)). Lo staff ne indica una seconda con Maiusc più tasto destro per ruotare la bottiglia ([Steam, Tech Support](https://steamcommunity.com/app/641320/discussions/1/4925219329796642620)) [Documentato]. Una guida consiglia di controllare che il "red direction indicator" sia sul punto voluto, per non versare fuori ([TheGamer](https://www.thegamer.com/cooking-simulator-beginner-tips/)) [Documentato]. Nessuna fonte dà la formula tra angolo e portata [Ignoto]. Che il cerchio sia il punto d'impatto di una traiettoria calcolata è un'inferenza [Dedotto].

**Quantità.** I liquidi si misurano in **mL** e i solidi in **g**. Le ricette chiedono valori esatti, per esempio **1000 mL d'acqua e 20 g di sale**, poi 120 s di bollitura. Alcune ricette hanno una "very low error tolerance" ([Steam: Not enough salt?](https://steamcommunity.com/app/641320/discussions/3/1636410430564142070/)) [Documentato]. Per correggere si usano **mestoli da 50 e 150 mL** e una **pipetta da 5 o 10 mL**, oppure si assaggia con E, che toglie circa 1 mL per volta ([Steam: Tips on pouring/measuring liquids](https://steamcommunity.com/app/641320/discussions/0/1606022547916749165/); [Steam Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)) [Documentato]. La strategia consigliata è **versare in eccesso e poi togliere**. Il valore numerico della tolleranza non è noto [Ignoto].

**Livello e getto.** Una patch del 2020 ha migliorato i "particle effects for pouring water" e la visualizzazione del liquido in un contenitore specifico ([SteamDB patch 4555231](https://steamdb.info/patchnotes/4555231/)) [Documentato]. Quindi il getto è fatto almeno in parte di particelle. In Cooking Simulator 2 una patch ha ridotto il "excessive wave movement when only small amounts of liquid are present" e ha rifatto il colore delle macchie di liquido ([Steam CS2 news](https://steamcommunity.com/app/2455360/allnews/)) [Documentato]. Questo indica una superficie disegnata con uno shader che oscilla, non un fluido simulato [Dedotto]. Per il primo gioco **nessuna fonte conferma che la superficie resti orizzontale inclinando** il contenitore [Ignoto]. Solo alcuni piatti possono contenere liquidi: negli altri il liquido "sparisce o schizza" ([Steam Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)) [Documentato].

**Rubinetto, spezie, sporco.** Per riempire si tiene la pentola o la caraffa e **si clicca sul lavello**: si apre una vista dedicata in cui si riempie fino al volume voluto ([Steam: Water problem solved](https://steamcommunity.com/app/641320/discussions/0/2961642185101389396/); [Steam Guide: How to Run Your Kitchen Smoothly](https://steamcommunity.com/sharedfiles/filedetails/?id=1766000427)) [Documentato]. Lo scolapasta lascia passare solo l'acqua ([Steam: Drain](https://steamcommunity.com/app/641320/discussions/3/1636410430549497068/)) [Documentato]. Per le spezie si clicca sul cibo con il contenitore in mano. La visuale passa all'alto, con il contenitore capovolto e un **bersaglio rosso circolare** da portare sul cibo prima di "scuotere"; il tasto destro annulla ([Steam: how do i use the spice container?](https://steamcommunity.com/app/641320/discussions/3/1638661595053177197/)) [Documentato]. Un post parla di "1 click = 1 dash" ([Steam: Can't Season](https://steamcommunity.com/app/641320/discussions/3/2733047810450486565/)) [Attribuzione incerta]. Quello che si versa fuori lascia **macchie**. I piani si puliscono con la spugna (E) e il pavimento con il mocio ([Gamepressure: Cleaning](https://www.gamepressure.com/cooking-simulator/cleaning-in/z3c5d7)). Esistono macchie da cibo versato e macchie da guasto degli apparecchi ([Twinfinite: How to Clean](https://twinfinite.net/guides/cooking-simulator-clean-how/)) [Documentato].

**Cosa non funziona, secondo giocatori e critica.** Il versamento è la meccanica più criticata. Una recensione lo definisce "oversensitive" ([TheXboxHub](https://www.thexboxhub.com/cooking-simulator-review-hellish-kitchen/)). Nei thread si legge che il cerchio a volte compare solo a versamento iniziato e che manca la finezza per le piccole dosi ("tutto o niente") ([Steam: Great concept poor in execution](https://steamcommunity.com/app/641320/discussions/0/3342162929518905767/)) [Attribuzione incerta]. La versione VR ha poi ricevuto una "fluid-aim assistance" ([Steam: Cooking Simulator VR news](https://steamcommunity.com/app/1358140/allnews/)) [Documentato]. Insieme, questi segnali dicono che il problema non è la fisica ma il **feedback**. Serve vedere dove cade il getto prima che parta, avere una zona di flusso lento e leggere i millilitri [Dedotto].

| Meccanica | Cosa fa Cooking Simulator | Affidabilità |
|---|---|---|
| Versare | Modalità contestuale, cerchio rosso sul punto d'impatto, sinistro + mouse su/giù dosa il flusso | Documentato |
| Quantità | mL e g per contenitore, ricette esatte, mestoli 50/150 mL, pipetta 5/10 mL, assaggio ≈ 1 mL | Documentato |
| Livello | Liquido visibile; in CS2 superficie ondeggiante; orizzontalità in CS1 non documentata | Documentato / Ignoto |
| Getto | Particelle (patch 2020); forma esatta ignota | Documentato / Ignoto |
| Rubinetto | Clic sul lavello con il contenitore in mano, vista dedicata, volume obiettivo | Documentato |
| Spezie | Vista dall'alto, bersaglio rosso, scuotere, destro annulla | Documentato |
| Macchie | Macchie colorate, spugna sui piani, mocio sul pavimento | Documentato |
| Assistenza | "Fluid-aim assistance" aggiunta nella versione VR | Documentato |

## La legenda in basso a destra fa da manuale sempre aperto

La fonte più chiara è la guida dei comandi: "most of the keys work in context, and the actions and their keyboard shortcuts appear in the **lower right corner of the screen**" ([Gamepressure, Controls](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50632)) [Documentato]. I giocatori si rimandano a vicenda a "check the tooltips in the lower right corner" ([Steam: Can't Season](https://steamcommunity.com/app/641320/discussions/3/2733047810450486565/)) [Documentato]. Con un controller la stessa area mostra i pulsanti Xbox, per esempio Y per lanciare e LT per i comandi avanzati ([Steam: Tutorial controls showing Xbox buttons](https://steamcommunity.com/app/641320/discussions/1/1638661595060190901/)) [Documentato]. Nel tutorial, alla pressione di Ctrl "the CTRL outline turns green": il riquadro del tasto premuto si illumina (stesso thread) [Attribuzione incerta]. Dalla patch 7.5.0 le icone passano da sole tra tastiera e controller, e il tutorial mostra i tasti rimappati ([Steam News 7.5.0](https://store.steampowered.com/news/app/641320/view/710032085365031166)) [Documentato]. Il bug più ricordato dai giocatori era proprio il glifo sbagliato: icone del controller per chi usava la tastiera (thread citato sopra). Il mirino è un punto ([Steam: first menu tutorial](https://steamcommunity.com/app/641320/discussions/1/1638661595050222630/)). Mirando un ingrediente compare una barra di cottura verde o rossa ([TheGamer](https://www.thegamer.com/cooking-simulator-beginner-tips/)) [Documentato].

Una legenda serve proprio perché gli stessi tasti cambiano significato a seconda di cosa tieni e cosa guardi: con la spezia il clic scuote, con la bottiglia inclina, con il coltello taglia. **Il contenuto si ricalcola a ogni cambio di stato** (mani vuote, oggetto mirato, oggetto in mano, in mano più mirato, modalità precisa) [Dedotto]. Non si sa com'è fatta graficamente (colori, numero di righe, trasparenza), né se esista un'opzione per nasconderla [Ignoto]. Le linee guida Xbox sull'accessibilità chiedono un aiuto contestuale inline e uno stile coerente per le azioni non disponibili ([Xbox XAG 114](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-114-ui-context)). Un'analisi di design avverte che troppi significati per lo stesso tasto confondono ([GamesFirst](https://gamesfirst.com/articles/2007/the-problem-with-context-sensitive-buttons/)). Ne seguono due regole per noi: la stessa azione sta sempre nella stessa riga e nello stesso ordine, e un'azione quasi possibile si mostra attenuata invece di sparire.

| Tasto (schema classico 2019) | Azioni in Cooking Simulator |
|---|---|
| Clic sinistro | Conferma, interagisci, prendi, posa su piatto o contenitore; tenuto + mouse: inclina per versare |
| Tasto destro | Annulla, rimetti giù, ruota l'oggetto, annulla la rotazione |
| Tasto centrale | Lancia (più a lungo = più forte); in modalità precisa: lascia l'oggetto |
| Rotella | Scorre le liste, allarga la selezione multipla, cambia il cerchio di spargimento |
| E | Solleva, apri la bottiglia, pulisci con la spugna, assaggia, avvia il cronometro |
| Q | Raggruppa i componenti in un contenitore |
| Maiusc (tenuto) | Manipolazione precisa |
| W A S D, Spazio, Ctrl | Movimento, movimento veloce, accovacciarsi |

Fonti della tabella: [Gamepressure, Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8), [Twinfinite](https://twinfinite.net/guides/cooking-simulator-oil-pour-how/), [Steam: ingredients adjustment](https://steamcommunity.com/app/641320/discussions/0/2961642185091290405/) [Documentato, schema anteriore alla patch 7.5.0].

## Il nostro prototipo ha la fisica giusta ma due ostacoli concreti

**Cosa fa oggi il codice [Codice].** Quasi tutta la logica sta in `LabGame` (`src/game/game.js`); input, HUD e dialoghi stanno in `src/game/game-view.js`. Il file `hud.js` citato nel documento di design non esiste. L'oggetto preso **resta un corpo dinamico** con gravità azzerata. A ogni passo fisico (120 Hz) `controlHeld` lo guida a velocità verso un punto davanti alla camera, con guadagno 16 s⁻¹, velocità massima 9 m/s e rotazione massima 14 rad/s. Se resta incastrato a più di 0,9 m per 0,5 s viene lasciato (`game.js:844-874`). Si prende con un clic (`primary`, `game.js:427-435`) e la distanza di presa è fissata tra 0,35 e 0,7 m (`game.js:437-446`). La posa calcola `placeSpot` **solo al momento del clic** e poi **teletrasporta** l'oggetto dritto (`game.js:452-487`, `items.js:356-362`): non c'è anteprima né evidenziazione. Il tasto Q lancia sempre a 6 m/s (`game.js:489-491`). Tasto destro più mouse in su inclina il contenitore. Mentre inclini **la camera resta ferma** e, rilasciato il tasto, **l'inclinazione rimane** (`game.js:497-501`, `game-view.js:508-517`). Lo stato `pouring` viene impostato ma nessuno lo legge (`game.js:87, 471, 493-495`).

I liquidi sono già più rigorosi che nel gioco di riferimento. Il livello viene da 320 punti campionati nel volume interno e resta orizzontale a ogni inclinazione (`liquid.js:130-156`). La portata è quella di uno stramazzo, `q = 1,77 · b · h^1,5` con carico limitato a 3 cm, più 40 mL/s oltre (`game.js:957-990`): per un becher da 250 mL fa circa 8 mL/s a 3 mm di carico, 84 mL/s a 1 cm e 600 mL/s a 3 cm. Il getto è una parabola calcolata (`game.js:928-954`) disegnata con 1-5 goccioline per fotogramma, **senza controllo degli ostacoli** (`game.js:1011-1018`). L'assistenza alla mira porta la bocca sopra il bersaglio con un'inclinazione da 0,25 rad in su (`game.js:792-803`). In vista bancone, però, la correzione della deriva usa la direzione +z del mondo e non quella della postazione: nelle postazioni del lavandino e della cappa va nel verso sbagliato (`game.js:801`) [Dedotto dal codice, da verificare nel browser]. Il rubinetto versa 25 mL/s (`game.js:25`). Le pozze sono dischi che crescono col volume, con spessore di 1,5 mm; si asciugano con la carta (fino a 40 mL) ed evaporano piano (`game.js:1022-1051`, `693-707`).

**Gli sgabelli chiudono il corridoio [Codice, Prova Rapier].** Il ciclo `room.js:182-187` crea, a x = −0,95 e x = 1,05 con z = 0,45, una seduta e un'asta sottile. Il collisore però è un **cilindro statico pieno**, `physics.cylinder(x, 0.32, 0.45, 0.32, 0.17)`: raggio 0,17 m, alto da 0 a 0,64 m, molto più ingombrante della mesh. Il corridoio tra il piano del bancone A (che finisce a z = 0,07) e quello del bancone B (che inizia a z = 1,13) è largo 1,06 m. La capsula del giocatore ha raggio 0,28 più 0,02 di margine (`physics.js:85-97`, `player.js:6-10`), quindi il suo centro può stare solo tra z = 0,37 e z = 0,83. Per superare uno sgabello servirebbe una distanza di 0,47 m dal suo asse, cioè z ≤ −0,02 oppure z ≥ 0,92: entrambi fuori dal corridoio. Il giocatore parte proprio tra i due sgabelli, in (0,15; 0,4) (`player.js:25-26`), e le postazioni `bench` e `shelf` lo teletrasportano lì (`room.js:37-44`). Risultato, verificato con Rapier: si ferma a **x = 0,587** andando a est e a **x = −0,487** andando a ovest. Ho rifatto la prova scrivendo questo report e ho ottenuto gli stessi numeri.

**Il controllore del personaggio non usa filtri [Codice].** `player.js:110` chiama `computeColliderMovement` senza gruppi né predicato, e i lanci di forma del controllore ignorano i gruppi di collisione dei collisori. Per questo un oggetto dinamico grande (una scatola da 4 kg nella prova) **ferma** il giocatore senza essere spinto (`setApplyImpulsesToDynamicBodies(false)`). In una prova dei ricercatori, l'oggetto tenuto in mano rallenta la camminata del 15% finché non lo si esclude dal movimento ([npm @dimforge/rapier3d-compat 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3)) [Prova Rapier]. Da noi la distanza minima di presa (0,3 m) coincide con il raggio della capsula più il margine (0,30 m), quindi il caso è plausibile anche qui.

**Il basso a destra è occupato [Codice].** L'HUD ha una scheda "in mano" in basso a sinistra e una scheda **"guardi" (`.gm-card--looked`) in basso a destra**, entrambe a `bottom: 16px` e larghe `min(300px, 36vw)` (`game.css:193-208`). L'allarme sta in basso al centro, a 120 px (`game.css:328-340`). I comandi a schermo sono oggi solo righe di testo sotto il mirino (`prompt()`, `game.js:1482-1512`) e la mini-legenda della visuale in alto a destra (`game-strings.js:44-45`). L'elenco completo appare solo nella finestra di aiuto con H (`game-view.js:368-377`). Una legenda messa in basso a destra con `position: absolute` si sovrapporrebbe alla scheda.

| Meccanica | Cooking Simulator | Noi oggi | Passo del piano |
|---|---|---|---|
| Movimento libero | WASD senza ostacoli assurdi | Sgabelli che intrappolano (`room.js:182-187`) | 1, 2 |
| Legenda contestuale | In basso a destra, sempre | Solo righe sotto il mirino; basso a destra occupato | 3, 4 |
| Evidenziazione | Sì | No (`updateHover`, `game.js:398-424`) | 5 |
| Fine del versamento | Rilasci e smetti | L'inclinazione resta (`game.js:497-501`) | 6 |
| Dosaggio fine | Criticato: "tutto o niente" | Portata fino a 600 mL/s, nessuna zona lenta | 7 |
| Punto d'impatto | Cerchio rosso | Assente | 8 |
| Getto | Particelle | Goccioline senza ostacoli | 9 |
| Anteprima di posa | Freccia (tutorial); fantasma in CS2 | Assente, teletrasporto | 10 |
| Lancio | A carica | Fisso 6 m/s | 11 |
| Rotazione | Destro + mouse | Solo yaw della camera + inclinazione | 12 |
| Precisione | Maiusc tenuto | Solo vista bancone; Maiusc = corsa | 13 |
| Rubinetto | Clic sul lavello, volume obiettivo | E apre/chiude; E con recipiente = lava subito | 14 |
| Macchie | Macchie colorate, pulizia | Pozze, carta, evaporazione | 15 |

## Piano di lavoro in sedici passi, dal corridoio libero al versamento fine

L'ordine segue le due richieste dell'utente (passi 1-4), poi il versamento, che in un laboratorio di chimica è il gesto principale (passi 5-9), poi la manipolazione degli oggetti (passi 10-14) e infine le rifiniture (15-16). Ogni passo è pensato come **un commit autonomo**. Dopo ogni passo si eseguono `npm test` (cioè `node --test "tests/**/*.test.mjs"`, `package.json:21`) e una prova nel browser con `npm run dev:web` (Vite su `127.0.0.1:5173`). Le chiavi di testo nuove vanno sempre aggiunte **sia in `it` sia in `en`** di `src/game/game-strings.js`: la tabella `eli6` ricade sull'italiano. Il test `strings.test.mjs:11-19` controlla da solo ogni `t('chiave')` scritto in modo letterale in `game.js`, `game-view.js` e `orders.js`.

### Passo 1 — Accostare gli sgabelli al bancone (correzione minima della richiesta 1)

**Dove.** `src/game/room.js`, oggetto `LAYOUT` (righe 13-31) e ciclo degli sgabelli (righe 182-187).

**Cosa.** Aggiungere a `LAYOUT` la voce `stools: [{ x: -0.95, z: 0.25 }, { x: 1.05, z: 0.25 }]` e far leggere da lì il ciclo, invece di `for (const x of [-0.95, 1.05])` con `0.45` ripetuto tre volte. Il mobile del bancone A finisce a z = 0,05: uno sgabello di raggio 0,17 a z = 0,25 resta a 3 cm dal mobile. Dietro di sé lascia libera una fascia in cui il centro della capsula può passare, da z = 0,72 a z = 0,83, e la sua seduta (alta 0,64 m) sta sotto il piano del bancone (0,88-0,92 m).

**Valori.** z = 0,25 m; raggio 0,17 m e altezza 0,64 m invariati.

**Verifica.** [Prova Rapier] Ho ricreato pavimento, banconi A e B come in `room.js:170-175`, capsula 0,28/0,55 e controllore come in `physics.js:85-97`. Con gli sgabelli a z = 0,45 il giocatore si ferma a x = 0,587 e −0,487. Con gli sgabelli a z = 0,25 esce dal corridoio in entrambe le direzioni, anche partendo rasente al bancone A (z = 0,37): il controllore lo fa scivolare attorno allo sgabello fino a z ≈ 0,72 e dopo 1 s è già a x = 1,83. **Test node:test** da aggiungere in `tests/game/physics.test.mjs` subito dopo il test del muro (righe 37-52). Importare `LAYOUT` e `BENCH_Y` da `room.js`, che si può già importare in Node (lo fa `strings.test.mjs:9`). Ricreare pavimento e banconi con `ph.box` e gli sgabelli con `ph.cylinder(s.x, 0.32, s.z, 0.32, 0.17)`. Partire da (0,15; 0,4) e camminare per 4 s a 2,1 m/s verso +x, poi in un secondo mondo verso −x; asserire `Math.abs(x) > 1.9`. Oggi il test fallisce, dopo il passo 1 passa. **Browser:** modalità Libera, camminare a est e a ovest dalla partenza, poi Tab per andare alla postazione del bancone e tornare indietro.

### Passo 2 — Rendere gli sgabelli spingibili e filtrare il controllore

**Dove.** `src/game/physics.js`: gruppi (righe 17-25), nuovo metodo accanto a `cylinder` (righe 49-55), `player()` (righe 85-97). `src/game/player.js`, riga 110. `src/game/room.js`, righe 182-187. `src/game/game.js`: `update` (righe 1423-1464), `startFree`/`startCareer` (righe 225 e 234), `toggleView`/`station` (righe 519-526).

**Cosa.** Prima si aggiunge un gruppo per gli arredi mobili e una maschera di ricerca per il giocatore. In Rapier due collisori interagiscono solo se l'appartenenza di ciascuno compare nel filtro dell'altro, quindi il nuovo bit va aggiunto anche ai filtri esistenti:

```js
export const G = { STATIC: 1, ITEM: 2, PLAYER: 4, DEBRIS: 8, PROP: 16 };
const GROUPS = {
  static: group(G.STATIC, G.ITEM | G.PLAYER | G.DEBRIS | G.PROP),
  item: group(G.ITEM, G.STATIC | G.ITEM | G.DEBRIS | G.PROP),
  player: group(G.PLAYER, G.STATIC),                 // il risolutore non spinge col corpo cinematico
  debris: group(G.DEBRIS, G.STATIC | G.ITEM | G.PROP),
  prop: group(G.PROP, G.STATIC | G.ITEM | G.DEBRIS | G.PROP | G.PLAYER),
  playerQuery: group(G.PLAYER, G.STATIC | G.PROP),  // cosa "vede" il controllore
};
```

Poi si crea il metodo `Physics.prop({ x, z, hh, r, mass, owner })`. Fa un `RigidBodyDesc.dynamic()` con `setLinearDamping(2)`, `setAngularDamping(4)` ed `enabledRotations(false, true, false)`, così lo sgabello gira solo attorno alla verticale e non si ribalta mai. Il collisore è `ColliderDesc.cylinder(hh, r)`, traslato di `hh` verso l'alto, con `setMass(mass)`, attrito 0,5, restituzione 0 e gruppo `prop`. In `player()` si attivano `setApplyImpulsesToDynamicBodies(true)` e `setCharacterMass(80)`: senza la massa, Rapier usa quella del corpo cinematico, circa 0,4 kg per una capsula a densità 1 ([npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3)). Il metodo restituisce anche `query: GROUPS.playerQuery`. In `player.js:110` la chiamata diventa `controller.computeColliderMovement(collider, delta, undefined, this.cc.query)`. Da quel momento il controllore vede solo la stanza e gli arredi mobili: non più la vetreria né l'oggetto in mano, e così sparisce anche il rallentamento dovuto all'oggetto tenuto. In `room.js` seduta e asta vanno in un `THREE.Group` con il corpo creato da `physics.prop`. `buildRoom` restituisce `props: [{ mesh, body, home }]`. In `game.js`, subito dopo `physics.step`, si copiano posizione e rotazione dei props sulle mesh, come fa `syncItem` (`items.js:365-371`). Un nuovo `resetProps()` va chiamato in `startFree`/`startCareer`. Dopo ogni teletrasporto di `enterBench` o `station`, ogni sgabello a meno di 0,5 m dal punto `stand` torna a casa.

**Effetti collaterali voluti.** Il giocatore **attraversa** gli oggetti dinamici, compreso l'estintore da 4 kg. È meglio così: con gli impulsi attivi la vetreria a terra verrebbe calciata e, sopra 3,3 m/s (`game.js:22`), potrebbe rompersi. `placeSpot` rifiuta le superfici dinamiche (`game.js:456`), quindi non si posa sugli sgabelli. I raggi `solidOnly` (`physics.js:141-149`) ignorano gli sgabelli: un liquido versato su uno sgabello forma la pozza sul pavimento.

**Valori.** Massa dello sgabello 5 kg; smorzamento lineare 2, angolare 4; attrito 0,5; restituzione 0; rotazioni solo attorno alla verticale; massa del personaggio 80 kg; l'autostep resta `includeDynamicBodies = false` (già così in `physics.js:93`), così il giocatore non sale sugli sgabelli.

**Verifica.** [Prova Rapier] Con questi gruppi e valori, partendo da (0,15; 0,4), il giocatore esce a est e a ovest in 1,0-1,2 s. Lo sgabello viene spinto fino a x ≈ ±2,0 e resta **perfettamente dritto** (inclinazione 0,0000). Un becher appoggiato a terra sulla traiettoria **non si muove**. In una prova dei ricercatori con una sedia da 5 kg, il giocatore che spinge scendeva a circa il 55% della velocità ([npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3)). **Test node:test:** estendere quello del passo 1 usando `ph.prop` al posto di `ph.cylinder` e la chiamata filtrata. Asserire: uscita `Math.abs(x) > 1.9` entro 2 s; `Math.max(|rot.x|, |rot.z|) < 0.01` per ogni sgabello; un becher dinamico (gruppo `item`) a terra si sposta meno di 1 mm. Il test del muro (righe 37-52) deve restare verde. **Browser:** spingere uno sgabello lungo il corridoio senza tremolii; Tab con uno sgabello spinto vicino al punto della postazione (deve tornare a posto); nuova partita (sgabelli nelle posizioni iniziali).

### Passo 3 — Scrivere il cervello della legenda come modulo puro e testato

**Dove.** Nuovo file `src/game/controls.js`; nuovo test `tests/game/controls.test.mjs`; `tests/game/strings.test.mjs`, riga 14 (elenco dei file) e righe 21-30 (chiavi composte).

**Cosa.** Una funzione pura `legendRows(s)` che non tocca Three.js né il DOM. Riceve lo stato `{ mode, held: null | { kind, container, empty }, target: null | { type, kind, container, bin, on }, canPlace, pouring, precise }` e restituisce righe del tipo `{ key: 'lgTake', keys: ['lmb'], params, down, off }`. Le righe sono al massimo 6, nello stesso ordine per le stesse azioni: prima quelle contestuali, in fondo le righe di base (movimento, visuale, aiuto). Così la legenda **non è mai vuota**, come in Cooking Simulator. Il modulo esporta anche `KEY_IDS` (`lmb`, `rmb`, `mmb`, `wheel`, `mouse`, `e`, `q`, `r`, `tab`, `h`, `i`, `shift`, `space`, `wasd`, `ad`, `esc`) per le etichette dei tasti `key_<id>`. Il contenuto iniziale, che i passi successivi estendono con R, Maiusc, Q tenuto ed E al lavandino:

| Situazione | Righe (tasto → azione) |
|---|---|
| Prima persona, mani vuote, niente mirato | W A S D → Cammina (Maiusc: corri) · Tab → Vista del bancone · H → Tutti i comandi |
| Mani vuote, oggetto mirato | Clic sinistro → Prendi {nome} · righe di base |
| Mani vuote, elemento fisso mirato | E → {accendi la piastra, apri il rubinetto…} · Rotella → Regola (solo piastra) · righe di base |
| Mani vuote, pozza mirata | Riga attenuata: "Serve la carta assorbente" |
| Contenitore in mano | Clic → Posa qui (o "Lascia cadere" se `canPlace` è falso) · Tasto destro + mouse ↑ → Versa (in {bersaglio}) · E → Agita / Lava / Svuota nei {rifiuti} · Q → Lancia · Rotella → Distanza (in vista bancone: Altezza) |
| Strumento in mano | E → azione dello strumento · Clic → Posa · Q → Lancia |
| Durante il versamento | Mouse ↑/↓ → Più o meno inclinato (tasto destro evidenziato) · Rilascia il tasto destro → Smetti di versare |
| Vista del bancone | Righe di base: A / D → Postazione · Tab → Prima persona |

**Valori.** Al massimo 6 righe; righe di base sempre per ultime; `down` indica il tasto da evidenziare mentre è premuto.

**Verifica.** **node:test** in `controls.test.mjs` con sei casi: mani vuote e niente mirato contiene `lgWalk`, `lgView`, `lgHelp`; oggetto mirato mette `lgTake` in prima riga; contenitore in mano con `canPlace: false` dà `lgDrop` e non `lgPlace`; contenitore in mano con un altro contenitore mirato dà `lgPourInto` con il nome; vista bancone dà `lgStation`; durante il versamento una riga ha `down: 'rmb'`. Nessun caso supera 6 righe. In `strings.test.mjs` aggiungere `'controls.js'` all'elenco della riga 14 (la regex `key: '…'` raccoglie già le chiavi `lg…`) e, nel secondo test, il ciclo `for (const k of KEY_IDS) assert.ok(has('key_' + k))`.

### Passo 4 — Mettere la legenda in basso a destra, sotto la scheda "guardi" (richiesta 2)

**Dove.** `game.js`: `prompt()` (righe 1482-1512) e `hud()` (righe 1584-1607). `game-view.js`: `TEMPLATE` (righe 38-58), input (righe 442-522), `renderHud()` (righe 543-570). `src/styles/game.css`: pannelli (righe 86-94), schede (righe 193-208), schermo stretto (righe 777-786). `game-strings.js`: suggerimenti `it` (righe 113-140) ed `en` (righe 395-422).

**Cosa.** In `game.js` un metodo `legend()` costruisce lo stato a partire da `this.held`, `this.hover`, `this.player.mode` e `this.pouring`. Vi aggiunge `canPlace = Boolean(this.placeSpot(this.held))`, un raggio Rapier che costa poco a 10 Hz, e chiama `legendRows`; `hud()` restituisce anche `legend`. Nel `TEMPLATE` la riga della scheda "guardi" diventa un contenitore a colonna. Scheda e legenda non possono più sovrapporsi, perché stanno nello stesso flusso:

```html
<div class="gm-br">
  <section class="gm-card gm-card--looked" hidden></section>
  <ol class="gm-legend" aria-label="${t('legendTitle')}"></ol>
</div>
```

In `renderHud()` si genera l'HTML delle righe, con le etichette dei tasti dentro `<kbd>`, e lo si scrive **solo se è cambiato** (variabile `lastLegendHtml`, come già si fa con `lastOrderHtml`). `game-view.js` tiene un insieme `pressed`, aggiornato in `onKey`, `mousedown` e `mouseup` (oggi esiste solo `rmb`), e aggiunge la classe `is-down` alle righe il cui tasto è premuto. È l'equivalente del riquadro che diventa verde in Cooking Simulator. Dopo la legenda, `prompt()` si riduce a una sola riga **senza tasti**, con il nome o lo stato di ciò che si guarda ("Becher 250 mL", "Piastra: livello 3"), per non dire le stesse cose in due posti. Le vecchie chiavi `prompt…` possono restare, perché il test controlla solo quelle usate. Il tasto I continua a nascondere le schede ma **non la legenda**. In CSS si aggiunge `.gm-legend` al selettore dei pannelli (righe 86-94) per avere lo stesso fondo, si toglie `right: 16px` da `.gm-card--looked` (righe 206-208) e si aggiunge:

```css
.gm-br { position: absolute; right: 16px; bottom: 16px; width: min(300px, 36vw);
  display: flex; flex-direction: column; gap: 8px; }
.gm-br .gm-card { position: static; width: auto; }
.gm-legend { pointer-events: none; margin: 0; padding: 8px 10px; list-style: none;
  display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; font-size: 12.5px; }
.gm-legend li { display: contents; }
.gm-legend li.is-off > * { opacity: 0.45; }
.gm-legend li.is-down kbd { outline: 2px solid var(--accent); }
@media (max-width: 640px) {
  .gm-br { width: calc(50vw - 24px); }
  .gm-legend li:nth-child(n + 5) { display: none; }
}
```

**Valori.** Larghezza come la scheda, `min(300px, 36vw)`; spazio di 8 px tra scheda e legenda; testo da 12,5 px; sotto i 640 px solo le prime 4 righe; HUD sempre a 10 Hz (`game-view.js:18`).

**Verifica.** `npm test`: il test delle stringhe segnala ogni chiave `lg…` o `key_…` mancante in `it` o `en`. **Browser:** passare per le otto situazioni della tabella del passo 3. Con finestre da 1280×720 e da 600 px di larghezza, legenda e scheda non devono mai sovrapporsi e l'allarme in basso al centro deve restare libero. I nasconde la scheda ma non la legenda. Tenendo premuto il tasto destro la riga del versamento si illumina. In pausa l'HUD sparisce come oggi.

### Passo 5 — Evidenziare ciò che si guarda

**Dove.** `game.js`: `updateHover` (righe 398-424), `grab` (righe 437-446), `release` (righe 466-487).

**Cosa.** Usare un contorno a "scafo rovesciato" [Dedotto: il gioco evidenzia, ma non si sa come]. Al primo hover si clonano le mesh dell'oggetto con un materiale condiviso `MeshBasicMaterial({ color, side: THREE.BackSide, transparent: true, opacity: 0.55, depthWrite: false })`, ingrandito di `1 + 0.0025 / raggio` per avere un bordo di circa 2,5 mm su qualunque oggetto. Il clone si salva in `item.outline` ed è visibile solo mentre l'oggetto è mirato e non è in mano. Per gli elementi fissi si usa lo stesso schema con un altro colore. Si aggiunge un'isteresi: se il raggio non trova nulla, si tiene il bersaglio precedente per 120 ms, così contorno e legenda non lampeggiano quando il mirino sfiora un bordo.

**Valori.** Verde `#5fd38d` per gli oggetti, ambra `#f2b84b` per gli elementi fissi; opacità 0,55; bordo 2,5 mm; isteresi 120 ms.

**Verifica.** Niente test Node (serve WebGL); `npm test` resta verde. **Browser:** passare il mirino sui banconi. Si deve vedere un solo contorno alla volta, senza sfarfallii ai bordi e mai sull'oggetto in mano; gli fps (tasto F) non devono scendere.

### Passo 6 — Far tornare dritto il contenitore e lasciare libero lo sguardo mentre si versa

**Dove.** `game.js`: `setPour` (righe 493-495), `tiltBy` (righe 497-501), `update` (righe 1423-1464), `holdTarget` (riga 801). `game-view.js`: `mousemove` (righe 508-517).

**Cosa.** `pouring` diventa lo stato "tasto destro premuto". In `update()`, se `!this.pouring && this.tilt > 0`, l'inclinazione scende di 3 rad/s fino a 0. Rilasciare il tasto vuol dire smettere di versare, che è proprio il "premi per iniziare, rilascia per fermare" chiesto dai giocatori di Cooking Simulator. In `mousemove`, con il tasto destro premuto e un oggetto in mano, il movimento verticale continua a inclinare e quello orizzontale gira lo sguardo a metà sensibilità (`player.look(movementX * 0.5, 0)`, solo in prima persona). Così si corregge la mira durante il versamento. Alla riga 801 la deriva va calcolata con lo stesso yaw usato da `holdQuat` (quello della postazione in vista bancone), non con 0.

**Valori.** Ritorno a 3 rad/s: da un'inclinazione tipica di 1,2 rad a dritto in 0,4 s. Sguardo orizzontale ×0,5 durante il versamento. Sensibilità dell'inclinazione invariata, 0,0045 rad/pixel.

**Verifica.** **node:test:** spostare il calcolo in una funzione pura `relaxTilt(tilt, dt, pouring)` in `controls.js` e verificare: (1,2; 0,1 s; non premuto) → 0,9; con il tasto premuto il valore non cambia; il risultato non è mai negativo. **Browser:** versare da un becher in un altro e rilasciare il tasto destro: il getto deve fermarsi in meno di mezzo secondo. Muovendo il mouse di lato mentre si versa, la mira deve seguire. Nelle postazioni del lavandino e della cappa (Tab, poi A/D) il getto deve cadere nel ricevente e non oltre.

### Passo 7 — Togliere il "tutto o niente" dalla curva di portata

**Dove.** `game.js`: formula in `pourFrom` (righe 957-990) e `tiltBy` (righe 497-501). `src/game/liquid.js`: nuova funzione pura. `src/game/items.js`: `flow` nei `DEFS` (righe 15-56).

**Cosa.** Spostare la formula in `pourRate({ h, R, flow, powder, overfull, drops })` dentro `liquid.js` e cambiare tre cose. (1) **Zona morta**: con un carico sotto 0,5 mm non esce nulla, come il liquido che si "attacca" al bordo. (2) **Tetto**: togliere i +40 mL/s fissi oltre 3 cm di carico (restano solo per il contenitore stracolmo) e limitare a `qMax = 150 · flow` mL/s. Con i `flow` attuali fa 150 per il becher, 105 per la beuta (0,7), 68 per la bottiglia (0,45), 42 per la spruzzetta (0,28) e 180 per il barattolo (1,2). (3) **Zona fine**: `pourFrom` salva il carico in `item.pourHead`. In `tiltBy`, quando il carico del contenitore in mano è tra −2 mm e +4 mm, la sensibilità scende a ×0,4. La corsa del mouse dalla prima goccia a circa 20 mL/s diventa 2,5 volte più lunga. La formula fisica resta corretta: `1,77` corrisponde a `Cd · (2/3) · √(2g)` con `Cd ≈ 0,6`, nell'intervallo 0,61-0,62 dei manuali di idraulica ([Skill-Lync](https://resources.skill-lync.com/branches/civil-engineering/questions/water-resources/weir-discharge-calculation); [Elysia](https://elysiatools.com/en/tools/weir-flow-calculator)).

**Valori.** Zona morta 0,5 mm; tetto `150 · flow` mL/s; zona fine da −2 a +4 mm con fattore 0,4; contagocce invariato (gocce da 0,05 mL, al massimo 0,15 mL/s).

**Verifica.** **node:test** in un nuovo `tests/game/liquid.test.mjs` (oppure in `physics.test.mjs`): `pourRate` con `h = 0.0004` vale 0; con `h = 0.003`, `R = 0.033`, `flow = 1` dà tra 7 e 9 mL/s (la formula attuale dà 8,0); con `h = 0.01` tra 80 e 88 (oggi 83,8); con `h = 0.05` esattamente 150; il valore non diminuisce mai da 0 a 5 cm a passi di 1 mm. Il test esistente sul livello (righe 54-74) resta verde. **Browser:** provare a versare esattamente 10 mL in un cilindro graduato vuoto; deve riuscire in due o tre tentativi.

### Passo 8 — Mostrare dove cade il getto, e quanti millilitri arrivano, prima che parta

**Dove.** `game.js`: punto di uscita in `pourFrom` (righe 991-1005), `traceStream` (righe 928-954), `update`, `hud()` (righe 1584-1607). `src/game/effects.js`: nuovo marcatore. `game-view.js`: `renderHud()`.

**Cosa.** Spostare il calcolo del punto di uscita in una funzione `spoutState(item)` che restituisce punto, direzione e carico. In `update()`, con un contenitore in mano e un'inclinazione di almeno 0,10 rad (prima che il liquido raggiunga il bordo), si chiama `traceStream` con velocità `max(0,12 m/s, streamSpeed)`. Un anello si posa sul punto di arrivo, sollevato di 1 mm lungo la normale. È **verde** se il getto finisce in un contenitore, nel lavandino o in un bidone, **rosso** se finisce su una superficie e diventerà una pozza. Così si risponde alla critica principale a Cooking Simulator, il cerchio che compare tardi. `hud()` aggiunge `pour: { name, ml, rate }` del ricevente, e la riga sotto il mirino mostra per esempio "→ Becher 100 mL · 47,5 mL (+8 mL/s)". La matematica balistica va in una funzione pura `ballisticLanding(p, vx, vz, yTarget)` dentro `liquid.js`.

**Valori.** Anello `RingGeometry(0.010, 0.014, 32)`; verde `#5fd38d`, rosso `#e5484d`; visibile da 0,10 rad (circa 6°); millilitri con un decimale sotto i 100 mL, interi sopra.

**Verifica.** **node:test:** con `ballisticLanding` da 0,20 m di altezza e velocità orizzontale 0,3 m/s, il tempo è 0,202 s e lo spostamento 0,0606 m (±1 mm). **Browser:** inclinando piano sopra un becher, l'anello compare prima della prima goccia; è verde sulla bocca e rosso sul bancone; il numero dei millilitri cresce mentre si versa.

### Passo 9 — Un getto continuo che si ferma sugli ostacoli

**Dove.** `effects.js`: `Drops` (righe 11-77) e una nuova classe `Stream`. `game.js`: gocce in `pourFrom` (righe 1011-1018) e `traceStream` (righe 928-954).

**Cosa.** Si aggiunge un tubo per ogni contenitore che versa, fatto con un solo `BufferGeometry` **riusato**: a ogni fotogramma si aggiornano `position` e `needsUpdate`, senza creare un nuovo `TubeGeometry`. Il tubo ha 10 segmenti e 6 lati lungo la parabola. Il raggio viene dalla continuità, `r = √(Q / (π · v))`, quindi il getto si assottiglia mentre cade. `traceStream` campiona la parabola in 8 tratti e lancia un `physics.ray` per tratto, escludendo il contenitore che versa: il primo urto vince. Il bordo di un altro becher, o un oggetto in mezzo, ferma o devia il liquido invece di farsi attraversare. Il volume si mette in coda con un tempo di arrivo pari al tempo di volo, `√(2 · Δy / g)`, e si aggiunge al ricevente solo quando arriva: il bicchiere non si riempie prima che il getto lo tocchi. Le goccioline restano all'inizio e alla fine del versamento.

**Valori.** Raggio tra 0,8 e 5 mm (8 mL/s a 0,3 m/s danno 2,9 mm); 10 segmenti; 8 raggi per getto; ritardo di circa 0,14 s per 10 cm di caduta.

**Verifica.** **node:test:** funzione pura `streamRadius(Q, v)`: `Q = 8e-6 m³/s` e `v = 0.3` danno 2,9 mm (±0,1). **Browser:** versare in modo che il getto colpisca il bordo di un altro becher: il liquido si deve fermare lì e fare una pozza. Con due getti attivi gli fps devono restare stabili.

### Passo 10 — Anteprima "fantasma" del punto di posa e posa morbida

**Dove.** `physics.js`: nuovi metodi accanto a `ray` (righe 141-149). `game.js`: `placeSpot` (righe 452-464), `release` (righe 466-487), `update`, `controlHeld` (righe 844-874). `items.js`: `placeItem` (righe 356-362).

**Cosa.** `Physics.restHeight(radius, halfH, x, z, fromY, exclude)` lancia verso il basso, con `world.castShape`, un cilindro grande quanto l'ingombro esterno dell'oggetto. Il centro a riposo è `fromY − hit.time_of_impact`. Attenzione: in 0.19.3 il campo si chiama `time_of_impact` per le forme e `timeOfImpact` per i raggi, e `witness1`/`normal1` sono in coordinate mondo nonostante il commento dei tipi ([npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3)) [Prova Rapier]. `Physics.overlaps(...)` usa `intersectionsWithShape` con la forma ridotta al 95%. `placeSpot` restituisce `{ pos, quat, valid }`, valido se la normale ha `y ≥ 0.9` (oggi 0,7, cioè 45°: un becher su un piano così inclinato scivola), la superficie è statica, il punto è entro 0,6 m e non ci sono sovrapposizioni. Il fantasma è un clone di `item.mesh` creato in `grab` con `MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false })`. Si aggiorna a ogni fotogramma quando si tiene un oggetto con inclinazione sotto 0,05 rad: verde se la posa è valida, rosso se no, nascosto se non si mira nessuna superficie. Mostra **il punto di appoggio vero**, che è la critica fatta al fantasma di Cooking Simulator 2. Al rilascio con una posa valida non si teletrasporta più: `this.placing = { item, pos, quat, t }` e `controlHeld` porta l'oggetto a `pos` più 2 mm. Quando l'errore scende sotto 1 cm e 2°, o dopo 0,3 s, si azzerano le velocità e si ridà la gravità.

**Valori.** Opacità del fantasma 0,35; normale `y ≥ 0.9`; distanza di posa 0,6 m (costante `PLACE_REACH`); fine posa a 1 cm e 2°, al massimo 0,3 s; sollevamento 2 mm.

**Verifica.** **node:test:** `restHeight` su una scatola con il piano a y = 0,92 e un cilindro di mezza altezza 0,0475 deve dare il centro a 0,9675 ± 0,003; `overlaps` è vero con un altro cilindro nello stesso punto e falso a 10 cm. **Browser:** con un becher in mano il fantasma è verde sul bancone e rosso su un altro becher; al clic il becher scivola al suo posto in meno di 0,3 s, senza salti, anche vicino a un muro.

### Passo 11 — Lancio a carica

**Dove.** `game-view.js`: tasto Q in `onKey` (riga 469) e `mousedown` (tasto centrale, `ev.button === 1`). `game.js`: `throwHeld` (righe 489-491), `release` (righe 478-480), `hud()`.

**Cosa.** Come in Cooking Simulator, "più a lungo, più forte". Alla pressione di Q, o del tasto centrale come nel gioco originale, si memorizza l'istante; al rilascio si chiama `game.throwHeld(secondi)` con `throwSpeed(s) = 1.5 + 6.5 · Math.min(1, s)`, una funzione pura in `controls.js`. `hud()` espone la carica (da 0 a 1), disegnata come un piccolo arco accanto al mirino con lo stesso stile di `.gm-tilt` (`game.css:349-370`). Nella legenda Q diventa "Q (tieni) → Carica il lancio".

**Valori.** Da 1,5 a 8 m/s in 1 s; spinta verso l'alto di +1,2 m/s invariata. Il tetto di 8 m/s serve a evitare proiettili involontari [Dedotto].

**Verifica.** **node:test:** `throwSpeed(0) = 1.5`, `throwSpeed(0.5) = 4.75`, `throwSpeed(3) = 8`. **Browser:** un tocco di Q fa un lancio leggero; tenendo Q per 1 s il lancio è forte; la vetreria si rompe contro il muro solo con i lanci forti.

### Passo 12 — Ruotare l'oggetto in mano con R

**Dove.** `game-view.js`: `onKey`, `mousemove`, `wheel` (righe 442-522). `game.js`: `holdQuat` (righe 754-771), orientamento di posa in `release` (righe 483-486), `wheel` (righe 503-511).

**Cosa.** In Cooking Simulator si ruota con il tasto destro. Da noi il tasto destro è già "versa", il gesto più importante in laboratorio, quindi la rotazione va su **R tenuto premuto**. È una scelta nostra [Dedotto]. Con R premuto il mouse non gira la visuale. Il movimento orizzontale cambia `rotYaw`: per i contenitori gira il beccuccio e quindi il lato da cui esce il getto. Il movimento verticale cambia `rotPitch`, ma solo per gli strumenti, perché per i contenitori l'unica inclinazione è quella del versamento. La rotella con R premuto ruota a scatti di 15°. Un tocco breve di R (meno di 0,2 s e meno di 4 pixel di movimento) azzera la rotazione, come il "Cancel rotation" del gioco. La rotazione si salva nell'oggetto (`item.rotYaw`), così riprendendolo resta com'era: è la critica fatta a Cooking Simulator 2. `holdQuat` e la posa usano `yaw + rotYaw`.

**Valori.** 0,005 rad per pixel; scatto π/12 (15°); tocco breve sotto 0,2 s.

**Verifica.** `npm test` verde. **Browser:** ruotare un becher di 90°: il getto esce di lato e l'anello del passo 8 si sposta. Posato, il becher resta ruotato; un tocco di R lo rimette dritto.

### Passo 13 — Manipolazione precisa con Maiusc, corsa sulla barra spaziatrice

**Dove.** `player.js`: velocità (riga 103). `game-view.js`: tasti di movimento (righe 454-462), E (righe 463-467), `mousedown`, `mousemove`, `wheel`. `game.js`: `holdTarget` (righe 777-790), `controlHeld` (righe 863-865), `primary` (righe 427-435), `tiltBy`.

**Cosa.** Si fa come in Cooking Simulator: **Maiusc tenuto con un oggetto in mano apre la modalità precisa**, e la **barra spaziatrice fa correre**. A mani vuote anche Maiusc continua a far correre, per non rompere le abitudini. Si aggiunge `'Space'` all'elenco dei tasti di movimento (con `preventDefault`, per non far scorrere la pagina). In modalità precisa la camera è ferma. Il mouse sposta l'oggetto sul piano orizzontale attorno al punto in cui si trovava quando si è premuto Maiusc. La rotella lo alza o lo abbassa. Tasto destro più mouse inclina a ×0,4 (versamento fine). Il clic sinistro **lascia l'oggetto lì dov'è**, a velocità zero e senza aggancio, come fa il tasto centrale nella modalità precisa del gioco. E esegue le azioni "fini", e Maiusc+E è già il pizzico della spatola (`game-view.js:463-467`). In `controlHeld`, in modalità precisa, guadagno e velocità massima scendono, così l'oggetto urta meno gli altri (la critica "knock everything around"). **Non usare Ctrl come modificatore:** nel browser Ctrl+W, cioè Ctrl premuto mentre si cammina in avanti, chiude la scheda [Dedotto, ma certo nei browser desktop].

**Valori.** Spostamento 0,0015 m per pixel, entro 0,35 m dal punto di partenza; altezza 1 cm per scatto di rotella (`deltaY` 100), da −0,20 a +0,30 m; in modalità precisa guadagno 8 s⁻¹ e velocità massima 1,5 m/s (fuori resta 16 e 9).

**Verifica.** `npm test` verde. **Browser:** mettere una provetta esattamente in un foro del portaprovette e un becher al centro della bilancia; correre con Spazio; Maiusc a mani vuote continua a far correre.

### Passo 14 — Riempire dal rubinetto tenendo premuto E

**Dove.** `game.js`: `use` (righe 538-563, ramo del lavandino alle righe 553-556), ramo del rubinetto in `update` (righe 1432-1440), `holdTarget`, `TAP_FLOW` (riga 25). `game-strings.js`.

**Cosa.** Oggi, con un contenitore in mano, E sul lavandino **lava subito**, cioè versa tutto nello scarico (`game.js:554`): un'azione distruttiva sul tasto più usato. Proposta, ispirata al "clic sul lavello per riempire" di Cooking Simulator: con un contenitore in mano e il lavandino mirato, **E tenuto riempie**. Il contenitore viene guidato sotto il rubinetto, a `spout − (0, altezza + 3 cm, 0)`, e l'acqua scorre solo finché si tiene E. La rotella cambia la portata e i millilitri si leggono come nel passo 8. Lavare passa a **Maiusc+E**. Serve che `use(false)` fermi il riempimento: oggi `use` esce subito al rilascio, salvo che per l'estintore (riga 544).

**Valori.** Portata predefinita 25 mL/s (`TAP_FLOW`), regolabile da 5 a 50 a passi di 5.

**Verifica.** **Browser:** con un becher vuoto tenere E al lavandino: il becher va sotto il rubinetto, si riempie e il numero cresce; rilasciando si ferma; Maiusc+E lava, con il messaggio di conferma. `npm test` controlla le chiavi nuove.

### Passo 15 (facoltativo) — Macchie residue da pulire

**Dove.** `game.js`: evaporazione delle pozze (righe 1450-1457), `wipe` (righe 693-707), valutazione del disordine (righe 303-312).

**Cosa.** Cooking Simulator lascia macchie colorate da pulire. Da noi le pozze hanno già il colore della miscela. Proposta legata alla chimica [Dedotto]: quando una pozza evapora del tutto e conteneva più di 0,05 g di soluto, resta un alone (opacità 0,3) che si toglie con la carta (E) e conta come disordine finché non lo si pulisce.

**Valori.** Soglia 0,05 g; opacità 0,3.

**Verifica.** **node:test:** estendere i test della valutazione (`physics.test.mjs:76-122`) con un alone presente, che deve abbassare il punteggio come una pozza. **Browser:** versare acqua salata, aspettare l'evaporazione e pulire l'alone.

### Passo 16 — Aggiornare aiuto e documenti, poi la verifica finale

**Dove.** `game-strings.js`: `helpWalkRows`, `helpBenchRows`, `helpToolsRows` (`it` righe 283-288, `en` righe 559-564). `README.md` (righe 427-436). Documento di design, dove la riga 60 cita un `hud.js` inesistente.

**Cosa.** Aggiungere all'aiuto R (ruota), Maiusc con oggetto (precisione), Spazio (corri), Q tenuto (carica il lancio), E tenuto al lavandino (riempi) e Maiusc+E (lava); spiegare che la legenda in basso a destra mostra sempre i comandi del momento; correggere il riferimento a `hud.js`.

**Verifica.** `npm test` completo. **Browser:** un'esercitazione intera in modalità Carriera usando solo la legenda, senza aprire l'aiuto.

### Valori consigliati in un colpo d'occhio

| Ambito | Parametro | Valore |
|---|---|---|
| Sgabelli | posizione | z = 0,25 m (x = −0,95 e 1,05) |
| Sgabelli | massa, smorzamento, attrito | 5 kg; lineare 2, angolare 4; 0,5 |
| Personaggio | massa per gli impulsi; filtro | 80 kg; solo `STATIC` e `PROP` |
| Presa | guadagno, velocità max, rotazione max | 16 s⁻¹, 9 m/s, 14 rad/s (invariati); precisione 8 s⁻¹, 1,5 m/s |
| Inclinazione | ritorno; zona fine; sguardo | 3 rad/s; ×0,4 tra −2 e +4 mm; ×0,5 in orizzontale |
| Portata | zona morta; tetto | 0,5 mm; 150 · `flow` mL/s |
| Mira del getto | soglia; anello | 0,10 rad; raggi 10-14 mm |
| Getto | raggio; segmenti; raggi | 0,8-5 mm; 10; 8 |
| Posa | normale; distanza; fine; fantasma | y ≥ 0,9; 0,6 m; 1 cm e 2° o 0,3 s; opacità 0,35 |
| Lancio | velocità | 1,5 + 6,5 · min(1, t) m/s |
| Rotazione | sensibilità; scatto | 0,005 rad/px; 15° |
| Precisione | spostamento; altezza | 0,0015 m/px entro 0,35 m; 1 cm per scatto |
| Rubinetto | portata | 25 mL/s, da 5 a 50 |
| Legenda | righe; isteresi | 6 (4 sotto i 640 px); 120 ms |
| Evidenziazione | bordo; opacità | 2,5 mm; 0,55 |

## Conclusione

Il confronto ribalta un'impressione comune: Cooking Simulator non è difficile perché la sua fisica sia troppo vera, ma perché **mostra troppo poco**. I suoi liquidi sono numeri in millilitri sotto un effetto grafico. Le critiche più forti riguardano il cerchio che compare tardi, l'assenza di una zona di flusso lento e i tasti che cambiano significato senza spiegarlo. Anche gli sviluppatori si sono mossi in quella direzione: hanno aggiunto l'assistenza alla mira nella versione VR, e in Cooking Simulator 2 hanno smorzato la fisica "for more control" ([Game8](https://game8.co/articles/reviews/cooking-simulator-2-better-together-review)). Il nostro laboratorio parte avvantaggiato, perché ha già un livello del liquido geometricamente corretto e una portata da manuale di idraulica. Il lavoro utile non è aggiungere fisica, ma **rendere visibile quella che c'è**: dove cadrà il getto, quanti millilitri sono arrivati, cosa fa ogni tasto in questo momento.

Il caso degli sgabelli insegna una regola che vale per tutta la stanza. Un collisore più grande della sua mesh, messo in un passaggio, basta a rompere il gioco, e nessun test se ne accorgeva. Il test "il giocatore esce dal corridoio" costa poche righe e andrebbe esteso a ogni postazione di `STATIONS`. Allo stesso modo, la legenda scritta come funzione pura (`legendRows`) trasforma un pezzo di interfaccia, di solito controllato solo a occhio, in comportamento verificabile con `node:test`. È la base giusta per aggiungere più avanti, come ha fatto Cooking Simulator nella patch 7.5.0, i tasti rimappabili e le icone del controller senza dover riscrivere l'HUD.
