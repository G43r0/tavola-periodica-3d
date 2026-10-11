// "Combina": dagli atomi scelti costruisce la struttura più plausibile.
// 1. Se la formula corrisponde a una molecola della libreria, usa quella (tra più isomeri sceglie
//    quello con l'energia di legame totale maggiore e propone gli altri).
// 2. Altrimenti cerca tra le strutture che rispettano le valenze quella con, nell'ordine:
//    meno elettroni spaiati → meno unità separate (un solo composto se possibile) → maggiore energia
//    di legame totale (più stabile).
// 3. Metalli con non metalli molto elettronegativi: legame ionico, con le cariche bilanciate.
import { bondEnergy } from './bond-energy.js';
import { bondCharacter } from './bonding.js';
import { formulaKey, covalentParts } from './identify.js';
import { TIER, typicalIonCharge } from './elements-lab.js';

const MAX_HEAVY = 8;
const BUDGET = 160000;

const cmpScore = (a, b) => a.unpaired - b.unpaired || a.units - b.units || b.energy - a.energy;

/** Energia di legame totale (kJ/mol) di una voce della libreria. */
export function entryEnergy(lab, entry) {
  return entry.graph.bonds.reduce((s, b) => {
    const e = bondEnergy(lab.get(entry.graph.atoms[b.i].z), lab.get(entry.graph.atoms[b.j].z), b.order).kj;
    return s + (e ?? 0);
  }, 0);
}

/**
 * Distribuisce gli elettroni dei cationi sugli atomi con carica negativa (legami ionici).
 * Un elettrone alla volta, preferendo un anione non ancora collegato al catione: così una formula
 * come (NH₄)₂Fe(SO₄)₂ resta un'unica unità invece di spezzarsi in FeSO₄ + (NH₄)₂SO₄.
 * @param {{i:number,q:number}[]} donors cationi (q > 0)
 * @param {{i:number,k:number}[]} acceptors atomi che ricevono k elettroni
 * @param {{i:number,j:number}[]} covalent legami covalenti già presenti (uniscono gli atomi degli ioni poliatomici)
 */
function ionicEdges(donors, acceptors, covalent = []) {
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x);
    if (p === x) return x;
    const r = find(p);
    parent.set(x, r);
    return r;
  };
  const join = (a, b) => parent.set(find(a), find(b));
  for (const b of covalent) join(b.i, b.j);
  const need = acceptors.map((a) => ({ ...a }));
  const transfers = new Map();
  for (const d of donors) {
    for (let e = 0; e < d.q; e++) {
      const open = need.filter((a) => a.k > 0);
      if (!open.length) break;
      const a = open.find((x) => find(x.i) !== find(d.i)) ?? open[0];
      a.k -= 1;
      join(d.i, a.i);
      const key = `${d.i}:${a.i}`;
      transfers.set(key, (transfers.get(key) ?? 0) + 1);
    }
  }
  return [...transfers].map(([key, t]) => {
    const [i, j] = key.split(':').map(Number);
    return { i, j, transfer: t, donor: i, ionic: true };
  });
}

/** Indici degli atomi di partenza, raggruppati per elemento. */
function poolsOf(zs) {
  const pools = new Map();
  zs.forEach((z, i) => {
    if (!pools.has(z)) pools.set(z, []);
    pools.get(z).push(i);
  });
  return pools;
}

/**
 * Converte una voce della libreria in legami sugli atomi di partenza (assegnati per elemento).
 * `pools` condivisi permettono di mappare più copie della stessa voce su atomi diversi.
 */
function mapEntry(lab, entry, zs, pools = poolsOf(zs)) {
  const map = entry.graph.atoms.map((a) => pools.get(a.z).shift());
  const bonds = entry.graph.bonds.map((b) => ({ i: map[b.i], j: map[b.j], order: b.order }));
  if (!entry.ionic) return bonds;
  // gli elettroni passano da uno ione all'altro: si guarda la carica netta di ogni frammento, non le
  // cariche formali interne (nello ione nitrato [O-][N+](=O)[O-] l'azoto "+" non cede nulla)
  const donors = [];
  const acceptors = [];
  for (const f of covalentParts(entry.graph.atoms, entry.graph.bonds)) {
    if (f.charge > 0) {
      const k = f.indices.reduce((best, i) => (entry.graph.atoms[i].charge > entry.graph.atoms[best].charge ? i : best), f.indices[0]);
      donors.push({ i: map[k], q: f.charge });
    } else if (f.charge < 0) {
      let left = -f.charge;
      const neg = f.indices.filter((i) => entry.graph.atoms[i].charge < 0).sort((a, b) => entry.graph.atoms[a].charge - entry.graph.atoms[b].charge);
      for (const i of neg.length ? neg : f.indices) {
        if (left <= 0) break;
        const k = Math.min(left, Math.max(1, -entry.graph.atoms[i].charge));
        acceptors.push({ i: map[i], k });
        left -= k;
      }
    }
  }
  return [...bonds, ...ionicEdges(donors, acceptors, bonds)];
}

