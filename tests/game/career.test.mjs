// Test della Carriera (career.js, data/career-exercises.js): dati coerenti, ogni esercitazione risolvibile dalla soluzione
// scritta nei dati, valutazione che distingue un lavoro giusto da uno sbagliato, relazione, reputazione, capitoli,
// libro e negozio. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry, Mixture } from '../../src/game/mixture.js';
import { DEFS } from '../../src/game/items.js';
import { SHELF, CABINET } from '../../src/game/reagents.js';
import { TOOL_PAGES, TECHNIQUE_PAGES, SAFETY_PAGES } from '../../src/game/data/book-pages.js';
import {
  EXERCISES, EXERCISE_BY_ID, CHAPTERS, chapterExercises, runSolution, evaluateExercise, stepsDone, check, mixMeasure,
  pickSamples, answerOptions, answerScore, reportQuestions, reportStars, reputation, repTitle, chapterState, exerciseOpen,
  nextExercise, bookUnlocks, newCareer, recordResult, canBuy, buy, SHOP, gradeExercise, solubilityAt, PASS_STARS,
} from '../../src/game/career.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);
const ex = (id) => EXERCISE_BY_ID.get(id);
const run = (id, mode = 'real', solution = null) => {
  const e = solution ? { ...ex(id), solution } : ex(id);
  return evaluateExercise(e, runSolution(ctx, e, mode), mode);
};

test('Carriera: capitoli 0–4 con almeno 25 esercitazioni, dati coerenti', () => {
  const ids = new Set();
  const pages = new Set([...TOOL_PAGES.map((p) => `tool:${p.id}`), ...TECHNIQUE_PAGES.map((p) => `tech:${p.id}`), ...SAFETY_PAGES.map((p) => `safety:${p.id}`)]);
  for (let ch = 0; ch <= 4; ch++) assert.ok(chapterExercises(ch).length >= 5, `capitolo ${ch}`);
  assert.ok(EXERCISES.filter((e) => e.chapter <= 4).length >= 25);
  for (const e of EXERCISES) {
    assert.ok(!ids.has(e.id), `doppia: ${e.id}`);
    ids.add(e.id);
    assert.ok(CHAPTERS[e.chapter], e.id);
    assert.ok(e.pay > 0 && e.par >= 60, e.id);
    assert.ok(e.steps.length >= 2 && e.goals.length >= 1, e.id);
    for (const s of e.setup) {
      if (s.reagent) assert.ok(SHELF[s.reagent] || CABINET[s.reagent], `${e.id}: reagente ${s.reagent}`);
      else if (s.kind) assert.ok(DEFS[s.kind], `${e.id}: oggetto ${s.kind}`);
      if (s.sample !== undefined) assert.ok(e.samples, `${e.id}: campioni`);
    }
    for (const p of e.book ?? []) assert.ok(pages.has(p), `${e.id}: pagina ${p}`);
    for (const r of e.report ?? []) assert.ok(r.a >= 0 && r.a < r.opts.length && r.opts.length >= 3, `${e.id}: ${r.q}`);
    assert.ok((e.report ?? []).length >= 2, `${e.id}: relazione`);
    if (e.answers) assert.notEqual(e.deliver, 'tray', `${e.id}: le risposte si danno con il campanello`);
  }
});

test('Carriera: ogni esercitazione si risolve con la soluzione dei dati (motore dei contenitori), in tutte e due le chimiche', () => {
  for (const e of EXERCISES) {
    for (const mode of ['real', 'simple']) {
      const s = runSolution(ctx, e, mode);
      const ev = evaluateExercise(e, s, mode);
      assert.ok(ev.quality >= 0.9, `${e.id} (${mode}): qualità ${ev.quality.toFixed(2)} ${JSON.stringify(ev.lines.map((l) => [l.key, l.ok]))}`);
      assert.ok(stepsDone(e, s, mode).every(Boolean), `${e.id} (${mode}): passi non tutti fatti`);
    }
  }
});

