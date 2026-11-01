// «Riduci movimento» del sistema (prefers-reduced-motion): scossa, lampo, campione 3D e visualizzatore. npm test
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prefersReducedMotion, specimenSpin, explosionFlash, viewerAutoplay } from '../../src/ui/motion.js';
import { migrate } from '../../src/game/save.js';

const NOW = '2026-11-01T10:00:00.000Z';
const reduce = (on) => {
  globalThis.matchMedia = (q) => ({ matches: on && q === '(prefers-reduced-motion: reduce)' });
};
afterEach(() => delete globalThis.matchMedia);

test('senza «riduci movimento»: scossa accesa, campione che ruota, lampo pieno, visualizzatore che parte', () => {
  reduce(false);
  assert.equal(prefersReducedMotion(), false);
  assert.equal(migrate(null, NOW).settings.shake, true);
  assert.ok(specimenSpin() > 0);
  assert.equal(explosionFlash(1), 12);
  assert.equal(viewerAutoplay(), true);
});

test('con «riduci movimento»: scossa spenta di default, campione fermo, lampo attenuato, visualizzatore in pausa', () => {
  reduce(true);
  assert.equal(prefersReducedMotion(), true);
  assert.equal(migrate(null, NOW).settings.shake, false);
  assert.equal(migrate({ version: 2, settings: { shake: true }, profiles: [] }, NOW).settings.shake, true, 'la scelta fatta nel menu resta');
  assert.equal(specimenSpin(), 0);
  assert.ok(explosionFlash(1) <= 3);
  assert.equal(viewerAutoplay(), false);
});

test('senza matchMedia (node, test) vale come «movimento normale»', () => {
  assert.equal(prefersReducedMotion(), false);
});
