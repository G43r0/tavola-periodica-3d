// Testi della sandbox: nomi e formule delle sostanze (anche sali e ossidi generati), equazioni delle reazioni
// osservate e note sul comportamento di ogni sostanza. Modulo puro.
import { CATEGORY } from '../data/categories.js';
import { fmtNumber } from '../chem/format.js';
import {
  AMBIENT, AIR_DENSITY, SOLID, LIQUID, GAS, S, DECAY, FLAME_COLOR_NAME, DISCHARGE_COLOR_NAME, FISSILE_ISOTOPE,
  SALT, OXIDE, SOLUTION, WATER, phaseAt, saltParts,
} from './substances.js';
import { createT, isItalian } from '../i18n/index.js';
import { SANDBOX_DESCRIBE } from './describe-strings.js';

const t = createT(SANDBOX_DESCRIBE);

export const LIBRARY_STATE = t('libraryState');

const SUBSCRIPT = '₀₁₂₃₄₅₆₇₈₉';
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sub = (n) => (n === 1 ? '' : String(n).replace(/\d/g, (d) => SUBSCRIPT[d]));
const sup = (n) => String(n).replace(/\d/g, (d) => SUPERSCRIPT[d]);
const coef = (n) => (n === 1 ? '' : `${n} `);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Minuscola iniziale senza toccare i numeri romani: "Cloruro di ferro(III)" → "cloruro di ferro(III)". */
const low = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const HALIDE = t('halide');
const NONMETAL_OXIDE = t('nonmetalOxide');
/** Formula delle molecole degli elementi gassosi o volatili. */
const MOLECULE = { H: 'H₂', N: 'N₂', O: 'O₂', F: 'F₂', Cl: 'Cl₂', Br: 'Br₂', I: 'I₂', At: 'At₂' };

export const PHASE_NAME = { [SOLID]: t('solid'), [LIQUID]: t('liquid'), [GAS]: t('gas') };
const TRANSITION = t('transition');

/** Temperatura in K → "1538 °C", "−38,8 °C" (un decimale solo per i valori piccoli non interi). */
export function fmtCelsius(K, digits) {
  const c = K - 273.15;
  const d = digits ?? (Math.abs(c) < 100 && Math.abs(c - Math.round(c)) >= 0.05 ? 1 : 0);
  return `${fmtNumber(c, d, d)} °C`;
}

/** Durata in secondi → "0,4 s", "1 min 35 s", "43 min", "49 h". */
export function fmtDuration(s) {
  if (s < 10) return `${fmtNumber(s, 1)} s`;
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 600) return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
  if (s < 7200) return `${Math.round(s / 60)} min`;
  return `${fmtNumber(s / 3600, 0)} h`;
}

function metalName(el, charge) {
  const name = el.name.toLowerCase();
  const positive = el.oxidationStates.filter((s) => s.startsWith('+')).length;
  return positive > 1 ? `${name}(${ROMAN[charge] ?? charge})` : name;
}

function oxideFormula(sym, c) {
  if (NONMETAL_OXIDE[sym]) return NONMETAL_OXIDE[sym][1];
  const g = gcd(c, 2);
  return `${sym}${sub(2 / g)}O${sub(c / g)}`;
}

