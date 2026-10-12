// Geometria delle molecole.
// VSEPR: notazione AXₙEₘ e nome della forma. Posizioni 3D per rilassamento ("position based"):
//  - molle sui legami (lunghezza dai raggi covalenti, o sperimentale per le molecole della libreria)
//  - repulsione tra i domini elettronici di ogni atomo centrale (legami e coppie solitarie,
//    queste ultime più ingombranti): dà da sola lineare, trigonale, tetraedrica, bipiramidale, ottaedrica
//  - planarità attorno ai doppi legami tra atomi trigonali (etilene, benzene)
//  - angoli sperimentali, se noti
//  - repulsione tra atomi non legati
// Unità: 1 = 100 pm.
import { TIER, ionicRadius } from './elements-lab.js';
import { isItalian } from '../../i18n/index.js';

const ORDER_FACTOR = { 1: 1, 2: 0.87, 3: 0.78 }; // accorciamento tipico dei legami multipli (C–C 154, C=C 134, C≡C 120 pm)
const BOND_SYMBOL = { 1: '-', 2: '=', 3: '#' };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const vec = { sub, add, scale, dot, cross, len, norm };

/** Generatore deterministico (per piccole perturbazioni riproducibili). */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// ------------------------------------------------------------------ VSEPR

const SHAPES_IT = {
  '0-0': 'atomo isolato',
  '1-0': 'lineare',
  '2-0': 'lineare',
  '3-0': 'trigonale planare',
  '2-1': 'piegata',
  '4-0': 'tetraedrica',
  '3-1': 'piramidale trigonale',
  '2-2': 'piegata',
  '5-0': 'bipiramidale trigonale',
  '4-1': 'ad altalena',
  '3-2': 'a T',
  '2-3': 'lineare',
  '6-0': 'ottaedrica',
  '5-1': 'piramidale quadrata',
  '4-2': 'quadrato planare',
  '3-3': 'a T',
  '2-4': 'lineare',
  '7-0': 'bipiramidale pentagonale',
  '6-1': 'ottaedrica distorta',
};

const SHAPES_EN = {
  '0-0': 'isolated atom',
  '1-0': 'linear',
  '2-0': 'linear',
  '3-0': 'trigonal planar',
  '2-1': 'bent',
  '4-0': 'tetrahedral',
  '3-1': 'trigonal pyramidal',
  '2-2': 'bent',
  '5-0': 'trigonal bipyramidal',
  '4-1': 'seesaw',
  '3-2': 'T-shaped',
  '2-3': 'linear',
  '6-0': 'octahedral',
  '5-1': 'square pyramidal',
  '4-2': 'square planar',
  '3-3': 'T-shaped',
  '2-4': 'linear',
  '7-0': 'pentagonal bipyramidal',
  '6-1': 'distorted octahedral',
};

const IDEAL_IT = {
  2: '180°',
  3: '120°',
  4: '109,5°',
  5: '90° e 120°',
  6: '90°',
  7: '72° e 90°',
};
const IDEAL_EN = { ...IDEAL_IT, 4: '109.5°', 5: '90° and 120°', 7: '72° and 90°' };

/**
 * Classificazione VSEPR di ogni atomo con almeno 2 vicini.
 * @param {object} desc {atoms, bonds}
 * @param {object} lewis analyzeLewis
 */
export function vsepr(lab, desc, lewis) {
  const neighbors = desc.atoms.map(() => new Set());
  for (const b of desc.bonds) {
    neighbors[b.i].add(b.j);
    neighbors[b.j].add(b.i);
  }
  return desc.atoms.map((a, i) => {
    const X = neighbors[i].size;
    if (X < 2) return null;
    const info = lab.get(a.z);
    const la = lewis.atoms[i];
    const E = info.tier === TIER.MAIN ? la.lonePairs + la.unpaired : 0;
    const it = isItalian();
    const shape = (it ? SHAPES_IT : SHAPES_EN)[`${X}-${E}`] ?? (it ? `${X + E} domini` : `${X + E} domains`);
    const steric = X + E;
    const IDEAL = it ? IDEAL_IT : IDEAL_EN;
    let ideal = IDEAL[steric] ?? null;
    if (E > 0 && (steric === 3 || steric === 4)) ideal = `< ${IDEAL[steric]}`;
    return {
      notation: `AX${X}${E ? `E${E}` : ''}`,
      X,
      E,
      steric,
      shape,
      ideal,
      reliable: info.tier === TIER.MAIN,
    };
  });
}

