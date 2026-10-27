// Lettore del libro «Come si fa»: indice con i capitoli (strumenti, tecniche, sicurezza, elementi, ricette), le pagine
// scritte a mano con la loro vignetta, le pagine dei 118 elementi e le ricette generate (book.js) con ingredienti,
// passi illustrati, cosa si osserva, sicurezza e smaltimento; ricerca per nome, formula ed elemento e filtro «solo con
// lo scaffale». Restituisce HTML: i clic li gestisce game-view.js (data-bk-*).
import { esc, normalize } from '../chem/format.js';
import { pick } from '../i18n/index.js';
import { REACTION_GROUPS } from '../lab/data/reactions.js';
import { WATER } from '../sandbox/substances.js';
import { Mixture } from './mixture.js';
import { equation } from './signals.js';
import { recipeMinutes } from './book.js';
import { stepFigure, pageFigure } from './book-figures.js';
import { DRAW } from './tutorial.js';
import { TOOL_PAGES, TECHNIQUE_PAGES, SAFETY_PAGES } from './data/book-pages.js';
import { PRODUCTION } from './data/element-production.js';

const CHAPTERS = ['tools', 'techniques', 'safety', 'elements', 'recipes'];
const HAND = { tools: TOOL_PAGES, techniques: TECHNIQUE_PAGES, safety: SAFETY_PAGES };
/** Prefisso delle pagine scritte a mano negli elenchi della Carriera (career.js: 'tool:balance', 'tech:weigh'…). */
const PAGE_PREFIX = { tools: 'tool', techniques: 'tech', safety: 'safety' };
const CH_KEY = { tools: 'bkChTools', techniques: 'bkChTechniques', safety: 'bkChSafety', elements: 'bkChElements', recipes: 'bkChRecipes' };
const MAX_LIST = 120;

/** Nome di un colore (rgb 0–255) per le osservazioni: bianco, grigio, nero, rosso, arancione, giallo, verde… */
export function colorName(rgb) {
  if (!rgb) return 'none';
  const [r, g, b] = rgb.map((x) => x / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  if (s < 0.18 || max - min < 0.08) return l > 0.78 ? 'white' : l < 0.2 ? 'black' : 'grey';
  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 340) return l > 0.75 ? 'pink' : 'red';
  if (h < 42) return l < 0.38 ? 'brown' : 'orange';
  if (h < 68) return l < 0.3 ? 'brown' : 'yellow';
  if (h < 170) return 'green';
  if (h < 255) return 'blue';
  if (h < 300) return 'violet';
  return l > 0.72 ? 'pink' : 'violet';
}

/** Piccolo pittogramma GHS in SVG (rombo rosso con il simbolo). */
const ghsIcon = (id) => `<svg class="gm-bk__ghs" viewBox="0 0 40 40" role="img" aria-label="${id}">${DRAW.ghs(id, 20, 20, 36)}</svg>`;

/**
 * @param {{game: object, t: Function, kj: (v: number) => string, canOpenLab: () => boolean}} env
 */
