// Test della spatola: dosi prese dal barattolo, colpetti e versamento lento per arrivare alla massa voluta. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoopGrams, tapGrams, trickleRate, spoonHeap, TRICKLE_HOLD_MS } from '../../src/game/spatula.js';
import { legendRows } from '../../src/game/controls.js';

const lo = () => 0;
const hi = () => 0.999999;

test('dosi: in modalità semplice esatte, in quella reale vicine a 1 g e 0,1 g', () => {
  assert.equal(scoopGrams('simple', false, lo), 1);
  assert.equal(scoopGrams('simple', true, hi), 0.1);
  for (const r of [lo, hi, () => 0.5]) {
    const g = scoopGrams('real', false, r);
    assert.ok(g >= 0.95 && g <= 1.05, `cucchiaino ${g}`);
    const p = scoopGrams('real', true, r);
    assert.ok(p >= 0.08 && p <= 0.12, `pizzico ${p}`);
  }
});

test('colpetti: pochi centesimi di grammo, abbastanza fini per la tolleranza dell\'1 % su 2 g', () => {
  for (const r of [lo, hi]) {
    const g = tapGrams('real', r);
    assert.ok(g >= 0.015 && g <= 0.03, `${g} g`);
  }
  assert.equal(tapGrams('simple'), 0.02);
  // 2 g ± 1 %: da 1,95 g a colpi da 0,03 g si arriva dentro la tolleranza senza superarla
  let m = 1.95;
  while (m < 1.98) m += tapGrams('real', hi);
  assert.ok(m <= 2.02, `${m} g`);
});

test('versamento lento: parte piano, accelera finché si tiene premuto, con un tetto', () => {
  assert.equal(trickleRate(0), 0.04);
  assert.ok(trickleRate(1) > trickleRate(0.5));
  assert.equal(trickleRate(10), 0.5);
  // nel primo mezzo secondo cadono meno di 4 centesimi: lasciando il tasto in tempo ci si ferma sulla massa voluta
  let g = 0;
  for (let t = 0; t < 0.5; t += 1 / 60) g += trickleRate(t) / 60;
  assert.ok(g < 0.04, `${g} g`);
  assert.ok(TRICKLE_HOLD_MS >= 150 && TRICKLE_HOLD_MS <= 300);
});

test('mucchietto nel cucchiaio: cresce con la massa, senza sparire per un pizzico', () => {
  const p = spoonHeap(0.1);
  const c = spoonHeap(1);
  assert.ok(p.xz > 0.5 && p.xz < 0.75 && p.y > 0.15);
  assert.ok(c.xz > p.xz && c.y > p.y);
  assert.equal(spoonHeap(5).xz, 1);
});

test('legenda: con la spatola carica sul recipiente, tutto, piano o a colpetti', () => {
  const vessel = { type: 'item', container: true };
  const rows = legendRows({ mode: 'walk', held: { kind: 'spatula', container: false, loaded: true }, target: vessel });
  const keys = rows.map((r) => r.key);
  for (const k of ['lgSpatulaDrop', 'lgSpatulaTrickle', 'lgSpatulaTap']) assert.ok(keys.includes(k), k);
  assert.deepEqual(rows.find((r) => r.key === 'lgSpatulaTap').keys, ['shift', 'e']);
  const away = legendRows({ mode: 'walk', held: { kind: 'spatula', container: false, loaded: true }, target: null });
  assert.equal(away.find((r) => r.key === 'lgSpatulaTrickle').off, true);
});
