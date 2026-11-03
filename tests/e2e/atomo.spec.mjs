import { test, expect, openModule } from './fixtures.mjs';

/** Lo stato del visualizzatore dal gancio `window.__atomViewer`. */
const viewerState = (page) =>
  page.evaluate(() => {
    const { z, mode, neutrons, exploded, sel } = window.__atomViewer.state;
    return { z, mode, neutrons, exploded, sel: sel?.kind ?? null };
  });

test('Bohr, quantistico, isotopo, nucleo, particella', async ({ page }) => {
  await openModule(page, 'atomo'); // carbonio
  const modes = page.locator('.av-modes');
  const nucleusLabel = page.locator('.label3d--nucleus');

  await expect.poll(() => viewerState(page)).toEqual({ z: 6, mode: 'bohr', neutrons: 6, exploded: false, sel: null });
  await expect(nucleusLabel).toContainText('6 n⁰');

  // Bohr → quantistico → Bohr
  await modes.locator('[data-mode="quantum"]').click();
  await expect.poll(() => viewerState(page)).toMatchObject({ mode: 'quantum' });
  await expect(modes.locator('[data-mode="quantum"]')).toHaveAttribute('aria-pressed', 'true');
  await modes.locator('[data-mode="bohr"]').click();
  await expect.poll(() => viewerState(page)).toMatchObject({ mode: 'bohr' });
  await expect(modes.locator('[data-mode="bohr"]')).toHaveAttribute('aria-pressed', 'true');

  // isotopo: ¹⁴C, cioè 8 neutroni; l'etichetta nel pannello e quella sul nucleo cambiano
  await page.locator('.av-isotopes .iso-chip', { hasText: '¹⁴C' }).click();
  await expect.poll(() => viewerState(page)).toMatchObject({ neutrons: 8 });
  await expect(page.locator('.av-isotopes .iso-chip[aria-pressed="true"]')).toContainText('¹⁴C');
  await expect(page.locator('.av-iso-info')).toContainText('A 14');
  await expect(nucleusLabel).toContainText('8 n⁰');

  // «Esplodi il nucleo»
  const explode = page.locator('.av-panel [data-act="explode"]');
  await expect(explode).toContainText('Esplodi il nucleo');
  await explode.click();
  await expect.poll(() => viewerState(page)).toMatchObject({ exploded: true });
  await expect(explode).toHaveAttribute('aria-pressed', 'true');
  await expect(explode).toContainText('Ricompatta il nucleo');

  // una particella: selezionato un protone, il pannello di analisi lo descrive
  const analysis = page.locator('.av-particle');
  await expect(analysis).toBeHidden();
  await page.evaluate(() => {
    const { select, nucleus } = window.__atomViewer;
    select('proton', nucleus.protons[0]);
  });
  await expect.poll(() => viewerState(page)).toMatchObject({ sel: 'proton' });
  await expect(analysis).toBeVisible();
  await expect(analysis.locator('#pp-title')).toContainText('Protone');
  await expect(analysis).toContainText('uno dei 6 protoni');
});
