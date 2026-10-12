// Reazioni chimiche: specie, bilanciamento algebrico, entalpia di reazione.
// Specie: una voce della libreria (id, es. "h2o") oppure un elemento nel suo stato standard ("el:Na").
// ΔH° = Σ ν·ΔHf°(prodotti) − Σ ν·ΔHf°(reagenti) con le entalpie di formazione standard a 25 °C;
// in alternativa, stima dalle energie di legame medie: legami rotti − legami formati (solo molecole covalenti).
import { bondEnergy } from './bond-energy.js';
import { createT } from '../../i18n/index.js';

const t = createT({
  it: {
    none: 'Non esiste un bilanciamento: gli stessi atomi non compaiono in entrambi i lati nelle giuste proporzioni.',
    several: 'L\'equazione ammette più bilanciamenti indipendenti: in realtà descrive più reazioni insieme.',
    positive: 'Non esiste un bilanciamento con tutti i coefficienti positivi: controlla reagenti e prodotti.',
  },
  en: {
    none: 'No balancing exists: the same atoms do not appear on both sides in the right proportions.',
    several: 'The equation has several independent balancings: it actually describes several reactions at once.',
    positive: 'No balancing exists with all coefficients positive: check reactants and products.',
  },
});

const STATE_MARK = { gas: 'g', liquido: 'l', solido: 's', liquid: 'l', solid: 's' };

/**
 * Informazioni su una specie.
 * @returns {{ key:string, formula:string, name:string, state:string|null, mark:string, hf:number|null, atoms:{z:number}[], bonds:object[], ionic:boolean, element:boolean, entry?:object }}
 */
export function speciesInfo(lab, library, elements, key) {
  if (key.startsWith('el:')) {
    const symbol = key.slice(3);
    const info = lab.bySymbol.get(symbol);
    const el = elements[info.z - 1];
    return {
      key,
      formula: symbol,
      name: el.name,
      state: el.state,
      mark: STATE_MARK[el.state] ?? '',
      hf: 0, // elemento nel suo stato standard
      atoms: [{ z: info.z, charge: 0 }],
      bonds: [],
      ionic: false,
      element: true,
      metal: info.metal,
    };
  }
  const entry = library.get(key);
  if (!entry) throw new Error(`Specie sconosciuta: ${key}`);
  return {
    key,
    formula: entry.formula ?? null,
    name: entry.name,
    state: entry.state,
    mark: STATE_MARK[entry.state] ?? '',
    hf: entry.hf ?? null,
    atoms: entry.graph.atoms,
    bonds: entry.graph.bonds,
    ionic: entry.ionic,
    element: false,
    entry,
  };
}

/** Conteggio degli atomi per elemento (numero atomico → quanti). */
export function atomCounts(species, coeffs) {
  const counts = new Map();
  species.forEach((s, i) => {
    for (const a of s.atoms) counts.set(a.z, (counts.get(a.z) || 0) + coeffs[i]);
  });
  return counts;
}

/** Confronta gli atomi dei due lati: [{z, left, right}] */
export function balanceTable(reactants, products, rc, pc) {
  const L = atomCounts(reactants, rc);
  const R = atomCounts(products, pc);
  const zs = [...new Set([...L.keys(), ...R.keys()])].sort((a, b) => a - b);
  return zs.map((z) => ({ z, left: L.get(z) || 0, right: R.get(z) || 0 }));
}

// ---------------------------------------------------------------- bilanciamento (spazio nullo intero)

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
const lcm = (a, b) => (a / gcd(a, b)) * b;

class Frac {
  constructor(n, d = 1) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1;
    this.n = n / g;
    this.d = d / g;
  }
  sub(o) {
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o) {
    return new Frac(this.n * o.n, this.d * o.d);
  }
  div(o) {
    return new Frac(this.n * o.d, this.d * o.n);
  }
  get zero() {
    return this.n === 0;
  }
}

/**
 * Coefficienti stechiometrici minimi interi e positivi.
 * @returns {{ok:true, reactants:number[], products:number[]} | {ok:false, reason:string}}
 */
