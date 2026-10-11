// Test della sandbox degli elementi (motore, sostanze, testi, esempi): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createSubstances, phaseAt, gameHalfLife, AMBIENT, AIR_DENSITY, SOLID, LIQUID, GAS, S,
  WOOD, COAL, CONCRETE, WALL, WATER, SALT, OXIDE, SOLUTION, GENERATOR, ASH, SMOKE, saltCtype,
} from '../../src/sandbox/substances.js';
import { World, C_POWDER, SPARK_ACTIVE, NEUTRON } from '../../src/sandbox/world.js';
import { describeEvent, substanceLabel, substanceNotes } from '../../src/sandbox/describe.js';
import { PRESETS } from '../../src/sandbox/presets.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const subs = createSubstances(elements);
const Z = (s) => subs.byKey.get(s).id;

/** Mondo piccolo con il pavimento di muro indistruttibile. */
function world(W = 60, H = 40, seed = 11) {
  const w = new World(subs, W, H, { seed });
  for (let x = 0; x < W; x++) w.paint(x, H - 1, 0, WALL);
  return w;
}
const run = (w, n) => {
  for (let k = 0; k < n; k++) w.step();
  return w;
};
const count = (w, id) => w.census().get(id) ?? 0;
/** Riga media delle celle di una sostanza (y cresce verso il basso). */
function meanY(w, id) {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < w.N; i++) {
    if (w.type[i] === id) {
      sum += Math.floor(i / w.W);
      n++;
    }
  }
  return n ? sum / n : NaN;
}
const events = (w, prefix) => [...w.events].filter(([k]) => k.startsWith(prefix)).reduce((s, [, n]) => s + n, 0);

test('sostanze: i 118 elementi con gli stati reali a 22 °C, più i materiali di base', () => {
  for (const el of elements) assert.ok(subs.list[el.z], el.symbol);
  const at = (s) => phaseAt(subs.list[Z(s)], AMBIENT);
  assert.equal(at('Fe'), SOLID);
  assert.equal(at('Hg'), LIQUID);
  assert.equal(at('Br'), LIQUID);
  assert.equal(at('O'), GAS);
  assert.equal(at('Cl'), GAS);
  assert.equal(at('Ga'), SOLID); // fonde a 29,8 °C
  assert.equal(phaseAt(subs.list[Z('Ga')], 310), LIQUID);
  assert.equal(subs.list[Z('C')].sublimes, true);
  for (const id of [WOOD, COAL, CONCRETE, WALL, WATER]) assert.ok(subs.list[id].name);
  assert.equal(subs.list[WALL].flags & S.WALL, S.WALL);
  // gas più leggeri e più pesanti dell'aria
  assert.ok(subs.list[Z('H')].densG < AIR_DENSITY && subs.list[Z('He')].densG < AIR_DENSITY);
  assert.ok(subs.list[Z('Cl')].densG > AIR_DENSITY && subs.list[Z('Rn')].densG > AIR_DENSITY);
});

test('radioattività: tempo di dimezzamento accelerato in scala logaritmica e catene di decadimento', () => {
  assert.ok(gameHalfLife(1e-3) < gameHalfLife(1) && gameHalfLife(1) < gameHalfLife(3e7) && gameHalfLife(3e7) < gameHalfLife(1.4e17));
  assert.ok(gameHalfLife(1.4e17) < 3600); // l'uranio-238 dimezza in meno di un'ora di gioco
  const po = subs.list[Z('Po')].decay;
  assert.equal(po.daughter, Z('Pb'));
  assert.equal(subs.list[Z('Ra')].decay.daughter, Z('Rn'));
  assert.equal(subs.list[Z('Fr')].decay.daughter, Z('Ra')); // β⁻
  assert.equal(subs.list[Z('Fe')].decay, null);
});

