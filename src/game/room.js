// L'aula di chimica della scuola: pavimento, pareti, finestre, banconi, lavandino, cappa aspirante, cattedra con il
// vassoio delle consegne, lavagna, contenitori dei rifiuti, doccia di emergenza, magazzino, poster della tavola
// periodica. Costruisce le mesh, i collisori statici e gli «elementi fissi» con cui si interagisce (tasto E).
import * as THREE from 'three';
import { seg } from '../gfx/preset.js';
import { CATEGORY } from '../data/categories.js';

export const ROOM = { W: 10, D: 8, H: 3.2 };
export const BENCH_Y = 0.92;
export const DESK_Y = 0.78;

// posizioni (metri): x verso est, z verso sud (la lavagna è a nord, z = −4)
export const LAYOUT = {
  benchA: { x: 0, z: -0.4, w: 3.6, d: 0.9 },
  benchB: { x: 0, z: 1.6, w: 3.6, d: 0.9 },
  balance: { x: -1.35, z: -0.55 },
  hotplate: { x: -0.72, z: -0.55 },
  bunsen: { x: 1.38, z: -0.55 },
  strips: { x: 0.95, z: -0.78 },
  sink: { x: -4.62, z: -0.3, w: 0.42, d: 0.5, depth: 0.24 },
  counterW: { x: -4.65, z: 0, w: 0.7, d: 5 },
  towels: { x: -4.96, z: 0.55 },
  hood: { x: 4.6, z: -1.8, w: 0.8, d: 1.6 },
  desk: { x: 0, z: -2.9, w: 1.8, d: 0.8 },
  tray: { x: 0.45, z: -2.7 },
  bell: { x: 0.82, z: -2.64 },
  bins: { x: -4.2, z: 3.62, step: 0.46 },
  shower: { x: 4.45, z: 3.35 },
  extinguisher: { x: 4.82, z: 2.3 },
  store: { x: 4.6, z: 0.9 },
  // sgabelli accostati al bancone A (il suo mobile finisce a z = 0,05): nel corridoio resta il passaggio
  stools: [{ x: -0.95, z: 0.25 }, { x: 1.05, z: 0.25 }],
};
/** Sgabello: seduta a 0,64 m, base larga sul pavimento; collisore = cilindro pieno (mezza altezza, raggio), massa in kg. */
export const STOOL = { hh: 0.32, r: 0.17, mass: 5 };

export const BIN_KINDS = ['heavy', 'inorganic', 'organic', 'glass', 'solid'];
const BIN_COLORS = { heavy: '#3b4048', inorganic: '#2f6fd1', organic: '#e07a1f', glass: '#2f9a4c', solid: '#c9ccd2' };

/** Stazioni della vista del bancone: posizione della camera, punto guardato, dove sta il giocatore. */
export const STATIONS = [
  { key: 'bench', cam: [0.15, 1.72, 0.62], look: [0.15, BENCH_Y, -0.48], stand: [0.15, 0.35] },
  { key: 'shelf', cam: [0, 1.9, 0.62], look: [0, 1.05, 1.62], stand: [0, 0.75] },
  { key: 'sink', cam: [-3.55, 1.72, -0.3], look: [-4.6, BENCH_Y - 0.05, -0.3], stand: [-3.7, -0.3] },
  { key: 'hood', cam: [3.45, 1.78, -1.8], look: [4.6, BENCH_Y + 0.05, -1.8], stand: [3.6, -1.8] },
  { key: 'desk', cam: [0.5, 1.6, -1.9], look: [0.5, DESK_Y, -2.75], stand: [0.5, -2.0] },
  { key: 'bins', cam: [-3.3, 1.75, 2.55], look: [-3.3, 0.55, 3.65], stand: [-3.3, 2.6] },
];

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  return tex;
}

function noise(g, w, h, alpha, n = 2500) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * alpha})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

/**
 * Costruisce la stanza.
 * @returns {{group: THREE.Group, fixtures: object[], zones: object, update: (dt: number, state: object) => void,
 *            setBoard: (lines: string[]) => void, setBalance: (text: string) => void,
 *            props: {mesh: THREE.Group, body: object, home: {x: number, z: number}}[]}}
 */
