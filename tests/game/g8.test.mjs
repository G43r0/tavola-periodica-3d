// Test della fase G8 (rifinitura): pila Daniell e contatore del gas, livelli dell'audio, suoni CC0, qualità adattiva,
// testi nuovi. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry, Mixture, AMBIENT, HEAT_SPEED } from '../../src/game/mixture.js';
import { DEFS } from '../../src/game/items.js';
import { halfCellPotential, cellReading, ION_CHARGE, BUNSEN_GAS, MOLAR_VOLUME, meterLitres } from '../../src/game/apparatus-logic.js';
import { REDUCTION_POTENTIALS } from '../../src/game/reagents.js';
import { EXERCISES } from '../../src/game/career.js';
import { pourSound, tapLevel, fireLevel, fizzLevel, impactGain, nearest, shakeAt } from '../../src/game/audio/sound-levels.js';
import { SOUNDS, soundPage } from '../../src/game/audio/sound-list.js';
import { QualityMeter, GAME_ADAPT } from '../../src/game/quality.js';
import { GAME_STRINGS } from '../../src/game/game-strings.js';
import { SIGN_KEYS } from '../../src/game/room-details.js';
import { STATIONS } from '../../src/game/room.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);
const has = (key) => key in GAME_STRINGS.it && key in GAME_STRINGS.en;
const half = (metal, conc) => ({ metal, E0: REDUCTION_POTENTIALS[metal], n: ION_CHARGE[metal], conc });

test('G8: pila Daniell con l\'equazione di Nernst', () => {
  // condizioni standard: 0,34 − (−0,76) = 1,10 V, il rame è il polo positivo
  const std = cellReading(half('Zn', 1), half('Cu', 1), true);
  assert.equal(std.volts, 1.1);
  assert.equal(std.plus, 'b');
  // l'esercitazione: ZnSO₄ 0,1 M e CuSO₄ 0,5 M danno 1,12 V, come la risposta dei dati
  const r = cellReading(half('Zn', 0.1), half('Cu', 0.5), true);
  assert.equal(r.volts, 1.12);
  assert.equal(EXERCISES.find((e) => e.id === 'xDaniell').answers.value, r.volts);
  // invertendo i posti cambia solo il polo positivo
  assert.equal(cellReading(half('Cu', 0.5), half('Zn', 0.1), true).plus, 'a');
  // diluire gli ioni del rame abbassa la tensione di 0,0296 V per ogni fattore 10
  assert.ok(Math.abs(halfCellPotential(0.34, 2, 0.01) - (0.34 - 2 * 0.02958)) < 1e-4);
  // senza ponte salino, senza metallo, senza ioni, metalli uguali: zero e il motivo
  assert.equal(cellReading(half('Zn', 0.1), half('Cu', 0.5), false).why, 'bridge');
  assert.equal(cellReading(null, half('Cu', 0.5), true).why, 'empty');
  assert.equal(cellReading({ metal: null, conc: 0 }, half('Cu', 0.5), true).why, 'electrode');
  assert.equal(cellReading(half('Zn', 0), half('Cu', 0.5), true).why, 'ions');
  assert.equal(cellReading(half('Cu', 0.5), half('Cu', 0.5), true).why, 'same');
  // una pila di concentrazione (stesso metallo, ioni diversi) dà una piccola tensione
  assert.equal(cellReading(half('Cu', 0.01), half('Cu', 1), true).volts, 0.06);
  // ogni metallo con un potenziale ha la carica dei suoi ioni
  for (const m of Object.keys(ION_CHARGE)) assert.ok(REDUCTION_POTENTIALS[m] !== undefined, m);
});

test('G8: contatore del gas e calore del metano misurato con il motore', () => {
  assert.equal(meterLitres(0.06), 1.47);
  // 3,5 L al minuto nel tempo del calore: una fiamma da scuola (2 kW con i 890 kJ/mol del metano)
  assert.ok(Math.abs(BUNSEN_GAS * MOLAR_VOLUME * 60 - 3.5) < 0.1);
  // 100 mL d'acqua nel becher da 250 mL sulla reticella (850 W, come thermalEnv): kJ per litro come li calcola lo studente
  const def = DEFS.beaker250;
  const ex = EXERCISES.find((e) => e.id === 'xGasHeat');
  for (const secs of [3, 6, 10]) {
    const m = Mixture.liquid(ctx, 'water', 100);
    const T0 = m.T;
    for (let t = 0; t < secs; t += 0.05) m.tick(0.05, { heatW: 850, lossWK: 0.3 + def.area * 0.03, Tenv: AMBIENT, containerC: def.heatC, area: def.area, stir: 0.5 });
    const litres = BUNSEN_GAS * HEAT_SPEED * MOLAR_VOLUME * secs;
    const kjL = (100 * 4.18 * (m.T - T0)) / 1000 / litres;
    assert.ok(Math.abs(kjL - ex.answers.value) <= ex.answers.tol.real[0], `${secs} s: ${kjL.toFixed(2)} kJ/L`);
    // molto meno dei 36 kJ/L delle tabelle: il resto va nell'aria (la domanda della relazione)
    assert.ok(kjL < 36.3 * 0.5);
  }
});