test('le polveri cadono e si ammucchiano; i blocchi restano sospesi', () => {
  const w = world();
  w.paint(30, 5, 2, Z('Fe'), { powder: true });
  w.paint(10, 5, 1, Z('Fe'), { powder: false });
  const n = count(w, Z('Fe'));
  run(w, 120);
  assert.equal(count(w, Z('Fe')), n, 'nessuna cella persa');
  assert.ok(meanY(w, Z('Fe')) > 25);
  assert.equal(w.type[5 * w.W + 10], Z('Fe'), 'il blocco non cade');
});

test('i liquidi si stratificano per densità: il mercurio va sotto l\'acqua, il piombo galleggia sul mercurio', () => {
  const w = world();
  for (let y = 15; y < 39; y++) {
    w.paint(0, y, 0, WALL);
    w.paint(59, y, 0, WALL);
  }
  for (let y = 30; y < 39; y++) for (let x = 1; x < 59; x++) w.paint(x, y, 0, WATER);
  // il mercurio versato sopra l'acqua affonda
  for (let y = 20; y < 23; y++) for (let x = 10; x < 50; x++) w.paint(x, y, 0, Z('Hg'));
  run(w, 500);
  assert.ok(meanY(w, Z('Hg')) > meanY(w, WATER) + 3, 'il mercurio sta sotto l\'acqua');

  const v = world();
  for (let y = 30; y < 39; y++) for (let x = 0; x < 60; x++) v.paint(x, y, 0, Z('Hg'));
  v.paint(20, 10, 2, Z('Pb'), { powder: true });
  v.paint(40, 10, 2, Z('Au'), { powder: true });
  run(v, 300);
  assert.ok(meanY(v, Z('Au')) > meanY(v, Z('Pb')) + 3, 'l\'oro affonda, il piombo galleggia');
});

test('i gas salgono o scendono secondo la densità', () => {
  const w = world(40, 60);
  for (let y = 25; y < 35; y++) for (let x = 0; x < 20; x++) w.paint(x, y, 0, Z('H'));
  for (let y = 25; y < 35; y++) for (let x = 20; x < 40; x++) w.paint(x, y, 0, Z('Cl'));
  run(w, 500);
  assert.ok(meanY(w, Z('H')) < 22, `idrogeno in alto (y medio ${meanY(w, Z('H'))})`);
  assert.ok(meanY(w, Z('Cl')) > 38, `cloro in basso (y medio ${meanY(w, Z('Cl'))})`);
});

test('cambiamenti di stato: il ferro fonde a 1538 °C, l\'acqua gela e bolle', () => {
  const w = world();
  w.paint(30, 30, 3, Z('Fe'), { powder: false });
  w.heat(30, 30, 3, 1700);
  run(w, 30);
  assert.ok(events(w, `phase:${Z('Fe')}:12`) > 0, 'fusione registrata');
  assert.ok(meanY(w, Z('Fe')) > 33, 'il ferro fuso cola');

  const v = world();
  v.paint(30, 30, 3, WATER);
  v.heat(30, 30, 3, -60);
  run(v, 5);
  assert.ok(events(v, `phase:${WATER}:21`) > 0, 'l\'acqua gela');
  assert.equal(phaseAt(subs.list[WATER], 380), GAS);
});

test('metalli alcalini + acqua: idrogeno, idrossido in soluzione e calore', () => {
  const w = world();
  for (let y = 30; y < 39; y++) for (let x = 0; x < 60; x++) w.paint(x, y, 0, WATER);
  w.paint(30, 25, 3, Z('Na'), { powder: true });
  run(w, 600);
  assert.ok(events(w, `water:${Z('Na')}`) > 5);
  assert.ok(count(w, SOLUTION) > 0 || count(w, WATER) > 0);
  const d = describeEvent(subs, `water:${Z('Na')}`);
  assert.equal(d.equation, '2 Na + 2 H₂O → 2 NaOH + H₂');
});