test('Carriera: un lavoro sbagliato prende poco, la chimica semplificata è più larga', () => {
  // soluzione di NaCl troppo diluita, o con l'acqua del rubinetto
  assert.ok(run('nacl', 'real', [['A', 'add', { solid: ['nacl', 1.75] }], ['A', 'fill', 100], ['A', 'wait', 30], ['deliver', 'A']]).quality < 0.6);
  const tap = run('nacl', 'real', [['A', 'add', { solid: ['nacl', 2.922] }], ['A', 'add', { solid: ['cacl2', 0.01] }], ['A', 'fill', 100], ['A', 'wait', 30], ['deliver', 'A']]);
  assert.ok(tap.lines.some((l) => l.key === 'evTapWater'));
  const close = [['A', 'add', { solid: ['nacl', 2.75] }], ['A', 'fill', 100], ['A', 'wait', 30], ['deliver', 'A']];
  assert.ok(run('nacl', 'simple', close).quality > run('nacl', 'real', close).quality);
  // niente preparato sul vassoio
  assert.equal(run('nacl', 'real', [['A', 'add', { water: 100 }]]).quality, 0);
  // acqua rovesciata per strada
  assert.ok(run('carry', 'real', [['A', 'add', { water: 70 }], ['deliver', 'A']]).quality < 0.3);
  // pesata sbagliata
  assert.ok(run('weigh2', 'real', [['ev', 'tare', 1], ['A', 'add', { solid: ['nacl', 1.5] }], ['deliver', 'A']]).quality < 0.5);
  // titolazione senza indicatore: il voto si dimezza
  const noInd = run('titration', 'real', [['A', 'add', { solution: ['hcl', 0.1, 25] }], ['A', 'reagent', 'naoh01', 25.1], ['A', 'wait', 5], ['deliver', 'A']]);
  assert.ok(noInd.quality < 0.5 && noInd.lines.some((l) => l.key === 'evIndicator' && l.ok === false));
  // pioggia d'oro con troppo ioduro: eccesso
  const excess = run('goldrain', 'real', [['A', 'add', { solution: ['pbno32', 0.1, 10] }], ['A', 'reagent', 'ki01', 60], ['A', 'wait', 10], ['deliver', 'A']]);
  assert.ok(excess.quality < 0.85 && excess.lines.some((l) => l.key === 'evExcess' && l.ok !== true));
  // filtrazione dimenticata: il solfato di bario è nel liquido consegnato
  assert.ok(run('filterBa', 'real', [['A', 'reagent', 'bacl2', 20], ['A', 'reagent', 'na2so4', 25], ['A', 'wait', 10], ['deliver', 'A']]).quality < 0.6);
  // acqua di calce con troppa CO₂: il carbonato torna bicarbonato e la torbidità sparisce
  assert.ok(run('limewater', 'real', [['A', 'reagent', 'limewater', 50], ['A', 'gas', 'co2', 30], ['A', 'wait', 10], ['deliver', 'A']]).quality < 0.5);
  // fuoco non spento con l'estintore
  assert.ok(run('fireDrill', 'real', [['state', 'fires', 0], ['deliver', null]]).quality < 0.5);
});

test('Carriera: risposte a scelta e numeriche', () => {
  // campioni: uno per risposta e in ordine casuale (pH: acido, neutro, basico)
  const s = pickSamples(ex('phTest'), () => 0.3);
  assert.deepEqual(s.map((x) => x.answer).sort(), ['acid', 'basic', 'neutral']);
  assert.deepEqual(answerOptions(ex('flame')).sort(), ['Ba', 'Ca', 'Cu', 'K', 'Li', 'Na', 'Sr']);
  // risposte sbagliate: 0; numeri con la tolleranza (densità, aceto)
  const wrong = evaluateExercise(ex('halides'), { mode: 'real', unknowns: pickSamples(ex('halides')), answers: { 0: 'Cl', 1: 'Cl', 2: 'Cl' }, ev: {} });
  assert.ok(Math.abs(wrong.quality - 1 / 3) < 1e-9);
  const vin = ex('vinegar');
  assert.equal(answerScore(vin, [], { 0: '0,8' }, 0, 'real'), 1);
  assert.equal(answerScore(vin, [], { 0: '0,80' }, 0, 'real'), 1);
  assert.ok(answerScore(vin, [], { 0: '0,7' }, 0, 'real') < 0.7);
  assert.ok(answerScore(vin, [], { 0: '0,7' }, 0, 'simple') > answerScore(vin, [], { 0: '0,7' }, 0, 'real'));
  assert.equal(answerScore(vin, [], { 0: 'boh' }, 0, 'real'), 0);
  // la densità giusta è quella del liquido del campione (etanolo 0,79, glicerolo 1,26)
  const den = runSolution(ctx, ex('density'), 'real', () => 0);
  assert.ok(den.unknowns[0].value > 0.7 && den.unknowns[0].value < 1.3);
});

test('Carriera: misure sulle miscele e condizioni dei passi', () => {
  const m = Mixture.solution(ctx, 'nacl', 0.5, 100);
  assert.ok(Math.abs(mixMeasure(m, 'molar:nacl') - 0.5) < 1e-6);
  assert.ok(Math.abs(mixMeasure(m, 'volume') - 100) < 0.5);
  const sat = Mixture.liquid(ctx, 'water', 50);
  sat.add(Mixture.solid(ctx, 'nacl', 25));
  for (let i = 0; i < 300; i++) sat.tick(0.2, { stir: 1 });
  assert.equal(mixMeasure(sat, 'saturation:nacl'), 1);
  assert.ok(mixMeasure(sat, 'undissolved:nacl') > 5);
  assert.ok(Math.abs(solubilityAt('nacl', 293.15) - 35.9) < 1e-6);
  // condizioni: un contenitore che soddisfa tutto, quanti, nessuno, soglie per modalità
  const s = { mode: 'real', containers: [{ kind: 'beaker100', mix: m }, { kind: 'cylinder100', mix: Mixture.liquid(ctx, 'water', 50) }], ev: { tare: 1 } };
  assert.ok(check(s, { any: [{ kind: 'cylinder100' }, { m: 'volume', min: 49, max: 51 }] }));
  assert.ok(!check(s, { any: [{ kind: 'beaker100' }, { m: 'volume', max: 51 }] }));
  assert.ok(check(s, { count: [{ m: 'volume', min: 40 }], min: 2 }));
  assert.ok(check(s, { none: [{ m: 'grams:agcl', min: 0.001 }] }));
  assert.ok(check(s, { m: '$ev:tare', min: 1 }));
  assert.ok(check({ ...s, mode: 'simple' }, { any: [{ m: 'volume', min: { real: 99, simple: 45 } }] }));
  assert.ok(!check(s, { any: [{ kind: 'cylinder100' }, { m: 'volume', min: { real: 99, simple: 45 } }] }));
  // i passi fatti restano fatti; uno dopo spunta anche quelli prima
  const e = ex('weigh2');
  const done = stepsDone(e, { mode: 'real', containers: [{ mix: Mixture.solid(ctx, 'nacl', 2) }], ev: {} }, 'real');
  assert.deepEqual(done, [true, true, false], 'il sale pesato vuol dire che la tara c\'era');
  assert.deepEqual(stepsDone(e, { mode: 'real', containers: [], ev: {} }, 'real', done), done);
});

