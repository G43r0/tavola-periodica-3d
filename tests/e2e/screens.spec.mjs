import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { test, expect, openModule, startFreeLab, patience } from './fixtures.mjs';
import { PRESETS } from '../../src/gfx/preset.js';

// Screenshot di controllo: cinque inquadrature in ciascuno dei tre preset grafici, in test-results/screens/
// <preset>-<vista>.png. Servono a chi rivede una PR (la CI li allega come artefatto): nessun confronto
// con un'immagine di riferimento, il test controlla solo che il file ci sia e non sia vuoto o nero.
//
// Un test per ogni preset e vista, cioè 15: una vista che si rompe non ferma le altre e ogni prova parte da una pagina
// pulita. Gli screenshot si scrivono durante il test, dopo che Playwright ha svuotato test-results/ all'avvio.

/** La chiave con cui l'app salva il preset in `localStorage` (src/gfx/preset.js, STORAGE_KEY: non è esportata). */
const GFX_KEY = 'tp3d.gfx';

/** Sotto questa dimensione un PNG di 1366×768 è vuoto o tutto nero: l'interfaccia da sola lo porta oltre. */
const MIN_BYTES = 10 * 1024;

/** Aspetta `n` fotogrammi del browser, perché la grafica 3D disegni almeno una volta lo stato appena raggiunto. */
const frames = (page, n = 3) =>
  page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
  }, n);

/**
 * Le cinque inquadrature: ognuna porta la pagina allo stato da fotografare e aspetta che sia disegnato. Il nome è
 * quello di `openModule`, e finisce nel nome del file.
 */
const VIEWS = {
  // la tavola con la scheda del ferro; nel preset Professionale anche il campione 3D nella scheda
  async tavola(page, preset) {
    await openModule(page, 'tavola');
    await page.locator('.cell[data-z="26"]').click();
    await expect(page.locator('.panel .panel__sym')).toHaveText('Fe');
    // l'animazione di entrata della tavola dura 1,4 s
    await expect(page.locator('.ptable')).not.toHaveClass(/is-entering/);
    if (preset === 'pro') {
      await expect(page.locator('.panel .specimen canvas')).toBeVisible();
      // le miniature dei 118 elementi si generano dopo l'avvio, poche alla volta
      await expect(page.locator('.cell[data-z].has-spec')).toHaveCount(118, { timeout: patience(60_000) });
    }
    await frames(page);
  },

  // l'atomo 3D del carbonio (il predefinito di openModule): l'etichetta sul nucleo c'è dopo il primo disegno
  async atomo(page) {
    await openModule(page, 'atomo');
    await expect(page.locator('.label3d--nucleus')).toContainText('6 n⁰');
    await frames(page);
  },

  // il laboratorio con H₂SO₄ dalla casella delle formule: 7 atomi sul banco e la scheda del composto
  async laboratorio(page) {
    await openModule(page, 'laboratorio');
    await page.locator('[data-act="formula"]').click();
    await page.locator('#lf-input').fill('H2SO4');
    await page.locator('#lf-input').press('Enter');
    await expect.poll(() => page.evaluate(() => window.__lab.bench.atoms.size)).toBe(7);
    await expect(page.locator('.lab-panel .mp-name')).toHaveText('Acido solforico');
    await frames(page);
  },

  // la sandbox con l'esempio «Termite» dopo 5 s di tempo vero (la reazione la controlla sandbox.spec)
  async sandbox(page) {
    await openModule(page, 'sandbox');
    await page.locator('.sbx-intro [data-preset="termite"]').click();
    await expect.poll(() => page.evaluate(() => window.__sandbox.state.running)).toBe(true);
    await expect
      .poll(() => page.evaluate(() => window.__sandbox.world.type.reduce((n, id) => n + (id ? 1 : 0), 0)))
      .toBeGreaterThan(0);
    await page.waitForTimeout(5_000);
    await frames(page);
  },

  // il simulatore in Laboratorio libero, a gioco avviato e con il tempo del gioco che scorre. Basta un passo di gioco
  // (al massimo 0,05 s per fotogramma): sul runner della CI il preset Professionale disegna un fotogramma ogni
  // diversi secondi, e aspettare un secondo intero di gioco sforava il tempo del test.
  async simulatore(page) {
    await openModule(page, 'simulatore');
    await startFreeLab(page);
    await expect
      .poll(() => page.evaluate(() => window.__tp3d.game.time), { timeout: patience(30_000) })
      .toBeGreaterThan(0);
    await frames(page);
  },
};

for (const preset of PRESETS) {
  test.describe(`preset ${preset}`, () => {
    // il caricamento del motore fisico del simulatore e il rendering software del preset Professionale sono lenti
    test.slow();

    for (const [view, prepare] of Object.entries(VIEWS)) {
      test(`screenshot ${view}`, async ({ page }, testInfo) => {
        // il preset va in localStorage prima del caricamento: l'app lo legge una volta sola, all'avvio
        await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [GFX_KEY, preset]);

        await prepare(page, preset);
        // il preset scelto è quello applicato, non un ripiego sul predefinito
        await expect(page.locator('html')).toHaveAttribute('data-gfx', preset);

        const dir = path.join(testInfo.project.outputDir, 'screens');
        const file = path.join(dir, `${preset}-${view}.png`);
        await mkdir(dir, { recursive: true });
        await page.screenshot({ path: file });

        const { size } = await stat(file);
        expect(size, `${file} pesa ${size} byte: vuoto o nero?`).toBeGreaterThan(MIN_BYTES);
      });
    }
  });
}
