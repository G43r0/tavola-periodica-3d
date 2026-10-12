// Sostanze della sandbox: i 118 elementi con i dati reali di elements.json (fusione, ebollizione, densità,
// radioattività, elettronegatività), i materiali di base, i prodotti delle reazioni e le 554 sostanze della libreria
// del laboratorio (dati fisici in data/compounds.js).
// Modulo puro (niente DOM): lo usano il motore (world.js), il disegno e i test.
import { MOLECULES, MOLECULE_GROUPS } from '../lab/data/molecules.js';
import { createLabElements } from '../lab/chem/elements-lab.js';
import { createLibraryIndex, displayFormula, chargeText, formulaKey } from '../lab/chem/identify.js';
import { COMPOUND_DATA, LIBRARY_ALIASES } from './data/compounds.js';

export const AMBIENT = 295.15; // 22 °C
export const T_MAX = 9999;
export const AIR_DENSITY = 0.001205; // g/cm³ a 20 °C
export const STEPS_PER_SECOND = 60; // un passo della simulazione = 1/60 s di gioco
const MOLAR_VOLUME = 22414; // cm³/mol di un gas ideale a 0 °C e 1 atm

export const SOLID = 1;
export const LIQUID = 2;
export const GAS = 3;

/** Proprietà delle sostanze (bit di `flags`). */
export const S = {
  METAL: 1 << 0,
  CONDUCTOR: 1 << 1, // conduce le scintille in ogni stato
  SEMI: 1 << 2, // semiconduttore: conduce solo da caldo
  DISCHARGE: 1 << 3, // da gas si illumina con la scarica elettrica
  HALOGEN: 1 << 4,
  WATER_REACTIVE: 1 << 5,
  RADIOACTIVE: 1 << 6,
  FISSILE: 1 << 7,
  ABSORBER: 1 << 8, // assorbe i neutroni
  MODERATOR: 1 << 9, // rallenta i neutroni
  WALL: 1 << 10, // indistruttibile, isolante
  FIRE: 1 << 11,
  FLAMMABLE: 1 << 12,
  EXTINGUISHER: 1 << 13, // spegne il fuoco
  BLOCK_DEFAULT: 1 << 14, // i solidi si posano come blocco (materiali da costruzione)
  BLOCK_ONLY: 1 << 15,
  BURNS_AS_BLOCK: 1 << 16, // brucia anche in blocco (altrimenti solo in polvere o fuso)
  LIQUID_CONDUCTOR: 1 << 17, // conduce solo da liquido (acqua, sali fusi)
  OXIDIZER: 1 << 18, // alimenta la combustione (O, F)
  REFLECTOR: 1 << 19, // riflette i neutroni (berillio)
  INSTANT_BURN: 1 << 20, // brucia di colpo (idrogeno)
  FADES: 1 << 21, // si dissolve col tempo (fumo)
  GENERATOR: 1 << 22, // genera scintille
  SHIELD: 1 << 23, // scherma bene la radiazione (piombo, tungsteno…)
  SOLUBLE: 1 << 24, // si scioglie in acqua
  MISCIBLE: 1 << 25, // liquido che si mescola con l'acqua
  AQUEOUS: 1 << 26, // esiste solo in soluzione acquosa (ioni)
  EXPLOSIVE: 1 << 27, // detona col calore o con un'esplosione
  DECOMPOSES: 1 << 28, // si decompone invece di bollire
  ORGANIC: 1 << 29, // composto organico (scaldato troppo carbonizza)
  SOURCE: 1 << 30, // clona all'infinito la sostanza che tocca
  DRAIN: 2 ** 31, // elimina tutto ciò che lo tocca
};

// ------------------------------------------------------------------ identificativi
export const EMPTY = 0;
export const WOOD = 119;
export const COAL = 120;
export const CONCRETE = 121;
export const WALL = 122;
export const WATER = 123;
export const FIRE = 124;
export const SMOKE = 125;
export const ASH = 126;
export const CO2 = 127;
export const SO2 = 128;
export const SALT = 129; // ctype = Z del metallo × 128 + Z dell'alogeno
export const OXIDE = 130; // ctype = Z dell'elemento ossidato
export const SOLUTION = 131; // idrossido in soluzione; ctype = Z del metallo
export const GENERATOR = 132;
export const SOURCE = 133;
export const DRAIN = 134;
export const FIRST_COMPOUND = 135; // da qui le sostanze della libreria del laboratorio

export const saltCtype = (metal, halogen) => metal * 128 + halogen;
export const saltParts = (ctype) => [ctype >> 7, ctype & 127];

// decadimenti
export const DECAY = { NONE: 0, ALPHA: 1, BETA: 2, EC: 3, DOUBLE_BETA: 4, FISSION: 5 };
const DECAY_CODE = { 'α': DECAY.ALPHA, 'β-': DECAY.BETA, 'β+': DECAY.EC, CE: DECAY.EC, '2β-': DECAY.DOUBLE_BETA, FS: DECAY.FISSION };

const METAL_CATEGORIES = new Set(['alkali', 'alkaline-earth', 'transition', 'post-transition', 'lanthanide', 'actinide']);

// ------------------------------------------------------------------ dati curati per la simulazione
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** Aspetto reale del solido (colori approssimati); gli altri metalli sono argentei. */
const APPEARANCE = {
  H: '#d8e6ff', He: '#f2f2f2', Li: '#c9c9c4', Be: '#9aa0a6', B: '#3d2f28', C: '#2b2b2d', N: '#e8ecf2', O: '#9fd0ff',
  F: '#f4f0a0', Ne: '#f0f0f0', Na: '#d8d9dd', Mg: '#c4c8cc', Al: '#cfd3d8', Si: '#5a6372', P: '#f0e9c8', S: '#f0cf2c',
  Cl: '#d9d48a', Ar: '#f0f0f0', K: '#d0d0d6', Ca: '#d6d6d0', Ti: '#a8a9ad', V: '#9ca3ad', Cr: '#c3c8d0', Mn: '#a39c94',
  Fe: '#8c8f94', Co: '#9da1a8', Ni: '#b7b3a8', Cu: '#c8763d', Zn: '#a9b1bd', Ga: '#c8ccd2', Ge: '#9aa0a6', As: '#757a80',
  Se: '#6e3b3b', Br: '#5c1d14', Kr: '#f0f0f0', Rb: '#cbc8d0', Sr: '#d6d2c4', Zr: '#b5b8bc', Nb: '#9fa6b0', Mo: '#a6abb3',
  Tc: '#a0a5ad', Ru: '#b0b4b8', Rh: '#c4c8cc', Pd: '#c0bdb8', Ag: '#d8dadc', Cd: '#b5b9c0', In: '#c0c4cc', Sn: '#c2c6cc',
  Sb: '#b4b8c2', Te: '#a3a8ad', I: '#4b3a5e', Xe: '#f0f0f0', Cs: '#e2c672', Ba: '#c9c6b8', W: '#8e939a', Os: '#7f97b0',
  Ir: '#c8ccd0', Pt: '#d4d4d8', Au: '#e8b52a', Hg: '#c8ccd4', Tl: '#9fa3a8', Pb: '#6e7381', Bi: '#c4a6b8', Po: '#a8acb2',
  At: '#4a4a52', Rn: '#ffcc40', Fr: '#c0bfc8', Ra: '#e8e8e2', U: '#7b7f86', Pu: '#9ea2aa', Th: '#a7aaa8',
};

