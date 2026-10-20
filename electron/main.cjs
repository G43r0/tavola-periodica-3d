// Processo principale Electron: crea la finestra e carica l'interfaccia (offline).
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(DEV_URL);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#080d15',
    title: 'Tavola Periodica 3D',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Nessuna navigazione esterna: l'app è completamente offline.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault();
  });

  if (isDev) mainWindow.loadURL(DEV_URL);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

// Voci del menu nella lingua scelta nell'app («eli6» usa l'italiano).
const MENU_TEXT = {
  it: { quit: 'Esci', view: 'Visualizza', reload: 'Ricarica', resetZoom: 'Zoom predefinito', zoomIn: 'Aumenta zoom', zoomOut: 'Riduci zoom', fullscreen: 'Schermo intero', devTools: 'Strumenti per sviluppatori' },
  en: { quit: 'Quit', view: 'View', reload: 'Reload', resetZoom: 'Actual size', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fullscreen: 'Full screen', devTools: 'Developer tools' },
};

function buildMenu(lang = 'it') {
  const m = MENU_TEXT[lang] ?? MENU_TEXT.it;
  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit', label: m.quit }],
    },
    {
      label: m.view,
      submenu: [
        { role: 'reload', label: m.reload },
        { type: 'separator' },
        { role: 'resetZoom', label: m.resetZoom },
        { role: 'zoomIn', label: m.zoomIn },
        { role: 'zoomOut', label: m.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: m.fullscreen },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools', label: m.devTools }] : []),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on('set-language', (_event, code) => buildMenu(code === 'en' ? 'en' : 'it'));

// Salvataggi del simulatore: un file JSON nella cartella dei dati dell'utente (accanto, la copia precedente). Si accetta
// solo JSON valido fino a 5 MB; la scrittura passa da un file temporaneo, così un'interruzione non lascia il file a metà.
const SAVE_MAX = 5 * 1024 * 1024;
const saveFile = () => path.join(app.getPath('userData'), 'simulatore-salvataggio.json');
ipcMain.handle('game-save:read', async () => {
  try {
    const text = await fs.promises.readFile(saveFile(), 'utf8');
    return text.length <= SAVE_MAX ? text : null;
  } catch {
    return null;
  }
});
ipcMain.on('game-save:write', (_event, json) => {
  if (typeof json !== 'string' || json.length > SAVE_MAX) return;
  try {
    JSON.parse(json);
  } catch {
    return;
  }
  const file = saveFile();
  const tmp = `${file}.tmp`;
  fs.promises.writeFile(tmp, json, 'utf8')
    .then(() => fs.promises.copyFile(file, `${file}.bak`).catch(() => {}))
    .then(() => fs.promises.rename(tmp, file))
    .catch(() => {});
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    buildMenu();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
