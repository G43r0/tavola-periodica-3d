// Segnali osservabili delle reazioni: che cosa vede chi le fa in laboratorio (bolle e colore del gas, precipitato,
// metallo che si deposita, solido che si consuma, cambio di colore della soluzione, calore, fiamma), presi dai dati
// delle sostanze e dal ΔH°. Servono agli effetti del gioco, alla finestrella del contenitore, al quaderno e al libro
// «Come si fa». In più l'equazione con gli stati fisici e il «perché non reagisce?». Modulo puro (niente DOM).
import { AMBIENT, GAS, LIQUID, SOLID, S, WATER, phaseAt } from '../sandbox/substances.js';
import { solutionTint } from './mixture.js';
import { REDUCTION_POTENTIALS } from './reagents.js';

/** Opacità del gas (dai dati della sandbox) oltre la quale il gas si vede: Cl₂, Br₂, I₂, NO₂. */
const COLORED_GAS = 0.3;
/** Solubilità (g/100 g d'acqua) sotto la quale un prodotto in soluzione precipita. */
const INSOLUBLE = 1;
/** Solubilità sopra la quale un gas in acqua resta sciolto (NH₃, HCl, SO₂): sotto, fa le bolle (H₂, O₂, CO₂, Cl₂). */
const GAS_SOLUBLE = 5;
// gruppi del catalogo le cui reazioni si fanno in soluzione anche senza la condizione esplicita
const AQUEOUS_GROUPS = new Set(['precipitazioni', 'ioni', 'acidi-basi']);

/**
 * La reazione si fa in acqua? Condizione «in soluzione», acqua tra i reagenti, ioni, precipitazioni, acidi e basi, e
 * le reazioni con un acido o una base (che in laboratorio si usano in soluzione). Nel gioco vale il contenitore vero.
 */
export const aqueousOf = (rx, ctx = null) => Boolean(
  rx.cond?.water || rx.reactants.some((r) => r.sid === WATER) || AQUEOUS_GROUPS.has(rx.group)
  || (ctx && rx.reactants.some((r) => {
    const ab = ctx.acidBase.get(r.sid);
    return ab && (ab.sa || ab.sb || ab.ka) && ctx.solubility(r.sid, AMBIENT) > 0;
  })),
);

/**
 * Stato fisico di una specie nell'equazione: 's' solido, 'l' liquido, 'g' gas, 'aq' sciolto in acqua.
 * In acqua: i sali solubili e i liquidi miscibili sono (aq), quelli insolubili (s); i gas prodotti che non si sciolgono
 * escono come bolle (g), quelli molto solubili (HCl, NH₃) restano (aq).
 */
export function stateOf(ctx, sid, { aqueous = false, product = false, T = AMBIENT } = {}) {
  if (typeof sid === 'string') return 'aq'; // indicatori
  if (sid === WATER) return T >= 373.15 ? 'g' : 'l';
  const s = ctx.sub(sid);
  if (!s) return 's';
  const ph = phaseAt(s, T);
  if (aqueous) {
    const sol = ctx.solubility(sid, T);
    if (ph === GAS) return sol >= GAS_SOLUBLE ? 'aq' : 'g';
    if (sol >= INSOLUBLE) return 'aq';
    if (product && ph === LIQUID) return 'l';
    return ph === LIQUID ? 'l' : 's';
  }
  return ph === GAS ? 'g' : ph === LIQUID ? 'l' : 's';
}

/**
 * Equazione bilanciata, con gli stati fisici se `states`: «Zn(s) + 2 HCl(aq) → ZnCl₂(aq) + H₂(g)».
 * @param {object} ctx contesto chimico (createLabChemistry)
 * @param {object} rx reazione del contesto (ctx.rxs o ctx.offline)
 */
export function equation(ctx, rx, { aqueous = aqueousOf(rx, ctx), T = AMBIENT, states = true } = {}) {
  const side = (list, product) => list
    .map((x) => `${x.c > 1 ? `${x.c} ` : ''}${ctx.formula(x.sid)}${states ? `(${stateOf(ctx, x.sid, { aqueous, product, T })})` : ''}`)
    .join(' + ');
  return `${side(rx.reactants, false)} → ${side(rx.products, true)}`;
}

/** ΔH° della reazione come è scritta (kJ), o null: in acqua la neutralizzazione vale −55,8 kJ per mole d'acqua. */
export const reactionHeat = (rx, aqueous = aqueousOf(rx)) => (rx.neutral && aqueous ? -55.8 * rx.neutral : rx.dH ?? null);

