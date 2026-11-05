// Test della logica della finestra «Qualcosa è andato storto»: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeError,
  isIgnorable,
  createErrorLog,
  reportText,
  issueUrl,
  ISSUE_MAX,
} from '../../src/ui/error-logic.js';

const ABOUT = {
  version: '0.9.2',
  system: 'Windows · app desktop (Electron 44.10.0, Chrome 140.0)',
  gfx: 'medium',
  lang: 'it',
  module: 'simulatore',
  url: 'file:///C:/app/index.html',
};

test('error-logic: un Error, una stringa o qualunque valore lanciato diventano messaggio e pila', () => {
  const err = new TypeError("Cannot read properties of undefined (reading 'x')");
  const a = describeError(err);
  assert.equal(a.name, 'TypeError');
  assert.equal(a.message, "Cannot read properties of undefined (reading 'x')");
  assert.match(a.stack, /error-logic\.test\.mjs/);
  assert.deepEqual(
    { ...describeError('qualcosa di rotto'), stack: '' },
    { name: 'Error', message: 'qualcosa di rotto', stack: '', source: '' },
  );
  assert.equal(describeError(undefined).message, 'undefined');
  assert.equal(describeError({ code: 7 }).message, '{"code":7}');
  // un oggetto che non si può trasformare in JSON (riferimento circolare) non fa lanciare
  const loop = {};
  loop.self = loop;
  assert.equal(typeof describeError(loop).message, 'string');
  // il file e la riga dell'evento `error` quando manca la pila
  assert.equal(describeError('x', { source: 'app.js', line: 3, col: 9 }).source, 'app.js:3:9');
  // un messaggio lunghissimo si taglia
  assert.ok(describeError('y'.repeat(10_000)).message.length <= 2000);
});

test('error-logic: errori da ignorare (innocui o non dell’app)', () => {
  const ignore = (message, extra = {}) => isIgnorable({ name: 'Error', message, stack: '', source: '', ...extra });
  assert.ok(ignore('ResizeObserver loop completed with undelivered notifications.'));
  assert.ok(ignore('ResizeObserver loop limit exceeded'));
  assert.ok(ignore('Script error.'));
  assert.ok(ignore('boom', { source: 'chrome-extension://abc/content.js:1:1' }));
  assert.ok(ignore('boom', { stack: 'Error: boom\n    at x (moz-extension://abc/c.js:1:1)' }));
  assert.ok(ignore('The play() request was interrupted by a call to pause().', { name: 'AbortError' }));
  assert.ok(
    ignore("play() failed because the user didn't interact with the document first.", { name: 'NotAllowedError' }),
  );
  assert.ok(!ignore("Cannot read properties of undefined (reading 'x')", { name: 'TypeError' }));
  assert.ok(!ignore('Script error.', { source: 'index.js:1:1' }), 'con un file non è il messaggio vuoto del browser');
});

test('error-logic: stesso errore contato una volta, al massimo 20 diversi', () => {
  const log = createErrorLog({ max: 20, now: () => 1000 });
  const e = describeError(new Error('sempre lo stesso'));
  for (let i = 0; i < 120; i++) assert.equal(log.add(e).fresh, i === 0);
  assert.equal(log.entries().length, 1);
  assert.equal(log.entries()[0].count, 120);
  for (let i = 0; i < 30; i++) log.add(describeError(new Error(`diverso ${i}`)));
  assert.equal(log.entries().length, 20);
  assert.equal(log.entries().at(-1).info.message, 'diverso 29');
  assert.equal(log.total(), 150);
});

test('error-logic: il testo di «Copia i dettagli» ha versione, sistema, modulo e pile corte', () => {
  const log = createErrorLog({ now: () => Date.UTC(2026, 10, 5, 10, 30) });
  const deep = new Error('profondo');
  deep.stack = ['Error: profondo', ...Array.from({ length: 40 }, (_, i) => `    at f${i} (game.js:${i}:1)`)].join('\n');
  log.add(describeError(deep));
  log.add(describeError(deep));
  log.add(describeError('secondo'));
  const text = reportText(log.entries(), ABOUT);
  assert.match(text, /Tavola Periodica 3D 0\.9\.2/);
  assert.match(text, /Windows · app desktop/);
  assert.match(text, /Grafica: medium · Lingua: it · Modulo: simulatore/);
  assert.match(text, /Error: profondo \(×2\)/);
  assert.match(text, /at f14 /);
  assert.doesNotMatch(text, /at f15 /, 'la pila si taglia a 15 righe');
  assert.match(text, /Error: secondo/);
  assert.match(text, /2026-11-05T10:30:00/);
});

test('error-logic: «Segnala» apre il modulo «Errore dell’app» già compilato, mai troppo lungo', () => {
  const log = createErrorLog();
  log.add(describeError(new Error('rotto')));
  const url = new URL(issueUrl(reportText(log.entries(), ABOUT), ABOUT));
  assert.equal(url.origin + url.pathname, 'https://github.com/G43r0/tavola-periodica-3d/issues/new');
  assert.equal(url.searchParams.get('template'), 'bug.yml');
  assert.equal(url.searchParams.get('version'), '0.9.2');
  assert.match(url.searchParams.get('system'), /Windows/);
  assert.equal(url.searchParams.get('area'), 'Simulatore di laboratorio (in prima persona)');
  assert.match(url.searchParams.get('actual'), /Error: rotto/);
  assert.match(url.searchParams.get('title'), /^Simulatore: /);
  // tanti errori lunghi: l'indirizzo resta sotto il limite e i dettagli dicono che sono tagliati
  const many = createErrorLog();
  for (let i = 0; i < 20; i++) many.add(describeError(new Error(`errore ${i} ${'z'.repeat(1500)}`)));
  const long = issueUrl(reportText(many.entries(), ABOUT), ABOUT);
  assert.ok(long.length <= ISSUE_MAX, `${long.length} caratteri`);
  assert.match(new URL(long).searchParams.get('actual'), /tagliat/);
});

test('error-logic: niente cartella dell’utente né indirizzo del server nei dettagli', () => {
  const err = new Error('rotto');
  err.stack = [
    'Error: rotto',
    '    at a (file:///C:/Users/Mario%20Rossi/AppData/Local/Programs/tavola-periodica-3d/resources/app.asar/dist/assets/game-view-AbC.js:1:2)',
    '    at b (http://127.0.0.1:5173/src/game/game.js:10:3)',
  ].join('\n');
  const { stack } = describeError(err);
  assert.doesNotMatch(stack, /Mario|Users|127\.0\.0\.1/);
  assert.match(stack, /dist\/assets\/game-view-AbC\.js:1:2/);
  assert.match(stack, /src\/game\/game\.js:10:3/);
});
