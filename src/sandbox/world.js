// Motore della sandbox: griglia di celle (automa cellulare) con temperatura, cambiamenti di stato, densità reali,
// conduzione del calore, combustione, soluzioni acquose, le reazioni del catalogo, elettricità, radioattività,
// fissione ed esplosioni. Modulo puro (niente DOM): lo disegna render.js, lo pilota sandbox-view.js, lo provano i test.
import {
  AMBIENT, T_MAX, AIR_DENSITY, SOLID, LIQUID, GAS, S, DECAY,
  EMPTY, WOOD, COAL, WATER, FIRE, SMOKE, SALT, OXIDE, SOLUTION, GENERATOR, saltCtype,
} from './substances.js';
import { buildChemistry, PAIR_K } from './chemistry.js';

const H_Z = 1;
const HE_Z = 2;
const C_Z = 6;
const O_Z = 8;
const FE_Z = 26;

// stato della cella (bit di `flags`)
export const C_POWDER = 1; // solido sciolto (polvere) invece che blocco
export const C_BURN = 2; // sta bruciando
const PHASE_MASK = 3 << 2; // ultimo stato fisico registrato (per i cambiamenti di stato)
export const C_DISSOLVED = 16; // sciolto in acqua: la cella è una soluzione (es. NaCl(aq))
const FREEZE_AQ = 271.15; // K: una soluzione acquosa gela poco sotto 0 °C…
const BOIL_AQ = 373.15; // …e bollendo lascia cristallizzare il soluto

// scintille: 12 = appena caricata, 11 = trasmette ai vicini, 11–8 = attiva, 7–1 = refrattaria
export const SPARK_START = 12;
const SPARK_EMIT = 11;
export const SPARK_ACTIVE = 8;
const GENERATOR_PERIOD = 12;

// particelle libere
export const NEUTRON = 1;
export const RADIATION = 2;
const MAX_PARTICLES = 4000;
const MAX_BLASTS_PER_STEP = 24;
const THERMITE_T = 1200; // K: innesco dell'alluminotermia (la legna non basta, il magnesio sì)
const DISSOLVE_RATE = 0.03;
const MIX_RATE = 0.45; // diffusione tra liquidi miscibili
const C_RAD2_DX = [];
const C_RAD2_DY = [];
for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx || dy) (C_RAD2_DX.push(dx), C_RAD2_DY.push(dy));

const DX = [-1, 0, 1, -1, 1, -1, 0, 1];
const DY = [-1, -1, -1, 0, 0, 1, 1, 1];
const ORTHO = [1, 3, 4, 6]; // su, sinistra, destra, giù
// vicini raggiunti da una scintilla (raggio 2)
const SPARK_DX = [-1, 0, 1, -1, 1, -1, 0, 1, 0, -2, 2, 0];
const SPARK_DY = [-1, -1, -1, 0, 0, 1, 1, 1, -2, 0, 0, 2];

const clampT = (t) => (t > T_MAX ? T_MAX : t < 0 ? 0 : t);

export class World {
  /**
   * @param {ReturnType<import('./substances.js').createSubstances>} subs
   * @param {number} W colonne
   * @param {number} H righe
   */
  constructor(subs, W, H, { seed = 0x2545f491 } = {}) {
    this.subs = subs;
    this.P = subs.P;
    this.chem = subs.chem ?? (subs.chem = buildChemistry(subs)); // reazioni del catalogo (una volta per tabella)
    this.rng = seed >>> 0 || 1;
    this.openEdges = false;
    this.resize(W, H);
  }

  resize(W, H) {
    this.W = W;
    this.H = H;
    const N = (this.N = W * H);
    this.type = new Uint16Array(N);
    this.temp = new Float32Array(N).fill(AMBIENT);
    this.life = new Int16Array(N);
    this.ctype = new Uint16Array(N);
    this.flags = new Uint8Array(N);
    this.seed = new Uint8Array(N);
    this.vx = new Float32Array(N);
    this.vy = new Float32Array(N);
    this.spark = new Uint8Array(N);
    this.clock = new Uint32Array(N);
    this.particles = [];
    this.tick = 0;
    this.events = new Map();
    this.eventCount = 0;
    this.generators = 0;
  }

  clear() {
    this.type.fill(0);
    this.temp.fill(AMBIENT);
    this.life.fill(0);
    this.ctype.fill(0);
    this.flags.fill(0);
    this.vx.fill(0);
    this.vy.fill(0);
    this.spark.fill(0);
    this.particles.length = 0;
    this.events.clear();
    this.eventCount = 0;
    this.generators = 0;
  }

  /** Numero casuale in [0, 1) (xorshift32, riproducibile con lo stesso seme). */
  rand() {
    let x = this.rng;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.rng = x >>> 0;
    return this.rng / 4294967296;
  }

  event(key) {
    this.events.set(key, (this.events.get(key) ?? 0) + 1);
    this.eventCount++;
  }

  // ---------------------------------------------------------------- celle
  phaseOf(id, T) {
    const P = this.P;
    if (P.flags[id] & S.FIRE) return GAS;
    return T < P.mp[id] ? SOLID : T < P.bp[id] ? LIQUID : GAS;
  }

  /** Stato fisico della cella: le soluzioni sono liquide tra il gelo e l'ebollizione dell'acqua. */
  cellPhase(i) {
    const id = this.type[i];
    if (!id) return 0;
    if (this.flags[i] & C_DISSOLVED) return this.temp[i] < FREEZE_AQ ? SOLID : LIQUID;
    return this.phaseOf(id, this.temp[i]);
  }

  /** Acqua liquida, una soluzione o uno ione. */
  isWater(i) {
    const id = this.type[i];
    if (id === WATER) return this.temp[i] >= FREEZE_AQ + 2 && this.temp[i] < BOIL_AQ;
    return Boolean(this.flags[i] & C_DISSOLVED || this.P.flags[id] & S.AQUEOUS);
  }

  /** La cella è in soluzione o tocca l'acqua (per le reazioni «in soluzione»). */
  isWet(i) {
    if (!this.type[i]) return false;
    if (this.isWater(i)) return true;
    const x = i % this.W;
    const y = (i / this.W) | 0;
    for (const k of ORTHO) {
      const nx = x + DX[k];
      const ny = y + DY[k];
      if (nx >= 0 && ny >= 0 && nx < this.W && ny < this.H && this.isWater(ny * this.W + nx)) return true;
    }
    return false;
  }

  /** Liquido che si mescola con l'acqua (acqua, soluzioni, ioni, alcoli, acidi…). */
  miscible(i) {
    const id = this.type[i];
    return id === WATER || Boolean(this.flags[i] & C_DISSOLVED || this.P.flags[id] & (S.MISCIBLE | S.AQUEOUS));
  }

  /** C'è una sostanza dell'insieme `ids` nel raggio di 2 celle? */
  near(x, y, ids) {
    for (let m = 0; m < 24; m++) {
      const nx = x + C_RAD2_DX[m];
      const ny = y + C_RAD2_DY[m];
      if (nx >= 0 && ny >= 0 && nx < this.W && ny < this.H && ids.has(this.type[ny * this.W + nx])) return true;
    }
    return false;
  }

  /** Una scintilla o una scarica entro 2 celle. */
  sparkNear(x, y) {
    if (this.spark[y * this.W + x] >= SPARK_ACTIVE) return true;
    for (let m = 0; m < 24; m++) {
      const nx = x + C_RAD2_DX[m];
      const ny = y + C_RAD2_DY[m];
      if (nx >= 0 && ny >= 0 && nx < this.W && ny < this.H && this.spark[ny * this.W + nx] >= SPARK_ACTIVE) return true;
    }
    return false;
  }

  /** Luce vicina (fiamma, scintilla, corpo incandescente): basta per le reazioni fotochimiche. */
  lightNear(x, y) {
    for (let m = 0; m < 24; m++) {
      const nx = x + C_RAD2_DX[m];
      const ny = y + C_RAD2_DY[m];
      if (nx < 0 || ny < 0 || nx >= this.W || ny >= this.H) continue;
      const j = ny * this.W + nx;
      if (this.type[j] === FIRE || this.spark[j] >= SPARK_ACTIVE || this.temp[j] > 1000) return true;
    }
    return false;
  }

