// Motore chimico dei contenitori del simulatore di laboratorio. Ogni contenitore ha una miscela: moli di ogni sostanza
// (le stesse della sandbox: elementi, acqua e le 558 sostanze della libreria), quanto ne è sciolto in acqua, la
// temperatura. Da qui: volume, massa, pH, colore, scioglimento e cristallizzazione (anche come idrati), ebollizione ed
// evaporazione, gas che si liberano, reazioni del catalogo con le loro condizioni e il loro calore.
// Modulo puro (niente DOM, niente Three.js): lo usano il gioco e i test.
import { createSubstances, AMBIENT, GAS, LIQUID, SOLID, S, WATER, phaseAt } from '../sandbox/substances.js';
import { buildChemistry, parseConditions, PAIR_K } from '../sandbox/chemistry.js';
import { speciesInfo, reactionEnthalpy } from '../lab/chem/reactions.js';
import { pick } from '../i18n/index.js';
import { SOLUBILITY, HYDRATES, ACID_BASE, TOXIC_GASES, HEAVY_METALS, SINK_SAFE, INERT_SOLIDS, INDICATORS } from './reagents.js';

/** Il tempo termico (riscaldamento, raffreddamento, evaporazione) scorre 4 volte più veloce del reale. */
export const HEAT_SPEED = 4;
/** Il tempo dell'elettrolisi scorre 20 volte più veloce del reale: con 1 A si vedono le bolle in pochi secondi. */
export const ELECTRO_SPEED = 20;
const FARADAY = 96485; // C/mol
export { AMBIENT };
const KW = 1e-14;
const WATER_MOLAR = 18.015;
const CP_WATER = 75.3; // J/(mol·K)
const CP_LIQUID = 2.3; // J/(g·K)
const CP_SOLID = 0.8; // J/(g·K)
const L_WATER = 40650; // J/mol all'ebollizione
const TROUTON = 88; // J/(mol·K): calore di vaporizzazione ≈ 88 · Teb (regola di Trouton)
const DEFAULT_SOLUBILITY = 50; // g/100 g per i sali solubili senza dati
const TINY = 1e-10;
const MOLAR_FALLBACK = { water: WATER_MOLAR, co2: 44.009, so2: 64.066, smoke: 12, ash: 60, oxide: 60 };
const DIATOMIC = new Set(['H', 'N', 'O', 'F', 'Cl', 'Br', 'I']);
// colore in acqua degli ioni dei metalli di transizione (come nella sandbox) e soglia di concentrazione (mol/L)
const ION_COLOR = [
  [29, [40, 125, 235], 0.05], // Cu²⁺ azzurro
  [28, [70, 175, 95], 0.08], // Ni²⁺ verde
  [27, [220, 95, 150], 0.08], // Co²⁺ rosa
  [24, [70, 130, 80], 0.05], // Cr³⁺ verde scuro
  [26, [200, 150, 45], 0.04], // Fe³⁺ giallo-bruno
];
const WATER_RGB = [214, 232, 246];
const PINK = [232, 46, 170];

/**
 * Prepara le sostanze, le reazioni e i dati del gioco (una volta sola).
 * @param {object[]} elements elementi di elements.json (localizzati o no)
 */
