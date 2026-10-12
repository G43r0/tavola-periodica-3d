// Preset grafici: Semplice (computer poco potenti), Medio (predefinito) e Professionale
// (massimo dettaglio: materiali fisici, riflessi dell'ambiente, ombre, occlusione ambientale,
// colori e texture realistici degli elementi). Come la lingua, la scelta si salva e ricarica
// l'interfaccia: ogni modulo legge le impostazioni una volta sola, all'avvio.

const STORAGE_KEY = 'tp3d.gfx';
export const PRESETS = ['simple', 'medium', 'pro'];
const isBrowser = typeof document !== 'undefined';

/**
 * Impostazioni per preset.
 * - pixelRatio(dpr): risoluzione di disegno della grafica 3D
 * - post: post-processing (bloom); msaa: campioni di antialiasing sulle immagini intermedie
 * - env: riflessi di uno studio fotografico (illuminazione basata sull'immagine)
 * - shadows / ao: ombre portate e occlusione ambientale (contatto tra le sfere)
 * - physical: materiali con vernice trasparente (clearcoat) e lucentezza realistica
 * - detail: moltiplicatore dei segmenti delle sfere; points: moltiplicatore dei punti delle nuvole orbitali
 * - adapt: passi con cui la qualità scende se il computer non regge (fps sotto adaptFps)
 */
const SETTINGS = {
  simple: {
    pixelRatio: () => 1,
    antialias: false,
    post: false,
    msaa: 0,
    toneMapping: 'aces',
    exposure: 1.05,
    env: false,
    shadows: false,
    ao: false,
    physical: false,
    detail: 0.45,
    points: 0.45,
    pointSize: 1.3,
    dust: 0,
    adapt: [],
    adaptFps: 30,
    baseLevel: 0,
    animatedIcons: false,
    specimens: false,
    sandbox: { glow: false, texture: false, dpr: 1 },
  },
  medium: {
    pixelRatio: (dpr) => Math.min(dpr, 2),
    antialias: true,
    post: true,
    msaa: 0,
    toneMapping: 'aces',
    exposure: 1.05,
    env: false,
    shadows: false,
    ao: false,
    physical: false,
    detail: 1,
    points: 1,
    pointSize: 1,
    dust: 900,
    adapt: ['bloom', 'dpr1'],
    adaptFps: 45,
    baseLevel: 2,
    animatedIcons: true,
    specimens: false,
    sandbox: { glow: true, texture: false, dpr: 2 },
  },
  pro: {
    // sovracampionamento anche sugli schermi normali: bordi e dettagli più puliti
    pixelRatio: (dpr) => Math.min(Math.max(dpr, 1.5), 2.5),
    antialias: true,
    post: true,
    msaa: 4,
    // tone mapping «neutro» (Khronos PBR Neutral): conserva tinta e saturazione dei colori di base
    toneMapping: 'neutral',
    exposure: 1.0,
    env: true,
    shadows: true,
    ao: true,
    physical: true,
    detail: 2,
    points: 2.2,
    pointSize: 0.74,
    dust: 2600,
    adapt: ['supersample', 'ao', 'shadows', 'bloom', 'dpr1'],
    adaptFps: 36,
    baseLevel: 3,
    animatedIcons: true,
    specimens: true,
    sandbox: { glow: true, texture: true, dpr: 2 },
  },
};

function storageGet() {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function storageSet(value) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value);
  } catch {
    /* archiviazione non disponibile: la scelta vale fino alla chiusura */
  }
}

let current = (() => {
  const saved = isBrowser ? storageGet() : null;
  return PRESETS.includes(saved) ? saved : 'medium';
})();

/** Codice del preset attivo: 'simple' | 'medium' | 'pro'. */
export const getGfx = () => current;
/** Impostazioni del preset attivo. */
export const gfx = () => SETTINGS[current];
export const gfxOf = (code) => SETTINGS[code];

/** Segmenti di una sfera o di un cilindro secondo il dettaglio del preset (mai sotto `min`). */
export const seg = (n, min = 6) => Math.max(min, Math.round(n * SETTINGS[current].detail));

/** Solo per i test: cambia il preset senza ricaricare. */
export function _setGfxForTests(code) {
  current = code;
}

const listeners = new Set();
/** Funzioni chiamate prima del cambio di preset (per salvare lo stato da ripristinare). */
export function beforeGfxChange(fn) {
  listeners.add(fn);
}

/** Cambia preset: salva la scelta e ricarica l'interfaccia. */
export function setGfx(code) {
  if (!PRESETS.includes(code) || code === current) return;
  listeners.forEach((fn) => {
    try {
      fn(code);
    } catch (err) {
      console.error(err);
    }
  });
  storageSet(code);
  current = code;
  if (isBrowser) location.reload();
}
