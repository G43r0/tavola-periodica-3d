import { defineConfig } from '@playwright/test';

// E2E della versione web: si costruisce l'app con `--mode e2e` (ganci di test attivi, vedi src/test-hooks.js) e la si
// serve con `vite preview`. Il rendering WebGL è software (SwiftShader), come nelle misure della specifica.
//
// In locale `PW_CHANNEL=chrome` usa il Chrome installato, senza scaricare Chromium (`npx playwright install`, che
// serve solo in CI); `PW_EXECUTABLE_PATH` usa un Chromium già presente altrove. `E2E_PORT` cambia la porta del server
// (4173), per far girare due copie del progetto insieme.
//
// Il progetto `electron` lancia l'app vera (`electron .`) su dist/, la build di produzione: si costruisce prima con
// `npx vite build`. Non usa né il server né la build di prova, quindi con `--project=electron` il `webServer` non parte.
const PORT = Number(process.env.E2E_PORT) || 4173;

// I progetti chiesti dalla riga di comando (`--project=web`, `--project web`, `-p web`); nessuno = tutti.
function requestedProjects(argv = process.argv) {
  const names = [];
  argv.forEach((arg, i) => {
    if (arg.startsWith('--project=')) names.push(arg.slice('--project='.length));
    else if (arg === '--project' || arg === '-p') names.push(argv[i + 1]);
  });
  return names;
}
const projects = requestedProjects();
const needsWebServer = projects.length === 0 || projects.includes('web');

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.spec.mjs',
  // I tempi sono pensati per un computer da sviluppo veloce; sui runner della CI il rendering software è più lento, quindi
  // il doppio per le prove e il triplo per le asserzioni. Anche le attese esplicite dei test (`patience` in
  // tests/e2e/fixtures.mjs) crescono in CI.
  timeout: process.env.CI ? 120_000 : 60_000,
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  retries: process.env.CI ? 1 : 0,
  // il rendering software usa tutti i processori: più prove insieme si rubano il tempo e la sandbox rallenta
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  webServer: needsWebServer
    ? {
        command: `npm run build:e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
        url: `http://127.0.0.1:${PORT}`,
        // niente riuso: un server rimasto acceso servirebbe una build vecchia
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : undefined,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // l'app sceglie la lingua da navigator.language: i testi dei test sono in italiano
    locale: 'it-IT',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'web',
      // l'E2E di Electron ha il suo progetto: qui non c'è l'app da lanciare
      testIgnore: 'electron.spec.mjs',
      use: {
        browserName: 'chromium',
        channel: process.env.PW_CHANNEL,
        viewport: { width: 1366, height: 768 },
        launchOptions: {
          args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
          executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
        },
      },
    },
    {
      name: 'electron',
      testMatch: 'electron.spec.mjs',
    },
  ],
});