// ------------------------------------------------------------------ lunghezze

/** Lunghezza di riferimento (pm) di un legame covalente: raggi covalenti × fattore per l'ordine. */
export function covalentLength(A, B, order) {
  return (A.rCov + B.rCov) * ORDER_FACTOR[order];
}

/** Distanza tra due ioni (pm): raggi ionici di Shannon se noti. */
export function ionicLength(A, qa, B, qb) {
  const ra = ionicRadius(A, qa);
  const rb = ionicRadius(B, qb);
  if (ra && rb) return { pm: ra + rb, estimated: false };
  return { pm: (A.rCov + B.rCov) * 1.15, estimated: true };
}

/** Cerca un valore sperimentale "A-B", "A=B", "A#B" (in entrambi i versi). */
function lookupBond(geo, A, B, order) {
  if (!geo) return null;
  const s = BOND_SYMBOL[order];
  return geo[`${A.symbol}${s}${B.symbol}`] ?? geo[`${B.symbol}${s}${A.symbol}`] ?? null;
}

function lookupAngle(geo, A, C, B) {
  if (!geo) return null;
  return geo[`${A.symbol}-${C.symbol}-${B.symbol}`] ?? geo[`${B.symbol}-${C.symbol}-${A.symbol}`] ?? null;
}

// ------------------------------------------------------------------ modello di rilassamento

/**
 * Prepara il rilassamento.
 * @param {object} desc {atoms:[{z,charge}], bonds:[{i,j,order}], ionic:[{i,j,transfer,donor}]}
 * @param {object[]} lewisAtoms per atomo {lonePairs, unpaired} (indici di desc)
 * @param {number[][]} positions posizioni iniziali (unità della scena), modificate in place
 * @param {object} [geo] valori sperimentali della libreria
 */
