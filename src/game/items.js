// Vetreria e strumenti del simulatore: forme (profili di rivoluzione con le misure reali), collisori, capacità,
// graduazioni, etichette e contenuto. Ogni oggetto ha una mesh Three.js e un corpo Rapier con l'origine in basso al centro.
import * as THREE from 'three';
import { seg } from '../gfx/preset.js';
import { interiorSamples, rimPoints, profileVolume, interiorGeometry, liquidMaterial } from './liquid.js';

/** Profilo interno [raggio, altezza] in metri (dal fondo interno al bordo). */
const cyl = (r, y0, y1) => [[r, y0], [r, y1]];

/**
 * Definizioni. container: ha un contenuto; profile: volume interno; outer: raggio esterno e altezza; grad: tacche
 * (mL tra due tacche, mL della prima scritta); flow: portata relativa del versamento (collo stretto < 1);
 * drops: versa a gocce; mass in kg; breakable: si rompe negli urti forti.
 */
export const DEFS = {
  beaker100: { container: true, glass: true, profile: cyl(0.024, 0.003, 0.07), outer: [0.0255, 0.07], grad: [10, 20, 100], mass: 0.06, breakable: true, spout: true },
  beaker250: { container: true, glass: true, profile: cyl(0.033, 0.004, 0.095), outer: [0.0345, 0.095], grad: [25, 50, 250], mass: 0.1, breakable: true, spout: true },
  flask250: {
    container: true, glass: true, mass: 0.12, breakable: true, outer: [0.043, 0.14], grad: [50, 50, 250], flow: 0.7,
    profile: [[0.04, 0.004], [0.04, 0.014], [0.03, 0.06], [0.016, 0.108], [0.0135, 0.116], [0.0135, 0.14]],
  },
  cylinder100: {
    container: true, glass: true, mass: 0.13, breakable: true, outer: [0.0142, 0.25], foot: [0.038, 0.012], grad: [1, 10, 100], spout: true,
    profile: cyl(0.0128, 0.012, 0.25),
  },
  bottle: {
    container: true, glass: true, mass: 0.28, breakable: true, outer: [0.04, 0.18], label: true, flow: 0.45, brown: true,
    profile: [[0.038, 0.005], [0.038, 0.128], [0.03, 0.142], [0.0125, 0.152], [0.0115, 0.18]],
  },
  washbottle: {
    container: true, glass: false, mass: 0.05, breakable: false, outer: [0.038, 0.15], label: true, flow: 0.28, plastic: '#eef4f8', nozzle: true,
    profile: [[0.036, 0.003], [0.036, 0.13], [0.012, 0.145], [0.006, 0.15]],
  },
  dropper: {
    container: true, glass: true, mass: 0.04, breakable: true, outer: [0.017, 0.085], label: true, drops: true, brown: true,
    profile: [[0.015, 0.003], [0.015, 0.058], [0.006, 0.068], [0.004, 0.085]],
  },
  jar: { container: true, glass: false, mass: 0.04, breakable: false, outer: [0.036, 0.085], label: true, flow: 1.2, plastic: '#f4f6f8', profile: cyl(0.034, 0.004, 0.085), wide: true },
  spatula: { tool: true, mass: 0.03, size: [0.19, 0.004, 0.012] },
  loop: { tool: true, mass: 0.02, size: [0.21, 0.008, 0.008] },
  towel: { tool: true, mass: 0.004, size: [0.07, 0.018, 0.06], absorbs: 40 },
  strip: { tool: true, mass: 0.001, size: [0.075, 0.002, 0.007] },
  extinguisher: { tool: true, mass: 4, size: [0.075, 0.5, 0.075] },
  shards: { tool: true, mass: 0.05, size: [0.07, 0.01, 0.07] },
};

for (const def of Object.values(DEFS)) {
  if (!def.container) continue;
  def.capacity = profileVolume(def.profile) * 1e6; // mL
  def.samples = interiorSamples(def.profile);
  def.rim = rimPoints(def.profile, def.wide || def.spout ? 20 : 12);
  def.rimR = def.profile[def.profile.length - 1][0];
  def.height = def.outer[1];
  def.area = Math.PI * (def.rimR * 100) ** 2; // cm²
  def.heatC = def.mass * 1000 * (def.glass ? 0.84 : 1.6); // J/K
}

