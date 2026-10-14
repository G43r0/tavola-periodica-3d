// Dati del simulatore di laboratorio: solubilità, acidi e basi, idrati, gas tossici, metalli pesanti, indicatori,
// reagenti dello scaffale e prezzi. Le chiavi sono quelle della libreria del laboratorio (o il simbolo per gli elementi).
// Modulo puro (niente DOM).

/**
 * Solubilità in acqua: grammi di soluto anidro in 100 g d'acqua alle varie temperature (°C), CRC Handbook of Chemistry
 * and Physics (tabella «Aqueous solubility of inorganic compounds at various temperatures»). Tra due punti si interpola.
 * I sali solubili che non sono qui valgono 50 g/100 g; quelli senza l'opzione «s» nei dati della sandbox sono insolubili.
 */
export const SOLUBILITY = {
  nacl: [[0, 35.7], [20, 35.9], [40, 36.4], [60, 37.1], [80, 38.0], [100, 39.2]],
  kcl: [[0, 28.0], [20, 34.2], [40, 40.1], [60, 45.8], [80, 51.3], [100, 56.3]],
  licl: [[0, 69.2], [20, 83.5], [40, 89.8], [60, 98.4], [80, 112], [100, 128]],
  kno3: [[0, 13.3], [20, 31.6], [40, 63.9], [60, 110], [80, 169], [100, 246]],
  nano3: [[0, 73], [20, 88], [40, 104], [60, 124], [80, 148], [100, 180]],
  cuso4: [[0, 14.3], [20, 20.7], [40, 28.5], [60, 40.0], [80, 55.0], [100, 75.4]],
  ki: [[0, 128], [20, 144], [40, 162], [60, 176], [80, 192], [100, 206]],
  nai: [[0, 159], [20, 179], [100, 302]],
  kbr: [[0, 53.5], [20, 65.3], [100, 104]],
  nabr: [[0, 80.2], [20, 90.8], [100, 121]],
  pbno32: [[0, 37.5], [20, 54.3], [40, 72.1], [60, 91.6], [80, 111], [100, 133]],
  pbi2: [[0, 0.044], [20, 0.076], [60, 0.19], [100, 0.41]],
  pbcl2: [[0, 0.67], [20, 0.99], [60, 1.98], [100, 3.2]],
  agno3: [[0, 122], [20, 216], [60, 440], [100, 733]],
  naoh: [[0, 42], [20, 109], [60, 174], [100, 337]],
  koh: [[0, 97], [20, 121], [60, 154], [100, 178]],
  lioh: [[0, 12.7], [20, 12.8], [100, 17.5]],
  caoh2: [[0, 0.189], [20, 0.173], [60, 0.121], [100, 0.076]],
  baoh2: [[0, 1.67], [20, 3.89], [60, 20.9], [80, 101]],
  srcl2: [[0, 43.5], [20, 53.8], [60, 81.8], [100, 101]],
  bacl2: [[0, 31.2], [20, 35.8], [60, 46.2], [100, 59.4]],
  cacl2: [[0, 59.5], [20, 74.5], [60, 137], [100, 159]],
  mgcl2: [[0, 52.9], [20, 54.6], [100, 73.3]],
  cucl2: [[0, 68.6], [20, 73.0], [60, 87.6], [100, 110]],
  zncl2: [[0, 342], [20, 395], [100, 614]],
  znso4: [[0, 41.6], [20, 53.8], [60, 75.4], [100, 60.5]],
  mgso4: [[0, 22], [20, 33.7], [60, 54.6], [100, 50.4]],
  na2so4: [[0, 4.9], [20, 19.5], [40, 48.8], [60, 45.3], [100, 42.5]],
  k2so4: [[0, 7.4], [20, 11.1], [60, 18.2], [100, 24.1]],
  na2co3: [[0, 7], [20, 21.5], [40, 49], [60, 46], [100, 45]],
  nahco3: [[0, 6.9], [20, 9.6], [40, 12.7], [60, 16.4]],
  k2co3: [[0, 105], [20, 111], [60, 127], [100, 156]],
  nh4cl: [[0, 29.4], [20, 37.2], [60, 55.3], [100, 77.3]],
  nh4no3: [[0, 118], [20, 192], [60, 421], [100, 871]],
  kmno4: [[0, 2.83], [20, 6.38], [40, 12.6], [60, 22.1]],
  k2cr2o7: [[0, 4.7], [20, 12.3], [60, 45.6], [100, 80]],
  kclo3: [[0, 3.3], [20, 7.3], [60, 24.5], [100, 56.3]],
  feso4: [[0, 15.6], [20, 26.6], [60, 55], [80, 43.6]],
  fecl3: [[0, 74.4], [20, 91.8], [80, 525]],
  niso4: [[0, 26.2], [20, 37.7], [60, 54.4], [100, 76.7]],
  cocl2: [[0, 43.5], [20, 52.9], [60, 93.8], [100, 106]],
  glucosio: [[0, 54], [20, 91], [60, 233], [100, 486]],
  saccarosio: [[0, 179], [20, 204], [60, 287], [100, 487]],
  urea: [[0, 67], [20, 108], [60, 251], [100, 733]],
  'acido-citrico': [[0, 96], [20, 147], [60, 278], [100, 386]],
  'acetato-di-sodio': [[0, 36.2], [20, 46.4], [60, 139], [100, 170]],
};

