// E2E dei file di profilo del simulatore (src/game/profile-file.js): «Esporta» scarica il profilo, «Importa un
// profilo…» lo riporta (aggiornando quello che c'è, dopo una conferma), aggiunge il profilo di un altro computer e
// rifiuta un file rovinato con un messaggio.
import fs from 'node:fs';
import { test, expect, openModule } from './fixtures.mjs';
import { migrate, renameProfile } from '../../src/game/save.js';
import { exportProfile, profileFileText } from '../../src/game/profile-file.js';

test('profili: esporta, reimporta, importa da un altro computer, file rovinato', async ({ page }, testInfo) => {
  test.slow(); // il simulatore carica il motore fisico
  await openModule(page, 'simulatore');
  await page.locator('.gm-menu [data-act="profiles"]').click();
  const dialog = page.locator('.gm-dialog');
  await expect(dialog.locator('h3')).toHaveText('Profili');

  // Esporta: un file JSON con il profilo in uso
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.locator('.gm-profile__row.is-on [data-profile-export]').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^tp3d-profilo-studente-1-\d{4}-\d{2}-\d{2}\.json$/);
  const exported = testInfo.outputPath('esportato.json');
  await download.saveAs(exported);
  const file = JSON.parse(fs.readFileSync(exported, 'utf8'));
  expect(file.format).toBe('tp3d-profilo');
  expect(file.profile.name).toBe('Studente 1');
  expect(file.check).toMatch(/^crc32:[0-9a-f]{8}$/);
  await expect(page.locator('.gm-toasts')).toContainText('Profilo salvato nel file tp3d-profilo-studente-1-');

  /** «Importa un profilo…» con il file `path`. */
  const importFile = async (path) => {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      dialog.getByRole('button', { name: 'Importa un profilo…' }).click(),
    ]);
    await chooser.setFiles(path);
  };

  // lo stesso profilo torna: si chiede prima di aggiornarlo
  await importFile(exported);
  await expect(dialog.locator('h3')).toHaveText('Aggiornare il profilo?');
  await dialog.getByRole('button', { name: 'Aggiorna' }).click();
  await expect(page.locator('.gm-toasts')).toContainText('Profilo Studente 1 aggiornato dal file');
  await expect(dialog.locator('.gm-profile__row')).toHaveCount(1);

  // il profilo di Giulia da casa: si aggiunge e diventa quello in uso
  const home = migrate(null, '2026-11-01T08:00:00.000Z');
  const giulia = renameProfile(home, home.active, 'Giulia');
  const other = testInfo.outputPath('giulia.json');
  fs.writeFileSync(
    other,
    profileFileText(exportProfile(giulia, giulia.active, { app: '1.0.0', now: '2026-11-04T18:00:00.000Z' })),
  );
  await importFile(other);
  await expect(page.locator('.gm-toasts')).toContainText('Profilo Giulia importato');
  await expect(dialog.locator('.gm-profile__row')).toHaveCount(2);
  await expect(dialog.locator('.gm-profile__row.is-on')).toContainText('Giulia');

  // un file rovinato: un messaggio, niente di cambiato
  const broken = testInfo.outputPath('rovinato.json');
  fs.writeFileSync(broken, fs.readFileSync(exported, 'utf8').slice(0, 200));
  await importFile(broken);
  await expect(dialog.locator('h3')).toHaveText('File non importato');
  await expect(dialog).toContainText('Il file non si legge');
  await dialog.getByRole('button', { name: 'Fatto' }).click();
  await expect(dialog.locator('.gm-profile__row')).toHaveCount(2);
});
