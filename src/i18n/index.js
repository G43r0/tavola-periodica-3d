// Lingue dell'interfaccia: italiano, inglese e «Spiegamelo come se avessi 6 anni»
// (italiano con parole semplici, senza perdere la correttezza scientifica).
//
// Ogni modulo ha la sua tabella di testi { it: {...}, en: {...}, eli6: {...} } e la usa con
// createT(tabella) → t('chiave', { parametri }). Un valore può essere una stringa con segnaposto
// {nome} oppure una funzione (parametri) => stringa, utile per plurali e frasi composte.
// Catena di ripiego: eli6 → it, en → it. In Node (test) la lingua è sempre l'italiano.

const STORAGE_KEY = 'tp3d.lang';

export const LANGS = [
  { code: 'it', name: 'Italiano', short: 'IT', locale: 'it-IT', html: 'it' },
  { code: 'en', name: 'English', short: 'EN', locale: 'en-GB', html: 'en' },
  { code: 'eli6', name: 'Spiegamelo come se avessi 6 anni', short: '6 anni', locale: 'it-IT', html: 'it', base: 'it' },
];

const BY_CODE = Object.fromEntries(LANGS.map((l) => [l.code, l]));
const isBrowser = typeof document !== 'undefined';

function storageGet(key) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    /* archiviazione non disponibile: la scelta vale fino alla chiusura */
  }
}

function detect() {
  if (!isBrowser) return 'it';
  const saved = storageGet(STORAGE_KEY);
  if (saved && BY_CODE[saved]) return saved;
  const nav = globalThis.navigator?.language || 'it';
  return /^it\b/i.test(nav) ? 'it' : 'en';
}

let current = detect();

/** Codice della lingua attiva: 'it' | 'en' | 'eli6'. */
export const getLang = () => current;
export const langInfo = (code = current) => BY_CODE[code];
/** Locale per Intl (numeri, date). */
export const locale = () => BY_CODE[current].locale;
/** Vero se la lingua di base è l'italiano (it ed eli6). */
export const isItalian = () => current !== 'en';
export const isSimple = () => current === 'eli6';

const chainOf = (code) => (code === 'it' ? ['it'] : [code, BY_CODE[code].base ?? 'it', 'it']);

/** Solo per i test: cambia la lingua senza ricaricare. */
export function _setLangForTests(code) {
  current = code;
}

const listeners = new Set();
/** Funzioni chiamate prima del cambio di lingua (per salvare lo stato da ripristinare). */
export function beforeLangChange(fn) {
  listeners.add(fn);
}

/** Cambia lingua: salva la scelta e ricarica l'interfaccia (lo stato utile si salva prima). */
export function setLang(code) {
  if (!BY_CODE[code] || code === current) return;
  listeners.forEach((fn) => {
    try {
      fn(code);
    } catch (err) {
      console.error(err);
    }
  });
  storageSet(STORAGE_KEY, code);
  current = code;
  if (isBrowser) location.reload();
}

function format(value, params) {
  if (typeof value === 'function') return value(params ?? {});
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined && params[k] !== null ? params[k] : m));
}

/**
 * Crea la funzione di traduzione per una tabella di testi.
 * @param {{it: object, en?: object, eli6?: object}} table
 */
export function createT(table) {
  const t = (key, params) => {
    for (const code of chainOf(current)) {
      const v = table[code]?.[key];
      if (v !== undefined) return format(v, params);
    }
    if (isBrowser) console.warn(`[i18n] testo mancante: ${key}`);
    return key;
  };
  t.has = (key) => chainOf(current).some((code) => table[code]?.[key] !== undefined);
  return t;
}

/** Sceglie il testo nella lingua attiva da un oggetto { it, en, eli6 }. */
export function pick(obj) {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  for (const code of chainOf(current)) if (obj[code] !== undefined) return obj[code];
  return obj.it;
}

/** Plurale semplice: plural(n, 'elettrone', 'elettroni'). */
export const plural = (n, one, many) => (Math.abs(n) === 1 ? one : many);
