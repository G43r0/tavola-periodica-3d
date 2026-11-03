// E2E dell'app Electron: si lancia `electron .` (non impacchettato) sulla build di produzione in dist/, che si costruisce
// prima con `npx vite build`. Non c'è `webServer` e non ci sono ganci di test: si prova l'app com'è, dal processo
// principale (menu, cartella dei dati) e dalla pagina (preload, interfaccia).
//
// Niente fusibili qui: `electron .` non è impacchettato, e Playwright ha bisogno di `--inspect`, che i fusibili spengono
// solo nell'app impacchettata (vedi `build.electronFuses` in package.json).
//
// I dati di chi sviluppa non si toccano mai: ogni prova lancia l'app con `TP3D_USER_DATA` su una cartella temporanea
// nuova (electron/main.cjs la usa come `userData`) e la cancella alla fine, anche se un'asserzione fallisce.
//
// Il `test` qui sotto non è quello di fixtures.mjs: quel controllo automatico degli errori usa la fixture `page`, cioè
// aprirebbe anche un Chromium che qui non serve. Il controllo degli errori in console c'è lo stesso, sulla finestra
// dell'app (fixture `app`).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect, _electron as electron } from '@playwright/test';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** La cartella dei dati dell'app (`app.getPath('userData')`), letta dal processo principale. */
const userDataOf = (app) => app.evaluate(({ app }) => app.getPath('userData'));

/**
 * Il percorso vero di una cartella, per confrontare due percorsi della stessa cartella: sul runner Windows della CI
 * `os.tmpdir()` è in forma 8.3 (`C:\Users\RUNNER~1\...`) e Electron restituisce quella lunga. Se la cartella non esiste
 * si resta al percorso assoluto (non può coincidere con una cartella che esiste).
 */
const realPath = (dir) => {
  try {
    return fs.realpathSync.native(dir);
  } catch {
    return path.resolve(dir);
  }
};

const test = base.extend({
  // La cartella temporanea dei dati dell'app: si cancella a fine prova, dopo la chiusura di Electron (che la tiene aperta).
  // eslint-disable-next-line no-empty-pattern -- Playwright vuole che il primo argomento di una fixture sia un pattern
  userData: async ({}, use) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tp3d-e2e-'));
    try {
      await use(tmp);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
  },

  // L'app avviata, chiusa sempre a fine prova. Prima di darla alla prova si controlla che usi la cartella temporanea:
  // se `TP3D_USER_DATA` non avesse effetto, le prove scriverebbero nei dati veri di chi sviluppa (il salvataggio, la
  // lingua scelta), quindi si ferma tutto prima. `--lang=it` fissa la lingua del sistema: l'app parte in italiano anche su
  // un computer con Windows in inglese (come il runner della CI), e il cambio di lingua parte da un punto noto.
  // Gli errori in console: un `weberror` (eccezione non gestita) o un `console.error` della pagina fa fallire la prova,
  // con il loro testo. Gli avvisi (`warning`) non contano.
  app: async ({ userData }, use) => {
    const app = await electron.launch({
      args: ['.', '--lang=it'],
      cwd: ROOT,
      env: { ...process.env, TP3D_USER_DATA: userData },
    });
    const errors = [];
    try {
      app.context().on('weberror', (e) => errors.push(`pageerror: ${e.error().stack ?? e.error()}`));
      app.context().on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const { url } = msg.location();
        errors.push(`console.error: ${msg.text()}${url ? ` (${url})` : ''}`);
      });
      const actual = await userDataOf(app);
      if (realPath(actual) !== realPath(userData)) {
        throw new Error(`L'app usa ${actual} come cartella dei dati invece di ${userData}: prova interrotta`);
      }
      await use(app);
    } finally {
      await app.close();
    }
    if (errors.length) throw new Error(`${errors.length} errori in console:\n${errors.join('\n')}`);
  },

  // La finestra dell'app, a tavola periodica caricata.
  window: async ({ app }, use) => {
    const window = await app.firstWindow();
    // il primo disegno su un computer lento (runner della CI, rendering software) può superare il tempo delle asserzioni
    await expect(window.locator('.cell[data-z="1"]')).toBeVisible({ timeout: 20_000 });
    await use(window);
  },
});

// L'app si lancia sulla build di produzione in dist/: senza, `electron .` aprirebbe una finestra vuota o, peggio, una
// build vecchia di un'altra prova. Si ferma tutto prima di lanciare Electron, con il comando che manca.
test.beforeAll(() => {
  if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    throw new Error('manca dist/: esegui prima `npx vite build`, poi rilancia `npm run e2e -- --project=electron`');
  }
});

/** Le etichette del menu dell'app (quelle in alto: File, Visualizza, Aiuto), lette dal processo principale. */
const menuLabels = (app) => app.evaluate(({ Menu }) => Menu.getApplicationMenu().items.map((item) => item.label));

test('userData è la cartella temporanea', async ({ app, userData }) => {
  // è la stessa verifica che la fixture `app` fa prima di ogni prova: qui è lo scenario dichiarato
  expect(realPath(await userDataOf(app))).toBe(realPath(userData));
});

test('preload: window.desktop con la piattaforma e il salvataggio', async ({ window }) => {
  expect(await window.evaluate(() => typeof window.desktop.gameSave.read)).toBe('function');
  expect(await window.evaluate(() => window.desktop.platform)).toBe(process.platform);
});

test('salvataggio su file nella cartella dei dati', async ({ window, userData }) => {
  // la scrittura parte senza risposta (ipcRenderer.send) e finisce sul disco dopo: la lettura la aspetta
  await window.evaluate(() => window.desktop.gameSave.write('{"v":1}'));
  await expect.poll(() => window.evaluate(() => window.desktop.gameSave.read())).toBe('{"v":1}');

  const file = path.join(userData, 'simulatore-salvataggio.json');
  expect(fs.existsSync(file)).toBe(true);
  expect(fs.readFileSync(file, 'utf8')).toBe('{"v":1}');
});

test('menu nella lingua scelta', async ({ app, window }) => {
  // si parte dall'italiano (--lang=it): il menu è in italiano
  await expect.poll(() => menuLabels(app)).toContain('Aiuto');

  // il passaggio all'inglese dalla barra: il menu lingua → English. La pagina si ricarica e comunica la lingua al menu.
  await window.locator('.toolbar .lang__btn').click();
  await window.locator('.toolbar .lang__item[data-lang="en"]').click();
  await expect(window.locator('html')).toHaveAttribute('data-lang', 'en');

  await expect.poll(() => menuLabels(app)).toContain('Help');
  expect(await menuLabels(app)).not.toContain('Aiuto');
});
