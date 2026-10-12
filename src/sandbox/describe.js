// Testi della sandbox: nomi e formule delle sostanze (anche sali e ossidi generati), equazioni delle reazioni
// osservate e note sul comportamento di ogni sostanza. Modulo puro.
import { CATEGORY } from '../data/categories.js';
import { fmtNumber } from '../chem/format.js';
import {
  AMBIENT, AIR_DENSITY, SOLID, LIQUID, GAS, S, DECAY, FLAME_COLOR_NAME, DISCHARGE_COLOR_NAME, FISSILE_ISOTOPE,
  SALT, OXIDE, SOLUTION, WATER, phaseAt, saltParts,
} from './substances.js';

export const LIBRARY_STATE = { solid: 'solido', liquid: 'liquido', gas: 'gas', aq: 'in soluzione acquosa' };

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

const HALIDE = { F: 'fluoruro', Cl: 'cloruro', Br: 'bromuro', I: 'ioduro', At: 'astaturo' };
const NONMETAL_OXIDE = {
  B: ['Triossido di diboro', 'B₂O₃'], Si: ['Diossido di silicio (silice)', 'SiO₂'], P: ['Decaossido di tetrafosforo', 'P₄O₁₀'],
  As: ['Triossido di diarsenico', 'As₂O₃'], Se: ['Diossido di selenio', 'SeO₂'], Te: ['Diossido di tellurio', 'TeO₂'],
  Sb: ['Triossido di diantimonio', 'Sb₂O₃'], Ge: ['Diossido di germanio', 'GeO₂'],
};
/** Formula delle molecole degli elementi gassosi o volatili. */
const MOLECULE = { H: 'H₂', N: 'N₂', O: 'O₂', F: 'F₂', Cl: 'Cl₂', Br: 'Br₂', I: 'I₂', At: 'At₂' };

