// Test del versamento (portata con zona morta e tetto, punto d'arrivo e raggio del getto), delle pozze e dei solidi
// (angolo di riposo nel recipiente, mucchietto conico). npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { pourRate, ballisticLanding, streamRadius, POUR_DEAD, liquidLevel, reposeNormal, heapSize, REPOSE } from '../../src/game/liquid.js';
import { DEFS } from '../../src/game/items.js';
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

test('solidi: la superficie segue il recipiente fino all\'angolo di riposo, poi scivola', () => {
  const deg = (n) => (Math.atan2(Math.hypot(n[0], n[2]), n[1]) * 180) / Math.PI;
  assert.deepEqual(reposeNormal([0, 1, 0]), [0, 1, 0]);
  const t20 = [Math.sin(0.35), Math.cos(0.35), 0];
  assert.deepEqual(reposeNormal(t20), t20, 'a 20° resta inclinata con il recipiente');
  const t60 = reposeNormal([Math.sin(1.05), Math.cos(1.05), 0]);
  assert.ok(Math.abs(deg(t60) - 35) < 1e-9 && t60[0] > 0 && t60[2] === 0, 'a 60° scivola fino a 35°, dalla stessa parte');
  const down = reposeNormal([0, -1, 0]);
  assert.ok(Math.abs(deg(down) - 35) < 1e-9, 'capovolto: resta l\'angolo di riposo');
  assert.ok(Math.abs(REPOSE - (35 * Math.PI) / 180) < 1e-12);
});

test('solidi: nel recipiente inclinato non si livellano e non escono prima di 35°', () => {
  const def = DEFS.beaker250;
  const tilt = (a) => new THREE.Matrix4().makeRotationZ(a);
  const axis = (a) => [-Math.sin(a), Math.cos(a), 0];
  const up = liquidLevel(def.samples, def.rim, tilt(0), 0.6);
  // con la normale lungo l'asse del recipiente il livello è quello del recipiente dritto
  const solid30 = liquidLevel(def.samples, def.rim, tilt(0.52), 0.6, reposeNormal(axis(0.52)));
  assert.ok(Math.abs(solid30.level - up.level) < 1e-6, `${solid30.level} ≠ ${up.level}`);
  assert.ok(solid30.level - solid30.rimY < 0, 'a 30° la polvere resta dentro');
  // un liquido allo stesso riempimento e alla stessa inclinazione è molto più vicino al bordo
  const liquid30 = liquidLevel(def.samples, def.rim, tilt(0.52), 0.6);
  assert.ok(liquid30.level - liquid30.rimY > solid30.level - solid30.rimY + 0.005);
  // il cumulo scivola verso la bocca con la pendenza di 35°: un becher pieno al 60 % versa la polvere oltre i 90°
  const at = (deg) => {
    const a = (deg * Math.PI) / 180;
    const l = liquidLevel(def.samples, def.rim, tilt(a), 0.6, reposeNormal(axis(a)));
    return l.level - l.rimY;
  };
  assert.ok(at(80) < 0 && at(100) > 0.005, `80°: ${at(80)}, 100°: ${at(100)}`);
});

test('solidi: un mucchietto versato è un cono con l\'angolo di riposo', () => {
  const { r, h } = heapSize(1);
  assert.ok(Math.abs(r - 0.0111) < 0.0003, `r = ${r}`);
  assert.ok(Math.abs(h / r - Math.tan(REPOSE)) < 1e-9);
  assert.ok(Math.abs((Math.PI * r * r * h) / 3 - 1e-6) < 1e-12, 'il volume torna');
  assert.equal(heapSize(0).r, 0);
  assert.ok(heapSize(8).r < 2.01 * heapSize(1).r, 'otto volte il volume, il doppio del raggio');
});