export function createLabChemistry(elements) {
  const subs = createSubstances(elements);
  const chem = buildChemistry(subs);
  const { list, P, libraryId, byKey, lab, library } = subs;
  const id = (key) => {
    if (typeof key === 'number') return key;
    if (key === 'water' || key === 'h2o') return WATER;
    if (key.startsWith('el:')) return byKey.get(key.slice(3))?.id ?? 0;
    return libraryId.get(key) ?? byKey.get(key)?.id ?? 0;
  };
  const sub = (sid) => list[sid];
  const molar = (sid) => {
    const s = list[sid];
    if (!s) return 1;
    if (s.molar) return s.molar;
    if (s.kind === 'element') return (s.atomicMass ?? elements[s.id - 1]?.atomicMass?.value ?? 1) * (DIATOMIC.has(s.symbol) ? 2 : 1);
    return MOLAR_FALLBACK[s.key] ?? 50;
  };
  const molarCache = new Float64Array(list.length);
  for (let i = 0; i < list.length; i++) molarCache[i] = molar(i);

  const solTable = new Map();
  for (const [k, pts] of Object.entries(SOLUBILITY)) if (id(k)) solTable.set(id(k), pts);
  const hydrate = new Map(); // anidro → { sid, w }
  const hydrateOf = new Map(); // idrato → { sid, w }
  for (const [anh, [hyd, w]] of Object.entries(HYDRATES)) {
    if (!id(anh) || !id(hyd)) continue;
    hydrate.set(id(anh), { sid: id(hyd), w });
    hydrateOf.set(id(hyd), { sid: id(anh), w });
  }
  const acidBase = new Map();
  for (const [k, v] of Object.entries(ACID_BASE)) if (id(k)) acidBase.set(id(k), v);
  const toxic = new Set(TOXIC_GASES.map(id).filter(Boolean));
  const sinkSafe = new Set([...SINK_SAFE].map(id).filter(Boolean));
  const inert = new Set([...INERT_SOLIDS].map(id).filter(Boolean));
  const O2 = id('O');
  const counts = (sid) => {
    const s = list[sid];
    if (!s) return {};
    if (s.kind === 'element') return { [s.id]: 1 };
    return s.counts ?? s.entry?.graph?.atoms?.reduce((c, a) => ((c[a.z] = (c[a.z] ?? 0) + 1), c), {}) ?? {};
  };
  // elettroliti: i composti ionici, gli acidi e le basi (in acqua si dividono in ioni e conducono la corrente)
  const electrolyte = new Float32Array(list.length);
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (!s || i === WATER) continue;
    const ab = acidBase.get(i);
    if (s.entry?.ionic || ab?.sa || ab?.sb || s.group === 'ioni') electrolyte[i] = 1;
    else if (ab) electrolyte[i] = 0.1; // acidi e basi deboli: pochi ioni
  }
  const heavy = new Uint8Array(list.length);
  for (let i = 0; i < list.length; i++) if (Object.keys(counts(i)).some((z) => HEAVY_METALS.has(Number(z)))) heavy[i] = 1;

  /** Solubilità (g di sostanza anidra in 100 g d'acqua) alla temperatura T (K). Infinity: si mescola in ogni rapporto. */
  const solubility = (sid, T) => {
    if (typeof sid === 'string') return Infinity; // indicatori
    if (hydrateOf.has(sid)) return solubility(hydrateOf.get(sid).sid, T);
    const pts = solTable.get(sid);
    if (pts) {
      const c = T - 273.15;
      if (c <= pts[0][0]) return pts[0][1];
      for (let k = 1; k < pts.length; k++) {
        if (c <= pts[k][0]) {
          const [c0, s0] = pts[k - 1];
          const [c1, s1] = pts[k];
          return s0 + ((s1 - s0) * (c - c0)) / (c1 - c0);
        }
      }
      return pts[pts.length - 1][1];
    }
    const f = P.flags[sid];
    if (f & (S.AQUEOUS | S.MISCIBLE)) return Infinity;
    if (f & S.SOLUBLE) return DEFAULT_SOLUBILITY;
    return 0;
  };

  // ------------------------------------------------------------ reazioni
  // quelle del motore della sandbox più quelle che la sandbox simula «a mano» (metallo + acqua, metallo + alogeno,
  // combustione): qui servono con i loro coefficienti. Restano fuori le dissociazioni (i sali restano interi in
  // soluzione) e gli idrati (scioglimento e cristallizzazione li gestiscono da soli); quelle che chiedono corrente,
  // raggi UV o vapore, gli equilibri e le reazioni degli organismi viventi vanno in `offline`, per spiegare al
  // giocatore perché non avvengono.
  const byFormula = new Map();
  for (const s of list) if (s?.kind === 'compound' && s.formula) byFormula.set(s.formula, s.id);
  for (const el of elements) byFormula.set(el.symbol, el.z);
  const infoCache = new Map();
  const info = (key) => {
    if (!infoCache.has(key)) infoCache.set(key, speciesInfo(lab, library, elements, key));
    return infoCache.get(key);
  };
  const enthalpy = (r) => {
    try {
      const e = reactionEnthalpy(lab, r.reactants.map(([, k]) => info(k)), r.products.map(([, k]) => info(k)), r.reactants.map(([c]) => c), r.products.map(([c]) => c));
      return e.formation.value ?? e.bonds?.value ?? null;
    } catch {
      return null;
    }
  };
  const rxs = [];
  const offline = [];
  for (const entry of chem.list) {
    const r = entry.r;
    const reactants = r.reactants.map(([c, key]) => ({ c, sid: id(key) }));
    const products = r.products.map(([c, key]) => ({ c, sid: id(key) }));
    if ([...reactants, ...products].some((x) => !x.sid)) continue;
    if ([...reactants, ...products].some((x) => hydrateOf.has(x.sid))) continue;
    const off = (why) => offline.push({ id: r.id, r, reactants, products, why, group: r.group });
    const sandboxRule = String(entry.disabled ?? '');
    if (entry.disabled && !sandboxRule.startsWith('regola')) {
      if (/equilibrio/.test(sandboxRule)) off('equilibrium');
      else if (/organismo/.test(sandboxRule)) off('living');
      else if (/catalizzatore/.test(sandboxRule)) off('catalyst');
      continue;
    }
    if (entry.disabled === 'regola: ruggine') continue;
    const cond = entry.cond ?? parseConditions(r, { byFormula, keyId: id });
    if (cond.disabled) {
      off(/equilibrio/.test(cond.disabled) ? 'equilibrium' : /organismo/.test(cond.disabled) ? 'living' : 'catalyst');
      continue;
    }
    // le elettrolisi si fanno con l'alimentatore (electro); scariche, raggi UV e vapore restano fuori
    if (cond.discharge || cond.steam) {
      off(cond.discharge ? 'discharge' : 'steam');
      continue;
    }
    const dH = entry.disabled ? enthalpy(r) : entry.dH;
    const waterOut = products.filter((p) => p.sid === WATER).reduce((t, p) => t + p.c, 0);
    rxs.push({
      id: r.id,
      r,
      reactants,
      products,
      cond,
      dH,
      group: r.group,
      combustion: r.group === 'combustioni' || entry.disabled === 'regola: combustione',
      // neutralizzazione con una base forte: in acqua libera 55,8 kJ per mole d'acqua (H⁺ + OH⁻ → H₂O); con i
      // carbonati e i bicarbonati vale il ΔH° della reazione (aceto e bicarbonato raffreddano un po')
      neutral: (r.group === 'acidi-basi' || r.id === 'neutralizzazione') && waterOut > 0 && reactants.some((x) => acidBase.get(x.sid)?.sb) ? waterOut : 0,
      air: reactants.findIndex((x) => x.sid === O2),
      slow: cond.rate < 0.01,
      electro: Boolean(cond.spark),
      electrons: electrons(products),
    });
  }
  const pairIdx = new Map();
  const singleIdx = new Map();
  // elettroni scambiati in un'elettrolisi come è scritta: 2 per ogni H₂ al catodo, altrimenti 2 per ogni alogeno e
  // 4 per ogni O₂ all'anodo (2 H₂O → 2 H₂ + O₂: 4; 2 NaCl + 2 H₂O → 2 NaOH + H₂ + Cl₂: 2)
  function electrons(products) {
    const c = (sid) => products.filter((p) => p.sid === sid).reduce((t, p) => t + p.c, 0);
    if (c(id('H'))) return 2 * c(id('H'));
    const x = ['F', 'Cl', 'Br', 'I'].reduce((t, k) => t + c(id(k)), 0);
    if (x) return 2 * x;
    return c(O2) ? 4 * c(O2) : 2;
  }
  const airIdx = new Map();
  const comb = new Map(); // combustibile → combustione completa
  const add = (map, k, rx) => {
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(rx);
  };
  const offPair = new Map();
  const offSingle = new Map();
  for (const rx of offline) {
    const ids = [...new Set(rx.reactants.map((x) => x.sid))];
    if (ids.length === 1) add(offSingle, ids[0], rx);
    for (const a of ids) for (const b of ids) if (a !== b) add(offPair, a * PAIR_K + b, rx);
  }
  for (const rx of rxs) {
    const ids = [...new Set(rx.reactants.map((x) => x.sid))];
    if (rx.combustion) {
      const fuel = ids.find((s) => s !== O2);
      if (ids.length === 2 && rx.air >= 0 && P.flags[fuel] & S.FLAMMABLE && !rx.cond.lowO2 && !comb.has(fuel)) comb.set(fuel, rx);
      continue; // la combustione è il fuoco, non una reazione nel contenitore
    }
    if (ids.length === 1) add(singleIdx, ids[0], rx);
    for (const a of ids) for (const b of ids) if (a !== b) add(pairIdx, a * PAIR_K + b, rx);
    if (rx.air >= 0 && ids.length === 2) add(airIdx, ids.find((s) => s !== O2), rx);
  }

  const name = (sid) => (typeof sid === 'string' ? pick(INDICATORS[sid]?.name ?? { it: sid }) : list[sid]?.name ?? '?');
  // gli elementi biatomici sono le loro molecole (H₂, O₂, Cl₂…), come nella sandbox
  const formula = (sid) => {
    if (typeof sid === 'string') return INDICATORS[sid]?.formula ?? '';
    if (sid === WATER) return 'H₂O';
    const s = list[sid];
    if (s?.kind === 'element') return DIATOMIC.has(s.symbol) ? `${s.symbol}₂` : s.symbol;
    return s?.formula || s?.symbol || '';
  };

  return {
    subs, chem, list, P, id, sub, molar: (sid) => (typeof sid === 'string' ? INDICATORS[sid]?.molar ?? 300 : molarCache[sid]),
    solubility, hydrate, hydrateOf, acidBase, toxic, sinkSafe, inert, heavy, counts, rxs, pairIdx, singleIdx, airIdx, comb, O2,
    offline, offPair, offSingle, rxById: new Map([...rxs, ...offline].map((rx) => [rx.id, rx])), electrolyte,
    name, formula,
  };
}

