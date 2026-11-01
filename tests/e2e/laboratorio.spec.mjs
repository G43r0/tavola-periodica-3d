import { test, expect, openModule } from './fixtures.mjs';

/**
 * Lo stato del banco dal gancio `window.__lab`: atomi, formule delle unità (molecole o atomi isolati) in ordine e
 * se una reazione è in corso (reagenti in preparazione o animazione).
 */
const bench = (page) =>
  page.evaluate(() => {
    const { bench, state } = window.__lab;
    return {
      atoms: bench.atoms.size,
      units: state.units.map((u) => u.formula).sort(),
      busy: state.starting !== null || state.anim !== null,
    };
  });

test('formula, Combina, reazione avviata e annullata', async ({ page }) => {
  await openModule(page, 'laboratorio');
  const panel = page.locator('.lab-panel');
  const clear = page.getByTitle('Svuota il banco');

  // formula: H2SO4 mette sul banco 7 atomi e la scheda lo riconosce
  await page.locator('[data-act="formula"]').click();
  await page.locator('#lf-input').fill('H2SO4');
  await page.locator('#lf-input').press('Enter');
  await expect.poll(() => bench(page)).toEqual({ atoms: 7, units: ['H₂SO₄'], busy: false });
  await expect(panel.locator('.mp-name')).toHaveText('Acido solforico');

  // Svuota, poi 2 H e 1 O dalla tavolozza e Combina
  await clear.click();
  await expect.poll(() => bench(page)).toEqual({ atoms: 0, units: [], busy: false });
  const frequent = page.locator('.lab-palette .pal-frequent');
  await frequent.locator('[data-z="1"]').click();
  await frequent.locator('[data-z="1"]').click();
  await frequent.locator('[data-z="8"]').click();
  await expect.poll(() => bench(page)).toEqual({ atoms: 3, units: ['H', 'H', 'O'], busy: false });
  await page.locator('.lab-dock').getByRole('button', { name: 'Combina' }).click();
  await expect(panel.locator('.mp-name')).toHaveText('Acqua');
  await expect.poll(() => bench(page)).toEqual({ atoms: 3, units: ['H₂O'], busy: false });

  // catalogo: la sintesi dell'acqua si apre dall'elenco e si avvia; i reagenti (2 H₂ + O₂) non sono sul banco,
  // quindi vengono preparati, poi reagiscono
  await clear.click();
  await expect.poll(() => bench(page)).toMatchObject({ atoms: 0 });
  await page.locator('[data-act="reactions"]').click();
  await page.locator('[data-rx-search]').fill("Sintesi dell'acqua");
  await page.locator('.rx-results [data-reaction="acqua"]').click();
  await expect(panel.locator('.mp-name')).toHaveText("Sintesi dell'acqua");
  await page.locator('[data-act="rx-run"]').click();
  await expect.poll(() => bench(page), { timeout: 30_000 }).toEqual({ atoms: 6, units: ['H₂O', 'H₂O'], busy: false });

  // Annulla: il banco torna ai reagenti
  await page.locator('.lab-dock [data-act="undo"]').click();
  await expect.poll(() => bench(page)).toEqual({ atoms: 6, units: ['H₂', 'H₂', 'O₂'], busy: false });
  await expect(panel).toContainText('I reagenti sono già sul banco');
});