test('metallo + alogeno → sale (2 Na + Cl₂ → 2 NaCl)', () => {
  const w = world();
  w.paint(30, 35, 4, Z('Na'), { powder: false });
  for (let y = 5; y < 28; y++) for (let x = 0; x < 60; x++) w.paint(x, y, 0, Z('Cl'));
  run(w, 600);
  assert.ok(count(w, subs.byKey.get('nacl').id) > 5, 'si forma il cloruro di sodio della libreria');
  const c = saltCtype(Z('Na'), Z('Cl'));
  assert.deepEqual(substanceLabel(subs, SALT, c), { name: 'Cloruro di sodio', formula: 'NaCl' });
  assert.deepEqual(substanceLabel(subs, SALT, saltCtype(Z('Fe'), Z('Cl'))), { name: 'Cloruro di ferro(III)', formula: 'FeCl₃' });
  assert.deepEqual(substanceLabel(subs, OXIDE, Z('Al')), { name: 'Ossido di alluminio', formula: 'Al₂O₃' });
});

test('combustione: il legno brucia all\'aria (fumo, cenere); senza ossigeno si carbonizza', () => {
  const w = world();
  for (let y = 30; y < 39; y++) for (let x = 20; x < 40; x++) w.paint(x, y, 0, WOOD);
  w.ignite(30, 29, 3);
  run(w, 900);
  assert.ok(events(w, `burn:${WOOD}`) > 10);
  assert.ok(count(w, ASH) + count(w, SMOKE) + count(w, COAL) > 0);

  // legno chiuso in una scatola di muro, scaldato: niente combustione, pirolisi
  const v = world();
  for (let y = 20; y < 31; y++) for (let x = 20; x < 31; x++) v.paint(x, y, 0, WALL);
  for (let y = 21; y < 30; y++) for (let x = 21; x < 30; x++) v.paint(x, y, 0, WOOD, { temp: 800, replace: true });
  run(v, 400);
  assert.equal(events(v, `burn:${WOOD}`), 0);
  assert.ok(events(v, 'pyrolysis') > 0);
});

test('idrogeno e ossigeno: una scintilla e diventano acqua', () => {
  const w = world();
  for (let y = 10; y < 30; y++) for (let x = 10; x < 50; x++) w.paint(x, y, 0, (x + y) % 3 ? Z('H') : Z('O'));
  w.ignite(30, 31, 2);
  w.heat(30, 29, 2, 700);
  run(w, 200);
  assert.ok(events(w, `burn:${Z('H')}`) > 100);
  assert.ok(count(w, WATER) > 100);
});

test('alluminotermia: alluminio + ruggine ad alta temperatura danno ferro fuso', () => {
  const w = world();
  for (let y = 28; y < 39; y++) for (let x = 20; x < 40; x++) w.paint(x, y, 0, (x + y) % 2 ? Z('Al') : OXIDE, { ctype: (x + y) % 2 ? 0 : Z('Fe') });
  w.heat(30, 28, 3, 1200);
  run(w, 300);
  assert.ok(events(w, `thermite:${Z('Al')}:${Z('Fe')}`) > 20);
  assert.ok(count(w, Z('Fe')) > 20);
  assert.equal(describeEvent(subs, `thermite:${Z('Al')}:${Z('Fe')}`).equation, '2 Al + Fe₂O₃ → Al₂O₃ + 2 Fe');
});

test('decadimento: il polonio diventa piombo e libera elio', () => {
  const w = world();
  w.paint(30, 30, 4, Z('Po'), { powder: true });
  run(w, 4000);
  assert.ok(events(w, `decay:${Z('Po')}`) > 5);
  assert.ok(count(w, Z('Pb')) > 0);
  assert.ok(count(w, Z('He')) > 0);
});

test('fissione: i neutroni spezzano il plutonio in due frammenti (Z conservato)', () => {
  const w = world(80, 50);
  for (let y = 25; y < 45; y++) for (let x = 30; x < 50; x++) w.paint(x, y, 0, Z('Pu'), { powder: false });
  w.emitNeutrons(40, 35, 2, 12);
  run(w, 120);
  const fissions = [...w.events].filter(([k]) => k.startsWith('fission:'));
  assert.ok(fissions.length > 0);
  for (const [k] of fissions) {
    const [, parent, heavy] = k.split(':').map(Number);
    assert.equal(parent, Z('Pu'));
    assert.ok(heavy >= 52 && heavy <= 56);
  }
  assert.match(describeEvent(subs, `fission:${Z('U')}:56`).equation, /²³⁵U \+ n → ¹⁴²Ba \+ ⁹²Kr \+ 2 n/);
});