// ------------------------------------------------------------------ materiali condivisi

let MATS = null;
export function itemMaterials(G, envMap) {
  if (MATS) return MATS;
  const glass = G.physical
    ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.003, ior: 1.47, transparent: true, opacity: 1, envMapIntensity: 1.2, side: THREE.DoubleSide, depthWrite: false })
    : new THREE.MeshStandardMaterial({ color: 0xe8f4ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.2, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false });
  const brown = G.physical
    ? new THREE.MeshPhysicalMaterial({ color: 0x8a4a1a, metalness: 0, roughness: 0.08, transmission: 0.7, thickness: 0.004, ior: 1.5, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    : new THREE.MeshStandardMaterial({ color: 0x6a3510, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
  MATS = {
    glass,
    brown,
    steel: new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 0.9, roughness: 0.28 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.7 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.95 }),
    red: new THREE.MeshStandardMaterial({ color: 0xc8161d, roughness: 0.35, metalness: 0.2 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.6 }),
    cap: new THREE.MeshStandardMaterial({ color: 0x23395d, roughness: 0.5 }),
    plastic: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false }),
    nichrome: new THREE.MeshStandardMaterial({ color: 0x9a9286, metalness: 0.8, roughness: 0.4 }),
  };
  if (envMap) for (const m of Object.values(MATS)) if (m.isMaterial) m.envMap = envMap;
  return MATS;
}

// ------------------------------------------------------------------ geometrie

/** Parete di vetro: profilo esterno e interno uniti al bordo, chiusa sul fondo. */
function vesselGeometry(def) {
  const t = def.glass ? 0.0016 : 0.002;
  const inner = def.profile;
  const pts = [new THREE.Vector2(0, 0)];
  const outer = inner.map(([r, y], i) => [r + t, i === 0 ? 0 : y]);
  outer[0][1] = 0;
  for (const [r, y] of outer) pts.push(new THREE.Vector2(r, y));
  for (let k = inner.length - 1; k >= 0; k--) pts.push(new THREE.Vector2(inner[k][0], inner[k][1]));
  pts.push(new THREE.Vector2(0, inner[0][1]));
  return new THREE.LatheGeometry(pts, seg(32, 18));
}

