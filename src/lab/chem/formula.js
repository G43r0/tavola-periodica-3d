// Lettura delle formule chimiche scritte o incollate dall'utente.
// Accetta: H2SO4, Ca(OH)2, K4[Fe(CN)6], CuSO4·5H2O (idrati con · • * .), coefficienti (2H2O),
// più specie separate da + (2 H2 + O2), cariche (NH4+, SO4^2-, SO4(2-), SO4 2-, Fe3+, O2-),
// pedici e apici Unicode (H₂O, SO₄²⁻). Le equazioni (→, ->) vengono lette solo nel lato dei reagenti.

import { createT } from '../../i18n/index.js';

const t = createT({
  it: {
    unclosed: 'Parentesi «{ch}» non chiusa.',
    notSymbol: '«{s}» non è il simbolo di un elemento.',
    zeroSub: 'Un pedice non può essere zero.',
    capital: 'I simboli degli elementi iniziano con la maiuscola (es. NaCl, non nacl).',
    misplaced: 'Numero fuori posto vicino a «{s}».',
    badChar: 'Carattere non valido: «{ch}».',
    missing: 'Parentesi non chiusa: manca «{end}».',
    write: 'Scrivi una formula.',
    zeroCoef: 'Il coefficiente non può essere zero.',
    beforeCharge: 'Manca la formula prima della carica.',
    oneElement: 'Scrivi almeno un elemento.',
  },
  en: {
    unclosed: 'Bracket «{ch}» not closed.',
    notSymbol: '«{s}» is not the symbol of an element.',
    zeroSub: 'A subscript cannot be zero.',
    capital: 'Element symbols start with a capital letter (e.g. NaCl, not nacl).',
    misplaced: 'Misplaced number near «{s}».',
    badChar: 'Invalid character: «{ch}».',
    missing: 'Bracket not closed: «{end}» is missing.',
    write: 'Type a formula.',
    zeroCoef: 'The coefficient cannot be zero.',
    beforeCharge: 'The formula is missing before the charge.',
    oneElement: 'Type at least one element.',
  },
  eli6: {
    capital: 'Le sigle degli elementi iniziano con la lettera maiuscola: NaCl, non nacl.',
    write: 'Scrivi il nome o la formula di una sostanza.',
  },
});

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUB_OUT = (n) => String(n).replace(/\d/g, (d) => SUB[d]);
const SUP_OUT = (s) => s.replace(/\d/g, (d) => SUP[d]).replace('+', '⁺').replace('-', '⁻');
const HYDRATE = /[·•∙⋅*]/;

/** Riporta pedici, apici e segni tipografici a caratteri semplici (gli apici diventano "^carica"). */
export function normalizeFormulaText(text) {
  let s = String(text)
    .replace(/[−–—]/g, '-')
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/[₀-₉]/g, (c) => String(SUB.indexOf(c)))
    .trim();
  // apici: ²⁻ → ^2-, ⁺ → ^+
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]+/g, (m) => {
    const digits = [...m].filter((c) => SUP.includes(c)).map((c) => SUP.indexOf(c)).join('');
    const signs = [...m].filter((c) => c === '⁺' || c === '⁻').map((c) => (c === '⁺' ? '+' : '-')).join('');
    return `^${digits}${signs}`;
  });
  return s;
}

/** Divide l'eventuale equazione e le specie separate da "+". */
function splitSpecies(s) {
  let note = null;
  const arrow = s.search(/→|⟶|->|=>|⇌|<=>/);
  if (arrow >= 0) {
    s = s.slice(0, arrow).trim();
    note = 'equation';
  }
  const parts = [];
  for (const chunk of s.split(/\s+\+\s+/)) {
    // "H2+O2": "+" tra due specie (seguito da una cifra, una maiuscola o una parentesi) e non in fondo
    let start = 0;
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] !== '+' || i === chunk.length - 1) continue;
      const before = chunk[i - 1];
      const after = chunk[i + 1];
      // "SO4^2+", "(2+)" e "NH4+ Cl-" restano cariche
      if (before === '^' || before === '(' || !after || !/[0-9A-Z([]/.test(after)) continue;
      parts.push(chunk.slice(start, i).trim());
      start = i + 1;
    }
    parts.push(chunk.slice(start).trim());
  }
  // specie separate solo da spazi ("NH4+ Cl-", "NaCl H2O"); "2 H2O", "SO4 2-" e "Ca (OH)2" restano unite
  const out = [];
  for (const p of parts) {
    let cur = '';
    for (const tok of p.split(/\s+/)) {
      if (cur && /^[A-Z]/.test(tok) && !/^\d+$/.test(cur.split(' ').at(-1))) {
        out.push(cur);
        cur = tok;
      } else cur = cur ? `${cur} ${tok}` : tok;
    }
    out.push(cur);
  }
  return { parts: out.filter(Boolean), note };
}

