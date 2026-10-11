// Nucleo atomico: protoni e neutroni come sfere distinte (InstancedMesh, una draw call per tipo).
import * as THREE from 'three';
import { NUCLEON_R, nucleusRadius, packNucleus, relax, randomInBall, shuffled } from './packing.js';
import { mulberry32 } from './orbital-math.js';

export const EXPLODE_FACTOR = 2.7;
const HIGHLIGHT = new THREE.Color(2.2, 2.2, 2.2);
const SELECTED = new THREE.Color(1.75, 1.75, 1.75);
const NORMAL = new THREE.Color(1, 1, 1);
const _c = new THREE.Color();

const geometry = new THREE.SphereGeometry(NUCLEON_R, 28, 20);
const protonMaterial = new THREE.MeshStandardMaterial({
  color: 0xff4d5e, roughness: 0.36, metalness: 0.05, emissive: 0x4a0812, emissiveIntensity: 0.55,
});
const neutronMaterial = new THREE.MeshStandardMaterial({
  color: 0xa3b6d3, roughness: 0.42, metalness: 0.08, emissive: 0x0d1626, emissiveIntensity: 0.5,
});

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

function makeParticle(home, start, rand) {
  return {
    home: new THREE.Vector3(...home),
    cur: new THREE.Vector3(...start),
    scale: 0,
    targetScale: 1,
    k: 2.4 + rand() * 2.2, // velocità di assestamento individuale
    phase: [rand() * 6.28, rand() * 6.28, rand() * 6.28],
    freq: [1.7 + rand(), 2.1 + rand(), 1.9 + rand()],
  };
}

