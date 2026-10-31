// Lettore SMILES, per scrivere la libreria di molecole in modo compatto e per incollare le SMILES di PubChem o Wikipedia.
// Supporta: sottoinsieme organico (B C N O P S F Cl Br I) con idrogeni impliciti, atomi tra parentesi quadre con
// isotopo, stereochimica, idrogeni, carica e classe ([NH4+], [O-2], [13CH4], [C@@H], [Na+]), legami - = # : / \,
// rami ( ), chiusure di anello 1–9 e %nn, componenti separate da "." (composti ionici) e aromatici minuscoli
// (c1ccccc1), che diventano una struttura di Kekulé. Isotopo e stereochimica si leggono ma non servono al banco.

import { createT } from '../../i18n/index.js';

const t = createT({
  it: {
    invalid: 'SMILES non valido: {s}',
    unknown: 'Elemento sconosciuto: {s}',
    near: 'SMILES non valido vicino a "{s}"',
    ring: 'Anello non chiuso in {s}',
    aromatic: 'SMILES aromatica non valida: {s} (scrivi la struttura con i doppi legami, es. C1=CC=CC=C1)',
  },
  en: {
    invalid: 'Invalid SMILES: {s}',
    unknown: 'Unknown element: {s}',
    near: 'Invalid SMILES near "{s}"',
    ring: 'Unclosed ring in {s}',
    aromatic: 'Invalid aromatic SMILES: {s} (write the structure with double bonds, e.g. C1=CC=CC=C1)',
  },
});

const ORGANIC = { B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6], F: [1], Cl: [1], Br: [1], I: [1] };
// aromatici minuscoli: nel sottoinsieme organico e (anche se e as) tra parentesi quadre
const AROMATIC = { b: 'B', c: 'C', n: 'N', o: 'O', p: 'P', s: 'S' };
const BRACKET_AROMATIC = { ...AROMATIC, se: 'Se', as: 'As' };
// «/» e «\» dicono solo da che parte sta il sostituente di un doppio legame: per il banco sono legami semplici
const BOND = { '-': { order: 1 }, '=': { order: 2 }, '#': { order: 3 }, ':': { order: 1, arom: true }, '/': { order: 1 }, '\\': { order: 1 } };
// numero di massa, simbolo, stereochimica, idrogeni (H e al massimo una cifra, come in OpenSMILES), carica, classe
const BRACKET = /^(\d+)?([A-Z][a-z]?|se|as|[bcnops])(@(?:@|TH[12]|AL[12]|SP[123]|TB\d{1,2}|OH\d{1,2})?)?(H(\d?))?([+-]+\d*|[+-]\d+)?(?::\d+)?$/;
const KEKULE_STEPS = 200000;

/**
 * @param {string} smiles
 * @param {Map<string,{z:number}>} bySymbol
 * @returns {{atoms:{z:number,charge:number}[], bonds:{i:number,j:number,order:number}[]}} con idrogeni espliciti
 */
