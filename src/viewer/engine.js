// Motore 3D: renderer, camera, controlli orbitali, post-processing (bloom),
// etichette HTML (CSS2D), ciclo di rendering e qualità adattiva.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const _follow = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _to = new THREE.Vector3();

export class Engine {
  constructor(host) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x04070c, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.domElement.className = 'av-canvas';
    host.append(this.renderer.domElement);

    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'av-labels';
    host.append(this.labels.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 2000);
    this.camera.position.set(0, 8, 40);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.9;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 400;
    this.controls.screenSpacePanning = true;
    this.dragging = false;
    this.controls.addEventListener('start', () => {
      this.dragging = true;
      this.cameraTween = null; // l'utente prende il controllo
    });
    this.controls.addEventListener('end', () => (this.dragging = false));

    // luci: chiave calda, contro-luce ciano, ambiente tenue
    this.scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x0b1020, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(6, 10, 8);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x5ce1ff, 60, 0, 1.6);
    rim.position.set(-8, -4, -6);
    this.scene.add(rim);
    this.scene.add(this.#dust());

    // post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.35, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.insets = { left: 0, right: 0 }; // spazio occupato dai pannelli laterali (px)
    this.viewShift = 0;
    this.followFn = null; // oggetto seguito dalla camera (particella selezionata)
    this.followPos = new THREE.Vector3();
    this.followSmooth = 0;

    this.timer = new THREE.Timer();
    this.updaters = new Set();
    this.running = false;
    this.cameraTween = null;
    this.frameTimes = [];
    this.quality = 2; // 2 = alta, 1 = senza bloom, 0 = pixel ratio 1
    this.onFps = null;

    new ResizeObserver(() => requestAnimationFrame(() => this.resize())).observe(host);
    this.resize();
  }

  /** Polvere di fondo per dare profondità alla scena. */
  #dust() {
    const count = 900;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 120 + Math.random() * 380;
      const z = 2 * Math.random() - 1;
      const phi = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      pos.set([r * s * Math.cos(phi), r * z, r * s * Math.sin(phi)], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x6f8fb8, size: 1.1, sizeAttenuation: true, transparent: true, opacity: 0.35, depthWrite: false });
    return new THREE.Points(geo, mat);
  }

  /** Pannelli sovrapposti alla scena: il centro della vista si sposta nello spazio libero. */
  setInsets(left, right) {
    this.insets = { left, right };
    this.viewShift = (right - left) / 2;
    this.resize();
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.labels.setSize(w, h);
    this.camera.aspect = w / h;
    // con i pannelli laterali aperti il centro della vista si sposta nello spazio libero
    if (this.viewShift) this.camera.setViewOffset(w, h, this.viewShift, 0, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  add(fn) {
    this.updaters.add(fn);
    return () => this.updaters.delete(fn);
  }

  /** Distanza della camera che inquadra una sfera di raggio r. */
  fitDistance(r) {
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    // larghezza visibile: esclude la parte coperta dai pannelli laterali
    const w = Math.max(1, this.host.clientWidth - this.insets.left - this.insets.right);
    const aspect = w / Math.max(1, this.host.clientHeight);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    return (r / Math.sin(Math.min(vFov, hFov) / 2)) * 1.08;
  }

  /** Sposta la camera in modo fluido verso una posizione e un bersaglio. */
  flyTo(position, target = new THREE.Vector3(), duration = 1.2) {
    this.cameraTween = {
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: position.clone(),
      toTarget: target.clone(),
      t: 0,
      duration,
    };
  }

  /** Avvicina/allontana la camera mantenendo la direzione di vista attuale. */
  flyToDistance(distance, target = this.controls.target, duration = 1.0) {
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.flyTo(target.clone().add(dir.multiplyScalar(distance)), target, duration);
  }

  /**
   * Segue un oggetto in movimento: `getter(out)` scrive la sua posizione in `out` e restituisce
   * `out`, oppure null se l'oggetto non è visibile. La camera vola alla distanza indicata
   * mantenendo la direzione di vista; poi lo segue lasciando liberi rotazione e zoom.
   * @param {number} smooth costante di smorzamento (1/s) per attenuare piccole vibrazioni; 0 = nessuna
   */
  focus(getter, distance, { duration = 1.1, smooth = 0 } = {}) {
    this.followFn = getter;
    this.followSmooth = smooth;
    const pos = getter(_follow);
    if (!pos) {
      this.followFn = null;
      return;
    }
    this.followPos.copy(pos);
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.cameraTween = {
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      offset: dir.multiplyScalar(distance),
      track: true,
      t: 0,
      duration,
    };
  }

  /** Smette di seguire l'oggetto (la camera resta dov'è). */
  unfollow() {
    this.followFn = null;
    if (this.cameraTween?.track) this.cameraTween = null;
  }

  /** Distanza attuale tra camera e punto osservato. */
  get viewDistance() {
    return this.camera.position.distanceTo(this.controls.target);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.timer.reset();
    const loop = (timestamp) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.timer.update(timestamp);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  frame() {
    const dt = Math.min(this.timer.getDelta(), 0.05);

    // prima si aggiornano le particelle, poi la camera: chi segue un elettrone lo vede fermo al centro
    for (const fn of this.updaters) fn(dt);
    this.#updateCamera(dt);

    if (this.quality >= 1) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
    this.#adapt(dt);
  }

  #updateCamera(dt) {
    let follow = null;
    if (this.followFn) {
      follow = this.followFn(_follow);
      if (follow && this.followSmooth > 0) {
        follow = this.followPos.lerp(follow, 1 - Math.exp(-dt * this.followSmooth));
      } else if (follow) {
        follow = this.followPos.copy(follow);
      }
    }

    const tw = this.cameraTween;
    if (tw) {
      tw.t = Math.min(1, tw.t + dt / tw.duration);
      const k = easeInOut(tw.t);
      const toTarget = tw.track ? follow ?? tw.fromTarget : tw.toTarget;
      const toPos = tw.track ? _to.copy(toTarget).add(tw.offset) : tw.toPos;
      this.camera.position.lerpVectors(tw.fromPos, toPos, k);
      this.controls.target.lerpVectors(tw.fromTarget, toTarget, k);
      if (tw.t >= 1) this.cameraTween = null;
      if (follow) this.lastFollow = (this.lastFollow ?? new THREE.Vector3()).copy(follow);
    } else if (follow) {
      // trasla camera e bersaglio insieme all'oggetto: l'utente può continuare a ruotare e zoomare
      if (this.lastFollow) {
        _delta.subVectors(follow, this.lastFollow);
        this.camera.position.add(_delta);
        this.controls.target.add(_delta);
      } else {
        this.lastFollow = new THREE.Vector3();
      }
      this.lastFollow.copy(follow);
    } else {
      this.lastFollow = null;
    }
    this.controls.update();
  }

  /** Qualità adattiva: se si scende sotto ~45 fps si disattiva il bloom, poi si riduce la risoluzione. */
  #adapt(dt) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    const fps = 1 / avg;
    this.onFps?.(fps, this.quality);
    if (fps < 45 && this.quality > 0) {
      this.quality -= 1;
      if (this.quality === 1) this.bloom.enabled = false;
      if (this.quality === 0) {
        this.renderer.setPixelRatio(1);
        this.resize();
      }
    }
  }

  resetQuality() {
    this.quality = 2;
    this.bloom.enabled = true;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.resize();
  }
}