/** Tacche e numeri della graduazione disegnati su una texture con trasparenza. */
function gradTexture(def) {
  const [step, labelEvery, max] = def.grad;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const g = canvas.getContext('2d');
  const top = def.profile[def.profile.length - 1][1];
  const bottom = def.profile[0][1];
  const r = def.profile[0][0];
  const toY = (ml) => {
    const h = bottom + (ml * 1e-6) / (Math.PI * r * r);
    return canvas.height * (1 - h / top);
  };
  g.strokeStyle = 'rgba(255,255,255,0.92)';
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.font = '600 26px "IBM Plex Sans", sans-serif';
  g.lineWidth = 3;
  for (let ml = step; ml <= max + 1e-9; ml += step) {
    const y = toY(ml);
    const major = Math.abs(ml / labelEvery - Math.round(ml / labelEvery)) < 1e-6;
    g.beginPath();
    g.moveTo(16, y);
    g.lineTo(major ? 92 : 56, y);
    g.stroke();
    if (major) g.fillText(String(ml), 100, y + 9);
  }
  g.font = '500 22px "IBM Plex Sans", sans-serif';
  g.fillText('mL', 100, toY(max) - 30);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Etichetta di un reagente: nome, formula, concentrazione e pittogramma di pericolo. */
export function labelTexture({ title, formula = '', sub = '', hazard = null, color = '#ffffff' }) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#1d2733';
  g.fillRect(0, 0, 512, 14);
  g.fillStyle = '#10161e';
  g.font = '700 50px "IBM Plex Sans", sans-serif';
  fitText(g, title, 24, 84, hazard ? 360 : 464);
  g.font = '500 44px "IBM Plex Mono", monospace';
  fitText(g, formula, 24, 148, hazard ? 360 : 464);
  g.fillStyle = '#3b4756';
  g.font = '500 32px "IBM Plex Sans", sans-serif';
  fitText(g, sub, 24, 208, 464);
  if (hazard) drawHazard(g, 440, 120, 56, hazard);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function fitText(g, text, x, y, w) {
  let s = String(text);
  while (s.length > 3 && g.measureText(s).width > w) s = s.slice(0, -2) + '…';
  g.fillText(s, x, y);
}

/** Pittogramma GHS semplificato: rombo rosso con un simbolo. */
function drawHazard(g, cx, cy, r, kind) {
  g.save();
  g.translate(cx, cy);
  g.rotate(Math.PI / 4);
  g.fillStyle = '#fff';
  g.strokeStyle = '#d4141c';
  g.lineWidth = 9;
  g.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
  g.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
  g.restore();
  g.fillStyle = '#111';
  g.font = '700 46px "IBM Plex Sans", sans-serif';
  g.textAlign = 'center';
  g.fillText({ corrosive: '⚗', toxic: '☠', flammable: '🔥', irritant: '!', environment: '♣' }[kind] ?? '!', cx, cy + 16);
  g.textAlign = 'left';
}

// ------------------------------------------------------------------ creazione

let nextId = 1;

/**
 * Crea un oggetto del gioco.
 * @param {{scene: THREE.Scene, physics: import('./physics.js').Physics, G: object, mats: object}} env
 * @param {string} kind chiave di DEFS
 * @param {{pos: THREE.Vector3, quat?: THREE.Quaternion, mixture?: object, label?: object, name?: string}} opts
 */
export function createItem(env, kind, opts) {
  const def = DEFS[kind];
  const { scene, physics, mats, G } = env;
  const group = new THREE.Group();
  group.name = kind;
  const item = {
    id: nextId++, kind, def, mesh: group, body: null, mixture: opts.mixture ?? null, name: opts.name ?? kind,
    label: opts.label ?? null, dirty: false, hits: [], heat: 0, data: {},
  };
  const shadow = (m) => {
    m.castShadow = Boolean(G.shadows);
    m.receiveShadow = false;
    return m;
  };

  if (def.container) {
    const glassMat = def.plastic ? mats.plastic(def.plastic) : def.brown ? mats.brown : mats.glass;
    const vessel = shadow(new THREE.Mesh(vesselGeometry(def), glassMat));
    vessel.renderOrder = 3;
    group.add(vessel);
    item.hits.push(vessel);
    // contenuto: solido (opaco) e liquido (trasparente), tagliati al loro livello
    const geo = interiorGeometry(def.profile, seg(28, 14));
    item.solidMesh = new THREE.Mesh(geo, liquidMaterial({ physical: false }));
    item.solidMesh.material.transparent = false;
    item.solidMesh.material.opacity = 1;
    item.solidMesh.material.depthWrite = true;
    item.solidMesh.material.roughness = 0.9;
    item.solidMesh.material.userData.uniforms.uSurfaceAlpha.value = 1;
    item.solidMesh.renderOrder = 1;
    item.liquidMesh = new THREE.Mesh(geo, liquidMaterial({ physical: G.physical }));
    item.liquidMesh.renderOrder = 2;
    item.solidMesh.visible = item.liquidMesh.visible = false;
    group.add(item.solidMesh, item.liquidMesh);
    if (def.foot) {
      const foot = shadow(new THREE.Mesh(new THREE.CylinderGeometry(def.foot[0], def.foot[0], def.foot[1], 6), glassMat));
      foot.position.y = def.foot[1] / 2;
      group.add(foot);
      item.hits.push(foot);
    }
    if (def.grad) {
      const top = def.profile[def.profile.length - 1][1];
      const r = def.outer[0] + 0.0004;
      const gmesh = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, top, seg(24, 12), 1, true, Math.PI * 0.55, Math.PI * 0.5),
        new THREE.MeshBasicMaterial({ map: gradTexture(def), transparent: true, depthWrite: false, side: THREE.DoubleSide }),
      );
      gmesh.position.y = top / 2;
      gmesh.renderOrder = 4;
      group.add(gmesh);
    }
    if (def.label && opts.label) {
      const top = def.profile[def.profile.length - 1][1];
      const h = Math.min(0.06, top * 0.42);
      const r = def.outer[0] + 0.0012;
      const lmesh = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, kind === 'dropper' ? 0.03 : h, seg(24, 12), 1, true, Math.PI * 0.3, Math.PI * 0.9),
        new THREE.MeshStandardMaterial({ map: labelTexture(opts.label), roughness: 0.7, side: THREE.FrontSide }),
      );
      lmesh.position.y = kind === 'dropper' ? 0.03 : top * 0.42;
      lmesh.renderOrder = 4;
      group.add(lmesh);
      item.hits.push(lmesh);
    }
    if (kind === 'dropper') {
      // tettarella di gomma e pipetta
      const bulb = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.007, 0.03, 12), mats.black));
      bulb.position.y = 0.1;
      group.add(bulb);
      item.hits.push(bulb);
    }
    if (def.nozzle) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16), mats.plastic('#d8e4ee'));
      cap.position.y = 0.152;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.06, 8), mats.plastic('#d8e4ee'));
      tube.position.set(0, 0.17, -0.012);
      tube.rotation.x = -0.6;
      group.add(cap, tube);
    }
    // collisore: cilindro esterno (con il piede per il cilindro graduato), scafo convesso per la beuta e le bottiglie
    const [R, H] = def.outer;
    let shapes;
    if (def.foot) shapes = [{ type: 'cylinder', hh: def.foot[1] / 2, r: def.foot[0] * 0.95, y: def.foot[1] / 2 }, { type: 'cylinder', hh: H / 2, r: R, y: H / 2 }];
    else if (def.profile.length > 2) shapes = [{ type: 'hull', points: hullPoints(def) }];
    else shapes = [{ type: 'cylinder', hh: H / 2, r: R, y: H / 2 }];
    const mass = def.mass + (item.mixture ? item.mixture.mass / 1000 : 0);
    item.body = physics.dynamic({ pos: opts.pos, quat: opts.quat, shapes, mass, owner: item, events: true, friction: 0.6 });
  } else {
    buildTool(item, env, opts);
  }
  item.mesh.position.copy(opts.pos);
  if (opts.quat) item.mesh.quaternion.copy(opts.quat);
  scene.add(group);
  return item;
}