// ------------------------------------------------------------------ miscela

/**
 * Colore di una sostanza sciolta in acqua: quello dello ione dei metalli di transizione (Cu²⁺ azzurro, Ni²⁺ verde…) o,
 * per gli anioni colorati (permanganato viola, bicromato arancio), quello del solido. k: concentrazione (mol/L) alla
 * quale il colore è ben visibile. null se la soluzione è incolore.
 * @returns {{rgb: number[], k: number} | null}
 */
export function solutionTint(ctx, sid) {
  if (typeof sid !== 'number' || sid === WATER) return null;
  const s = ctx.sub(sid);
  if (!s) return null;
  const counts = ctx.counts(sid);
  const ion = !/cromato|permanganato|chromate|permanganate/i.test(s.name) && ION_COLOR.find(([z]) => counts[z]);
  if (ion) return { rgb: ion[1], k: ion[2] };
  // gli anioni colorati sono scuri o saturi (permanganato, bicromato); quelli quasi bianchi o appena giallini
  // (l'acido nitrico puro) in soluzione diluita sono incolori
  const col = s.colors?.[SOLID];
  if (col && (Math.max(...col.slice(0, 3)) - Math.min(...col.slice(0, 3)) > 45 || col[0] + col[1] + col[2] < 600)) return { rgb: col.slice(0, 3), k: 0.004 };
  return null;
}

/** Liquido che si mescola con l'acqua (etanolo, acido acetico…): sciolto o no, resta un liquido che può bollire. */
const isMiscibleLiquid = (ctx, sid) => typeof sid === 'number' && sid !== WATER && (ctx.P.flags[sid] & (S.MISCIBLE | S.AQUEOUS)) === S.MISCIBLE && ctx.sub(sid).mp < AMBIENT;

/** Calcola il pH dal bilancio delle cariche: acidi e basi forti e deboli (Ka, Kb), per bisezione su log[H⁺]. */
export function solvePH({ sa = 0, sb = 0, weakA = [], weakB = [] }) {
  const f = (h) => {
    let pos = h + sb;
    let neg = KW / h + sa;
    for (const [c, ka] of weakA) neg += (c * ka) / (h + ka);
    for (const [c, kb] of weakB) {
      const kaConj = KW / kb;
      pos += (c * h) / (h + kaConj);
    }
    return pos - neg;
  };
  let lo = -16;
  let hi = 2;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (f(10 ** mid) > 0) hi = mid;
    else lo = mid;
  }
  return -(lo + hi) / 2;
}

export class Mixture {
  /** @param {ReturnType<typeof createLabChemistry>} ctx */
  constructor(ctx) {
    this.ctx = ctx;
    this.n = new Map(); // sostanza → moli totali
    this.d = new Map(); // sostanza → moli sciolte in acqua
    this.T = AMBIENT;
    this.susp = 0; // frazione del solido sospesa nel liquido (precipitato appena formato)
    this.mix = 0; // agitazione (0–1): si alza versando e mescolando, poi cala
    this.crystals = 0; // moli cristallizzate dalla soluzione (per l'aspetto)
  }

  static of(ctx, entries = [], T = AMBIENT) {
    const m = new Mixture(ctx);
    m.T = T;
    for (const [key, mol, dissolved] of entries) m.addSpecies(ctx.id(key) || key, mol, dissolved);
    return m;
  }

  /** Soluzione di un soluto in acqua (molarità, volume in mL), già sciolta. */
  static solution(ctx, solute, molar, volumeMl, T = AMBIENT) {
    const sid = ctx.id(solute);
    const mol = (molar * volumeMl) / 1000;
    const soluteVol = (mol * ctx.molar(sid)) / (ctx.sub(sid)?.densS || 2);
    const waterG = Math.max(0, volumeMl - (ctx.P.flags[sid] & S.MISCIBLE ? (mol * ctx.molar(sid)) / ctx.sub(sid).densL : soluteVol)) * 0.998;
    return Mixture.of(ctx, [['water', waterG / WATER_MOLAR], [sid, mol, true]], T);
  }

  /** Solido puro (grammi). */
  static solid(ctx, key, grams) {
    const sid = ctx.id(key);
    return Mixture.of(ctx, [[sid, grams / ctx.molar(sid)]]);
  }

  /** Liquido puro (mL). */
  static liquid(ctx, key, ml) {
    const sid = ctx.id(key);
    const dens = sid === WATER ? 0.998 : ctx.sub(sid).densL;
    return Mixture.of(ctx, [[sid, (ml * dens) / ctx.molar(sid)]]);
  }

  clone() {
    const m = new Mixture(this.ctx);
    m.n = new Map(this.n);
    m.d = new Map(this.d);
    m.T = this.T;
    m.susp = this.susp;
    m.mix = this.mix;
    m.crystals = this.crystals;
    return m;
  }

  addSpecies(sid, mol, dissolved = false) {
    if (!(mol > 0)) return;
    this.n.set(sid, (this.n.get(sid) ?? 0) + mol);
    if (dissolved || typeof sid === 'string') this.d.set(sid, (this.d.get(sid) ?? 0) + mol);
  }

  amount(key) {
    return this.n.get(this.ctx.id(key) || key) ?? 0;
  }

  dissolved(key) {
    return this.d.get(this.ctx.id(key) || key) ?? 0;
  }

  /** Grammi di una sostanza. */
  grams(key) {
    const sid = this.ctx.id(key) || key;
    return this.amount(sid) * this.ctx.molar(sid);
  }

  isEmpty() {
    for (const v of this.n.values()) if (v > TINY) return false;
    return true;
  }

  clear() {
    this.n.clear();
    this.d.clear();
    this.susp = 0;
    this.crystals = 0;
  }

  /** Fase di una sostanza non sciolta alla temperatura attuale. */
  phaseOf(sid) {
    if (typeof sid === 'string') return LIQUID;
    if (sid === WATER) return this.T < 273.15 ? SOLID : LIQUID; // il vapore esce subito dal contenitore (heat)
    const s = this.ctx.sub(sid);
    // chi si decompone non bolle: oltre quella temperatura resta solido (o liquido) e si trasforma con le reazioni
    if (s.flags & S.DECOMPOSES && this.T >= s.bp) return s.mp < s.bp ? LIQUID : SOLID;
    return phaseAt(s, this.T);
  }

  /** Grammi d'acqua liquida (il solvente). */
  get water() {
    return this.T < 373.15 + 0.5 ? (this.n.get(WATER) ?? 0) * WATER_MOLAR : 0;
  }

  /** Volume della fase liquida (mL): liquidi più soluti sciolti. */
  get liquidVolume() {
    const { ctx } = this;
    let v = 0;
    for (const [sid, mol] of this.n) {
      if (mol <= TINY || typeof sid === 'string') continue;
      const d = this.d.get(sid) ?? 0;
      if (sid === WATER) {
        if (this.phaseOf(sid) === LIQUID) v += (mol * WATER_MOLAR) / 0.998;
        continue;
      }
      const s = ctx.sub(sid);
      if (d > TINY) v += (d * ctx.molar(sid)) / ((isMiscibleLiquid(ctx, sid) ? s.densL : s.densS) || 1.5);
      if (mol - d > TINY && this.phaseOf(sid) === LIQUID) v += ((mol - d) * ctx.molar(sid)) / (s.densL || 1);
    }
    return v;
  }

