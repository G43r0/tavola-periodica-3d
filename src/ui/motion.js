// «Riduci movimento» del sistema (prefers-reduced-motion: reduce). Le transizioni CSS si accorciano in tokens.css;
// qui i movimenti più forti: scossa della camera e lampo delle esplosioni nel simulatore, rotazione automatica del
// campione 3D, animazione del visualizzatore dell'atomo.

export function prefersReducedMotion() {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

/** Velocità della rotazione automatica del campione 3D (rad/s): fermo con «riduci movimento» (si gira trascinando). */
export const specimenSpin = (reduced = prefersReducedMotion()) => (reduced ? 0 : 0.35);

/** Intensità del lampo di un'esplosione nel simulatore: attenuato con «riduci movimento». */
export const explosionFlash = (power, reduced = prefersReducedMotion()) => (6 + power * 6) * (reduced ? 0.2 : 1);

/** Il visualizzatore dell'atomo parte con l'animazione in pausa con «riduci movimento» (il pulsante ▶ resta). */
export const viewerAutoplay = (reduced = prefersReducedMotion()) => !reduced;
