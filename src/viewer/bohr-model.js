// Modello di Bohr: gusci concentrici (anelli) con il numero corretto di elettroni per guscio.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SHELL_LETTERS } from '../chem/electron-config.js';
import { seg } from '../gfx/preset.js';

export const ELECTRON_R = 0.3;
const HIGHLIGHT = new THREE.Color(2.4, 2.4, 2.4);
const SELECTED = new THREE.Color(1.5, 1.5, 1.5);
const NORMAL = new THREE.Color(1, 1, 1);

// Inclinazione dei piani orbitali per guscio (radianti): danno profondità senza confondere la lettura.
const TILT_X = [0.0, 0.42, -0.3, 0.68, -0.55, 0.22, -0.82];
const TILT_Z = [0.0, 0.26, 0.62, -0.38, 0.14, -0.7, 0.48];

const electronGeometry = new THREE.SphereGeometry(ELECTRON_R, seg(20), seg(14));

/** Raggi dei gusci in funzione del raggio massimo del nucleo. */
export function shellRadii(shellCount, nucleusR) {
  const r0 = Math.max(3.4, nucleusR + 2.8);
  return Array.from({ length: shellCount }, (_, i) => r0 + i * 2.5);
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

export class BohrModel {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'bohr';
    scene.add(this.group);
    this.ringFade = { cur: 0, target: 1 };
    this.electronFade = { cur: 0, target: 1 };
    this.dim = { cur: 1, target: 1 };
    this.highlight = -1;
    this.selected = -1;
  }

  /**
   * @param {object[]} electrons elenco con numeri quantici (electronList)
   * @param {number[]} radii raggi dei gusci
   */
  build(electrons, radii) {
    this.dispose();
    this.radii = radii;
    this.electrons = electrons;
    this.ringMaterial = new THREE.MeshBasicMaterial({ color: 0x5ce1ff, transparent: true, opacity: 0, depthWrite: false });
    this.electronMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8f6ff, emissive: 0x2fd4ff, emissiveIntensity: 0.95, roughness: 0.3, transparent: true, opacity: 0,
    });

    this.shells = radii.map((r, i) => {
      const n = i + 1;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT_X[i], 0, TILT_Z[i]));
      const u = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
      const v = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, seg(8, 4), seg(220, 96)), this.ringMaterial);
      ring.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)));
      this.group.add(ring);

      const members = electrons.map((e, idx) => ({ e, idx })).filter(({ e }) => e.n === n);
      const div = document.createElement('div');
      div.className = 'label3d label3d--shell';
      div.innerHTML = `<b>${SHELL_LETTERS[i]}</b> ${members.length} e⁻`;
      const label = new CSS2DObject(div);
      // etichetta nel punto più a destra dell'anello: i gusci si leggono in fila dal nucleo verso l'esterno
      const a = Math.atan2(v.x, u.x);
      label.position.copy(u.clone().multiplyScalar(Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r)).add(new THREE.Vector3(0.9, 0.6, 0));
      this.group.add(label);

      return {
        n, r, u, v, ring, label,
        members: members.map(({ idx }) => idx),
        omega: 0.9 / n ** 1.15, // gusci interni più veloci
        phase: i * 0.9,
        appear: 0,
      };
    });

    this.slot = new Map(); // indice elettrone → posizione nel suo guscio
    for (const s of this.shells) s.members.forEach((idx, k) => this.slot.set(idx, { shell: s, k, count: s.members.length }));

    this.mesh = new THREE.InstancedMesh(electronGeometry, this.electronMaterial, Math.max(1, electrons.length));
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < this.mesh.count; i++) this.mesh.setColorAt(i, NORMAL);
    this.mesh.count = electrons.length;
    this.mesh.frustumCulled = false;
    this.mesh.userData.kind = 'electron';
    this.mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), (radii.at(-1) ?? 4) + 1);
    this.group.add(this.mesh);
    this.introTime = 0;
  }

  get outerRadius() {
    return this.radii?.at(-1) ?? 4;
  }

  setRingsVisible(on) {
    this.ringFade.target = on ? 1 : 0;
  }

  setElectronsVisible(on) {
    this.electronFade.target = on ? 1 : 0;
  }

  setLabelsVisible(on) {
    this.labelsOn = on;
  }

  /** Attenua gusci ed elettroni (es. quando il nucleo è esploso). */
  setDimmed(on) {
    this.dim.target = on ? 0.22 : 1;
  }

  /** Posizione dell'elettrone i al tempo t (serve anche alla camera nella fase 3). */
  electronPosition(i, time, out = new THREE.Vector3()) {
    const { shell, k, count } = this.slot.get(i);
    const a = (2 * Math.PI * k) / count + shell.phase + shell.omega * time;
    return out.copy(shell.u).multiplyScalar(Math.cos(a) * shell.r).addScaledVector(shell.v, Math.sin(a) * shell.r);
  }

  update(dt, time) {
    if (!this.mesh) return;
    const ease = (o, rate = 4) => (o.cur += (o.target - o.cur) * (1 - Math.exp(-dt * rate)));
    ease(this.ringFade);
    ease(this.electronFade);
    ease(this.dim);
    this.introTime += dt;

    this.ringMaterial.opacity = 0.34 * this.ringFade.cur * this.dim.cur;
    this.electronMaterial.opacity = this.electronFade.cur * Math.max(this.dim.cur, 0.35);
    this.mesh.visible = this.electronFade.cur > 0.01;
    for (const s of this.shells) {
      s.ring.visible = this.ringFade.cur > 0.01;
      s.label.visible = Boolean(this.labelsOn) && (this.ringFade.cur > 0.5 || this.electronFade.cur > 0.5) && this.dim.target === 1;
    }

    for (let i = 0; i < this.electrons.length; i++) {
      const { shell } = this.slot.get(i);
      // entrata: i gusci compaiono uno dopo l'altro, dall'interno verso l'esterno
      const appearAt = 0.55 + shell.n * 0.16;
      const grow = THREE.MathUtils.clamp((this.introTime - appearAt) / 0.5, 0, 1);
      this.electronPosition(i, time, _p);
      const big = i === this.selected ? 1.3 : i === this.highlight ? 1.5 : 1;
      _s.setScalar(Math.max(0.0001, grow * big));
      this.mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  setHighlight(index) {
    this.highlight = index ?? -1;
    this.#repaint();
  }

  /** Elettrone selezionato (-1 per nessuno). */
  setSelected(index) {
    this.selected = index ?? -1;
    this.#repaint();
  }

  #repaint() {
    if (!this.mesh) return;
    for (let i = 0; i < this.mesh.count; i++) {
      this.mesh.setColorAt(i, i === this.selected ? SELECTED : i === this.highlight ? HIGHLIGHT : NORMAL);
    }
    this.mesh.instanceColor.needsUpdate = true;
  }

  dispose() {
    if (!this.shells) return;
    for (const s of this.shells) {
      s.ring.geometry.dispose();
      s.label.element.remove();
    }
    this.group.clear();
    this.mesh?.dispose();
    this.ringMaterial?.dispose();
    this.electronMaterial?.dispose();
    this.shells = null;
    this.mesh = null;
    this.highlight = -1;
    this.selected = -1;
  }
}
