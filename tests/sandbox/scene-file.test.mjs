// Scene della sandbox su file e nel salvataggio automatico: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSubstances, WATER, WALL } from '../../src/sandbox/substances.js';
import { World } from '../../src/sandbox/world.js';
import { encodeScene, decodeScene, SCENE_KIND, autosaveScene, restoreAutosave, AUTOSAVE_KEY } from '../../src/sandbox/scene-file.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const subs = createSubstances(elements);
const KEYS = ['type', 'temp', 'life', 'ctype', 'flags', 'seed', 'vx', 'vy', 'spark'];

function scene() {
  const w = new World(subs, 160, 90);
  for (let x = 10; x < 150; x++) w.paint(x, 85, 0, WALL);
  for (let y = 60; y < 85; y++) for (let x = 40; x < 120; x++) w.paint(x, y, 0, WATER);
  w.paint(80, 30, 3, subs.byKey.get('nacl').id, { powder: true });
  w.heat(80, 80, 10, 300);
  for (let k = 0; k < 40; k++) w.step();
  return w;
}

test('scena: salvata in JSON e riaperta è identica, cella per cella', () => {
  const w = scene();
  const text = JSON.stringify(encodeScene(w, subs));
  const snap = decodeScene(JSON.parse(text), subs);
  const other = new World(subs, snap.W, snap.H);
  assert.equal(other.restore(snap), true);
  for (const k of KEYS) assert.deepEqual(other[k], w[k], k);
  assert.deepEqual(other.particles, w.particles);
});

test('scena: le celle uguali vicine si comprimono (una scena vuota pesa poco)', () => {
  const empty = JSON.stringify(encodeScene(new World(subs, 400, 225), subs));
  assert.ok(empty.length < 3000, `${empty.length} caratteri`);
  assert.equal(JSON.parse(empty).kind, SCENE_KIND);
});

test('scena: file di un altro tipo, di un\'altra tabella di sostanze o rovinato non si apre', () => {
  const good = encodeScene(scene(), subs);
  assert.throws(() => decodeScene({ ...good, kind: 'altro' }, subs), /kind/);
  assert.throws(() => decodeScene({ ...good, table: 'deadbeef' }, subs), /table/);
  assert.throws(() => decodeScene({ ...good, W: 0 }, subs), /size/);
  assert.throws(() => decodeScene({ ...good, arrays: { ...good.arrays, type: [1, 5] } }, subs), /data/);
  assert.throws(() => decodeScene(null, subs), /kind/);
});

test('salvataggio automatico: la scena dell\'ultima volta torna; archivio rotto o pieno non dà errori', () => {
  const m = new Map();
  const storage = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  const w = scene();
  assert.equal(autosaveScene(storage, w, subs), true);
  const snap = restoreAutosave(storage, subs);
  assert.equal(snap.W, w.W);
  assert.deepEqual(snap.type, w.type);
  m.set(AUTOSAVE_KEY, '{rotto');
  assert.equal(restoreAutosave(storage, subs), null);
  const full = { getItem() { throw new Error('no'); }, setItem() { throw new Error('QuotaExceededError'); }, removeItem() {} };
  assert.equal(autosaveScene(full, w, subs), false);
  assert.equal(restoreAutosave(full, subs), null);
  assert.equal(restoreAutosave(null, subs), null);
});