test('Carriera: relazione di laboratorio', () => {
  const qs = reportQuestions(ex('nacl'), () => 0.7);
  assert.equal(qs.length, 2);
  for (const [i, q] of qs.entries()) assert.equal(q.opts[q.right], ex('nacl').report[i].opts[ex('nacl').report[i].a], 'mescolate, la giusta segue');
  assert.equal(reportStars(2, 2), 1);
  assert.equal(reportStars(1, 2), 0.5);
  assert.equal(reportStars(0, 3), 0);
  const g = gradeExercise(ex('nacl'), { quality: 1, elapsed: 100, mess: 0, incidents: 0, wrongBins: 0, costs: 1, reportRight: 2, reportTotal: 2 });
  assert.equal(g.stars, 5, 'le stelle della relazione si fermano a 5');
  const h = gradeExercise(ex('nacl'), { quality: 0.6, elapsed: 100, mess: 0, incidents: 0, wrongBins: 0, costs: 1, reportRight: 2, reportTotal: 2 });
  assert.equal(h.stars, h.base + 1);
});

test('Carriera: reputazione, capitoli aperti, libro', () => {
  let c = newCareer();
  assert.equal(reputation(c), 0);
  assert.equal(repTitle(0), 'freshman');
  assert.equal(chapterState(c, 0), 'open');
  assert.equal(chapterState(c, 1), 'locked');
  assert.equal(chapterState(c, 6), 'soon', 'capitoli senza esercitazioni: in arrivo');
  // nel capitolo le esercitazioni si aprono una dopo l'altra
  const ch0 = chapterExercises(0);
  assert.ok(exerciseOpen(c, ch0[0].id) && !exerciseOpen(c, ch0[1].id));
  assert.equal(nextExercise(c).id, ch0[0].id);
  // superato il capitolo 0 con 2 stelle ciascuna: +1 di reputazione a esercitazione
  for (const e of ch0) c = recordResult(c, e.id, { stars: PASS_STARS, report: 0, money: 10, incidents: 0 });
  assert.equal(reputation(c), ch0.length);
  assert.equal(chapterState(c, 1), reputation(c) >= CHAPTERS[1].rep ? 'open' : 'locked');
  assert.equal(chapterState(c, 1), 'open');
  // gli incidenti tolgono reputazione; i risultati migliori restano
  const worse = recordResult(c, ch0[0].id, { stars: 1, report: 0, money: 12, incidents: 2 });
  assert.equal(worse.results[ch0[0].id].stars, PASS_STARS);
  assert.equal(reputation(worse), reputation(c) - 4);
  // libro: sicurezza e pagine dei capitoli aperti; ricette acido-base solo dal capitolo 2
  const u = bookUnlocks(c);
  assert.ok(u.pages.has('safety:ghs') && u.pages.has('tool:balance') && u.pages.has('tech:dilute'));
  assert.ok(!u.pages.has('tool:burette') && !u.groups.has('acidi-basi'));
  assert.equal(u.chapterOf.get('group:acidi-basi'), 2);
  for (const e of chapterExercises(1)) c = recordResult(c, e.id, { stars: 5, report: 2, money: 50, incidents: 0 });
  assert.ok(reputation(c) >= CHAPTERS[2].rep);
  assert.equal(chapterState(c, 2), 'open');
  assert.ok(bookUnlocks(c).groups.has('acidi-basi'));
  assert.ok(reputation({ results: Object.fromEntries(EXERCISES.map((e) => [e.id, { stars: 5, report: 3 }])) }) === 100);
});

test('Carriera: negozio', () => {
  let c = { ...newCareer(), money: 70 };
  assert.ok(canBuy(c, 'balancePro'));
  assert.ok(!canBuy(c, 'cabinetKey'), 'non bastano i soldi');
  c = buy(c, 'balancePro');
  assert.equal(c.money, 10);
  assert.deepEqual(c.owned, ['balancePro']);
  assert.equal(buy(c, 'balancePro'), null, 'già comprato');
  assert.ok(SHOP.every((x) => x.price > 0));
});