const rgbOf = (c, fallback) => (c ? c.slice(0, 3).map(Math.round) : fallback);

/**
 * Che cosa si osserva facendo la reazione.
 * @returns {{gases: {sid: number, rgb: number[], colored: boolean}[], solids: {sid: number, rgb: number[], metal: boolean}[],
 *   consumed: number[], color: {from: number[]|null, to: number[]|null} | null, heat: 'hot'|'warm'|'cold'|null,
 *   dH: number|null, fire: boolean, light: boolean, aqueous: boolean}}
 *   gases: gas che si liberano (bolle; colored se il gas si vede); solids: prodotti insolubili (precipitato o metallo
 *   che si deposita); consumed: solidi che si consumano sciogliendosi; color: colore della soluzione prima e dopo;
 *   heat: si scalda molto, si scalda, si raffredda; fire: brucia o serve una fiamma; light: serve la luce.
 */
export function reactionSignals(ctx, rx, { aqueous = aqueousOf(rx, ctx), T = AMBIENT } = {}) {
  const out = { gases: [], solids: [], consumed: [], color: null, heat: null, dH: reactionHeat(rx, aqueous), fire: Boolean(rx.combustion || rx.cond?.ignite), light: Boolean(rx.cond?.light), aqueous };
  for (const p of rx.products) {
    if (p.sid === WATER || typeof p.sid === 'string') continue;
    const s = ctx.sub(p.sid);
    const st = stateOf(ctx, p.sid, { aqueous, product: true, T });
    if (st === 'g') {
      const c = s?.colors?.[GAS];
      out.gases.push({ sid: p.sid, rgb: rgbOf(c, [235, 240, 245]), colored: (c?.[3] ?? 0) >= COLORED_GAS });
    } else if (st === 's' && aqueous) {
      out.solids.push({ sid: p.sid, rgb: rgbOf(s?.colors?.[SOLID], [240, 240, 240]), metal: Boolean(s?.kind === 'element' && ctx.P.flags[p.sid] & S.METAL) });
    }
  }
  if (aqueous) {
    const madeSolid = new Set(out.solids.map((x) => x.sid));
    for (const r of rx.reactants) if (stateOf(ctx, r.sid, { aqueous, T }) === 's' && !madeSolid.has(r.sid)) out.consumed.push(r.sid);
    // il colore della soluzione: il primo ione o anione colorato sciolto, prima e dopo
    const tint = (list, product) => list.filter((x) => stateOf(ctx, x.sid, { aqueous, product, T }) === 'aq').map((x) => solutionTint(ctx, x.sid)).find(Boolean)?.rgb ?? null;
    const from = tint(rx.reactants, false);
    const to = tint(rx.products, true);
    if (String(from) !== String(to)) out.color = { from, to };
  }
  // il raffreddamento si sente solo nelle reazioni che partono da sole a temperatura ambiente (non scaldando, non alla luce)
  const dH = out.dH;
  const driven = rx.cond?.hot || rx.cond?.light || (rx.cond?.minT ?? 0) > 330;
  if (dH !== null) out.heat = dH < -250 ? 'hot' : dH < -40 ? 'warm' : dH > 20 && !driven ? 'cold' : null;
  return out;
}

/** Segnali come etichette brevi (per le icone del quaderno e i testi): gas, coloredGas, precipitate, deposit… */
export function signalTags(sig) {
  const tags = [];
  if (sig.gases.some((g) => g.colored)) tags.push('coloredGas');
  else if (sig.gases.length) tags.push('gas');
  if (sig.solids.some((x) => x.metal)) tags.push('deposit');
  if (sig.solids.some((x) => !x.metal)) tags.push('precipitate');
  if (sig.consumed.length) tags.push('dissolves');
  if (sig.color) tags.push('colorChange');
  if (sig.heat) tags.push(sig.heat);
  if (sig.fire) tags.push('fire');
  return tags;
}

// ------------------------------------------------------------------ perché non reagisce?

// dal più utile (si può fare subito qualcosa) al meno utile
const WHY_ORDER = ['heat', 'flame', 'catalyst', 'light', 'water', 'undissolved', 'conduct', 'missing', 'tooHot', 'lessActive', 'noble', 'electrolysis', 'discharge', 'steam', 'shock', 'equilibrium', 'catalyst-unknown', 'living'];
const byWhy = (a, b) => WHY_ORDER.indexOf(a.why) - WHY_ORDER.indexOf(b.why);

