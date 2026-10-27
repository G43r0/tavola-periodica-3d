// Quaderno di laboratorio: ogni reazione del catalogo osservata la prima volta nel simulatore, con quando, dove
// (Carriera o Laboratorio libero), in acqua o no e che cosa si è visto. È la «collezione» del gioco: resta tra una
// partita e l'altra (nel salvataggio, con la sua versione) e mostra per ognuno dei 14 gruppi del catalogo quante
// reazioni si sono scoperte tra quelle che il simulatore sa fare. Modulo puro (niente DOM).
import { REACTION_GROUPS } from '../lab/data/reactions.js';

export const NOTEBOOK_VERSION = 1;

/** Quaderno vuoto. */
export const emptyNotebook = () => ({ v: NOTEBOOK_VERSION, rx: {} });

/**
 * Quaderno dal salvataggio: accetta quello della versione attuale e scarta i dati non riconosciuti (versione futura o
 * file rovinato) senza perdere le voci valide.
 * @param {unknown} raw
 */
export function loadNotebook(raw) {
  const nb = emptyNotebook();
  if (!raw || typeof raw !== 'object' || typeof raw.rx !== 'object' || raw.rx === null) return nb;
  if (typeof raw.v === 'number' && raw.v > NOTEBOOK_VERSION) return nb;
  for (const [id, e] of Object.entries(raw.rx)) {
    if (!e || typeof e !== 'object') continue;
    nb.rx[id] = {
      first: Number(e.first) || 0,
      count: Math.max(1, Number(e.count) || 1),
      mode: e.mode === 'career' ? 'career' : 'free',
      aq: Boolean(e.aq),
      tags: Array.isArray(e.tags) ? e.tags.filter((x) => typeof x === 'string') : [],
    };
  }
  return nb;
}

/**
 * Scrive una reazione osservata. Restituisce true se è nuova (la prima volta: l'avviso «nuova reazione nel quaderno»).
 * @param {{v: number, rx: object}} nb
 * @param {string} id reazione del catalogo
 * @param {{mode?: string, aq?: boolean, tags?: string[], now?: number}} info
 */
export function recordReaction(nb, id, { mode = 'free', aq = false, tags = [], now = Date.now() } = {}) {
  const e = nb.rx[id];
  if (e) {
    e.count++;
    return false;
  }
  nb.rx[id] = { first: now, count: 1, mode, aq, tags };
  return true;
}

/**
 * Pagine del quaderno divise nei gruppi del catalogo.
 * @param {object} ctx contesto chimico (createLabChemistry)
 * @param {{rx: object}} nb
 * @returns {{groups: {key: string, label: string, pages: {id: string, r: object, rx: object|null, found: boolean, doable: boolean}[],
 *   found: number, doable: number, total: number}[], found: number, doable: number, total: number}}
 *   doable: il simulatore sa farla (le altre chiedono corrente, raggi UV, vapore, organismi viventi o sono equilibri)
 */
export function notebookPages(ctx, nb) {
  const doable = new Set(ctx.rxs.map((rx) => rx.id));
  const groups = REACTION_GROUPS.map((g) => ({ key: g.key, label: g.label, pages: [], found: 0, doable: 0, total: 0 }));
  const byKey = new Map(groups.map((g) => [g.key, g]));
  for (const entry of ctx.chem.list) {
    const r = entry.r;
    const g = byKey.get(r.group);
    if (!g) continue;
    const page = { id: r.id, r, rx: ctx.rxById.get(r.id) ?? null, found: Boolean(nb.rx[r.id]), doable: doable.has(r.id) };
    g.pages.push(page);
    g.total++;
    if (page.doable) g.doable++;
    if (page.found) g.found++;
  }
  const sum = (k) => groups.reduce((t, g) => t + g[k], 0);
  return { groups, found: sum('found'), doable: sum('doable'), total: sum('total') };
}

/** Percentuale scoperta (0–100, arrotondata per difetto) tra le reazioni che il simulatore sa fare. */
export const percent = (found, doable) => (doable > 0 ? Math.floor((100 * found) / doable) : 0);
