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
  // gas a 1 atm (CRC Handbook, «Solubility of selected gases in water»): poco solubili, ma quanto basta perché la CO₂
  // gorgogliata nell'acqua di calce la intorbidi e il cloro sposti il bromo dai bromuri
  co2: [[0, 0.335], [20, 0.169], [40, 0.097], [60, 0.058]],
  Cl: [[10, 0.997], [20, 0.729], [40, 0.459], [60, 0.33]],
  O: [[0, 0.0069], [20, 0.00434], [40, 0.0033], [60, 0.0028]],
  N: [[0, 0.0029], [20, 0.0019], [60, 0.00105]],
  H: [[0, 0.000192], [20, 0.00016], [60, 0.000118]],
  h2s: [[0, 0.71], [20, 0.385], [40, 0.236]],
  so2: [[0, 22.8], [20, 10.6], [40, 5.4]],
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
  glass: { beaker100: 3, beaker250: 4, flask250: 6, cylinder100: 9, bottle: 6, bottleClear: 6, dropper: 4, jarGlass: 4, jarAmber: 5, jarOil: 5 },
  fines: { wrongBin: 6, sinkHazard: 10, fire: 15, toxic: 12, explosion: 25, splash: 5, mess: 2 },
};

/**
 * Reagenti dello scaffale: soluzioni pronte (chiave, molarità), liquidi e solidi. Il contenitore, il colore del tappo e
 * l'etichetta li sceglie stock.js dai dati della sostanza.
 * ghs / h / signal: pittogrammi, indicazioni di pericolo e avvertenza delle schede di sicurezza dei fornitori per la
 * scuola (Merck/Sigma-Aldrich, Carlo Erba) secondo il regolamento CLP, alla concentrazione dello scaffale: una
 * soluzione diluita ha meno pericoli della sostanza pura (HCl 1 M è solo «corrosivo per i metalli», H290).
 * La fenolftaleina è quella in commercio, all'1 % in etanolo; nel gioco i pochi millilitri di etanolo non contano.
 * name: nome sull'etichetta, se diverso da quello della sostanza (HCl in acqua è l'acido cloridrico).
 */
const HCL_AQ = { it: 'Acido cloridrico', en: 'Hydrochloric acid' };
/** Nomi delle sostanze sciolte in acqua, se diversi da quelli della sostanza pura (HCl gas → acido cloridrico). */
export const AQUEOUS_NAMES = { hcl: HCL_AQ };
export const SHELF = {
  water: { water: true, ghs: [], h: [] },
  hcl01: { solute: 'hcl', molar: 0.1, name: HCL_AQ, ghs: ['GHS05'], h: ['H290'], signal: 'warning' },
  hcl1: { solute: 'hcl', molar: 1, name: HCL_AQ, ghs: ['GHS05'], h: ['H290'], signal: 'warning' },
  naoh01: { solute: 'naoh', molar: 0.1, ghs: ['GHS05'], h: ['H290'], signal: 'warning' },
  naoh1: { solute: 'naoh', molar: 1, ghs: ['GHS05'], h: ['H290', 'H314'], signal: 'danger' },
  pbno3: { solute: 'pbno32', molar: 0.1, ghs: ['GHS08', 'GHS09'], h: ['H360Df', 'H373', 'H410'], signal: 'danger' },
  ki01: { solute: 'ki', molar: 0.1, ghs: [], h: [] },
  agno3: { solute: 'agno3', molar: 0.1, ghs: ['GHS09'], h: ['H410'], signal: 'warning' },
  cuso4sol: { solute: 'cuso4', molar: 0.5, ghs: ['GHS09'], h: ['H410'], signal: 'warning' },
  ethanol: { liquid: 'etanolo', ghs: ['GHS02', 'GHS07'], h: ['H225', 'H319'], signal: 'danger' },
  vinegar: { solute: 'acido-acetico', molar: 0.8, ghs: [], h: [] },
  php: { indicator: 'php', ghs: ['GHS02', 'GHS07', 'GHS08'], h: ['H225', 'H319', 'H341', 'H350', 'H361f'], signal: 'danger' },
  nacl: { solid: 'nacl', ghs: [], h: [] },
  cuso4: { solid: 'cuso4-5h2o', ghs: ['GHS07', 'GHS09'], h: ['H302', 'H315', 'H319', 'H410'], signal: 'warning' },
  nahco3: { solid: 'nahco3', ghs: [], h: [] },
  zn: { solid: 'Zn', ghs: ['GHS09'], h: ['H410'], signal: 'warning' },
  mg: { solid: 'Mg', ghs: ['GHS02'], h: ['H228', 'H251', 'H261'], signal: 'danger' },
  // metalli alcalini: sotto olio di paraffina, che li separa dall'aria e dall'umidità; con l'acqua liberano idrogeno
  na: { solid: 'Na', oil: true, ghs: ['GHS02', 'GHS05'], h: ['H260', 'H314'], signal: 'danger' },
  k: { solid: 'K', oil: true, ghs: ['GHS02', 'GHS05'], h: ['H260', 'H314'], signal: 'danger' },
  li: { solid: 'Li', oil: true, ghs: ['GHS02', 'GHS05'], h: ['H260', 'H314'], signal: 'danger' },
};

