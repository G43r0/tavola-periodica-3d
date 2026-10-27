// Qualità adattiva del simulatore (modulo puro, testato): si misura la media degli fps su finestre di 2 secondi di gioco
// e, se resta sotto la soglia del preset per due finestre di fila, si fa il passo successivo della lista. I primi
// 3 secondi non contano (si compilano gli shader e si caricano i suoni).

/** Passi di riduzione per preset, dal più costoso al meno. */
export const GAME_ADAPT = {
  pro: ['supersample', 'ao', 'shadows', 'dpr1'],
  medium: ['dpr1', 'dpr075'],
  simple: ['dpr075'],
};

const WINDOW = 2; // s di gioco per una misura
const WARMUP = 3; // s iniziali ignorati
const STRIKES = 2; // finestre lente di fila prima di scendere

export class QualityMeter {
  /** @param {string[]} steps @param {number} minFps */
  constructor(steps, minFps) {
    this.steps = steps;
    this.minFps = minFps;
    this.level = 0; // passi già fatti
    this.t = 0;
    this.frames = 0;
    this.acc = 0;
    this.strikes = 0;
    this.fps = null; // ultima misura
  }

  /** Passi fatti finora. */
  done() {
    return this.steps.slice(0, this.level);
  }

  /**
   * Un fotogramma di dt secondi. Restituisce il nome del passo appena fatto, o null.
   * @param {number} dt
   */
  push(dt) {
    if (!(dt > 0)) return null;
    this.t += dt;
    if (this.t < WARMUP) return null;
    this.frames++;
    this.acc += dt;
    if (this.acc < WINDOW) return null;
    this.fps = this.frames / this.acc;
    this.frames = 0;
    this.acc = 0;
    this.strikes = this.fps < this.minFps ? this.strikes + 1 : 0;
    if (this.strikes < STRIKES || this.level >= this.steps.length) return null;
    this.strikes = 0;
    return this.steps[this.level++];
  }
}
