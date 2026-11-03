// Licenze e avvisi di terze parti: l'elenco nell'app (THIRD_PARTY), THIRD_PARTY_NOTICES.md e LICENSE devono dire le
// stesse cose di package.json, di node_modules e dell'elenco dei suoni. Se cambia una licenza o un suono: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { THIRD_PARTY } from '../../src/data/third-party.js';
import { SOUNDS } from '../../src/game/audio/sound-list.js';
import { licensesList } from '../../src/ui/info-dialog.js';

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const notices = read('THIRD_PARTY_NOTICES.md');

test("ogni pacchetto che finisce nell'app è in THIRD_PARTY con la sua licenza", () => {
  const packages = [
    'three',
    '@dimforge/rapier3d-compat',
    '@fontsource/ibm-plex-sans',
    '@fontsource/ibm-plex-mono',
    'electron',
    'electron-updater',
  ];
  for (const p of packages) {
    const entry = THIRD_PARTY.find((x) => x.name === p);
    assert.ok(entry, `THIRD_PARTY: manca ${p}`);
    const { license } = JSON.parse(read(`node_modules/${p}/package.json`));
    assert.equal(entry.license, license, `${p}: la licenza non è quella di node_modules`);
  }
  for (const p of ['@fontsource/ibm-plex-sans', '@fontsource/ibm-plex-mono']) {
    assert.equal(THIRD_PARTY.find((x) => x.name === p).license, 'OFL-1.1');
  }
});

test('i suoni CC0 sono tutti citati', () => {
  const freesound = THIRD_PARTY.find((x) => x.name === 'Freesound');
  assert.ok(freesound, 'THIRD_PARTY: manca Freesound');
  assert.equal(freesound.license, 'CC0-1.0');
  // il numero scritto nell'elenco è quello dei suoni del simulatore
  assert.ok(freesound.use.it.includes(String(SOUNDS.length)), `Freesound (it): deve dire ${SOUNDS.length} suoni`);
  assert.ok(freesound.use.en.includes(String(SOUNDS.length)), `Freesound (en): deve dire ${SOUNDS.length} suoni`);
  const lines = notices.split(/\r?\n/);
  for (const s of SOUNDS) {
    assert.ok(
      lines.some((line) => line.includes(String(s.id)) && line.includes(s.user)),
      `THIRD_PARTY_NOTICES.md: manca il suono ${s.name} (${s.id}, ${s.user})`,
    );
  }
});

test('THIRD_PARTY_NOTICES.md elenca ogni voce di THIRD_PARTY', () => {
  assert.ok(THIRD_PARTY.length >= 7, 'almeno i 6 pacchetti e Freesound');
  const names = new Set();
  for (const x of THIRD_PARTY) {
    assert.ok(!names.has(x.name), `${x.name}: voce doppia`);
    names.add(x.name);
    assert.ok(x.license, `${x.name}: manca la licenza`);
    assert.equal(new URL(x.url).protocol, 'https:', `${x.name}: il collegamento deve essere https`);
    assert.ok(x.use.it && x.use.en, `${x.name}: l'uso va scritto in italiano e in inglese`);
    assert.ok(notices.includes(x.name), `THIRD_PARTY_NOTICES.md: manca il nome «${x.name}»`);
    assert.ok(notices.includes(x.license), `THIRD_PARTY_NOTICES.md: manca la licenza «${x.license}» di ${x.name}`);
  }
});

test('LICENSE è MIT come package.json', () => {
  assert.match(read('LICENSE'), /MIT License/);
  assert.equal(JSON.parse(read('package.json')).license, 'MIT');
});

test('la sezione «Licenze» della finestra elenca ogni voce con licenza e collegamento', () => {
  const html = licensesList();
  assert.equal(html.match(/<li>/g).length, THIRD_PARTY.length);
  for (const x of THIRD_PARTY) {
    assert.ok(html.includes(`href="${x.url}"`), `${x.name}: manca il collegamento`);
    assert.ok(html.includes(`<b>${x.license}</b>`), `${x.name}: manca la licenza`);
  }
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|#39;)/.test(html), 'il testo va protetto con esc()');
  assert.ok(html.includes('Housecroft &amp; Sharpe'));
});

test("LICENSE e gli avvisi di terze parti entrano nell'app impacchettata", () => {
  // MIT, OFL e Apache-2.0 chiedono che l'avviso viaggi con le copie distribuite (font e WASM sono dentro l'app)
  const { files } = JSON.parse(read('package.json')).build;
  for (const f of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(files.includes(f), `package.json: build.files deve includere ${f}`);
  }
});
