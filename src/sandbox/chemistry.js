// Le 1349 reazioni del catalogo del laboratorio tradotte per la sandbox: specie → sostanze della griglia, condizioni
// (temperatura, acqua, catalizzatori, corrente, luce, innesco), calore liberato da ΔH°. Il motore (world.js) le esegue
// quando le celle dei reagenti si toccano e le condizioni sono soddisfatte. Modulo puro.
import { REACTIONS } from '../lab/data/reactions.js';
import { speciesInfo, reactionEnthalpy } from '../lab/chem/reactions.js';
import { S, WATER } from './substances.js';

export const PAIR_K = 1024; // chiave di una coppia di reagenti: a × PAIR_K + b
const HEAT_CAPACITY = 0.15; // kJ/K per cella: ΔT = −ΔH / (reagenti × capacità)
const DEFAULT_HOT = 500; // K: «Δ» senza temperatura
const DEFAULT_IGNITE = 600; // K: «innesco» per ciò che non ha una temperatura di accensione

/** Specie scritte nelle condizioni come catalizzatori o reagenti ausiliari. */
const AUXILIARY = {
  'carbone attivo': ['el:C'], lindlar: ['el:Pd'], 'acqua regia': ['hno3', 'hcl'], 'etere anidro': ['etere-dietilico'],
  'cat. acido': ['h2so4', 'hcl', 'h3o', 'h3po4'], 'catalizzatore acido': ['h2so4', 'hcl', 'h3o', 'h3po4'],
  'catalizzatore base': ['naoh', 'koh', 'oh'], 'acido o base': ['h2so4', 'hcl', 'h3o', 'naoh', 'koh', 'oh'],
  'soluzione di bicarbonato': ['nahco3'], 'soluzione acida': ['h3o', 'hcl', 'h2so4'], 'soluzione basica': ['oh', 'naoh', 'koh'],
};
const ION_TOKENS = { 'Hg²⁺': ['hgso4', 'hgcl2'], 'Mn²⁺': ['ione-manganese', 'mnso4', 'mncl2'] };
const LIVING = /enzim|batteri|lievit|ribosoma|muscoli|archei|anammox|clorofill|piante|fotosintesi/;

/**
 * Prepara le reazioni per il motore.
 * @param {ReturnType<import('./substances.js').createSubstances>} subs
 */
