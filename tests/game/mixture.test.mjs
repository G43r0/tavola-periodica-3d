// Test del motore chimico dei contenitori del simulatore di laboratorio: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry, Mixture, wasteClass, binAccepts, solvePH, AMBIENT } from '../../src/game/mixture.js';
import { ACID_BASE, SOLUBILITY, SHELF, FLAME_SALTS, HYDRATES, TOXIC_GASES } from '../../src/game/reagents.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);
const run = (m, seconds, env = {}) => {
  const events = [];
  for (let i = 0; i < seconds * 30; i++) events.push(m.tick(1 / 30, env));
  return events;
};
const HOT = { heatW: 300, lossWK: 1.5, containerC: 90, area: 30 };
const COOL = { lossWK: 2, containerC: 90, area: 30 };
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≠ ${b} ± ${tol}`);

test('dati del gioco: le sostanze citate esistono nella libreria', () => {
  for (const k of [...Object.keys(SOLUBILITY), ...Object.keys(HYDRATES), ...Object.values(HYDRATES).map(([h]) => h)]) assert.ok(ctx.id(k), `solubilità: ${k}`);
  for (const k of ['hcl', 'h2so4', 'naoh', 'caoh2', 'acido-acetico', 'nh3', 'na2co3', 'nahco3', 'nh4cl']) assert.ok(ctx.acidBase.has(ctx.id(k)), `acido/base: ${k}`);
  for (const k of TOXIC_GASES) assert.ok(ctx.id(k), `gas tossico: ${k}`);
  for (const r of Object.values(SHELF)) for (const k of [r.solute, r.solid, r.liquid].filter(Boolean)) assert.ok(ctx.id(k), `scaffale: ${k}`);
  for (const k of Object.keys(FLAME_SALTS)) assert.ok(ctx.id(k), `saggio alla fiamma: ${k}`);
  assert.ok(Object.keys(ACID_BASE).filter((k) => ctx.id(k)).length > 40);
  assert.ok(ctx.rxs.length > 1000, 'reazioni del catalogo disponibili');
});

test('pH: acqua, acidi e basi forti e deboli', () => {
  near(solvePH({}), 7, 0.01);
  near(Mixture.solution(ctx, 'hcl', 0.1, 50).pH(), 1, 0.02, 'HCl 0,1 M');
  near(Mixture.solution(ctx, 'naoh', 0.01, 50).pH(), 12, 0.02, 'NaOH 0,01 M');
  near(Mixture.solution(ctx, 'acido-acetico', 0.1, 50).pH(), 2.88, 0.05, 'acido acetico 0,1 M');
  near(Mixture.solution(ctx, 'nh3', 0.1, 50).pH(), 11.13, 0.05, 'ammoniaca 0,1 M');
  near(Mixture.solution(ctx, 'nacl', 0.5, 50).pH(), 7, 0.01, 'NaCl neutro');
  assert.equal(Mixture.solid(ctx, 'nacl', 1).pH(), null, 'senza acqua non c\'è pH');
});

test('scioglimento: il sale si scioglie col tempo, più in fretta agitando, e dà la molarità giusta', () => {
  const still = Mixture.solid(ctx, 'nacl', 2.922);
  still.add(Mixture.liquid(ctx, 'water', 98.6));
  const stirred = still.clone();
  run(still, 2);
  run(stirred, 2, { stir: 1 });
  assert.ok(still.dissolved('nacl') < still.amount('nacl'), 'non istantaneo');
  assert.ok(stirred.dissolved('nacl') > still.dissolved('nacl'), 'agitare aiuta');
  run(stirred, 20, { stir: 0.5 });
  near(stirred.molarity('nacl'), 0.5, 0.005, 'NaCl 0,50 M');
  near(stirred.liquidVolume, 100, 0.5, 'circa 100 mL');
  // oltre la solubilità (36 g/100 g) resta del solido sul fondo
  const sat = Mixture.solid(ctx, 'nacl', 50);
  sat.add(Mixture.liquid(ctx, 'water', 100));
  run(sat, 60, { stir: 1 });
  near(sat.dissolved('nacl') * 58.44, 35.9, 0.6, 'soluzione satura');
  assert.equal(sat.appearance().solidKind, 'crystals');
});

test('titolazione: HCl 0,10 M con NaOH 0,10 M e fenolftaleina vira al punto equivalente', () => {
  const flask = Mixture.solution(ctx, 'hcl', 0.1, 25);
  flask.add(Mixture.of(ctx, [['water', 1.5 / 18], ['php', 1.5e-3 / 318]]));
  const naoh = Mixture.solution(ctx, 'naoh', 0.1, 50);
  flask.add(naoh.take(24.8));
  run(flask, 2);
  assert.ok(flask.pH() < 5, `prima del punto equivalente è acida (${flask.pH()})`);
  assert.ok(flask.appearance().pink < 0.05, 'ancora incolore');
  flask.add(naoh.take(0.3));
  run(flask, 2);
  assert.ok(flask.pH() > 8.2 && flask.pH() < 11, `appena oltre: basica (${flask.pH()})`);
  assert.ok(flask.appearance().pink > 0.5, 'rosa');
  near(flask.amount('nacl'), 0.0025, 1e-5, 'si è formato NaCl');
  assert.ok(flask.T > AMBIENT + 0.3, 'la neutralizzazione scalda');
});

test('pioggia d\'oro: Pb(NO₃)₂ + 2 KI → PbI₂ giallo che precipita', () => {
  const m = Mixture.solution(ctx, 'pbno32', 0.1, 10);
  m.add(Mixture.solution(ctx, 'ki', 0.1, 20));
  const ev = run(m, 2);
  assert.ok(ev.some((e) => e.precipitated));
  near(m.amount('pbi2'), 0.001, 2e-5, 'PbI₂ stechiometrico');
  near(m.dissolved('kno3'), 0.002, 2e-5, 'KNO₃ resta sciolto');
  const look = m.appearance();
  assert.equal(look.solidKind, 'precipitate');
  assert.ok(look.turbid > 0.5, 'torbido');
  assert.ok(look.solid[0] > 200 && look.solid[2] < 80, 'giallo');
  assert.equal(wasteClass(m), 'heavy', 'piombo: metalli pesanti');
});

test('cristalli di solfato di rame: a caldo si scioglie, evapora, raffreddando cristallizza come pentaidrato', () => {
  const m = Mixture.solid(ctx, 'cuso4-5h2o', 10);
  m.add(Mixture.liquid(ctx, 'water', 25));
  const cuTotal = () => m.amount('cuso4') + m.amount('cuso4-5h2o');
  const start = cuTotal();
  run(m, 30, HOT);
  assert.equal(m.amount('cuso4-5h2o'), 0, 'tutto sciolto a caldo');
  const blue = m.appearance().liquid;
  assert.ok(blue[2] > blue[0] + 100, 'soluzione azzurra');
  run(m, 40, HOT);
  assert.ok(m.water < 15, 'metà dell\'acqua evaporata');
  run(m, 90, COOL);
  assert.ok(m.T < AMBIENT + 3, 'raffreddata');
  assert.ok(m.grams('cuso4-5h2o') > 5, `cristalli azzurri (${m.grams('cuso4-5h2o')} g)`);
  near(cuTotal(), start, 1e-9, 'il rame si conserva');
  // scaldando troppo i cristalli perdono l'acqua di cristallizzazione e diventano bianchi
  run(m, 300, HOT);
  assert.equal(m.amount('cuso4-5h2o'), 0);
  near(cuTotal(), start, 1e-9, 'il rame si conserva anche seccando');
  const white = m.appearance().solid;
  assert.ok(white[0] > 200 && white[2] > 200, 'solfato anidro bianco');
});

test('reazioni con solidi, gas e calore: zinco e acido, bicarbonato scaldato, etanolo nella fiamma', () => {
  const zn = Mixture.solution(ctx, 'hcl', 1, 20);
  zn.add(Mixture.solid(ctx, 'Zn', 0.5));
  const ev = run(zn, 10);
  assert.ok(zn.grams('Zn') < 0.2, 'lo zinco si consuma');
  assert.ok(ev.some((e) => e.gases.some(([sid]) => sid === ctx.id('H'))), 'si sviluppa idrogeno');
  const soda = Mixture.solid(ctx, 'nahco3', 5);
  run(soda, 60, { heatW: 500, lossWK: 1, containerC: 40, area: 5 });
  assert.ok(soda.grams('na2co3') > 3, 'NaHCO₃ → Na₂CO₃');
  assert.equal(soda.amount('water'), 0, 'l\'acqua prodotta a caldo evapora');
  const eth = Mixture.liquid(ctx, 'etanolo', 20);
  assert.equal(eth.tick(1 / 30, { flame: true }).ignite, ctx.id('etanolo'), 'l\'etanolo prende fuoco nella fiamma');
  const burnt = eth.burn(5, ctx.id('etanolo'));
  assert.ok(burnt > 0 && eth.amount('etanolo') < 20 * 0.789 / 46.07);
});

test('acqua: bolle a 100 °C e il calore in eccesso la fa evaporare', () => {
  const w = Mixture.liquid(ctx, 'water', 100);
  run(w, 30, { heatW: 400, lossWK: 1, containerC: 100, area: 30 });
  near(w.T, 373.15, 0.01, 'non supera 100 °C');
  assert.ok(w.liquidVolume < 99 && w.liquidVolume > 80, `ne evapora un po' (${w.liquidVolume})`);
  run(w, 90, COOL);
  assert.ok(w.T < 330, 'si raffredda');
});

