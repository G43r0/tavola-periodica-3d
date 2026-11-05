// @ts-check
// Salvataggi del simulatore, con la versione e la migrazione. Modulo puro: riceve e restituisce oggetti (la vista li
// scrive in localStorage e, nell'app Electron, anche in un file nella cartella dei dati dell'utente). Il formato e
// la promessa di compatibilità (ogni salvataggio dalla 0.8.0 si apre) sono in docs/salvataggi.md.
//
// Versione 2: { version, settings: { chemMode, legend, fov, volume, muted, shake }, active, profiles: [{ id, name, created,
//   career, notebook }] }. volume (0–1), muted e shake (scossa della camera) sono arrivati con la G8: facoltativi.
//   career (career.js): { results: { [esercitazione]: { stars, report, tries, mark? } }, challenges: { [sfida]: { medal,
//   best, tries } }, money, incidents, owned, last }. mark e challenges sono arrivati con la G7: i salvataggi di prima
//   non li hanno e restano validi.
// Versione 1 (fino alla G5): { career: { index, money, stars[] }, chemMode, legend, fov, notebook }, con le cinque
//   esercitazioni di allora in ordine.
import { newCareer, chapterExercises, PASS_STARS } from './career.js';
import { loadNotebook, NOTEBOOK_VERSION } from './notebook.js';
import { prefersReducedMotion } from '../ui/motion.js';

export const SAVE_VERSION = 2;
/** Volume dell'audio per chi non l'ha mai cambiato (0–1). */
export const DEFAULT_VOLUME = 0.8;

/** Le esercitazioni della versione 1, nell'ordine di allora (stars[i]). */
const V1_ORDERS = ['nacl', 'titration', 'goldrain', 'crystals', 'flame'];

const MAX_PROFILES = 8;
const NAME_MAX = 24;
/**
 * Un numero letto da un salvataggio: numeri e testo numerico; tutto il resto NaN. Number() di un oggetto letto da un
 * file con «valueOf» o «toString» rovinati lancerebbe.
 * @param {unknown} x
 */
const toNum = (x) => (typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN);
/** Chiavi che in un oggetto JavaScript cambierebbero il prototipo o lo nasconderebbero: in un salvataggio si scartano. */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
/** Le voci di un dizionario letto da un salvataggio, senza le chiavi pericolose. */
const safeEntries = (x) =>
  x && typeof x === 'object' && !Array.isArray(x) ? Object.entries(x).filter(([k]) => !UNSAFE_KEYS.has(k)) : [];

/**
 * Il quaderno di un profilo: quello della versione attuale ripulito da loadNotebook; quello di una versione più nuova
 * del quaderno resta com'è (in JSON), così aprire un salvataggio più nuovo non lo cancella; altrimenti nessuno.
 */
function sanitizeNotebook(nb) {
  if (!nb || typeof nb !== 'object' || Array.isArray(nb)) return null;
  if (Number.isFinite(nb.v) && nb.v > NOTEBOOK_VERSION) {
    try {
      return JSON.parse(JSON.stringify(nb));
    } catch {
      return null;
    }
  }
  return loadNotebook(nb);
}

/** Nome di un profilo ripulito: senza spazi in eccesso né caratteri di controllo, al massimo 24 caratteri. */
export function cleanName(name, fallback) {
  // solo testo o numeri: String() di un oggetto letto da un file ({"toString": 1}) lancerebbe
  const s = (typeof name === 'string' ? name : typeof name === 'number' ? String(name) : '')
    // eslint-disable-next-line no-control-regex -- i caratteri di controllo (U+0000-U+001F, U+007F) vanno tolti di proposito
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
  return s || fallback;
}

const newId = (profiles) => {
  let n = profiles.length + 1;
  while (profiles.some((p) => p.id === `p${n}`)) n++;
  return `p${n}`;
};

/** Nome predefinito del profilo n (la vista lo passa tradotto). */
const defaultName = (n) => `Studente ${n}`;

/** Il primo nome predefinito che nessun profilo usa («Studente 2» dopo aver eliminato il secondo, non «Studente 3» doppio). */
export function freeProfileName(profiles, name = defaultName) {
  const used = new Set(profiles.map((p) => p.name));
  let n = 1;
  while (used.has(name(n))) n++;
  return name(n);
}

/**
 * Profilo nuovo con la Carriera vuota.
 * @param {import('../types').Profile[]} profiles
 * @returns {import('../types').Profile}
 */
export function newProfile(profiles, name, now = new Date().toISOString(), fallback = defaultName) {
  return {
    id: newId(profiles),
    name: cleanName(name, freeProfileName(profiles, fallback)),
    created: now,
    career: newCareer(),
    notebook: null,
  };
}

/**
 * Carriera della versione 1 nella forma nuova: le stelle per esercitazione, i soldi; il capitolo 0 dato per fatto.
 * @returns {import('../types').Career}
 */
