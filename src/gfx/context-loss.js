// Contesto WebGL perso e ripristinato: succede quando il driver della scheda grafica si riavvia, quando la scheda è
// sotto sforzo o quando il PC esce dalla sospensione. Three.js chiama già `preventDefault()` e al ripristino ricarica
// da sé geometrie e texture; restano da rifare le immagini che la scheda grafica disegna una volta sola, cioè le mappe
// d'ambiente dello studio fotografico (PMREM): senza, dopo il ripristino, metalli e vetro restano senza riflessi.
// Questo modulo ascolta i due eventi, rigenera la mappa e la sostituisce dove era usata, e dà i testi dell'avviso.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createT } from '../i18n/index.js';

const t = createT({
  it: {
    lost: 'La grafica si è interrotta: la sto ripristinando…',
    restored: 'Grafica ripristinata',
  },
  en: {
    lost: 'The graphics stopped: restoring them…',
    restored: 'Graphics restored',
  },
  eli6: {
    lost: 'Le immagini si sono fermate: le sto facendo ripartire…',
    restored: 'Le immagini sono ripartite',
  },
});

/** Testo dell'avviso: 'lost' mentre il contesto è perso, 'restored' quando torna. */
export const contextNotice = (kind) => t(kind);

/**
 * Ascolta la perdita e il ripristino del contesto sulla tela del renderer.
 * @param {EventTarget} canvas `renderer.domElement`
 * @param {{ onLost?: () => void, onRestored?: () => void }} [hooks]
 * @returns {{ lost: boolean, losses: number, dispose: () => void }} `lost` vale finché il contesto non torna
 */
export function watchContextLoss(canvas, { onLost, onRestored } = {}) {
  const state = {
    lost: false,
    losses: 0,
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    },
  };
  function lost() {
    state.lost = true;
    state.losses++;
    onLost?.();
  }
  function restored() {
    state.lost = false;
    onRestored?.();
  }
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  return state;
}

/**
 * La mappa d'ambiente dello studio fotografico (RoomEnvironment filtrato con PMREM), come la fanno il visualizzatore,
 * il simulatore e i campioni 3D.
 * @param {THREE.WebGLRenderer} renderer
 * @param {number} sigma sfocatura
 */
export function roomEnvironment(renderer, sigma) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const texture = pmrem.fromScene(room, sigma).texture;
  room.dispose();
  pmrem.dispose();
  return texture;
}

/**
 * Sostituisce una texture in `environment` e `background` delle scene e in ogni proprietà dei materiali che la usava:
 * quelli degli oggetti nelle scene e quelli passati a parte (per esempio i materiali del simulatore per gli oggetti non
 * ancora sul banco). Restituisce quante sostituzioni ha fatto.
 * @param {{ scenes?: THREE.Scene[], materials?: unknown[] }} where
 * @param {THREE.Texture} oldTex
 * @param {THREE.Texture} newTex
 */
export function swapTexture({ scenes = [], materials = [] }, oldTex, newTex) {
  const seen = new Set();
  let n = 0;
  const fix = (m) => {
    if (!m?.isMaterial || seen.has(m)) return;
    seen.add(m);
    let changed = false;
    for (const key of Object.keys(m)) {
      if (m[key] === oldTex) {
        m[key] = newTex;
        changed = true;
      }
    }
    if (changed) {
      m.needsUpdate = true;
      n++;
    }
  };
  for (const scene of scenes) {
    if (scene.environment === oldTex) {
      scene.environment = newTex;
      n++;
    }
    if (scene.background === oldTex) {
      scene.background = newTex;
      n++;
    }
    scene.traverse((o) => {
      if (o.material) for (const m of [].concat(o.material)) fix(m);
    });
  }
  for (const m of materials) fix(m);
  return n;
}

/**
 * Rigenera la mappa d'ambiente dopo il ripristino e la mette al posto della vecchia. Restituisce la nuova (o null se
 * non ce n'era una).
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Texture | null} oldTex
 * @param {number} sigma
 * @param {{ scenes?: THREE.Scene[], materials?: unknown[] }} where
 */
export function renewEnvironment(renderer, oldTex, sigma, where) {
  if (!oldTex) return null;
  const tex = roomEnvironment(renderer, sigma);
  swapTexture(where, oldTex, tex);
  oldTex.dispose();
  return tex;
}
