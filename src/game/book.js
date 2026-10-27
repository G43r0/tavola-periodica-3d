// Libro «Come si fa»: le ricette delle reazioni del catalogo che si possono fare nel laboratorio del gioco, generate dai
// dati. Per ogni reazione: con quali reagenti del magazzino (nelle forme che il magazzino dà davvero: solido, liquido,
// soluzione 0,1 M o 1 M, i gas delle bombole, l'aria), in che dosi (calcolate dalle masse molari per una dose da
// scuola, con l'eccesso giusto), in quale recipiente, scaldando come e quanto, i passi numerati (con il controllo che
// li spunta quando si segue la ricetta), che cosa si osserva, i pericoli e dove va il rifiuto. runRecipe esegue la
// ricetta con il motore dei contenitori: il libro mostra solo le ricette che il gioco fa davvero (book-verified.js,
// rigenerato da scripts/book.mjs e controllato dai test). Modulo puro (niente DOM): i testi sono in game-strings.js.
import { WATER, S, GAS, AMBIENT, phaseAt } from '../sandbox/substances.js';
import { Mixture, wasteClass } from './mixture.js';
import { aqueousOf, reactionSignals, signalTags } from './signals.js';
import { SHELF, CABINET } from './reagents.js';
import { reagentLook, derivedHazards } from './stock.js';
import { CYLINDER_GASES, GAS_FLOW } from './apparatus-logic.js';
import { LAB_MAX_T } from './coverage.js';
import { DEFS } from './items.js';

/** Dose di riferimento (mol per unità di coefficiente): 10 mL di una soluzione 1 M, 0,65 g di zinco. */
export const DOSE = 0.01;
/** Eccesso dei reagenti non limitanti. */
export const EXCESS = 1.2;
/** Limiti di una dose da bancone: soluzioni (mL), solidi (g), liquidi puri (mL). */
const MAX_SOLUTION_ML = 60;
const MAX_SOLID_G = 6;
const MAX_LIQUID_ML = 20;
/** Temperatura massima (K) della piastra al livello 5 (22 + 5 · 60 °C). */
const PLATE_MAX_T = 595.15;
/** Tensione dell'elettrolisi nelle ricette (V). */
export const RECIPE_VOLTS = 6;
/** Sopra questa temperatura (K) il recipiente si prende con la pinza (apparatus-logic HOT_T). */
const HOT = 333.15;

const roundTo = (x, step) => Math.round(x / step) * step;

/**
 * Temperatura (K) a cui si ferma un recipiente sulla piastra al livello dato: la piastra scalda con 6 W/K di differenza
 * (al massimo 90 W per livello) e il recipiente disperde 0,3 + area · 0,03 W/K verso l'aria (come nel gioco).
 */
export function plateEquilibrium(level, kind) {
  const loss = 0.3 + DEFS[kind].area * 0.03;
  const hpT = AMBIENT + level * 60;
  return Math.min((6 * hpT + loss * AMBIENT) / (6 + loss), AMBIENT + (level * 90) / loss);
}
const gramsOf = (g) => (g >= 1 ? Math.max(0.1, roundTo(g, 0.1)) : Math.max(0.05, roundTo(g, 0.05)));
const mlOf = (ml) => (ml >= 5 ? Math.max(5, Math.round(ml)) : Math.max(1, roundTo(ml, 0.5)));
/** Un liquido puro: sotto 1 mL si misura con la pipetta graduata (0,1 mL). */
const liquidMlOf = (ml) => (ml >= 1 ? mlOf(ml) : Math.max(0.2, roundTo(ml, 0.1)));

// ------------------------------------------------------------------ magazzino

/**
 * Che cosa dà il magazzino del Laboratorio libero, sostanza per sostanza (come il catalogo del gioco): le sostanze della
 * libreria solide o liquide a 25 °C (non i gas, non gli ioni), le soluzioni 0,1 M e 1 M di quelle che si sciolgono, e
 * i metalli in pezzi. sol = solubilità a 22 °C (g/100 g d'acqua).
 * @returns {Map<number, {key: string, st: 'solid'|'liquid', soluble: boolean, sol: number}>}
 */
