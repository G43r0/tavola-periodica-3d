// Test della legenda dei comandi (in basso a destra): righe giuste per ogni situazione. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legendRows, MAX_ROWS, POUR_HOLD_MS, relaxTilt, tiltGain, throwSpeed, isClick } from '../../src/game/controls.js';

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
  assert.deepEqual(keys(rows), ['lgPlace', 'lgPour', 'lgSwirl', 'lgTilt', 'lgRotateKeys', 'lgPutBack', 'lgThrow', 'lgPrecise', 'lgDistance', 'lgHelp']);
  assert.deepEqual(rows.map((r) => r.keys), [['lmb'], ['lmb'], ['e'], ['rmb', 'mouse'], ['ad'], ['rmb'], ['mmb'], ['shift'], ['wheel'], ['h']],
    'clic posa, sinistro tenuto versa, destro + mouse inclina, A e D ruotano, clic destro rimette a posto, tasto centrale lancia');
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
  // anche sopra il lavandino e un bidone tenendo premuto si versa subito
  assert.equal(legendRows({ mode: 'walk', held: beaker, target: { type: 'fixture', kind: 'sink' } })[1].key, 'lgPourSink');
  assert.deepEqual(legendRows({ mode: 'walk', held: beaker, target: { type: 'fixture', kind: 'bin', binName: 'vetro' } })[1].params, { bin: 'vetro' });
  // uno strumento: destro + mouse lo inclina (non lo gira: lo ruotano A e D)
  assert.deepEqual(legendRows({ mode: 'walk', held: { kind: 'spatula', container: false }, target: null }).find((r) => r.key === 'lgTilt').keys, ['rmb', 'mouse']);
  const sink = legendRows({ mode: 'walk', held: beaker, target: { type: 'fixture', kind: 'sink' } });
  assert.deepEqual(sink[0], { keys: ['lmb'], key: 'lgFill', params: null, off: false }, 'clic sul lavandino: riempi');
  assert.deepEqual(sink.find((r) => r.key === 'lgWash').keys, ['e'], 'E pulisce');
  const bin = legendRows({ mode: 'bench', held: beaker, target: { type: 'fixture', kind: 'bin', binName: 'metalli pesanti' } });
  assert.deepEqual(bin.find((r) => r.key === 'lgEmpty').params, { bin: 'metalli pesanti' });
  assert.ok(keys(bin).includes('lgHeight'), 'in vista bancone la rotella regola l\'altezza');
  assert.ok(!keys(bin).includes('lgPrecise'), 'la modalità precisa è solo in prima persona');
});

test('legenda: mentre si versa resta la riga del getto (sinistro) o dell\'inclinazione (destro)', () => {
  const rows = legendRows({ mode: 'walk', held: beaker, target: vessel, pouring: true, pourAuto: true });
  assert.equal(rows[0].key, 'lgPouringInto');
  assert.deepEqual(rows[0].keys, ['lmb', 'mouse']);
  assert.ok(!keys(rows).includes('lgPlace'));
  const hand = legendRows({ mode: 'bench', held: beaker, target: vessel, pouring: true, pourAuto: false });
  assert.deepEqual(hand[0], { keys: ['rmb', 'mouse'], key: 'lgTilting', params: null, off: false });
  // nella precisione il destro inclina, ma la legenda resta quella della precisione
  const fine = legendRows({ mode: 'walk', held: beaker, target: vessel, pouring: true, precise: true });
  assert.equal(fine[0].key, 'lgPreciseMove');
  assert.ok(POUR_HOLD_MS >= 150 && POUR_HOLD_MS <= 300, 'un clic normale non versa');
});

test('legenda: modalità precisa (Maiusc tenuto) e riempimento al lavandino', () => {
  const fine = legendRows({ mode: 'walk', held: beaker, target: null, precise: true });
  assert.deepEqual(keys(fine), ['lgPreciseMove', 'lgPreciseHeight', 'lgPreciseTiltPour', 'lgPreciseLeave', 'lgPreciseExit', 'lgHelp'], 'fermi: niente «cammina»');
  assert.deepEqual(fine.slice(0, 4).map((r) => r.keys), [['mouse'], ['lmb', 'mouse'], ['rmb', 'mouse'], ['mmb']], 'sinistro alza, destro inclina, centrale lascia');
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
  // un solido versato fa un mucchietto: si raccoglie con la carta
  const heap = { type: 'puddle', stain: false, heap: true };
  assert.equal(legendRows({ mode: 'walk', held: { kind: 'towel', container: false }, target: heap }).find((r) => r.key === 'lgWipeHeap').off, false);
  assert.equal(legendRows({ mode: 'walk', held: null, target: heap })[0].key, 'lgNeedTowelHeap');
});

