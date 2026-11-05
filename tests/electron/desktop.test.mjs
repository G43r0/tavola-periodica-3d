// Test del menu, della sicurezza e della CSP dell'app desktop: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { devCsp } from '../../scripts/dev-csp.mjs';
import { versionFooter } from '../../src/ui/info-dialog.js';

const require = createRequire(import.meta.url);
const { menuTemplate } = require('../../electron/menu.cjs');
const { lockDownSession, lockWebContents } = require('../../electron/security.cjs');
const { watchRenderer } = require('../../electron/recover.cjs');

const items = (tpl) => tpl.flatMap((m) => m.submenu ?? []);

test('menu: «Informazioni su Tavola Periodica 3D» (ruolo about) in italiano e in inglese', () => {
  for (const [lang, label] of [
    ['it', /Informazioni su Tavola Periodica 3D/],
    ['en', /About Tavola Periodica 3D/],
  ]) {
    const about = items(menuTemplate(lang, { isDev: false })).find((i) => i.role === 'about');
    assert.ok(about, lang);
    assert.match(about.label, label);
  }
  assert.ok(!items(menuTemplate('it', { isDev: false })).some((i) => i.role === 'toggleDevTools'));
  assert.ok(items(menuTemplate('it', { isDev: true })).some((i) => i.role === 'toggleDevTools'));
});

test('menu: «Apri la cartella dei registri» nell’Aiuto, solo se c’è chi la apre', () => {
  let opened = 0;
  for (const [lang, label] of [
    ['it', 'Apri la cartella dei registri'],
    ['en', 'Open the log folder'],
  ]) {
    const item = items(menuTemplate(lang, { onOpenLogs: () => opened++ })).find((i) => i.label === label);
    assert.ok(item, lang);
    item.click();
  }
  assert.equal(opened, 2);
  assert.ok(!items(menuTemplate('it')).some((i) => /registri/.test(i.label ?? '')));
});

test('sessione: la pagina non ottiene permessi (fotocamera, microfono, posizione, notifiche…) tranne quelli che usa', () => {
  const session = {
    setPermissionRequestHandler(fn) {
      this.request = fn;
    },
    setPermissionCheckHandler(fn) {
      this.check = fn;
    },
  };
  lockDownSession(session);
  for (const perm of ['media', 'geolocation', 'notifications', 'clipboard-read']) {
    let granted = null;
    session.request({}, perm, (ok) => (granted = ok));
    assert.equal(granted, false, perm);
    assert.equal(session.check({}, perm), false, perm);
  }
  // il simulatore blocca il puntatore per guardarsi intorno; copiare la SMILES scrive negli appunti
  for (const perm of ['pointerLock', 'fullscreen', 'clipboard-sanitized-write']) {
    let granted = null;
    session.request({}, perm, (ok) => (granted = ok));
    assert.equal(granted, true, perm);
    assert.equal(session.check({}, perm), true, perm);
  }
});

test('lockWebContents blocca le webview', () => {
  const contents = {
    on(event, fn) {
      (this.handlers ??= {})[event] = fn;
    },
  };
  lockWebContents(contents);
  assert.equal(typeof contents.handlers['will-attach-webview'], 'function');
  let prevented = 0;
  contents.handlers['will-attach-webview']({ preventDefault: () => prevented++ });
  assert.equal(prevented, 1);
});

// Finta finestra: webContents.reload e send si contano, once('did-finish-load') si fa scattare a mano.
function fakeWindow() {
  const once = {};
  const webContents = {
    reloads: 0,
    sent: [],
    reload() {
      this.reloads++;
    },
    once(event, fn) {
      once[event] = fn;
    },
    send(channel, ...args) {
      this.sent.push([channel, ...args]);
    },
  };
  return { win: { webContents }, webContents, finishLoad: () => once['did-finish-load']?.() };
}

test('watchRenderer: un crash ricarica e avvisa', () => {
  const { win, webContents, finishLoad } = fakeWindow();
  let gaveUp = 0;
  const watcher = watchRenderer(win, { now: () => 0, onGiveUp: () => gaveUp++ });
  watcher.handle({ reason: 'crashed', exitCode: 11 });
  assert.equal(webContents.reloads, 1);
  assert.deepEqual(webContents.sent, [], "l'avviso parte solo a pagina caricata");
  finishLoad();
  assert.deepEqual(webContents.sent, [['app:recovered']]);
  assert.equal(gaveUp, 0);
});