export function storeIndex(ctx) {
  const out = new Map();
  for (const e of ctx.subs.library.entries) {
    const sid = ctx.subs.libraryId.get(e.id);
    const s = ctx.sub(sid);
    if (!s || s.flags & S.AQUEOUS) continue;
    const st = s.kind === 'element' ? (s.mp > 295 ? 'solid' : s.bp > 295 ? 'liquid' : 'gas') : s.state25;
    if (st !== 'solid' && st !== 'liquid') continue;
    const sol = ctx.solubility(sid, 295);
    out.set(sid, { key: e.id, st, soluble: sol > 0.5, sol });
  }
  for (const el of ctx.subs.elements) {
    const s = ctx.sub(el.z);
    if (el.z >= 84 || !s || s.mp <= 295 || ['P', 'As', 'Se'].includes(el.symbol) || out.has(el.z)) continue;
    out.set(el.z, { key: el.symbol, st: 'solid', soluble: false, sol: 0 });
  }
  return out;
}

/** Reagenti dello scaffale e dell'armadio per sostanza: chiave, forma e molarità (si preferiscono nelle ricette). */
export function shelfIndex(ctx) {
  const out = new Map();
  for (const [key, r] of Object.entries({ ...SHELF, ...CABINET })) {
    if (r.water || r.indicator) continue;
    const sid = ctx.id(r.solute ?? r.solid ?? r.liquid);
    if (!sid) continue;
    const form = r.solute ? 'solution' : r.liquid ? 'liquid' : 'solid';
    if (!out.has(sid)) out.set(sid, []);
    out.get(sid).push({ key, form, molar: r.molar ?? 0, shelf: key in SHELF });
  }
  return out;
}

const CYLINDER = (ctx) => new Map(CYLINDER_GASES.map((k) => [ctx.id(k), k]));

// ------------------------------------------------------------------ ricetta

/**
 * Ricetta di una reazione del simulatore, oppure il motivo per cui il laboratorio non la sa preparare.
 * @param {object} ctx contesto chimico (createLabChemistry)
 * @param {object} rx reazione di ctx.rxs
 * @returns {{ok: true, id: string, rx: object, ingredients: object[], vessel: string, heat: object|null, flame: boolean,
 *   light: boolean, volts: number, gas: string|null, hood: boolean, steps: object[], tags: string[], signals: object,
 *   main: number, from: number[], difficulty: number, shelfOnly: boolean, ghs: string[], products: object[]}
 *   | {ok: false, id: string, why: string, sid?: number, T?: number}}
 *   why: 'shock' (esplosivi), 'molten' (sale fuso, elettrolisi ignea), 'lowO2' (senz'aria), 'tooHot' (forno oltre i
 *   1000 K), 'unavailable' (un reagente che il magazzino non ha), 'catalyst' (manca il catalizzatore), 'gasOnly' (solo
 *   gas: non si fa in un becher)
 */