/** Legami (covalenti e ionici) di una voce della libreria, sugli indici dei suoi atomi. */
export function entryBonds(lab, entry) {
  return mapEntry(lab, entry, entry.graph.atoms.map((a) => a.z));
}

/** Partizioni di g in al massimo `parts` addendi, ciascuno ≤ maxEach (ordinate in modo decrescente). */
function partitions(g, parts, maxEach) {
  const out = [];
  const rec = (left, maxPart, acc) => {
    if (left === 0) {
      out.push([...acc]);
      return;
    }
    if (acc.length === parts) return;
    for (let p = Math.min(maxPart, left); p >= 1; p--) {
      acc.push(p);
      rec(left - p, p, acc);
      acc.pop();
    }
  };
  rec(g, maxEach, []);
  return out;
}

/**
 * @param {object} lab elementi del laboratorio
 * @param {object|null} library indice della libreria (createLibraryIndex)
 * @param {number[]} zs numeri atomici degli atomi da combinare
 * @returns {{ok:boolean, bonds?:object[], source?:string, entry?:object, alternatives?:object[], unpaired?:number, message?:string}}
 */
export function combine(lab, library, zs) {
  const n = zs.length;
  const info = zs.map((z) => lab.get(z));
  if (n === 0) return { ok: false, message: 'Non ci sono atomi da combinare: aggiungine almeno due al banco.' };
  if (n === 1) return { ok: false, message: 'Serve almeno un altro atomo per formare un legame.' };

  // 1. libreria
  if (library) {
    const candidates = library.byFormula(formulaKey(lab, zs.map((z) => ({ z })), 0));
    if (candidates.length) {
      const scored = candidates.map((e) => ({ e, energy: entryEnergy(lab, e) })).sort((a, b) => b.energy - a.energy);
      return {
        ok: true,
        source: 'library',
        entry: scored[0].e,
        alternatives: scored.slice(1).map((s) => s.e),
        bonds: mapEntry(lab, scored[0].e, zs),
        unpaired: 0,
      };
    }
    // più unità uguali della libreria (4 H + 2 O → 2 H₂O, 2 Na + 2 Cl → 2 NaCl)
    const counts = countByZ(zs);
    const g = [...counts.values()].reduce(gcd);
    if (g > 1) {
      const unit = [...counts].flatMap(([z, c]) => Array.from({ length: c / g }, () => ({ z })));
      const same = library.byFormula(formulaKey(lab, unit, 0));
      if (same.length) {
        const best = same.map((e) => ({ e, energy: entryEnergy(lab, e) })).sort((a, b) => b.energy - a.energy)[0].e;
        const pools = poolsOf(zs);
        const bonds = Array.from({ length: g }, () => mapEntry(lab, best, zs, pools)).flat();
        return { ok: true, source: 'library', entry: best, copies: g, alternatives: [], bonds, unpaired: 0 };
      }
    }
    // 2. sale di un metallo con ioni noti (Fe₂(SO₄)₃ = 2 Fe³⁺ + 3 SO₄²⁻)
    const salt = ionicDecomposition(lab, library, zs);
    if (salt) return { ok: true, source: 'ions', salt, bonds: mapEntry(lab, salt, zs), unpaired: 0 };
  }

  // alcano lineare troppo lungo per la ricerca (CₙH₂ₙ₊₂)
  const cz = zs.filter((z) => z === 6).length;
  if (cz > 1 && cz + zs.filter((z) => z === 1).length === n && n - cz === 2 * cz + 2) {
    const chain = { graph: chainGraph(cz), ionic: false };
    return { ok: true, source: 'alkane', bonds: mapEntry(lab, chain, zs), unpaired: 0 };
  }

  if (info.every((x) => x.metal)) {
    return { ok: false, message: 'Solo metalli: tra loro formano un legame metallico (elettroni condivisi da tutto il reticolo), che il banco non simula.' };
  }
  if (info.every((x) => x.valences.every((v) => v === 0))) {
    return { ok: false, message: 'I gas nobili hanno il guscio esterno completo: non formano legami.' };
  }

  // 2. metalli che formano legami ionici
  const nonmetals = [...Array(n).keys()].filter((i) => !info[i].metal);
  const ionicMetals = [...Array(n).keys()].filter(
    (i) => info[i].metal && nonmetals.some((j) => bondCharacter(info[i], info[j]).ionic),
  );
  const covalentAtoms = [...Array(n).keys()].filter((i) => !ionicMetals.includes(i));
  const metalOptions = ionicMetals.map((i) => {
    const x = info[i];
    if (x.tier === TIER.MAIN) return [typicalIonCharge(x)];
    return x.valences.filter((v) => v > 0);
  });

  let best = null;
  let explored = 0;
  let aborted = false;

  const combos = [[]];
  for (const opts of metalOptions) {
    const next = [];
    for (const c of combos) for (const o of opts) if (next.length < 64) next.push([...c, o]);
    combos.splice(0, combos.length, ...next);
  }

  for (const charges of combos) {
    const G = charges.reduce((s, q) => s + q, 0);
    const result = covalentSearch(lab, info, covalentAtoms, G, charges, ionicMetals);
    explored += result.explored;
    if (result.aborted) aborted = true;
    if (result.best && (!best || cmpScore(result.best, best) < 0)) best = result.best;
  }

  if (!best) {
    if (aborted) return { ok: false, message: `Troppi atomi da sistemare automaticamente (oltre ${MAX_HEAVY} atomi non terminali): collegali a mano o scegli un esempio.` };
    if (ionicMetals.length) return { ok: false, message: 'Le cariche degli ioni non si bilanciano con questi atomi: aggiungi o togli atomi (es. per Na e O servono 2 Na per ogni O).' };
    return { ok: false, message: 'Con questi atomi non si riesce a formare una struttura valida.' };
  }
  return { ok: true, source: 'search', bonds: best.bonds, unpaired: best.unpaired, units: best.units, energy: best.energy, explored };
}