export function buildChemistry(subs) {
  const { lab, library, elements, libraryId, P } = subs;
  const symbolId = (sym) => subs.byKey.get(sym)?.id ?? 0;
  const keyId = (key) => (key.startsWith('el:') ? symbolId(key.slice(3)) : libraryId.get(key) ?? 0);
  // formula scritta → sostanza (per i catalizzatori nelle condizioni: «cat. V₂O₅», «FeCl₃»)
  const byFormula = new Map();
  for (const s of subs.list) if (s?.kind === 'compound') byFormula.set(s.formula, s.id);
  for (const el of elements) byFormula.set(el.symbol, el.z);

  const species = new Map();
  const info = (key) => {
    if (!species.has(key)) species.set(key, speciesInfo(lab, library, elements, key));
    return species.get(key);
  };
  const O2 = symbolId('O');

  const list = [];
  const skipped = {};
  const skip = (r, why) => {
    skipped[why] = (skipped[why] ?? 0) + 1;
    list.push({ id: r.id, r, disabled: why });
  };

  for (const r of REACTIONS) {
    const reactants = r.reactants.map(([c, key]) => ({ c, key, sid: keyId(key) }));
    const products = r.products.map(([c, key]) => ({ c, key, sid: keyId(key) }));
    if ([...reactants, ...products].some((p) => !p.sid)) {
      skip(r, 'specie non disponibile');
      continue;
    }
    const cond = parseConditions(r, { byFormula, keyId });
    if (cond.disabled) {
      skip(r, cond.disabled);
      continue;
    }
    // un sale che si scioglie in ioni: nella sandbox resta «NaCl(aq)» (così può dare le precipitazioni del catalogo)
    if (reactants.length === 1 && cond.water && products.every((p) => P.flags[p.sid] & S.AQUEOUS)) {
      skip(r, 'dissociazione (resta in soluzione)');
      continue;
    }
    // equilibri di dissociazione di acidi e basi molecolari: in soluzione restano «HCl(aq)», «NH₃(aq)»
    if (r.group === 'ioni' && reactants.length === 2 && reactants.some((x) => x.sid === WATER) && products.some((p) => p.key === 'h3o' || p.key === 'oh')) {
      const other = reactants.find((x) => x.sid !== WATER);
      if (!(P.flags[other.sid] & S.AQUEOUS)) {
        skip(r, 'dissociazione (resta in soluzione)');
        continue;
      }
    }
    const hand = handledByHand(reactants, P, subs);
    if (hand) {
      skip(r, hand);
      continue;
    }
    let dH = null;
    try {
      const re = reactants.map((x) => info(x.key));
      const pr = products.map((x) => info(x.key));
      const e = reactionEnthalpy(lab, re, pr, reactants.map((x) => x.c), products.map((x) => x.c));
      dH = e.formation.value ?? e.bonds?.value ?? null;
    } catch {
      dH = null;
    }
    const R = reactants.reduce((t, x) => t + x.c, 0);
    const Pn = products.reduce((t, x) => t + x.c, 0);
    const cmax = Math.max(...reactants.map((x) => x.c));
    const heat = dH ?? (r.group === 'combustioni' ? -600 : -20);
    let dT = -heat / (R * HEAT_CAPACITY);
    if (cond.water) dT /= 6; // in soluzione il calore si disperde nell'acqua
    dT = Math.max(-200, Math.min(3500, dT));
    // innesco: la temperatura di accensione del combustibile
    if (cond.ignite) cond.minT = Math.max(cond.minT, ...reactants.map((x) => (P.ignite[x.sid] > 0 ? P.ignite[x.sid] : DEFAULT_IGNITE)));
    if (cond.hot && cond.minT < DEFAULT_HOT) cond.minT = DEFAULT_HOT;
    // decomposizioni con «Δ»: alla temperatura di decomposizione della sostanza
    if (reactants.length === 1 && (cond.hot || cond.ignite) && P.flags[reactants[0].sid] & S.DECOMPOSES) cond.minT = Math.max(cond.minT, P.bp[reactants[0].sid]);
    // riduzioni metallotermiche (termite): innesco a 1200 K
    if (cond.ignite && reactants.some((x) => subs.list[x.sid].kind === 'element' && P.flags[x.sid] & S.METAL) && reactants.some((x) => subs.list[x.sid].kind === 'compound' && subs.list[x.sid].counts?.[8])) {
      cond.minT = Math.max(cond.minT, 1200);
    }
    // un metallo che si ossida all'aria quando è caldo: lentamente (il rame annerisce, non brucia)
    if (reactants.some((x) => x.sid === O2) && reactants.some((x) => P.flags[x.sid] & S.METAL)) cond.rate = Math.min(cond.rate, 0.01);
    if (reactants.length === 1) cond.rate = Math.min(cond.rate, 0.03); // decomposizioni: graduali
    if (cond.molten) cond.minT = Math.max(cond.minT, ...reactants.filter((x) => x.sid !== WATER).map((x) => P.mp[x.sid]));
    const rx = {
      id: r.id,
      r,
      reactants,
      products,
      R,
      P: Pn,
      cmax,
      maxIndex: reactants.findIndex((x) => x.c === cmax),
      cond,
      dH,
      dT,
      air: reactants.findIndex((x) => x.sid === O2),
      combustion: r.group === 'combustioni',
      group: r.group,
    };
    list.push(rx);
  }

  // indici per il motore
  const pair = new Map(); // a·K + b → reazioni con a e b tra i reagenti
  const airPair = new Map(); // sostanza → reazioni con O₂ preso dall'aria
  const single = new Map(); // sostanza → reazioni con un solo reagente (decomposizioni…)
  const comb = new Map(); // combustibile → combustione con O₂
  const boom = new Map(); // esplosivo → reazione della detonazione
  const add = (map, k, rx) => {
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(rx);
  };
  for (const rx of list) {
    if (rx.disabled) continue;
    const ids = [...new Set(rx.reactants.map((x) => x.sid))];
    if (rx.combustion && ids.length === 2 && rx.air >= 0) {
      const fuel = ids.find((id) => id !== O2);
      if (P.flags[fuel] & S.FLAMMABLE) {
        // la combustione completa (senza «ossigeno limitato») è quella del combustibile che brucia
        if (!rx.cond.lowO2 && (!comb.has(fuel) || comb.get(fuel).cond.minT > rx.cond.minT)) comb.set(fuel, rx);
        continue;
      }
    }
    if (ids.length === 1) {
      if (rx.cond.shock && P.flags[ids[0]] & S.EXPLOSIVE) boom.set(ids[0], rx);
      else add(single, ids[0], rx);
      continue;
    }
    for (const a of ids) {
      for (const b of ids) if (a !== b) add(pair, a * PAIR_K + b, rx);
      if (rx.air >= 0 && a !== O2) add(airPair, a, rx);
    }
  }
  // in quante reazioni attive compare ogni sostanza (per la scheda)
  const involvement = new Map();
  for (const rx of list) {
    if (rx.disabled) continue;
    for (const p of [...rx.reactants, ...rx.products]) involvement.set(p.sid, (involvement.get(p.sid) ?? 0) + 1);
  }
  const hasRx = new Uint8Array(subs.list.length);
  for (const k of pair.keys()) hasRx[Math.floor(k / PAIR_K)] |= 1;
  for (const k of airPair.keys()) hasRx[k] |= 2;
  for (const k of single.keys()) hasRx[k] |= 4;

  return { list, byId: new Map(list.map((rx) => [rx.id, rx])), pair, airPair, single, comb, boom, hasRx, skipped, involvement, O2 };
}

