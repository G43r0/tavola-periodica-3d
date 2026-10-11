// Proprietà degli elementi usate dal laboratorio molecolare.
// Riceve i dati di elements.json (così il modulo resta puro e testabile in Node).

/** Livelli di affidabilità del modello a regole. */
export const TIER = {
  MAIN: 1, // gruppi principali: valenza, Lewis e VSEPR affidabili
  UNVERIFIED: 2, // blocchi d e f: valenze dagli stati di ossidazione, struttura non verificata
  UNKNOWN: 3, // Z ≥ 104: chimica sconosciuta (proprietà previste)
};

const METAL_CATEGORIES = new Set(['alkali', 'alkaline-earth', 'transition', 'post-transition', 'lanthanide', 'actinide']);

// Elettronegatività di Pauling assenti in PubChem (CRC Handbook; Rn stima).
const EN_FALLBACK = { Pm: 1.13, Eu: 1.2, Tb: 1.1, Yb: 1.1, Rn: 2.2 };

// Raggi covalenti singoli (pm) mancanti in Cordero 2008: Pyykkö & Atsumi 2009 (valori teorici).
const COV_FALLBACK = {
  97: 168, 98: 168, 99: 165, 100: 167, 101: 173, 102: 176, 103: 161, 104: 157, 105: 149, 106: 143,
  107: 141, 108: 134, 109: 129, 110: 128, 111: 121, 112: 122, 113: 136, 114: 143, 115: 162, 116: 175,
  117: 165, 118: 157,
};

// Raggi ionici (pm), Shannon 1976, numero di coordinazione 6 (N³⁻: coordinazione 4).
const IONIC_RADII = {
  'Li+1': 76, 'Na+1': 102, 'K+1': 138, 'Rb+1': 152, 'Cs+1': 167, 'Ag+1': 115, 'Tl+1': 150, 'Cu+1': 77,
  'Be+2': 45, 'Mg+2': 72, 'Ca+2': 100, 'Sr+2': 118, 'Ba+2': 135, 'Ra+2': 148, 'Zn+2': 74, 'Cd+2': 95,
  'Fe+2': 78, 'Co+2': 74.5, 'Ni+2': 69, 'Cu+2': 73, 'Mn+2': 83, 'Pb+2': 119, 'Hg+2': 102, 'Sn+2': 118,
  'Al+3': 53.5, 'Ga+3': 62, 'In+3': 80, 'Fe+3': 64.5, 'Cr+3': 61.5, 'Sc+3': 74.5, 'Y+3': 90, 'La+3': 103.2,
  'Ti+4': 60.5, 'Sn+4': 69, 'Pb+4': 77.5, 'Zr+4': 72,
  'F-1': 133, 'Cl-1': 181, 'Br-1': 196, 'I-1': 220, 'H-1': 140,
  'O-2': 140, 'S-2': 184, 'Se-2': 198, 'Te-2': 221, 'N-3': 146,
};

/** Legami massimi (anche come ione) per i gruppi principali. */
function mainGroupMaxBonds(z, group, period) {
  if (z === 1) return 1;
  if (z === 2 || z === 10 || z === 18) return 0;
  if (group === 1) return 1;
  if (group === 2) return 2;
  if (group === 13) return period === 2 ? 4 : 6;
  if (group === 14) return period === 2 ? 4 : 6;
  if (group === 15) return period === 2 ? 4 : 6;
  if (group === 16) return period === 2 ? 3 : 6;
  if (group === 17) return period === 2 ? 1 : 7;
  if (z === 36) return 2; // Kr (KrF₂)
  if (z === 54) return 8; // Xe (XeO₄)
  if (z === 86) return 6;
  return 0;
}

