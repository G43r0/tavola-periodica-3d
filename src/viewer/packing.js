// Impacchettamento dei nucleoni: sfere rigide che si compattano verso il centro
// (rilassamento iterativo). Protoni e neutroni restano mescolati, come nei nuclei reali.
import { mulberry32 } from './orbital-math.js';

export const NUCLEON_R = 0.5;
const PACKING = 0.62; // frazione di volume occupata (impacchettamento casuale denso ≈ 0,64)

/** Raggio approssimato del nucleo compattato con A nucleoni (unità della scena). */
export const nucleusRadius = (A) => (A <= 1 ? NUCLEON_R : NUCLEON_R * Math.cbrt(A / PACKING));

/** Punto casuale uniforme in una sfera di raggio R. */
export function randomInBall(rand, R) {
  for (;;) {
    const x = 2 * rand() - 1;
    const y = 2 * rand() - 1;
    const z = 2 * rand() - 1;
    if (x * x + y * y + z * z <= 1) return [x * R, y * R, z * R];
  }
}

/**
 * Rilassa le posizioni (array piatto xyz, modificato in place):
 * attrazione verso il centro + separazione delle sfere sovrapposte.
 */
export function relax(pos, count, iterations = 90) {
  if (count <= 1) {
    pos.fill(0, 0, 3);
    return pos;
  }
  const minD = 2 * NUCLEON_R;
  const minD2 = minD * minD;
  const R = nucleusRadius(count);
  for (let it = 0; it < iterations; it++) {
    const pull = 0.06 * (1 - it / iterations) + 0.01;
    for (let i = 0; i < count; i++) {
      const k = i * 3;
      const d = Math.hypot(pos[k], pos[k + 1], pos[k + 2]);
      if (d > 1e-6) {
        const step = Math.min(d, pull * Math.max(0.2, d / R));
        pos[k] -= (pos[k] / d) * step;
        pos[k + 1] -= (pos[k + 1] / d) * step;
        pos[k + 2] -= (pos[k + 2] / d) * step;
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < count; i++) {
        const a = i * 3;
        for (let j = i + 1; j < count; j++) {
          const b = j * 3;
          let dx = pos[b] - pos[a];
          let dy = pos[b + 1] - pos[a + 1];
          let dz = pos[b + 2] - pos[a + 2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 >= minD2) continue;
          let d = Math.sqrt(d2);
          if (d < 1e-6) {
            dx = 1e-3 * (i - j);
            dy = 1e-3;
            dz = 0;
            d = Math.hypot(dx, dy);
          }
          const push = (minD - d) / 2 / d;
          pos[a] -= dx * push;
          pos[a + 1] -= dy * push;
          pos[a + 2] -= dz * push;
          pos[b] += dx * push;
          pos[b + 1] += dy * push;
          pos[b + 2] += dz * push;
        }
      }
    }
  }
  // ricentra
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < count; i++) {
    cx += pos[i * 3];
    cy += pos[i * 3 + 1];
    cz += pos[i * 3 + 2];
  }
  cx /= count;
  cy /= count;
  cz /= count;
  for (let i = 0; i < count; i++) {
    pos[i * 3] -= cx;
    pos[i * 3 + 1] -= cy;
    pos[i * 3 + 2] -= cz;
  }
  return pos;
}

/** Disposizione iniziale compatta e deterministica per A nucleoni. */
export function packNucleus(count, seed) {
  const rand = mulberry32(seed);
  const pos = new Float32Array(count * 3);
  const R = nucleusRadius(count) * 1.15;
  for (let i = 0; i < count; i++) pos.set(randomInBall(rand, R), i * 3);
  return relax(pos, count, 110);
}

/** Mescola gli indici in modo deterministico (Fisher–Yates). */
export function shuffled(count, seed) {
  const rand = mulberry32(seed);
  const idx = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
