// I nove pittogrammi di pericolo GHS (regolamento CE 1272/2008, «CLP»): nome nelle tre lingue e disegno stilizzato in
// tracciati SVG su un quadrato 100 × 100, dentro il rombo bianco bordato di rosso. Gli stessi tracciati servono alle
// etichette dei reagenti (Canvas, con Path2D) e al libro «Come si fa» (SVG). Modulo puro (niente DOM).

/** Stella a `n` punte: raggio esterno r1, interno r2 (scoppio dell'esplosivo, stella sul petto). */
function star(cx, cy, r1, r2, n) {
  const pts = [];
  for (let k = 0; k < n * 2; k++) {
    const a = (k * Math.PI) / n - Math.PI / 2;
    const r = k % 2 ? r2 : r1;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/**
 * Parti del disegno: `fill` (riempita di nero o del colore dato) oppure `stroke` (spessore della linea).
 * `white`: riempita di bianco (occhi del teschio, stella sul petto).
 */
export const GHS = {
  GHS01: {
    name: { it: 'Esplosivo', en: 'Explosive', eli6: 'Può esplodere' },
    parts: [
      { fill: circle(40, 62, 12) },
      { stroke: 3.5, d: 'M48 53L55 45' },
      { fill: star(61, 38, 13, 5, 8) },
      { fill: 'M72 53l7 2-5 5Z' },
      { fill: 'M66 62l6 4-7 2Z' },
      { fill: 'M30 41l6-5 2 7Z' },
    ],
  },
  GHS02: {
    name: { it: 'Infiammabile', en: 'Flammable', eli6: 'Prende fuoco' },
    parts: [
      { fill: 'M50 21c3 9 12 15 13 26c1 9-4 16-13 18c-9-2-14-9-13-17c1-7 6-11 8-17c2 5 4 8 7 9c2-6 0-13-2-19Z' },
      { fill: 'M30 72h40v5H30Z' },
    ],
  },
  GHS03: {
    name: { it: 'Comburente', en: 'Oxidising', eli6: 'Fa bruciare di più le altre cose' },
    parts: [
      { stroke: 5, d: circle(50, 61, 10) },
      { fill: 'M50 23c2 6 8 10 9 17c0 4-2 7-4 8c-1-3-3-5-5-6c-2 1-4 3-5 6c-2-1-4-4-4-8c1-7 6-10 9-17Z' },
      { fill: 'M30 76h40v4H30Z' },
    ],
  },
  GHS04: {
    name: { it: 'Gas sotto pressione', en: 'Gas under pressure', eli6: 'Gas chiuso stretto nella bombola' },
    parts: [
      { fill: 'M30 52h34a7 7 0 0 1 0 14H30a7 7 0 0 1 0-14Z' },
      { fill: 'M66 56h5v6h-5Z' },
      { fill: 'M71 54h5v10h-5Z' },
    ],
  },
  GHS05: {
    name: { it: 'Corrosivo', en: 'Corrosive', eli6: 'Brucia la pelle e rovina i metalli' },
    parts: [
      { fill: 'M25 31l10-6 13 18-10 6Z' },
      { fill: 'M75 31l-10-6-13 18 10 6Z' },
      { fill: circle(45, 54, 2.2) },
      { fill: circle(43, 60, 2.2) },
      { fill: circle(55, 54, 2.2) },
      { fill: circle(57, 60, 2.2) },
      { fill: 'M23 66h11l3 4 3-4h7v9H23Z' },
      { fill: 'M54 75c-2 0-3-2-1-4c4-5 13-6 23-4v8Z' },
    ],
  },
  GHS06: {
    name: { it: 'Tossicità acuta', en: 'Acute toxicity', eli6: 'Velenoso' },
    parts: [
      { stroke: 6, d: 'M32 63L68 78M68 63L32 78' },
      { fill: 'M50 25c-10 0-17 7-17 16c0 6 3 10 7 12v6h20v-6c4-2 7-6 7-12c0-9-7-16-17-16Z' },
      { white: true, fill: circle(43.5, 42, 4.5) },
      { white: true, fill: circle(56.5, 42, 4.5) },
      { white: true, fill: 'M50 48l3 5h-6Z' },
    ],
  },
  GHS07: {
    name: { it: 'Nocivo, irritante', en: 'Harmful, irritant', eli6: 'Fa male o irrita la pelle e gli occhi' },
    parts: [
      { fill: 'M45 25h10l-2 35h-6Z' },
      { fill: circle(50, 69, 5) },
    ],
  },
  GHS08: {
    name: { it: 'Pericolo per la salute', en: 'Health hazard', eli6: 'Fa male al corpo, anche dopo tanto tempo' },
    parts: [
      { fill: circle(50, 28, 7) },
      { fill: 'M28 78c0-20 9-36 22-36s22 16 22 36Z' },
      { white: true, fill: star(50, 59, 11, 4.5, 8) },
    ],
  },
  GHS09: {
    name: { it: 'Pericoloso per l\'ambiente', en: 'Hazardous to the environment', eli6: 'Fa male ai pesci e alle piante' },
    parts: [
      { stroke: 3, d: 'M24 75H76' },
      { stroke: 3.5, d: 'M36 73V40M36 50l-8-7M36 57l9-8M36 46l4-9M36 63l-7-5' },
      { fill: 'M50 64c5-6 15-6 21 0c-6 6-16 6-21 0ZM50 64l-6-5v10Z' },
      { stroke: 1.6, white: true, d: 'M63 61l3 3M66 61l-3 3' },
    ],
  },
};

export const GHS_IDS = Object.keys(GHS);

/**
 * Avvertenza dell'etichetta: «Pericolo» per i pericoli più gravi, «Attenzione» per gli altri (art. 20 del CLP).
 */
export const SIGNAL = {
  danger: { it: 'Pericolo', en: 'Danger', eli6: 'Pericolo!' },
  warning: { it: 'Attenzione', en: 'Warning', eli6: 'Attenzione' },
};
