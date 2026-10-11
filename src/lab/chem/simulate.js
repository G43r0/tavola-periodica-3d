// «Simula reazione»: che cosa succede quando le molecole presenti sul banco si urtano.
// 1. Reazioni della libreria: si sceglie il percorso (anche a più passi: i prodotti di un passo possono
//    reagire nel successivo) che lascia meno molecole di partenza inutilizzate, poi quello con ΔH più
//    negativo, poi quello con meno passi. Ogni passo avviene tante volte quante lo permette il reagente
//    limitante; le molecole avanzate sono in eccesso. Le reazioni endotermiche avvengono solo fornendo
//    energia; quelle con `needs` (es. i lieviti della fermentazione) non avvengono da sole.
// 2. Se nessuna reazione della libreria è possibile, il modello prova le sintesi per addizione: 2 o 3
//    molecole che si urtano formano una (o più copie di una) sostanza della libreria, solo se così si
//    libera abbastanza energia (ΔH dalle entalpie di formazione o, in mancanza, dalle energie di legame).
import { bondEnergy } from './bond-energy.js';
import { formulaKey } from './identify.js';
import { entryEnergy } from './combine.js';

/** ΔH minimo (kJ) perché una reazione prevista dal modello avvenga: sotto questa soglia l'urto non è efficace. */
export const MODEL_MIN_DH = -40;

/** ΔH di una reazione caricata (kJ, per l'equazione in moli): entalpie di formazione, altrimenti energie di legame. */
export function reactionDH(re) {
  return re.enthalpy.formation.value ?? re.enthalpy.bonds?.value ?? null;
}

const sideKey = (list) => list.map(([, k]) => k).sort().join('+');
/** b è la reazione inversa di a (stesse specie con i lati scambiati). */
const isReverse = (a, b) => sideKey(a.r.reactants) === sideKey(b.r.products) && sideKey(a.r.products) === sideKey(b.r.reactants);
const sum = (m) => [...m.values()].reduce((t, v) => t + v, 0);

/**
 * Reazioni della libreria che avvengono con le specie presenti.
 * Si esplorano tutte le combinazioni dei primi `lookahead` passi; da lì in poi si sceglie ogni volta il
 * passo che consuma più molecole di partenza (a parità, il più esotermico).
 * @param {Map<string,number>} inventory specie (id della libreria o "el:X") → numero di molecole
 * @param {object[]} reactions reazioni caricate ({ r, enthalpy, … })
 * @param {{energy?:boolean, exclude?:object[], lookahead?:number}} opts energy: energia fornita dall'esterno
 *   (ammette le reazioni endotermiche); exclude: reazioni già avvenute, di cui non si ammette l'inversa
 * @returns {{ steps:{re:object, times:number, onlyOrig:boolean}[], leftover:Map<string,number>, dH:number }}
 *   onlyOrig: il passo usa solo molecole di partenza (può avvenire subito, insieme agli altri passi così)
 */
