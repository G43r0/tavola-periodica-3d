// Il gioco: stanza, oggetti, fisica, giocatore e chimica insieme. Prendere, posare, lanciare e versare; usare gli
// strumenti (spatola, ansa, carta, cartine, estintore) e gli elementi fissi (piastra, Bunsen, rubinetto, bilancia,
// cappa, doccia, campanello); calore e reazioni nei contenitori; incidenti (vetro rotto, pozze, fuoco, gas tossici,
// esplosioni, schizzi); rifiuti e pulizia; esercitazioni della Carriera e Laboratorio libero.
// L'interfaccia (DOM, menu, HUD) è in game-view.js: qui si producono solo stato e messaggi.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gfx } from '../gfx/preset.js';
import { locale, pick } from '../i18n/index.js';
import { Physics } from './physics.js';
import { buildRoom, ROOM, LAYOUT, BENCH_Y, DESK_Y, STATIONS } from './room.js';
import { DEFS, createItem, syncItem, disposeItem, placeItem, itemMaterials, itemMassGrams, updateContactShadow } from './items.js';
import { liquidLevel, pourRate, ballisticLanding } from './liquid.js';
import { Drops, Motes, Puffs, Stream, createPuddle, puddleRadius, puddleState, stainAlphaMap } from './effects.js';
import { Player } from './player.js';
import { createLabChemistry, Mixture, wasteClass, binAccepts, AMBIENT } from './mixture.js';
import { S } from '../sandbox/substances.js';
import { SHELF, CABINET, OIL, PRICES, UNIVERSAL_SCALE, FLAME_SALTS, AQUEOUS_NAMES } from './reagents.js';
import { reagentLook, FAMILIES, FAMILY_ORDER } from './stock.js';
import { reactionSignals, signalTags, equation, whyNot } from './signals.js';
import { emptyNotebook, recordReaction } from './notebook.js';
import { ORDERS, grade } from './orders.js';
import { legendRows, relaxTilt, tiltGain, throwSpeed } from './controls.js';

const WATER = 123;
const REACH = 2.3;
const BREAK_SPEED = 3.3; // m/s: un becher che cade dal bancone (≈ 4,2 m/s) si rompe, posato no
const CHEM_DT = 1 / 20;
const RESIDUE_ML = 0.2;
const TAP_FLOW = 25; // mL/s, portata iniziale del rubinetto (la rotella la cambia da 5 a 50)
const PLACE_REACH = 0.6; // m: si posa con precisione solo vicino all'oggetto in mano
const PLACE_LIFT = 0.002; // m sopra il piano: poi la gravità lo appoggia
const ROT_SPEED = 0.005; // rad per pixel con R premuto
const ROT_STEP = Math.PI / 12; // scatto della rotella con R premuto (15°)
const PRECISE_STEP = 0.0015; // m per pixel nella manipolazione precisa
const PRECISE_RANGE = 0.35; // m attorno al punto di partenza
const PUT_BACK_REACH = 1.2; // m: il clic destro rimette a posto l'oggetto solo vicino al punto da cui lo si è preso
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
/** Campo visivo verticale della camera (gradi): valore iniziale e limiti del cursore nelle impostazioni. */
export const FOV = { min: 55, max: 100, default: 70 };
const UP = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const Z = new THREE.Vector3(0, 0, 1);

// posti dove compaiono gli oggetti, dal più comodo (al centro) al più lontano
const fromCenter = (n, step) => Array.from({ length: n }, (_, i) => (i % 2 ? -1 : 1) * Math.ceil(i / 2) * step);
const SLOTS = {
  bench: [[-0.05, -0.22], [0.25, -0.22], [-0.35, -0.22], [0.55, -0.22], [-0.05, -0.55], [0.25, -0.55], [-0.35, -0.55], [0.55, -0.55], [0.85, -0.25], [-0.5, -0.38]].map(([x, z]) => [x, BENCH_Y, z]),
  shelf: fromCenter(11, 0.27).map((x) => [x, 1.283, LAYOUT.benchB.z + 0.18]),
  benchB: fromCenter(11, 0.3).map((x) => [x, BENCH_Y, LAYOUT.benchB.z - 0.22]),
};

const rgbCss = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
/** Punta degli strumenti nelle coordinate dell'oggetto (asse x in avanti). */
const TOOL_TIPS = { loop: [0.102, 0.004, 0], spatula: [0.075, 0.003, 0], strip: [0.03, 0.001, 0] };