export const PHASE_NAME = { [SOLID]: 'solido', [LIQUID]: 'liquido', [GAS]: 'gas' };
const TRANSITION = { 12: 'fusione', 21: 'solidificazione', 23: 'ebollizione', 32: 'condensazione', 13: 'sublimazione', 31: 'brinamento' };

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
    if (!M?.el || !X?.el) return { name: 'Sale', formula: '' };
    const c = M.charge || 1;
    return { name: cap(`${HALIDE[X.symbol] ?? X.name.toLowerCase()} di ${metalName(M.el, c)}`), formula: `${M.symbol}${X.symbol}${sub(c)}` };
  }
  if (id === OXIDE) {
    const M = subs.list[ctype];
    if (!M?.el) return { name: 'Ossido', formula: '' };
    if (NONMETAL_OXIDE[M.symbol]) return { name: NONMETAL_OXIDE[M.symbol][0], formula: NONMETAL_OXIDE[M.symbol][1] };
    const c = M.charge || 2;
    const name = `Ossido di ${metalName(M.el, c)}${M.symbol === 'Fe' ? ' (ruggine)' : ''}`;
    return { name, formula: oxideFormula(M.symbol, c) };
  }
  if (id === SOLUTION) {
    const M = subs.list[ctype];
    if (!M?.el) return { name: s.name, formula: '' };
    const c = M.charge || 1;
    return { name: `Idrossido di ${metalName(M.el, c)} in soluzione`, formula: c === 1 ? `${M.symbol}OH` : `${M.symbol}(OH)${sub(c)}` };
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
const LOG_GROUP = {
  combustioni: 'Combustioni', decomposizioni: 'Decomposizioni', ioni: 'Reazioni in soluzione', precipitazioni: 'Reazioni in soluzione',
  'acidi-basi': 'Acidi e basi', acqua: 'Reazioni con l\'acqua', organica: 'Chimica organica', metallurgia: 'Metallurgia',
};

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
  const title = r.name ?? `Si forma${r.products.length > 1 ? 'no' : ''}: ${productNames.map(low).join(', ')}`;
  const cond = r.cond ? `Condizioni: ${r.cond}. ` : '';
  const dH = rx.dH != null ? `ΔH° ≈ ${fmtNumber(rx.dH, 0)} kJ. ` : '';
  return {
    group: LOG_GROUP[r.group] ?? 'Reazioni chimiche',
    title,
    equation: reactionEquation(subs, r),
    note: `${cond}${dH}${r.note ?? r.desc ?? ''}${r.catalogo ? ` (catalogo n. ${r.catalogo})` : ''}`.trim(),
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
      return { group: 'Soluzioni', title: `Si scioglie in acqua: ${low(s.name)}`, equation: `${s.formula}${mark(s)} → ${s.formula}(aq)` };
    }
    case 'crystal': {
      const s = L[Number(a)];
      return { group: 'Soluzioni', title: `Cristallizza: ${low(s.name)}`, equation: `${s.formula}(aq) → ${s.formula}${phaseMark(subs, s, 373.15)} + H₂O(g)`, note: 'L\'acqua della soluzione bolle via e il soluto resta.' };
    }
    case 'char': {
      const s = L[Number(a)];
      return { group: 'Decomposizioni', title: `Carbonizzazione: ${low(s.name)}`, equation: `${s.formula} → C + H₂O + …`, note: `Oltre ${fmtCelsius(s.bp)} si decompone lasciando carbonio (come lo zucchero che diventa caramello e poi carbone).` };
    }
    case 'boom': {
      const s = L[Number(a)];
      return { group: 'Esplosioni', title: `Detonazione: ${low(s.name)}`, equation: `${s.formula} → gas caldi`, note: 'Si decompone di colpo liberando gas ed energia.' };
    }
    case 'burn': {
      const s = L[Number(a)];
      if (s.kind === 'compound') {
        return { group: 'Combustioni', title: `Combustione: ${low(s.name)}`, equation: `${s.formula} + O₂ → ${s.counts?.[6] ? 'CO₂ + ' : ''}H₂O + …`, note: 'Equazione indicativa (reazione non presente nel catalogo): prodotti principali della combustione.' };
      }
      const notes = {
        H: 'L\'idrogeno brucia di colpo: il vapore acqueo prodotto poi si condensa in gocce.',
        wood: 'La cellulosa brucia con fiamma e fumo; restano cenere e un po\' di carbone.',
        coal: 'Il carbone brucia lentamente come brace, senza quasi fiamma.',
        S: 'Fiamma blu; l\'anidride solforosa è un gas più pesante dell\'aria.',
        P: 'Il fosforo bianco si accende da solo poco sopra i 30 °C.',
      };
      const flame = s.kind === 'element' && FLAME_COLOR_NAME[s.symbol] ? `Fiamma ${FLAME_COLOR_NAME[s.symbol]}.` : '';
      return { group: 'Combustioni', title: `Combustione: ${s.name.toLowerCase()}`, equation: burnEquation(subs, s.id), note: notes[s.key] ?? flame };
    }
    case 'water': {
      const M = L[Number(a)];
      const alkali = M.category === 'alkali';
      return {
        group: 'Reazioni chimiche',
        title: `${M.name} + acqua`,
        equation: alkali ? `2 ${M.symbol} + 2 H₂O → 2 ${M.symbol}OH + H₂` : `${M.symbol} + 2 H₂O → ${M.symbol}(OH)₂ + H₂`,
        note: M.water.boom ? 'Reazione esplosiva: l\'idrogeno si incendia.' : M.water.heat > 500 ? 'Il calore accende l\'idrogeno liberato.' : 'Si libera idrogeno e la soluzione diventa basica.',
      };
    }
    case 'salt': {
      const M = L[Number(a)];
      const X = L[Number(b)];
      return { group: 'Reazioni chimiche', title: `Sintesi: ${low(substanceLabel(subs, SALT, Number(a) * 128 + Number(b)).name)}`, equation: saltEquation(M, X), note: 'Il metallo cede elettroni all\'alogeno e si forma un sale ionico, con molto calore.' };
    }
    case 'thermite': {
      const A = L[Number(a)];
      const B = L[Number(b)];
      return { group: 'Reazioni chimiche', title: `Alluminotermia (${A.name.toLowerCase()} + ossido di ${B.name.toLowerCase()})`, equation: thermiteEquation(A, B), note: `Il metallo più reattivo strappa l'ossigeno all'ossido: si libera ${B.name.toLowerCase()} fuso, a oltre 2 500 °C.` };
    }
    case 'rust':
      return { group: 'Reazioni chimiche', title: 'Formazione della ruggine', equation: '4 Fe + 3 O₂ + 2n H₂O → 2 Fe₂O₃·nH₂O', note: 'Il ferro bagnato si ossida lentamente all\'aria.' };
    case 'pyrolysis':
      return { group: 'Reazioni chimiche', title: 'Pirolisi del legno', equation: 'legno → carbone + gas', note: 'Scaldato senza ossigeno il legno non brucia ma si carbonizza.' };
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
      const kindName = { [DECAY.ALPHA]: 'α', [DECAY.BETA]: 'β⁻', [DECAY.EC]: 'per cattura elettronica', [DECAY.DOUBLE_BETA]: 'doppio β⁻' }[d.mode];
      return {
        group: 'Fisica nucleare',
        title: `Decadimento ${kindName}: ${P.name.toLowerCase()}-${A}`,
        equation: eq,
        note: d.mode === DECAY.ALPHA ? `Diventa ${D.name.toLowerCase()} e la particella α diventa un atomo di elio. t½ reale ${d.halfLifeText}.` : `Diventa ${D.name.toLowerCase()}. t½ reale ${d.halfLifeText}.`,
      };
    }
    case 'fission':
    case 'sf': {
      const P = L[Number(a)];
      const heavy = L[Number(b)];
      const light = L[P.z - heavy.z];
      const spontaneous = kind === 'sf';
      return {
        group: 'Fisica nucleare',
        title: `${spontaneous ? 'Fissione spontanea' : 'Fissione'}: ${P.name.toLowerCase()}`,
        equation: fissionEquation(P, heavy, light, spontaneous),
        note: spontaneous ? 'Il nucleo si spezza da solo e libera neutroni.' : `Si formano ${heavy.name.toLowerCase()} e ${light.name.toLowerCase()}; i neutroni liberati possono spezzare altri nuclei (reazione a catena).`,
      };
    }
    case 'electrolysis': {
      if (a === 'water') return { group: 'Elettricità', title: "Elettrolisi dell'acqua", equation: '2 H₂O → 2 H₂ + O₂', note: 'La corrente scompone l\'acqua in idrogeno e ossigeno (2 : 1).' };
      const M = L[Number(b)];
      const X = L[Number(c)];
      const cc = M.charge || 1;
      let x = 2;
      let y = cc;
      const k = gcd(x, y);
      x /= k;
      y /= k;
      return { group: 'Elettricità', title: `Elettrolisi: ${low(substanceLabel(subs, SALT, Number(b) * 128 + Number(c)).name)} fuso`, equation: `${coef(x)}${M.symbol}${X.symbol}${sub(cc)} → ${coef(x)}${M.symbol} + ${coef(y)}${MOLECULE[X.symbol] ?? X.symbol + '₂'}`, note: 'Il sale fuso conduce: la corrente lo separa nei suoi elementi.' };
    }
    case 'phase': {
      const id = Number(a);
      const s = L[id];
      const verb = TRANSITION[b];
      if (!s || !verb) return null;
      const T = b === '12' || b === '21' || b === '13' || b === '31' ? s.mp : s.bp;
      return { group: 'Cambiamenti di stato', title: `${cap(verb)}: ${s.name.toLowerCase()}`, equation: `a ${fmtCelsius(T)}${s.estimated ? ' (stima)' : ''}` };
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
    const verb = ratio < 0.8 ? 'sale verso l\'alto' : ratio > 1.25 ? 'scende verso il basso' : 'si mescola all\'aria';
    return `Gas: ${fmtNumber(gL, 2)} g/L a 0 °C (aria 1,29 g/L), ${verb}`;
  }
  const d = phase === SOLID ? s.densS : s.densL;
  return `Densità ${fmtNumber(d, d < 1 ? 3 : 2)} g/cm³${d < 0.99 ? ' (galleggia sull\'acqua)' : ''}`;
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
  if (f & S.WALL) return ['Indistruttibile: non brucia, non fonde, isola dal calore, resiste alle esplosioni e ferma radiazioni e neutroni.'];
  if (f & S.SOURCE) return ['Clona all\'infinito la prima sostanza che tocca: posala accanto a ciò che vuoi moltiplicare (acqua, sabbia, gas…).', 'Ne mette una cella a ogni passo attorno a sé; non brucia e non fonde. La gomma la ferma.'];
  if (f & S.DRAIN) return ['Cancella tutto ciò che lo tocca: liquidi, polveri e gas spariscono. Serve a svuotare vasche e smaltire i gas.', 'Non brucia e non fonde.'];
  if (f & S.GENERATOR) return ['Genera una scintilla ogni 0,2 s nei conduttori che tocca: metalli, grafite, acqua, gas nobili.', 'Non brucia e non fonde.'];
  const phase = phaseAt(s, AMBIENT);
  if (s.kind === 'element') notes.push(`${cap(CATEGORY[s.category]?.singular ?? '')}. A 22 °C è ${PHASE_NAME[phase] === 'gas' ? 'un gas' : PHASE_NAME[phase]}.`);
  if (s.mp > 0 && Number.isFinite(s.mp)) {
    const est = s.estimated ? ' (stima)' : '';
    if (s.sublimes || s.mp === s.bp) notes.push(`Sublima a ${fmtCelsius(s.mp)}${est}: da solido diventa direttamente gas.`);
    else if (s.symbol === 'He') notes.push(`Bolle a ${fmtCelsius(s.bp, 2)}; a pressione ambiente non solidifica mai.`);
    else notes.push(`Fonde a ${fmtCelsius(s.mp)} e bolle a ${fmtCelsius(s.bp)}${est}.`);
  } else if (s.key === 'wood' || s.key === 'coal') notes.push('Non fonde: col calore brucia o si carbonizza.');
  if (s.densS) notes.push(densityText(s, phase));
  if (s.burn) {
    const where = s.burn.instant ? 'Con aria o ossigeno brucia di colpo' : f & S.BURNS_AS_BLOCK ? 'Brucia' : 'Brucia in polvere o fuso (non in blocco)';
    const from = s.burn.ignite < AMBIENT + 20 ? ' anche a temperatura ambiente' : ` sopra i ${fmtCelsius(s.burn.ignite)}`;
    const flame = s.kind === 'element' && FLAME_COLOR_NAME[s.symbol] ? `, fiamma ${FLAME_COLOR_NAME[s.symbol]}` : '';
    notes.push(`${where}${from}${flame}.`);
  } else if (s.kind === 'element' && FLAME_COLOR_NAME[s.symbol]) notes.push(`Nel fuoco dà una fiamma ${FLAME_COLOR_NAME[s.symbol]} (saggio alla fiamma).`);
  if (s.key === 'wood') notes.push('Senza ossigeno, scaldato, diventa carbone (pirolisi).');
  if (s.key === 'concrete') notes.push('Resiste bene alle esplosioni; fuso diventa lava.');
  if (s.water) notes.push(s.water.boom ? 'Esplode a contatto con l\'acqua liberando idrogeno.' : s.water.hot ? 'Reagisce con l\'acqua calda o il vapore liberando idrogeno.' : 'Reagisce con l\'acqua liberando idrogeno e calore.');
  if (f & S.HALOGEN) notes.push('Con i metalli forma sali (più il metallo è reattivo, più la reazione è violenta).');
  if (f & S.OXIDIZER) notes.push('Alimenta la combustione: ciò che brucia lo fa più in fretta e più caldo.');
  if (f & S.CONDUCTOR) notes.push('Conduce l\'elettricità.');
  else if (f & S.SEMI) notes.push('Semiconduttore: conduce l\'elettricità solo da caldo (oltre 177 °C).');
  else if (f & S.LIQUID_CONDUCTOR) notes.push(id === WATER ? 'Conduce l\'elettricità (acqua non pura); con la corrente si scompone in H₂ e O₂.' : 'Conduce l\'elettricità da liquido.');
  if (f & S.DISCHARGE) notes.push(`Da gas, con la scarica elettrica si illumina di ${DISCHARGE_COLOR_NAME[s.symbol]}.`);
  if (f & S.METAL && id < 119) notes.push('Con l\'ossido di un metallo meno reattivo, ad alta temperatura, dà l\'alluminotermia.');
  if (s.decay) {
    const d = s.decay;
    const D = subs.list[d.daughter];
    const mode = { [DECAY.ALPHA]: `α → ${D?.name}`, [DECAY.BETA]: `β⁻ → ${D?.name}`, [DECAY.EC]: `cattura elettronica → ${D?.name}`, [DECAY.DOUBLE_BETA]: `doppio β⁻ → ${D?.name}`, [DECAY.FISSION]: 'fissione spontanea' }[d.mode];
    notes.push(`Radioattivo (${s.symbol}-${d.massNumber}): t½ ${d.halfLifeText}; nella sandbox ≈ ${fmtDuration(d.gameSeconds)}. Decadimento ${mode}.`);
  }
  if (f & S.FISSILE) notes.push('Fissile: i neutroni (soprattutto se rallentati) spezzano i nuclei e ne liberano altri.');
  if (f & S.ABSORBER) notes.push('Assorbe i neutroni: si usa nelle barre di controllo dei reattori.');
  if (f & S.MODERATOR) notes.push('Rallenta i neutroni (moderatore): quelli lenti causano più fissioni.');
  if (f & S.REFLECTOR) notes.push('Riflette i neutroni.');
  if (f & S.SHIELD && id < 119) notes.push('Scherma bene la radiazione.');
  if (id === SALT || id === OXIDE || id === SOLUTION) {
    const label = substanceLabel(subs, id, ctype);
    if (label.formula) notes.unshift(`${label.name} (${label.formula}).`);
  }
  const n = subs.chem?.involvement.get(id);
  if (n) notes.push(`Compare in ${n} reazioni del catalogo simulate nella sandbox.`);
  if (s.entry?.desc) notes.unshift(s.entry.desc);
  return notes;
}

