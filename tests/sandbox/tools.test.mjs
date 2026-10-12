// Test degli strumenti della sandbox: Mescola, Vento, Ambiente, Estintore, secchiello, forme, Sorgente, Pozzo, Annulla.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSubstances, AMBIENT, WALL, WATER, WOOD, FIRE, SOURCE, DRAIN, S } from '../../src/sandbox/substances.js';
import { World, C_BURN } from '../../src/sandbox/world.js';
import { lineCells, rectCells, ellipseCells, shapeCells } from '../../src/sandbox/shapes.js';
import { describeEvent, substanceNotes } from '../../src/sandbox/describe.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const subs = createSubstances(elements);
const K = (key) => subs.byKey.get(key).id;
const FE = K('Fe');
const SU = K('S');

function world(W = 60, H = 40, seed = 5) {
  const w = new World(subs, W, H, { seed });
  for (let x = 0; x < W; x++) w.paint(x, H - 1, 0, WALL);
  return w;
}
const run = (w, n) => {
  for (let k = 0; k < n; k++) w.step();
  return w;
};
const count = (w, id) => {
  let n = 0;
  for (let i = 0; i < w.N; i++) if (w.type[i] === id) n++;
  return n;
};
/** Coppie di celle vicine (destra e sotto) con sostanze diverse tra a e b: misura quanto sono mescolate. */
function contacts(w, a, b) {
  let n = 0;
  for (let y = 0; y < w.H; y++) {
    for (let x = 0; x < w.W; x++) {
      const i = y * w.W + x;
      for (const j of [x + 1 < w.W ? i + 1 : -1, y + 1 < w.H ? i + w.W : -1]) {
        if (j < 0) continue;
        if ((w.type[i] === a && w.type[j] === b) || (w.type[i] === b && w.type[j] === a)) n++;
      }
    }
  }
  return n;
}

test('Mescola: due polveri a strati diventano una miscela; i blocchi restano fermi', () => {
  const w = world();
  w.paint(30, 37, 5, SU, { powder: true }); // zolfo sotto…
  w.paint(30, 30, 7, FE, { powder: true }); // …ferro sopra
  run(w, 120); // si assestano a strati
  const before = contacts(w, FE, SU);
  const fe = count(w, FE);
  const su = count(w, SU);
  w.paint(40, 20, 0, WOOD); // un blocco di legno nel pennello non si muove
  for (let k = 0; k < 6; k++) w.stir(30, 34, 9);
  assert.equal(count(w, FE), fe, 'nessuna cella si perde');
  assert.equal(count(w, SU), su);
  assert.ok(count(w, FE) > 20 && count(w, SU) > 20);
  assert.ok(contacts(w, FE, SU) > before * 3, `miscela: ${before} → ${contacts(w, FE, SU)} contatti`);
  assert.equal(w.type[20 * w.W + 40], WOOD);
  w.stir(40, 20, 3);
  assert.equal(w.type[20 * w.W + 40], WOOD, 'il blocco non viene rimescolato');
});

test('Mescola: uguaglia la temperatura dei liquidi', () => {
  const w = world();
  for (let y = 30; y < 39; y++) for (let x = 20; x < 40; x++) w.paint(x, y, 0, WATER);
  for (let y = 30; y < 39; y++) for (let x = 20; x < 30; x++) w.temp[y * w.W + x] = 350;
  const spread = () => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let y = 30; y < 39; y++) {
      for (let x = 20; x < 40; x++) {
        const t = w.temp[y * w.W + x];
        lo = Math.min(lo, t);
        hi = Math.max(hi, t);
      }
    }
    return hi - lo;
  };
  const s0 = spread();
  for (let k = 0; k < 4; k++) w.stir(30, 34, 12);
  assert.ok(spread() < s0 * 0.6, `scarto ${s0} → ${spread()}`);
});