  /** Mette una sostanza nuova nella cella (stato di default: polvere per elementi e prodotti, blocco per i materiali). */
  setType(i, id, T, ctype = 0) {
    this.type[i] = id;
    this.temp[i] = clampT(T);
    this.ctype[i] = ctype;
    this.vx[i] = 0;
    this.vy[i] = 0;
    this.spark[i] = 0;
    this.clock[i] = this.tick;
    this.seed[i] = (this.rand() * 256) | 0;
    let fl = 0;
    let life = 0;
    if (id) {
      const ph = this.phaseOf(id, this.temp[i]);
      fl = ph << 2;
      if (ph === SOLID && this.subs.list[id].defaultPowder) fl |= C_POWDER;
      if (id === FIRE) life = 14 + ((this.rand() * 30) | 0);
      else if (id === SMOKE) life = 150 + ((this.rand() * 220) | 0);
    }
    this.flags[i] = fl;
    this.life[i] = life;
  }

  /** Trasforma la sostanza della cella conservando forma (polvere/blocco) e moto. */
  transmute(i, id, T) {
    const keep = this.flags[i] & C_POWDER;
    this.type[i] = id;
    this.temp[i] = clampT(T);
    this.ctype[i] = 0;
    this.life[i] = 0;
    this.spark[i] = 0;
    this.clock[i] = this.tick;
    this.flags[i] = keep | (id ? this.phaseOf(id, this.temp[i]) << 2 : 0);
  }

  clearCell(i) {
    this.type[i] = EMPTY;
    this.temp[i] = AMBIENT;
    this.ctype[i] = 0;
    this.life[i] = 0;
    this.flags[i] = 0;
    this.vx[i] = 0;
    this.vy[i] = 0;
    this.spark[i] = 0;
  }

  swap(i, j) {
    const { type, temp, life, ctype, flags, seed, vx, vy, spark } = this;
    let t = type[i]; type[i] = type[j]; type[j] = t;
    let f = temp[i]; temp[i] = temp[j]; temp[j] = f;
    t = life[i]; life[i] = life[j]; life[j] = t;
    t = ctype[i]; ctype[i] = ctype[j]; ctype[j] = t;
    t = flags[i]; flags[i] = flags[j]; flags[j] = t;
    t = seed[i]; seed[i] = seed[j]; seed[j] = t;
    f = vx[i]; vx[i] = vx[j]; vx[j] = f;
    f = vy[i]; vy[i] = vy[j]; vy[j] = f;
    t = spark[i]; spark[i] = spark[j]; spark[j] = t;
    this.clock[i] = this.clock[j] = this.tick;
  }

  /** Mette `id` in una cella vuota vicina (prima sopra, se `up`); restituisce l'indice o -1. */
  spawnNear(x, y, id, T, ctype = 0, up = false) {
    const { W, H, type } = this;
    const start = (this.rand() * 8) | 0;
    for (let n = 0; n < 8; n++) {
      // con `up` si provano prima le tre celle sopra (indici 0–2)
      const k = up && n < 3 ? (start + n) % 3 : (start + n) % 8;
      const nx = x + DX[k];
      const ny = y + DY[k];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (!type[j]) {
        this.setType(j, id, T, ctype);
        return j;
      }
    }
    return -1;
  }