export function buildRecipe(ctx, rx, store = storeIndex(ctx), shelf = shelfIndex(ctx), cylinders = CYLINDER(ctx)) {
  const fail = (why, extra = {}) => ({ ok: false, id: rx.id, why, ...extra });
  const c = rx.cond;
  if (c.shock) return fail('shock');
  if (c.molten) return fail('molten');
  if (c.lowO2) return fail('lowO2');
  const minT = c.hot ? Math.max(c.minT, 450) : c.minT;
  if (minT > LAB_MAX_T) return fail('tooHot', { T: minT });
  const aqueous = aqueousOf(rx, ctx);
  const ingredients = [];
  for (const r of rx.reactants) {
    if (r.sid === WATER) {
      ingredients.push({ role: 'water', sid: WATER, c: r.c, form: 'liquid' });
      continue;
    }
    if (r.sid === ctx.O2 && rx.air >= 0) {
      ingredients.push({ role: 'air', sid: r.sid, c: r.c, form: 'air' });
      continue;
    }
    if (typeof r.sid !== 'number') return fail('unavailable');
    const s = ctx.sub(r.sid);
    const gas = phaseAt(s, AMBIENT) === GAS;
    // tra le soluzioni dello scaffale la più concentrata (HCl 1 M, non 0,1 M)
    const shelfSol = shelf.get(r.sid)?.filter((x) => x.form === 'solution').sort((a, b) => b.molar - a.molar)[0];
    if (shelfSol && (aqueous || gas)) {
      ingredients.push({ role: 'reactant', sid: r.sid, c: r.c, form: 'solution', molar: shelfSol.molar, key: ctx.sub(r.sid).key, shelf: shelfSol.key });
      continue;
    }
    if (gas) {
      if (!cylinders.has(r.sid)) return fail('unavailable', { sid: r.sid });
      ingredients.push({ role: 'gas', sid: r.sid, c: r.c, form: 'gas', gas: cylinders.get(r.sid) });
      continue;
    }
    const e = store.get(r.sid);
    if (!e) return fail('unavailable', { sid: r.sid });
    if (aqueous && e.soluble) {
      const molar = (e.sol * 10) / ctx.molar(r.sid) >= 1.05 ? 1 : 0.1;
      ingredients.push({ role: 'reactant', sid: r.sid, c: r.c, form: 'solution', molar, key: e.key, shelf: null });
    } else {
      const sh = shelf.get(r.sid)?.find((x) => x.form === e.st);
      ingredients.push({ role: 'reactant', sid: r.sid, c: r.c, form: e.st, key: e.key, shelf: sh?.key ?? null });
    }
  }
  const reactants = ingredients.filter((x) => x.role === 'reactant');
  const waterIn = ingredients.find((x) => x.role === 'water');
  if (!reactants.length && !(waterIn && (rx.electro || reactants.length))) return fail('gasOnly');

  // catalizzatore o reagente ausiliario (l'acido solforico del permanganato): non si consuma, ma deve esserci
  let aux = null;
  if (c.catalysts) {
    const inside = new Set(rx.reactants.map((r) => r.sid));
    const cands = [...c.catalysts].filter((sid) => typeof sid === 'number' && !inside.has(sid));
    if (cands.length && ![...c.catalysts].some((sid) => inside.has(sid))) {
      const pickSid = cands.find((sid) => shelf.has(sid)) ?? cands.find((sid) => store.has(sid) || shelf.has(sid));
      if (!pickSid) return fail('catalyst', { sid: cands[0] });
      const sh = shelf.get(pickSid);
      const e = store.get(pickSid);
      const ab = ctx.acidBase.get(pickSid);
      const sol = sh?.find((x) => x.form === 'solution');
      if (sol || (ab && (ab.sa || ab.sb) && e?.soluble)) {
        aux = { role: 'aux', sid: pickSid, form: 'solution', molar: sol?.molar ?? 1, key: ctx.sub(pickSid).key, shelf: sol?.key ?? null, ml: 5 };
      } else if (e || sh) {
        const st = e?.st ?? sh[0].form;
        aux = { role: 'catalyst', sid: pickSid, form: st, key: e?.key ?? ctx.sub(pickSid).key, shelf: sh?.find((x) => x.form === st)?.key ?? null };
        if (st === 'liquid') aux.ml = 1;
        else aux.g = 0.2;
      } else return fail('catalyst', { sid: pickSid });
    }
  }

  // dosi: il primo reagente solido o liquido è il limitante, gli altri in leggero eccesso (acidi e basi alla pari)
  const fair = rx.group === 'acidi-basi';
  const limit = reactants.find((x) => x.form !== 'solution') ?? reactants[0];
  const amounts = (n0) => {
    for (const x of reactants) {
      x.mol = x.c * n0 * (fair || x === limit ? 1 : EXCESS);
      if (x.form === 'solution') x.ml = (x.mol / x.molar) * 1000;
      else if (x.form === 'solid') x.g = x.mol * ctx.molar(x.sid);
      else x.ml = (x.mol * ctx.molar(x.sid)) / (ctx.sub(x.sid).densL || 1);
    }
  };
  amounts(DOSE);
  const most = (form, field) => Math.max(0, ...reactants.filter((x) => x.form === form).map((x) => x[field]));
  const room = () => Math.min(MAX_SOLUTION_ML / Math.max(1e-9, most('solution', 'ml')), MAX_SOLID_G / Math.max(1e-9, most('solid', 'g')), MAX_LIQUID_ML / Math.max(1e-9, most('liquid', 'ml')));
  let k = Math.min(1, room());
  amounts(DOSE * k);
  // un liquido puro sotto 1 mL o un solido sotto 0,1 g si arrotonderebbe molto in eccesso: si alza tutta la dose, se c'è posto
  const least = (form, field, min) => Math.max(1, ...reactants.filter((x) => x.form === form).map((x) => min / x[field]));
  const up = Math.min(Math.max(least('liquid', 'ml', 0.2), least('solid', 'g', 0.1)), room());
  if (up > 1) {
    k *= up;
    amounts(DOSE * k);
  }
  // quantità tonde come si leggono sulla bilancia (0,05 g) e sul cilindro (1 mL), poi le moli vere
  const round = (x) => {
    if (x.form === 'solid') {
      x.g = gramsOf(x.g);
      x.mol = x.g / ctx.molar(x.sid);
    } else {
      x.ml = x.form === 'solution' ? mlOf(x.ml) : liquidMlOf(x.ml);
      x.mol = x.form === 'solution' ? (x.ml * x.molar) / 1000 : (x.ml * (ctx.sub(x.sid).densL || 1)) / ctx.molar(x.sid);
    }
  };
  reactants.forEach(round);
  // dopo l'arrotondamento un reagente può essere molto in eccesso (il minimo di 1 mL, una soluzione diluita come l'acqua
  // di calce): si riporta all'eccesso giusto, passando a 0,1 M se di quella 1 M servirebbero meno di 2 mL
  const xiMin = Math.min(...reactants.map((x) => x.mol / x.c));
  for (const x of reactants) {
    const want = xiMin * x.c * (fair ? 1 : EXCESS);
    if (x.mol <= want * 1.25) continue;
    if (x.form === 'solution' && x.molar >= 1 && (want / x.molar) * 1000 < 2 && store.get(x.sid)?.soluble) {
      x.molar = 0.1;
      x.shelf = shelf.get(x.sid)?.find((y) => y.form === 'solution' && y.molar === 0.1)?.key ?? null;
    }
    if (x.form === 'solid') x.g = want * ctx.molar(x.sid);
    else if (x.form === 'solution') x.ml = (want / x.molar) * 1000;
    else x.ml = (want * ctx.molar(x.sid)) / (ctx.sub(x.sid).densL || 1);
    round(x);
  }
  if (aux) ingredients.push(aux);

  const liquidOf = () => ingredients.reduce((t, x) => t + (x.form === 'solution' || (x.form === 'liquid' && x.ml) ? x.ml ?? 0 : 0), 0);
  // l'acqua: reagente o solvente (una reazione in soluzione senza soluzioni, un'elettrolisi da almeno 30 mL)
  if (waterIn) waterIn.ml = Math.max(20, mlOf(waterIn.c * DOSE * k * 18.015 * 3));
  if (!waterIn && aqueous && liquidOf() < 1) ingredients.push({ role: 'solvent', sid: WATER, form: 'liquid', ml: 25 });
  if (rx.electro && liquidOf() + (waterIn?.ml ?? 0) < 30) {
    if (waterIn) waterIn.ml = Math.max(waterIn.ml, 50);
    else ingredients.push({ role: 'solvent', sid: WATER, form: 'liquid', ml: 50 });
  }
  for (const x of ingredients) if (x.form === 'liquid' && x.sid === WATER) x.mol = (x.ml * 0.998) / 18.015;

  // recipiente e riscaldamento: la piastra se ci arriva (con 10 K di margine), altrimenti il Bunsen
  const liquid = liquidOf() > 0.5;
  const flame = Boolean(c.ignite || rx.combustion);
  let heat = null;
  const plateVessel = liquid ? 'beaker250' : 'dish';
  const level = [1, 2, 3, 4, 5].find((l) => plateEquilibrium(l, plateVessel) >= minT + 10);
  if (flame || minT > PLATE_MAX_T || !level) heat = { how: 'bunsen', T: minT };
  else if (minT > AMBIENT + 2) heat = { how: 'plate', level, T: minT };
  const gas = ingredients.find((x) => x.role === 'gas')?.gas ?? null;
  let vessel;
  if (rx.electro) vessel = 'beaker250';
  else if (heat?.how === 'bunsen') vessel = liquid ? (flame ? 'dish' : 'beaker250') : 'crucible';
  else if (heat?.how === 'plate') vessel = plateVessel;
  else if (!liquid) vessel = gas ? 'crucible' : 'dish';
  else vessel = liquidOf() > 60 ? 'beaker250' : 'beaker100';
  if (liquidOf() > DEFS[vessel].capacity * 0.7) vessel = 'beaker250';

  const sig = reactionSignals(ctx, rx, { aqueous });
  const tags = signalTags(sig);
  // cappa: un gas tossico che esce (prodotto) o che arriva dalla bombola, o un reagente tossico puro e volatile (il bromo);
  // l'acido cloridrico o l'ammoniaca in soluzione diluita no
  const toxicGas = sig.gases.some((x) => ctx.toxic.has(x.sid)) || ingredients.some((x) => ctx.toxic.has(x.sid) && (x.form === 'gas' || x.form === 'liquid'));
  const hood = Boolean(toxicGas || rx.electro || gas);
  const light = Boolean(c.light);
  const volts = rx.electro ? RECIPE_VOLTS : 0;

  // titolo: l'elemento liberato, il precipitato o il primo prodotto che non sia acqua; da quali reagenti
  const element = rx.products.find((p) => p.sid !== WATER && ctx.sub(p.sid)?.kind === 'element');
  const main = element?.sid ?? sig.solids[0]?.sid ?? rx.products.find((p) => p.sid !== WATER)?.sid ?? rx.products[0].sid;
  const from = rx.reactants.filter((r) => r.sid !== WATER && !(r.sid === ctx.O2 && rx.air >= 0)).map((r) => r.sid);

  const recipe = {
    ok: true, id: rx.id, rx, ingredients, vessel, heat, flame, light, volts, gas, hood, tags, signals: sig, main, from,
    aqueous, slow: Boolean(rx.slow || light),
  };
  recipe.steps = recipeSteps(ctx, recipe);
  recipe.difficulty = heat?.how === 'bunsen' || flame || volts || gas || toxicGas ? 3 : heat || aux || light ? 2 : 1;
  recipe.shelfOnly = ingredients.every((x) => x.role === 'water' || x.role === 'air' || x.role === 'solvent' || x.role === 'gas' || x.shelf);
  recipe.ghs = recipeHazards(ctx, recipe);
  return recipe;
}