/** Nome e formula di una sostanza (anche dei sali, degli ossidi e delle soluzioni generati dalle reazioni). */
export function substanceLabel(subs, id, ctype = 0) {
  const s = subs.list[id];
  if (!s) return { name: '?', formula: '' };
  if (id === SALT) {
    const [m, x] = saltParts(ctype);
    const M = subs.list[m];
    const X = subs.list[x];
    if (!M?.el || !X?.el) return { name: t('salt'), formula: '' };
    const c = M.charge || 1;
    const halide = HALIDE[X.symbol] ?? X.name.toLowerCase();
    const name = isItalian() ? `${halide} di ${metalName(M.el, c)}` : `${metalName(M.el, c)} ${halide}`;
    return { name: cap(name), formula: `${M.symbol}${X.symbol}${sub(c)}` };
  }
  if (id === OXIDE) {
    const M = subs.list[ctype];
    if (!M?.el) return { name: t('oxide'), formula: '' };
    if (NONMETAL_OXIDE[M.symbol]) return { name: NONMETAL_OXIDE[M.symbol][0], formula: NONMETAL_OXIDE[M.symbol][1] };
    const c = M.charge || 2;
    const name = t('oxideOf', { metal: metalName(M.el, c), Metal: cap(metalName(M.el, c)), rust: M.symbol === 'Fe' });
    return { name, formula: oxideFormula(M.symbol, c) };
  }
  if (id === SOLUTION) {
    const M = subs.list[ctype];
    if (!M?.el) return { name: s.name, formula: '' };
    const c = M.charge || 1;
    return { name: t('hydroxideOf', { metal: metalName(M.el, c), Metal: cap(metalName(M.el, c)) }), formula: c === 1 ? `${M.symbol}OH` : `${M.symbol}(OH)${sub(c)}` };
  }
  if (s.kind === 'element') return { name: s.name, formula: MOLECULE[s.symbol] ?? s.symbol };
  if (s.kind === 'compound' && s.formula) return { name: s.name, formula: s.formula };
  return { name: s.name, formula: s.kind === 'product' || s.id === WATER ? s.symbol : '' };
}

// ------------------------------------------------------------------ equazioni
export const ALIAS_FORMULA = { h2: 'H₂', n2: 'N₂', o2: 'O₂', f2: 'F₂', cl2: 'Cl₂', br2: 'Br₂', i2: 'I₂', p4: 'P₄', s8: 'S₈', h2o: 'H₂O', co2: 'CO₂', so2: 'SO₂' };
const STATE_MARK = { solid: '(s)', liquid: '(l)', gas: '(g)', aq: '(aq)' };
const mark = (s) => STATE_MARK[s.state25] ?? '';
const phaseMark = (subs, s, T) => ({ 1: '(s)', 2: '(l)', 3: '(g)' })[phaseAt(s, T)] ?? '';
const LOG_GROUP = t('logGroup');

/** Formula di una specie del catalogo («el:Na», «h2o», «nacl»). */
export function speciesFormula(subs, key) {
  if (key.startsWith('el:')) return key.slice(3);
  if (ALIAS_FORMULA[key]) return ALIAS_FORMULA[key];
  const id = subs.libraryId.get(key);
  return subs.list[id]?.formula ?? key;
}

/** Equazione di una reazione del catalogo, con i coefficienti. */
export function reactionEquation(subs, r) {
  const side = (list) => list.map(([c, key]) => `${coef(c)}${speciesFormula(subs, key)}`).join(' + ');
  return `${side(r.reactants)} → ${side(r.products)}`;
}

function describeCatalogReaction(subs, id) {
  const rx = subs.chem?.byId.get(id);
  if (!rx) return null;
  const r = rx.r;
  const productNames = r.products.map(([, key]) => {
    const sid = key.startsWith('el:') ? subs.byKey.get(key.slice(3))?.id : subs.libraryId.get(key);
    return subs.list[sid]?.name ?? key;
  });
  const title = r.name ?? t('forms', { n: r.products.length, list: productNames.map(low).join(', ') });
  const cond = r.cond ? t('conditions', { c: r.condText ?? r.cond }) : '';
  const dH = rx.dH != null ? `ΔH° ≈ ${fmtNumber(rx.dH, 0)} kJ. ` : '';
  return {
    group: LOG_GROUP[r.group] ?? t('chemical'),
    title,
    equation: reactionEquation(subs, r),
    note: `${cond}${dH}${r.note ?? r.desc ?? ''}${r.catalogo ? t('catalogNo', { n: r.catalogo }) : ''}`.trim(),
  };
}