  /** Volume apparente del solido non sciolto (mL), polvere o cristalli. */
  get solidVolume() {
    const { ctx } = this;
    let v = 0;
    for (const [sid, mol] of this.n) {
      if (typeof sid === 'string' || sid === WATER) continue;
      const free = mol - (this.d.get(sid) ?? 0);
      if (free > TINY && this.phaseOf(sid) === SOLID) v += ((free * ctx.molar(sid)) / (ctx.sub(sid).densS || 2)) * 1.6;
    }
    if (this.n.get(WATER) > TINY && this.phaseOf(WATER) === SOLID) v += ((this.n.get(WATER) * WATER_MOLAR) / 0.917) * 1.1;
    return v;
  }

  /** Massa totale (g). */
  get mass() {
    let m = 0;
    for (const [sid, mol] of this.n) m += mol * this.ctx.molar(sid);
    return m;
  }

  /** Capacità termica del contenuto (J/K). */
  get heatCapacity() {
    let c = 0;
    for (const [sid, mol] of this.n) {
      if (mol <= TINY) continue;
      if (sid === WATER) c += mol * CP_WATER;
      else c += mol * this.ctx.molar(sid) * (this.phaseOf(sid) === SOLID && !(this.d.get(sid) > 0) ? CP_SOLID : CP_LIQUID);
    }
    return c;
  }

  /** Molarità di una sostanza sciolta (mol/L). */
  molarity(key) {
    const v = this.liquidVolume;
    return v > 0.01 ? (this.dissolved(key) / v) * 1000 : 0;
  }

  /** pH della fase acquosa, o null se non c'è acqua liquida. */
  pH() {
    const v = this.liquidVolume / 1000;
    if (this.water < 0.05 || v <= 0) return null;
    const acc = { sa: 0, sb: 0, weakA: [], weakB: [] };
    for (const [sid, mol] of this.n) {
      const ab = this.ctx.acidBase.get(sid);
      if (!ab) continue;
      const c = (this.d.get(sid) ?? 0) / v;
      if (c <= 0) continue;
      if (ab.sa) acc.sa += ab.sa * c;
      if (ab.sb) acc.sb += ab.sb * c;
      for (const ka of ab.ka ?? []) acc.weakA.push([c, ka]);
      for (const kb of ab.kb ?? []) acc.weakB.push([c, kb]);
    }
    return solvePH(acc);
  }

  /** Aggiunge un'altra miscela (travaso): temperatura media pesata sulle capacità termiche. */
  add(other) {
    if (!other || other.isEmpty()) return;
    const c1 = this.heatCapacity;
    const c2 = other.heatCapacity;
    if (c1 + c2 > 0) this.T = (this.T * c1 + other.T * c2) / (c1 + c2);
    const solidBefore = this.solidVolume;
    for (const [sid, mol] of other.n) this.n.set(sid, (this.n.get(sid) ?? 0) + mol);
    for (const [sid, mol] of other.d) this.d.set(sid, (this.d.get(sid) ?? 0) + mol);
    const solidAfter = this.solidVolume;
    if (solidAfter > 0) this.susp = (this.susp * solidBefore + other.susp * (solidAfter - solidBefore)) / solidAfter;
    this.crystals += other.crystals;
    this.mix = 1;
  }

  /**
   * Toglie una frazione della fase che esce versando: il liquido (con i soluti e il solido sospeso) oppure, se il
   * liquido è finito, la polvere. solidOnly: come se il liquido fosse finito; keepLiquid: solo il solido (la spatola
   * prende il sodio e lascia l'olio).
   */
  takeFraction(f, { solidOnly = false, keepLiquid = false } = {}) {
    f = Math.max(0, Math.min(1, f));
    const out = new Mixture(this.ctx);
    out.T = this.T;
    const hasLiquid = !solidOnly && this.liquidVolume > 0.05;
    for (const [sid, mol] of [...this.n]) {
      const d = this.d.get(sid) ?? 0;
      const ph = this.phaseOf(sid);
      let take;
      let takeD;
      if (hasLiquid) {
        takeD = d * f;
        const free = mol - d;
        const freeFrac = ph === LIQUID ? f : ph === SOLID ? f * this.susp : 0;
        take = takeD + free * freeFrac;
      } else {
        takeD = 0;
        take = ph === SOLID || (ph === LIQUID && !keepLiquid) ? (mol - d) * f : 0;
      }
      if (take <= 0) continue;
      this.n.set(sid, mol - take);
      if (takeD > 0) this.d.set(sid, d - takeD);
      out.n.set(sid, take);
      if (takeD > 0) out.d.set(sid, takeD);
    }
    out.susp = hasLiquid ? 1 : 0;
    this.prune();
    return out;
  }

  /**
   * Toglie un volume (mL) della sola fase liquida, con quello che vi è sciolto: il filtrato che passa dalla carta da
   * filtro. Il solido (precipitato, cristalli, polvere) resta.
   */
  takeLiquid(volumeMl) {
    const lv = this.liquidVolume;
    const out = new Mixture(this.ctx);
    out.T = this.T;
    if (lv <= 0.01) return out;
    const f = Math.max(0, Math.min(1, volumeMl / lv));
    for (const [sid, mol] of [...this.n]) {
      const d = this.d.get(sid) ?? 0;
      const liquidFree = sid === WATER || (typeof sid === 'number' && this.phaseOf(sid) === LIQUID) ? mol - d : 0;
      const takeD = d * f;
      const take = takeD + liquidFree * f;
      if (take <= 0) continue;
      this.n.set(sid, mol - take);
      if (takeD > 0) this.d.set(sid, d - takeD);
      out.n.set(sid, take);
      if (takeD > 0) out.d.set(sid, takeD);
    }
    this.prune();
    return out;
  }

  /** Toglie un volume (mL) di ciò che esce versando. */
  take(volumeMl) {
    const lv = this.liquidVolume;
    if (lv > 0.05) return this.takeFraction(volumeMl / lv);
    const sv = this.solidVolume;
    return sv > 0 ? this.takeFraction(volumeMl / sv) : new Mixture(this.ctx);
  }

  prune() {
    for (const [sid, mol] of [...this.n]) {
      if (mol <= TINY) {
        this.n.delete(sid);
        this.d.delete(sid);
      } else if ((this.d.get(sid) ?? 0) > mol) this.d.set(sid, mol);
    }
  }

