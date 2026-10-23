// Salvataggi del simulatore, con la versione e la migrazione. Modulo puro: riceve e restituisce oggetti (la vista li
// scrive in localStorage e, nell'app Electron, anche in un file nella cartella dei dati dell'utente).
//
// Versione 2: { version, settings: { chemMode, legend, fov }, active, profiles: [{ id, name, created, career, notebook }] }
//   career (career.js): { results: { [esercitazione]: { stars, report, tries, mark? } }, challenges: { [sfida]: { medal,
//   best, tries } }, money, incidents, owned, last }. mark e challenges sono arrivati con la G7: i salvataggi di prima
//   non li hanno e restano validi.
// Versione 1 (fino alla G5): { career: { index, money, stars[] }, chemMode, legend, fov, notebook }, con le cinque
//   esercitazioni di allora in ordine.
import { newCareer, chapterExercises, PASS_STARS } from './career.js';

export const SAVE_VERSION = 2;

/** Le esercitazioni della versione 1, nell'ordine di allora (stars[i]). */
const V1_ORDERS = ['nacl', 'titration', 'goldrain', 'crystals', 'flame'];

const MAX_PROFILES = 8;
const NAME_MAX = 24;

/** Nome di un profilo ripulito: senza spazi in eccesso né caratteri di controllo, al massimo 24 caratteri. */
export function cleanName(name, fallback) {
  const s = String(name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return s || fallback;
}

const newId = (profiles) => {
  let n = profiles.length + 1;
  while (profiles.some((p) => p.id === `p${n}`)) n++;
  return `p${n}`;
};

/** Nome predefinito del profilo n (la vista lo passa tradotto). */
const defaultName = (n) => `Studente ${n}`;

/** Profilo nuovo con la Carriera vuota. */
export function newProfile(profiles, name, now = new Date().toISOString(), fallback = defaultName) {
  return { id: newId(profiles), name: cleanName(name, fallback(profiles.length + 1)), created: now, career: newCareer(), notebook: null };
}

/** Carriera della versione 1 nella forma nuova: le stelle per esercitazione, i soldi; il capitolo 0 dato per fatto. */
export function migrateCareerV1(old) {
  const career = newCareer();
  if (!old) return career;
  career.money = Number(old.money) || 0;
  (old.stars ?? []).forEach((stars, i) => {
    const id = V1_ORDERS[i];
    if (id && Number(stars) > 0) career.results[id] = { stars: Number(stars), report: 0, tries: 1 };
  });
  // chi aveva già cominciato la Carriera sa usare il laboratorio: il tutorial (capitolo 0) risulta superato
  if ((old.index ?? 0) > 0 || Object.keys(career.results).length) {
    for (const ex of chapterExercises(0)) career.results[ex.id] ??= { stars: PASS_STARS, report: 0, tries: 0, migrated: true };
  }
  return career;
}

/** Controlla e completa una Carriera letta da un salvataggio (campi mancanti o di tipo sbagliato). */
function sanitizeCareer(c) {
  const out = newCareer();
  if (!c || typeof c !== 'object') return out;
  out.money = Number.isFinite(Number(c.money)) ? Number(c.money) : 0;
  out.incidents = Math.max(0, Number(c.incidents) || 0);
  out.owned = Array.isArray(c.owned) ? c.owned.filter((x) => typeof x === 'string') : [];
  out.last = typeof c.last === 'string' ? c.last : null;
  for (const [id, r] of Object.entries(c.results ?? {})) {
    if (!r || typeof r !== 'object') continue;
    out.results[id] = { stars: Math.max(0, Math.min(5, Number(r.stars) || 0)), report: Math.max(0, Number(r.report) || 0), tries: Math.max(0, Number(r.tries) || 0), ...(r.migrated ? { migrated: true } : {}) };
    // voto di una verifica (4–10)
    if (Number.isFinite(Number(r.mark)) && r.mark !== null) out.results[id].mark = Math.max(4, Math.min(10, Number(r.mark)));
  }
  // sfide a tempo: medaglia (0–3) e miglior tempo
  for (const [id, r] of Object.entries(c.challenges ?? {})) {
    if (!r || typeof r !== 'object') continue;
    out.challenges[id] = { medal: Math.max(0, Math.min(3, Math.round(Number(r.medal) || 0))), best: Number.isFinite(Number(r.best)) && r.best !== null ? Number(r.best) : null, tries: Math.max(0, Number(r.tries) || 0) };
  }
  return out;
}

/**
 * Salvataggio di qualsiasi versione (o niente, o qualcosa di rotto) → versione 2 valida. Non modifica l'originale.
 * name(n): nome predefinito dei profili nella lingua dell'interfaccia.
 * @returns {{version: number, settings: object, active: string, profiles: object[]}}
 */
export function migrate(raw, now = new Date().toISOString(), name = defaultName) {
  const data = raw && typeof raw === 'object' ? raw : {};
  let save;
  if (!data.version || data.version < 2) {
    // versione 1 (o salvataggio vuoto): un solo profilo con la Carriera e il quaderno di prima
    const p = newProfile([], null, now, name);
    p.career = migrateCareerV1(data.career);
    p.notebook = data.notebook ?? null;
    save = { version: SAVE_VERSION, settings: { chemMode: data.chemMode, legend: data.legend, fov: data.fov }, active: p.id, profiles: [p] };
  } else save = { ...data, profiles: Array.isArray(data.profiles) ? data.profiles : [] };
  const settings = save.settings ?? {};
  save.settings = {
    chemMode: settings.chemMode === 'simple' ? 'simple' : 'real',
    legend: settings.legend !== false,
    fov: Number.isFinite(Number(settings.fov)) ? Number(settings.fov) : undefined,
  };
  save.profiles = save.profiles.filter((p) => p && typeof p === 'object').slice(0, MAX_PROFILES).map((p, i, all) => ({
    id: typeof p.id === 'string' && p.id ? p.id : newId(all.slice(0, i)),
    name: cleanName(p.name, name(i + 1)),
    created: typeof p.created === 'string' ? p.created : now,
    career: sanitizeCareer(p.career),
    notebook: p.notebook ?? null,
  }));
  if (!save.profiles.length) save.profiles.push(newProfile([], null, now, name));
  if (!save.profiles.some((p) => p.id === save.active)) save.active = save.profiles[0].id;
  save.version = SAVE_VERSION;
  return save;
}

/** Profilo attivo. */
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
  return String(b.savedAt ?? '') > String(a.savedAt ?? '') ? b : a;
}