export function parseSmiles(smiles, bySymbol) {
  const atoms = []; // {z, symbol, charge, hCount|null (implicito), organic, arom}
  const bonds = []; // {i, j, order, arom: true (scritto «:») | false (scritto) | null (non scritto)}
  const stack = [];
  const rings = new Map();
  let prev = null;
  let pending = null; // simbolo di legame in attesa dell'atomo seguente
  let i = 0;

  const near = (k) => new Error(t('near', { s: smiles.slice(k) || smiles }));
  const bond = (a, b, p) => ({ i: a, j: b, order: p?.order ?? 1, arom: p ? Boolean(p.arom) : null });
  const addAtom = (atom) => {
    // un legame scritto senza un atomo prima («=C», «C.=C») non lega niente
    if (pending && prev === null) throw near(i);
    const idx = atoms.length;
    atoms.push(atom);
    if (prev !== null) bonds.push(bond(prev, idx, pending));
    pending = null;
    prev = idx;
  };

  while (i < smiles.length) {
    const ch = smiles[i];
    if (ch === '(') {
      // un ramo parte da un atomo e comincia con un atomo o un legame («C(=O)»), mai vuoto
      if (prev === null || pending || smiles[i + 1] === ')') throw near(i);
      stack.push(prev);
      i++;
    } else if (ch === ')') {
      // «C)C»: prima si prendeva un atomo inesistente dalla pila vuota
      if (!stack.length || prev === null || pending) throw near(i);
      prev = stack.pop();
      i++;
    } else if (ch === '.') {
      if (prev === null || pending || i === smiles.length - 1) throw near(i);
      prev = null;
      i++;
    } else if (BOND[ch]) {
      if (pending || prev === null) throw near(i);
      pending = BOND[ch];
      i++;
    } else if (/[0-9%]/.test(ch)) {
      const d = ch === '%' ? smiles.slice(i + 1, i + 3) : ch;
      if (!/^\d+$/.test(d) || (ch === '%' && d.length < 2) || prev === null) throw near(i);
      if (rings.has(d)) {
        const r = rings.get(d);
        if (r.atom === prev || bonds.some((b) => (b.i === r.atom && b.j === prev) || (b.i === prev && b.j === r.atom))) throw near(i);
        if (r.bond && pending && r.bond.order !== pending.order) throw near(i);
        bonds.push(bond(r.atom, prev, pending ?? r.bond));
        rings.delete(d);
      } else {
        rings.set(d, { atom: prev, bond: pending });
      }
      pending = null;
      i += ch === '%' ? 3 : 1;
    } else if (ch === '[') {
      const end = smiles.indexOf(']', i);
      // senza «]» (es. mentre si scrive «[Cu(NH3)4]2+») si ripartirebbe da capo all'infinito
      if (end < 0) throw new Error(t('invalid', { s: smiles.slice(i) }));
      const body = smiles.slice(i + 1, end);
      const m = body.match(BRACKET);
      if (!m) throw new Error(t('invalid', { s: `[${body}]` }));
      const symbol = BRACKET_AROMATIC[m[2]] ?? m[2];
      const el = bySymbol.get(symbol);
      if (!el) throw new Error(t('unknown', { s: m[2] }));
      let charge = 0;
      if (m[6]) {
        const sign = m[6][0] === '+' ? 1 : -1;
        const digits = m[6].replace(/[+-]/g, '');
        charge = sign * (digits ? Number(digits) : m[6].length);
      }
      const hCount = m[4] ? (m[5] ? Number(m[5]) : 1) : 0;
      addAtom({ z: el.z, symbol, charge, hCount, organic: false, arom: m[2] in BRACKET_AROMATIC });
      i = end + 1;
    } else {
      const two = smiles.slice(i, i + 2);
      const sym = ORGANIC[two] ? two : ch;
      if (ORGANIC[sym]) {
        addAtom({ z: bySymbol.get(sym).z, symbol: sym, charge: 0, hCount: null, organic: true, arom: false });
        i += sym.length;
      } else if (AROMATIC[ch]) {
        addAtom({ z: bySymbol.get(AROMATIC[ch]).z, symbol: AROMATIC[ch], charge: 0, hCount: null, organic: true, arom: true });
        i++;
      } else throw near(i);
    }
  }
  if (pending || stack.length) throw new Error(t('invalid', { s: smiles }));
  if (rings.size) throw new Error(t('ring', { s: smiles }));
  if (atoms.some((a) => a.arom)) kekulize(atoms, bonds, smiles);

  // idrogeni impliciti
  const valence = atoms.map(() => 0);
  for (const b of bonds) {
    valence[b.i] += b.order;
    valence[b.j] += b.order;
  }
  const out = atoms.map((a) => ({ z: a.z, charge: a.charge }));
  const outBonds = bonds.map((b) => ({ i: b.i, j: b.j, order: b.order }));
  atoms.forEach((a, idx) => {
    let h = a.hCount;
    if (a.organic) {
      const target = ORGANIC[a.symbol].find((v) => v >= valence[idx]) ?? valence[idx];
      h = target - valence[idx];
    }
    for (let k = 0; k < h; k++) {
      out.push({ z: 1, charge: 0 });
      outBonds.push({ i: idx, j: out.length - 1, order: 1 });
    }
  });
  return { atoms: out, bonds: outBonds };
}