/** Gas incolori o colorati: colore e opacità con cui si disegnano. */
const GAS_LOOK = {
  H: ['#cfe3ff', 0.2], He: ['#ffe8d8', 0.18], N: ['#d9e2ff', 0.18], O: ['#bfe0ff', 0.24], F: ['#f0f08a', 0.34],
  Ne: ['#ffd9cc', 0.18], Cl: ['#bfe24a', 0.46], Ar: ['#e6dcff', 0.18], Kr: ['#e0f0ff', 0.18], Xe: ['#cfe0ff', 0.2],
  Rn: ['#e0e8f0', 0.22], Br: ['#b8462a', 0.5], I: ['#9b3fbf', 0.45], Hg: ['#d8dcf0', 0.22], S: ['#e8b040', 0.35],
};

/** Colori dei liquidi diversi dal solido. */
const LIQUID_LOOK = { O: '#7fb8ff', N: '#dfe8f5', F: '#f2e86a', Cl: '#e6c23a', Br: '#7a1a10', S: '#b5501c', H: '#e0ecff', Ne: '#ffe8e0' };

/** Colore della fiamma (saggio alla fiamma). */
const FLAME_COLOR = {
  H: '#9cc8ff', Li: '#ff2a4d', B: '#5cff6a', Na: '#ffb300', Mg: '#ffffff', Al: '#fff4e0', P: '#fff6d6', S: '#3d6bff',
  K: '#c48cff', Ca: '#ff6a2b', Fe: '#ffbe55', Cu: '#33d9b0', Zn: '#b8f0ff', As: '#6a8cff', Se: '#5ab4ff', Rb: '#d0357c',
  Sr: '#ff1f3d', In: '#6a5cff', Sb: '#a8f0a0', Te: '#9cf0a0', Cs: '#8b7dff', Ba: '#a6ff4d', Tl: '#7dff3a', Pb: '#b0c8ff',
  Mo: '#d0ff70', Ti: '#ffffff', Ce: '#fff0c0', U: '#ffd080', Ra: '#ff3050',
};
export const FLAME_COLOR_NAME = {
  H: 'azzurro pallido', Li: 'rosso carminio', B: 'verde brillante', Na: 'giallo-arancio', Mg: 'bianca abbagliante',
  Al: 'bianca', P: 'bianca', S: 'blu', K: 'lilla', Ca: 'rosso-arancio', Fe: 'dorata, con scintille', Cu: 'verde-azzurro',
  Zn: 'bianco-azzurro', As: 'blu', Se: 'azzurra', Rb: 'rosso-violetto', Sr: 'rosso cremisi', In: 'indaco', Sb: 'verde pallido',
  Te: 'verde pallido', Cs: 'blu-violetto', Ba: 'verde mela', Tl: 'verde', Pb: 'azzurro pallido', Mo: 'giallo-verde',
  Ti: 'bianca', Ce: 'giallo pallido', U: 'gialla', Ra: 'rossa',
};

/** Colore della scarica elettrica nel gas (tubi al neon). */
const DISCHARGE_COLOR = {
  H: '#ff6fd0', He: '#ffb38a', N: '#c27bff', O: '#d9c8ff', Ne: '#ff5a2a', Ar: '#b07cff', Kr: '#ece6ff',
  Xe: '#7d95ff', Rn: '#ff4060', Hg: '#9fb8ff', Na: '#ffc63d',
};
export const DISCHARGE_COLOR_NAME = {
  H: 'rosa-magenta', He: 'rosa-arancio', N: 'viola', O: 'lilla pallido', Ne: 'rosso-arancio', Ar: 'violetto',
  Kr: 'bianco-lilla', Xe: 'blu-violetto', Rn: 'rosso', Hg: 'azzurro-violetto', Na: 'giallo',
};

/** Densità dei gas liquefatti (g/cm³) al punto di ebollizione. */
const LIQUID_DENSITY = { H: 0.0708, He: 0.125, N: 0.807, O: 1.141, F: 1.505, Ne: 1.207, Cl: 1.563, Ar: 1.395, Kr: 2.413, Xe: 2.942, Rn: 4.4 };
/** Atomi per molecola nel vapore (per la densità del gas). */
const VAPOR_ATOMS = { H: 2, N: 2, O: 2, F: 2, Cl: 2, Br: 2, I: 2, At: 2, P: 4, As: 4, S: 2 };
/** Liquidi più densi del solido (anomalie come l'acqua). */
const DENSER_LIQUID = new Set(['Si', 'Ge', 'Ga', 'Bi', 'Sb']);

/** Stime per gli elementi senza dati misurati (temperature in K, densità in g/cm³). */
const ESTIMATE = {
  Fm: { density: 9.7 }, Md: { density: 10.3 }, No: { density: 9.9 }, Lr: { density: 15.6 },
  Cn: { mp: 283, bp: 340 }, Nh: { mp: 700, bp: 1430 }, Fl: { mp: 284, bp: 380 }, Mc: { mp: 670, bp: 1400 },
  Lv: { mp: 708, bp: 1085 }, Ts: { mp: 723, bp: 883 }, Og: { mp: 325, bp: 450 },
};

/**
 * Combustione: temperatura di accensione (K), probabilità per passo una volta raggiunta, temperatura della fiamma,
 * durata (passi), gas emesso e cosa resta. I metalli bruciano solo in polvere o fusi, salvo BURNS_AS_BLOCK.
 */
