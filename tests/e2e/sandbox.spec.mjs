import { test, expect, openModule } from './fixtures.mjs';

// Il seme del mondo è casuale (Date.now() all'apertura): perché la prova sia ripetibile, griglie comprese, si ferma il
// tempo, si fissano seme e passo e solo dopo si carica l'esempio. L'innesco della termite non dipende dal seme
// (tests/sandbox/sandbox.test.mjs lo prova con 25 semi su ogni griglia).
const SEED = 23758;

/**
 * Impronta della griglia (tipo di materia, contenuto e flag di ogni cella) e numero di celle occupate, dal gancio
 * `window.__sandbox`. Due griglie uguali hanno la stessa impronta.
 */
const grid = (page) =>
  page.evaluate(() => {
    const { world } = window.__sandbox;
    let hash = 2166136261;
    for (const cells of [world.type, world.ctype, world.flags]) {
      for (const v of cells) hash = Math.imul(hash ^ v, 16777619);
    }
    return { hash: hash >>> 0, filled: world.type.reduce((n, id) => n + (id ? 1 : 0), 0) };
  });

const tick = (page) => page.evaluate(() => window.__sandbox.world.tick);
const running = (page) => page.evaluate(() => window.__sandbox.state.running);

test('esempio termite, registro, annulla e ripeti', async ({ page }) => {
  await openModule(page, 'sandbox');
  const play = page.locator('.sbx [data-act="play"]');
  const log = page.locator('.sbx-log__body');

  // tempo fermo, mondo vuoto con seme e passo fissi
  await play.click();
  await expect.poll(() => running(page)).toBe(false);
  await page.evaluate((seed) => {
    const { world } = window.__sandbox;
    world.rng = seed;
    world.tick = 0;
  }, SEED);
  const empty = await grid(page);
  expect(empty.filled).toBe(0);

  // l'esempio «Termite» dalla presentazione iniziale: carica la scena e rimette in moto il tempo
  await page.locator('.sbx-intro [data-preset="termite"]').click();
  await expect.poll(() => running(page)).toBe(true);
  await expect.poll(async () => (await grid(page)).filled).toBeGreaterThan(0);

  // 10 s di simulazione, cioè 600 passi: se il browser rallenta ci mette di più, i passi sono quelli. L'attesa resta
  // più breve del timeout della prova (60 s, 120 s in CI): se non basta, fallisce l'attesa e non la prova intera.
  await expect.poll(() => tick(page), { timeout: process.env.CI ? 80_000 : 40_000 }).toBeGreaterThanOrEqual(600);
  await expect(log).toContainText('Reazione della termite');
  await expect(log).toContainText('Fe₂O₃ + 2 Al → Al₂O₃ + 2 Fe');

  // di nuovo in pausa la griglia è ferma, e si può confrontare prima e dopo Annulla e Ripeti
  await play.click();
  await expect.poll(() => running(page)).toBe(false);
  const example = await grid(page);
  expect(example.filled).toBeGreaterThan(0);
  expect(example.hash).not.toBe(empty.hash);

  // Annulla: la griglia torna com'era prima dell'esempio
  await page.locator('.sbx [data-act="undo"]').click();
  await expect.poll(() => grid(page)).toEqual(empty);

  // Ripeti: torna l'esempio
  await page.locator('.sbx [data-act="redo"]').click();
  await expect.poll(() => grid(page)).toEqual(example);
});