function covalentSearch(lab, info, atoms, G, metalCharges, ionicMetals) {
  const maxEn = Math.max(...atoms.map((i) => info[i].en ?? 0));
  // valenze ammesse: quelle superiori alla minima solo se c'è un atomo più elettronegativo (ottetto espanso)
  const options = atoms.map((i) => {
    const x = info[i];
    const vals = x.valences.filter((v, k) => k === 0 || (x.en ?? 0) < maxEn);
    return vals;
  });
  let explored = 0;
  let aborted = false;
  let best = null;

  // tutte le combinazioni di valenze (limitate)
  const valCombos = [[]];
  for (const opts of options) {
    const next = [];
    for (const c of valCombos) for (const o of opts) if (next.length < 400) next.push([...c, o]);
    valCombos.splice(0, valCombos.length, ...next);
  }

  for (const vals of valCombos) {
    // distribuzioni delle cariche negative (elettroni ricevuti dai metalli), per gruppi di atomi uguali
    for (const k of chargeDistributions(info, atoms, vals, G)) {
      const t = vals.map((v, idx) => v - k[idx]);
      const r = skeletonSearch(lab, info, atoms, t, k, metalCharges, ionicMetals, BUDGET - explored);
      explored += r.explored;
      if (r.aborted) aborted = true;
      if (r.best && (!best || cmpScore(r.best, best) < 0)) best = r.best;
      if (explored > BUDGET) return { best, explored, aborted: true };
    }
  }
  return { best, explored, aborted };
}