function burnEquation(subs, id) {
  const s = subs.list[id];
  const fixed = {
    H: '2 H₂ + O₂ → 2 H₂O',
    C: 'C + O₂ → CO₂',
    S: 'S + O₂ → SO₂',
    P: 'P₄ + 5 O₂ → P₄O₁₀',
    wood: '(C₆H₁₀O₅)ₙ + 6n O₂ → 6n CO₂ + 5n H₂O',
    coal: 'C + O₂ → CO₂',
  }[s.key];
  if (fixed) return fixed;
  if (s.symbol === 'As') return '4 As + 3 O₂ → As₄O₆';
  const c = s.charge || 2;
  const g = gcd(c, 2);
  const a = 2 / g;
  const b = c / g;
  // x M + y O₂ → z MₐO_b
  let z = b % 2 ? 2 : 1;
  let y = (z * b) / 2;
  let x = z * a;
  const k = gcd(gcd(x, y), z);
  x /= k;
  y /= k;
  z /= k;
  return `${coef(x)}${s.symbol} + ${coef(y)}O₂ → ${coef(z)}${oxideFormula(s.symbol, c)}`;
}

/** Prodotti della combustione completa per elemento del combustibile (come exhaustOf): [Z, formula, atomi di Z, ossigeni]. */
const EXHAUST = [[6, 'CO₂', 1, 2], [1, 'H₂O', 2, 1], [16, 'SO₂', 1, 2], [7, 'N₂', 2, 0], [15, 'P₄O₁₀', 4, 10], [9, 'HF', 1, 0], [17, 'HCl', 1, 0], [35, 'HBr', 1, 0], [53, 'HI', 1, 0], [14, 'SiO₂', 1, 2]];
const HALOGEN_Z = [9, 17, 35, 53];

/**
 * Combustione completa di un composto fuori catalogo, bilanciata dagli atomi: CₓHᵧ… + O₂ → CO₂ + H₂O + SO₂ + N₂ +
 * P₄O₁₀ + HX + SiO₂ (gli stessi prodotti che il motore ricava con exhaustOf). null se il composto ha altri elementi.
 */
function compoundBurnEquation(s) {
  const n = (z) => s.counts?.[z] ?? 0;
  if (!s.counts || Object.keys(s.counts).some((z) => z !== '8' && !EXHAUST.some(([e]) => e === Number(z)))) return null;
  const halogens = HALOGEN_Z.reduce((t, z) => t + n(z), 0);
  if (n(1) < halogens) return null;
  // moli di ogni prodotto per una mole di combustibile (l'idrogeno degli alogenuri non fa acqua)
  const products = EXHAUST.map(([z, f, a, o]) => [f, (z === 1 ? n(1) - halogens : n(z)) / a, o]).filter(([, c]) => c > 0);
  const o2 = (products.reduce((t, [, c, o]) => t + c * o, 0) - n(8)) / 2;
  if (!products.length || o2 <= 0) return null;
  // il più piccolo moltiplicatore che rende interi tutti i coefficienti
  const whole = (k) => [o2, ...products.map(([, c]) => c)].every((c) => Math.abs(c * k - Math.round(c * k)) < 1e-9);
  let k = 1;
  while (k < 8 && !whole(k)) k++;
  const c = (x) => coef(Math.round(x * k));
  return `${c(1)}${s.formula} + ${c(o2)}O₂ → ${products.map(([f, x]) => `${c(x)}${f}`).join(' + ')}`;
}

function saltEquation(M, X) {
  const c = M.charge || 1;
  // x M + y X₂ → z MXc
  let x = 2;
  let y = c;
  let z = 2;
  const k = gcd(gcd(x, y), z);
  x /= k;
  y /= k;
  z /= k;
  const x2 = MOLECULE[X.symbol] ?? `${X.symbol}₂`;
  return `${coef(x)}${M.symbol} + ${coef(y)}${x2} → ${coef(z)}${M.symbol}${X.symbol}${sub(c)}`;
}

function thermiteEquation(A, B) {
  const ca = A.charge || 2;
  const cb = B.charge || 2;
  const [aa, ab] = [2 / gcd(ca, 2), ca / gcd(ca, 2)]; // A_aa O_ab
  const [ba, bb] = [2 / gcd(cb, 2), cb / gcd(cb, 2)]; // B_ba O_bb
  // x A + y B_ba O_bb → z A_aa O_ab + w B
  const g = gcd(bb, ab);
  let y = ab / g;
  let z = bb / g;
  let x = z * aa;
  let w = y * ba;
  const k = gcd(gcd(x, y), gcd(z, w));
  [x, y, z, w] = [x / k, y / k, z / k, w / k];
  return `${coef(x)}${A.symbol} + ${coef(y)}${oxideFormula(B.symbol, cb)} → ${coef(z)}${oxideFormula(A.symbol, ca)} + ${coef(w)}${B.symbol}`;
}

