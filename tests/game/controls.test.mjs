// Test della legenda dei comandi (in basso a destra): righe giuste per ogni situazione. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legendRows, MAX_ROWS, relaxTilt, tiltGain, throwSpeed, isClick } from '../../src/game/controls.js';

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
  assert.deepEqual(plate.slice(0, 2).map((r) => r.keys), [['lmb'], ['rmb']], 'come in Cooking Simulator: si usa con il clic');
  const off = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'hotplate', level: 0 } });
  assert.equal(off[0].key, 'lgPlateOn');
  assert.ok(!keys(off).includes('lgPlateDown'));
  const tap = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'sink', on: true } });
  assert.equal(tap[0].key, 'lgTapOff');
  const bin = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'bin', binName: 'vetro' } });
  assert.equal(bin[0].key, 'lgBinNeedsVessel');
  assert.equal(bin[0].off, true, 'senza un recipiente in mano l\'azione è attenuata');
});

test('legenda: con un recipiente in mano, i comandi di Cooking Simulator', () => {
  const rows = legendRows({ mode: 'walk', held: beaker, target: null, canPlace: true, canPutBack: true });
  assert.deepEqual(keys(rows), ['lgPlace', 'lgPour', 'lgSwirl', 'lgRotateKeys', 'lgPutBack', 'lgThrow', 'lgPrecise', 'lgDistance', 'lgHelp']);
  assert.deepEqual(rows.map((r) => r.keys), [['lmb'], ['lmb', 'mouse'], ['e'], ['ad'], ['rmb'], ['mmb'], ['shift'], ['wheel'], ['h']],
    'clic posa, sinistro + mouse versa, A e D ruotano, clic destro rimette a posto, tasto centrale lancia');
  // con un oggetto in mano A e D ruotano: nella vista del bancone non cambiano postazione, in prima persona niente passi di lato
  const benchHeld = legendRows({ mode: 'bench', held: beaker, target: null });
  assert.ok(!keys(benchHeld).includes('lgStation'));
  const fewRows = legendRows({ mode: 'walk', held: { kind: 'spatula', container: false }, target: null });
  assert.ok(keys(fewRows).includes('lgWalkHeld') || fewRows.length === MAX_ROWS);
  assert.ok(rows.length <= MAX_ROWS);
  const turned = legendRows({ mode: 'walk', held: beaker, target: null, rotated: true });
  assert.equal(turned.find((r) => r.keys.length === 1 && r.keys[0] === 'rmb').key, 'lgCancelRotation');
  const far = legendRows({ mode: 'walk', held: beaker, target: null, canPutBack: false });
  assert.equal(far.find((r) => r.key === 'lgPutBack').off, true);
  const air = legendRows({ mode: 'walk', held: beaker, target: null, canPlace: false });
  assert.equal(air[0].key, 'lgDrop');
  const into = legendRows({ mode: 'walk', held: beaker, target: vessel, canPlace: false });
  assert.equal(into[1].key, 'lgPourInto');
  assert.equal(into[1].params.name, 'Becher 100 mL');
  const sink = legendRows({ mode: 'walk', held: beaker, target: { type: 'fixture', kind: 'sink' } });
  assert.deepEqual(sink[0], { keys: ['lmb'], key: 'lgFill', params: null, off: false }, 'clic sul lavandino: riempi');
  assert.deepEqual(sink.find((r) => r.key === 'lgWash').keys, ['e'], 'E pulisce');
  const bin = legendRows({ mode: 'bench', held: beaker, target: { type: 'fixture', kind: 'bin', binName: 'metalli pesanti' } });
  assert.deepEqual(bin.find((r) => r.key === 'lgEmpty').params, { bin: 'metalli pesanti' });
  assert.ok(keys(bin).includes('lgHeight'), 'in vista bancone la rotella regola l\'altezza');
  assert.ok(!keys(bin).includes('lgPrecise'), 'la modalità precisa è solo in prima persona');
});

test('legenda: mentre si versa resta la riga dell\'inclinazione, con il sinistro', () => {
  const rows = legendRows({ mode: 'walk', held: beaker, target: vessel, pouring: true });
  assert.equal(rows[0].key, 'lgPouringInto');
  assert.deepEqual(rows[0].keys, ['lmb', 'mouse']);
  assert.ok(!keys(rows).includes('lgPlace'));
});

test('legenda: modalità precisa (Maiusc tenuto) e riempimento al lavandino', () => {
  const fine = legendRows({ mode: 'walk', held: beaker, target: null, precise: true });
  assert.deepEqual(keys(fine), ['lgPreciseMove', 'lgPreciseHeight', 'lgPreciseRotatePour', 'lgPreciseLeave', 'lgPreciseExit', 'lgHelp'], 'fermi: niente «cammina»');
  assert.deepEqual(fine.slice(0, 4).map((r) => r.keys), [['mouse'], ['lmb', 'mouse'], ['rmb', 'mouse'], ['mmb']], 'sinistro alza, destro ruota, centrale lascia');
  const tool = legendRows({ mode: 'walk', held: { kind: 'spatula', container: false }, target: vessel, precise: true });
  assert.ok(keys(tool).includes('lgSpatulaTake'), 'con uno strumento resta la sua azione');
  const fill = legendRows({ mode: 'walk', held: beaker, target: { type: 'fixture', kind: 'sink' }, filling: true, tapFlow: 25 });
  assert.deepEqual(keys(fill), ['lgFillHold', 'lgTapFlow', 'lgFillStop', 'lgHelp']);
  assert.deepEqual(fill[1].params, { ml: 25 });
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

test('inclinazione: torna dritta lasciando il tasto, ferma tenendolo premuto', () => {
  assert.ok(Math.abs(relaxTilt(1.2, 0.1, false) - 0.9) < 1e-9);
  assert.equal(relaxTilt(1.2, 0.1, true), 1.2);
  assert.equal(relaxTilt(0.1, 0.5, false), 0);
  assert.equal(tiltGain(0.001), 0.4, 'vicino al bordo la corsa del mouse è più lunga');
  assert.equal(tiltGain(-0.01), 1);
  assert.equal(tiltGain(undefined), 1);
});

test('lancio a carica e clic distinto dal trascinamento', () => {
  assert.equal(throwSpeed(0), 1.5);
  assert.equal(throwSpeed(0.5), 4.75);
  assert.equal(throwSpeed(3), 8, 'oltre un secondo non cresce più');
  assert.equal(throwSpeed(-1), 1.5);
  assert.equal(isClick(0), true);
  assert.equal(isClick(3), true, 'un tremolio della mano è ancora un clic');
  assert.equal(isClick(10), false, 'trascinando si versa (sinistro) o si ruota (destro)');
});
