// Modello quantistico: nuvole di probabilità |ψ|² per ogni orbitale occupato.
// Forme esatte degli orbitali idrogenoidi; dimensioni riscalate per guscio (non in scala reale).
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sampleOrbital, radiusQuantile } from './orbital-math.js';

/** Colori per tipo di orbitale: [fase ψ > 0, fase ψ < 0] */
export const ORBITAL_COLORS = {
  0: ['#5ce1ff', '#3d6bff'],
  1: ['#7cf29a', '#1aa392'],
  2: ['#ffc163', '#e8602c'],
  3: ['#ff86d0', '#9b6bff'],
};

const pointsFor = (n) => 2400 + 900 * n;
const geometryCache = new Map();

const vertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aDensity;
  uniform float uSize;
  uniform float uScale;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize * uScale / -mv.z, 1.0, 18.0);
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.7 + aSeed * 6.2831);
    vColor = aColor;
    // i punti nelle zone più dense brillano di più: i lobi risaltano, le code sfumano
    vAlpha = uOpacity * twinkle * (0.12 + 0.88 * sqrt(aDensity));
  }`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }`;

/** Geometria (in raggi di Bohr, coordinate della scena: z chimico → y) condivisa tra tutti gli elementi. */
function buildGeometry(orbital) {
  const key = `${orbital.n}-${orbital.l}-${orbital.m}`;
  if (geometryCache.has(key)) return geometryCache.get(key);
  const count = pointsFor(orbital.n);
  const { positions, signs, density } = sampleOrbital(orbital.n, orbital.l, orbital, count, 1009 * orbital.n + 97 * orbital.l + orbital.m + 13);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const [plus, minus] = ORBITAL_COLORS[orbital.l].map((c) => new THREE.Color(c));
  for (let i = 0; i < count; i++) {
    // assi chimici (x, y, z) → scena (x, z, −y), con z verso l'alto
    pos[i * 3] = positions[i * 3];
    pos[i * 3 + 1] = positions[i * 3 + 2];
    pos[i * 3 + 2] = -positions[i * 3 + 1];
    const c = signs[i] > 0 ? plus : minus;
    col.set([c.r, c.g, c.b], i * 3);
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aDensity', new THREE.BufferAttribute(density, 1));
  geo.computeBoundingSphere();
  const entry = { geometry: geo, count };
  geometryCache.set(key, entry);
  return entry;
}

export class OrbitalClouds {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'orbitali';
    scene.add(this.group);
    this.axes = this.#buildAxes();
    scene.add(this.axes);
    this.queue = [];
    this.entries = new Map();
    this.master = { cur: 0, target: 0 };
    this.axesFade = { cur: 0, target: 0 };
    this.uScale = 600;
  }

  #buildAxes() {
    const group = new THREE.Group();
    group.name = 'assi';
    const mat = new THREE.LineBasicMaterial({ color: 0x8fa6c4, transparent: true, opacity: 0 });
    const dirs = [
      ['x', new THREE.Vector3(1, 0, 0)],
      ['y', new THREE.Vector3(0, 0, -1)],
      ['z', new THREE.Vector3(0, 1, 0)],
    ];
    this.axisLabels = [];
    for (const [name, d] of dirs) {
      const geo = new THREE.BufferGeometry().setFromPoints([d.clone().multiplyScalar(-1), d.clone()]);
      const line = new THREE.Line(geo, mat);
      group.add(line);
      const div = document.createElement('div');
      div.className = 'label3d label3d--axis';
      div.textContent = name;
      const label = new CSS2DObject(div);
      label.userData.dir = d;
      group.add(label);
      this.axisLabels.push(label);
    }
    this.axesMaterial = mat;
    return group;
  }

  /**
   * @param {object[]} occupancy sottolivelli con orbitali (orbitalOccupancy)
   * @param {number[]} radii raggi dei gusci del modello di Bohr (per la scala)
   */
  build(occupancy, radii) {
    this.dispose();
    this.radii = radii;
    for (const sub of occupancy) {
      // scala per guscio: il 90% della probabilità dell'orbitale ns cade sul raggio del guscio n
      const k = radii[sub.n - 1] / radiusQuantile(sub.n, 0, 0.9);
      for (const o of sub.orbitals) {
        this.entries.set(o.id, { orbital: o, scale: k, shellR: radii[sub.n - 1], wanted: false, points: null, fade: 0 });
      }
    }
    const R = radii.at(-1) * 1.12;
    this.axes.scale.setScalar(R);
    this.axisLabels.forEach((l) => l.position.copy(l.userData.dir).multiplyScalar(1.06));
  }

  get ids() {
    return [...this.entries.keys()];
  }

  isOn(id) {
    return this.entries.get(id)?.wanted ?? false;
  }

  setOrbital(id, on) {
    const e = this.entries.get(id);
    if (!e) return;
    e.wanted = on;
    if (on && !e.points && !this.queue.includes(e)) this.queue.push(e);
  }

  setMaster(on) {
    this.master.target = on ? 1 : 0;
  }

  setAxesVisible(on) {
    this.axesFade.target = on ? 1 : 0;
  }

  setViewportHeight(h, fovDeg) {
    this.uScale = h / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2));
  }

  /** true finché ci sono orbitali in calcolo (per mostrare un indicatore). */
  get busy() {
    return this.queue.length > 0;
  }

  #createPoints(e) {
    const { geometry } = buildGeometry(e.orbital);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSize: { value: 0.075 + 0.0075 * e.shellR }, // dimensione del punto in unità della scena
        uScale: { value: this.uScale },
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.scale.setScalar(e.scale);
    // orbitale con un solo elettrone: nuvola più tenue
    points.userData.occupancy = e.orbital.electrons === 2 ? 1 : 0.62;
    points.frustumCulled = false;
    this.group.add(points);
    e.points = points;
  }

  update(dt, time) {
    // genera gli orbitali richiesti entro un budget di ~8 ms per frame
    const t0 = performance.now();
    while (this.queue.length && performance.now() - t0 < 8) {
      const e = this.queue.shift();
      if (e.wanted && !e.points) this.#createPoints(e);
    }

    const k = 1 - Math.exp(-dt * 4);
    this.master.cur += (this.master.target - this.master.cur) * k;
    this.axesFade.cur += (this.axesFade.target - this.axesFade.cur) * k;
    this.axesMaterial.opacity = 0.45 * this.axesFade.cur;
    this.axes.visible = this.axesFade.cur > 0.01;
    this.axisLabels.forEach((l) => (l.visible = this.axesFade.target > 0 && this.axesFade.cur > 0.5));

    for (const e of this.entries.values()) {
      if (!e.points) continue;
      e.fade += ((e.wanted ? 1 : 0) - e.fade) * k;
      const opacity = e.fade * this.master.cur;
      const mat = e.points.material;
      mat.uniforms.uOpacity.value = 0.95 * opacity * e.points.userData.occupancy;
      mat.uniforms.uTime.value = time;
      mat.uniforms.uScale.value = this.uScale;
      e.points.visible = opacity > 0.01;
    }
  }

  dispose() {
    for (const e of this.entries.values()) {
      if (!e.points) continue;
      this.group.remove(e.points);
      e.points.material.dispose(); // la geometria resta in cache
    }
    this.entries.clear();
    this.queue = [];
  }
}
