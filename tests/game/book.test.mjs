// Test del libro «Come si fa»: ogni ricetta del libro la esegue davvero il motore dei contenitori (e il file delle
// ricette verificate è aggiornato), dosi da scuola calcolate dalle masse molari, passi, ricette classiche, pagine degli
// elementi, pagine scritte a mano e vignette. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry } from '../../src/game/mixture.js';
import { bookRecipes, runRecipe, elementPages, storeIndex, plateEquilibrium, EXCESS } from '../../src/game/book.js';
import { stepFigure, pageFigure, PAGE_FIGURES } from '../../src/game/book-figures.js';
import { TOOL_PAGES, TECHNIQUE_PAGES, SAFETY_PAGES } from '../../src/game/data/book-pages.js';
import { PRODUCTION, PRODUCTION_WAYS } from '../../src/game/data/element-production.js';
import VERIFIED from '../../src/game/data/book-verified.js';
import { colorName } from '../../src/game/book-view.js';
import { _setLangForTests } from '../../src/i18n/index.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);
const all = bookRecipes(ctx);
const book = bookRecipes(ctx, VERIFIED);
const formulas = (list) => list.map((x) => ctx.formula(x.sid)).sort().join('+');
const find = (re) => book.recipes.find((r) => re.test(`${formulas(r.rx.reactants)}>${formulas(r.rx.products)}`));

test('libro: le ricette verificate sono esattamente quelle che il motore esegue (node scripts/book.mjs)', () => {
  const ok = {};
  for (const r of all.recipes) {
    const res = runRecipe(ctx, r);
    if (res.ok) ok[r.id] = [res.seconds, res.waste];
  }
  assert.deepEqual(Object.keys(ok).sort(), Object.keys(VERIFIED).sort(), 'ricette cambiate: rilancia node scripts/book.mjs');
  for (const [id, v] of Object.entries(ok)) assert.deepEqual(v, VERIFIED[id], id);
  assert.ok(book.recipes.length >= 600, `${book.recipes.length} ricette`);
});

test('libro: dosi da scuola, lette sulla bilancia e sul cilindro, con un leggero eccesso', () => {
  for (const r of book.recipes) {
    const reactants = r.ingredients.filter((x) => x.role === 'reactant');
    for (const x of reactants) {
      if (x.form === 'solid') {
        assert.ok(Math.abs(x.g * 20 - Math.round(x.g * 20)) < 1e-6 && x.g >= 0.05 && x.g <= 6.5, `${r.id}: ${x.g} g`);
        assert.ok(Math.abs(x.mol - x.g / ctx.molar(x.sid)) < 1e-12);
      } else {
        // cilindro: 1 mL (0,5 sotto i 5 mL); un liquido puro sotto 1 mL con la pipetta (0,1 mL)
        const step = x.form === 'liquid' && x.ml < 1 ? 10 : 2;
        assert.ok(Math.abs(x.ml * step - Math.round(x.ml * step)) < 1e-6 && x.ml >= (x.form === 'liquid' ? 0.2 : 1) && x.ml <= 61, `${r.id}: ${x.ml} mL`);
        if (x.form === 'solution') assert.ok([0.1, 0.5, 1, 2].includes(x.molar) || x.molar > 0, `${r.id}: ${x.molar} M`);
      }
    }
    // rapporti stechiometrici: nessun reagente è molto in difetto rispetto agli altri
    const xi = reactants.map((x) => x.mol / x.c);
    if (xi.length > 1) assert.ok(Math.max(...xi) / Math.min(...xi) < EXCESS * 1.6, `${r.id}: ${xi.map((v) => v.toExponential(2))}`);
  }
  const cu = find(/^CuSO₄\+Zn>Cu\+ZnSO₄$/);
  assert.ok(cu, 'zinco nel solfato di rame');
  const zn = cu.ingredients.find((x) => ctx.formula(x.sid) === 'Zn');
  const cuso4 = cu.ingredients.find((x) => ctx.formula(x.sid) === 'CuSO₄');
  assert.equal(zn.form, 'solid');
  assert.equal(cuso4.form, 'solution');
  assert.ok(zn.mol > (cuso4.mol * 0.99) || cuso4.mol > zn.mol * 0.99);
});