/**
 * Armadio dei reagenti della scuola: le soluzioni, i solidi e i liquidi di un laboratorio scolastico, con le
 * concentrazioni d'uso. Scelti per coprire le reazioni del catalogo che il simulatore sa fare: con lo scaffale se ne
 * fanno 383, contro le 144 dello scaffale da solo (coverage.js; la tabella per gruppo con node scripts/coverage.mjs);
 * un test ne fissa il minimo per gruppo. Nel Laboratorio libero si prendono dal magazzino; nella Carriera si
 * sbloccheranno capitolo per capitolo. Contenitore, tappo ed etichetta li sceglie stock.js; i pericoli sono dedotti
 * dai dati (indicativi), come per il magazzino.
 */
export const CABINET = {
  // acidi
  h2so4: { solute: 'h2so4', molar: 1 },
  hno3: { solute: 'hno3', molar: 1 },
  h3po4: { solute: 'h3po4', molar: 1 },
  citric: { solid: 'acido-citrico' },
  oxalic: { solid: 'acido-ossalico' },
  // basi
  nh3: { solute: 'nh3', molar: 1, name: { it: 'Ammoniaca', en: 'Ammonia solution' } },
  koh: { solute: 'koh', molar: 1 },
  limewater: { solute: 'caoh2', molar: 0.02, name: { it: 'Acqua di calce', en: 'Limewater' } },
  // sali in soluzione
  bacl2: { solute: 'bacl2', molar: 0.1 },
  cacl2: { solute: 'cacl2', molar: 0.1 },
  fecl3: { solute: 'fecl3', molar: 0.1 },
  feso4: { solute: 'feso4', molar: 0.1 },
  kbr: { solute: 'kbr', molar: 0.1 },
  na2co3sol: { solute: 'na2co3', molar: 0.1 },
  na2so4: { solute: 'na2so4', molar: 0.1 },
  thio: { solute: 'na2s2o3', molar: 0.1 },
  kscn: { solute: 'kscn', molar: 0.1 },
  k2cro4: { solute: 'k2cro4', molar: 0.1 },
  znso4: { solute: 'znso4', molar: 0.1 },
  mgso4: { solute: 'mgso4', molar: 0.1 },
  niso4: { solute: 'niso4', molar: 0.1 },
  cocl2: { solute: 'cocl2', molar: 0.1 },
  kmno4sol: { solute: 'kmno4', molar: 0.02 },
  bleach: { solute: 'naclo', molar: 0.7, name: { it: 'Candeggina (ipoclorito di sodio)', en: 'Bleach (sodium hypochlorite)' } },
  h2o2: { solute: 'h2o2', molar: 0.9, name: { it: 'Acqua ossigenata 3 %', en: 'Hydrogen peroxide 3 %' } },
  // solidi
  fe: { solid: 'Fe' },
  cu: { solid: 'Cu' },
  al: { solid: 'Al' },
  sulfur: { solid: 'S' },
  carbon: { solid: 'C' },
  iodine: { solid: 'I' },
  mno2: { solid: 'mno2' },
  cuo: { solid: 'cuo' },
  caco3: { solid: 'caco3' },
  cao: { solid: 'cao' },
  na2co3: { solid: 'na2co3' },
  kmno4: { solid: 'kmno4' },
  nh4cl: { solid: 'nh4cl' },
  kno3: { solid: 'kno3' },
  kcl: { solid: 'kcl' },
  licl: { solid: 'licl' },
  srcl2: { solid: 'srcl2' },
  sio2: { solid: 'sio2' },
  glucose: { solid: 'glucosio' },
  sucrose: { solid: 'saccarosio' },
  // liquidi
  acetone: { liquid: 'acetone' },
  etac: { liquid: 'acetato-di-etile', name: { it: 'Acetato di etile', en: 'Ethyl acetate' } },
  glycerol: { liquid: 'glicerolo' },
};

/** Olio dei barattoli dei metalli alcalini: l'olio di paraffina è una miscela di alcani; nel gioco è il decano. */
export const OIL = { key: 'decano', name: { it: 'Olio di paraffina', en: 'Paraffin oil' } };

/** Sostanze che la luce decompone: stanno in vetro ambrato (scuro). */
export const LIGHT_SENSITIVE = ['agno3', 'kmno4', 'h2o2', 'hno3', 'ki', 'i2', 'br2', 'agcl', 'agbr', 'agi'];

/**
 * Potenziali standard di riduzione dei metalli (V, 25 °C, coppia Mⁿ⁺/M), CRC Handbook of Chemistry and Physics,
 * «Electrochemical series». Ordinano la serie di attività: un metallo sposta dai sali quelli con il potenziale più alto
 * e libera idrogeno dagli acidi non ossidanti solo se il suo potenziale è negativo.
 */
export const REDUCTION_POTENTIALS = {
  Li: -3.04, K: -2.93, Ba: -2.91, Ca: -2.87, Na: -2.71, Mg: -2.37, Al: -1.66, Mn: -1.19, Zn: -0.76, Cr: -0.74,
  Fe: -0.45, Cd: -0.4, Co: -0.28, Ni: -0.26, Sn: -0.14, Pb: -0.13, Cu: 0.34, Ag: 0.8, Hg: 0.85, Pd: 0.95, Pt: 1.18,
  Au: 1.5,
};

/** Sali per il saggio alla fiamma: chiave → simbolo del metallo che colora la fiamma. */
export const FLAME_SALTS = { licl: 'Li', nacl: 'Na', kcl: 'K', cacl2: 'Ca', srcl2: 'Sr', bacl2: 'Ba', cucl2: 'Cu' };