/** Descrizione del reagente per il magazzino (stock.js): scaffale o armadio se c'è, altrimenti la forma scelta. */
export function reagentOf(x) {
  if (x.shelf) return SHELF[x.shelf] ?? CABINET[x.shelf];
  if (x.form === 'solution') return { solute: x.key, molar: x.molar };
  if (x.form === 'liquid') return { liquid: x.key };
  return { solid: x.key };
}

/** Pittogrammi dei reagenti (come sulle etichette del gioco) e dei gas delle bombole, senza ripetizioni. */
function recipeHazards(ctx, recipe) {
  const ghs = new Set();
  for (const x of recipe.ingredients) {
    if (x.sid === WATER || x.role === 'air') continue;
    const list = x.role === 'gas' ? derivedHazards(ctx, x.sid, { form: 'gas' }).ghs : reagentLook(ctx, reagentOf(x)).ghs;
    list.forEach((g) => ghs.add(g));
  }
  if (recipe.gas) ghs.add('GHS04');
  return [...ghs].sort();
}

/**
 * Passi numerati della ricetta. Ogni passo: kind (il modello del testo bk_step_<kind> e della vignetta), i parametri e
 * check, il controllo che lo spunta quando si segue la ricetta nel gioco:
 *   {type: 'has', sid, mol} un recipiente contiene almeno mol di sid · {type: 'temp', T} il recipiente della ricetta
 *   è arrivato a T · {type: 'rx'} la reazione è avvenuta · {type: 'hood'} la cappa è accesa · {type: 'waste'} il
 *   contenuto è finito in un rifiuto · {type: 'auto'} si spunta quando si spunta un passo successivo.
 */
