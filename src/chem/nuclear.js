// @ts-check
// Energia di legame nucleare per nucleone.
// Valori sperimentali AME2020 (Atomic Mass Evaluation) per i 2548 nuclei misurati (src/data/ame2020.js, generato da
// scripts/build-ame.mjs); per gli altri la formula semi-empirica di Weizsäcker (errore tipico ≈ 1 % per A > 20).

// B/A in keV, chiave "Z-A"
import AME2020 from '../data/ame2020.js';

/** Formula semi-empirica (coefficienti in MeV). */
function weizsacker(z, a) {
  const n = a - z;
  let b = 15.75 * a - 17.8 * a ** (2 / 3) - (0.711 * z * (z - 1)) / Math.cbrt(a) - (23.7 * (n - z) ** 2) / a;
  const pairing = 11.18 / Math.sqrt(a);
  if (z % 2 === 0 && n % 2 === 0) b += pairing;
  else if (z % 2 === 1 && n % 2 === 1) b -= pairing;
  return b / a;
}

/**
 * @returns {{ mev: number, measured: boolean } | null} null per un singolo nucleone (¹H)
 */
export function bindingPerNucleon(z, a) {
  if (a <= 1) return null;
  const exp = AME2020[`${z}-${a}`];
  if (exp) return { mev: exp / 1000, measured: true };
  if (a < 16) return null;
  return { mev: weizsacker(z, a), measured: false };
}

/**
 * Isotopi da proporre nel modello 3D, uno per numero di neutroni: lo stato fondamentale, oppure l'isomero se è l'unico
 * nucleo con quei neutroni nei dati (il ¹⁸⁰ᵐTa naturale: lo stato fondamentale ¹⁸⁰Ta dura poche ore).
 */
export function viewerIsotopes(isotopes) {
  return isotopes.filter((i) => !i.isomer || !isotopes.some((g) => !g.isomer && g.neutrons === i.neutrons));
}

/**
 * Emivita breve per i pulsanti degli isotopi: «2,6 milioni di anni» → «2,6 Ma», «4,5 miliardi di anni» → «4,5 Ga»,
 * «5730 anni» → «5730 a» (yearsShort: « a» o « y»). Prima restava «2,6 milioni di a».
 */
export function shortHalfLife(text, yearsShort) {
  return text
    .replace(/ (milioni di anni|million years)$/, ' Ma')
    .replace(/ (miliardi di anni|billion years)$/, ' Ga')
    .replace(/ (anni|years)$/, yearsShort);
}
