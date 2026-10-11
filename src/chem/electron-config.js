// Configurazione elettronica dello stato fondamentale.
// Regola di Madelung (aufbau) + eccezioni note (NIST Atomic Spectra Database).
// Modulo puro: usato sia dallo script di build dei dati sia dall'interfaccia
// (e, nella fase 2, dal visualizzatore 3D per i numeri quantici).

export const L_LETTERS = ['s', 'p', 'd', 'f'];
export const SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

// Ordine di riempimento (n + l crescente, a parità n crescente)
export const MADELUNG_ORDER = [
  '1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p',
  '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p',
];

const CAPACITY = { s: 2, p: 6, d: 10, f: 14 };

// Eccezioni alla regola di Madelung: sovrascrivono l'occupazione dei sottolivelli.
// Valori per Z >= 104 sono previsioni teoriche.
const EXCEPTIONS = {
  24: { '4s': 1, '3d': 5 },            // Cr
  29: { '4s': 1, '3d': 10 },           // Cu
  41: { '5s': 1, '4d': 4 },            // Nb
  42: { '5s': 1, '4d': 5 },            // Mo
  44: { '5s': 1, '4d': 7 },            // Ru
  45: { '5s': 1, '4d': 8 },            // Rh
  46: { '5s': 0, '4d': 10 },           // Pd
  47: { '5s': 1, '4d': 10 },           // Ag
  57: { '4f': 0, '5d': 1 },            // La
  58: { '4f': 1, '5d': 1 },            // Ce
  64: { '4f': 7, '5d': 1 },            // Gd
  78: { '6s': 1, '5d': 9 },            // Pt
  79: { '6s': 1, '5d': 10 },           // Au
  89: { '5f': 0, '6d': 1 },            // Ac
  90: { '5f': 0, '6d': 2 },            // Th
  91: { '5f': 2, '6d': 1 },            // Pa
  92: { '5f': 3, '6d': 1 },            // U
  93: { '5f': 4, '6d': 1 },            // Np
  96: { '5f': 7, '6d': 1 },            // Cm
  103: { '6d': 0, '7p': 1 },           // Lr (effetti relativistici)
};

const NOBLE_GASES = [
  { z: 2, symbol: 'He' },
  { z: 10, symbol: 'Ne' },
  { z: 18, symbol: 'Ar' },
  { z: 36, symbol: 'Kr' },
  { z: 54, symbol: 'Xe' },
  { z: 86, symbol: 'Rn' },
];

/** @returns {{n:number,l:number,label:string,electrons:number}[]} ordinati per n, poi l */
export function subshells(z) {
  const occ = {};
  let left = z;
  for (const label of MADELUNG_ORDER) {
    if (left <= 0) break;
    const cap = CAPACITY[label[1]];
    const e = Math.min(cap, left);
    occ[label] = e;
    left -= e;
  }
  const exc = EXCEPTIONS[z];
  if (exc) Object.assign(occ, exc);

  return Object.entries(occ)
    .filter(([, e]) => e > 0)
    .map(([label, electrons]) => ({
      n: Number(label[0]),
      l: L_LETTERS.indexOf(label[1]),
      label,
      electrons,
    }))
    .sort((a, b) => a.n - b.n || a.l - b.l);
}

/** Elettroni per guscio (K, L, M, ...) */
export function shells(z) {
  const out = [];
  for (const s of subshells(z)) out[s.n - 1] = (out[s.n - 1] || 0) + s.electrons;
  return Array.from(out, (v) => v || 0);
}

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const toSuperscript = (num) => String(num).replace(/\d/g, (d) => SUP[d]);

const fmt = (list) => list.map((s) => `${s.label}${toSuperscript(s.electrons)}`).join(' ');

export function fullConfiguration(z) {
  return fmt(subshells(z));
}

export function shortConfiguration(z) {
  const core = [...NOBLE_GASES].reverse().find((g) => g.z < z);
  if (!core) return fullConfiguration(z);
  const coreLabels = new Set(subshells(core.z).map((s) => s.label));
  // gli orbitali del nocciolo restano pieni per tutti gli elementi
  const valence = subshells(z).filter((s) => !coreLabels.has(s.label) || isOverfilled(s, core.z));
  return `[${core.symbol}] ${fmt(valence)}`.trim();
}

function isOverfilled(sub, coreZ) {
  const coreSub = subshells(coreZ).find((s) => s.label === sub.label);
  return coreSub && sub.electrons !== coreSub.electrons;
}

/** Configurazione in forma ASCII (es. "[Ar] 3d10 4s2") per ricerche ed export */
export function plainConfiguration(text) {
  return text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)));
}
