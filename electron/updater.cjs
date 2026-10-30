// Aggiornamenti dell'app. Installata (NSIS, AppImage): electron-updater scarica la versione nuova dalle release di GitHub
// in sottofondo e la installa alla chiusura (o subito, a richiesta). Versione portabile: non può sostituirsi da sola,
// quindi si controlla l'ultima release e si offre il collegamento per scaricarla. In sviluppo non fa nulla.
const fs = require('node:fs');
const path = require('node:path');
const { LATEST_API, RELEASES_URL, latestFromRelease, parseSettings } = require('./update-logic.cjs');

const FIRST_CHECK_MS = 15 * 1000;
const EVERY_MS = 6 * 60 * 60 * 1000;

function setupUpdater({ app, ipcMain, shell, net, getWindow, isDev }) {
  const settingsFile = path.join(app.getPath('userData'), 'impostazioni.json');
  let settings = { autoUpdate: true };
  try {
    settings = parseSettings(fs.readFileSync(settingsFile, 'utf8'));
  } catch {
    /* prima esecuzione */
  }

  const portable = Boolean(process.env.PORTABLE_EXECUTABLE_FILE);
  const installable = app.isPackaged && !portable && (process.platform === 'win32' || Boolean(process.env.APPIMAGE));
  const mode = isDev || !app.isPackaged ? 'off' : installable ? 'auto' : 'manual';

  // stato: none | checking | downloading | ready | available (solo manuale) | error
  let status = { state: 'none' };
  let autoUpdater = null;
  let timer = null;

  const publish = (next) => {
    status = next;
    const win = getWindow();
    if (win && !win.isDestroyed()) win.webContents.send('updater:status', status);
  };

  if (mode === 'auto') {
    ({ autoUpdater } = require('electron-updater'));
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.logger = null;
    autoUpdater.on('checking-for-update', () => publish({ state: 'checking' }));
    autoUpdater.on('update-available', (info) => publish({ state: 'downloading', version: info.version, percent: 0 }));
    autoUpdater.on('download-progress', (p) => publish({ state: 'downloading', version: status.version, percent: Math.round(p.percent) }));
    autoUpdater.on('update-not-available', () => publish({ state: 'none', checkedAt: Date.now() }));
    autoUpdater.on('update-downloaded', (info) => publish({ state: 'ready', version: info.version }));
    autoUpdater.on('error', () => publish({ state: 'error' }));
  }

  async function check() {
    if (mode === 'off' || status.state === 'downloading' || status.state === 'ready') return status;
    try {
      if (mode === 'auto') {
        await autoUpdater.checkForUpdates();
      } else {
        publish({ state: 'checking' });
        const res = await net.fetch(LATEST_API, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'TavolaPeriodica3D' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const latest = latestFromRelease(await res.json(), app.getVersion());
        publish(latest ? { state: 'available', ...latest } : { state: 'none', checkedAt: Date.now() });
      }
    } catch {
      publish({ state: 'error' }); // senza rete l'app funziona lo stesso: l'errore si vede solo se si chiede il controllo
    }
    return status;
  }

  function schedule() {
    clearInterval(timer);
    if (mode === 'off' || !settings.autoUpdate) return;
    setTimeout(() => settings.autoUpdate && check(), FIRST_CHECK_MS).unref?.();
    timer = setInterval(() => check(), EVERY_MS);
    timer.unref?.();
  }

  ipcMain.handle('updater:get', () => ({ version: app.getVersion(), mode, autoUpdate: settings.autoUpdate, status }));
  ipcMain.handle('updater:check', () => check());
  ipcMain.handle('updater:set-auto', (_event, on) => {
    settings = { ...settings, autoUpdate: Boolean(on) };
    fs.promises.writeFile(settingsFile, JSON.stringify(settings), 'utf8').catch(() => {});
    schedule();
    return settings.autoUpdate;
  });
  ipcMain.on('updater:install', () => {
    if (autoUpdater && status.state === 'ready') autoUpdater.quitAndInstall(true, true);
  });
  ipcMain.on('updater:open-release', () => {
    shell.openExternal(status.state === 'available' && status.url ? status.url : RELEASES_URL);
  });

  return { schedule };
}

module.exports = { setupUpdater };