export function createBookView({ game, t, kj, canOpenLab }) {
  const st = { chapter: null, page: null, group: null, query: '', shelfOnly: false };
  const chem = () => game.chem;
  // Carriera: pagine e gruppi di ricette aperti dai capitoli (career.js, bookUnlocks; null = tutto aperto)
  const locks = () => game.bookLocks ?? null;
  const pageKey = (chapter, p) => `${PAGE_PREFIX[chapter]}:${p.id}`;
  const pageOpen = (chapter, p) => !locks() || locks().pages.has(pageKey(chapter, p));
  const recipeOpen = (r) => !locks() || locks().groups.has(r.rx.group);
  const openRecipes = () => game.book.recipes.filter(recipeOpen);
  const lockIcon = '<svg class="gm-bk__lock" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  /** Pagina chiusa: si apre con il capitolo della Carriera che la usa. */
  const lockedPage = (title, key) => {
    const ch = locks()?.chapterOf.get(key);
    return `<article class="gm-bk__page gm-bk__locked"><h4>${lockIcon} ${esc(title)}</h4><p>${esc(locks()?.exam ? t('bkExamNote') : ch === undefined ? t('bkLockedLater') : t('bkLocked', { n: ch }))}</p></article>`;
  };
  // nomi a metà frase in minuscolo («di zinco»), ma non le sigle («EDTA») né le formule
  const lc = (s) => (s && s.length > 1 && /\p{Lu}/u.test(s[0]) && /\p{Ll}/u.test(s[1]) ? s[0].toLocaleLowerCase() + s.slice(1) : s);
  const lname = (sid) => lc(chem().name(sid));
  const nameF = (sid) => {
    const n = lname(sid);
    const f = chem().formula(sid);
    return f && f !== n ? `${n} (${f})` : n;
  };
  const fmt = (n, d) => game.fmt(n, d);
  const num = (x) => fmt(x, Number.isInteger(x) ? 0 : x < 1 ? 2 : 1);
  const cap = (s) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s);

  // ---------------------------------------------------------------- testi delle ricette

  function recipeTitle(r) {
    if (r.rx.r?.name) return r.rx.r.name;
    return t('bkTitle', { product: cap(chem().name(r.main)), from: r.from.map(lname).join(t('bkAnd')) });
  }

  function ingredientText(x) {
    const n = nameF(x.sid);
    if (x.role === 'air') return t('bkIngAir');
    if (x.role === 'gas') return t('bkIngGas', { name: n });
    if (x.sid === WATER) return t('bkIngWater', { ml: num(x.ml) });
    if (x.role === 'catalyst') return t('bkIngCatalyst', { name: n });
    if (x.role === 'aux') return t('bkIngAux', { ml: num(x.ml), molar: num(x.molar), name: n });
    if (x.form === 'solid') return t('bkIngSolid', { g: num(x.g), name: n });
    if (x.form === 'solution') return t('bkIngSolution', { ml: num(x.ml), molar: num(x.molar), name: n });
    return t('bkIngLiquid', { ml: num(x.ml), name: n });
  }

  function stepText(r, step) {
    const p = step.params;
    const f = p.sid ? chem().formula(p.sid) : '';
    const base = { name: p.sid ? lname(p.sid) : '', formula: f && f !== chem().name(p.sid) ? ` (${f})` : '', g: p.g !== undefined ? num(p.g) : '', ml: p.ml !== undefined ? num(p.ml) : '', molar: p.molar ? num(p.molar) : '' };
    switch (step.kind) {
      case 'vessel':
        return t('bk_step_vessel', { vessel: lc(t(`item_${r.vessel}`)) });
      case 'plate':
        return t('bk_step_plate', { level: p.level, T: Math.round(p.T - 273.15) });
      case 'bunsen':
        return p.T > 300 ? t('bk_step_bunsen', { T: Math.round(p.T - 273.15) }) : t('bk_step_bunsenAny');
      case 'power':
        return t('bk_step_power', { volts: p.volts });
      case 'wait':
        return t(p.light ? 'bk_step_waitLight' : 'bk_step_wait');
      case 'dispose':
        return r.waste === 'sink' ? t('bk_step_disposeSink') : t('bk_step_dispose', { bin: t(`bin_${r.waste ?? 'inorganic'}`) });
      default:
        return t(`bk_step_${step.kind}`, base);
    }
  }

  /** Che cosa si osserva, in frasi, dai segnali della reazione. */
  function observations(r) {
    const sig = r.signals;
    const out = [];
    const list = (arr) => arr.map((x) => nameF(x.sid)).join(t('bkAnd'));
    const plain = sig.gases.filter((x) => !x.colored);
    const colored = sig.gases.filter((x) => x.colored);
    if (plain.length) out.push(t('bkObs_gas', { names: list(plain) }));
    if (colored.length) out.push(t('bkObs_coloredGas', { names: list(colored) }));
    for (const x of sig.solids) out.push(x.metal ? t('bkObs_deposit', { names: nameF(x.sid) }) : t('bkObs_precipitate', { names: nameF(x.sid), color: t(`bkColor_${colorName(x.rgb)}`) }));
    if (sig.consumed.length) out.push(t('bkObs_dissolves'));
    if (sig.color) out.push(t('bkObs_colorChange', { from: t(`bkColor_${colorName(sig.color.from)}`), to: t(`bkColor_${colorName(sig.color.to)}`) }));
    if (sig.heat) out.push(t(`bkObs_${sig.heat}`));
    if (sig.fire) out.push(t('bkObs_fire'));
    if (!out.length) out.push(t('bkObs_none'));
    return out;
  }

  /** Colori per le vignette: contenuto all'inizio, ingrediente del passo, prodotto visibile. */
  function looks(r) {
    const c = chem();
    const mix = new Mixture(c);
    const ingColor = new Map();
    for (const x of r.ingredients) {
      if (x.role === 'air' || x.role === 'gas') continue;
      let m;
      if (x.form === 'solution') m = Mixture.solution(c, x.key, x.molar, x.ml);
      else if (x.sid === WATER) m = Mixture.liquid(c, 'water', x.ml);
      else if (x.form === 'liquid') m = Mixture.liquid(c, x.key, x.ml);
      else m = Mixture.solid(c, x.key, x.g ?? 0.2);
      const a = m.appearance();
      ingColor.set(x.sid, x.form === 'solid' ? a.solid : a.liquid);
      mix.add(m);
    }
    const a = mix.appearance();
    const sig = r.signals;
    const product = sig.solids[0]?.rgb ?? sig.color?.to ?? sig.gases.find((x) => x.colored)?.rgb ?? null;
    return { liquid: mix.liquidVolume > 0.5 ? a.liquid : null, solid: mix.solidVolume > 0.01 ? a.solid : null, ingColor, product };
  }

  function recipeEquipment(r) {
    const tools = [lc(t(`item_${r.vessel}`))];
    if (r.ingredients.some((x) => x.form === 'solid')) tools.push(t('bkTools_balance'));
    if (r.ingredients.some((x) => x.form === 'solution' || (x.form === 'liquid' && x.sid !== WATER))) tools.push(t('bkTools_cylinder'));
    if (r.heat?.how === 'plate') tools.push(t('bkTools_plate'));
    if (r.heat?.how === 'bunsen') tools.push(t('bkTools_bunsen'));
    if (r.light) tools.push(t('bkTools_lamp'));
    if (r.volts) tools.push(t('bkTools_power'));
    if (r.gas) tools.push(t('bkTools_gas'));
    if (r.steps.some((x) => x.kind === 'tongs')) tools.push(t('bkTools_tongs'));
    if (r.steps.some((x) => x.kind === 'filter')) tools.push(t('bkTools_filter'));
    if (r.hood) tools.push(t('bkTools_hood'));
    return tools;
  }

  function realityNotes(r) {
    const out = [t(r.light ? 'bkReal_light' : r.volts ? 'bkReal_electro' : 'bkReal_time')];
    if (r.flame) out.push(t('bkReal_fire'));
    out.push(t('bkReal_yield'));
    return out;
  }

  // ---------------------------------------------------------------- pagine

  function recipePage(r) {
    if (!recipeOpen(r)) return lockedPage(recipeTitle(r), `group:${r.rx.group}`);
    const lk = looks(r);
    const sig = r.signals;
    const eq = equation(chem(), r.rx, { aqueous: r.aqueous });
    const minT = r.heat?.T > 300 ? t('bkEqTemp', { T: Math.round(r.heat.T - 273.15) }) : '';
    const tubes = Array.from({ length: 3 }, (_, i) => `<i class="gm-bk__tube ${i < r.difficulty ? 'is-on' : ''}"></i>`).join('');
    const found = Boolean(game.notebook?.rx?.[r.id]);
    const following = game.follow?.recipe.id === r.id;
    const steps = r.steps.map((step) => {
      const ing = step.params.sid ? lk.ingColor.get(step.params.sid) : null;
      const fig = stepFigure(step, { vessel: r.vessel, liquid: lk.liquid, solid: lk.solid, ingredient: ing, gas: step.params.sid ? chem().formula(step.params.sid) : '', bin: r.waste ?? 'inorganic', tags: r.tags, product: lk.product, words: t });
      return `<li><figure class="gm-bk__stepfig">${fig}</figure><p>${esc(stepText(r, step))}</p></li>`;
    }).join('');
    const released = r.rx.products.filter((p) => p.sid !== WATER && chem().sub(p.sid)?.kind === 'element').map((p) => p.sid);
    return `<article class="gm-bk__page gm-bk__recipe">
      <p class="gm-bk__crumb"><button type="button" class="gm-link" data-bk-back>← ${esc(t('bkChRecipes'))}</button></p>
      <h4>${esc(recipeTitle(r))}</h4>
      <p class="gm-bk__badges"><span class="gm-bk__tubes" title="${esc(t('bkDifficulty', { n: r.difficulty }))}">${tubes}</span>
        <span>${esc(t('bkMinutes', { n: recipeMinutes(r) }))}</span>
        <span class="gm-bk__badge">${esc(t(r.shelfOnly ? 'bkBadgeShelf' : 'bkBadgeStore'))}</span>
        ${found ? `<span class="gm-bk__badge is-found">${esc(t('bkFound'))}</span>` : ''}</p>
      <p class="gm-bk__eq">${esc(eq)}${sig.dH !== null ? ` <small>${esc(t('bkEqHeat', { dH: kj(sig.dH) }))}</small>` : ''}${minT ? ` <small>· ${esc(minT)}</small>` : ''}</p>
      <div class="gm-bk__actions">
        ${game.free ? `<button type="button" class="gm-primary" data-bk-prepare="${esc(r.id)}" title="${esc(t('bkPrepareHint'))}">${esc(t('bkPrepare'))}</button>` : ''}
        <button type="button" class="${game.free ? 'btn-ghost' : 'gm-primary'}" data-bk-follow="${esc(r.id)}">${esc(t(following ? 'bkStopFollow' : 'bkFollow'))}</button>
        ${canOpenLab() ? `<button type="button" class="btn-ghost" data-bk-lab="${esc(r.id)}">${esc(t('bkOpenLab'))}</button>` : ''}
      </div>
      ${game.free ? '' : `<p class="gm-bk__note">${esc(t('bkPrepareCareer'))}</p>`}
      <div class="gm-bk__cols">
        <section><h5>${esc(t('bkIngredients'))}</h5><ul>${r.ingredients.map((x) => `<li>${esc(ingredientText(x))}</li>`).join('')}</ul></section>
        <section><h5>${esc(t('bkEquipment'))}</h5><ul>${recipeEquipment(r).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      </div>
      <h5>${esc(t('bkSteps'))}</h5>
      <ol class="gm-bk__steps">${steps}</ol>
      <h5>${esc(t('bkObserve'))}</h5>
      <ul>${observations(r).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="gm-bk__cols">
        <section><h5>${esc(t('bkSafety'))}</h5><p class="gm-bk__ghsrow">${r.ghs.map(ghsIcon).join('')}</p>${r.hood ? `<p>${esc(t('bkHoodNote'))}</p>` : ''}</section>
        <section><h5>${esc(t('bkWaste'))}</h5><p>${esc(r.waste === 'sink' ? t('bk_step_disposeSink') : t(`bin_${r.waste ?? 'inorganic'}`))}</p></section>
      </div>
      <h5>${esc(t('bkReality'))}</h5>
      <ul class="gm-bk__small">${realityNotes(r).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${released.length ? `<p>${released.map((z) => `<button type="button" class="gm-link" data-bk-element="${z}">${esc(t('bkElementLink', { name: lname(z) }))}</button>`).join(' · ')}</p>` : ''}
    </article>`;
  }

  function handPage(chapter, p) {
    const x = pick(p);
    if (!pageOpen(chapter, p)) return lockedPage(x.title, pageKey(chapter, p));
    const list = (arr) => (arr ?? []).map((s) => `<li>${esc(s)}</li>`).join('');
    return `<article class="gm-bk__page">
      <h4>${esc(x.title)}</h4>
      <figure class="gm-tut__fig">${pageFigure(p.fig, (w) => t(`tutw_${w}`))}</figure>
      <h5>${esc(t('bkUse'))}</h5><p>${esc(x.use)}</p>
      ${x.steps?.length ? `<h5>${esc(t('bkHow'))}</h5><ol class="gm-tut__steps">${list(x.steps)}</ol>` : ''}
      ${x.mistakes?.length ? `<h5>${esc(t('bkMistakes'))}</h5><ul>${list(x.mistakes)}</ul>` : ''}
      ${x.game ? `<p class="gm-bk__game"><b>${esc(t('bkInGame'))}:</b> ${esc(x.game)}</p>` : ''}
    </article>`;
  }

  function elementPage(z) {
    const el = game.book.elements[z - 1];
    const prod = PRODUCTION[z];
    const s = chem().sub(z);
    const recipes = el.recipes.map((r) => `<li><button type="button" class="gm-link" data-bk-recipe="${esc(r.id)}">${esc(recipeTitle(r))}</button></li>`).join('');
    const other = el.other.slice(0, 12).map((o) => {
      const rx = chem().rxById.get(o.id);
      const why = o.why === 'tooHot' ? t('bkWhy_tooHot', { T: Math.round((game.book.failed.get(o.id)?.T ?? 1273) - 273.15) }) : t(`bkWhy_${o.why}`);
      return `<li><span class="gm-bk__eqsmall">${esc(rx ? equation(chem(), rx, { states: false }) : o.id)}</span> <small>— ${esc(why)}</small></li>`;
    }).join('');
    return `<article class="gm-bk__page gm-bk__element">
      <h4><span class="gm-bk__sym">${esc(s?.symbol ?? '')}</span> ${esc(s?.name ?? '')} <small>Z = ${z}</small></h4>
      ${prod ? `<p class="gm-bk__badges"><span class="gm-bk__badge">${esc(t(`bkWay_${prod.way}`))}</span></p>` : ''}
      <h5>${esc(t('bkElemHow'))}</h5><p>${esc(prod ? pick({ it: prod.it, en: prod.en }) : '')}</p>
      <p class="gm-bk__note">${esc(t('bkElemNuclear'))}</p>
      <h5>${esc(t('bkElemGame'))}</h5>${recipes ? `<ul>${recipes}</ul>` : `<p>${esc(t('bkElemNone'))}</p>`}
      ${other ? `<h5>${esc(t('bkElemOther'))}</h5><ul class="gm-bk__small">${other}</ul>` : ''}
      <p class="gm-bk__small">${esc(t('bkSource'))}</p>
    </article>`;
  }

  // ---------------------------------------------------------------- elenchi

  const haystack = new Map();
  function hay(r) {
    if (!haystack.has(r.id)) {
      const c = chem();
      const sids = [...r.rx.reactants, ...r.rx.products].map((x) => x.sid);
      haystack.set(r.id, normalize(`${recipeTitle(r)} ${sids.map((s) => `${c.name(s)} ${c.formula(s)}`).join(' ')}`));
    }
    return haystack.get(r.id);
  }

  function recipeList() {
    let list = openRecipes();
    if (st.shelfOnly) list = list.filter((r) => r.shelfOnly);
    const q = normalize(st.query.trim());
    if (q) list = list.filter((r) => q.split(/\s+/).every((w) => hay(r).includes(w)));
    else if (st.group) list = list.filter((r) => r.rx.group === st.group);
    return list;
  }

  function recipeRows(list) {
    const rows = list.slice(0, MAX_LIST).map((r) => `<li><button type="button" class="gm-bk__row" data-bk-recipe="${esc(r.id)}">
        <b>${esc(recipeTitle(r))}</b><span class="gm-bk__eqsmall">${esc(equation(chem(), r.rx, { states: false }))}</span>
        <span class="gm-bk__tubes">${Array.from({ length: 3 }, (_, i) => `<i class="gm-bk__tube ${i < r.difficulty ? 'is-on' : ''}"></i>`).join('')}</span></button></li>`).join('');
    const more = list.length > MAX_LIST ? `<li class="gm-bk__small">${esc(t('bkMore', { n: list.length - MAX_LIST }))}</li>` : '';
    return list.length ? `<ol class="gm-bk__rows">${rows}${more}</ol>` : `<p>${esc(t('bkNoResults'))}</p>`;
  }

  function nav() {
    const chapters = CHAPTERS.map((c) => `<button type="button" class="gm-nb__group ${st.chapter === c ? 'is-on' : ''}" data-bk-chapter="${c}"><span>${esc(t(CH_KEY[c]))}</span></button>`).join('');
    let sub = '';
    if (HAND[st.chapter]) {
      sub = HAND[st.chapter].map((p, i) => `<button type="button" class="gm-bk__navitem ${st.page?.i === i ? 'is-on' : ''} ${pageOpen(st.chapter, p) ? '' : 'is-locked'}" data-bk-hand="${i}">${pageOpen(st.chapter, p) ? '' : lockIcon}${esc(pick(p).title)}</button>`).join('');
    } else if (st.chapter === 'elements') {
      sub = `<div class="gm-bk__elgrid">${game.book.elements.map((e) => {
        const s = chem().sub(e.z);
        return `<button type="button" class="gm-bk__el ${e.recipes.length ? 'has-recipes' : ''} ${st.page?.z === e.z ? 'is-on' : ''}" data-bk-element="${e.z}" title="${esc(s?.name ?? '')}">${esc(s?.symbol ?? '')}</button>`;
      }).join('')}</div>`;
    } else if (st.chapter === 'recipes') {
      const counts = new Map();
      for (const r of game.book.recipes) if (!st.shelfOnly || r.shelfOnly) counts.set(r.rx.group, (counts.get(r.rx.group) ?? 0) + 1);
      // nella Carriera i gruppi ancora chiusi restano in elenco, con il lucchetto e il capitolo che li apre
      sub = REACTION_GROUPS.filter((g) => counts.get(g.key)).map((g) => (!locks() || locks().groups.has(g.key)
        ? `<button type="button" class="gm-bk__navitem ${st.group === g.key && !st.query ? 'is-on' : ''}" data-bk-group="${g.key}">${esc(g.label)} <small>${counts.get(g.key)}</small></button>`
        : `<span class="gm-bk__navitem is-locked" title="${esc(t('bkLocked', { n: locks().chapterOf.get(`group:${g.key}`) ?? '—' }))}">${lockIcon}${esc(g.label)} <small>${esc(t('bkChapterShort', { n: locks().chapterOf.get(`group:${g.key}`) ?? '—' }))}</small></span>`)).join('');
    }
    return `<nav class="gm-nb__groups gm-bk__nav" aria-label="${esc(t('bookTitle'))}">
      <button type="button" class="gm-nb__group ${!st.chapter ? 'is-on' : ''}" data-bk-chapter=""><span>${esc(t('bkHome'))}</span></button>
      ${chapters}${sub ? `<div class="gm-bk__sub">${sub}</div>` : ''}</nav>`;
  }

  /** Risultati della ricerca o del gruppo scelto (si aggiornano mentre si scrive, senza perdere il fuoco). */
  function resultsHtml() {
    const list = recipeList();
    return `<p class="gm-bk__small">${esc(t('bkResults', { n: list.length }))}</p>${recipeRows(list)}`;
  }

  function main() {
    if (st.page?.type === 'recipe') {
      const r = game.book.byId.get(st.page.id);
      if (r) return recipePage(r);
    }
    if (st.page?.type === 'element') return elementPage(st.page.z);
    if (st.page?.type === 'hand') return handPage(st.chapter, HAND[st.chapter][st.page.i]);
    if (st.chapter === 'recipes') {
      return `<div class="gm-bk__page">
        <div class="gm-bk__search"><input type="search" class="gm-search" data-bk-search placeholder="${esc(t('bkSearch'))}" aria-label="${esc(t('bkSearch'))}" value="${esc(st.query)}" spellcheck="false"/>
          <label><input type="checkbox" data-bk-shelf ${st.shelfOnly ? 'checked' : ''}/> ${esc(t('bkShelfOnly'))}</label></div>
        <div class="gm-bk__results">${resultsHtml()}</div></div>`;
    }
    if (st.chapter === 'elements') return elementPage(st.page?.z ?? 29);
    if (HAND[st.chapter]) return handPage(st.chapter, HAND[st.chapter][0]);
    const card = (c, n) => `<button type="button" class="gm-bk__card" data-bk-chapter="${c}"><b>${esc(t(CH_KEY[c]))}</b><small>${n}</small></button>`;
    const countOpen = (c) => (locks() ? `${HAND[c].filter((p) => pageOpen(c, p)).length} / ${HAND[c].length}` : HAND[c].length);
    return `<div class="gm-bk__page gm-bk__home"><p>${esc(t('bkIntro'))}</p>
      <div class="gm-bk__cards">${card('tools', countOpen('tools'))}${card('techniques', countOpen('techniques'))}${card('safety', countOpen('safety'))}${card('elements', 118)}${card('recipes', locks() ? `${openRecipes().length} / ${game.book.recipes.length}` : game.book.recipes.length)}</div>
      ${locks() ? `<p class="gm-bk__note">${esc(t(locks().exam ? 'bkExamNote' : 'bkCareerNote'))}</p>` : ''}
      <p class="gm-bk__note">${esc(t('bkElemNuclear'))}</p></div>`;
  }

  return {
    state: st,
    html: () => `<div class="gm-nb gm-bk">${nav()}<section class="gm-nb__pages gm-bk__main">${main()}</section></div>`,
    /** Apre una pagina: 'recipe:<id>', 'element:<z>', 'tool:<id>', 'tech:<id>', 'safety:<id>', o un capitolo. */
    open(target) {
      const [kind, id] = String(target).split(':');
      const hand = Object.keys(PAGE_PREFIX).find((c) => PAGE_PREFIX[c] === kind);
      if (hand) {
        st.chapter = hand;
        const i = HAND[hand].findIndex((p) => p.id === id);
        st.page = i >= 0 ? { type: 'hand', i } : null;
      } else if (kind === 'recipe') {
        st.chapter = 'recipes';
        st.page = { type: 'recipe', id };
        st.group = game.book.byId.get(id)?.rx.group ?? st.group;
      } else if (kind === 'element') {
        st.chapter = 'elements';
        st.page = { type: 'element', z: Number(id) };
      } else {
        st.chapter = kind || null;
        st.page = null;
      }
    },
    /** Gestisce un clic su un elemento con data-bk-*; true se ha cambiato pagina. */
    click(b) {
      const d = b.dataset;
      if (d.bkChapter !== undefined) {
        st.chapter = d.bkChapter || null;
        st.page = null;
        if (st.chapter === 'recipes') st.group ??= REACTION_GROUPS.find((g) => game.book.recipes.some((r) => r.rx.group === g.key))?.key ?? null;
      } else if (d.bkHand !== undefined) st.page = { type: 'hand', i: Number(d.bkHand) };
      else if (d.bkElement !== undefined) {
        st.chapter = 'elements';
        st.page = { type: 'element', z: Number(d.bkElement) };
      } else if (d.bkGroup !== undefined) {
        st.group = d.bkGroup;
        st.query = '';
        st.page = null;
      } else if (d.bkRecipe !== undefined) {
        st.chapter = 'recipes';
        st.page = { type: 'recipe', id: d.bkRecipe };
      } else if (d.bkBack !== undefined) st.page = null;
      else return false;
      return true;
    },
    results: resultsHtml,
    recipeTitle,
    stepText,
  };
}