/** Sali che cristallizzano dall'acqua come idrati: anidro → [idrato, molecole d'acqua]. */
export const HYDRATES = {
  cuso4: ['cuso4-5h2o', 5],
  cocl2: ['cocl2-6h2o', 6],
  caso4: ['caso4-2h2o', 2],
};

/**
 * Acidi e basi in soluzione (25 °C). sa / sb: protoni o ossidrili ceduti come acido o base forte;
 * ka / kb: costanti di dissociazione (prima costante, poi le successive se servono).
 * Fonti: CRC Handbook (Dissociation constants of inorganic and organic acids in aqueous solution).
 */
export const ACID_BASE = {
  hcl: { sa: 1 }, hbr: { sa: 1 }, hi: { sa: 1 }, hno3: { sa: 1 }, hclo4: { sa: 1 }, h3o: { sa: 1 },
  h2so4: { sa: 1, ka: [1.0e-2] },
  nahso4: { ka: [1.0e-2] }, idrogenosolfato: { ka: [1.0e-2] },
  naoh: { sb: 1 }, koh: { sb: 1 }, lioh: { sb: 1 }, rboh: { sb: 1 }, csoh: { sb: 1 }, oh: { sb: 1 },
  caoh2: { sb: 2 }, baoh2: { sb: 2 }, sroh2: { sb: 2 },
  'acido-acetico': { ka: [1.75e-5] }, 'acido-formico': { ka: [1.8e-4] }, 'acido-citrico': { ka: [7.4e-4] },
  'acido-lattico': { ka: [1.4e-4] }, 'acido-ossalico': { ka: [5.6e-2] }, 'acido-benzoico': { ka: [6.3e-5] },
  'acido-ascorbico': { ka: [8.0e-5] }, 'acido-salicilico': { ka: [1.0e-3] },
  hf: { ka: [6.3e-4] }, h3po4: { ka: [6.9e-3] }, h2co3: { ka: [4.5e-7] }, hcn: { ka: [6.2e-10] }, hclo: { ka: [2.9e-8] },
  h2s: { ka: [8.9e-8] }, nh4: { ka: [5.6e-10] }, nh4cl: { ka: [5.6e-10] }, nh4no3: { ka: [5.6e-10] },
  fecl3: { ka: [6.3e-3] }, // l'idrolisi di Fe³⁺ rende acide le sue soluzioni
  nh3: { kb: [1.8e-5] }, na2co3: { kb: [2.1e-4] }, k2co3: { kb: [2.1e-4] }, co3: { kb: [2.1e-4] },
  nahco3: { kb: [2.2e-8] }, hco3: { kb: [2.2e-8] }, 'acetato-di-sodio': { kb: [5.7e-10] }, acetato: { kb: [5.7e-10] },
  na2s: { kb: [1.0e-1] }, kcn: { kb: [1.6e-5] }, nacn: { kb: [1.6e-5] }, ipoclorito: { kb: [3.4e-7] },
};

/** Gas tossici o irritanti: fuori dalla cappa accesa fanno scattare l'allarme. */
export const TOXIC_GASES = ['Cl', 'Br', 'F', 'I', 'no2', 'no', 'so2', 'h2s', 'hcn', 'co', 'nh3', 'hcl', 'hf', 'hbr', 'o3', 'ph3', 'fosgene', 'Hg'];