/**
 * Perché le sostanze messe insieme nel contenitore non reagiscono. Per le reazioni del catalogo tra loro: la condizione
 * che manca (calore, fiamma, catalizzatore, luce, acqua), il reagente non ancora sciolto o l'unico che manca; per quelle
 * che il simulatore non fa, il motivo (corrente, raggi UV, vapore, equilibrio, organismi viventi); poi la serie di
 * attività dai potenziali standard: un metallo meno attivo dell'idrogeno con un acido, o meno attivo del metallo del
 * sale. In ordine: le reazioni tra due o più delle sostanze presenti, la serie di attività, quelle di una sola sostanza
 * (H₂O₂ senza catalizzatore, AgCl al buio); le reazioni con l'ossigeno dell'aria restano fuori.
 * @param {import('./mixture.js').Mixture} mix
 * @param {{flame?: boolean, light?: boolean}} env
 * @returns {{why: string, rx?: object, uses: number, T?: number, sids?: number[], sid?: number, other?: number, E?: number, E2?: number}[]}
 */
export function whyNot(mix, env = {}) {
  const { ctx } = mix;
  const has = (sid) => (mix.n.get(sid) ?? 0) > 1e-10;
  const uses = (rx) => new Set(rx.reactants.filter((r) => r.sid !== WATER && has(r.sid)).map((r) => r.sid)).size;
  const out = [];
  for (const rx of mix.candidates(false).values()) {
    if (rx.air >= 0 && !has(ctx.O2)) continue;
    const u = uses(rx);
    const b = mix.blocker(rx, env);
    if (b) {
      if (rx.reactants.every((r) => r.sid === WATER || has(r.sid))) out.push({ ...b, rx, uses: u });
      continue;
    }
    const lacking = rx.reactants.filter((r) => r.sid !== WATER && !has(r.sid));
    if (lacking.length === 1 && u >= 2) {
      out.push({ why: 'missing', sid: lacking[0].sid, rx, uses: u });
      continue;
    }
    if (lacking.length) continue;
    const stuck = rx.reactants.find((r) => !(mix.available(r.sid, rx)[0] > 1e-10));
    if (stuck) out.push({ why: 'undissolved', sid: stuck.sid, rx, uses: u });
  }
  for (const rx of mix.candidates(false, [ctx.offSingle, ctx.offPair]).values()) {
    if (rx.reactants.every((r) => r.sid === WATER || has(r.sid))) out.push({ why: rx.why === 'catalyst' ? 'catalyst-unknown' : rx.why, rx, uses: uses(rx) });
  }
  const strong = out.filter((x) => x.uses >= 2).sort(byWhy);
  const weak = out.filter((x) => x.uses < 2).sort(byWhy);
  return [...strong, ...activityHints(mix), ...weak];
}

/** Serie di attività: metalli che non spostano l'idrogeno dagli acidi o il metallo di un sale più attivo. */
function activityHints(mix) {
  const { ctx } = mix;
  const out = [];
  const present = [...mix.n.keys()].filter((sid) => typeof sid === 'number' && sid !== WATER && mix.n.get(sid) > 1e-10);
  const metals = present.filter((sid) => ctx.sub(sid)?.kind === 'element' && REDUCTION_POTENTIALS[ctx.sub(sid).symbol] !== undefined);
  if (!metals.length) return out;
  const dissolved = present.filter((sid) => (mix.d.get(sid) ?? 0) > 1e-10);
  const acid = dissolved.find((sid) => {
    const ab = ctx.acidBase.get(sid);
    return ab?.sa || ab?.ka;
  });
  for (const m of metals) {
    const E = REDUCTION_POTENTIALS[ctx.sub(m).symbol];
    if (acid && E > 0) out.push({ why: 'noble', sid: m, other: acid, E, uses: 2 });
    for (const salt of dissolved) {
      if (salt === acid) continue;
      const z = Object.keys(ctx.counts(salt)).map(Number).find((k) => k !== m && REDUCTION_POTENTIALS[ctx.sub(k)?.symbol] !== undefined);
      if (z === undefined) continue;
      const E2 = REDUCTION_POTENTIALS[ctx.sub(z).symbol];
      if (E2 < E) out.push({ why: 'lessActive', sid: m, other: z, salt, E, E2, uses: 2 });
    }
  }
  return out;
}
