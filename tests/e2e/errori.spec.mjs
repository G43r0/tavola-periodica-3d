// E2E della finestra «Qualcosa è andato storto» (src/ui/error-report.js): un errore che nessuno gestisce, lanciato
// dalla pagina, la apre; «Copia i dettagli» mette negli appunti il testo per la segnalazione; «Segnala» apre il modulo
// di GitHub già compilato; «Chiudi» la chiude. Gli errori lanciati qui sono attesi: la fixture non li conta.
import { test, expect, openModule } from './fixtures.mjs';

test.use({ allowedErrors: /(Errore|Rifiuto) di prova della R2/ });

const dialog = (page) => page.locator('dialog.err-dialog');

test('un errore imprevisto apre la finestra: dettagli, Copia, Segnala, Chiudi', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // «Segnala» apre GitHub in una pagina nuova: qui non si va in rete
  await context.route('https://github.com/**', (route) => route.fulfill({ status: 200, body: 'ok' }));
  await openModule(page, 'sandbox');

  const fire = () =>
    page.evaluate(() =>
      setTimeout(function provaR2() {
        throw new TypeError('Errore di prova della R2');
      }),
    );
  await fire();
  const dlg = dialog(page);
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('h2')).toHaveText('Qualcosa è andato storto');
  await expect(dlg.locator('.err-dialog__error')).toContainText('TypeError: Errore di prova della R2');

  // lo stesso errore di nuovo: la finestra resta una, con il contatore
  await fire();
  await expect(dlg.locator('.err-dialog__error')).toContainText('(×2)');

  await dlg.getByRole('button', { name: 'Copia i dettagli' }).click();
  await expect(dlg.getByRole('button', { name: 'Copiato ✓' })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Tavola Periodica 3D');
  expect(text).toContain('Modulo: sandbox');
  expect(text).toContain('TypeError: Errore di prova della R2 (×2)');
  expect(text).toContain('provaR2');

  const [issue] = await Promise.all([page.waitForEvent('popup'), dlg.getByRole('button', { name: 'Segnala' }).click()]);
  const url = new URL(issue.url());
  expect(url.pathname).toBe('/G43r0/tavola-periodica-3d/issues/new');
  expect(url.searchParams.get('area')).toBe('Sandbox degli elementi');
  expect(url.searchParams.get('actual')).toContain('Errore di prova della R2');
  await issue.close();

  await dlg.getByRole('button', { name: 'Chiudi' }).click();
  await expect(dlg).toBeHidden();
  // la sandbox è ancora lì e risponde
  await expect(page.locator('.sbx')).toBeVisible();
});

test('una promessa rifiutata che nessuno gestisce apre la finestra', async ({ page }) => {
  await openModule(page, 'tavola');
  await page.evaluate(() => {
    Promise.reject(new Error('Rifiuto di prova della R2'));
  });
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).locator('.err-dialog__error')).toContainText('Error: Rifiuto di prova della R2');
  // «Ricarica l'app» ricarica la pagina: la finestra non c'è più
  await dialog(page).getByRole('button', { name: 'Ricarica l’app' }).click();
  await expect(page.locator('.cell[data-z="1"]')).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);
});

test('gli errori innocui non aprono niente', async ({ page }) => {
  await openModule(page, 'tavola');
  await page.evaluate(() => {
    // l'avviso del browser sul ResizeObserver arriva come evento `error` senza eccezione
    window.dispatchEvent(
      new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications.' }),
    );
  });
  await page.waitForTimeout(300);
  await expect(dialog(page)).toHaveCount(0);
});
