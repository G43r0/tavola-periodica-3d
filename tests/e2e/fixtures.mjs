// Fixture comuni degli E2E: controllo automatico degli errori in console e apertura dei cinque moduli.
import { test as base, expect } from '@playwright/test';

/**
 * I cinque moduli dell'app: il nome da passare a `openModule` e il gancio di test che il modulo espone con
 * `exposeForTests` (src/test-hooks.js: esiste solo nella build `--mode e2e` e con `vite`).
 *
 * - `tavola`: la tavola periodica, la pagina iniziale (nessun gancio)
 * - `atomo`: il visualizzatore dell'atomo 3D, src/viewer (`window.__atomViewer`)
 * - `laboratorio`: il laboratorio molecolare, src/lab (`window.__lab`)
 * - `sandbox`: la sandbox degli elementi, src/sandbox (`window.__sandbox`)
 * - `simulatore`: il simulatore di laboratorio, src/game (`window.__tp3d`)
 */
const MODULES = {
  tavola: { hook: null },
  atomo: { hook: '__atomViewer' },
  laboratorio: { hook: '__lab' },
  sandbox: { hook: '__sandbox' },
  simulatore: { hook: '__tp3d' },
};

/**
 * Apre un modulo partendo dalla tavola (la carica se la pagina è ancora vuota) e aspetta che sia pronto.
 *
 * @param {import('@playwright/test').Page} page
 * @param {'tavola'|'atomo'|'laboratorio'|'sandbox'|'simulatore'} name
 * @param {{ z?: number }} [opts] `z`: l'elemento di cui aprire l'atomo 3D (predefinito 6, il carbonio)
 */
export async function openModule(page, name, { z = 6 } = {}) {
  const mod = MODULES[name];
  if (!mod) throw new Error(`Modulo «${name}» sconosciuto: i nomi sono ${Object.keys(MODULES).join(', ')}`);

  if (page.url() === 'about:blank') await page.goto('/');
  await expect(page.locator('.cell[data-z="1"]')).toBeVisible();

  switch (name) {
    case 'tavola':
      break;
    case 'atomo':
      await page.locator(`.cell[data-z="${z}"]`).click();
      await page.locator('.panel .hero__cta[data-action="open-3d"]').click();
      await expect(page.locator('.atom-view')).toBeVisible();
      await expect(page.locator('.atom-view .av-tile__z')).toHaveText(String(z));
      break;
    case 'laboratorio':
      await page.locator('.toolbar [data-action="lab"]').click();
      await expect(page.locator('.lab')).toBeVisible();
      break;
    case 'sandbox':
      await page.locator('.toolbar [data-action="sandbox"]').click();
      await expect(page.locator('.sbx')).toBeVisible();
      break;
    case 'simulatore':
      await page.locator('.toolbar [data-action="game"]').click();
      await expect(page.locator('.gm')).toBeVisible();
      // il simulatore carica il motore fisico: il menu compare a caricamento finito
      await expect(page.locator('.gm .gm-menu')).toBeVisible({ timeout: 30_000 });
      break;
  }

  if (mod.hook) {
    const present = await page.evaluate((hook) => hook in window, mod.hook);
    expect(present, `window.${mod.hook} non è definito: la pagina non è la build di prova (npm run build:e2e)`).toBe(
      true,
    );
  }
}

export const test = base.extend({
  // Errori in console: un `pageerror` o un `console.error` fa fallire il test, con il loro testo. Gli avvisi
  // (`warning`) non contano: per esempio il «deprecated parameters» di Rapier.
  consoleErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.stack ?? err}`));
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const { url } = msg.location();
        errors.push(`console.error: ${msg.text()}${url ? ` (${url})` : ''}`);
      });
      // il browser chiede da solo /favicon.ico e l'app non ne ha una: senza questa risposta ogni test avrebbe un 404
      await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));

      await use(errors);

      if (errors.length) throw new Error(`${errors.length} errori in console:\n${errors.join('\n')}`);
    },
    { auto: true },
  ],
});

export { expect };