  /** Scalda o raffredda di Q joule (con l'ebollizione dei liquidi: il calore in eccesso li fa evaporare). */
  heat(Q, extraC = 0, gases = null) {
    let C = this.heatCapacity + extraC;
    if (C <= 0) return;
    let T = this.T + Q / C;
    // ebollizione: i liquidi con il punto di ebollizione più basso evaporano per primi
    for (let guard = 0; guard < 6; guard++) {
      let low = null;
      let lowBp = Infinity;
      for (const [sid, mol] of this.n) {
        if (mol <= TINY || typeof sid === 'string' || (sid !== WATER && this.ctx.P.flags[sid] & S.DECOMPOSES)) continue;
        const bp = sid === WATER ? 373.15 : this.ctx.sub(sid).bp;
        const free = sid === WATER || isMiscibleLiquid(this.ctx, sid) ? mol : mol - (this.d.get(sid) ?? 0);
        if (free <= TINY) continue;
        // bolle solo ciò che è liquido adesso (anche fermo al punto di ebollizione): un gas aggiunto (cloro, ammoniaca
        // da una bombola) non è un liquido surriscaldato, si scioglie o esce senza assorbire calore
        const liquidNow = sid === WATER ? true : this.T <= bp + 0.5 && phaseAt(this.ctx.sub(sid), Math.min(this.T, bp - 0.01)) === LIQUID;
        if (liquidNow && bp < T && bp < lowBp) {
          low = sid;
          lowBp = bp;
        }
      }
      if (low === null) break;
      const L = low === WATER ? L_WATER : TROUTON * lowBp;
      const free = low === WATER || isMiscibleLiquid(this.ctx, low) ? this.n.get(low) : this.n.get(low) - (this.d.get(low) ?? 0);
      const energy = (T - lowBp) * C;
      const mol = Math.min(free, energy / L);
      this.n.set(low, this.n.get(low) - mol);
      if (low !== WATER && this.d.has(low)) this.d.set(low, Math.min(this.d.get(low), this.n.get(low)));
      gases?.push([low, mol]);
      T = lowBp + (energy - mol * L) / C;
      C = this.heatCapacity + extraC;
      if (mol < free) break;
    }
    this.T = Math.max(1, T);
    this.prune();
  }

  /**
   * Un passo della miscela.
   * @param {number} dt secondi di gioco
   * @param {{heatW?: number, lossWK?: number, Tenv?: number, containerC?: number, area?: number, stir?: number,
   *          open?: boolean, flame?: boolean, light?: boolean, volts?: number}} env potenza ricevuta (W), dispersione
   *          (W/K), temperatura dell'ambiente, capacità termica del contenitore (J/K), superficie libera (cm²),
   *          agitazione (0–1), aperto, nella fiamma, sotto la lampada, tensione degli elettrodi (V)
   * @returns {{gases: [number, number][], reactions: Set<string>, extent: Map<string, number>, heatK: number, ignite: number,
   *            explode: number, precipitated: boolean}} extent: moli di reazione avvenute in questo passo
   */
  tick(dt, env = {}) {
    const { ctx } = this;
    const ev = { gases: [], reactions: new Set(), extent: new Map(), heatK: 0, ignite: 0, explode: 0, precipitated: false, crystallized: false, current: 0 };
    if (this.isEmpty()) return ev;
    const { heatW = 0, lossWK = 0.5, Tenv = AMBIENT, containerC = 0, area = 20, stir = 0, open = true, flame = false, light = false, volts = 0 } = env;
    const dtT = dt * HEAT_SPEED;
    // il calore delle reazioni scalda (o raffredda) anche il recipiente, come quello che arriva da fuori
    this.vesselC = containerC;
    this.mix = Math.max(stir, this.mix * Math.exp(-dt / 2));

    // calore dall'esterno e dispersione verso l'ambiente
    this.heat((heatW - lossWK * (this.T - Tenv)) * dtT, containerC, ev.gases);
    // evaporazione lenta dell'acqua sotto l'ebollizione (accelerata come il resto del tempo termico)
    const w = this.n.get(WATER) ?? 0;
    if (open && w > TINY && this.T < 373.15 && this.T > 273.15) {
      const g = area * 0.0016 * 10 ** ((this.T - 373.15) / 36) * dtT;
      const mol = Math.min(w, g / WATER_MOLAR);
      this.n.set(WATER, w - mol);
      this.heat(-mol * L_WATER * 0.5, containerC); // l'evaporazione raffredda (in parte compensato dall'aria)
    }

    this.dissolve(dt, ev);
    const before = this.T;
    this.react(dt, { open, flame, light }, ev);
    if (volts > 0) this.electrolyze(dt, { open, flame, light, volts }, ev);
    ev.heatK = this.T - before;

    // gas: se non si sciolgono, escono dal contenitore
    for (const [sid, mol] of [...this.n]) {
      if (typeof sid === 'string' || sid === WATER) continue;
      const free = mol - (this.d.get(sid) ?? 0);
      if (free > TINY && this.phaseOf(sid) === GAS) {
        this.n.set(sid, mol - free);
        ev.gases.push([sid, free]);
      }
    }
    // il precipitato si deposita
    this.susp *= Math.exp(-dt / (6 + 20 * this.mix));
    // combustibili: prendono fuoco nella fiamma o sopra la temperatura di accensione
    for (const [sid, mol] of this.n) {
      if (typeof sid === 'string' || mol <= 1e-5 || !(ctx.P.flags[sid] & S.FLAMMABLE) || !open) continue;
      const ph = this.phaseOf(sid);
      const free = mol - (this.d.get(sid) ?? 0);
      if (free <= 1e-5 && !(ph === LIQUID && ctx.P.flags[sid] & S.MISCIBLE && this.fraction(sid) > 0.3)) continue;
      if ((flame && ph !== SOLID) || (ctx.P.ignite[sid] > 0 && this.T >= ctx.P.ignite[sid])) ev.ignite = sid;
    }
    // esplosivi scaldati
    for (const [sid, mol] of this.n) if (typeof sid !== 'string' && mol > 1e-4 && ctx.P.flags[sid] & S.EXPLOSIVE && this.T > 450) ev.explode += mol;
    if (ev.heatK > 140) ev.explode += ev.heatK / 400;
    this.prune();
    return ev;
  }

  /** Frazione in massa di una sostanza nel liquido. */
  fraction(sid) {
    const lv = this.liquidVolume;
    return lv > 0 ? (this.amount(sid) * this.ctx.molar(sid)) / lv : 0;
  }