function fissionEquation(P, heavy, light, spontaneous) {
  const z = P.z;
  const k = 2 + ((z + heavy.z) & 1);
  const A = spontaneous ? P.decay.massNumber : FISSILE_ISOTOPE[P.symbol] ?? P.decay?.massNumber ?? Math.round(P.el.atomicMass.value);
  const total = (spontaneous ? A : A + 1) - k;
  const Ah = Math.round((total * heavy.z) / z);
  const lhs = spontaneous ? `${sup(A)}${P.symbol}` : `${sup(A)}${P.symbol} + n`;
  return `${lhs} → ${sup(Ah)}${heavy.symbol} + ${sup(total - Ah)}${light.symbol} + ${k} n`;
}

/**
 * Descrizione di un evento registrato dal motore (chiave di `world.events`).
 * @returns {{group:string, title:string, equation:string, note?:string}|null}
 */
export function describeEvent(subs, key) {
  const [kind, a, b, c] = key.split(':');
  const L = subs.list;
  switch (kind) {
    case 'rx':
      return describeCatalogReaction(subs, key.slice(3));
    case 'dissolve': {
      const s = L[Number(a)];
      return { group: t('gSolutions'), title: t('dissolves', { name: low(s.name) }), equation: `${s.formula}${mark(s)} → ${s.formula}(aq)` };
    }
    case 'crystal': {
      const s = L[Number(a)];
      return { group: t('gSolutions'), title: t('crystal', { name: low(s.name) }), equation: `${s.formula}(aq) → ${s.formula}${phaseMark(subs, s, 373.15)} + H₂O(g)`, note: t('crystalNote') };
    }
    case 'char': {
      const s = L[Number(a)];
      return { group: t('gDecompositions'), title: t('char', { name: low(s.name) }), equation: `${s.formula} → C + H₂O + …`, note: t('charNote', { T: fmtCelsius(s.bp) }) };
    }
    case 'boom': {
      const s = L[Number(a)];
      return { group: t('gExplosions'), title: t('boom', { name: low(s.name) }), equation: `${s.formula} → ${t('hotGases')}`, note: t('boomNote') };
    }
    case 'burn': {
      const s = L[Number(a)];
      if (s.kind === 'compound') {
        // i prodotti che il motore ricava dagli atomi del composto (C → CO₂, H → H₂O, S → SO₂…), bilanciati se si può
        // (con altri elementi, come il germanio di GeH₄, restano anche prodotti non elencati)
        const products = (subs.exhaustFor(s.id) ?? []).map(([id]) => `${substanceLabel(subs, id).formula} + `).join('');
        const equation = compoundBurnEquation(s) ?? `${s.formula} + O₂ → ${products}…`;
        return { group: t('gCombustions'), title: t('burn', { name: low(s.name) }), equation, note: t('burnGeneric') };
      }
      const notes = t('burnNotes');
      const flame = s.kind === 'element' && FLAME_COLOR_NAME[s.symbol] ? t('flame', { c: FLAME_COLOR_NAME[s.symbol] }) : '';
      return { group: t('gCombustions'), title: t('burn', { name: s.name.toLowerCase() }), equation: burnEquation(subs, s.id), note: notes[s.key] ?? flame };
    }
    case 'water': {
      const M = L[Number(a)];
      const alkali = M.category === 'alkali';
      return {
        group: t('chemical'),
        title: t('plusWater', { name: M.name }),
        equation: alkali ? `2 ${M.symbol} + 2 H₂O → 2 ${M.symbol}OH + H₂` : `${M.symbol} + 2 H₂O → ${M.symbol}(OH)₂ + H₂`,
        note: M.water.boom ? t('waterBoom') : M.water.heat > 500 ? t('waterHot') : t('waterCalm'),
      };
    }
    case 'salt': {
      const M = L[Number(a)];
      const X = L[Number(b)];
      return { group: t('chemical'), title: t('synthesis', { name: low(substanceLabel(subs, SALT, Number(a) * 128 + Number(b)).name) }), equation: saltEquation(M, X), note: t('saltNote') };
    }
    case 'thermite': {
      const A = L[Number(a)];
      const B = L[Number(b)];
      return { group: t('chemical'), title: t('thermite', { a: A.name.toLowerCase(), b: B.name.toLowerCase() }), equation: thermiteEquation(A, B), note: t('thermiteNote', { b: B.name.toLowerCase() }) };
    }
    case 'rust':
      return { group: t('chemical'), title: t('rust'), equation: '4 Fe + 3 O₂ + 2n H₂O → 2 Fe₂O₃·nH₂O', note: t('rustNote') };
    case 'pyrolysis':
      return { group: t('chemical'), title: t('pyrolysis'), equation: t('pyrolysisEq'), note: t('pyrolysisNote') };
    case 'decay': {
      const P = L[Number(a)];
      const d = P.decay;
      const D = L[d.daughter];
      const A = d.massNumber;
      const eq = {
        [DECAY.ALPHA]: `${sup(A)}${P.symbol} → ${sup(A - 4)}${D.symbol} + ⁴He`,
        [DECAY.BETA]: `${sup(A)}${P.symbol} → ${sup(A)}${D.symbol} + e⁻ + ν̄ₑ`,
        [DECAY.EC]: `${sup(A)}${P.symbol} + e⁻ → ${sup(A)}${D.symbol} + νₑ`,
        [DECAY.DOUBLE_BETA]: `${sup(A)}${P.symbol} → ${sup(A)}${D.symbol} + 2 e⁻ + 2 ν̄ₑ`,
      }[d.mode];
      const kindName = { [DECAY.ALPHA]: 'α', [DECAY.BETA]: 'β⁻', [DECAY.EC]: t('ec'), [DECAY.DOUBLE_BETA]: t('doubleBeta') }[d.mode];
      return {
        group: t('gNuclear'),
        title: t('decay', { kind: kindName, name: `${P.name.toLowerCase()}-${A}` }),
        equation: eq,
        note: d.mode === DECAY.ALPHA ? t('becomesAlpha', { d: D.name.toLowerCase(), t: d.halfLifeText }) : t('becomes', { d: D.name.toLowerCase(), t: d.halfLifeText }),
      };
    }
    case 'fission':
    case 'sf': {
      const P = L[Number(a)];
      const heavy = L[Number(b)];
      const light = L[P.z - heavy.z];
      const spontaneous = kind === 'sf';
      return {
        group: t('gNuclear'),
        title: `${spontaneous ? t('sf') : t('fission')}: ${P.name.toLowerCase()}`,
        equation: fissionEquation(P, heavy, light, spontaneous),
        note: spontaneous ? t('sfNote') : t('fissionNote', { a: heavy.name.toLowerCase(), b: light.name.toLowerCase() }),
      };
    }
    case 'electrolysis': {
      if (a === 'water') return { group: t('gElectricity'), title: t('electrolysisWater'), equation: '2 H₂O → 2 H₂ + O₂', note: t('electrolysisWaterNote') };
      const M = L[Number(b)];
      const X = L[Number(c)];
      const cc = M.charge || 1;
      let x = 2;
      let y = cc;
      const k = gcd(x, y);
      x /= k;
      y /= k;
      return { group: t('gElectricity'), title: t('electrolysisMolten', { name: low(substanceLabel(subs, SALT, Number(b) * 128 + Number(c)).name) }), equation: `${coef(x)}${M.symbol}${X.symbol}${sub(cc)} → ${coef(x)}${M.symbol} + ${coef(y)}${MOLECULE[X.symbol] ?? X.symbol + '₂'}`, note: t('electrolysisMoltenNote') };
    }
    case 'phase': {
      const id = Number(a);
      const s = L[id];
      const verb = TRANSITION[b];
      if (!s || !verb) return null;
      const T = b === '12' || b === '21' || b === '13' || b === '31' ? s.mp : s.bp;
      return { group: t('gPhase'), title: `${cap(verb)}: ${s.name.toLowerCase()}`, equation: t('atT', { T: fmtCelsius(T), est: s.estimated }) };
    }
    default:
      return null;
  }
}

