// I salvataggi di ogni versione dalla 0.8.0 si aprono (tests/fixtures/salvataggi/, vedi LEGGIMI.md): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { migrate, isValidSave, activeProfile, SAVE_VERSION } from '../../src/game/save.js';
import { chapterExercises, PASS_STARS } from '../../src/game/career.js';
import { loadNotebook } from '../../src/game/notebook.js';

const NOW = '2026-11-05T12:00:00.000Z';
const fixture = (v) =>
  JSON.parse(fs.readFileSync(new URL(`../fixtures/salvataggi/${v}.json`, import.meta.url), 'utf8'));
const VERSIONS = fs
  .readdirSync(new URL('../fixtures/salvataggi/', import.meta.url))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -5));

test('salvataggi: c’è un file per ogni versione pubblicata dalla 0.8.0', () => {
  for (const v of ['0.8.0', '0.9.0', '0.9.1', '0.9.2']) assert.ok(VERSIONS.includes(v), v);
});

test('salvataggi: ogni versione si apre, è valida e si rilegge uguale', () => {
  for (const v of VERSIONS) {
    const save = migrate(fixture(v), NOW);
    assert.equal(save.version, SAVE_VERSION, v);
    assert.ok(isValidSave(save), v);
    // scritto e riletto (come fa la vista) non cambia
    assert.deepEqual(migrate(JSON.parse(JSON.stringify(save)), NOW), save, v);
  }
});

test('salvataggi: la 0.8.0 diventa un profilo con le consegne di allora e il tutorial superato', () => {
  const save = migrate(fixture('0.8.0'), NOW);
  assert.equal(save.profiles.length, 1);
  const { career } = activeProfile(save);
  assert.equal(career.money, 145.5);
  assert.equal(career.results.nacl.stars, 3);
  assert.equal(career.results.titration.stars, 2);
  assert.equal(career.results.goldrain.stars, 3);
  for (const ex of chapterExercises(0)) assert.ok(career.results[ex.id].stars >= PASS_STARS, ex.id);
  assert.equal(save.settings.chemMode, 'simple');
  assert.equal(save.settings.legend, false);
});

test('salvataggi: dalla 0.9.0 alla 0.9.2 profili, Carriera, quaderno e impostazioni restano', () => {
  for (const v of ['0.9.0', '0.9.1', '0.9.2']) {
    const raw = fixture(v);
    const save = migrate(raw, NOW);
    assert.deepEqual(
      save.profiles.map((p) => p.name),
      ['Giulia', 'Marco'],
      v,
    );
    assert.equal(activeProfile(save).name, 'Giulia', v);
    const [giulia, marco] = save.profiles;
    const before = raw.profiles[0].career;
    assert.equal(giulia.career.money, before.money, v);
    assert.deepEqual(giulia.career.owned, ['goggles'], v);
    assert.deepEqual(giulia.career.challenges, before.challenges, v);
    for (const [id, r] of Object.entries(before.results)) {
      assert.equal(giulia.career.results[id].stars, r.stars, `${v} ${id}`);
      assert.equal(giulia.career.results[id].report, r.report, `${v} ${id}`);
      assert.equal(giulia.career.results[id].tries, r.tries, `${v} ${id}`);
      assert.equal(giulia.career.results[id].mark, r.mark, `${v} ${id}`);
    }
    assert.equal(marco.career.incidents, 2, v);
    const nb = loadNotebook(giulia.notebook);
    assert.deepEqual(Object.keys(nb.rx).sort(), ['acqua', 'hcl', 'nacl'], v);
    assert.equal(nb.rx.nacl.count, 2, v);
    assert.deepEqual(
      { ...save.settings },
      { chemMode: 'simple', legend: true, fov: 72, volume: 0.6, muted: false, shake: false },
      v,
    );
  }
});
