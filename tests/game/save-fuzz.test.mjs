// Salvataggi rovinati a caso: qualunque cosa ci sia in localStorage o nel file dell'app, il simulatore apre sempre un
// profilo valido e niente lancia. Il generatore è riproducibile (seme fisso): un fallimento si ripete uguale. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { migrate, isValidSave, activeProfile } from '../../src/game/save.js';
import { CHAPTERS, chapterState, nextExercise, reputation, bookUnlocks, exerciseOpen } from '../../src/game/career.js';
import { loadNotebook } from '../../src/game/notebook.js';

const NOW = '2026-11-05T12:00:00.000Z';
const dir = new URL('../fixtures/salvataggi/', import.meta.url);
const FIXTURES = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));

/** mulberry32: numeri casuali riproducibili. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const JUNK = [
  null,
  undefined,
  true,
  false,
  0,
  -1,
  1e308,
  -1e308,
  NaN,
  Infinity,
  0.5,
  '',
  'x',
  '5',
  'x'.repeat(5000),
  '\u0000\u001b[31m',
  [],
  [1, 2, 3],
  {},
  { stars: 'tante' },
  { __proto__: null, a: 1 },
  JSON.parse('{"__proto__": {"stars": 5, "polluted": true}}'),
  // String() e Number() di questo oggetto lanciano: JSON lo può scrivere
  JSON.parse('{"toString": 1, "valueOf": {}}'),
];

/** Tutti i percorsi (chiavi) dell'albero, radice compresa. */
function paths(value, prefix = [], out = []) {
  out.push(prefix);
  if (value && typeof value === 'object')
    for (const k of Object.keys(value)) if (out.length < 400) paths(value[k], [...prefix, k], out);
  return out;
}
const at = (obj, p) => p.reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** Da uno a sei danni a caso: chiavi tolte o pericolose, valori di tipo sbagliato, liste troncate o annidate. */
function damage(original, r) {
  let obj = structuredClone(original);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const n = 1 + Math.floor(r() * 6);
  for (let i = 0; i < n; i++) {
    const p = pick(paths(obj));
    const junk = pick(JUNK);
    if (!p.length) {
      obj = r() < 0.5 ? structuredClone(junk) : [obj];
      continue;
    }
    const parent = at(obj, p.slice(0, -1));
    const key = p.at(-1);
    if (!parent || typeof parent !== 'object') continue;
    const kind = r();
    if (kind < 0.25) delete parent[key];
    else if (kind < 0.6) parent[key] = structuredClone(junk);
    else if (kind < 0.7) parent[key] = [parent[key]];
    else if (kind < 0.8 && Array.isArray(parent[key])) parent[key].length = Math.floor(r() * parent[key].length);
    // chiavi pericolose solo negli oggetti: JSON non dà mai nomi agli elementi di un array
    else if (kind < 0.9 && !Array.isArray(parent))
      Object.defineProperty(parent, pick(['__proto__', 'constructor', 'prototype', 'toString']), {
        value: structuredClone(pick(JUNK)),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    else parent[key] = { [key]: parent[key] };
  }
  return obj;
}

/** Il simulatore usa il salvataggio aperto: menu della Carriera, mappa, libro e quaderno non devono lanciare. */
function useLikeTheGame(save) {
  const p = activeProfile(save);
  const c = p.career;
  reputation(c);
  nextExercise(c);
  bookUnlocks(c);
  for (const ch of CHAPTERS) chapterState(c, ch.id);
  for (const id of Object.keys(c.results)) exerciseOpen(c, id);
  loadNotebook(p.notebook);
  JSON.stringify(save);
}

test('salvataggi rovinati: 3000 oggetti a caso, sempre un salvataggio valido', () => {
  const r = rng(20261105);
  for (let i = 0; i < 3000; i++) {
    const raw = damage(FIXTURES[i % FIXTURES.length], r);
    let save;
    try {
      save = migrate(raw, NOW);
      assert.ok(isValidSave(save), 'non valido');
      useLikeTheGame(save);
      // riletto dopo la scrittura resta uguale
      assert.deepEqual(migrate(JSON.parse(JSON.stringify(save)), NOW), save);
    } catch (err) {
      err.message = `giro ${i}: ${err.message}\n${JSON.stringify(raw)?.slice(0, 600)}`;
      throw err;
    }
  }
});

test('salvataggi rovinati: il testo troncato o con byte cambiati si apre o si scarta, senza lanciare', () => {
  const r = rng(7);
  for (let i = 0; i < 1500; i++) {
    const text = JSON.stringify(FIXTURES[i % FIXTURES.length]);
    const chars = [...text];
    if (r() < 0.5) chars.length = Math.floor(r() * chars.length);
    for (let k = 0; k < 3; k++) chars[Math.floor(r() * chars.length)] = String.fromCharCode(32 + Math.floor(r() * 95));
    // come readLocal di game-view.js: un testo che non è JSON vale come «nessun salvataggio»
    let raw;
    try {
      raw = JSON.parse(chars.join(''));
    } catch {
      raw = null;
    }
    const save = migrate(raw, NOW);
    assert.ok(isValidSave(save), `giro ${i}`);
    useLikeTheGame(save);
  }
});

test('salvataggi: le chiavi __proto__, constructor e prototype non cambiano gli oggetti della Carriera', () => {
  const raw = JSON.parse(
    '{"version":2,"profiles":[{"id":"p1","name":"A","career":{"results":{"__proto__":{"stars":5,"polluted":true},"constructor":{"stars":4},"carry":{"stars":3}},"challenges":{"__proto__":{"medal":3}}}}]}',
  );
  const save = migrate(raw, NOW);
  const { results, challenges } = activeProfile(save).career;
  assert.equal(Object.getPrototypeOf(results), Object.prototype);
  assert.equal(Object.getPrototypeOf(challenges), Object.prototype);
  assert.equal(results.polluted, undefined);
  assert.deepEqual(Object.keys(results), ['carry']);
  assert.deepEqual(Object.keys(challenges), []);
  assert.ok(isValidSave(save));
});
