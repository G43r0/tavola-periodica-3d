// Quanto forte suona ciò che succede nel laboratorio: regole pure (testate in tests/game/audio.test.mjs), usate da
// game.js per decidere volume e velocità degli anelli e dei colpi singoli.

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** Getto di un recipiente: volume e velocità dalla portata (mL/s); un filo si sente appena, un getto pieno di più. */
export const pourSound = (q) => ({ level: clamp(0.25 + q / 12, 0.25, 1), rate: 0.9 + clamp(q / 25, 0, 0.3) });

/** Rubinetto (portata 5–50 mL/s). */
export const tapLevel = (flow) => clamp(0.45 + flow / 60, 0.45, 1.2);

/** Fuochi accesi: uno si sente bene, di più un po' più forte (non si sommano all'infinito). */
export const fireLevel = (n) => (n > 0 ? Math.min(1.4, 0.75 + 0.25 * (n - 1)) : 0);

/** Effervescenza da una reazione con sviluppo di gas: dalla velocità della reazione (mol/s nel contenitore). */
export const fizzLevel = (rate) => clamp(0.3 + Math.log10(Math.max(rate, 1e-7) / 1e-6) * 0.25, 0.3, 1.2);

/** Urto di un oggetto: sotto 0,6 m/s non si sente (posato, che scivola), poi cresce fino a 3 m/s. */
export const impactGain = (speed) => clamp((speed - 0.6) / 2.4, 0, 1);

/** Le k sorgenti più vicine al punto (distanza al quadrato): per non suonare venti getti o bolle insieme. */
export function nearest(sources, at, k) {
  const d2 = (s) => (s.pos.x - at.x) ** 2 + (s.pos.y - at.y) ** 2 + (s.pos.z - at.z) ** 2;
  return sources.map((s) => [d2(s), s]).sort((a, b) => a[0] - b[0]).slice(0, k).map((x) => x[1]);
}

/**
 * Scossa della camera dopo un'esplosione: spostamento (m) e rotazione (rad) che si smorzano in `dur` secondi.
 * t: secondi dall'esplosione; amp: forza (1 = esplosione vicina e forte). Restituisce null quando è finita.
 */
export function shakeAt(t, amp, dur = 0.6) {
  if (!(amp > 0) || t >= dur || t < 0) return null;
  const k = amp * (1 - t / dur) ** 2;
  return {
    x: Math.sin(t * 71) * 0.012 * k,
    y: Math.sin(t * 53 + 1.3) * 0.01 * k,
    roll: Math.sin(t * 61 + 2.1) * 0.02 * k,
  };
}
