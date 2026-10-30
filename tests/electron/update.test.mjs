// Test della logica degli aggiornamenti dell'app desktop: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { compareVersions, isNewer, latestFromRelease, parseSettings, parseVersion, RELEASES_URL } = createRequire(import.meta.url)('../../electron/update-logic.cjs');

test('versioni: confronto semantico, anche a più cifre e con le versioni di prova', () => {
  assert.equal(compareVersions('0.9.2', '0.9.1'), 1);
  assert.equal(compareVersions('v0.9.10', '0.9.9'), 1, 'i numeri si confrontano come numeri');
  assert.equal(compareVersions('1.0.0', '0.9.99'), 1);
  assert.equal(compareVersions('1.0.0-rc.1', '1.0.0'), -1, 'la finale viene dopo la prova');
  assert.equal(compareVersions('1.0.0-rc.2', '1.0.0-rc.10'), -1);
  assert.equal(compareVersions('1.0.0', 'v1.0.0'), 0);
  assert.equal(compareVersions('boh', '1.0.0'), 0, 'un testo che non è una versione non fa scattare nulla');
  assert.equal(parseVersion('1.2'), null);
  assert.ok(isNewer('0.9.2', '0.9.1') && !isNewer('0.9.1', '0.9.1') && !isNewer('0.9.0', '0.9.1'));
});

test('ultima release: solo se è più nuova, pubblica e non di prova', () => {
  const rel = (o) => ({ tag_name: 'v0.9.2', html_url: `${RELEASES_URL}/tag/v0.9.2`, draft: false, prerelease: false, ...o });
  assert.deepEqual(latestFromRelease(rel(), '0.9.1'), { version: '0.9.2', url: `${RELEASES_URL}/tag/v0.9.2` });
  assert.equal(latestFromRelease(rel(), '0.9.2'), null, 'già aggiornata');
  assert.equal(latestFromRelease(rel(), '1.0.0'), null, 'chi ha una versione più nuova non torna indietro');
  assert.equal(latestFromRelease(rel({ prerelease: true }), '0.9.1'), null);
  assert.equal(latestFromRelease(rel({ draft: true }), '0.9.1'), null);
  assert.equal(latestFromRelease(rel({ tag_name: 'nightly' }), '0.9.1'), null);
  assert.equal(latestFromRelease(null, '0.9.1'), null);
  assert.equal(latestFromRelease('<html>', '0.9.1'), null);
});

test('ultima release: il collegamento da aprire è sempre una pagina del nostro repository', () => {
  const evil = latestFromRelease({ tag_name: 'v0.9.2', html_url: 'https://example.com/scarica.exe' }, '0.9.1');
  assert.equal(evil.url, RELEASES_URL);
  assert.equal(latestFromRelease({ tag_name: 'v0.9.2' }, '0.9.1').url, RELEASES_URL);
});

test('impostazioni: ricerca automatica attiva salvo scelta contraria, file rotti ignorati', () => {
  assert.deepEqual(parseSettings('{"autoUpdate":false}'), { autoUpdate: false });
  assert.deepEqual(parseSettings('{"autoUpdate":true}'), { autoUpdate: true });
  assert.deepEqual(parseSettings('{}'), { autoUpdate: true });
  assert.deepEqual(parseSettings('{rotto'), { autoUpdate: true });
  assert.deepEqual(parseSettings('null'), { autoUpdate: true });
  assert.deepEqual(parseSettings('{"autoUpdate":"no"}'), { autoUpdate: true }, 'solo false vale come «spento»');
});