test('Vento: spinge le polveri nella direzione del cursore, o via dal centro', () => {
  const w = world();
  w.paint(20, 38, 2, FE, { powder: true });
  w.step();
  const total = count(w, FE);
  const meanX = () => {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < w.N; i++) if (w.type[i] === FE) (sum += i % w.W, n++);
    return sum / n;
  };
  const x0 = meanX();
  for (let k = 0; k < 20; k++) {
    w.blow(20, 37, 4, 1, 0);
    w.step();
  }
  assert.ok(meanX() > x0 + 3, `spostate a destra: ${x0} → ${meanX()}`);
  assert.equal(count(w, FE), total, 'nessuna cella si perde');
  // senza direzione: dal centro verso l'esterno
  const v = world();
  v.paint(30, 38, 2, FE, { powder: true });
  v.step();
  const spread = () => {
    const xs = [];
    for (let i = 0; i < v.N; i++) if (v.type[i] === FE) xs.push(i % v.W);
    return Math.max(...xs) - Math.min(...xs);
  };
  const s0 = spread();
  for (let k = 0; k < 15; k++) {
    v.blow(30, 37, 4, 0, 0);
    v.step();
  }
  assert.ok(spread() > s0 + 2, `la polvere si allarga: ${s0} → ${spread()}`);
});

test('Ambiente: riporta a 22 °C e spegne la brace; Estintore spegne il fuoco', () => {
  const w = world();
  w.paint(10, 36, 2, FE, { powder: true });
  w.heat(10, 36, 4, 600);
  assert.ok(w.temp[36 * w.W + 10] > 800);
  w.equalize(10, 36, 5);
  for (let i = 0; i < w.N; i++) if (w.type[i] === FE) assert.ok(Math.abs(w.temp[i] - AMBIENT) < 0.01);

  const f = world();
  for (let y = 33; y < 39; y++) for (let x = 20; x < 30; x++) f.paint(x, y, 0, WOOD);
  f.ignite(25, 32, 4);
  for (let k = 0; k < 10; k++) f.step();
  f.setBurning(34 * f.W + 25);
  assert.ok(f.flags[34 * f.W + 25] & C_BURN);
  f.extinguish(25, 34, 6);
  for (let y = 28; y < 40; y++) {
    for (let x = 19; x < 31; x++) {
      const i = y * f.W + x;
      if ((x - 25) ** 2 + (y - 34) ** 2 > 36) continue;
      assert.notEqual(f.type[i], FIRE, 'nessuna fiamma resta nel pennello');
      assert.equal(f.flags[i] & C_BURN, 0, 'nessuna brace resta nel pennello');
    }
  }
  assert.equal(f.flags[34 * f.W + 25] & C_BURN, 0);
  run(f, 60);
  assert.equal(count(f, FIRE) < 20, true, 'il fuoco non riparte subito');
});

test('Secchiello: riempie solo la regione chiusa e non passa attraverso il muro', () => {
  const w = world(40, 30);
  // una vasca 10 × 8 chiusa da muri
  for (let x = 10; x <= 21; x++) for (const y of [10, 19]) w.paint(x, y, 0, WALL, { replace: true });
  for (let y = 10; y <= 19; y++) for (const x of [10, 21]) w.paint(x, y, 0, WALL, { replace: true });
  const n = w.fill(15, 14, WATER);
  assert.equal(n, 10 * 8);
  assert.equal(count(w, WATER), 80);
  assert.equal(w.type[5 * w.W + 15], 0, 'fuori dalla vasca resta vuoto');
  assert.equal(w.fill(15, 14, WATER), 0, 'riempire con la stessa sostanza non fa nulla');
  // sostituisce una regione di un'altra sostanza
  assert.equal(w.fill(15, 14, K('Fe'), { powder: true }), 80);
  assert.equal(count(w, WATER), 0);
  // una regione enorme si riempie dal basso, fino al limite
  const big = world(120, 100);
  const m = big.fill(5, 5, WATER);
  assert.equal(m, 10000);
  assert.equal(big.type[98 * big.W + 5], WATER, 'dal fondo');
  assert.equal(big.type[0], 0, 'in alto resta vuoto');
});