const BURN = {
  H: { ignite: 858, flame: 2400, instant: true },
  C: { ignite: 973, flame: 1600, fuel: [500, 800], gas: 'CO2', gasChance: 0.12, end: 'CO2', block: true },
  P: { ignite: 307, chance: 0.04, flame: 1100, fuel: [25, 45], gas: 'SMOKE', gasChance: 0.5, end: 'OXIDE', block: true },
  S: { ignite: 505, flame: 1100, fuel: [70, 130], gas: 'SO2', gasChance: 0.3, end: 'SO2', block: true },
  Li: { ignite: 453, flame: 1500, fuel: [60, 100], end: 'OXIDE', block: true },
  Na: { ignite: 388, flame: 1300, fuel: [60, 110], end: 'OXIDE', block: true },
  K: { ignite: 340, flame: 1300, fuel: [50, 90], end: 'OXIDE', block: true },
  Rb: { ignite: 290, chance: 0.004, flame: 1300, fuel: [50, 90], end: 'OXIDE', block: true },
  Cs: { ignite: 280, chance: 0.006, flame: 1300, fuel: [50, 90], end: 'OXIDE', block: true },
  Fr: { ignite: 280, chance: 0.006, flame: 1300, fuel: [50, 90], end: 'OXIDE', block: true },
  Be: { ignite: 1200, flame: 2500, fuel: [40, 70], end: 'OXIDE' },
  Mg: { ignite: 746, flame: 3100, fuel: [35, 60], end: 'OXIDE' },
  Ca: { ignite: 900, flame: 2000, fuel: [40, 70], end: 'OXIDE' },
  Sr: { ignite: 900, flame: 2000, fuel: [40, 70], end: 'OXIDE' },
  Ba: { ignite: 820, flame: 2000, fuel: [40, 70], end: 'OXIDE' },
  B: { ignite: 1100, flame: 2300, fuel: [40, 80], end: 'OXIDE' },
  Al: { ignite: 1000, flame: 3000, fuel: [40, 70], end: 'OXIDE' },
  Si: { ignite: 1300, flame: 2300, fuel: [40, 80], end: 'OXIDE' },
  Ti: { ignite: 1200, flame: 3000, fuel: [40, 70], end: 'OXIDE' },
  Fe: { ignite: 800, flame: 1900, fuel: [20, 40], end: 'OXIDE' },
  Zn: { ignite: 733, flame: 1400, fuel: [30, 60], end: 'OXIDE' },
  Zr: { ignite: 900, flame: 2800, fuel: [40, 70], end: 'OXIDE' },
  Hf: { ignite: 1000, flame: 2800, fuel: [40, 70], end: 'OXIDE' },
  As: { ignite: 600, flame: 1200, fuel: [30, 60], gas: 'SMOKE', gasChance: 0.3, end: 'OXIDE' },
  Se: { ignite: 650, flame: 1200, fuel: [30, 60], end: 'OXIDE' },
  Sb: { ignite: 900, flame: 1500, fuel: [30, 60], end: 'OXIDE' },
  La: { ignite: 720, flame: 2000, fuel: [40, 70], end: 'OXIDE' },
  Ce: { ignite: 450, flame: 2000, fuel: [40, 70], end: 'OXIDE' },
  Th: { ignite: 800, flame: 2200, fuel: [40, 70], end: 'OXIDE' },
  U: { ignite: 600, flame: 2000, fuel: [40, 70], end: 'OXIDE' },
  Np: { ignite: 600, flame: 2000, fuel: [40, 70], end: 'OXIDE' },
  Pu: { ignite: 600, flame: 2000, fuel: [40, 70], end: 'OXIDE' },
};
// gli altri lantanidi bruciano in polvere verso i 700 K
const LANTHANIDE_BURN = { ignite: 700, flame: 2000, fuel: [40, 70], end: 'OXIDE' };

/** Reazione con l'acqua: probabilità per contatto, calore liberato (K), esplosione, temperatura minima. */
const WATER_REACTION = {
  Li: { rate: 0.004, heat: 160 },
  Na: { rate: 0.012, heat: 380 },
  K: { rate: 0.025, heat: 620 },
  Rb: { rate: 0.25, heat: 800, boom: 0.25 },
  Cs: { rate: 0.4, heat: 1000, boom: 0.45 },
  Fr: { rate: 0.4, heat: 1000, boom: 0.45 },
  Ca: { rate: 0.006, heat: 120 },
  Sr: { rate: 0.01, heat: 160 },
  Ba: { rate: 0.02, heat: 200 },
  Ra: { rate: 0.02, heat: 200 },
  Mg: { rate: 0.004, heat: 120, hot: 350 },
};

/** Probabilità di fissione per cella attraversata da un neutrone veloce (lento: ×3). */
const FISSILE = { Th: 0.006, Pa: 0.03, U: 0.04, Np: 0.05, Pu: 0.12, Am: 0.07, Cm: 0.1, Bk: 0.08, Cf: 0.13, Es: 0.1, Fm: 0.1 };
/** Isotopo fissile usato nelle equazioni. */
export const FISSILE_ISOTOPE = { Th: 232, Pa: 231, U: 235, Np: 237, Pu: 239, Am: 241, Cm: 245, Bk: 247, Cf: 251, Es: 252, Fm: 257 };
/** Assorbitori di neutroni (probabilità per cella). */
const ABSORBER = { B: 0.5, Cd: 0.8, Gd: 0.9, Sm: 0.5, Eu: 0.5, Hf: 0.35, Dy: 0.35, In: 0.3, Er: 0.2, Ag: 0.12 };
/** Moderatori: fattore di rallentamento per cella. */
const MODERATOR = { H: 0.75, C: 0.88 };

/** Riscaldamento resistivo per scintilla (K). */
const SPARK_HEAT = { W: 30, C: 22, Ti: 14, Mn: 12, Cr: 10, Bi: 9, Pt: 8, Fe: 6, Ni: 6, Hg: 6, Pb: 6, Cu: 1, Ag: 1, Au: 1, Al: 1.5 };
/** Conduttività termica relativa (0–0,24). */
const THERMAL = { Ag: 0.24, Cu: 0.24, Au: 0.22, Al: 0.21, W: 0.19, Mg: 0.17, C: 0.15, Si: 0.14, Fe: 0.12, Pb: 0.07, Hg: 0.06, Bi: 0.05, Mn: 0.05 };

