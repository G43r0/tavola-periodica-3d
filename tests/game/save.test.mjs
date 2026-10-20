// Test dei salvataggi del simulatore (save.js): versione, migrazione dalla versione 1, profili. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, SAVE_VERSION, activeProfile, addProfile, renameProfile, deleteProfile, selectProfile, updateActive, newer, cleanName } from '../../src/game/save.js';
import { chapterExercises, PASS_STARS, reputation } from '../../src/game/career.js';

const NOW = '2026-10-17T10:00:00.000Z';

test('salvataggi: niente (o qualcosa di rotto) diventa un salvataggio nuovo con un profilo', () => {
  for (const raw of [null, undefined, 'x', 42, [], { version: 2, profiles: 'no' }]) {
    const s = migrate(raw, NOW);
    assert.equal(s.version, SAVE_VERSION);
    assert.equal(s.profiles.length, 1);
    assert.equal(s.active, s.profiles[0].id);
    assert.deepEqual(activeProfile(s).career.results, {});
    assert.equal(s.settings.chemMode, 'real');
  }
});

test('salvataggi: la versione 1 passa alla 2 senza perdere stelle, soldi, impostazioni e quaderno', () => {
  const v1 = { career: { index: 3, money: 42.5, stars: [4, 3.5, 5] }, chemMode: 'simple', legend: false, fov: 80, notebook: { rx: { 'cat-765': { t: 1 } } } };
  const s = migrate(v1, NOW);
  const p = activeProfile(s);
  assert.equal(p.career.money, 42.5);
  assert.equal(p.career.results.nacl.stars, 4);
  assert.equal(p.career.results.titration.stars, 3.5);
  assert.equal(p.career.results.goldrain.stars, 5);
  assert.deepEqual(p.notebook, v1.notebook);
  assert.deepEqual(s.settings, { chemMode: 'simple', legend: false, fov: 80 });
  // chi aveva cominciato la Carriera non rifà il tutorial
  for (const e of chapterExercises(0)) assert.equal(p.career.results[e.id].stars, PASS_STARS);
  assert.ok(reputation(p.career) > 0);
  // una carriera della versione 1 mai cominciata resta vuota
  assert.deepEqual(activeProfile(migrate({ career: { index: 0, money: 0, stars: [] } }, NOW)).career.results, {});
});

test('salvataggi: la versione 2 si rilegge uguale e i campi sbagliati si correggono', () => {
  const s = migrate({ career: { index: 1, money: 5, stars: [2] } }, NOW);
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(s)), NOW), s);
  const bad = migrate({ version: 2, active: 'zz', settings: { chemMode: 'weird', fov: 'x' }, profiles: [{ id: 'p1', name: '  Ada\n  ', career: { money: 'molti', results: { nacl: { stars: 9 }, x: null }, owned: [1, 'goggles'] } }] }, NOW);
  const p = activeProfile(bad);
  assert.equal(bad.active, 'p1');
  assert.equal(p.name, 'Ada');
  assert.equal(p.career.money, 0);
  assert.equal(p.career.results.nacl.stars, 5);
  assert.deepEqual(p.career.owned, ['goggles']);
  assert.equal(bad.settings.chemMode, 'real');
  assert.equal(bad.settings.fov, undefined);
});

test('salvataggi: profili (aggiungi, rinomina, scegli, elimina)', () => {
  let s = migrate(null, NOW);
  s = addProfile(s, 'Marie', NOW);
  assert.equal(s.profiles.length, 2);
  assert.equal(activeProfile(s).name, 'Marie');
  const marie = s.active;
  s = updateActive(s, { career: { ...activeProfile(s).career, money: 99 } });
  s = selectProfile(s, s.profiles[0].id);
  assert.equal(activeProfile(s).career.money, 0, 'ogni profilo ha la sua Carriera');
  s = renameProfile(s, marie, 'Marie Curie');
  assert.equal(s.profiles.find((p) => p.id === marie).name, 'Marie Curie');
  s = deleteProfile(s, s.active);
  assert.equal(s.profiles.length, 1);
  assert.equal(s.active, marie);
  assert.equal(deleteProfile(s, marie).profiles.length, 1, 'l\'ultimo profilo non si elimina');
  for (let i = 0; i < 10; i++) s = addProfile(s, `P${i}`, NOW) ?? s;
  assert.equal(s.profiles.length, 8, 'al massimo 8 profili');
  assert.equal(cleanName('x'.repeat(40), 'y').length, 24);
  assert.equal(cleanName('   ', 'Studente 1'), 'Studente 1');
});

test('salvataggi: tra il file dell\'app e localStorage vince il più recente', () => {
  const a = { savedAt: '2026-10-17T10:00:00.000Z' };
  const b = { savedAt: '2026-10-17T11:00:00.000Z' };
  assert.equal(newer(a, b), b);
  assert.equal(newer(b, a), b);
  assert.equal(newer(null, a), a);
  assert.equal(newer(a, null), a);
});