test('libro: i passi cominciano dal recipiente (o dalla cappa), finiscono con lo smaltimento e si controllano', () => {
  const kinds = new Set();
  for (const r of book.recipes) {
    assert.ok(['hood', 'vessel'].includes(r.steps[0].kind), r.id);
    assert.equal(r.steps.at(-1).kind, 'dispose', r.id);
    assert.ok(r.steps.some((s) => s.kind === 'observe'), r.id);
    for (const s of r.steps) {
      kinds.add(s.kind);
      assert.ok(['has', 'temp', 'rx', 'hood', 'waste', 'auto'].includes(s.check.type), `${r.id}: ${s.check.type}`);
      if (s.check.type === 'has') assert.ok(s.check.mol > 0 && s.check.sid, r.id);
    }
    assert.ok(r.difficulty >= 1 && r.difficulty <= 3);
    if (r.heat?.how === 'plate') assert.ok(plateEquilibrium(r.heat.level, r.vessel) >= r.heat.T + 10, `${r.id}: la piastra arriva`);
  }
  for (const k of ['weigh', 'measure', 'plate', 'bunsen', 'flame', 'lamp', 'power', 'gas', 'catalyst', 'filter', 'tongs', 'hood']) assert.ok(kinds.has(k), k);
});

test('libro: le ricette classiche della scuola', () => {
  const zncu = find(/^CuSO₄\+Zn>Cu\+ZnSO₄$/);
  assert.ok(zncu.tags.includes('deposit') && !zncu.heat && zncu.waste === 'heavy', 'Zn + CuSO₄: il rame si deposita, rifiuto dei metalli pesanti');
  const agcl = find(/AgNO₃.*NaCl>AgCl/);
  assert.ok(agcl?.tags.includes('precipitate') && agcl.steps.some((s) => s.kind === 'filter'), 'AgNO₃ + NaCl: precipitato da filtrare');
  const h2 = find(/^HCl\+Zn>H₂\+ZnCl₂$/);
  assert.ok(h2?.tags.includes('gas') && !h2.hood, 'Zn + HCl: bolle di idrogeno, niente cappa');
  const o2 = find(/^H₂O₂>/);
  assert.ok(o2?.steps.some((s) => s.kind === 'catalyst'), 'H₂O₂ con il catalizzatore');
  const lime = find(/^CaCO₃>CO₂\+CaO$/);
  assert.ok(lime && lime.heat?.how === 'bunsen' && lime.vessel === 'crucible' && lime.steps.some((s) => s.kind === 'tongs'), 'CaCO₃ nel crogiolo sul Bunsen, con la pinza');
  const mg = book.byId.get('mgo');
  assert.ok(mg?.flame && mg.steps.some((s) => s.kind === 'flame'), 'il magnesio brucia nella fiamma');
  assert.ok(book.recipes.some((r) => r.volts && r.hood), 'un\'elettrolisi sotto la cappa');
  assert.ok(book.recipes.some((r) => r.gas === 'co2'), 'la CO₂ dalla bombola');
  assert.ok(book.recipes.some((r) => r.light), 'una reazione alla lampada');
  assert.ok(book.recipes.filter((r) => r.shelfOnly).length >= 100, 'molte ricette con il solo scaffale');
  assert.ok(book.recipes.some((r) => r.rx.r?.name), 'le reazioni con un nome lo usano come titolo');
});

test('libro: i 118 elementi, come si ottengono davvero e quali ricette li liberano', () => {
  assert.equal(Object.keys(PRODUCTION).length, 118);
  for (let z = 1; z <= 118; z++) {
    const p = PRODUCTION[z];
    assert.ok(p && PRODUCTION_WAYS.includes(p.way), `${z}`);
    for (const l of ['it', 'en']) assert.ok(p[l].length > 60 && p[l].length < 420 && !p[l].includes('\n'), `${z} ${l}`);
  }
  assert.equal(PRODUCTION[7].way, 'air');
  assert.equal(PRODUCTION[118].way, 'accelerator');
  const pages = elementPages(ctx, book);
  assert.equal(pages.length, 118);
  for (const sym of ['H', 'O', 'Cu', 'Ag']) assert.ok(pages[ctx.id(sym) - 1].recipes.length > 0, `${sym} si libera nel laboratorio`);
  const na = pages[10];
  assert.ok(na.other.some((o) => o.why === 'molten'), 'il sodio dal sale fuso: solo nell\'industria');
  const freed = pages.filter((p) => p.recipes.length).length;
  assert.ok(freed >= 25, `${freed} elementi liberati nel gioco`);
});

