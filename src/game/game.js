// Il gioco: stanza, oggetti, fisica, giocatore e chimica insieme. Prendere, posare, lanciare e versare; usare gli
// strumenti (spatola, ansa, carta, cartine, estintore) e gli elementi fissi (piastra, Bunsen, rubinetto, bilancia,
// cappa, doccia, campanello); calore e reazioni nei contenitori; incidenti (vetro rotto, pozze, fuoco, gas tossici,
// esplosioni, schizzi); rifiuti e pulizia; esercitazioni della Carriera e Laboratorio libero.
// L'interfaccia (DOM, menu, HUD) è in game-view.js: qui si producono solo stato e messaggi.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gfx } from '../gfx/preset.js';
import { locale } from '../i18n/index.js';
import { Physics } from './physics.js';
import { buildRoom, LAYOUT, BENCH_Y, DESK_Y, STATIONS } from './room.js';
import { DEFS, createItem, syncItem, disposeItem, placeItem, itemMaterials, itemMassGrams } from './items.js';
import { liquidLevel } from './liquid.js';
import { Drops, Puffs, createPuddle, puddleRadius } from './effects.js';
import { Player } from './player.js';
import { createLabChemistry, Mixture, wasteClass, binAccepts, AMBIENT } from './mixture.js';
import { SHELF, PRICES, UNIVERSAL_SCALE, FLAME_SALTS } from './reagents.js';
import { ORDERS, grade } from './orders.js';

