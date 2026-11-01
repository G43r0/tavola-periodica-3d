import { test, expect, openModule } from './fixtures.mjs';

test('ricerca, scheda, frecce, filtri, Spiega', async ({ page }) => {
  await openModule(page, 'tavola');
  const panel = page.locator('.panel');

  // ricerca: «ferro» + Invio apre la scheda del ferro
  const search = page.locator('#search');
  await search.fill('ferro');
  await search.press('Enter');
  await expect(panel.locator('.panel__sym')).toHaveText('Fe');
  await expect(panel.locator('.panel__z')).toHaveText('26');
  await expect(page.locator('.cell[data-z="26"]')).toHaveClass(/is-selected/);

  // frecce: nel campo di ricerca spostano il cursore, quindi si porta il fuoco sulla scheda (clic sul titolo)
  await panel.locator('#panel-title').click();
  await page.keyboard.press('ArrowRight');
  await expect(panel.locator('.panel__sym')).toHaveText('Co');
  await expect(panel.locator('.panel__z')).toHaveText('27');

  // filtri: azzera la ricerca, poi «Gas nobili» nella legenda lascia accesi solo i gas nobili misurati
  await page.locator('.toolbar .reset').click();
  await expect(search).toHaveValue('');
  await page.locator('.legend .chip[data-cat="noble-gas"]').click();
  await expect(page.locator('.cell[data-z]:not(.is-out) .cell__sym')).toHaveText(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn']);
  await expect(page.locator('.toolbar .result-count')).toHaveText('6 di 118');
  // l'oganesson (gruppo 18) ha ancora la categoria «sconosciuta» (proprietà previste): il filtro non lo accende
  await expect(page.locator('.cell[data-z="118"]')).toHaveClass(/is-out/);
  await page.locator('.legend .chip[data-cat="noble-gas"]').click();
  await expect(page.locator('.toolbar .result-count')).toHaveText('118 elementi');

  // Spiega: clic destro su una parola del glossario nella scheda apre la sua spiegazione
  const explain = page.locator('.toolbar [data-action="explain"]');
  await explain.click();
  await expect(explain).toHaveAttribute('aria-pressed', 'true');
  await panel.locator('[data-help="term.electronegativity"] dt').click({ button: 'right' });
  const card = page.locator('.xp-card');
  await expect(card).toBeVisible();
  await expect(card.locator('.xp-kind')).toHaveText('Termine');
  await expect(card.locator('.xp-title')).toHaveText('Elettronegatività');

  // e da lì un «Vedi anche» porta a un'altra voce del glossario
  const next = card.locator('.xp-chip').first();
  const nextTitle = (await next.textContent()).trim();
  await next.click();
  await expect(card.locator('.xp-title')).toHaveText(nextTitle);

  // F1 esce dalla modalità Spiega
  await page.keyboard.press('F1');
  await expect(explain).toHaveAttribute('aria-pressed', 'false');
});
