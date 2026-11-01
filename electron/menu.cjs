// Menu dell'app nella lingua scelta nell'app («eli6» usa l'italiano). Logica pura, si prova con npm test.

const MENU_TEXT = {
  it: { quit: 'Esci', view: 'Visualizza', reload: 'Ricarica', resetZoom: 'Zoom predefinito', zoomIn: 'Aumenta zoom', zoomOut: 'Riduci zoom', fullscreen: 'Schermo intero', devTools: 'Strumenti per sviluppatori', help: 'Aiuto', about: 'Informazioni su Tavola Periodica 3D' },
  en: { quit: 'Quit', view: 'View', reload: 'Reload', resetZoom: 'Actual size', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fullscreen: 'Full screen', devTools: 'Developer tools', help: 'Help', about: 'About Tavola Periodica 3D' },
};

function menuTemplate(lang = 'it', { isDev = false } = {}) {
  const m = MENU_TEXT[lang] ?? MENU_TEXT.it;
  return [
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
    {
      label: m.help,
      // la finestra con la versione dell'app, di Electron e di Chrome (app.setAboutPanelOptions in main.cjs)
      submenu: [{ role: 'about', label: m.about }],
    },
  ];
}

module.exports = { menuTemplate };
