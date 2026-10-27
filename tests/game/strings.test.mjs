// Test dei testi del simulatore: ogni chiave usata dal codice esiste in italiano e in inglese. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GAME_STRINGS } from '../../src/game/game-strings.js';
import { EXERCISES, CHAPTERS, SHOP, REP_TITLES, EXTRAS, CHALLENGES, MEDALS, answerOptions, judgement } from '../../src/game/career.js';
import { DEFS } from '../../src/game/items.js';
import { BINS } from '../../src/game/mixture.js';
import { STATIONS } from '../../src/game/room.js';
import { KEY_IDS } from '../../src/game/controls.js';

const has = (key) => key in GAME_STRINGS.it && key in GAME_STRINGS.en;

test('testi del simulatore: chiavi scritte nel codice', () => {
  const src = ['game.js', 'game-view.js', 'orders.js', 'career.js', 'apparatus.js', 'book-view.js'].map((f) => fs.readFileSync(new URL(`../../src/game/${f}`, import.meta.url), 'utf8')).join('\n');
  // t('chiave'…) e key: 'chiave' (passi e righe della valutazione)
  const keys = new Set([...src.matchAll(/\bt\('([a-zA-Z][\w]*)'/g), ...src.matchAll(/key: '([a-zA-Z][\w]*)'/g), ...src.matchAll(/\? '(ev[A-Z]\w*)' : '(ev[A-Z]\w*)'/g)].flatMap((m) => m.slice(1)).filter(Boolean));
  assert.ok(keys.size > 100);
  for (const k of keys) assert.ok(has(k), `testo mancante: ${k}`);
});

test('testi del simulatore: chiavi composte (esercitazioni, oggetti, rifiuti, postazioni)', () => {
  for (const ex of EXERCISES) {
    for (const suffix of ['Title', 'Brief']) assert.ok(has(`${ex.id}${suffix}`), `${ex.id}${suffix}`);
    for (const st of ex.steps) assert.ok(has(st.key), `${ex.id}: ${st.key}`);
    for (const g of [...ex.goals, ...(ex.penalties ?? [])]) if (g.line && !g.answers) assert.ok(has(g.line), `${ex.id}: ${g.line}`);
    for (const r of ex.report ?? []) {
      assert.ok(has(r.q), `${ex.id}: ${r.q}`);
      for (const o of r.opts) if (o.startsWith('@')) assert.ok(has(o.slice(1)), `${ex.id}: ${o}`);
    }
    if (ex.answers?.type === 'choice' && ex.answers.options !== 'flame') for (const o of answerOptions(ex)) assert.ok(has(`ans_${o}`), `ans_${o}`);
  }
  for (const c of CHAPTERS) for (const suffix of ['Title', 'Text']) assert.ok(has(`chapter${c.id}${suffix}`), `chapter${c.id}${suffix}`);
  for (const x of SHOP) for (const suffix of ['', 'Text']) assert.ok(has(`shop_${x.id}${suffix}`), `shop_${x.id}${suffix}`);
  for (const r of REP_TITLES) assert.ok(has(`rep_${r.id}`), `rep_${r.id}`);
  for (const k of Object.keys(DEFS)) assert.ok(has(`item_${k}`), `item_${k}`);
  for (const b of BINS) assert.ok(has(`bin_${b}`), `bin_${b}`);
  for (const w of ['sink', 'heavy', 'inorganic', 'organic', 'solid']) assert.ok(has(`waste_${w}`), `waste_${w}`);
  for (const s of STATIONS) assert.ok(has(`station_${s.key}`), `station_${s.key}`);
  for (const s of ['aq', 'solid', 'liquid', 'gas']) assert.ok(has(`state_${s}`));
  for (const a of ['fire', 'toxic', 'alarm']) assert.ok(has(`alarm_${a}`));
  // posizioni del rubinetto della buretta (avviso, finestrella, legenda)
  for (let n = 0; n < 4; n++) for (const k of ['stopcock', 'stopcockSt', 'lgStopcock']) assert.ok(has(`${k}${n}`), `${k}${n}`);
});

test('testi del simulatore: verifiche, pagella, richieste extra e sfide a tempo (G7)', () => {
  for (const g of new Set(EXTRAS.map((e) => e.extra.giver))) assert.ok(has(`giver_${g}`), `giver_${g}`);
  for (const m of MEDALS) assert.ok(has(`medal_${m}`), `medal_${m}`);
  for (const v of ['ongoing', 'promoted', 'repeat']) assert.ok(has(`rcVerdict_${v}`), `rcVerdict_${v}`);
  for (const a of [5, 6.5, 7.5, 8.5, 9.5]) assert.ok(has(`judge_${judgement(a)}`), `judge_${judgement(a)}`);
  for (const c of CHALLENGES) assert.ok(has(`${c.ex}Title`), c.id);
  // le tre lingue: ogni consegna delle esercitazioni nuove c'è anche in «Spiegamelo come se avessi 6 anni»
  for (const ex of EXERCISES.filter((e) => e.chapter >= 5 || e.exam || e.extra)) assert.ok(`${ex.id}Brief` in GAME_STRINGS.eli6 || `${ex.id}BriefSimple` in GAME_STRINGS.eli6, `eli6: ${ex.id}`);
  // nessun testo della G7 resta «in arrivo»
  for (const lang of ['it', 'en']) for (const k of ['chapter5Text', 'chapter7Text']) assert.ok(!/arrivo|coming soon/i.test(GAME_STRINGS[lang][k]), `${lang}.${k}`);
});

test('testi del simulatore: legenda dei comandi (azioni e tasti)', () => {
  const src = fs.readFileSync(new URL('../../src/game/controls.js', import.meta.url), 'utf8');
  const actions = new Set([...src.matchAll(/'(lg[A-Z]\w*)'/g)].map((m) => m[1]));
  assert.ok(actions.size > 30);
  for (const k of actions) assert.ok(has(k), `testo mancante: ${k}`);
  for (const k of KEY_IDS) assert.ok(has(`key_${k}`), `key_${k}`);
});

test('testi del simulatore: finestrelle degli elementi fissi (nome di ogni elemento, rifiuti)', () => {
  for (const k of ['hotplate', 'bunsen', 'sink', 'balance', 'hood', 'shower', 'bell', 'store', 'towels', 'strips', 'bin', 'tray', 'notebook', 'lamp', 'tongs', 'mantle', 'power', 'gas', 'icebath', 'book']) assert.ok(has(`fx_${k}`), `fx_${k}`);
  for (const b of BINS.filter((b) => b !== 'sink')) assert.ok(has(`binNote_${b}`), `binNote_${b}`);
});

test('testi del simulatore: reazioni (cosa si vede, perché non reagisce, quaderno) e lampada', () => {
  for (const k of ['gas', 'coloredGas', 'precipitate', 'deposit', 'dissolves', 'colorChange', 'hot', 'warm', 'cold', 'fire']) assert.ok(has(`tag_${k}`), `tag_${k}`);
  const whys = ['heat', 'tooHot', 'flame', 'shock', 'light', 'catalyst', 'water', 'undissolved', 'conduct', 'missing', 'noble', 'lessActive', 'electrolysis', 'discharge', 'steam', 'equilibrium', 'catalyst-unknown', 'living'];
  const src = fs.readFileSync(new URL('../../src/game/signals.js', import.meta.url), 'utf8');
  for (const w of src.match(/const WHY_ORDER = \[([^\]]+)\]/)[1].match(/'([\w-]+)'/g).map((x) => x.slice(1, -1))) assert.ok(whys.includes(w), `motivo senza testo: ${w}`);
  for (const w of whys) assert.ok(has(`why_${w}`), `why_${w}`);
  for (const w of ['electrolysis', 'discharge', 'steam', 'equilibrium', 'catalyst', 'living', 'other']) assert.ok(has(`nbWhy_${w}`), `nbWhy_${w}`);
  assert.ok(has('fx_lamp'));
});

