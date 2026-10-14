// Effetti del simulatore: gocce e polveri che cadono (sfere istanziate), bolle e fiocchi di precipitato nei
// contenitori, sbuffi morbidi di vapore, fumo, gas, getto dell'estintore e fiamme (punti con uno shader), pozze.
import * as THREE from 'three';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _c = new THREE.Color();

/** Gocce, granelli di polvere e schegge: piccole sfere con fisica balistica. */
export class Drops {
  constructor(scene, max = 900) {
    this.max = max;
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0, transparent: true, opacity: 0.85 }), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.renderOrder = 5;
    this.mesh.setColorAt(0, new THREE.Color(1, 1, 1));
    scene.add(this.mesh);
    this.p = new Float32Array(max * 3);
    this.v = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.size = new Float32Array(max);
    this.floor = new Float32Array(max);
    this.col = new Float32Array(max * 3);
    this.n = 0;
  }

  /** Aggiunge una goccia (posizione, velocità, raggio, colore 0–255, durata, quota a cui sparisce). */
  emit(x, y, z, vx, vy, vz, r, rgb, life = 2, floor = -1) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.p.set([x, y, z], i * 3);
    this.v.set([vx, vy, vz], i * 3);
    this.life[i] = life;
    this.size[i] = r;
    this.floor[i] = floor;
    this.col.set([rgb[0] / 255, rgb[1] / 255, rgb[2] / 255], i * 3);
  }

  update(dt) {
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      this.life[i] -= dt;
      this.v[i * 3 + 1] -= 9.81 * dt;
      this.p[i * 3] += this.v[i * 3] * dt;
      this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt;
      this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      if (this.life[i] <= 0 || this.p[i * 3 + 1] < this.floor[i]) continue;
      if (w !== i) {
        this.p.copyWithin(w * 3, i * 3, i * 3 + 3);
        this.v.copyWithin(w * 3, i * 3, i * 3 + 3);
        this.col.copyWithin(w * 3, i * 3, i * 3 + 3);
        this.life[w] = this.life[i];
        this.size[w] = this.size[i];
        this.floor[w] = this.floor[i];
      }
      w++;
    }
    this.n = w;
    for (let i = 0; i < w; i++) {
      _p.set(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2]);
      const r = this.size[i];
      // le gocce si allungano nella direzione della caduta
      _s.set(r, r * (1 + Math.min(2, Math.abs(this.v[i * 3 + 1]) * 0.6)), r);
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(i, _m);
      _c.setRGB(this.col[i * 3], this.col[i * 3 + 1], this.col[i * 3 + 2]);
      this.mesh.setColorAt(i, _c);
    }
    this.mesh.count = w;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

/**
 * Getto continuo di un liquido: un tubo lungo la parabola dal bordo al punto d'arrivo, che si assottiglia cadendo
 * (continuità: Q = π r² v). Una geometria sola per getto, riscritta a ogni fotogramma (niente geometrie nuove).
 */