/** Punti dello scafo convesso dal profilo esterno (8 lati). */
function hullPoints(def) {
  const t = 0.0016;
  const pts = [];
  const prof = [[def.profile[0][0] + t, 0], ...def.profile.slice(1).map(([r, y]) => [r + t, y])];
  for (const [r, y] of prof) for (let k = 0; k < 8; k++) pts.push(Math.cos((k / 8) * Math.PI * 2) * r, y, Math.sin((k / 8) * Math.PI * 2) * r);
  return new Float32Array(pts);
}

function buildTool(item, env, opts) {
  const { def, kind, mesh: group } = item;
  const { mats, physics, G } = env;
  const add = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = Boolean(G.shadows);
    group.add(m);
    item.hits.push(m);
    return m;
  };
  const [sx, sy, sz] = def.size;
  let shapes = [{ type: 'box', hx: sx / 2, hy: sy / 2, hz: sz / 2, y: sy / 2 }];
  if (kind === 'spatula') {
    add(new THREE.BoxGeometry(0.13, 0.0025, 0.006), mats.steel, -0.03, 0.002, 0);
    const spoon = add(new THREE.CylinderGeometry(0.009, 0.009, 0.0025, 16), mats.steel, 0.075, 0.002, 0);
    spoon.scale.set(1.3, 1, 1);
    item.heap = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
    item.heap.position.set(0.075, 0.003, 0);
    item.heap.visible = false;
    group.add(item.heap);
  } else if (kind === 'loop') {
    add(new THREE.CylinderGeometry(0.0045, 0.0045, 0.1, 10), mats.wood, -0.05, 0.004, 0).rotation.z = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.0008, 0.0008, 0.1, 6), mats.nichrome, 0.05, 0.004, 0).rotation.z = Math.PI / 2;
    item.tip = add(new THREE.TorusGeometry(0.003, 0.0007, 6, 12), mats.nichrome, 0.102, 0.004, 0);
    item.tip.rotation.y = Math.PI / 2;
  } else if (kind === 'towel') {
    const geo = new THREE.IcosahedronGeometry(0.03, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + Math.sin(i * 7.1) * 0.15), p.getY(i) * 0.35, p.getZ(i) * (1 + Math.cos(i * 3.7) * 0.15));
    geo.computeVertexNormals();
    item.paper = add(geo, mats.paper.clone(), 0, 0.009, 0);
    shapes = [{ type: 'box', hx: 0.028, hy: 0.009, hz: 0.028, y: 0.009 }];
  } else if (kind === 'strip') {
    add(new THREE.BoxGeometry(0.05, 0.0012, 0.006), mats.paper, -0.012, 0.001, 0);
    item.pad = add(new THREE.BoxGeometry(0.022, 0.0016, 0.0062), new THREE.MeshStandardMaterial({ color: 0xe8a838, roughness: 0.9 }), 0.025, 0.001, 0);
  } else if (kind === 'extinguisher') {
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.42, seg(20, 12)), mats.red, 0, 0.21, 0);
    add(new THREE.SphereGeometry(0.075, seg(20, 12), 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.red, 0, 0.42, 0);
    add(new THREE.BoxGeometry(0.03, 0.06, 0.05), mats.black, 0, 0.5, 0);
    const horn = add(new THREE.CylinderGeometry(0.035, 0.012, 0.14, 12), mats.black, 0, 0.47, 0.09);
    horn.rotation.x = Math.PI / 2;
    shapes = [{ type: 'cylinder', hh: 0.25, r: 0.075, y: 0.25 }];
  } else if (kind === 'shards') {
    const geo = new THREE.TetrahedronGeometry(0.018, 0);
    for (let k = 0; k < 8; k++) {
      const s = add(geo, env.mats.glass, Math.cos(k * 2.4) * 0.025 * (k % 3), 0.006, Math.sin(k * 2.4) * 0.025 * (k % 3));
      s.scale.set(1 + (k % 2), 0.25, 0.6 + (k % 3) * 0.3);
      s.rotation.set(k, k * 1.7, k * 0.3);
      s.renderOrder = 3;
    }
    shapes = [{ type: 'box', hx: 0.035, hy: 0.006, hz: 0.035, y: 0.006 }];
  }
  item.body = physics.dynamic({ pos: opts.pos, quat: opts.quat, shapes, mass: def.mass, owner: item, friction: 0.9, events: kind === 'extinguisher' });
}

/** Dopo createItem per gli strumenti la posizione va impostata sul corpo. */
export function placeItem(item, pos, quat) {
  item.body.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
  if (quat) item.body.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
  item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  syncItem(item);
}

/** Copia posizione e rotazione dal corpo alla mesh. */
export function syncItem(item) {
  const t = item.body.translation();
  const r = item.body.rotation();
  item.mesh.position.set(t.x, t.y, t.z);
  item.mesh.quaternion.set(r.x, r.y, r.z, r.w);
  item.mesh.updateMatrixWorld();
}

export function disposeItem(item, env) {
  env.physics.remove(item.body);
  item.mesh.removeFromParent();
  item.mesh.traverse((o) => {
    o.geometry?.dispose?.();
    if (o.material && o.material !== env.mats.glass && o.material !== env.mats.brown && !Object.values(env.mats).includes(o.material)) {
      o.material.map?.dispose?.();
      o.material.dispose?.();
    }
  });
}

/** Massa totale (g): vetro più contenuto (o carico dello strumento). */
export function itemMassGrams(item) {
  return item.def.mass * 1000 + (item.mixture ? item.mixture.mass : 0) + (item.load ? item.load.mass : 0);
}
