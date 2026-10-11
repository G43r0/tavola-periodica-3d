// Interno di un nucleone (schematico): tre quark di valenza con carica di colore,
// gluoni disegnati come molle (simbolo dei diagrammi di Feynman) e coppie quark–antiquark virtuali.
// Scambiando un gluone due quark si scambiano il colore: la somma resta sempre "bianca".
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { NUCLEON_R } from './packing.js';
import { QUARKS, COLOR_CHARGES } from '../chem/particles.js';
import { mulberry32 } from './orbital-math.js';

export const QUARK_R = 0.066;
const GLUON_POINTS = 120;
const PAIRS = [[0, 1], [1, 2], [2, 0]];
const COLORS = COLOR_CHARGES.map((c) => new THREE.Color(c.hex));
const ANTI = COLORS.map((c) => new THREE.Color(1 - c.r * 0.6, 1 - c.g * 0.6, 1 - c.b * 0.6)); // anticolori (ciano, magenta, giallo)
const SEA_PAIRS = 26;
const BAG_COLOR = { proton: new THREE.Color('#ff5d6c'), neutron: new THREE.Color('#9fb4d6') };

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _u = new THREE.Vector3();
const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _ref = new THREE.Vector3();
const _col = new THREE.Color();

const bagShader = {
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.4);
      float a = (0.05 + 0.75 * rim) * uOpacity;
      gl_FragColor = vec4(uColor * (0.5 + 1.1 * rim), a);
    }`,
};

const seaShader = {
  vertexShader: /* glsl */ `
    attribute vec3 aColor;
    attribute float aSeed;
    uniform float uTime;
    uniform float uScale;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      // ogni coppia virtuale compare e scompare rapidamente
      float life = sin(uTime * (1.3 + aSeed * 1.7) + aSeed * 40.0);
      vAlpha = pow(max(life, 0.0), 6.0);
      vColor = aColor;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = clamp(0.035 * uScale / -mv.z, 1.0, 14.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uOpacity;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = dot(c, c);
      if (d > 0.25) discard;
      gl_FragColor = vec4(vColor, (1.0 - d * 4.0) * vAlpha * uOpacity);
    }`,
};

export class QuarkView {
  /** @param {THREE.Object3D} parent gruppo del nucleo (ne eredita la scala) */
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.name = 'quark';
    this.group.visible = false;
    parent.add(this.group);
    this.inner = new THREE.Group();
    this.group.add(this.inner);
    this.fade = 0;
    this.labelsOn = true;
    this.kind = 'proton';

    this.bagMaterial = new THREE.ShaderMaterial({
      ...bagShader,
      uniforms: { uColor: { value: BAG_COLOR.proton.clone() }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.bag = new THREE.Mesh(new THREE.SphereGeometry(NUCLEON_R, 48, 32), this.bagMaterial);
    this.group.add(this.bag);

    const rand = mulberry32(2718);
    const quarkGeometry = new THREE.SphereGeometry(QUARK_R, 28, 20);
    this.quarks = [0, 1, 2].map((i) => {
      const material = new THREE.MeshStandardMaterial({
        color: COLORS[i].clone(),
        emissive: COLORS[i].clone(),
        emissiveIntensity: 0.85,
        roughness: 0.35,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(quarkGeometry, material);
      mesh.userData = { kind: 'quark', index: i };
      const el = document.createElement('div');
      el.className = 'label3d label3d--quark';
      const label = new CSS2DObject(el);
      label.position.set(0, QUARK_R + 0.07, 0);
      mesh.add(label);
      this.inner.add(mesh);
      const angle = (i / 3) * Math.PI * 2;
      return {
        mesh, material, label, el,
        color: i, // indice della carica di colore attuale
        base: new THREE.Vector3(Math.cos(angle) * 0.27, Math.sin(angle) * 0.27, 0),
        phase: [rand() * 6.28, rand() * 6.28, rand() * 6.28],
        freq: [0.9 + rand() * 0.6, 1.1 + rand() * 0.6, 0.8 + rand() * 0.6],
      };
    });

    this.gluons = PAIRS.map(([a, b], i) => {
      const geometry = new LineGeometry();
      geometry.setPositions(new Float32Array(GLUON_POINTS * 3));
      geometry.setColors(new Float32Array(GLUON_POINTS * 3));
      const material = new LineMaterial({ linewidth: 3.4, vertexColors: true, transparent: true, opacity: 0, depthWrite: false });
      const line = new Line2(geometry, material);
      line.frustumCulled = false;
      this.inner.add(line);
      return { a, b, line, geometry, material, points: new Float32Array(GLUON_POINTS * 3), colors: new Float32Array(GLUON_POINTS * 3), spin: i * 2.1 };
    });

    // mare di coppie quark–antiquark virtuali
    const pos = new Float32Array(SEA_PAIRS * 2 * 3);
    const col = new Float32Array(SEA_PAIRS * 2 * 3);
    const seed = new Float32Array(SEA_PAIRS * 2);
    for (let i = 0; i < SEA_PAIRS; i++) {
      const r = 0.12 + rand() * 0.3;
      const z = 2 * rand() - 1;
      const phi = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      const c = new THREE.Vector3(s * Math.cos(phi) * r, s * Math.sin(phi) * r, z * r);
      const off = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(0.022);
      const k = Math.floor(rand() * 3);
      const t = rand();
      [c.clone().add(off), c.clone().sub(off)].forEach((p, j) => {
        pos.set(p.toArray(), (i * 2 + j) * 3);
        col.set((j === 0 ? COLORS[k] : ANTI[k]).toArray(), (i * 2 + j) * 3);
        seed[i * 2 + j] = t;
      });
    }
    const seaGeometry = new THREE.BufferGeometry();
    seaGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    seaGeometry.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    seaGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.seaMaterial = new THREE.ShaderMaterial({
      ...seaShader,
      uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sea = new THREE.Points(seaGeometry, this.seaMaterial);
    this.sea.frustumCulled = false;
    this.inner.add(this.sea);

    // scambio di gluoni: un "impulso" di colore viaggia da un quark all'altro
    this.exchange = null;
    this.nextExchange = 1.0;
    this.clock = 0;
    this.setKind('proton');
  }

  /** Protone (uud) o neutrone (udd). */
  setKind(kind) {
    this.kind = kind;
    this.flavors = kind === 'proton' ? ['u', 'u', 'd'] : ['u', 'd', 'd'];
    this.bagMaterial.uniforms.uColor.value.copy(BAG_COLOR[kind]);
    this.quarks.forEach((q, i) => {
      const f = QUARKS[this.flavors[i]];
      q.el.innerHTML = `<b>${this.flavors[i]}</b> ${f.charge}`;
    });
  }

  setFade(k) {
    this.fade = k;
    this.group.visible = k > 0.002;
  }

  setLabelsVisible(on) {
    this.labelsOn = on;
  }

  /** Scala dei punti in pixel (altezza della vista e campo visivo della camera). */
  setViewportHeight(px, fovDeg) {
    this.seaMaterial.uniforms.uScale.value = px / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2));
  }

  /** Informazioni sul quark i (per il tooltip). */
  quarkInfo(i) {
    const flavor = this.flavors[i];
    return { flavor, ...QUARKS[flavor], color: COLOR_CHARGES[this.quarks[i].color] };
  }

  get meshes() {
    return this.quarks.map((q) => q.mesh);
  }

  /** @param {THREE.Vector3} position posizione del nucleone nel gruppo del nucleo */
  update(dt, time, position) {
    if (!this.group.visible) return;
    this.clock += dt;
    this.group.position.copy(position);
    this.inner.rotation.set(0.35 * Math.sin(time * 0.17), time * 0.22, 0.2 * Math.sin(time * 0.13));

    const f = this.fade;
    this.bagMaterial.uniforms.uOpacity.value = f;
    this.seaMaterial.uniforms.uOpacity.value = f * 0.9;
    this.seaMaterial.uniforms.uTime.value = time;

    // quark: moto confinato dentro il nucleone
    for (const q of this.quarks) {
      const breathe = 1 + 0.12 * Math.sin(time * q.freq[0] + q.phase[0]);
      q.mesh.position.copy(q.base).multiplyScalar(breathe);
      q.mesh.position.x += 0.05 * Math.sin(time * q.freq[1] * 1.3 + q.phase[1]);
      q.mesh.position.y += 0.05 * Math.sin(time * q.freq[2] * 1.1 + q.phase[2]);
      q.mesh.position.z += 0.07 * Math.sin(time * q.freq[0] * 0.9 + q.phase[1]);
      q.material.opacity = f;
      q.material.color.lerp(COLORS[q.color], 1 - Math.exp(-dt * 7));
      q.material.emissive.copy(q.material.color);
      q.label.visible = this.labelsOn && f > 0.75;
    }

    this.#updateExchange(dt);
    for (const g of this.gluons) this.#updateGluon(g, time, f);
  }

  #updateExchange(dt) {
    const ex = this.exchange;
    if (!ex) {
      this.nextExchange -= dt;
      if (this.nextExchange <= 0) {
        const pair = Math.floor(Math.random() * 3);
        const forward = Math.random() < 0.5;
        const [a, b] = forward ? PAIRS[pair] : [PAIRS[pair][1], PAIRS[pair][0]];
        const qa = this.quarks[a];
        const qb = this.quarks[b];
        // il quark a emette un gluone (colore a, anticolore b) e assume il colore di b
        this.exchange = { pair, from: a, to: b, carried: qa.color, t: 0 };
        qa.color = qb.color;
      }
      return;
    }
    ex.t += dt / 0.55;
    if (ex.t >= 1) {
      // il quark b assorbe il gluone e prende il colore trasportato
      this.quarks[ex.to].color = ex.carried;
      this.exchange = null;
      this.nextExchange = 0.6 + Math.random() * 1.2;
    }
  }

  #updateGluon(g, time, fade) {
    const A = this.quarks[g.a].mesh.position;
    const B = this.quarks[g.b].mesh.position;
    _u.subVectors(B, A);
    const len = _u.length();
    _u.divideScalar(len || 1);
    _ref.set(0, 0, 1);
    if (Math.abs(_u.z) > 0.9) _ref.set(1, 0, 0);
    _e1.crossVectors(_u, _ref).normalize();
    _e2.crossVectors(_u, _e1);

    const turns = Math.max(4, Math.round(len / 0.05));
    const radius = 0.034;
    const start = QUARK_R * 0.7;
    const span = Math.max(0.0001, len - 2 * start);
    const ex = this.exchange && this.exchange.pair === this.gluons.indexOf(g) ? this.exchange : null;
    const ca = this.quarks[g.a].material.color;
    const cb = this.quarks[g.b].material.color;
    // posizione dell'impulso lungo il gluone (0 = quark a, 1 = quark b)
    const pulseAt = ex ? (ex.from === g.a ? ex.t : 1 - ex.t) : -1;
    const pulseColor = ex ? COLORS[ex.carried] : null;

    for (let i = 0; i < GLUON_POINTS; i++) {
      const s = i / (GLUON_POINTS - 1);
      const theta = s * turns * Math.PI * 2 - time * 7 + g.spin;
      const env = Math.sin(Math.PI * s) ** 0.6; // la molla si stringe vicino ai quark
      _a.copy(A).addScaledVector(_u, start + s * span);
      _b.copy(_e1).multiplyScalar(Math.cos(theta)).addScaledVector(_e2, Math.sin(theta)).multiplyScalar(radius * env);
      _a.add(_b);
      g.points[i * 3] = _a.x;
      g.points[i * 3 + 1] = _a.y;
      g.points[i * 3 + 2] = _a.z;

      _col.copy(ca).lerp(cb, s).multiplyScalar(0.9);
      if (ex) {
        const d = (s - pulseAt) / 0.09;
        const glow = Math.exp(-d * d);
        _col.lerp(pulseColor, glow).multiplyScalar(1 + 1.8 * glow);
      }
      g.colors[i * 3] = _col.r;
      g.colors[i * 3 + 1] = _col.g;
      g.colors[i * 3 + 2] = _col.b;
    }
    // aggiornamento in place dei buffer dei segmenti (evita nuove allocazioni a ogni fotogramma)
    const posBuf = g.geometry.attributes.instanceStart.data;
    const colBuf = g.geometry.attributes.instanceColorStart.data;
    for (let i = 0; i < GLUON_POINTS - 1; i++) {
      posBuf.array.set(g.points.subarray(i * 3, i * 3 + 6), i * 6);
      colBuf.array.set(g.colors.subarray(i * 3, i * 3 + 6), i * 6);
    }
    posBuf.needsUpdate = true;
    colBuf.needsUpdate = true;
    g.material.opacity = fade;
  }
}
