// Punto di ingresso dell'interfaccia.
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/table.css';
import './styles/panel.css';

import data from './data/elements.json';
import { createStore, initialState } from './state/store.js';
import { createToolbar } from './ui/toolbar.js';
import { createPeriodicTable } from './ui/periodic-table.js';
import { createElementPanel } from './ui/element-panel.js';
import { createInfoDialog } from './ui/info-dialog.js';
import { toast } from './ui/toast.js';

const elements = data.elements;
const store = createStore({ ...initialState, categories: new Set(), blocks: new Set() });

const app = document.getElementById('app');
app.innerHTML = `
  <header class="toolbar"></header>
  <div class="legend" role="group" aria-label="Legenda e filtro per categoria"></div>
  <main class="workspace">
    <div class="stage"></div>
    <aside class="panel" aria-labelledby="panel-title"></aside>
  </main>`;

const info = createInfoDialog(data.meta);
const open = (z) => store.set({ selectedZ: z });

const table = createPeriodicTable(app.querySelector('.stage'), elements, store, { onOpen: open });

const toolbar = createToolbar(app.querySelector('.toolbar'), app.querySelector('.legend'), elements, store, {
  onOpen: open,
  onInfo: info.open,
  onLab: () => openLab(),
  onCategoryHover: (key) => table.highlightCategory(key),
});

// ------------------------------------------------------------ visualizzatore 3D (caricato su richiesta)
let viewer = null;
let viewerLoading = null;

function open3D(z) {
  viewerLoading ??= import('./viewer/atom-viewer.js')
    .then((m) => {
      viewer = m.createAtomViewer(elements, {
        // tornando alla tavola la scheda mostra l'ultimo elemento visto in 3D
        onClose: (lastZ) => lastZ && store.set({ selectedZ: lastZ }),
      });
      return viewer;
    })
    .catch((err) => {
      console.error(err);
      viewerLoading = null;
      toast('Impossibile caricare il visualizzatore 3D.');
    });
  viewerLoading.then((v) => v?.open(z));
}

// ------------------------------------------------------------ laboratorio molecolare (caricato su richiesta)
let lab = null;
let labLoading = null;

function openLab(z) {
  labLoading ??= import('./lab/lab-view.js')
    .then((m) => {
      lab = m.createLab(elements, {});
      return lab;
    })
    .catch((err) => {
      console.error(err);
      labLoading = null;
      toast('Impossibile caricare il laboratorio molecolare.');
    });
  labLoading.then((l) => l?.open(z));
}

createElementPanel(app.querySelector('.panel'), elements, store, {
  onInfo: info.open,
  onOpen3D: open3D,
  onOpenLab: openLab,
});

// ------------------------------------------------------------ scorciatoie globali
const isTyping = (t) => t instanceof HTMLElement && (t.matches('input, textarea, select') || t.isContentEditable);

window.addEventListener('keydown', (ev) => {
  if (document.querySelector('dialog[open]') || viewer?.isOpen() || lab?.isOpen()) return;
  const typing = isTyping(ev.target);

  if ((ev.key === '/' && !typing) || ((ev.ctrlKey || ev.metaKey) && ['f', 'k'].includes(ev.key.toLowerCase()))) {
    ev.preventDefault();
    toolbar.focusSearch();
    return;
  }

  const { selectedZ } = store.get();
  if (ev.key === 'Escape' && selectedZ && !typing) {
    store.set({ selectedZ: null });
    table.focusCell(selectedZ);
    return;
  }

  // ←/→ cambiano elemento quando la scheda è aperta e il focus non è nella tavola
  const inTable = ev.target instanceof HTMLElement && ev.target.closest('.ptable');
  if (selectedZ && !typing && !inTable && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) {
    ev.preventDefault();
    const z = ev.key === 'ArrowLeft' ? (selectedZ === 1 ? 118 : selectedZ - 1) : selectedZ === 118 ? 1 : selectedZ + 1;
    store.set({ selectedZ: z });
  }
});

if (window.desktop) document.documentElement.dataset.platform = window.desktop.platform;