function chargeDistributions(info, atoms, vals, G) {
  if (G === 0) return [atoms.map(() => 0)];
  // gruppi di atomi uguali (stesso elemento e stessa valenza scelta), dal più elettronegativo
  const groups = new Map();
  atoms.forEach((a, idx) => {
    const key = `${info[a].z}:${vals[idx]}`;
    if (!groups.has(key)) groups.set(key, { members: [], max: vals[idx], en: info[a].en ?? 0 });
    groups.get(key).members.push(idx);
  });
  const list = [...groups.values()].filter((g) => g.max > 0 && !info[atoms[g.members[0]]].metal).sort((a, b) => b.en - a.en);
  const out = [];
  const rec = (gi, left, acc) => {
    if (out.length > 60) return;
    if (gi === list.length) {
      if (left === 0) out.push([...acc]);
      return;
    }
    const g = list[gi];
    const cap = Math.min(left, g.members.length * g.max);
    for (let take = cap; take >= 0; take--) {
      const pats = take === 0 ? [[]] : partitions(take, g.members.length, g.max);
      for (const p of pats) {
        const next = [...acc];
        p.forEach((v, m) => (next[g.members[m]] = v));
        rec(gi + 1, left - take, next);
      }
    }
  };
  rec(0, G, atoms.map(() => 0));
  return out;
}

function skeletonSearch(lab, info, atoms, t, k, metalCharges, ionicMetals, budget) {
  const heavy = atoms.map((a, idx) => idx).filter((idx) => t[idx] >= 2).sort((a, b) => t[b] - t[a]);
  const terminals = atoms.map((a, idx) => idx).filter((idx) => t[idx] === 1);
  if (heavy.length > MAX_HEAVY) return { best: null, explored: 0, aborted: true };
  const pairs = [];
  for (let p = 0; p < heavy.length; p++) for (let q = p + 1; q < heavy.length; q++) pairs.push([heavy[p], heavy[q]]);
  const rem = [...t];
  const chosen = [];
  let explored = 0;
  let aborted = false;
  let best = null;
  const energyOf = (a, b, order) => bondEnergy(info[atoms[a]], info[atoms[b]], order).kj ?? 150;

  const evaluate = (skeletonEnergy) => {
    const cap = [...rem];
    const bonds = chosen.map((c) => ({ ...c }));
    let energy = skeletonEnergy;
    // terminali sugli atomi pesanti, a partire dai legami più forti
    const options = [];
    for (const h of heavy) if (cap[h] > 0) for (const x of terminals) options.push({ h, x, e: energyOf(h, x, 1) });
    options.sort((a, b) => b.e - a.e);
    const used = new Set();
    for (const o of options) {
      if (cap[o.h] <= 0 || used.has(o.x)) continue;
      used.add(o.x);
      cap[o.h] -= 1;
      bonds.push({ i: o.h, j: o.x, order: 1 });
      energy += o.e;
    }
    // terminali avanzati: si legano tra loro (H₂, Cl₂, HCl…)
    const left = terminals.filter((x) => !used.has(x));
    const tt = [];
    for (let p = 0; p < left.length; p++) for (let q = p + 1; q < left.length; q++) tt.push({ a: left[p], b: left[q], e: energyOf(left[p], left[q], 1) });
    tt.sort((a, b) => b.e - a.e);
    const paired = new Set();
    for (const o of tt) {
      if (paired.has(o.a) || paired.has(o.b)) continue;
      paired.add(o.a);
      paired.add(o.b);
      bonds.push({ i: o.a, j: o.b, order: 1 });
      energy += o.e;
    }
    const unpaired = heavy.reduce((s, h) => s + cap[h], 0) + left.length - paired.size;

    // converte gli indici locali in indici degli atomi di partenza e aggiunge i legami ionici
    const out = bonds.map((b) => ({ i: atoms[b.i], j: atoms[b.j], order: b.order }));
    const donors = ionicMetals.map((i, m) => ({ i, q: metalCharges[m] }));
    const acceptors = atoms.map((a, idx) => ({ i: a, k: k[idx] })).filter((a) => a.k > 0);
    const ionic = ionicEdges(donors, acceptors);
    out.push(...ionic);

    // unità separate
    const all = [...atoms, ...ionicMetals];
    const parent = new Map(all.map((a) => [a, a]));
    const find = (x) => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x))), parent.get(x)));
    for (const b of out) parent.set(find(b.i), find(b.j));
    const units = new Set(all.map(find)).size;
    const cand = { bonds: out, unpaired, units, energy };
    if (!best || cmpScore(cand, best) < 0) best = cand;
  };

  const dfs = (pi, energy) => {
    if (++explored > budget) {
      aborted = true;
      return;
    }
    if (pi === pairs.length) {
      evaluate(energy);
      return;
    }
    const [a, b] = pairs[pi];
    const maxOrder = Math.min(3, rem[a], rem[b], info[atoms[a]].z === 1 || info[atoms[b]].z === 1 ? 1 : 3);
    for (let o = maxOrder; o >= 0; o--) {
      if (o > 0) {
        rem[a] -= o;
        rem[b] -= o;
        chosen.push({ i: a, j: b, order: o });
        dfs(pi + 1, energy + energyOf(a, b, o));
        chosen.pop();
        rem[a] += o;
        rem[b] += o;
      } else {
        dfs(pi + 1, energy);
      }
      if (aborted) return;
    }
  };
  dfs(0, 0);
  return { best, explored, aborted };
}

