// Regole di Slater (1930): carica nucleare efficace Z_eff e stima delle energie elettroniche.
// Energia di un elettrone: −13,6 eV · (Z_eff / n*)²; l'energia di legame di un sottolivello è stimata
// come differenza tra l'energia totale dello ione (con un elettrone in meno in quel sottolivello)
// e quella dell'atomo neutro. Modello non relativistico: indica l'ordine di grandezza.
import { subshells } from './electron-config.js';

const RYDBERG_EV = 13.605693;
// numero quantico principale efficace di Slater (n = 7 estrapolato)
const N_STAR = [0, 1, 2, 3, 3.7, 4.0, 4.2, 4.3];

/** Ordine dei gruppi di Slater: (1s)(2s,2p)(3s,3p)(3d)(4s,4p)(4d)(4f)(5s,5p)… */
const groupRank = (n, l) => n * 10 + (l <= 1 ? 0 : l);

/**
 * Z_eff per un elettrone del sottolivello (n, l) in una configurazione.
 * @param {{n:number,l:number,electrons:number}[]} config
 */
export function zeff(z, config, n, l) {
  let screening = 0;
  for (const s of config) {
    const count = s.electrons - (s.n === n && s.l === l ? 1 : 0); // l'elettrone non scherma sé stesso
    if (count <= 0) continue;
    const sameGroup = l <= 1 ? s.n === n && s.l <= 1 : s.n === n && s.l === l;
    if (sameGroup) {
      screening += count * (n === 1 ? 0.3 : 0.35);
    } else if (l <= 1) {
      // elettroni s, p: 0,85 dal guscio n−1, 1,00 dai gusci più interni
      if (s.n === n - 1) screening += 0.85 * count;
      else if (s.n <= n - 2) screening += count;
    } else if (groupRank(s.n, s.l) < groupRank(n, l)) {
      // elettroni d, f: 1,00 da tutti i gruppi precedenti
      screening += count;
    }
  }
  return z - screening;
}

function totalEnergy(z, config) {
  let e = 0;
  for (const s of config) {
    if (s.electrons > 0) e -= s.electrons * RYDBERG_EV * (zeff(z, config, s.n, s.l) / N_STAR[s.n]) ** 2;
  }
  return e;
}

/** Z_eff (Slater) per un elettrone del sottolivello `label` (es. "3d") dell'atomo neutro. */
export function slaterZeff(z, label) {
  const config = subshells(z);
  const s = config.find((c) => c.label === label);
  return zeff(z, config, s.n, s.l);
}

/** Stima (eV) dell'energia necessaria a strappare un elettrone del sottolivello `label`. */
export function slaterBinding(z, label) {
  const config = subshells(z);
  const ion = config.map((s) => (s.label === label ? { ...s, electrons: s.electrons - 1 } : s));
  return totalEnergy(z, ion) - totalEnergy(z, config);
}