function recipeSteps(ctx, r) {
  const steps = [];
  const push = (kind, params = {}, check = { type: 'auto' }) => steps.push({ kind, params, check });
  if (r.hood) push('hood', {}, { type: 'hood' });
  push('vessel', { vessel: r.vessel });
  const has = (x, f = 0.7) => ({ type: 'has', sid: x.sid, mol: (x.mol ?? 0) * f });
  const ing = r.ingredients;
  for (const x of ing.filter((y) => y.role === 'reactant' && y.form === 'solid')) push('weigh', { sid: x.sid, g: x.g, shelf: x.shelf }, has(x));
  for (const x of ing.filter((y) => (y.role === 'reactant' && y.form !== 'solid') || y.role === 'water' || y.role === 'solvent')) {
    if (x.sid === WATER) push('water', { ml: x.ml }, { type: 'auto' });
    else if (x.form === 'solution') push('measure', { sid: x.sid, ml: x.ml, molar: x.molar, shelf: x.shelf }, has(x));
    else push('liquid', { sid: x.sid, ml: x.ml, shelf: x.shelf }, has(x));
  }
  const aux = ing.find((y) => y.role === 'aux' || y.role === 'catalyst');
  if (aux) push(aux.role === 'aux' ? 'aux' : 'catalyst', { sid: aux.sid, ml: aux.ml, g: aux.g, molar: aux.molar, shelf: aux.shelf }, { type: 'has', sid: aux.sid, mol: 1e-5 });
  if (ing.filter((y) => y.role !== 'air' && y.role !== 'gas').length > 1 && !r.heat) push('stir');
  if (r.heat?.how === 'plate') push('plate', { level: r.heat.level, T: r.heat.T }, { type: 'temp', T: r.heat.T });
  if (r.heat?.how === 'bunsen') push(r.flame ? 'flame' : 'bunsen', { T: r.heat.T, vessel: r.vessel }, r.flame ? { type: 'rx' } : { type: 'temp', T: r.heat.T });
  if (r.light) push('lamp', {}, { type: 'rx' });
  if (r.volts) push('power', { volts: r.volts }, { type: 'rx' });
  if (r.gas) push('gas', { gas: r.gas, sid: ctx.id(r.gas) }, { type: 'rx' });
  if (r.slow) push('wait', { light: r.light });
  push('observe', { tags: r.tags }, { type: 'rx' });
  if (r.aqueous && r.signals.solids.length) push('filter', { sid: r.signals.solids[0].sid });
  if (r.heat && Math.max(r.heat.T, r.flame ? 600 : 0) > HOT) push('tongs');
  push('dispose', {}, { type: 'waste' });
  return steps;
}

