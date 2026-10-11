// Numeri quantici degli elettroni e orbitali reali.
// Riempimento dei sottolivelli secondo la configurazione dello stato fondamentale
// (electron-config.js) e, dentro ogni sottolivello, regola di Hund:
// prima un elettrone con spin +½ in ogni orbitale (mₗ da −l a +l), poi gli spin −½.

import { subshells, L_LETTERS, SHELL_LETTERS } from './electron-config.js';

/**
 * Orbitali reali (combinazioni delle armoniche sferiche complesse), convenzione standard:
 * m > 0 → funzioni "coseno" (asse x), m < 0 → funzioni "seno" (asse y).
 * `fn(x, y, z)` è la parte angolare non normalizzata su un versore (x² + y² + z² = 1).
 */
export const REAL_ORBITALS = {
  0: [{ m: 0, key: 's', html: '', fn: () => 1 }],
  1: [
    { m: -1, key: 'py', html: 'p<sub>y</sub>', fn: (x, y) => y },
    { m: 0, key: 'pz', html: 'p<sub>z</sub>', fn: (x, y, z) => z },
    { m: 1, key: 'px', html: 'p<sub>x</sub>', fn: (x) => x },
  ],
  2: [
    { m: -2, key: 'dxy', html: 'd<sub>xy</sub>', fn: (x, y) => x * y },
    { m: -1, key: 'dyz', html: 'd<sub>yz</sub>', fn: (x, y, z) => y * z },
    { m: 0, key: 'dz2', html: 'd<sub>z²</sub>', fn: (x, y, z) => 3 * z * z - 1 },
    { m: 1, key: 'dxz', html: 'd<sub>xz</sub>', fn: (x, y, z) => x * z },
    { m: 2, key: 'dx2y2', html: 'd<sub>x²−y²</sub>', fn: (x, y) => x * x - y * y },
  ],
  3: [
    { m: -3, key: 'fy3x2y2', html: 'f<sub>y(3x²−y²)</sub>', fn: (x, y) => y * (3 * x * x - y * y) },
    { m: -2, key: 'fxyz', html: 'f<sub>xyz</sub>', fn: (x, y, z) => x * y * z },
    { m: -1, key: 'fyz2', html: 'f<sub>yz²</sub>', fn: (x, y, z) => y * (5 * z * z - 1) },
    { m: 0, key: 'fz3', html: 'f<sub>z³</sub>', fn: (x, y, z) => z * (5 * z * z - 3) },
    { m: 1, key: 'fxz2', html: 'f<sub>xz²</sub>', fn: (x, y, z) => x * (5 * z * z - 1) },
    { m: 2, key: 'fzx2y2', html: 'f<sub>z(x²−y²)</sub>', fn: (x, y, z) => z * (x * x - y * y) },
    { m: 3, key: 'fx3', html: 'f<sub>x(x²−3y²)</sub>', fn: (x, y) => x * (x * x - 3 * y * y) },
  ],
};

export const orbitalOf = (l, ml) => REAL_ORBITALS[l].find((o) => o.m === ml);

/** Nome dell'orbitale in HTML, es. "3d<sub>xy</sub>" */
export const orbitalHtml = (n, l, ml) => `${n}${l === 0 ? 's' : orbitalOf(l, ml).html}`;

/** Occupazione per sottolivello e per orbitale (regola di Hund). */
export function orbitalOccupancy(z) {
  return subshells(z).map((s) => {
    const count = 2 * s.l + 1;
    const orbitals = REAL_ORBITALS[s.l].map((o, idx) => ({
      ...o,
      n: s.n,
      l: s.l,
      id: `${s.n}${L_LETTERS[s.l]}${o.key === 's' ? '' : `-${o.key}`}`,
      electrons: (s.electrons > idx ? 1 : 0) + (s.electrons > count + idx ? 1 : 0),
    }));
    return { ...s, orbitals, full: s.electrons === 2 * count };
  });
}

/**
 * Elenco di tutti gli elettroni con i quattro numeri quantici.
 * @returns {{n:number,l:number,ml:number,ms:number,subshell:string,shell:string,orbitalKey:string}[]}
 */
export function electronList(z) {
  const out = [];
  for (const s of subshells(z)) {
    const count = 2 * s.l + 1;
    for (let k = 0; k < s.electrons; k++) {
      const idx = k % count;
      const ml = -s.l + idx;
      out.push({
        n: s.n,
        l: s.l,
        ml,
        ms: k < count ? 0.5 : -0.5,
        subshell: s.label,
        shell: SHELL_LETTERS[s.n - 1],
        orbitalKey: orbitalOf(s.l, ml).key,
      });
    }
  }
  return out;
}

/** Sottolivelli "di valenza": guscio più esterno + sottolivelli d/f incompleti. */
export function isValence(sub, maxN) {
  return sub.n === maxN || (sub.l >= 2 && !sub.full);
}
