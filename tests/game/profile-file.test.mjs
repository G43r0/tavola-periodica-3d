// File di profilo: esporta un profilo del simulatore e importalo su un altro computer (src/game/profile-file.js). npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { migrate, isValidSave, addProfile, activeProfile } from '../../src/game/save.js';
import {
  exportProfile,
  profileFileText,
  profileFileName,
  parseProfileFile,
  importProfile,
  crc32,
  PROFILE_FILE_MAX,
} from '../../src/game/profile-file.js';

const NOW = '2026-11-05T12:00:00.000Z';
const school = () =>
  migrate(JSON.parse(fs.readFileSync(new URL('../fixtures/salvataggi/0.9.2.json', import.meta.url), 'utf8')), NOW);

test('profile-file: CRC-32 come lo calcolano zlib e PNG', () => {
  assert.equal(crc32('123456789'), 0xcbf43926);
  assert.equal(crc32(''), 0);
  assert.equal(crc32('Tavola Periodica 3D · è'), crc32('Tavola Periodica 3D · è'));
  assert.notEqual(crc32('Giulia'), crc32('Giulio'));
});

test('profile-file: esportato e reimportato, il profilo è identico', () => {
  const save = school();
  const giulia = activeProfile(save);
  const file = exportProfile(save, giulia.id, { app: '1.0.0', now: NOW });
  assert.equal(file.format, 'tp3d-profilo');
  assert.equal(file.version, 1);
  assert.equal(file.app, '1.0.0');
  assert.match(file.check, /^crc32:[0-9a-f]{8}$/);
  const parsed = parseProfileFile(profileFileText(file));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.profile, giulia);
  assert.equal(parsed.app, '1.0.0');
  assert.equal(parsed.exported, NOW);
  assert.equal(profileFileName('Giulia Rossi-Bianchi è', NOW), 'tp3d-profilo-giulia-rossi-bianchi-e-2026-11-05.json');
  assert.equal(profileFileName('???', NOW), 'tp3d-profilo-profilo-2026-11-05.json');
});

test('profile-file: file rovinati, di un’app più nuova o troppo grandi si rifiutano', () => {
  const save = school();
  const text = profileFileText(exportProfile(save, save.active, { app: '1.0.0', now: NOW }));
  const err = (t) => parseProfileFile(t).error;
  assert.equal(err('{"format":'), 'json');
  assert.equal(err(''), 'json');
  assert.equal(err('[1,2]'), 'format');
  assert.equal(err('{"format":"altro","version":1}'), 'format');
  assert.equal(err(JSON.stringify({ ...JSON.parse(text), version: 'uno' })), 'format');
  // un numero cambiato a mano: il controllo non torna
  assert.equal(err(text.replace('"money": 95.75', '"money": 9999')), 'check');
  // troncato a metà
  assert.equal(err(text.slice(0, text.length / 2)), 'json');
  // un'app più nuova con un formato che questa non conosce
  const future = { ...JSON.parse(text), version: 2 };
  assert.equal(err(JSON.stringify(future)), 'version');
  assert.equal(err('x'.repeat(PROFILE_FILE_MAX + 1)), 'size');
  assert.equal(parseProfileFile(42).error, 'size');
  // senza profilo dentro
  const { profile: _profile, check: _check, ...rest } = JSON.parse(text);
  assert.equal(err(JSON.stringify(rest)), 'format');
});

test('profile-file: un profilo con dati rovinati ma il controllo giusto passa da migrate', () => {
  const save = school();
  const file = exportProfile(save, save.active, { app: '1.0.0', now: NOW });
  // qualcuno ha scritto un file a mano, con il controllo ricalcolato: i valori impossibili si correggono
  const body = {
    ...file,
    profile: { ...file.profile, career: { ...file.profile.career, money: 'tanti', results: { carry: { stars: 99 } } } },
  };
  delete body.check;
  const forged = exportProfile({ ...save, profiles: [body.profile], active: body.profile.id }, body.profile.id, {
    app: '1.0.0',
    now: NOW,
  });
  const parsed = parseProfileFile(profileFileText(forged));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.profile.career.money, 0);
  assert.equal(parsed.profile.career.results.carry.stars, 5);
});

test('profile-file: lo stesso profilo (stessa data di creazione) si sostituisce, uno nuovo si aggiunge', () => {
  // a scuola: Giulia esporta; a casa c'è un salvataggio con un altro profilo
  const atSchool = school();
  const giulia = activeProfile(atSchool);
  const file = parseProfileFile(profileFileText(exportProfile(atSchool, giulia.id, { app: '1.0.0', now: NOW })));
  let atHome = migrate(null, '2026-11-01T08:00:00.000Z');
  const added = importProfile(atHome, file);
  assert.equal(added.action, 'added');
  atHome = added.save;
  assert.ok(isValidSave(atHome));
  assert.equal(atHome.profiles.length, 2);
  assert.equal(activeProfile(atHome).name, 'Giulia');
  assert.equal(activeProfile(atHome).created, giulia.created, 'la data di creazione resta: è l’identità del profilo');
  assert.notEqual(added.id, atHome.profiles[0].id, 'id nuovo se quello del file è già usato');

  // a casa Giulia guadagna soldi, esporta; a scuola si reimporta: sostituisce, non duplica
  const richer = {
    ...atHome,
    profiles: atHome.profiles.map((p) => (p.id === added.id ? { ...p, career: { ...p.career, money: 500 } } : p)),
  };
  const back = parseProfileFile(profileFileText(exportProfile(richer, added.id, { app: '1.0.0', now: NOW })));
  const replaced = importProfile(atSchool, back);
  assert.equal(replaced.action, 'replaced');
  assert.equal(replaced.id, giulia.id);
  assert.equal(replaced.save.profiles.length, atSchool.profiles.length);
  assert.equal(replaced.save.profiles.find((p) => p.id === giulia.id).career.money, 500);
  assert.ok(isValidSave(replaced.save));

  // otto profili e uno nuovo: non c'è posto
  let full = migrate(null, NOW);
  for (let i = 0; i < 7; i++) full = addProfile(full, `P${i}`, `2026-11-05T12:00:0${i}.000Z`);
  assert.equal(full.profiles.length, 8);
  assert.deepEqual(importProfile(full, file), { error: 'full' });
});