// ---------------------------------------------------------------- aiuti

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function countByZ(zs) {
  const m = new Map();
  for (const z of zs) m.set(z, (m.get(z) || 0) + 1);
  return m;
}

/** Alcano lineare con n atomi di carbonio (H₃C–CH₂–…–CH₃). */
function chainGraph(n) {
  const atoms = Array.from({ length: n }, () => ({ z: 6, charge: 0 }));
  const bonds = [];
  for (let i = 1; i < n; i++) bonds.push({ i: i - 1, j: i, order: 1 });
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < (i === 0 || i === n - 1 ? 3 : 2); k++) {
      atoms.push({ z: 1, charge: 0 });
      bonds.push({ i, j: atoms.length - 1, order: 1 });
    }
  }
  return { atoms, bonds };
}

// non metalli che formano anioni monoatomici comuni: H⁻, C⁴⁻, N³⁻, O²⁻, F⁻, P³⁻, S²⁻, Cl⁻, As³⁻, Se²⁻, Br⁻, Te²⁻, I⁻
const MONO_ANIONS = new Set([1, 6, 7, 8, 9, 15, 16, 17, 33, 34, 35, 52, 53]);

/**
 * Scompone una formula in cationi (metalli, NH₄⁺) e anioni noti (ioni poliatomici della libreria o
 * anioni monoatomici) con le cariche bilanciate: Fe₂(SO₄)₃ → 2 Fe³⁺ + 3 SO₄²⁻, KAl(SO₄)₂, FeBr₃.
 * Con i soli alogenuri non usa cariche ≥ 4 se il legame non è ionico (WF₆, PbCl₄ sono molecolari).
 * @returns {{graph:{atoms:object[], bonds:object[]}, ionic:true, charge:0} | null}
 */