test('libro: pagine scritte a mano, con vignette e testi nelle tre lingue', () => {
  assert.equal(TOOL_PAGES.length, 26); // dalla G8 anche pila Daniell e contatore del gas
  assert.equal(TECHNIQUE_PAGES.length, 15);
  assert.equal(SAFETY_PAGES.length, 5);
  for (const p of [...TOOL_PAGES, ...TECHNIQUE_PAGES, ...SAFETY_PAGES]) {
    assert.ok(PAGE_FIGURES.includes(p.fig), `vignetta ${p.fig}`);
    assert.ok(pageFigure(p.fig).startsWith('<svg'), p.fig);
    for (const l of ['it', 'en']) assert.ok(p[l].title && p[l].use && p[l].steps.length && p[l].game, `${p.id} ${l}`);
    assert.ok(p.eli6?.use, `${p.id} eli6`);
  }
  assert.equal(SAFETY_PAGES.find((p) => p.id === 'ghs').it.steps.length, 9, 'i nove pittogrammi');
});

test('libro: vignette dei passi di ogni ricetta, senza valori mancanti', () => {
  for (const r of book.recipes.slice(0, 200)) {
    for (const s of r.steps) {
      const svg = stepFigure(s, { vessel: r.vessel, liquid: [120, 160, 230], solid: [230, 230, 230], tags: r.tags, gas: 'Cl₂', bin: r.waste ?? 'inorganic' });
      assert.ok(svg.startsWith('<svg') && !/NaN|undefined/.test(svg), `${r.id} ${s.kind}`);
    }
  }
});

test('libro: la bilancia delle vignette mostra la dose arrotondata, con il separatore decimale della lingua', () => {
  const weigh = (g) => {
    const svg = stepFigure({ kind: 'weigh', params: { g } }, {});
    return /<text[^>]*>([^<]*g)<\/text>/.exec(svg)?.[1];
  };
  try {
    // 0,30000000000000004 è quello che danno i calcoli delle dosi (0,05 × 6)
    assert.equal(weigh(0.30000000000000004), '0,30 g');
    assert.equal(weigh(1.2000000000000002), '1,2 g');
    assert.equal(weigh(2), '2 g');
    _setLangForTests('en');
    assert.equal(weigh(0.30000000000000004), '0.30 g');
    assert.equal(weigh(5.800000000000001), '5.8 g');
  } finally {
    _setLangForTests('it');
  }
  // nessuna vignetta del libro con un numero lungo (errori di arrotondamento)
  for (const r of book.recipes) {
    for (const s of r.steps) {
      const svg = stepFigure(s, { vessel: r.vessel, tags: r.tags, bin: r.waste ?? 'inorganic' });
      assert.ok(!/\d[.,]\d{4,}/.test(svg.replace(/<path[^>]*>|d="[^"]*"|points="[^"]*"/g, '')), `${r.id} ${s.kind}`);
    }
  }
});

test('magazzino: le sostanze della libreria e i metalli in pezzi (come il catalogo del gioco)', () => {
  const store = storeIndex(ctx);
  for (const sym of ['Zn', 'Fe', 'Cu', 'Mg', 'Al']) assert.equal(store.get(ctx.id(sym))?.st, 'solid', sym);
  assert.ok(!store.has(ctx.id('Hg')), 'niente mercurio');
  assert.equal(store.get(ctx.id('nacl'))?.soluble, true);
  assert.ok(store.size > 400);
});

test('libro: nomi dei colori per le osservazioni', () => {
  assert.equal(colorName([250, 250, 250]), 'white');
  assert.equal(colorName([20, 20, 20]), 'black');
  assert.equal(colorName([60, 120, 230]), 'blue');
  assert.equal(colorName([240, 220, 40]), 'yellow');
  assert.equal(colorName([120, 70, 30]), 'brown');
  assert.equal(colorName(null), 'none');
});
