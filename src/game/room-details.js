// Dettagli dell'aula (fase G8): armadio dei reagenti con le ante di vetro, armadio di sicurezza giallo per gli
// infiammabili, orologio con l'ora vera, cartelli di sicurezza (stile ISO 7010), vista dalle finestre, macchie e usura
// sui banconi e sul pavimento. Solo arredo: niente si apre, ma gli armadi hanno il loro collisore.
// Tutto è disegnato nel codice (Canvas), come il resto della stanza.
import * as THREE from 'three';
import { FAMILIES, FAMILY_ORDER } from './stock.js';
import { drawGhs } from './items.js';

/** Posizioni (metri) lungo la parete nord, ai lati della lavagna, e i cartelli. */
export const DETAILS = {
  reagentCabinet: { x: -3.4, w: 1.2, h: 1.9, d: 0.4 },
  safetyCabinet: { x: 3.35, w: 1.0, h: 1.6, d: 0.5 },
  clock: { x: 0, y: 2.7, r: 0.16 },
};

/** Testi dei cartelli (la vista li passa tradotti con setSigns). */
export const SIGN_KEYS = ['goggles', 'coat', 'food', 'exit', 'extinguisher', 'shower', 'flammable', 'reagents'];

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function texOf(c) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Testo su una o due righe, rimpicciolito finché sta nella larghezza. */
function caption(g, text, cx, y, w, size, color) {
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const words = String(text).split(' ');
  let lines = [String(text)];
  let px = size;
  g.font = `700 ${px}px "IBM Plex Sans", sans-serif`;
  if (g.measureText(text).width > w && words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  while (px > 10 && lines.some((l) => g.measureText(l).width > w)) {
    px -= 1;
    g.font = `700 ${px}px "IBM Plex Sans", sans-serif`;
  }
  lines.forEach((l, i) => g.fillText(l, cx, y + (i - (lines.length - 1) / 2) * px * 1.1));
}

// ------------------------------------------------------------------ pittogrammi dei cartelli (su 100 × 100)

/** Occhiali di protezione (obbligo M004): due lenti unite dal ponte, l'elastico dietro. */
function goggles(g) {
  g.fillStyle = '#fff';
  g.beginPath();
  g.roundRect(18, 38, 28, 22, 9);
  g.roundRect(54, 38, 28, 22, 9);
  g.fill();
  g.fillRect(44, 44, 12, 6);
  g.lineWidth = 5;
  g.strokeStyle = '#fff';
  g.beginPath();
  g.moveTo(18, 48);
  g.quadraticCurveTo(8, 50, 12, 62);
  g.moveTo(82, 48);
  g.quadraticCurveTo(92, 50, 88, 62);
  g.stroke();
}

/** Camice (obbligo M010): sagoma con il colletto e i bottoni. */
function coat(g) {
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(36, 18);
  g.lineTo(64, 18);
  g.lineTo(82, 30);
  g.lineTo(78, 56);
  g.lineTo(70, 54);
  g.lineTo(70, 84);
  g.lineTo(30, 84);
  g.lineTo(30, 54);
  g.lineTo(22, 56);
  g.lineTo(18, 30);
  g.closePath();
  g.fill();
  g.fillStyle = '#1f5fb4';
  g.beginPath();
  g.moveTo(42, 18);
  g.lineTo(50, 36);
  g.lineTo(58, 18);
  g.closePath();
  g.fill();
  for (const y of [46, 58, 70]) {
    g.beginPath();
    g.arc(50, y, 2.5, 0, Math.PI * 2);
    g.fill();
  }
}

/** Tazza e forchetta barrate (divieto di mangiare e bere, come P022). */
function food(g) {
  g.fillStyle = '#111';
  g.strokeStyle = '#111';
  g.lineCap = 'round';
  // tazza con il manico
  g.beginPath();
  g.moveTo(22, 40);
  g.lineTo(50, 40);
  g.lineTo(47, 70);
  g.lineTo(25, 70);
  g.closePath();
  g.fill();
  g.lineWidth = 5;
  g.beginPath();
  g.arc(51, 52, 7, -Math.PI / 2, Math.PI / 2);
  g.stroke();
  // forchetta: tre denti e il manico
  g.lineWidth = 4;
  g.beginPath();
  for (const x of [64, 70, 76]) {
    g.moveTo(x, 28);
    g.lineTo(x, 42);
  }
  g.stroke();
  g.beginPath();
  g.moveTo(63, 42);
  g.quadraticCurveTo(70, 52, 77, 42);
  g.fill();
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(70, 48);
  g.lineTo(70, 76);
  g.stroke();
}

/** Porta aperta con la freccia (uscita di emergenza E001, semplificato). */
function exit(g) {
  g.fillStyle = '#fff';
  g.fillRect(56, 16, 30, 70);
  g.fillStyle = '#1a8f3c';
  g.fillRect(61, 21, 20, 65);
  g.fillStyle = '#fff';
  // omino che corre verso la porta
  g.beginPath();
  g.arc(40, 24, 7, 0, Math.PI * 2);
  g.fill();
  g.lineCap = 'round';
  g.lineWidth = 8;
  g.strokeStyle = '#fff';
  g.beginPath();
  g.moveTo(38, 34);
  g.lineTo(34, 56);
  g.lineTo(44, 70);
  g.lineTo(42, 84);
  g.moveTo(34, 56);
  g.lineTo(22, 70);
  g.lineTo(14, 70);
  g.moveTo(37, 40);
  g.lineTo(50, 48);
  g.moveTo(37, 40);
  g.lineTo(24, 46);
  g.stroke();
}

/** Estintore (F001): bombola con la manichetta. */
function extinguisher(g) {
  g.fillStyle = '#fff';
  g.beginPath();
  g.roundRect(38, 30, 24, 56, 8);
  g.fill();
  g.fillRect(44, 20, 12, 12);
  g.lineWidth = 5;
  g.strokeStyle = '#fff';
  g.beginPath();
  g.moveTo(56, 24);
  g.lineTo(74, 24);
  g.quadraticCurveTo(82, 30, 76, 50);
  g.stroke();
}

/** Doccia di emergenza (E012): soffione e gocce sopra una persona. */
function shower(g) {
  g.fillStyle = '#fff';
  g.lineCap = 'round';
  g.strokeStyle = '#fff';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(20, 14);
  g.lineTo(62, 14);
  g.lineTo(62, 22);
  g.stroke();
  g.beginPath();
  g.moveTo(46, 30);
  g.lineTo(78, 30);
  g.lineTo(70, 22);
  g.lineTo(54, 22);
  g.closePath();
  g.fill();
  for (const [x, y] of [[52, 38], [62, 40], [72, 38], [57, 46], [67, 46]]) g.fillRect(x - 1.5, y, 3, 5);
  g.beginPath();
  g.arc(62, 56, 7, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.roundRect(54, 64, 16, 24, 4);
  g.fill();
}

/**
 * Cartello: fascia del colore della norma (blu obbligo, rosso divieto o antincendio, verde soccorso) con il
 * pittogramma e la scritta sotto.
 */
function drawSign(c, kind, text) {
  const g = c.getContext('2d');
  const { width: w, height: h } = c;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#f7f7f2';
  g.fillRect(0, 0, w, h);
  const s = w * 0.78;
  const ox = (w - s) / 2;
  const oy = w * 0.08;
  g.save();
  g.translate(ox, oy);
  g.scale(s / 100, s / 100);
  if (kind === 'goggles' || kind === 'coat') {
    g.fillStyle = '#1f5fb4';
    g.beginPath();
    g.arc(50, 50, 48, 0, Math.PI * 2);
    g.fill();
    (kind === 'goggles' ? goggles : coat)(g);
  } else if (kind === 'food') {
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(50, 50, 48, 0, Math.PI * 2);
    g.fill();
    food(g);
    g.strokeStyle = '#d0141c';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(50, 50, 43, 0, Math.PI * 2);
    g.moveTo(20, 20);
    g.lineTo(80, 80);
    g.stroke();
  } else {
    g.fillStyle = kind === 'extinguisher' ? '#d0141c' : '#1a8f3c';
    g.fillRect(0, 0, 100, 100);
    ({ exit, extinguisher, shower })[kind](g);
  }
  g.restore();
  caption(g, text, w / 2, oy + s + (h - oy - s) / 2, w * 0.9, w * 0.11, '#1d2733');
}

// ------------------------------------------------------------------ vista dalle finestre

/**
 * Panorama fuori dalle finestre della parete sud: cielo, colline lontane, un'ala della scuola con le finestre, alberi
 * e la recinzione del cortile. Un'unica immagine larga 5 m divisa tra le tre finestre (ognuna ne mostra il suo pezzo).
 * @param {number[]} xs centri delle finestre (m); w: larghezza di una finestra (m)
 * @returns {THREE.Material[]}
 */
export function outdoorViews(xs, w) {
  const c = canvasOf(2048, 512);
  const g = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  const sky = g.createLinearGradient(0, 0, 0, H * 0.7);
  sky.addColorStop(0, '#7fa9d6');
  sky.addColorStop(1, '#d6e4ee');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // qualche nuvola
  g.fillStyle = 'rgba(255,255,255,0.75)';
  for (const [x, y, r] of [[220, 90, 46], [290, 80, 60], [360, 96, 40], [1180, 60, 52], [1250, 72, 38], [1700, 110, 44], [1760, 100, 56]]) {
    g.beginPath();
    g.ellipse(x, y, r * 1.6, r * 0.6, 0, 0, Math.PI * 2);
    g.fill();
  }
  // colline
  g.fillStyle = '#8fa6b4';
  g.beginPath();
  g.moveTo(0, H * 0.58);
  for (let x = 0; x <= W; x += 64) g.lineTo(x, H * 0.55 - Math.sin(x / 260) * 30 - Math.sin(x / 97) * 10);
  g.lineTo(W, H);
  g.lineTo(0, H);
  g.fill();
  // ala della scuola
  g.fillStyle = '#c9b49a';
  g.fillRect(760, 200, 760, 190);
  g.fillStyle = '#a8432f';
  g.fillRect(740, 186, 800, 18);
  g.fillStyle = '#5b6d7c';
  for (let x = 790; x < 1500; x += 70) for (const y of [228, 300]) g.fillRect(x, y, 40, 46);
  // prato del cortile
  g.fillStyle = '#6f8f4e';
  g.fillRect(0, H * 0.74, W, H * 0.26);
  // alberi
  const tree = (x, y, r) => {
    g.fillStyle = '#5a4630';
    g.fillRect(x - 6, y, 12, r * 1.2);
    g.fillStyle = '#4f7a3a';
    for (const [dx, dy, k] of [[0, -0.2, 1], [-0.6, 0.2, 0.7], [0.6, 0.2, 0.7]]) {
      g.beginPath();
      g.arc(x + dx * r, y + dy * r, r * k, 0, Math.PI * 2);
      g.fill();
    }
  };
  for (const [x, r] of [[120, 70], [420, 90], [640, 60], [1620, 80], [1900, 95]]) tree(x, H * 0.62, r);
  // recinzione
  g.strokeStyle = '#3d4248';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, H * 0.82);
  g.lineTo(W, H * 0.82);
  for (let x = 0; x < W; x += 36) {
    g.moveTo(x, H * 0.82);
    g.lineTo(x, H * 0.92);
  }
  g.stroke();
  const left = Math.max(...xs) + w / 2;
  const span = left - (Math.min(...xs) - w / 2);
  return xs.map((x) => {
    const tex = texOf(c);
    // la finestra più a est è a sinistra di chi guarda verso sud: lì comincia l'immagine
    tex.repeat.set(w / span, 1);
    tex.offset.set((left - (x + w / 2)) / span, 0);
    return new THREE.MeshBasicMaterial({ map: tex });
  });
}

// ------------------------------------------------------------------ macchie e usura

/** Decalcomania: un piano trasparente appena sopra una superficie (non scrive la profondità). */
function decal(parent, draw, w, d, x, y, z, rot = 0, opacity = 1) {
  const c = canvasOf(128, 128);
  draw(c.getContext('2d'), 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: texOf(c), transparent: true, opacity, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.set(-Math.PI / 2, 0, rot);
  m.position.set(x, y, z);
  m.renderOrder = 1;
  parent.add(m);
  return m;
}

/** Alone bianco lasciato da un becher bagnato (calcare): un anello sfumato. */
const ring = (g, s) => {
  g.strokeStyle = 'rgba(225,228,230,0.5)';
  g.lineWidth = s * 0.05;
  g.beginPath();
  g.arc(s / 2, s / 2, s * 0.38, 0, Math.PI * 1.8);
  g.stroke();
  g.lineWidth = s * 0.02;
  g.beginPath();
  g.arc(s / 2 + 3, s / 2 - 2, s * 0.33, 0.4, Math.PI * 1.4);
  g.stroke();
};
/** Bruciatura sul piano vicino al Bunsen. */
const burn = (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(60,40,25,0.55)');
  r.addColorStop(0.6, 'rgba(50,35,25,0.25)');
  r.addColorStop(1, 'rgba(40,30,20,0)');
  g.fillStyle = r;
  g.beginPath();
  g.ellipse(s / 2, s / 2, s / 2, s * 0.36, 0.4, 0, Math.PI * 2);
  g.fill();
};
/** Macchia scolorita (una goccia di acido o di permanganato asciugata). */
const stain = (color) => (g, s) => {
  g.fillStyle = color;
  g.beginPath();
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const r = s * (0.28 + Math.sin(k * 2.3) * 0.08);
    g.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
};
/** Graffi sottili. */
const scratches = (g, s) => {
  g.strokeStyle = 'rgba(200,205,210,0.35)';
  g.lineWidth = 1.2;
  for (let k = 0; k < 7; k++) {
    const y = 20 + k * 13;
    g.beginPath();
    g.moveTo(10 + k * 5, y);
    g.lineTo(s - 20 + (k % 3) * 4, y + 8 - k * 2);
    g.stroke();
  }
};
/** Strisciata di suole sul linoleum. */
const scuff = (g, s) => {
  g.strokeStyle = 'rgba(30,28,26,0.35)';
  g.lineCap = 'round';
  g.lineWidth = s * 0.07;
  g.beginPath();
  g.moveTo(s * 0.15, s * 0.6);
  g.quadraticCurveTo(s * 0.5, s * 0.35, s * 0.85, s * 0.45);
  g.stroke();
};

/**
 * Costruisce i dettagli. Riceve gli aiuti di room.js (mesh, scatole, materiali) per avere le stesse ombre e lo
 * stesso stile del resto dell'aula.
 * @returns {{update: (dt: number) => void, setSigns: (labels: Record<string, string>) => void}}
 */
export function buildDetails({ group, physics, box, solid, std, M, ROOM, LAYOUT, BENCH_Y }) {
  const { W, D } = ROOM;
  const north = -D / 2;

  // -------------------------------------------------- armadio dei reagenti con le ante di vetro
  const rc = DETAILS.reagentCabinet;
  const rcZ = north + rc.d / 2 + 0.01;
  const frame = std({ color: 0x5c6670, roughness: 0.55 });
  solid(rc.w, 0.04, rc.d, frame, rc.x, 0.02, rcZ);
  physics.box(rc.x, rc.h / 2, rcZ, rc.w / 2, rc.h / 2, rc.d / 2);
  box(rc.w, rc.h, 0.02, frame, rc.x, rc.h / 2, north + 0.02, { cast: false });
  for (const sx of [-1, 1]) box(0.03, rc.h, rc.d, frame, rc.x + sx * (rc.w / 2 - 0.015), rc.h / 2, rcZ);
  box(rc.w, 0.03, rc.d, frame, rc.x, rc.h - 0.015, rcZ);
  // ripiani e barattoli: un InstancedMesh per i corpi e uno per i tappi (colori delle famiglie)
  const shelves = [0.42, 0.82, 1.22, 1.6];
  for (const y of shelves) box(rc.w - 0.06, 0.02, rc.d - 0.04, frame, rc.x, y - 0.01, rcZ - 0.01, { cast: false });
  const jars = [];
  shelves.forEach((y, row) => {
    // in fila, con le famiglie mescolate e qualche bottiglia alta o ambrata (sempre le stesse a ogni avvio)
    for (let k = 0, x = rc.x - rc.w / 2 + 0.08; x < rc.x + rc.w / 2 - 0.06; k++, x += 0.1) {
      const n = k + row * 5;
      const tall = (k + row) % 3 === 0;
      jars.push({ x, y, z: rcZ - 0.04 + ((n * 7) % 3) * 0.04, h: tall ? 0.2 : 0.13, r: tall ? 0.033 : 0.04, cap: FAMILIES[FAMILY_ORDER[(n * 5) % FAMILY_ORDER.length]], amber: n % 4 === 1 });
    }
  });
  const body = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 14), std({ roughness: 0.3, metalness: 0, transparent: true, opacity: 0.75 }), jars.length);
  const caps = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 14), std({ roughness: 0.5 }), jars.length);
  const mtx = new THREE.Matrix4();
  const col = new THREE.Color();
  jars.forEach((j, i) => {
    mtx.makeScale(j.r, j.h, j.r).setPosition(j.x, j.y + j.h / 2, j.z);
    body.setMatrixAt(i, mtx);
    body.setColorAt(i, col.set(j.amber ? 0x8a5a22 : 0xc8d8dc));
    mtx.makeScale(j.r * 0.8, 0.025, j.r * 0.8).setPosition(j.x, j.y + j.h + 0.012, j.z);
    caps.setMatrixAt(i, mtx);
    caps.setColorAt(i, col.set(j.cap));
  });
  group.add(body, caps);
  // due ante di vetro con le maniglie
  for (const sx of [-1, 1]) {
    const x = rc.x + sx * rc.w / 4;
    box(rc.w / 2 - 0.02, rc.h - 0.1, 0.008, M.glassPane, x, rc.h / 2 + 0.02, rcZ + rc.d / 2, { cast: false, receive: false });
    box(rc.w / 2 - 0.01, 0.03, 0.02, frame, x, 0.08, rcZ + rc.d / 2, { cast: false });
    box(rc.w / 2 - 0.01, 0.03, 0.02, frame, x, rc.h - 0.04, rcZ + rc.d / 2, { cast: false });
    box(0.012, 0.12, 0.02, M.steel, rc.x + sx * 0.04, 1.0, rcZ + rc.d / 2 + 0.015);
  }

  // -------------------------------------------------- armadio di sicurezza giallo (infiammabili)
  const sc = DETAILS.safetyCabinet;
  const scZ = north + sc.d / 2 + 0.01;
  const yellow = std({ color: 0xf2b705, roughness: 0.45 });
  solid(sc.w, sc.h, sc.d, yellow, sc.x, sc.h / 2, scZ);
  box(0.006, sc.h - 0.06, 0.006, std({ color: 0x3d3a30 }), sc.x, sc.h / 2, scZ + sc.d / 2 + 0.002, { cast: false });
  for (const sx of [-1, 1]) box(0.015, 0.16, 0.025, M.darkSteel, sc.x + sx * 0.05, 0.95, scZ + sc.d / 2 + 0.012);
  box(sc.w, 0.05, sc.d + 0.02, std({ color: 0x2b2d31 }), sc.x, 0.025, scZ);

  // -------------------------------------------------- orologio da parete (ora vera)
  const ck = DETAILS.clock;
  const face = canvasOf(256, 256);
  {
    const g = face.getContext('2d');
    g.fillStyle = '#f4f2ea';
    g.beginPath();
    g.arc(128, 128, 124, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1d2733';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '600 30px "IBM Plex Sans", sans-serif';
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      g.fillText(String(h), 128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92);
    }
    for (let m = 0; m < 60; m++) {
      const a = (m / 60) * Math.PI * 2;
      const r0 = m % 5 ? 112 : 106;
      g.lineWidth = m % 5 ? 2 : 4;
      g.strokeStyle = '#1d2733';
      g.beginPath();
      g.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0);
      g.lineTo(128 + Math.sin(a) * 118, 128 - Math.cos(a) * 118);
      g.stroke();
    }
  }
  const clock = new THREE.Group();
  clock.position.set(ck.x, ck.y, north + 0.03);
  group.add(clock);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(ck.r + 0.015, ck.r + 0.015, 0.04, 40), std({ color: 0x2b2d31, roughness: 0.4 }));
  rim.rotation.x = Math.PI / 2;
  clock.add(rim);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(ck.r, 40), new THREE.MeshStandardMaterial({ map: texOf(face), roughness: 0.7 }));
  dial.position.z = 0.021;
  clock.add(dial);
  const hand = (len, wid, color, z) => {
    const pivot = new THREE.Group();
    pivot.position.z = z;
    const m = new THREE.Mesh(new THREE.BoxGeometry(wid, len, 0.004), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
    m.position.y = len / 2 - 0.015;
    pivot.add(m);
    clock.add(pivot);
    return pivot;
  };
  const hours = hand(ck.r * 0.55, 0.012, 0x1d2733, 0.026);
  const minutes = hand(ck.r * 0.8, 0.008, 0x1d2733, 0.03);
  const seconds = hand(ck.r * 0.85, 0.003, 0xd0141c, 0.034);

  // -------------------------------------------------- cartelli di sicurezza
  // [chiave, posizione, rotazione, larghezza]
  const signSpots = [
    ['goggles', [-2.35, 2.05, north + 0.012], 0, 0.3],
    ['food', [-2.35, 1.55, north + 0.012], 0, 0.3],
    ['coat', [2.35, 2.05, north + 0.012], 0, 0.3],
    ['flammable', [DETAILS.safetyCabinet.x, 1.25, north + DETAILS.safetyCabinet.d + 0.013], 0, 0.34],
    ['reagents', [DETAILS.reagentCabinet.x, 1.98, north + DETAILS.reagentCabinet.d + 0.02], 0, 0.5],
    ['exit', [3.5, 2.35, D / 2 - 0.02], Math.PI, 0.36],
    ['extinguisher', [W / 2 - 0.012, 1.25, LAYOUT.extinguisher.z], -Math.PI / 2, 0.28],
    ['shower', [W / 2 - 0.012, 2.5, LAYOUT.shower.z], -Math.PI / 2, 0.3],
  ];
  const signs = signSpots.map(([key, [x, y, z], rot, w]) => {
    const wide = key === 'reagents';
    const c = canvasOf(256, wide ? 64 : key === 'flammable' ? 300 : 340);
    const tex = texOf(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, (w * c.height) / c.width), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    m.position.set(x, y, z);
    m.rotation.y = rot;
    group.add(m);
    return { key, c, tex };
  });

  /** Testi dei cartelli nella lingua dell'interfaccia. */
  const setSigns = (labels) => {
    for (const s of signs) {
      const text = labels[s.key] ?? '';
      if (s.key === 'reagents') {
        const g = s.c.getContext('2d');
        g.fillStyle = '#1d2733';
        g.fillRect(0, 0, s.c.width, s.c.height);
        caption(g, text.toUpperCase(), s.c.width / 2, s.c.height / 2, s.c.width * 0.9, 34, '#f1efe8');
      } else if (s.key === 'flammable') {
        const g = s.c.getContext('2d');
        g.fillStyle = '#f2b705';
        g.fillRect(0, 0, s.c.width, s.c.height);
        drawGhs(g, 'GHS02', s.c.width / 2, 110, 190);
        caption(g, text.toUpperCase(), s.c.width / 2, 250, s.c.width * 0.9, 34, '#1d2733');
      } else drawSign(s.c, s.key, text);
      s.tex.needsUpdate = true;
    }
  };

  // -------------------------------------------------- macchie e usura
  const top = BENCH_Y + 0.0006;
  const A = LAYOUT.benchA;
  const B = LAYOUT.benchB;
  decal(group, ring, 0.11, 0.11, A.x - 0.95, top, A.z + 0.15, 0.3);
  decal(group, ring, 0.09, 0.09, A.x + 0.62, top, A.z - 0.05, 1.7, 0.8);
  decal(group, ring, 0.1, 0.1, B.x - 1.2, top, B.z - 0.3, 2.2, 0.7);
  decal(group, burn, 0.2, 0.16, LAYOUT.bunsen.x + 0.13, top, LAYOUT.bunsen.z + 0.12, 0.5, 0.9);
  decal(group, stain('rgba(120,60,110,0.35)'), 0.06, 0.06, A.x - 0.35, top, A.z + 0.3, 0);
  decal(group, stain('rgba(170,150,90,0.3)'), 0.05, 0.05, B.x + 0.85, top, B.z - 0.28, 1);
  decal(group, scratches, 0.3, 0.12, A.x + 0.1, top, A.z + 0.32, 0.05, 0.8);
  decal(group, scratches, 0.26, 0.1, B.x - 0.4, top, B.z - 0.32, -0.08, 0.7);
  for (const [x, z, r] of [[-0.6, 0.6, 0.4], [0.9, 0.7, 2.1], [-2.6, -0.4, 1.2], [2.4, 1.0, 0.2], [0.3, -1.6, 2.8], [-3.6, 1.8, 1.9]]) decal(group, scuff, 0.5, 0.5, x, 0.001, z, r, 0.8);

  let shown = -1;
  const update = () => {
    const now = new Date();
    const s = now.getSeconds();
    if (s === shown) return;
    shown = s;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    // le lancette girano in senso orario guardando la parete (asse z verso il giocatore)
    seconds.rotation.z = -(s / 60) * Math.PI * 2;
    minutes.rotation.z = -(m / 60) * Math.PI * 2;
    hours.rotation.z = -(h / 12) * Math.PI * 2;
  };
  update();

  return { update, setSigns };
}
