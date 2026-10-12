// Glossario della modalità Spiega nella lingua corrente: voci per chiave, indice delle parole e scorciatoie.
// Caricato su richiesta (import dinamico) la prima volta che serve una spiegazione.
import { getLang } from './index.js';
import { GLOSSARY_IT, SHORTCUTS_IT } from './data/glossary-it.js';
import { GLOSSARY_EN, SHORTCUTS_EN } from './data/glossary-en.js';
import { GLOSSARY_ELI6, SHORTCUTS_ELI6 } from './data/glossary-eli6.js';
import { SANDBOX_STRINGS } from '../sandbox/sandbox-strings.js';

const TABLES = { it: GLOSSARY_IT, en: GLOSSARY_EN, eli6: GLOSSARY_ELI6 };
const KEYS = { it: SHORTCUTS_IT, en: SHORTCUTS_EN, eli6: SHORTCUTS_ELI6 };
const chain = () => ({ it: ['it'], en: ['en', 'it'], eli6: ['eli6', 'it'] })[getLang()] ?? ['it'];

/** Testo «normalizzato» per i confronti: minuscolo, senza accenti, apostrofi e spazi uniformi. */
export const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`´]/g, "'")
    .replace(/[₀-₉]/g, (d) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:!?()«»"“”[\]{}]+|[\s.,;:!?()«»"“”[\]{}]+$/g, '');

// ---- voci generate dai testi della sandbox (strumenti e modi di disegno), così restano allineate
const SBX_TOOLS = ['erase', 'heat', 'cool', 'fire', 'spark', 'neutron', 'bomb', 'stir', 'wind', 'equalize', 'extinguish', 'pick'];
const SBX_TOOL_KEY = { erase: 'E', stir: 'M', wind: 'W' };
const SBX_MODES = { brush: 'Brush', fill: 'Fill', line: 'Line', rect: 'Rect', ellipse: 'Ellipse' };
function sbx(key) {
  for (const code of chain()) if (SANDBOX_STRINGS[code]?.[key] !== undefined) return SANDBOX_STRINGS[code][key];
  return SANDBOX_STRINGS.it[key];
}
function generated(key) {
  let m = /^sandbox\.tool\.(\w+)$/.exec(key);
  if (m && SBX_TOOLS.includes(m[1])) {
    const k = SBX_TOOL_KEY[m[1]];
    return { t: sbx(m[1]), d: sbx(`${m[1]}Text`), k: k ? [[k, sbx(m[1])]] : undefined, s: ['sandbox.tools'] };
  }
  m = /^sandbox\.mode\.(\w+)$/.exec(key);
  if (m && SBX_MODES[m[1]]) return { t: sbx(`mode${SBX_MODES[m[1]]}`), d: sbx(`mode${SBX_MODES[m[1]]}Text`), s: ['sandbox.canvas'] };
  return null;
}

/** La voce del glossario per una chiave (term.*, cat.*, ui.*…), unendo la lingua scelta e l'italiano. */
export function entry(key) {
  const gen = generated(key);
  const parts = chain()
    .map((code) => TABLES[code]?.[key])
    .filter(Boolean)
    .reverse();
  if (!parts.length && !gen) return null;
  return Object.assign({}, gen, ...parts);
}

export const allKeys = () => [...new Set(chain().flatMap((code) => Object.keys(TABLES[code])))];

const indexes = new Map();
/** Indice parola o frase normalizzata → chiave (titoli e sinonimi della lingua corrente). */
export function wordIndex() {
  if (indexes.has(getLang())) return indexes.get(getLang());
  const index = new Map();
  indexes.set(getLang(), index);
  const add = (phrase, key) => {
    const n = norm(phrase);
    if (n && !index.has(n)) index.set(n, key);
  };
  // prima i titoli (hanno la precedenza sui sinonimi), poi i sinonimi
  const keys = allKeys();
  for (const key of keys) {
    const e = entry(key);
    const title = e.t ?? '';
    add(title, key);
    add(title.replace(/\s*\(.*?\)\s*/g, ' '), key);
  }
  for (const key of keys) {
    for (const w of (entry(key).w ?? '').split('|')) add(w, key);
  }
  for (const tool of SBX_TOOLS) add(sbx(tool), `sandbox.tool.${tool}`);
  return index;
}

/** Varianti di una parola singola (plurali e femminili più comuni) per cercarla nell'indice. */
export function variants(word) {
  const w = norm(word);
  const out = [w];
  if (getLang() === 'en') {
    if (w.endsWith('ies')) out.push(`${w.slice(0, -3)}y`);
    if (w.endsWith('es')) out.push(w.slice(0, -2));
    if (w.endsWith('s')) out.push(w.slice(0, -1));
  } else {
    if (/[ie]$/.test(w)) out.push(`${w.slice(0, -1)}o`, `${w.slice(0, -1)}e`, `${w.slice(0, -1)}a`);
    if (/a$/.test(w)) out.push(`${w.slice(0, -1)}o`);
    if (/chi$|ghi$/.test(w)) out.push(`${w.slice(0, -2)}o`);
  }
  return out;
}

/** Scorciatoia da tastiera: [[contesto, cosa fa]] per il testo di un tasto («F», «Ctrl + Z», «Esc»…). */
export function shortcut(keyText) {
  const lang = KEYS[getLang()] ?? KEYS.it;
  const base = getLang() === 'en' ? KEYS.en : KEYS.it;
  let k = String(keyText).trim().toLowerCase().replace(/\s*\+\s*/g, '+');
  k = base.alias[k] ?? k;
  const rows = base.keys[k];
  if (!rows?.length) return null;
  return {
    key: keyText.trim(),
    title: (lang.keyTitle ?? base.keyTitle).replace('{k}', keyText.trim()),
    rows: rows.map(([ctx, what]) => [base.contexts[ctx] ?? ctx, what]),
  };
}