/** Carica tipica del catione per sali e ossidi (dove la regola generale non basta). */
const CHARGE = {
  Si: 4, Ge: 4, Sn: 4, Pb: 2, Ti: 4, Zr: 4, Hf: 4, Ce: 4, Th: 4, U: 4, Np: 4, Pu: 4, Se: 4, Te: 4, Mn: 2, Co: 2, Ni: 2,
  Cu: 2, Zn: 2, Cd: 2, Hg: 2, Pd: 2, Pt: 4, Tl: 1, Ag: 1, Au: 3, Fe: 3, Cr: 3, V: 5, Mo: 6, W: 6, Nb: 5, Ta: 5, Re: 7,
  Os: 4, Ru: 4, Ir: 4, Rh: 3, Tc: 7, Eu: 3, Sm: 3, Yb: 3, Tm: 3,
};

/** Tempo di dimezzamento «di gioco» (s) da quello reale, in scala logaritmica: 1 ms → 0,4 s, 4,5 miliardi di anni → 44 min. */
export function gameHalfLife(seconds) {
  const g = 0.25 * 10 ** (0.19 * (Math.log10(seconds) + 4));
  return Math.min(2e5, Math.max(0.2, g));
}

/** Carica del catione usata per sali, ossidi e idrossidi. */
export function cationCharge(el) {
  if (CHARGE[el.symbol]) return CHARGE[el.symbol];
  if (el.category === 'alkali') return 1;
  if (el.category === 'alkaline-earth') return 2;
  const pos = (el.oxidationStates ?? []).map((s) => Number(s.replace('−', '-'))).filter((n) => n > 0);
  if (!pos.length) return 2;
  const low = pos.filter((n) => n <= 3);
  return low.length ? Math.max(...low) : Math.min(...pos);
}

const mix = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));

function makeElement(el) {
  const sym = el.symbol;
  const est = ESTIMATE[sym] ?? {};
  const isMetal = METAL_CATEGORIES.has(el.category) || (el.z >= 104 && el.z <= 116);
  let flags = 0;
  let estimated = false;

  // ---- temperature di cambiamento di stato
  let mp = el.meltingPointK;
  let bp = el.boilingPointK;
  if (el.sublimationPointK) mp = bp = el.sublimationPointK;
  if (sym === 'He') mp = 0.95; // a 1 atm non solidifica
  if (mp == null) {
    mp = est.mp ?? 2000;
    estimated = true;
  }
  if (bp == null) {
    bp = est.bp ?? (el.z >= 104 ? 4500 : mp + 1400);
    estimated = true;
  }

  // ---- densità
  const atoms = VAPOR_ATOMS[sym] ?? 1;
  const densG = (el.atomicMass.value * atoms) / MOLAR_VOLUME;
  let densS;
  let densL;
  const d = el.densityGcm3 ?? est.density ?? 10;
  if (el.densityGcm3 == null) estimated = true;
  if (el.state === 'gas') {
    densL = LIQUID_DENSITY[sym] ?? 1;
    densS = densL * 1.1;
  } else if (el.state === 'liquid') {
    densL = d;
    densS = d * 1.07;
  } else {
    densS = d;
    densL = DENSER_LIQUID.has(sym) ? d * 1.03 : d * 0.93;
  }

  // ---- comportamento
  if (isMetal) flags |= S.METAL | S.CONDUCTOR;
  if (sym === 'C' || sym === 'As' || sym === 'Sb' || sym === 'Te') flags |= S.CONDUCTOR;
  if (sym === 'Si' || sym === 'Ge' || sym === 'B' || sym === 'Se') flags |= S.SEMI;
  if (DISCHARGE_COLOR[sym]) flags |= S.DISCHARGE;
  if (el.category === 'halogen') flags |= S.HALOGEN;
  if (sym === 'O' || sym === 'F') flags |= S.OXIDIZER;
  if (sym === 'Be') flags |= S.REFLECTOR;
  if (ABSORBER[sym]) flags |= S.ABSORBER;
  if (MODERATOR[sym]) flags |= S.MODERATOR;
  if (['Pb', 'W', 'U', 'Bi', 'Au', 'Pt', 'Os', 'Ir', 'Ta'].includes(sym)) flags |= S.SHIELD;

  const burnDef = BURN[sym] ?? (el.category === 'lanthanide' ? LANTHANIDE_BURN : null);
  let burn = null;
  if (burnDef) {
    flags |= S.FLAMMABLE;
    if (burnDef.instant) flags |= S.INSTANT_BURN;
    if (burnDef.block) flags |= S.BURNS_AS_BLOCK;
    burn = { chance: 1, fuel: [0, 0], gasChance: 0, ...burnDef };
  }

  const water = WATER_REACTION[sym] ?? null;
  if (water) flags |= S.WATER_REACTIVE;

  // ---- radioattività (elementi senza isotopi stabili)
  let decay = null;
  const main = el.isotopes.find((i) => i.main);
  if (!el.isotopes.some((i) => i.stable) && main?.halfLife) {
    flags |= S.RADIOACTIVE;
    const mode = DECAY_CODE[main.decay[0]?.code] ?? DECAY.ALPHA;
    const game = gameHalfLife(main.halfLife.seconds);
    const daughter = { [DECAY.ALPHA]: el.z - 2, [DECAY.BETA]: el.z + 1, [DECAY.EC]: el.z - 1, [DECAY.DOUBLE_BETA]: el.z + 2 }[mode] ?? 0;
    decay = {
      mode,
      daughter,
      massNumber: main.massNumber,
      halfLifeText: main.halfLife.text,
      halfLifeSeconds: main.halfLife.seconds,
      gameSeconds: game,
      p: 1 - 2 ** (-1 / (game * STEPS_PER_SECOND)),
    };
  }
  const fission = FISSILE[sym] ?? 0;
  if (fission) flags |= S.FISSILE;

  // ---- aspetto
  const category = el.category;
  const solid = hex(APPEARANCE[sym] ?? (isMetal ? '#b4b9c0' : el.cpkColor && el.cpkColor.length === 7 ? el.cpkColor : '#9aa3ad'));
  const gasLook = GAS_LOOK[sym];
  const colors = {
    [SOLID]: [...solid, 1],
    [LIQUID]: [...(LIQUID_LOOK[sym] ? hex(LIQUID_LOOK[sym]) : mix(solid, [255, 255, 255], isMetal ? 0.12 : 0)), el.state === 'gas' ? 0.75 : 1],
    [GAS]: gasLook ? [...hex(gasLook[0]), gasLook[1]] : [...mix(solid, [255, 255, 255], 0.45), 0.3],
  };

  const thermal = THERMAL[sym] ?? (isMetal ? (category === 'lanthanide' || category === 'actinide' ? 0.06 : 0.14) : el.category === 'metalloid' ? 0.07 : 0.02);

  return {
    id: el.z,
    key: sym,
    z: el.z,
    el,
    kind: 'element',
    name: el.name,
    symbol: sym,
    category,
    mp,
    bp,
    sublimes: Boolean(el.sublimationPointK),
    densS,
    densL,
    densG,
    cond: thermal,
    flags,
    hardness: isMetal ? Math.min(0.95, 0.3 + mp / 6000) : 0.3,
    disp: el.state === 'gas' ? 5 : sym === 'Br' ? 4 : sym === 'Hg' ? 3 : isMetal ? 2 : 3,
    colors,
    burn,
    water,
    decay,
    fission,
    absorb: ABSORBER[sym] ?? 0,
    moderate: MODERATOR[sym] ?? 1,
    sparkHeat: SPARK_HEAT[sym] ?? (isMetal ? 3 : 4),
    flameColor: FLAME_COLOR[sym] ? hex(FLAME_COLOR[sym]) : null,
    discharge: DISCHARGE_COLOR[sym] ? hex(DISCHARGE_COLOR[sym]) : null,
    electronegativity: el.electronegativity ?? (isMetal ? 1.2 : 2.2),
    charge: isMetal || sym === 'Si' || sym === 'B' || sym === 'Ge' || sym === 'As' || sym === 'Sb' || sym === 'Se' || sym === 'Te' || sym === 'P' ? cationCharge(el) : 0,
    estimated: estimated || el.z >= 100,
    defaultPowder: true,
  };
}