export function buildRoom({ scene, physics, G, elements, envMap }) {
  const group = new THREE.Group();
  scene.add(group);
  const fixtures = [];
  const shadows = Boolean(G.shadows);
  // i riflessi dell'ambiente solo sulle superfici lucide (piano nero, acciaio): sugli opachi farebbero strisce
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.75, envMapIntensity: 0.05, ...o });

  const M = {
    floor: std({ map: canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#6e6862';
      g.fillRect(0, 0, w, h);
      noise(g, w, h, 0.08, 4000);
      g.strokeStyle = 'rgba(30,27,24,0.45)';
      g.lineWidth = 2;
      g.strokeRect(1, 1, w - 2, h - 2);
    }, [25, 20]), roughness: 0.6 }),
    wall: std({ map: canvasTexture(128, 128, (g, w, h) => {
      g.fillStyle = '#93a39a';
      g.fillRect(0, 0, w, h);
      noise(g, w, h, 0.03, 800);
    }, [8, 3]), roughness: 0.92 }),
    wainscot: std({ color: 0x4d5f56, roughness: 0.6 }),
    ceiling: std({ color: 0xb9bbb6, roughness: 0.95 }),
    // piano in resina nera; senza riflessi dell'ambiente (Semplice) un po' più chiaro, se no sembra un buco
    top: std({ color: envMap ? 0x15171b : 0x24282e, roughness: 0.35, metalness: 0.05, envMapIntensity: 0.7 }),
    cabinet: std({ map: canvasTexture(256, 128, (g, w, h) => {
      g.fillStyle = '#56606b';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(20,24,28,0.6)';
      g.lineWidth = 3;
      for (let x = 0; x < w; x += 64) g.strokeRect(x + 3, 6, 58, h - 12);
      g.fillStyle = '#c3c8ce';
      for (let x = 0; x < w; x += 64) g.fillRect(x + 28, 14, 8, 3);
    }, [1, 1]), roughness: 0.85 }),
    steel: std({ color: 0xc4c9cf, metalness: 0.85, roughness: 0.3, envMapIntensity: 1 }),
    darkSteel: std({ color: 0x5a6068, metalness: 0.7, roughness: 0.4, envMapIntensity: 1 }),
    wood: std({ color: 0x7a5233, roughness: 0.65 }),
    black: std({ color: 0x202226, roughness: 0.5 }),
    white: std({ color: 0xc9ccd0, roughness: 0.5 }),
    // strumenti (bilancia, piastra): grigio chiaro, così sul bancone nero si vedono ma non abbagliano
    instrument: std({ color: 0xaeb4bb, roughness: 0.45 }),
    glassPane: new THREE.MeshStandardMaterial({ color: 0xcfe6ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false, envMap }),
    sky: new THREE.MeshBasicMaterial({ color: 0xa9c6e2 }),
    light: new THREE.MeshBasicMaterial({ color: 0xf2f5fa }),
    red: std({ color: 0xc8161d, roughness: 0.4 }),
    green: std({ color: 0x2f9a4c, roughness: 0.5 }),
    yellow: std({ color: 0xf2c014, roughness: 0.5 }),
  };

  const mesh = (geo, mat, x, y, z, { cast = true, receive = true, parent = group } = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadows && cast;
    m.receiveShadow = shadows && receive;
    parent.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, opts) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, opts);
  /** Scatola visibile e solida. */
  const solid = (w, h, d, mat, x, y, z, owner = null, opts) => {
    physics.box(x, y, z, w / 2, h / 2, d / 2, owner);
    return box(w, h, d, mat, x, y, z, opts);
  };

  const { W, D, H } = ROOM;
  // ------------------------------------------------------------ pavimento, soffitto, pareti
  solid(W, 0.2, D, M.floor, 0, -0.1, 0, null, { cast: false });
  box(W, 0.02, D, M.ceiling, 0, H + 0.01, 0, { cast: false });
  physics.box(0, H + 0.1, 0, W / 2, 0.1, D / 2);
  const wall = (w, x, z, rot) => {
    const m = mesh(new THREE.PlaneGeometry(w, H), M.wall, x, H / 2, z, { cast: false });
    m.rotation.y = rot;
    const ws = mesh(new THREE.PlaneGeometry(w, 0.9), M.wainscot, x, 0.45, z, { cast: false });
    ws.rotation.y = rot;
    ws.position.add(new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot)).multiplyScalar(0.003));
  };
  wall(W, 0, -D / 2, 0);
  wall(W, 0, D / 2, Math.PI);
  wall(D, -W / 2, 0, Math.PI / 2);
  wall(D, W / 2, 0, -Math.PI / 2);
  physics.box(0, H / 2, -D / 2 - 0.1, W / 2, H / 2, 0.1);
  physics.box(0, H / 2, D / 2 + 0.1, W / 2, H / 2, 0.1);
  physics.box(-W / 2 - 0.1, H / 2, 0, 0.1, H / 2, D / 2);
  physics.box(W / 2 + 0.1, H / 2, 0, 0.1, H / 2, D / 2);

  // finestre (parete sud) e porta
  for (const x of [-1.6, 0.2, 2.0]) {
    box(1.4, 1.3, 0.02, M.sky, x, 1.75, D / 2 - 0.005, { cast: false, receive: false });
    box(1.5, 0.06, 0.08, M.white, x, 1.08, D / 2 - 0.04, { cast: false });
    box(1.5, 0.06, 0.08, M.white, x, 2.42, D / 2 - 0.04, { cast: false });
    box(0.05, 1.3, 0.06, M.white, x, 1.75, D / 2 - 0.03, { cast: false });
  }
  box(1.0, 2.1, 0.05, M.wood, 3.5, 1.05, D / 2 - 0.02, { cast: false });
  box(0.08, 0.03, 0.06, M.steel, 3.15, 1.0, D / 2 - 0.06);

  // luci al soffitto
  for (const x of [-2.5, 0, 2.5]) for (const z of [-2, 0.6, 2.8]) box(1.2, 0.03, 0.3, M.light, x, H - 0.02, z, { cast: false, receive: false });

  // ------------------------------------------------------------ banconi degli studenti
  const bench = ({ x, z, w, d }, owner) => {
    solid(w, BENCH_Y - 0.04, d, M.cabinet, x, (BENCH_Y - 0.04) / 2, z, owner);
    solid(w + 0.04, 0.04, d + 0.04, M.top, x, BENCH_Y - 0.02, z, owner, { cast: false });
  };
  bench(LAYOUT.benchA, { kind: 'surface' });
  bench(LAYOUT.benchB, { kind: 'surface' });
  // scaffale dei reagenti sul bancone B
  const sb = LAYOUT.benchB;
  solid(sb.w - 0.2, 0.025, 0.32, M.wood, sb.x, 1.27, sb.z + 0.18, { kind: 'surface' });
  for (const dx of [-1.6, 0, 1.6]) solid(0.03, 0.35, 0.3, M.wood, sb.x + dx, BENCH_Y + 0.17, sb.z + 0.18);
  solid(sb.w - 0.2, 0.3, 0.02, M.wood, sb.x, 1.42, sb.z + 0.34);

  // sgabelli: arredi mobili, il giocatore li spinge camminandoci contro (il gioco copia la fisica sulla mesh)
  const props = [];
  for (const s of LAYOUT.stools) {
    const stool = new THREE.Group();
    stool.position.set(s.x, 0, s.z);
    group.add(stool);
    mesh(new THREE.CylinderGeometry(STOOL.r, STOOL.r, 0.04, seg(20, 10)), M.black, 0, 2 * STOOL.hh - 0.02, 0, { parent: stool });
    mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.6, 8), M.darkSteel, 0, 0.32, 0, { parent: stool });
    mesh(new THREE.CylinderGeometry(STOOL.r - 0.03, STOOL.r - 0.01, 0.03, seg(20, 10)), M.darkSteel, 0, 0.015, 0, { parent: stool });
    const body = physics.prop({ x: s.x, z: s.z, ...STOOL });
    props.push({ mesh: stool, body, home: { x: s.x, z: s.z } });
  }

  // ------------------------------------------------------------ bilancia
  const bl = LAYOUT.balance;
  const balance = { kind: 'balance', id: 'balance', hit: [], tare: 0, pan: { x: bl.x, y: BENCH_Y + 0.075, z: bl.z - 0.02, r: 0.075 } };
  balance.hit.push(solid(0.22, 0.07, 0.28, M.instrument, bl.x, BENCH_Y + 0.035, bl.z, balance));
  const pan = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.008, seg(28, 14)), M.steel, bl.x, BENCH_Y + 0.071, bl.z - 0.02);
  physics.cylinder(bl.x, BENCH_Y + 0.071, bl.z - 0.02, 0.004, 0.075, balance);
  balance.hit.push(pan);
  const balCanvas = document.createElement('canvas');
  balCanvas.width = 256;
  balCanvas.height = 64;
  const balTex = new THREE.CanvasTexture(balCanvas);
  balTex.colorSpace = THREE.SRGBColorSpace;
  const display = mesh(new THREE.PlaneGeometry(0.14, 0.035), new THREE.MeshBasicMaterial({ map: balTex }), bl.x, BENCH_Y + 0.04, bl.z + 0.141, { cast: false });
  balance.hit.push(display);
  fixtures.push(balance);
  let balanceText = '';
  const setBalance = (text) => {
    if (text === balanceText) return;
    balanceText = text;
    const g = balCanvas.getContext('2d');
    g.fillStyle = '#0e1a12';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#7dff9a';
    g.font = '600 44px "IBM Plex Mono", monospace';
    g.textAlign = 'right';
    g.fillText(text, 244, 48);
    balTex.needsUpdate = true;
  };
  setBalance('0.00 g');

  // ------------------------------------------------------------ piastra riscaldante con agitatore
  const hp = LAYOUT.hotplate;
  const hotplate = { kind: 'hotplate', id: 'hotplate', hit: [], level: 0, T: 295, plate: { x: hp.x, y: BENCH_Y + 0.085, z: hp.z - 0.02, r: 0.1 } };
  hotplate.hit.push(solid(0.22, 0.08, 0.3, M.instrument, hp.x, BENCH_Y + 0.04, hp.z, hotplate));
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.4, emissive: 0xff2200, emissiveIntensity: 0 });
  const plate = mesh(new THREE.BoxGeometry(0.19, 0.008, 0.19), plateMat, hp.x, BENCH_Y + 0.084, hp.z - 0.02);
  physics.box(hp.x, BENCH_Y + 0.084, hp.z - 0.02, 0.095, 0.004, 0.095, hotplate);
  hotplate.hit.push(plate);
  const knob = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 16), M.black, hp.x, BENCH_Y + 0.04, hp.z + 0.16);
  knob.rotation.x = Math.PI / 2;
  hotplate.hit.push(knob);
  hotplate.knob = knob;
  hotplate.plateMat = plateMat;
  fixtures.push(hotplate);

  // ------------------------------------------------------------ becco Bunsen e treppiede con la reticella
  const bu = LAYOUT.bunsen;
  const bunsen = { kind: 'bunsen', id: 'bunsen', hit: [], on: false, flame: { x: bu.x, y: BENCH_Y + 0.15, z: bu.z, top: BENCH_Y + 0.29 }, gauze: { x: bu.x, y: BENCH_Y + 0.215, z: bu.z, r: 0.07 } };
  bunsen.hit.push(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.015, seg(20, 10)), M.darkSteel, bu.x, BENCH_Y + 0.008, bu.z));
  bunsen.hit.push(mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.13, 12), M.steel, bu.x, BENCH_Y + 0.08, bu.z));
  const valve = mesh(new THREE.BoxGeometry(0.02, 0.015, 0.03), M.yellow, bu.x + 0.04, BENCH_Y + 0.012, bu.z + 0.02);
  bunsen.hit.push(valve);
  // tubo del gas
  const hose = mesh(new THREE.TorusGeometry(0.12, 0.006, 6, 16, Math.PI / 2), M.red, bu.x + 0.16, BENCH_Y + 0.006, bu.z + 0.02, { cast: false });
  hose.rotation.x = Math.PI / 2;
  // treppiede
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.5;
    const leg = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 6), M.darkSteel, bu.x + Math.cos(a) * 0.075, BENCH_Y + 0.105, bu.z + Math.sin(a) * 0.075);
    leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
  }
  mesh(new THREE.TorusGeometry(0.07, 0.004, 6, 24), M.darkSteel, bu.x, BENCH_Y + 0.21, bu.z).rotation.x = Math.PI / 2;
  const gauzeMat = new THREE.MeshStandardMaterial({ color: 0x8c8c8c, roughness: 0.6, metalness: 0.5, emissive: 0xff5500, emissiveIntensity: 0 });
  const gauze = mesh(new THREE.BoxGeometry(0.15, 0.003, 0.15), gauzeMat, bu.x, BENCH_Y + 0.213, bu.z);
  physics.box(bu.x, BENCH_Y + 0.213, bu.z, 0.075, 0.0025, 0.075, bunsen);
  bunsen.hit.push(gauze);
  bunsen.gauzeMat = gauzeMat;
  // fiamma: cono interno azzurro e cono esterno; il colore cambia nel saggio alla fiamma
  const flameOuter = new THREE.MeshBasicMaterial({ color: 0x5a7dff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const flameInner = new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
  const fo = mesh(new THREE.ConeGeometry(0.02, 0.13, 16, 1, true), flameOuter, bu.x, BENCH_Y + 0.21, bu.z, { cast: false, receive: false });
  const fi = mesh(new THREE.ConeGeometry(0.008, 0.045, 12, 1, true), flameInner, bu.x, BENCH_Y + 0.168, bu.z, { cast: false, receive: false });
  bunsen.flameMeshes = [fo, fi];
  bunsen.hit.push(fo);
  bunsen.flameOuter = flameOuter;
  fo.visible = fi.visible = false;
  fixtures.push(bunsen);

  // cartine indicatrici
  const st = LAYOUT.strips;
  const strips = { kind: 'strips', id: 'strips', hit: [] };
  strips.hit.push(solid(0.08, 0.03, 0.05, std({ color: 0xf1c232, roughness: 0.6 }), st.x, BENCH_Y + 0.015, st.z, strips));
  fixtures.push(strips);

  // ------------------------------------------------------------ bancone laterale con il lavandino (parete ovest)
  const cw = LAYOUT.counterW;
  const sk = LAYOUT.sink;
  const sinkFix = { kind: 'sink', id: 'sink', hit: [], tap: false, basin: { x0: sk.x - sk.w / 2, x1: sk.x + sk.w / 2, z0: sk.z - sk.d / 2, z1: sk.z + sk.d / 2, y: BENCH_Y - sk.depth, top: BENCH_Y } };
  const zA = cw.z - cw.d / 2;
  const zB = cw.z + cw.d / 2;
  // mobile sotto, piano diviso attorno alla vasca
  solid(cw.w, BENCH_Y - 0.04 - sk.depth, cw.d, M.cabinet, cw.x, (BENCH_Y - 0.04 - sk.depth) / 2, cw.z, { kind: 'surface' });
  box(cw.w, sk.depth, cw.d, M.cabinet, cw.x, BENCH_Y - 0.04 - sk.depth / 2, cw.z);
  physics.box(cw.x, BENCH_Y - 0.04 - sk.depth / 2, (zA + sinkFix.basin.z0) / 2, cw.w / 2, sk.depth / 2, (sinkFix.basin.z0 - zA) / 2);
  physics.box(cw.x, BENCH_Y - 0.04 - sk.depth / 2, (sinkFix.basin.z1 + zB) / 2, cw.w / 2, sk.depth / 2, (zB - sinkFix.basin.z1) / 2);
  const topY = BENCH_Y - 0.02;
  solid(cw.w + 0.04, 0.04, sinkFix.basin.z0 - zA, M.top, cw.x, topY, (zA + sinkFix.basin.z0) / 2, { kind: 'surface' }, { cast: false });
  solid(cw.w + 0.04, 0.04, zB - sinkFix.basin.z1, M.top, cw.x, topY, (zB + sinkFix.basin.z1) / 2, { kind: 'surface' }, { cast: false });
  solid(sinkFix.basin.x0 - (cw.x - cw.w / 2), 0.04, sk.d, M.top, (cw.x - cw.w / 2 + sinkFix.basin.x0) / 2, topY, sk.z, null, { cast: false });
  solid(cw.x + cw.w / 2 + 0.02 - sinkFix.basin.x1, 0.04, sk.d, M.top, (cw.x + cw.w / 2 + 0.02 + sinkFix.basin.x1) / 2, topY, sk.z, null, { cast: false });
  // vasca d'acciaio
  sinkFix.hit.push(solid(sk.w, 0.02, sk.d, M.steel, sk.x, sinkFix.basin.y - 0.01, sk.z, sinkFix, { cast: false }));
  for (const [w, d, x, z] of [[sk.w, 0.01, sk.x, sinkFix.basin.z0], [sk.w, 0.01, sk.x, sinkFix.basin.z1], [0.01, sk.d, sinkFix.basin.x0, sk.z], [0.01, sk.d, sinkFix.basin.x1, sk.z]]) {
    sinkFix.hit.push(solid(w, sk.depth, d, M.steel, x, BENCH_Y - sk.depth / 2, z, sinkFix, { cast: false }));
  }
  // rubinetto a collo di cigno
  const tapX = -4.93;
  mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.3, 12), M.steel, tapX, BENCH_Y + 0.15, sk.z);
  const neck = mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 20, Math.PI), M.steel, tapX + 0.12, BENCH_Y + 0.3, sk.z);
  neck.rotation.y = 0;
  const handle = mesh(new THREE.BoxGeometry(0.03, 0.02, 0.1), M.red, tapX, BENCH_Y + 0.25, sk.z + 0.06);
  sinkFix.hit.push(handle, neck);
  sinkFix.spout = { x: tapX + 0.24, y: BENCH_Y + 0.29, z: sk.z };
  const streamMat = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.55, roughness: 0.05, depthWrite: false });
  const stream = mesh(new THREE.CylinderGeometry(0.005, 0.006, 1, 8), streamMat, sinkFix.spout.x, 0, sk.z, { cast: false, receive: false });
  stream.visible = false;
  sinkFix.stream = stream;
  sinkFix.handle = handle;
  fixtures.push(sinkFix);
  // distributore di carta
  const tw = LAYOUT.towels;
  const towels = { kind: 'towels', id: 'towels', hit: [] };
  towels.hit.push(solid(0.08, 0.3, 0.28, M.white, tw.x, 1.4, tw.z, towels));
  box(0.012, 0.04, 0.2, std({ color: 0xf2efe6 }), tw.x + 0.045, 1.24, tw.z);
  fixtures.push(towels);

  // poster della tavola periodica sopra il bancone
  const poster = mesh(new THREE.PlaneGeometry(1.8, 1.05), new THREE.MeshStandardMaterial({ map: posterTexture(elements), roughness: 0.8 }), -W / 2 + 0.01, 2.05, -1.5, { cast: false });
  poster.rotation.y = Math.PI / 2;

  // ------------------------------------------------------------ cappa aspirante (parete est)
  const hd = LAYOUT.hood;
  const hood = { kind: 'hood', id: 'hood', hit: [], on: false, zone: { x0: hd.x - hd.w / 2 - 0.05, x1: W / 2, y0: BENCH_Y, y1: 2.2, z0: hd.z - hd.d / 2, z1: hd.z + hd.d / 2 } };
  solid(hd.w, BENCH_Y - 0.04, hd.d, M.cabinet, hd.x, (BENCH_Y - 0.04) / 2, hd.z, { kind: 'surface' });
  // piano di lavoro nero come i banconi: la vetreria vi si stacca
  solid(hd.w + 0.02, 0.04, hd.d, M.top, hd.x, BENCH_Y - 0.02, hd.z, { kind: 'surface' }, { cast: false });
  solid(hd.w, 1.4, 0.04, M.white, hd.x, BENCH_Y + 0.7, hd.z - hd.d / 2);
  solid(hd.w, 1.4, 0.04, M.white, hd.x, BENCH_Y + 0.7, hd.z + hd.d / 2);
  solid(hd.w, 0.06, hd.d, M.white, hd.x, BENCH_Y + 1.4, hd.z);
  solid(0.03, 1.4, hd.d, M.white, W / 2 - 0.02, BENCH_Y + 0.7, hd.z, null, { cast: false });
  // vetro scorrevole aperto per metà
  box(0.01, 0.75, hd.d - 0.06, M.glassPane, hd.x - hd.w / 2 + 0.02, BENCH_Y + 1.0, hd.z, { cast: false, receive: false });
  physics.box(hd.x - hd.w / 2 + 0.02, BENCH_Y + 1.0, hd.z, 0.005, 0.375, hd.d / 2);
  box(0.03, 0.03, hd.d - 0.06, M.darkSteel, hd.x - hd.w / 2 + 0.02, BENCH_Y + 0.62, hd.z);
  box(0.9, 0.5, 0.9, M.darkSteel, hd.x, BENCH_Y + 1.7, hd.z);
  const hoodLightMat = new THREE.MeshBasicMaterial({ color: 0x3a3f46 });
  box(0.5, 0.01, 1.2, hoodLightMat, hd.x + 0.05, BENCH_Y + 1.36, hd.z, { cast: false, receive: false });
  hood.lightMat = hoodLightMat;
  const sw = solid(0.02, 0.06, 0.05, M.black, hd.x - hd.w / 2 + 0.01, BENCH_Y + 0.3, hd.z + hd.d / 2 + 0.06, hood);
  const swLed = box(0.01, 0.015, 0.015, new THREE.MeshBasicMaterial({ color: 0x3a1010 }), hd.x - hd.w / 2 - 0.002, BENCH_Y + 0.32, hd.z + hd.d / 2 + 0.06, { cast: false });
  hood.led = swLed.material;
  hood.hit.push(sw);
  fixtures.push(hood);

  // ------------------------------------------------------------ magazzino (armadio dei reagenti con lo schermo)
  const so = LAYOUT.store;
  const store = { kind: 'store', id: 'store', hit: [] };
  store.hit.push(solid(0.6, 2.0, 1.0, std({ color: 0x6d7c8a, roughness: 0.5 }), so.x + 0.05, 1.0, so.z, store));
  const screen = box(0.01, 0.3, 0.42, new THREE.MeshBasicMaterial({ map: canvasTexture(256, 192, (g, w, h) => {
    g.fillStyle = '#0d2236';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#7cc8ff';
    g.font = '700 30px "IBM Plex Sans", sans-serif';
    g.fillText('MAGAZZINO', 20, 50);
    g.font = '500 20px "IBM Plex Sans", sans-serif';
    g.fillStyle = '#cfe6ff';
    g.fillText('reagenti · vetreria', 20, 90);
    g.fillText('[E]', 20, 150);
  }) }), so.x - 0.255, 1.45, so.z, { cast: false });
  store.hit.push(screen);
  fixtures.push(store);

  // ------------------------------------------------------------ cattedra, vassoio delle consegne, campanello, lavagna
  const dk = LAYOUT.desk;
  solid(dk.w, DESK_Y - 0.04, dk.d, M.wood, dk.x, (DESK_Y - 0.04) / 2, dk.z, { kind: 'surface' });
  solid(dk.w + 0.04, 0.04, dk.d + 0.04, std({ color: 0x6b4a2a, roughness: 0.55 }), dk.x, DESK_Y - 0.02, dk.z, { kind: 'surface' }, { cast: false });
  const tr = LAYOUT.tray;
  const tray = { kind: 'tray', id: 'tray', hit: [], zone: { x: tr.x, z: tr.z, hw: 0.2, hd: 0.15, y: DESK_Y } };
  tray.hit.push(box(0.42, 0.012, 0.32, std({ color: 0x2b6fd8, roughness: 0.4 }), tr.x, DESK_Y + 0.006, tr.z, { cast: false }));
  physics.box(tr.x, DESK_Y + 0.006, tr.z, 0.21, 0.006, 0.16, tray);
  fixtures.push(tray);
  const be = LAYOUT.bell;
  const bell = { kind: 'bell', id: 'bell', hit: [] };
  bell.hit.push(mesh(new THREE.SphereGeometry(0.035, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 }), be.x, DESK_Y + 0.01, be.z));
  bell.hit.push(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 16), M.black, be.x, DESK_Y + 0.005, be.z));
  physics.cylinder(be.x, DESK_Y + 0.02, be.z, 0.02, 0.045, bell);
  fixtures.push(bell);

  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1536;
  boardCanvas.height = 512;
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  boardTex.anisotropy = 8;
  box(3.8, 1.35, 0.04, M.wood, 0, 1.62, -D / 2 + 0.03, { cast: false });
  const board = mesh(new THREE.PlaneGeometry(3.6, 1.2), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.9 }), 0, 1.62, -D / 2 + 0.055, { cast: false });
  board.name = 'board';
  const setBoard = (lines) => {
    const g = boardCanvas.getContext('2d');
    g.fillStyle = '#23372c';
    g.fillRect(0, 0, 1536, 512);
    noise(g, 1536, 512, 0.06, 6000);
    g.fillStyle = 'rgba(240,240,232,0.94)';
    lines.forEach((line, i) => {
      g.font = i === 0 ? '600 56px "IBM Plex Sans", sans-serif' : '400 38px "IBM Plex Sans", sans-serif';
      fitLine(g, line, 48, 86 + (i === 0 ? 0 : 30) + i * 52, 1440);
    });
    boardTex.needsUpdate = true;
  };
  setBoard([]);

  // ------------------------------------------------------------ contenitori dei rifiuti
  const bins = [];
  BIN_KINDS.forEach((kind, i) => {
    const x = LAYOUT.bins.x + i * LAYOUT.bins.step;
    const z = LAYOUT.bins.z;
    const bin = { kind: 'bin', bin: kind, id: `bin-${kind}`, hit: [], zone: { x0: x - 0.17, x1: x + 0.17, z0: z - 0.17, z1: z + 0.17, y0: 0, y1: 0.62 }, opening: { x, y: 0.62, z, r: 0.16 } };
    const mat = std({ color: BIN_COLORS[kind], roughness: 0.55 });
    // quattro pareti e il fondo: gli oggetti cadono dentro
    for (const [w, d, dx, dz] of [[0.38, 0.02, 0, -0.18], [0.38, 0.02, 0, 0.18], [0.02, 0.38, -0.18, 0], [0.02, 0.38, 0.18, 0]]) bin.hit.push(solid(w, 0.6, d, mat, x + dx, 0.3, z + dz, bin));
    bin.hit.push(solid(0.36, 0.02, 0.36, mat, x, 0.01, z, bin));
    const funnel = mesh(new THREE.CylinderGeometry(0.16, 0.05, 0.08, seg(20, 10), 1, true), std({ color: 0x2a2d33, side: THREE.DoubleSide }), x, 0.58, z, { cast: false });
    bin.hit.push(funnel);
    const lbl = mesh(new THREE.PlaneGeometry(0.3, 0.16), new THREE.MeshStandardMaterial({ map: binLabel(kind) }), x, 0.42, z - 0.192, { cast: false });
    lbl.rotation.y = Math.PI;
    bin.hit.push(lbl);
    bins.push(bin);
    fixtures.push(bin);
  });

  // ------------------------------------------------------------ doccia di emergenza ed estintore
  const sh = LAYOUT.shower;
  const shower = { kind: 'shower', id: 'shower', hit: [], t: 0 };
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 10), M.green, sh.x + 0.35, 1.2, sh.z);
  mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 8), M.green, sh.x + 0.15, 2.38, sh.z).rotation.z = Math.PI / 2;
  shower.hit.push(mesh(new THREE.CylinderGeometry(0.14, 0.04, 0.08, seg(20, 10)), M.green, sh.x, 2.3, sh.z));
  const pull = mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), M.yellow, sh.x + 0.05, 1.7, sh.z);
  shower.hit.push(pull);
  mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.55, 4), M.darkSteel, sh.x + 0.05, 2.0, sh.z);
  physics.cylinder(sh.x + 0.35, 1.2, sh.z, 1.2, 0.03);
  shower.signMat = new THREE.MeshBasicMaterial({ map: canvasTexture(128, 128, (g) => {
    g.fillStyle = '#1a8f3c';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#fff';
    g.font = '700 70px sans-serif';
    g.textAlign = 'center';
    g.fillText('🚿', 64, 92);
  }) });
  const sign = mesh(new THREE.PlaneGeometry(0.3, 0.3), shower.signMat, W / 2 - 0.01, 2.5, sh.z, { cast: false });
  sign.rotation.y = -Math.PI / 2;
  fixtures.push(shower);
  // supporto dell'estintore
  const ex = LAYOUT.extinguisher;
  solid(0.16, 0.02, 0.16, M.darkSteel, ex.x, 0.35, ex.z);

  // ------------------------------------------------------------ luci
  // Poche luci e moderate: la luce della finestra (con le ombre), le plafoniere sopra i due banconi e un'emisferica
  // bassa che schiarisce le ombre. Con più luce le pareti e il vetro diventano bianchi e gli oggetti si confondono.
  // senza i riflessi dell'ambiente (preset Semplice) l'emisferica fa anche da luce ambiente
  const hemi = new THREE.HemisphereLight(0xe6eef8, 0x3b352e, envMap ? 0.5 : 1.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.2);
  sun.position.set(-1.5, 5.5, 7);
  sun.target.position.set(0, 0.6, -0.5);
  scene.add(sun, sun.target);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -5.5;
    c.right = 5.5;
    c.top = 4.5;
    c.bottom = -4.5;
    c.near = 1;
    c.far = 16;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
  }
  const ceiling = new THREE.PointLight(0xfff8ee, 4.5, 7, 1.6);
  ceiling.position.set(0, 2.9, LAYOUT.benchA.z);
  const ceilingB = new THREE.PointLight(0xfff8ee, 3, 7, 1.6);
  ceilingB.position.set(0, 2.9, LAYOUT.benchB.z);
  scene.add(ceiling, ceilingB);
  const flameLight = new THREE.PointLight(0x6a8cff, 0, 1.2, 2);
  flameLight.position.set(bu.x, BENCH_Y + 0.25, bu.z);
  scene.add(flameLight);
  bunsen.light = flameLight;

  const zones = { hood: hood.zone, tray: tray.zone, basin: sinkFix.basin, bins, balancePan: balance.pan, plate: hotplate.plate, gauze: bunsen.gauze, flame: bunsen.flame };

  const update = (dt, t) => {
    // fiamma del Bunsen tremolante
    for (const [k, m] of bunsen.flameMeshes.entries()) {
      m.visible = bunsen.on;
      const b = bunsen.boost && k === 0 ? 1.4 : 1; // nel saggio alla fiamma la fiamma colorata si allarga
      if (bunsen.on) m.scale.set(b * (1 + Math.sin(t * 31 + k) * 0.05), b * (1 + Math.sin(t * 23 + k * 2) * 0.08), b * (1 + Math.cos(t * 29) * 0.05));
    }
    flameLight.intensity = bunsen.on ? 0.6 + Math.sin(t * 40) * 0.08 : 0;
    gauzeMat.emissiveIntensity += ((bunsen.on ? 0.55 : 0) - gauzeMat.emissiveIntensity) * Math.min(1, dt * 0.6);
    hotplate.T += ((295 + hotplate.level * 60 - hotplate.T) * Math.min(1, dt * 0.5));
    plateMat.emissiveIntensity = Math.max(0, (hotplate.T - 420) / 600);
    hotplate.knob.rotation.y = -hotplate.level * 0.9;
    // acqua del rubinetto (lunghezza del getto: la decide il gioco, fino al recipiente sotto o al fondo del lavandino)
    sinkFix.stream.visible = sinkFix.tap;
    hood.lightMat.color.set(hood.on ? 0xf4f8ff : 0x3a3f46);
    hood.led.color.set(hood.on ? 0x30ff60 : 0x3a1010);
  };

  return { group, fixtures, zones, update, setBoard, setBalance, bins, props, lights: { sun, hemi, ceiling, ceilingB } };
}