test('forme: linea, rettangolo, ellisse', () => {
  const l = lineCells(2, 3, 12, 9);
  assert.deepEqual(l[0], [2, 3]);
  assert.deepEqual(l.at(-1), [12, 9]);
  assert.equal(l.length, 11);
  assert.equal(rectCells(0, 0, 9, 5, true).length, 60);
  assert.equal(rectCells(0, 0, 9, 5, false).length, 2 * (10 + 6) - 4);
  assert.equal(rectCells(9, 5, 0, 0, true).length, 60, 'gli angoli possono essere in qualunque ordine');
  const e = ellipseCells(0, 0, 20, 10, true);
  const edge = ellipseCells(0, 0, 20, 10, false);
  assert.ok(e.length > 150 && e.length < 200);
  assert.ok(edge.length < e.length && edge.length > 30);
  const key = (c) => `${c[0]},${c[1]}`;
  const set = new Set(e.map(key));
  for (const c of edge) assert.ok(set.has(key(c)));
  for (const [x, y] of e) assert.ok(set.has(key([20 - x, 10 - y])), 'simmetrica');
  assert.deepEqual(shapeCells('brush', 0, 0, 4, 4), [[4, 4]]);
});

test('Sorgente: clona la sostanza che tocca; Pozzo: cancella ciò che tocca', () => {
  const w = world();
  w.paint(30, 20, 0, SOURCE);
  w.paint(31, 20, 0, WATER); // la tocca: la sorgente la imparerà
  run(w, 100);
  assert.ok(count(w, WATER) > 15, `acqua clonata: ${count(w, WATER)}`);
  assert.equal(w.type[20 * w.W + 30], SOURCE);
  assert.equal(w.ctype[20 * w.W + 30], WATER);
  // una sorgente già carica, con la sostanza scelta (polvere di ferro)
  const v = world();
  v.paint(30, 10, 0, SOURCE, { ctype: FE, powder: true, temp: AMBIENT });
  run(v, 120);
  assert.ok(count(v, FE) > 30);
  assert.equal(count(v, WATER), 0);
  // pozzo sotto una cascata: il livello non sale
  const d = world();
  d.paint(30, 38, 0, DRAIN);
  d.paint(30, 5, 0, SOURCE, { ctype: WATER, temp: AMBIENT });
  run(d, 300);
  assert.equal(d.type[38 * d.W + 30], DRAIN, 'il pozzo resta');
  assert.ok(count(d, WATER) < 60, `acqua in sandbox: ${count(d, WATER)}`);
  // il pozzo non tocca il muro
  const e = world();
  e.paint(10, 38, 0, DRAIN);
  run(e, 5);
  assert.equal(e.type[39 * e.W + 10], WALL);
  assert.ok(substanceNotes(subs, SOURCE).join(' ').includes('Clona'));
  assert.ok(substanceNotes(subs, DRAIN).join(' ').includes('Cancella'));
  assert.ok(subs.P.flags[DRAIN] & S.DRAIN && subs.P.flags[SOURCE] & S.SOURCE);
  assert.equal(describeEvent(subs, 'rx:inesistente'), null);
});

test('Annulla: snapshot e restore riportano la griglia allo stato di prima', () => {
  const w = world();
  w.paint(20, 30, 3, FE, { powder: true });
  w.paint(30, 30, 2, WATER);
  const snap = w.snapshot();
  const fe = count(w, FE);
  w.erase(20, 30, 10);
  w.heat(30, 30, 5, 400);
  run(w, 20);
  assert.equal(count(w, FE), 0);
  assert.ok(w.restore(snap));
  assert.equal(count(w, FE), fe);
  assert.ok(Math.abs(w.temp[30 * w.W + 30] - AMBIENT) < 0.01);
  run(w, 5); // il motore riparte senza errori
  assert.equal(count(w, FE), fe);
  assert.equal(w.restore({ ...snap, W: 99 }), false);
});

test('gli strumenti non rompono nulla: tutti i materiali nuovi e le sostanze reagiscono bene insieme', () => {
  const w = world(80, 50, 11);
  w.paint(40, 10, 0, SOURCE, { ctype: WATER, temp: AMBIENT });
  w.paint(40, 45, 0, DRAIN);
  w.paint(20, 44, 5, K('Na'), { powder: true });
  for (let k = 0; k < 400; k++) {
    if (k % 5 === 0) w.stir(30 + (k % 20), 44, 4);
    if (k % 7 === 0) w.blow(25, 40, 6, 1, -1);
    if (k % 50 === 0) w.extinguish(40, 40, 8);
    w.step();
  }
  for (let i = 0; i < w.N; i++) {
    assert.ok(Number.isFinite(w.temp[i]) && w.temp[i] >= 0);
    assert.ok(w.type[i] < subs.list.length);
  }
});