const WATER = 123;
const REACH = 2.3;
const BREAK_SPEED = 3.3; // m/s: un becher che cade dal bancone (≈ 4,2 m/s) si rompe, posato no
const CHEM_DT = 1 / 20;
const RESIDUE_ML = 0.2;
const TAP_FLOW = 25; // mL/s
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
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
    this.scene.background = new THREE.Color(0xdfe6ee);
    this.camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.02, 40);
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
    this.room.setBoard([t('boardWelcome'), t('boardWelcome2')]);
    // estintore appeso al muro
    this.extinguisher = this.spawn('extinguisher', { pos: new THREE.Vector3(LAYOUT.extinguisher.x, 0.37, LAYOUT.extinguisher.z) });
    this.extinguisher.home = this.extinguisher.mesh.position.clone();
  }

  // ------------------------------------------------------------------ oggetti

  spawn(kind, { pos, quat, mixture = null, label = null, name = null, data = {} }) {
    const item = createItem(this.env, kind, { pos, quat, mixture, label, name });
    item.data = { ...data };
    item.peakT = mixture?.T ?? AMBIENT;
    this.items.push(item);
    return item;
  }

  removeItem(item) {
    if (this.held === item) this.held = null;
    this.items = this.items.filter((i) => i !== item);
    disposeItem(item, this.env);
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

  /** Crea un reagente dello scaffale (soluzione, solido, indicatore) con la sua etichetta. */
  spawnReagent(key, group = 'shelf', override = null) {
    const r = SHELF[key] ?? override;
    const { chem, t } = this;
    let mix;
    let label;
    let kind = r.kind;
    if (r.water) {
      mix = Mixture.liquid(chem, 'water', 400);
      label = { title: t('distilledWater'), formula: 'H₂O', sub: t('washbottleSub'), color: '#e8f4ff' };
    } else if (r.indicator) {
      mix = Mixture.of(chem, [['water', 25 / 18.015], [r.indicator, 0.25 / 318.3]]);
      label = { title: chem.name(r.indicator), formula: '1 %', sub: t('indicatorSub'), hazard: 'flammable', color: '#fff6e8' };
    } else if (r.solute) {
      mix = Mixture.solution(chem, r.solute, r.molar, 450);
      label = { title: chem.name(chem.id(r.solute)), formula: chem.formula(chem.id(r.solute)), sub: `${this.fmt(r.molar, r.molar < 1 ? 2 : 1)} M · 500 mL`, color: '#ffffff' };
    } else if (r.liquid) {
      mix = Mixture.liquid(chem, r.liquid, 450);
      label = { title: chem.name(chem.id(r.liquid)), formula: chem.formula(chem.id(r.liquid)), sub: '500 mL', color: '#ffffff' };
    } else {
      mix = Mixture.solid(chem, r.solid, r.grams ?? 120);
      label = { title: chem.name(chem.id(r.solid)), formula: chem.formula(chem.id(r.solid)), sub: `${r.grams ?? 120} g`, color: '#ffffff' };
    }
    label.hazard ??= this.hazardOf(mix);
    const item = this.spawn(kind, { pos: this.freeSlot(group), mixture: mix, label, name: label.title, data: { reagent: key ?? 'custom', price: r.solid ? PRICES.solidPerGram : r.water ? PRICES.waterPerMl : PRICES.solutionPerMl } });
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
    this.held = null;
    this.splash = null;
    Object.assign(this.fx.bunsen, { on: false });
    Object.assign(this.fx.hotplate, { level: 0 });
    Object.assign(this.fx.sink, { tap: false });
    Object.assign(this.fx.hood, { on: false });
    placeItem(this.extinguisher, this.extinguisher.home);
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
    for (const k of ['water', 'hcl1', 'naoh1', 'php', 'nacl', 'cuso4', 'zn', 'nahco3', 'vinegar', 'ethanol']) this.spawnReagent(k);
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
      const item = this.spawn(s.kind, { pos: this.freeSlot(group), mixture, label, name: label?.title ?? (s.labelKey ? this.t(s.labelKey) : this.t(`item_${s.kind}`)), data: { sample: s.sample } });
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
    const containers = this.items.filter((it) => it.def.container && it.mixture && !it.data.reagent).map((it) => ({ kind: it.kind, mix: it.mixture, peakT: it.peakT, item: it }));
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
    let n = this.puddles.filter((p) => p.mix.liquidVolume + p.mix.solidVolume > 1).length;
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
    this.hover = hit ? { ...owner.get(hit.object), point: hit.point, distance: hit.distance } : null;
    // con la spatola o l'ansa in mano ha senso «puntare» il contenitore anche oltre il becher davanti
    return this.hover;
  }

  /** Clic sinistro: prende o posa. */
  primary() {
    if (this.held) {
      this.release();
      return;
    }
    const h = this.hover;
    if (h?.type === 'item') this.grab(h.item);
    else if (h?.type === 'fixture') this.use(true);
  }

  grab(item) {
    if (item.data.inBin) return;
    this.held = item;
    this.tilt = 0;
    const p = item.mesh.position;
    if (this.player.mode === 'walk') this.holdDist = Math.max(0.35, Math.min(0.7, this.camera.position.distanceTo(p)));
    else this.lift = Math.max(0.1, Math.min(0.4, p.y - this.benchPlaneY() + 0.16));
    item.body.wakeUp();
    item.body.setGravityScale(0, true);
  }

  /**
   * Dove posare l'oggetto in mano: il piano (bancone, cattedra, vassoio, scaffale) che si sta guardando, se è libero e
   * vicino all'oggetto. Così si posa con precisione «dove si guarda» invece di lasciarlo cadere.
   */
  placeSpot(item) {
    const ray = this.pointerRay();
    const o = ray.ray.origin;
    const d = ray.ray.direction;
    const hit = this.physics.ray({ x: o.x, y: o.y, z: o.z }, { x: d.x, y: d.y, z: d.z }, ray.far, { exclude: item.body });
    if (!hit || hit.normal.y < 0.7 || hit.collider.parent()?.isDynamic()) return null;
    const p = new THREE.Vector3(hit.point.x, hit.point.y + 0.003, hit.point.z);
    if (p.distanceTo(item.mesh.position) > 0.6) return null;
    // non sopra un altro oggetto
    const r = item.def.container ? item.def.outer[0] : 0.03;
    if (this.items.some((it) => it !== item && Math.hypot(it.mesh.position.x - p.x, it.mesh.position.z - p.z) < r + (it.def.outer?.[0] ?? 0.03) && Math.abs(it.mesh.position.y - p.y) < 0.2)) return null;
    return p;
  }

  release(throwSpeed = 0) {
    const item = this.held;
    if (!item) return;
    const spot = throwSpeed ? null : this.placeSpot(item);
    this.held = null;
    this.pouring = false;
    this.spraying = false;
    item.body.setGravityScale(1, true);
    const v = item.body.linvel();
    const cap = 1.2;
    item.body.setLinvel({ x: Math.max(-cap, Math.min(cap, v.x)), y: Math.max(-cap, Math.min(cap, v.y)), z: Math.max(-cap, Math.min(cap, v.z)) }, true);
    item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    if (throwSpeed) {
      this.camera.getWorldDirection(_v);
      item.body.setLinvel({ x: _v.x * throwSpeed, y: _v.y * throwSpeed + 1.2, z: _v.z * throwSpeed }, true);
    } else if (spot) {
      // posato dritto, girato come lo si teneva
      const yaw = this.player.mode === 'walk' ? this.player.yaw : 0;
      const q = new THREE.Quaternion().setFromAxisAngle(UP, item.def.container || item.kind === 'extinguisher' ? yaw : yaw + Math.PI / 2);
      placeItem(item, spot, q);
    }
  }

  throwHeld() {
    if (this.held) this.release(6);
  }

  setPour(on) {
    this.pouring = on && Boolean(this.held);
  }

  tiltBy(dy) {
    if (!this.held) return;
    const max = this.held.def.container ? 2.6 : 1.2;
    this.tilt = Math.max(0, Math.min(max, this.tilt + dy * 0.0045));
  }

  wheel(delta) {
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
   * @param {boolean} fine con Maiusc: un pizzico con la spatola, abbassa la piastra
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
    if (mix.liquidVolume > 1) {
      this.toast(t('spatulaWet'));
      return;
    }
    sp.load = mix.takeFraction(Math.min(1, grams / solidG), { solidOnly: true });
    if (target.data.reagent) this.addCost(sp.load.mass * PRICES.solidPerGram);
    sp.heap.visible = true;
    const c = sp.load.appearance().solid;
    sp.heap.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
    sp.heap.scale.setScalar(Math.max(0.4, Math.min(1.4, Math.cbrt(sp.load.mass))));
  }

  useLoop(loop, target) {
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
  holdQuat(out) {
    const item = this.held;
    const st = STATIONS[this.player.station];
    const yaw = this.player.mode === 'walk' ? this.player.yaw : Math.atan2(-(st.look[0] - st.cam[0]), -(st.look[2] - st.cam[2]));
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
      out.multiply(_q2.setFromAxisAngle(Z, pitch - this.tilt));
    }
    return out;
  }

  /**
   * Dove deve stare l'oggetto in mano. Inclinando un contenitore, la sua bocca va sul punto guardato; se si guarda un
   * altro contenitore (o il lavandino, o un bidone) si allinea sopra la sua apertura, così il getto ci cade dentro.
   */
  holdTarget(out, quat) {
    const item = this.held;
    if (this.player.mode === 'walk') {
      this.camera.getWorldDirection(_v2);
      out.copy(this.camera.position).addScaledVector(_v2, this.holdDist);
      out.y -= 0.06 + (item.def.container ? item.def.height * 0.4 : 0);
    } else {
      this.ray.setFromCamera(this.mouse, this.camera);
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
    if (drift > 0) goal.add(_v2.set(0, 0, drift).applyAxisAngle(UP, this.player.mode === 'walk' ? this.player.yaw : 0));
    return out.lerp(goal, blend);
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
    const item = this.held;
    if (!item) return;
    const body = item.body;
    const quat = this.holdQuat(_q);
    const target = this.holdTarget(_v, quat);
    const p = body.translation();
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
    const k = 16;
    const vmax = 9;
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
    if (!owner?.def?.breakable || owner === this.held) return;
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

  /** Dove cade un getto che parte da p con velocità orizzontale v: contenitore, scarico, rifiuti o superficie. */
  traceStream(p, vx, vz, source) {
    let best = null;
    const fall = (y) => {
      const dt = Math.sqrt(Math.max(0, (2 * (p.y - y)) / 9.81));
      return [p.x + vx * dt, p.z + vz * dt];
    };
    for (const r of this.receivers(source)) {
      if (r.y > p.y - 0.003) continue;
      const [x, z] = fall(r.y);
      if (Math.hypot(x - r.x, z - r.z) < r.r && (!best || r.y > best.y)) best = { type: 'item', item: r.item, y: r.y, x, z };
    }
    const sb = this.fx.sink.basin;
    {
      const [x, z] = fall(sb.top);
      if (!best && p.y > sb.top && x > sb.x0 && x < sb.x1 && z > sb.z0 && z < sb.z1) best = { type: 'sink', y: sb.y, x, z };
    }
    for (const bin of this.room.bins) {
      const o = bin.opening;
      const [x, z] = fall(o.y);
      if (!best && p.y > o.y && Math.hypot(x - o.x, z - o.z) < o.r) best = { type: 'bin', bin, y: o.y, x, z };
    }
    if (best) return best;
    const hit = this.physics.ray({ x: p.x, y: p.y, z: p.z }, { x: 0, y: -1, z: 0 }, 4, { solidOnly: true });
    const y = hit ? hit.point.y : 0;
    const [x, z] = fall(y);
    return { type: 'surface', x, y, z };
  }

  /** Versa dal contenitore se il liquido (o la polvere) supera il punto più basso del bordo. */
  pourFrom(item, dt) {
    const mix = item.mixture;
    const def = item.def;
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
    if (!(h > 0)) return;
    // portata di uno stramazzo sul bordo circolare: Q ≈ 1,77 · b · h^1,5 (b = corda bagnata)
    const R = def.rimR;
    const b = 2 * Math.sqrt(Math.max(1e-8, 2 * R * Math.min(h, R) - Math.min(h, R) ** 2));
    let q = 1.77 * b * Math.min(h, 0.03) ** 1.5 * 1e6 * (def.flow ?? 1); // mL/s
    if (!liquid) q *= 0.6;
    if (h > 0.03 || info.level === Infinity) q += 40;
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
    const portion = liquid ? mix.take(dv) : mix.takeFraction(dv / sv, { solidOnly: true });
    if (item.data.reagent) this.addCost(liquid ? dv * (item.data.price ?? PRICES.solutionPerMl) : portion.mass * PRICES.solidPerGram);
    if (mix.liquidVolume + mix.solidVolume < 0.5 && !mix.isEmpty()) item.dirty = true;
    // punto di uscita: il bordo più basso, un po' all'esterno
    const k = info.rimIndex * 3;
    _v.set(def.rim[k], def.rim[k + 1], def.rim[k + 2]).applyMatrix4(item.mesh.matrixWorld);
    _v2.set(def.rim[k] * 1.25, def.rim[k + 1], def.rim[k + 2] * 1.25).applyMatrix4(item.mesh.matrixWorld).sub(_v);
    _v2.y = 0;
    const out = _v2.lengthSq() > 1e-10 ? _v2.normalize().clone() : new THREE.Vector3();
    // inclinato quasi in orizzontale o oltre, la direzione «in fuori» del bordo è instabile (a 100° la bocca guarda in
    // basso): il getto esce nella direzione dell'asse del recipiente, proiettata in orizzontale
    const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(item.mesh.quaternion);
    const flat = Math.hypot(axis.x, axis.z);
    if (flat > 0.2) out.set(axis.x / flat, 0, axis.z / flat);
    const p = _v.clone().addScaledVector(out, 0.003);
    // velocità orizzontale del getto ≈ √(g·h): una goccia cade quasi dritta, un getto pieno va più in là
    const speed = def.drops ? 0.01 : Math.min(0.45, 0.6 * Math.sqrt(9.81 * Math.min(h, 0.03)));
    item.streamSpeed = speed;
    const dest = this.traceStream(p, out.x * speed, out.z * speed, item);
    if (dest.type === 'item') dest.item.mixture.add(portion);
    else if (dest.type === 'sink') this.disposeWaste(portion, 'sink', item);
    else if (dest.type === 'bin') this.disposeWaste(portion, dest.bin.bin, item);
    else this.spill(portion, new THREE.Vector3(dest.x, dest.y, dest.z), item);
    // gocce visibili del getto
    const look = liquid ? mix.appearance() : null;
    const col = liquid ? (look.turbid > 0.3 ? look.turbidColor : look.liquid) : portion.appearance().solid;
    const n = def.drops ? 1 : Math.min(5, 1 + Math.floor(q * dt * 2));
    for (let i = 0; i < n; i++) {
      const r = def.drops ? 0.0022 : Math.min(0.004, (liquid ? 0.0012 : 0.0008) + Math.sqrt(q) * 0.00028);
      this.drops.emit(p.x + (Math.random() - 0.5) * 0.002, p.y, p.z + (Math.random() - 0.5) * 0.002, out.x * speed, -0.05, out.z * speed, r, col, 1.2, dest.y);
    }
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

  updatePuddle(pd) {
    const v = pd.mix.liquidVolume + pd.mix.solidVolume;
    if (v < 0.01) {
      pd.mesh.removeFromParent();
      this.puddles = this.puddles.filter((q) => q !== pd);
      return;
    }
    pd.r = puddleRadius(v);
    pd.mesh.scale.setScalar(pd.r);
    const a = pd.mix.appearance();
    const c = pd.mix.liquidVolume > 0.05 ? (a.turbid > 0.3 ? a.turbidColor : a.liquid) : a.solid;
    pd.mesh.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
    pd.mesh.material.opacity = pd.mix.liquidVolume > 0.05 ? Math.min(0.85, 0.35 + a.alpha * 0.5 + a.turbid * 0.4) : 0.95;
  }

  // ------------------------------------------------------------------ aspetto del contenuto

  updateContents(item) {
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
    if (item.lookStale !== false || !item.look) {
      const a = mix.appearance();
      item.look = a;
      item.lookStale = false;
      const lc = a.turbid > 0.05 ? a.liquid.map((x, i) => x + (a.turbidColor[i] - x) * a.turbid) : a.liquid;
      const lm = item.liquidMesh.material;
      lm.color.setRGB(lc[0] / 255, lc[1] / 255, lc[2] / 255);
      lm.opacity = Math.min(0.95, a.alpha + a.turbid * 0.55);
      lm.userData.uniforms.uSurface.value.setRGB(Math.min(1, lc[0] / 255 + 0.12), Math.min(1, lc[1] / 255 + 0.12), Math.min(1, lc[2] / 255 + 0.12));
      lm.userData.uniforms.uSurfaceAlpha.value = Math.min(0.97, lm.opacity + 0.25);
      const sm = item.solidMesh.material;
      sm.color.setRGB(a.solid[0] / 255, a.solid[1] / 255, a.solid[2] / 255);
      sm.roughness = a.solidKind === 'crystals' ? 0.25 : 0.9;
      sm.userData.uniforms.uSurface.value.setRGB(Math.min(1, a.solid[0] / 255 + 0.08), Math.min(1, a.solid[1] / 255 + 0.08), Math.min(1, a.solid[2] / 255 + 0.08));
    }
  }

  // ------------------------------------------------------------------ calore e chimica

  /** Ambiente termico di un contenitore: piastra, Bunsen, acqua del rubinetto, fuoco vicino, agitazione. */
  thermalEnv(item) {
    const def = item.def;
    const p = item.mesh.position;
    const env = { heatW: 0, lossWK: 0.3 + def.area * 0.03, Tenv: AMBIENT, containerC: def.heatC, area: def.area, stir: 0, open: true, flame: false };
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
        else if (Math.random() < Math.min(1, mol * 2000)) this.puffs.emit(top.x, top.y - 0.01, top.z, (Math.random() - 0.5) * 0.02, 0.12, (Math.random() - 0.5) * 0.02, { size: 0.008, grow: 2, rgb: [250, 250, 250], alpha: 0.5, life: 0.8 });
      }
      for (const id of ev.reactions) this.noteReaction(id);
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

  noteReaction(id) {
    this.seenRx ??= new Set();
    if (this.seenRx.has(id)) return;
    this.seenRx.add(id);
    const rx = this.chem.rxs.find((r) => r.id === id);
    if (!rx) return;
    const side = (arr) => arr.map((x) => `${x.c > 1 ? `${x.c} ` : ''}${this.chem.formula(x.sid)}`).join(' + ');
    this.emit('reaction', { equation: `${side(rx.reactants)} → ${side(rx.products)}` });
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
    this.player.update(dt, blocked);
    for (const b of this.pendingBreaks) this.breakItem(b);
    this.pendingBreaks.clear();
    this.physics.step(dt, this.items.map((i) => i.body));
    for (const it of this.items) syncItem(it);
    for (const it of this.items) if (it.def.container && it.mixture) this.pourFrom(it, dt);
    // acqua del rubinetto nei contenitori sotto il getto
    const sink = this.fx.sink;
    if (sink.tap) {
      const sp = sink.spout;
      const dest = this.traceStream({ x: sp.x, y: sp.y - 0.01, z: sp.z }, 0, 0, null);
      if (dest.type === 'item') dest.item.mixture.add(Mixture.of(this.chem, [['water', (TAP_FLOW * dt) / 18.05], ['cacl2', TAP_FLOW * dt * 1.5e-6], ['nahco3', TAP_FLOW * dt * 2e-6, true]]));
      sink.stream.scale.y = sp.y - dest.y;
      sink.stream.position.y = dest.y + (sp.y - dest.y) / 2;
    }
    this.chemAcc += dt;
    while (this.chemAcc >= CHEM_DT) {
      this.chemAcc -= CHEM_DT;
      this.chemistry(CHEM_DT);
    }
    for (const it of this.items) this.updateContents(it);
    this.updateHazards(dt);
    this.checkBins();
    this.updateHover();
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

  fmt(n, digits = 1) {
    return Number(n).toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  // ------------------------------------------------------------------ informazioni per l'interfaccia

  /** Testo del suggerimento sotto il mirino. */
  prompt() {
    const { t } = this;
    const h = this.hover;
    const held = this.held;
    const lines = [];
    if (held) {
      if (held.def.container) lines.push(t('promptPour'));
      if (held.kind === 'spatula') lines.push(held.load ? t('promptSpatulaDrop') : t('promptSpatulaTake'));
      if (held.kind === 'loop') lines.push(t('promptLoop'));
      if (held.kind === 'strip') lines.push(t('promptStrip'));
      if (held.kind === 'towel') lines.push(t('promptTowel'));
      if (held.kind === 'extinguisher') lines.push(t('promptExtinguisher'));
      if (h?.type === 'fixture' && h.fixture.kind === 'sink' && held.def.container) lines.push(t('promptWash'));
      if (h?.type === 'fixture' && h.fixture.kind === 'bin' && held.def.container) lines.push(t('promptEmpty', { bin: t(`bin_${h.fixture.bin}`) }));
      lines.push(t('promptDrop'));
      return lines;
    }
    if (!h) return lines;
    if (h.type === 'item') lines.push(t('promptTake', { name: this.itemName(h.item) }));
    else if (h.type === 'puddle') lines.push(t('promptPuddle'));
    else {
      const f = h.fixture;
      const key = {
        hotplate: f.level ? 'promptPlateOn' : 'promptPlate', bunsen: f.on ? 'promptBunsenOff' : 'promptBunsenOn', sink: f.tap ? 'promptTapOff' : 'promptTapOn',
        balance: 'promptTare', hood: f.on ? 'promptHoodOff' : 'promptHoodOn', shower: 'promptShower', bell: 'promptBell', store: 'promptStore',
        towels: 'promptTowels', strips: 'promptStrips', bin: 'promptBin', tray: 'promptTray',
      }[f.kind];
      if (key) lines.push(t(key, { n: f.level, bin: f.bin ? t(`bin_${f.bin}`) : '' }));
    }
    return lines;
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
      out.rows.push({ label: `${c.name}`, formula: c.formula, value });
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
    if (look?.solidKind === 'precipitate') out.notes.push(t('notePrecipitate'));
    if (look?.solidKind === 'crystals' && mix.water > 0.05) out.notes.push(t('noteCrystals'));
    if (mix.solidVolume > 0.02 && mix.water > 0.5 && look?.solidKind !== 'precipitate' && look?.solidKind !== 'crystals') out.notes.push(t('noteUndissolved'));
    if (item.dirty && !item.data.reagent) out.notes.push(t('dirtyNote'));
    out.color = look ? rgbCss(look.turbid > 0.3 ? look.turbidColor : look.liquid) : null;
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
    const looked = this.hover?.type === 'item' ? this.hover.item : null;
    return {
      prompt: this.prompt(),
      held: this.held ? this.describe(this.held) : null,
      looked: looked && looked !== this.held ? this.describe(looked) : null,
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
