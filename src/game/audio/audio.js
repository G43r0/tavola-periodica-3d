// Audio del simulatore (Web Audio): i suoni di sound-list.js, scaricati da Freesound con licenza CC0.
// Due tipi di suono:
//  - colpi singoli (vetro che si rompe, campanello, esplosione…): play(nome, posizione, { gain, rate });
//  - anelli che durano quanto la loro causa (getto, rubinetto, Bunsen, fuoco, allarme…): il gioco passa a ogni
//    fotogramma l'elenco di quelli attivi con il volume voluto (loops), e qui il volume sale e scende piano.
// Con una posizione il suono viene da quel punto della stanza (panner con la distanza), senza è «nella testa».
// Il contesto audio parte solo dopo un gesto dell'utente (regola dei browser): resume() lo chiama la vista al primo clic.
import { SOUNDS } from './sound-list.js';

const URLS = import.meta.glob('./sfx/*.ogg', { eager: true, query: '?url', import: 'default' });
const BY_NAME = Object.fromEntries(SOUNDS.map((s) => [s.name, s]));
const RAMP = 0.12; // s: costante di tempo con cui un anello raggiunge il volume voluto
const MAX_VOICES = 24; // colpi singoli insieme, oltre si tralasciano

/**
 * Legge un file come ArrayBuffer. Con XMLHttpRequest e non con fetch: nell'app Electron la pagina è caricata da file://,
 * dove fetch non è permesso, mentre XMLHttpRequest sì (e funziona anche in http durante lo sviluppo).
 */
function readBytes(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';
    // da file:// lo stato è 0 anche quando la lettura riesce
    xhr.onload = () => ((xhr.status === 200 || xhr.status === 0) && xhr.response ? resolve(xhr.response) : reject(new Error(`${url}: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error(url));
    xhr.send();
  });
}

export class GameAudio {
  constructor({ volume = 0.8, muted = false } = {}) {
    this.ctx = null;
    this.master = null;
    this.buffers = new Map();
    this.loading = null;
    this.volume = volume;
    this.muted = muted;
    this.active = new Map(); // id → { src, gain, panner, name }
    this.voices = 0;
  }

  /** Crea (o riprende) il contesto audio e carica i suoni: da chiamare dentro un gesto dell'utente. */
  resume() {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.applyVolume();
      this.loading = this.load();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  /** Sospende il contesto (simulatore chiuso o nel menu): niente suoni, niente lavoro per la scheda audio. */
  suspend() {
    this.loops([]);
    if (this.ctx?.state === 'running') this.ctx.suspend().catch(() => {});
  }

  async load() {
    await Promise.all(SOUNDS.map(async (s) => {
      const url = URLS[`./sfx/${s.name}.ogg`];
      if (!url) return;
      try {
        const data = await readBytes(new URL(url, document.baseURI).href);
        this.buffers.set(s.name, await this.ctx.decodeAudioData(data));
      } catch {
        /* un suono che non si carica resta muto */
      }
    }));
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, Number(v) || 0));
    this.applyVolume();
  }

  setMuted(m) {
    this.muted = Boolean(m);
    this.applyVolume();
  }

  applyVolume() {
    if (!this.master) return;
    // curva al quadrato: il cursore a metà è circa −12 dB, come si aspetta l'orecchio
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume ** 2, this.ctx.currentTime, 0.03);
  }

  /** Posizione e orientamento dell'ascoltatore: la camera del giocatore. */
  listen(camera) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const l = this.ctx.listener;
    const e = camera.matrixWorld.elements;
    const t = this.ctx.currentTime;
    // in avanti è −z della camera, in alto +y
    const set = (param, v) => (param ? param.setTargetAtTime(v, t, 0.02) : null);
    if (l.positionX) {
      set(l.positionX, e[12]);
      set(l.positionY, e[13]);
      set(l.positionZ, e[14]);
      set(l.forwardX, -e[8]);
      set(l.forwardY, -e[9]);
      set(l.forwardZ, -e[10]);
      set(l.upX, e[4]);
      set(l.upY, e[5]);
      set(l.upZ, e[6]);
    } else {
      l.setPosition(e[12], e[13], e[14]);
      l.setOrientation(-e[8], -e[9], -e[10], e[4], e[5], e[6]);
    }
  }

  /** Catena di uscita di un suono: volume e, se ha una posizione, panner con l'attenuazione della distanza. */
  chain(pos, gain) {
    const g = this.ctx.createGain();
    g.gain.value = gain;
    let panner = null;
    if (pos) {
      panner = this.ctx.createPanner();
      panner.panningModel = 'equalpower';
      panner.distanceModel = 'inverse';
      panner.refDistance = 0.8;
      panner.rolloffFactor = 1.2;
      panner.maxDistance = 30;
      this.place(panner, pos);
      g.connect(panner);
      panner.connect(this.master);
    } else g.connect(this.master);
    return { g, panner };
  }

  place(panner, pos) {
    if (panner.positionX) {
      const t = this.ctx.currentTime;
      panner.positionX.setTargetAtTime(pos.x, t, 0.02);
      panner.positionY.setTargetAtTime(pos.y, t, 0.02);
      panner.positionZ.setTargetAtTime(pos.z, t, 0.02);
    } else panner.setPosition(pos.x, pos.y, pos.z);
  }

  ready(name) {
    return this.ctx?.state === 'running' && this.buffers.has(name) && !this.muted && this.volume > 0;
  }

  /**
   * Colpo singolo.
   * @param {string} name nome in sound-list.js
   * @param {{x: number, y: number, z: number}|null} pos punto della stanza (null: senza posizione)
   * @param {{gain?: number, rate?: number}} [opts] volume relativo (moltiplica quello della lista) e velocità
   */
  play(name, pos = null, { gain = 1, rate = 1 } = {}) {
    if (!this.ready(name) || this.voices >= MAX_VOICES) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.get(name);
    src.playbackRate.value = rate;
    const { g } = this.chain(pos, BY_NAME[name].gain * gain);
    src.connect(g);
    this.voices++;
    src.onended = () => {
      this.voices--;
      g.disconnect();
    };
    src.start();
  }

  /**
   * Anelli attivi in questo fotogramma: [{ id, name, level (0–1), pos?, rate? }]. Quelli che mancano dall'elenco
   * sfumano e si fermano; lo stesso id continua lo stesso suono (con volume e posizione aggiornati).
   */
  loops(list) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const seen = new Set();
    if (this.ctx.state === 'running' && !this.muted) {
      for (const l of list) {
        if (!this.buffers.has(l.name)) continue;
        seen.add(l.id);
        let a = this.active.get(l.id);
        if (!a) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.buffers.get(l.name);
          src.loop = true;
          const { g, panner } = this.chain(l.pos ?? null, 0);
          src.connect(g);
          // ogni anello parte da un punto diverso: due getti insieme non suonano identici
          src.start(t, Math.random() * src.buffer.duration);
          a = { src, g, panner, name: l.name };
          this.active.set(l.id, a);
        }
        a.g.gain.setTargetAtTime(BY_NAME[l.name].gain * Math.max(0, Math.min(1.5, l.level)), t, RAMP);
        if (l.rate) a.src.playbackRate.setTargetAtTime(l.rate, t, RAMP);
        if (a.panner && l.pos) this.place(a.panner, l.pos);
      }
    }
    for (const [key, a] of this.active) {
      if (seen.has(key)) continue;
      a.g.gain.setTargetAtTime(0, t, RAMP);
      a.src.stop(t + RAMP * 5);
      a.src.onended = () => a.g.disconnect();
      this.active.delete(key);
    }
  }

  destroy() {
    this.loops([]);
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
