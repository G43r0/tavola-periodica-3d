// Scene della sandbox in JSON: per il salvataggio automatico (localStorage) e per «Salva» / «Apri» su file. Le griglie
// del mondo (World.snapshot) sono compresse a run-length: le celle uguali vicine (aria, muri, acqua alla stessa
// temperatura) diventano una coppia [valore, quante]. Gli id delle sostanze dipendono dalla tabella (createSubstances):
// una scena si apre solo con la stessa tabella, riconosciuta da un'impronta delle chiavi.

export const SCENE_KIND = 'tavola-periodica-3d/sandbox-scene';
const VERSION = 1;
const ARRAYS = { type: Uint16Array, temp: Float32Array, life: Int16Array, ctype: Uint16Array, flags: Uint8Array, seed: Uint8Array, vx: Float32Array, vy: Float32Array, spark: Uint8Array };
const MAX_CELLS = 1000 * 1000;

/** Impronta della tabella delle sostanze (FNV-1a sulle chiavi, nell'ordine degli id). */
export function substanceTable(subs) {
  let h = 0x811c9dc5;
  for (const ch of subs.list.map((s) => s.key).join('|')) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${subs.list.length}-${h.toString(16)}`;
}

function rle(arr) {
  const out = [];
  let v = arr[0];
  let n = 0;
  for (const x of arr) {
    if (x === v) n++;
    else {
      out.push(v, n);
      v = x;
      n = 1;
    }
  }
  if (arr.length) out.push(v, n);
  return out;
}

function unrle(list, Type, N) {
  if (!Array.isArray(list)) throw new Error('data');
  const out = new Type(N);
  let i = 0;
  for (let k = 0; k < list.length; k += 2) {
    const v = list[k];
    const n = list[k + 1];
    if (!Number.isFinite(v) || !Number.isInteger(n) || n < 1 || i + n > N) throw new Error('data');
    out.fill(v, i, i + n);
    i += n;
  }
  if (i !== N) throw new Error('data');
  return out;
}

/** La scena del mondo come oggetto da scrivere in JSON. */
export function encodeScene(world, subs) {
  const s = world.snapshot();
  return {
    kind: SCENE_KIND,
    version: VERSION,
    table: substanceTable(subs),
    W: s.W,
    H: s.H,
    arrays: Object.fromEntries(Object.keys(ARRAYS).map((k) => [k, rle(s[k])])),
    particles: s.particles,
  };
}

/**
 * Da un oggetto letto dal JSON a una copia per World.restore() (dopo world.resize(W, H) se la griglia è diversa).
 * Lancia un errore con il motivo: «kind» (non è una scena), «table» (altra versione delle sostanze), «size», «data».
 */
export function decodeScene(data, subs) {
  if (!data || data.kind !== SCENE_KIND || data.version !== VERSION) throw new Error('kind');
  if (data.table !== substanceTable(subs)) throw new Error('table');
  const { W, H } = data;
  if (!Number.isInteger(W) || !Number.isInteger(H) || W < 1 || H < 1 || W * H > MAX_CELLS) throw new Error('size');
  const snap = { W, H };
  for (const [k, Type] of Object.entries(ARRAYS)) snap[k] = unrle(data.arrays?.[k], Type, W * H);
  // ctype contiene anche dati impacchettati (non solo id): si controllano gli id delle celle
  for (const id of snap.type) if (id >= subs.list.length) throw new Error('data');
  if (!Array.isArray(data.particles) || data.particles.some((p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw new Error('data');
  snap.particles = data.particles.filter((p) => p.x >= 0 && p.x < W && p.y >= 0 && p.y < H);
  return snap;
}

/** Chiave del salvataggio automatico (l'ultima scena, ritrovata alla prossima apertura della sandbox). */
export const AUTOSAVE_KEY = 'tp3d.sandbox.scene';

/** Salva la scena nell'archivio del browser; false se l'archivio manca o è pieno (nessun errore). */
export function autosaveScene(storage, world, subs) {
  try {
    storage.setItem(AUTOSAVE_KEY, JSON.stringify(encodeScene(world, subs)));
    return true;
  } catch {
    return false;
  }
}

/** La scena salvata in automatico, pronta per World.restore(), oppure null (nessuna, di un'altra versione, rovinata). */
export function restoreAutosave(storage, subs) {
  try {
    const text = storage?.getItem(AUTOSAVE_KEY);
    return text ? decodeScene(JSON.parse(text), subs) : null;
  } catch {
    return null;
  }
}
