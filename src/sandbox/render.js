// Disegno della sandbox: dalla griglia del motore ai pixel (una cella = un pixel, poi ingrandito dal canvas).
// Colori realistici delle sostanze, incandescenza dei corpi caldi (dal punto di Draper, 525 °C), fiamme colorate,
// scintille, scarica nei gas e vista termica. Riempie due buffer: colore e bagliore (per l'effetto glow).
import { SOLID, LIQUID, GAS, S, WOOD, CONCRETE, WALL, GENERATOR, SOURCE, DRAIN, SALT, OXIDE, SOLUTION, variantColor } from './substances.js';
import { C_BURN, C_DISSOLVED, C_POWDER, SPARK_ACTIVE, NEUTRON } from './world.js';

// classi di trama per il disegno dettagliato (preset Professionale)
const T_EMPTY = 0;
const T_GAS = 1;
const T_LIQUID = 2;
const T_POWDER = 3;
const T_METAL = 4;
const T_SOLID = 5;
const T_FLAT = 6; // fuoco, vista termica, celle speciali: senza trama
const T_WOOD = 7;
const T_STONE = 8;

const BG = [6, 9, 14];
const DRAPER = 798; // K: sotto questa temperatura un corpo caldo non emette luce visibile
// [Z, colore dello ione in acqua, colore dello ione (II) se diverso]
const ION_COLOR = [
  [29, [30, 120, 240]], // Cu²⁺ azzurro
  [28, [60, 180, 90]], // Ni²⁺ verde
  [27, [225, 90, 140]], // Co²⁺ rosa
  [24, [70, 130, 80]], // Cr³⁺ verde scuro
  [26, [205, 150, 40], [150, 200, 140]], // Fe³⁺ giallo-bruno, Fe²⁺ verde pallido
];

/** Colore di un corpo nero alla temperatura T (approssimazione di Tanner Helland). */
export function blackbody(T) {
  const t = Math.max(T, 600) / 100;
  let r;
  let g;
  let b;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * (t - 60) ** -0.1332047592;
    g = 288.1221695283 * (t - 60) ** -0.0755148492;
    b = 255;
  }
  const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return [c(r), c(g), c(b)];
}

const HEAT_STOPS = [
  [0, [26, 11, 94]],
  [0.18, [32, 80, 255]],
  [0.35, [24, 196, 154]],
  [0.5, [216, 224, 64]],
  [0.65, [255, 138, 32]],
  [0.82, [255, 42, 58]],
  [1, [255, 255, 255]],
];

/** Posizione (0–1) di una temperatura sulla scala della vista termica: lineare fino a 22 °C, poi logaritmica. */
export function heatScale(T) {
  if (T <= 295) return 0.35 * Math.max(0, T) / 295;
  return Math.min(1, 0.35 + (0.65 * Math.log(T / 295)) / Math.log(10000 / 295));
}

function heatColor(t) {
  for (let k = 1; k < HEAT_STOPS.length; k++) {
    const [p1, c1] = HEAT_STOPS[k];
    const [p0, c0] = HEAT_STOPS[k - 1];
    if (t <= p1) {
      const u = (t - p0) / (p1 - p0);
      return c0.map((v, n) => Math.round(v + (c1[n] - v) * u));
    }
  }
  return [255, 255, 255];
}