  /** Scioglimento verso la solubilità (più rapido agitando e a caldo) e cristallizzazione dell'eccesso. */
  dissolve(dt, ev) {
    const { ctx } = this;
    const water = this.water;
    const kDiss = 0.12 * (1 + 4 * this.mix) * (1 + Math.max(0, this.T - 293) / 25);
    const kCryst = 0.1 * (1 + 2 * this.mix);
    for (const sid of [...this.n.keys()]) {
      const mol = this.n.get(sid) ?? 0; // valore aggiornato: un idrato che si scioglie cambia anche il sale anidro
      if (sid === WATER) continue;
      if (typeof sid === 'string') {
        this.d.set(sid, water > 0.05 || this.liquidVolume > 0.05 ? mol : 0);
        continue;
      }
      const d = this.d.get(sid) ?? 0;
      if (water <= 0.01) {
        // senza acqua i soluti tornano solidi (o liquidi puri)
        if (d > 0) {
          this.d.set(sid, 0);
          if (ctx.P.flags[sid] & S.AQUEOUS) continue;
          ev.crystallized = true;
          this.crystals += d;
        }
        continue;
      }
      const hyd = ctx.hydrateOf.get(sid);
      if (hyd) {
        // un idrato si scioglie come sale anidro più la sua acqua
        const anh = hyd.sid;
        const cap = (ctx.solubility(anh, this.T) / 100) * water / ctx.molar(anh);
        const room = cap - (this.d.get(anh) ?? 0);
        if (room > 0) {
          const x = Math.min(mol, room, room * (1 - Math.exp(-kDiss * dt)) + 0.0002 * dt * (1 + 4 * this.mix));
          if (x > 0) {
            this.n.set(sid, mol - x);
            this.n.set(anh, (this.n.get(anh) ?? 0) + x);
            this.d.set(anh, (this.d.get(anh) ?? 0) + x);
            this.n.set(WATER, (this.n.get(WATER) ?? 0) + hyd.w * x);
          }
        }
        continue;
      }
      const sol = ctx.solubility(sid, this.T);
      if (sol === Infinity) {
        this.d.set(sid, mol);
        continue;
      }
      if (sol <= 0) {
        if (d > 0) this.d.set(sid, 0);
        continue;
      }
      const cap = ((sol / 100) * water) / ctx.molar(sid);
      const target = Math.min(mol, cap);
      if (d < target) {
        const phase = this.phaseOf(sid);
        const k = phase === GAS || phase === LIQUID ? 20 : kDiss;
        this.d.set(sid, Math.min(target, d + (target - d) * (1 - Math.exp(-k * dt)) + 0.0002 * dt * (1 + 4 * this.mix)));
      } else if (d > cap * 1.002) {
        const x = (d - cap) * (1 - Math.exp(-kCryst * dt));
        this.d.set(sid, d - x);
        ev.crystallized = true;
        this.crystals += x;
        const hy = ctx.hydrate.get(sid);
        const free = this.n.get(WATER) ?? 0;
        if (hy && this.T < ctx.sub(hy.sid).bp && free > hy.w * x) {
          // cristallizza come idrato (CuSO₄ → CuSO₄·5H₂O azzurro), portando con sé l'acqua
          this.n.set(sid, mol - x);
          this.n.set(hy.sid, (this.n.get(hy.sid) ?? 0) + x);
          this.n.set(WATER, free - hy.w * x);
        }
      }
    }
    // idrati scaldati oltre la temperatura di decomposizione: perdono l'acqua (CuSO₄·5H₂O azzurro → CuSO₄ bianco)
    for (const sid of [...this.n.keys()]) {
      const mol = this.n.get(sid) ?? 0; // valore aggiornato: un idrato che si scioglie cambia anche il sale anidro
      const hyd = typeof sid === 'number' && ctx.hydrateOf.get(sid);
      if (!hyd || this.T < ctx.sub(sid).bp) continue;
      const x = mol * (1 - Math.exp(-0.25 * dt * (1 + (this.T - ctx.sub(sid).bp) / 30)));
      this.n.set(sid, mol - x);
      this.n.set(hyd.sid, (this.n.get(hyd.sid) ?? 0) + x);
      ev.gases.push([WATER, hyd.w * x]);
      this.heat(-hyd.w * x * 57000 * 0.2, this.vesselC ?? 0);
    }
  }

  /** Disponibilità di un reagente per una reazione: sciolto per le reazioni in soluzione, altrimenti tutto. */
  available(sid, rx) {
    const mol = this.n.get(sid) ?? 0;
    if (mol <= TINY) return [0, false];
    if (sid === WATER) return [this.phaseOf(WATER) === LIQUID ? mol : 0, false];
    const d = this.d.get(sid) ?? 0;
    const ph = this.phaseOf(sid);
    if (this.water > 0.5 && this.ctx.solubility(sid, this.T) > 0) return [d, false];
    // solidi insolubili (metalli, ossidi, carbonati) reagiscono in superficie: più lentamente
    if (ph === SOLID) return [mol - d, true];
    if (rx.cond.water && ph === GAS) return [0, false];
    return [mol - d, false];
  }

  /** Sostanze presenti e reazioni del catalogo possibili tra loro (anche con l'ossigeno dell'aria, se aperto). */
  candidates(open = true, index = null) {
    const { ctx } = this;
    const present = [...this.n.keys()].filter((s) => typeof s === 'number' && this.n.get(s) > TINY);
    const out = new Map();
    const push = (arr) => arr?.forEach((rx) => out.set(rx.id, rx));
    const [single, pair, air] = index ?? [ctx.singleIdx, ctx.pairIdx, ctx.airIdx];
    for (const a of present) {
      push(single.get(a));
      if (open && air) push(air.get(a));
      for (const b of present) if (a < b) push(pair.get(a * PAIR_K + b));
    }
    return out;
  }

  /**
   * Condizione che manca perché la reazione avvenga adesso, oppure null. why: 'water' (serve acqua), 'heat' (serve
   * scaldare fino a T kelvin), 'tooHot' (solo sotto T), 'flame' (serve una fiamma o una scintilla), 'shock' (solo con
   * un urto: esplosivi), 'light' (serve la luce della lampada), 'catalyst' (manca il catalizzatore, sids),
   * 'electrolysis' (serve la corrente dell'alimentatore), 'conduct' (c'è la tensione, ma la soluzione non conduce).
   */
  blocker(rx, { flame = false, light = false, volts = 0 } = {}) {
    const { cond } = rx;
    if (rx.electro) {
      if (!(volts > 0)) return { why: 'electrolysis' };
      if (this.current(volts) < 0.005) return { why: 'conduct' };
    }
    if (cond.water && !(this.water > 0.5)) return { why: 'water' };
    if (this.T > cond.maxT) return { why: 'tooHot', T: cond.maxT };
    const minT = cond.hot ? Math.max(cond.minT, 450) : cond.minT;
    if (this.T < minT) return { why: 'heat', T: minT };
    if (cond.ignite && !flame && !(this.T >= cond.minT && cond.minT > 0)) return { why: 'flame' };
    if (cond.shock) return { why: 'shock' };
    if (cond.light && !light) return { why: 'light' };
    if (cond.catalysts && ![...cond.catalysts].some((c) => (this.n.get(c) ?? 0) > TINY)) return { why: 'catalyst', sids: [...cond.catalysts] };
    return null;
  }

