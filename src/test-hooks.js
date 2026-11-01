// Ganci di test del renderer: i moduli espongono il proprio stato su `window` (`window.__lab`, `window.__sandbox`,
// `window.__atomViewer`…) perché gli E2E (tests/e2e) lo leggano e lo guidino senza passare dal mouse.
//
// Attivi solo con `vite` (sviluppo) e con la build di prova `vite build --mode e2e` (npm run build:e2e). Nella build
// vera `TEST_HOOKS` vale `false` già in fase di compilazione e `scripts/check-dist.mjs` (npm run check:dist) controlla
// che nessun nome di gancio resti nei file di `dist/`.
export const TEST_HOOKS = import.meta.env.DEV || import.meta.env.MODE === 'e2e';

/**
 * Espone `value` come `window[name]`, ma solo se i ganci di test sono attivi.
 * @param {string} name nome del gancio, per convenzione con due trattini bassi (`__lab`)
 * @param {unknown} value
 */
export function exposeForTests(name, value) {
  if (TEST_HOOKS) window[name] = value;
}
