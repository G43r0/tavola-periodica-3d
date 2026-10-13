# Tecniche di implementazione: presa fisica, oggetti spingibili e versamento di liquidi (Three.js r186 + Rapier @dimforge/rapier3d-compat 0.19.x)

> Nota metodologica (leggere prima). Da questo ambiente i domini `rapier.rs`, `80.lv`, `wikipedia.org`, `gitea.com` **non erano raggiungibili con fetch diretto**: per quelle pagine ho usato le sintesi del motore di ricerca (che citano il testo delle pagine) e le cito comunque con il loro URL. Per l'API di Rapier ho fatto di meglio: ho scaricato il pacchetto **@dimforge/rapier3d-compat 0.19.3** da npm (la versione usata dal progetto: `package.json` → `"@dimforge/rapier3d-compat": "^0.19.3"`, `"three": "^0.186.1"`), ho letto i file `.d.ts` e ho **eseguito esperimenti in Node** con il WASM vero. Tali risultati sono marcati **[TEST 0.19.3]** e citati con l'URL del pacchetto npm; i numeri sono riproducibili (script in scratchpad, non nel repo). Il codice sorgente di Half-Life 2 (Source SDK 2013) è stato letto direttamente da GitHub.

## 1. Presa fisica ("gravity gun" / pickup alla Half-Life 2, Amnesia, Penumbra, Unity): velocità vs forza (PD) vs giunto vs cinematico; rotazione; anti-jitter; rottura della presa

### Takeaway
Lo standard di fatto (HL2 incluso) è: **l'oggetto tenuto resta un corpo dinamico** e a ogni passo fisico gli si impone una *velocità* (o forza PD) che lo porta verso un punto davanti alla camera, con **limiti di velocità**, **massa ridotta**, **smorzamento alto**, **collisioni col giocatore disattivate** e **rilascio automatico se l'errore di posizione resta troppo grande**. In Rapier 0.19 esiste già un `PidController` integrato che implementa esattamente la variante "correzione di velocità"; un corpo cinematico invece attraversa i muri (verificato: 70 cm di compenetrazione).

### Cited Findings

