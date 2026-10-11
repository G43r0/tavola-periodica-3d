// Formule e riconoscimento delle molecole.
// L'"impronta" di un grafo (algoritmo di Weisfeiler–Lehman) non dipende dall'ordine in cui gli atomi
// sono stati aggiunti: due molecole con la stessa impronta hanno la stessa struttura.
import { parseSmiles } from './smiles.js';

const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' };
export const subscript = (n) => String(n).replace(/\d/g, (d) => SUB[d]);
export const chargeText = (q) => (q === 0 ? '' : `${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '-'}`.replace(/[\d+-]/g, (c) => SUP[c]));

function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Conteggio degli elementi. */
export function countElements(lab, atoms) {
  const counts = new Map();
  for (const a of atoms) {
    const s = lab.get(a.z).symbol;
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  return counts;
}

/** Ordine di Hill: C, H, poi alfabetico (senza carbonio: tutto alfabetico). Chiave canonica per le ricerche. */
export function hillOrder(counts) {
  const syms = [...counts.keys()];
  if (counts.has('C')) {
    return ['C', ...(counts.has('H') ? ['H'] : []), ...syms.filter((s) => s !== 'C' && s !== 'H').sort()];
  }
  return syms.sort();
}

export function formulaKey(lab, atoms, charge = 0) {
  const counts = countElements(lab, atoms);
  return hillOrder(counts).map((s) => `${s}${counts.get(s) > 1 ? counts.get(s) : ''}`).join('') + (charge ? `(${charge})` : '');
}

/**
 * Formula da mostrare. Composti ionici: prima il catione (NaCl, MgCl₂); molecole: ordine di Hill;
 * composti inorganici binari senza C: il meno elettronegativo prima (H₂O, NH₃, SO₂, CO₂ con C…).
 */
export function displayFormula(lab, atoms, charge = 0, { ionic = false } = {}) {
  const counts = countElements(lab, atoms);
  const en = (s) => lab.bySymbol.get(s).en ?? 2;
  let order;
  if (ionic) {
    // prima i cationi (atomi con carica positiva), poi il resto per elettronegatività crescente
    const cations = new Set(atoms.filter((a) => a.charge > 0).map((a) => lab.get(a.z).symbol));
    order = [...counts.keys()].sort((a, b) => (cations.has(b) - cations.has(a)) || en(a) - en(b));
  } else if (counts.has('C')) {
    order = hillOrder(counts);
  } else {
    // idrogeno per primo con ossigeno, zolfo e alogeni (H₂O, HCl, H₂SO₄); per ultimo con N, P, B, Si (NH₃, PH₃)
    const acidLike = [...counts.keys()].some((s) => [16, 17].includes(lab.bySymbol.get(s).group));
    order = [...counts.keys()].sort((a, b) => {
      if (a === 'H') return acidLike ? -1 : 1;
      if (b === 'H') return acidLike ? 1 : -1;
      return en(a) - en(b);
    });
  }
  return order.map((s) => `${s}${counts.get(s) > 1 ? subscript(counts.get(s)) : ''}`).join('') + chargeText(charge);
}

/** Impronta di un frammento covalente. */
export function signature(atoms, bonds, { orders = true, charge = 0 } = {}) {
  const n = atoms.length;
  const adj = atoms.map(() => []);
  for (const b of bonds) {
    const o = orders ? b.order : 1;
    adj[b.i].push([b.j, o]);
    adj[b.j].push([b.i, o]);
  }
  let labels = atoms.map((a) => String(a.z));
  for (let round = 0; round < Math.min(6, n); round++) {
    labels = labels.map((l, i) => fnv(`${l}|${adj[i].map(([j, o]) => `${o}${labels[j]}`).sort().join(',')}`));
  }
  return `${[...labels].sort().join('.')}|${charge}`;
}

/** Divide una descrizione {atoms, bonds} nei frammenti covalenti. */
export function covalentParts(atoms, bonds) {
  const parent = atoms.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const b of bonds) parent[find(b.i)] = find(b.j);
  const groups = new Map();
  atoms.forEach((_, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  });
  return [...groups.values()].map((idx) => {
    const map = new Map(idx.map((v, k) => [v, k]));
    return {
      indices: idx,
      atoms: idx.map((i) => atoms[i]),
      bonds: bonds.filter((b) => map.has(b.i) && map.has(b.j)).map((b) => ({ i: map.get(b.i), j: map.get(b.j), order: b.order })),
      charge: idx.reduce((s, i) => s + (atoms[i].charge || 0), 0),
    };
  });
}