/** Materiali di base, composti e prodotti delle reazioni. */
function makeOthers() {
  const base = { kind: 'material', z: 0, burn: null, water: null, decay: null, fission: 0, absorb: 0, moderate: 1, sparkHeat: 0, flameColor: null, discharge: null, electronegativity: 0, charge: 0, estimated: false, sublimes: false, disp: 3, hardness: 0.3, defaultPowder: false };
  const gasOf = (molar) => molar / MOLAR_VOLUME;
  return [
    {
      ...base, id: WOOD, key: 'wood', name: 'Legno', symbol: 'Legno', mp: Infinity, bp: Infinity, densS: 0.6, densL: 0.6, densG: 0.0013,
      cond: 0.012, hardness: 0.35, flags: S.FLAMMABLE | S.BURNS_AS_BLOCK | S.BLOCK_DEFAULT,
      colors: { [SOLID]: [138, 92, 48, 1], [LIQUID]: [138, 92, 48, 1], [GAS]: [138, 92, 48, 0.3] },
      burn: { ignite: 573, chance: 1, flame: 1150, fuel: [70, 150], gas: 'SMOKE', gasChance: 0.22, residue: [['ASH', 0.4], ['COAL', 0.08]] },
    },
    {
      ...base, id: COAL, key: 'coal', name: 'Carbone', symbol: 'Carb.', mp: Infinity, bp: Infinity, densS: 1.35, densL: 1.35, densG: 0.0013,
      cond: 0.02, hardness: 0.3, flags: S.FLAMMABLE | S.BURNS_AS_BLOCK | S.BLOCK_DEFAULT,
      colors: { [SOLID]: [36, 33, 31, 1], [LIQUID]: [36, 33, 31, 1], [GAS]: [60, 60, 60, 0.3] },
      burn: { ignite: 700, chance: 1, flame: 1450, fuel: [450, 750], gas: 'CO2', gasChance: 0.08, residue: [['ASH', 0.3]] },
    },
    {
      ...base, id: CONCRETE, key: 'concrete', name: 'Calcestruzzo', symbol: 'Cls', mp: 1900, bp: 3200, densS: 2.4, densL: 2.5, densG: gasOf(60),
      cond: 0.035, hardness: 0.85, disp: 1, flags: S.BLOCK_DEFAULT,
      colors: { [SOLID]: [150, 150, 144, 1], [LIQUID]: [170, 120, 90, 1], [GAS]: [200, 190, 180, 0.3] },
    },
    {
      ...base, id: WALL, key: 'wall', name: 'Muro indistruttibile', symbol: 'Muro', mp: Infinity, bp: Infinity, densS: 1e9, densL: 1e9, densG: 1e9,
      cond: 0, hardness: Infinity, flags: S.WALL | S.BLOCK_ONLY | S.BLOCK_DEFAULT | S.SHIELD,
      colors: { [SOLID]: [70, 80, 96, 1], [LIQUID]: [70, 80, 96, 1], [GAS]: [70, 80, 96, 1] },
    },
    {
      ...base, id: GENERATOR, key: 'generator', name: 'Generatore elettrico', symbol: 'Gen', mp: Infinity, bp: Infinity, densS: 5, densL: 5, densG: 5,
      cond: 0.05, hardness: 0.9, flags: S.GENERATOR | S.BLOCK_ONLY | S.BLOCK_DEFAULT,
      colors: { [SOLID]: [214, 170, 40, 1], [LIQUID]: [214, 170, 40, 1], [GAS]: [214, 170, 40, 1] },
    },
    {
      ...base, id: SOURCE, key: 'source', name: 'Sorgente', symbol: 'Sorg', mp: Infinity, bp: Infinity, densS: 5, densL: 5, densG: 5,
      cond: 0, hardness: 0.9, flags: S.SOURCE | S.BLOCK_ONLY | S.BLOCK_DEFAULT,
      colors: { [SOLID]: [58, 170, 140, 1], [LIQUID]: [58, 170, 140, 1], [GAS]: [58, 170, 140, 1] },
    },
    {
      ...base, id: DRAIN, key: 'drain', name: 'Pozzo', symbol: 'Pozzo', mp: Infinity, bp: Infinity, densS: 5, densL: 5, densG: 5,
      cond: 0, hardness: 0.9, flags: S.DRAIN | S.BLOCK_ONLY | S.BLOCK_DEFAULT,
      colors: { [SOLID]: [96, 52, 120, 1], [LIQUID]: [96, 52, 120, 1], [GAS]: [96, 52, 120, 1] },
    },
    {
      ...base, kind: 'compound', id: WATER, key: 'water', name: 'Acqua', symbol: 'H₂O', mp: 273.15, bp: 373.15, densS: 0.917, densL: 0.998, densG: gasOf(18.015),
      cond: 0.06, disp: 5, flags: S.LIQUID_CONDUCTOR | S.EXTINGUISHER | S.MODERATOR | S.MISCIBLE, moderate: 0.6, sparkHeat: 2,
      colors: { [SOLID]: [200, 232, 255, 0.95], [LIQUID]: [40, 120, 220, 0.86], [GAS]: [225, 233, 242, 0.26] },
    },
    {
      ...base, kind: 'product', id: FIRE, key: 'fire', name: 'Fuoco', symbol: 'Fuoco', mp: -1, bp: -1, densS: 0.0002, densL: 0.0002, densG: 0.0002,
      cond: 0.12, flags: S.FIRE,
      colors: { [SOLID]: [255, 140, 30, 1], [LIQUID]: [255, 140, 30, 1], [GAS]: [255, 140, 30, 0.9] },
    },
    {
      ...base, kind: 'product', id: SMOKE, key: 'smoke', name: 'Fumo', symbol: 'Fumo', mp: -1, bp: -1, densS: 1, densL: 1, densG: 0.00105,
      cond: 0.02, flags: S.FADES,
      colors: { [SOLID]: [90, 90, 90, 0.45], [LIQUID]: [90, 90, 90, 0.45], [GAS]: [92, 92, 96, 0.42] },
    },
    {
      ...base, kind: 'product', id: ASH, key: 'ash', name: 'Cenere', symbol: 'Cenere', mp: 1500, bp: 3000, densS: 0.7, densL: 2.2, densG: gasOf(60),
      cond: 0.015, defaultPowder: true, flags: 0,
      colors: { [SOLID]: [141, 138, 133, 1], [LIQUID]: [180, 120, 80, 1], [GAS]: [200, 200, 200, 0.3] },
    },
    {
      ...base, kind: 'product', id: CO2, key: 'co2', name: 'Anidride carbonica', symbol: 'CO₂', mp: 194.65, bp: 194.65, densS: 1.56, densL: 1.1, densG: gasOf(44.01),
      cond: 0.015, sublimes: true, defaultPowder: true, flags: S.EXTINGUISHER,
      colors: { [SOLID]: [236, 242, 248, 1], [LIQUID]: [220, 230, 240, 0.6], [GAS]: [200, 210, 220, 0.12] },
    },
    {
      ...base, kind: 'product', id: SO2, key: 'so2', name: 'Anidride solforosa', symbol: 'SO₂', mp: 200, bp: 263, densS: 1.6, densL: 1.46, densG: gasOf(64.07),
      cond: 0.015, flags: S.EXTINGUISHER,
      colors: { [SOLID]: [240, 236, 210, 1], [LIQUID]: [235, 228, 190, 0.7], [GAS]: [232, 222, 150, 0.2] },
    },
    {
      ...base, kind: 'compound', id: SALT, key: 'salt', name: 'Sale', symbol: 'Sale', mp: 1000, bp: 1700, densS: 2.2, densL: 1.6, densG: gasOf(58),
      cond: 0.03, disp: 2, defaultPowder: true, flags: S.LIQUID_CONDUCTOR, sparkHeat: 3,
      colors: { [SOLID]: [238, 238, 240, 1], [LIQUID]: [250, 240, 220, 1], [GAS]: [230, 230, 230, 0.3] },
    },
    {
      ...base, kind: 'compound', id: OXIDE, key: 'oxide', name: 'Ossido', symbol: 'Oss.', mp: 2200, bp: 3500, densS: 4, densL: 3.6, densG: gasOf(100),
      cond: 0.03, disp: 1, defaultPowder: true, flags: 0,
      colors: { [SOLID]: [216, 214, 208, 1], [LIQUID]: [255, 200, 120, 1], [GAS]: [230, 230, 230, 0.3] },
    },
    {
      ...base, kind: 'product', id: SOLUTION, key: 'solution', name: 'Idrossido in soluzione', symbol: 'OH⁻', mp: 265, bp: 378, densS: 1.15, densL: 1.08, densG: gasOf(18.015),
      cond: 0.06, disp: 5, flags: S.LIQUID_CONDUCTOR | S.EXTINGUISHER | S.MODERATOR | S.MISCIBLE | S.AQUEOUS, moderate: 0.6, sparkHeat: 2,
      colors: { [SOLID]: [215, 230, 245, 0.95], [LIQUID]: [92, 150, 214, 0.86], [GAS]: [225, 233, 242, 0.26] },
    },
  ];
}

