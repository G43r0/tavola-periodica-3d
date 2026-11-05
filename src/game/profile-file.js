// @ts-check
// File di profilo: un profilo del simulatore (Carriera e quaderno) in un file, per portarlo da scuola a casa o da un PC
// all'altro. Nella versione web è l'unica copia di sicurezza. Il formato è in docs/salvataggi.md. Modulo puro: la vista
// (game-view.js) scrive e legge i file, qui si costruiscono, si controllano e si importano.
import { migrate, SAVE_VERSION } from './save.js';

export const PROFILE_FORMAT = 'tp3d-profilo';
export const PROFILE_FILE_VERSION = 1;
/** Un file di profilo vero pesa pochi kB: oltre 2 MB non è un file di profilo. */
export const PROFILE_FILE_MAX = 2 * 1024 * 1024;
const MAX_PROFILES = 8;

/** @typedef {import('../types').Save} Save */
/** @typedef {import('../types').Profile} Profile */
/**
 * @typedef {{ ok: true, profile: Profile, settings: Save['settings'], app: string | null, exported: string | null }
 *   | { ok: false, error: 'size' | 'json' | 'format' | 'version' | 'check' }} ParsedProfile
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * CRC-32 (lo stesso di zlib e PNG) del testo in UTF-8.
 * @param {string} text
 */
export function crc32(text) {
  let c = 0xffffffff;
  for (const byte of new TextEncoder().encode(text)) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * JSON con le chiavi in ordine alfabetico a ogni livello: lo stesso contenuto dà sempre lo stesso testo, qualunque sia
 * l'ordine in cui le chiavi sono state scritte nel file.
 * @param {unknown} v
 * @returns {string}
 */
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? 'null' : canonical(x))).join(',')}]`;
  const keys = Object.keys(v)
    .filter((k) => v[k] !== undefined && typeof v[k] !== 'function')
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
}

const checkOf = (body) => `crc32:${crc32(canonical(body)).toString(16).padStart(8, '0')}`;

/**
 * Il file di un profilo del salvataggio.
 * @param {Save} save
 * @param {string} id il profilo da esportare
 * @param {{ app?: string | null, now?: string }} [meta] versione dell'app e ora dell'esportazione
 */
export function exportProfile(save, id, { app = null, now = new Date().toISOString() } = {}) {
  const profile = save.profiles.find((p) => p.id === id);
  if (!profile) throw new Error(`profilo ${id} inesistente`);
  const body = {
    format: PROFILE_FORMAT,
    version: PROFILE_FILE_VERSION,
    app,
    exported: now,
    settings: save.settings,
    profile,
  };
  return { ...body, check: checkOf(body) };
}

/** Il testo del file: JSON leggibile, con un a capo in fondo. */
export const profileFileText = (file) => `${JSON.stringify(file, null, 2)}\n`;

/**
 * Il nome del file: tp3d-profilo-<nome senza accenti né spazi>-<data>.json.
 * @param {string} name
 * @param {string} now ora ISO
 */
export function profileFileName(name, now) {
  const slug =
    String(name)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'profilo';
  return `tp3d-profilo-${slug}-${now.slice(0, 10)}.json`;
}

/**
 * Legge un file di profilo: controlla dimensione, JSON, formato, versione e CRC, poi il profilo passa da migrate()
 * come ogni salvataggio (i valori impossibili si correggono).
 * @param {unknown} text
 * @returns {ParsedProfile}
 */
export function parseProfileFile(text) {
  if (typeof text !== 'string' || text.length > PROFILE_FILE_MAX) return { ok: false, error: 'size' };
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'json' };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.format !== PROFILE_FORMAT)
    return { ok: false, error: 'format' };
  if (!Number.isInteger(data.version) || data.version < 1) return { ok: false, error: 'format' };
  if (data.version > PROFILE_FILE_VERSION) return { ok: false, error: 'version' };
  const raw = data.profile;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'format' };
  const { check, ...body } = data;
  if (check !== checkOf(body)) return { ok: false, error: 'check' };
  const save = migrate({ version: SAVE_VERSION, settings: data.settings, active: raw.id, profiles: [raw] });
  return {
    ok: true,
    profile: save.profiles[0],
    settings: save.settings,
    app: typeof data.app === 'string' ? data.app : null,
    exported: typeof data.exported === 'string' ? data.exported : null,
  };
}

/**
 * Il profilo di un file letto nel salvataggio, e lo rende attivo. Lo stesso profilo (stessa data di creazione, al
 * millesimo di secondo: è la sua identità anche se cambia nome o id) si sostituisce; uno nuovo si aggiunge, con un id
 * nuovo se il suo è già usato. Le impostazioni del file non cambiano quelle del computer.
 * @param {Save} save
 * @param {{ profile: Profile }} file il risultato di parseProfileFile
 * @returns {{ save: Save, action: 'replaced' | 'added', id: string } | { error: 'full' }}
 */
export function importProfile(save, { profile }) {
  const same = save.profiles.find((p) => p.created === profile.created);
  if (same) {
    const next = migrate({
      ...save,
      active: same.id,
      profiles: save.profiles.map((p) => (p === same ? { ...profile, id: same.id } : p)),
    });
    return { save: next, action: 'replaced', id: same.id };
  }
  if (save.profiles.length >= MAX_PROFILES) return { error: 'full' };
  let id = profile.id;
  for (let n = save.profiles.length + 1; save.profiles.some((p) => p.id === id); n++) id = `p${n}`;
  const next = migrate({ ...save, active: id, profiles: [...save.profiles, { ...profile, id }] });
  return { save: next, action: 'added', id };
}