export function balance(reactants, products) {
  const species = [...reactants, ...products];
  const zs = [...new Set(species.flatMap((s) => s.atoms.map((a) => a.z)))];
  const charge = (s) => s.atoms.reduce((t, a) => t + (a.charge || 0), 0);
  const rows = zs.map((z) =>
    species.map((s, j) => {
      const c = s.atoms.filter((a) => a.z === z).length;
      return new Frac(j < reactants.length ? c : -c);
    }),
  );
  // conservazione della carica (per gli ioni)
  if (species.some((s) => charge(s) !== 0)) rows.push(species.map((s, j) => new Frac(j < reactants.length ? charge(s) : -charge(s))));

  // forma a scala ridotta
  const m = rows.length;
  const n = species.length;
  const pivots = [];
  let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    let p = r;
    while (p < m && rows[p][c].zero) p++;
    if (p === m) continue;
    [rows[r], rows[p]] = [rows[p], rows[r]];
    const pv = rows[r][c];
    rows[r] = rows[r].map((x) => x.div(pv));
    for (let i = 0; i < m; i++) {
      if (i === r || rows[i][c].zero) continue;
      const f = rows[i][c];
      rows[i] = rows[i].map((x, k) => x.sub(f.mul(rows[r][k])));
    }
    pivots.push(c);
    r++;
  }
  const free = [...Array(n).keys()].filter((c) => !pivots.includes(c));
  if (free.length === 0) return { ok: false, reason: t('none') };
  if (free.length > 1) return { ok: false, reason: t('several') };
  const f = free[0];
  const x = new Array(n).fill(null);
  x[f] = new Frac(1);
  pivots.forEach((c, i) => {
    x[c] = new Frac(0).sub(rows[i][f]);
  });
  const den = x.reduce((acc, v) => lcm(acc, v.d), 1);
  let ints = x.map((v) => (v.n * den) / v.d);
  if (ints.every((v) => v < 0)) ints = ints.map((v) => -v);
  if (ints.some((v) => v <= 0)) return { ok: false, reason: t('positive') };
  const g = ints.reduce((acc, v) => gcd(acc, v), 0);
  ints = ints.map((v) => v / g);
  return { ok: true, reactants: ints.slice(0, reactants.length), products: ints.slice(reactants.length) };
}

// ---------------------------------------------------------------- energia

/** Somma delle energie di legame (kJ/mol) di una specie covalente; null se non applicabile. */
export function speciesBondEnergy(lab, s) {
  if (s.ionic || (s.element && s.metal)) return null;
  if (s.element && s.atoms.length === 1 && s.state !== 'gas') return null; // solidi come grafite, zolfo: reticolo
  let total = 0;
  for (const b of s.bonds) {
    const e = bondEnergy(lab.get(s.atoms[b.i].z), lab.get(s.atoms[b.j].z), b.order);
    if (e.kj == null) return null;
    total += e.kj;
  }
  return total;
}

/** Legami di una specie raggruppati per tipo (es. "O–H" → 2). */
function bondKinds(lab, s) {
  const out = new Map();
  const sym = { 1: '–', 2: '=', 3: '≡' };
  for (const b of s.bonds) {
    const [x, y] = [lab.get(s.atoms[b.i].z).symbol, lab.get(s.atoms[b.j].z).symbol].sort();
    const k = `${x}${sym[b.order]}${y}`;
    out.set(k, (out.get(k) || 0) + 1);
  }
  return out;
}

/**
 * Entalpia di reazione.
 * @returns {{ formation: {value:number|null, missing:string[]}, bonds: {value:number, broken:Map, formed:Map, brokenKj:number, formedKj:number}|null }}
 */
export function reactionEnthalpy(lab, reactants, products, rc, pc) {
  const missing = [];
  let value = 0;
  const side = (list, coeffs, sign) =>
    list.forEach((s, i) => {
      if (s.hf == null) missing.push(s.name);
      else value += sign * coeffs[i] * s.hf;
    });
  side(products, pc, +1);
  side(reactants, rc, -1);
  const formation = { value: missing.length ? null : value, missing };

  let bonds = null;
  const re = reactants.map((s) => speciesBondEnergy(lab, s));
  const pe = products.map((s) => speciesBondEnergy(lab, s));
  if (re.every((v) => v != null) && pe.every((v) => v != null)) {
    const brokenKj = re.reduce((t, v, i) => t + v * rc[i], 0);
    const formedKj = pe.reduce((t, v, i) => t + v * pc[i], 0);
    const collect = (list, coeffs) => {
      const m = new Map();
      list.forEach((s, i) => {
        for (const [k, c] of bondKinds(lab, s)) m.set(k, (m.get(k) || 0) + c * coeffs[i]);
      });
      return m;
    };
    bonds = { value: brokenKj - formedKj, brokenKj, formedKj, broken: collect(reactants, rc), formed: collect(products, pc) };
  }
  return { formation, bonds };
}
