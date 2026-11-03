import { test, expect, openModule, startFreeLab } from './fixtures.mjs';
import { PASS_STARS } from '../../src/game/career.js';

// Il simulatore si gioca con il puntatore bloccato, che un test non può comandare: le azioni di gioco passano dal
// gancio `window.__tp3d` (src/game/game-view.js), che usa le stesse funzioni dei pulsanti. Menu, finestre e tasti
// si provano invece come li usa chi gioca.

/**
 * Nomi degli oggetti sul bancone B, in ordine alfabetico: centro in (0; 1,6), 3,6 × 0,9 m, piano a 0,92 m
 * (`LAYOUT.benchB` e `BENCH_Y` in src/game/room.js).
 */
const benchB = (page) =>
  page.evaluate(() =>
    window.__tp3d.game.items
      .filter(
        ({ mesh: { position: p } }) => Math.abs(p.x) < 1.8 && Math.abs(p.z - 1.6) < 0.45 && Math.abs(p.y - 0.92) < 0.1,
      )
      .map((it) => it.name)
      .sort(),
  );

test('laboratorio libero: Prepara sul banco e 20 s di gioco', async ({ page }) => {
  // al caricamento del motore fisico si aggiungono i 20 s di gioco
  test.slow();
  await openModule(page, 'simulatore');
  await startFreeLab(page);

  // «Prepara sul banco» con la prima ricetta verificata del libro: sul bancone B arrivano gli oggetti che annuncia,
  // accanto all'ansa che il Laboratorio libero vi mette da sé
  const before = await benchB(page);
  const prepared = await page.evaluate(() => {
    const { game, prepareRecipe } = window.__tp3d;
    return prepareRecipe(game.book.recipes[0]);
  });
  expect(prepared.length).toBeGreaterThan(0);
  const expected = [...before, ...prepared].sort();
  await expect.poll(() => benchB(page)).toEqual(expected);
  await expect(page.locator('.gm-toasts')).toContainText(`Pronto sul bancone B: ${prepared.join(', ')}`);
  await expect(page.locator('.gm-recipe')).toBeVisible();

  // 20 s di gioco: il tempo del gioco va avanti, gli oggetti restano sul banco e la console resta pulita (fixtures)
  const t0 = await page.evaluate(() => window.__tp3d.game.time);
  await page.waitForTimeout(20_000);
  expect(await page.evaluate(() => window.__tp3d.game.time)).toBeGreaterThan(t0 + 1);
  await expect(page.locator('.gm-hud')).toBeVisible();
  await expect(page.locator('.gm-dialog')).toBeHidden();
  expect(await benchB(page)).toEqual(expected);
});

test('Carriera: measure50 consegnata con la soluzione dei dati', async ({ page }) => {
  await openModule(page, 'simulatore');
  const dialog = page.locator('.gm-dialog');

  // l'esercitazione si apre con la sua consegna
  await page.evaluate(() => window.__tp3d.startExercise('measure50'));
  await expect(dialog.locator('h3')).toHaveText('Misura 50 mL');

  // consegna con la soluzione scritta nei dati: vassoio, campanello, relazione con le risposte giuste, resoconto
  const result = await page.evaluate(async () => {
    const r = await window.__tp3d.deliverSolution();
    return { id: r.id, stars: r.stars, quality: r.quality, right: r.report.right, total: r.report.total };
  });
  expect(result.id).toBe('measure50');
  expect(result.stars).toBeGreaterThanOrEqual(PASS_STARS);
  // con la stanza pulita e la relazione giusta anche una consegna sbagliata (qualità 0) arriva a PASS_STARS
  expect(result.quality).toBeGreaterThan(0.9);
  expect(result.right).toBe(result.total);
  expect(await page.evaluate(() => window.__tp3d.lastResult.stars)).toBe(result.stars);

  // il resoconto mostrato è quello del result
  const card = dialog.locator('.gm-result');
  await expect(card.locator('h3')).toHaveText('Misura 50 mL');
  await expect(card.locator('.gm-stars')).toHaveAttribute('aria-label', `${result.stars} stelle su 5`);
});

test('pausa, libro, quaderno, uscita', async ({ page }) => {
  await openModule(page, 'simulatore');
  await startFreeLab(page);
  const dialog = page.locator('.gm-dialog');

  // Esc apre la pausa
  await page.keyboard.press('Escape');
  const pause = dialog.locator('.gm-pause');
  await expect(pause.locator('h3')).toHaveText('Pausa');

  // il libro «Come si fa» si apre dalla pausa e si chiude con «Fatto», tornando al gioco
  await pause.getByRole('button', { name: 'Libro «Come si fa»' }).click();
  const book = dialog.locator('.gm-book');
  await expect(book.locator('h3')).toHaveText('Come si fa');
  await book.getByRole('button', { name: 'Fatto', exact: true }).click();
  await expect(dialog).toBeHidden();

  // il quaderno si apre con N e si chiude con «Fatto»
  await page.keyboard.press('KeyN');
  const notebook = dialog.locator('.gm-notebook');
  await expect(notebook.locator('h3')).toHaveText('Quaderno di laboratorio');
  await notebook.getByRole('button', { name: 'Fatto', exact: true }).click();
  await expect(dialog).toBeHidden();

  // «Esci alla tavola» dalla pausa chiude il simulatore
  await page.keyboard.press('Escape');
  await pause.getByRole('button', { name: 'Esci alla tavola' }).click();
  await expect(page.locator('.gm')).toBeHidden();
  await expect(page.locator('.cell[data-z="1"]')).toBeVisible();
});