// ------------------------------------------------------------------ esecuzione nel motore

/** Parametri termici dei recipienti delle ricette (dagli oggetti del gioco). */
const vesselEnv = (kind) => ({ heatC: DEFS[kind].heatC, area: DEFS[kind].area });

/**
 * Esegue la ricetta con il motore dei contenitori, come la farebbe un giocatore: mette gli ingredienti nel recipiente,
 * agita, scalda sulla piastra o sul Bunsen (con la fiamma), accende la lampada o l'alimentatore, apre la bombola, e
 * aspetta finché la reazione non ha consumato almeno il 5 % del reagente limitante (o, per quelle lentissime, finché
 * non è cominciata). Una combustione è il fuoco nel recipiente, come nel gioco: quando il combustibile prende fuoco
 * brucia (Mixture.burn) finché non finisce. Il tempo è quello del gioco.
 * @returns {{ok: boolean, seconds: number, extent: number, xiMax: number, mix: Mixture, waste: string|null, others: string[]}}
 */
export function runRecipe(ctx, recipe, { maxSeconds = 600, dt = 0.2 } = {}) {
  const mix = new Mixture(ctx);
  for (const x of recipe.ingredients) {
    if (x.role === 'air' || x.role === 'gas') continue;
    if (x.form === 'solution') mix.add(Mixture.solution(ctx, x.key, x.molar, x.ml));
    else if (x.sid === WATER) mix.add(Mixture.liquid(ctx, 'water', x.ml));
    else if (x.form === 'liquid') mix.add(Mixture.liquid(ctx, x.key, x.ml));
    else mix.add(Mixture.solid(ctx, x.key, x.g));
  }
  const rx = recipe.rx;
  const limiting = recipe.ingredients.filter((x) => x.role === 'reactant' || (x.role === 'water' && !recipe.ingredients.some((y) => y.role === 'reactant')));
  const xiMax = Math.min(...limiting.map((x) => (x.mol ?? 0) / x.c));
  const { heatC, area } = vesselEnv(recipe.vessel);
  const gasSid = recipe.gas ? ctx.id(recipe.gas) : 0;
  const hpT = recipe.heat?.how === 'plate' ? 295.15 + recipe.heat.level * 60 : 0;
  const goal = recipe.slow ? Math.min(xiMax * 0.05, 1e-5) : xiMax * 0.05;
  let extent = 0;
  let t = 0;
  let fire = 0;
  const others = new Set();
  for (; t < maxSeconds && extent < goal; t += dt) {
    const env = { lossWK: 0.3 + area * 0.03, containerC: heatC, area, open: true, stir: t < 4 ? 1 : 0, light: recipe.light, volts: recipe.volts };
    if (recipe.heat?.how === 'plate') {
      env.heatW = Math.max(0, Math.min(recipe.heat.level * 90, 6 * (hpT - mix.T)));
      env.stir = Math.max(env.stir, 0.5);
    } else if (recipe.heat?.how === 'bunsen') {
      env.heatW = Math.max(0, Math.min(850, 3 * (1700 - mix.T))) + 600;
      env.flame = true;
    }
    if (gasSid) mix.addSpecies(gasSid, GAS_FLOW * dt);
    const ev = mix.tick(dt, env);
    extent += ev.extent.get(rx.id) ?? 0;
    for (const id of ev.reactions) if (id !== rx.id) others.add(id);
    if (ev.ignite && !fire) fire = ev.ignite;
    if (fire) {
      const burnt = mix.burn(dt, fire);
      const crx = ctx.comb.get(fire);
      if (crx?.id === rx.id) extent += burnt / crx.reactants.find((r) => r.sid === fire).c;
      else if (crx && burnt > 0) others.add(crx.id);
      if (burnt <= 0) fire = 0;
    }
  }
  return { ok: extent >= goal && extent > 0, seconds: Math.round(t), extent, xiMax, mix, waste: wasteClass(mix), others: [...others] };
}