export function planReactions(inventory, reactions, { energy = false, exclude = [], lookahead = 2 } = {}) {
  let usable = reactions.filter((re) => {
    const dH = reactionDH(re);
    return !re.r.needs && !re.r.rev && dH != null && (energy || dH < 0) && !exclude.some((x) => isReverse(x, re));
  });
  // solo le reazioni i cui reagenti sono presenti o si possono formare
  const reachable = new Set(inventory.keys());
  for (let grew = true; grew; ) {
    grew = false;
    for (const re of usable) {
      if (!re.r.reactants.every(([, k]) => reachable.has(k))) continue;
      for (const [, k] of re.r.products) {
        if (!reachable.has(k)) {
          reachable.add(k);
          grew = true;
        }
      }
    }
  }
  usable = usable.filter((re) => re.r.reactants.every(([, k]) => reachable.has(k)));

  // orig: molecole di partenza, made: prodotti dei passi precedenti (si consumano prima le prime)
  const available = (k, orig, made) => (orig.get(k) || 0) + (made.get(k) || 0);
  const maxTimes = (re, orig, made) => Math.min(...re.r.reactants.map(([c, k]) => Math.floor(available(k, orig, made) / c)));
  const apply = (re, times, orig, made) => {
    const o = new Map(orig);
    const m = new Map(made);
    let onlyOrig = true;
    for (const [c, k] of re.r.reactants) {
      let need = c * times;
      const fromOrig = Math.min(need, o.get(k) || 0);
      o.set(k, (o.get(k) || 0) - fromOrig);
      need -= fromOrig;
      if (need) {
        m.set(k, m.get(k) - need);
        onlyOrig = false;
      }
    }
    for (const [c, k] of re.r.products) m.set(k, (m.get(k) || 0) + c * times);
    return [o, m, onlyOrig];
  };
  const better = (a, b) => {
    const left = sum(a.orig) - sum(b.orig);
    if (left) return left < 0;
    if (Math.abs(a.dH - b.dH) > 1e-6) return a.dH < b.dH;
    return a.steps.length < b.steps.length;
  };

  const options = (orig, made, path) =>
    usable
      .filter((re) => !path.some((p) => isReverse(p, re)))
      .map((re) => ({ re, times: maxTimes(re, orig, made) }))
      .filter((o) => o.times >= 1);
  const step = (st, { re, times }) => {
    const [orig, made, onlyOrig] = apply(re, times, st.orig, st.made);
    return { orig, made, path: [...st.path, re], steps: [...st.steps, { re, times, onlyOrig }], dH: st.dH + reactionDH(re) * times };
  };

  /** Completa in modo goloso: ogni volta il passo che consuma più molecole di partenza, poi il più esotermico. */
  const rollout = (st) => {
    for (let n = 0; n < 12; n++) {
      let best = null;
      for (const o of options(st.orig, st.made, st.path)) {
        o.gain = o.re.r.reactants.reduce((t, [c, k]) => t + Math.min(c * o.times, st.orig.get(k) || 0), 0);
        o.dH = reactionDH(o.re) * o.times;
        if (!best || o.gain > best.gain || (o.gain === best.gain && o.dH < best.dH)) best = o;
      }
      // un passo che non consuma molecole di partenza ha senso solo se libera energia
      if (!best || (best.gain === 0 && best.dH >= 0)) break;
      st = step(st, best);
    }
    return st;
  };

  const search = (st, depth) => {
    if (depth === 0) return rollout(st);
    let best = st;
    for (const o of options(st.orig, st.made, st.path)) {
      const cand = search(step(st, o), depth - 1);
      if (better(cand, best)) best = cand;
    }
    return best;
  };

  const start = { orig: new Map(inventory), made: new Map(), path: [], steps: [], dH: 0 };
  // con molte specie diverse basta guardare un passo avanti (la ricerca crescerebbe troppo)
  const best = search(start, options(start.orig, start.made, []).length > 8 ? Math.min(1, lookahead) : lookahead);
  const leftover = new Map([...best.orig].filter(([, n]) => n > 0));
  return { steps: best.steps, leftover, dH: best.dH };
}

/**
 * Perché non avviene nessuna reazione: reazioni con tutti i reagenti presenti ma in quantità insufficiente,
 * reazioni endotermiche (servirebbe energia) e reazioni che richiedono altro (es. i lieviti).
 * @returns {{ missing:{re:object, lack:{display:string, count:number}[]}[], endothermic:object[], needs:object[] }}
 */
export function diagnose(inventory, reactions, { energy = false } = {}) {
  const missing = [];
  const endothermic = [];
  const needs = [];
  for (const re of reactions) {
    if (!re.r.reactants.every(([, k]) => inventory.has(k))) continue;
    const lack = re.r.reactants
      .map(([c, k], i) => ({ key: k, display: re.reactants[i].display, count: c - inventory.get(k) }))
      .filter((x) => x.count > 0);
    const dH = reactionDH(re);
    if (re.r.needs || re.r.rev) {
      if (!lack.length) needs.push(re);
    } else if (dH >= 0 && !energy) {
      if (!lack.length) endothermic.push(re);
    } else if (lack.length) missing.push({ re, lack });
  }
  const total = (m) => m.lack.reduce((t, x) => t + x.count, 0);
  missing.sort((a, b) => total(a) - total(b));
  return { missing, endothermic, needs };
}

// ---------------------------------------------------------------- modello: sintesi per addizione

/**
 * Energia dei legami covalenti di un grafo (kJ/mol); null se manca un valore o, con `tabulated`,
 * se un legame ha solo un valore stimato (es. Cl=O: la stima non basta per prevedere una reazione).
 */
