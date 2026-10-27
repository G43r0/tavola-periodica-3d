// Punteggi delle esercitazioni della Carriera: la curva del punteggio, le sostanze estranee in un preparato, le stelle e
// la paga. Le esercitazioni sono dati (data/career-exercises.js) letti da career.js. Modulo puro.

/** Punteggio 1 fino a `full` di errore, 0 da `zero` in su, lineare in mezzo. */
export const score = (err, full, zero) => (err <= full ? 1 : err >= zero ? 0 : 1 - (err - full) / (zero - full));

/**
 * Stelle (0–5, a mezze stelle) e paga: qualità del preparato (3 stelle), sicurezza e pulizia (1), tempo (1).
 * @param {{quality: number, elapsed: number, par: number, mess: number, incidents: number, wrongBins: number, pay: number, costs: number}} r
 */
export function grade({ quality, elapsed, par, mess = 0, incidents = 0, wrongBins = 0, pay, costs = 0 }) {
  const safety = Math.max(0, 1 - 0.25 * mess - 0.5 * incidents - 0.3 * wrongBins);
  const time = score(elapsed / par, 1, 2.5);
  const raw = quality * 3 + safety + (quality > 0.2 ? time : 0);
  const stars = Math.round(Math.max(0, Math.min(5, raw)) * 2) / 2;
  const earned = Math.round(pay * (stars / 5) * 100) / 100;
  return { stars, safety, time, earned, net: Math.round((earned - costs) * 100) / 100 };
}