// ------------------------------------------------------------------ note sulla sostanza selezionata
function densityText(s, phase) {
  if (phase === GAS) {
    const gL = s.densG * 1000;
    const ratio = s.densG / AIR_DENSITY;
    const verb = ratio < 0.8 ? t('rises') : ratio > 1.25 ? t('sinks') : t('mixes');
    return t('gasDensity', { gL: fmtNumber(gL, 2), air: fmtNumber(1.29, 2), verb });
  }
  const d = phase === SOLID ? s.densS : s.densL;
  return t('density', { d: fmtNumber(d, d < 1 ? 3 : 2), floats: d < 0.99 });
}

/**
 * Note sul comportamento della sostanza nella sandbox (per la scheda della selezione).
 * @returns {string[]}
 */
export function substanceNotes(subs, id, ctype = 0) {
  const s = subs.list[id];
  const notes = [];
  if (!s) return notes;
  if (s.kind === 'compound') return compoundNotes(subs, s);
  const f = s.flags;
  if (f & S.WALL) return [t('wall')];
  if (f & S.SOURCE) return t('source');
  if (f & S.DRAIN) return t('drain');
  if (f & S.GENERATOR) return t('generator');
  const phase = phaseAt(s, AMBIENT);
  if (s.kind === 'element') notes.push(t('elementAt22', { cat: cap(CATEGORY[s.category]?.singular ?? ''), phase: phase === GAS ? t('aGas') : PHASE_NAME[phase] }));
  if (s.mp > 0 && Number.isFinite(s.mp)) {
    const est = s.estimated ? t('estimate') : '';
    if (s.sublimes || s.mp === s.bp) notes.push(t('sublimes', { T: fmtCelsius(s.mp), est }));
    else if (s.symbol === 'He') notes.push(t('helium', { T: fmtCelsius(s.bp, 2) }));
    else notes.push(t('meltsBoils', { mp: fmtCelsius(s.mp), bp: fmtCelsius(s.bp), est }));
  } else if (s.key === 'wood' || s.key === 'coal') notes.push(t('noMelt'));
  if (s.densS) notes.push(densityText(s, phase));
  if (s.burn) {
    const where = s.burn.instant ? t('burnsInstant') : f & S.BURNS_AS_BLOCK ? t('burns') : t('burnsPowder');
    const from = s.burn.ignite < AMBIENT + 20 ? t('evenRoomT') : t('above', { T: fmtCelsius(s.burn.ignite) });
    const flame = s.kind === 'element' && FLAME_COLOR_NAME[s.symbol] ? t('flameShort', { c: FLAME_COLOR_NAME[s.symbol] }) : '';
    notes.push(`${where}${from}${flame}.`);
  } else if (s.kind === 'element' && FLAME_COLOR_NAME[s.symbol]) notes.push(t('flameTest', { c: FLAME_COLOR_NAME[s.symbol] }));
  if (s.key === 'wood') notes.push(t('woodPyro'));
  if (s.key === 'concrete') notes.push(t('concrete'));
  if (s.water) notes.push(s.water.boom ? t('waterExplodes') : s.water.hot ? t('waterHotOnly') : t('waterReacts'));
  if (f & S.HALOGEN) notes.push(t('halogen'));
  if (f & S.OXIDIZER) notes.push(t('oxidizer'));
  if (f & S.CONDUCTOR) notes.push(t('conductor'));
  else if (f & S.SEMI) notes.push(t('semi'));
  else if (f & S.LIQUID_CONDUCTOR) notes.push(id === WATER ? t('waterConducts') : t('liquidConducts'));
  if (f & S.DISCHARGE) notes.push(t('discharge', { c: DISCHARGE_COLOR_NAME[s.symbol] }));
  if (f & S.METAL && id < 119) notes.push(t('thermiteHint'));
  if (s.decay) {
    const d = s.decay;
    const D = subs.list[d.daughter];
    const mode = { [DECAY.ALPHA]: `α → ${D?.name}`, [DECAY.BETA]: `β⁻ → ${D?.name}`, [DECAY.EC]: `${t('ecShort')} → ${D?.name}`, [DECAY.DOUBLE_BETA]: `${t('doubleBeta')} → ${D?.name}`, [DECAY.FISSION]: t('sfLow') }[d.mode];
    notes.push(t('radioactive', { sym: s.symbol, A: d.massNumber, t: d.halfLifeText, game: fmtDuration(d.gameSeconds), mode }));
  }
  if (f & S.FISSILE) notes.push(t('fissile'));
  if (f & S.ABSORBER) notes.push(t('absorber'));
  if (f & S.MODERATOR) notes.push(t('moderator'));
  if (f & S.REFLECTOR) notes.push(t('reflector'));
  if (f & S.SHIELD && id < 119) notes.push(t('shield'));
  if (id === SALT || id === OXIDE || id === SOLUTION) {
    const label = substanceLabel(subs, id, ctype);
    if (label.formula) notes.unshift(`${label.name} (${label.formula}).`);
  }
  const n = subs.chem?.involvement.get(id);
  if (n) notes.push(t('inCatalog', { n }));
  if (s.entry?.desc) notes.unshift(s.entry.desc);
  return notes;
}

