// Spatola-cucchiaio: quanto solido si prende dal barattolo (un cucchiaino, un pizzico) e come lo si versa nel
// recipiente: tutto d'un colpo (E), lasciandolo scivolare piano (E tenuto) oppure a colpetti (Maiusc+E), per arrivare
// alla massa voluta guardando la bilancia. Modulo puro (niente Three.js né DOM): lo usa game.js, lo provano i test.

/** Millisecondi di E tenuto sul recipiente dopo cui il solido comincia a scivolare piano (prima è un tocco: cade tutto). */
export const TRICKLE_HOLD_MS = 200;

/** Sotto questa massa (g) quello che resta sul cucchiaio cade tutto insieme. */
export const SPOON_EMPTY_G = 0.002;

/**
 * Grammi presi dal barattolo. Modalità semplice: esattamente 1 g (un pizzico 0,1 g). Reale: un cucchiaino raso pesa
 * 1 g ± 5 % e un pizzico 0,1 g ± 20 %, perché la quantità esatta la dice la bilancia.
 * @param {'simple'|'real'} mode
 * @param {boolean} pinch
 * @param {() => number} [rand]
 */
export function scoopGrams(mode, pinch, rand = Math.random) {
  const g = pinch ? 0.1 : 1;
  if (mode === 'simple') return g;
  return g * (1 + (rand() * 2 - 1) * (pinch ? 0.2 : 0.05));
}

/**
 * Grammi che cadono con un colpetto sulla spatola (Maiusc+E): pochi centesimi, per gli ultimi ritocchi.
 * @param {'simple'|'real'} mode
 * @param {() => number} [rand]
 */
export function tapGrams(mode, rand = Math.random) {
  return mode === 'simple' ? 0.02 : 0.015 + rand() * 0.015;
}

/**
 * Portata (g/s) del solido che scivola dalla spatola tenendo premuto E: parte lenta (0,04 g/s, per avvicinarsi alla
 * massa voluta senza superarla) e accelera finché si tiene premuto, fino a 0,5 g/s dopo circa 4 s.
 * @param {number} t secondi da quando il solido ha cominciato a scivolare
 */
export function trickleRate(t) {
  return Math.min(0.5, 0.04 + 0.12 * Math.max(0, t));
}

/**
 * Dimensioni del mucchietto nel cucchiaio (fattori di scala della semisfera): si allarga fino a riempire il cucchiaio
 * e poi cresce in altezza. 1 g riempie il cucchiaio e fa una piccola cupola sopra il bordo.
 * @param {number} grams
 * @returns {{ xz: number, y: number }}
 */
export function spoonHeap(grams) {
  const s = Math.min(1.5, Math.cbrt(Math.max(0, grams)));
  return { xz: 0.3 + 0.7 * Math.min(1, s), y: 0.15 + 0.35 * s };
}