/** Colore di un sale, di un ossido o di una soluzione in base agli elementi che contiene. */
const SALT_COLOR = { Cu: '#3fb3a0', Fe: '#c07a2a', Ni: '#6fb96f', Co: '#3d5fd9', Cr: '#7b4fb0', Mn: '#f2c6d2', Au: '#e0b030', Pt: '#c88a3a', V: '#7a5a3a' };
const OXIDE_COLOR = {
  Fe: '#8b3a1e', Cu: '#262020', Cr: '#3d7a3a', Ni: '#5a8a4a', Co: '#26355e', U: '#2a241e', Pu: '#4a4a30', Pb: '#e8c040',
  Mn: '#2e2622', Ag: '#3a2c24', Hg: '#c03020', K: '#f0e6b0', V: '#c08a2a', Mo: '#e8f0f0', W: '#d8d040', Co3: '#26355e',
  Se: '#f0f0f0', Np: '#5a5040', Ce: '#f2ecd0', Tl: '#2a2a2a', Bi: '#f0e080', Cd: '#7a4a2a', Zn: '#f4f4f0', Ti: '#fafafa',
};

export function variantColor(subs, id, ctype) {
  if (id === SALT) {
    const [m, x] = saltParts(ctype);
    const ms = subs.list[m]?.symbol;
    const xs = subs.list[x]?.symbol;
    if (ms === 'Pb' && xs === 'I') return hex('#ffd400'); // «pioggia d'oro»
    if (ms === 'Ag') return hex(xs === 'I' ? '#f0e090' : xs === 'Br' ? '#f0eac0' : '#f2f2ea');
    if (SALT_COLOR[ms]) return hex(SALT_COLOR[ms]);
    return xs === 'I' ? hex('#f2ecd8') : hex('#eeeef0');
  }
  if (id === OXIDE) {
    const s = subs.list[ctype]?.symbol;
    return hex(OXIDE_COLOR[s] ?? '#dcdad4');
  }
  if (id === SOLUTION) {
    const s = subs.list[ctype]?.symbol;
    return s === 'Cu' ? hex('#3a8fd0') : [92, 150, 214];
  }
  return null;
}