test('i neutroni vengono assorbiti dal cadmio', () => {
  const w = world();
  for (let y = 0; y < 39; y++) for (let x = 35; x < 45; x++) w.paint(x, y, 0, Z('Cd'), { powder: false });
  for (let k = 0; k < 50; k++) w.emit(10.5, 20.5, NEUTRON, 0, 3, 200);
  run(w, 30);
  const beyond = w.particles.filter((p) => p.x > 45).length;
  assert.ok(beyond < 5, `neutroni oltre il cadmio: ${beyond}`);
});

test('elettricità: il generatore manda impulsi nel rame e il neon si illumina', () => {
  const w = world();
  for (let x = 5; x < 55; x++) {
    w.paint(x, 10, 0, WALL);
    w.paint(x, 16, 0, WALL);
  }
  for (let y = 11; y < 16; y++) {
    for (let x = 8; x < 55; x++) w.paint(x, y, 0, Z('Ne'));
    w.paint(7, y, 0, Z('Cu'), { powder: false });
    w.paint(6, y, 0, GENERATOR);
  }
  let lit = 0;
  for (let k = 0; k < 80; k++) {
    w.step();
    for (let i = 0; i < w.N; i++) if (w.type[i] === Z('Ne') && w.spark[i] >= SPARK_ACTIVE) lit++;
  }
  assert.ok(lit > 200, `celle di neon illuminate: ${lit}`);
});

test('elettrolisi: la corrente scompone l\'acqua in idrogeno e ossigeno', () => {
  const w = world();
  for (let y = 25; y < 39; y++) for (let x = 0; x < 60; x++) w.paint(x, y, 0, WATER);
  for (let y = 15; y < 38; y++) w.paint(20, y, 0, Z('Cu'), { powder: false });
  w.paint(20, 14, 0, GENERATOR);
  run(w, 600);
  assert.ok(events(w, 'electrolysis:water') > 0);
  assert.equal(describeEvent(subs, 'electrolysis:water').equation, '2 H₂O → 2 H₂ + O₂');
});

test('esplosioni: il muro è indistruttibile, il calcestruzzo resiste, il legno va in pezzi', () => {
  const w = world();
  for (let y = 10; y < 30; y++) {
    w.paint(20, y, 0, WALL);
    w.paint(30, y, 0, CONCRETE);
    w.paint(40, y, 0, WOOD);
  }
  w.explode(20, 20, 6, 1, 0);
  w.explode(30, 20, 6, 0.5, 0);
  w.explode(40, 20, 6, 0.5, 0);
  run(w, 60);
  for (let y = 10; y < 30; y++) assert.equal(w.type[y * w.W + 20], WALL);
  let concrete = 0;
  for (let y = 10; y < 30; y++) concrete += w.type[y * w.W + 30] === CONCRETE ? 1 : 0;
  assert.equal(concrete, 20, 'il calcestruzzo regge un\'esplosione media');
  let wood = 0;
  for (let y = 10; y < 30; y++) wood += w.type[y * w.W + 40] === WOOD && !(w.flags[y * w.W + 40] & C_POWDER) ? 1 : 0;
  assert.ok(wood < 20, 'il legno si frantuma');
});

test('stesso seme, stessa simulazione', () => {
  const make = () => {
    const w = world(50, 40, 99);
    w.paint(25, 10, 4, Z('Na'), { powder: true });
    for (let y = 30; y < 39; y++) for (let x = 0; x < 50; x++) w.paint(x, y, 0, WATER);
    return run(w, 200);
  };
  const a = make();
  const b = make();
  assert.deepEqual([...a.type], [...b.type]);
  assert.deepEqual([...a.events], [...b.events]);
});