/** Note su una sostanza della libreria del laboratorio. */
function compoundNotes(subs, s) {
  const f = s.flags;
  const notes = [];
  if (s.entry?.desc) notes.push(s.entry.desc);
  const est = s.estimated ? ' (stima)' : '';
  if (f & S.AQUEOUS) {
    notes.push('Esiste solo in soluzione acquosa: si muove come l\'acqua (colorata, se lo ione è colorato); bollendo lascia solo vapore.');
  } else {
    const phase = phaseAt(s, AMBIENT);
    notes.push(`A 22 °C è ${phase === GAS ? 'un gas' : PHASE_NAME[phase]}.`);
    if (f & S.DECOMPOSES) notes.push(s.mp < s.bp ? `Fonde a ${fmtCelsius(s.mp)} e si decompone verso ${fmtCelsius(s.bp)}${est}.` : `Si decompone verso ${fmtCelsius(s.bp)}${est}.`);
    else if (s.sublimes) notes.push(`Sublima a ${fmtCelsius(s.mp)}${est}: da solido diventa direttamente gas.`);
    else notes.push(`Fonde a ${fmtCelsius(s.mp)} e bolle a ${fmtCelsius(s.bp)}${est}.`);
    notes.push(densityText(s, phase));
    if (f & S.SOLUBLE) notes.push('Si scioglie in acqua (oppure posala «In soluzione»); facendo bollire la soluzione torna a cristallizzare.');
    else if (f & S.MISCIBLE) notes.push('Si mescola con l\'acqua in ogni proporzione.');
    else if (phase !== GAS) notes.push('Non si scioglie in acqua: se si forma in una soluzione, precipita.');
  }
  if (s.burn) notes.push(`Infiammabile: ${f & S.INSTANT_BURN ? 'con l\'aria brucia di colpo' : 'brucia con l\'aria'}${s.ignC != null ? ` (si accende da sola sopra ${fmtCelsius(s.ignC + 273.15)})` : ''}.`);
  if (f & S.EXPLOSIVE) notes.push(`Esplosivo: detona sopra ${fmtCelsius(s.bp)} o se raggiunto da un'esplosione.`);
  if (f & S.OXIDIZER) notes.push('Ossidante: fa bruciare ciò che lo tocca anche senza aria.');
  if (f & S.EXTINGUISHER) notes.push('Non brucia e soffoca le fiamme.');
  if (f & S.LIQUID_CONDUCTOR && !(f & S.AQUEOUS) && (f & S.SOLUBLE || s.mp < s.bp)) notes.push(f & S.SOLUBLE ? 'Fuso o sciolto in acqua conduce l\'elettricità (elettrolisi).' : 'Fuso conduce l\'elettricità (elettrolisi ignea).');
  const tint = subs.P.flameTint[s.id];
  if (tint && FLAME_COLOR_NAME[subs.list[tint].symbol]) notes.push(`Nel fuoco dà una fiamma ${FLAME_COLOR_NAME[subs.list[tint].symbol]} (${low(subs.list[tint].name)}).`);
  const n = subs.chem?.involvement.get(s.id);
  notes.push(n ? `Compare in ${n} reazioni del catalogo simulate nella sandbox.` : 'Nessuna reazione del catalogo la coinvolge nella sandbox.');
  if (s.entry?.uses) notes.push(`Usi: ${s.entry.uses}`);
  return notes;
}