export class Nucleus {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'nucleo';
    scene.add(this.group);
    this.exploded = false;
    this.size = { cur: 1, target: 1 }; // scala di visualizzazione (ridotta nel modello quantistico)
    this.protons = [];
    this.neutrons = [];
    this.leaving = [];
    this.highlight = null;
    this.selected = null; // particella selezionata (fase 3)
    this.innerFade = 0; // 0–1: il nucleone selezionato lascia il posto alla vista dei quark
    this.dim = 0; // 0–1: attenuazione degli altri nucleoni
  }

  /** Costruisce il nucleo con Z protoni e N neutroni; `capacity` = massimo numero di neutroni tra gli isotopi. */
  build(z, n, capacity, { intro = true } = {}) {
    this.dispose();
    this.z = z;
    this.rand = mulberry32(z * 7919 + n);
    const A = z + n;
    const pos = packNucleus(A, z * 1000 + n);
    const order = shuffled(A, z * 31 + 7);
    const farR = 18 + nucleusRadius(A) * 3;

    const start = () => (intro ? randomInBall(this.rand, farR) : null);
    this.protons = [];
    this.neutrons = [];
    order.forEach((idx, i) => {
      const home = [pos[idx * 3], pos[idx * 3 + 1], pos[idx * 3 + 2]];
      const p = makeParticle(home, start() || home, this.rand);
      if (!intro) p.scale = 1;
      (i < z ? this.protons : this.neutrons).push(p);
    });

    this.protonMesh = new THREE.InstancedMesh(geometry, protonMaterial, Math.max(1, z));
    this.neutronMesh = new THREE.InstancedMesh(geometry, neutronMaterial, Math.max(1, capacity + 2));
    for (const mesh of [this.protonMesh, this.neutronMesh]) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, NORMAL);
      mesh.frustumCulled = false;
      this.group.add(mesh);
    }
    this.protonMesh.userData.kind = 'proton';
    this.neutronMesh.userData.kind = 'neutron';
    this.#syncCounts();
    this.#updateBounds();
    this.#repaint();
  }

  get neutronCount() {
    return this.neutrons.length;
  }

  /** Raggio attuale (compatto o esploso) per inquadrature ed etichette. */
  get radius() {
    const r = nucleusRadius(this.z + this.neutrons.length);
    return this.exploded ? r * EXPLODE_FACTOR + NUCLEON_R : r;
  }

  /** Riduce il nucleo per lasciare vedere gli orbitali (1 = dimensione normale). */
  setDisplayScale(k) {
    this.size.target = k;
  }

  /** Raggio visibile, tenendo conto della scala di visualizzazione. */
  get displayRadius() {
    return this.radius * this.size.cur;
  }

  get compactRadius() {
    return nucleusRadius(this.z + this.neutrons.length);
  }

  /** Cambia isotopo: i nucleoni esistenti si riassestano, i nuovi neutroni arrivano dall'esterno. */
  setNeutrons(n) {
    const current = this.neutrons.length;
    if (n === current) return;
    this.setHighlight(null);
    if (n > current) {
      const R = nucleusRadius(this.z + n);
      for (let i = current; i < n; i++) {
        const dir = new THREE.Vector3(...randomInBall(this.rand, 1)).normalize();
        const home = dir.clone().multiplyScalar(R + NUCLEON_R);
        const start = dir.clone().multiplyScalar(R * 3 + 12);
        this.neutrons.push(makeParticle(home.toArray(), start.toArray(), this.rand));
      }
    } else {
      // escono i neutroni più esterni
      const sorted = [...this.neutrons].sort((a, b) => b.home.length() - a.home.length());
      const out = new Set(sorted.slice(0, current - n));
      for (const p of out) {
        p.targetScale = 0;
        p.home = p.home.clone().normalize().multiplyScalar(nucleusRadius(this.z + current) * 3 + 10);
        this.leaving.push(p);
      }
      this.neutrons = this.neutrons.filter((p) => !out.has(p));
    }
    this.#rearrange();
    this.#syncCounts();
    this.#updateBounds();
    this.#repaint();
  }

  #rearrange() {
    const all = [...this.protons, ...this.neutrons];
    const pos = new Float32Array(all.length * 3);
    all.forEach((p, i) => pos.set([p.home.x, p.home.y, p.home.z], i * 3));
    relax(pos, all.length, 70);
    all.forEach((p, i) => p.home.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
  }

  setExploded(on) {
    this.exploded = on;
    this.#updateBounds();
  }

  #syncCounts() {
    this.protonMesh.count = this.protons.length;
    this.neutronMesh.count = Math.min(this.neutrons.length + this.leaving.length, this.neutronMesh.instanceMatrix.count);
  }

  #updateBounds() {
    const r = nucleusRadius(this.z + this.neutrons.length) * EXPLODE_FACTOR + 2;
    for (const mesh of [this.protonMesh, this.neutronMesh]) {
      mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), r);
    }
  }

  update(dt, time) {
    if (!this.protonMesh) return;
    this.size.cur += (this.size.target - this.size.cur) * (1 - Math.exp(-dt * 4));
    this.group.scale.setScalar(this.size.cur);
    const factor = this.exploded ? EXPLODE_FACTOR : 1;
    const step = (list, mesh, offset = 0) => {
      const cap = mesh.instanceMatrix.count;
      list.forEach((p, i) => {
        if (offset + i >= cap) return;
        // il nucleone selezionato non vibra: la camera lo segue
        const amp = this.exploded || p === this.selected ? 0 : 0.035;
        _p.copy(p.home).multiplyScalar(p.targetScale === 0 ? 1 : factor);
        _p.x += Math.sin(time * p.freq[0] + p.phase[0]) * amp;
        _p.y += Math.sin(time * p.freq[1] + p.phase[1]) * amp;
        _p.z += Math.sin(time * p.freq[2] + p.phase[2]) * amp;
        const a = 1 - Math.exp(-dt * p.k);
        p.cur.lerp(_p, a);
        p.scale += (p.targetScale - p.scale) * (1 - Math.exp(-dt * 5));
        const inner = p === this.selected ? 1 - this.innerFade : 1;
        _s.setScalar(Math.max(p.scale * inner, 0.0001));
        mesh.setMatrixAt(offset + i, _m.compose(p.cur, _q, _s));
      });
    };
    step(this.protons, this.protonMesh);
    step(this.neutrons, this.neutronMesh);
    step(this.leaving, this.neutronMesh, this.neutrons.length);
    if (this.leaving.length && this.leaving.every((p) => p.scale < 0.02)) {
      this.leaving = [];
      this.#syncCounts();
    }
    this.protonMesh.instanceMatrix.needsUpdate = true;
    this.neutronMesh.instanceMatrix.needsUpdate = true;
  }

  get meshes() {
    return this.protonMesh ? [this.protonMesh, this.neutronMesh] : [];
  }

  /** Evidenzia un nucleone al passaggio del puntatore (null per togliere l'evidenziazione). */
  setHighlight(target) {
    this.highlight = target;
    this.#repaint();
  }

  /** Particella corrispondente a un'istanza (null se è un neutrone in uscita). */
  particleAt(mesh, index) {
    if (mesh === this.protonMesh) return this.protons[index] ?? null;
    if (mesh === this.neutronMesh) return this.neutrons[index] ?? null;
    return null;
  }

  /** true se la particella fa ancora parte del nucleo (es. dopo un cambio di isotopo). */
  contains(p) {
    return this.protons.includes(p) || this.neutrons.includes(p);
  }

  /** Posizione nella scena (tiene conto della scala di visualizzazione del gruppo). */
  worldPosition(p, out = new THREE.Vector3()) {
    return out.copy(p.cur).multiplyScalar(this.size.cur);
  }

  setSelected(p) {
    this.selected = p;
    this.#repaint();
  }

  /** Attenua i nucleoni non selezionati (0 = normali, 1 = quasi trasparenti: si vede l'interno del selezionato). */
  setDim(k) {
    if (Math.abs(k - this.dim) < 0.004 && !(k === 0 && this.dim !== 0)) return;
    this.dim = k;
    const ghost = k > 0.01;
    for (const m of [protonMaterial, neutronMaterial]) {
      if (m.transparent !== ghost) {
        m.transparent = ghost;
        m.depthWrite = !ghost;
        m.needsUpdate = true;
      }
      m.opacity = 1 - 0.8 * k;
    }
    this.#repaint();
  }

  setInnerFade(k) {
    this.innerFade = k;
  }

  #repaint() {
    const base = 1 - 0.45 * this.dim;
    const paint = (mesh, list) => {
      if (!mesh) return;
      for (let i = 0; i < mesh.instanceMatrix.count; i++) {
        const p = list[i];
        let color = _c.setScalar(base);
        if (p && p === this.selected) color = SELECTED;
        else if (this.highlight && this.highlight.mesh === mesh && this.highlight.index === i) color = HIGHLIGHT;
        mesh.setColorAt(i, color);
      }
      mesh.instanceColor.needsUpdate = true;
    };
    paint(this.protonMesh, this.protons);
    paint(this.neutronMesh, this.neutrons);
  }

  dispose() {
    for (const mesh of this.meshes) {
      this.group.remove(mesh);
      mesh.dispose();
    }
    this.protonMesh = null;
    this.neutronMesh = null;
    this.leaving = [];
    this.highlight = null;
    this.selected = null;
    this.innerFade = 0;
  }
}
