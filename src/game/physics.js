// Fisica del simulatore di laboratorio con Rapier: mondo a passo fisso, collisori statici della stanza, corpi della
// vetreria e degli strumenti, sensori, eventi d'urto (per rompere il vetro), raggi e controllore del personaggio.
// Rapier (WebAssembly incluso nel pacchetto, ~2 MB) è un file a parte, caricato solo alla prima apertura del gioco.

let loading = null;
/** Carica e inizializza Rapier una volta sola. */
export const loadPhysics = () =>
  (loading ??= import('@dimforge/rapier3d-compat').then(async (m) => {
    const R = m.default ?? m;
    await R.init();
    return R;
  }));

export const STEP = 1 / 120;
const MAX_STEPS = 6;

/** Gruppi di collisione: bit alti = appartenenza, bit bassi = con chi collide. */
const group = (member, filter) => (member << 16) | filter;
export const G = { STATIC: 1, ITEM: 2, PLAYER: 4, DEBRIS: 8, PROP: 16 };
const GROUPS = {
  static: group(G.STATIC, G.ITEM | G.PLAYER | G.DEBRIS | G.PROP),
  item: group(G.ITEM, G.STATIC | G.ITEM | G.DEBRIS | G.PROP),
  // il corpo cinematico del giocatore non tocca gli arredi nel risolutore (li spingerebbe con massa infinita):
  // li sposta il controllore del personaggio con i suoi impulsi
  player: group(G.PLAYER, G.STATIC),
  debris: group(G.DEBRIS, G.STATIC | G.ITEM | G.PROP),
  // strumenti da immergere (termometro, pH-metro, pipetta): toccano solo la stanza, così in mano entrano nei
  // recipienti senza spingerli
  ghost: group(G.DEBRIS, G.STATIC | G.PROP),
  prop: group(G.PROP, G.STATIC | G.ITEM | G.DEBRIS | G.PROP | G.PLAYER),
  // cosa «vede» il controllore del personaggio: la stanza e gli arredi mobili, non la vetreria né l'oggetto in mano
  playerQuery: group(G.PLAYER, G.STATIC | G.PROP),
};
/** Massa del personaggio negli urti con gli arredi (kg). */
const CHARACTER_MASS = 80;

export class Physics {
  constructor(R) {
    this.R = R;
    this.world = new R.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = STEP;
    this.events = new R.EventQueue(true);
    this.owners = new Map(); // handle del collisore → proprietario (oggetto del gioco o elemento della stanza)
    this.acc = 0;
    this.preStep = null; // (dt) → controllo degli oggetti tenuti in mano
    this.onImpact = null; // (owner, forza, altroOwner, velocitàPrimaDellUrto)
    this.speeds = new Map(); // corpo → velocità prima del passo (per stimare l'urto)
  }

  /** Scatola statica (centro e mezze dimensioni, rotazione attorno a y opzionale). */
  box(cx, cy, cz, hx, hy, hz, owner = null, rotY = 0) {
    const d = this.R.ColliderDesc.cuboid(hx, hy, hz).setTranslation(cx, cy, cz).setFriction(0.8).setCollisionGroups(GROUPS.static);
    if (rotY) d.setRotation(quatY(rotY));
    const c = this.world.createCollider(d);
    if (owner) this.owners.set(c.handle, owner);
    return c;
  }

  /** Cilindro statico verticale. */
  cylinder(cx, cy, cz, halfH, r, owner = null) {
    const d = this.R.ColliderDesc.cylinder(halfH, r).setTranslation(cx, cy, cz).setFriction(0.8).setCollisionGroups(GROUPS.static);
    const c = this.world.createCollider(d);
    if (owner) this.owners.set(c.handle, owner);
    return c;
  }

  /**
   * Arredo mobile (sgabello): cilindro dinamico appoggiato sul pavimento in (x, z), alto 2·hh. Il giocatore lo spinge
   * camminandoci contro; gira solo attorno alla verticale, quindi non si ribalta, e si ferma presto (smorzamento).
   */
  prop({ x, z, hh, r, mass, owner = null }) {
    const { R } = this;
    const desc = R.RigidBodyDesc.dynamic().setTranslation(x, 0, z).setLinearDamping(2).setAngularDamping(4).enabledRotations(false, true, false);
    const body = this.world.createRigidBody(desc);
    const cd = R.ColliderDesc.cylinder(hh, r).setTranslation(0, hh, 0).setMass(mass).setFriction(0.5).setRestitution(0).setCollisionGroups(GROUPS.prop);
    const c = this.world.createCollider(cd, body);
    if (owner) this.owners.set(c.handle, owner);
    return body;
  }