export function createRelaxer(lab, desc, lewisAtoms, positions, geo = null) {
  const n = desc.atoms.length;
  const info = desc.atoms.map((a) => lab.get(a.z));
  const rand = rng(n * 7919 + desc.bonds.length * 31 + 1);
  const pos = positions;
  // posizioni coincidenti: piccola perturbazione
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (len(sub(pos[i], pos[j])) < 0.05) pos[i] = add(pos[i], [rand() - 0.5, rand() - 0.5, rand() - 0.5]);
    }
  }
  const mobility = info.map((x) => (x.z === 1 ? 1 : 0.45));

  const neighbors = info.map(() => []);
  const bonds = desc.bonds.map((b) => {
    const A = info[b.i];
    const B = info[b.j];
    const exp = lookupBond(geo, A, B, b.order);
    neighbors[b.i].push({ k: b.j, order: b.order });
    neighbors[b.j].push({ k: b.i, order: b.order });
    return { i: b.i, j: b.j, order: b.order, r0: (exp ?? covalentLength(A, B, b.order)) / 100, experimental: exp != null };
  });
  const ionic = (desc.ionic || []).map((b) => {
    const qa = desc.atoms[b.i].charge;
    const qb = desc.atoms[b.j].charge;
    const L = ionicLength(info[b.i], qa, info[b.j], qb);
    neighbors[b.i].push({ k: b.j, order: 0 });
    neighbors[b.j].push({ k: b.i, order: 0 });
    return { i: b.i, j: b.j, r0: L.pm / 100, estimated: L.estimated };
  });

  // domini non di legame (coppie solitarie ed elettroni spaiati) per gli atomi dei gruppi principali
  const lone = info.map((x, i) => {
    const la = lewisAtoms[i];
    if (x.tier !== TIER.MAIN || !la || neighbors[i].filter((nb) => nb.order > 0).length === 0) return [];
    const out = [];
    for (let k = 0; k < la.lonePairs; k++) out.push({ w: 1.3, dir: norm([rand() - 0.5, rand() - 0.5, rand() - 0.5]), kind: 'pair' });
    if (la.unpaired) out.push({ w: 0.62, dir: norm([rand() - 0.5, rand() - 0.5, rand() - 0.5]), kind: 'single' });
    // orientazione iniziale: lontano dai legami
    let avg = [0, 0, 0];
    for (const nb of neighbors[i]) if (nb.order > 0) avg = add(avg, norm(sub(pos[nb.k], pos[i])));
    if (len(avg) > 0.1) for (const d of out) d.dir = norm(add(scale(norm(avg), -1.2), d.dir));
    return out;
  });

  // angoli sperimentali
  const angles = [];
  if (geo) {
    for (let c = 0; c < n; c++) {
      const nb = neighbors[c].filter((x) => x.order > 0).map((x) => x.k);
      // con 5 o 6 domini lo stesso tipo di angolo vale 90° o 180° a seconda della posizione: lì decide la repulsione
      if (nb.length + lone[c].length > 4) continue;
      for (let p = 0; p < nb.length; p++) {
        for (let q = p + 1; q < nb.length; q++) {
          const t = lookupAngle(geo, info[nb[p]], info[c], info[nb[q]]);
          if (t != null && t < 179) angles.push({ c, i: nb[p], j: nb[q], theta: (t * Math.PI) / 180 });
        }
      }
    }
  }
  // angoli VSEPR per gli atomi con al massimo 4 domini (C, N, O, B…): vincoli diretti, stabili anche negli anelli.
  // Per 5 e 6 domini resta la repulsione tra domini (più sotto), che sceglie le posizioni assiali/equatoriali.
  const expPairs = new Set(angles.map((a) => `${a.c}:${Math.min(a.i, a.j)}:${Math.max(a.i, a.j)}`));
  for (let c = 0; c < n; c++) {
    const nb = neighbors[c].filter((x) => x.order > 0).map((x) => x.k);
    const X = nb.length;
    if (X < 2) continue;
    const pairs = lone[c].filter((d) => d.kind === 'pair').length;
    const singles = lone[c].length - pairs;
    const SN = X + lone[c].length;
    let t = null;
    if (SN === 2) t = 180;
    else if (SN === 3) t = X === 3 ? 120 : pairs ? 117.5 : 134; // AX₂E (SO₂ ≈ 119,5°), radicale AX₂· (NO₂ 134°)
    else if (SN === 4) {
      if (X === 4) t = 109.47;
      else if (X === 3) t = pairs ? 106.8 : 118; // NH₃ 106,7°; radicale CH₃· quasi planare
      else t = 104.5; // AX₂E₂ (H₂O)
    }
    if (t == null) continue;
    for (let p = 0; p < X; p++) {
      for (let q = p + 1; q < X; q++) {
        if (expPairs.has(`${c}:${Math.min(nb[p], nb[q])}:${Math.max(nb[p], nb[q])}`)) continue;
        angles.push({ c, i: nb[p], j: nb[q], theta: (t * Math.PI) / 180, soft: true });
      }
    }
  }
  const angleCenters = new Set(angles.map((a) => a.c));
  const fixedCenter = (c) => angleCenters.has(c);

  // planarità: doppi legami tra atomi con 3 domini (sp²)
  const domainsOf = (i) => neighbors[i].filter((x) => x.order > 0).length + lone[i].length;
  const planar = bonds.filter((b) => b.order === 2 && info[b.i].tier === TIER.MAIN && info[b.j].tier === TIER.MAIN && domainsOf(b.i) === 3 && domainsOf(b.j) === 3);

  // coppie non legate (escluse le 1-3, gestite dagli angoli)
  const bonded = new Set();
  const key = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  for (let i = 0; i < n; i++) {
    for (const x of neighbors[i]) {
      bonded.add(key(i, x.k));
      for (const y of neighbors[x.k]) if (y.k !== i) bonded.add(key(i, y.k));
    }
  }
  const ionCharge = desc.atoms.map((a) => a.charge);
  const nonbonded = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (bonded.has(key(i, j))) continue;
      const sameSign = ionCharge[i] * ionCharge[j] > 0;
      const dmin = ((info[i].rCov + info[j].rCov) / 100) * (sameSign ? 2.2 : 1.55);
      nonbonded.push({ i, j, dmin });
    }
  }

  const bondLength = new Map([...bonds, ...ionic].map((b) => [key(b.i, b.j), b.r0]));
  let age = 0;
  function step(k = 1) {
    // 0. piccola agitazione iniziale: fa uscire da equilibri instabili (es. 4 legami su un piano)
    if (age < 160) {
      const amp = 0.02 * (1 - age / 160);
      for (let i = 0; i < n; i++) pos[i] = add(pos[i], [(rand() - 0.5) * amp, (rand() - 0.5) * amp, (rand() - 0.5) * amp]);
    }
    age++;
    // 1. molle sui legami
    for (const b of [...bonds, ...ionic]) {
      const d = sub(pos[b.j], pos[b.i]);
      const l = len(d) || 1e-6;
      const err = (l - b.r0) / l;
      const mi = mobility[b.i];
      const mj = mobility[b.j];
      const share = 0.5 * k;
      pos[b.i] = add(pos[b.i], scale(d, (err * share * mi) / (mi + mj) * 2));
      pos[b.j] = sub(pos[b.j], scale(d, (err * share * mj) / (mi + mj) * 2));
    }

    // 2. repulsione tra domini elettronici attorno a ogni atomo
    for (let c = 0; c < n; c++) {
      const nb = neighbors[c].filter((x) => x.order > 0);
      const domains = [
        ...nb.map((x) => ({ atom: x.k, w: 1 + 0.08 * (x.order - 1), dir: norm(sub(pos[x.k], pos[c])) })),
        ...lone[c],
      ];
      if (domains.length < 2) continue;
      // potenziale sull'angolo tra due domini: U = w·w′/θ²  → spinta lungo il cerchio massimo
      const force = domains.map(() => [0, 0, 0]);
      for (let p = 0; p < domains.length; p++) {
        for (let q = 0; q < domains.length; q++) {
          if (p === q) continue;
          const up = domains[p].dir;
          const uq = domains[q].dir;
          const cos = Math.max(-1, Math.min(1, dot(up, uq)));
          const theta = Math.max(Math.acos(cos), 0.05);
          const tangent = sub(scale(up, cos), uq); // direzione che allontana p da q
          const tl = len(tangent);
          if (tl < 1e-6) continue;
          // vicino a 180° la spinta si smorza (altrimenti oscillerebbe attorno alla posizione lineare)
          const f = ((2 * domains[p].w * domains[q].w) / theta ** 3) * Math.min(1, tl / 0.25);
          force[p] = add(force[p], scale(tangent, f / tl));
        }
      }
      const fixedAtoms = angleCenters.has(c);
      // Regole VSEPR che la sola repulsione può non trovare (minimi locali):
      // ottaedro con 2 coppie solitarie (AX4E2): coppie da parti opposte → quadrato planare
      if (lone[c].length === 2 && nb.length === 4) {
        const d = norm(sub(lone[c][0].dir, lone[c][1].dir));
        lone[c][0].dir = d;
        lone[c][1].dir = scale(d, -1);
        domains[nb.length].dir = d;
        domains[nb.length + 1].dir = scale(d, -1);
      }
      // bipiramide trigonale con coppie solitarie (AX4E, AX3E2, AX2E3): le coppie stanno all'equatore,
      // quindi i due legami più distanti sono assiali e opposti
      if (nb.length + lone[c].length === 5 && lone[c].length >= 1 && !fixedCenter(c)) {
        let best = null;
        for (let p = 0; p < nb.length; p++) {
          for (let q = p + 1; q < nb.length; q++) {
            const cos = dot(domains[p].dir, domains[q].dir);
            if (!best || cos < best.cos) best = { p, q, cos };
          }
        }
        if (best) {
          const axis = norm(sub(domains[best.p].dir, domains[best.q].dir));
          for (const [idx, sign] of [[best.p, 1], [best.q, -1]]) {
            const atom = domains[idx].atom;
            const r = len(sub(pos[atom], pos[c]));
            const cur = domains[idx].dir;
            const target = scale(axis, sign);
            const mixed = norm(add(scale(cur, 1 - 0.3 * k), scale(target, 0.3 * k)));
            pos[atom] = add(pos[c], scale(mixed, r));
            domains[idx].dir = mixed;
          }
          for (const d of lone[c]) {
            const flat = sub(d.dir, scale(axis, dot(d.dir, axis)));
            if (len(flat) > 1e-3) d.dir = norm(flat);
          }
        }
      }
      domains.forEach((dom, p) => {
        const u = dom.dir;
        const ft = sub(force[p], scale(u, dot(force[p], u))); // componente tangente
        const fl = len(ft);
        const move = scale(ft, (Math.min(fl, 6) / (fl || 1)) * 0.03 * k);
        if (dom.atom === undefined) {
          dom.dir = norm(add(u, move));
        } else if (!fixedAtoms) {
          const r = len(sub(pos[dom.atom], pos[c]));
          pos[dom.atom] = add(pos[dom.atom], scale(move, r * mobility[dom.atom] * 1.4));
        }
      });
    }

    // 3. angoli (sperimentali o VSEPR) come distanze 1–3: d² = a² + b² − 2ab·cos θ
    for (const a of angles) {
      if (a.theta > 3.13) {
        // lineare: i due vicini da parti opposte (con le distanze la convergenza vicino a 180° è lenta)
        const ui = sub(pos[a.i], pos[a.c]);
        const uj = sub(pos[a.j], pos[a.c]);
        const dir = sub(norm(ui), norm(uj));
        if (len(dir) < 1e-4) continue;
        const d = norm(dir);
        const s = 0.4 * k;
        pos[a.i] = add(pos[a.c], scale(norm(add(scale(norm(ui), 1 - s), scale(d, s))), len(ui)));
        pos[a.j] = add(pos[a.c], scale(norm(add(scale(norm(uj), 1 - s), scale(d, -s))), len(uj)));
        continue;
      }
      const ra = bondLength.get(key(a.c, a.i)) ?? len(sub(pos[a.i], pos[a.c]));
      const rb = bondLength.get(key(a.c, a.j)) ?? len(sub(pos[a.j], pos[a.c]));
      const target = Math.sqrt(ra * ra + rb * rb - 2 * ra * rb * Math.cos(a.theta));
      const d = sub(pos[a.j], pos[a.i]);
      const l = len(d) || 1e-6;
      const err = (l - target) / l;
      const mi = mobility[a.i];
      const mj = mobility[a.j];
      const s = (a.soft ? 0.35 : 0.5) * k;
      pos[a.i] = add(pos[a.i], scale(d, ((err * s * mi) / (mi + mj)) * 2));
      pos[a.j] = sub(pos[a.j], scale(d, ((err * s * mj) / (mi + mj)) * 2));
    }

    // 4. planarità dei doppi legami trigonali
    for (const b of planar) {
      const others = [...neighbors[b.i].filter((x) => x.k !== b.j), ...neighbors[b.j].filter((x) => x.k !== b.i)].filter((x) => x.order > 0);
      if (others.length < 2) continue;
      const ref = others[0].k;
      const N = norm(cross(sub(pos[b.j], pos[b.i]), sub(pos[ref], pos[b.i])));
      if (len(N) < 0.5) continue;
      for (const o of others.slice(1)) {
        const dist = dot(sub(pos[o.k], pos[b.i]), N);
        pos[o.k] = sub(pos[o.k], scale(N, dist * 0.5 * k));
      }
      for (const c of [b.i, b.j]) {
        for (const d of lone[c]) d.dir = norm(sub(d.dir, scale(N, dot(d.dir, N) * 0.5 * k)));
      }
    }

    // 5. atomi non legati troppo vicini
    for (const p of nonbonded) {
      const d = sub(pos[p.j], pos[p.i]);
      const l = len(d) || 1e-6;
      if (l >= p.dmin) continue;
      const push = scale(d, ((p.dmin - l) / l) * 0.25 * k);
      pos[p.i] = sub(pos[p.i], push);
      pos[p.j] = add(pos[p.j], push);
    }
  }

  return {
    pos,
    lone,
    bonds,
    ionic,
    neighbors,
    step,
    /** Esegue `count` passi; restituisce lo spostamento medio dell'ultimo (per sapere se è ferma). */
    run(count, k = 1) {
      let moved = 0;
      for (let s = 0; s < count; s++) {
        const before = pos.map((p) => [...p]);
        step(k);
        moved = pos.reduce((m, p, i) => m + len(sub(p, before[i])), 0) / Math.max(1, n);
      }
      return moved;
    },
  };
}

