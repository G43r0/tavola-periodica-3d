// Copertura delle reazioni: quali reazioni del catalogo si possono fare nel simulatore con un insieme di reagenti e
// con le condizioni che il laboratorio sa dare (calore della piastra e del Bunsen, fiamma, luce della lampada, la
// corrente dell'alimentatore, i gas delle bombole, l'acqua e l'ossigeno dell'aria). Anche a catena: i prodotti che
// restano nel contenitore (non i gas che se ne vanno)
// diventano reagenti delle reazioni successive. Serve a scegliere i reagenti dello scaffale e dell'armadio e a fissare
// con un test la copertura minima per gruppo. Modulo puro (niente DOM).
import { WATER } from '../sandbox/substances.js';
import { stateOf, aqueousOf } from './signals.js';
import { SHELF } from './reagents.js';
import { CYLINDER_GASES } from './apparatus-logic.js';

/** Temperatura massima che si raggiunge in un contenitore sul Bunsen (K): la reticella arriva al rosso. */
export const LAB_MAX_T = 1000;

/** Sostanza principale di un reagente dello scaffale o dell'armadio (chiave della libreria o simbolo). */
export const reagentKey = (r) => (r.water ? 'water' : r.solute ?? r.solid ?? r.liquid ?? null);

/**
 * Reazioni realizzabili.
 * @param {object} ctx contesto chimico (createLabChemistry)
 * @param {string[]} keys sostanze disponibili (chiavi della libreria o simboli)
 * @param {{maxT?: number, light?: boolean, flame?: boolean, electro?: boolean, gases?: string[]}} [lab] condizioni
 *   del laboratorio: electro = c'è l'alimentatore, gases = i gas delle bombole
 * @returns {{ids: Set<string>, byGroup: Map<string, number>, species: Set<number>}}
 */
export function reachable(ctx, keys, { maxT = LAB_MAX_T, light = true, flame = true, electro = true, gases = CYLINDER_GASES } = {}) {
  const have = new Set([WATER, ...[...keys, ...gases].map((k) => ctx.id(k)).filter(Boolean)]);
  const ids = new Set();
  const can = (rx) => {
    const c = rx.cond;
    if (c.shock || (c.light && !light) || (c.ignite && !flame) || (rx.electro && !electro)) return false;
    if (Math.max(c.minT, c.hot ? 450 : 0) > maxT) return false;
    if (c.catalysts && ![...c.catalysts].some((s) => have.has(s))) return false;
    return rx.reactants.every((r) => have.has(r.sid) || (r.sid === ctx.O2 && rx.air >= 0));
  };
  for (let changed = true; changed;) {
    changed = false;
    for (const rx of ctx.rxs) {
      if (ids.has(rx.id) || !can(rx)) continue;
      ids.add(rx.id);
      changed = true;
      // i prodotti che restano nel contenitore: non i gas che escono (H₂, CO₂, l'SO₂ dello zolfo che brucia…), sì
      // quelli che si sciolgono (NH₃, HCl) e le ceneri delle combustioni (MgO)
      const aqueous = !rx.combustion && aqueousOf(rx, ctx);
      for (const p of rx.products) if (stateOf(ctx, p.sid, { aqueous, product: true }) !== 'g') have.add(p.sid);
    }
  }
  const byGroup = new Map();
  for (const id of ids) {
    const g = ctx.rxById.get(id).group;
    byGroup.set(g, (byGroup.get(g) ?? 0) + 1);
  }
  return { ids, byGroup, species: have };
}

/** Chiavi delle sostanze dello scaffale (e di un elenco di reagenti in più, come l'armadio). */
export const keysOf = (...lists) => [...new Set(lists.flatMap((l) => Object.values(l).map(reagentKey)).filter(Boolean))];

/** Copertura dello scaffale da solo. */
export const shelfCoverage = (ctx) => reachable(ctx, keysOf(SHELF));
