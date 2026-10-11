// Orbitali idrogenoidi: ψ(n,l,m) = R_nl(r) · Y_lm(θ,φ), con Z = 1 e r in raggi di Bohr.
// Le forme sono esatte; le dimensioni vengono poi riscalate nel visualizzatore.
// Campionamento della densità di probabilità |ψ|²:
//  - parte radiale: inversione della funzione cumulativa di r²·R_nl(r)²
//  - parte angolare: rejection sampling su |Y_lm|²

/** Generatore pseudo-casuale deterministico (Mulberry32). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Polinomio di Laguerre generalizzato L_k^α(x) (ricorrenza a tre termini). */
function laguerre(k, alpha, x) {
  if (k === 0) return 1;
  let l0 = 1;
  let l1 = 1 + alpha - x;
  for (let i = 1; i < k; i++) {
    const l2 = ((2 * i + 1 + alpha - x) * l1 - (i + alpha) * l0) / (i + 1);
    l0 = l1;
    l1 = l2;
  }
  return l1;
}

/** Parte radiale non normalizzata R_nl(r). */
export function radial(n, l, r) {
  const rho = (2 * r) / n;
  return rho ** l * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho);
}

const BINS = 2048;
const tables = new Map();

function radialTable(n, l) {
  const key = `${n}:${l}`;
  if (tables.has(key)) return tables.get(key);
  const rMax = 1.6 * n * (n + 8);
  const dr = rMax / BINS;
  const cdf = new Float64Array(BINS + 1);
  let acc = 0;
  for (let i = 0; i < BINS; i++) {
    const r = (i + 0.5) * dr;
    const R = radial(n, l, r);
    acc += r * r * R * R;
    cdf[i + 1] = acc;
  }
  for (let i = 1; i <= BINS; i++) cdf[i] /= acc;
  const table = { cdf, dr };
  tables.set(key, table);
  return table;
}

function invert({ cdf, dr }, u) {
  let lo = 0;
  let hi = BINS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] < u) lo = mid;
    else hi = mid;
  }
  const span = cdf[hi] - cdf[lo] || 1;
  return (lo + (u - cdf[lo]) / span) * dr;
}

/** Raggio entro cui cade la frazione q della probabilità (es. 0,9 → 90%). */
export function radiusQuantile(n, l, q) {
  return invert(radialTable(n, l), q);
}

/**
 * Campiona `count` punti distribuiti secondo |ψ_nlm|².
 * @param {{fn:(x:number,y:number,z:number)=>number}} angular parte angolare reale
 * @returns {{ positions: Float32Array, signs: Int8Array, density: Float32Array }}
 *   coordinate chimiche (z = asse polare); density = |ψ|² relativo (0–1) in ogni punto
 */
export function sampleOrbital(n, l, angular, count, seed) {
  const rand = mulberry32(seed);
  const table = radialTable(n, l);
  const fn = angular.fn;

  // massimo di |Y|² sulla sfera (stima numerica con margine)
  let ymax = 0;
  for (let i = 0; i < 4000; i++) {
    const z = 2 * rand() - 1;
    const phi = 2 * Math.PI * rand();
    const s = Math.sqrt(1 - z * z);
    const a = fn(s * Math.cos(phi), s * Math.sin(phi), z);
    ymax = Math.max(ymax, a * a);
  }
  ymax *= 1.08;

  const positions = new Float32Array(count * 3);
  const signs = new Int8Array(count);
  const density = new Float32Array(count);
  let dmax = 0;
  for (let i = 0; i < count; i++) {
    let x, y, z, a;
    do {
      z = 2 * rand() - 1;
      const phi = 2 * Math.PI * rand();
      const s = Math.sqrt(1 - z * z);
      x = s * Math.cos(phi);
      y = s * Math.sin(phi);
      a = fn(x, y, z);
    } while (rand() * ymax > a * a);
    const r = invert(table, rand());
    positions[i * 3] = x * r;
    positions[i * 3 + 1] = y * r;
    positions[i * 3 + 2] = z * r;
    const R = radial(n, l, r);
    signs[i] = R * a >= 0 ? 1 : -1;
    density[i] = R * R * a * a;
    dmax = Math.max(dmax, density[i]);
  }
  for (let i = 0; i < count; i++) density[i] /= dmax || 1;
  return { positions, signs, density };
}