  /**
   * Corpo dinamico. shapes: [{ type: 'cylinder'|'box'|'ball'|'hull', y, hh, r, hx, hy, hz, points }], posizione
   * dell'origine (in basso al centro dell'oggetto) e rotazione; mass: massa totale in kg.
   */
  dynamic({ pos, quat, shapes, mass, owner, ccd = true, debris = false, ghost = false, friction = 0.7, restitution = 0.05, events = false }) {
    const { R } = this;
    const desc = R.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z).setCcdEnabled(ccd).setLinearDamping(0.05).setAngularDamping(0.3);
    if (quat) desc.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });
    const body = this.world.createRigidBody(desc);
    const volume = shapes.reduce((t, s) => t + shapeVolume(s), 0) || 1e-6;
    for (const s of shapes) {
      let cd;
      if (s.type === 'cylinder') cd = R.ColliderDesc.cylinder(s.hh, s.r);
      else if (s.type === 'ball') cd = R.ColliderDesc.ball(s.r);
      else if (s.type === 'hull') cd = R.ColliderDesc.convexHull(s.points);
      else cd = R.ColliderDesc.cuboid(s.hx, s.hy, s.hz);
      cd.setTranslation(s.x ?? 0, s.y ?? 0, s.z ?? 0).setDensity(mass / volume).setFriction(friction).setRestitution(restitution);
      cd.setCollisionGroups(ghost ? GROUPS.ghost : debris ? GROUPS.debris : GROUPS.item);
      if (events) {
        cd.setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS);
        cd.setContactForceEventThreshold(Math.max(0.5, mass * 25));
      }
      const c = this.world.createCollider(cd, body);
      if (owner) this.owners.set(c.handle, owner);
    }
    return body;
  }

  /** Corpo cinematico del giocatore (capsula) e controllore del personaggio. */
  player(pos, radius, halfHeight) {
    const { R } = this;
    const body = this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(pos.x, pos.y, pos.z));
    const collider = this.world.createCollider(R.ColliderDesc.capsule(halfHeight, radius).setCollisionGroups(GROUPS.player), body);
    const controller = this.world.createCharacterController(0.02);
    controller.setUp({ x: 0, y: 1, z: 0 });
    controller.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
    controller.enableAutostep(0.25, 0.2, false);
    controller.enableSnapToGround(0.3);
    controller.setApplyImpulsesToDynamicBodies(true);
    controller.setCharacterMass(CHARACTER_MASS);
    return { body, collider, controller, query: GROUPS.playerQuery };
  }

  /**
   * Movimento del personaggio di `delta` metri in `dt` secondi. Rapier trasferisce agli arredi la velocità
   * movimento / passo della fisica: con il passo fisso di 1/120 s e un fotogramma di 1/60 s gli sgabelli
   * partirebbero al doppio della velocità del giocatore, quindi per questo calcolo il passo è quello del fotogramma.
   */
  moveCharacter(cc, delta, dt) {
    if (dt > 0) this.world.timestep = dt;
    cc.controller.computeColliderMovement(cc.collider, delta, undefined, cc.query);
    this.world.timestep = STEP;
    return cc.controller.computedMovement();
  }

  /** Rende fisso un corpo (gli apparecchi montati sui sostegni: buretta, imbuto, pallone da distillazione). */
  fix(body) {
    body.setBodyType(this.R.RigidBodyType.Fixed, true);
  }

  remove(body) {
    if (!body) return;
    for (let i = 0; i < body.numColliders(); i++) this.owners.delete(body.collider(i).handle);
    this.speeds.delete(body);
    this.world.removeRigidBody(body);
  }

  ownerOf(collider) {
    return collider ? this.owners.get(collider.handle) ?? null : null;
  }

  /** Avanza la simulazione di dt secondi a passo fisso. */
  step(dt, bodies) {
    this.acc = Math.min(this.acc + dt, STEP * MAX_STEPS);
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.preStep?.(STEP);
      for (const b of bodies) {
        const v = b.linvel();
        this.speeds.set(b, Math.hypot(v.x, v.y, v.z));
      }
      this.world.step(this.events);
      this.events.drainContactForceEvents((e) => {
        const c1 = this.world.getCollider(e.collider1());
        const c2 = this.world.getCollider(e.collider2());
        const o1 = this.ownerOf(c1);
        const o2 = this.ownerOf(c2);
        const f = e.totalForceMagnitude();
        const v1 = c1?.parent() ? this.speeds.get(c1.parent()) ?? 0 : 0;
        const v2 = c2?.parent() ? this.speeds.get(c2.parent()) ?? 0 : 0;
        // la velocità dell'urto è quella relativa: conta il più veloce dei due (l'altro di solito è fermo)
        const v = Math.max(v1, v2);
        if (o1) this.onImpact?.(o1, f, o2, v);
        if (o2) this.onImpact?.(o2, f, o1, v);
      });
    }
  }

  /**
   * Raggio: primo collisore colpito. solidOnly: solo la stanza (esclude gli oggetti mobili). exclude: corpo da ignorare;
   * predicate: (collisore) → false per ignorarlo.
   * @returns {{toi: number, point: {x,y,z}, normal: {x,y,z}, collider: object, owner: object}|null}
   */
  ray(origin, dir, maxToi, { solidOnly = false, exclude = null, predicate = null } = {}) {
    const { R } = this;
    const ray = new R.Ray(origin, dir);
    const flags = solidOnly ? R.QueryFilterFlags.EXCLUDE_DYNAMIC | R.QueryFilterFlags.EXCLUDE_KINEMATIC : R.QueryFilterFlags.EXCLUDE_KINEMATIC;
    const hit = this.world.castRayAndGetNormal(ray, maxToi, true, flags, undefined, undefined, exclude ?? undefined, predicate ?? undefined);
    if (!hit) return null;
    const p = ray.pointAt(hit.timeOfImpact);
    return { toi: hit.timeOfImpact, point: { x: p.x, y: p.y, z: p.z }, normal: hit.normal, collider: hit.collider, owner: this.ownerOf(hit.collider) };
  }

  /** Forma di Rapier per un ingombro: cilindro verticale { r, hh } o scatola { hx, hh, hz }, scalata di `k`. */
  footShape(foot, k = 1) {
    const { R } = this;
    return foot.r !== undefined ? new R.Cylinder(foot.hh * k, foot.r * k) : new R.Cuboid(foot.hx * k, foot.hh * k, foot.hz * k);
  }

  /**
   * Dove si fermerebbe, scendendo da `fromY`, l'ingombro `foot` (cilindro { r, hh } o scatola { hx, hh, hz }, girato di
   * `rot`) centrato in (x, z): il suo centro a riposo, la normale della superficie toccata e il collisore. Il giocatore
   * non conta. In Rapier 0.19.3 il campo è time_of_impact (per i raggi timeOfImpact); normal2 è la normale dell'altro
   * collisore, in coordinate del mondo.
   * @returns {{y: number, normal: {x,y,z}, collider: object}|null}
   */
  restHeight(foot, x, z, fromY, { rot = IDENTITY, exclude = null, maxDrop = 1.5 } = {}) {
    const { R } = this;
    const hit = this.world.castShape({ x, y: fromY, z }, rot, { x: 0, y: -1, z: 0 }, this.footShape(foot), 0, maxDrop, true, R.QueryFilterFlags.EXCLUDE_KINEMATIC, GROUPS.item, undefined, exclude ?? undefined);
    if (!hit) return null;
    // la normale della superficie su cui appoggia, girata verso l'alto
    const n = hit.normal2;
    const up = n.y < 0 ? { x: -n.x, y: -n.y, z: -n.z } : { x: n.x, y: n.y, z: n.z };
    return { y: fromY - hit.time_of_impact, normal: up, collider: hit.collider };
  }

  /**
   * L'ingombro `foot` centrato in `pos` (girato di `rot`) tocca qualcosa? La forma è ridotta al 95%, così un oggetto
   * appoggiato su un piano non «tocca» il piano. predicate: (collisore) → false per ignorarlo.
   */
  overlaps(foot, pos, { rot = IDENTITY, exclude = null, predicate = null } = {}) {
    const { R } = this;
    let found = false;
    this.world.intersectionsWithShape(pos, rot, this.footShape(foot, 0.95), () => {
      found = true;
      return false;
    }, R.QueryFilterFlags.EXCLUDE_KINEMATIC, GROUPS.item, undefined, exclude ?? undefined, predicate ?? undefined);
    return found;
  }
}

const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };

function quatY(a) {
  return { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) };
}

function shapeVolume(s) {
  if (s.type === 'cylinder') return Math.PI * s.r * s.r * 2 * s.hh;
  if (s.type === 'ball') return (4 / 3) * Math.PI * s.r ** 3;
  if (s.type === 'hull') {
    // stima: volume del parallelepipedo che contiene i punti × 0,6
    const p = s.points;
    let [x0, y0, z0, x1, y1, z1] = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let i = 0; i < p.length; i += 3) {
      x0 = Math.min(x0, p[i]);
      x1 = Math.max(x1, p[i]);
      y0 = Math.min(y0, p[i + 1]);
      y1 = Math.max(y1, p[i + 1]);
      z0 = Math.min(z0, p[i + 2]);
      z1 = Math.max(z1, p[i + 2]);
    }
    return (x1 - x0) * (y1 - y0) * (z1 - z0) * 0.6;
  }
  return 8 * s.hx * s.hy * s.hz;
}