/** Legami che stanno in un anello (non sono ponti del grafo). */
function ringBondSet(n, bonds) {
  const adj = Array.from({ length: n }, () => []);
  bonds.forEach((b, k) => {
    adj[b.i].push([b.j, k]);
    adj[b.j].push([b.i, k]);
  });
  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const bridges = new Set();
  let time = 0;
  const dfs = (u, via) => {
    disc[u] = low[u] = time++;
    for (const [v, k] of adj[u]) {
      if (k === via) continue;
      if (disc[v] < 0) {
        dfs(v, k);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) bridges.add(k);
      } else low[u] = Math.min(low[u], disc[v]);
    }
  };
  for (let u = 0; u < n; u++) if (disc[u] < 0) dfs(u, -1);
  return new Set(bonds.map((_, k) => k).filter((k) => !bridges.has(k)));
}

/**
 * Aromatici minuscoli → struttura di Kekulé: ogni atomo aromatico che ha ancora una valenza libera (c, la n della
 * piridina; non la o del furano né [nH]) riceve esattamente un doppio legame con un vicino aromatico dell'anello.
 */
function kekulize(atoms, bonds, smiles) {
  const fail = () => new Error(t('aromatic', { s: smiles }));
  const inRing = ringBondSet(atoms.length, bonds);
  // legame aromatico: «:» oppure non scritto tra due atomi aromatici dello stesso anello (il «-» del bifenile no)
  const arom = bonds.map((b, k) => b.arom === true || (b.arom === null && atoms[b.i].arom && atoms[b.j].arom && inRing.has(k)));
  const used = atoms.map(() => 0);
  bonds.forEach((b, k) => {
    used[b.i] += arom[k] ? 1 : b.order;
    used[b.j] += arom[k] ? 1 : b.order;
  });
  const needs = atoms.map((a, idx) => {
    if (!a.arom) return false;
    if (!bonds.some((b, k) => arom[k] && (b.i === idx || b.j === idx))) throw fail(); // aromatico fuori da un anello
    const base = ORGANIC[a.symbol]?.[0] ?? (a.symbol === 'Se' ? 2 : 3);
    // la carica cambia la valenza: N⁺ e O⁺ ne hanno una in più, C⁻ e C⁺ una in meno
    const group15or16 = ['N', 'P', 'As', 'O', 'S', 'Se'].includes(a.symbol);
    const v = group15or16 ? base + a.charge : base - Math.abs(a.charge);
    return v - used[idx] - (a.hCount ?? 0) >= 1;
  });
  const options = (idx) => bonds.flatMap((b, k) => (arom[k] && (b.i === idx || b.j === idx) ? [[b.i === idx ? b.j : b.i, k]] : [])).filter(([o]) => needs[o]);
  const mate = new Map();
  const doubles = new Set();
  let steps = 0;
  const solve = () => {
    let best = -1;
    let bestOpts = null;
    for (let a = 0; a < atoms.length; a++) {
      if (!needs[a] || mate.has(a)) continue;
      const opts = options(a).filter(([o]) => !mate.has(o));
      if (!opts.length) return false;
      if (best < 0 || opts.length < bestOpts.length) {
        best = a;
        bestOpts = opts;
      }
    }
    if (best < 0) return true;
    for (const [o, k] of bestOpts) {
      if (++steps > KEKULE_STEPS) throw fail();
      mate.set(best, o).set(o, best);
      doubles.add(k);
      if (solve()) return true;
      mate.delete(best);
      mate.delete(o);
      doubles.delete(k);
    }
    return false;
  };
  if (!solve()) throw fail();
  bonds.forEach((b, k) => {
    if (arom[k]) b.order = doubles.has(k) ? 2 : 1;
  });
}