/**
 * Disposizione iniziale di una molecola costruita da zero: "stress majorization" sulle distanze nel
 * grafo (somma delle lunghezze di legame lungo il cammino più breve). Districa anelli e catene; poi il
 * rilassamento sistema angoli e coppie solitarie.
 * @param {number[]} [center] centro attorno a cui disporre gli atomi
 */
export function initialLayout(lab, desc, center = [0, 0, 0], seed = 1) {
  const n = desc.atoms.length;
  const info = desc.atoms.map((a) => lab.get(a.z));
  const INF = 1e9;
  const D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)));
  for (const b of desc.bonds) {
    const l = covalentLength(info[b.i], info[b.j], b.order) / 100;
    D[b.i][b.j] = D[b.j][b.i] = l;
  }
  for (const b of desc.ionic || []) {
    const l = ionicLength(info[b.i], desc.atoms[b.i].charge, info[b.j], desc.atoms[b.j].charge).pm / 100;
    D[b.i][b.j] = D[b.j][b.i] = l;
  }
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      const dik = D[i][k];
      if (dik >= INF) continue;
      for (let j = 0; j < n; j++) if (dik + D[k][j] < D[i][j]) D[i][j] = dik + D[k][j];
    }
  }
  let far = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (D[i][j] < INF) far = Math.max(far, D[i][j]);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (D[i][j] >= INF) D[i][j] = far + 2.5;

  const rand = rng(seed * 101 + n);
  const R = 0.8 * Math.cbrt(n) + 0.5;
  const pos = desc.atoms.map(() => [(rand() - 0.5) * R, (rand() - 0.5) * R, (rand() - 0.5) * R]);
  for (let it = 0; it < 220; it++) {
    for (let i = 0; i < n; i++) {
      let num = [0, 0, 0];
      let den = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const w = 1 / (D[i][j] * D[i][j]);
        const diff = sub(pos[i], pos[j]);
        const l = len(diff) || 1e-6;
        num = add(num, scale(add(pos[j], scale(diff, D[i][j] / l)), w));
        den += w;
      }
      if (den > 0) pos[i] = scale(num, 1 / den);
    }
  }
  const c = scale(pos.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / Math.max(1, n));
  // piccola perturbazione: permette agli anelli saturi di piegarsi (cicloesano "a sedia")
  return pos.map((p) => add(add(sub(p, c), center), [(rand() - 0.5) * 0.3, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.3]));
}

/** Angolo (gradi) tra i legami c–i e c–j. */
export function angleAt(pos, c, i, j) {
  const a = norm(sub(pos[i], pos[c]));
  const b = norm(sub(pos[j], pos[c]));
  return (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;
}
