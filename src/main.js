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
import { createT, getLang, langInfo, beforeLangChange } from './i18n/index.js';
import { localizeElements } from './i18n/elements.js';
import { createStore, initialState } from './state/store.js';
import { createToolbar } from './ui/toolbar.js';
import { createPeriodicTable } from './ui/periodic-table.js';
import { createElementPanel } from './ui/element-panel.js';
import { createInfoDialog } from './ui/info-dialog.js';
import { toast } from './ui/toast.js';
import { createExplain } from './ui/explain.js';
import { initSparks } from './ui/sparks.js';

const t = createT({
  it: {
    error3d: 'Impossibile caricare il visualizzatore 3D.',
    errorLab: 'Impossibile caricare il laboratorio molecolare.',
    errorSandbox: 'Impossibile caricare la sandbox.',
  },
  en: {
    error3d: 'Could not load the 3D viewer.',
    errorLab: 'Could not load the molecular laboratory.',
    errorSandbox: 'Could not load the sandbox.',
  },
});

document.documentElement.lang = langInfo().html;
document.documentElement.dataset.lang = getLang();
window.desktop?.setLanguage?.(getLang());

const elements = localizeElements(data.elements);
const store = createStore({ ...initialState, categories: new Set(), blocks: new Set() });

// dopo il cambio di lingua (che ricarica la pagina) si riapre l'elemento che era selezionato
const RESUME_KEY = 'tp3d.resume';
beforeLangChange(() => {
  try {
    sessionStorage.setItem(RESUME_KEY, JSON.stringify({ z: store.get().selectedZ, query: store.get().query }));
  } catch {
    /* niente da ripristinare */
  }
});

const app = document.getElementById('app');
app.innerHTML = `
  <header class="toolbar"></header>
  <div class="legend" role="group" data-help="ui.categories"></div>
  <main class="workspace">
    <div class="stage"></div>
    <aside class="panel" data-help="ui.elementPanel" aria-labelledby="panel-title"></aside>
  </main>`;

const info = createInfoDialog();
const open = (z) => store.set({ selectedZ: z });

const table = createPeriodicTable(app.querySelector('.stage'), elements, store, { onOpen: open });

const toolbar = createToolbar(app.querySelector('.toolbar'), app.querySelector('.legend'), elements, store, {
  onOpen: open,
  onInfo: info.open,
  onLab: () => openLab(),
  onSandbox: () => openSandbox(),
  onCategoryHover: (key) => table.highlightCategory(key),
  onSearchCommit: (text, ev) => sparks.onSearchCommit(text, ev),
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
      toast(t('error3d'));
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
      toast(t('errorLab'));
    });
  labLoading.then((l) => l?.open(z));
}

// ------------------------------------------------------------ sandbox degli elementi (caricata su richiesta)
let sandbox = null;
let sandboxLoading = null;

function openSandbox(z) {
  sandboxLoading ??= import('./sandbox/sandbox-view.js')
    .then((m) => {
      sandbox = m.createSandbox(elements, {});
      return sandbox;
    })
    .catch((err) => {
      console.error(err);
      sandboxLoading = null;
      toast(t('errorSandbox'));
    });
  sandboxLoading.then((s) => s?.open(z));
}

createElementPanel(app.querySelector('.panel'), elements, store, {
  onInfo: info.open,
  onOpen3D: open3D,
  onOpenLab: openLab,
  onOpenSandbox: openSandbox,
});

// ------------------------------------------------------------ modalità Spiega (F1)
const explain = createExplain(elements, {
  onOpenElement: (z) => {
    if (!viewer?.isOpen() && !lab?.isOpen() && !sandbox?.isOpen()) store.set({ selectedZ: z });
  },
});

const sparks = initSparks({ elements, store, table, explain });

try {
  const resume = JSON.parse(sessionStorage.getItem(RESUME_KEY) || 'null');
  sessionStorage.removeItem(RESUME_KEY);
  if (resume?.query) store.set({ query: resume.query });
  if (resume?.z) store.set({ selectedZ: resume.z });
} catch {
  /* nessuno stato da ripristinare */
}

// ------------------------------------------------------------ scorciatoie globali
const isTyping = (t) => t instanceof HTMLElement && (t.matches('input, textarea, select') || t.isContentEditable);

window.addEventListener('keydown', (ev) => {
  if (document.querySelector('dialog[open]') || viewer?.isOpen() || lab?.isOpen() || sandbox?.isOpen()) return;
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
