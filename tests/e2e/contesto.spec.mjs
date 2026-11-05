// E2E del contesto WebGL perso e ripristinato (src/gfx/context-loss.js): l'estensione WEBGL_lose_context fa quello
// che fa un driver che si riavvia o un PC che esce dalla sospensione. Dopo il ripristino il modulo disegna di nuovo,
// con una mappa d'ambiente nuova al posto di quella persa, senza ricaricare la pagina e senza errori in console.
import { test, expect, openModule, startFreeLab, patience } from './fixtures.mjs';

/** Perde il contesto della tela del renderer `expr` (un'espressione sul gancio di test) e aspetta che sia perso. */
async function lose(page, expr) {
  await page.evaluate((expr) => {
    const renderer = new Function(`return ${expr}`)();
    window.__loseContext = renderer.getContext().getExtension('WEBGL_lose_context');
    window.__loseContext.loseContext();
  }, expr);
  await expect
    .poll(() => page.evaluate((expr) => new Function(`return ${expr}`)().getContext().isContextLost(), expr))
    .toBe(true);
}

const restore = (page) => page.evaluate(() => window.__loseContext.restoreContext());
const frameCount = (page, expr) => page.evaluate((expr) => new Function(`return ${expr}`)().info.render.frame, expr);

test.describe('atomo 3D', () => {
  // il preset Professionale ha la mappa d'ambiente dello studio: è quella che va rifatta
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('tp3d.gfx', 'pro'));
  });

  test('il contesto perso si recupera: avviso, mappa d’ambiente nuova, si disegna di nuovo', async ({ page }) => {
    await openModule(page, 'atomo');
    const R = 'window.__atomViewer.engine.renderer';
    /** Pixel accesi nella tela, disegnando adesso un fotogramma (il buffer si legge prima che il browser lo mostri). */
    const lit = () =>
      page.evaluate(() => {
        const { engine } = window.__atomViewer;
        engine.frame();
        const gl = engine.renderer.getContext();
        engine.renderer.setRenderTarget(null);
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        const px = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
        let n = 0;
        for (let i = 0; i < px.length; i += 16) if (px[i] + px[i + 1] + px[i + 2] > 150) n++;
        return n;
      });
    const envBefore = await page.evaluate(() => window.__atomViewer.engine.scene.environment?.uuid);
    expect(envBefore).toBeTruthy();
    expect(await lit()).toBeGreaterThan(50);

    await lose(page, R);
    await expect(page.locator('.toast').filter({ hasText: 'La grafica si è interrotta' })).toBeVisible();
    await restore(page);
    await expect(page.locator('.toast').filter({ hasText: 'Grafica ripristinata' })).toBeVisible();

    expect(await page.evaluate(() => window.__atomViewer.engine.renderer.getContext().isContextLost())).toBe(false);
    const envAfter = await page.evaluate(() => window.__atomViewer.engine.scene.environment?.uuid);
    expect(envAfter).toBeTruthy();
    expect(envAfter).not.toBe(envBefore);
    // il ciclo di rendering riprende da solo, e il fotogramma ha di nuovo l'atomo
    const f0 = await frameCount(page, R);
    await expect.poll(() => frameCount(page, R)).toBeGreaterThan(f0 + 2);
    expect(await lit()).toBeGreaterThan(50);
  });
});

test('simulatore: il contesto perso si recupera e la partita continua', async ({ page }) => {
  test.slow();
  await openModule(page, 'simulatore');
  await startFreeLab(page);
  const R = 'window.__tp3d.game.renderer';
  const env = () => page.evaluate(() => window.__tp3d.game.envMap?.uuid);
  const envBefore = await env();
  expect(envBefore).toBeTruthy(); // il preset Medio ha la mappa d'ambiente nel simulatore
  const timeBefore = await page.evaluate(() => window.__tp3d.game.time);

  await lose(page, R);
  await expect(page.locator('.gm-toasts')).toContainText('La grafica si è interrotta');
  await restore(page);
  await expect(page.locator('.gm-toasts')).toContainText('Grafica ripristinata');

  expect(await env()).not.toBe(envBefore);
  // la mappa nuova è in tutti i materiali degli oggetti che la usavano, anche quelli non ancora sul banco
  const stale = await page.evaluate(() => {
    const { game } = window.__tp3d;
    let n = 0;
    const check = (m) => m?.isMaterial && m.envMap && m.envMap !== game.envMap && n++;
    Object.values(game.mats).forEach(check);
    game.scene.traverse((o) => o.material && [].concat(o.material).forEach(check));
    return n;
  });
  expect(stale).toBe(0);
  const f0 = await frameCount(page, R);
  await expect.poll(() => frameCount(page, R), { timeout: patience(20_000) }).toBeGreaterThan(f0 + 1);
  // il gioco è andato avanti per tutto il tempo
  expect(await page.evaluate(() => window.__tp3d.game.time)).toBeGreaterThan(timeBefore);
});