// ------------------------------------------------------------------ il libro

/**
 * Tutte le ricette che il laboratorio sa preparare (ctx.rxs) e i motivi di quelle che non sa. verified: gli id delle
 * ricette che il motore esegue davvero (book-verified.js), con i secondi di gioco e il rifiuto: solo quelle entrano
 * nel libro; senza, entrano tutte quelle costruite.
 * @returns {{recipes: object[], byId: Map<string, object>, failed: Map<string, object>}}
 */
export function bookRecipes(ctx, verified = null) {
  const store = storeIndex(ctx);
  const shelf = shelfIndex(ctx);
  const cyl = CYLINDER(ctx);
  const recipes = [];
  const failed = new Map();
  for (const rx of ctx.rxs) {
    const r = buildRecipe(ctx, rx, store, shelf, cyl);
    if (!r.ok) {
      failed.set(rx.id, r);
      continue;
    }
    if (verified) {
      const v = verified[rx.id];
      if (!v) {
        failed.set(rx.id, { ok: false, id: rx.id, why: 'engine' });
        continue;
      }
      [r.seconds, r.waste] = v;
      // una reazione che nel gioco chiede più di due minuti: un passo «aspetta» prima di osservare
      if (r.seconds > 120 && !r.steps.some((x) => x.kind === 'wait')) {
        r.slow = true;
        r.steps.splice(r.steps.findIndex((x) => x.kind === 'observe'), 0, { kind: 'wait', params: { light: r.light }, check: { type: 'auto' } });
      }
    }
    recipes.push(r);
  }
  return { recipes, byId: new Map(recipes.map((r) => [r.id, r])), failed };
}

/** Minuti indicativi di una ricetta: mezzo minuto per passo più il tempo di gioco della reazione. */
export const recipeMinutes = (r) => Math.max(1, Math.round((r.steps.length * 30 + (r.seconds ?? 60)) / 60));

/**
 * Pagine dei 118 elementi: come si ottengono davvero (element-production.js) e le ricette del libro che li liberano,
 * più le reazioni del catalogo che li liberano ma che il laboratorio non sa fare, con il motivo.
 * @returns {{z: number, sid: number, recipes: object[], other: {id: string, why: string}[]}[]}
 */
export function elementPages(ctx, book) {
  const out = [];
  const why = (id) => book.failed.get(id)?.why ?? ctx.offline.find((o) => o.id === id)?.why ?? 'other';
  const all = [...ctx.rxs, ...ctx.offline];
  for (let z = 1; z <= 118; z++) {
    const frees = all.filter((rx) => rx.products.some((p) => p.sid === z) && !rx.reactants.some((r) => r.sid === z));
    out.push({
      z,
      sid: z,
      recipes: frees.map((rx) => book.byId.get(rx.id)).filter(Boolean),
      other: frees.filter((rx) => !book.byId.has(rx.id)).map((rx) => ({ id: rx.id, why: why(rx.id) })),
    });
  }
  return out;
}

/** Il recipiente della ricetta: quello che contiene il reagente limitante (o il primo con un ingrediente). */
export const recipeKey = (recipe) => recipe.ingredients.find((x) => x.role === 'reactant')?.sid ?? WATER;