// ------------------------------------------------------------------ equazioni bilanciate
const DIGITS = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
const plain = (s) => s.replace(/[₀-₉]/g, (c) => DIGITS[c]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, '');
function parseFormula(f, mult, acc) {
  let i = 0;
  const read = () => {
    const out = new Map();
    while (i < f.length && f[i] !== ')') {
      let part;
      if (f[i] === '(') {
        i++;
        part = read();
        i++; // ')'
      } else {
        const m = /^[A-Z][a-z]?/.exec(f.slice(i));
        if (!m) throw new Error(`formula non valida: ${f}`);
        i += m[0].length;
        part = new Map([[m[0], 1]]);
      }
      const n = /^\d+/.exec(f.slice(i));
      const k = n ? Number(n[0]) : 1;
      if (n) i += n[0].length;
      for (const [el, c] of part) out.set(el, (out.get(el) ?? 0) + c * k);
    }
    return out;
  };
  for (const [el, c] of read()) acc.set(el, (acc.get(el) ?? 0) + c * mult);
}
function side(text) {
  const acc = new Map();
  for (const term of text.split(' + ')) {
    const m = /^(\d+) (.+)$/.exec(term.trim());
    const [coef, f] = m ? [Number(m[1]), m[2]] : [1, term.trim()];
    if (f === 'n' || f === 'e⁻' || /ν/.test(f)) continue;
    parseFormula(plain(f), coef, acc);
  }
  return acc;
}
function balanced(eq) {
  const [l, r] = eq.split(' → ');
  const a = side(l);
  const b = side(r);
  const keys = new Set([...a.keys(), ...b.keys()]);
  return [...keys].every((k) => a.get(k) === b.get(k));
}

test('le equazioni del registro sono bilanciate (combustioni, sali, alluminotermia, acqua, elettrolisi)', () => {
  const keys = [];
  for (const s of subs.list) {
    if (s?.burn && s.key !== 'wood' && s.kind !== 'compound') keys.push(`burn:${s.id}`);
    if (s?.water) keys.push(`water:${s.id}`);
  }
  const metals = subs.list.filter((s) => s?.kind === 'element' && s.flags & S.METAL && s.z < 104);
  const halogens = ['F', 'Cl', 'Br', 'I'].map(Z);
  for (const m of metals) for (const x of halogens) keys.push(`salt:${m.id}:${x}`, `electrolysis:salt:${m.id}:${x}`);
  for (const a of ['Al', 'Mg', 'Ca', 'Na']) for (const b of ['Fe', 'Cu', 'Cr', 'Ni', 'Pb']) keys.push(`thermite:${Z(a)}:${Z(b)}`);
  keys.push('electrolysis:water');
  for (const k of keys) {
    const d = describeEvent(subs, k);
    assert.ok(d, k);
    assert.ok(balanced(d.equation), `${k}: ${d.equation}`);
  }
});

test('decadimenti e fissioni conservano il numero di massa e la carica', () => {
  for (const s of subs.list) {
    if (!s?.decay || s.decay.mode === 5) continue;
    const d = describeEvent(subs, `decay:${s.id}`);
    const nums = [...d.equation.matchAll(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)].map((m) => Number([...m[1]].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')));
    const [lhs, rhs] = d.equation.split(' → ');
    const massL = [...lhs.matchAll(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)].length;
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);
    assert.equal(sum(nums.slice(0, massL)), sum(nums.slice(massL)), d.equation);
    assert.ok(rhs.includes(subs.list[s.decay.daughter].symbol));
  }
});

test('ogni sostanza ha note descrittive', () => {
  for (const s of subs.list) {
    if (!s || s.id === 0) continue;
    assert.ok(substanceNotes(subs, s.id).length > 0, s.name);
  }
});

test('gli esempi si costruiscono e girano su tutte le griglie', () => {
  for (const [W, H] of [[240, 135], [320, 180], [400, 225]]) {
    for (const p of PRESETS) {
      const w = new World(subs, W, H, { seed: 5 });
      const out = p.build(w, subs);
      assert.ok(w.census().size > 0, p.id);
      for (const l of out.labels ?? []) assert.ok(l.x >= 0 && l.x < W && l.y >= 0 && l.y < H, `${p.id}: etichetta fuori griglia`);
      run(w, 60);
    }
  }
});