export function graphBondEnergy(lab, atoms, bonds, { tabulated = false } = {}) {
  let total = 0;
  for (const b of bonds) {
    const e = bondEnergy(lab.get(atoms[b.i].z), lab.get(atoms[b.j].z), b.order);
    if (e.kj == null || (tabulated && e.estimated)) return null;
    total += e.kj;
  }
  return total;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * Sostanza della libreria che si forma con tutti questi atomi: una molecola (H₂SO₄) o più copie
 * della stessa (2 HBr). Tra più isomeri, quello con l'energia di legame maggiore (come Combina).
 * @returns {{entry:object, copies:number} | null}
 */
export function libraryProduct(lab, library, zs) {
  const pick = (list) =>
    list
      .map((e) => ({ e, energy: entryEnergy(lab, e) }))
      .sort((a, b) => b.energy - a.energy)[0]?.e ?? null;
  const direct = pick(library.byFormula(formulaKey(lab, zs.map((z) => ({ z })), 0)));
  if (direct) return { entry: direct, copies: 1 };
  const counts = new Map();
  for (const z of zs) counts.set(z, (counts.get(z) || 0) + 1);
  const g = [...counts.values()].reduce(gcd);
  if (g < 2) return null;
  const unit = [...counts].flatMap(([z, c]) => Array.from({ length: c / g }, () => ({ z })));
  const same = pick(library.byFormula(formulaKey(lab, unit, 0)));
  return same ? { entry: same, copies: g } : null;
}

/** ΔH di reagenti → copie del prodotto: entalpie di formazione se note per tutti, altrimenti energie di legame. */
function modelEnthalpy(lab, members, product) {
  const { entry, copies } = product;
  if (members.every((s) => s.hf != null) && entry.hf != null) {
    return { value: copies * entry.hf - members.reduce((t, s) => t + s.hf, 0), method: 'formation' };
  }
  if (entry.ionic || members.some((s) => s.bondKj == null)) return null;
  const formed = graphBondEnergy(lab, entry.graph.atoms, entry.graph.bonds, { tabulated: true });
  if (formed == null) return null;
  return { value: members.reduce((t, s) => t + s.bondKj, 0) - copies * formed, method: 'bonds' };
}

/**
 * La reazione più esotermica prevista dal modello tra 2 molecole (o, se nessuna coppia reagisce, tra 3).
 * Non si usa per specie che compaiono insieme in una reazione della libreria: lì vale la libreria
 * (H₂ + O₂ non forma H₂O₂: per l'acqua servono 2 H₂ per ogni O₂).
 * @param {{key:string, count:number, zs:number[], hf:number|null, bondKj:number|null}[]} species
 *   hf: entalpia di formazione (null se non nota); bondKj: graphBondEnergy con `tabulated` (null per i composti ionici)
 * @returns {{ keys:string[], product:{entry:object, copies:number}, dH:number, method:'formation'|'bonds' } | null}
 */
export function modelReaction(lab, library, species, reactions) {
  const reactantSets = reactions.map((re) => new Set(re.r.reactants.map(([, k]) => k)));
  const blocked = (keys) => {
    const distinct = [...new Set(keys)];
    return reactantSets.some((set) => (distinct.length === 1 ? set.size === 1 && set.has(distinct[0]) : distinct.every((k) => set.has(k))));
  };
  for (const size of [2, 3]) {
    let best = null;
    const rec = (start, picked) => {
      if (picked.length === size) {
        const members = picked.map((i) => species[i]);
        const keys = members.map((s) => s.key);
        if (blocked(keys)) return;
        const product = libraryProduct(lab, library, members.flatMap((s) => s.zs));
        if (!product) return;
        const dH = modelEnthalpy(lab, members, product);
        if (!dH || dH.value > MODEL_MIN_DH) return;
        if (!best || dH.value < best.dH) best = { keys, product, dH: dH.value, method: dH.method };
        return;
      }
      for (let i = start; i < species.length; i++) {
        if (picked.filter((x) => x === i).length >= species[i].count) continue;
        rec(i, [...picked, i]);
      }
    };
    rec(0, []);
    if (best) return best;
  }
  return null;
}
