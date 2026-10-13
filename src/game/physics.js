// Fisica del simulatore di laboratorio con Rapier: mondo a passo fisso, collisori statici della stanza, corpi della
// vetreria e degli strumenti, sensori, eventi d'urto (per rompere il vetro), raggi e controllore del personaggio.
// Rapier si carica (WebAssembly incluso nel pacchetto) solo alla prima apertura del gioco.
import RAPIER from '@dimforge/rapier3d-compat';

let loading = null;
/** Inizializza Rapier una volta sola. */
export const loadPhysics = () => (loading ??= RAPIER.init().then(() => RAPIER));

export const STEP = 1 / 120;
const MAX_STEPS = 6;

/** Gruppi di collisione: bit alti = appartenenza, bit bassi = con chi collide. */
const group = (member, filter) => (member << 16) | filter;
export const G = { STATIC: 1, ITEM: 2, PLAYER: 4, DEBRIS: 8 };
const GROUPS = {
  static: group(G.STATIC, G.ITEM | G.PLAYER | G.DEBRIS),
  item: group(G.ITEM, G.STATIC | G.ITEM | G.DEBRIS),
  player: group(G.PLAYER, G.STATIC),
  debris: group(G.DEBRIS, G.STATIC | G.ITEM),
};

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
   * Corpo dinamico. shapes: [{ type: 'cylinder'|'box'|'ball'|'hull', y, hh, r, hx, hy, hz, points }], posizione
   * dell'origine (in basso al centro dell'oggetto) e rotazione; mass: massa totale in kg.
   */
  dynamic({ pos, quat, shapes, mass, owner, ccd = true, debris = false, friction = 0.7, restitution = 0.05, events = false }) {
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
      cd.setCollisionGroups(debris ? GROUPS.debris : GROUPS.item);
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
    controller.setApplyImpulsesToDynamicBodies(false);
    return { body, collider, controller };
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
   * Raggio: primo collisore colpito. solidOnly: solo la stanza (esclude gli oggetti mobili). exclude: corpo da ignorare.
   * @returns {{toi: number, point: {x,y,z}, normal: {x,y,z}, collider: object, owner: object}|null}
   */
  ray(origin, dir, maxToi, { solidOnly = false, exclude = null } = {}) {
    const { R } = this;
    const ray = new R.Ray(origin, dir);
    const flags = solidOnly ? R.QueryFilterFlags.EXCLUDE_DYNAMIC | R.QueryFilterFlags.EXCLUDE_KINEMATIC : R.QueryFilterFlags.EXCLUDE_KINEMATIC;
    const hit = this.world.castRayAndGetNormal(ray, maxToi, true, flags, undefined, undefined, exclude ?? undefined);
    if (!hit) return null;
    const p = ray.pointAt(hit.timeOfImpact);
    return { toi: hit.timeOfImpact, point: { x: p.x, y: p.y, z: p.z }, normal: hit.normal, collider: hit.collider, owner: this.ownerOf(hit.collider) };
  }
}

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
