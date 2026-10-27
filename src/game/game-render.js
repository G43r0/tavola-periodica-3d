// Resa del simulatore: la scena si disegna direttamente sullo schermo in tutti i preset (il vetro e i fumi restano come
// tarati nella G1); nel Professionale sopra si moltiplica l'occlusione ambientale (GTAO: angoli, fessure e oggetti
// appoggiati più scuri). In tutti i preset la qualità si adatta: se gli fps restano sotto la soglia del preset si toglie
// un passo alla volta (quality.js), dal più costoso.
// Niente EffectComposer: in un'immagine intermedia lineare i trasparenti si fondono in un altro modo e il vetro sbianca.
import { ZeroFactor, OneFactor } from 'three';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { QualityMeter, GAME_ADAPT } from './quality.js';

/**
 * GTAO a metà risoluzione (costa un quarto e, sfocata dal filtro, non si nota), che ignora ciò che non è solido: vetro,
 * liquidi, fumo, fiamme, ombre di contatto e decalcomanie non devono fare ombra agli oggetti dietro.
 */
class GameAO extends GTAOPass {
  /** Calcola l'occlusione (normali e profondità, GTAO, filtro) e la moltiplica sull'immagine già disegnata. */
  overlay(renderer) {
    this._overrideVisibility();
    this._renderOverride(renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0);
    this._restoreVisibility();
    const cam = this.camera;
    const u = this.gtaoMaterial.uniforms;
    u.cameraNear.value = cam.near;
    u.cameraFar.value = cam.far;
    u.cameraProjectionMatrix.value.copy(cam.projectionMatrix);
    u.cameraProjectionMatrixInverse.value.copy(cam.projectionMatrixInverse);
    u.cameraWorldMatrix.value.copy(cam.matrixWorld);
    this._renderPass(renderer, this.gtaoMaterial, this.gtaoRenderTarget, 0xffffff, 1.0);
    this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(cam.projectionMatrixInverse);
    this._renderPass(renderer, this.pdMaterial, this.pdRenderTarget, 0xffffff, 1.0);
    this.blendMaterial.uniforms.intensity.value = this.blendIntensity;
    this.blendMaterial.uniforms.tDiffuse.value = this.pdRenderTarget.texture;
    this._renderPass(renderer, this.blendMaterial, null);
  }

  setSize(width, height) {
    super.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)));
  }

  _overrideVisibility() {
    const cache = this._visibilityCache;
    this.scene.traverse((o) => {
      if (!o.visible) return;
      const m = o.material;
      const see = o.isMesh && !(Array.isArray(m) ? m.some((x) => x.transparent) : m?.transparent || m?.depthWrite === false);
      if (!see && (o.isMesh || o.isPoints || o.isLine || o.isSprite)) {
        o.visible = false;
        cache.push(o);
      }
    });
  }
}

export class GameRenderer {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {{scene: THREE.Scene, camera: THREE.Camera, room: object}} game
   * @param {object} G impostazioni del preset (gfx())
   * @param {{onStep?: (step: string) => void}} [opts] onStep: avviso quando la qualità scende
   */
  constructor(renderer, game, G, { onStep } = {}) {
    this.renderer = renderer;
    this.game = game;
    this.G = G;
    this.onStep = onStep;
    this.dpr = window.devicePixelRatio || 1;
    this.base = G.pixelRatio(this.dpr);
    this.meter = new QualityMeter(GAME_ADAPT[G.ao ? 'pro' : G.post ? 'medium' : 'simple'], G.adaptFps);
    this.ao = null;
    if (G.ao) {
      this.ao = new GameAO(game.scene, game.camera, 1, 1);
      this.ao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.6, thickness: 1.5, scale: 1, samples: 12, distanceFallOff: 1 });
      this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      this.ao.blendIntensity = 0.85;
      // sulla tela si moltiplica solo il colore: l'alfa resta 1 (se no la pagina sotto traspare e l'immagine sbiadisce)
      this.ao.blendMaterial.blendSrcAlpha = ZeroFactor;
      this.ao.blendMaterial.blendDstAlpha = OneFactor;
    }
    this.w = 1;
    this.h = 1;
  }

  setSize(w, h) {
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    const pr = this.renderer.getPixelRatio();
    this.ao?.setSize(w * pr, h * pr);
  }

  render() {
    this.renderer.render(this.game.scene, this.game.camera);
    if (this.ao?.enabled) this.ao.overlay(this.renderer);
  }

  /** Un fotogramma giocato (solo mentre si gioca: i menu e le finestre non contano). */
  sample(dt) {
    const step = this.meter.push(dt);
    if (step) this.apply(step);
  }

  /** Applica il passo di riduzione arrivato (e quelli prima, già fatti). */
  apply(step) {
    const done = new Set(this.meter.done());
    if (this.ao) this.ao.enabled = !done.has('ao');
    if (this.G.shadows && done.has('shadows')) {
      this.renderer.shadowMap.enabled = false;
      this.game.room.lights.sun.castShadow = false;
    }
    let ratio = this.base;
    if (done.has('supersample')) ratio = Math.min(this.dpr, 2);
    if (done.has('dpr1')) ratio = 1;
    if (done.has('dpr075')) ratio = 0.75;
    if (ratio !== this.renderer.getPixelRatio()) {
      this.renderer.setPixelRatio(ratio);
      this.setSize(this.w, this.h);
    }
    this.onStep?.(step);
  }
}