/** Reazioni tra elementi già simulate dalle regole scritte a mano (combustione, sali, metalli + acqua, ruggine). */
function handledByHand(reactants, P, subs) {
  const ids = reactants.map((x) => x.sid);
  if (ids.length === 1 && ids[0] === WATER) return 'regola: elettrolisi dell\'acqua';
  const elementsOnly = ids.every((id) => subs.list[id].kind === 'element' || id === WATER);
  if (!elementsOnly || ids.length !== 2) return null;
  const [a, b] = ids;
  const O = subs.byKey.get('O').id;
  const flag = (id, f) => Boolean(P.flags[id] & f);
  const sym = (id) => subs.list[id].symbol;
  if ((flag(a, S.METAL) && flag(b, S.HALOGEN)) || (flag(b, S.METAL) && flag(a, S.HALOGEN))) return 'regola: metallo + alogeno';
  if ((a === O && flag(b, S.FLAMMABLE)) || (b === O && flag(a, S.FLAMMABLE))) return 'regola: combustione';
  if ((a === WATER && flag(b, S.WATER_REACTIVE)) || (b === WATER && flag(a, S.WATER_REACTIVE))) return 'regola: metallo + acqua';
  if ([sym(a), sym(b)].includes('Fe') && (a === O || b === O)) return 'regola: ruggine';
  return null;
}