test('G8: le due misure rimandate dalla G7 sono richieste extra (non cambiano i capitoli già superati)', () => {
  for (const id of ['xDaniell', 'xGasHeat']) {
    const e = EXERCISES.find((x) => x.id === id);
    assert.ok(e?.extra, id);
    for (const suffix of ['Title', 'Brief', 'BriefSimple']) assert.ok(has(`${id}${suffix}`), `${id}${suffix}`);
    assert.ok(`${id}Brief` in GAME_STRINGS.eli6, `eli6: ${id}`);
  }
});

test('G8: livelli dell\'audio', () => {
  assert.ok(pourSound(0.5).level < pourSound(10).level);
  assert.ok(pourSound(100).level <= 1 && pourSound(0).level >= 0.25);
  assert.ok(tapLevel(5) < tapLevel(50));
  assert.equal(fireLevel(0), 0);
  assert.ok(fireLevel(1) < fireLevel(3) && fireLevel(20) <= 1.4);
  assert.ok(fizzLevel(1e-7) < fizzLevel(1e-3) && fizzLevel(1) <= 1.2);
  assert.equal(impactGain(0.3), 0, 'un oggetto posato non fa rumore');
  assert.ok(impactGain(2) > 0 && impactGain(10) === 1);
  const at = { x: 0, y: 0, z: 0 };
  const list = [5, 1, 3, 2].map((d) => ({ d, pos: { x: d, y: 0, z: 0 } }));
  assert.deepEqual(nearest(list, at, 2).map((s) => s.d), [1, 2]);
  // la scossa si smorza e finisce
  assert.ok(Math.abs(shakeAt(0.05, 1).x) > Math.abs(shakeAt(0.5, 1).x) || Math.abs(shakeAt(0.5, 1).x) < 0.002);
  assert.equal(shakeAt(0.7, 1), null);
  assert.equal(shakeAt(0.1, 0), null);
});

test('G8: suoni da Freesound con licenza CC0, uno per file', () => {
  const names = new Set();
  for (const s of SOUNDS) {
    assert.ok(!names.has(s.name), `doppio: ${s.name}`);
    names.add(s.name);
    assert.ok(fs.existsSync(new URL(`../../src/game/audio/sfx/${s.name}.ogg`, import.meta.url)), `manca sfx/${s.name}.ogg (node scripts/sounds.mjs)`);
    assert.ok(s.cut[1] > s.cut[0] && s.gain > 0 && s.gain <= 1, s.name);
    assert.match(soundPage(s), /^https:\/\/freesound\.org\/people\/[^/]+\/sounds\/\d+\/$/);
  }
  // i suoni che il gioco usa esistono tutti
  const src = ['game.js', 'game-view.js', 'apparatus.js'].map((f) => fs.readFileSync(new URL(`../../src/game/${f}`, import.meta.url), 'utf8')).join('\n');
  const used = new Set([...src.matchAll(/\b(?:sfx|play)\('([\w-]+)'/g)].map((m) => m[1]));
  assert.ok(used.size >= 8);
  for (const n of used) assert.ok(names.has(n), `suono sconosciuto: ${n}`);
  // e quelli ad anello (soundLoops)
  for (const n of ['pour', 'tap', 'bunsen', 'fire', 'extinguisher', 'fizz', 'boil', 'hiss', 'bubbles', 'alarm', 'glass-break', 'explosion', 'bell', 'ignite', 'click', 'ping', 'cap', 'glass-down', 'clink', 'pop']) assert.ok(names.has(n), n);
});

test('G8: qualità adattiva (un passo dopo due misure lente, mai nei primi 3 s)', () => {
  const q = new QualityMeter(GAME_ADAPT.pro, 36);
  // all'inizio, anche se lento, niente
  for (let i = 0; i < 20; i++) assert.equal(q.push(0.05), null);
  // veloce: niente
  for (let i = 0; i < 400; i++) assert.equal(q.push(1 / 60), null);
  // lento (20 fps) per 4 s: il primo passo
  const steps = [];
  for (let i = 0; i < 90; i++) {
    const s = q.push(0.05);
    if (s) steps.push(s);
  }
  assert.deepEqual(steps, ['supersample']);
  assert.deepEqual(q.done(), ['supersample']);
  // sempre lento: tutti i passi, poi basta
  for (let i = 0; i < 2000; i++) q.push(0.05);
  assert.deepEqual(q.done(), GAME_ADAPT.pro);
  assert.equal(q.push(0.05), null);
  assert.deepEqual(new QualityMeter(GAME_ADAPT.simple, 30).done(), []);
});

test('G8: testi di cartelli, strumenti, impostazioni e audio', () => {
  for (const k of SIGN_KEYS) assert.ok(has(`sign_${k}`), `sign_${k}`);
  for (const k of ['voltmeter', 'bridge', 'gasMeter']) assert.ok(has(`fx_${k}`), `fx_${k}`);
  for (const k of ['empty', 'electrode', 'ions', 'bridge', 'same']) assert.ok(has(`stVolt_${k}`), `stVolt_${k}`);
  for (const k of ['volume', 'volumeTitle', 'mutedShort', 'shakeLabel', 'audioOn', 'audioOff', 'helpAudioRow', 'qualityDown', 'lgBridgeIn', 'lgBridgeOut', 'lgMeterReset']) assert.ok(has(k), k);
  assert.ok(STATIONS.some((s) => s.key === 'cell'));
  // la nota del menu non dice più che il gioco è «in sviluppo»
  for (const l of ['it', 'en']) assert.ok(!/sviluppo|development|arriveranno|will come/i.test(GAME_STRINGS[l].prototypeNote), l);
});
