// Test della fisica (Rapier), dei liquidi nei contenitori e della valutazione delle esercitazioni: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { loadPhysics, Physics } from '../../src/game/physics.js';
import { interiorSamples, rimPoints, liquidLevel, profileVolume } from '../../src/game/liquid.js';
import { ORDERS, ORDER_BY_ID, grade, score } from '../../src/game/orders.js';
import { createLabChemistry, Mixture } from '../../src/game/mixture.js';

const R = await loadPhysics();
const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);

/** Un becher da 250 mL lasciato cadere da un'altezza: velocità d'urto registrata dalla fisica. */
function drop(height) {
  const ph = new Physics(R);
  ph.box(0, -0.1, 0, 5, 0.1, 5);
  const owner = { def: { breakable: true, mass: 0.1 } };
  const body = ph.dynamic({ pos: { x: 0, y: height, z: 0 }, shapes: [{ type: 'cylinder', hh: 0.0475, r: 0.0345, y: 0.0475 }], mass: 0.1, owner, events: true });
  let max = 0;
  ph.onImpact = (o, force, other, speed) => {
    if (o === owner && force > owner.def.mass * 60) max = Math.max(max, speed);
  };
  for (let i = 0; i < 150; i++) ph.step(1 / 60, [body]);
  return { speed: max, y: body.translation().y };
}

test('fisica: un becher che cade dal bancone si rompe, posato con cura no', () => {
  const fall = drop(0.92);
  assert.ok(fall.speed > 3.3, `dal bancone urta a ${fall.speed} m/s`);
  const gentle = drop(0.05);
  assert.ok(gentle.speed < 3.3, `posato urta a ${gentle.speed} m/s`);
  assert.ok(Math.abs(gentle.y) < 0.01, 'resta appoggiato sul piano');
});

test('fisica: il personaggio cammina e non attraversa i muri', () => {
  const ph = new Physics(R);
  ph.box(0, -0.1, 0, 5, 0.1, 5);
  ph.box(0, 1, -1, 2, 1, 0.1); // muro davanti
  const p = ph.player({ x: 0, y: 0.85, z: 0 }, 0.28, 0.55);
  for (let i = 0; i < 120; i++) {
    p.controller.computeColliderMovement(p.collider, { x: 0, y: -0.01, z: -0.03 });
    const m = p.controller.computedMovement();
    const t = p.body.translation();
    p.body.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
    ph.step(1 / 60, []);
  }
  const z = p.body.translation().z;
  assert.ok(z > -0.9 + 0.27 - 0.03, `si ferma davanti al muro (z = ${z})`);
  assert.ok(z < -0.5, 'ma si è mosso');
});

test('liquidi: volume del profilo, livello orizzontale e versamento inclinando', () => {
  const profile = [[0.033, 0.004], [0.033, 0.095]];
  const capacity = profileVolume(profile) * 1e6;
  assert.ok(Math.abs(capacity - Math.PI * 3.3 ** 2 * 9.1) < 1, `capacità ${capacity} mL`);
  const samples = interiorSamples(profile);
  const rim = rimPoints(profile);
  const m = new THREE.Matrix4();
  // diritto e pieno a metà: il livello è a metà altezza, niente esce
  let l = liquidLevel(samples, rim, m, 0.5);
  assert.ok(Math.abs(l.level - (0.004 + 0.091 / 2)) < 0.004, `livello ${l.level}`);
  assert.equal(l.over, 0);
  // inclinato di 60°: il bordo scende sotto il livello e il liquido esce
  m.makeRotationX(-Math.PI / 3);
  l = liquidLevel(samples, rim, m, 0.5);
  assert.ok(l.level > l.rimY, 'versa');
  assert.ok(l.over > 0.02);
  // poco inclinato (15°): ancora niente
  m.makeRotationX(-Math.PI / 12);
  l = liquidLevel(samples, rim, m, 0.5);
  assert.ok(l.level < l.rimY);
});

test('esercitazioni: ognuna ha preparazione, passi e testi', () => {
  assert.equal(ORDERS.length, 5);
  for (const o of ORDERS) {
    assert.ok(o.setup('real').length >= 3, o.id);
    assert.ok(o.steps('real').length >= 3, o.id);
    assert.ok(o.pay > 0 && o.par > 60);
  }
});

test('valutazione: una soluzione perfetta prende il massimo, una sbagliata no', () => {
  const perfect = Mixture.solution(ctx, 'nacl', 0.5, 100);
  const good = ORDER_BY_ID.nacl.evaluate({ mode: 'real', product: { mixture: perfect } });
  assert.ok(good.quality > 0.95, `qualità ${good.quality}`);
  const weak = Mixture.solution(ctx, 'nacl', 0.3, 100);
  assert.ok(ORDER_BY_ID.nacl.evaluate({ mode: 'real', product: { mixture: weak } }).quality < 0.6);
  // nella modalità semplificata la stessa soluzione è valutata più largamente
  const close = Mixture.solution(ctx, 'nacl', 0.47, 100);
  assert.ok(ORDER_BY_ID.nacl.evaluate({ mode: 'simple', product: { mixture: close } }).quality > ORDER_BY_ID.nacl.evaluate({ mode: 'real', product: { mixture: close } }).quality);
  // con l'acqua del rubinetto c'è una penalità nella modalità realistica
  const tap = Mixture.solution(ctx, 'nacl', 0.5, 100);
  tap.addSpecies(ctx.id('cacl2'), 1e-4, true);
  const tapEv = ORDER_BY_ID.nacl.evaluate({ mode: 'real', product: { mixture: tap } });
  assert.ok(tapEv.lines.some((l) => l.key === 'evTapWater'));
  // titolazione: al punto equivalente con l'indicatore
  const tit = Mixture.solution(ctx, 'hcl', 0.1, 25);
  tit.add(Mixture.of(ctx, [['php', 5e-6]]));
  tit.add(Mixture.solution(ctx, 'naoh', 0.1, 25.2));
  for (let i = 0; i < 60; i++) tit.tick(1 / 30);
  assert.ok(ORDER_BY_ID.titration.evaluate({ mode: 'real', product: { mixture: tit } }).quality > 0.9);
  // saggio alla fiamma: due risposte giuste su tre
  const fl = ORDER_BY_ID.flame.evaluate({ answers: { 0: 'Na', 1: 'K', 2: 'Li' }, unknowns: ['nacl', 'kcl', 'srcl2'] });
  assert.ok(Math.abs(fl.quality - 2 / 3) < 1e-9);
});

test('stelle e soldi: qualità, sicurezza e tempo', () => {
  assert.equal(score(0.01, 0.02, 0.1), 1);
  assert.equal(score(0.2, 0.02, 0.1), 0);
  const best = grade({ quality: 1, elapsed: 100, par: 300, pay: 30 });
  assert.equal(best.stars, 5);
  assert.equal(best.earned, 30);
  const messy = grade({ quality: 1, elapsed: 100, par: 300, pay: 30, mess: 2, incidents: 1 });
  assert.ok(messy.stars < 5);
  const slow = grade({ quality: 1, elapsed: 900, par: 300, pay: 30, costs: 5 });
  assert.equal(slow.stars, 4);
  assert.equal(slow.net, 24 - 5);
  assert.equal(grade({ quality: 0, elapsed: 10, par: 300, pay: 30 }).stars, 1, 'senza preparato restano solo i punti della sicurezza');
});