function fitLine(g, text, x, y, w) {
  let s = String(text);
  while (s.length > 3 && g.measureText(s).width > w) s = s.slice(0, -2) + '…';
  g.fillText(s, x, y);
}

/** Etichetta di un contenitore dei rifiuti. */
function binLabel(kind) {
  const names = {
    heavy: ['METALLI PESANTI', 'Pb · Cu · Ag · Cr · Ni'],
    inorganic: ['ACIDI, BASI, SALI', 'soluzioni inorganiche'],
    organic: ['SOLVENTI ORGANICI', 'etanolo · acetone'],
    glass: ['VETRO ROTTO', 'solo vetro'],
    solid: ['RIFIUTI SOLIDI', 'carta · cartine · guanti'],
  }[kind];
  return canvasTexture(256, 140, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = BIN_COLORS[kind];
    g.fillRect(0, 0, w, 36);
    g.fillStyle = '#111';
    g.font = '700 26px "IBM Plex Sans", sans-serif';
    g.fillText(names[0], 12, 80);
    g.font = '500 20px "IBM Plex Sans", sans-serif';
    g.fillStyle = '#444';
    g.fillText(names[1], 12, 116);
  });
}

/** Poster della tavola periodica: le celle colorate per famiglia, con i simboli. */
function posterTexture(elements) {
  return canvasTexture(1024, 600, (g, w, h) => {
    g.fillStyle = '#f7f5ee';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d2733';
    g.font = '700 34px "IBM Plex Sans", sans-serif';
    g.fillText('TAVOLA PERIODICA DEGLI ELEMENTI', 30, 46);
    const cw = 52;
    const ch = 50;
    const ox = 40;
    const oy = 70;
    for (const el of elements ?? []) {
      const col = el.grid?.x;
      const row = el.grid?.y;
      if (!col || !row) continue;
      const x = ox + (col - 1) * cw;
      const y = oy + (row - 1) * ch * 0.92;
      g.fillStyle = CATEGORY[el.category]?.color ?? '#999';
      g.fillRect(x + 1, y + 1, cw - 2, ch - 2);
      g.fillStyle = '#10161e';
      g.font = '700 20px "IBM Plex Sans", sans-serif';
      g.fillText(el.symbol, x + 6, y + 30);
      g.font = '500 11px "IBM Plex Sans", sans-serif';
      g.fillText(String(el.z), x + 5, y + 13);
    }
  });
}