const WATER_RGB = [40, 120, 220];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** Una voce della libreria del laboratorio come sostanza della sandbox. */
function makeCompound(id, entry, data, elements, lab) {
  const [mpC, bpC, d, color, opts = '', ignC] = data;
  const has = (c) => opts.includes(c);
  const aqueous = has('a');
  const atoms = entry.graph.atoms;
  const counts = {};
  for (const a of atoms) counts[a.z] = (counts[a.z] ?? 0) + 1;
  const molar = atoms.reduce((t, a) => t + elements[a.z - 1].atomicMass.value, 0);
  const organic = Boolean(counts[6] && counts[1]);
  let mp;
  let bp;
  let densS;
  let densL;
  let state25;
  if (aqueous) {
    mp = 271.15;
    bp = 373.65;
    densS = 0.95;
    densL = 1.05;
    state25 = 'aq';
  } else {
    mp = mpC + 273.15;
    bp = Math.max(bpC + 273.15, mp);
    state25 = mp > AMBIENT ? 'solid' : bp > AMBIENT ? 'liquid' : 'gas';
    if (state25 === 'solid') {
      densS = d;
      densL = d * 0.92;
    } else {
      densL = d;
      densS = d * 1.08;
    }
  }
  let flags = 0;
  if (has('s')) flags |= S.SOLUBLE;
  if (has('m')) flags |= S.MISCIBLE;
  if (has('x')) flags |= S.EXPLOSIVE;
  if (has('o')) flags |= S.OXIDIZER;
  if (has('d')) flags |= S.DECOMPOSES;
  if (has('k')) flags |= S.EXTINGUISHER;
  if (aqueous) flags |= S.AQUEOUS | S.MISCIBLE | S.LIQUID_CONDUCTOR;
  if (entry.ionic || entry.charge || entry.group === 'acidi') flags |= S.LIQUID_CONDUCTOR; // sali fusi, ioni e acidi in soluzione conducono
  if (organic) flags |= S.ORGANIC;
  let burn = null;
  if (has('f')) {
    flags |= S.FLAMMABLE | S.BURNS_AS_BLOCK;
    if (state25 === 'gas') flags |= S.INSTANT_BURN;
    burn = { ignite: ignC != null ? ignC + 273.15 : organic ? 573 : 673, chance: 1, flame: state25 === 'gas' ? 2200 : 1700, fuel: [60, 140], gas: organic ? 'SMOKE' : null, gasChance: organic ? 0.15 : 0 };
  }
  const rgb = color ? hex(color) : null;
  const colors = {
    [SOLID]: [...(rgb ?? [242, 242, 240]), 1],
    [LIQUID]: aqueous ? [...(rgb ? mix(WATER_RGB, rgb, 0.6) : [70, 140, 226]), 0.86] : rgb ? [...rgb, 1] : [214, 228, 242, 0.6],
    [GAS]: rgb ? [...rgb, 0.4] : [208, 216, 226, 0.13],
  };
  // la formula scritta in libreria non ha la carica; quella generata sì
  const formula = entry.formula ? entry.formula + chargeText(entry.charge) : displayFormula(lab, atoms, entry.charge, { ionic: entry.ionic });
  const viscous = ['glicerolo', 'acido-oleico', 'h2so4', 'glicole-etilenico', 'nitroglicerina'].includes(entry.id);
  // il primo metallo che colora la fiamma (NaCl → sodio, giallo)
  const tintZ = Number(Object.keys(counts).find((z) => FLAME_COLOR[elements[z - 1].symbol] && elements[z - 1].category !== 'nonmetal')) || 0;
  return {
    id,
    key: entry.id,
    kind: 'compound',
    entry,
    group: entry.group,
    name: entry.name,
    symbol: formula,
    formula,
    mp,
    bp,
    sublimes: !aqueous && mpC === bpC && !has('d'),
    densS,
    densL,
    densG: molar / MOLAR_VOLUME,
    molar,
    dissDens: aqueous ? 1.05 : 1 + Math.min(0.3, (d ?? 1) * 0.04),
    cond: entry.ionic ? 0.05 : 0.025,
    flags,
    hardness: 0.4,
    disp: aqueous ? 5 : viscous ? 1 : 3,
    colors,
    burn,
    water: null,
    decay: null,
    fission: 0,
    absorb: 0,
    moderate: 1,
    sparkHeat: 2,
    flameColor: null,
    tintZ,
    discharge: null,
    electronegativity: 0,
    charge: 0,
    estimated: has('e'),
    defaultPowder: true,
    state25,
    counts,
    ignC: ignC ?? null,
  };
}

/**
 * Tabella completa delle sostanze: `list[id]` (oggetti descrittivi) e array tipizzati per il motore.
 * @param {object[]} elements elementi di elements.json
 */