  /** Reazioni del catalogo tra le sostanze presenti. */
  react(dt, { open, flame, light }, ev) {
    const { ctx } = this;
    const candidates = this.candidates(open);
    if (!candidates.size) return;
    const hasWater = this.water > 0.5;
    // la temperatura accelera le reazioni lente (fattore di Arrhenius con Ea ≈ 50 kJ/mol: ×2 ogni 10 °C circa);
    // quelle tra ioni sciolti sono già istantanee. Senza minimo: sotto i −50 °C una reazione si ferma quasi del tutto
    // (prima andava sempre almeno al 15 % e una reazione endotermica portava il contenuto fino a 1 K)
    const arrhenius = Math.min(30, Math.exp(6000 * (1 / 298 - 1 / Math.max(this.T, 1))));
    for (const rx of candidates.values()) {
      if (rx.electro || this.blocker(rx, { flame, light })) continue;
      let xi = Infinity;
      let hetero = false;
      let ok = true;
      for (const r of rx.reactants) {
        if (r.sid === ctx.O2 && rx.air >= 0 && open && !(this.n.get(ctx.O2) > TINY)) continue; // ossigeno dell'aria
        const [avail, solid] = this.available(r.sid, rx);
        if (avail <= TINY) {
          ok = false;
          break;
        }
        hetero ||= solid;
        xi = Math.min(xi, avail / r.c);
      }
      if (!ok || !(xi > TINY) || xi === Infinity) continue;
      const allDissolved = !hetero && rx.reactants.every((r) => r.sid === WATER || r.sid === ctx.O2 || (this.d.get(r.sid) ?? 0) > TINY);
      let k = allDissolved && hasWater ? 5 * (0.3 + 0.7 * this.mix) + 1 : (hetero ? 0.1 * (1 + 3 * this.mix) : 0.8) * arrhenius;
      if (rx.slow) k *= 0.05;
      // fotochimiche: lentissime anche sotto la lampada (circa l'1 % al minuto): il cloruro d'argento si decompone in
      // superficie, l'acido nitrico diluito resta quasi intatto; il gas che si libera è in tracce
      if (rx.cond.light) k = Math.min(k, 2e-4);
      const ext = xi * (1 - Math.exp(-k * dt));
      if (ext <= TINY) continue;
      this.apply(rx, ext, hasWater, ev);
      // calore: in soluzione la neutralizzazione libera 55,8 kJ per mole d'acqua formata
      let dH = rx.neutral && allDissolved ? -55.8 * rx.neutral : rx.dH ?? (rx.group === 'combustioni' ? -600 : -10);
      if (hasWater && !rx.neutral) dH = Math.max(-150, Math.min(80, dH));
      this.heat(-dH * 1000 * ext, this.vesselC ?? 0, ev.gases);
      ev.reactions.add(rx.id);
      ev.extent.set(rx.id, (ev.extent.get(rx.id) ?? 0) + ext);
    }
  }

  /**
   * Corrente (A) tra gli elettrodi alla tensione data: cresce con la concentrazione degli ioni (elettroliti sciolti) e
   * si satura; l'acqua distillata quasi non conduce. Modello semplice, non la legge di Kohlrausch.
   */
  current(volts) {
    const v = this.liquidVolume / 1000;
    if (!(volts > 0) || this.water < 1 || v <= 0) return 0;
    let c = 0;
    for (const [sid, d] of this.d) if (typeof sid === 'number' && d > 0) c += (d / v) * (this.ctx.electrolyte[sid] ?? 0);
    return volts * 0.12 * (c / (c + 0.05));
  }

  /**
   * Elettrolisi: la corrente fa avvenire la reazione di elettrolisi più specifica tra quelle possibili (con più
   * sostanze presenti: la salamoia dà cloro, una soluzione di solfato di sodio solo idrogeno e ossigeno), con
   * l'estensione data dalla legge di Faraday (moli di elettroni = I·t / F) nel tempo accelerato dell'elettrolisi.
   */
  electrolyze(dt, env, ev) {
    const I = this.current(env.volts);
    ev.current = I;
    if (I < 0.005) return;
    const hasWater = this.water > 0.5;
    let best = null;
    let bestN = -1;
    for (const rx of this.candidates(env.open).values()) {
      if (!rx.electro || this.blocker(rx, env)) continue;
      if (rx.reactants.some((r) => !(this.available(r.sid, rx)[0] > TINY))) continue;
      // più specifica: più sostanze diverse, e a parità quella di un soluto (HCl → H₂ + Cl₂) prima di quella dell'acqua
      const n = new Set(rx.reactants.map((r) => r.sid)).size + (rx.reactants.some((r) => r.sid !== WATER) ? 0.5 : 0);
      if (n > bestN) {
        best = rx;
        bestN = n;
      }
    }
    if (!best) return;
    let xi = Infinity;
    for (const r of best.reactants) xi = Math.min(xi, this.available(r.sid, best)[0] / r.c);
    const ext = Math.min(xi, (I * dt * ELECTRO_SPEED) / (best.electrons * FARADAY));
    if (!(ext > TINY)) return;
    this.apply(best, ext, hasWater, ev);
    // l'energia viene dall'alimentatore: il contenuto si scalda appena (effetto Joule), non del ΔH della reazione
    this.heat(I * env.volts * dt * 0.05, this.vesselC ?? 0);
    ev.reactions.add(best.id);
    ev.extent.set(best.id, (ev.extent.get(best.id) ?? 0) + ext);
  }

  apply(rx, ext, hasWater, ev) {
    const { ctx } = this;
    for (const r of rx.reactants) {
      if (r.sid === ctx.O2 && !(this.n.get(ctx.O2) > TINY)) continue;
      const mol = this.n.get(r.sid) ?? 0;
      const used = Math.min(mol, r.c * ext);
      const d = this.d.get(r.sid) ?? 0;
      this.n.set(r.sid, mol - used);
      if (d > 0) this.d.set(r.sid, Math.max(0, d - used));
    }
    for (const p of rx.products) {
      const mol = p.c * ext;
      this.n.set(p.sid, (this.n.get(p.sid) ?? 0) + mol);
      if (p.sid === WATER || !hasWater) continue;
      // in soluzione il prodotto resta sciolto fino alla solubilità; il resto precipita subito
      const sol = ctx.solubility(p.sid, this.T);
      const d = this.d.get(p.sid) ?? 0;
      const room = sol === Infinity ? Infinity : Math.max(0, ((sol / 100) * this.water) / ctx.molar(p.sid) - d);
      const dis = Math.min(mol, room);
      if (dis > 0) this.d.set(p.sid, d + dis);
      if (mol - dis > TINY && this.phaseOf(p.sid) === SOLID) {
        ev.precipitated = true;
        this.susp = Math.min(1, this.susp + 0.6);
      }
    }
  }

  /** Brucia il combustibile per dt secondi (fuoco nel contenitore); restituisce le moli bruciate. */
  burn(dt, fuel, rate = 0.004) {
    const rx = this.ctx.comb.get(fuel);
    const mol = this.n.get(fuel) ?? 0;
    if (!rx || mol <= TINY) return 0;
    const fr = rx.reactants.find((r) => r.sid === fuel);
    const ext = Math.min(mol / fr.c, (rate * dt) / fr.c);
    this.n.set(fuel, mol - fr.c * ext);
    for (const p of rx.products) if (p.sid !== WATER) this.n.set(p.sid, (this.n.get(p.sid) ?? 0) + p.c * ext);
    this.heat(Math.min(-(rx.dH ?? -600), 3000) * 1000 * ext * 0.15, this.vesselC ?? 0);
    this.prune();
    return fr.c * ext;
  }