/** Elementi i cui composti vanno nel contenitore dei metalli pesanti (D.Lgs. 152/2006, tabella dei rifiuti di laboratorio). */
export const HEAVY_METALS = new Set([24, 25, 27, 28, 29, 30, 33, 34, 47, 48, 50, 51, 56, 80, 81, 82, 92]);

/** Sali innocui a bassa concentrazione: le loro soluzioni neutre si possono buttare nel lavandino. */
export const SINK_SAFE = new Set([
  'nacl', 'kcl', 'kno3', 'nano3', 'na2so4', 'k2so4', 'mgso4', 'mgcl2', 'cacl2', 'na2co3', 'nahco3', 'k2co3',
  'nh4cl', 'glucosio', 'saccarosio', 'urea', 'acido-citrico', 'acetato-di-sodio', 'ki', 'kbr', 'nai', 'nabr', 'licl',
  'ione-sodio', 'cloruro', 'acetato', 'co3', 'hco3', 'h2co3', 'o2', 'co2', 'n2',
]);

/** Indicatori (sostanze del gioco, fuori dalla libreria): massa molare e colori. */
export const INDICATORS = {
  // fenolftaleina: incolore fino a pH 8,2, poi rosa-fucsia (pieno sopra 10)
  php: { molar: 318.3, name: { it: 'Fenolftaleina', en: 'Phenolphthalein' }, formula: 'C₂₀H₁₄O₄' },
};

/** Colori della cartina indicatrice universale dal pH 0 al 14 (scala del produttore). */
export const UNIVERSAL_SCALE = [
  '#d6141f', '#e8331f', '#f0592a', '#f4802c', '#f7a823', '#f6cf20', '#e3dc1e', '#8cc63f',
  '#3ea94b', '#1f9472', '#1d7f95', '#245ea6', '#3546a0', '#4b3592', '#5a2b83',
];

/**
 * Prezzi del gioco (euro): reagenti al grammo o al millilitro di soluzione, vetreria, multe.
 * Valori indicativi dei cataloghi per la scuola, arrotondati.
 */
export const PRICES = {
  solidPerGram: 0.04,
  solutionPerMl: 0.01,
  waterPerMl: 0.0005,
  glass: { beaker100: 3, beaker250: 4, flask250: 6, cylinder100: 9, bottle: 6, dropper: 4 },
  fines: { wrongBin: 6, sinkHazard: 10, fire: 15, toxic: 12, explosion: 25, splash: 5, mess: 2 },
};

/**
 * Reagenti dello scaffale: soluzioni pronte (chiave, molarità) e solidi nei barattoli.
 * name: nome sull'etichetta (se diverso da quello della sostanza).
 */
export const SHELF = {
  water: { kind: 'washbottle', water: true },
  hcl01: { kind: 'bottle', solute: 'hcl', molar: 0.1 },
  hcl1: { kind: 'bottle', solute: 'hcl', molar: 1 },
  naoh01: { kind: 'bottle', solute: 'naoh', molar: 0.1 },
  naoh1: { kind: 'bottle', solute: 'naoh', molar: 1 },
  pbno3: { kind: 'bottle', solute: 'pbno32', molar: 0.1 },
  ki01: { kind: 'bottle', solute: 'ki', molar: 0.1 },
  agno3: { kind: 'bottle', solute: 'agno3', molar: 0.1 },
  cuso4sol: { kind: 'bottle', solute: 'cuso4', molar: 0.5 },
  ethanol: { kind: 'bottle', liquid: 'etanolo' },
  vinegar: { kind: 'bottle', solute: 'acido-acetico', molar: 0.8 },
  php: { kind: 'dropper', indicator: 'php' },
  nacl: { kind: 'jar', solid: 'nacl' },
  cuso4: { kind: 'jar', solid: 'cuso4-5h2o' },
  nahco3: { kind: 'jar', solid: 'nahco3' },
  zn: { kind: 'jar', solid: 'Zn' },
  mg: { kind: 'jar', solid: 'Mg' },
};

/** Sali per il saggio alla fiamma: chiave → simbolo del metallo che colora la fiamma. */
export const FLAME_SALTS = { licl: 'Li', nacl: 'Na', kcl: 'K', cacl2: 'Ca', srcl2: 'Sr', bacl2: 'Ba', cucl2: 'Cu' };
