// Test del menu, della sicurezza e della CSP dell'app desktop: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { devCsp } from '../../scripts/dev-csp.mjs';
import { versionFooter } from '../../src/ui/info-dialog.js';

const require = createRequire(import.meta.url);
const { menuTemplate } = require('../../electron/menu.cjs');
const { lockDownSession } = require('../../electron/security.cjs');

const items = (tpl) => tpl.flatMap((m) => m.submenu ?? []);

test('menu: «Informazioni su Tavola Periodica 3D» (ruolo about) in italiano e in inglese', () => {
  for (const [lang, label] of [['it', /Informazioni su Tavola Periodica 3D/], ['en', /About Tavola Periodica 3D/]]) {
    const about = items(menuTemplate(lang, { isDev: false })).find((i) => i.role === 'about');
    assert.ok(about, lang);
    assert.match(about.label, label);
  }
  assert.ok(!items(menuTemplate('it', { isDev: false })).some((i) => i.role === 'toggleDevTools'));
  assert.ok(items(menuTemplate('it', { isDev: true })).some((i) => i.role === 'toggleDevTools'));
});

test('sessione: la pagina non ottiene permessi (fotocamera, microfono, posizione, notifiche…) tranne quelli che usa', () => {
  const session = {
    setPermissionRequestHandler(fn) { this.request = fn; },
    setPermissionCheckHandler(fn) { this.check = fn; },
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

test('CSP: in produzione niente indirizzo del server di sviluppo, in sviluppo il WebSocket della porta di Vite', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const csp = (h) => h.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/)[1];
  assert.doesNotMatch(csp(html), /ws:|127\.0\.0\.1|localhost/);
  const dev = csp(devCsp(html, 5175));
  assert.match(dev, /connect-src 'self' ws:\/\/127\.0\.0\.1:5175(;|$)/);
  assert.equal(csp(devCsp(devCsp(html, 5175), 5175)), dev, 'una volta sola');
});

test('informazioni: la versione dell\'app (con Electron e Chrome nell\'app desktop) e le note di rilascio', () => {
  const web = versionFooter('1.0.0', null);
  assert.match(web, /1\.0\.0/);
  assert.match(web, /href="https:\/\/github\.com\/[^"]+\/releases\/tag\/v1\.0\.0"/);
  assert.doesNotMatch(web, /Electron/);
  assert.match(versionFooter('1.0.0', { electron: '33.2.0', chrome: '130.0' }), /Electron 33\.2\.0.*Chrome 130\.0/s);
  assert.equal(versionFooter(null, null), '');
});