  /** Componenti per la scheda: sostanza, moli, grammi, stato (sciolto, solido, liquido, gas), molarità. */
  components() {
    const { ctx } = this;
    const v = this.liquidVolume;
    const out = [];
    for (const [sid, mol] of this.n) {
      if (mol <= 1e-9) continue;
      const d = this.d.get(sid) ?? 0;
      const free = mol - d;
      const base = { sid, name: ctx.name(sid), formula: ctx.formula(sid), molar: ctx.molar(sid) };
      if (d > 1e-9 && sid !== WATER) out.push({ ...base, mol: d, grams: d * ctx.molar(sid), state: 'aq', conc: v > 0.01 ? (d / v) * 1000 : 0 });
      if (free > 1e-9 || sid === WATER) {
        const state = sid === WATER ? 'liquid' : ['', 'solid', 'liquid', 'gas'][this.phaseOf(sid)];
        out.push({ ...base, mol: sid === WATER ? mol : free, grams: (sid === WATER ? mol : free) * ctx.molar(sid), state });
      }
    }
    return out.sort((a, b) => (a.sid === WATER) - (b.sid === WATER) || b.grams - a.grams);
  }

  /**
   * Aspetto: colore del liquido (rgb 0–255) e opacità, torbidità del precipitato, colore e tipo del solido.
   * @returns {{liquid: number[], alpha: number, turbid: number, turbidColor: number[], solid: number[], solidKind: string, pink: number}}
   */
  appearance() {
    const { ctx } = this;
    const v = Math.max(this.liquidVolume, 0.01) / 1000;
    let rgb = [...WATER_RGB];
    let alpha = 0.2;
    const tintWith = (c, u) => {
      rgb = rgb.map((x, i) => x + (c[i] - x) * u);
      alpha = Math.max(alpha, 0.2 + 0.62 * u);
    };
    const ph = this.pH();
    let pink = 0;
    for (const [sid, mol] of this.n) {
      const d = this.d.get(sid) ?? 0;
      if (typeof sid === 'string') {
        if (sid === 'php' && ph !== null) {
          const frac = Math.max(0, Math.min(1, (ph - 8.2) / 1.8));
          pink = frac * (1 - Math.exp(-(d / v) / 1.5e-5));
          if (pink > 0.01) tintWith(PINK, Math.min(0.9, pink));
        }
        continue;
      }
      if (sid === WATER) continue;
      const s = ctx.sub(sid);
      if (d > 0) {
        const tint = solutionTint(ctx, sid);
        if (tint) tintWith(tint.rgb, 0.85 * (1 - Math.exp(-(d / v) / tint.k)));
      } else if (this.phaseOf(sid) === LIQUID && mol > 0) {
        const col = s.colors?.[LIQUID];
        if (col && col[3] >= 0.9) tintWith(col, Math.min(0.9, this.fraction(sid) * 2));
      }
    }
    // solido: colore medio pesato sul volume
    let sv = 0;
    let solid = [0, 0, 0];
    let insoluble = 0;
    for (const [sid, mol] of this.n) {
      if (typeof sid === 'string' || sid === WATER) continue;
      const free = mol - (this.d.get(sid) ?? 0);
      if (free <= TINY || this.phaseOf(sid) !== SOLID) continue;
      const s = ctx.sub(sid);
      const vol = (free * ctx.molar(sid)) / (s.densS || 2);
      const col = s.colors?.[SOLID] ?? [240, 240, 240];
      solid = solid.map((x, i) => x + col[i] * vol);
      sv += vol;
      if (ctx.solubility(sid, this.T) < 1) insoluble += vol;
    }
    solid = sv > 0 ? solid.map((x) => x / sv) : [240, 240, 240];
    const water = this.water;
    const solidKind = sv <= 0 ? 'none' : water <= 0.05 ? (this.crystals > 0 ? 'crystals' : 'powder') : insoluble > sv * 0.5 ? 'precipitate' : 'crystals';
    const lv = this.liquidVolume;
    const turbid = lv > 0.05 ? Math.min(0.95, this.susp * Math.min(1, ((sv * 1.6) / lv) * 150)) : 0;
    return { liquid: rgb.map(Math.round), alpha, turbid, turbidColor: solid.map(Math.round), solid: solid.map(Math.round), solidKind, pink };
  }
}

// ------------------------------------------------------------------ rifiuti

/** Contenitori dei rifiuti del laboratorio. */
export const BINS = ['sink', 'heavy', 'inorganic', 'organic', 'glass', 'solid'];

/**
 * Classe di rifiuto di una miscela: 'sink' (innocua, nel lavandino), 'heavy' (metalli pesanti), 'inorganic' (acidi, basi
 * e sali), 'organic' (solventi), 'solid' (solidi innocui), oppure null se è vuota.
 */
export function wasteClass(mix) {
  if (!mix || mix.isEmpty()) return null;
  const { ctx } = mix;
  let organicVol = 0;
  let unsafe = false;
  let organicUnsafe = false; // un composto organico che non va nel lavandino, anche diluito (acetone in acqua)
  let notInert = false; // qualcosa che non è né innocuo né un solido inerte (sabbia, marmo, carbone)
  const liquid = mix.liquidVolume;
  for (const [sid, mol] of mix.n) {
    if (mol <= 1e-9 || typeof sid === 'string' || sid === WATER) continue;
    if (ctx.heavy[sid]) return 'heavy';
    const s = ctx.sub(sid);
    const inLiquid = mix.phaseOf(sid) === LIQUID || (mix.d.get(sid) ?? 0) > 0;
    if (s.flags & S.ORGANIC && mix.phaseOf(sid) === LIQUID) organicVol += (mol * ctx.molar(sid)) / (s.densL || 1);
    if (!ctx.sinkSafe.has(sid) && mol > 2e-6) {
      // tracce trascurabili (resti di una titolazione) a parte
      unsafe = true;
      if (s.flags & S.ORGANIC && inLiquid) organicUnsafe = true;
      if (!ctx.inert.has(sid)) notInert = true;
    }
  }
  if (organicVol > 2 && organicVol > liquid * 0.1) return 'organic';
  if (organicUnsafe) return 'organic';
  if (liquid < 0.05) return unsafe && notInert ? 'inorganic' : 'solid';
  const ph = mix.pH();
  if (ph !== null && (ph < 5.5 || ph > 9)) return 'inorganic';
  // anche le soluzioni innocue vanno nei rifiuti se sono concentrate (oltre ~1 mol/L di sali)
  let salts = 0;
  for (const [sid, d] of mix.d) if (typeof sid === 'number' && sid !== WATER) salts += d;
  if (unsafe || (salts / liquid) * 1000 > 1) return 'inorganic';
  return 'sink';
}

/** Vero se una miscela di classe `cls` può finire nel contenitore `bin` (un rifiuto innocuo va bene ovunque tra i liquidi). */
export function binAccepts(bin, cls) {
  if (!cls) return true;
  if (bin === cls) return true;
  if (cls === 'sink') return bin === 'inorganic' || bin === 'heavy';
  if (cls === 'solid') return bin === 'inorganic';
  return false;
}
