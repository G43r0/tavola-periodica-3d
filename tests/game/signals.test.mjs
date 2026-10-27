// Test dei segnali osservabili delle reazioni (bolle, precipitato, colore, calore), dell'equazione con gli stati
// fisici, del «perché non reagisce?» e delle condizioni nuove del motore dei contenitori (luce, velocità con la
// temperatura). npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry, Mixture } from '../../src/game/mixture.js';
import { reactionSignals, signalTags, equation, whyNot, stateOf } from '../../src/game/signals.js';
import { FORMATION_ENTHALPIES } from '../../src/lab/data/formation-enthalpies.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);

/** Fa evolvere la miscela per `secs` secondi e restituisce le reazioni avvenute. */
function run(mix, secs = 10, env = {}) {
  const ids = new Set();
  for (let i = 0; i < secs * 20; i++) mix.tick(0.05, env).reactions.forEach((id) => ids.add(id));
  return [...ids].map((id) => ctx.rxById.get(id));
}
const solution = (key, M, ml) => Mixture.solution(ctx, key, M, ml);
const sigOf = (rx) => reactionSignals(ctx, rx, { aqueous: true });
const formulas = (list) => list.map((x) => ctx.formula(x.sid));

test('zinco e acido cloridrico: bolle di idrogeno, lo zinco si consuma, si scalda', () => {
  const mix = solution('hcl', 1, 50);
  mix.addSpecies(ctx.id('Zn'), 0.01);
  const [rx] = run(mix);
  assert.ok(rx, 'nessuna reazione');
  assert.equal(equation(ctx, rx, { aqueous: true }), 'Zn(s) + 2 HCl(aq) → ZnCl₂(aq) + H₂(g)');
  const sig = sigOf(rx);
  assert.deepEqual(formulas(sig.gases), ['H₂']);
  assert.equal(sig.gases[0].colored, false);
  assert.deepEqual(signalTags(sig), ['gas', 'dissolves', 'warm']);
  assert.ok(sig.dH < -150, `ΔH° ${sig.dH}`);
});

test('precipitazioni: AgCl bianco, PbI₂ giallo, Cu(OH)₂ azzurro (e la soluzione perde il blu del rame)', () => {
  let mix = solution('agno3', 0.1, 20);
  mix.add(solution('nacl', 0.1, 20));
  let [rx] = run(mix);
  assert.equal(equation(ctx, rx, { aqueous: true }), 'AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)');
  let sig = sigOf(rx);
  assert.deepEqual(formulas(sig.solids), ['AgCl']);
  assert.ok(sig.solids[0].rgb.every((c) => c > 220), 'AgCl bianco');

  mix = solution('pbno32', 0.1, 10);
  mix.add(solution('ki', 0.1, 20));
  [rx] = run(mix);
  sig = sigOf(rx);
  assert.deepEqual(formulas(sig.solids), ['PbI₂']);
  const [r, g, b] = sig.solids[0].rgb;
  assert.ok(r > 200 && g > 150 && b < 100, 'PbI₂ giallo');

  mix = solution('cuso4', 0.5, 20);
  mix.add(solution('naoh', 1, 20));
  [rx] = run(mix);
  sig = sigOf(rx);
  assert.deepEqual(formulas(sig.solids), ['Cu(OH)₂']);
  assert.ok(sig.color && sig.color.from && !sig.color.to, 'la soluzione azzurra diventa incolore');
});

test('spostamento: lo zinco nel solfato di rame si ricopre di rame (metallo che si deposita)', () => {
  const mix = solution('cuso4', 0.5, 50);
  mix.addSpecies(ctx.id('Zn'), 0.02);
  const [rx] = run(mix);
  const sig = sigOf(rx);
  assert.equal(sig.solids.length, 1);
  assert.equal(sig.solids[0].metal, true);
  assert.deepEqual(signalTags(sig).slice(0, 3), ['deposit', 'dissolves', 'colorChange']);
});

test('gas colorati e calore: NO₂ bruno dal rame con l\'acido nitrico; aceto e bicarbonato raffreddano', () => {
  const mix = solution('hno3', 6, 20);
  mix.addSpecies(ctx.id('Cu'), 0.01);
  const rxs = run(mix);
  const no2 = rxs.find((rx) => rx.products.some((p) => ctx.formula(p.sid) === 'NO₂'));
  assert.ok(no2, 'nessuna reazione con NO₂');
  const sig = sigOf(no2);
  assert.ok(sig.gases.find((g) => ctx.formula(g.sid) === 'NO₂').colored);
  assert.ok(signalTags(sig).includes('coloredGas'));
  assert.ok(sig.color?.to, 'la soluzione diventa azzurra (Cu²⁺)');

  const fizz = solution('nahco3', 0.5, 50);
  fizz.add(solution('acido-acetico', 0.8, 50));
  const [rx] = run(fizz);
  const s2 = sigOf(rx);
  assert.deepEqual(formulas(s2.gases), ['CO₂']);
  assert.equal(s2.heat, 'cold', `ΔH° ${s2.dH}`);
});