const RINGS = 11;
const SIDES = 6;
export class Stream {
  constructor(scene) {
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(RINGS * SIDES * 3);
    this.nrm = new Float32Array(RINGS * SIDES * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(this.nrm, 3).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let i = 0; i < RINGS - 1; i++) {
      for (let j = 0; j < SIDES; j++) {
        const a = i * SIDES + j;
        const b = i * SIDES + ((j + 1) % SIDES);
        idx.push(a, a + SIDES, b, b, a + SIDES, b + SIDES);
      }
    }
    geo.setIndex(idx);
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.78, depthWrite: false });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  /**
   * Disegna il getto: parte da p con velocità orizzontale (vx, vz), dura tEnd secondi di caduta, portata q (mL/s),
   * colore rgb (0–255).
   */
  set(p, vx, vz, tEnd, q, rgb) {
    const Q = q * 1e-6;
    const hs = Math.hypot(vx, vz);
    // direzione orizzontale del getto (o x se cade dritto) per costruire le sezioni
    const hx = hs > 1e-4 ? vx / hs : 1;
    const hz = hs > 1e-4 ? vz / hs : 0;
    for (let i = 0; i < RINGS; i++) {
      const t = (tEnd * i) / (RINGS - 1);
      const cx = p.x + vx * t;
      const cy = p.y - 4.905 * t * t;
      const cz = p.z + vz * t;
      // tangente (vx, −g t, vz) e due assi perpendicolari: B orizzontale, N nel piano verticale del getto
      const vy = -9.81 * t;
      const v = Math.hypot(hs, vy);
      const tx = (hx * hs) / v;
      const ty = vy / v;
      const tz = (hz * hs) / v;
      const bx = -hz;
      const bz = hx;
      const nx = ty * bz;
      const ny = tz * bx - tx * bz;
      const nz = -ty * bx;
      const r = Math.max(0.0008, Math.min(0.005, Math.sqrt(Q / (Math.PI * Math.max(0.05, v)))));
      for (let j = 0; j < SIDES; j++) {
        const a = (j / SIDES) * Math.PI * 2;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const ox = nx * ca + bx * sa;
        const oy = ny * ca;
        const oz = nz * ca + bz * sa;
        const k = (i * SIDES + j) * 3;
        this.pos[k] = cx + ox * r;
        this.pos[k + 1] = cy + oy * r;
        this.pos[k + 2] = cz + oz * r;
        this.nrm[k] = ox;
        this.nrm[k + 1] = oy;
        this.nrm[k + 2] = oz;
      }
    }
    const g = this.mesh.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    this.mat.color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);
    this.mesh.visible = true;
  }

  hide() {
    this.mesh.visible = false;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

const PUFF_VERT = `
attribute float aSize;
attribute vec4 aColor;
varying vec4 vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (900.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const PUFF_FRAG = `
varying vec4 vColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d) * 4.0;
  if (r > 1.0) discard;
  gl_FragColor = vec4(vColor.rgb, vColor.a * (1.0 - r) * (1.0 - r));
}`;

/** Sbuffi morbidi che salgono, si allargano e svaniscono (vapore, fumo, gas, fiamme con la miscelazione additiva). */
export class Puffs {
  constructor(scene, max = 1200, additive = false) {
    this.max = max;
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.sizeA = new Float32Array(max);
    this.colA = new Float32Array(max * 4);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.sizeA, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.colA, 4).setUsage(THREE.DynamicDrawUsage));
    this.points = new THREE.Points(
      this.geo,
      new THREE.ShaderMaterial({ vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }),
    );
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 7 : 6;
    scene.add(this.points);
    this.v = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.life0 = new Float32Array(max);
    this.s0 = new Float32Array(max);
    this.s1 = new Float32Array(max);
    this.a0 = new Float32Array(max);
    this.n = 0;
  }

  emit(x, y, z, vx, vy, vz, { size = 0.03, grow = 3, rgb = [230, 230, 230], alpha = 0.4, life = 2 } = {}) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.pos.set([x, y, z], i * 3);
    this.v.set([vx, vy, vz], i * 3);
    this.life[i] = this.life0[i] = life;
    this.s0[i] = size;
    this.s1[i] = size * grow;
    this.a0[i] = alpha;
    this.colA.set([rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, alpha], i * 4);
  }

  update(dt, wind = null) {
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) continue;
      const k = i * 3;
      if (wind) {
        const f = wind(this.pos[k], this.pos[k + 1], this.pos[k + 2]);
        if (f) {
          this.v[k] += f[0] * dt;
          this.v[k + 1] += f[1] * dt;
          this.v[k + 2] += f[2] * dt;
        }
      }
      this.pos[k] += this.v[k] * dt;
      this.pos[k + 1] += this.v[k + 1] * dt;
      this.pos[k + 2] += this.v[k + 2] * dt;
      this.v[k] *= 0.985;
      this.v[k + 2] *= 0.985;
      const u = 1 - this.life[i] / this.life0[i];
      this.sizeA[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * u;
      this.colA[i * 4 + 3] = this.a0[i] * (u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85);
      if (w !== i) {
        this.pos.copyWithin(w * 3, k, k + 3);
        this.v.copyWithin(w * 3, k, k + 3);
        this.colA.copyWithin(w * 4, i * 4, i * 4 + 4);
        this.sizeA[w] = this.sizeA[i];
        this.life[w] = this.life[i];
        this.life0[w] = this.life0[i];
        this.s0[w] = this.s0[i];
        this.s1[w] = this.s1[i];
        this.a0[w] = this.a0[i];
      }
      w++;
    }
    this.n = w;
    this.geo.setDrawRange(0, w);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
  }
}

/**
 * Bolle e fiocchi dentro i contenitori: le bolle di un gas salgono dal fondo e scoppiano sulla superficie del liquido,
 * i fiocchi di un precipitato appena formato scendono ondeggiando e si posano sul fondo. Sfere istanziate con il
 * colore di ognuna (bolle quasi bianche, fiocchi del colore del solido).
 */
export class Motes {
  constructor(scene, max = 700) {
    this.max = max;
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.1, metalness: 0, transparent: true, opacity: 0.6, depthWrite: false }), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.renderOrder = 5;
    this.mesh.setColorAt(0, new THREE.Color(1, 1, 1));
    scene.add(this.mesh);
    this.p = new Float32Array(max * 3);
    this.vy = new Float32Array(max);
    this.top = new Float32Array(max);
    this.floor = new Float32Array(max);
    this.life = new Float32Array(max);
    this.size = new Float32Array(max);
    this.phase = new Float32Array(max);
    this.col = new Float32Array(max * 3);
    this.n = 0;
    this.t = 0;
  }

  /**
   * Una bolla (vy > 0) o un fiocco (vy < 0) nel punto (x, y, z): sparisce sulla superficie `top` (la bolla) o sul
   * fondo `floor` (il fiocco), o dopo `life` secondi.
   */
  emit(x, y, z, vy, r, rgb, top, floor, life = 3) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.p.set([x, y, z], i * 3);
    this.vy[i] = vy;
    this.top[i] = top;
    this.floor[i] = floor;
    this.life[i] = life;
    this.size[i] = r;
    this.phase[i] = Math.random() * 6.28;
    this.col.set([rgb[0] / 255, rgb[1] / 255, rgb[2] / 255], i * 3);
  }

  update(dt) {
    this.t += dt;
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      this.life[i] -= dt;
      const k = i * 3;
      // le bolle accelerano salendo, i fiocchi scendono piano
      if (this.vy[i] > 0) this.vy[i] = Math.min(0.25, this.vy[i] + dt * 0.4);
      this.p[k + 1] += this.vy[i] * dt;
      if (this.life[i] <= 0 || this.p[k + 1] > this.top[i] || this.p[k + 1] < this.floor[i]) continue;
      if (w !== i) {
        this.p.copyWithin(w * 3, k, k + 3);
        this.col.copyWithin(w * 3, k, k + 3);
        this.vy[w] = this.vy[i];
        this.top[w] = this.top[i];
        this.floor[w] = this.floor[i];
        this.life[w] = this.life[i];
        this.size[w] = this.size[i];
        this.phase[w] = this.phase[i];
      }
      w++;
    }
    this.n = w;
    for (let i = 0; i < w; i++) {
      const wob = Math.sin(this.t * 9 + this.phase[i]) * 0.0006;
      _p.set(this.p[i * 3] + wob, this.p[i * 3 + 1], this.p[i * 3 + 2] + Math.cos(this.t * 7 + this.phase[i]) * 0.0006);
      const r = this.size[i];
      _s.set(r, r, r);
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(i, _m);
      _c.setRGB(this.col[i * 3], this.col[i * 3 + 1], this.col[i * 3 + 2]);
      this.mesh.setColorAt(i, _c);
    }
    this.mesh.count = w;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  clear() {
    this.n = 0;
    this.mesh.count = 0;
  }
}

/** Pozza di liquido su una superficie: un disco che si allarga con il volume. */
export function createPuddle(scene, x, y, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd6e8f6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y + 0.002, z);
  mesh.renderOrder = 1;
  scene.add(mesh);
  return mesh;
}

/** Sotto questa massa di residuo secco (g) una pozza evaporata sparisce; sopra lascia un alone da pulire. */
export const STAIN_G = 0.05;

/**
 * Stato di una pozza: 'wet' finché c'è liquido, 'stain' quando è evaporata lasciando almeno STAIN_G di residuo
 * (il sale di una soluzione, il solfato di rame…), 'gone' se non resta quasi niente.
 */
export function puddleState(liquidMl, solidMl, residueG) {
  if (liquidMl + solidMl < 0.01) return 'gone';
  if (liquidMl >= 0.05) return 'wet';
  return residueG >= STAIN_G ? 'stain' : 'gone';
}

let stainTex = null;
/** Trasparenza di un alone: velo leggero al centro, bordo più marcato (il residuo si accumula dove la pozza finiva). */
export function stainAlphaMap() {
  if (stainTex) return stainTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgb(70,70,70)');
  grad.addColorStop(0.72, 'rgb(110,110,110)');
  grad.addColorStop(0.9, 'rgb(255,255,255)');
  grad.addColorStop(1, 'rgb(0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  stainTex = new THREE.CanvasTexture(c);
  return stainTex;
}

/** Raggio (m) di una pozza di V millilitri su una superficie liscia (spessore ~1,5 mm). */
export const puddleRadius = (ml) => Math.max(0.015, Math.min(0.6, Math.sqrt((ml * 1e-6) / (Math.PI * 0.0015))));
