# Codice attuale del simulatore di laboratorio: interazione, liquidi, movimento, sgabelli e HUD

Note di ricerca sul codice locale (`/home/user/tavola-periodica-3d`, commit `27bd862`). Le fonti sono file del
repository con numeri di riga (percorsi relativi alla radice del progetto). Le "verifiche empiriche" sono state fatte
con uno script Node temporaneo che importa `src/game/physics.js` (Rapier `@dimforge/rapier3d-compat` 0.19.3, versione
letta in `node_modules/@dimforge/rapier3d-compat/package.json`) e ricrea i collisori di `room.js` con gli stessi numeri;
lo script non fa parte del progetto e nessun file del progetto è stato modificato.

## 1. Mappa dei file e del ciclo di gioco

### Takeaway
La logica è tutta in `LabGame` (`src/game/game.js`, 1626 righe): interazione, oggetto in mano, versamento, pozze e
dati per l'HUD; l'input, il DOM dell'HUD, i dialoghi e il blocco del puntatore stanno in `src/game/game-view.js`. Il
file `hud.js` citato nel documento di design non esiste: l'HUD è dentro `game-view.js`.

### Cited Findings
- Dimensioni dei moduli: `game.js` 1626 righe, `game-view.js` 634, `game-strings.js` 585, `room.js` 555, `items.js` 388, `liquid.js` 201, `effects.js` 192, `physics.js` 174, `player.js` 141, `src/styles/game.css` 786 (conteggio `wc -l`) — [src/game/](src/game/)
- Il commento iniziale di `game.js` dichiara che l'interfaccia (DOM, menu, HUD) sta in `game-view.js` e che `game.js` produce solo stato e messaggi — [game.js:1-5](src/game/game.js#L1-L5)
- Il documento di design elenca un modulo `hud.js` ("mirino, suggerimenti, scheda dell'ordine…") che nel codice non c'è — [design:60](docs/superpowers/specs/2026-10-13-simulatore-laboratorio-design.md#L60); l'HUD è nel `TEMPLATE` e in `renderHud()` di [game-view.js:38-58](src/game/game-view.js#L38-L58), [game-view.js:543-570](src/game/game-view.js#L543-L570)
- Ciclo per fotogramma (`requestAnimationFrame`): `dt = min(0.05, …)`; in stato `play` o `dialog` chiama `game.update(state === 'play' ? dt : 0, { blocked: state !== 'play' })`, poi `game.render()`; l'HUD si ridisegna quando `hudAcc > 1 / HUD_HZ` con `HUD_HZ = 10` — [game-view.js:18](src/game/game-view.js#L18), [game-view.js:575-594](src/game/game-view.js#L575-L594)
- Ordine in `LabGame.update(dt)`: `player.update(dt, blocked)` → rotture rimandate (`pendingBreaks`) → `physics.step(dt, bodies)` → `syncItem` per ogni oggetto → `pourFrom(it, dt)` per **ogni** contenitore → acqua del rubinetto → chimica a passo fisso `CHEM_DT = 1/20` → `updateContents` → `updateHazards` → `checkBins` → `updateHover` → pozze, bilancia, stanza, effetti — [game.js:1423-1464](src/game/game.js#L1423-L1464), [game.js:23](src/game/game.js#L23)
- Fisica a passo fisso `STEP = 1/120`, al massimo `MAX_STEPS = 6` passi per fotogramma; prima di ogni passo chiama `preStep(STEP)`, che `LabGame` collega a `controlHeld(dt)` — [physics.js:14-15](src/game/physics.js#L14-L15), [physics.js:111-135](src/game/physics.js#L111-L135), [game.js:106](src/game/game.js#L106)
- Stato dell'interazione nel costruttore: `held = null`, `holdDist = 0.5`, `lift = 0.16`, `tilt = 0`, `pouring = false`, `swirlT = 0`, `spraying = false`, `mouse` (NDC), `ray` (`THREE.Raycaster`), `hover` — [game.js:83-92](src/game/game.js#L83-L92)

### Inferences
- Per adottare meccaniche "alla Cooking Simulator" i file da toccare sono soprattutto `game.js` (sezioni "input" righe 384-563, "controllo dell'oggetto in mano" 751-874, "versamento" 911-1051, `prompt()`/`hud()` 1482-1607), `game-view.js` (input 440-522, HUD 524-570, aiuto 368-377), `player.js`, `room.js` (sgabelli), `physics.js` (gruppi e controllore), `game-strings.js` e `game.css`.
- Il documento di design andrebbe corretto (riferimento a `hud.js` inesistente) se si aggiorna la documentazione.

### Gaps
- Non ho verificato il comportamento nel browser (prestazioni, sensazione dei comandi): solo lettura del codice e prove fisiche in Node.

## 2. Sgabelli ("sedie") e collisori statici vicino allo spazio calpestabile

### Takeaway
Non ci sono sedie ma **due sgabelli** costruiti in `room.js` alle righe 182-187, a `x = −0.95` e `x = 1.05`, `z = 0.45`,
ciascuno con un **cilindro statico pieno** di raggio 0,17 m alto 0,64 m (dal pavimento), molto più ingombrante della
mesh (un'asta sottile e una seduta). Stanno nel corridoio largo 1,06 m tra i due banconi; con la capsula del giocatore
(raggio 0,28 + offset 0,02) non resta spazio per passare né davanti né dietro: il giocatore, che parte in `(0.15, 0.4)`
proprio tra i due sgabelli, è **intrappolato** tra `x ≈ −0.49` e `x ≈ 0.59` (verificato con Rapier).

### Cited Findings
- Codice degli sgabelli: per `x` in `[-0.95, 1.05]` una seduta `CylinderGeometry(0.17, 0.17, 0.04)` a `y = 0.62`, un'asta `CylinderGeometry(0.02, 0.03, 0.6)` a `y = 0.3`, e `physics.cylinder(x, 0.32, 0.45, 0.32, 0.17)` (centro `y = 0.32`, mezza altezza 0,32 → da 0 a 0,64 m, raggio 0,17), tutti a `z = 0.45`; nessun `owner`, non sono in `fixtures`, non hanno mesh in `hit`, quindi non si possono né usare né spostare — [room.js:182-187](src/game/room.js#L182-L187)
- `Physics.cylinder()` crea un collisore **statico** (nessun corpo rigido) con attrito 0,8 e gruppo `GROUPS.static` — [physics.js:49-55](src/game/physics.js#L49-L55)
- Banconi degli studenti: `benchA { x: 0, z: -0.4, w: 3.6, d: 0.9 }`, `benchB { x: 0, z: 1.6, … }`; ognuno è un mobile `solid(w, BENCH_Y − 0.04, d)` più un piano `solid(w + 0.04, 0.04, d + 0.04)` con `BENCH_Y = 0.92` — [room.js:9](src/game/room.js#L9), [room.js:14-15](src/game/room.js#L14-L15), [room.js:170-175](src/game/room.js#L170-L175). Ne segue: piano A da `z = −0.87` a `0.07`, piano B da `1.13` a `2.07`, entrambi da `x = −1.82` a `1.82`.
- Partenza del giocatore: `start = { x: 0.15, y: HALF + RADIUS + 0.02, z: 0.4 }`; `startFree`/`startCareer` lo riportano in `teleport(0.15, 0.4, 0)` — [player.js:25-26](src/game/player.js#L25-L26), [game.js:225](src/game/game.js#L225), [game.js:234](src/game/game.js#L234)
- Le postazioni `bench` (`stand: [0.15, 0.35]`) e `shelf` (`stand: [0, 0.75]`) teletrasportano il giocatore nello stesso tratto di corridoio tra gli sgabelli — [room.js:37-44](src/game/room.js#L37-L44), [player.js:79-80](src/game/player.js#L79-L80)
- Verifica empirica (Rapier 0.19.3, collisori ricreati con i numeri di `room.js`, capsula `player(…, 0.28, 0.55)` e stesso ciclo di `Player.update`): partendo da `(0.15, 0.4)` il giocatore si ferma a `x = 0.587` andando a est e a `x = −0.487` andando a ovest; rasentando il bancone B (`z = 0.83`) si ferma a `x = 0.774`; **senza** gli sgabelli esce dal corridoio in entrambe le direzioni — script di prova su [room.js:137-187](src/game/room.js#L137-L187) e [physics.js:85-97](src/game/physics.js#L85-L97)
- Elenco dei collisori statici che toccano l'altezza della capsula (y da 0,02 a 1,68 m):
  - pavimento `solid(W, 0.2, D)` e soffitto `physics.box(0, H + 0.1, 0, …)`; quattro muri `physics.box` spessi 0,2 m ai bordi della stanza 10 × 8 m — [room.js:8](src/game/room.js#L8), [room.js:137-139](src/game/room.js#L137-L139), [room.js:151-154](src/game/room.js#L151-L154)
  - banconi A e B (vedi sopra); lo scaffale dei reagenti sul bancone B (ripiano a `y = 1.27`, montanti, schienale a `y = 1.42`) è sopra il bancone e non sporge nel corridoio — [room.js:177-180](src/game/room.js#L177-L180)
  - sgabelli — [room.js:182-187](src/game/room.js#L182-L187)
  - bancone del lavandino (parete ovest): mobile e piani da `x ≈ −5.0` a `−4.3` (`counterW { x: -4.65, z: 0, w: 0.7, d: 5 }`, quindi `z` da −2,5 a 2,5) — [room.js:21](src/game/room.js#L21), [room.js:280-293](src/game/room.js#L280-L293)
  - cappa (parete est): mobile `x` da 4,2 a 5,0, `z` da −2,6 a −1,0; pannelli laterali alti; vetro scorrevole `physics.box(hd.x − hd.w/2 + 0.02, BENCH_Y + 1.0, …, 0.005, 0.375, hd.d/2)`; **interruttore** `solid(0.02, 0.06, 0.05, …, BENCH_Y + 0.3, hd.z + hd.d/2 + 0.06)`, cioè una scatoletta a `(4.21, 1.22, −0.94)` che sporge fuori dalla cappa all'altezza del petto — [room.js:23](src/game/room.js#L23), [room.js:322-330](src/game/room.js#L322-L330), [room.js:336](src/game/room.js#L336)
  - armadio del magazzino `solid(0.6, 2.0, 1.0)` centrato in `(4.65, 1.0, 0.9)` — [room.js:30](src/game/room.js#L30), [room.js:345](src/game/room.js#L345)
  - cattedra `solid(1.8, DESK_Y − 0.04, 0.8)` + piano in `(0, −2.9)` (`DESK_Y = 0.78`), quindi `x` ±0,92, `z` da −3,32 a −2,48 — [room.js:10](src/game/room.js#L10), [room.js:24](src/game/room.js#L24), [room.js:362-363](src/game/room.js#L362-L363)
  - cinque contenitori dei rifiuti (pareti alte 0,6 m e fondo) con centri `x = −4.2 + i · 0.46`, `z = 3.62`, ingombro 0,38 × 0,38 m ciascuno — [room.js:27](src/game/room.js#L27), [room.js:401-416](src/game/room.js#L401-L416)
  - tubo della doccia `physics.cylinder(sh.x + 0.35, 1.2, sh.z, 1.2, 0.03)` in `(4.8, 1.2, 3.35)` — [room.js:28](src/game/room.js#L28), [room.js:427](src/game/room.js#L427)
  - supporto dell'estintore `solid(0.16, 0.02, 0.16, …, ex.x, 0.35, ex.z)`: una piastra sospesa a 0,35 m in `(4.82, 2.3)`, vicino al muro — [room.js:29](src/game/room.js#L29), [room.js:440-441](src/game/room.js#L440-L441)
- Lavagna e porta sono solo mesh senza collisore (la porta è dipinta sul muro, che ha già il suo collisore) — [room.js:163-164](src/game/room.js#L163-L164), [room.js:382-383](src/game/room.js#L382-L383)
- L'estintore è un oggetto **dinamico** da 4 kg (cilindro r 0,075, h 0,5) creato in `(4.82, 0.37, 2.3)` — [game.js:110-111](src/game/game.js#L110-L111), [items.js:43](src/game/items.js#L43), [items.js:335-341](src/game/items.js#L335-L341)

### Inferences
- Calcolo di passaggio (coerente con la verifica empirica): nel corridoio il centro della capsula può stare tra `z = 0.07 + 0.30 = 0.37` e `z = 1.13 − 0.30 = 0.83`; per superare uno sgabello serve una distanza dal suo asse di almeno `0.17 + 0.28 + 0.02 = 0.47` m, quindi `z ≤ −0.02` oppure `z ≥ 0.92`: entrambe fuori dal corridoio. L'autostep (0,25 m) non basta per salire su un cilindro alto 0,64 m.
- La zona tra gli sgabelli (x ≈ −0,49…0,59) si raggiunge solo per teletrasporto (partenza, postazioni `bench`/`shelf`); dall'esterno si entra nel corridoio solo nei tratti `x` ±(1,52…1,82).
- Soluzioni possibili per il rapporto: (a) spostare gli sgabelli sotto il bancone A (es. `z ≈ 0.15–0.2`, a ridosso del piano) o eliminarne il collisore; (b) sostituire il cilindro pieno con un collisore fedele alla mesh (seduta + asta sottile) — un'asta r 0,03 lascerebbe ancora poco spazio; (c) renderli **dinamici e spingibili** (corpo dinamico pesante con `setApplyImpulsesToDynamicBodies(true)` sul controllore), come le sedie dei giochi alla Cooking Simulator. In ogni caso le modifiche sono in `room.js:182-187` (ed eventualmente in `physics.js:85-97`).
- La piastra del supporto dell'estintore e l'interruttore della cappa sono piccoli ostacoli "invisibili" all'altezza della capsula che possono dare urti inattesi.

### Gaps
- Non ho verificato in Rapier se l'estintore dinamico appoggiato al muro blocca il giocatore (vedi sezione 3 sul fatto che il controllore urta i corpi dinamici grandi).

## 3. Giocatore: capsula, controllore di Rapier, movimento e vista del bancone

### Takeaway
Il giocatore è un corpo cinematico a posizione con una capsula (raggio 0,28 m, mezza altezza del cilindro 0,55 m,
altezza totale 1,66 m) mosso dal `KinematicCharacterController` di Rapier (offset 0,02, pendenza max 45°, autostep
0,25 m, aggancio al suolo 0,3 m, nessuna spinta ai corpi dinamici). Cammina a 2,1 m/s, corre a 3,6 m/s. `Tab` passa a
una camera fissa per postazione (6 postazioni) e teletrasporta la capsula davanti alla postazione.

### Cited Findings
- Costanti: `EYE = 1.62`, `RADIUS = 0.28`, `HALF = 0.55` ("altezza totale 2·(0,55 + 0,28) = 1,66 m"), `WALK = 2.1`, `RUN = 3.6` — [player.js:6-10](src/game/player.js#L6-L10)
- `Physics.player(pos, radius, halfHeight)`: `RigidBodyDesc.kinematicPositionBased()`, `ColliderDesc.capsule(halfHeight, radius)` con `GROUPS.player`, `createCharacterController(0.02)`, `setUp({0,1,0})`, `setMaxSlopeClimbAngle(45°)`, `enableAutostep(0.25, 0.2, false)`, `enableSnapToGround(0.3)`, `setApplyImpulsesToDynamicBodies(false)` — [physics.js:85-97](src/game/physics.js#L85-L97)
- Gruppi di collisione: `G = { STATIC: 1, ITEM: 2, PLAYER: 4, DEBRIS: 8 }`; `static` collide con ITEM|PLAYER|DEBRIS, `item` con STATIC|ITEM|DEBRIS, `player` solo con STATIC, `debris` con STATIC|ITEM — [physics.js:17-25](src/game/physics.js#L17-L25)
- `Player.update(dt, blocked)`: legge `KeyW/S/A/D` e frecce solo se `mode === 'walk' && !blocked`; normalizza la diagonale; velocità `RUN` con `ShiftLeft/ShiftRight`; ruota con `yaw`; gravità manuale `vy = grounded ? -0.5 : max(-20, vy − 9.81·dt)`; `controller.computeColliderMovement(collider, {vx·dt, vy·dt, vz·dt})` **senza filtri**; `body.setNextKinematicTranslation(t + computedMovement)`; `moving = |v| > 0.1` — [player.js:93-114](src/game/player.js#L93-L114)
- Camera: in `walk` occhi a `piedi + EYE` e quaternione da `Euler(pitch, yaw, 0, 'YXZ')`; in `bench` `lookAt(benchCam.pos → benchCam.look)`; al cambio di modo interpolazione con `camT += dt · 2.6` e easing in-out; `camera.updateMatrixWorld()` subito, perché puntatore e oggetto in mano usano la camera del fotogramma — [player.js:116-139](src/game/player.js#L116-L139)
- Sguardo: `look(dx, dy)` con sensibilità `0.0022` rad/pixel, `pitch` limitato a [−1.45, 1.35]; `pitch` iniziale −0,25 — [player.js:17](src/game/player.js#L17), [player.js:40-43](src/game/player.js#L40-L43)
- `teleport(x, z, yaw)`: `setNextKinematicTranslation` e `setTranslation` a quota fissa `HALF + RADIUS + 0.02` — [player.js:45-49](src/game/player.js#L45-L49)
- `enterBench(index)`: sceglie la postazione con `stand` più vicino, `mode = 'bench'`, `setStation(index, true)` — [player.js:52-68](src/game/player.js#L52-L68)
- `setStation(index, fromWalk)`: indice ciclico, memorizza la camera di partenza, `benchCam.pos/look` da `STATIONS[i].cam/look`, teletrasporta il giocatore in `stand` girato verso `look`, `pitch = −0.5` se non arriva dalla camminata — [player.js:70-82](src/game/player.js#L70-L82)
- `exitBench()`: `mode = 'walk'`, `pitch` dalla direzione della camera del bancone — [player.js:84-91](src/game/player.js#L84-L91)
- `STATIONS` (6): `bench` cam `[0.15, 1.72, 0.62]` → look `[0.15, BENCH_Y, −0.48]`; `shelf`; `sink`; `hood`; `desk`; `bins` — [room.js:37-44](src/game/room.js#L37-L44)
- `LabGame.toggleView()` alterna `enterBench`/`exitBench`; `station(delta)` cambia postazione solo in `bench` — [game.js:519-526](src/game/game.js#L519-L526); in `game-view.js` `Tab` chiama `toggleView()` e blocca/sblocca il puntatore, `A`/`D` (o frecce) in vista bancone chiamano `game.station(∓1)` — [game-view.js:455-462](src/game/game-view.js#L455-L462), [game-view.js:470-474](src/game/game-view.js#L470-L474)
- Verifica empirica: un becher dinamico (cilindro r 0,0345, h 0,095) sul pavimento **non** ferma il giocatore (il becher resta fermo); una scatola dinamica di 0,6 × 1,2 × 0,6 m da 4 kg invece lo **ferma** (`numComputedCollisions() = 3`, giocatore fermo a `x ≈ 0.40` davanti alla scatola che resta ferma) — script di prova con [physics.js:85-97](src/game/physics.js#L85-L97) e [player.js:109-113](src/game/player.js#L109-L113)

### Inferences
- Poiché `computeColliderMovement` è chiamato senza `filterGroups`, i lanci di forma del controllore non rispettano `GROUPS.player` (che filtra solo i contatti del risolutore): il giocatore può essere fermato da oggetti dinamici grandi (verificato) ma non li spinge (`setApplyImpulsesToDynamicBodies(false)`); i contatti fisici tra capsula e oggetti sono invece esclusi dai gruppi, quindi un oggetto (anche quello in mano) può compenetrare la capsula senza spingerla.
- Se si vogliono sedie spingibili, servono: corpo dinamico per la sedia, `setApplyImpulsesToDynamicBodies(true)` (ed eventualmente `setCharacterMass`) in `physics.js:85-97`, e un filtro esplicito in `player.js:110` per escludere la vetreria piccola.
- La vista del bancone non è una "camera libera": ogni postazione ha camera e punto guardato fissi, e il giocatore viene teletrasportato.

### Gaps
- Non ho verificato se l'oggetto tenuto in mano a distanza minima (0,3 m, sezione 4) entri nei lanci di forma del controllore e ostacoli la camminata in avanti: è plausibile ma non provato.

## 4. Prendere, tenere, posare, lanciare: funzioni e mappatura dei comandi

### Takeaway
L'oggetto preso resta un **corpo dinamico** (gravità azzerata) guidato a velocità verso un bersaglio davanti alla
camera (`holdTarget`) con orientamento `holdQuat` (solo yaw della camera + inclinazione in avanti `tilt`), a ogni passo
fisico in `controlHeld` (guadagno 16/s, velocità max 9 m/s, rotazione max 14 rad/s). Collide con stanza e altri
oggetti (li spinge); se resta incastrato a più di 0,9 m dal bersaglio per 0,5 s viene lasciato. Posare = clic
sinistro: se il raggio di mira colpisce un piano libero entro 0,6 m l'oggetto viene **teletrasportato** lì dritto,
altrimenti cade. Non c'è anteprima del punto di appoggio né rotazione libera dell'oggetto.

### Cited Findings
- Mira/hover: `pointerRay()` parte dal centro dello schermo in `walk` e dal mouse in `bench`; `far = REACH = 2.3` m in `walk`, 6 m in `bench` — [game.js:21](src/game/game.js#L21), [game.js:391-396](src/game/game.js#L391-L396). `updateHover()` fa un raycast Three.js sulle mesh `item.hits`, `fixture.hit` e sulle pozze (escluso l'oggetto in mano) e salva `{ type, item|fixture|puddle, point, distance }` — [game.js:398-424](src/game/game.js#L398-L424)
- `primary()` (clic sinistro): con un oggetto in mano → `release()`; altrimenti `grab(item)` sull'oggetto guardato o `use(true)` sull'elemento fisso — [game.js:427-435](src/game/game.js#L427-L435)
- `grab(item)`: ignora gli oggetti nei rifiuti; `tilt = 0`; in `walk` `holdDist = clamp(distanza camera–oggetto, 0.35, 0.7)`, in `bench` `lift = clamp(p.y − benchPlaneY() + 0.16, 0.1, 0.4)`; `body.wakeUp()`; `setGravityScale(0)` — [game.js:437-446](src/game/game.js#L437-L446)
- `holdQuat(out)`: yaw della camera (`walk`) o della postazione (`bench`); contenitori: rotazione attorno a X di `−tilt` (+ oscillazione di `swirlT`); estintore: solo yaw; strumenti: yaw + π/2 e rotazione attorno a Z di `pitch·0.8 − tilt` — [game.js:754-771](src/game/game.js#L754-L771)
- `holdTarget(out, quat)`: in `walk` `camera.position + dir · holdDist`, abbassato di `0.06 + 0.4 · altezza` per i contenitori; in `bench` intersezione del raggio del mouse con il piano orizzontale `benchPlaneY() + lift` (distanza 0,2–4 m); per gli strumenti passa a `toolTarget`; per i contenitori con `tilt ≥ 0.25` applica l'assistenza al versamento (sezione 5) — [game.js:777-804](src/game/game.js#L777-L804), [game.js:528-531](src/game/game.js#L528-L531)
- `toolTarget(out, quat)`: se si guarda un punto entro `holdDist + 0.6`, porta la punta dello strumento (`TOOL_TIPS`: ansa, spatola, cartina) 1 cm davanti al punto colpito; con l'ansa sul Bunsen la punta va nella fiamma — [game.js:44](src/game/game.js#L44), [game.js:807-821](src/game/game.js#L807-L821)
- `controlHeld(dt)` (in `physics.preStep`, 120 Hz): `stuckT` cresce se `dist > 0.9`, oltre 0,5 s `release()`; velocità lineare `d · k · s` con `k = 16`, `vmax = 9`, `s = min(1, vmax / (dist·k))`; velocità angolare dall'errore di quaternione `w = min(14, angle · 14)` — [game.js:844-874](src/game/game.js#L844-L874)
- Corpi degli oggetti: `RigidBodyDesc.dynamic()` con CCD attivo, smorzamento lineare 0,05 e angolare 0,3, collisori con gruppo `item` (o `debris`), eventi di forza di contatto con soglia `max(0.5, mass·25)` — [physics.js:61-83](src/game/physics.js#L61-L83); vetreria con `events: true, friction: 0.6`, strumenti con `friction: 0.9` — [items.js:280](src/game/items.js#L280), [items.js:352](src/game/items.js#L352)
- Urti: `impact()` ignora l'oggetto in mano (`owner === this.held`), rompe la vetreria se `speed > BREAK_SPEED (3.3)` e `force > mass · 60` — [game.js:22](src/game/game.js#L22), [game.js:877-880](src/game/game.js#L877-L880)
- `placeSpot(item)`: raggio Rapier lungo il raggio di mira (escluso il corpo in mano); valido se `normal.y ≥ 0.7`, non su un corpo dinamico, entro 0,6 m dall'oggetto e senza altri oggetti vicini (distanza orizzontale < somma dei raggi e |Δy| < 0,2) — [game.js:452-464](src/game/game.js#L452-L464)
- `release(throwSpeed = 0)`: azzera `held`, `pouring`, `spraying`; gravità 1; velocità limitata a ±1,2 m/s per asse; velocità angolare 0; se lancio: `camDir · throwSpeed + (0, 1.2, 0)`; se c'è `spot`: `placeItem(item, spot, q)` con `q` = yaw della camera (contenitori ed estintore) o yaw + π/2 (strumenti), quindi **teletrasporto istantaneo** e dritto — [game.js:466-487](src/game/game.js#L466-L487); `placeItem` imposta traslazione, rotazione e velocità nulle — [items.js:356-362](src/game/items.js#L356-L362)
- `throwHeld()` = `release(6)` — [game.js:489-491](src/game/game.js#L489-L491)
- `setPour(on)` imposta solo `this.pouring`, che **non viene letto da nessuna parte** (unici usi: righe 87, 471, 494) — [game.js:493-495](src/game/game.js#L493-L495)
- `tiltBy(dy)`: `tilt = clamp(tilt + dy · 0.0045, 0, max)` con `max = 2.6` rad per i contenitori e 1,2 per gli strumenti; l'inclinazione **resta** dopo aver rilasciato il tasto destro (nessun ritorno automatico) — [game.js:497-501](src/game/game.js#L497-L501)
- `wheel(delta)`: se non si tiene nulla e si guarda la piastra, cambia livello; altrimenti `holdDist = clamp(holdDist − delta · 0.0006, 0.3, 0.9)` in `walk` o `lift = clamp(lift − delta · 0.0004, 0.03, 0.45)` in `bench` — [game.js:503-511](src/game/game.js#L503-L511)
- `use(down, fine)` (tasto `E`): estintore → `spraying = down`; spatola/ansa/cartina/carta sul bersaglio; contenitore sul lavandino → `wash`, su un bidone → `emptyInto`; elemento fisso → `useFixture`; contenitore in mano senza bersaglio → agitare (`swirlT = 1.2`); a mani vuote su un oggetto → `grab` — [game.js:538-563](src/game/game.js#L538-L563)
- Distributori: carta e cartine compaiono in `handPoint()` (0,45 m davanti alla camera, 8 cm più in basso) e vengono prese subito — [game.js:596-611](src/game/game.js#L596-L611)
- Mappatura in `game-view.js`:
  - tasti `W A S D`/frecce/`Shift` → `player.keys` (in vista bancone `A`/`D` cambiano postazione) — [game-view.js:455-462](src/game/game-view.js#L455-L462)
  - `E` (giù e su, senza ripetizione, `Shift` = fine) → `game.use(down, ev.shiftKey)` — [game-view.js:463-467](src/game/game-view.js#L463-L467)
  - `Q` → `throwHeld()`; `Tab` → `toggleView()` + blocco/sblocco del puntatore; `I` → mostra/nasconde le schede; `H` → aiuto; `F` → fps; `Esc` → pausa — [game-view.js:445-481](src/game/game-view.js#L445-L481)
  - clic sinistro → `primary()`; tasto destro premuto → `rmb = true` + `setPour(true)`; rilascio → `setPour(false)`; menu contestuale disattivato — [game-view.js:489-507](src/game/game-view.js#L489-L507)
  - movimento del mouse → `setMouse(NDC)`; con tasto destro premuto e un oggetto in mano → `tiltBy(−movementY · (walk ? 1 : 1.4))` **al posto** dello sguardo; altrimenti in `walk` col puntatore bloccato → `player.look` — [game-view.js:508-517](src/game/game-view.js#L508-L517)
  - rotella → `game.wheel(deltaY)` — [game-view.js:518-522](src/game/game-view.js#L518-L522)
  - un clic con il puntatore non bloccato in `walk` serve solo a bloccarlo (il clic non arriva al gioco); perdendo il blocco durante il gioco in `walk` si apre la pausa — [game-view.js:151-163](src/game/game-view.js#L151-L163), [game-view.js:183-186](src/game/game-view.js#L183-L186), [game-view.js:489-494](src/game/game-view.js#L489-L494)

### Inferences
- Con la rotella standard (`deltaY = 100` per scatto) la distanza cambia di 6 cm per scatto in prima persona (0,3–0,9 m) e l'altezza di 4 cm in vista bancone; per inclinare al massimo (2,6 rad ≈ 149°) servono circa 580 px di mouse verso l'alto in prima persona (≈ 410 px in vista bancone): ≈ 0,26° per pixel.
- Durante l'inclinazione la camera è ferma (niente sguardo con il tasto destro premuto): non si può correggere la mira mentre si versa, a differenza dei giochi in cui inclinazione e mira sono separate.
- Un lancio a 6 m/s supera la soglia di rottura (3,3 m/s): un becher lanciato contro un muro si rompe se la forza supera `mass · 60`.
- Mancano rispetto a Cooking Simulator: anteprima "fantasma" del punto di appoggio (oggi `placeSpot` è calcolato solo al clic e l'utente non lo vede), evidenziazione dell'oggetto puntato (nessun outline/emissive: solo il testo del suggerimento), rotazione dell'oggetto in mano su più assi (oggi solo yaw dalla camera + tilt in avanti), posa "morbida" animata invece del teletrasporto, ritorno automatico dritto quando si rilascia il tasto destro, mani/modello del giocatore.
- Funzioni da modificare per queste meccaniche: `updateHover`/`pointerRay` (evidenziazione), `placeSpot`/`release` (anteprima e posa), `holdQuat`/`tiltBy` (rotazione su più assi, ritorno dritto), `controlHeld` (morbidezza), `setPour` (oggi inutile), e in `game-view.js` i gestori di `mousedown`/`mousemove`/`wheel`/`keydown`.

### Gaps
- Non ho misurato il comportamento dell'oggetto in mano contro i muri nel browser; dal codice: essendo dinamico con CCD, viene fermato dalla geometria statica e, se il bersaglio resta oltre 0,9 m per 0,5 s, viene lasciato cadere.

## 5. Versare: inclinazione, portata, getto, bersagli, pozze e assistenza alla mira

### Takeaway
Si versa inclinando il contenitore con tasto destro + mouse verso l'alto; il livello del liquido è il quantile di 320
punti campionati nel volume interno (resta orizzontale a ogni inclinazione) e il liquido esce dal punto più basso del
bordo con la portata di uno stramazzo `Q ≈ 1,77 · b · h^1,5` (h limitato a 3 cm). Il getto è una parabola calcolata
analiticamente (velocità orizzontale ≤ ~0,33 m/s) verso contenitori dritti, lavandino, bidoni o, in mancanza, una
superficie dove si crea una pozza. Con `tilt ≥ 0,25` rad la bocca viene portata automaticamente sopra il bersaglio
guardato, con compensazione della deriva del getto.

### Cited Findings
- Livello: `SAMPLES = 320`; `interiorSamples` (punti stratificati proporzionali all'area della sezione), `rimPoints`, e `liquidLevel(samples, rim, m, fraction)` che restituisce `level` (quantile con quickselect), `rimY`/`rimIndex` (punto più basso del bordo) e `over` — [liquid.js:1-10](src/game/liquid.js#L1-L10), [liquid.js:53-92](src/game/liquid.js#L53-L92), [liquid.js:130-156](src/game/liquid.js#L130-L156)
- Disegno: `liquidMaterial` scarta i frammenti sopra `uLevel` (quota nel mondo) e colora le facce interne come superficie; `interiorGeometry` è un solido di rotazione al 98,5 % del raggio — [liquid.js:164-201](src/game/liquid.js#L164-L201); aggiornato in `updateContents` (solido e liquido separati) — [game.js:1055-1087](src/game/game.js#L1055-L1087)
- Dati dei contenitori (`DEFS`): profili interni reali, `flow` (beuta 0,7, bottiglia 0,45, spruzzetta 0,28, barattolo 1,2), `drops` (contagocce), `spout`; derivati `capacity`, `samples`, `rim` (20 punti se `wide`/`spout`, altrimenti 12), `rimR`, `height`, `area`, `heatC` — [items.js:15-56](src/game/items.js#L15-L56)
- `pourFrom(item, dt)` è chiamata per **tutti** i contenitori a ogni fotogramma (non solo quello in mano: un becher rovesciato sul bancone versa) — [game.js:1431](src/game/game.js#L1431)
- Formula in `pourFrom`: `h = level − rimY` (per le polveri `h −= 0.004`, "angolo di riposo"); `b = 2·√(2·R·h' − h'²)` con `h' = min(h, R)`; `q = 1.77 · b · min(h, 0.03)^1.5 · 1e6 · (flow ?? 1)` mL/s; polveri `q *= 0.6`; `+40` mL/s se `h > 0.03` o contenitore stracolmo; contagocce: gocce da 0,05 mL, al massimo 0,15 mL/s (3 gocce/s); resta sempre un residuo `RESIDUE_ML = 0.2` — [game.js:24](src/game/game.js#L24), [game.js:957-990](src/game/game.js#L957-L990)
- Punto di uscita: punto del bordo `rimIndex` spostato 3 mm verso l'esterno; direzione = asse del recipiente proiettato in orizzontale se `flat > 0.2`, altrimenti direzione radiale del bordo; velocità orizzontale `speed = drops ? 0.01 : min(0.45, 0.6·√(9.81 · min(h, 0.03)))`, salvata in `item.streamSpeed` — [game.js:991-1005](src/game/game.js#L991-L1005)
- `traceStream(p, vx, vz, source)`: caduta balistica senza velocità verticale iniziale (`dt = √(2(p.y − y)/g)`); prova i `receivers` (bordo più alto colpito vince), poi la vasca del lavandino, poi le aperture dei bidoni (r 0,16), altrimenti un raggio verticale solo sulla stanza (`solidOnly`) per trovare la superficie — [game.js:928-954](src/game/game.js#L928-L954)
- `receivers(source)`: contenitori con l'asse verso l'alto (`up.y ≥ 0.75`), bocca di raggio `rimR · 0.95 + 0.004` — [game.js:914-925](src/game/game.js#L914-L925)
- Destinazioni: contenitore → `mixture.add(portion)`; lavandino o bidone → `disposeWaste` (multe se sbagliato, controllo ogni 3 s durante un versamento continuo); superficie → `spill` — [game.js:1006-1010](src/game/game.js#L1006-L1010), [game.js:735-749](src/game/game.js#L735-L749)
- Gocce visibili del getto: da 1 a 5 sfere istanziate per fotogramma (`Drops.emit`, raggio 0,0012–0,004 m), balistiche, spariscono alla quota della destinazione; non hanno fisica né collisioni — [game.js:1011-1018](src/game/game.js#L1011-L1018), [effects.js:11-77](src/game/effects.js#L11-L77)
- `spill(mix, p, source)`: nella vasca → scarico; altrimenti si unisce a una pozza vicina (entro `r + 0.04`, |Δy| < 0,05) o ne crea una nuova (`createPuddle`, disco) con avviso `spilled` sopra 2 mL — [game.js:1022-1036](src/game/game.js#L1022-L1036); `updatePuddle` usa `puddleRadius(ml) = clamp(√(V/(π·0,0015)), 0.015, 0.6)` (spessore 1,5 mm) e il colore della miscela — [game.js:1038-1051](src/game/game.js#L1038-L1051), [effects.js:180-192](src/game/effects.js#L180-L192)
- Pozze: si asciugano con la carta (`wipe`, assorbe fino a 40 mL), evaporano piano (tick ogni secondo) e contano come disordine nella valutazione — [game.js:693-707](src/game/game.js#L693-L707), [game.js:1450-1457](src/game/game.js#L1450-L1457), [game.js:303-312](src/game/game.js#L303-L312)
- Assistenza alla mira in `holdTarget`: se `tilt ≥ 0.25`, `blend = min(1, (tilt − 0.25)/0.5)`; `aim = pourAim(out)`; labbro `lip = (0, top, −rimR·1.05)` ruotato con l'orientamento voluto; `goal = aim − lip`; deriva `drift = min(0.03, streamSpeed · √(2·(0.05 + 0.02·tilt)/g))` aggiunta lungo `+z` ruotato di `player.yaw` in `walk` (0 in `bench`); risultato `out.lerp(goal, blend)` — [game.js:792-803](src/game/game.js#L792-L803)
- `pourAim(fallback)`: se si guarda un altro contenitore → centro della sua bocca + `0.05 + 0.02·tilt`; lavandino → centro della vasca + 0,08; bidone → apertura + 0,1; altrimenti il normale punto di presa — [game.js:824-842](src/game/game.js#L824-L842)
- Acqua del rubinetto: `TAP_FLOW = 25` mL/s nel contenitore sotto il getto (con tracce di CaCl₂ e NaHCO₃) e cilindro del getto scalato fino alla destinazione — [game.js:25](src/game/game.js#L25), [game.js:1432-1440](src/game/game.js#L1432-L1440)
- Indicatore di inclinazione nell'HUD: `hud().tilt` (solo per i contenitori) ruota l'ago di `.gm-tilt` — [game.js:1603](src/game/game.js#L1603), [game-view.js:567-569](src/game/game-view.js#L567-L569)
- Test esistente: il livello resta a metà per un becher dritto pieno a metà, a 60° supera il bordo, a 15° no — [physics.test.mjs:54-74](tests/game/physics.test.mjs#L54-L74)

### Inferences
- Portate risultanti (calcolo dalla formula, becher da 250 mL con `R = 0.033`): `h = 3 mm` → ≈ 8 mL/s; `h = 1 cm` → ≈ 84 mL/s; `h = 3 cm` (limite) → ≈ 600 mL/s (+40 oltre). La velocità del getto, per via di `min(h, 0.03)`, non supera ≈ 0,33 m/s: il limite `0.45` non viene mai raggiunto.
- Il getto non verifica ostacoli lungo la parabola (nessun raggio sulla traiettoria): può "attraversare" il bordo di un altro oggetto o una mano; le gocce sono solo decorative. Non c'è un getto continuo (mesh/nastro) per il versamento dai recipienti, a differenza del rubinetto.
- Possibile incoerenza: in vista bancone la deriva è applicata lungo `+z` del mondo (yaw 0) mentre `holdQuat` usa lo yaw della postazione; per la postazione `bench` (yaw 0) coincide, per `sink` (yaw ≈ π/2) e `hood` la compensazione andrebbe nella direzione sbagliata.
- Per un versamento "alla Cooking Simulator" (versare tenendo premuto un tasto, a velocità controllata, con anteprima del getto) le funzioni coinvolte sono `tiltBy`/`setPour` (oggi `pouring` è inutilizzato), `holdTarget`/`pourAim` (assistenza), `pourFrom` (portata), `traceStream` (anteprima/ostacoli) e `effects.js` (getto continuo).

### Gaps
- Non ho misurato nel browser quanto l'assistenza alla mira sia percepita come "magnetica" o quanto la deriva compensi davvero il getto.

## 6. HUD, comandi a schermo, stringhe e finestra di aiuto

### Takeaway
L'HUD (aggiornato a 10 Hz) ha: mirino puntiforme al centro (solo in prima persona), suggerimenti sotto il mirino con
i tasti in `<kbd>`, scheda dell'esercitazione in alto a sinistra, soldi + visuale + pausa in alto a destra, reazioni
sotto, avvisi (toast) in alto al centro, allarme in basso al centro, indicatore di inclinazione accanto al mirino e due
schede degli oggetti in basso: **"in mano" in basso a sinistra e "guardi" in basso a destra**. Una nuova legenda dei
comandi in basso a destra si sovrapporrebbe alla scheda `.gm-card--looked`. L'elenco completo dei comandi è solo nella
finestra di aiuto (`H` o pulsante "Comandi").

### Cited Findings
- Struttura dell'HUD: `.gm-cross`, `.gm-prompt`, `.gm-order`, `.gm-top` (`.gm-money`, `.gm-view`, pulsante pausa), `.gm-card--held`, `.gm-card--looked`, `.gm-toasts`, `.gm-alarm`, `.gm-tilt`, `.gm-reactions` — [game-view.js:38-58](src/game/game-view.js#L38-L58)
- `renderHud()`: suggerimenti come `<span>` da `h.prompt`; mirino nascosto fuori dalla prima persona; soldi o "Libero"; testo della visuale (`viewWalk`/`viewBench` + fps); scheda dell'esercitazione con passi spuntati (riscritta solo se cambia); schede `held`/`looked` (`renderCard`, nascoste con `I`); allarme/schizzi; indicatore di inclinazione se `tilt > 0.02` — [game-view.js:526-570](src/game/game-view.js#L526-L570)
- Frequenza: `HUD_HZ = 10` — [game-view.js:18](src/game/game-view.js#L18), [game-view.js:590-593](src/game/game-view.js#L590-L593)
- Dati: `LabGame.hud()` restituisce `prompt`, `held`, `looked`, `order`, `money`, `free`, `mode`, `station`, `alarm`, `splash`, `tilt`, `flameTest`, `plate` — [game.js:1584-1607](src/game/game.js#L1584-L1607); `prompt()` compone le righe (con oggetto in mano: versa/strumento/lava/svuota + `promptDrop`; a mani vuote: prendi/pozza/elemento fisso) — [game.js:1482-1512](src/game/game.js#L1482-L1512); `describe()` compone le schede — [game.js:1515-1577](src/game/game.js#L1515-L1577)
- Posizioni CSS: `.gm-hud` `inset: 0`, `pointer-events: none` — [game.css:43-50](src/styles/game.css#L43-L50); `.gm-cross` al centro (6 px) — [game.css:51-64](src/styles/game.css#L51-L64); `.gm-prompt` `left: 50%; top: calc(50% + 22px)`, colonna centrata, `max-width: min(640px, 92vw)`, testo 13 px su fondo scuro — [game.css:65-86](src/styles/game.css#L65-L86); `.gm-order` `left: 16px; top: 16px; width: min(330px, 40vw)` — [game.css:96-102](src/styles/game.css#L96-L102); `.gm-top` `right: 16px; top: 16px` — [game.css:163-170](src/styles/game.css#L163-L170); `.gm-card` `bottom: 16px; width: min(300px, 36vw)`, `--held` `left: 16px`, `--looked` `right: 16px` — [game.css:193-208](src/styles/game.css#L193-L208); `.gm-toasts` `left: 50%; top: 16px; width: min(560px, 60vw)` — [game.css:287-297](src/styles/game.css#L287-L297); `.gm-alarm` `left: 50%; bottom: 120px` — [game.css:328-340](src/styles/game.css#L328-L340); `.gm-tilt` `left: calc(50% + 40px); top: calc(50% − 26px)` — [game.css:349-370](src/styles/game.css#L349-L370); `.gm-reactions` `right: 16px; top: 64px; max-width: 44vw` — [game.css:371-380](src/styles/game.css#L371-L380); stile `.gm kbd` — [game.css:38](src/styles/game.css#L38); sotto 640 px le schede diventano `calc(50vw − 24px)` — [game.css:777-786](src/styles/game.css#L777-L786)
- Mini-legenda già presente nella barra in alto: `viewWalk: 'Prima persona · Tab: vista del bancone'`, `viewBench: 'Vista: {station} · A/D cambia postazione · Tab: prima persona'` — [game-strings.js:44-45](src/game/game-strings.js#L44-L45) (en: [game-strings.js:328-329](src/game/game-strings.js#L328-L329))
- Suggerimenti contestuali (it): `promptTake`, `promptDrop` ("Clic posa · Q lancia · Rotella distanza"), `promptPour` ("Tasto destro + mouse su: versa · E agita"), strumenti, lavandino, bidoni, elementi fissi — [game-strings.js:113-140](src/game/game-strings.js#L113-L140); en — [game-strings.js:395-422](src/game/game-strings.js#L395-L422)
- Finestra di aiuto `showHelp()`: due colonne (`.gm-help`, griglia 1fr 1fr) con `helpWalk`/`helpWalkRows`, `helpBench`/`helpBenchRows`, `helpTools`/`helpToolsRows`; si apre con `H`, dal menu principale e dalla pausa (pulsante "Comandi") — [game-view.js:368-377](src/game/game-view.js#L368-L377), [game-view.js:212](src/game/game-view.js#L212), [game-view.js:360](src/game/game-view.js#L360), [game-view.js:476](src/game/game-view.js#L476), [game.css:680-708](src/styles/game.css#L680-L708)
- Contenuto dell'aiuto (it): prima persona `W A S D` cammina (Maiusc: corri), Mouse guarda, Clic prendi/posa, Tasto destro + mouse inclina per versare, Q lancia, Rotella distanza, Tab vista del bancone, Esc pausa; vista bancone `A / D` postazione, Clic prendi/posa (l'oggetto segue il puntatore), Tasto destro + mouse inclina, Rotella altezza; "Usare (E)": manopole/rubinetto/bilancia/cappa/doccia/campanello, recipiente (agita, lava, svuota), spatola (Maiusc: pizzico), ansa, carta/cartina/estintore, `I` schede, `H` comandi — [game-strings.js:283-288](src/game/game-strings.js#L283-L288); en — [game-strings.js:559-564](src/game/game-strings.js#L559-L564)
- La tabella `eli6` ridefinisce solo pochi testi (titolo, introduzioni, alcuni avvisi): per i comandi ricade sull'italiano (catena `eli6 → it`, `en → it`) — [game-strings.js:567-584](src/game/game-strings.js#L567-L584), [src/i18n/index.js:7](src/i18n/index.js#L7)
- Il menu ha un pulsante "Comandi" e una nota "Prototipo: negozio, tutorial completo…" — [game-strings.js:27-28](src/game/game-strings.js#L27-L28), [game-view.js:211-215](src/game/game-view.js#L211-L215)

### Inferences
- Il basso a destra è occupato da `.gm-card--looked` (visibile quando si guarda un oggetto e le schede sono attive); il basso a sinistra da `.gm-card--held`; il basso al centro (120 px) dall'allarme. Una legenda dei comandi fissa "alla Cooking Simulator" (tasti contestuali sempre visibili) dovrebbe: spostare la scheda "guardi" (es. sopra la legenda o a metà altezza), oppure mettere la legenda in basso a destra e la scheda più in alto, oppure integrarla nei suggerimenti `.gm-prompt`. Va gestito anche lo schermo stretto (`@media (max-width: 640px)`).
- Oggi i comandi contestuali sono già generati da `prompt()` come righe di testo sotto il mirino: una legenda strutturata (icona del tasto + azione) potrebbe riusare la stessa logica restituendo coppie `{tasto, azione}` invece di HTML.
- Nuove stringhe vanno aggiunte almeno in `it` ed `en` di `game-strings.js` (l'eli6 ricade sull'it).

### Gaps
- Non ho verificato visivamente le sovrapposizioni a varie risoluzioni.

## 7. Test che coprono queste aree

### Takeaway
I test (`npm test` = `node --test "tests/**/*.test.mjs"`) controllano le stringhe (ogni `t('chiave')` di `game.js`,
`game-view.js` e `orders.js` deve esistere in `it` ed `en`), la rottura del vetro, la camminata contro un muro e il
livello del liquido; non c'è nessun test su presa/posa, assistenza al versamento, sgabelli o HUD.

### Cited Findings
- Script dei test — [package.json:21](package.json#L21)
- `strings.test.mjs`: legge `game.js`, `game-view.js`, `orders.js` e cerca `t('chiave'`, `key: 'chiave'` e le chiavi `ev…`; richiede più di 100 chiavi e che ognuna sia in `GAME_STRINGS.it` e `.en` — [strings.test.mjs:11-19](tests/game/strings.test.mjs#L11-L19); secondo test: chiavi composte per esercitazioni, `item_${k}` per ogni `DEFS`, `bin_`, `waste_`, `station_${s.key}` per ogni `STATIONS`, `state_`, `alarm_` — [strings.test.mjs:21-30](tests/game/strings.test.mjs#L21-L30)
- `physics.test.mjs`: becher che cade dal bancone (> 3,3 m/s) e posato (< 3,3 m/s) — [physics.test.mjs:15-35](tests/game/physics.test.mjs#L15-L35); il personaggio (`ph.player({…}, 0.28, 0.55)`) non attraversa un muro — [physics.test.mjs:37-52](tests/game/physics.test.mjs#L37-L52); livello e versamento — [physics.test.mjs:54-74](tests/game/physics.test.mjs#L54-L74); esercitazioni e valutazione — [physics.test.mjs:76-122](tests/game/physics.test.mjs#L76-L122)
- `mixture.test.mjs`: solo chimica dei contenitori (pH, scioglimento, titolazione, reazioni, travasi, rifiuti) — [mixture.test.mjs:5-6](tests/game/mixture.test.mjs#L5-L6), [mixture.test.mjs:19-148](tests/game/mixture.test.mjs#L19-L148)

### Inferences
- Se le nuove stringhe dei comandi si usano con chiavi letterali `t('…')` in `game.js`/`game-view.js`, il test le controlla da solo; se si crea un nuovo modulo (es. `controls.js` o `hud.js`), va aggiunto all'elenco dei file letti in `strings.test.mjs:14`. Una nuova postazione in `STATIONS` richiede la stringa `station_…`.
- Un test di non regressione utile: "dalla posizione di partenza il giocatore esce dal corridoio" (stesso schema di `physics.test.mjs:37-52`, con i collisori degli sgabelli), oggi fallirebbe.

### Gaps
- Nessuno.

## 8. Lacune rispetto alla sensazione di Cooking Simulator (dal codice attuale)

### Takeaway
Il prototipo ha già fisica vera, versamento per inclinazione con livello realistico e posa "dove si guarda", ma manca
di vari elementi di "feel": anteprima di posa, evidenziazione, rotazione dell'oggetto, ritorno dritto, getto continuo,
legenda dei comandi sempre visibile; inoltre gli sgabelli bloccano il giocatore e lo stato `pouring` è inutilizzato.

### Cited Findings
- Nessuna anteprima del punto di appoggio né evidenziazione dell'oggetto puntato: nel codice di `src/game/` e in `game.css` non ci sono outline, highlight o ghost (ricerca testuale); la posa avviene solo al clic con `placeSpot` + `placeItem` (teletrasporto) — [game.js:452-487](src/game/game.js#L452-L487)
- Rotazione dell'oggetto in mano limitata a yaw della camera e inclinazione in avanti (`tilt` ≥ 0): nessun comando per ruotarlo o inclinarlo di lato — [game.js:754-771](src/game/game.js#L754-L771), [game.js:497-501](src/game/game.js#L497-L501)
- `this.pouring` impostato ma mai letto: il versamento dipende solo dall'inclinazione geometrica — [game.js:87](src/game/game.js#L87), [game.js:471](src/game/game.js#L471), [game.js:493-495](src/game/game.js#L493-L495), [game.js:1431](src/game/game.js#L1431)
- L'inclinazione resta dopo il rilascio del tasto destro e lo sguardo è sospeso mentre si inclina — [game.js:497-501](src/game/game.js#L497-L501), [game-view.js:514-516](src/game/game-view.js#L514-L516)
- Sgabelli statici con collisore sovradimensionato che intrappolano il giocatore alla partenza — [room.js:182-187](src/game/room.js#L182-L187)
- Getto dei recipienti fatto di gocce istanziate (al massimo 5 per fotogramma), senza mesh continua né collisioni lungo la traiettoria — [game.js:1011-1018](src/game/game.js#L1011-L1018), [game.js:928-954](src/game/game.js#L928-L954)
- I comandi completi si vedono solo nella finestra di aiuto; a schermo ci sono i suggerimenti contestuali sotto il mirino e la mini-legenda della visuale in alto a destra — [game-view.js:368-377](src/game/game-view.js#L368-L377), [game.js:1482-1512](src/game/game.js#L1482-L1512), [game-strings.js:44-45](src/game/game-strings.js#L44-L45)
- Il README dichiara lo stato di "prototipo giocabile" ispirato a Cooking Simulator e rimanda il tutorial completo alle versioni successive — [README.md:427-436](README.md#L427-L436)

### Inferences
- Interventi e punti del codice: sgabelli → `room.js:182-187` (+ `physics.js:85-97` se spingibili); anteprima di posa → nuova mesh fantasma aggiornata in `update()` usando `placeSpot` (oggi privata del clic) in `game.js`; evidenziazione → `updateHover()` (`game.js:398-424`); rotazione/ritorno dritto → `holdQuat`, `tiltBy`, nuovi comandi in `game-view.js` (`mousedown`/`mouseup`/`wheel`/tasti); versamento a pressione → usare `pouring` in `holdQuat`/`tiltBy` (es. inclinazione che cresce finché il tasto è premuto e torna a 0 al rilascio); getto continuo → `effects.js` + `pourFrom`; legenda comandi → `TEMPLATE`/`renderHud` in `game-view.js`, nuove regole in `game.css` (spostando `.gm-card--looked`), nuove chiavi in `game-strings.js` (it/en), aggiornamento di `helpWalkRows`/`helpBenchRows` e di README/design.

### Gaps
- Questa sezione elenca lacune ricavate dal codice; il confronto con le meccaniche reali di Cooking Simulator è compito di altre note di ricerca.