export function createSubstances(elements) {
  const lab = createLabElements(elements);
  const library = createLibraryIndex(lab, MOLECULES);
  const list = new Array(FIRST_COMPOUND).fill(null);
  list[EMPTY] = { id: EMPTY, key: 'empty', name: 'Aria', symbol: '', kind: 'empty', mp: -1, bp: -1, densS: AIR_DENSITY, densL: AIR_DENSITY, densG: AIR_DENSITY, cond: 0, flags: 0, colors: {} };
  for (const el of elements) list[el.z] = makeElement(el);
  for (const s of makeOthers()) list[s.id] = s;

  const byKey = new Map(list.map((s) => [s.key, s]));
  // le 554 voci della libreria: alcune sono già sostanze (H₂ → idrogeno, H₂O → acqua), le altre diventano composti
  const libraryId = new Map();
  for (const entry of library.entries) {
    const alias = LIBRARY_ALIASES[entry.id];
    if (alias) {
      const s = byKey.get(alias);
      libraryId.set(entry.id, s.id);
      if (s.kind !== 'element') s.entry = entry;
      continue;
    }
    const s = makeCompound(list.length, entry, COMPOUND_DATA[entry.id], elements, lab);
    list.push(s);
    byKey.set(s.key, s);
    libraryId.set(entry.id, s.id);
  }
  const keyId = (k) => (k ? byKey.get({ CO2: 'co2', SO2: 'so2', SMOKE: 'smoke', ASH: 'ash', COAL: 'coal', OXIDE: 'oxide' }[k] ?? k)?.id ?? 0 : 0);

  const n = list.length;
  const P = {
    flags: new Uint32Array(n),
    mp: new Float32Array(n),
    bp: new Float32Array(n),
    densS: new Float32Array(n),
    densL: new Float32Array(n),
    densG: new Float32Array(n),
    dissDens: new Float32Array(n),
    sqrtCond: new Float32Array(n),
    hardness: new Float32Array(n),
    disp: new Uint8Array(n),
    ignite: new Float32Array(n),
    igniteChance: new Float32Array(n),
    flame: new Float32Array(n),
    fuelMin: new Uint16Array(n),
    fuelMax: new Uint16Array(n),
    burnGas: new Uint16Array(n),
    gasChance: new Float32Array(n),
    burnEnd: new Uint16Array(n), // sostanza in cui si trasforma a fine combustione (OXIDE: ossido dell'elemento)
    waterRate: new Float32Array(n),
    waterHeat: new Float32Array(n),
    waterBoom: new Float32Array(n),
    waterHot: new Float32Array(n),
    decayP: new Float64Array(n),
    decayMode: new Uint8Array(n),
    daughter: new Uint8Array(n),
    fission: new Float32Array(n),
    absorb: new Float32Array(n),
    moderate: new Float32Array(n),
    sparkHeat: new Float32Array(n),
    en: new Float32Array(n),
    charge: new Uint8Array(n),
    flameTint: new Uint8Array(n), // Z che colora la fiamma (0 = colore normale)
  };
  P.residue = new Array(n).fill(null); // [[id, probabilità], …]

  for (const s of list) {
    if (!s) continue;
    const i = s.id;
    P.flags[i] = s.flags;
    P.mp[i] = s.mp;
    P.bp[i] = s.bp;
    P.densS[i] = s.densS;
    P.densL[i] = s.densL;
    P.densG[i] = s.densG;
    P.dissDens[i] = s.dissDens ?? 1.05;
    P.sqrtCond[i] = Math.sqrt(s.cond ?? 0);
    P.hardness[i] = s.hardness ?? 0.3;
    P.disp[i] = s.disp ?? 3;
    P.absorb[i] = s.absorb ?? 0;
    P.moderate[i] = s.moderate ?? 1;
    P.sparkHeat[i] = s.sparkHeat ?? 0;
    P.en[i] = s.electronegativity ?? 0;
    P.charge[i] = s.charge ?? 0;
    P.fission[i] = s.fission ?? 0;
    if (s.flameColor) P.flameTint[i] = i;
    else if (s.tintZ) P.flameTint[i] = s.tintZ;
    if (s.burn) {
      P.ignite[i] = s.burn.ignite;
      P.igniteChance[i] = s.burn.chance ?? 1;
      P.flame[i] = s.burn.flame;
      P.fuelMin[i] = s.burn.fuel?.[0] ?? 0;
      P.fuelMax[i] = s.burn.fuel?.[1] ?? 0;
      P.burnGas[i] = keyId(s.burn.gas);
      P.gasChance[i] = s.burn.gasChance ?? 0;
      P.burnEnd[i] = keyId(s.burn.end);
      if (s.burn.residue) P.residue[i] = s.burn.residue.map(([k, p]) => [keyId(k), p]);
    }
    if (s.water) {
      P.waterRate[i] = s.water.rate;
      P.waterHeat[i] = s.water.heat;
      P.waterBoom[i] = s.water.boom ?? 0;
      P.waterHot[i] = s.water.hot ?? 0;
    }
    if (s.decay) {
      P.decayP[i] = s.decay.p;
      P.decayMode[i] = s.decay.mode;
      P.daughter[i] = s.decay.daughter;
    }
  }

  // composti della libreria con una data formula: sali, ossidi e idrossidi prodotti dalle reazioni «a mano»
  const byAtoms = (atoms) => {
    for (const item of library.byFormula(formulaKey(lab, atoms, 0))) {
      const id = libraryId.get(item.id);
      if (id) return id;
    }
    return 0;
  };
  const memo = new Map();
  const cached = (key, fn) => {
    if (!memo.has(key)) memo.set(key, fn());
    return memo.get(key);
  };
  const atom = (z) => ({ z, charge: 0 });
  const rep = (z, n) => Array.from({ length: n }, () => atom(z));
  const lookups = {
    /** Sale MXₙ della libreria (0 se non c'è). */
    saltFor: (m, x) => cached(`s${m}:${x}`, () => byAtoms([atom(m), ...rep(x, list[m].charge || 1)])),
    /** Ossido dell'elemento più comune nella libreria (0 se non c'è). */
    oxideFor: (z) =>
      cached(`o${z}`, () => {
        const sym = list[z].symbol;
        if (sym === 'P') return libraryId.get('p4o10');
        if (sym === 'As') return libraryId.get('as4o6');
        const c = list[z].charge || 2;
        const g = gcd(c, 2);
        return byAtoms([...rep(z, 2 / g), ...rep(8, c / g)]);
      }),
    /** Idrossido M(OH)ₙ della libreria (0 se non c'è). */
    hydroxideFor: (z) => cached(`h${z}`, () => byAtoms([atom(z), ...rep(8, list[z].charge || 1), ...rep(1, list[z].charge || 1)])),
  };

  return { list, byKey, P, elements, lab, library, libraryId, groups: MOLECULE_GROUPS, firstCompound: FIRST_COMPOUND, ...lookups };
}

/** Stato fisico di una sostanza alla temperatura T (K). */
export function phaseAt(sub, T) {
  if (sub.flags & S.FIRE) return GAS;
  return T < sub.mp ? SOLID : T < sub.bp ? LIQUID : GAS;
}

/** Densità (g/cm³) nello stato dato; per i gas dipende dalla temperatura (gas ideale). */
export function densityAt(sub, phase, T) {
  if (phase === SOLID) return sub.densS;
  if (phase === LIQUID) return sub.densL;
  return (sub.densG * 273.15) / Math.max(T, 1);
}
