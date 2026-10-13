// Test della legenda dei comandi (in basso a destra): righe giuste per ogni situazione. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legendRows, MAX_ROWS, relaxTilt, tiltGain } from '../../src/game/controls.js';

const keys = (rows) => rows.map((r) => r.key);
const beaker = { kind: 'beaker250', container: true };
const vessel = { type: 'item', kind: 'beaker100', name: 'Becher 100 mL', container: true };

test('legenda: a mani vuote mostra sempre movimento, visuale e aiuto', () => {
  const rows = legendRows({ mode: 'walk', held: null, target: null });
  assert.deepEqual(keys(rows), ['lgWalk', 'lgBenchView', 'lgHelp']);
  const bench = legendRows({ mode: 'bench', held: null, target: null });
  assert.deepEqual(keys(bench), ['lgStation', 'lgFirstPerson', 'lgHelp']);
});

test('legenda: guardando un oggetto la prima riga è «prendi», con il nome', () => {
  const rows = legendRows({ mode: 'walk', held: null, target: vessel });
  assert.equal(rows[0].key, 'lgTake');
  assert.deepEqual(rows[0].keys, ['lmb']);
  assert.equal(rows[0].params.name, 'Becher 100 mL');
});

test('legenda: elementi fissi con lo stato giusto (piastra, rubinetto, rifiuti)', () => {
  const plate = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'hotplate', level: 2 } });
  assert.deepEqual(keys(plate).slice(0, 3), ['lgPlateUp', 'lgPlateDown', 'lgPlateWheel']);
  const off = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'hotplate', level: 0 } });
  assert.equal(off[0].key, 'lgPlateOn');
  assert.ok(!keys(off).includes('lgPlateDown'));
  const tap = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'sink', on: true } });
  assert.equal(tap[0].key, 'lgTapOff');
  const bin = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'bin', binName: 'vetro' } });
  assert.equal(bin[0].key, 'lgBinNeedsVessel');
  assert.equal(bin[0].off, true, 'senza un recipiente in mano l\'azione è attenuata');
});

test('legenda: con un contenitore in mano posa (o lascia cadere), versa, agita, lancia, distanza', () => {
  const rows = legendRows({ mode: 'walk', held: beaker, target: null, canPlace: true });
  assert.deepEqual(keys(rows).slice(0, 5), ['lgPlace', 'lgPour', 'lgSwirl', 'lgThrow', 'lgDistance']);
  assert.equal(rows.at(-1).key, 'lgHelp');
  const air = legendRows({ mode: 'walk', held: beaker, target: null, canPlace: false });
  assert.equal(air[0].key, 'lgDrop');
  assert.ok(!keys(air).includes('lgPlace'));
  const into = legendRows({ mode: 'walk', held: beaker, target: vessel, canPlace: false });
  assert.equal(into[1].key, 'lgPourInto');
  assert.equal(into[1].params.name, 'Becher 100 mL');
  const sink = legendRows({ mode: 'walk', held: beaker, target: { type: 'fixture', kind: 'sink' } });
  assert.ok(keys(sink).includes('lgWash'));
  const bin = legendRows({ mode: 'bench', held: beaker, target: { type: 'fixture', kind: 'bin', binName: 'metalli pesanti' } });
  assert.deepEqual(bin.find((r) => r.key === 'lgEmpty').params, { bin: 'metalli pesanti' });
  assert.ok(keys(bin).includes('lgHeight'), 'in vista bancone la rotella regola l\'altezza');
});

test('legenda: mentre si versa resta la riga dell\'inclinazione, con il tasto destro', () => {
  const rows = legendRows({ mode: 'walk', held: beaker, target: vessel, pouring: true });
  assert.equal(rows[0].key, 'lgPouringInto');
  assert.ok(rows[0].keys.includes('rmb'));
  assert.ok(!keys(rows).includes('lgPlace'));
});

test('legenda: strumenti attenuati quando il bersaglio non va bene', () => {
  const sp = legendRows({ mode: 'walk', held: { kind: 'spatula', container: false }, target: null, canPlace: true });
  assert.equal(sp.find((r) => r.key === 'lgSpatulaTake').off, true);
  const ok = legendRows({ mode: 'walk', held: { kind: 'spatula', container: false }, target: vessel });
  assert.equal(ok.find((r) => r.key === 'lgSpatulaTake').off, false);
  const towel = legendRows({ mode: 'walk', held: { kind: 'towel', container: false }, target: { type: 'puddle' } });
  assert.equal(towel.find((r) => r.key === 'lgWipe').off, false);
  const stain = legendRows({ mode: 'walk', held: { kind: 'towel', container: false }, target: { type: 'puddle', stain: true } });
  assert.equal(stain.find((r) => r.key === 'lgWipeStain').off, false);
});

test('legenda: mai più di MAX_ROWS righe, l\'aiuto sempre in fondo', () => {
  const cases = [
    { mode: 'walk', held: null, target: { type: 'fixture', kind: 'hotplate', level: 3 } },
    { mode: 'walk', held: { kind: 'spatula', container: false }, target: vessel, canPlace: true },
    { mode: 'bench', held: beaker, target: { type: 'fixture', kind: 'hotplate', level: 1 } },
    { mode: 'walk', held: { kind: 'extinguisher', container: false }, target: null },
  ];
  for (const c of cases) {
    const rows = legendRows(c);
    assert.ok(rows.length <= MAX_ROWS, `${rows.length} righe`);
    assert.equal(rows.at(-1).key, 'lgHelp');
  }
});

test('inclinazione: torna dritta lasciando il tasto destro, ferma tenendolo premuto', () => {
  assert.ok(Math.abs(relaxTilt(1.2, 0.1, false) - 0.9) < 1e-9);
  assert.equal(relaxTilt(1.2, 0.1, true), 1.2);
  assert.equal(relaxTilt(0.1, 0.5, false), 0);
  assert.equal(tiltGain(0.001), 0.4, 'vicino al bordo la corsa del mouse è più lunga');
  assert.equal(tiltGain(-0.01), 1);
  assert.equal(tiltGain(undefined), 1);
});
