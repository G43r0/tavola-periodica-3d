// Test delle condizioni del catalogo (parseConditions, usata da sandbox e simulatore): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSubstances } from '../../src/sandbox/substances.js';
import { parseConditions } from '../../src/sandbox/chemistry.js';
import { REACTIONS } from '../../src/lab/data/reactions.js';
import { createLabChemistry, Mixture } from '../../src/game/mixture.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const subs = createSubstances(elements);
const byFormula = new Map();
for (const s of subs.list) if (s?.kind === 'compound') byFormula.set(s.formula, s.id);
for (const el of subs.elements) byFormula.set(el.symbol, el.z);
const keyId = (key) => (key.startsWith('el:') ? subs.byKey.get(key.slice(3))?.id ?? 0 : subs.libraryId.get(key) ?? 0);
const parse = (cond) => parseConditions({ cond, reactants: [], products: [] }, { byFormula, keyId });
const formulas = (c) => [...(c.catalysts ?? [])].map((id) => subs.list[id].formula).sort();

test('condizioni: detonazione, sfregamento, fiamma, fusione, caldo, anni', () => {
  assert.ok(parse('detonazione').shock, 'detonazione (non contiene «detonat»)');
  assert.ok(parse('detonatore').shock);
  assert.ok(parse('sfregamento').shock);
  assert.ok(parse('fiamma').ignite);
  assert.ok(parse('fusione').molten, 'fusione (non solo fusa/fuso)');
  assert.ok(parse('zolfo fuso').molten);
  assert.ok(!parse('confusione').molten);
  assert.ok(parse('caldo').hot);
  assert.equal(parse('acqua calda').minT, 330);
  assert.ok(parse('aria, anni').rate <= 0.001);
  assert.equal(parse('in due passaggi (via idroperossido)').disabled, 'in due passaggi (serve un intermedio)');
});

test('condizioni: le formule scritte sono requisiti (parole intere, anche con le parentesi)', () => {
  assert.deepEqual(formulas(parse('una goccia di H₂SO₄')), ['H₂SO₄']);
  assert.deepEqual(formulas(parse('P₄O₁₀')), ['P₄O₁₀']);
  assert.deepEqual(formulas(parse('Ca(OH)₂, borati')), ['Ca(OH)₂']);
  assert.deepEqual(formulas(parse('NH₃, Δ')), ['NH₃']);
  assert.deepEqual(formulas(parse('(cat. FeCl₃)')), ['FeCl₃']);
  assert.ok(formulas(parse('base')).includes('NaOH'));
  assert.deepEqual(formulas(parse('Luce solare')), [], '«Luce» non è il lutezio');
  assert.deepEqual(formulas(parse('500 °C')), [], '«°C» non è il carbonio');
  assert.equal(parseConditions({ cond: 'una goccia di H₂SO₄', needs: 'una goccia di H₂SO₄', reactants: [], products: [] }, { byFormula, keyId }).text, 'una goccia di H₂SO₄', 'cond e needs uguali: una volta sola');
});

test('catalogo: ogni condizione scritta diventa un vincolo (o è dichiaratamente spontanea)', () => {
  // testi che non chiedono niente: reazioni spontanee e note sulle quantità
  const HARMLESS = /spontane|temperatura ambiente|disproporzione|anche al buio|ipergolica|in eccesso|limitato/i;
  const empty = [];
  for (const r of REACTIONS) {
    if (!r.cond && !r.needs) continue;
    const c = parseConditions(r, { byFormula, keyId });
    if (c.disabled || HARMLESS.test(c.text)) continue;
    const constrained = c.minT > 0 || c.maxT < Infinity || c.water || c.steam || c.catalysts || c.spark || c.discharge || c.light || c.shock || c.ignite || c.hot || c.molten || c.lowO2 || c.rate !== 0.08;
    if (!constrained) empty.push(`${r.n ?? r.id}: ${c.text}`);
  }
  assert.deepEqual(empty, []);
});

test('simulatore: senza le condizioni scritte queste reazioni non partono a 22 °C', () => {
  const ctx = createLabChemistry(elements);
  const run = (m, s) => {
    const T0 = m.T;
    const rx = new Set();
    for (let i = 0; i < s * 30; i++) for (const id of m.tick(1 / 30, { lossWK: 2, containerC: 90, area: 30, open: true }).reactions) rx.add(id);
    return { rx, dT: m.T - T0 };
  };
  const cases = [
    ['nitrato d\'ammonio (detonazione)', Mixture.solid(ctx, 'nh4no3', 5), 'cat-366'],
    ['clorato + zucchero (una goccia di H₂SO₄)', Mixture.of(ctx, [['kclo3', 5 / 122.55], ['saccarosio', 2 / 342.3]]), 'cat-996'],
    ['tetracloruro di carbonio all\'aria (fiamma)', Mixture.liquid(ctx, 'ccl4', 10), 'cat-941'],
    ['soda e sabbia (fusione)', Mixture.of(ctx, [['na2co3', 0.02], ['sio2', 0.02]]), 'cat-1109'],
    ['acetammide (P₄O₁₀)', Mixture.solid(ctx, 'acetammide', 5), 'cat-1228'],
  ];
  for (const [label, mix, id] of cases) {
    const { rx, dT } = run(mix, 30);
    assert.ok(!rx.has(id), `${label}: la reazione ${id} parte da sola`);
    assert.ok(Math.abs(dT) < 5, `${label}: ΔT ${dT.toFixed(1)} K`);
  }
});

test('simulatore: una reazione endotermica rallenta col freddo e non porta il contenuto verso lo zero assoluto', () => {
  const ctx = createLabChemistry(elements);
  // acetammide → acetonitrile + acqua (ΔH° ≈ +57 kJ/mol), con il P₄O₁₀ che la condizione chiede, senza scambi di calore
  const m = Mixture.of(ctx, [['acetammide', 5 / 59.07], ['p4o10', 0.002]]);
  let minT = m.T;
  for (let i = 0; i < 60 * 30; i++) {
    m.tick(1 / 30, { lossWK: 0, containerC: 0, area: 30 });
    minT = Math.min(minT, m.T);
  }
  assert.ok(minT > 180, `minimo ${minT.toFixed(1)} K`);
});