export function migrateCareerV1(old) {
  const career = newCareer();
  if (!old || typeof old !== 'object') return career;
  career.money = Number.isFinite(toNum(old.money)) ? toNum(old.money) : 0;
  (Array.isArray(old.stars) ? old.stars : []).forEach((stars, i) => {
    const id = V1_ORDERS[i];
    if (id && toNum(stars) > 0) career.results[id] = { stars: toNum(stars), report: 0, tries: 1 };
  });
  // chi aveva già cominciato la Carriera sa usare il laboratorio: il tutorial (capitolo 0) risulta superato
  if (toNum(old.index) > 0 || Object.keys(career.results).length) {
    for (const ex of chapterExercises(0))
      career.results[ex.id] ??= { stars: PASS_STARS, report: 0, tries: 0, migrated: true };
  }
  return career;
}

/**
 * Controlla e completa una Carriera letta da un salvataggio (campi mancanti o di tipo sbagliato).
 * @returns {import('../types').Career}
 */
/** Un conteggio letto da un salvataggio: un numero finito non negativo, altrimenti 0 (Infinity e NaN non passano). */
const count = (x) => {
  const n = toNum(x);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function sanitizeCareer(c) {
  const out = newCareer();
  if (!c || typeof c !== 'object') return out;
  out.money = Number.isFinite(toNum(c.money)) ? toNum(c.money) : 0;
  out.incidents = count(c.incidents);
  out.owned = Array.isArray(c.owned) ? c.owned.filter((x) => typeof x === 'string') : [];
  out.last = typeof c.last === 'string' ? c.last : null;
  for (const [id, r] of safeEntries(c.results)) {
    if (!r || typeof r !== 'object') continue;
    out.results[id] = {
      stars: Math.max(0, Math.min(5, toNum(r.stars) || 0)),
      report: count(r.report),
      tries: count(r.tries),
      ...(r.migrated ? { migrated: true } : {}),
    };
    // incidenti del tentativo più pulito (dalla 1.0.0; prima contavano solo quelli dell'anno)
    if (Math.floor(count(r.incidents)) > 0) out.results[id].incidents = Math.floor(count(r.incidents));
    // voto di una verifica (4–10)
    if (Number.isFinite(toNum(r.mark)) && r.mark !== null)
      out.results[id].mark = Math.max(4, Math.min(10, toNum(r.mark)));
  }
  // sfide a tempo: medaglia (0–3) e miglior tempo
  for (const [id, r] of safeEntries(c.challenges)) {
    if (!r || typeof r !== 'object') continue;
    out.challenges[id] = {
      medal: Math.max(0, Math.min(3, Math.round(toNum(r.medal) || 0))),
      best: Number.isFinite(toNum(r.best)) && r.best !== null ? toNum(r.best) : null,
      tries: count(r.tries),
    };
  }
  return out;
}

/**
 * Salvataggio di qualsiasi versione (o niente, o qualcosa di rotto) → versione 2 valida. Non modifica l'originale.
 * name(n): nome predefinito dei profili nella lingua dell'interfaccia.
 * @returns {import('../types').Save}
 */
export function migrate(raw, now = new Date().toISOString(), name = defaultName) {
  const data = raw && typeof raw === 'object' ? raw : {};
  let save;
  if (!(toNum(data.version) >= 2)) {
    // versione 1 (o salvataggio vuoto): un solo profilo con la Carriera e il quaderno di prima
    const p = newProfile([], null, now, name);
    p.career = migrateCareerV1(data.career);
    p.notebook = sanitizeNotebook(data.notebook);
    save = {
      version: SAVE_VERSION,
      settings: { chemMode: data.chemMode, legend: data.legend, fov: data.fov },
      active: p.id,
      profiles: [p],
    };
  } else {
    // solo i campi conosciuti: quelli sconosciuti (o rovinati) non passano nel salvataggio riscritto
    save = { version: data.version, settings: data.settings, active: data.active, profiles: data.profiles };
    if (typeof data.savedAt === 'string') save.savedAt = data.savedAt;
  }
  if (!Array.isArray(save.profiles)) save.profiles = [];
  if (!save.settings || typeof save.settings !== 'object') save.settings = {};
  const settings = save.settings ?? {};
  save.settings = {
    chemMode: settings.chemMode === 'simple' ? 'simple' : 'real',
    legend: settings.legend !== false,
    fov: Number.isFinite(toNum(settings.fov)) ? toNum(settings.fov) : undefined,
    volume:
      settings.volume !== undefined && settings.volume !== null && Number.isFinite(toNum(settings.volume))
        ? Math.max(0, Math.min(1, toNum(settings.volume)))
        : DEFAULT_VOLUME,
    muted: settings.muted === true,
    // chi non l'ha mai scelta: spenta se il sistema chiede di ridurre il movimento
    shake: typeof settings.shake === 'boolean' ? settings.shake : !prefersReducedMotion(),
  };
  const list = save.profiles.filter((p) => p && typeof p === 'object').slice(0, MAX_PROFILES);
  // id: quelli scritti restano (il primo, se è doppio); a chi non ce l'ha uno che nessun altro profilo usa
  const given = list.map((p) => (typeof p.id === 'string' && p.id ? p.id : null));
  const taken = [];
  const ids = list.map((p, i) => {
    const id =
      given[i] && !taken.some((t) => t.id === given[i])
        ? given[i]
        : newId([...taken, ...given.filter(Boolean).map((g) => ({ id: g }))]);
    taken.push({ id });
    return id;
  });
  save.profiles = list.map((p, i) => ({
    id: ids[i],
    name: cleanName(p.name, name(i + 1)),
    created: typeof p.created === 'string' ? p.created : now,
    career: sanitizeCareer(p.career),
    notebook: sanitizeNotebook(p.notebook),
  }));
  if (!save.profiles.length) save.profiles.push(newProfile([], null, now, name));
  if (!save.profiles.some((p) => p.id === save.active)) save.active = save.profiles[0].id;
  save.version = SAVE_VERSION;
  return save;
}

const isObj = (x) => Boolean(x) && typeof x === 'object' && !Array.isArray(x);
const num = (x, min = -Infinity, max = Infinity) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
/** Un dizionario (risultati, sfide) con solo chiavi proprie e il prototipo normale. */
const plainMap = (x) => isObj(x) && Object.getPrototypeOf(x) === Object.prototype && !Object.hasOwn(x, '__proto__');

/**
 * Il salvataggio ha la forma completa della versione 2 (quella che `migrate` restituisce)? Serve ai test e a chi legge
 * un file da fuori (il file di profilo, profile-file.js).
 * @param {unknown} save
 */
export function isValidSave(save) {
  if (!isObj(save)) return false;
  const s = /** @type {any} */ (save);
  if (s.version !== SAVE_VERSION || !isObj(s.settings)) return false;
  const st = s.settings;
  if (!['real', 'simple'].includes(st.chemMode) || typeof st.legend !== 'boolean') return false;
  if (st.fov !== undefined && !num(st.fov)) return false;
  if (!num(st.volume, 0, 1) || typeof st.muted !== 'boolean' || typeof st.shake !== 'boolean') return false;
  if (!Array.isArray(s.profiles) || !s.profiles.length || s.profiles.length > MAX_PROFILES) return false;
  const ids = new Set();
  for (const p of s.profiles) {
    if (!isObj(p) || typeof p.id !== 'string' || !p.id || ids.has(p.id)) return false;
    ids.add(p.id);
    if (typeof p.name !== 'string' || !p.name || p.name.length > NAME_MAX || cleanName(p.name, '') !== p.name)
      return false;
    if (typeof p.created !== 'string') return false;
    if (p.notebook !== null && !isObj(p.notebook)) return false;
    const c = p.career;
    if (!isObj(c) || !num(c.money) || !num(c.incidents, 0)) return false;
    if (!Array.isArray(c.owned) || !c.owned.every((x) => typeof x === 'string')) return false;
    if (c.last !== null && typeof c.last !== 'string') return false;
    if (!plainMap(c.results) || !plainMap(c.challenges)) return false;
    for (const r of Object.values(c.results)) {
      if (!isObj(r) || !num(r.stars, 0, 5) || !num(r.report, 0) || !num(r.tries, 0)) return false;
      if (r.mark !== undefined && !num(r.mark, 4, 10)) return false;
      if (r.incidents !== undefined && !(Number.isInteger(r.incidents) && r.incidents > 0)) return false;
    }
    for (const r of Object.values(c.challenges)) {
      if (!isObj(r) || !Number.isInteger(r.medal) || !num(r.medal, 0, 3) || !num(r.tries, 0)) return false;
      if (r.best !== null && !num(r.best)) return false;
    }
  }
  return ids.has(s.active);
}

/**
 * Profilo attivo.
 * @param {import('../types').Save} save
 */
export const activeProfile = (save) => save.profiles.find((p) => p.id === save.active) ?? save.profiles[0];

/** Aggiunge un profilo e lo rende attivo (al massimo 8): restituisce il salvataggio nuovo o null. */
export function addProfile(save, name, now) {
  if (save.profiles.length >= MAX_PROFILES) return null;
  const p = newProfile(save.profiles, name, now);
  return { ...save, profiles: [...save.profiles, p], active: p.id };
}

export function renameProfile(save, id, name) {
  return { ...save, profiles: save.profiles.map((p) => (p.id === id ? { ...p, name: cleanName(name, p.name) } : p)) };
}

/** Elimina un profilo (non l'ultimo rimasto). */
export function deleteProfile(save, id) {
  if (save.profiles.length <= 1) return save;
  const profiles = save.profiles.filter((p) => p.id !== id);
  return { ...save, profiles, active: save.active === id ? profiles[0].id : save.active };
}

export const selectProfile = (save, id) => (save.profiles.some((p) => p.id === id) ? { ...save, active: id } : save);

/** Sostituisce la Carriera (o il quaderno) del profilo attivo. */
export function updateActive(save, patch) {
  return { ...save, profiles: save.profiles.map((p) => (p.id === save.active ? { ...p, ...patch } : p)) };
}

/** Il più recente tra due salvataggi (savedAt), per scegliere tra il file dell'app e localStorage. */
export function newer(a, b) {
  if (!a) return b;
  if (!b) return a;
  const at = (x) => (typeof x.savedAt === 'string' ? x.savedAt : '');
  return at(b) > at(a) ? b : a;
}
