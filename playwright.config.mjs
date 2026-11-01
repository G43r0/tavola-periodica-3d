import { defineConfig } from '@playwright/test';

// E2E della versione web: si costruisce l'app con `--mode e2e` (ganci di test attivi, vedi src/test-hooks.js) e la si
// serve con `vite preview`. Il rendering WebGL è software (SwiftShader), come nelle misure della specifica.
//
// In locale `PW_CHANNEL=chrome` usa il Chrome installato, senza scaricare Chromium (`npx playwright install`, che
// serve solo in CI).
const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.spec.mjs',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  // il rendering software usa tutti i processori: più prove insieme si rubano il tempo e la sandbox rallenta
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  webServer: {
    command: `npm run build:e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    // niente riuso: un server rimasto acceso servirebbe una build vecchia
    reuseExistingServer: false,
    timeout: 180_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // l'app sceglie la lingua da navigator.language: i testi dei test sono in italiano
    locale: 'it-IT',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'web',
      use: {
        browserName: 'chromium',
        channel: process.env.PW_CHANNEL,
        viewport: { width: 1366, height: 768 },
        launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
      },
    },
  ],
});
