// Test delle sostanze della libreria e delle reazioni del catalogo nella sandbox: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSubstances, phaseAt, AMBIENT, SOLID, LIQUID, GAS, S, WALL, WATER, CONCRETE } from '../../src/sandbox/substances.js';
import { World, C_DISSOLVED } from '../../src/sandbox/world.js';
import { describeEvent, substanceNotes } from '../../src/sandbox/describe.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';
import { REACTIONS } from '../../src/lab/data/reactions.js';
import { COMPOUND_DATA, LIBRARY_ALIASES } from '../../src/sandbox/data/compounds.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const subs = createSubstances(elements);
const K = (key) => subs.byKey.get(key).id;

function world(W = 60, H = 40, seed = 3) {
  const w = new World(subs, W, H, { seed });
  for (let x = 0; x < W; x++) w.paint(x, H - 1, 0, WALL);
  return w;
}
const run = (w, n) => {
  for (let k = 0; k < n; k++) w.step();
  return w;
};
const count = (w, id, pred = () => true) => {
  let n = 0;
  for (let i = 0; i < w.N; i++) if (w.type[i] === id && pred(i)) n++;
  return n;
};
const events = (w, prefix) => [...w.events].filter(([k]) => k.startsWith(prefix)).reduce((s, [, n]) => s + n, 0);
/** Vaschetta di muro aperta in alto, dalla riga `top` al fondo. */
function basin(w, top) {
  for (let y = top; y < w.H; y++) {
    w.paint(0, y, 0, WALL, { replace: true });
    w.paint(w.W - 1, y, 0, WALL, { replace: true });
  }
}

test('tutte le 558 sostanze della libreria sono nella sandbox, con dati fisici completi', () => {
  assert.equal(MOLECULES.length, 558);
  for (const m of MOLECULES) {
    assert.ok(m.id in COMPOUND_DATA || m.id in LIBRARY_ALIASES, `dati mancanti: ${m.id}`);
    const id = subs.libraryId.get(m.id);
    assert.ok(id, `sostanza mancante: ${m.id}`);
    const s = subs.list[id];
    assert.ok(Number.isFinite(s.mp) && Number.isFinite(s.bp) && s.bp >= s.mp, `${m.id}: temperature`);
    assert.ok(s.densS > 0 && s.densL > 0 && s.densG > 0, `${m.id}: densità`);
    assert.ok(substanceNotes(subs, id).length > 1, `${m.id}: note`);
  }
  // gli stati a temperatura ambiente coincidono con quelli scritti nella libreria
  // (l'acetaldeide bolle a 20 °C: nella sandbox, a 22 °C, è un gas come in realtà)
  const STATE = { solido: SOLID, liquido: LIQUID, gas: GAS };
  for (const m of MOLECULES) {
    const s = subs.list[subs.libraryId.get(m.id)];
    if (s.kind !== 'compound' || !STATE[m.state] || s.flags & S.AQUEOUS || m.id === 'acetaldeide') continue;
    assert.equal(phaseAt(s, AMBIENT), STATE[m.state], `${m.id}: stato a temperatura ambiente`);
  }
});

test('le reazioni del catalogo: ogni specie esiste, quelle escluse hanno un motivo', () => {
  const chem = new World(subs, 4, 4).chem;
  assert.equal(chem.list.length, REACTIONS.length);
  const active = chem.list.filter((rx) => !rx.disabled);
  assert.ok(active.length >= 1100, `reazioni attive: ${active.length}`);
  for (const rx of chem.list) {
    if (rx.disabled) assert.ok(typeof rx.disabled === 'string' && rx.disabled.length > 3, rx.id);
    else {
      for (const p of [...rx.reactants, ...rx.products]) assert.ok(p.sid > 0, `${rx.id}: ${p.key}`);
      const d = describeEvent(subs, `rx:${rx.id}`);
      assert.ok(d?.equation.includes('→'), rx.id);
    }
  }
  assert.ok(!chem.list.some((rx) => rx.disabled === 'specie non disponibile'));
});

test('soluzioni: il sale si scioglie e, facendo bollire l\'acqua, cristallizza di nuovo', () => {
  const w = world();
  basin(w, 20);
  for (let y = 28; y < 39; y++) for (let x = 1; x < 59; x++) w.paint(x, y, 0, WATER);
  w.paint(30, 25, 2, K('nacl'), { powder: true });
  const salt = count(w, K('nacl'));
  run(w, 600);
  assert.ok(count(w, K('nacl'), (i) => w.flags[i] & C_DISSOLVED) > 0, 'una parte del sale è sciolta');
  assert.equal(count(w, K('nacl')), salt, 'il sale si conserva');
  w.heat(30, 33, 40, 200);
  for (let k = 0; k < 400; k++) {
    w.heat(30, 37, 40, 3);
    w.step();
  }
  assert.ok(events(w, `crystal:${K('nacl')}`) > 0, 'il sale cristallizza');
  assert.ok(count(w, K('nacl'), (i) => !(w.flags[i] & C_DISSOLVED)) > 0);
});

