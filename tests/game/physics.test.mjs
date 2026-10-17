// Test della fisica (Rapier), dei liquidi nei contenitori e della valutazione delle esercitazioni: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { loadPhysics, Physics } from '../../src/game/physics.js';
import { interiorSamples, rimPoints, liquidLevel, profileVolume } from '../../src/game/liquid.js';
import { grade, score } from '../../src/game/orders.js';
import { createLabChemistry, Mixture } from '../../src/game/mixture.js';
import { LAYOUT, BENCH_Y, STOOL } from '../../src/game/room.js';

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

/**
 * Il corridoio tra i banconi A e B con i due sgabelli (come in room.js) e il giocatore alla partenza (0,15; 0,4).
 * Cammina per `seconds` verso `dirX` a passo di fotogramma (1/60 s) e restituisce dove arriva e gli sgabelli.
 */
function corridor(dirX, seconds = 4, { z = 0.4, beaker = false } = {}) {
  const ph = new Physics(R);
  ph.box(0, -0.1, 0, 6, 0.1, 6);
  for (const b of [LAYOUT.benchA, LAYOUT.benchB]) {
    ph.box(b.x, (BENCH_Y - 0.04) / 2, b.z, b.w / 2, (BENCH_Y - 0.04) / 2, b.d / 2);
    ph.box(b.x, BENCH_Y - 0.02, b.z, b.w / 2 + 0.02, 0.02, b.d / 2 + 0.02);
  }
  const stools = LAYOUT.stools.map((s) => ph.prop({ x: s.x, z: s.z, ...STOOL }));
  const glass = beaker ? ph.dynamic({ pos: { x: 0.6 * dirX, y: 0, z }, shapes: [{ type: 'cylinder', hh: 0.0475, r: 0.0345, y: 0.0475 }], mass: 0.1 }) : null;
  const p = ph.player({ x: 0.15, y: 0.85, z }, 0.28, 0.55);
  const dt = 1 / 60;
  let vy = 0;
  for (let i = 0; i < seconds / dt; i++) {
    vy = p.controller.computedGrounded() ? -0.5 : vy - 9.81 * dt;
    const m = ph.moveCharacter(p, { x: 2.1 * dirX * dt, y: vy * dt, z: 0 }, dt);
    const t = p.body.translation();
    p.body.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
    ph.step(dt, []);
  }
  return { x: p.body.translation().x, stools, glass };
}

test('stanza: gli sgabelli non chiudono il corridoio tra i banconi (il giocatore esce da entrambi i lati)', () => {
  for (const dir of [1, -1]) {
    const { x, stools } = corridor(dir);
    assert.ok(Math.abs(x) > 1.9, `verso ${dir > 0 ? 'est' : 'ovest'} si ferma a x = ${x.toFixed(2)}`);
    // gli sgabelli spinti restano dritti (girano solo attorno alla verticale)
    for (const s of stools) {
      const r = s.rotation();
      assert.ok(Math.hypot(r.x, r.z) < 0.01, 'sgabello ribaltato');
    }
  }
  // anche rasente al bancone A, dove lo sgabello è sulla strada: lo spinge e passa
  assert.ok(corridor(1, 4, { z: 0.38 }).x > 1.9);
});

test('stanza: il giocatore spinge uno sgabello a passo d\'uomo, ma passa attraverso la vetreria a terra', () => {
  const { stools } = corridor(1, 1.5, { z: 0.3 });
  const moved = stools[1].translation();
  // spinto in avanti, non scagliato via (la velocità trasferita è quella del giocatore, non il doppio)
  assert.ok(moved.x > LAYOUT.stools[1].x + 0.2, `sgabello a x = ${moved.x.toFixed(2)}`);
  assert.ok(moved.x < 0.15 + 2.1 * 1.5 + 0.6, `sgabello troppo lontano: x = ${moved.x.toFixed(2)}`);
  const { glass } = corridor(1, 1, { beaker: true });
  const g = glass.translation();
  assert.ok(Math.hypot(g.x - 0.6, g.z - 0.4) < 0.001, 'il becher a terra non viene calciato via');
});

test('posa: punto d\'appoggio vero sul bancone e sovrapposizioni con gli altri oggetti', () => {
  const ph = new Physics(R);
  ph.box(0, 0.46, 0, 1, 0.46, 0.5);
  const foot = { r: 0.0345, hh: 0.0475 };
  const other = ph.dynamic({ pos: { x: 0.2, y: 0.92, z: 0 }, shapes: [{ type: 'cylinder', hh: 0.0475, r: 0.0345, y: 0.0475 }], mass: 0.1 });
  ph.step(1 / 60, [other]); // le interrogazioni vedono i collisori dopo il primo passo
  const rest = ph.restHeight(foot, 0, 0, 1.3);
  assert.ok(Math.abs(rest.y - 0.9675) < 0.003, `centro a riposo a ${rest.y}`);
  assert.ok(rest.normal.y > 0.99 && !rest.collider.parent(), 'piano orizzontale e statico');
  const onTop = ph.restHeight(foot, 0.2, 0, 1.3);
  assert.ok(onTop.collider.parent()?.isDynamic(), 'sopra un becher l\'appoggio è un oggetto mobile');
  assert.equal(ph.overlaps(foot, { x: 0.2, y: 0.9675, z: 0 }), true);
  assert.equal(ph.overlaps(foot, { x: 0.3, y: 0.9675, z: 0 }), false, 'a 10 cm non tocca, e il piano sotto non conta');
  assert.equal(ph.overlaps(foot, { x: 0.2, y: 0.9675, z: 0 }, { exclude: other }), false);
  const spatula = { hx: 0.1, hh: 0.002, hz: 0.006 };
  const rot = { x: 0, y: Math.sin(Math.PI / 4), z: 0, w: Math.cos(Math.PI / 4) };
  assert.equal(ph.overlaps(spatula, { x: 0.2, y: 0.925, z: 0.12 }), false, 'spatola lungo x accanto al becher');
  assert.equal(ph.overlaps(spatula, { x: 0.2, y: 0.925, z: 0.12 }, { rot }), true, 'girata di 90° ci passa sopra');
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