export function ionicDecomposition(lab, library, zs) {
  const counts = countByZ(zs);
  const metals = [...counts.keys()].filter((z) => lab.get(z).metal);
  const nh4 = library.byFormula('H4N(1)')[0] ?? null;
  if (!metals.length && !(nh4 && counts.has(7) && counts.has(1))) return null;

  const anions = [
    ...library.entries
      .filter((e) => !e.ionic && e.charge < 0 && e.graph.atoms.every((a) => counts.has(a.z)))
      .map((e) => ({ entry: e, charge: e.charge, counts: countByZ(e.graph.atoms.map((a) => a.z)) })),
    ...[...counts.keys()]
      .filter((z) => !lab.get(z).metal && MONO_ANIONS.has(z))
      .map((z) => ({ mono: z, charge: typicalIonCharge(lab.get(z)), counts: new Map([[z, 1]]) }))
      .filter((a) => a.charge < 0),
  ].sort((a, b) => rankAnion(a) - rankAnion(b) || sizeOf(b.counts) - sizeOf(a.counts));

  const minus = (from, what, k) => {
    const out = new Map(from);
    for (const [z, c] of what) {
      const left = (out.get(z) || 0) - c * k;
      if (left < 0) return null;
      if (left) out.set(z, left);
      else out.delete(z);
    }
    return out;
  };
  const maxTimes = (from, what) => Math.min(...[...what].map(([z, c]) => Math.floor((from.get(z) || 0) / c)));

  /** Cationi per ciò che resta: gruppi NH₄ e atomi di metallo con cariche che sommano a `total`. */
  const cations = (rest, total, usedAnions) => {
    let r = new Map(rest);
    let nNH4 = 0;
    if (nh4 && r.get(7) && r.get(1) === 4 * r.get(7)) {
      nNH4 = r.get(7);
      r.delete(7);
      r.delete(1);
    }
    if ([...r.keys()].some((z) => !lab.get(z).metal)) return null;
    if (!r.size && !nNH4) return null;
    const need = total - nNH4;
    const els = [...r];
    const options = els.map(([z]) => lab.get(z).valences.filter((v) => v > 0));
    // alogenuri con cariche ≥ 4 e legame non ionico: sono molecole (WF₆, PbCl₄), non sali
    const halidesOnly = usedAnions.every((a) => a.mono && lab.get(a.mono).group === 17);
    const allowed = (z, q) => !halidesOnly || q <= 3 || usedAnions.every((a) => bondCharacter(lab.get(z), lab.get(a.mono)).ionic);
    // stessa carica per tutti gli atomi di un elemento
    const pick = (i, left, acc) => {
      if (i === els.length) return left === 0 ? acc : null;
      for (const q of options[i]) {
        if (!allowed(els[i][0], q)) continue;
        const res = pick(i + 1, left - q * els[i][1], [...acc, ...Array(els[i][1]).fill([els[i][0], q])]);
        if (res) return res;
      }
      return null;
    };
    let assigned = pick(0, need, []);
    // un solo metallo con due cariche diverse (Fe₃O₄ = Fe²⁺ + 2 Fe³⁺)
    if (!assigned && els.length === 1) {
      const [[z, m]] = els;
      const qs = options[0].filter((q) => allowed(z, q));
      for (let a = 0; a < qs.length && !assigned; a++) {
        for (let b = a + 1; b < qs.length && !assigned; b++) {
          for (let k = 1; k < m && !assigned; k++) {
            if (k * qs[a] + (m - k) * qs[b] === need) assigned = [...Array(k).fill([z, qs[a]]), ...Array(m - k).fill([z, qs[b]])];
          }
        }
      }
    }
    if (!assigned) return null;
    return { metals: assigned, nNH4 };
  };

  const solve = () => {
    // prima con un solo tipo di anione, poi con due (es. idrossido e cloruro)
    for (const A of anions) {
      for (let ka = maxTimes(counts, A.counts); ka >= 1; ka--) {
        const one = cations(minus(counts, A.counts, ka), -A.charge * ka, [A]);
        if (one) return { ...one, parts: [[A, ka]] };
      }
    }
    for (let a = 0; a < anions.length; a++) {
      const A = anions[a];
      for (let ka = maxTimes(counts, A.counts); ka >= 1; ka--) {
        const rest = minus(counts, A.counts, ka);
        for (let b = a + 1; b < anions.length; b++) {
          const B = anions[b];
          if (rankAnion(A) === 2 || rankAnion(B) === 2) continue; // perossido & co. solo da soli
          for (let kb = maxTimes(rest, B.counts); kb >= 1; kb--) {
            const rest2 = minus(rest, B.counts, kb);
            const two = cations(rest2, -A.charge * ka - B.charge * kb, [A, B]);
            if (two) return { ...two, parts: [[A, ka], [B, kb]] };
          }
        }
      }
    }
    return null;
  };
  const sol = solve();
  if (!sol) return null;

  const atoms = [];
  const bonds = [];
  const addGraph = (g) => {
    const off = atoms.length;
    atoms.push(...g.atoms.map((x) => ({ z: x.z, charge: x.charge })));
    bonds.push(...g.bonds.map((x) => ({ i: x.i + off, j: x.j + off, order: x.order })));
  };
  for (const [z, q] of sol.metals) atoms.push({ z, charge: q });
  for (let k = 0; k < sol.nNH4; k++) addGraph(nh4.graph);
  for (const [A, k] of sol.parts) {
    for (let c = 0; c < k; c++) {
      if (A.mono) atoms.push({ z: A.mono, charge: A.charge });
      else addGraph(A.entry.graph);
    }
  }
  return { graph: { atoms, bonds }, ionic: true, charge: 0 };
}

const sizeOf = (counts) => [...counts.values()].reduce((s, c) => s + c, 0);
// ordine di prova: ioni poliatomici con più elementi (SO₄²⁻, NO₃⁻…), poi monoatomici (O²⁻, Cl⁻),
// infine quelli di un solo elemento (perossido O₂²⁻, acetiluro C₂²⁻, azoturo N₃⁻)
const rankAnion = (a) => (a.mono ? 1 : a.counts.size > 1 ? 0 : 2);