test('legenda: strumenti della fase G4 (sonde, pipetta, buretta, imbuto, pinza, mantello, alimentatore, bombole)', () => {
  const thermo = { kind: 'thermometer', container: false };
  assert.equal(legendRows({ mode: 'walk', held: thermo, target: null }).find((r) => r.key === 'lgReadout').off, true,
    'fuori dal liquido la lettura è attenuata');
  assert.equal(legendRows({ mode: 'walk', held: { ...thermo, kind: 'phmeter', probing: true }, target: vessel })
    .find((r) => r.key === 'lgReadout').off, false);
  const pip = { kind: 'pipette', container: false };
  assert.equal(legendRows({ mode: 'walk', held: { ...pip, probing: true }, target: vessel })[1].key, 'lgPipetteIn');
  const loaded = legendRows({ mode: 'walk', held: { ...pip, loaded: true, probing: true }, target: vessel });
  assert.deepEqual(loaded.slice(1, 3).map((r) => [r.key, r.keys]), [['lgPipetteOut', ['e']], ['lgPipetteOne', ['shift', 'e']]],
    'Maiusc + E versa un millilitro');
  assert.equal(legendRows({ mode: 'walk', held: pip, target: { type: 'fixture', kind: 'sink' } })[1].key, 'lgWashPipette');
  assert.equal(legendRows({ mode: 'walk', held: pip, target: { type: 'fixture', kind: 'bin', binName: 'acidi' } })
    .find((r) => r.key === 'lgEmpty').off, true, 'la pipetta vuota non ha niente da buttare');
  // gli apparecchi fissi non si prendono: il clic li usa
  const burette = { type: 'item', kind: 'burette', container: true, rig: 'burette', level: 0 };
  assert.deepEqual(keys(legendRows({ mode: 'walk', held: null, target: burette })).slice(0, 1), ['lgStopcock1']);
  const open = legendRows({ mode: 'walk', held: null, target: { ...burette, level: 3 } });
  assert.deepEqual(keys(open).slice(0, 2), ['lgStopcock0', 'lgStopcockClose']);
  assert.equal(legendRows({ mode: 'walk', held: beaker, target: { ...burette, level: 1 } })[2].key, 'lgStopcock2',
    'con un becher in mano il rubinetto si gira con E');
  assert.equal(legendRows({ mode: 'walk', held: null, target: { type: 'item', container: true, rig: 'funnel' } })[0].key, 'lgFilterPaper');
  // un recipiente che scotta si prende solo con la pinza
  const hot = { ...vessel, hot: true };
  const bare = legendRows({ mode: 'walk', held: null, target: hot });
  assert.deepEqual([bare[0].key, bare[0].off], ['lgTooHot', true]);
  assert.equal(legendRows({ mode: 'walk', held: null, target: hot, tongs: true })[0].key, 'lgTakeTongs');
  assert.equal(legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'tongs', on: false } })[0].key, 'lgTongsTake');
  assert.equal(legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'tongs', on: true } })[0].key, 'lgTongsBack');
  const mantle = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'mantle', level: 2 } });
  assert.deepEqual(keys(mantle).slice(0, 3), ['lgMantleUp', 'lgMantleDown', 'lgPlateWheel']);
  assert.equal(legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'mantle', level: 0 } })[0].key, 'lgMantleOn');
  const power = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'power', level: 12, on: true } });
  assert.deepEqual([power[0].key, power[0].params, power[1].key], ['lgPowerUp', { v: 0 }, 'lgPowerOff'], 'da 12 V torna a 0');
  assert.deepEqual(legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'power', level: 4 } })[0].params, { v: 6 });
  const valve = legendRows({ mode: 'walk', held: null, target: { type: 'fixture', kind: 'gas', gas: 'Cl₂', on: false } });
  assert.deepEqual([valve[0].key, valve[0].params], ['lgValveOpen', { gas: 'Cl₂' }]);
  assert.equal(legendRows({ mode: 'walk', held: beaker, target: { type: 'fixture', kind: 'gas', gas: 'H₂', on: true } })[2].key, 'lgValveClose');
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