/** Note su una sostanza della libreria del laboratorio. */
function compoundNotes(subs, s) {
  const f = s.flags;
  const notes = [];
  if (s.entry?.desc) notes.push(s.entry.desc);
  const est = s.estimated ? t('estimate') : '';
  if (f & S.AQUEOUS) {
    notes.push(t('aqueousOnly'));
  } else {
    const phase = phaseAt(s, AMBIENT);
    notes.push(t('at22', { phase: phase === GAS ? t('aGas') : PHASE_NAME[phase] }));
    if (f & S.DECOMPOSES) notes.push(s.mp < s.bp ? t('meltsDecomposes', { mp: fmtCelsius(s.mp), bp: fmtCelsius(s.bp), est }) : t('decomposes', { bp: fmtCelsius(s.bp), est }));
    else if (s.sublimes) notes.push(t('sublimes', { T: fmtCelsius(s.mp), est }));
    else notes.push(t('meltsBoils', { mp: fmtCelsius(s.mp), bp: fmtCelsius(s.bp), est }));
    notes.push(densityText(s, phase));
    if (f & S.SOLUBLE) notes.push(t('soluble'));
    else if (f & S.MISCIBLE) notes.push(t('miscible'));
    else if (phase !== GAS) notes.push(t('insoluble'));
  }
  if (s.burn) notes.push(t('flammable', { instant: f & S.INSTANT_BURN, ign: s.ignC != null ? fmtCelsius(s.ignC + 273.15) : null }));
  if (f & S.EXPLOSIVE) notes.push(t('explosive', { T: fmtCelsius(s.bp) }));
  if (f & S.OXIDIZER) notes.push(t('oxidizerCompound'));
  if (f & S.EXTINGUISHER) notes.push(t('extinguisher'));
  if (f & S.LIQUID_CONDUCTOR && !(f & S.AQUEOUS) && (f & S.SOLUBLE || s.mp < s.bp)) notes.push(f & S.SOLUBLE ? t('conductsSoluble') : t('conductsMolten'));
  const tint = subs.P.flameTint[s.id];
  if (tint && FLAME_COLOR_NAME[subs.list[tint].symbol]) notes.push(t('flameOf', { c: FLAME_COLOR_NAME[subs.list[tint].symbol], name: low(subs.list[tint].name) }));
  const n = subs.chem?.involvement.get(s.id);
  notes.push(n ? t('inCatalog', { n }) : t('noCatalog'));
  if (s.entry?.uses) notes.push(t('uses', { u: s.entry.uses }));
  return notes;
}
