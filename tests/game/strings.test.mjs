// Test dei testi del simulatore: ogni chiave usata dal codice esiste in italiano e in inglese. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GAME_STRINGS } from '../../src/game/game-strings.js';
import { ORDERS } from '../../src/game/orders.js';
import { DEFS } from '../../src/game/items.js';
import { BINS } from '../../src/game/mixture.js';
import { STATIONS } from '../../src/game/room.js';

const has = (key) => key in GAME_STRINGS.it && key in GAME_STRINGS.en;

test('testi del simulatore: chiavi scritte nel codice', () => {
  const src = ['game.js', 'game-view.js', 'orders.js'].map((f) => fs.readFileSync(new URL(`../../src/game/${f}`, import.meta.url), 'utf8')).join('\n');
  // t('chiave'…) e key: 'chiave' (passi e righe della valutazione)
  const keys = new Set([...src.matchAll(/\bt\('([a-zA-Z][\w]*)'/g), ...src.matchAll(/key: '([a-zA-Z][\w]*)'/g), ...src.matchAll(/\? '(ev[A-Z]\w*)' : '(ev[A-Z]\w*)'/g)].flatMap((m) => m.slice(1)).filter(Boolean));
  assert.ok(keys.size > 100);
  for (const k of keys) assert.ok(has(k), `testo mancante: ${k}`);
});

test('testi del simulatore: chiavi composte (esercitazioni, oggetti, rifiuti, postazioni)', () => {
  for (const o of ORDERS) for (const suffix of ['Title', 'Brief', 'BriefSimple', 'Board']) assert.ok(has(`${o.id}${suffix}`), `${o.id}${suffix}`);
  for (const o of ORDERS) assert.ok(Array.isArray(GAME_STRINGS.it[`${o.id}Board`]) && Array.isArray(GAME_STRINGS.en[`${o.id}Board`]));
  for (const k of Object.keys(DEFS)) assert.ok(has(`item_${k}`), `item_${k}`);
  for (const b of BINS) assert.ok(has(`bin_${b}`), `bin_${b}`);
  for (const w of ['sink', 'heavy', 'inorganic', 'organic', 'solid']) assert.ok(has(`waste_${w}`), `waste_${w}`);
  for (const s of STATIONS) assert.ok(has(`station_${s.key}`), `station_${s.key}`);
  for (const s of ['aq', 'solid', 'liquid', 'gas']) assert.ok(has(`state_${s}`));
  for (const a of ['fire', 'toxic', 'alarm']) assert.ok(has(`alarm_${a}`));
});