/** Separa la carica finale. Restituisce { body, charge }. */
function splitCharge(text) {
  let m = text.match(/^(.*?)\s*\^\s*\(?([+-])(\d+)\)?$/); // SO4^-2
  if (m) return { body: m[1], charge: (m[2] === '+' ? 1 : -1) * Number(m[3]), explicit: true };
  m = text.match(/^(.*?)\s*\^\s*\(?(\d*)([+-]+)\)?$/) // SO4^2-, Fe^3+, SO4^(2-)
    ?? text.match(/^(.*?)\s*\((\d*)([+-])\)$/) // SO4(2-)
    ?? text.match(/^(.*\S)\s+(\d*)([+-]+)$/); // SO4 2-
  if (m) {
    const n = m[2] ? Number(m[2]) : m[3].length;
    return { body: m[1], charge: (m[3][0] === '+' ? 1 : -1) * n, explicit: true };
  }
  m = text.match(/^(.*[A-Za-z0-9)\]])([+-])(\d+)$/); // SO4-2
  if (m) return { body: m[1], charge: (m[2] === '+' ? 1 : -1) * Number(m[3]), explicit: true };
  m = text.match(/^(.*?)([+-]+)$/); // NH4+, Fe+++, Fe3+, O2-
  if (m && m[1]) {
    const signs = m[2];
    const sign = signs[0] === '+' ? 1 : -1;
    // ione monoatomico scritto senza separatore (Fe3+, O2-, Al3+): le cifre sono la carica
    const mono = m[1].match(/^([A-Z][a-z]?)(\d+)$/);
    if (mono && signs.length === 1) return { body: mono[1], charge: sign * Number(mono[2]), explicit: false, monoGuess: true };
    return { body: m[1], charge: sign * signs.length, explicit: false };
  }
  return { body: text, charge: 0 };
}

/**
 * Legge il corpo di una formula (senza coefficiente iniziale, idrati e carica).
 * @returns {{counts: Map<string, number>, pretty: string, tokens: {symbol:string, count:number}[]}}
 */
function parseBody(body, isSymbol) {
  let i = 0;
  const tokens = [];
  const readCount = () => {
    const m = body.slice(i).match(/^\d+/);
    if (!m) return 1;
    i += m[0].length;
    return Number(m[0]);
  };
  const close = { '(': ')', '[': ']', '{': '}' };
  const group = (end) => {
    const counts = new Map();
    let pretty = '';
    while (i < body.length) {
      const ch = body[i];
      if (ch === ' ') {
        i++;
        continue;
      }
      if (end && ch === end) return { counts, pretty };
      if (close[ch]) {
        i++;
        const inner = group(close[ch]);
        if (body[i] !== close[ch]) throw new FormulaError(t('unclosed', { ch }));
        i++;
        const n = readCount();
        for (const [s, c] of inner.counts) counts.set(s, (counts.get(s) || 0) + c * n);
        pretty += `${ch}${inner.pretty}${close[ch]}${n > 1 ? SUB_OUT(n) : ''}`;
        continue;
      }
      if (/[)\]}]/.test(ch)) throw new FormulaError(`Parentesi «${ch}» in più.`);
      if (/[A-Z]/.test(ch)) {
        const two = body.slice(i, i + 2);
        let sym = null;
        if (/^[A-Z][a-z]$/.test(two) && isSymbol(two)) sym = two;
        else if (isSymbol(ch)) sym = ch;
        if (!sym) {
          const guess = /^[A-Z][a-z]$/.test(two) ? two : ch;
          throw new FormulaError(t('notSymbol', { s: guess }));
        }
        i += sym.length;
        if (/[a-z]/.test(body[i] ?? '')) throw new FormulaError(t('notSymbol', { s: `${sym}${body[i]}` }));
        const n = readCount();
        if (n === 0) throw new FormulaError(t('zeroSub'));
        counts.set(sym, (counts.get(sym) || 0) + n);
        tokens.push({ symbol: sym, count: n });
        pretty += `${sym}${n > 1 ? SUB_OUT(n) : ''}`;
        continue;
      }
      if (/[a-z]/.test(ch)) throw new FormulaError(t('capital'));
      if (/\d/.test(ch)) throw new FormulaError(t('misplaced', { s: body.slice(i) }));
      throw new FormulaError(t('badChar', { ch }));
    }
    if (end) throw new FormulaError(t('missing', { end }));
    return { counts, pretty };
  };
  const res = group(null);
  return { ...res, tokens };
}

