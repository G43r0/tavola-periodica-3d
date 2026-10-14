// Test del versamento (portata con zona morta e tetto, punto d'arrivo e raggio del getto) e delle pozze. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pourRate, ballisticLanding, streamRadius, POUR_DEAD } from '../../src/game/liquid.js';
import { puddleState, STAIN_G } from '../../src/game/effects.js';

const R = 0.033; // becher da 250 mL

test('portata: sotto la zona morta non esce niente, poi cresce come uno stramazzo', () => {
  assert.equal(pourRate({ h: 0.0004, R }), 0);
  assert.equal(pourRate({ h: -0.01, R }), 0);
  assert.ok(pourRate({ h: POUR_DEAD * 1.01, R }) > 0);
  const q3 = pourRate({ h: 0.003, R });
  assert.ok(q3 > 7 && q3 < 9, `3 mm: ${q3} mL/s`);
  const q10 = pourRate({ h: 0.01, R });
  assert.ok(q10 > 80 && q10 < 88, `1 cm: ${q10} mL/s`);
});

test('portata: al massimo 150 · flow mL/s, e non diminuisce mai al crescere del carico', () => {
  assert.equal(pourRate({ h: 0.05, R }), 150);
  assert.equal(pourRate({ h: 0.05, R, flow: 0.45 }), 150 * 0.45);
  let prev = 0;
  for (let mm = 0; mm <= 50; mm++) {
    const q = pourRate({ h: mm / 1000, R });
    assert.ok(q >= prev - 1e-9, `${mm} mm`);
    prev = q;
  }
  assert.ok(pourRate({ h: 0.01, R, powder: true }) < pourRate({ h: 0.01, R }));
  assert.equal(pourRate({ h: 0.05, R, overfull: true }), 190);
});

test('getto: punto d\'arrivo balistico e raggio dalla continuità', () => {
  const l = ballisticLanding({ x: 0, y: 1.12, z: 0 }, 0.3, 0, 0.92);
  assert.ok(Math.abs(l.t - 0.2019) < 0.001, `t = ${l.t}`);
  assert.ok(Math.abs(l.x - 0.0606) < 0.001, `x = ${l.x}`);
  assert.equal(l.z, 0);
  const r = streamRadius(8e-6, 0.3);
  assert.ok(Math.abs(r - 0.0029) < 0.0001, `r = ${r}`);
  assert.equal(streamRadius(1e-9, 0.3), 0.0008);
  assert.equal(streamRadius(1, 0.3), 0.005);
});

test('pozze: evaporando lasciano un alone se resta abbastanza residuo secco', () => {
  assert.equal(puddleState(12, 0, 0.3), 'wet', 'acqua salata: ancora una pozza');
  assert.equal(puddleState(0.01, 0.2, 0.3), 'stain', 'evaporata: resta il sale');
  assert.equal(puddleState(0.01, 0.001, 0.004), 'gone', 'acqua distillata o del rubinetto: non resta niente');
  assert.equal(puddleState(0, 0.05, STAIN_G), 'stain');
  assert.equal(puddleState(0, 0.005, 0.2), 'gone', 'sotto 0,01 mL sparisce comunque');
});