test('watchRenderer: secondo crash entro 30 s non ricarica', () => {
  const { win, webContents } = fakeWindow();
  let t = 0;
  const gaveUp = [];
  const watcher = watchRenderer(win, { now: () => t, onGiveUp: (d) => gaveUp.push(d) });
  watcher.handle({ reason: 'crashed' });
  t = 10_000;
  const second = { reason: 'oom' };
  watcher.handle(second);
  assert.equal(webContents.reloads, 1, 'niente ricaricamento infinito');
  assert.deepEqual(gaveUp, [second], 'onGiveUp riceve i dettagli del secondo crash, una volta sola');
  // anche un terzo crash, sempre entro 30 s dall'ultimo ricaricamento, resta senza ricaricamento
  t = 20_000;
  watcher.handle({ reason: 'crashed' });
  assert.equal(webContents.reloads, 1);
  assert.equal(gaveUp.length, 2);

  // a più di 30 s dal ricaricamento precedente il secondo crash è un caso nuovo: si ricarica di nuovo
  const late = fakeWindow();
  let later = 0;
  const lateGaveUp = [];
  const lateWatcher = watchRenderer(late.win, { now: () => later, onGiveUp: (d) => lateGaveUp.push(d) });
  lateWatcher.handle({ reason: 'crashed' });
  later = 31_000;
  lateWatcher.handle({ reason: 'crashed' });
  assert.equal(late.webContents.reloads, 2);
  assert.deepEqual(lateGaveUp, []);
});

test('watchRenderer: clean-exit non fa nulla', () => {
  const { win, webContents, finishLoad } = fakeWindow();
  let gaveUp = 0;
  const watcher = watchRenderer(win, { now: () => 0, onGiveUp: () => gaveUp++ });
  watcher.handle({ reason: 'clean-exit', exitCode: 0 });
  finishLoad();
  assert.equal(webContents.reloads, 0);
  assert.deepEqual(webContents.sent, []);
  assert.equal(gaveUp, 0);
  // e non conta come ricaricamento: un crash subito dopo ricarica
  watcher.handle({ reason: 'crashed' });
  assert.equal(webContents.reloads, 1);
});

test("watchRenderer: finestra già distrutta (chiusura dell'app) non ricarica e non si arrende", () => {
  // se il renderer muore mentre l'app si chiude, `reload()` su un oggetto distrutto lancerebbe nel processo principale
  for (const destroyed of ['window', 'webContents']) {
    const { win, webContents, finishLoad } = fakeWindow();
    (destroyed === 'window' ? win : webContents).isDestroyed = () => true;
    let gaveUp = 0;
    const watcher = watchRenderer(win, { now: () => 0, onGiveUp: () => gaveUp++ });
    // due crash di fila: né il ricaricamento né la resa, e il codice non deve lanciare
    watcher.handle({ reason: 'crashed', exitCode: 11 });
    watcher.handle({ reason: 'oom' });
    finishLoad();
    assert.equal(webContents.reloads, 0, `${destroyed} distrutta: nessun ricaricamento`);
    assert.deepEqual(webContents.sent, [], `${destroyed} distrutta: nessun avviso`);
    assert.equal(gaveUp, 0, `${destroyed} distrutta: onGiveUp non parte`);
  }
});

test('fusibili nella configurazione di electron-builder', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.deepEqual(pkg.build.electronFuses, {
    runAsNode: false,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
  });
});

test('CSP: object-src e base-uri none (niente plugin né <base> che cambi gli indirizzi)', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/)[1];
  assert.match(csp, /(^|;\s*)object-src 'none'(;|$)/);
  assert.match(csp, /(^|;\s*)base-uri 'none'(;|$)/);
});

test('CSP: in produzione niente indirizzo del server di sviluppo, in sviluppo il WebSocket della porta di Vite', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const csp = (h) => h.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/)[1];
  assert.doesNotMatch(csp(html), /ws:|127\.0\.0\.1|localhost/);
  const dev = csp(devCsp(html, 5175));
  assert.match(dev, /connect-src 'self' ws:\/\/127\.0\.0\.1:5175(;|$)/);
  assert.equal(csp(devCsp(devCsp(html, 5175), 5175)), dev, 'una volta sola');
});

test("informazioni: la versione dell'app (con Electron e Chrome nell'app desktop) e le note di rilascio", () => {
  const web = versionFooter('1.0.0', null);
  assert.match(web, /1\.0\.0/);
  assert.match(web, /href="https:\/\/github\.com\/[^"]+\/releases\/tag\/v1\.0\.0"/);
  assert.doesNotMatch(web, /Electron/);
  assert.match(versionFooter('1.0.0', { electron: '33.2.0', chrome: '130.0' }), /Electron 33\.2\.0.*Chrome 130\.0/s);
  assert.equal(versionFooter(null, null), '');
});