/** Impronta di un'unità (molecola o composto ionico = insieme di frammenti con carica). */
export function unitSignature(atoms, bonds, orders = true) {
  return covalentParts(atoms, bonds)
    .map((p) => signature(p.atoms, p.bonds, { orders, charge: p.charge }))
    .sort()
    .join(' + ');
}

/**
 * Indice della libreria: per ogni voce struttura (SMILES), impronte e formula.
 * @param {object[]} entries
 */
export function createLibraryIndex(lab, entries) {
  const full = new Map();
  const skeleton = new Map();
  const byFormula = new Map();
  const parsed = new Map();
  for (const e of entries) {
    const g = parseSmiles(e.smiles, lab.bySymbol);
    const charge = g.atoms.reduce((s, a) => s + a.charge, 0);
    const item = { ...e, graph: g, charge, ionic: e.smiles.includes('.') };
    parsed.set(e.id, item);
    full.set(unitSignature(g.atoms, g.bonds, true), item);
    const sk = unitSignature(g.atoms, g.bonds, false);
    if (!skeleton.has(sk)) skeleton.set(sk, []);
    skeleton.get(sk).push(item);
    const fk = formulaKey(lab, g.atoms, charge);
    if (!byFormula.has(fk)) byFormula.set(fk, []);
    byFormula.get(fk).push(item);
  }
  // nomi (anche alternativi) senza accenti né maiuscole, per la ricerca testuale
  const names = [...parsed.values()].map((e) => ({
    e,
    keys: [e.name, ...(e.aka ? e.aka.split(/,\s*|\s+o\s+/) : [])].map((s) => normalizeName(s)).filter(Boolean),
  }));
  return {
    entries: [...parsed.values()],
    get: (id) => parsed.get(id),
    byFormula: (key) => byFormula.get(key) ?? [],
    /**
     * Cerca per nome: voce con il nome esatto e voci che lo contengono (al massimo `limit`).
     * @returns {{exact:object|null, matches:object[]}}
     */
    byName(query, limit = 8) {
      const q = normalizeName(query);
      if (q.length < 2) return { exact: null, matches: [] };
      const exact = names.find((n) => n.keys.includes(q))?.e ?? null;
      const starts = names.filter((n) => n.e !== exact && n.keys.some((k) => k.startsWith(q))).map((n) => n.e);
      const inside = names.filter((n) => n.e !== exact && !starts.includes(n.e) && n.keys.some((k) => k.includes(q))).map((n) => n.e);
      return { exact, matches: [...starts, ...inside].slice(0, limit) };
    },
    /**
     * Riconosce un'unità costruita sul banco.
     * @param {{z:number,charge:number}[]} atoms cariche degli atomi (ioni e elettroni aggiunti/tolti)
     * @returns {{entry:object|null, exact:boolean, byFormula?:boolean, sameFormula:object[]}}
     */
    identify(atoms, bonds) {
      const charge = atoms.reduce((s, a) => s + a.charge, 0);
      const exact = full.get(unitSignature(atoms, bonds, true));
      if (exact) return { entry: exact, exact: true, sameFormula: [] };
      const sk = skeleton.get(unitSignature(atoms, bonds, false));
      if (sk?.length) return { entry: sk[0], exact: false, sameFormula: [] };
      const same = byFormula.get(formulaKey(lab, atoms, charge)) ?? [];
      // composti dei metalli (FeCl₃, CuO…): il banco può legarli in modo covalente o con cariche
      // diverse da quelle del solido reale, ma la formula basta a riconoscerli se è una sola voce
      if (same.length === 1 && atoms.length > 1 && (same[0].ionic || atoms.some((a) => lab.get(a.z).metal))) {
        return { entry: same[0], exact: false, byFormula: true, sameFormula: [] };
      }
      return { entry: null, exact: false, sameFormula: same };
    },
  };
}

/** Nome per la ricerca: minuscolo, senza accenti, apostrofi e spazi doppi. */
export const normalizeName = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