test('stati fisici: acqua liquida, gas molto solubili in soluzione, sali insolubili solidi', () => {
  const st = (k, opts) => stateOf(ctx, ctx.id(k), opts);
  assert.equal(st('water'), 'l');
  assert.equal(st('hcl'), 'g');
  assert.equal(st('hcl', { aqueous: true }), 'aq');
  assert.equal(st('nh3', { aqueous: true, product: true }), 'aq');
  assert.equal(st('co2', { aqueous: true, product: true }), 'g');
  assert.equal(st('baso4', { aqueous: true, product: true }), 's');
  assert.equal(st('etanolo', { aqueous: true }), 'aq');
  assert.equal(st('Zn', { aqueous: true }), 's');
});

test('perché non reagisce: rame e HCl, rame e solfato di zinco, magnesio in acqua fredda, H₂O₂ senza catalizzatore', () => {
  let mix = solution('hcl', 1, 50);
  mix.addSpecies(ctx.id('Cu'), 0.01);
  assert.deepEqual(run(mix), []);
  let w = whyNot(mix)[0];
  assert.equal(w.why, 'noble');
  assert.equal(ctx.formula(w.sid), 'Cu');
  assert.ok(w.E > 0);

  mix = solution('znso4', 0.5, 50);
  mix.addSpecies(ctx.id('Cu'), 0.01);
  run(mix);
  w = whyNot(mix)[0];
  assert.equal(w.why, 'lessActive');
  assert.ok(w.E2 < w.E, 'lo zinco è più attivo del rame');

  mix = Mixture.liquid(ctx, 'water', 50);
  mix.addSpecies(ctx.id('Mg'), 0.01);
  assert.deepEqual(run(mix, 3), []);
  w = whyNot(mix)[0];
  assert.equal(w.why, 'heat');
  assert.ok(w.T > 320 && w.T < 380, `${w.T} K`);

  mix = solution('h2o2', 1, 50);
  assert.deepEqual(run(mix, 3), []);
  w = whyNot(mix)[0];
  assert.equal(w.why, 'catalyst');
  assert.ok(w.sids.includes(ctx.id('mno2')));
  mix.addSpecies(ctx.id('mno2'), 0.001);
  const [rx] = run(mix, 3);
  assert.deepEqual(formulas(sigOf(rx).gases), ['O₂']);
});

test('perché non reagisce: con un solo reagente che manca lo dice (KMnO₄ e Fe²⁺ vogliono l\'acido solforico)', () => {
  const mix = solution('kmno4', 0.02, 50);
  mix.add(solution('feso4', 0.1, 20));
  run(mix, 3);
  const w = whyNot(mix).find((x) => x.why === 'missing');
  assert.ok(w, 'nessun reagente mancante');
  assert.equal(ctx.formula(w.sid), 'H₂SO₄');
});

test('luce: il cloruro d\'argento si decompone solo sotto la lampada, lentamente', () => {
  const dark = Mixture.solid(ctx, 'agcl', 1);
  assert.deepEqual(run(dark, 5), []);
  assert.equal(whyNot(dark)[0].why, 'light');
  const lit = Mixture.solid(ctx, 'agcl', 1);
  const [rx] = run(lit, 5, { light: true });
  assert.ok(rx, 'alla luce non reagisce');
  assert.ok(lit.amount('Ag') > 0);
  assert.ok(lit.amount('agcl') > 0.8 * (1 / ctx.molar(ctx.id('agcl'))), 'troppo veloce');
  assert.equal(reactionSignals(ctx, rx).light, true);
});

test('velocità: a caldo lo zinco reagisce con l\'acido più in fretta che a temperatura ambiente', () => {
  const left = (T) => {
    const mix = solution('hcl', 1, 50);
    mix.T = T;
    mix.addSpecies(ctx.id('Zn'), 0.01);
    mix.tick(0.5, { lossWK: 0 });
    return mix.amount('Zn');
  };
  assert.ok(left(330) < left(295) - 1e-4, `${left(330)} ${left(295)}`);
});

test('ΔH° tabulati: ogni valore aggiunto corrisponde a una sostanza della libreria e copre le reazioni del simulatore', () => {
  const ids = new Set(MOLECULES.map((m) => m.id));
  for (const [k, v] of Object.entries(FORMATION_ENTHALPIES)) {
    assert.ok(ids.has(k), `sostanza sconosciuta: ${k}`);
    assert.ok(Number.isFinite(v), k);
  }
  const withHeat = ctx.rxs.filter((rx) => rx.dH !== null).length;
  assert.ok(withHeat / ctx.rxs.length > 0.8, `${withHeat}/${ctx.rxs.length}`);
});

test('ogni reazione del simulatore ha segnali ed equazione, e quelle fuori dal simulatore hanno il motivo', () => {
  for (const rx of [...ctx.rxs, ...ctx.offline]) {
    const sig = reactionSignals(ctx, rx);
    assert.ok(Array.isArray(sig.gases) && Array.isArray(sig.solids), rx.id);
    assert.match(equation(ctx, rx), / → /, rx.id);
  }
  const whys = new Set(ctx.offline.map((rx) => rx.why));
  for (const w of whys) assert.ok(['equilibrium', 'living', 'catalyst', 'electrolysis', 'discharge', 'steam'].includes(w), w);
  assert.ok(ctx.rxs.some((rx) => rx.cond.light), 'nessuna reazione con la luce');
});