**Half-Life 2 – `CGrabController` (codice reale, Source SDK 2013, `weapon_physcannon.cpp`)** — tutti da [weapon_physcannon.cpp](https://github.com/ValveSoftware/source-sdk-2013/blob/master/src/game/server/hl2/weapon_physcannon.cpp):
- Usa uno "shadow controller" (motor fisico che insegue una posa bersaglio) con parametri: `dampFactor = 1.0`, `teleportDistance = 0`, `m_shadow.maxSpeed = 1000;`, `maxAngular = DEFAULT_MAX_ANGULAR` dove `DEFAULT_MAX_ANGULAR = 360.0f * 10.0f` (3600 °/s), `m_shadow.maxDampSpeed = m_shadow.maxSpeed*2;`, `maxDampAngular = maxAngular`. Unità Source (≈ pollici).
- La funzione che scalerebbe le velocità per oggetti pesanti (`ComputeMaxSpeed`, con `MASS_SPEED_SCALE` 60 e `MAX_MASS` 40) è **commentata** in `AttachEntity()`: le velocità massime sono quindi fisse.
- **Massa ridotta durante la presa**: salva la massa originale in `m_savedMass[i]` e imposta `pPhys->SetMass( REDUCED_CARRY_MASS );` con `REDUCED_CARRY_MASS = 1.0f` (per oggetti multi-parte `REDUCED_CARRY_MASS / flFactor`, `flFactor = count / 7.5f`, minimo 1). Ripristinata in `DetachEntity()`.
- **Smorzamento alto durante la presa**: `float damping = 10;` applicato con `SetDamping`; lo smorzamento rotazionale originale è salvato in `m_savedRotDamping[i]` e ripristinato al rilascio.
- **Posizione bersaglio**: distanza `24 + (radius * 2.0f)` (+ offset per prop), dove il raggio combina l'ingombro del giocatore e quello dell'oggetto lungo la direzione di vista; il pitch è limitato a −75…+75° (−90…+75 se è permesso il trasporto sopra la testa).
- **Gestione muri**: una traccia (solo geometria "brush") dalla posizione di sparo **accorcia la distanza bersaglio** se c'è un ostacolo (se `fraction < 0.5` la distanza scende a `radius*0.5`). Il bersaglio è anche spinto ad almeno `radius` dall'asse verticale del giocatore.
- **Orientamento**: `TransformAnglesFromPlayerSpace( m_attachedAnglesPlayerSpace, pPlayer )` → l'orientamento dell'oggetto è memorizzato **nello spazio del giocatore** al momento della presa e quindi ruota con lo yaw del giocatore; alcuni prop hanno "preferred carry angles". Comando finale: `SetTargetPosition( end - offset, angles );`.
- **Rottura della presa**: `ComputeError()` misura la distanza tra bersaglio e posizione reale e la mescola in `m_error` (dimezzata se la velocità implicita supera `maxSpeed`); soglia `float flError = IsMegaPhysCannon() ? 18 : 12;` → l'oggetto viene rilasciato se `ComputeError() > flError`. L'accumulo dell'errore parte dopo un ritardo: `m_errorTime = bIsMegaPhysCannon ? -1.5f : -1.0f;` (≈1 s di tolleranza dopo la presa).
- **Contatto e coppia**: in contatto pesante la velocità angolare massima è ridotta cubicamente: `shadowParams.maxAngular = m_shadow.maxAngular * m_contactAmount * m_contactAmount * m_contactAmount;`.
- **Anti "surf" sul proprio oggetto**: l'oggetto viene rilasciato se il giocatore ci sta sopra (`pPlayer->GetGroundEntity() == pEntity`) e non si può raccogliere l'entità su cui si sta in piedi. Nella mega-gravity-gun il rilascio avviene anche se ci si gira troppo (`if ( flDot <= 0.35f )`).
- Limite di massa per la raccolta tramite ConVar `physcannon_maxmass` (`CBasePlayer::CanPickupObject( pTarget, physcannon_maxmass.GetFloat(), 0 )`); esiste anche `#define PHYSCANNON_MAX_MASS 500` non usato nel controllo.

**Esperienza comunitaria (Unity/Steam)**:
- Impostare direttamente la velocità ignora massa e gravità ma interagisce molto meglio con gli altri rigidbody rispetto al riposizionamento; `MovePosition()` dà interazioni "a scatti"; con il metodo a velocità si riesce a trasportare una pila di scatole — [Steam SteamVR dev thread](https://steamcommunity.com/app/358720/discussions/1/451850213950999945) (via sintesi di ricerca).
- Scrivere direttamente transform/posizione è considerato il metodo peggiore; `MovePosition` non è bloccato dalle collisioni; consigliati forze/velocità; disattivare la gravità dell'oggetto tenuto e smorzarne la velocità; a volte si disattiva la collisione oggetto-giocatore per evitare che l'oggetto spinga il personaggio — [Unity: carry rigidbodies without jumpy](https://discussions.unity.com/t/how-can-you-carry-rigidbodies-without-them-appearing-jumpy/68937), [Unity: gravity gun object through wall](https://discussions.unity.com/t/how-to-make-an-object-your-carrying-with-your-gravity-gun-not-pass-through-a-wall/121108), [Unity: Portal-style holding](https://discussions.unity.com/t/solved-picking-up-holding-objects-portal-style/202522).
- Variante a forza: calcolare l'offset desiderato e applicare una forza (modalità "velocity change") con smorzamento sulla velocità corrente; resta un po' indietro, compensabile aggiungendo la velocità del punto di presa (feed-forward) — sintesi di ricerca su thread Unity (attribuzione al singolo thread non verificata): [Unity forum FPS grab/drop](https://discussions.unity.com/t/i-want-to-make-a-fps-object-grab-drop-system-but-i-dont-know-how-can-i-do-it-properly/1508386), [Unity: carry rigidbodies without jumpy](https://discussions.unity.com/t/how-can-you-carry-rigidbodies-without-them-appearing-jumpy/68937).
- Unity `Rigidbody2D.MoveRotation` calcola "la velocità angolare necessaria per ruotare il corpo all'angolo specificato durante il prossimo update fisico" ed è raccomandato solo per piccole rotazioni — [Unity docs MoveRotation](https://docs.unity3d.com/ja/2022.3/ScriptReference/Rigidbody2D.MoveRotation.html) (stesso principio della conversione errore-quaternione → velocità angolare).
- "Stable PD controllers" (Tan, Liu, Turk) permettono guadagni arbitrariamente alti anche con passi grandi e integrazione di Eulero semplice — [IEEE Xplore 5719567](https://ieeexplore.ieee.org/document/5719567/) (abstract; formule non verificate).

**Rapier 0.19.3 – API rilevanti (nomi esatti dai `.d.ts` del pacchetto)** — [npm @dimforge/rapier3d-compat 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3), [World API](https://rapier.rs/javascript3d/classes/World.html), [RigidBody API](https://rapier.rs/javascript3d/classes/RigidBody.html):
- `world.createPidController(kp, ki, kd, axes: PidAxesMask)`; `PidAxesMask.{LinX, LinY, LinZ, AngX, AngY, AngZ, AllLin=7, AllAng=56, All=63}`; metodi `setKp/setKi/setKd(value, axes)`, `resetIntegrals()`, `applyLinearCorrection(body, targetPosition, targetLinvel)`, `applyAngularCorrection(body, targetRotation, targetAngVel)`, `linearCorrection(...)`, `angularCorrection(...)` (restituiscono il vettore senza applicarlo). Doc nel `.d.ts`: *kp "di solito un multiplo dell'inverso del passo (es. 60 se dt = 1/60)"; kd "di solito in [0,1], dove 0 = nessuno smorzamento e 1 = errori di velocità corretti in un solo passo"*. Introdotto in rapier.js **0.15.0** — [CHANGELOG rapier.js](https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md).
- **[TEST 0.19.3]** Semantica verificata: `linearCorrection = kp·(target − pos) + kd·(targetVel − linvel)` (es. kp=60, errore (1, 0.5, 0) → (60, 30, 0); con linvel 5 e kd=1 → −5) e `applyLinearCorrection` **somma** la correzione alla velocità lineare (5 + (−5) = 0). Con kp=60, kd=1 un cubo da 1 kg sotto gravità raggiunge il bersaglio (errore residuo 2 mm per gravità, ki=0) e l'orientamento bersaglio (90° yaw) in 0,5 s — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- **[TEST 0.19.3] Oggetto tenuto spinto contro un muro** (bersaglio 60 cm dentro il muro, cubo 20 cm da 1 kg, 2 s a 60 Hz, CCD attivo): velocità diretta `v = 20·err` con clamp 10 m/s → compenetrazione max **3,3 cm**, a regime 1,5 cm; `PidController(kp=30, kd=0.8)` → max **2,9 cm**; forza PD `F = m(400·err − 40·v) + m·g` → max **5,3 cm**; **corpo `kinematicPositionBased`** → **70 cm, attraversa il muro**. — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- Firme RigidBody 0.19.3 (il parametro `wakeUp` è obbligatorio): `setLinvel(vel, wakeUp)`, `setAngvel(vel, wakeUp)`, `setGravityScale(factor, wakeUp)`, `addForce(force, wakeUp)`, `applyImpulse(impulse, wakeUp)`, `addTorque`, `applyTorqueImpulse`, `resetForces(wakeUp)`, `setLinearDamping(f)`, `setAngularDamping(f)`, `setAdditionalMass(mass, wakeUp)`, `setAdditionalMassProperties(mass, centerOfMass, principalAngularInertia, angularInertiaLocalFrame, wakeUp)`, `setEnabledRotations(x, y, z, wakeUp)`, `lockRotations(locked, wakeUp)`, `setDominanceGroup(group)`, `setAdditionalSolverIterations(iters)`, `enableCcd(enabled)`, `setSoftCcdPrediction(distance)`, `velocityAtPoint(point)`, `setBodyType(type, wakeUp)`, `setNextKinematicTranslation/Rotation` — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3), [RigidBody API](https://rapier.rs/javascript3d/classes/RigidBody.html).
- Default **[TEST 0.19.3]**: `linearDamping = angularDamping = 0`, CCD disattivato, `softCcdPrediction = 0`, `dominanceGroup = 0`, `world.timestep = 1/60`, `numSolverIterations = 4`, `numInternalPgsIterations = 1`, `maxCcdSubsteps = 1` — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- Soft-CCD (doc `.d.ts`): "aiuta a prevenire il tunneling soprattutto di oggetti lenti-ma-sottili o moderatamente veloci… variante generalmente più economica del CCD regolare perché usa vincoli predittivi invece di shape-cast e substep"; valori grandi pesano sul broad-phase. `maxCcdSubsteps` > 1 = traiettorie più lisce ma costo significativo; 0 disattiva il CCD. `numInternalPgsIterations` migliora la stabilità con costo minore di `numSolverIterations` — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3); soft-CCD, contact skin e `lengthUnit` aggiunti in 0.13.0 — [CHANGELOG](https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md).
- **Giunti in JS 0.19.3**: `JointData.fixed(anchor1, frame1, anchor2, frame2)`, `spherical`, `revolute`, `prismatic`, `rope(length, a1, a2)`, **`spring(rest_length, stiffness, damping, anchor1, anchor2)`**, `generic(anchor1, anchor2, axis, axesMask: JointAxesMask)`; `world.createImpulseJoint(params, parent1, parent2, wakeUp)`; motori **solo sui giunti a 1 asse** (`UnitImpulseJoint`: revolute/prismatic): `configureMotorModel(MotorModel.AccelerationBased | ForceBased)`, `configureMotorVelocity(targetVel, factor)`, `configureMotorPosition(targetPos, stiffness, damping)`, `configureMotor(targetPos, targetVel, stiffness, damping)`, `setLimits`, `setContactsEnabled` — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- **Gruppi di collisione**: `InteractionGroups` è un intero a 32 bit: 16 bit alti = appartenenza, 16 bassi = filtro; interazione se `((a >> 16) & b) != 0 && ((b >> 16) & a) != 0`. `Collider.setCollisionGroups()` (nessun contatto) vs `setSolverGroups()` (contatto rilevato ma senza forze). Hook: `ActiveHooks.FILTER_CONTACT_PAIRS` + `PhysicsHooks.filterContactPair(c1, c2, b1, b2) → SolverFlags | null`, passato a `world.step(eventQueue, hooks)` — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- **[TEST 0.19.3] Il personaggio è frenato dal proprio oggetto tenuto**: capsula KCC che cammina a 3 m/s con un cubo tenuto 45 cm davanti: senza escludere il collider dell'oggetto percorre 5,09 m in 2 s; passando a `computeColliderMovement` un `filterPredicate` che esclude il collider tenuto percorre 5,99 m (ideale 6,0) — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- Rimossi in 0.19.0 i metodi del vecchio solver PGS (es. `World.numAdditionalFrictionIterations`); su npm esistono già 0.20.0 e 0.21.0 — [CHANGELOG](https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md), [npm](https://www.npmjs.com/package/@dimforge/rapier3d-compat).
- Three.js r186 `Quaternion` ha `angleTo(q)`, `rotateTowards(q, step)`, `slerp(qb, t)`, `invert()`, `conjugate()`, `premultiply(q)`, `setFromUnitVectors(a, b)` — [three.js r186 Quaternion.js](https://github.com/mrdoob/three.js/blob/r186/src/math/Quaternion.js) (verificato nel pacchetto npm three@0.186.1).

### Inferences

**Confronto dei quattro metodi (sintesi mia basata su fonti + test):**

| Metodo | Pro | Contro | Quando |
|---|---|---|---|
| **Velocità diretta** (`setLinvel`/`setAngvel` verso il bersaglio, clamp) o **`PidController`** Rapier | Stabile, indipendente dalla massa, si ferma sui muri (test: 1,5–3 cm), semplice | Ignora la massa (oggetti pesanti "leggeri"); va disattivata la gravità o compensata | **Scelta consigliata** per un sim di cucina/laboratorio |
| **Forza PD** (`addForce` con `kp`, `kd`) | Sente la massa, risposta "morbida" | Con Eulero esplicito instabile se `kp·dt²` grande; più compenetrazione (5 cm) | Se si vuole che le cose pesanti oscillino/ritardino |
| **Giunto** (`JointData.spring` tra un corpo cinematico "mano" e l'oggetto) | Gestito dal solver insieme ai contatti | In JS lo spring è **solo distanza** (rotazione libera, l'oggetto penzola); motori solo su giunti a 1 asse → niente "mouse joint" 6-DOF morbido; giunto fisso = rigido e combatte i contatti | Per oggetti appesi/trascinati (es. tirare un cassetto) |
| **Cinematico** (`kinematicPositionBased`) | Zero jitter, posa esatta | Massa infinita: attraversa i muri (test 70 cm), scaraventa tutto | Solo per animazioni scriptate o se si fa da sé lo shape-cast |

**Ricetta consigliata (velocità + PD integrato), parametri iniziali** (inferenza, da tarare):
- Distanza di presa 0,6–1,0 m davanti alla camera (HL2: 24 unità + 2·raggio ≈ 0,6 m + 2r). Limita il pitch a ±75° come HL2.
- Tempo di convergenza ≈ 1/kp: `kp ≈ 10–20 s⁻¹` (50–100 ms) dà presa "fisica ma reattiva"; `kp = 60` (= 1/dt) è *deadbeat* (rigido come cinematico). `kd ≈ 0.6–0.9`. Clamp velocità lineare 6–10 m/s, angolare ~10–20 rad/s (HL2 usa 3600 °/s ≈ 63 rad/s ma con massa 1 kg).
- Durante la presa: `setGravityScale(0)`, smorzamento lineare/angolare alto (HL2: 10), massa ridotta (HL2: 1 kg) con `collider.setMass(1)` o ripristino al rilascio, `enableCcd(true)` o `setSoftCcdPrediction(0.1–0.2)` per oggetti sottili (vetreria).
- **Accorcia il bersaglio con uno shape-cast** dalla camera lungo la vista con la forma dell'oggetto (come la traccia di HL2): `world.castShape(camPos, rot, dir, shape, 0.0, holdDist, true, undefined, groups, heldCollider, heldBody)`; se colpisce, distanza = `hit.time_of_impact − margine`. Evita la spinta continua nel muro (che nei test lascia 1,5 cm di compenetrazione e jitter).
- **Non spingere il giocatore**: (1) collision group dell'oggetto tenuto che esclude il gruppo "player" (ripristinare al rilascio, ma solo quando non c'è più sovrapposizione, altrimenti il solver lo espelle violentemente); (2) `filterPredicate` del KCC che esclude il collider tenuto (test: altrimenti il giocatore è rallentato del 15%); (3) rilascio se il giocatore ci sta sopra (HL2).
- **Rottura della presa**: errore filtrato `e ← lerp(e, |target − pos|, 0.2)`, grazia di ~0,5–1 s dopo la presa (HL2: 1 s), rilascio se `e > 0,3–0,45 m` (HL2: 12–18 unità ≈ 0,3–0,45 m) o se l'angolo tra vista e direzione dell'oggetto supera ~70° (HL2 mega: dot ≤ 0,35).
- **Lancio**: al rilascio limitare la velocità (es. ≤ 8 m/s) per evitare proiettili involontari; azzerare `angvel` se l'oggetto è fragile.
- **Jitter visivo**: passo fisso 1/60 con accumulatore e interpolazione della mesh tra stato precedente e attuale; aggiornare il bersaglio dalla camera *nello stesso passo fisico*, non nel frame di render.

**Rotazione (errore di quaternione → asse-angolo → velocità angolare):**
```js
// THREE r186 + Rapier 0.19.3 — dentro il passo fisico (dt = world.timestep)
const qCur = new THREE.Quaternion(), qErr = new THREE.Quaternion(), axis = new THREE.Vector3();
function driveHeld(body, targetPos, targetQuat, camVel, dt) {
  const p = body.translation();
  // lineare: v = feedforward + kp*errore, clamp
  const kp = 15, vmax = 8;
  let vx = camVel.x + kp*(targetPos.x - p.x), vy = camVel.y + kp*(targetPos.y - p.y), vz = camVel.z + kp*(targetPos.z - p.z);
  const n = Math.hypot(vx, vy, vz); if (n > vmax) { const s = vmax/n; vx*=s; vy*=s; vz*=s; }
  body.setLinvel({x:vx, y:vy, z:vz}, true);
  // angolare: qErr = qTarget * conj(qCur), percorso breve
  const r = body.rotation(); qCur.set(r.x, r.y, r.z, r.w);
  qErr.copy(targetQuat).multiply(qCur.invert());           // invert() = coniugato per quaternioni unitari
  if (qErr.w < 0) qErr.set(-qErr.x, -qErr.y, -qErr.z, -qErr.w);
  const angle = 2*Math.acos(Math.min(1, qErr.w));
  const s = Math.sqrt(1 - qErr.w*qErr.w);
  if (s < 1e-5) { body.setAngvel({x:0,y:0,z:0}, true); return; }
  axis.set(qErr.x/s, qErr.y/s, qErr.z/s);
  const kr = 12, wmax = 15;                                 // rad/s
  const w = Math.min(kr*angle, wmax);
  body.setAngvel({x:axis.x*w, y:axis.y*w, z:axis.z*w}, true);
}
// Alternativa nativa: const pid = world.createPidController(15, 0, 0.8, RAPIER.PidAxesMask.All);
// pid.applyLinearCorrection(body, targetPos, camVel); pid.applyAngularCorrection(body, targetQuat, {x:0,y:0,z:0});
// (nessun clamp integrato: usare linearCorrection(), limitare e poi setLinvel(linvel + corr)).
```
- Memorizzare l'orientamento relativo alla camera al momento della presa (`qRel = conj(qCamYaw) * qBody`, come `m_attachedAnglesPlayerSpace` di HL2) e ricostruire ogni passo `targetQuat = qCamYaw * qRel`: l'oggetto ruota con il giocatore ma non si inclina col pitch.
- Modalità "ruota" (tasto tenuto): congelare la camera e applicare il delta del mouse come rotazioni attorno agli assi up/right della camera a `qRel` (pattern comune nei sim; nessuna fonte primaria recuperata, vedi Gaps).

### Gaps
- Non ho potuto leggere i sorgenti/talk di Amnesia/Penumbra (Frictional Games) né del "physics pickup" di Unity ufficiale: non ho parametri primari da loro.
- La conversione unità Source → metri (≈ 1 pollice) è approssimata; non verificata su fonte Valve in questa sessione.
- Il paper "Stable PD controllers" non è stato letto per intero; la regola di smorzamento critico `kd = 2·sqrt(kp·m)` è conoscenza standard di controllo, non verificata su una fonte recuperata.
- Non esiste in rapier.js 0.19 un "mouse joint"/giunto 6-DOF con motori morbidi per asse (solo motori su giunti a 1 asse): dedotto dai `.d.ts`; non ho trovato discussioni ufficiali che lo confermino o propongano alternative.
- La pagina guida JS dei giunti/corpi rigidi di rapier.rs non era raggiungibile: le firme vengono dai `.d.ts` 0.19.3, che sono la fonte più affidabile per quella versione.

## 2. Posizionamento: anteprima "fantasma" con raycast/shape-cast, allineamento alla normale, raddrizzamento, controlli di validità

### Takeaway
Pipeline comune: raggio dalla camera → punto e normale → posa candidata (raddrizzata o allineata alla normale) → **shape-cast verso il basso** con la forma reale per trovare l'altezza di appoggio → **query di sovrapposizione** che esclude l'oggetto stesso → fantasma verde/rosso. In Rapier 0.19.3 servono `castRayAndGetNormal`, `castShape` e `intersectionsWithShape`; attenzione: `castShape` restituisce `witness1/normal1` in **spazio mondo** anche se il commento del `.d.ts` dice "local-space".

### Cited Findings
- Pattern dei sistemi di costruzione: la normale del punto colpito indica la faccia mirata e serve a calcolare la posa del nuovo oggetto — [Roblox DevForum grid placement](https://devforum.roblox.com/t/grid-placement-system/1422189); un'anteprima si orienta secondo la normale della superficie nel punto colpito — [Meta IWSDK environment raycast](https://developers.meta.com/horizon/documentation/web/iwsdk-guide-environment-raycast/).
- Controllo "a terra" con raggio corto verso il basso dal fantasma, poi query di sovrapposizione del volume **escludendo il fantasma e il personaggio** — [Roblox DevForum: visual part clipping](https://devforum.roblox.com/t/visual-part-for-building-system-clipping-underground-please-help/3923625); Meta MR Utility Kit separa il posizionamento allineato a superfici piane da un controllo di sovrapposizione che rifiuta le collocazioni compenetranti — [Meta MRUK environment raycast](https://prod.developers.meta.com/horizon/documentation/unity/unity-mr-utility-kit-environment-raycast).
- Insidie note: posizionare dal centro fa sprofondare i modelli grandi; un raggio che sfiora i bordi mette il fantasma sopra l'oggetto; un singolo punto non vede sovrapposizioni lungo i bordi — [Roblox: clipping underground](https://devforum.roblox.com/t/placement-system-visual-block-clipping-through-the-ground/3923833), [Unity: raycast question](https://discussions.unity.com/t/raycast-question-421764/421764).
- Firme Rapier 0.19.3: `castRay(ray, maxToi, solid, filterFlags?, filterGroups?, filterExcludeCollider?, filterExcludeRigidBody?, filterPredicate?)`, `castRayAndGetNormal(...)` (stessi parametri), `castShape(shapePos, shapeRot, shapeVel, shape, targetDistance, maxToi, stopAtPenetration, filterFlags?, filterGroups?, filterExcludeCollider?, filterExcludeRigidBody?, filterPredicate?) → ColliderShapeCastHit | null`, `intersectionsWithShape(shapePos, shapeRot, shape, callback, ...filtri)`, `projectPoint(...)` — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3), [World API](https://rapier.rs/javascript3d/classes/World.html). `targetDistance` aggiunto in 0.13.0 — [CHANGELOG](https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md).
- **[TEST 0.19.3]** Sfera r=0,25 lanciata lungo +X contro un cubo ruotato di 45° (spigolo a x=3,586): `time_of_impact = 3,336`, `witness1 = (3,586, 0, 0)` e `normal1 = (−1, 0, 0)` **in coordinate mondo**; `witness2 = (0,25, 0, 0)` e `normal2` nello spazio locale della forma lanciata. `castRayAndGetNormal` restituisce `timeOfImpact = 3,586` e normale mondo (−1,0,0) — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- **Incoerenza di nomi**: il CHANGELOG 0.13.0 dice "Rename `ShapeCastHit.toi` to `.timeOfImpact`", ma nei `.d.ts` di 0.19.3 il campo di `ShapeCastHit` è `time_of_impact` (funzionante nel test), mentre `RayColliderHit` usa `timeOfImpact` — [CHANGELOG](https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md), [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- **Commenti scambiati nei `.d.ts`**: in `QueryFilterFlags`, il commento di `EXCLUDE_KINEMATIC = 2` dice "dynamic" e quello di `EXCLUDE_DYNAMIC = 4` dice "kinematic"; fidarsi dei nomi. Altri flag: `EXCLUDE_FIXED = 1`, `EXCLUDE_SENSORS = 8`, `EXCLUDE_SOLIDS = 16` — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- Three.js r186 include `DecalGeometry(mesh, position, orientation: Euler, size: Vector3)` in `examples/jsm/geometries/` (utile anche per marcatori di posizionamento a terra) — [three.js r186 DecalGeometry.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/geometries/DecalGeometry.js).

### Inferences
Algoritmo consigliato (per oggetto tenuto, ogni frame mentre si tiene premuto "posiziona" o sempre mentre si mira una superficie):
```js
// 1) raggio dalla camera escludendo l'oggetto tenuto
const ray = new RAPIER.Ray(camPos, camDir);
const hit = world.castRayAndGetNormal(ray, 2.5, true, undefined, GROUP_PLACE_QUERY, undefined, heldBody);
if (!hit) return ghost.hide();
const P = ray.pointAt(hit.timeOfImpact), N = hit.normal;           // mondo
// 2) solo superfici "pavimento/piano": angolo con +Y < 20-30°
const isFloor = N.y > Math.cos(THREE.MathUtils.degToRad(25));
// 3) orientamento: upright con yaw della camera (oppure allineato alla normale: qAlign = setFromUnitVectors(UP, N) * qYaw)
const qYaw = new THREE.Quaternion().setFromAxisAngle(UP, camYaw + userYawOffset);
// 4) altezza d'appoggio: shape-cast della forma vera dall'alto verso il basso
const start = {x:P.x, y:P.y + 0.5, z:P.z};
const sh = world.castShape(start, qYaw, {x:0,y:-1,z:0}, heldShape, 0.002, 1.0, false,
                           undefined, GROUP_PLACE_QUERY, heldCollider, heldBody);
const restY = sh ? start.y - sh.time_of_impact : P.y + halfHeight;
// 5) validità: niente sovrapposizioni con forma leggermente ridotta (es. 95%) + supporto sotto il baricentro
let blocked = false;
world.intersectionsWithShape({x:P.x, y:restY + 0.003, z:P.z}, qYaw, heldShapeShrunk, c => { blocked = true; return false; },
                             undefined, GROUP_PLACE_QUERY, heldCollider, heldBody);
const valid = isFloor && !blocked && sh !== null;
ghost.material.color.set(valid ? 0x44ff88 : 0xff4444);
```
- **Raddrizzamento ("upright snapping")**: se l'asse up dell'oggetto è entro ~15–20° dalla verticale mondo, mostrare il fantasma dritto; per oggetti "contenitore" (becher, bottiglie) forzare sempre dritto, altrimenti si rovescia il contenuto.
- **Esecuzione**: invece di teletrasportare (`setTranslation`+`setRotation`+azzerare velocità), si può far guidare l'oggetto dal controller di presa fino alla posa fantasma e rilasciarlo quando l'errore < 1 cm/2°: niente compenetrazioni improvvise. Per il teletrasporto, sollevare di 2–5 mm per evitare espulsioni dal solver.
- Fantasma = clone della mesh con `MeshBasicMaterial({transparent:true, opacity:0.35, depthWrite:false})`; nessun collider.

### Gaps
- Non ho trovato descrizioni tecniche primarie di House Flipper o PowerWash Simulator sul loro sistema di posizionamento; le fonti sono thread di forum/SDK generici.

## 3. Personaggio Rapier (KinematicCharacterController) e oggetti spingibili (sedie)

### Takeaway
Di default il KCC **non spinge** i corpi dinamici (l'`offset` impedisce contatti veri) ed è bloccato: bisogna chiamare `setApplyImpulsesToDynamicBodies(true)` e impostare una **massa del personaggio realistica** con `setCharacterMass(80)`, perché senza di essa Rapier usa la massa del corpo cinematico (0,4 kg per una capsula a densità 1). La sedia va fatta dinamica, leggera, con smorzamento e **rotazioni limitate al solo yaw** (`enabledRotations(false, true, false)`), e l'autostep va configurato con `includeDynamicBodies = false` per non "salire" sulle sedie.

### Cited Findings
- Il KCC è basato su "move-and-slide": si ferma sugli ostacoli, scivola sui pendii dolci, sale scale, scavalca piccoli ostacoli e cavalca piattaforme mobili; la gravità **non è integrata**: va aggiunta una componente verso il basso al vettore di movimento ogni frame — [Rapier JS character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/) (sintesi di ricerca), [sorgente mdx della guida](https://github.com/dimforge/rapier.rs/blob/master/docs/user_guides/templates/character_controller.mdx).
- **Offset**: piccolo margine mantenuto tra forma del personaggio e ambiente per stabilità numerica; non deve essere zero; sconsigliato cambiarlo dopo la creazione — [Rapier JS character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/), [npm 0.19.3 `.d.ts`](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- **Autostep**: si attiva solo se il personaggio toccava il pavimento subito prima dell'ostacolo (evita teletrasporti in aria); esempio JS `enableAutostep(0.5, 0.2, true)`, `disableAutostep()`; **snap-to-ground**: esempio `enableSnapToGround(0.5)` per scendere scale/pendii — [Rapier JS stairs](https://rapier.rs/docs/user_guides/javascript/character_controller_stairs/), [Rapier JS character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/).
- **Interazione con corpi dinamici**: i corpi dinamici colpiti durante la risoluzione del movimento "generalmente non reagiscono (non vengono spinti) perché l'offset del controller impedisce contatti veri"; la guida suggerisce di applicare forze manualmente — [Rapier character controller collisions](https://rapier.rs/docs/user_guides/javascript/character_controller_collisions/) (via sintesi di ricerca); in Rust esiste `solve_character_collision_impulses(...)` — [Rapier Rust collisions](https://rapier.rs/docs/user_guides/rust/character_controller_collisions/).
- **API JS 0.19.3 esatte** (`KinematicCharacterController`): `world.createCharacterController(offset)`, `removeCharacterController(c)`, `setUp(v)`, `setApplyImpulsesToDynamicBodies(bool)`, `applyImpulsesToDynamicBodies()`, `setCharacterMass(mass | null)` (*"se non impostata è uguale alla massa del rigid-body a cui è attaccato il collider del personaggio, o 0 se non attaccato"*), `setOffset`, `setNormalNudgeFactor`, `setSlideEnabled`, `enableAutostep(maxHeight, minWidth, includeDynamicBodies)`, `disableAutostep`, `setMaxSlopeClimbAngle(rad)`, `setMinSlopeSlideAngle(rad)`, `enableSnapToGround(distance)`, `disableSnapToGround`, `computeColliderMovement(collider, desiredTranslationDelta, filterFlags?, filterGroups?, filterPredicate?)`, `computedMovement()`, `computedGrounded()`, `numComputedCollisions()`, `computedCollision(i, out?) → CharacterCollision {collider, translationDeltaApplied, translationDeltaRemaining, toi, witness1, witness2, normal1 (mondo), normal2 (locale)}` — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3), [KCC API (2D, stessa interfaccia)](https://rapier.rs/javascript2d/classes/KinematicCharacterController.html). `normalNudgeFactor` aggiunto in 0.13.0 — [CHANGELOG](https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md).
- **Default [TEST 0.19.3]**: `applyImpulsesToDynamicBodies() = false`, `characterMass() = null`, `offset` come passato (0,01), `normalNudgeFactor = 1e-4`, `slideEnabled = true`, `maxSlopeClimbAngle = minSlopeSlideAngle = 45°`, autostep e snap disattivati. Una capsula (r 0,3, semi-altezza 0,5) su corpo `kinematicPositionBased` con densità di default 1 ha massa **0,396 kg** — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3). (Nota: un wrapper di terze parti, Orillusion, documenta default `true` per l'equivalente — [Orillusion CharacterController](https://www.orillusion.com/physics-rapier/classes/CharacterController.html); in rapier.js 0.19.3 il default è `false`.)
- **[TEST 0.19.3] Spingere una sedia** (cuboide 0,5×0,9×0,5 m, attrito 0,5, `linearDamping 2`, `angularDamping 4`, giocatore che avanza a 3 m/s per 2 s; partenza giocatore x=0, sedia x=1,2):
  - `applyImpulses=false`: giocatore **bloccato** a x=0,64, sedia ferma (263 collisioni registrate).
  - `applyImpulses=true`, massa personaggio non impostata, sedia 5 kg: giocatore 2,74 m, sedia spinta a 3,33 m, inclinazione ≈ 4,4°.
  - `applyImpulses=true`, `setCharacterMass(80)`, sedia 5 kg: giocatore 3,60 m, sedia 4,19 m.
  - `+ enabledRotations(false,true,false)`: giocatore 3,30 m, sedia 3,89 m, **rotazione nulla** (solo yaw consentito).
  - Stessa configurazione con sedia **50 kg**: risultato quasi identico (3,30 / 3,88 m) → l'impulso integrato rende poco percepibile la massa del prop.
  — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).
- **Corpi rigidi** (guida JS): smorzamento lineare/angolare default 0, valori maggiori = rallentamento più forte; `lockRotations()` o `enabledRotations(x, y, z)` sul descrittore, `setEnabledRotations` dopo la creazione; `setAdditionalMass(m)` scala automaticamente l'inerzia; `setAdditionalMassProperties(mass, centerOfMass, principalAngularInertia, frame)` per controllare il baricentro ("il centro di massa determina rispetto a quali punti si applicano le coppie"); se ci sono collider, i loro contributi si sommano (per avere proprietà finali esatte usare collider a densità 0) — [Rapier JS rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/), [Rapier collider mass properties](https://rapier.rs/docs/user_guides/javascript/collider_mass_properties/), [RigidBodyDesc API](https://rapier.rs/javascript3d/classes/RigidBodyDesc.html).
- Pattern generico (Godot, non Rapier): dopo il movimento iterare sulle collisioni e applicare ai rigidbody un impulso opposto alla normale; questo non forza i corpi attraverso i muri — [KidsCanCode: kinematic to rigidbody](https://kidscancode.org/godot_recipes/3.x/physics/kinematic_to_rigidbody/).

### Inferences
Configurazione consigliata (valori iniziali da tarare):
```js
// Giocatore
const playerBody = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.9, 0));
const playerCol  = world.createCollider(RAPIER.ColliderDesc.capsule(0.55, 0.3)
                     .setCollisionGroups(groups(G.PLAYER, G.ALL & ~G.HELD)), playerBody);
const kcc = world.createCharacterController(0.01);           // 1 cm
kcc.setUp({x:0, y:1, z:0});
kcc.setMaxSlopeClimbAngle(THREE.MathUtils.degToRad(45));
kcc.setMinSlopeSlideAngle(THREE.MathUtils.degToRad(30));
kcc.enableAutostep(0.25, 0.15, false);                       // NON salire su sedie/props dinamici
kcc.enableSnapToGround(0.3);
kcc.setApplyImpulsesToDynamicBodies(true);
kcc.setCharacterMass(80);                                     // altrimenti ~0,4 kg!

// ogni passo fisico
const excludeHeld = c => c.handle !== heldCollider?.handle;  // non urtare l'oggetto tenuto
kcc.computeColliderMovement(playerCol, desiredDelta, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, undefined, excludeHeld);
const m = kcc.computedMovement(); const t = playerBody.translation();
playerBody.setNextKinematicTranslation({x:t.x+m.x, y:t.y+m.y, z:t.z+m.z});
vy = kcc.computedGrounded() ? 0 : vy - 9.81*dt;              // gravità a mano

// Sedia "spingibile"
const chair = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(x, 0.45, z).setLinearDamping(2.0).setAngularDamping(4.0)
  .enabledRotations(false, true, false)                       // solo yaw: non si ribalta mai
  .setCanSleep(true));
world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.45, 0.25).setMass(6).setFriction(0.5), chair);
```
- `groups(member, filter) = (member << 16) | filter` (16 bit ciascuno).
- **Alternativa realistica (può ribaltarsi ma con fatica)**: lasciare tutte le rotazioni ma abbassare il baricentro: collider a densità 0 + `setAdditionalMassProperties(6, {x:0, y:-0.3, z:0}, inerzia, qIdentity, true)`, `angularDamping 3–5`.
- **Peso percepito**: dato che l'impulso integrato rende quasi uguali sedia da 5 e da 50 kg (test), (a) i mobili che non devono muoversi (tavoli, banconi, frigo) vanno fatti `fixed`, non dinamici pesanti (il `filterPredicate` del KCC non serve a questo: esclude un collider dal movimento, cioè lo rende attraversabile); (b) se si vogliono props dinamici di peso diverso, disattivare `setApplyImpulsesToDynamicBodies` e applicare impulsi propri leggendo `computedCollision(i)`: impulso lungo `−normal1` pari a circa `m_char·(v_des·n)·m_prop/(m_char+m_prop)`, con un clamp `Jmax`, e ridurre la velocità del giocatore di un fattore `m_char/(m_char+m_prop)` per far "sentire" il peso.
- `computedCollision(i).collider.parent()` permette di riconoscere la sedia e riprodurre un suono di strisciamento proporzionale alla sua velocità.
- Velocità del giocatore durante la spinta: nei test cala al ~55% (3,3 m vs 6 m in 2 s) — accettabile e "credibile"; con `linearDamping` minore la sedia scivola più lontano.

### Gaps
- Non ho potuto leggere la pagina JS "character controller collisions" completa né l'algoritmo esatto di calcolo degli impulsi in rapier.js 0.19 (il codice è WASM/minificato); il comportamento "massa del prop poco influente" è osservato empiricamente, non spiegato da documentazione.
- Il default dell'esempio ufficiale `enableAutostep(0.5, 0.2, true)` include i corpi dinamici: per un sim con sedie conviene `false` (inferenza mia).

## 4. Liquidi e versamento nei giochi: shader di livello, wobble, flusso, getto, schizzi/pozze, SPH; come fanno Job Simulator, Half-Life: Alyx, ecc.

### Takeaway
Quasi tutti i giochi **fingono** i liquidi: il contenuto è un **numero (volume)** + uno **shader** che taglia la mesh a un piano orizzontale in spazio mondo con un'oscillazione a molla smorzata ("wobble" alla Minions Art); il versamento parte quando il livello supera il bordo inclinato e il getto è una **linea/tubo lungo una traiettoria balistica** con particelle e decal all'impatto. Half-Life: Alyx usa solo uno shader sulla superficie della bottiglia; Job Simulator ha richiesto ~500 ore di un solo sviluppatore per i sottosistemi liquidi. SPH/particellari (Obi, FleX) sono costosi e difficili da contabilizzare.

### Cited Findings
**Shader "fake liquid" di Minions Art (Unity, il più copiato):**
- Uno script stima il movimento dell'oggetto da velocità e velocità angolare, che pilotano il wobble nello shader; la posizione del riempimento è calcolata dal **centro dei bounds della mesh** (non dal pivot); l'aggiornamento 2022 è passato a un'onda **sinusoidale** per la distorsione — [Patreon Minions Art 18245226](https://www.patreon.com/posts/18245226).
- Setup: materiale vetro sul genitore, materiale liquido su un contenitore figlio **leggermente rimpicciolito**; lo script gira in edit mode per regolare il fill — [Patreon 18245226](https://www.patreon.com/posts/18245226).
- Tecnica originale 2018: **backface a colore pieno** (la "superficie" del liquido è in realtà l'interno della mesh visto da dietro) + movimento pilotato da script — [tweet archiviato](https://codinghorror-tweets.server3.weird.internal.muni.town/tweet/986697918517207040), [Patreon 18245226](https://www.patreon.com/posts/18245226).
- Versione Shader Graph: colori laterale/superiore miscelati con la Y della normale mondo, schiuma da rumore triplanare e Voronoi; limite: senza ZWrite non si possono avere colori separati per superficie finta e schiuma laterale — [Patreon 24996282](https://www.patreon.com/posts/24996282); una versione più recente riceve movimento e fill da uno script C# e funziona con timescale 0 — [80.lv breakdown](https://80.lv/articles/breakdown-setting-up-a-fake-liquid-shader-in-unity/).
- Lo script `Wobble.cs` derivato dichiara `MaxWobble`, `WobbleSpeed`, `Recovery` e invia `_WobbleX`, `_WobbleZ` allo shader a partire da velocità e velocità angolare — [Wobble.cs (mirror Gitea)](https://gitea.com/stepa/2DPlatformer/src/branch/shaders/Shaders/Assets/Wobble.cs); altri pacchetti dichiarano che il loro script wobble è "originariamente creato da MinionsArt" — [Eren Eker liquid shader](https://ereneker.itch.io/liquid-shader-for-unity). Il meccanismo: la velocità alimenta un valore che decade, moltiplicato per una sinusoide e inviato allo shader — [Patreon 18245226](https://www.patreon.com/posts/18245226).

**Half-Life: Alyx (aggiornamento 1.4, 28 maggio 2020):**
- È uno shader costruito per sembrare una simulazione convincente; una vera simulazione costerebbe troppo — [Road to VR](https://www.roadtovr.com/half-life-alyx-update-1-4-liquid-simulation-subtitles-mod-scripting-lua/).
- "L'intero effetto è un cambiamento visivo della superficie della bottiglia; dentro non c'è niente" — [UploadVR](https://uploadvr.com/alyx-liquid-shaders/). Autore: il VFX developer Valve **Matt Wilde**, che ha studiato bottiglie reali (movimento e luce) durante il lockdown; al lancio le bottiglie erano opache — [UploadVR](https://uploadvr.com/alyx-liquid-shaders/), [VGC](https://www.videogameschronicle.com/blog/half-life-alyx-booze-physics/).
- Ricreazioni: una versione Unity con shader e **ray marching** senza geometria interna — [80.lv: simulating liquids in a bottle](https://80.lv/articles/simulating-liquids-in-a-bottle-with-a-shader/); un progetto di Carleton University in OpenGL/GLSL con linea di schiuma e fill regolabile, che nota come l'originale renda liquido e bottiglia in **un unico oggetto** — [Carleton SCS honours project](https://service.scs.carleton.ca/node/6012).
- Limiti di questo approccio (documentazione di un add-on Blender "fake liquids"): lo shader non sa quanto volume c'è davvero; manca sloshing, arricciamento delle onde e increspature — [Superhive Fake Liquids docs](https://superhivemarket.com/products/fake-liquids/docs).

**Job Simulator (Owlchemy Labs):** ~**500 ore** di un singolo sviluppatore (Devin Reimer) più centinaia da altri per i sottosistemi liquidi; obiettivo iniziale "versare tra tazze", poi temperatura (il caffè fuma finché non si raffredda) e miscelazione colori (zucchero/latte schiariscono) — [UploadVR: Job Simulator coffee](https://uploadvr.com/job-simulator-coffee/). Gioco in Unity — [Voices of VR #103](https://voicesofvr.com/103-alex-schwartz-on-developing-job-simulator-for-steamvr-htc-vive).

**Perché si finge (SPH/particelle):**
- Chi prova a replicare un minigioco di versamento con particelle fatica a **contare quante particelle finiscono nel bicchiere**; un commentatore ritiene che il gioco di riferimento non usi una vera simulazione — [Godot forum: liquid pouring out of the bottle](https://forum.godotengine.org/t/how-to-simulate-a-liquid-pouring-out-of-the-bottle/65331); "si può fingere, ma non sembrerà granché senza notevole sforzo" — [Unreal Answers](https://answers.unrealengine.com/questions/409219/view.html).
- In ingegneria si usano decine o centinaia di migliaia di particelle per simulare un fluido; i motori interattivi (come nei videogiochi) ottimizzano efficienza e aspetto naturale invece dell'accuratezza — [Bates et al., PLoS Comput Biol 2019](https://ideas.repec.org/a/plo/pcbi00/1007210.html).
- Un test di pouring con Obi da 120.000 particelle è stato renderizzato offline in 32 minuti (fonte aggregatore di bassa qualità, non verificata) — [pagina aggregatore](https://baks.verde.ag/obi-fluid-pouring-test.html).

**Strumenti Three.js r186 / Rapier verificati:** `DecalGeometry` per pozze/macchie — [three.js r186 DecalGeometry.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/geometries/DecalGeometry.js); `RigidBody.velocityAtPoint(point)` per la velocità del beccuccio — [npm 0.19.3](https://www.npmjs.com/package/@dimforge/rapier3d-compat/v/0.19.3).

### Inferences
**A. Stato del contenitore (CPU, fonte di verità):** `{volume (mL), capacity, contents: {sostanza: mL}, temperatura}`; lo shader è solo rappresentazione. La chimica/colore della miscela si calcola come media pesata per volume (come i colori in Job Simulator).

**B. Livello in spazio mondo + wobble (porting Three.js dello schema Minions Art):**
```js
// JS, ogni frame per contenitore
const wob = { x:0, z:0, ax:0, az:0, t:0 };   // ampiezze che decadono
function updateWobble(c, dt) {
  const v = c.body.linvel(), w = c.body.angvel();
  const MAX = 0.03, SPEED = 1.5, RECOVERY = 2.0;            // valori di partenza (da tarare)
  wob.ax = THREE.MathUtils.lerp(wob.ax, 0, dt*RECOVERY);
  wob.az = THREE.MathUtils.lerp(wob.az, 0, dt*RECOVERY);
  wob.ax += THREE.MathUtils.clamp((v.x + 0.2*w.z) * MAX, -MAX, MAX);
  wob.az += THREE.MathUtils.clamp((v.z + 0.2*w.x) * MAX, -MAX, MAX);
  wob.t += dt;
  const s = Math.sin(2*Math.PI*SPEED*wob.t);
  c.uniforms.uWobble.value.set(wob.ax*s, wob.az*s);
  c.uniforms.uFillY.value = fillHeightWorld(c);             // vedi C
}
```
```glsl
// fragment (onBeforeCompile su MeshPhysicalMaterial o ShaderMaterial), material.side = THREE.DoubleSide
uniform float uFillY; uniform vec2 uWobble; uniform vec3 uCenter; uniform vec3 uTopColor;
varying vec3 vWorldPos;
void main(){
  vec3 d = vWorldPos - uCenter;
  float surface = uFillY + d.x*uWobble.x + d.z*uWobble.y;  // piano inclinato dal wobble
  if (vWorldPos.y > surface) discard;
  vec3 col = gl_FrontFacing ? sideColor : uTopColor;        // backface = "pelo" del liquido
  // + rim/fresnel e una sottile fascia di schiuma: smoothstep(surface-0.004, surface, vWorldPos.y)
}
```
- Mesh liquido = copia della mesh interna del contenitore scalata ~0,97 (come Minions Art), renderOrder dopo il vetro opaco ma prima del vetro trasparente; vetro con `transparent:true, depthWrite:false`.
- Con il WebGPU renderer/TSL di r186 lo stesso schema si fa con `positionWorld`, `frontFacing`, `Discard()` (da verificare nella doc TSL; non controllato in questa sessione).

**C. Volume → altezza del piano in mondo (cilindro, esatto finché il piano non tocca fondo o bordo):** per un cilindro di raggio R, il piano orizzontale passa sempre per il punto dell'asse ad altezza assiale `h = V/(πR²)` (simmetria del cuneo). Quindi `uFillY = (bottomCenterWorld + axisWorld·h).y`. Per forme non cilindriche: tabella precalcolata altezza↔volume (integrando le sezioni) oppure approssimazione cilindrica equivalente.

**D. Inizio versamento e portata:** il punto più basso del bordo (lip) in mondo è `lipY = (topCenter + R·(dir. orizzontale verso il basso del bordo)).y`; si versa se `uFillY > lipY`. Per un cilindro con fill h (da dritto) l'angolo di inizio è `θ₀ = atan((H − h)/R)` (es. tazza R=4 cm, H=10 cm: h=5 cm → 51°, h=8 cm → 27°, h=9,5 cm → 7°; calcolato). Portata: formula a stramazzo (sezione 5) con carico `Δ = uFillY − lipY`, oppure versione "gioco": `dV/dt = −k·max(0, V − V_cap(θ))` con `V_cap(θ) = πR²(H − R·tanθ)` (valida finché `tanθ ≤ H/(2R)`) e clamp a `Q_max`. Per bottiglie con collo stretto: orifizio/Torricelli. Aggiungere un leggero "glug" (modulazione 4–8 Hz della portata) per bottiglie.

**E. Getto (stream):**
- Origine = punto del bordo più basso; velocità iniziale `v0 = body.velocityAtPoint(lip) + d̂_out · sqrt(2 g Δ)` (Torricelli sul carico Δ). Campionare `p(t) = p0 + v0 t + ½ g t²` per 12–24 punti, con `world.castRay` segmento per segmento per trovare l'impatto (escludendo il contenitore che versa).
- Raggio del getto per continuità: `r(t) = sqrt(Q / (π·|v(t)|))` → si assottiglia cadendo (es. Q=40 mL/s, v0=0,3 m/s: r=6,5 mm all'uscita, 3,5 mm dopo 5 cm di caduta, 2,5 mm dopo 20 cm; calcolato).
- Rendering: ribbon/tubo a pochi segmenti in un `BufferGeometry` **riusato** (aggiornare `position` e `needsUpdate`, non ricreare `TubeGeometry` ogni frame), UV che scorrono lungo il getto, materiale emissivo/rifrattivo leggero; facoltative particelle-goccia all'inizio/fine del versamento.
- Ritardo di trasporto: il volume arriva al ricevente dopo il tempo di volo (accodare `{volume, sostanze, tArrivo}`); evita che il bicchiere si riempia prima che il getto lo tocchi.
- Ricezione: se il collider colpito è un **sensore "bocca"** di un contenitore (collider sensor sul bordo), trasferire il volume; altrimenti **spill**: particelle di schizzo + decal pozza (`DecalGeometry` o semplice disco a terra con raycast verso il basso) la cui area cresce con il volume versato (es. `area ∝ V/spessore`, spessore 2–3 mm) e che si asciuga nel tempo.

**F. Quando valutare SPH:** solo per effetti decorativi limitati (poche centinaia di particelle, nessuna contabilità); per la logica di gioco (dosi, reazioni) restare sul modello volumetrico.

### Gaps
- Codice e parametri esatti (default) dello script Minions Art non verificabili: Patreon e mirror Gitea non accessibili da qui; i valori nello sketch sono indicativi.
- Nessun dettaglio tecnico primario (talk GDC/blog) su come Job Simulator, Cooking Simulator (Big Cheese Studio) o Cooking Simulator VR implementino versamento e getto; l'intervista Polygon a Matt Wilde non è stata recuperata, quindi la matematica interna dello shader di Alyx resta ignota.
- Non ho dati ufficiali di prestazioni di Obi Fluid o NVIDIA FleX (documentazione non raggiunta).

## 5. Formule di stramazzo / orifizio (portata vs carico), Torricelli e semplificazioni da gioco

### Takeaway
Versamento dal bordo = **stramazzo in parete sottile**: `Q = Cd·(2/3)·sqrt(2g)·b·Δ^{3/2}` con `Cd ≈ 0,61–0,62`; uscita da un foro/collo = **orifizio**: `Q = Cd·A·sqrt(2gh)` con `Cd ≈ 0,61` (spigolo vivo). Per un gioco bastano queste due formule con larghezza del bordo e carico calcolati dallo stato inclinato.

### Cited Findings
- Stramazzo rettangolare: `Q = Cd × (2/3) × √(2g) × L × H^1.5`, L lunghezza della cresta, H carico sopra la cresta, `Cd ≈ 0,62` — [Skill-Lync](https://resources.skill-lync.com/branches/civil-engineering/questions/water-resources/weir-discharge-calculation); esempio con `Cd = 0,623` — [CodeCogs weirs discharge](https://www.codecogs.com/library/engineering/fluid_mechanics/weirs/discharge.php); default 0,611 (Rehbock/Francis) — [Elysia weir calculator](https://elysiatools.com/en/tools/weir-flow-calculator); intervallo 0,6–0,65, Cd varia con Reynolds e rapporto carico/altezza; con velocità di arrivo non trascurabile si usa `H + V²/(2g)` — [Firgelli weir calculator](https://www.firgelliauto.com/blogs/calculators/weir-flow-sharp-broad-calculator); cresta sottile (spessore < metà del carico) — [CodeCogs weir types](https://www.codecogs.com/page/1439); riferimento generale — [EngineerExcel sharp crested weir](https://engineerexcel.com/sharp-crested-weir/).
- Orifizio a spigolo vivo `Cd ≈ 0,61` (Re > ~10⁴, talvolta 0,63), ugello corto ≈ 0,8, arrotondato ≈ 0,98 — [Engineers Edge vertical tank draining](https://engineersedge.com/calculators/vertical_tank_draining_time_15536.htm), [LMNO tank time](https://lmnoeng.com/Tank/TankTime.php); intervallo 0,60–0,64 con 0,62 negli esempi — [SuperTutor orifices/weirs notes](https://supertutor.ph/resources/exams/cele-civil-engineering/hydraulics-fluid-mechanics/orifices-weirs-tubes-and-nozzles/study-notes/).
- Torricelli trascura attrito e vena contratta, compensati da Cd; tempo di svuotamento `t = 2A_s(√h₁ − √h₂) / (Cd·A_o·√(2g))` (non lineare nel carico); validità se il serbatoio è molto più grande del foro (A > 10a) — [Firgelli tank drain time](https://www.firgelliauto.com/es/blogs/engineering-calculators/tank-drain-time-calculator-torricellis-theorem), [Engineers Edge](https://engineersedge.com/calculators/vertical_tank_draining_time_15536.htm).

### Inferences
- **Valori calcolati** (g = 9,81, Cd = 0,62) per tarare: bordo b = 3 cm → carico 2 mm: **4,9 mL/s**; 5 mm: **19 mL/s**; 10 mm: **55 mL/s**; b = 5 cm, 10 mm: **92 mL/s**. Velocità d'uscita `sqrt(2gΔ)`: 0,20 / 0,31 / 0,44 m/s. Orifizio r = 1 cm (collo bottiglia), Cd = 0,61: h = 5 cm → **190 mL/s**, 10 cm → **268 mL/s**, 20 cm → **380 mL/s**. Sono ordini di grandezza plausibili per versare da tazza/bottiglia.
- **Larghezza effettiva del bordo** per un contenitore circolare: corda bagnata `b ≈ 2·sqrt(2RΔ' − Δ'²)` dove `Δ' = Δ/sinθ` è quanto il pelo libero "invade" il bordo lungo il diametro; in gioco si può semplificare con `b = k·R` (k ≈ 0,5–0,8) e tarare a occhio.
- **Semplificazione stabile da gioco**: integrare con passo fisso `V -= min(Q(Δ)·dt, V − V_cap(θ))` per non svuotare oltre la capacità inclinata (evita oscillazioni numeriche); con Δ ricavato da `(V − V_cap)/A_pelo`, `A_pelo = πR²/cosθ`.
- **Becher con beccuccio**: trattare il beccuccio come stramazzo a V (portata ∝ Δ^{5/2}, forma standard dei V-notch; non verificata qui su fonte) → partenza più dolce e controllabile, ottimo per il "dosaggio" in un gioco di laboratorio.

### Gaps
- Non ho verificato su fonte primaria (Wikipedia/manuali non raggiungibili) la formula dello stramazzo triangolare `Q = (8/15)·Cd·tan(α/2)·√(2g)·H^{5/2}`; è indicata come conoscenza standard.
- Nessuna fonte specifica sull'applicazione delle formule di stramazzo nei giochi: l'adattamento è mio.

## 6. Suggerimenti di input contestuali (legenda comandi dipendente dallo stato)

### Takeaway
La legenda va generata da una **macchina a stati del giocatore × tipo di bersaglio mirato**, mostrando solo le azioni disponibili ora, con stile coerente e testo esplicito per ogni tasto; le linee guida Xbox raccomandano aiuto contestuale inline e coerenza visiva, e la letteratura di design avverte che troppi significati per lo stesso tasto confondono.

### Cited Findings
- Comandi sensibili al contesto: un tasto assume funzioni diverse a seconda della situazione e decide il gioco quale applicare; funzionano meglio per azioni puntuali senza usi concorrenti nello stesso momento (es. Assassin's Creed: attacco/uccisione furtiva, con un "paper doll" che mostra cosa fa ogni tasto) — [Game Developer, J. Bycer](https://gamedeveloper.com/design/implementing-context-sensitive-commands-in-ui-design).
- Critica: troppi usi contestuali dello stesso tasto in un unico flusso rendono il gioco difficile da seguire (Viva Piñata); la coerenza conta soprattutto se ci si discosta dalle convenzioni di genere — [GamesFirst: the problem with context sensitive buttons](https://gamesfirst.com/articles/2007/the-problem-with-context-sensitive-buttons/).
- Xbox Accessibility Guideline 114: fornire aiuto contestuale per ogni elemento dove serve; esempio Forza Horizon 4 che descrive inline l'azione di ogni tasto; stile coerente (icona lucchetto, aspetto attenuato, testo "Non disponibile") per funzioni non disponibili — [Xbox XAG 114 UI context](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-114-ui-context).
- Linee guida pulsanti/prompt in VR di Meta — [Meta buttons best practices](https://developers.meta.com/horizon/design/buttons_bp/).

### Inferences
Schema dati consigliato (tutto JS puro, testabile):
```js
const PROMPTS = {
  FREE:          t => [ t?.grabbable && ['E','Prendi'], t?.pushable && ['','Spingi camminando'], t?.usable && ['F','Usa'] ],
  HOLDING:       t => [ ['LMB','Lancia'], ['RMB','Lascia'], ['R (tieni)','Ruota'], ['Rotella','Avvicina/Allontana'],
                        t?.container && ['Q (tieni)','Versa in ' + t.name], t?.surface && ['G','Posiziona'] ],
  ROTATING:      () => [ ['Mouse','Ruota oggetto'], ['Shift','Scatti 15°'], ['R (rilascia)','Fine rotazione'] ],
  POURING:       () => [ ['Q (rilascia)','Smetti di versare'], ['Mouse ↕','Inclinazione'] ],
  PLACING:       g => [ g.valid ? ['LMB','Conferma'] : ['—','Posizione non valida'], ['Rotella','Ruota'], ['RMB','Annulla'] ],
};
function legend(state, target) {
  const items = PROMPTS[state](target).filter(Boolean);
  const key = state + '|' + items.map(i => i.join(':')).join(',');
  if (key !== lastKey) { lastKey = key; renderLegend(items); }   // aggiorna il DOM solo se cambia
}
```
- Stati del giocatore: `FREE → (E su grabbable) → HOLDING → {ROTATING, POURING, PLACING} → HOLDING → (RMB) FREE`; il bersaglio viene dal raycast della camera (in HOLDING si esclude l'oggetto tenuto).
- Mostrare la stessa posizione/ordine per le stesse azioni in ogni stato (coerenza XAG 114), azioni non disponibili attenuate invece di scomparire quando sono "quasi" possibili (es. "Versa" grigio se il contenitore è vuoto).
- Isteresi di 100–150 ms sul bersaglio per evitare lampeggi della legenda quando il mirino passa sui bordi.

### Gaps
- Non ho trovato documentazione tecnica pubblica su come Cooking Simulator, PowerWash Simulator o House Flipper implementano la loro legenda contestuale; lo schema a stati è una mia sintesi.
