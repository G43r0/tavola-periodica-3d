// Energia di legame di un elettrone (energia minima per strapparlo all'atomo), dalla fonte migliore disponibile:
//  1. sottolivello più esterno → prima energia di ionizzazione (NIST), misurata sull'atomo isolato;
//  2. sottolivelli interni, Z ≤ 92 → X-ray Data Booklet (elemento nella sua forma naturale);
//  3. altrimenti → stima con le regole di Slater.
import { slaterBinding, slaterZeff } from './slater.js';
import table from '../data/binding-energies.json';

// molteplicità 2j + 1 dei livelli separati dall'accoppiamento spin-orbita
const J_WEIGHT = { '1/2': 2, '3/2': 4, '5/2': 6, '7/2': 8 };

export const BINDING_SOURCE = table.meta.source;

/** Sottolivello da cui si toglie il primo elettrone: n massimo, poi l massimo. */
export function outermostSubshell(occupancy) {
  return occupancy.reduce((best, s) => (s.n > best.n || (s.n === best.n && s.l > best.l) ? s : best));
}

/**
 * @param {object} el elemento (elements.json)
 * @param {{label:string}} sub sottolivello dell'elettrone
 * @param {object[]} occupancy orbitalOccupancy(z)
 * @returns {{ ev:number, method:'ie'|'xray'|'slater', predicted?:boolean, components?:{j:string|null,ev:number}[], zeff:number }}
 */
export function electronBinding(el, sub, occupancy) {
  const zeff = slaterZeff(el.z, sub.label);
  if (sub.label === outermostSubshell(occupancy).label && el.ionizationEnergyEv) {
    return { ev: el.ionizationEnergyEv, method: 'ie', predicted: el.estimated.includes('ie'), zeff };
  }
  const levels = table.data[el.z]?.[sub.label];
  if (levels) {
    const components = Object.entries(levels).map(([j, ev]) => ({ j: j === '-' ? null : j, ev }));
    let sum = 0;
    let weights = 0;
    for (const c of components) {
      const w = J_WEIGHT[c.j] ?? 1;
      sum += w * c.ev;
      weights += w;
    }
    const distinct = new Set(components.map((c) => c.ev)).size > 1;
    return { ev: sum / weights, method: 'xray', components: distinct ? components : null, zeff };
  }
  return { ev: slaterBinding(el.z, sub.label), method: 'slater', zeff };
}