export function createRenderer(world, subs) {
  // colori di base per sostanza e stato: rgba (alfa 0–255)
  const COUNT = subs.list.length;
  const base = new Uint8Array(COUNT * 16);
  const flags = subs.P.flags;
  for (const s of subs.list) {
    if (!s || !s.colors) continue;
    for (const ph of [SOLID, LIQUID, GAS]) {
      const c = s.colors[ph];
      if (!c) continue;
      const o = s.id * 16 + ph * 4;
      base[o] = c[0];
      base[o + 1] = c[1];
      base[o + 2] = c[2];
      base[o + 3] = Math.round(c[3] * 255);
    }
  }
  // colore delle soluzioni: acqua tinta dal soluto (KMnO₄ viola, K₂Cr₂O₇ arancio; i sali bianchi la lasciano limpida);
  // gli ioni dei metalli di transizione hanno un colore loro, diverso da quello del sale anidro (CuSO₄ bianco → azzurro)
  const dissolved = new Uint8Array(COUNT * 3);
  for (const s of subs.list) {
    if (!s?.colors?.[SOLID]) continue;
    const ion = s.counts && !/cromato|permanganato/i.test(s.name) && ION_COLOR.find(([z]) => s.counts[z]);
    const c = ion ? (ion[2] && /\(II\)/.test(s.name) ? ion[2] : ion[1]) : s.colors[SOLID];
    const white = c[0] > 225 && c[1] > 225 && c[2] > 220;
    const u = ion ? 0.6 : white ? 0.12 : 0.45;
    dissolved.set([40 + (c[0] - 40) * u, 120 + (c[1] - 120) * u, 220 + (c[2] - 220) * u].map(Math.round), s.id * 3);
  }
  const tint = new Uint8Array(COUNT * 4); // colore della fiamma e della scarica per elemento
  const discharge = new Uint8Array(COUNT * 4);
  for (const s of subs.list) {
    if (s?.flameColor) tint.set([...s.flameColor, 1], s.id * 4);
    if (s?.discharge) discharge.set([...s.discharge, 1], s.id * 4);
  }
  // tabelle per temperatura (passo di 40 K)
  const LUT = 256;
  const bb = new Uint8Array(LUT * 3);
  for (let k = 0; k < LUT; k++) bb.set(blackbody(k * 40), k * 3);
  const HEAT_N = 512;
  const heatLut = new Uint8Array(HEAT_N * 3);
  for (let k = 0; k < HEAT_N; k++) heatLut.set(heatColor(k / (HEAT_N - 1)), k * 3);
  const variants = new Map();
  const variant = (id, ctype) => {
    const key = id * 65536 + ctype;
    let c = variants.get(key);
    if (!c) {
      c = variantColor(subs, id, ctype) ?? [200, 200, 200];
      variants.set(key, c);
    }
    return c;
  };

  const { mp, bp } = subs.P;

  /**
   * @param {Uint32Array} out pixel ABGR (W×H)
   * @param {Uint32Array} glow pixel ABGR del bagliore (W×H)
   * @param {{heatView?:boolean, frame?:number, cls?:Uint8Array}} opts cls: se c'è, riceve la classe di trama di ogni cella
   * @returns {number} celle occupate
   */
  function draw(out, glow, { heatView = false, frame = 0, cls = null } = {}) {
    const { W, N, type, temp, flags: cf, seed, spark, ctype, life, vx } = world;
    const bgPix = (255 << 24) | (BG[2] << 16) | (BG[1] << 8) | BG[0];
    let count = 0;
    for (let i = 0; i < N; i++) {
      const id = type[i];
      if (!id) {
        out[i] = bgPix;
        glow[i] = 0;
        if (cls) cls[i] = T_EMPTY;
        continue;
      }
      count++;
      const T = temp[i];
      const sf = flags[id];
      let r;
      let g;
      let b;
      let a;
      let gr = 0;
      let gg = 0;
      let gb = 0;
      let ga = 0;

      if (heatView) {
        const k = Math.min(HEAT_N - 1, Math.round(heatScale(T) * (HEAT_N - 1))) * 3;
        r = heatLut[k];
        g = heatLut[k + 1];
        b = heatLut[k + 2];
        a = sf & S.FIRE || T >= bp[id] ? 0.75 : 1;
        if (cls) cls[i] = T_FLAT;
      } else if (sf & S.FIRE) {
        const k = Math.min(LUT - 1, Math.round((T * 1.15) / 40)) * 3;
        r = bb[k];
        g = bb[k + 1];
        b = bb[k + 2];
        const tz = ctype[i];
        if (tz && tint[tz * 4 + 3]) {
          const o = tz * 4;
          r = (r * 0.2 + tint[o] * 0.8) | 0;
          g = (g * 0.2 + tint[o + 1] * 0.8) | 0;
          b = (b * 0.2 + tint[o + 2] * 0.8) | 0;
        }
        a = Math.min(1, 0.35 + life[i] / 18);
        gr = r;
        gg = g;
        gb = b;
        ga = 200 * a;
        if (cls) cls[i] = T_FLAT;
      } else {
        const isDissolved = cf[i] & C_DISSOLVED;
        const ph = isDissolved ? (T < 271.15 ? SOLID : LIQUID) : T < mp[id] ? SOLID : T < bp[id] ? LIQUID : GAS;
        if (cls) {
          cls[i] =
            ph === GAS ? T_GAS
            : ph === LIQUID ? T_LIQUID
            : id === WOOD ? T_WOOD
            : id === CONCRETE || id === WALL ? T_STONE
            : id === GENERATOR || id === SOURCE || id === DRAIN ? T_FLAT
            : cf[i] & C_POWDER ? T_POWDER
            : sf & S.METAL ? T_METAL
            : T_SOLID;
        }
        const o = id * 16 + ph * 4;
        if (isDissolved) {
          const d = id * 3;
          r = dissolved[d];
          g = dissolved[d + 1];
          b = dissolved[d + 2];
        } else if (id === SALT || id === OXIDE || id === SOLUTION) {
          const c = variant(id, ctype[i]);
          r = c[0];
          g = c[1];
          b = c[2];
        } else {
          r = base[o];
          g = base[o + 1];
          b = base[o + 2];
        }
        a = isDissolved ? 0.88 : base[o + 3] / 255;
        const x = i % W;
        const y = (i / W) | 0;
        // trama: grana del legno, ghiaia del calcestruzzo, muro tratteggiato, variazioni delle polveri
        let shade;
        if (id === WOOD) shade = 0.82 + ((y * 7 + ((x >> 2) * 3)) % 5) * 0.04 + seed[i] / 2550;
        else if (id === CONCRETE) shade = seed[i] > 236 ? 0.72 : seed[i] < 18 ? 1.12 : 0.95 + seed[i] / 2550;
        else if (id === WALL) shade = (x + y) % 4 === 0 ? 1.25 : 1;
        else if (id === GENERATOR) shade = ((x >> 1) + (y >> 1)) & 1 ? 1 : 0.55;
        else if (id === DRAIN) shade = ((x + y) & 3) === 0 ? 1.5 : ((x ^ y) & 2 ? 0.45 : 0.8);
        else if (id === SOURCE) {
          // scacchiera: il colore della sorgente e quello della sostanza che clona
          shade = 1;
          const mem = ctype[i];
          if (mem && ((x >> 1) + (y >> 1)) & 1) {
            const mt = vx[i]; // temperatura ricordata
            const mo = mem * 16 + (mt < mp[mem] ? SOLID : mt < bp[mem] ? LIQUID : GAS) * 4;
            r = base[mo];
            g = base[mo + 1];
            b = base[mo + 2];
          }
        }
        else if (ph === SOLID) shade = cf[i] & 1 ? 0.86 + seed[i] / 920 : 0.95 + seed[i] / 2550;
        else if (ph === LIQUID) shade = 0.95 + seed[i] / 2550;
        else shade = 1;
        r = Math.min(255, r * shade);
        g = Math.min(255, g * shade);
        b = Math.min(255, b * shade);

        // gas caldissimi (esplosioni): un bagliore tenue che si spegne raffreddandosi
        if (T > 1200 && ph === GAS) {
          const k = Math.min(LUT - 1, Math.round(T / 40)) * 3;
          const u = Math.min(0.75, (T - 1200) / 2400);
          r += (bb[k] - r) * u;
          g += (bb[k + 1] - g) * u;
          b += (bb[k + 2] - b) * u;
          a = Math.max(a, u);
          gr = bb[k];
          gg = bb[k + 1];
          gb = bb[k + 2];
          ga = 110 * u;
        }
        // incandescenza
        if (T > DRAPER && ph !== GAS) {
          const k = Math.min(LUT - 1, Math.round(T / 40)) * 3;
          const u = Math.min(1, (T - DRAPER) / 1300);
          r += (bb[k] - r) * u;
          g += (bb[k + 1] - g) * u;
          b += (bb[k + 2] - b) * u;
          gr = bb[k];
          gg = bb[k + 1];
          gb = bb[k + 2];
          ga = 150 * u;
          a = Math.max(a, u);
        }
        // in fiamme: brace che tremola
        if (cf[i] & C_BURN) {
          const flick = ((seed[i] + frame * 7) & 15) / 15;
          r += (255 - r) * 0.6;
          g += (100 + flick * 70 - g) * 0.6;
          b += (20 - b) * 0.6;
          gr = 255;
          gg = 120 + flick * 60;
          gb = 30;
          ga = Math.max(ga, 120 + flick * 60);
        }
        // elettricità
        const sp = spark[i];
        if (sp >= SPARK_ACTIVE && sp <= 11) {
          if (sf & S.DISCHARGE && ph === GAS) {
            const d = id * 4;
            r = discharge[d];
            g = discharge[d + 1];
            b = discharge[d + 2];
            a = 0.85;
            gr = r;
            gg = g;
            gb = b;
            ga = 230;
          } else {
            r = 255;
            g = 244;
            b = 160;
            a = 1;
            gr = 255;
            gg = 236;
            gb = 140;
            ga = 220;
          }
        } else if (id === GENERATOR && sp) {
          ga = 90;
          gr = 255;
          gg = 220;
          gb = 80;
        }
      }
      if (a < 1) {
        r = BG[0] + (r - BG[0]) * a;
        g = BG[1] + (g - BG[1]) * a;
        b = BG[2] + (b - BG[2]) * a;
      }
      out[i] = (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
      glow[i] = ga ? ((ga & 255) << 24) | ((gb & 255) << 16) | ((gg & 255) << 8) | (gr & 255) : 0;
    }
    // particelle libere (neutroni, radiazione)
    for (const p of world.particles) {
      const x = Math.floor(p.x);
      const y = Math.floor(p.y);
      if (x < 0 || y < 0 || x >= W || y >= world.H) continue;
      const i = y * W + x;
      const c = p.kind === NEUTRON ? (p.slow ? [150, 190, 255] : [215, 235, 255]) : [180, 255, 120];
      out[i] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
      glow[i] = (230 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
    }
    return count;
  }

  /**
   * Disegno dettagliato (preset Professionale): ogni cella diventa un blocco di k×k pixel con la trama
   * del suo materiale (grana delle polveri, spazzolatura dei metalli, venature del legno, inerti del
   * calcestruzzo), i liquidi più scuri in profondità e lucidi in superficie, e un rilievo dove la
   * materia confina con l'aria (luce dall'alto a sinistra).
   * @param {Uint32Array} src colori delle celle (da draw)
   * @param {Uint8Array} cls classi di trama (da draw)
   * @param {Uint32Array} out pixel (W·k × H·k)
   */
  const liquidDepth = new Uint16Array(4096);
  function drawDetail(src, cls, out, k, frame) {
    const { W, H, seed } = world;
    const OW = W * k;
    const open = (c) => c <= T_GAS; // aria o gas: lì la superficie prende luce
    liquidDepth.fill(0, 0, W);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const c = cls[i];
        const p = src[i];
        const o = y * k * OW + x * k;
        if (c === T_LIQUID) liquidDepth[x]++;
        else liquidDepth[x] = 0;
        if (c === T_EMPTY || c === T_GAS || c === T_FLAT) {
          for (let sy = 0; sy < k; sy++) out.fill(p, o + sy * OW, o + sy * OW + k);
          continue;
        }
        const r0 = p & 255;
        const g0 = (p >> 8) & 255;
        const b0 = (p >> 16) & 255;
        const up = y > 0 && open(cls[i - W]);
        const down = y < H - 1 && open(cls[i + W]);
        const left = x > 0 && open(cls[i - 1]);
        const right = x < W - 1 && open(cls[i + 1]);
        const sd = seed[i];
        const depth = liquidDepth[x];
        for (let sy = 0; sy < k; sy++) {
          const Y = y * k + sy;
          for (let sx = 0; sx < k; sx++) {
            const X = x * k + sx;
            let s;
            let shine = 0;
            if (c === T_LIQUID) {
              // più scuro in profondità, leggere increspature che si muovono
              s = 1 - Math.min(0.3, depth * 0.011) + 0.022 * Math.sin(X * 0.47 + Y * 0.21 + frame * 0.11) + 0.018 * Math.sin(X * 0.19 - Y * 0.53 - frame * 0.07);
              if (up && sy === 0) shine = 0.45;
            } else if (c === T_POWDER) {
              // granelli: ogni granello porta con sé la sua trama (dipende dal seme della cella)
              const h = hash(sx + sd * 7, sy + sd * 3);
              s = h < 0.12 ? 0.62 : 0.8 + 0.38 * h;
            } else if (c === T_METAL) {
              // spazzolato: striature orizzontali continue tra le celle
              s = 0.9 + 0.16 * hash(Y, X >> 3) + 0.05 * hash(Y, X);
            } else if (c === T_WOOD) {
              s = 0.86 + 0.14 * Math.sin(Y * 1.1 + 3 * hash(X >> 4, Y >> 3)) + 0.05 * hash(X, Y);
            } else if (c === T_STONE) {
              const h = hash(X, Y);
              s = h > 0.93 ? 1.18 : h < 0.07 ? 0.7 : 0.88 + 0.2 * hash(X >> 1, Y >> 1);
            } else {
              // solido cristallino: riflessi sparsi
              const h = hash(X + sd, Y);
              s = h > 0.965 ? 1.32 : 0.92 + 0.14 * h;
            }
            // rilievo: bordi illuminati in alto e a sinistra, in ombra in basso e a destra
            if (up && sy === 0) s *= 1.22;
            else if (down && sy === k - 1) s *= 0.7;
            if (left && sx === 0) s *= 1.1;
            else if (right && sx === k - 1) s *= 0.84;
            let r = r0 * s;
            let g = g0 * s;
            let b = b0 * s;
            if (shine) {
              r += (255 - r) * shine;
              g += (255 - g) * shine;
              b += (255 - b) * shine;
            }
            out[o + sy * OW + sx] = (255 << 24) | ((b > 255 ? 255 : b) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r);
          }
        }
      }
    }
  }

  return { draw, drawDetail };
}

/** Numero pseudo-casuale stabile in [0, 1) per una coppia di interi (trame che non tremolano). */
function hash(x, y) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