test('testi del simulatore: libro «Come si fa» (passi, osservazioni, colori, vie degli elementi, motivi)', () => {
  const kinds = ['hood', 'vessel', 'weigh', 'measure', 'liquid', 'water', 'aux', 'catalyst', 'stir', 'plate', 'bunsen', 'bunsenAny', 'flame', 'lamp', 'power', 'gas', 'wait', 'waitLight', 'observe', 'filter', 'tongs', 'dispose', 'disposeSink'];
  for (const k of kinds) assert.ok(has(`bk_step_${k}`), `bk_step_${k}`);
  for (const k of ['gas', 'coloredGas', 'precipitate', 'deposit', 'dissolves', 'colorChange', 'hot', 'warm', 'cold', 'fire', 'none']) assert.ok(has(`bkObs_${k}`), `bkObs_${k}`);
  for (const k of ['white', 'grey', 'black', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'brown', 'pink', 'none']) assert.ok(has(`bkColor_${k}`), `bkColor_${k}`);
  for (const k of ['native', 'air', 'industry', 'electrolysis', 'byproduct', 'reactor', 'accelerator', 'decay']) assert.ok(has(`bkWay_${k}`), `bkWay_${k}`);
  for (const k of ['tooHot', 'molten', 'unavailable', 'catalyst', 'gasOnly', 'shock', 'lowO2', 'engine', 'equilibrium', 'discharge', 'steam', 'living', 'catalystOff', 'other']) assert.ok(has(`bkWhy_${k}`), `bkWhy_${k}`);
  for (const k of ['time', 'yield', 'electro', 'light', 'fire']) assert.ok(has(`bkReal_${k}`), `bkReal_${k}`);
  for (const k of ['balance', 'cylinder', 'plate', 'bunsen', 'lamp', 'power', 'gas', 'tongs', 'filter', 'hood']) assert.ok(has(`bkTools_${k}`), `bkTools_${k}`);
});
