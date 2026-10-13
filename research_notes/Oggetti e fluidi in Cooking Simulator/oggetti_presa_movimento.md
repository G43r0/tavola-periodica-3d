# Cooking Simulator: interazione fisica con gli oggetti in prima persona (presa, trasporto, rotazione, posa, lancio, movimento)

> **Nota di metodo (leggere prima).** Da questo ambiente non è stato possibile aprire direttamente nessuna pagina: steamcommunity.com, store.steampowered.com, gamepressure.com, wikipedia.org, reddit, fandom, pcgamingwiki e YouTube davano tutti errore (DNS non risolto per WebFetch, CONNECT 403 per curl). **Tutte le citazioni sotto vengono dai riassunti e dagli estratti che il motore di ricerca ha attribuito a quegli URL**, non da una lettura della pagina intera. Gli URL sono quelli restituiti dalla ricerca. Le frasi tra virgolette sono estratti riportati dal motore di ricerca. Dove l'estratto è ambiguo lo segnalo. Non ho trascrizioni video. Nessun codice o asset del gioco è stato cercato o usato.
>
> Gioco: Cooking Simulator (PC, Big Cheese Studio / PlayWay, Unity, uscito il 6 giugno 2019 su Windows; seguono le versioni Switch maggio 2020, Xbox One agosto 2020, Android ottobre 2020) — [Wikipedia](https://en.wikipedia.org/wiki/Cooking_Simulator). Spin-off: Cooking Simulator VR (app Steam 1358140, sviluppato da GameBoom VR con Big Cheese, pubblicato da PlayWay) e Cooking Simulator 2: Better Together (app Steam 2455360).

## 1. Presa (grabbing): tasto, distanza, evidenziazione, quanti oggetti

### Takeaway
Nel gioco base su PC si raccoglie con il **tasto sinistro (LMB)**, con un clic contestuale: non si tiene premuto. **In mano va un solo ingrediente alla volta.** Per prendere più pezzi insieme si impugna un contenitore (piatto, tagliere, ciotola, pentola), si punta un pezzo, che si **evidenzia**, e con la **rotella** si allarga la selezione ad altri pezzi dello stesso tipo. Un perk ("Long Reach") aumenta la portata.

### Cited Findings
- Comandi PC secondo la guida Gamepressure. LMB = "Confirm \ Interaction \ Take \ Put down to container or plate \ Buy". RMB = "Cancel \ Put back \ Rotate the item \ Cancel rotation". MMB = lancio, e più lo si tiene premuto più forte si lancia. Shift = modalità "precise manipulation" per muovere e posare liberamente l'oggetto — [Gamepressure, Controls/Key binds](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8); [Gamepressure guide index](https://www.gamepressure.com/cooking-simulator/)
- La maggior parte dei tasti è contestuale. Le azioni disponibili e i relativi tasti compaiono **nell'angolo in basso a destra** dello schermo ("most of the keys work in context, and the actions and their keyboard shortcuts appear in the lower right corner of the screen") — [Gamepressure Controls](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50632)
- Si può posare un pomodoro anche con un semplice clic sul piano di lavoro. Se non funziona, conviene controllare che la "context control mode" sia attiva nelle impostazioni General — [Steam discussion](https://steamcommunity.com/app/641320/discussions/0/2257935717984301665)
- "Normalmente puoi tenere in mano un solo ingrediente". Per raccoglierne più di uno "devi tenere un contenitore che possa contenere più oggetti" — [Steam: how to pick up multiple pieces?](https://steamcommunity.com/app/641320/discussions/3/1638661595060400955/); [Steam: Picking up multiple items](https://steamcommunity.com/app/641320/discussions/3/1638661595057742051/)
- Procedura multi-presa su PC: si tiene il mouse su un pezzo, che si **evidenzia**, poi si usa la rotella per evidenziarne altri. Si continua finché sono tutti evidenziati e poi si clicca per prenderli tutti. La selezione vale **per un solo tipo di oggetto alla volta**: pomodoro e mozzarella vanno presi separatamente — [Steam: Picking up multiple items](https://steamcommunity.com/app/641320/discussions/3/1638661595057742051/); [Steam: how to pick up multiple pieces?](https://steamcommunity.com/app/641320/discussions/3/1638661595060400955/)
- Chaptercheats descrive la stessa cosa così: "hover over the thing, scroll your mouse wheel up or down to increase/decrease the amount being picked up" — [Chaptercheats Control Guide PC](https://www.chaptercheats.com/cheat/pc/387592/cooking-simulator/hint/157381)
- La guida Steam di Paper Rabbit considera la rotella essenziale per raccogliere pile dello stesso oggetto. I controlli base sono "WASD, Use, Squat, your 2 mouse buttons + the scroll wheel" — [Steam Guide: Making The Game Work With You](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)
- Il tagliere permette di raccogliere molti più pezzi di piatti e ciotole. La ciotola invece diventa "glitchy" quando è troppo piena — [Steam: how to pick up multiple pieces?](https://steamcommunity.com/app/641320/discussions/3/1638661595060400955/)
- Il perk **Long Reach** dà una portata maggiore sia nel raccogliere sia nel posare gli oggetti. Un thread Steam conferma che il raggio di raccolta più ampio si sblocca con un perk sul laptop — [Fandom: Perks](https://cooking-simulator.fandom.com/wiki/Perks); [Steam: expand pick up range?](https://steamcommunity.com/app/641320/discussions/3/1636410430562661507/)
- Le icone dei comandi sono contestuali: un thread del 2019 segnala prompt Xbox mostrati anche con mouse e tastiera — [Steam: Tutorial controls showing Xbox buttons](https://steamcommunity.com/app/641320/discussions/1/1638661595060190901/)

### Inferences
- L'evidenziazione dell'oggetto puntato esiste: le fonti dicono "highlight". Il modello che ne esce è "raycast dal centro dello schermo, poi oggetto evidenziato, poi azione contestuale mostrata in basso a destra". In Three.js si può rendere con un outline (OutlinePass o un materiale emissivo) più un pannello di prompt contestuale.
- La regola "una mano, un ingrediente; più pezzi solo dentro un contenitore" semplifica molto la logica. In un laboratorio di chimica corrisponde a "una provetta in mano; per portarne tante si usa il portaprovette".
- La rotella che allarga la selezione a N oggetti dello stesso tipo si traduce bene in "seleziona N oggetti identici vicini (per esempio pesetti o pastiglie) entro un raggio dal punto mirato".

### Gaps
- Distanza di presa base in metri: nessuna fonte trovata.
- Forma esatta dell'evidenziazione (outline bianco, tinta, etichetta col nome) e presenza o forma del mirino: non confermate. La ricerca "crosshair/outline" non ha prodotto risultati specifici.
- Se con un ingrediente in mano si possa raccoglierne un secondo in un'altra mano: le fonti dicono solo "un solo ingrediente in mano". Nessuna fonte parla di due mani (destra/sinistra) nel gioco base.

## 2. Trasporto (holding): posizione rispetto alla camera, fisica dell'oggetto tenuto, collisioni

### Takeaway
Le fonti non descrivono in modo esplicito la posizione dell'oggetto tenuto. Ci sono però **indizi forti** che il **contenuto dei contenitori trasportati resti simulato fisicamente**: il cibo vola via dal piatto camminando o correndo e scivola dai piatti troppo pieni. Inoltre, in modalità di manipolazione avanzata, l'oggetto **urta e sposta** gli altri oggetti.

### Cited Findings
- Nella modalità di manipolazione precisa (Shift) l'oggetto si muove liberamente con il mouse "per posizionarlo ESATTAMENTE dove vogliamo" e **interagisce con gli oggetti vicini** — [Gamepressure: Accurate handling and cutting mode](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50658)
- Un thread di feedback chiede di aggiungere la regolazione dell'altezza ai "Context Controls". Per questo i giocatori passano all'"advanced move", che però ha un difetto: "how easy it is to knock everything around" — [Steam: Add Height Adjustment to Context Controls](https://steamcommunity.com/app/641320/discussions/2/1636410430547949865/)
- La guida di Paper Rabbit sconsiglia di correre con il perk Dash: "It tends to cause whatever you are carrying to fly to god knows where" — [Steam Guide: Making The Game Work With You](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)
- Nel thread "Physic fix?" (giugno 2020) gli utenti segnalano "food flying off my plate while walking", oggetti incastrati nel bancone o nel pavimento e prese che "scompaiono" più volte — [Steam: Physic fix?](https://steamcommunity.com/app/641320/discussions/0/2439210120851694449)
- Nello stesso ambito un utente ipotizza che gli oggetti "non ricevano il corretto sistema di riferimento". Un oggetto appoggiato su un contenitore sembrerebbe quindi sospeso in aria e si muoverebbe quando il giocatore si gira. **È una speculazione di un utente, non del developer** — [Steam: Physic fix?](https://steamcommunity.com/app/641320/discussions/0/2439210120851694449)
- I piatti con molte patate impilano il cibo in modo irregolare e il cibo poi scivola giù. Risposta della community: "all picked up items gravitate towards the center". Spostare leggermente il piatto con il mouse aiuta a distribuirli — [Steam: Stuff falls off plates?](https://steamcommunity.com/app/641320/discussions/0/3195801972006513639/)
- Hotfix 7.3.1: risolto il caso di "products with jiggle physics freezing mid-air after using advanced container movement". Esistono quindi sia la "advanced container movement" sia prodotti con "jiggle physics" (pseudo-soft-body, per esempio la carne) — fonte: estratto della ricerca sulle patch note, attribuito alle news Steam del gioco ([Steam allnews](https://steamcommunity.com/app/641320/allnews?l=english)). **URL esatto della singola patch note non confermato.**
- Cooking Simulator VR: un recensore Steam lamenta mani "very odd and unintuitive", con uno smoothing del movimento che aggiunge **ritardo e inerzia**. Le mani **non hanno collisione** — [Steam CS VR negative reviews](https://steamcommunity.com/app/1358140/negativereviews/?l=english&browsefilter=toprated)
- Cooking Simulator 2: una guida riferisce che il cibo, una volta raccolto, "galleggia circa un piede sopra il piatto". Altre fonti dicono che la fisica è "più stretta, il cibo resta dove lo metti". Le fonti sono in contraddizione — [games.gg CS2 guide](https://games.gg/cooking-simulator-2-better-together/guides/cooking-simulator-2-better-together-before-you-buy/); [games.gg beginner's guide](https://games.gg/cooking-simulator-2-better-together/guides/cooking-simulator-2-better-together-beginners-guide/)

### Inferences
- Il quadro più coerente con le fonti è un sistema a due livelli. (a) L'oggetto tenuto in modalità normale è probabilmente trascinato in modo "morbido" (cinematico, o guidato a forze verso un punto davanti alla camera). (b) Gli oggetti **dentro** un contenitore restano corpi dinamici e subiscono l'inerzia, quindi volano via se si accelera, per esempio correndo. In modalità "advanced" l'oggetto tenuto spinge gli altri. **Questa è un'inferenza, non è documentata.**
- Per Rapier un buon compromesso per riprodurre il "feel" è questo. L'oggetto tenuto è un corpo `KinematicPositionBased`, oppure dinamico guidato da una molla o da un PD verso un target davanti alla camera. Il contenuto resta dinamico con attrito alto, e conviene limitare l'accelerazione del contenitore così il contenuto non vola via (il difetto più criticato).
- Il problema del "reference frame" ipotizzato dagli utenti suggerisce una scelta. Gli oggetti appoggiati su un vassoio trasportato non vanno resi figli del vassoio nel grafo di scena se restano corpi fisici: o tutti fisici, o tutti "attaccati" con fisica sospesa.

### Gaps
- Offset esatto dell'oggetto tenuto (centro, in basso a destra, distanza dalla camera), eventuale regolazione della distanza con la rotella e presenza di "lag" o oscillazione dell'oggetto tenuto in modalità normale: nessuna fonte esplicita.
- Cosa succede se l'oggetto tenuto in modalità normale colpisce un muro (attraversa? si ferma? viene lasciato?): non trovato.
- Se nel gioco base è visibile una mano o un braccio: non verificato.

## 3. Rotazione dell'oggetto tenuto

### Takeaway
Nel gioco base la rotazione si fa con il **tasto destro (RMB) tenuto premuto più il movimento del mouse**, sia in modalità normale ("Rotate the item / Cancel rotation") sia dentro la modalità precisa con Shift. Dopo la patch 7.5.0, che ha rifatto i controlli PC, alcuni giocatori lamentano una velocità di rotazione sbagliata, soprattutto con la spatola.

### Cited Findings
- RMB = "Cancel \ Put back \ **Rotate the item** \ **Cancel rotation**" — [Gamepressure Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8)
- In modalità precisa: "holding RMB and moving rotates the item" — [Gamepressure: Accurate handling](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50658)
- Advanced Controls (Shift tenuto con un oggetto in mano): "your only options are: Rotate, Drop, or Move the thing Vertically" — [Chaptercheats PC](https://www.chaptercheats.com/cheat/pc/387592/cooking-simulator/hint/157381); [Steam Guide Paper Rabbit](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)
- Dopo la patch 7.5.0 un giocatore scrive che "the rotate speed especially with the spatula is just not right" e chiede se esista un'impostazione per correggerla. Non è stata trovata una risposta ufficiale — estratto attribuito alle discussioni Steam ([Steam Community hub](https://steamcommunity.com/app/641320))
- Cooking Simulator VR, patch 1.06: "improved the rotation of objects on the spatula" — [Steam News CS VR Patch 1.06](https://store.steampowered.com/news/app/1358140/view/5225854263179450350)
- Cooking Simulator 2: un giocatore chiede la rotazione con la rotella per gli ingredienti, perché l'unica opzione sembra "ruotare molto lentamente il piatto". Un altro thread chiede perché la rotazione non sia più veloce con Shift e perché si azzeri per ogni ingrediente — [Steam CS2 Demo: Precision placement?](https://steamcommunity.com/app/2455360/discussions/1/800091752203749137/)

### Inferences
- Lo schema "RMB tenuto: il mouse smette di girare la camera e ruota l'oggetto" è lo standard da riprodurre. Il movimento orizzontale del mouse ruota probabilmente attorno all'asse verticale (yaw) e quello verticale attorno all'asse orizzontale della camera (pitch). **Gli assi esatti non sono documentati.**
- "Cancel rotation" su RMB fa pensare che la rotazione si possa annullare o ripristinare. Implementarla come "rilascio di RMB = mantieni; azione Cancel = torna dritto" è un'ipotesi ragionevole.
- Le lamentele di CS2 (rotazione che si azzera, lenta) suggeriscono due accorgimenti: ricordare l'ultima rotazione e offrire una rotazione rapida (per esempio Shift + rotella a scatti di 15°).

### Gaps
- Se l'oggetto torna dritto da solo quando lo si lascia o lo si posa: non trovato.
- Velocità e sensibilità di rotazione, assi, presenza di Q/E o R: nessuna fonte per il gioco base. Per CS2 una fonte cita il tasto **Q** solo per la regolazione del fornello (vedi sezione 8).

## 4. Posa (placing): anteprima, punto di posa, contenitori, snap

### Takeaway
La posa normale è un **clic LMB su una superficie o su un contenitore** (piatto, pentola): "Put down to container or plate". Per la posa precisa si tiene **Shift**: il mouse muove l'oggetto liberamente, **LMB più mouse su o giù** cambia l'altezza, **RMB più mouse** ruota, **MMB** lo posa o lo lascia cadere. Nel gioco base non ho trovato fonti su un'anteprima "ghost". In CS2 c'è invece un ghost sospeso per l'impiattamento, criticato perché non mostra il punto di atterraggio.

### Cited Findings
- LMB: "Put down to container or plate". RMB: "Put back" — [Gamepressure Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8)
- Modalità precisa (Shift tenuto con l'oggetto in mano): (1) muovendo il mouse si muove l'oggetto liberamente, (2) tenendo LMB e muovendo su o giù lo si posiziona sopra o sotto, (3) tenendo RMB e muovendo lo si ruota, (4) premendo MMB lo si rimette giù — [Gamepressure: Accurate handling and cutting mode](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50658)
- In modalità precisa MMB, che normalmente lancia, **posa** l'oggetto. Un giocatore Steam descrive così il flusso per mettere cibo in padella: comandi avanzati (Shift tenuto), si muove il mouse finché l'oggetto fluttua sopra la padella, poi MMB per lasciarlo cadere — [Gamepressure Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8); [Steam: How to play without ever touching the Spatula…](https://steamcommunity.com/app/641320/discussions/3/1643166649099805296/)
- Shift tenuto con l'oggetto in mano più il tasto di lancio = l'oggetto viene posato invece di essere lanciato — [Steam discussion](https://steamcommunity.com/app/641320/discussions/0/2257935717984301665)
- L'opzione "Unlock Context Control" si trova nel tab General. Gamepressure "raccomanda vivamente di non disattivarla" perché è molto utile per impilare o manipolare con cura gli oggetti — [Gamepressure: Configuration and Options](https://www.gamepressure.com/cooking-simulator/configuration-and-options/z2c5c7)
- Un post della community descrive la modalità context in modo poco chiaro: cliccare un oggetto tenuto apre un menu contestuale, con un ritmo "1 click = 1 dash" (probabilmente per le spezie). **Estratto ambiguo, non verificato** — [Steam: Can't Season](https://steamcommunity.com/app/641320/discussions/3/2733047810450486565/)
- Richiesta di poter impiattare con precisione: il developer risponde che "considererà" patch future — [Steam: Suggestion: Ability to plate food](https://steamcommunity.com/app/641320/discussions/2/1639790664923386132/)
- I pezzi raccolti in un contenitore tendono ad andare verso il centro del piatto ("all picked up items gravitate towards the center") — [Steam: Stuff falls off plates?](https://steamcommunity.com/app/641320/discussions/0/3195801972006513639/)
- Un utente Steam nota che le pose sciatte si vedono soprattutto nel tutorial: "once you start playing the game putting things down normally works pretty much fine" — estratto attribuito a [Steam: Great concept poor in execution](https://steamcommunity.com/app/641320/discussions/0/3342162929518905767/)
- Cooking Simulator 2 (demo): non c'è un ghost-preview "hold-to-place" per gli scaffali. Nell'impiattamento c'è un **ghost sospeso** che non mostra il punto in cui l'oggetto atterrerà — [Steam CS2 Demo: Precision placement?](https://steamcommunity.com/app/2455360/discussions/1/800091752203749137/)
- CS2: secondo un recensore Steam il gioco è "not AS physics based" e gli oggetti nei contenitori o sulle superfici diventano **statici** — estratto attribuito a [Steam CS2 positive reviews](https://steamcommunity.com/app/2455360/positivereviews/?browsefilter=toprated)
- CS2 patch #10: "improved physics when inserting objects into containers", fix per la posa su scaffali inclinati e per gli oggetti "behaving chaotically when dropped on the floor", oltre a "fixed several ingredient colliders" — estratto attribuito a [Steam CS2 hub](https://steamcommunity.com/app/2455360)

### Inferences
- Nel gioco base la posa normale pare essere "clic sul punto mirato, l'oggetto va lì e poi la fisica lo assesta". La posa fine è manuale (Shift, sposta, alza, ruota, rilascia) e senza snap. Il "rilascio" in modalità precisa sembra un vero **drop fisico** dall'altezza attuale, non uno snap.
- La "gravitazione verso il centro" dei pezzi in un contenitore fa pensare a uno snap o attrazione verso il punto centrale del contenitore al momento dell'inserimento. È un'inferenza da una risposta della community.
- CS2 ha reso statici gli oggetti posati nei contenitori proprio per evitare il caos fisico: è un'indicazione di progetto utile. Per un laboratorio di chimica conviene un ibrido. Oggetti posati su supporti dedicati (portaprovette, piastra, bilancia) vanno in snap e diventano statici o "addormentati". Oggetti posati sul bancone restano dinamici.
- L'anteprima ghost, se c'è, deve mostrare il **punto di atterraggio reale** (raycast verso il basso), non una posizione sospesa: è la critica esplicita mossa a CS2.

### Gaps
- Nel gioco base: presenza di un ghost o anteprima, posa sempre dritta o con la rotazione corrente, posa esattamente al punto mirato o caduta: nessuna fonte diretta.
- Snap point nel forno, sulla griglia o sul piano cottura: non documentati.

## 5. Lancio, caduta e rotture

### Takeaway
**MMB lancia** l'oggetto tenuto, con una forza che cresce con la durata della pressione. Qualunque oggetto raccolto si può lanciare. I **piatti si rompono** molto facilmente, a volte anche solo scuotendoli velocemente, e c'è un achievement per romperne 10. Si rompe anche il vetro, e i cocci si buttano nel cestino. Le uova si rompono con un tasto dedicato (E) e lasciano gusci nel cibo.

### Cited Findings
- MMB = lancio, "held longer throws harder" — [Gamepressure Controls](https://www.gamepressure.com/cooking-simulator/controls-key-binds/z3c5c8)
- Il gioco permette di lanciare qualsiasi oggetto raccolto. In sandbox non ci sono timer, quindi il caos pesa meno — estratto attribuito a [TheXboxHub review](https://www.thexboxhub.com/cooking-simulator-review-hellish-kitchen/) / [Use a Potion review](https://www.useapotion.com/2020/05/cooking-simulator-review/)
- Achievement "Shattered Memories": rompere 10 piatti. Metodo su controller: in Sandbox si prende un piatto con A e lo si lancia con Y, 10 volte — [TrueAchievements](https://www.trueachievements.com/a305064/shattered-memories-achievement)
- TV Tropes: i piatti sono fragili e "unless you make them unbreakable, even if you do so much as shake them quickly, plates will break". La stessa fonte parla di un motore fisico "proprietario", il che **contrasta con Unity** citato da Wikipedia (vedi sezione 10) — [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/CookingSimulator)
- I vetri rotti si puliscono buttandoli nel cestino. Si pulisce con spugna o mocio, e il perk Fairy Touch pulisce la cucina all'istante. Un giocatore dice che i cocci si raccolgono solo uno alla volta a mano. Un altro usa una pentola con la multi-presa per raccogliere tutti i gusci insieme — [Steam: how to clean up the kitchen](https://steamcommunity.com/app/641320/discussions/3/1638661595053346365/); [Steam: Egg Shells](https://steamcommunity.com/app/641320/discussions/3/3435626476282553141/)
- La guida Paper Rabbit consiglia di tenere a portata di mano la Magic Wand (perk/strumento) per raccogliere tutti i pezzi rotti in una volta, se si rompe spesso — [Steam Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)
- Uova: si tiene l'uovo e si preme **E**. Lamentela frequente: frammenti di guscio nel cibo. Workaround: portare l'uovo sopra una padella larga prima di romperlo, o romperlo in una ciotola separata — [Steam: How do you crack eggs?](https://steamcommunity.com/app/641320/discussions/0/1637549649100553702/); [Steam: Cracking eggs](https://steamcommunity.com/app/641320/discussions/0/3191363272394715169/)

### Inferences
- La rottura è probabilmente a soglia di impulso o velocità d'urto. La frase "anche scuotendoli" fa pensare a una soglia bassa, forse legata anche alla velocità dell'oggetto tenuto. Per il laboratorio: vetreria fragile con soglia di impulso di collisione (Rapier: eventi di contatto con `contactForceEvents` e soglia `contactForceEventThreshold`), sostituzione con frammenti dinamici e cocci da raccogliere o buttare.
- Il lancio "a carica" con MMB tenuto è facile da riprodurre: impulso = min(max, k · durata pressione) lungo la direzione della camera.
- L'opzione "unbreakable" citata da TV Tropes suggerisce un interruttore di accessibilità per la fragilità: utile anche per un gioco didattico.

### Gaps
- Valori di forza del lancio, soglia di rottura, rottura di bicchieri o bottiglie oltre ai piatti: non quantificati.
- Dove si attiva l'opzione "unbreakable" (sandbox, perk, impostazione): non confermato.

## 6. Spingere oggetti, collisione del giocatore con props e arredi

### Takeaway
Le fonti confermano che gli oggetti si **urtano e si rovesciano** facilmente, soprattutto muovendo un oggetto tenuto in modalità avanzata. **Non ho trovato fonti** sul giocatore che spinge arredi camminandoci contro né su sedie o mobili spostabili. Ci sono segnalazioni di oggetti incastrati in bancone o pavimento, e il developer ha promesso di correggere i casi in cui "you could get stuck with the objects".

### Cited Findings
- L'"advanced move" rende "easy … to knock everything around" — [Steam: Add Height Adjustment to Context Controls](https://steamcommunity.com/app/641320/discussions/2/1636410430547949865/)
- Oggetti incastrati nel bancone o nel pavimento e salvataggi in cui non si riesce più ad afferrare niente — [Steam: Physic fix?](https://steamcommunity.com/app/641320/discussions/0/2439210120851694449)
- Un developer, citato in una discussione Steam, dice che proveranno a correggere "moments where you could get stuck with the objects but we won't do big changes in terms of physics". **Data e contesto non verificati**; l'estratto è attribuito al thread "Physic fix?" o a uno simile — [Steam: Physic fix?](https://steamcommunity.com/app/641320/discussions/0/2439210120851694449)
- Hotfix 7.3.1: "yolk splitter bottom falling through floor when opening drawers". Quindi i cassetti, che si aprono, spingono fisicamente gli oggetti che contengono — estratto attribuito alle news Steam ([Steam allnews](https://steamcommunity.com/app/641320/allnews?l=english))
- Thread "Automatic walking" (Tech Support): esiste un bug di camminata automatica. Dettagli non letti — [Steam: Automatic walking](https://steamcommunity.com/app/641320/discussions/1/3195801743620629422/)

### Inferences
- "Getting stuck with the objects" può voler dire sia il giocatore bloccato dagli oggetti sia oggetti incastrati nella geometria. L'estratto non distingue i due casi.
- Per il laboratorio conviene un character controller cinematico (Rapier `KinematicCharacterController`) che **non** spinge i props piccoli o li spinge con forza limitata. In più servono collisori CCD sugli oggetti piccoli e veloci, per evitare il "falling through" (frequente nelle segnalazioni).

### Gaps
- Presenza di sedie o mobili spostabili nel ristorante, il giocatore che spinge gli oggetti camminando: nessuna fonte.

## 7. Movimento del giocatore e camera

### Takeaway
Movimento con **WASD**. **Spazio = movimento veloce** (sprint; la guida Paper Rabbit parla anche di un perk "Dash"). **Ctrl = accovacciarsi** (secondo la community). Shift è riservato alla manipolazione precisa ("Steady hands"). I tasti erano rimappabili solo dopo apposite patch: prima in test, poi la 7.5.0 con rimappatura completa anche dei tasti laterali del mouse. Nessuna fonte su salto, head bob o FOV.

### Cited Findings
- "Spacebar - Fast movement". Shift = "precise manipulation" — [Gamepressure Controls](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50632)
- Un utente Steam (2019): normalmente si usa Shift sinistro per le "steady hands" e la barra spaziatrice per camminare più veloce — [Steam: Cooking Simulator discussion](https://steamcommunity.com/app/641320/discussions/0/1640917625017091566)
- Accovacciarsi: "standard is CTRL but you might have changed the keybindings" — [Steam: how to crouch](https://steamcommunity.com/app/641320/discussions/3/2638497042767867986/)
- Controlli base: "Basic WASD, Use, Squat, your 2 mouse buttons + the scroll wheel" — [Steam Guide Paper Rabbit](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)
- Perk Dash: "I don't recommend running. It tends to cause whatever you are carrying to fly to god knows where" — [Steam Guide Paper Rabbit](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429)
- 2019: niente rimappatura in gioco al lancio, e il developer annuncia una patch per la configurazione della tastiera — [Steam: keybinds thread](https://steamcommunity.com/app/641320/discussions/0/1636410430552699901/); [Steam: How to change key binding?](https://steamcommunity.com/app/641320/discussions/3/1639789306535627027/). Più tardi arriva la news "Keybinds available for testing!" — [Steam News](https://store.steampowered.com/news/app/641320/view/5278738040561594076)
- Patch 7.5.0: controlli PC rifatti, rimappatura completa compresi i tasti laterali del mouse, cambio automatico delle icone controller/tastiera, supporto ad AZERTY, tutorial che mostra i tasti rimappati — [Steam News: New Controls & Controller Support](https://store.steampowered.com/news/app/641320/view/710032085365031166); [X @cookingsim](https://x.com/cookingsim/status/2087858812258578897). **Data esatta incerta**: le fonti la danno in modo incoerente.
- Esiste un thread di feedback su "Hardware Mouse & Controller Look Speed", cioè lamentele o richieste sulla velocità della visuale. Contenuto non letto — [Steam](https://steamcommunity.com/app/641320/discussions/2/1639792569840444150/)
- Esiste una richiesta di sostituire MMB e rotella sul touchpad: l'input dipende molto dal mouse a tre tasti — [Steam: Middle mouse button and wheel replacement on touchpad](https://steamcommunity.com/app/641320/discussions/2/1638661595060331968/)

### Inferences
- Sprint su Spazio, e non su Shift, è una scelta voluta: Shift serve alla manipolazione fine. Per il laboratorio conviene fare lo stesso, così Shift resta per la manipolazione di precisione, che si usa molto.
- La correlazione "corsa = il contenuto vola via" va evitata o moderata. Una soluzione è limitare l'accelerazione del contenitore tenuto, o aumentare l'attrito del contenuto mentre si corre.

### Gaps
- Velocità di camminata e di corsa, salto, head bob, FOV predefinito e regolabile: nessuna fonte trovata.

## 8. Interazione con gli elettrodomestici (manopole, porte, rubinetto, lavello, lavastoviglie, cestino, tablet/laptop)

### Takeaway
Le fonti confermano che le interazioni sono **contestuali** (LMB "Interaction", con il prompt in basso a destra). Si interagisce con un **laptop** per i perk e le impostazioni. I forni si scaldano prima dell'uso e la porta del forno a volte "si rompe" (bug o guasto). In CS2 il fornello si regola con il tasto **Q**. **Non ho trovato fonti** sul modo esatto di girare le manopole (clic, tenere premuto o trascinare) nel gioco base.

### Cited Findings
- LMB = "Confirm \ Interaction \ Take \ … \ Buy". I tasti sono contestuali e le azioni sono mostrate in basso a destra — [Gamepressure Controls](https://guides.gamepressure.com/cooking-simulator/guide.asp?ID=50632)
- I perk si sbloccano dal laptop. Il "relaxed mode" nelle impostazioni del laptop può impedire di sbloccare i perk — [Steam: expand pick up range?](https://steamcommunity.com/app/641320/discussions/3/1636410430562661507/); [Steam: Perks not activating?](https://steamcommunity.com/app/641320/discussions/1/3191363272397584757/)
- Il forno va scaldato brevemente prima dell'uso. Cucina "Modern": 2 forni affiancati all'altezza del bancone. "Classic": 2 forni impilati, e il fornello ha un forno sotto — [Gamepressure: Kitchen utensils and tools](https://www.gamepressure.com/cooking-simulator/kitchen-utensils-and-tools/zfc5cd); [Chaptercheats Xbox One](https://www.chaptercheats.com/cheat/xboxone/488328/cooking-simulator/hint/157383)
- La porta del forno "ha l'abitudine di rompersi", e allora il forno funziona solo con la porta aperta. È un sistema di guasti e riparazioni — [Chaptercheats Xbox One](https://www.chaptercheats.com/cheat/xboxone/488328/cooking-simulator/hint/157383); [Steam Guide Paper Rabbit](https://steamcommunity.com/sharedfiles/filedetails/?id=2707229429); [Twinfinite: How to Repair](https://twinfinite.net/guides/cooking-simulator-repair-how-to/)
- La spatola gira il cibo con la fisica e può "flipping your pan all over the place". Un thread spiega come giocare senza usarla — [Steam: How to play without ever touching the Spatula…](https://steamcommunity.com/app/641320/discussions/3/1643166649099805296/)
- CS2: "Why can I not lower the temperature on the oven knob? You can on the stove using the Q key" — estratto attribuito a [Steam CS2 hub](https://steamcommunity.com/app/2455360)
- CS VR: le mani non hanno collisione, quindi per chiudere una porta bisogna portare la mano sulla maniglia e premere il grilletto — [Steam CS VR negative reviews](https://steamcommunity.com/app/1358140/negativereviews/?l=english&browsefilter=toprated)

### Inferences
- Nel gioco base le manopole probabilmente si azionano con un'interazione contestuale (clic, o clic e rotella), non con un trascinamento libero. **Non è confermato.** In CS2 c'è un tasto dedicato (Q) per diminuire.
- Per il laboratorio va bene questa scelta: manopole di bunsen o piastra con "mira + rotella" per regolare, più il prompt contestuale. È coerente con l'uso intenso della rotella nel gioco.

### Gaps
- Gioco base: modo di girare le manopole di fornello e forno, aprire le porte del forno, aprire o chiudere il rubinetto, usare il lavello e la lavastoviglie, gettare nel cestino: le fonti trovate non lo descrivono. Gli estratti Gamepressure su "Cleaning/washing dishes" esistono ([Gamepressure: Cleaning](https://www.gamepressure.com/cooking-simulator/cleaning/zdc5e0)) ma il contenuto non era disponibile.

## 9. Bug, lamentele ed elogi sulla fisica e sui controlli; patch rilevanti

### Takeaway
La fisica è **la caratteristica principale e insieme il difetto più citato**: oggetti che saltano come "jumping beans", oggetti posati che rotolano o cadono senza motivo, versamento dei liquidi ipersensibile, oggetti incastrati, cibo che vola dal piatto. I recensori riconoscono però che la fisica crea comicità e caos divertente. Le patch hanno corretto casi specifici (collisioni, compenetrazioni, jiggle physics) senza stravolgere il sistema.

### Cited Findings
- Recensione: limoni, cipolle, patate e altri cibi "spesso si comportano come jumping beans". Gli oggetti posati "can roll away or just completely drop to the floor for no apparent reason". Il versamento dei liquidi è "oversensitive", con frequenti versamenti — [TheXboxHub review](https://www.thexboxhub.com/cooking-simulator-review-hellish-kitchen/); [Use a Potion (Switch)](https://www.useapotion.com/2020/05/cooking-simulator-review/)
- Tra i contro riassunti dalle recensioni: "difficult controls, repetitiveness, lack of difficulty levels, physics bugs" — [Wikipedia](https://en.wikipedia.org/wiki/Cooking_Simulator)
- "Physic fix?" (giugno 2020): oggetti incastrati nel bancone o nel pavimento, prese che scompaiono, cibo che vola dal piatto camminando, salvataggio in cui non si afferra più nulla — [Steam](https://steamcommunity.com/app/641320/discussions/0/2439210120851694449)
- Le pose sciatte si vedono soprattutto nel tutorial e poi la posa normale funziona bene — [Steam: Great concept poor in execution](https://steamcommunity.com/app/641320/discussions/0/3342162929518905767/)
- Update del 9 gennaio 2020, "Massive New Year's Bug Cleanup, part 1": molte correzioni, tra cui collisioni migliori per lo Spring Onion — [SteamDB patch notes](https://steamdb.info/patchnotes/4555231/)
- Hotfix 7.3.1: fix per il "yolk splitter" che cadeva attraverso il pavimento aprendo i cassetti, e per i prodotti con jiggle physics congelati a mezz'aria dopo l'"advanced container movement" — estratto attribuito alle news Steam ([Steam allnews](https://steamcommunity.com/app/641320/allnews?l=english))
- Patch 7.5.0: rifacimento dei controlli PC. Dopo l'update c'è una lamentela sulla velocità di rotazione con la spatola — [Steam News](https://store.steampowered.com/news/app/641320/view/710032085365031166)
- Update del 2 luglio: "Chaos Tool", nuova grafica e altro (titolo dell'articolo; contenuto non letto) — [player.one](https://www.player.one/cooking-simulator-patch-notes-july-2-update-chaos-tool-new-visuals-and-135188)
- Patch note storiche anche su GOG — [GOG forum: Patch notes](https://www.gog.com/forum/cooking_simulator/patch_notes)
- CS VR: "Goofy physics" tra i pro; le jiggle physics rendono soddisfacente girare le bistecche crude — [Android Central](https://www.androidcentral.com/gaming/virtual-reality/cooking-simulator-vr-review). Worthplaying trova la fisica "rather tame": versare acqua nella friggitrice non causa esplosioni — [Worthplaying](https://worthplaying.com/article/2022/5/18/reviews/132009-pc-vr-review-cooking-simulator-vr/). Lamentela: "no real indication at what range I can pick up stuff" — [Steam CS VR negative reviews](https://steamcommunity.com/app/1358140/negativereviews/?l=english&browsefilter=toprated)
- CS VR patch 1.06: "a new, more precise mechanic for grabbing objects", rotazione degli oggetti sulla spatola migliorata, taglio migliorato — [Steam News CS VR 1.06](https://store.steampowered.com/news/app/1358140/view/5225854263179450350)
- CS2: secondo le recensioni la fisica è stata "toned down a little for more control". Stackup la considera una "dumbing down" che toglie qualcosa all'esperienza. Il taglio libero è stato sostituito da un minigioco con angoli predefiniti — [Game8 review](https://game8.co/articles/reviews/cooking-simulator-2-better-together-review); [Stackup review](https://www.stackup.org/post/review-cooking-simulator-2)

### Inferences
- La lezione di design è chiara: la fisica piena diverte e fa ridere, ma frustra quando è **imprevedibile** e quando gli oggetti posati non stanno fermi. Per il laboratorio conviene una fisica completa durante la manipolazione e i lanci, ma con oggetti che **si addormentano rapidamente** una volta posati (sleep threshold alta, damping angolare alto per gli oggetti tondi).
- Il percorso di CS2, cioè oggetti statici nei contenitori e meno fisica, conferma che lo stesso team ha ritenuto troppo caotica la fisica piena del primo gioco.

### Gaps
- Testi completi delle patch note del gioco base (2019–2025) con le voci "physics": non letti direttamente, perché l'accesso a Steam è bloccato.
- Thread Reddit r/CookingSimulator e trascrizioni YouTube: nessun risultato utile o accessibile.

## 10. Dichiarazioni del developer e implementazione tecnica (Unity, rigidbody, layer)

### Takeaway
**Non ho trovato talk (GDC o Digital Dragons), devlog né interviste** di Big Cheese Studio sul modo in cui hanno implementato la presa fisica in Unity. Le uniche dichiarazioni trovate sono generiche: la fisica si applica a quasi tutto in cucina e la sincronizzazione della fisica in cooperativa è stata la sfida principale di CS2. Rigidbody, layer e joint usati restano **non documentati**.

### Cited Findings
- Motore: Unity. Il gioco usa un "physics integrated engine" per simulare la cucina — [Wikipedia](https://en.wikipedia.org/wiki/Cooking_Simulator)
- TV Tropes afferma che il gioco usa "its own proprietary physics engine". **Contrasta con Unity**, che usa PhysX come fisica integrata. Probabilmente si riferisce a sistemi propri costruiti sopra la fisica di Unity, ma non è verificabile — [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/CookingSimulator)
- I developer volevano una fisica rifinita, perché il gioco applica la fisica a quasi tutto in cucina (sintesi della ricerca, attribuita alle news Steam del gioco) — [Steam news 2019](https://store.steampowered.com/news/posts?appgroupname=Cooking+Simulator&appids=641320&enddate=1550953504)
- Intervista su CS2 (Intel): la sfida principale è stata sincronizzare un gameplay "physics-heavy" in cooperativa. Il gioco è noto per le interazioni dettagliate con gli oggetti, che hanno richiesto molte iterazioni tecniche. È stata risolta con ottimizzazioni, rifacimenti di alcune meccaniche e molto playtesting — [Intel: Say Yes Chef! to Cooking Simulator 2](https://game.intel.com/stories/say-yes-chef-to-cooking-simulator-2-better-together/)
- Intervista Game Rant con il designer Szymon Junde: riguarda il DLC Shelter (trama, nuove meccaniche), non la fisica — [Game Rant](https://gamerant.com/cooking-simulator-interview-big-cheese-studio-shelter-dlc-plot-mechanics/)
- Developer (citato in un thread Steam): correggeranno i casi di blocco "but we won't do big changes in terms of physics" — [Steam: Physic fix?](https://steamcommunity.com/app/641320/discussions/0/2439210120851694449)
- Pagina ufficiale del gioco sul sito di Big Cheese (non letta) — [Big Cheese Studio](https://bigcheesestudio.com/en/cooking-simulator-en/)

### Inferences
- Dalle descrizioni dei giocatori si ricava questo. Il contenuto dei contenitori è dinamico. Esistono "jiggle physics" per alcuni alimenti (deformazione morbida). Esiste una "advanced container movement" che può lasciare gli oggetti "congelati a mezz'aria", il che suggerisce che durante il movimento avanzato gli oggetti contenuti vengano resi cinematici o figli del contenitore e poi rilasciati. **È un'inferenza da una voce di patch note, non è documentata.**

### Gaps
- Dettagli implementativi (Rigidbody cinematico o dinamico per l'oggetto tenuto, joint, layer di collisione, CCD, interpolazione): nessuna fonte pubblica trovata.
- Talk a Digital Dragons o GDC di Big Cheese Studio sulla fisica: nessun risultato.