export class FormulaError extends Error {}

/** Coefficiente iniziale ("2H2O" → 2, "H2O"). */
function splitCoefficient(text) {
  const m = text.match(/^(\d+)\s*(?=[A-Z([{])/);
  if (!m) return { coef: 1, rest: text };
  return { coef: Number(m[1]), rest: text.slice(m[0].length) };
}

/**
 * Legge un testo con una o più formule.
 * @param {string} text
 * @param {(s:string)=>boolean} isSymbol il simbolo esiste?
 * @returns {{ok:true, species:object[], note:string|null} | {ok:false, error:string}}
 *   species: { coef, counts: Map(simbolo → numero), charge, pretty, text, parts?: species[] (idrati), suspicious }
 */
export function parseFormula(text, isSymbol) {
  const clean = normalizeFormulaText(text);
  if (!clean) return { ok: false, error: t('write') };
  const { parts, note } = splitSpecies(clean);
  if (!parts.length) return { ok: false, error: t('write') };
  try {
    const species = parts.map((p) => parseSpecies(p, isSymbol));
    return { ok: true, species, note };
  } catch (err) {
    if (err instanceof FormulaError) return { ok: false, error: err.message };
    throw err;
  }
}

function parseSpecies(text, isSymbol) {
  const { coef, rest } = splitCoefficient(text);
  if (coef === 0) throw new FormulaError(t('zeroCoef'));
  // idrati: CuSO4·5H2O (anche "." tra due formule)
  const pieces = rest.split(HYDRATE).flatMap((p) => p.split(/(?<=[A-Za-z0-9)\]])\.(?=\d*[A-Z(])/));
  if (pieces.length > 1) {
    const sub = pieces.map((p) => parseSpecies(p.trim(), isSymbol));
    const counts = new Map();
    for (const s of sub) for (const [k, v] of s.counts) counts.set(k, (counts.get(k) || 0) + v * s.coef);
    return {
      coef,
      counts,
      charge: sub.reduce((t, s) => t + s.charge * s.coef, 0),
      pretty: sub.map((s) => `${s.coef > 1 ? s.coef : ''}${s.pretty}`).join('·'),
      text: rest,
      parts: sub,
    };
  }
  const { body, charge, monoGuess } = splitCharge(rest.trim());
  if (!body.trim()) throw new FormulaError(t('beforeCharge'));
  const { counts, pretty, tokens } = parseBody(body.trim(), isSymbol);
  if (!counts.size) throw new FormulaError(t('oneElement'));
  // indizi che il testo sia uno SMILES più che una formula (CC, OO, C1CCCCC1)
  const suspicious = tokens.some((t, k) => k > 0 && t.symbol === tokens[k - 1].symbol && t.count === 1 && tokens[k - 1].count === 1)
    || /[A-Za-z]1(?!\d)/.test(body);
  return {
    coef,
    counts,
    charge,
    pretty: `${pretty}${charge ? SUP_OUT(`${Math.abs(charge) > 1 ? Math.abs(charge) : ''}${charge > 0 ? '+' : '-'}`) : ''}`,
    text: rest,
    monoGuess: Boolean(monoGuess),
    suspicious,
  };
}

/** Le specie di un testo («2 H2 + acqua» → ["2 H2", "acqua"]) e l'eventuale nota sull'equazione. */
export function splitFormulaList(text) {
  return splitSpecies(normalizeFormulaText(text));
}

/** Numero totale di atomi di una specie (senza il coefficiente). */
export const speciesAtomCount = (sp) => [...sp.counts.values()].reduce((s, n) => s + n, 0);

/**
 * Gli atomi di una specie ({z, charge: 0} uno per atomo), o null se sono più di `max`: una formula come C1000000000
 * non deve diventare un elenco di un miliardo di oggetti solo per l'anteprima.
 * @param {(symbol: string) => number} zOf
 */
export function speciesAtoms(sp, zOf, max) {
  if (!(speciesAtomCount(sp) <= max)) return null;
  const atoms = [];
  for (const [sym, n] of sp.counts) for (let k = 0; k < n; k++) atoms.push({ z: zOf(sym), charge: 0 });
  return atoms;
}

/** Testo SMILES? Caratteri che non compaiono mai in una formula. */
export const looksLikeSmiles = (text) => /[=#@/\\]/.test(text) || /\[[A-Z][a-z]?H?\d*[+-]\d*\]/.test(text);