/** Materiale del contorno: trasparente al centro, colorato verso i bordi visti di taglio (effetto Fresnel). */
const outlineMats = new Map();
function outlineMaterial(color, strength) {
  const key = `${color}:${strength}`;
  if (!outlineMats.has(key)) {
    outlineMats.set(key, new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
      vertexShader: `varying float vRim;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec3 n = normalize(normalMatrix * normal);
          vRim = 1.0 - abs(dot(n, normalize(-mv.xyz)));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying float vRim;
        void main() {
          gl_FragColor = vec4(uColor, smoothstep(0.35, 0.95, vRim) * uStrength);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
    }));
  }
  return outlineMats.get(key);
}

/** Materiale della sagoma che mostra dove si poserà l'oggetto (verde: si può; rosso: no). */
const ghostMaterial = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false });
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** Angolo riportato tra −π e π. */
const wrapAngle = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

export class LabGame {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {object} R modulo Rapier inizializzato
   * @param {object[]} elements elementi della tavola (localizzati)
   * @param {{t: Function, onEvent: Function}} opts
   */
  constructor(renderer, R, elements, { t, onEvent }) {
    this.t = t;
    this.emit = onEvent ?? (() => {});
    this.G = gfx();
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1d2126);
    this.camera = new THREE.PerspectiveCamera(FOV.default, 16 / 9, 0.02, 40);
    this.envMap = null;
    if (this.G.env || this.G.post) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environment = this.envMap;
      this.scene.environmentIntensity = 0.28;
      pmrem.dispose();
    }
    this.physics = new Physics(R);
    this.chem = createLabChemistry(elements);
    this.room = buildRoom({ scene: this.scene, physics: this.physics, G: this.G, elements, envMap: this.envMap });
    this.fx = Object.fromEntries(this.room.fixtures.map((f) => [f.id, f]));
    this.mats = itemMaterials(this.G, this.envMap);
    this.env = { scene: this.scene, physics: this.physics, mats: this.mats, G: this.G };
    this.items = [];
    this.puddles = [];
    this.fires = [];
    this.clouds = [];
    this.drops = new Drops(this.scene);
    this.motes = new Motes(this.scene); // bolle e fiocchi di precipitato nei contenitori
    this.sigCache = new Map(); // segnali osservabili di ogni reazione (in acqua o no)
    this.notebook = emptyNotebook(); // il quaderno vero lo passa game-view.js dal salvataggio
    this.streams = new Map(); // contenitore che versa → getto continuo
    this.inFlight = []; // liquido nel getto: arriva al bersaglio dopo il tempo di volo
    this.aim = null; // dove cadrebbe il getto del contenitore in mano (anello verde o rosso)
    this.aimRing = new THREE.Mesh(new THREE.RingGeometry(0.010, 0.014, 32), new THREE.MeshBasicMaterial({ color: 0x5fd38d, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    this.aimRing.rotation.x = -Math.PI / 2;
    this.aimRing.renderOrder = 6;
    this.aimRing.visible = false;
    this.scene.add(this.aimRing);
    this.outlined = null; // oggetto o elemento fisso evidenziato (quello che si guarda)
    this.hoverT = 0;
    this.puffs = new Puffs(this.scene, 1400, false);
    this.flames = new Puffs(this.scene, 700, true);
    this.player = new Player(this.physics, this.camera);
    this.held = null;
    this.holdDist = 0.5;
    this.lift = 0.16;
    this.tilt = 0;
    this.pouring = false;
    this.swirlT = 0;
    this.spraying = false;
    this.spot = null; // dove si poserebbe l'oggetto in mano: { pos, quat, valid }
    this.ghost = null; // sagoma trasparente dell'oggetto in mano su quel punto
    this.ghostMats = { ok: ghostMaterial(0x5fd38d), bad: ghostMaterial(0xe0524a) };
    this.placing = null; // posa morbida: { item, pos, quat, t }, l'oggetto scivola al suo posto
    this.charge = null; // istante in cui si è cominciato a caricare il lancio (Q tenuto)
    this.rotating = false; // destro tenuto: il mouse ruota l'oggetto in mano invece di girare lo sguardo
    this.rotPour = false; // nella precisione il destro inclina anche il recipiente (versamento goccia a goccia)
    this.precise = null; // manipolazione precisa (Maiusc tenuto): { anchor, off }
    this.filling = false; // clic sul lavandino con un recipiente: è sotto il rubinetto, l'acqua scorre tenendo il sinistro
    this.tapWasOn = false;
    this.tapFlow = TAP_FLOW;
    this.mouse = new THREE.Vector2(0, 0);
    this.ray = new THREE.Raycaster();
    this.hover = null;
    this.time = 0;
    this.chemAcc = 0;
    this.flameTest = { color: null, t: 0 };
    this.splash = null;
    this.alarm = 0;
    this.messages = [];
    this.lastDisposal = new Map();
    this.mode = 'career';
    this.chemMode = 'real';
    this.money = 0;
    this.order = null;
    this.free = false;
    this.pendingBreaks = new Set();
    this.physics.preStep = (dt) => this.controlHeld(dt);
    this.physics.onImpact = (owner, force, other, speed) => this.impact(owner, force, other, speed);
    this.player.onTeleport = (from, to) => this.teleported(from, to);
    this.room.setBoard([t('boardWelcome'), t('boardWelcome2')]);
    // una voce per colore (sali e altri inorganici hanno lo stesso tappo bianco)
    const shown = FAMILY_ORDER.filter((f, i) => FAMILY_ORDER.findIndex((g) => FAMILIES[g] === FAMILIES[f]) === i);
    this.room.setLegend(t('capLegendTitle'), shown.map((f) => ({ color: FAMILIES[f], label: t(`legend_${f}`) })));
    // estintore appeso al muro
    this.extinguisher = this.spawn('extinguisher', { pos: new THREE.Vector3(LAYOUT.extinguisher.x, 0.37, LAYOUT.extinguisher.z) });
    this.extinguisher.home = this.extinguisher.mesh.position.clone();
  }

  // ------------------------------------------------------------------ oggetti

  spawn(kind, { pos, quat, mixture = null, label = null, name = null, cap = null, data = {} }) {
    const item = createItem(this.env, kind, { pos, quat, mixture, label, name, cap });
    item.data = { ...data };
    item.peakT = mixture?.T ?? AMBIENT;
    this.items.push(item);
    return item;
  }

  removeItem(item) {
    this.streams.get(item)?.dispose();
    this.streams.delete(item);
    if (this.held === item) this.letGo();
    if (this.placing?.item === item) this.placing = null;
    this.items = this.items.filter((i) => i !== item);
    disposeItem(item, this.env);
  }

  /** Rotazione con cui un oggetto con etichetta guarda il giocatore: il bancone A si usa dal lato sud, gli altri da nord. */
  facing(group) {
    return group === 'bench' ? new THREE.Quaternion().setFromAxisAngle(UP, Math.PI) : null;
  }

  /** Primo posto libero di un gruppo (bancone, scaffale…). */
  freeSlot(group) {
    for (const [x, y, z] of SLOTS[group]) {
      const busy = this.items.some((it) => {
        const p = it.mesh.position;
        return Math.hypot(p.x - x, p.z - z) < 0.085 && Math.abs(p.y - y) < 0.3;
      });
      if (!busy) return new THREE.Vector3(x, y + 0.003, z);
    }
    const [x, y, z] = SLOTS[group][Math.floor(Math.random() * SLOTS[group].length)];
    return new THREE.Vector3(x + (Math.random() - 0.5) * 0.05, y + 0.25, z);
  }

  /**
   * Crea un reagente dello scaffale (soluzione, solido, indicatore) nel suo contenitore, con il tappo del colore della
   * famiglia e l'etichetta con i pericoli (stock.js).
   */
  spawnReagent(key, group = 'shelf', override = null, at = null) {
    const r = SHELF[key] ?? CABINET[key] ?? override;
    const { chem, t } = this;
    const look = reagentLook(chem, r);
    let mix;
    let label;
    if (r.water) {
      mix = Mixture.liquid(chem, 'water', 400);
      label = { title: t('distilledWater'), formula: 'H₂O', sub: t('washbottleSub'), color: '#e8f4ff' };
    } else if (r.indicator) {
      mix = Mixture.of(chem, [['water', 25 / 18.015], [r.indicator, 0.25 / 318.3]]);
      label = { title: chem.name(r.indicator), formula: '1 %', sub: t('indicatorSub'), color: '#fff6e8' };
    } else if (r.solute) {
      mix = Mixture.solution(chem, r.solute, r.molar, 450);
      label = { title: r.name ? pick(r.name) : chem.name(chem.id(r.solute)), formula: chem.formula(chem.id(r.solute)), sub: `${this.fmt(r.molar, r.molar < 1 ? 2 : 1)} M · 500 mL`, color: '#ffffff' };
    } else if (r.liquid) {
      mix = Mixture.liquid(chem, r.liquid, 450);
      label = { title: r.name ? pick(r.name) : chem.name(chem.id(r.liquid)), formula: chem.formula(chem.id(r.liquid)), sub: '500 mL', color: '#ffffff' };
    } else if (look.kind === 'jarOil') {
      // metallo alcalino a pezzetti sotto olio di paraffina: la spatola prende solo il metallo
      mix = Mixture.solid(chem, r.solid, r.grams ?? 25);
      mix.add(Mixture.liquid(chem, OIL.key, 90));
      mix.mix = 0;
      label = { title: chem.name(chem.id(r.solid)), formula: chem.formula(chem.id(r.solid)), sub: `${r.grams ?? 25} g · ${t('underOil')}`, color: '#ffffff' };
    } else {
      mix = Mixture.solid(chem, r.solid, r.grams ?? 120);
      label = { title: r.name ? pick(r.name) : chem.name(chem.id(r.solid)), formula: chem.formula(chem.id(r.solid)), sub: `${r.grams ?? 120} g`, color: '#ffffff' };
    }
    Object.assign(label, { band: look.cap, bandText: t(`fam_${look.family}`), ghs: look.ghs, signal: look.signal ? t(`signal_${look.signal}`) : '' });
    const item = this.spawn(look.kind, {
      pos: at ?? this.freeSlot(group), quat: this.facing(group), mixture: mix, label, name: label.title, cap: look.cap,
      data: { reagent: key ?? 'custom', price: r.solid ? PRICES.solidPerGram : r.water ? PRICES.waterPerMl : PRICES.solutionPerMl, family: look.family, ghs: look.ghs, curated: look.curated },
    });
    if (look.kind === 'jarOil') item.data.alias = { [chem.id(OIL.key)]: OIL.name };
    return item;
  }

  hazardOf(mix) {
    const cls = wasteClass(mix);
    if (cls === 'heavy') return 'toxic';
    if (cls === 'organic') return 'flammable';
    const ph = mix.pH();
    if (ph !== null && (ph < 1.5 || ph > 12.5)) return 'corrosive';
    if (cls === 'inorganic') return 'irritant';
    return null;
  }

  /** Contenitore di vetreria vuoto. */
  spawnGlass(kind, group = 'benchB') {
    return this.spawn(kind, { pos: this.freeSlot(group), mixture: new Mixture(this.chem), name: this.t(`item_${kind}`) });
  }

  spawnTool(kind, group = 'bench', pos = null) {
    return this.spawn(kind, { pos: pos ?? this.freeSlot(group), name: this.t(`item_${kind}`), mixture: kind === 'towel' ? new Mixture(this.chem) : null });
  }

  /** Nome mostrato di un oggetto. */
  itemName(item) {
    if (item.data.sample !== undefined) return this.t('sampleName', { s: 'ABC'[item.data.sample] });
    return item.name && !item.name.startsWith(item.kind) ? item.name : this.t(`item_${item.kind}`);
  }

  // ------------------------------------------------------------------ partita

  /** Svuota la stanza (tranne l'estintore) per una nuova partita. */
  clearRoom() {
    for (const it of [...this.items]) if (it !== this.extinguisher) this.removeItem(it);
    for (const p of this.puddles) p.mesh.removeFromParent();
    this.puddles = [];
    this.fires = [];
    this.clouds = [];
    // l'estintore può essere in mano o in posa: torna con la gravità
    for (const it of [this.held, this.placing?.item]) it?.body.setGravityScale(1, true);
    this.letGo();
    this.placing = null;
    this.splash = null;
    this.inFlight = [];
    for (const st of this.streams.values()) st.dispose();
    this.streams.clear();
    Object.assign(this.fx.bunsen, { on: false });
    Object.assign(this.fx.hotplate, { level: 0 });
    Object.assign(this.fx.sink, { tap: false });
    Object.assign(this.fx.hood, { on: false });
    Object.assign(this.fx.lamp, { on: false });
    this.motes.clear();
    placeItem(this.extinguisher, this.extinguisher.home);
    this.clearProps();
  }

  /**
   * Il giocatore è saltato altrove (cambio di postazione, nuova partita): uno sgabello spinto lì tornerebbe a
   * incastrarsi nel giocatore, quindi torna a posto; l'oggetto in mano viaggia con lui (stessa posizione rispetto al
   * giocatore e al suo sguardo), altrimenti resterebbe indietro incastrato nei banconi e cadrebbe.
   */
  teleported(from, to) {
    this.clearProps(to.x, to.z);
    if (this.placing) this.finishPlacing();
    this.stopFilling();
    const item = this.held;
    if (!item) return;
    const t = item.body.translation();
    const off = new THREE.Vector3(t.x - from.x, t.y, t.z - from.z).applyAxisAngle(UP, to.yaw - from.yaw);
    const r = item.body.rotation();
    const q = new THREE.Quaternion().setFromAxisAngle(UP, to.yaw - from.yaw).multiply(new THREE.Quaternion(r.x, r.y, r.z, r.w));
    placeItem(item, new THREE.Vector3(to.x + off.x, off.y, to.z + off.z), q);
    this.stuckT = 0;
  }

  /** Rimette a posto gli sgabelli: tutti, o solo quelli a meno di 0,6 m dal punto (x, z). */
  clearProps(x = null, z = null) {
    for (const p of this.room.props) {
      const t = p.body.translation();
      if (x !== null && Math.hypot(t.x - x, t.z - z) > 0.6) continue;
      p.body.setTranslation({ x: p.home.x, y: 0, z: p.home.z }, true);
      p.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      p.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      p.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      this.syncProp(p);
    }
  }

  syncProp(p) {
    const t = p.body.translation();
    const r = p.body.rotation();
    p.mesh.position.set(t.x, t.y, t.z);
    p.mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }

  startFree(chemMode) {
    this.mode = 'free';
    this.free = true;
    this.chemMode = chemMode;
    this.clearRoom();
    this.order = null;
    for (const k of ['beaker100', 'beaker100', 'beaker250', 'beaker250', 'flask250', 'cylinder100']) this.spawnGlass(k, 'bench');
    this.spawnTool('spatula');
    this.spawnTool('loop', 'benchB');
    // sullo scaffale in ordine di famiglia (acidi, basi, sali… acqua), come i colori della legenda
    const free = ['water', 'hcl1', 'naoh1', 'php', 'nacl', 'cuso4', 'zn', 'na', 'nahco3', 'vinegar', 'ethanol'];
    // da sinistra a destra per chi guarda lo scaffale (verso sud, quindi da x grande a x piccola)
    const rank = (k) => FAMILY_ORDER.indexOf(reagentLook(this.chem, SHELF[k]).family);
    const slots = [...SLOTS.shelf].sort((a, b) => b[0] - a[0]);
    const first = Math.floor((slots.length - free.length) / 2);
    free.sort((a, b) => rank(a) - rank(b)).forEach((k, i) => {
      const [x, y, z] = slots[first + i];
      this.spawnReagent(k, 'shelf', null, new THREE.Vector3(x, y + 0.003, z));
    });
    this.room.setBoard([this.t('freeTitle'), this.t('freeBoard1'), this.t('freeBoard2'), this.t('freeBoard3')]);
    this.player.teleport(0.15, 0.4, 0);
  }

  startCareer(chemMode, index = 0, money = 0) {
    this.mode = 'career';
    this.free = false;
    this.chemMode = chemMode;
    this.money = money;
    this.clearRoom();
    this.player.teleport(0.15, 0.4, 0);
    this.startOrder(index);
  }

  /** Prepara il banco per l'esercitazione `index` (gli oggetti delle precedenti restano: vanno puliti!). */
  startOrder(index) {
    const def = ORDERS[index];
    if (!def) return;
    const unknowns = [];
    const setup = def.setup(this.chemMode);
    for (const s of setup) {
      if (s.reagent) {
        this.spawnReagent(s.reagent, s.at === 'bench' ? 'bench' : 'shelf');
        continue;
      }
      if (DEFS[s.kind].tool) {
        this.spawnTool(s.kind, s.at === 'bench' ? 'bench' : 'benchB');
        continue;
      }
      const group = s.at === 'bench' ? 'bench' : 'benchB';
      let mixture = new Mixture(this.chem);
      let label = null;
      if (s.content?.solution) {
        const [solute, M, ml] = s.content.solution;
        mixture = Mixture.solution(this.chem, solute, M, ml);
      } else if (s.content?.solid) {
        mixture = Mixture.solid(this.chem, ...s.content.solid);
      }
      if (s.sample !== undefined) {
        label = { title: this.t('sampleName', { s: 'ABC'[s.sample] }), formula: '?', sub: this.t('unknownSub'), color: '#fff8d8' };
        unknowns[s.sample] = s.unknown;
      }
      const reuse = !s.content && this.items.find((it) => it.kind === s.kind && it.mixture?.isEmpty() && !it.data.claimed && !it.data.reagent);
      if (reuse) {
        reuse.data.claimed = true;
        continue;
      }
      const item = this.spawn(s.kind, { pos: this.freeSlot(group), quat: label ? this.facing(group) : null, mixture, label, name: label?.title ?? (s.labelKey ? this.t(s.labelKey) : this.t(`item_${s.kind}`)), data: { sample: s.sample } });
      item.data.claimed = true;
    }
    for (const it of this.items) delete it.data.claimed;
    this.order = {
      index, def, start: this.time, unknowns, answers: null, costs: 0, fines: 0, incidents: 0, wrongBins: 0, broken: 0,
      delivered: false, flameSeen: new Set(), log: [],
    };
    const steps = this.t(`${def.id}Board`);
    this.room.setBoard([this.t('orderN', { n: index + 1, title: this.t(`${def.id}Title`) }), ...(Array.isArray(steps) ? steps : [steps])]);
    this.emit('order', { index, def });
  }

  /** Stato del banco per i passi dell'esercitazione. */
  snapshot() {
    const containers = this.items.filter((it) => it.def.container && it.mixture && !it.data.reagent).map((it) => ({ kind: it.kind, stock: Boolean(it.def.stock), mix: it.mixture, peakT: it.peakT, item: it }));
    return {
      containers,
      best: (key, fn) => containers.reduce((b, c) => Math.max(b, fn(c.mix)), 0),
      delivered: Boolean(this.order?.delivered),
      bunsenOn: this.fx.bunsen.on,
      flameSeen: this.order?.flameSeen ?? new Set(),
    };
  }

  /** Oggetti sul vassoio della cattedra. */
  onTray() {
    const z = this.fx.tray.zone;
    return this.items.filter((it) => it !== this.held && Math.abs(it.mesh.position.x - z.x) < z.hw && Math.abs(it.mesh.position.z - z.z) < z.hd && Math.abs(it.mesh.position.y - z.y) < 0.06);
  }

  /** Disordine: pozze, vetri rotti, carta e cartine abbandonate, fuochi, gas, preparati vecchi non smaltiti. */
  mess() {
    let n = this.puddles.filter((p) => p.stain || p.mix.liquidVolume + p.mix.solidVolume > 1).length;
    for (const it of this.items) {
      if (it === this.held) continue;
      if (it.kind === 'shards') n++;
      else if ((it.kind === 'towel' && !it.mixture?.isEmpty()) || (it.kind === 'strip' && it.data.used)) n++;
      else if (it.data.deliveredOrder !== undefined && it.data.deliveredOrder !== this.order?.index && it.mixture && it.mixture.liquidVolume + it.mixture.solidVolume > RESIDUE_ML * 2) n++;
    }
    return n + this.fires.length + this.clouds.filter((c) => !c.vented).length;
  }

  /** Campanello: consegna il preparato (o apre le risposte del saggio alla fiamma). */
  ringBell() {
    if (this.free || !this.order) {
      this.toast(this.t('bellFree'));
      return;
    }
    const { def } = this.order;
    if (def.answers) {
      this.emit('answers', { count: this.order.unknowns.length, metals: [...new Set(Object.values(FLAME_SALTS))] });
      return;
    }
    const tray = this.onTray().filter((it) => it.def.container && it.mixture && !it.mixture.isEmpty() && !it.data.reagent);
    if (!tray.length) {
      this.toast(this.t('trayEmpty'));
      return;
    }
    const product = tray.sort((a, b) => b.mixture.mass - a.mixture.mass)[0];
    this.finishOrder({ product });
  }

  /** Risposte del saggio alla fiamma (dall'interfaccia). */
  submitAnswers(answers) {
    if (!this.order) return;
    this.order.answers = answers;
    this.finishOrder({ product: null });
  }

  finishOrder({ product }) {
    const o = this.order;
    o.delivered = true;
    const ev = o.def.evaluate({ mode: this.chemMode, product, answers: o.answers ?? {}, unknowns: o.unknowns, ctx: this.chem });
    const elapsed = this.time - o.start;
    const mess = this.mess();
    const costs = Math.round((o.costs + o.fines) * 100) / 100;
    const g = grade({ quality: ev.quality, elapsed, par: o.def.par, mess, incidents: o.incidents, wrongBins: o.wrongBins, pay: o.def.pay, costs });
    this.money = Math.round((this.money + g.net) * 100) / 100;
    if (product) product.data.deliveredOrder = o.index;
    const result = { index: o.index, def: o.def, ...g, quality: ev.quality, lines: ev.lines, elapsed, mess, costs, reagents: o.costs, fines: o.fines, incidents: o.incidents, money: this.money, last: o.index === ORDERS.length - 1 };
    this.emit('result', result);
    return result;
  }

  nextOrder() {
    const next = (this.order?.index ?? -1) + 1;
    if (next >= ORDERS.length) {
      this.emit('careerEnd', { money: this.money });
      return;
    }
    this.startOrder(next);
  }

  // ------------------------------------------------------------------ messaggi e incidenti

  toast(text, kind = 'info') {
    this.emit('toast', { text, kind });
  }

  fine(kind, text) {
    if (this.order && !this.free) {
      this.order.fines += PRICES.fines[kind] ?? 0;
      if (['fire', 'toxic', 'explosion', 'splash', 'sinkHazard'].includes(kind)) this.order.incidents++;
      if (kind === 'wrongBin') this.order.wrongBins++;
    }
    this.toast(text, 'danger');
  }

  addCost(euros) {
    if (this.order && !this.free) this.order.costs += euros;
  }

  // ------------------------------------------------------------------ input

  setMouse(x, y) {
    this.mouse.set(x, y);
  }

  /** Raggio dal centro dello schermo (prima persona) o dal puntatore (vista del bancone). */
  pointerRay() {
    if (this.player.mode === 'bench') this.ray.setFromCamera(this.mouse, this.camera);
    else this.ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    this.ray.far = this.player.mode === 'bench' ? 6 : REACH;
    return this.ray;
  }

  updateHover() {
    const ray = this.pointerRay();
    const targets = [];
    const owner = new Map();
    for (const it of this.items) {
      if (it === this.held) continue;
      for (const m of it.hits) {
        targets.push(m);
        owner.set(m, { type: 'item', item: it });
      }
    }
    for (const f of this.room.fixtures) {
      for (const m of f.hit) {
        targets.push(m);
        owner.set(m, { type: 'fixture', fixture: f });
      }
    }
    for (const p of this.puddles) {
      targets.push(p.mesh);
      owner.set(p.mesh, { type: 'puddle', puddle: p });
    }
    const hits = ray.intersectObjects(targets, false);
    const hit = hits[0];
    if (hit) {
      this.hover = { ...owner.get(hit.object), point: hit.point, distance: hit.distance };
      this.hoverT = this.time;
    } else if (this.time - this.hoverT > 0.12 || this.hover?.item === this.held) {
      // per un attimo si tiene il bersaglio di prima: sfiorando un bordo il contorno e la legenda non lampeggiano
      this.hover = null;
    }
    // con la spatola o l'ansa in mano ha senso «puntare» il contenitore anche oltre il becher davanti
    return this.hover;
  }

  /**
   * Contorno di ciò che si guarda: un guscio appena più grande delle sue mesh che si illumina sui bordi (verde per
   * gli oggetti, ambra per gli elementi fissi). Mai sull'oggetto in mano.
   */
  updateOutline() {
    const h = this.hover;
    const target = h?.type === 'item' && h.item !== this.held ? h.item : h?.type === 'fixture' ? h.fixture : null;
    if (target === this.outlined) return;
    if (this.outlined) for (const m of this.outlined.hits ?? this.outlined.hit) if (m.userData.outline) m.userData.outline.visible = false;
    this.outlined = target;
    if (!target) return;
    const fixture = h.type === 'fixture';
    for (const m of target.hits ?? target.hit) {
      if (!m.geometry || m.material?.blending === THREE.AdditiveBlending) continue;
      if (!m.userData.outline) {
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
        const r = Math.max(0.01, m.geometry.boundingSphere.radius);
        const shell = new THREE.Mesh(m.geometry, fixture ? outlineMaterial(0xf2b84b, 0.75) : outlineMaterial(0x5fd38d, 0.95));
        shell.scale.setScalar(1 + 0.004 / r);
        shell.renderOrder = 7;
        shell.raycast = () => {};
        m.add(shell);
        m.userData.outline = shell;
      }
      m.userData.outline.visible = true;
    }
  }

  /**
   * Clic sinistro, come in Cooking Simulator: prende, usa un elemento fisso, posa; con un recipiente in mano, sul
   * lavandino lo porta sotto il rubinetto. Nella manipolazione precisa il sinistro serve ad alzare (con il mouse).
   */
  primary() {
    const held = this.held;
    const h = this.hover;
    if (held) {
      if (this.precise || this.filling) return;
      if (held.def.container && h?.type === 'fixture' && h.fixture.kind === 'sink') return this.startFilling();
      this.release();
      return;
    }
    if (h?.type === 'item') this.grab(h.item);
    else if (h?.type === 'fixture') this.use(true);
  }

  /**
   * Clic destro: smette di riempire, annulla la rotazione o rimette l'oggetto dove lo si era preso; a mani vuote
   * abbassa la piastra.
   */
  secondary() {
    if (this.filling) return this.stopFilling();
    const item = this.held;
    if (!item) {
      const f = this.hover?.type === 'fixture' ? this.hover.fixture : null;
      if (f?.kind === 'hotplate' && f.level) this.setPlate(f.level - 1);
      return;
    }
    if (item.rotYaw || item.rotPitch) return this.resetRotation();
    this.putBack();
  }

  /** Si può rimettere a posto l'oggetto in mano (preso da un piano, e lì vicino)? */
  canPutBack() {
    const from = this.held?.takenFrom;
    return Boolean(from) && from.pos.distanceTo(this.held.mesh.position) <= PUT_BACK_REACH;
  }

  /** Rimette l'oggetto in mano nel punto da cui lo si è preso (scivola lì come nella posa), se è ancora libero. */
  putBack() {
    const item = this.held;
    const from = item.takenFrom;
    if (!from) return;
    if (!this.canPutBack()) return this.toast(this.t('putBackFar'));
    const foot = this.footprint(item);
    const rot = { x: from.quat.x, y: from.quat.y, z: from.quat.z, w: from.quat.w };
    if (this.physics.overlaps(foot, { x: from.pos.x, y: from.pos.y + foot.hh + PLACE_LIFT, z: from.pos.z }, { rot, exclude: item.body })) return this.toast(this.t('putBackBusy'));
    this.letGo();
    this.placing = { item, pos: from.pos.clone().setY(from.pos.y + PLACE_LIFT), quat: from.quat.clone(), t: 0, limit: 0.6 };
  }

  grab(item) {
    if (item.data.inBin) return;
    if (this.placing?.item === item) this.placing = null;
    // da dove lo si prende, per rimetterlo a posto con il clic destro: solo se era dritto, fermo e appoggiato
    const p = item.mesh.position;
    const v = item.body.linvel();
    const upright = _v.set(0, 1, 0).applyQuaternion(item.mesh.quaternion).y > 0.95;
    const resting = upright && Math.hypot(v.x, v.y, v.z) < 0.05 && this.physics.ray({ x: p.x, y: p.y + 0.01, z: p.z }, { x: 0, y: -1, z: 0 }, 0.03, { exclude: item.body });
    item.takenFrom = resting ? { pos: p.clone(), quat: item.mesh.quaternion.clone() } : null;
    this.held = item;
    this.tilt = 0;
    this.ghost = this.makeGhost(item);
    if (this.hover?.item === item) this.hover = null;
    if (this.player.mode === 'walk') this.holdDist = Math.max(0.35, Math.min(0.7, this.camera.position.distanceTo(p)));
    else this.lift = Math.max(0.1, Math.min(0.4, p.y - this.benchPlaneY() + 0.16));
    item.body.wakeUp();
    item.body.setGravityScale(0, true);
  }

  /**
   * Dove posare l'oggetto in mano: sul piano che si guarda, nel punto in cui si fermerebbe davvero (l'ingombro
   * dell'oggetto calato dall'alto). Valido se il piano è orizzontale e fisso, a portata, con il centro appoggiato e
   * senza toccare altri oggetti. null se non si guarda un piano (un muro, il fianco di un oggetto, il vuoto).
   * @returns {{pos: THREE.Vector3, quat: THREE.Quaternion, valid: boolean}|null}
   */
  placeSpot(item) {
    const ray = this.pointerRay();
    const o = ray.ray.origin;
    const d = ray.ray.direction;
    const hit = this.physics.ray({ x: o.x, y: o.y, z: o.z }, { x: d.x, y: d.y, z: d.z }, ray.far, { exclude: item.body });
    if (!hit || hit.normal.y < 0.5) return null;
    const foot = this.footprint(item);
    const quat = this.placeQuat(item);
    const rot = { x: quat.x, y: quat.y, z: quat.z, w: quat.w };
    const { x, z } = hit.point;
    const rest = this.physics.restHeight(foot, x, z, hit.point.y + foot.hh + 0.03, { rot, exclude: item.body, maxDrop: 0.2 });
    if (!rest) return null;
    const pos = new THREE.Vector3(x, rest.y - foot.hh + PLACE_LIFT, z);
    const support = rest.collider.parent();
    let valid = rest.normal.y >= 0.9 && (!support || support.isFixed()) && pos.distanceTo(item.mesh.position) <= PLACE_REACH;
    // il centro deve appoggiare (non a sbalzo oltre il bordo) e l'ingombro non deve toccare altri oggetti
    if (valid) valid = Boolean(this.physics.ray({ x, y: pos.y + 0.01, z }, { x: 0, y: -1, z: 0 }, 0.02, { exclude: item.body }));
    if (valid) valid = !this.physics.overlaps(foot, { x, y: pos.y + foot.hh, z }, { rot, exclude: item.body });
    return { pos, quat, valid };
  }

  /** Orientamento di posa: dritto, girato come lo si tiene (compresa la rotazione data con R). */
  placeQuat(item, out = new THREE.Quaternion()) {
    const yaw = this.holdYaw() + (item.rotYaw ?? 0);
    return out.setFromAxisAngle(UP, item.def.container || item.kind === 'extinguisher' ? yaw : yaw + Math.PI / 2);
  }

  /** Ingombro per la posa: cilindro { r, hh } per i contenitori, la forma del corpo { hx, hh, hz } per gli strumenti. */
  footprint(item) {
    if (item.footprint) return item.footprint;
    const d = item.def;
    const s = item.shapes?.[0];
    if (d.container) item.footprint = { r: Math.max(d.outer[0], d.foot?.[0] ?? 0), hh: d.outer[1] / 2 };
    else if (s?.type === 'cylinder') item.footprint = { r: s.r, hh: s.hh };
    else if (s?.type === 'box') item.footprint = { hx: s.hx, hh: s.hy, hz: s.hz };
    else item.footprint = { hx: d.size[0] / 2, hh: d.size[1] / 2, hz: d.size[2] / 2 };
    return item.footprint;
  }

  /** Sagoma trasparente dell'oggetto (le sue mesh, con le stesse geometrie) per mostrare dove lo si poserà. */
  makeGhost(item) {
    const g = new THREE.Group();
    item.mesh.updateMatrixWorld();
    const inv = item.mesh.matrixWorld.clone().invert();
    for (const m of item.hits) {
      if (!m.geometry || !m.visible || m.material?.blending === THREE.AdditiveBlending) continue;
      const c = new THREE.Mesh(m.geometry, this.ghostMats.ok);
      c.matrixAutoUpdate = false;
      c.matrix.multiplyMatrices(inv, m.matrixWorld);
      c.renderOrder = 5;
      c.raycast = () => {};
      g.add(c);
    }
    g.visible = false;
    this.scene.add(g);
    return g;
  }

  /** Sagoma dove si poserebbe l'oggetto in mano: verde se lì si può, rossa se no, nascosta se non si guarda un piano. */
  updateGhost() {
    const item = this.held;
    this.spot = item && this.tilt < 0.05 && !this.precise && !this.filling ? this.placeSpot(item) : null;
    if (!this.ghost) return;
    const s = this.spot;
    this.ghost.visible = Boolean(s);
    if (!s) return;
    this.ghost.position.copy(s.pos);
    this.ghost.quaternion.copy(s.quat);
    const mat = s.valid ? this.ghostMats.ok : this.ghostMats.bad;
    if (this.ghost.children[0]?.material !== mat) for (const c of this.ghost.children) c.material = mat;
  }

  /** Mani libere: niente più sagoma, carica del lancio, precisione, riempimento né versamento. */
  letGo() {
    this.held = null;
    this.pouring = false;
    this.spraying = false;
    this.charge = null;
    this.spot = null;
    this.ghost?.removeFromParent();
    this.ghost = null;
    this.setPrecise(false);
    this.stopFilling();
    this.endRotate();
  }

  /**
   * Lascia l'oggetto in mano. Su un punto di posa valido scivola lì (posa morbida); altrimenti cade, con la velocità
   * della mano limitata. throwSpeed: lanciato in avanti; still: lasciato fermo esattamente dov'è (precisione).
   */
  release(throwSpeed = 0, { still = false } = {}) {
    const item = this.held;
    if (!item) return;
    const spot = throwSpeed || still ? null : this.placeSpot(item);
    this.letGo();
    if (spot?.valid) {
      this.placing = { item, pos: spot.pos, quat: spot.quat, t: 0 };
      return;
    }
    item.body.setGravityScale(1, true);
    item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    if (still) {
      item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }
    const v = item.body.linvel();
    const cap = 1.2;
    item.body.setLinvel({ x: clamp(v.x, -cap, cap), y: clamp(v.y, -cap, cap), z: clamp(v.z, -cap, cap) }, true);
    if (throwSpeed) {
      this.camera.getWorldDirection(_v);
      item.body.setLinvel({ x: _v.x * throwSpeed, y: _v.y * throwSpeed + 1.2, z: _v.z * throwSpeed }, true);
    }
  }

  /** Fine della posa morbida: l'oggetto è al suo posto, fermo, e torna la gravità. */
  finishPlacing() {
    const pl = this.placing;
    this.placing = null;
    placeItem(pl.item, pl.pos, pl.quat);
    pl.item.body.setGravityScale(1, true);
  }

  /**
   * Posa morbida, a ogni passo fisico: porta l'oggetto al punto di posa; entro 1 cm e 2°, o dopo 0,3 s (0,6 s per
   * rimetterlo a posto, che può essere più lontano), è posato.
   */
  settle(dt) {
    const pl = this.placing;
    pl.t += dt;
    const body = pl.item.body;
    const p = body.translation();
    const r = body.rotation();
    const dist = Math.hypot(pl.pos.x - p.x, pl.pos.y - p.y, pl.pos.z - p.z);
    const angle = _q3.set(r.x, r.y, r.z, r.w).angleTo(pl.quat);
    if ((dist < 0.01 && angle < 0.035) || pl.t > (pl.limit ?? 0.3)) this.finishPlacing();
    else this.drive(body, pl.pos, pl.quat, 16, 3); // sotto la velocità che rompe il vetro (3,3 m/s)
  }

  /** Tasto centrale premuto: comincia a caricare il lancio; nella manipolazione precisa lascia l'oggetto lì, fermo. */
  middleDown() {
    if (this.held && this.precise) this.release(0, { still: true });
    else this.chargeThrow();
  }

  chargeThrow() {
    if (this.held && this.charge === null) this.charge = this.time;
  }

  /** Tasto centrale lasciato: lancia, tanto più forte quanto più a lungo lo si è tenuto (da 1,5 a 8 m/s in un secondo). */
  throwHeld(seconds = null) {
    // lasciato senza aver caricato (premuto a mani vuote, poi preso qualcosa): niente lancio
    if (seconds === null && this.charge === null) return;
    const s = seconds ?? this.time - this.charge;
    this.charge = null;
    if (this.held) this.release(throwSpeed(s));
  }

  /** Destro premuto con un oggetto in mano: il mouse lo ruota (nella precisione un recipiente si inclina e versa). */
  startRotate() {
    if (!this.held) return;
    this.rotating = true;
    this.rotPour = Boolean(this.precise && this.held.def.container);
    if (this.rotPour) this.pouring = true;
  }

  endRotate() {
    if (this.rotPour) this.pouring = false;
    this.rotPour = false;
    this.rotating = false;
  }

  /**
   * Destro + mouse: ruota l'oggetto in mano attorno alla verticale; in su e in giù inclina gli strumenti e, nella
   * manipolazione precisa, i recipienti (è così che si versa goccia a goccia).
   */
  rotateBy(dx, dy) {
    const item = this.held;
    if (!item) return;
    item.rotYaw = wrapAngle((item.rotYaw ?? 0) - dx * ROT_SPEED);
    if (!item.def.container) item.rotPitch = clamp((item.rotPitch ?? 0) - dy * ROT_SPEED, -1.2, 1.2);
    else if (this.rotPour) this.tiltBy(-dy);
  }

  /** Destro + rotella: ruota a scatti di 15°. */
  rotateStep(dir) {
    const item = this.held;
    if (item) item.rotYaw = wrapAngle(Math.round((item.rotYaw ?? 0) / ROT_STEP) * ROT_STEP + dir * ROT_STEP);
  }

  /** Annulla la rotazione: l'oggetto torna dritto. */
  resetRotation() {
    if (!this.held) return;
    this.held.rotYaw = 0;
    this.held.rotPitch = 0;
  }

  /**
   * Maiusc tenuto con un oggetto in mano (in prima persona): manipolazione precisa. Lo sguardo e i passi si fermano, il
   * mouse sposta l'oggetto attorno al punto in cui era, sinistro + mouse lo alza o lo abbassa, destro + mouse lo ruota,
   * il tasto centrale lo lascia lì.
   */
  setPrecise(on) {
    if (on && this.held && !this.precise && this.player.mode === 'walk' && !this.filling) {
      const p = this.held.body.translation();
      this.precise = { anchor: new THREE.Vector3(p.x, p.y, p.z), off: new THREE.Vector3() };
    } else if (!on) this.precise = null;
    this.player.frozen = Boolean(this.precise || this.filling);
  }

  /** Sinistro + mouse nella manipolazione precisa: in su alza l'oggetto, in giù lo abbassa. */
  preciseLift(dy) {
    if (this.precise) this.precise.off.y = clamp(this.precise.off.y - dy * PRECISE_STEP, -0.2, 0.3);
  }

  /** Mouse nella manipolazione precisa: a destra e a sinistra, avanti e indietro rispetto allo sguardo. */
  preciseMove(dx, dy) {
    const pr = this.precise;
    if (!pr) return;
    const sin = Math.sin(this.player.yaw);
    const cos = Math.cos(this.player.yaw);
    // destra = (cos, −sin), avanti = (−sin, −cos); il mouse in su (dy < 0) porta avanti
    pr.off.x += (cos * dx + sin * dy) * PRECISE_STEP;
    pr.off.z += (-sin * dx + cos * dy) * PRECISE_STEP;
    const len = Math.hypot(pr.off.x, pr.off.z);
    if (len > PRECISE_RANGE) {
      pr.off.x *= PRECISE_RANGE / len;
      pr.off.z *= PRECISE_RANGE / len;
    }
  }

  /**
   * Clic sul lavandino con un recipiente in mano: lo porta sotto il rubinetto (fermi lì, come nella vista del lavello
   * di Cooking Simulator). L'acqua scorre finché si tiene premuto il sinistro; il clic destro smette.
   */
  startFilling() {
    const sink = this.fx.sink;
    const sp = sink.spout;
    if (this.held.mesh.position.distanceTo(_v.set(sp.x, sp.y - 0.1, sp.z)) > 1.1) {
      this.toast(this.t('fillCloser'));
      return;
    }
    this.setPrecise(false);
    this.filling = true;
    this.player.frozen = true;
    this.tilt = 0;
    this.tapWasOn = sink.tap;
  }

  /** Nel riempimento: sinistro premuto apre l'acqua, lasciato la chiude. */
  setWater(on) {
    if (this.filling) this.fx.sink.tap = on || this.tapWasOn;
  }

  stopFilling() {
    if (!this.filling) return;
    this.filling = false;
    this.player.frozen = Boolean(this.precise);
    this.fx.sink.tap = this.tapWasOn;
  }

  setPour(on) {
    this.pouring = on && Boolean(this.held);
  }

  /** Inclina l'oggetto in mano (mouse con il sinistro tenuto); vicino al bordo, dove inizia il versamento, più finemente. */
  tiltBy(dy) {
    if (!this.held) return;
    const max = this.held.def.container ? 2.6 : 1.2;
    if (this.filling) return;
    // più fine vicino al bordo e, ancora di più, nella manipolazione precisa (versamento goccia a goccia)
    const gain = (this.held.def.container ? tiltGain(this.held.pourHead) : 1) * (this.precise ? 0.4 : 1);
    this.tilt = Math.max(0, Math.min(max, this.tilt + dy * 0.0045 * gain));
  }

  wheel(delta) {
    if (this.held && this.rotating) return this.rotateStep(delta < 0 ? 1 : -1);
    if (this.filling) {
      this.tapFlow = clamp(this.tapFlow + (delta < 0 ? 5 : -5), 5, 50);
      return;
    }
    if (this.precise) {
      this.precise.off.y = clamp(this.precise.off.y - delta * 0.0001, -0.2, 0.3);
      return;
    }
    const h = this.hover;
    if (!this.held && h?.type === 'fixture' && h.fixture.kind === 'hotplate') {
      this.setPlate(h.fixture.level + (delta < 0 ? 1 : -1));
      return;
    }
    if (this.player.mode === 'walk') this.holdDist = Math.max(0.3, Math.min(0.9, this.holdDist - delta * 0.0006));
    else this.lift = Math.max(0.03, Math.min(0.45, this.lift - delta * 0.0004));
  }

  setPlate(level) {
    const hp = this.fx.hotplate;
    hp.level = Math.max(0, Math.min(5, level));
    this.toast(hp.level ? this.t('plateLevel', { n: hp.level, temp: Math.round(22 + hp.level * 60) }) : this.t('plateOff'));
  }

  toggleView() {
    this.setPrecise(false);
    if (this.player.mode === 'walk') this.player.enterBench();
    else this.player.exitBench();
  }

  station(delta) {
    if (this.player.mode === 'bench') this.player.setStation(this.player.station + delta);
  }

  benchPlaneY() {
    const s = STATIONS[this.player.station];
    return s.look[1];
  }

  /**
   * Tasto E: usa ciò che si guarda (o lo strumento in mano su ciò che si guarda).
   * @param {boolean} down premuto (true) o rilasciato (false, per l'estintore)
   * @param {boolean} fine con Maiusc: un pizzico con la spatola, abbassa la piastra (come il clic destro)
   */
  use(down = true, fine = false) {
    const held = this.held;
    if (held?.kind === 'extinguisher') {
      this.spraying = down;
      return;
    }
    if (!down) return;
    const h = this.hover;
    const fixture = h?.type === 'fixture' ? h.fixture : null;
    const target = h?.type === 'item' ? h.item : null;
    // strumenti in mano
    if (held?.kind === 'spatula') return this.useSpatula(held, target, fine);
    if (held?.kind === 'loop') return this.useLoop(held, target);
    if (held?.kind === 'strip') return this.useStrip(held, target);
    if (held?.kind === 'towel' && h?.type === 'puddle') return this.wipe(held, h.puddle);
    if (held?.def.container && fixture) {
      // E pulisce, come la spugna di Cooking Simulator: il contenuto va nello scarico (riempire è il clic)
      if (fixture.kind === 'sink') return this.wash(held);
      if (fixture.kind === 'bin') return this.emptyInto(held, fixture);
    }
    if (fixture) return this.useFixture(fixture, fine);
    if (held?.def.container) {
      this.swirlT = 1.2;
      return;
    }
    if (target && !held) this.grab(target);
  }

  useFixture(f, fine) {
    const { t } = this;
    switch (f.kind) {
      case 'hotplate':
        this.setPlate(f.level + (fine ? -1 : 1) > 5 ? 0 : f.level + (fine ? -1 : 1));
        break;
      case 'bunsen':
        f.on = !f.on;
        this.toast(f.on ? t('bunsenOn') : t('bunsenOff'));
        break;
      case 'sink':
        f.tap = !f.tap;
        break;
      case 'balance':
        f.tare = this.balanceReading(true);
        this.toast(t('tared'));
        break;
      case 'hood':
        f.on = !f.on;
        this.toast(f.on ? t('hoodOn') : t('hoodOff'));
        break;
      case 'lamp':
        f.on = !f.on;
        this.toast(f.on ? t('lampOn') : t('lampOff'));
        break;
      case 'shower':
        this.fx.shower.t = 4;
        break;
      case 'bell':
        this.ringBell();
        break;
      case 'store':
        if (this.free) this.emit('catalog');
        else this.toast(t('storeCareer'));
        break;
      case 'towels':
        if (!this.held) this.grab(this.spawnTool('towel', null, this.handPoint()));
        break;
      case 'strips':
        if (!this.held) this.grab(this.spawnTool('strip', null, this.handPoint()));
        break;
      default:
        break;
    }
  }

  /** Punto davanti alla camera dove compare ciò che si prende da un distributore. */
  handPoint() {
    this.camera.getWorldDirection(_v);
    return this.camera.position.clone().addScaledVector(_v, 0.45).add(new THREE.Vector3(0, -0.08, 0));
  }

  useSpatula(sp, target, pinch) {
    if (target) target.data.usedAt = this.time;
    const { t, chem } = this;
    if (!target?.def.container || !target.mixture) {
      this.toast(t('spatulaHint'));
      return;
    }
    const mix = target.mixture;
    if (sp.load && !sp.load.isEmpty()) {
      target.mixture.add(sp.load);
      this.toast(t('spatulaDrop', { g: this.fmt(sp.load.mass, 2), name: this.itemName(target) }));
      sp.load = null;
      sp.heap.visible = false;
      return;
    }
    const solid = mix.solidVolume;
    if (solid < 0.01) {
      this.toast(t('spatulaEmpty'));
      return;
    }
    const grams = this.chemMode === 'simple' ? (pinch ? 0.1 : 1) : pinch ? 0.05 + Math.random() * 0.12 : 0.6 + Math.random() * 0.65;
    // grammi di solido non sciolto nel contenitore
    let solidG = 0;
    for (const [sid, mol] of mix.n) if (typeof sid === 'number' && sid !== WATER && mix.phaseOf(sid) === 1) solidG += (mol - (mix.d.get(sid) ?? 0)) * chem.molar(sid);
    if (solidG <= 0) return;
    // dal barattolo sotto olio si pesca il pezzetto di metallo (nella realtà con la pinza, poi asciugato sulla carta)
    if (mix.liquidVolume > 1 && !target.def.oil) {
      this.toast(t('spatulaWet'));
      return;
    }
    sp.load = mix.takeFraction(Math.min(1, grams / solidG), { solidOnly: true, keepLiquid: true });
    if (target.data.reagent) this.addCost(sp.load.mass * PRICES.solidPerGram);
    sp.heap.visible = true;
    const c = sp.load.appearance().solid;
    sp.heap.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
    sp.heap.scale.setScalar(Math.max(0.4, Math.min(1.4, Math.cbrt(sp.load.mass))));
  }

  useLoop(loop, target) {
    if (target) target.data.usedAt = this.time;
    const { t, chem } = this;
    if (!target?.def.container || !target.mixture || target.mixture.isEmpty()) {
      this.toast(t('loopHint'));
      return;
    }
    const mix = target.mixture;
    // pulizia nell'acido cloridrico
    if (mix.dissolved('hcl') > 1e-5) {
      loop.data.specimen = null;
      loop.data.residue = null;
      this.toast(t('loopClean'));
      return;
    }
    let best = 0;
    let tint = 0;
    for (const [sid, mol] of mix.n) {
      if (typeof sid !== 'number') continue;
      const tz = chem.sub(sid).tintZ || (chem.sub(sid).flameColor ? sid : 0);
      if (tz && mol > best) {
        best = mol;
        tint = tz;
      }
    }
    loop.data.specimen = { tint, from: target.data.sample };
    this.toast(t('loopLoaded', { name: this.itemName(target) }));
  }

  useStrip(strip, target) {
    if (target) target.data.usedAt = this.time;
    const { t } = this;
    if (!target?.def.container || !target.mixture) return;
    const ph = target.mixture.pH();
    if (ph === null) {
      this.toast(t('stripDry'));
      return;
    }
    strip.data.used = true;
    strip.data.ph = ph;
    const c = UNIVERSAL_SCALE[Math.max(0, Math.min(14, Math.round(ph)))];
    strip.pad.material.color.set(c);
    this.emit('strip', { ph, color: c });
    this.toast(this.chemMode === 'simple' ? t('stripSimple', { ph: Math.round(ph), what: t(ph < 6.5 ? 'acidic' : ph > 7.5 ? 'basic' : 'neutral') }) : t('stripReal'));
  }

  wipe(towel, puddle) {
    const room = DEFS.towel.absorbs - towel.mixture.liquidVolume;
    if (room <= 0.5) {
      this.toast(this.t('towelFull'));
      return;
    }
    const vol = puddle.mix.liquidVolume + puddle.mix.solidVolume;
    const part = puddle.mix.take(Math.min(room, vol));
    if (puddle.mix.liquidVolume + puddle.mix.solidVolume < room) part.add(puddle.mix.takeFraction(1, { solidOnly: true }));
    towel.mixture.add(part);
    const c = towel.mixture.appearance().liquid;
    towel.paper.material.color.setRGB(0.6 + c[0] / 640, 0.6 + c[1] / 640, 0.6 + c[2] / 640);
    this.updatePuddle(puddle);
    this.toast(this.t('wiped'));
  }

  /** Lava un contenitore al lavandino: il contenuto va nello scarico (se si può), il vetro torna pulito. */
  wash(item) {
    if (item.mixture && !item.mixture.isEmpty()) {
      const content = item.mixture.takeFraction(1);
      content.add(item.mixture.takeFraction(1, { solidOnly: true }));
      this.disposeWaste(content, 'sink', item, true);
      item.mixture.clear();
    }
    item.dirty = false;
    this.toast(this.t('washed', { name: this.itemName(item) }));
  }

  /** Svuota il contenitore in un contenitore dei rifiuti (resta un velo di residuo). */
  emptyInto(item, bin) {
    if (!item.mixture || item.mixture.isEmpty()) return;
    const lv = item.mixture.liquidVolume;
    const content = lv > RESIDUE_ML ? item.mixture.take(lv - RESIDUE_ML) : new Mixture(this.chem);
    content.add(item.mixture.takeFraction(0.97, { solidOnly: true }));
    this.disposeWaste(content, bin.bin, item, true);
    item.dirty = true;
  }

  /**
   * Smaltisce una miscela in un contenitore dei rifiuti o nel lavandino, con le multe se è quello sbagliato.
   * Durante un versamento continuo controlla una volta ogni pochi secondi.
   */
  disposeWaste(mix, bin, source = null, once = false) {
    if (!mix || mix.isEmpty()) return;
    const cls = wasteClass(mix);
    const key = `${source?.id ?? 0}:${bin}`;
    const last = this.lastDisposal.get(key);
    if (!once && last && this.time - last < 3) return;
    this.lastDisposal.set(key, this.time);
    const binName = this.t(`bin_${bin}`);
    if (bin === 'sink') {
      if (cls !== 'sink') this.fine('sinkHazard', this.t('sinkHazard', { what: this.t(`waste_${cls}`) }));
      return;
    }
    if (!binAccepts(bin, cls)) this.fine('wrongBin', this.t('wrongBin', { bin: binName, right: this.t(`bin_${cls === 'solid' ? 'solid' : cls}`) }));
    else if (once) this.toast(this.t('disposedOk', { bin: binName }), 'ok');
  }

  // ------------------------------------------------------------------ controllo dell'oggetto in mano (a ogni passo fisico)

  /** Orientamento voluto per l'oggetto in mano. */
  /** Direzione (attorno alla verticale) in cui si tiene l'oggetto: lo sguardo, o la postazione nella vista del bancone. */
  holdYaw() {
    if (this.player.mode === 'walk') return this.player.yaw;
    const st = STATIONS[this.player.station];
    return Math.atan2(-(st.look[0] - st.cam[0]), -(st.look[2] - st.cam[2]));
  }

  holdQuat(out) {
    const item = this.held;
    const yaw = this.holdYaw() + (item.rotYaw ?? 0);
    const wobble = this.swirlT > 0 ? Math.sin(this.swirlT * 18) * 0.25 : 0;
    if (item.def.container) {
      out.setFromAxisAngle(UP, yaw);
      out.multiply(_q2.setFromAxisAngle(X, -this.tilt + wobble * 0.3));
      if (wobble) out.multiply(_q2.setFromAxisAngle(Z, wobble * 0.4));
    } else if (item.kind === 'extinguisher') {
      out.setFromAxisAngle(UP, yaw);
    } else {
      out.setFromAxisAngle(UP, yaw + Math.PI / 2);
      const pitch = this.player.mode === 'walk' ? this.player.pitch * 0.8 : -0.5;
      out.multiply(_q2.setFromAxisAngle(Z, pitch - this.tilt + (item.rotPitch ?? 0)));
    }
    return out;
  }

  /**
   * Dove deve stare l'oggetto in mano. Inclinando un contenitore, la sua bocca va sul punto guardato; se si guarda un
   * altro contenitore (o il lavandino, o un bidone) si allinea sopra la sua apertura, così il getto ci cade dentro.
   */
  holdTarget(out, quat) {
    const item = this.held;
    if (this.filling) {
      // sotto il rubinetto, con l'imboccatura 5 cm più in basso: si vede l'acqua che entra
      const sp = this.fx.sink.spout;
      return out.set(sp.x, Math.max(this.fx.sink.basin.y + 0.003, sp.y - 0.05 - item.def.height), sp.z);
    }
    // manipolazione precisa: dove lo porta il mouse, senza l'aiuto alla mira
    if (this.precise) return out.copy(this.precise.anchor).add(this.precise.off);
    if (this.player.mode === 'walk') {
      this.camera.getWorldDirection(_v2);
      out.copy(this.camera.position).addScaledVector(_v2, this.holdDist);
      out.y -= 0.06 + (item.def.container ? item.def.height * 0.4 : 0);
    } else {
      // durante il passaggio da una postazione all'altra conta già la camera d'arrivo: con quella a metà strada il
      // punto sotto il puntatore salterebbe lontano e l'oggetto ci volerebbe contro i mobili
      this.ray.setFromCamera(this.mouse, this.player.camT < 1 ? this.benchCamera() : this.camera);
      const y = this.benchPlaneY() + this.lift;
      const d = this.ray.ray.direction;
      const o = this.ray.ray.origin;
      const k = Math.abs(d.y) > 1e-4 ? (y - o.y) / d.y : 1;
      out.copy(o).addScaledVector(d, Math.max(0.2, Math.min(4, k)));
    }
    if (!item.def.container) return this.toolTarget(out, quat);
    if (this.tilt < 0.25) return out;
    const blend = Math.min(1, (this.tilt - 0.25) / 0.5);
    const aim = this.pourAim(out);
    // punto più basso del bordo con l'orientamento voluto, rispetto all'origine del contenitore
    const top = item.def.profile[item.def.profile.length - 1][1];
    const lip = _v2.set(0, top, -item.def.rimR * 1.05).applyQuaternion(quat);
    const goal = aim.clone().sub(lip);
    // il getto parte in avanti: si arretra la bocca di quanto si sposta cadendo
    const fall = Math.sqrt((2 * (0.05 + 0.02 * this.tilt)) / 9.81);
    const drift = Math.min(0.03, (item.streamSpeed ?? 0) * fall);
    if (drift > 0) goal.add(_v2.set(0, 0, drift).applyAxisAngle(UP, this.holdYaw() + (item.rotYaw ?? 0)));
    return out.lerp(goal, blend);
  }

  /** Camera della vista del bancone già arrivata alla postazione (la vera può essere ancora in movimento). */
  benchCamera() {
    this.arrivalCam ??= new THREE.PerspectiveCamera();
    const c = this.arrivalCam;
    c.copy(this.camera, false);
    c.position.copy(this.player.benchCam.pos);
    c.lookAt(this.player.benchCam.look);
    c.updateMatrixWorld();
    return c;
  }

  /** Strumenti: la punta (ansa, cucchiaio della spatola, cartina) va sul punto guardato, se è a portata. */
  toolTarget(out, quat) {
    const item = this.held;
    const tip = TOOL_TIPS[item.kind];
    const h = this.hover;
    if (!tip || !h?.point || h.distance > this.holdDist + 0.6) return out;
    const offset = _v2.set(...tip).applyQuaternion(quat);
    // guardando il becco Bunsen con l'ansa, la punta va nel cuore della fiamma
    if (item.kind === 'loop' && h.fixture?.kind === 'bunsen') {
      const fl = this.fx.bunsen.flame;
      return out.set(fl.x, fl.y + 0.07, fl.z).sub(offset);
    }
    // davanti al punto colpito, non dentro la superficie
    const dir = this.pointerRay().ray.direction;
    return out.copy(h.point).addScaledVector(dir, -0.01).sub(offset);
  }

  /** Punto dove portare la bocca del contenitore che si sta inclinando. */
  pourAim(fallback) {
    const h = this.hover;
    const lift = 0.05 + 0.02 * this.tilt;
    if (h?.type === 'item' && h.item.def.container && h.item !== this.held) {
      const it = h.item;
      const top = it.def.profile[it.def.profile.length - 1][1];
      const c = new THREE.Vector3(0, top, 0).applyMatrix4(it.mesh.matrixWorld);
      return c.add(new THREE.Vector3(0, lift, 0));
    }
    if (h?.type === 'fixture' && h.fixture.kind === 'sink') {
      const b = h.fixture.basin;
      return new THREE.Vector3((b.x0 + b.x1) / 2, b.top + 0.08, (b.z0 + b.z1) / 2);
    }
    if (h?.type === 'fixture' && h.fixture.kind === 'bin') {
      const o = h.fixture.opening;
      return new THREE.Vector3(o.x, o.y + 0.1, o.z);
    }
    return fallback.clone();
  }

  controlHeld(dt) {
    if (this.placing) this.settle(dt);
    const item = this.held;
    if (!item) return;
    const body = item.body;
    const quat = this.holdQuat(_q);
    const target = this.holdTarget(_v, quat);
    const p = body.translation();
    // rete di sicurezza: un oggetto finito fuori dalla stanza (dentro un muro) torna subito davanti al giocatore
    if (Math.abs(p.x) > ROOM.W / 2 - 0.02 || Math.abs(p.z) > ROOM.D / 2 - 0.02 || p.y < 0) {
      placeItem(item, target, quat);
      return;
    }
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dz = target.z - p.z;
    const dist = Math.hypot(dx, dy, dz);
    // incastrato dietro un ostacolo per mezzo secondo: lo si lascia (girarsi di scatto non basta)
    this.stuckT = dist > 0.9 ? (this.stuckT ?? 0) + dt : 0;
    if (this.stuckT > 0.5) {
      this.stuckT = 0;
      this.release();
      return;
    }
    // nella manipolazione precisa più piano: l'oggetto urta meno quelli accanto
    if (this.precise) this.drive(body, target, quat, 8, 1.5);
    else this.drive(body, target, quat, 16, 9);
  }

  /** Porta un corpo verso una posizione e un orientamento (guadagno k in 1/s, velocità massima vmax in m/s). */
  drive(body, target, quat, k, vmax) {
    const p = body.translation();
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dz = target.z - p.z;
    const dist = Math.hypot(dx, dy, dz);
    const s = Math.min(1, vmax / Math.max(1e-6, dist * k));
    body.setLinvel({ x: dx * k * s, y: dy * k * s, z: dz * k * s }, true);
    const r = body.rotation();
    const cur = new THREE.Quaternion(r.x, r.y, r.z, r.w);
    const err = quat.clone().multiply(cur.invert());
    if (err.w < 0) err.set(-err.x, -err.y, -err.z, -err.w);
    const angle = 2 * Math.acos(Math.min(1, err.w));
    const sin = Math.sqrt(Math.max(1e-9, 1 - err.w * err.w));
    const w = Math.min(14, angle * 14);
    body.setAngvel({ x: (err.x / sin) * w, y: (err.y / sin) * w, z: (err.z / sin) * w }, true);
  }

  /** Urto tra corpi: la vetreria colpita troppo forte si rompe (dopo il passo, non durante). */
  impact(owner, force, other, speed) {
    if (!owner?.def?.breakable || owner === this.held || owner === this.placing?.item) return;
    if (speed > BREAK_SPEED && force > owner.def.mass * 60) this.pendingBreaks.add(owner);
  }

  breakItem(item) {
    if (!this.items.includes(item)) return;
    const p = item.mesh.position.clone();
    const mix = item.mixture;
    // schegge che volano
    for (let k = 0; k < 26; k++) this.drops.emit(p.x, p.y + 0.04, p.z, (Math.random() - 0.5) * 2, Math.random() * 1.8, (Math.random() - 0.5) * 2, 0.002 + Math.random() * 0.003, [230, 240, 250], 1.4, 0);
    const hazard = mix && !mix.isEmpty() ? this.hazardOf(mix) : null;
    if (mix && !mix.isEmpty()) {
      const content = mix.takeFraction(1);
      content.add(mix.takeFraction(1, { solidOnly: true }));
      this.spill(content, p, null);
    }
    const price = PRICES.glass[item.kind] ?? 4;
    this.addCost(price);
    if (this.order) this.order.broken++;
    this.removeItem(item);
    const shards = this.spawnTool('shards', null, new THREE.Vector3(p.x, p.y + 0.02, p.z));
    shards.data.from = item.kind;
    this.toast(this.t('broken', { price: this.fmt(price, 0) }), 'danger');
    // schizzi corrosivi o tossici vicino al giocatore: doccia di emergenza
    if (hazard && ['corrosive', 'toxic'].includes(hazard) && this.player.position.distanceTo(p) < 1.6) this.startSplash();
  }

  startSplash() {
    if (this.splash) return;
    this.splash = { t: 15 };
    this.emit('alert', { kind: 'splash' });
  }

  // ------------------------------------------------------------------ versamento

  /** Contenitori che possono ricevere: aperti verso l'alto, con il bordo in vista. */
  receivers(source) {
    const out = [];
    for (const it of this.items) {
      if (it === source || !it.def.container || !it.mixture) continue;
      _v.set(0, 1, 0).applyQuaternion(it.mesh.quaternion);
      if (_v.y < 0.75) continue;
      const top = it.def.profile[it.def.profile.length - 1][1];
      _v2.set(0, top, 0).applyMatrix4(it.mesh.matrixWorld);
      out.push({ item: it, x: _v2.x, y: _v2.y, z: _v2.z, r: it.def.rimR * 0.95 + 0.004 });
    }
    return out;
  }

  /**
   * Dove cade un getto che parte da p con velocità orizzontale (vx, vz): contenitore, scarico, rifiuti o superficie,
   * con il tempo di volo t. Lungo la parabola si controllano gli ostacoli (8 tratti, un raggio ciascuno): il bordo di
   * un altro becher o un oggetto in mezzo fermano il liquido, che cade sotto e fa una pozza (blocked = punto d'urto).
   */
  traceStream(p, vx, vz, source) {
    let best = null;
    const fall = (y) => ballisticLanding(p, vx, vz, y);
    for (const r of this.receivers(source)) {
      if (r.y > p.y - 0.003) continue;
      const l = fall(r.y);
      if (Math.hypot(l.x - r.x, l.z - r.z) < r.r && (!best || r.y > best.y)) best = { type: 'item', item: r.item, y: r.y, x: l.x, z: l.z, t: l.t };
    }
    const sb = this.fx.sink.basin;
    {
      const l = fall(sb.top);
      if (!best && p.y > sb.top && l.x > sb.x0 && l.x < sb.x1 && l.z > sb.z0 && l.z < sb.z1) best = { type: 'sink', y: sb.y, x: l.x, z: l.z, t: fall(sb.y).t };
    }
    for (const bin of this.room.bins) {
      const o = bin.opening;
      const l = fall(o.y);
      if (!best && p.y > o.y && Math.hypot(l.x - o.x, l.z - o.z) < o.r) best = { type: 'bin', bin, y: o.y, x: l.x, z: l.z, t: l.t };
    }
    if (!best) {
      const hit = this.physics.ray({ x: p.x, y: p.y, z: p.z }, { x: 0, y: -1, z: 0 }, 4, { solidOnly: true });
      const l = fall(hit ? hit.point.y : 0);
      best = { type: 'surface', x: l.x, y: hit ? hit.point.y : 0, z: l.z, t: l.t };
    }
    // ostacoli lungo il getto (il contenitore che versa e quello che riceve non contano)
    const skip = new Set([source?.body, best.item?.body].filter(Boolean));
    const predicate = (c) => !skip.has(c.parent());
    // si controlla fino all'imboccatura del bersaglio (bordo del recipiente, bordo del lavandino o del bidone): sotto
    // c'è il bersaglio stesso
    const mouthY = best.type === 'item' || best.type === 'bin' ? best.y + 0.002 : best.type === 'sink' ? sb.top + 0.002 : null;
    const tEnd = mouthY === null ? best.t : fall(mouthY).t;
    const at = (t, out) => out.set(p.x + vx * t, p.y - 4.905 * t * t, p.z + vz * t);
    const a = _v.clone();
    const b = _v2.clone();
    for (let i = 0; i < 8 && tEnd > 0; i++) {
      at((tEnd * i) / 8, a);
      at((tEnd * (i + 1)) / 8, b);
      const d = b.clone().sub(a);
      const len = d.length();
      if (len < 1e-5) continue;
      const hit = this.physics.ray({ x: a.x, y: a.y, z: a.z }, { x: d.x / len, y: d.y / len, z: d.z / len }, len, { predicate });
      if (!hit) continue;
      // se è il piano su cui doveva cadere comunque, nulla cambia
      if (best.type === 'surface' && hit.point.y < best.y + 0.004) break;
      const below = this.physics.ray({ x: hit.point.x, y: hit.point.y + 0.001, z: hit.point.z }, { x: 0, y: -1, z: 0 }, 4, { solidOnly: true });
      const y = below ? below.point.y : 0;
      return { type: 'surface', x: hit.point.x, y, z: hit.point.z, t: (tEnd * (i + hit.toi / len)) / 8, blocked: hit.point };
    }
    return best;
  }

  /**
   * Punto di uscita del getto di un contenitore inclinato (il punto più basso del bordo, appena fuori), direzione
   * orizzontale e velocità: ≈ √(g·h), una goccia cade quasi dritta, un getto pieno va più in là.
   */
  spout(item, info, h) {
    const def = item.def;
    const m = item.mesh.matrixWorld;
    const k = info.rimIndex * 3;
    const lip = new THREE.Vector3(def.rim[k], def.rim[k + 1], def.rim[k + 2]).applyMatrix4(m);
    const out = new THREE.Vector3(def.rim[k] * 1.25, def.rim[k + 1], def.rim[k + 2] * 1.25).applyMatrix4(m).sub(lip);
    out.y = 0;
    if (out.lengthSq() > 1e-10) out.normalize();
    else out.set(0, 0, 0);
    // inclinato quasi in orizzontale o oltre, la direzione «in fuori» del bordo è instabile (a 100° la bocca guarda in
    // basso): il getto esce nella direzione dell'asse del recipiente, proiettata in orizzontale
    const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(item.mesh.quaternion);
    const flat = Math.hypot(axis.x, axis.z);
    if (flat > 0.2) out.set(axis.x / flat, 0, axis.z / flat);
    const speed = def.drops ? 0.01 : Math.min(0.45, 0.6 * Math.sqrt(9.81 * Math.min(Math.max(0, h), 0.03)));
    return { p: lip.addScaledVector(out, 0.003), out, speed };
  }

  /** Versa dal contenitore se il liquido (o la polvere) supera il punto più basso del bordo. */
  pourFrom(item, dt) {
    const mix = item.mixture;
    const def = item.def;
    item.pourHead = undefined;
    item.levelInfo = null;
    if (!mix || mix.isEmpty()) return;
    const lv = mix.liquidVolume;
    const sv = mix.solidVolume;
    const liquid = lv > RESIDUE_ML;
    const vol = liquid ? lv + sv * 0.3 : sv;
    if (vol <= (liquid ? RESIDUE_ML : 0.02)) return;
    const info = liquidLevel(def.samples, def.rim, item.mesh.matrixWorld, Math.min(1.2, vol / def.capacity));
    item.levelInfo = info;
    let h = info.level - info.rimY;
    if (!liquid) h -= 0.004; // la polvere scorre solo oltre l'angolo di riposo
    item.pourHead = Math.min(h, 0.05);
    const q = pourRate({ h, R: def.rimR, flow: def.flow ?? 1, powder: !liquid, overfull: info.level === Infinity });
    if (q <= 0) return;
    let dv = q * dt;
    const avail = liquid ? lv - RESIDUE_ML : sv;
    if (def.drops) {
      // contagocce: gocce da 0,05 mL, al massimo 3 al secondo
      item.dropAcc = (item.dropAcc ?? 0) + Math.min(dv, 0.15 * dt);
      if (item.dropAcc < 0.05) return;
      item.dropAcc -= 0.05;
      dv = 0.05;
    }
    dv = Math.min(dv, avail);
    if (dv <= 0) return;
    item.pourT = this.time;
    item.pourRate = def.drops ? 0.15 : q;
    const portion = liquid ? mix.take(dv) : mix.takeFraction(dv / sv, { solidOnly: true });
    if (item.data.reagent) this.addCost(liquid ? dv * (item.data.price ?? PRICES.solutionPerMl) : portion.mass * PRICES.solidPerGram);
    if (mix.liquidVolume + mix.solidVolume < 0.5 && !mix.isEmpty()) item.dirty = true;
    const { p, out, speed } = this.spout(item, info, h);
    item.streamSpeed = speed;
    const dest = this.traceStream(p, out.x * speed, out.z * speed, item);
    // il liquido arriva al bersaglio quando il getto lo tocca (il bicchiere non si riempie prima)
    this.inFlight.push({ at: this.time + dest.t, dest, portion, source: item });
    const look = liquid ? mix.appearance() : null;
    const col = liquid ? (look.turbid > 0.3 ? look.turbidColor : look.liquid) : portion.appearance().solid;
    if (liquid && !def.drops && q >= 1.5) {
      // getto continuo fino al punto d'arrivo (o all'ostacolo), più qualche schizzo dove arriva
      let st = this.streams.get(item);
      if (!st) this.streams.set(item, (st = new Stream(this.scene)));
      st.set(p, out.x * speed, out.z * speed, dest.t, q, col);
      st.shown = this.time;
      if (Math.random() < Math.min(0.8, q * dt * 1.5)) {
        const e = dest.blocked ?? { x: dest.x, y: dest.y, z: dest.z };
        this.drops.emit(e.x, e.y + 0.003, e.z, (Math.random() - 0.5) * 0.25, 0.25 + Math.random() * 0.3, (Math.random() - 0.5) * 0.25, 0.0012, col, 0.4, e.y - 0.01);
      }
      return;
    }
    // poche gocce (contagocce, polvere, filo sottile)
    const n = def.drops ? 1 : Math.min(5, 1 + Math.floor(q * dt * 2));
    for (let i = 0; i < n; i++) {
      const r = def.drops ? 0.0022 : Math.min(0.004, (liquid ? 0.0012 : 0.0008) + Math.sqrt(q) * 0.00028);
      this.drops.emit(p.x + (Math.random() - 0.5) * 0.002, p.y, p.z + (Math.random() - 0.5) * 0.002, out.x * speed, -0.05, out.z * speed, r, col, 1.2, dest.y);
    }
  }

  /** Consegna il liquido arrivato in fondo al getto: nel contenitore, nello scarico, nei rifiuti o in una pozza. */
  deliverStreams() {
    if (!this.inFlight.length) return;
    const due = [];
    this.inFlight = this.inFlight.filter((f) => (f.at <= this.time ? (due.push(f), false) : true));
    for (const { dest, portion, source } of due) {
      if (dest.type === 'item' && this.items.includes(dest.item)) dest.item.mixture.add(portion);
      else if (dest.type === 'sink') this.disposeWaste(portion, 'sink', source);
      else if (dest.type === 'bin') this.disposeWaste(portion, dest.bin.bin, source);
      else this.spill(portion, new THREE.Vector3(dest.x, dest.y, dest.z), source);
    }
  }

  /**
   * Anello sul punto in cui cadrebbe il getto del contenitore in mano, già da un'inclinazione piccola (prima che
   * esca la prima goccia): verde se finisce in un recipiente, nel lavandino o nei rifiuti, rosso se fa una pozza.
   */
  updateAim() {
    const item = this.held;
    const info = item?.levelInfo;
    this.aim = null;
    if (!item?.def.container || !info || this.tilt < 0.1) {
      this.aimRing.visible = false;
      return;
    }
    const h = item.pourHead ?? -1;
    const sp = this.spout(item, info, h);
    const speed = item.def.drops ? sp.speed : Math.max(0.12, sp.speed);
    const dest = this.traceStream(sp.p, sp.out.x * speed, sp.out.z * speed, item);
    const ok = dest.type !== 'surface';
    this.aim = { dest, ok };
    const e = dest.blocked ?? dest;
    this.aimRing.position.set(e.x, e.y + 0.001, e.z);
    this.aimRing.material.color.set(ok ? 0x5fd38d : 0xe5484d);
    this.aimRing.visible = true;
  }

  /** Liquido o polvere finiti su una superficie: nuova pozza o si unisce a una vicina; nel lavandino va nello scarico. */
  spill(mix, p, source) {
    const sb = this.fx.sink.basin;
    if (p.x > sb.x0 && p.x < sb.x1 && p.z > sb.z0 && p.z < sb.z1 && p.y < sb.top + 0.02) {
      this.disposeWaste(mix, 'sink', source);
      return;
    }
    let pd = this.puddles.find((q) => Math.hypot(q.pos.x - p.x, q.pos.z - p.z) < q.r + 0.04 && Math.abs(q.pos.y - p.y) < 0.05);
    if (!pd) {
      pd = { mix: new Mixture(this.chem), pos: p.clone(), r: 0.02, mesh: createPuddle(this.scene, p.x, p.y, p.z), born: this.time };
      this.puddles.push(pd);
      if (!this.free && mix.liquidVolume > 2) this.toast(this.t('spilled'), 'warn');
    }
    pd.mix.add(mix);
    this.updatePuddle(pd);
  }

  /**
   * Aggiorna una pozza dopo un cambiamento (liquido aggiunto, asciugato, evaporato). Evaporando, il residuo secco resta
   * sul piano come un alone grande quanto era la pozza: va pulito con la carta e conta come disordine.
   */
  updatePuddle(pd) {
    const lv = pd.mix.liquidVolume;
    const sv = pd.mix.solidVolume;
    const state = puddleState(lv, sv, pd.mix.mass - pd.mix.water);
    if (state === 'gone') {
      pd.mesh.removeFromParent();
      this.puddles = this.puddles.filter((q) => q !== pd);
      return;
    }
    const wasStain = pd.stain;
    pd.stain = state === 'stain';
    if (!pd.stain) pd.maxR = Math.max(pd.maxR ?? 0, puddleRadius(lv + sv));
    pd.r = pd.stain ? pd.maxR ?? puddleRadius(sv) : puddleRadius(lv + sv);
    pd.mesh.scale.setScalar(pd.r);
    const a = pd.mix.appearance();
    const c = pd.stain ? a.solid : a.turbid > 0.3 ? a.turbidColor : a.liquid;
    const mat = pd.mesh.material;
    mat.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
    mat.opacity = pd.stain ? 0.55 : Math.min(0.85, 0.35 + a.alpha * 0.5 + a.turbid * 0.4);
    mat.roughness = pd.stain ? 0.9 : 0.05;
    if (pd.stain !== Boolean(wasStain)) {
      mat.alphaMap = pd.stain ? stainAlphaMap() : null;
      mat.needsUpdate = true;
    }
  }

  // ------------------------------------------------------------------ aspetto del contenuto

  updateContents(item, dt = 0) {
    const def = item.def;
    const mix = item.mixture;
    if (!def.container || !mix) return;
    const lv = mix.liquidVolume;
    const sv = mix.solidVolume;
    const m = item.mesh.matrixWorld;
    if (sv > 0.01) {
      const s = liquidLevel(def.samples, def.rim, m, Math.min(1, sv / def.capacity));
      item.solidMesh.visible = true;
      item.solidMesh.material.userData.uniforms.uLevel.value = s.level === Infinity ? 1e3 : s.level;
    } else item.solidMesh.visible = false;
    if (lv > 0.05) {
      const l = liquidLevel(def.samples, def.rim, m, Math.min(1, (lv + sv * 0.35) / def.capacity));
      item.liquidMesh.visible = true;
      item.liquidMesh.material.userData.uniforms.uLevel.value = l.level === Infinity ? 1e3 : l.level;
    } else item.liquidMesh.visible = false;
    const lm = item.liquidMesh.material;
    const sm = item.solidMesh.material;
    const first = !item.look;
    if (item.lookStale !== false || first) {
      const a = mix.appearance();
      item.look = a;
      item.lookStale = false;
      const lc = a.turbid > 0.05 ? a.liquid.map((x, i) => x + (a.turbidColor[i] - x) * a.turbid) : a.liquid;
      item.lookTo ??= { liquid: new THREE.Color(), solid: new THREE.Color(), opacity: 0 };
      item.lookTo.liquid.setRGB(lc[0] / 255, lc[1] / 255, lc[2] / 255);
      item.lookTo.solid.setRGB(a.solid[0] / 255, a.solid[1] / 255, a.solid[2] / 255);
      item.lookTo.opacity = Math.min(0.95, a.alpha + a.turbid * 0.55);
      sm.roughness = a.solidKind === 'crystals' ? 0.25 : 0.9;
    }
    // i colori seguono il contenuto in pochi decimi di secondo: il cambio di colore di una reazione si vede avvenire
    const to = item.lookTo;
    const k = first ? 1 : 1 - Math.exp(-dt * 3.5);
    lm.color.lerp(to.liquid, k);
    lm.opacity += (to.opacity - lm.opacity) * k;
    sm.color.lerp(to.solid, k);
    const lc = lm.color;
    lm.userData.uniforms.uSurface.value.setRGB(Math.min(1, lc.r + 0.12), Math.min(1, lc.g + 0.12), Math.min(1, lc.b + 0.12));
    lm.userData.uniforms.uSurfaceAlpha.value = Math.min(0.97, lm.opacity + 0.25);
    const sc = sm.color;
    sm.userData.uniforms.uSurface.value.setRGB(Math.min(1, sc.r + 0.08), Math.min(1, sc.g + 0.08), Math.min(1, sc.b + 0.08));
  }

  // ------------------------------------------------------------------ calore e chimica

  /** Ambiente termico di un contenitore: piastra, Bunsen, acqua del rubinetto, fuoco vicino, agitazione. */
  thermalEnv(item) {
    const def = item.def;
    const p = item.mesh.position;
    const env = { heatW: 0, lossWK: 0.3 + def.area * 0.03, Tenv: AMBIENT, containerC: def.heatC, area: def.area, stir: 0, open: true, flame: false, light: false };
    _v.set(0, 1, 0).applyQuaternion(item.mesh.quaternion);
    const upright = _v.y > 0.85;
    const T = item.mixture.T;
    const hp = this.fx.hotplate;
    const pl = hp.plate;
    if (upright && Math.abs(p.x - pl.x) < 0.1 && Math.abs(p.z - pl.z) < 0.1 && Math.abs(p.y - pl.y) < 0.02) {
      env.heatW += Math.max(0, Math.min(hp.level * 90, 6 * (hp.T - T)));
      if (hp.level > 0) env.stir = 0.5; // agitatore magnetico
      item.onPlate = true;
    } else item.onPlate = false;
    const bu = this.fx.bunsen;
    const gz = bu.gauze;
    if (bu.on) {
      if (upright && Math.hypot(p.x - gz.x, p.z - gz.z) < 0.08 && Math.abs(p.y - (gz.y + 0.0015)) < 0.02) env.heatW += Math.max(0, Math.min(850, 3 * (1700 - T)));
      const fl = bu.flame;
      if (Math.hypot(p.x - fl.x, p.z - fl.z) < 0.05 && p.y > fl.y - 0.05 && p.y < fl.top) {
        env.heatW += 600;
        env.flame = true;
      }
    }
    // l'olio copre il metallo alcalino: niente aria (né umidità) finché resta nel suo barattolo
    if (def.oil) env.open = false;
    // sotto la lampada accesa: le reazioni fotochimiche
    const lz = this.fx.lamp.zone;
    if (this.fx.lamp.on && Math.hypot(p.x - lz.x, p.z - lz.z) < lz.r && p.y > lz.y0 && p.y < lz.y1) env.light = true;
    const sb = this.fx.sink.basin;
    if (p.x > sb.x0 && p.x < sb.x1 && p.z > sb.z0 && p.z < sb.z1 && p.y < sb.top) {
      env.Tenv = 288;
      if (this.fx.sink.tap) env.lossWK += 3; // a bagnomaria sotto l'acqua corrente
    }
    for (const f of this.fires) {
      const d = f.pos.distanceTo(p);
      if (d < 0.5) env.heatW += 400 * (1 - d / 0.5);
      if (d < 0.25) env.flame = true;
    }
    if (item === this.held) {
      const w = item.body.angvel();
      const v = item.body.linvel();
      env.stir = Math.max(env.stir, Math.min(1, Math.hypot(w.x, w.y, w.z) / 10 + Math.hypot(v.x, v.y, v.z) / 3));
      if (this.swirlT > 0) env.stir = 1;
    }
    return env;
  }

  /** Dentro la cappa accesa? */
  inHood(p) {
    const z = this.fx.hood.zone;
    return this.fx.hood.on && p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1 && p.y > z.y0 - 0.05 && p.y < z.y1;
  }

  chemistry(dt) {
    const { chem } = this;
    for (const item of this.items) {
      const mix = item.mixture;
      if (!mix || mix.isEmpty() || !item.def.container) continue;
      const env = this.thermalEnv(item);
      const before = mix.T;
      const ev = mix.tick(dt, env);
      item.lookStale = true;
      item.peakT = Math.max(item.peakT ?? AMBIENT, mix.T);
      const p = item.mesh.position;
      const top = _v.set(0, item.def.height, 0).applyMatrix4(item.mesh.matrixWorld).clone();
      // vapore sopra i liquidi caldi
      if (mix.T > 345 && mix.water > 0.5 && Math.random() < (mix.T - 345) / 40) this.puffs.emit(top.x, top.y, top.z, (Math.random() - 0.5) * 0.05, 0.25, (Math.random() - 0.5) * 0.05, { size: 0.02, grow: 4, rgb: [245, 248, 252], alpha: 0.35, life: 1.6 });
      for (const [sid, mol] of ev.gases) {
        if (mol <= 1e-7) continue;
        if (sid === WATER) continue;
        if (chem.toxic.has(sid)) this.toxicGas(sid, mol, top);
        else if (Math.random() < Math.min(1, mol * 2000)) {
          const c = chem.sub(sid)?.colors?.[3];
          const rgb = c && c[3] > 0.3 ? c.slice(0, 3) : [250, 250, 250];
          this.puffs.emit(top.x, top.y - 0.01, top.z, (Math.random() - 0.5) * 0.02, 0.12, (Math.random() - 0.5) * 0.02, { size: 0.008, grow: 2, rgb, alpha: 0.5, life: 0.8 });
        }
      }
      if (ev.extent.size) this.observeReactions(item, ev, mix, dt);
      if (ev.ignite && !this.fires.some((f) => f.item === item)) this.startFire({ item, sid: ev.ignite, pos: top });
      if (ev.explode > 0.05) this.explode(p.clone(), Math.min(3, ev.explode), item);
      if (ev.heatK > 30 && before < 360 && mix.T > 365) this.toast(this.t('violent'), 'warn');
    }
    // il campione sull'ansa nella fiamma del Bunsen
    const bu = this.fx.bunsen;
    for (const it of this.items) {
      if (it.kind !== 'loop' || !bu.on) continue;
      const tip = it.tip.getWorldPosition(_v);
      const fl = bu.flame;
      const inFlame = Math.hypot(tip.x - fl.x, tip.z - fl.z) < 0.04 && tip.y > fl.y && tip.y < fl.top + 0.02;
      if (!inFlame) continue;
      const s = it.data.specimen;
      if (s?.tint) {
        let c = chem.sub(s.tint).flameColor ?? [255, 180, 60];
        // un'ansa non pulita mescola i colori (il giallo del sodio copre tutto)
        if (it.data.residue && it.data.residue !== s.tint) {
          const r = chem.sub(it.data.residue).flameColor ?? c;
          c = c.map((x, i) => Math.round((x + r[i]) / 2));
          if (!it.data.warned) {
            this.toast(this.t('loopDirty'), 'warn');
            it.data.warned = true;
          }
        }
        this.flameTest = { color: c, t: 2.5 };
        if (s.from !== undefined) this.order?.flameSeen.add(s.from);
        it.data.residue = s.tint;
        it.data.specimen = null;
        it.data.warned = false;
      }
    }
  }

  /** Equazione di una reazione con gli stati fisici (in acqua o no). */
  equationText(rx, aq) {
    return equation(this.chem, rx, { aqueous: aq });
  }

  /** Segnali osservabili di una reazione (in acqua o no), calcolati una volta sola. */
  signals(rx, aq) {
    const key = `${rx.id}:${aq ? 1 : 0}`;
    if (!this.sigCache.has(key)) this.sigCache.set(key, reactionSignals(this.chem, rx, { aqueous: aq }));
    return this.sigCache.get(key);
  }

  /** Reazioni avvenute in un contenitore in questo passo: registro per la finestrella, effetti e quaderno. */
  observeReactions(item, ev, mix, dt) {
    const aq = mix.water > 0.5;
    item.rxLog ??= [];
    for (const [id, ext] of ev.extent) {
      const rx = this.chem.rxById.get(id);
      if (!rx) continue;
      const sig = this.signals(rx, aq);
      const log = item.rxLog.find((x) => x.id === id);
      if (log) {
        log.t = this.time;
        log.aq = aq;
      } else {
        item.rxLog.unshift({ id, t: this.time, aq });
        if (item.rxLog.length > 3) item.rxLog.length = 3;
      }
      this.reactionFx(item, sig, ext / dt, dt);
      this.alkaliFlame(item, rx);
      this.noteReaction(id, sig, aq);
    }
  }

  /**
   * Bolle del gas che sale dal fondo e fiocchi del precipitato che scendono, più fitti quanto più è veloce la reazione
   * (`rate`: moli di reazione al secondo). Solo nel liquido di un contenitore dritto.
   */
  reactionFx(item, sig, rate, dt) {
    if (!item.liquidMesh?.visible || item.mixture.liquidVolume < 1) return;
    if (_v.set(0, 1, 0).applyQuaternion(item.mesh.quaternion).y < 0.8) return;
    const def = item.def;
    const base = item.mesh.position;
    const floor = base.y + def.profile[0][1];
    const top = Math.min(item.liquidMesh.material.userData.uniforms.uLevel.value, base.y + def.height) - 0.001;
    if (top - floor < 0.004) return;
    const r = def.profile[0][0] * 0.75;
    const at = () => {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * r;
      return [base.x + Math.cos(a) * d, base.z + Math.sin(a) * d];
    };
    item.fxAcc ??= { gas: 0, flake: 0 };
    if (sig.gases.length) {
      item.fxAcc.gas += Math.min(80, Math.max(3, 60000 * rate)) * dt;
      for (; item.fxAcc.gas >= 1; item.fxAcc.gas--) {
        const [x, z] = at();
        this.motes.emit(x, floor + 0.002, z, 0.03 + Math.random() * 0.03, 0.0007 + Math.random() * 0.0011, [236, 243, 250], top, floor - 1, 3);
      }
    }
    const solids = sig.solids.filter((x) => !x.metal);
    if (solids.length) {
      item.fxAcc.flake += Math.min(60, Math.max(4, 40000 * rate)) * dt;
      for (; item.fxAcc.flake >= 1; item.fxAcc.flake--) {
        const [x, z] = at();
        const c = solids[Math.floor(Math.random() * solids.length)].rgb;
        this.motes.emit(x, floor + (top - floor) * (0.3 + Math.random() * 0.7), z, -(0.008 + Math.random() * 0.012), 0.0006 + Math.random() * 0.0008, c, top + 1, floor + 0.001, 2.5);
      }
    }
  }

  /**
   * Potassio, rubidio e cesio nell'acqua: il calore accende l'idrogeno e sulla superficie si vede la fiammella del
   * colore del metallo (lilla per il potassio). Solo l'effetto: il metallo è già il combustibile della reazione.
   */
  alkaliFlame(item, rx) {
    if (!rx.reactants.some((r) => r.sid === WATER)) return;
    const metal = rx.reactants.find((r) => ['K', 'Rb', 'Cs'].includes(this.chem.sub(r.sid)?.symbol));
    if (!metal || Math.random() > 0.5 || !item.liquidMesh?.visible) return;
    const p = item.mesh.position;
    const y = Math.min(item.liquidMesh.material.userData.uniforms.uLevel.value, p.y + item.def.height);
    const c = this.chem.sub(metal.sid).flameColor ?? [200, 120, 255];
    const r = item.def.profile[0][0] * 0.5;
    this.flames.emit(p.x + (Math.random() - 0.5) * r, y + 0.004, p.z + (Math.random() - 0.5) * r, 0, 0.25, 0, { size: 0.012, grow: 1.8, rgb: c, alpha: 0.85, life: 0.3 });
  }

  /** Prima volta che si osserva una reazione in questa partita: avviso con l'equazione e voce nel quaderno. */
  noteReaction(id, sig, aq) {
    this.seenRx ??= new Set();
    if (this.seenRx.has(id)) return;
    this.seenRx.add(id);
    const rx = this.chem.rxById.get(id);
    if (!rx) return;
    const tags = signalTags(sig);
    const isNew = recordReaction(this.notebook, id, { mode: this.mode, aq, tags });
    this.emit('reaction', { id, equation: equation(this.chem, rx, { aqueous: aq }), dH: sig.dH, tags, isNew });
  }

  toxicGas(sid, mol, pos) {
    const vented = this.inHood(pos);
    let c = this.clouds.find((k) => k.sid === sid && k.pos.distanceTo(pos) < 0.6);
    if (!c) {
      c = { sid, mol: 0, pos: pos.clone(), age: 0, vented, warned: false };
      this.clouds.push(c);
    }
    c.mol += mol;
    c.age = 0;
    c.vented = vented;
    if (!vented && c.mol > 2e-4 && !c.warned) {
      c.warned = true;
      this.fine('toxic', this.t('toxicGas', { gas: this.chem.formula(sid) }));
      this.alarm = 6;
    }
  }

  startFire({ item = null, puddle = null, sid = 0, pos }) {
    if (this.fires.length > 12) return;
    // appena spento con l'estintore (o con la doccia) non si riaccende subito: la CO₂ copre la zona
    const owner = item ?? puddle;
    if (owner && (owner.noFire ?? 0) > this.time) return;
    this.fires.push({ item, puddle, sid, pos: pos.clone(), fuel: item?.kind === 'towel' ? 8 : 30, hit: 0, age: 0 });
    // una sola multa per un fuoco che si riaccende
    if (this.time - (this.lastFireFine ?? -99) > 10) {
      this.lastFireFine = this.time;
      this.fine('fire', this.t('fire'));
    }
    this.alarm = 6;
  }

  explode(pos, power, source) {
    this.toast(this.t('explosion'), 'danger');
    this.fine('explosion', this.t('explosion'));
    this.alarm = 6;
    for (let k = 0; k < 60; k++) this.flames.emit(pos.x, pos.y + 0.05, pos.z, (Math.random() - 0.5) * 2 * power, Math.random() * 2 * power, (Math.random() - 0.5) * 2 * power, { size: 0.04, grow: 4, rgb: [255, 170, 60], alpha: 0.9, life: 0.5 });
    for (let k = 0; k < 40; k++) this.puffs.emit(pos.x, pos.y + 0.05, pos.z, (Math.random() - 0.5) * 0.6, Math.random() * 0.8, (Math.random() - 0.5) * 0.6, { size: 0.06, grow: 5, rgb: [90, 90, 92], alpha: 0.5, life: 3 });
    for (const it of [...this.items]) {
      const p = it.mesh.position;
      const d = p.distanceTo(pos);
      if (d > 1.4) continue;
      const f = power * (1 - d / 1.4) * 0.5 * (it.def.mass + 0.05);
      _v.copy(p).sub(pos).normalize();
      it.body.applyImpulse({ x: _v.x * f, y: Math.abs(_v.y) * f + f * 0.6, z: _v.z * f }, true);
      if (it.def.breakable && (d < 0.4 * power || it === source)) this.pendingBreaks.add(it);
    }
    if (this.player.position.distanceTo(pos) < 1.2) this.startSplash();
  }

  // ------------------------------------------------------------------ fuoco, gas, doccia, estintore

  updateHazards(dt) {
    // con una finestra aperta il gioco si ferma (dt = 0): niente brucia, niente si spegne
    if (!(dt > 0)) return;
    // estintore: un cono di CO₂ davanti alla tromba
    const ex = this.held?.kind === 'extinguisher' ? this.held : null;
    if (ex && this.spraying) {
      this.camera.getWorldDirection(_v);
      const origin = ex.mesh.localToWorld(new THREE.Vector3(0, 0.47, 0.16));
      for (let k = 0; k < 6; k++) this.puffs.emit(origin.x, origin.y, origin.z, _v.x * 3 + (Math.random() - 0.5) * 0.5, _v.y * 3 + (Math.random() - 0.5) * 0.5, _v.z * 3 + (Math.random() - 0.5) * 0.5, { size: 0.03, grow: 6, rgb: [240, 244, 248], alpha: 0.55, life: 0.9 });
      for (const f of this.fires) {
        _v2.copy(f.pos).sub(origin);
        const d = _v2.length();
        if (d < 2.2 && _v2.normalize().dot(_v) > 0.88) f.hit += dt;
      }
    }
    // fuochi
    for (const f of [...this.fires]) {
      f.age += dt;
      if (f.item && !this.items.includes(f.item)) f.item = null;
      if (f.item) f.item.mesh.getWorldPosition(f.pos).add(_v.set(0, f.item.def.height ?? 0.02, 0));
      const strength = f.item?.kind === 'towel' ? 0.6 : 1;
      for (let k = 0; k < 3; k++) this.flames.emit(f.pos.x + (Math.random() - 0.5) * 0.05, f.pos.y, f.pos.z + (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.08, 0.5 + Math.random() * 0.4, (Math.random() - 0.5) * 0.08, { size: 0.035 * strength, grow: 1.6, rgb: Math.random() < 0.5 ? [255, 150, 40] : [255, 210, 90], alpha: 0.8, life: 0.45 });
      if (Math.random() < 0.3) this.puffs.emit(f.pos.x, f.pos.y + 0.15, f.pos.z, 0, 0.35, 0, { size: 0.04, grow: 4, rgb: [70, 70, 72], alpha: 0.25, life: 2.5 });
      // brucia il combustibile
      let burning = true;
      if (f.item?.mixture && f.sid) burning = f.item.mixture.burn(dt, f.sid) > 0 || f.item.kind === 'towel';
      else if (f.puddle) burning = f.puddle.mix.burn(dt, f.sid, 0.01) > 0;
      const comb = burning && f.sid ? this.chem.comb.get(f.sid) : null;
      if (comb) this.noteReaction(comb.id, this.signals(comb, false), false);
      f.fuel -= dt;
      if (f.item?.kind === 'towel' && f.fuel <= 0) this.removeItem(f.item);
      // si propaga a carta e pozze infiammabili vicine
      if (Math.random() < dt * 0.8) {
        for (const it of this.items) if (it.kind === 'towel' && it.mesh.position.distanceTo(f.pos) < 0.3 && !this.fires.some((q) => q.item === it)) this.startFire({ item: it, pos: it.mesh.position });
        for (const pd of this.puddles) {
          const fuel = this.flammableIn(pd.mix);
          if (fuel && pd.pos.distanceTo(f.pos) < pd.r + 0.25 && !this.fires.some((q) => q.puddle === pd)) this.startFire({ puddle: pd, sid: fuel, pos: pd.pos });
        }
      }
      if (f.hit > 0.8 || f.fuel <= 0 || !burning || this.fx.shower.t > 0 && f.pos.distanceTo(new THREE.Vector3(LAYOUT.shower.x, 1, LAYOUT.shower.z)) < 1.2) {
        this.fires = this.fires.filter((q) => q !== f);
        const owner = f.item ?? f.puddle;
        if (owner) owner.noFire = this.time + 8;
        if (f.hit > 0.8) this.toast(this.t('fireOut'), 'ok');
        if (f.puddle) this.updatePuddle(f.puddle);
      }
    }
    // pozze infiammabili vicino alla fiamma del Bunsen
    if (this.fx.bunsen.on) {
      const fl = this.fx.bunsen.flame;
      for (const pd of this.puddles) {
        const fuel = this.flammableIn(pd.mix);
        if (fuel && Math.hypot(pd.pos.x - fl.x, pd.pos.z - fl.z) < pd.r + 0.12 && !this.fires.some((q) => q.puddle === pd)) this.startFire({ puddle: pd, sid: fuel, pos: pd.pos });
      }
      for (const it of this.items) if (it.kind === 'towel' && Math.hypot(it.mesh.position.x - fl.x, it.mesh.position.z - fl.z) < 0.08 && it.mesh.position.y < fl.top && !this.fires.some((q) => q.item === it)) this.startFire({ item: it, pos: it.mesh.position });
    }
    // nuvole di gas
    for (const c of [...this.clouds]) {
      c.age += dt;
      const color = this.chem.sub(c.sid)?.colors?.[3];
      const rgb = color && color[3] > 0.3 ? color.slice(0, 3) : [200, 205, 190];
      if (Math.random() < 0.6) {
        const v = c.vented ? [0.4, 0.5, 0] : [(Math.random() - 0.5) * 0.15, 0.08, (Math.random() - 0.5) * 0.15];
        this.puffs.emit(c.pos.x, c.pos.y, c.pos.z, v[0], v[1], v[2], { size: 0.05, grow: 6, rgb, alpha: c.vented ? 0.2 : 0.35, life: 3 });
      }
      c.mol *= Math.exp(-dt / (c.vented ? 1.5 : 9));
      if (c.age > 3 && c.mol < 2e-5) this.clouds = this.clouds.filter((q) => q !== c);
    }
    if (this.alarm > 0) this.alarm -= dt;
    // doccia di emergenza
    const sh = this.fx.shower;
    if (sh.t > 0) {
      sh.t -= dt;
      for (let k = 0; k < 8; k++) this.drops.emit(LAYOUT.shower.x + (Math.random() - 0.5) * 0.22, 2.25, LAYOUT.shower.z + (Math.random() - 0.5) * 0.22, (Math.random() - 0.5) * 0.4, -1, (Math.random() - 0.5) * 0.4, 0.003, [200, 225, 255], 1.5, 0);
      const pp = this.player.position;
      if (this.splash && Math.hypot(pp.x - LAYOUT.shower.x, pp.z - LAYOUT.shower.z) < 0.7) {
        this.splash = null;
        this.toast(this.t('showerOk'), 'ok');
        this.emit('alert', { kind: 'none' });
      }
    }
    if (this.splash) {
      this.splash.t -= dt;
      if (this.splash.t <= 0) {
        this.splash = null;
        this.fine('splash', this.t('splashLate'));
        this.emit('alert', { kind: 'none' });
      }
    }
    if (this.flameTest.t > 0) this.flameTest.t -= dt;
    const bu = this.fx.bunsen;
    if (bu.on && this.flameTest.t > 0 && this.flameTest.color) {
      const c = this.flameTest.color;
      bu.flameOuter.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
      bu.flameOuter.opacity = 1;
      bu.boost = true;
      bu.light.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
    } else {
      bu.flameOuter.color.set(0x5a7dff);
      bu.flameOuter.opacity = 0.6;
      bu.boost = false;
      bu.light.color.set(0x6a8cff);
    }
  }

  flammableIn(mix) {
    for (const [sid, mol] of mix.n) if (typeof sid === 'number' && mol > 1e-4 && this.chem.P.flags[sid] & (1 << 12) && this.chem.comb.has(sid) && mix.phaseOf(sid) === 2) return sid;
    return 0;
  }

  // ------------------------------------------------------------------ contenitori dei rifiuti, cadute fuori dalla stanza

  checkBins() {
    for (const it of [...this.items]) {
      if (it === this.held) continue;
      const p = it.mesh.position;
      if (p.y < -1 || Math.abs(p.x) > 6 || Math.abs(p.z) > 5) {
        placeItem(it, this.freeSlot('benchB'));
        continue;
      }
      for (const bin of this.room.bins) {
        const z = bin.zone;
        if (p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1 && p.y < z.y1 - 0.05) {
          this.binItem(it, bin);
          break;
        }
      }
    }
  }

  binItem(it, bin) {
    const kind = bin.bin;
    if (['spatula', 'loop', 'extinguisher'].includes(it.kind)) {
      placeItem(it, it.kind === 'extinguisher' ? it.home : this.freeSlot('bench'));
      this.toast(this.t('notWaste'), 'warn');
      return;
    }
    let right;
    if (it.kind === 'shards') right = 'glass';
    else if (it.kind === 'towel' || it.kind === 'strip') {
      const cls = it.mixture ? wasteClass(it.mixture) : null;
      right = cls === 'heavy' ? 'heavy' : cls === 'organic' ? 'organic' : 'solid';
    } else if (it.def.container) {
      if (it.mixture && !it.mixture.isEmpty()) this.disposeWaste(it.mixture, kind, it, true);
      right = 'glass';
      this.addCost(PRICES.glass[it.kind] ?? 3);
      this.toast(this.t('glassThrown'), 'warn');
    }
    if (right && right !== kind && !(it.def.container)) this.fine('wrongBin', this.t('wrongBin', { bin: this.t(`bin_${kind}`), right: this.t(`bin_${right}`) }));
    else if (!it.def.container) this.toast(this.t('disposedOk', { bin: this.t(`bin_${kind}`) }), 'ok');
    this.removeItem(it);
  }

  // ------------------------------------------------------------------ bilancia

  /** Lettura della bilancia (g): oggetti appoggiati sul piatto, meno la tara. */
  balanceReading(raw = false) {
    const pan = this.fx.balance.pan;
    let g = 0;
    for (const it of this.items) {
      if (it === this.held) continue;
      const p = it.mesh.position;
      if (Math.hypot(p.x - pan.x, p.z - pan.z) < pan.r && p.y > pan.y - 0.01 && p.y < pan.y + 0.03) g += itemMassGrams(it);
    }
    return raw ? g : g - this.fx.balance.tare;
  }

  // ------------------------------------------------------------------ ciclo

  update(dt, { blocked = false } = {}) {
    this.time += dt;
    if (this.swirlT > 0) this.swirlT -= dt;
    // lasciato il tasto, il contenitore torna dritto da solo (e smette di versare)
    if (this.held) this.tilt = relaxTilt(this.tilt, dt, this.pouring);
    this.player.update(dt, blocked);
    for (const b of this.pendingBreaks) this.breakItem(b);
    this.pendingBreaks.clear();
    this.physics.step(dt, this.items.map((i) => i.body));
    for (const it of this.items) syncItem(it);
    // tappi: tolti mentre si usa il reagente (in mano o appena preso con spatola, ansa o cartina), poi rimessi
    for (const it of this.items) if (it.cap) it.cap.visible = it !== this.held && this.time - (it.data.usedAt ?? -9) > 2.5;
    // con le ombre vere (Professionale) l'ombra di contatto resta leggera
    for (const it of this.items) updateContactShadow(it, this.physics, this.G.shadows ? 0.3 : 0.55);
    for (const p of this.room.props) if (!p.body.isSleeping()) this.syncProp(p);
    for (const it of this.items) if (it.def.container && it.mixture) this.pourFrom(it, dt);
    for (const [it, st] of this.streams) if (st.shown !== this.time) st.hide();
    this.deliverStreams();
    // acqua del rubinetto nei contenitori sotto il getto
    const sink = this.fx.sink;
    if (sink.tap) {
      const sp = sink.spout;
      const dest = this.traceStream({ x: sp.x, y: sp.y - 0.01, z: sp.z }, 0, 0, null);
      const ml = this.tapFlow * dt;
      if (dest.type === 'item') dest.item.mixture.add(Mixture.of(this.chem, [['water', ml / 18.05], ['cacl2', ml * 1.5e-6], ['nahco3', ml * 2e-6, true]]));
      sink.stream.scale.y = sp.y - dest.y;
      sink.stream.position.y = dest.y + (sp.y - dest.y) / 2;
    }
    this.chemAcc += dt;
    while (this.chemAcc >= CHEM_DT) {
      this.chemAcc -= CHEM_DT;
      this.chemistry(CHEM_DT);
    }
    for (const it of this.items) this.updateContents(it, dt);
    this.updateHazards(dt);
    this.checkBins();
    this.updateHover();
    this.updateAim();
    this.updateOutline();
    this.updateGhost();
    // le pozze d'acqua evaporano piano
    for (const pd of [...this.puddles]) {
      if (this.time - (pd.lastTick ?? 0) > 1) {
        pd.lastTick = this.time;
        pd.mix.tick(1, { area: Math.PI * (pd.r * 100) ** 2, lossWK: 2 });
        this.updatePuddle(pd);
      }
    }
    this.room.setBalance(`${this.fmt(Math.max(-999, this.balanceReading()), 2)} g`);
    this.room.update(dt, this.time);
    this.drops.update(dt);
    this.motes.update(dt);
    const hz = this.fx.hood;
    this.puffs.update(dt, hz.on ? (x, y, z) => (x > hz.zone.x0 - 0.3 && z > hz.zone.z0 && z < hz.zone.z1 ? [1.2, 1.6, 0] : null) : null);
    this.flames.update(dt);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Campo visivo verticale (gradi), dalle impostazioni: vale per la camminata e per la vista del bancone. */
  setFov(deg) {
    this.camera.fov = clamp(Math.round(deg) || FOV.default, FOV.min, FOV.max);
    this.camera.updateProjectionMatrix();
  }

  fmt(n, digits = 1) {
    return Number(n).toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  // ------------------------------------------------------------------ informazioni per l'interfaccia

  /**
   * Finestrella di ciò che si guarda: per i contenitori la scheda del contenuto (describe), per gli elementi fissi il
   * nome e lo stato (piastra al livello 3, rubinetto aperto, lettura della bilancia…), per le pozze quanto liquido c'è.
   */
  lookedInfo() {
    const { t } = this;
    const h = this.hover;
    if (!h) return null;
    if (h.type === 'item') return h.item === this.held ? null : this.describe(h.item);
    if (h.type === 'puddle') {
      const mix = h.puddle.mix;
      const look = mix.appearance();
      if (h.puddle.stain) return { name: t('lookStain'), rows: [], notes: [t('lookStainNote')], color: rgbCss(look.solid) };
      return { name: t('lookPuddle'), rows: [], notes: [t('lookPuddleNote')], volume: `≈ ${this.fmt(Math.max(1, Math.round(mix.liquidVolume)), 0)} mL`, color: rgbCss(look.liquid) };
    }
    const f = h.fixture;
    const out = { name: t(`fx_${f.kind}`, { bin: f.bin ? t(`bin_${f.bin}`) : '' }), rows: [], notes: [], fixture: true };
    const state = {
      hotplate: () => (f.level ? t('stPlate', { n: f.level, temp: Math.round(22 + f.level * 60) }) : t('stOffF')),
      bunsen: () => t(f.on ? 'stOn' : 'stOff'),
      hood: () => t(f.on ? 'stOnF' : 'stOffF'),
      lamp: () => t(f.on ? 'stLampOn' : 'stOffF'),
      sink: () => t(f.tap ? 'stTapOn' : 'stTapOff'),
      balance: () => `${this.fmt(Math.max(-999, this.balanceReading()), 2)} g`,
      bin: () => t(`binNote_${f.bin}`),
    }[f.kind];
    if (state) out.notes.push(state());
    if (f.kind === 'hotplate' && f.level) out.hot = true;
    if ((f.kind === 'bunsen' || f.kind === 'hood' || f.kind === 'lamp') && f.on) out.on = true;
    return out;
  }

  /** Righe della legenda dei comandi in basso a destra (controls.js), per la situazione di adesso. */
  legend() {
    const h = this.hover;
    const held = this.held;
    let target = null;
    if (h?.type === 'item') target = { type: 'item', kind: h.item.kind, name: this.itemName(h.item), container: Boolean(h.item.def.container) };
    else if (h?.type === 'puddle') target = { type: 'puddle', stain: Boolean(h.puddle.stain) };
    else if (h?.type === 'fixture') {
      const f = h.fixture;
      target = { type: 'fixture', kind: f.kind, on: Boolean(f.kind === 'sink' ? f.tap : f.on), level: f.level ?? 0, binName: f.bin ? this.t(`bin_${f.bin}`) : '' };
    }
    return legendRows({
      mode: this.player.mode,
      held: held ? { kind: held.kind, container: Boolean(held.def.container), loaded: Boolean(held.load && !held.load.isEmpty()) } : null,
      target,
      canPlace: Boolean(this.spot?.valid),
      pouring: this.pouring,
      precise: Boolean(this.precise),
      filling: this.filling,
      tapFlow: this.tapFlow,
      rotated: Boolean(held && (held.rotYaw || held.rotPitch)),
      canPutBack: held ? this.canPutBack() : false,
    });
  }

  /**
   * «Perché non reagisce?» per un contenitore: la spiegazione più utile (signals.js, whyNot), con l'equazione della
   * reazione a cui si riferisce. Solo quelle tra due o più delle sostanze presenti, o quelle di una sola sostanza su cui
   * si può fare qualcosa (scaldare, il catalizzatore, la luce); ricalcolata al massimo due volte al secondo.
   * @returns {{text: string, eq: string|null} | null}
   */
  whyHint(item) {
    const c = item.whyCache;
    if (c && this.time - c.t < 0.5) return c.hint;
    const { t, chem } = this;
    const mix = item.mixture;
    const env = this.thermalEnv(item);
    const aq = mix.water > 0.5;
    const list = whyNot(mix, env);
    const w = list.find((x) => x.uses >= 2 || ['catalyst', 'light', 'water', 'undissolved'].includes(x.why) || (x.why === 'heat' && (!aq || x.T <= 373.15)));
    let hint = null;
    if (w) {
      const nm = (sid) => `${chem.name(sid)} (${chem.formula(sid)})`;
      const V = (E) => `${E > 0 ? '+' : '−'}${this.fmt(Math.abs(E), 2)} V`;
      const params = {
        temp: w.T ? this.fmt(w.T - 273.15, 0) : '',
        name: w.sid ? nm(w.sid) : '',
        names: (w.sids ?? []).map(nm).join(', '),
        metal: w.sid ? nm(w.sid) : '',
        other: w.other ? nm(w.other) : '',
        E: w.E !== undefined ? V(w.E) : '',
        E2: w.E2 !== undefined ? V(w.E2) : '',
      };
      hint = { text: t(`why_${w.why}`, params), eq: w.rx ? equation(chem, w.rx, { aqueous: aq }) : null };
    }
    item.whyCache = { t: this.time, hint };
    return hint;
  }

  /** Scheda di un contenitore per l'interfaccia (cosa contiene, nella modalità di chimica scelta). */
  describe(item) {
    if (!item) return null;
    const { t, chemMode } = this;
    const out = { name: this.itemName(item), rows: [], notes: [] };
    if (item.kind === 'spatula') {
      if (item.load) out.rows.push({ label: this.componentsText(item.load), value: chemMode === 'simple' ? `${this.fmt(item.load.mass, 1)} g` : '' });
      else out.notes.push(t('spatulaEmptyNote'));
      return out;
    }
    if (item.kind === 'loop') {
      out.notes.push(item.data.specimen ? t('loopHasSample') : item.data.residue ? t('loopResidue') : t('loopCleanNote'));
      return out;
    }
    if (item.kind === 'strip') {
      if (item.data.used) {
        out.swatch = UNIVERSAL_SCALE[Math.max(0, Math.min(14, Math.round(item.data.ph)))];
        out.notes.push(chemMode === 'simple' ? t('stripSimple', { ph: Math.round(item.data.ph), what: t(item.data.ph < 6.5 ? 'acidic' : item.data.ph > 7.5 ? 'basic' : 'neutral') }) : t('stripReal'));
        out.scale = UNIVERSAL_SCALE;
      } else out.notes.push(t('stripNew'));
      return out;
    }
    if (item.kind === 'towel') {
      out.notes.push(item.mixture?.isEmpty() ? t('towelDry') : t('towelWet', { ml: this.fmt(item.mixture.liquidVolume, 0) }));
      return out;
    }
    if (!item.def.container || !item.mixture) return out;
    const mix = item.mixture;
    const lv = mix.liquidVolume;
    if (mix.isEmpty()) {
      out.notes.push(item.dirty ? t('dirtyNote') : t('emptyNote'));
      return out;
    }
    // realistica: cosa c'è e in che stato (i numeri si leggono su bilancia, graduazione ed etichette);
    // semplificata: anche i grammi. Le tracce trascurabili non si mostrano.
    const comps = mix.components();
    for (const c of comps) {
      if (c.sid === WATER || (c.mol < 2e-6 && typeof c.sid === 'number')) continue;
      const state = t(`state_${c.state}`);
      let value = state;
      if (chemMode === 'simple') value = `${this.fmt(c.grams, c.grams < 0.1 ? 3 : 2)} g · ${state}`;
      else if (item.data.reagent && / M\b/.test(item.label?.sub ?? '')) value = item.label.sub.split(' · ')[0];
      // l'olio dei metalli alcalini è una miscela (senza formula); HCl sciolto è l'acido cloridrico
      const oil = item.data.alias?.[c.sid];
      const aq = c.state === 'aq' && AQUEOUS_NAMES[this.chem.sub(c.sid)?.key];
      out.rows.push({ label: oil ? pick(oil) : aq ? pick(aq) : c.name, formula: oil ? '' : c.formula, value });
    }
    // volume: lettura sulla graduazione (realistica) o valore esatto (semplificata)
    if (lv > 0.05) {
      const step = item.def.grad ? item.def.grad[0] : 25;
      const read = chemMode === 'simple' ? `${this.fmt(lv, 1)} mL` : item.def.grad ? `≈ ${this.fmt(Math.round(lv / Math.max(1, step / 2)) * Math.max(1, step / 2), 0)} mL` : `≈ ${this.fmt(Math.round(lv / 10) * 10, 0)} mL`;
      out.volume = read;
    }
    out.temp = mix.T > 305 || mix.T < 285 ? `${this.fmt(mix.T - 273.15, 0)} °C` : null;
    if (chemMode === 'simple') {
      const ph = mix.pH();
      if (ph !== null) out.ph = `pH ${this.fmt(ph, 1)} · ${t(ph < 6.5 ? 'acidic' : ph > 7.5 ? 'basic' : 'neutral')}`;
      if (mix.water > 0.5) out.notes.push(t('simpleWater', { ml: this.fmt(mix.water, 0) }));
    }
    const look = item.look;
    // un pezzo di metallo sul fondo (zinco nell'acido, rame che si deposita) non è un precipitato
    const metalOnly = comps.filter((c) => c.state === 'solid').every((c) => this.chem.sub(c.sid)?.kind === 'element' && this.chem.P.flags[c.sid] & S.METAL);
    if (look?.solidKind === 'precipitate') out.notes.push(t(metalOnly ? 'noteMetal' : 'notePrecipitate'));
    if (look?.solidKind === 'crystals' && mix.water > 0.05) out.notes.push(t('noteCrystals'));
    if (mix.solidVolume > 0.02 && mix.water > 0.5 && look?.solidKind !== 'precipitate' && look?.solidKind !== 'crystals') out.notes.push(t('noteUndissolved'));
    if (item.dirty && !item.data.reagent) out.notes.push(t('dirtyNote'));
    out.color = look ? rgbCss(look.turbid > 0.3 ? look.turbidColor : look.liquid) : null;
    // le reazioni appena avvenute (equazione con gli stati fisici, ΔH°, cosa si vede) e, se non succede niente,
    // perché: un aiuto nel Laboratorio libero e nella chimica semplificata
    const recent = (item.rxLog ?? []).filter((x) => this.time - x.t < 20 && this.chem.rxById.has(x.id)).slice(0, 2);
    out.reactions = recent.map((x) => {
      const rx = this.chem.rxById.get(x.id);
      const sig = this.signals(rx, x.aq);
      return { id: x.id, eq: equation(this.chem, rx, { aqueous: x.aq }), dH: sig.dH, tags: signalTags(sig), live: this.time - x.t < 1.5 };
    });
    if (!item.def.stock && !recent.some((x) => this.time - x.t < 4) && (this.free || chemMode === 'simple')) out.why = this.whyHint(item);
    return out;
  }

  componentsText(mix) {
    return mix.components().filter((c) => c.sid !== WATER).map((c) => c.formula || c.name).join(' + ');
  }

  /** Stato per l'interfaccia. */
  hud() {
    const o = this.order;
    let steps = [];
    if (o) {
      const snap = this.snapshot();
      steps = o.def.steps(this.chemMode).map((s) => ({ text: this.t(s.key, this.stepParams(o.def)), done: s.done(snap) }));
    }
    return {
      legend: this.legend(),
      held: this.heldInfo(),
      looked: this.lookedInfo(),
      order: o ? { n: o.index + 1, title: this.t(`${o.def.id}Title`), brief: this.t(`${o.def.id}Brief${this.chemMode === 'simple' ? 'Simple' : ''}`), steps, elapsed: this.time - o.start, par: o.def.par, costs: o.costs + o.fines } : null,
      money: this.money,
      free: this.free,
      mode: this.player.mode,
      station: STATIONS[this.player.station].key,
      alarm: this.alarm > 0 ? (this.fires.length ? 'fire' : this.clouds.some((c) => !c.vented) ? 'toxic' : 'alarm') : null,
      splash: this.splash ? Math.ceil(this.splash.t) : null,
      tilt: this.held?.def.container ? this.tilt : 0,
      flameTest: this.flameTest.t > 0 ? rgbCss(this.flameTest.color) : null,
      plate: this.fx.hotplate.level,
    };
  }

  /** Finestrella dell'oggetto in mano: la scheda del contenuto e se sta versando (con la portata). */
  heldInfo() {
    const item = this.held;
    if (!item) return null;
    const info = this.describe(item);
    if (item.def.container && this.time - (item.pourT ?? -1) < 0.25) {
      info.pouring = item.pourRate ?? 0;
      // dove va il getto: «Versando in Becher da 100 mL», nel lavandino, nei rifiuti o fuori
      const d = this.aim?.dest;
      if (d?.type === 'item') info.status = this.t('pouringInto', { name: this.itemName(d.item) });
      else if (d?.type === 'sink') info.status = this.t('pouringSink');
      else if (d?.type === 'bin') info.status = this.t('pouringBin', { bin: this.t(`bin_${d.bin.bin}`) });
      else if (d) {
        info.status = this.t('pouringOut');
        info.spilling = true;
      } else info.status = this.t('pouring');
    }
    return info;
  }

  /**
   * Punti del mondo a cui si agganciano le finestrelle: la cima dell'oggetto in mano e di quello guardato (per gli
   * elementi fissi e le pozze, il punto mirato). La vista li proietta sullo schermo a ogni fotogramma.
   */
  popupAnchors() {
    const top = (item) => new THREE.Vector3(0, item.def.container ? item.def.height : 0.01, 0).applyMatrix4(item.mesh.matrixWorld);
    const h = this.hover;
    let looked = null;
    if (h?.type === 'item' && h.item !== this.held) looked = top(h.item);
    else if (h?.type === 'fixture' || h?.type === 'puddle') looked = h.point.clone();
    return { held: this.held ? top(this.held) : null, looked, camera: this.camera };
  }

  stepParams(def) {
    if (def.id === 'nacl') return this.chemMode === 'simple' ? { g: '3', v: '100' } : { g: this.fmt(2.92, 2), v: '100' };
    return {};
  }

  destroy() {
    this.renderer.renderLists.dispose();
    this.scene.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) for (const m of [].concat(o.material)) {
        m.map?.dispose?.();
        m.dispose?.();
      }
    });
    this.envMap?.dispose();
    this.physics.world.free();
  }
}