test('precipitazione: AgNO₃(aq) + NaCl(aq) → AgCl, solido che non resta sciolto', () => {
  const w = world();
  basin(w, 20);
  for (let y = 24; y < 39; y++) {
    for (let x = 1; x < 30; x++) w.paint(x, y, 0, K('agno3'), { dissolved: true });
    for (let x = 30; x < 59; x++) w.paint(x, y, 0, K('nacl'), { dissolved: true });
  }
  run(w, 600);
  assert.ok(events(w, 'rx:cat-765') > 10);
  assert.ok(count(w, K('agcl'), (i) => !(w.flags[i] & C_DISSOLVED)) > 10, 'precipitato di AgCl');
  assert.ok(count(w, K('nano3'), (i) => w.flags[i] & C_DISSOLVED) > 0, 'il nitrato di sodio resta in soluzione');
});

test('combustione del metano (reazione del catalogo): anidride carbonica e acqua', () => {
  const w = world();
  for (let y = 5; y < 30; y++) for (let x = 10; x < 50; x++) w.paint(x, y, 0, K('ch4'));
  w.heat(30, 31, 3, 0);
  w.ignite(30, 31, 2);
  w.heat(30, 29, 3, 700);
  run(w, 200);
  assert.ok(events(w, 'rx:metano') > 50);
  assert.ok(count(w, K('co2')) > 30 && count(w, WATER) > 30);
});

test('un catalizzatore cambia tutto: l\'acqua ossigenata si decompone solo con MnO₂', () => {
  const make = (withCatalyst) => {
    const w = world();
    basin(w, 20);
    for (let y = 25; y < 39; y++) for (let x = 1; x < 59; x++) w.paint(x, y, 0, K('h2o2'));
    if (withCatalyst) w.paint(30, 22, 2, K('mno2'), { powder: true });
    return run(w, 400);
  };
  assert.equal(events(make(false), 'rx:perossido'), 0);
  const w = make(true);
  assert.ok(events(w, 'rx:perossido') > 20);
  assert.ok(count(w, K('O')) > 5, 'si libera ossigeno');
});

test('decomposizione termica: il calcare scaldato dà calce viva e CO₂', () => {
  const w = world();
  w.paint(30, 34, 3, K('caco3'), { powder: true, temp: 1250 });
  run(w, 300);
  assert.ok(count(w, K('cao')) > 5);
  assert.ok(events(w, 'rx:calcare') + events(w, 'rx:cat-') > 5);
});

test('la nitroglicerina scaldata detona; la detonazione innesca il TNT vicino', () => {
  const w = world(80, 40);
  for (let x = 0; x < 80; x++) w.paint(x, 38, 0, CONCRETE);
  w.paint(30, 35, 2, K('nitroglicerina'));
  w.paint(38, 35, 2, K('tnt'), { powder: false });
  w.heat(30, 35, 1, 300);
  run(w, 60);
  assert.ok(events(w, 'rx:cat-430') > 0, 'nitroglicerina');
  assert.ok(events(w, 'rx:cat-431') > 0, 'TNT');
});

test('metalli e acido: lo zinco sviluppa idrogeno, il rame no', () => {
  const make = (sym) => {
    const w = world();
    basin(w, 15);
    for (let y = 20; y < 39; y++) for (let x = 1; x < 59; x++) w.paint(x, y, 0, K('hcl'), { dissolved: true });
    w.paint(30, 37, 2, K(sym), { powder: true, replace: true });
    return run(w, 500);
  };
  const zn = make('Zn');
  assert.ok(events(zn, 'rx:cat-828') > 0);
  assert.ok(count(zn, K('zncl2')) > 0);
  const cu = make('Cu');
  assert.equal([...cu.events.keys()].filter((k) => k.startsWith('rx:')).length, 0);
});

test('lo zucchero scaldato carbonizza; un composto senza combustione in catalogo brucia comunque', () => {
  const w = world();
  w.paint(30, 34, 3, K('saccarosio'), { powder: true, temp: 520 });
  run(w, 200);
  assert.ok(events(w, `char:${K('saccarosio')}`) > 0);
  assert.ok(count(w, K('C')) > 0);

  const v = world();
  for (let y = 30; y < 39; y++) for (let x = 20; x < 40; x++) v.paint(x, y, 0, K('etilbenzene'));
  v.ignite(30, 29, 3);
  v.heat(30, 30, 3, 300);
  run(v, 500);
  assert.ok(events(v, `burn:${K('etilbenzene')}`) > 0);
});

test('le regole «a mano» producono le sostanze della libreria (sali, ossidi, idrossidi)', () => {
  assert.equal(subs.saltFor(K('Na'), K('Cl')), K('nacl'));
  assert.equal(subs.saltFor(K('Pb'), K('I')), K('pbi2'));
  assert.equal(subs.oxideFor(K('Mg')), K('mgo'));
  assert.equal(subs.oxideFor(K('Fe')), K('fe2o3'));
  assert.equal(subs.hydroxideFor(K('Na')), K('naoh'));
  const w = world();
  basin(w, 20);
  for (let y = 28; y < 39; y++) for (let x = 1; x < 59; x++) w.paint(x, y, 0, WATER);
  w.paint(30, 24, 2, K('Na'), { powder: true });
  run(w, 600);
  assert.ok(count(w, K('naoh'), (i) => w.flags[i] & C_DISSOLVED) > 0, 'idrossido di sodio in soluzione');
});

test('gli ioni esistono solo in acqua: bollendo lasciano vapore', () => {
  const w = world();
  w.paint(30, 30, 3, K('ione-rame'), { temp: AMBIENT });
  assert.equal(subs.list[K('ione-rame')].flags & S.AQUEOUS, S.AQUEOUS);
  w.heat(30, 30, 3, 120);
  run(w, 20);
  assert.equal(count(w, K('ione-rame')), 0);
});