/** Condizioni di una reazione dal testo del catalogo (`cond`, `needs`). */
export function parseConditions(r, { byFormula, keyId }) {
  const text = [r.cond, r.needs].filter(Boolean).join(', ');
  const t = text.toLowerCase();
  const c = { minT: 0, maxT: Infinity, rate: 0.08, water: false, steam: false, catalysts: null, spark: false, discharge: false, light: false, shock: false, ignite: false, hot: false, molten: false, lowO2: false, disabled: null, text };
  if (r.rev) c.disabled = 'equilibrio (⇌)';
  if (/zeolit/.test(t)) c.disabled = 'catalizzatore non disponibile';
  if (c.disabled) return c;
  const living = LIVING.test(t);

  const temps = [...text.matchAll(/(\d+(?:[.,]\d+)?)(?:\s*-\s*\d+)?\s*°C/g)].map((m) => Number(m[1].replace(',', '.')));
  if (temps.length) c.minT = Math.min(...temps) + 273.15;
  if (text.includes('Δ') || /altoforno|riscald/.test(t)) c.hot = true;
  if (/altoforno/.test(t) && !temps.length) c.minT = 1100;
  if (/innesco|scintilla/.test(t)) c.ignite = true;
  if (/urto|detonat/.test(t)) c.shock = true;
  if (/\buv\b|scarica/.test(t)) c.discharge = true; // raggi UV o scarica elettrica: serve una scintilla vicina
  else if (/luce/.test(t)) {
    c.light = true;
    c.rate = 0.01; // le reazioni fotochimiche sono lente alla luce di una fiamma
  }
  if (/elettrolisi/.test(t)) c.spark = true;
  if (c.spark || c.discharge) c.rate = 0.01;
  if (/fus[ao]|ignea/.test(t) && !/confus/.test(t)) c.molten = true;
  if (/cracking/.test(t)) c.minT = Math.max(c.minT, 700);
  if (/freddo|acqua fredda/.test(t)) c.maxT = 300;
  if (/acqua calda|soluzione calda/.test(t)) c.minT = Math.max(c.minT, 330);
  if (/vapore/.test(t)) c.steam = true;
  if (/soluzion|umidit|acqua(?! regia)/.test(t) && !c.steam) c.water = true;
  if (/lenta|aria umida/.test(t) || /^aria/.test(t)) c.rate = 0.004;
  if (/ossigeno (molto )?(limitato|insufficiente|scarso)|poco ossigeno|senz'aria/.test(t)) c.lowO2 = true;
  if (c.lowO2) c.rate = 0.02;

  // catalizzatori e reagenti ausiliari
  const needs = new Set();
  for (const [k, keys] of Object.entries(AUXILIARY)) if (t.includes(k)) keys.forEach((key) => needs.add(keyId(key)));
  const segments = text.split(/,\s*/).filter((seg) => /cat\.|catalizz|concentrato|diluito|fumante/.test(seg));
  let unresolved = false;
  for (const seg of segments) {
    const before = needs.size;
    const tokens = seg.match(/[A-Z][a-z]?(?:[₀-₉]+)?(?:[A-Z][a-z]?(?:[₀-₉]+)?)*(?:²⁺)?/g) ?? [];
    for (const tok of tokens) {
      if (ION_TOKENS[tok]) ION_TOKENS[tok].forEach((key) => needs.add(keyId(key)));
      else if (byFormula.has(tok)) needs.add(byFormula.get(tok));
    }
    if (needs.size === before && /cat\.|catalizz/.test(seg) && !/acido|base|carbone attivo|lindlar/.test(seg)) unresolved = true;
  }
  needs.delete(0);
  if (needs.size) c.catalysts = needs;
  // enzimi e batteri: la reazione resta possibile solo se c'è un'alternativa (cat. MnO₂ o catalasi, Δ o enzima…)
  if (living && !(c.catalysts || c.hot || c.ignite)) c.disabled = 'serve un organismo vivente';
  else if (unresolved && !needs.size) c.disabled = 'catalizzatore non specificato';
  if (c.water) c.rate = Math.max(c.rate, 0.3); // in soluzione gli ioni si incontrano in fretta
  return c;
}