test('travasi: la massa si conserva e il liquido porta con sé i soluti', () => {
  const a = Mixture.solution(ctx, 'cuso4', 0.5, 100);
  const total = a.mass;
  const b = a.take(40);
  near(b.liquidVolume, 40, 0.3, 'volume tolto');
  near(a.mass + b.mass, total, 1e-9, 'massa conservata');
  near(b.molarity('cuso4'), 0.5, 0.01, 'stessa concentrazione');
  const powder = Mixture.solid(ctx, 'nacl', 10);
  const scoop = powder.take(powder.solidVolume / 4);
  near(scoop.grams('nacl'), 2.5, 0.01, 'la polvere si versa a volume');
});

test('rifiuti: ogni miscela ha il suo contenitore', () => {
  assert.equal(wasteClass(Mixture.solution(ctx, 'nacl', 0.1, 50)), 'sink');
  assert.equal(wasteClass(Mixture.solution(ctx, 'hcl', 0.1, 50)), 'inorganic');
  assert.equal(wasteClass(Mixture.solution(ctx, 'cuso4', 0.1, 50)), 'heavy');
  assert.equal(wasteClass(Mixture.liquid(ctx, 'etanolo', 20)), 'organic');
  assert.equal(wasteClass(Mixture.solution(ctx, 'nacl', 3, 50)), 'inorganic', 'troppo concentrata per il lavandino');
  assert.equal(wasteClass(new Mixture(ctx)), null);
  assert.ok(binAccepts('heavy', 'sink'));
  assert.ok(!binAccepts('sink', 'heavy'));
  assert.ok(!binAccepts('organic', 'inorganic'));
});