  heatAround(x, y, r, dT) {
    const { W, H, type, temp, P } = this;
    for (let yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r); yy++) {
      for (let xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r); xx++) {
        const j = yy * W + xx;
        if (type[j] && !(P.flags[type[j]] & S.WALL)) temp[j] = clampT(temp[j] + dT);
      }
    }
  }

  /** Ossidante accanto alla cella: indice di una cella di O/F, -2 se c'è aria (in `airCell`), -1 se manca. */
  oxidizer(x, y) {
    const { W, H, type, P } = this;
    let air = false;
    this.airCell = -1;
    for (const k of ORTHO) {
      const nx = x + DX[k];
      const ny = y + DY[k];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
        if (this.openEdges) air = true;
        continue;
      }
      const j = ny * W + nx;
      const id = type[j];
      if (!id || id === FIRE || id === SMOKE) {
        air = true; // la fiamma e il fumo sono mescolati all'aria
        this.airCell = j;
      } else if (P.flags[id] & S.OXIDIZER) return j;
    }
    return air ? -2 : -1;
  }

  /** Quante celle intorno portano ossigeno (aria, O₂, ossidanti). */
  oxidizerCount(x, y) {
    let n = 0;
    for (const k of ORTHO) {
      const nx = x + DX[k];
      const ny = y + DY[k];
      if (nx < 0 || ny < 0 || nx >= this.W || ny >= this.H) continue;
      const id = this.type[ny * this.W + nx];
      if (!id || id === FIRE || id === SMOKE || this.P.flags[id] & S.OXIDIZER) n++;
    }
    return n;
  }

  touchesAir(x, y) {
    return this.oxidizer(x, y) !== -1;
  }

  /**
   * La cella spegne il fuoco? L'acqua sempre; i gas (CO₂, SO₂) solo se freddi: quelli caldi prodotti dalla
   * combustione salgono via con la fiamma.
   */
  extinguishes(j) {
    const id = this.type[j];
    if (!id || !(this.P.flags[id] & S.EXTINGUISHER)) return false;
    return id === WATER || id === SOLUTION || this.temp[j] < 400;
  }

  /** Z dell'elemento che colora la fiamma a contatto con la cella (saggio alla fiamma), o 0. */
  tintOf(j) {
    const id = this.type[j];
    const P = this.P;
    if (P.flameTint[id]) return id;
    if (id === SALT) return P.flameTint[this.ctype[j] >> 7];
    if (id === SOLUTION || id === OXIDE) return P.flameTint[this.ctype[j]];
    return 0;
  }

  // ---------------------------------------------------------------- passo della simulazione
  step() {
    this.tick++;
    this.blasts = 0;
    const { W, H, type, clock } = this;
    const t = this.tick;
    for (let y = H - 1; y >= 0; y--) {
      const row = y * W;
      if ((y + t) & 1) {
        for (let x = 0; x < W; x++) {
          const i = row + x;
          if (type[i] && clock[i] !== t) this.update(i, x, y);
        }
      } else {
        for (let x = W - 1; x >= 0; x--) {
          const i = row + x;
          if (type[i] && clock[i] !== t) this.update(i, x, y);
        }
      }
    }
    this.conduct();
    this.sparks();
    this.stepParticles();
  }

  update(i, x, y) {
    const P = this.P;
    const id = this.type[i];
    this.clock[i] = this.tick;
    const sf = P.flags[id];
    if (sf & (S.WALL | S.GENERATOR)) return;
    if (sf & S.FIRE) {
      this.updateFire(i, x, y);
      return;
    }
    if (sf & S.FADES && --this.life[i] <= 0) {
      this.clearCell(i);
      return;
    }
    const T = this.temp[i];
    // gli esplosivi detonano oltre la loro temperatura (o colpiti da un'esplosione)
    if (sf & S.EXPLOSIVE && T >= P.bp[id]) {
      this.detonate(i, x, y, id);
      return;
    }
    let phase;
    if (this.flags[i] & C_DISSOLVED) {
      // soluzione: bollendo l'acqua evapora e il soluto cristallizza
      if (T >= BOIL_AQ && this.crystallize(i, x, y, id)) return;
      phase = this.cellPhase(i);
      this.flags[i] = (this.flags[i] & ~PHASE_MASK) | (phase << 2);
    } else {
      // si decompone invece di bollire (carbonato di calcio, zuccheri, nitrati…)
      const decomposes = sf & S.DECOMPOSES && (this.chem.single.has(id) || sf & S.ORGANIC);
      if (decomposes && T >= P.bp[id] && this.decompose(i, x, y, id)) return;
      phase = T < P.mp[id] ? SOLID : T < P.bp[id] || decomposes ? (P.mp[id] < P.bp[id] ? LIQUID : SOLID) : GAS;
      const last = (this.flags[i] >> 2) & 3;
      if (last !== phase && last) {
        // isteresi di 1,5 K: niente sfarfallio tra due stati attorno alla temperatura di transizione
        const threshold = Math.min(last, phase) === SOLID ? P.mp[id] : P.bp[id];
        if (Math.abs(T - threshold) < 1.5) phase = last;
      }
      if (last !== phase && this.changePhase(i, id, last, phase)) return;
    }
    if (this.react(i, x, y, id, phase)) return;
    this.move(i, x, y, id, phase);
  }

  /** Bollendo, l'acqua della soluzione diventa vapore e il soluto torna solido (o gas: l'ammoniaca se ne va). */
  crystallize(i, x, y, id) {
    const T = this.temp[i];
    if (this.spawnNear(x, y, WATER, T, 0, true) < 0) return false;
    const ph = this.phaseOf(id, T);
    this.flags[i] = (this.flags[i] & ~(C_DISSOLVED | PHASE_MASK)) | (ph << 2) | (ph === SOLID ? C_POWDER : 0);
    this.event(`crystal:${id}`);
    return true;
  }

  /** Decomposizione termica: una reazione del catalogo, oppure (composti organici) carbonizzazione. */
  decompose(i, x, y, id) {
    const list = this.chem.single.get(id);
    if (list && this.tryList(list, i, x, y, -1, -1)) return true;
    if (this.P.flags[id] & S.ORGANIC && this.rand() < 0.05) {
      const T = this.temp[i];
      this.transmute(i, C_Z, T);
      this.spawnNear(x, y, WATER, T, 0, true);
      this.event(`char:${id}`);
      return true;
    }
    return false;
  }

  /** Detonazione: esplosione e prodotti della reazione del catalogo. */
  detonate(i, x, y, id) {
    const rx = this.chem.boom.get(id) ?? this.chem.single.get(id)?.[0];
    if (this.blasts < MAX_BLASTS_PER_STEP) {
      this.blasts++;
      this.explode(x, y, 5, 1.1, 1500);
    }
    if (this.type[i] !== id) return;
    if (rx) this.applyReaction(rx, [i], x, y);
    else {
      this.setType(i, SMOKE, 2000);
      this.event(`boom:${id}`);
    }
  }

  changePhase(i, id, from, to) {
    let fl = (this.flags[i] & ~PHASE_MASK) | (to << 2);
    if (from && to === SOLID) fl &= ~C_POWDER; // il fuso solidifica in un blocco
    this.flags[i] = fl;
    if (from) {
      const P = this.P;
      // un salto solido ↔ gas con un intervallo liquido è una fusione + ebollizione (non una sublimazione)
      if (from + to === 4 && P.mp[id] < P.bp[id]) {
        this.event(`phase:${id}:${from}2`);
        this.event(`phase:${id}:2${to}`);
      } else this.event(`phase:${id}:${from}${to}`);
    }
    if (this.P.flags[id] & S.AQUEOUS && to === GAS) {
      // uno ione (o una soluzione) che bolle: resta il vapore acqueo
      this.transmute(i, WATER, this.temp[i]);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- chimica
  react(i, x, y, id, phase) {
    const P = this.P;
    const sf = P.flags[id];
    if (this.flags[i] & C_BURN) {
      if (this.burn(i, x, y, id)) return true;
    } else if (sf & S.FLAMMABLE && this.temp[i] >= P.ignite[id]) {
      // i metalli si accendono solo in polvere (la limatura brucia, il ferro fuso no), salvo gli alcalini
      const form = sf & S.BURNS_AS_BLOCK || (phase === SOLID ? this.flags[i] & C_POWDER : !(sf & S.METAL));
      if (form) {
        const over = (this.temp[i] - P.ignite[id]) / 150;
        if (this.rand() < P.igniteChance[id] + over) {
          const ox = this.oxidizer(x, y);
          if (ox !== -1) {
            if (sf & S.INSTANT_BURN) {
              if (id === H_Z) this.flash(i, x, y, ox);
              else this.combust(i, x, y, id, ox >= 0 ? ox : this.airCell, true);
              return true;
            }
            this.flags[i] |= C_BURN;
            // una brace riaccesa conserva il combustibile che le resta
            if (this.life[i] <= 0) this.life[i] = P.fuelMin[id] + ((this.rand() * (P.fuelMax[id] - P.fuelMin[id] + 1)) | 0);
          } else if (id === WOOD && this.temp[i] > 650 && this.rand() < 0.01) {
            // senza ossigeno il legno caldo non brucia: si carbonizza (pirolisi)
            this.transmute(i, COAL, this.temp[i]);
            this.event('pyrolysis');
            return true;
          }
        }
      }
    }
    if (sf & S.RADIOACTIVE && this.rand() < P.decayP[id]) {
      this.decay(i, x, y, id);
      return true;
    }
    const chem = this.chem;
    // reazioni con un solo reagente (decomposizioni catalizzate, fotolisi…)
    if (chem.hasRx[id] & 4 && this.tryList(chem.single.get(id), i, x, y, -1, -1)) return true;
    // reazioni con un vicino a caso
    const k = (this.rand() * 8) | 0;
    const nx = x + DX[k];
    const ny = y + DY[k];
    if (nx < 0 || ny < 0 || nx >= this.W || ny >= this.H) return false;
    const j = ny * this.W + nx;
    const nid = this.type[j];
    if (!nid) {
      // reazioni con l'ossigeno dell'aria (il rame caldo annerisce, l'ossido di azoto diventa bruno…)
      return Boolean(chem.hasRx[id] & 2) && this.tryList(chem.airPair.get(id), i, x, y, j, 0);
    }
    const nf = P.flags[nid];
    // una sostanza solubile a contatto con l'acqua si scioglie (la cella d'acqua entra nella soluzione)
    if (sf & S.SOLUBLE && nid === WATER && !(this.flags[i] & C_DISSOLVED) && this.isWater(j) && this.rand() < DISSOLVE_RATE) {
      this.dissolve(i, j, id);
      return true;
    }
    if (sf & S.WATER_REACTIVE && nid === WATER && this.temp[j] >= P.mp[WATER]) return this.waterReaction(i, j, x, y, id);
    if (sf & S.METAL && nf & S.HALOGEN) return this.halide(i, j, id, nid);
    if (nid === OXIDE && sf & S.METAL && this.temp[i] >= THERMITE_T && (phase !== SOLID || this.flags[i] & C_POWDER)) return this.thermite(i, j, x, y, id);
    if (id === FE_Z && nid === WATER && this.rand() < 0.0008 && this.touchesAir(x, y)) {
      this.setType(i, this.subs.oxideFor(FE_Z) || OXIDE, this.temp[i], FE_Z);
      this.event('rust');
      return true;
    }
    // le reazioni del catalogo tra le due sostanze
    if (chem.hasRx[id] & 1) {
      const list = chem.pair.get(id * PAIR_K + nid);
      if (list && this.tryList(list, i, x, y, j, nid)) return true;
    }
    return false;
  }

  dissolve(i, j, id) {
    const T = (this.temp[i] + this.temp[j]) / 2;
    this.clearCell(j);
    this.temp[i] = T;
    this.flags[i] = (this.flags[i] & ~(C_POWDER | PHASE_MASK)) | C_DISSOLVED | ((T < FREEZE_AQ ? SOLID : LIQUID) << 2);
    this.event(`dissolve:${id}`);
  }

  // ---------------------------------------------------------------- reazioni del catalogo
  /** Prova le reazioni dell'elenco (a partire da una a caso); true se una è avvenuta. */
  tryList(list, i, x, y, j, nid) {
    const n = list.length;
    const start = (this.rand() * n) | 0;
    for (let q = 0; q < n; q++) if (this.tryReaction(list[(start + q) % n], i, x, y, j, nid)) return true;
    return false;
  }

  /** Verifica le condizioni, raccoglie le celle dei reagenti e, se c'è tutto, esegue la reazione. */
  tryReaction(rx, i, x, y, j, nid) {
    const c = rx.cond;
    if (this.rand() >= c.rate) return false;
    let T = this.temp[i];
    if (nid > 0) T = Math.max(T, this.temp[j]);
    if (T > c.maxT) return false;
    if (c.light) {
      if (!(this.lightNear(x, y) || (c.ignite && T >= c.minT))) return false;
    } else if (T < c.minT) return false;
    if (c.spark && !(this.spark[i] >= SPARK_ACTIVE || (nid > 0 && this.spark[j] >= SPARK_ACTIVE))) return false;
    if (c.discharge && !this.sparkNear(x, y)) return false;
    if (c.catalysts && !this.near(x, y, c.catalysts)) return false;
    if (c.lowO2 && this.oxidizerCount(x, y) > 1) return false;
    const slots = this.gatherSlots(rx, i, x, y, j, nid);
    if (!slots) return false;
    if (c.water && !slots.every((k) => !this.type[k] || this.isWet(k))) return false;
    if (c.steam && !slots.some((k) => this.type[k] === WATER && this.temp[k] >= BOIL_AQ)) return false;
    this.applyReaction(rx, slots, x, y);
    return true;
  }

  /** Una cella per reagente: la cella attiva, il vicino (o l'aria per l'O₂) e gli altri entro 2 celle. */
  gatherSlots(rx, i, x, y, j, nid) {
    const rs = rx.reactants;
    const slots = new Array(rs.length).fill(-1);
    const id = this.type[i];
    const k = rs.findIndex((r) => r.sid === id);
    if (k < 0) return null;
    slots[k] = i;
    if (nid === 0) {
      if (rx.air < 0 || slots[rx.air] !== -1) return null;
      slots[rx.air] = j;
    } else if (nid > 0) {
      const k2 = rs.findIndex((r, q) => r.sid === nid && slots[q] === -1);
      if (k2 < 0) return null;
      slots[k2] = j;
    }
    for (let q = 0; q < rs.length; q++) {
      if (slots[q] !== -1) continue;
      const sid = rs[q].sid;
      let found = -1;
      for (let m = 0; m < 24 && found < 0; m++) {
        const nx = x + C_RAD2_DX[m];
        const ny = y + C_RAD2_DY[m];
        if (nx < 0 || ny < 0 || nx >= this.W || ny >= this.H) continue;
        const idx = ny * this.W + nx;
        const t = this.type[idx];
        if ((t === sid || (q === rx.air && !t)) && !slots.includes(idx)) found = idx;
      }
      if (found < 0) return null;
      slots[q] = found;
    }
    return slots;
  }

  /**
   * Esegue la reazione: ogni reagente si consuma in proporzione al suo coefficiente, le celle consumate diventano
   * i prodotti (scelti secondo i coefficienti) e il calore di reazione cambia la temperatura.
   */
  applyReaction(rx, slots, x, y) {
    const P = this.P;
    const consumed = [];
    for (let q = 0; q < slots.length; q++) if (slots[q] >= 0 && this.rand() < rx.reactants[q].c / rx.cmax) consumed.push(slots[q]);
    if (!consumed.length) consumed.push(slots[rx.maxIndex] >= 0 ? slots[rx.maxIndex] : slots[0]);
    let wet = rx.cond.water;
    let Tsum = 0;
    for (const k of consumed) {
      const t = this.type[k];
      Tsum += t ? this.temp[k] : AMBIENT;
      if (t && (this.flags[k] & C_DISSOLVED || P.flags[t] & S.AQUEOUS)) wet = true;
    }
    // in soluzione il calore si disperde nell'acqua (neutralizzazione: qualche decina di gradi, non centinaia)
    const T = clampT(Tsum / consumed.length + (wet && !rx.cond.water ? rx.dT / 6 : rx.dT));
    const nProd = Math.floor((consumed.length * rx.P) / rx.R + this.rand());
    for (let n = 0; n < Math.max(nProd, consumed.length); n++) {
      const sid = n < nProd ? this.sampleProduct(rx) : 0;
      if (n < consumed.length) {
        if (sid) this.placeProduct(consumed[n], sid, T, wet);
        else this.clearCell(consumed[n]);
      } else {
        const cell = this.spawnNear(x, y, sid, T, 0, P.densG[sid] < AIR_DENSITY);
        if (cell >= 0) this.placeProduct(cell, sid, T, wet);
      }
    }
    this.event(`rx:${rx.id}`);
  }

  sampleProduct(rx) {
    let r = this.rand() * rx.P;
    for (const p of rx.products) if ((r -= p.c) < 0) return p.sid;
    return rx.products[rx.products.length - 1].sid;
  }

  /** Mette un prodotto nella cella; in soluzione le sostanze solubili restano sciolte, le altre precipitano. */
  placeProduct(cell, sid, T, wet) {
    this.setType(cell, sid, T);
    if (wet && sid !== WATER && this.P.flags[sid] & S.SOLUBLE && T < BOIL_AQ && this.phaseOf(sid, T) !== GAS) {
      this.flags[cell] = (this.flags[cell] & ~(C_POWDER | PHASE_MASK)) | C_DISSOLVED | (LIQUID << 2);
    }
  }

  /** Combustione di un composto: la reazione del catalogo con l'ossigeno (o, se manca, CO₂ + H₂O). */
  combust(i, x, y, id, ox, flash = false) {
    const P = this.P;
    const T = Math.max(this.temp[i], P.flame[id]);
    this.temp[i] = T;
    const rx = this.chem.comb.get(id);
    const oxCell = ox >= 0 && (!this.type[ox] || this.type[ox] === O_Z || this.type[ox] === FIRE || this.type[ox] === SMOKE) ? ox : -1;
    if (rx) {
      const slots = rx.reactants.map((r) => (r.sid === id ? i : oxCell));
      if (slots[rx.air] < 0) slots[rx.air] = -1;
      this.applyReaction(rx, slots, x, y);
    } else {
      // senza reazione in catalogo: il carbonio diventa CO₂, l'idrogeno acqua
      const counts = this.subs.list[id].counts ?? {};
      const products = [counts[6] ? this.subs.byKey.get('co2').id : 0, counts[1] ? WATER : 0].filter(Boolean);
      if (!products.length) products.push(SMOKE);
      this.setType(i, products[0], T);
      if (products[1] && oxCell >= 0) this.setType(oxCell, products[1], T * 0.9);
      this.event(`burn:${id}`);
    }
    if (flash) {
      const tint = P.flameTint[id];
      for (let k = 0; k < 8; k++) {
        const nx = x + DX[k];
        const ny = y + DY[k];
        if (nx < 0 || ny < 0 || nx >= this.W || ny >= this.H) continue;
        const j = ny * this.W + nx;
        if (!this.type[j]) {
          if (this.rand() < 0.5) this.setType(j, FIRE, P.flame[id], tint);
        } else if (this.type[j] === id) this.temp[j] = Math.max(this.temp[j], P.ignite[id] + 20);
        else if (!(P.flags[this.type[j]] & S.WALL)) this.temp[j] = clampT(this.temp[j] + 40);
      }
    }
  }

  /** Metallo alcalino (o alcalino-terroso) + acqua → idrossido in soluzione + idrogeno + calore. */
  waterReaction(m, w, x, y, id) {
    const P = this.P;
    const T = this.temp[m];
    const hot = P.waterHot[id];
    if (hot && T < hot && this.temp[w] < hot) return false;
    if (this.rand() >= P.waterRate[id] * (1 + Math.max(0, T - AMBIENT) / 600)) return false;
    const heat = P.waterHeat[id];
    const tw = this.temp[w] + heat * 0.5;
    const hydroxide = this.subs.hydroxideFor(id);
    // es. NaOH(aq): la soluzione resta sotto l'ebollizione, il calore in più fa bollire l'acqua vicina
    if (hydroxide) this.placeProduct(w, hydroxide, Math.min(tw, BOIL_AQ - 10), true);
    else if (tw >= BOIL_AQ) this.setType(w, WATER, tw); // l'acqua vaporizza subito
    else this.setType(w, SOLUTION, tw, id);
    // 2 M + 2 H₂O → 2 MOH + H₂: una cella di idrogeno ogni due di metallo alcalino
    const alkali = this.subs.list[id].category === 'alkali';
    if (!alkali || this.rand() < 0.5) this.setType(m, H_Z, T + heat, id);
    else this.clearCell(m);
    this.heatAround(x, y, 1, heat * 0.35);
    if (P.waterBoom[id] && this.rand() < P.waterBoom[id]) this.explode(x, y, 3, 0.55, 350);
    this.event(`water:${id}`);
    return true;
  }

  /** Metallo + alogeno → sale (es. 2 Na + Cl₂ → 2 NaCl); più è grande la differenza di elettronegatività, più è veloce. */
  halide(m, h, id, hal) {
    const P = this.P;
    const r = Math.min(1, Math.max(0, (P.en[hal] - P.en[id] - 0.6) / 2.4));
    if (r <= 0) return false;
    const T = Math.max(this.temp[m], this.temp[h]);
    if (this.rand() >= 0.03 * r * r * (1 + Math.max(0, T - AMBIENT) / 150)) return false;
    const heat = 120 + 500 * r;
    const keep = this.flags[m] & C_POWDER;
    const lib = this.subs.saltFor(id, hal); // il sale della libreria (NaCl, FeCl₃…) o, se manca, uno generico
    if (lib) this.setType(m, lib, this.temp[m] + heat);
    else this.setType(m, SALT, this.temp[m] + heat, saltCtype(id, hal));
    if (!keep && this.phaseOf(this.type[m], this.temp[m]) === SOLID) this.flags[m] &= ~C_POWDER; // un blocco di metallo diventa un blocco di sale
    // una molecola X₂ ogni 2/n atomi di metallo con carica n
    if (this.rand() < Math.min(1, P.charge[id] / 2)) this.clearCell(h);
    else this.temp[h] = clampT(this.temp[h] + heat * 0.5);
    this.event(`salt:${id}:${hal}`);
    return true;
  }

  /** Alluminotermia: un metallo più reattivo strappa l'ossigeno all'ossido di uno meno reattivo (2 Al + Fe₂O₃). */
  thermite(m, o, x, y, id) {
    const P = this.P;
    const b = this.ctype[o];
    if (!b || b === id || !(P.flags[b] & S.METAL)) return false;
    if (P.en[id] >= P.en[b] - 0.15) return false;
    if (this.rand() >= 0.3) return false;
    const T = Math.max(this.temp[m], 2800) + this.rand() * 300;
    const lib = this.subs.oxideFor(id);
    if (lib) this.setType(m, lib, T);
    else this.setType(m, OXIDE, T, id);
    this.setType(o, b, T);
    this.heatAround(x, y, 2, 450);
    this.event(`thermite:${id}:${b}`);
    return true;
  }

  burn(i, x, y, id) {
    const P = this.P;
    // acqua o CO₂ vicini spengono la fiamma
    const k = (this.rand() * 8) | 0;
    const nx = x + DX[k];
    const ny = y + DY[k];
    let tint = P.flameTint[id];
    if (nx >= 0 && ny >= 0 && nx < this.W && ny < this.H) {
      const j = ny * this.W + nx;
      tint ||= this.tintOf(j); // un sale accanto colora la fiamma
      if (this.extinguishes(j) && this.rand() < 0.25) {
        this.flags[i] &= ~C_BURN;
        this.temp[i] = clampT(this.temp[i] - 150);
        return false;
      }
      // la fiamma lambisce ciò che le sta accanto e lo scalda
      const nid = this.type[j];
      if (nid && !(P.flags[nid] & S.WALL)) {
        if (P.flags[nid] & S.FLAMMABLE && !(this.flags[j] & C_BURN)) this.temp[j] = clampT(this.temp[j] + 30);
        const radiant = P.flame[id] * 0.7; // il calore che arriva dalla fiamma
        if (this.temp[j] < radiant) this.temp[j] += (radiant - this.temp[j]) * 0.08;
      }
    }
    const ox = this.oxidizer(x, y);
    if (ox === -1) {
      // senza ossigeno non brucia: il legno caldo si carbonizza (pirolisi), la brace si spegne
      if (id === WOOD && this.temp[i] > 650 && this.rand() < 0.01) {
        this.transmute(i, COAL, this.temp[i]);
        this.event('pyrolysis');
        return true;
      }
      if (this.rand() < 0.02) this.flags[i] &= ~C_BURN;
      return false;
    }
    const pure = ox >= 0;
    this.life[i] -= pure ? 3 : 1;
    const flame = P.flame[id] * (pure ? 1.15 : 1);
    // chi brucia resta poco sotto l'ebollizione (la fiamma è più calda): il magnesio arde, non evapora
    const hot = Math.min(flame, P.bp[id] - 5);
    const T = this.temp[i];
    if (T < hot) this.temp[i] = clampT(T + (hot - T) * 0.2);
    if (this.rand() < 0.55) this.spawnNear(x, y, FIRE, flame * (0.8 + 0.15 * this.rand()), tint, true);
    if (P.burnGas[id] && this.rand() < P.gasChance[id]) this.spawnNear(x, y, P.burnGas[id], flame * 0.6, 0, true);
    if (pure && this.rand() < 0.04) {
      // l'ossigeno puro si consuma
      const gas = P.burnGas[id] && P.burnGas[id] !== SMOKE ? P.burnGas[id] : P.burnEnd[id] && P.burnEnd[id] !== OXIDE ? P.burnEnd[id] : 0;
      if (gas) this.setType(ox, gas, flame * 0.6);
      else this.clearCell(ox);
    }
    if (this.life[i] <= 0) {
      this.finishBurn(i, x, y, id, ox >= 0 ? ox : this.airCell);
      return true;
    }
    return false;
  }

  finishBurn(i, x, y, id, ox) {
    const P = this.P;
    const T = this.temp[i];
    this.flags[i] &= ~C_BURN;
    if (id >= this.subs.firstCompound) {
      this.combust(i, x, y, id, ox);
      return;
    }
    this.event(`burn:${id}`);
    const end = P.burnEnd[id];
    if (end === OXIDE) {
      // l'ossido della libreria (MgO, Fe₂O₃…) o, se manca, un ossido generico
      const lib = this.subs.oxideFor(id);
      if (lib) this.setType(i, lib, Math.min(T, 1900));
      else this.setType(i, OXIDE, Math.min(T, 1900), id);
      return;
    }
    if (end) {
      this.setType(i, end, T);
      return;
    }
    const res = P.residue[id];
    if (res) {
      let r = this.rand();
      for (const [rid, p] of res) {
        if (r < p) {
          this.setType(i, rid, Math.min(T, 900));
          return;
        }
        r -= p;
      }
    }
    this.clearCell(i);
  }

  /** Idrogeno: brucia di colpo (2 H₂ + O₂ → 2 H₂O) e accende quello vicino. */
  flash(i, x, y, ox) {
    const { W, H, type, temp, P } = this;
    const tint = this.ctype[i] && P.flameTint[this.ctype[i]] ? this.ctype[i] : H_Z;
    this.setType(i, WATER, 2400 + this.rand() * 200);
    // 2 H₂ + O₂: una cella di ossigeno ogni due di idrogeno
    if (ox >= 0 && this.rand() < 0.5) {
      if (type[ox] === O_Z) this.setType(ox, WATER, 2600);
      else this.clearCell(ox);
    }
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        const t = type[j];
        if (!t) {
          if (dx * dx + dy * dy <= 2 && this.rand() < 0.6) this.setType(j, FIRE, 2200, tint);
        } else if (t === H_Z) temp[j] = Math.max(temp[j], 900);
        else if (!(P.flags[t] & S.WALL)) temp[j] = clampT(temp[j] + 60);
      }
    }
    this.event(`burn:${H_Z}`);
  }

  updateFire(i, x, y) {
    const P = this.P;
    let T = this.temp[i];
    T -= (T - AMBIENT) * 0.035;
    this.temp[i] = T;
    if (--this.life[i] <= 0 || T < 480) {
      if (this.rand() < 0.08) this.setType(i, SMOKE, T);
      else this.clearCell(i);
      return;
    }
    const k = (this.rand() * 8) | 0;
    const nx = x + DX[k];
    const ny = y + DY[k];
    if (nx >= 0 && ny >= 0 && nx < this.W && ny < this.H) {
      const j = ny * this.W + nx;
      const nid = this.type[j];
      if (nid) {
        const nf = P.flags[nid];
        if (this.extinguishes(j)) {
          if (nid === WATER || nid === SOLUTION) {
            this.temp[j] = clampT(this.temp[j] + 30);
            this.clearCell(i);
            return;
          }
          if (this.rand() < 0.5) {
            this.clearCell(i);
            return;
          }
        }
        if (nf & S.FLAMMABLE && !(this.flags[j] & C_BURN) && T > P.ignite[nid] && this.rand() < 0.12) {
          this.temp[j] = Math.max(this.temp[j], P.ignite[nid] + 1);
        }
        if (!this.ctype[i]) {
          // saggio alla fiamma: il colore viene dalla sostanza toccata o dalla fiamma già colorata accanto
          const tint = nid === FIRE ? (this.rand() < 0.5 ? this.ctype[j] : 0) : this.tintOf(j);
          if (tint) this.ctype[i] = tint;
        }
      }
    }
    this.moveGas(i, x, y, FIRE);
  }

  // ---------------------------------------------------------------- radioattività
  decay(i, x, y, id) {
    const P = this.P;
    const mode = P.decayMode[id];
    if (mode === DECAY.FISSION) {
      this.fission(i, x, y, id, true);
      return;
    }
    const T = this.temp[i];
    this.transmute(i, P.daughter[id], T + (mode === DECAY.ALPHA ? 50 : 20));
    if (mode === DECAY.ALPHA) this.spawnNear(x, y, HE_Z, T); // la particella α diventa un atomo di elio
    this.emit(x + 0.5, y + 0.5, RADIATION, this.rand() * Math.PI * 2, 2.5, 30);
    this.event(`decay:${id}`);
  }

  /** Fissione: il nucleo si spezza in due frammenti (es. ²³⁵U + n → Ba + Kr + 3 n) e libera neutroni e calore. */
  fission(i, x, y, id, spontaneous) {
    let heavy = 52 + ((this.rand() * 5) | 0);
    if (heavy >= id - 20) heavy = Math.round(id * 0.58);
    const light = id - heavy;
    const n = 2 + ((id + heavy) & 1);
    const T = this.temp[i];
    this.transmute(i, heavy, T + 700);
    if (light > 0) this.spawnNear(x, y, light, T + 700);
    for (let k = 0; k < n; k++) this.emit(x + 0.5, y + 0.5, NEUTRON, this.rand() * Math.PI * 2, 3, 200);
    this.emit(x + 0.5, y + 0.5, RADIATION, this.rand() * Math.PI * 2, 2.5, 30);
    this.heatAround(x, y, 2, 350);
    if (this.blasts < MAX_BLASTS_PER_STEP) {
      this.blasts++;
      this.explode(x, y, 2.5, 0.35, 0);
    }
    this.event(`${spontaneous ? 'sf' : 'fission'}:${id}:${heavy}`);
  }

  emit(x, y, kind, angle, speed, life) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, kind, slow: false });
  }

  stepParticles() {
    const { W, H, type, temp, P, particles: ps } = this;
    for (let n = ps.length - 1; n >= 0; n--) {
      const p = ps[n];
      let alive = --p.life > 0;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy))));
      for (let s = 0; alive && s < steps; s++) {
        const px = p.x;
        const py = p.y;
        p.x += p.vx / steps;
        p.y += p.vy / steps;
        const cx = Math.floor(p.x);
        const cy = Math.floor(p.y);
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) {
          alive = false;
          break;
        }
        if (cx === Math.floor(px) && cy === Math.floor(py)) continue;
        const j = cy * W + cx;
        const id = type[j];
        if (!id) continue;
        const f = P.flags[id];
        if (f & S.WALL) {
          if (p.kind === RADIATION) {
            alive = false;
            break;
          }
          // rimbalzo sul muro
          if (type[Math.floor(py) * W + cx] && P.flags[type[Math.floor(py) * W + cx]] & S.WALL) p.vx = -p.vx;
          else p.vy = -p.vy;
          p.x = px;
          p.y = py;
          break;
        }
        if (p.kind === NEUTRON) {
          if (f & S.FISSILE && this.rand() < P.fission[id] * (p.slow ? 3 : 1)) {
            this.fission(j, cx, cy, id, false);
            alive = false;
            break;
          }
          if (f & S.ABSORBER && this.rand() < P.absorb[id]) {
            temp[j] = clampT(temp[j] + 5);
            alive = false;
            break;
          }
          if (f & S.REFLECTOR && this.rand() < 0.35) {
            p.vx = -p.vx;
            p.vy = -p.vy;
            p.x = px;
            p.y = py;
            break;
          }
          if (f & S.MODERATOR) {
            const m = P.moderate[id];
            p.vx *= m;
            p.vy *= m;
            const v = Math.hypot(p.vx, p.vy);
            if (v < 1.2) p.slow = true;
            if (v < 0.8) {
              p.vx *= 0.8 / v;
              p.vy *= 0.8 / v;
            }
          } else if (this.rand() < 0.02) {
            const a = this.rand() * Math.PI * 2;
            const v = Math.hypot(p.vx, p.vy);
            p.vx = Math.cos(a) * v;
            p.vy = Math.sin(a) * v;
          }
        } else {
          // radiazione: assorbita dalla materia densa (il piombo scherma), illumina i gas
          const T = temp[j];
          const ph = this.phaseOf(id, T);
          if (ph === GAS && f & S.DISCHARGE && !this.spark[j]) this.spark[j] = 9;
          const dens = ph === SOLID ? P.densS[id] : ph === LIQUID ? P.densL[id] : 0.001;
          let a = Math.min(0.9, dens * 0.025);
          if (f & S.SHIELD) a = Math.min(0.95, a * 3);
          if (this.rand() < a) {
            temp[j] = clampT(T + 12);
            alive = false;
            break;
          }
        }
      }
      if (!alive) {
        ps[n] = ps[ps.length - 1];
        ps.pop();
      }
    }
  }

  // ---------------------------------------------------------------- movimento
  move(i, x, y, id, phase) {
    if (this.vx[i] !== 0 || this.vy[i] !== 0) {
      if (phase === SOLID && !(this.flags[i] & C_POWDER)) {
        this.vx[i] = 0;
        this.vy[i] = 0;
      } else if (this.fling(i, x, y, id, phase)) return;
    }
    if (phase === SOLID) {
      if (this.flags[i] & C_POWDER) this.movePowder(i, x, y, id);
    } else if (phase === LIQUID) this.moveLiquid(i, x, y, id);
    else this.moveGas(i, x, y, id);
  }

  /** 1 = cella vuota, 2 = fluido più leggero (si scambiano), 0 = non si può entrare. */
  sinkInto(j, d) {
    const nid = this.type[j];
    if (!nid) return 1;
    const P = this.P;
    const nf = P.flags[nid];
    if (nf & S.FIRE) return 2;
    if (nf & (S.WALL | S.GENERATOR)) return 0;
    const T = this.temp[j];
    if (this.flags[j] & C_DISSOLVED) return T >= FREEZE_AQ && P.dissDens[nid] < d ? 2 : 0;
    if (T < P.mp[nid]) return 0;
    const nd = T < P.bp[nid] ? P.densL[nid] : (P.densG[nid] * 273.15) / T;
    return nd < d ? 2 : 0;
  }

  isGasCell(j) {
    const id = this.type[j];
    if (this.flags[j] & C_DISSOLVED) return false;
    return Boolean(this.P.flags[id] & S.FIRE) || this.temp[j] >= this.P.bp[id];
  }

  movePowder(i, x, y, id) {
    const W = this.W;
    if (y + 1 >= this.H) {
      if (this.openEdges) this.clearCell(i);
      return;
    }
    const d = this.P.densS[id];
    const b = i + W;
    let r = this.sinkInto(b, d);
    if (r === 1 || (r === 2 && this.rand() < 0.6)) {
      this.swap(i, b);
      return;
    }
    const dir = this.rand() < 0.5 ? -1 : 1;
    for (let s = 0; s < 2; s++) {
      const k = s ? -dir : dir;
      const nx = x + k;
      if (nx < 0 || nx >= W) continue;
      r = this.sinkInto(b + k, d);
      if (r === 1 || (r === 2 && this.rand() < 0.35)) {
        this.swap(i, b + k);
        return;
      }
    }
  }

  moveLiquid(i, x, y, id) {
    const { W, H, P } = this;
    const dissolved = this.flags[i] & C_DISSOLVED;
    const d = dissolved ? P.dissDens[id] : P.densL[id];
    // liquidi miscibili (acqua, soluzioni, alcol…) si mescolano per diffusione
    if (this.rand() < MIX_RATE && this.miscible(i)) {
      const k = ORTHO[(this.rand() * 4) | 0];
      const nx = x + DX[k];
      const ny = y + DY[k];
      if (nx >= 0 && ny >= 0 && nx < W && ny < H) {
        const j = ny * W + nx;
        const nid = this.type[j];
        if (nid && nid !== id && this.miscible(j) && this.cellPhase(j) === LIQUID) {
          this.swap(i, j);
          return;
        }
      }
    }
    if (y + 1 < H) {
      const b = i + W;
      let r = this.sinkInto(b, d);
      if (r === 1 || (r === 2 && this.rand() < 0.5)) {
        this.swap(i, b);
        return;
      }
      const dir = this.rand() < 0.5 ? -1 : 1;
      for (let s = 0; s < 2; s++) {
        const k = s ? -dir : dir;
        const nx = x + k;
        if (nx < 0 || nx >= W) continue;
        r = this.sinkInto(b + k, d);
        if (r === 1 || (r === 2 && this.rand() < 0.3)) {
          this.swap(i, b + k);
          return;
        }
      }
    } else if (this.openEdges) {
      this.clearCell(i);
      return;
    }
    // scorre di lato, fino a `disp` celle
    const disp = dissolved ? 5 : P.disp[id];
    let dir = this.rand() < 0.5 ? -1 : 1;
    for (let s = 0; s < 2; s++, dir = -dir) {
      let target = -1;
      for (let k = 1; k <= disp; k++) {
        const nx = x + dir * k;
        if (nx < 0 || nx >= W) {
          if (this.openEdges && k === 1) {
            this.clearCell(i);
            return;
          }
          break;
        }
        const j = i + dir * k;
        if (!this.type[j]) {
          target = j;
          continue;
        }
        if (this.isGasCell(j)) target = j;
        break;
      }
      if (target >= 0) {
        this.swap(i, target);
        return;
      }
    }
  }

  moveGas(i, x, y, id) {
    const { W, H, P } = this;
    const T = this.temp[i];
    const rho = id === FIRE ? 0.0002 : (P.densG[id] * 273.15) / T;
    // galleggiamento: i gas più leggeri dell'aria salgono, quelli più pesanti scendono
    let b = (AIR_DENSITY - rho) / AIR_DENSITY;
    if (b > 1) b = 1;
    else if (b < -1) b = -1;
    const pUp = Math.max(0.04, 0.22 + 0.42 * b);
    const pDown = Math.max(0.04, 0.22 - 0.42 * b);
    const r = this.rand();
    const dy = r < pUp ? -1 : r < pUp + pDown ? 1 : 0;
    const dx = dy === 0 ? (this.rand() < 0.5 ? -1 : 1) : ((this.rand() * 3) | 0) - 1;
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
      if (this.openEdges) this.clearCell(i);
      return;
    }
    const j = ny * W + nx;
    const nid = this.type[j];
    if (!nid) {
      this.swap(i, j);
      return;
    }
    const nf = P.flags[nid];
    if (nid === id || nf & (S.WALL | S.GENERATOR)) return;
    const nT = this.temp[j];
    const nph = nf & S.FIRE ? GAS : this.flags[j] & C_DISSOLVED ? LIQUID : nT < P.mp[nid] ? SOLID : nT < P.bp[nid] ? LIQUID : GAS;
    if (nph === GAS) {
      const nrho = nid === FIRE ? 0.0002 : (P.densG[nid] * 273.15) / nT;
      if ((dy < 0 && rho < nrho) || (dy > 0 && rho > nrho) || (dy === 0 && this.rand() < 0.3)) this.swap(i, j);
    } else if (nph === LIQUID && dy < 0 && this.rand() < 0.5) this.swap(i, j); // bolla che risale
  }

  /** Moto balistico delle particelle lanciate da un'esplosione. Restituisce true se ha gestito il movimento. */
  fling(i, x, y, id, phase) {
    const { W, H, P } = this;
    let vx = this.vx[i];
    let vy = this.vy[i];
    const d = phase === SOLID ? P.densS[id] : phase === LIQUID ? P.densL[id] : 0;
    const n = Math.ceil(Math.max(Math.abs(vx), Math.abs(vy)));
    let cur = i;
    let cx = x;
    let cy = y;
    let fx = x + 0.5;
    let fy = y + 0.5;
    for (let s = 0; s < n; s++) {
      fx += vx / n;
      fy += vy / n;
      const nx = Math.floor(fx);
      const ny = Math.floor(fy);
      if (nx === cx && ny === cy) continue;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
        if (this.openEdges) {
          this.clearCell(cur);
          return true;
        }
        if (nx < 0 || nx >= W) vx = -vx * 0.4;
        if (ny < 0 || ny >= H) vy = -vy * 0.4;
        break;
      }
      const j = ny * W + nx;
      const r = this.type[j] ? (phase === GAS ? 0 : this.sinkInto(j, d)) : 1;
      if (r) {
        this.swap(cur, j);
        cur = j;
        cx = nx;
        cy = ny;
      } else {
        vx *= 0.35;
        vy *= 0.35;
        break;
      }
    }
    if (phase !== GAS) vy += 0.35;
    const drag = phase === GAS ? 0.8 : 0.93;
    vx *= drag;
    vy *= drag;
    if (Math.abs(vx) + Math.abs(vy) < 0.6) vx = vy = 0;
    this.vx[cur] = vx;
    this.vy[cur] = vy;
    return cur !== i;
  }

  // ---------------------------------------------------------------- calore
  conduct() {
    const { W, H, type, temp, P } = this;
    const sq = P.sqrtCond;
    const fl = P.flags;
    const bp = P.bp;
    const open = this.openEdges;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x;
        const a = type[i];
        if (!a) continue;
        const fa = fl[a];
        if (fa & S.WALL) continue;
        const ka = sq[a];
        const hca = temp[i] >= bp[a] ? 0.3 : 1; // i gas hanno poca capacità termica
        let air = 0;
        if (x + 1 < W) {
          const j = i + 1;
          const b = type[j];
          if (!b) air++;
          else if (!(fl[b] & S.WALL)) {
            const k = ka * sq[b];
            if (k > 0) {
              const hcb = temp[j] >= bp[b] ? 0.3 : 1;
              const q = k * (temp[j] - temp[i]) * (hca < hcb ? hca : hcb);
              temp[i] += q / hca;
              temp[j] -= q / hcb;
            }
          }
        } else if (open) air++;
        if (y + 1 < H) {
          const j = i + W;
          const b = type[j];
          if (!b) air++;
          else if (!(fl[b] & S.WALL)) {
            const k = ka * sq[b];
            if (k > 0) {
              const hcb = temp[j] >= bp[b] ? 0.3 : 1;
              const q = k * (temp[j] - temp[i]) * (hca < hcb ? hca : hcb);
              temp[i] += q / hca;
              temp[j] -= q / hcb;
            }
          }
        } else if (open) air++;
        if (x > 0 ? !type[i - 1] : open) air++;
        if (y > 0 ? !type[i - W] : open) air++;
        // l'aria riporta lentamente tutto alla temperatura ambiente
        if (air && !(fa & S.FIRE)) temp[i] += (AMBIENT - temp[i]) * air * (hca < 1 ? 0.004 : 0.0012);
      }
    }
  }

  // ---------------------------------------------------------------- elettricità
  conductive(j) {
    const id = this.type[j];
    if (!id) return false;
    const P = this.P;
    const f = P.flags[id];
    if (f & S.CONDUCTOR) return true;
    const T = this.temp[j];
    if (this.flags[j] & C_DISSOLVED) return Boolean(f & S.LIQUID_CONDUCTOR) && T >= FREEZE_AQ; // le soluzioni di sali e acidi conducono
    if (f & S.SEMI) return T > 450;
    if (f & S.LIQUID_CONDUCTOR) return T >= P.mp[id] && T < P.bp[id];
    if (f & S.DISCHARGE) return T >= P.bp[id];
    return false;
  }

  sparks() {
    const { N, W, H, spark, type, temp, P } = this;
    let active = false;
    let gens = 0;
    const pulse = this.tick % GENERATOR_PERIOD === 0;
    for (let i = 0; i < N; i++) {
      const s = spark[i];
      if (s) {
        spark[i] = s - 1;
        active = true;
      }
      if (type[i] === GENERATOR) {
        gens++;
        if (pulse) {
          spark[i] = SPARK_EMIT;
          active = true;
        }
      }
    }
    this.generators = gens;
    if (!active) return;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const s = spark[i];
        if (s < SPARK_ACTIVE || s > SPARK_EMIT) continue;
        const id = type[i];
        if (!id) {
          spark[i] = 0;
          continue;
        }
        if (s === SPARK_EMIT) {
          for (let k = 0; k < 12; k++) {
            const nx = x + SPARK_DX[k];
            const ny = y + SPARK_DY[k];
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const j = ny * W + nx;
            if (!spark[j] && this.conductive(j)) spark[j] = SPARK_START;
          }
        }
        if (id === GENERATOR) continue;
        const f = P.flags[id];
        // effetto Joule
        temp[i] = clampT(temp[i] + P.sparkHeat[id] * 0.5);
        if (f & S.LIQUID_CONDUCTOR) {
          // elettrolisi: 2 H₂O → 2 H₂ + O₂ ; 2 NaCl (fuso) → 2 Na + Cl₂
          if (id === WATER && this.rand() < 0.004) {
            this.transmute(i, this.rand() < 2 / 3 ? H_Z : O_Z, temp[i]);
            this.event('electrolysis:water');
          } else if (id === SALT && this.rand() < 0.004) {
            const c = this.ctype[i];
            this.event(`electrolysis:salt:${c >> 7}:${c & 127}`);
            this.transmute(i, this.rand() < 0.5 ? c >> 7 : c & 127, temp[i]);
          }
        } else if (f & (S.CONDUCTOR | S.SEMI)) {
          // la scintilla accende ciò che è infiammabile lì accanto
          for (let k = 0; k < 8; k++) {
            const nx = x + DX[k];
            const ny = y + DY[k];
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const j = ny * W + nx;
            const nid = type[j];
            if (nid && P.flags[nid] & S.FLAMMABLE && !(this.flags[j] & C_BURN) && this.rand() < 0.5) temp[j] = Math.max(temp[j], P.ignite[nid] + 1);
          }
        } else if (f & S.FLAMMABLE) {
          // scarica in un gas infiammabile (idrogeno): se c'è ossigeno, si accende
          temp[i] = Math.max(temp[i], P.ignite[id] + 1);
        }
      }
    }
  }

  // ---------------------------------------------------------------- esplosioni
  explode(cx, cy, radius, power, heat) {
    const { W, H, type, temp, P } = this;
    const R = Math.ceil(radius);
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > radius * radius) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = y * W + x;
        const dist = Math.sqrt(d2);
        const f = 1 - dist / radius;
        const id = type[i];
        if (!id) {
          if (heat > 0 && f > 0.5 && this.rand() < 0.5) this.setType(i, FIRE, 1300 + heat * f);
          continue;
        }
        if (P.flags[id] & S.WALL) continue;
        if (heat) temp[i] = clampT(temp[i] + heat * f);
        if (P.flags[id] & S.EXPLOSIVE) temp[i] = Math.max(temp[i], P.bp[id] + 1); // l'onda d'urto fa detonare gli esplosivi
        if (this.cellPhase(i) === SOLID && !(this.flags[i] & C_POWDER)) {
          if (P.flags[id] & S.BLOCK_ONLY || P.hardness[id] >= power * f * 1.2) continue;
          this.flags[i] |= C_POWDER; // il blocco va in frantumi
        }
        const s = power * 7 * f * (0.6 + 0.8 * this.rand());
        const ux = dist ? dx / dist : this.rand() - 0.5;
        const uy = dist ? dy / dist : -1;
        this.vx[i] += ux * s;
        this.vy[i] += uy * s - power * 1.5 * f;
      }
    }
  }

  // ---------------------------------------------------------------- strumenti (pennello)
  /** Celle del pennello circolare di raggio r. */
  brush(cx, cy, r, fn) {
    const { W, H } = this;
    const r2 = r * r + r * 0.8;
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= H) continue;
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= W || dx * dx + dy * dy > r2) continue;
        fn(y * W + x, x, y);
      }
    }
  }

  /**
   * Dipinge una sostanza nelle celle vuote del pennello (o su tutte con `replace`).
   * @param {{temp?:number, powder?:boolean, ctype?:number, replace?:boolean}} opts
   */
  paint(cx, cy, r, id, { temp = AMBIENT, powder, ctype = 0, replace = false, dissolved = false } = {}) {
    const P = this.P;
    this.brush(cx, cy, r, (i) => {
      if (this.type[i] && !replace) return;
      this.setType(i, id, temp, ctype);
      if (id === FIRE) return;
      if (dissolved && P.flags[id] & S.SOLUBLE) {
        this.flags[i] = (this.flags[i] & ~(C_POWDER | PHASE_MASK)) | C_DISSOLVED | ((this.temp[i] < FREEZE_AQ ? SOLID : LIQUID) << 2);
        return;
      }
      if (this.phaseOf(id, this.temp[i]) === SOLID && powder !== undefined && !(P.flags[id] & S.BLOCK_ONLY)) {
        if (powder) this.flags[i] |= C_POWDER;
        else this.flags[i] &= ~C_POWDER;
      }
    });
  }

  erase(cx, cy, r) {
    this.brush(cx, cy, r, (i) => this.type[i] && this.clearCell(i));
    const r2 = (r + 0.5) * (r + 0.5);
    this.particles = this.particles.filter((p) => (p.x - cx - 0.5) ** 2 + (p.y - cy - 0.5) ** 2 > r2);
  }

  /** Scalda (dT > 0) o raffredda (dT < 0) le celle del pennello. */
  heat(cx, cy, r, dT) {
    const P = this.P;
    this.brush(cx, cy, r, (i) => {
      const id = this.type[i];
      if (id && !(P.flags[id] & S.WALL)) this.temp[i] = clampT(this.temp[i] + dT);
    });
  }

  /** Fiammifero: fuoco nelle celle vuote, porta all'accensione ciò che può bruciare. */
  ignite(cx, cy, r) {
    const P = this.P;
    this.brush(cx, cy, r, (i) => {
      const id = this.type[i];
      if (!id) {
        if (this.rand() < 0.25) this.setType(i, FIRE, 1150);
      } else if (P.flags[id] & S.FLAMMABLE) this.temp[i] = Math.max(this.temp[i], P.ignite[id] + 1);
      else if (!(P.flags[id] & S.WALL)) this.temp[i] = clampT(this.temp[i] + 15);
    });
  }

  /** Scintilla elettrica sui conduttori del pennello (e accensione di ciò che è infiammabile). */
  sparkAt(cx, cy, r) {
    const P = this.P;
    this.brush(cx, cy, r, (i) => {
      const id = this.type[i];
      if (!id) return;
      if (!this.spark[i] && this.conductive(i)) this.spark[i] = SPARK_START;
      else if (P.flags[id] & S.FLAMMABLE) this.temp[i] = Math.max(this.temp[i], P.ignite[id] + 1);
    });
  }

  /** Sorgente di neutroni veloci. */
  emitNeutrons(cx, cy, r, count) {
    for (let k = 0; k < count; k++) {
      const a = this.rand() * Math.PI * 2;
      const d = this.rand() * r;
      this.emit(cx + 0.5 + Math.cos(a) * d, cy + 0.5 + Math.sin(a) * d, NEUTRON, this.rand() * Math.PI * 2, 3, 200);
    }
  }

  /** Accende subito una cella infiammabile (usato dagli esempi). */
  setBurning(i) {
    const id = this.type[i];
    const P = this.P;
    if (!(P.flags[id] & S.FLAMMABLE) || P.flags[id] & S.INSTANT_BURN) return;
    this.temp[i] = Math.max(this.temp[i], P.ignite[id], Math.min(P.flame[id] * 0.8, P.bp[id] - 5));
    this.flags[i] |= C_BURN;
    this.life[i] = P.fuelMin[id] + ((this.rand() * (P.fuelMax[id] - P.fuelMin[id] + 1)) | 0);
  }

  // ---------------------------------------------------------------- lettura
  cell(x, y) {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return null;
    const i = y * this.W + x;
    const id = this.type[i];
    return {
      id,
      temp: this.temp[i],
      ctype: this.ctype[i],
      phase: this.cellPhase(i),
      powder: Boolean(this.flags[i] & C_POWDER),
      dissolved: Boolean(this.flags[i] & C_DISSOLVED),
      burning: Boolean(this.flags[i] & C_BURN),
      spark: this.spark[i] >= SPARK_ACTIVE,
    };
  }

  /** Conteggio delle celle per sostanza (per i test e le statistiche). */
  census() {
    const counts = new Map();
    for (let i = 0; i < this.N; i++) {
      const id = this.type[i];
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }
}
