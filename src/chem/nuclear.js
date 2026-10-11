// Energia di legame nucleare per nucleone.
// Nuclei leggeri (A ≤ 22): valori sperimentali AME2020 (Atomic Mass Evaluation).
// Nuclei più pesanti: formula semi-empirica di Weizsäcker (errore tipico ≈ 1 % per A > 20).

// B/A in keV, chiave "Z-A"
const AME2020 = {
  '1-2': 1112.283, '1-3': 2827.265, '2-3': 2572.681, '2-4': 7073.915,
  '3-6': 5332.331, '3-7': 5606.439, '4-7': 5371.548, '4-9': 6462.668, '4-10': 6497.630,
  '5-10': 6475.083, '5-11': 6927.732, '6-12': 7680.144, '6-13': 7469.849, '6-14': 7520.319,
  '7-14': 7475.614, '7-15': 7699.460, '8-16': 7976.206, '8-17': 7750.728, '8-18': 7767.097,
  '9-18': 7631.638, '9-19': 7778.018, '10-20': 8032.240, '10-21': 7971.713, '10-22': 8080.465,
};

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