/** Valenze "normali" (atomo neutro) per i gruppi principali, dalla più comune. */
function mainGroupValences(z, group, period) {
  if (z === 1) return [1];
  if (group === 1) return [1];
  if (group === 2) return [2];
  if (group === 13) return z === 81 ? [1, 3] : [3];
  if (group === 14) return z === 50 || z === 82 ? [2, 4] : [4];
  if (group === 15) return period === 2 ? [3] : [3, 5];
  if (group === 16) return period === 2 ? [2] : z === 84 ? [2, 4] : [2, 4, 6];
  if (group === 17) return period === 2 ? [1] : z === 85 ? [1] : [1, 3, 5, 7];
  if (group === 18) return z === 36 ? [0, 2] : z === 54 ? [0, 2, 4, 6] : z === 86 ? [0, 2] : [0];
  return [0];
}

function valenceElectrons(z, group) {
  if (z === 1) return 1;
  if (z === 2) return 2;
  if (group <= 2) return group;
  return group - 10;
}

const positiveStates = (el) =>
  [...new Set((el.oxidationStates || []).map((s) => Number(s.replace('−', '-'))).filter((n) => n > 0))].sort((a, b) => a - b);

/**
 * @param {object[]} elements array di elements.json
 * @param {Record<string,{color:string}>} categoryColors colori di riserva per categoria
 */
export function createLabElements(elements, categoryColors = {}) {
  const byZ = new Map();
  for (const el of elements) {
    const tier = el.z >= 104 ? TIER.UNKNOWN : el.block === 'd' || el.block === 'f' ? TIER.UNVERIFIED : TIER.MAIN;
    const category = el.category === 'unknown' ? el.predictedCategory || 'unknown' : el.category;
    let valences;
    let maxBonds;
    let V;
    if (tier === TIER.MAIN) {
      valences = mainGroupValences(el.z, el.group, el.period);
      maxBonds = mainGroupMaxBonds(el.z, el.group, el.period);
      V = valenceElectrons(el.z, el.group);
    } else {
      const states = positiveStates(el);
      valences = states.length ? states : [0];
      maxBonds = Math.max(...valences);
      // nel modello semplice gli elettroni "disponibili" di un metallo d/f sono quelli che può impegnare
      V = maxBonds;
    }
    let en = el.electronegativity;
    let enEstimated = false;
    if (en == null && EN_FALLBACK[el.symbol]) {
      en = EN_FALLBACK[el.symbol];
      enEstimated = true;
    }
    if (en == null && tier === TIER.UNKNOWN) {
      en = 1.5; // valore di comodo per le proprietà sconosciute
      enEstimated = true;
    }
    let rCov = el.covalentRadiusPm;
    let rCovEstimated = false;
    if (rCov == null) {
      rCov = COV_FALLBACK[el.z] ?? 150;
      rCovEstimated = true;
    }
    byZ.set(el.z, {
      z: el.z,
      symbol: el.symbol,
      name: el.name,
      group: el.group,
      period: el.period,
      block: el.block,
      category,
      tier,
      metal: METAL_CATEGORIES.has(category),
      nobleGas: category === 'noble-gas',
      V,
      valences,
      maxBonds,
      en,
      enEstimated,
      rCov,
      rCovEstimated,
      mass: el.atomicMass.value,
      massIsNumber: el.atomicMass.isMassNumber,
      color: el.cpkColor ? `#${el.cpkColor.replace('#', '')}` : categoryColors[el.category]?.color ?? '#8a96a8',
    });
  }
  return {
    get: (z) => byZ.get(z),
    all: () => [...byZ.values()],
    bySymbol: new Map([...byZ.values()].map((e) => [e.symbol, e])),
  };
}

/** Raggio ionico (pm) per uno ione, se tabulato. */
export function ionicRadius(info, charge) {
  if (!charge) return null;
  return IONIC_RADII[`${info.symbol}${charge > 0 ? '+' : '-'}${Math.abs(charge)}`] ?? null;
}

/** Carica tipica dello ione monoatomico di un elemento (es. Na → +1, O → −2), o null. */
export function typicalIonCharge(info) {
  if (info.tier === 1) {
    if (info.metal) return info.group <= 2 ? info.group : info.group === 13 ? (info.z === 81 ? 1 : 3) : info.valences[0];
    if (info.nobleGas) return null;
    if (info.z === 1) return -1;
    return -(8 - info.V);
  }
  return info.metal ? info.valences.at(-1) : null;
}
