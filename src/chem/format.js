// Formattazione numeri e grandezze in italiano.

const MINUS = '−';
const cache = new Map();

function formatter(minFrac, maxFrac) {
  const key = `${minFrac}:${maxFrac}`;
  if (!cache.has(key)) {
    cache.set(key, new Intl.NumberFormat('it-IT', { minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac }));
  }
  return cache.get(key);
}

/** Numero di cifre decimali con cui è scritto un valore (gestisce anche 8.988e-5). */
export function decimalsOf(value) {
  const [mant, exp] = String(value).toLowerCase().split('e');
  const frac = mant.includes('.') ? mant.split('.')[1].length : 0;
  return Math.max(0, frac - Number(exp || 0));
}

export function fmtNumber(value, maxFrac = 3, minFrac = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return formatter(minFrac, maxFrac).format(value).replace('-', MINUS);
}

/** Massa atomica: "[97]" resta tale, "55.845" → "55,845" (conserva le cifre significative). */
export function fmtMass(atomicMass) {
  return atomicMass.text.replace('.', ',');
}

/** Temperatura in K → { c: "1538", k: "1811" } con la stessa precisione del dato. */
export function fmtTemperature(kelvin) {
  if (kelvin === null || kelvin === undefined) return null;
  const d = Math.min(decimalsOf(kelvin), 2);
  return {
    c: fmtNumber(kelvin - 273.15, d, d),
    k: fmtNumber(kelvin, d, d),
  };
}

/** Densità: per i gas si usa g/L (più leggibile), per solidi e liquidi g/cm³. */
export function fmtDensity(el) {
  const d = el.densityGcm3;
  if (d === null || d === undefined) return null;
  if (el.state === 'gas') {
    return { value: fmtNumber(d * 1000, 4), unit: 'g/L', note: 'a 0 °C e 1 atm' };
  }
  return { value: fmtNumber(d, 3), unit: 'g/cm³', note: el.densityNote };
}

const EV_TO_KJMOL = 96.485332;

export function fmtIonization(ev) {
  if (ev === null || ev === undefined) return null;
  return { ev: fmtNumber(ev, 4), kj: fmtNumber(ev * EV_TO_KJMOL, 1, 1) };
}

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', m: 'ᵐ' };
export const superscript = (s) => String(s).replace(/[0-9m]/g, (c) => SUP[c]);

/** Notazione isotopica: ⁵⁶Fe, ⁹⁹ᵐTc */
export const isotopeNotation = (iso, symbol) => `${superscript(iso.label)}${symbol}`;

/** Nome dell'isotopo: "ferro-56" */
export const isotopeName = (iso, name) => `${name.toLowerCase()}-${iso.label}`;

export function fmtAbundance(iso) {
  if (iso.abundance !== null) {
    // stessa precisione del valore IUPAC (es. 99,999866 % per ⁴He)
    const d = decimalsOf(iso.abundance);
    return `${fmtNumber(iso.abundance, d, d)} %`;
  }
  return iso.trace ? 'tracce' : 'artificiale';
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Normalizza per la ricerca: minuscolo, senza accenti. */
export const normalize = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
