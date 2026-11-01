// Banco del laboratorio conservato tra una sessione e l'altra (ricaricando o cambiando lingua o grafica). npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveBench, loadBench, BENCH_KEY } from '../../src/lab/bench-store.js';

const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    m,
  };
};
const water = {
  atoms: [
    { id: 1, z: 8, pos: [0, 0, 0], extra: 0 },
    { id: 2, z: 1, pos: [0.96, 0, 0], extra: 0 },
    { id: 3, z: 1, pos: [-0.24, 0.93, 0], extra: 0 },
  ],
  bonds: [
    { id: 4, a: 1, b: 2, order: 1, ionic: false, transfer: 0, donor: null },
    { id: 5, a: 1, b: 3, order: 1, ionic: false, transfer: 0, donor: null },
  ],
};

test('banco: si salva e si ritrova uguale', () => {
  const s = memory();
  saveBench(s, water);
  assert.ok(s.m.has(BENCH_KEY));
  assert.deepEqual(loadBench(s), water);
});

test('banco vuoto: niente da ritrovare (e il salvataggio vecchio si cancella)', () => {
  const s = memory();
  saveBench(s, water);
  saveBench(s, { atoms: [], bonds: [] });
  assert.equal(loadBench(s), null);
});

test('banco rovinato o senza archivio: si riparte da un banco vuoto senza errori', () => {
  const s = memory();
  s.setItem(BENCH_KEY, '{rotto');
  assert.equal(loadBench(s), null);
  s.setItem(BENCH_KEY, JSON.stringify({ atoms: [{ id: 1, z: 'x', pos: [0, 0] }], bonds: [] }));
  assert.equal(loadBench(s), null);
  s.setItem(BENCH_KEY, JSON.stringify({ atoms: water.atoms, bonds: [{ id: 9, a: 1, b: 77, order: 1 }] }));
  assert.equal(loadBench(s), null, "legame verso un atomo che non c'è");
  assert.equal(loadBench(null), null);
  const broken = {
    getItem() {
      throw new Error('bloccato');
    },
    setItem() {
      throw new Error('pieno');
    },
    removeItem() {},
  };
  assert.doesNotThrow(() => saveBench(broken, water));
  assert.equal(loadBench(broken), null);
});
