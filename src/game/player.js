// Giocatore: camminata in prima persona (capsula con il controllore del personaggio di Rapier, mouse per guardare)
// e camera della vista del bancone, che passa da una postazione all'altra.
import * as THREE from 'three';
import { STATIONS } from './room.js';

const EYE = 1.62;
const RADIUS = 0.28;
const HALF = 0.55; // mezza altezza del cilindro della capsula: altezza totale 2·(0,55 + 0,28) = 1,66 m
const WALK = 2.1;
const RUN = 3.6;

export class Player {
  constructor(physics, camera) {
    this.physics = physics;
    this.camera = camera;
    this.yaw = 0;
    this.pitch = -0.25;
    this.vy = 0;
    this.keys = new Set();
    this.mode = 'walk'; // walk | bench
    this.station = 0;
    this.camFrom = null;
    this.camT = 1;
    this.benchCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
    this.onTeleport = null; // (x, z) → il gioco libera il posto (sgabelli spinti lì)
    const start = { x: 0.15, y: HALF + RADIUS + 0.02, z: 0.4 };
    this.cc = physics.player(start, RADIUS, HALF);
  }

  get position() {
    const t = this.cc.body.translation();
    return new THREE.Vector3(t.x, t.y, t.z);
  }

  /** Vettore «avanti» della camera e posizione degli occhi. */
  eye(out = new THREE.Vector3()) {
    const t = this.cc.body.translation();
    return out.set(t.x, t.y - (HALF + RADIUS) + EYE, t.z);
  }

  look(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch = Math.max(-1.45, Math.min(1.35, this.pitch - dy * 0.0022));
  }

  teleport(x, z, yaw = null) {
    this.cc.body.setNextKinematicTranslation({ x, y: HALF + RADIUS + 0.02, z });
    this.cc.body.setTranslation({ x, y: HALF + RADIUS + 0.02, z }, true);
    if (yaw !== null) this.yaw = yaw;
    this.onTeleport?.(x, z);
  }

  /** Passa alla vista del bancone sulla postazione più vicina (o a quella indicata). */
  enterBench(index = null) {
    const p = this.position;
    if (index === null) {
      let best = 0;
      let bd = Infinity;
      STATIONS.forEach((s, i) => {
        const d = Math.hypot(s.stand[0] - p.x, s.stand[1] - p.z);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      index = best;
    }
    this.mode = 'bench';
    this.setStation(index, true);
  }

  setStation(index, fromWalk = false) {
    const n = STATIONS.length;
    this.station = ((index % n) + n) % n;
    const s = STATIONS[this.station];
    this.camFrom = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone() };
    this.camT = 0;
    this.benchCam.pos.set(...s.cam);
    this.benchCam.look.set(...s.look);
    // il giocatore si sposta davanti alla postazione (così tornando a camminare è lì)
    const yaw = Math.atan2(-(s.look[0] - s.stand[0]), -(s.look[2] - s.stand[1]));
    this.teleport(s.stand[0], s.stand[1], yaw);
    if (!fromWalk) this.pitch = -0.5;
  }

  exitBench() {
    this.mode = 'walk';
    const s = STATIONS[this.station];
    const dir = new THREE.Vector3(s.look[0] - s.cam[0], s.look[1] - s.cam[1], s.look[2] - s.cam[2]).normalize();
    this.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    this.camFrom = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone() };
    this.camT = 0;
  }

  update(dt, blocked) {
    const { controller, body } = this.cc;
    let mx = 0;
    let mz = 0;
    if (this.mode === 'walk' && !blocked) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) mz -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) mz += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    }
    const len = Math.hypot(mx, mz) || 1;
    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? RUN : WALK;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const vx = ((mx * cos + mz * sin) / len) * speed;
    const vz = ((-mx * sin + mz * cos) / len) * speed;
    this.vy = controller.computedGrounded?.() ? -0.5 : Math.max(-20, this.vy - 9.81 * dt);
    // il controllore vede solo la stanza e gli arredi mobili (che spinge): la vetreria non lo ferma
    const m = this.physics.moveCharacter(this.cc, { x: vx * dt, y: this.vy * dt, z: vz * dt }, dt);
    const t = body.translation();
    body.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
    this.moving = Math.hypot(vx, vz) > 0.1;

    // camera
    const target = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    if (this.mode === 'walk') {
      this.eye(target);
      target.x += m.x;
      target.z += m.z;
      quat.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    } else {
      target.copy(this.benchCam.pos);
      const mtx = new THREE.Matrix4().lookAt(this.benchCam.pos, this.benchCam.look, new THREE.Vector3(0, 1, 0));
      quat.setFromRotationMatrix(mtx);
    }
    if (this.camT < 1 && this.camFrom) {
      this.camT = Math.min(1, this.camT + dt * 2.6);
      const e = this.camT < 0.5 ? 2 * this.camT * this.camT : 1 - (-2 * this.camT + 2) ** 2 / 2;
      this.camera.position.lerpVectors(this.camFrom.pos, target, e);
      this.camera.quaternion.slerpQuaternions(this.camFrom.quat, quat, e);
    } else {
      this.camera.position.copy(target);
      this.camera.quaternion.copy(quat);
    }
    // subito aggiornata: il puntatore e l'oggetto in mano usano la camera di questo fotogramma
    this.camera.updateMatrixWorld();
  }
}
