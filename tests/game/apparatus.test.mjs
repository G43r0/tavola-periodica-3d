// Test degli strumenti della fase G4: regole di buretta, alimentatore, mantello, sonde e refrigerante
// (apparatus-logic.js) e il motore chimico che li fa funzionare: elettrolisi, gas delle bombole, filtrazione,
// distillazione. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry, Mixture } from '../../src/game/mixture.js';
import { whyNot } from '../../src/game/signals.js';
import { DEFS } from '../../src/game/items.js';
import {
  STOPCOCK, VOLTS, CYLINDER_GASES, GAS_FLOW, HOT_T, buretteReading, nextStopcock, nextVolts, nextLevel, relax, condensable, splitVapours, displayCurrent,
} from '../../src/game/apparatus-logic.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);
const WATER = ctx.id('water');
const run = (m, seconds, env = {}, feed = null) => {
  const out = { reactions: new Set(), gases: new Map(), current: 0 };
  for (let i = 0; i < seconds * 20; i++) {
    feed?.(m);
    const ev = m.tick(0.05, env);
    for (const r of ev.reactions) out.reactions.add(r);
    for (const [sid, mol] of ev.gases) out.gases.set(sid, (out.gases.get(sid) ?? 0) + mol);
    out.current = ev.current;
  }
  return out;
};
const gas = (key, mol = GAS_FLOW * 0.05) => (m) => m.addSpecies(ctx.id(key), mol);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≠ ${b} ± ${tol}`);

test('buretta: lo 0 in alto, lettura a 0,05 mL, rubinetto chiuso → goccia → filo → aperto', () => {
  assert.equal(buretteReading(50), 0);
  assert.equal(buretteReading(25.03), 24.95);
  assert.equal(buretteReading(0), 50);
  assert.ok(buretteReading(52) < 0, 'sopra lo zero');
  assert.deepEqual([0, 1, 2, 3].map((s) => nextStopcock(s, 1)), [1, 2, 3, 0]);
  assert.equal(nextStopcock(2, -1), 0, 'il clic destro chiude');
  assert.equal(STOPCOCK[0], 0);
  assert.ok(STOPCOCK[1] < STOPCOCK[2] && STOPCOCK[2] < STOPCOCK[3]);
  // la graduazione corrisponde al volume: 50 mL tra la base del tubo e lo zero
  const d = DEFS.burette;
  const tube = Math.PI * d.profile[0][0] ** 2 * (d.profile[1][1] - d.profile[0][1]) * 1e6;
  assert.ok(tube > 50 && tube < 52, `tubo da ${tube} mL`);
});

test('alimentatore e mantello: tensioni 0–12 V e livelli 0–5 come la piastra', () => {
  assert.deepEqual(VOLTS, [0, 2, 4, 6, 9, 12]);
  assert.equal(nextVolts(0, 1), 2);
  assert.equal(nextVolts(12, 1), 0);
  assert.equal(nextVolts(6, -1), 0);
  assert.equal(nextLevel(5, 1), 0);
  assert.equal(nextLevel(3, -1), 2);
  assert.equal(nextLevel(0, -1), 0);
  assert.equal(displayCurrent(0.003), 0);
  assert.equal(displayCurrent(0.6549), 0.65);
});

test('sonde: il termometro insegue piano la temperatura, il pH-metro si stabilizza in un secondo', () => {
  let T = 295;
  for (let i = 0; i < 30; i++) T = relax(T, 345, 0.1, 2.5);
  assert.ok(T > 320 && T < 340, `dopo 3 s il termometro segna ${T}`);
  let ph = null;
  ph = relax(ph, 4, 0.1, 0.4);
  assert.equal(ph, 4, 'la prima lettura è quella vera');
  let p = 7;
  for (let i = 0; i < 10; i++) p = relax(p, 3, 0.1, 0.4);
  near(p, 3, 0.4);
  assert.ok(HOT_T > 330 && HOT_T < 340, 'scotta sopra i 60 °C');
});

test('refrigerante: condensano acqua ed etanolo, non CO₂, H₂ né O₂', () => {
  assert.ok(condensable(ctx, WATER));
  assert.ok(condensable(ctx, ctx.id('etanolo')));
  assert.ok(condensable(ctx, ctx.id('acetone')));
  for (const k of ['co2', 'H', 'O', 'nh3']) assert.ok(!condensable(ctx, ctx.id(k)), k);
  const { liquid, gas: out } = splitVapours(ctx, [[WATER, 0.01], [ctx.id('co2'), 0.002], [ctx.id('etanolo'), 0.003]]);
  assert.deepEqual(liquid.map(([s]) => s), [WATER, ctx.id('etanolo')]);
  assert.deepEqual(out.map(([s]) => s), [ctx.id('co2')]);
});

test('elettrolisi: corrente solo con un elettrolita; Na₂SO₄ dà H₂ e O₂, HCl dà H₂ e Cl₂, NaCl la soda', () => {
  const pure = Mixture.liquid(ctx, 'water', 100);
  const r0 = run(pure, 2, { volts: 6 });
  assert.equal(r0.reactions.size, 0);
  assert.ok(r0.current < 0.005, `acqua distillata: ${r0.current} A`);
  assert.equal(whyNot(pure, { volts: 6 })[0]?.why, 'conduct', 'perché non reagisce: non conduce');
  assert.equal(whyNot(pure, {})[0]?.why, 'electrolysis', 'senza tensione serve l\'alimentatore');
  const sulfate = Mixture.solution(ctx, 'na2so4', 0.5, 100);
  const r1 = run(sulfate, 5, { volts: 6 });
  assert.ok(r1.current > 0.3 && r1.current < 1.5, `Na₂SO₄ 0,5 M a 6 V: ${r1.current} A`);
  assert.ok(r1.gases.get(ctx.id('H')) > 0 && r1.gases.get(ctx.id('O')) > 0);
  // contando anche il gas rimasto sciolto (l'ossigeno si scioglie di più), le moli stanno 2 : 1
  const made = (k) => r1.gases.get(ctx.id(k)) + sulfate.amount(k);
  near(made('H') / made('O'), 2, 0.1, 'H₂ : O₂ = 2 : 1');
  // la corrente cresce con la tensione
  const r12 = run(Mixture.solution(ctx, 'na2so4', 0.5, 100), 1, { volts: 12 });
  assert.ok(r12.current > r1.current * 1.5);
  // il cloro al primo minuto resta in buona parte sciolto (è molto più solubile dell'idrogeno)
  const hcl = Mixture.solution(ctx, 'hcl', 1, 100);
  const acid = run(hcl, 5, { volts: 6 });
  assert.ok(acid.gases.get(ctx.id('H')) > 0 && (acid.gases.get(ctx.id('Cl')) ?? 0) + hcl.amount('Cl') > 1e-4, 'HCl → H₂ + Cl₂');
  const brine = Mixture.solution(ctx, 'nacl', 1, 100);
  run(brine, 10, { volts: 12 });
  assert.ok(brine.amount('naoh') + brine.amount('naclo') > 1e-4, 'cloro-soda: si forma NaOH (e con il cloro l\'ipoclorito)');
});

test('bombole: i gas si sciolgono o reagiscono nel liquido dove gorgogliano', () => {
  assert.deepEqual(CYLINDER_GASES, ['O', 'H', 'co2', 'Cl', 'nh3']);
  for (const k of CYLINDER_GASES) assert.ok(ctx.id(k), k);
  const lime = Mixture.solution(ctx, 'caoh2', 0.02, 100);
  run(lime, 3, {}, gas('co2'));
  assert.ok(lime.amount('caco3') > 1e-4, 'la CO₂ intorbida l\'acqua di calce');
  const kbr = Mixture.solution(ctx, 'kbr', 0.1, 100);
  run(kbr, 10, {}, gas('Cl'));
  assert.ok(kbr.amount('Br') > 1e-4, 'il cloro sposta il bromo');
  const acid = Mixture.solution(ctx, 'hcl', 0.1, 100);
  run(acid, 10, {}, gas('nh3'));
  assert.ok(acid.amount('nh4cl') > 1e-3, 'NH₃ + HCl → NH₄Cl');
  // l'ossigeno quasi non si scioglie: esce quasi tutto
  const w = Mixture.liquid(ctx, 'water', 100);
  const r = run(w, 5, {}, gas('O'));
  assert.ok(r.gases.get(ctx.id('O')) > GAS_FLOW * 5 * 0.8);
  const cuo = Mixture.solid(ctx, 'cuo', 2);
  cuo.T = 700;
  const hot = run(cuo, 5, { heatW: 60, lossWK: 0.1, open: false }, gas('H'));
  assert.ok(hot.reactions.has('cat-1070') && cuo.amount('Cu') > 1e-4, 'l\'idrogeno riduce l\'ossido di rame caldo');
});

test('filtrazione: passa il liquido con i soluti, il precipitato resta sulla carta', () => {
  const m = Mixture.solution(ctx, 'agno3', 0.1, 30);
  m.add(Mixture.solution(ctx, 'nacl', 0.1, 30));
  run(m, 2);
  const agcl = m.amount('agcl');
  assert.ok(agcl > 2.5e-3, 'precipita AgCl');
  const filtrate = m.takeLiquid(m.liquidVolume);
  assert.ok(filtrate.liquidVolume > 55);
  assert.ok(filtrate.amount('nano3') > 2.5e-3, 'NaNO₃ sciolto passa');
  assert.ok(filtrate.amount('agcl') < agcl * 0.01, 'AgCl resta');
  assert.ok(m.amount('agcl') > agcl * 0.99);
  assert.ok(m.liquidVolume < 0.1);
});

test('distillazione: il pallone chiuso bolle a 78 °C e il vapore è etanolo, poi acqua', () => {
  const m = Mixture.liquid(ctx, 'water', 60);
  m.add(Mixture.liquid(ctx, 'etanolo', 40));
  const first = new Map();
  let Tfirst = null;
  // 100 mL a 60 W: un minuto e mezzo per arrivare a 78 °C, poi l'etanolo distilla per circa due minuti
  for (let i = 0; i < 20 * 190; i++) {
    const ev = m.tick(0.05, { heatW: 60, lossWK: 0.25, open: false });
    for (const [sid, mol] of splitVapours(ctx, ev.gases).liquid) {
      Tfirst ??= m.T;
      first.set(sid, (first.get(sid) ?? 0) + mol);
    }
  }
  near(Tfirst - 273.15, 78.4, 1.5, 'comincia a distillare a');
  const eth = (first.get(ctx.id('etanolo')) ?? 0) * ctx.molar(ctx.id('etanolo'));
  const water = (first.get(WATER) ?? 0) * 18.015;
  assert.ok(eth > 15 && eth > water * 3, `distillato: etanolo ${eth} g, acqua ${water} g`);
});

test('porcellana: crogiolo e capsula non sono di vetro, la buretta e gli apparecchi fissi non si rompono', () => {
  for (const k of ['crucible', 'dish']) {
    assert.ok(DEFS[k].container && DEFS[k].porcelain && !DEFS[k].glass, k);
    near(DEFS[k].heatC, DEFS[k].mass * 1000 * 0.85, 1e-6, `${k}: calore specifico della porcellana`);
  }
  near(DEFS.crucible.capacity, 26, 6, 'crogiolo da 25–30 mL');
  for (const k of ['burette', 'funnel', 'rbflask']) assert.ok(DEFS[k].rig && !DEFS[k].breakable, k);
  near(DEFS.rbflask.capacity, 250, 30, 'pallone da 250 mL');
  for (const k of ['thermometer', 'phmeter', 'pipette']) assert.ok(DEFS[k].tool && DEFS[k].probe, k);
});
