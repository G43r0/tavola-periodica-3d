// Vignette del libro «Come si fa», disegnate in SVG nello stile del tutorial (tutorial.js): una per ogni tipo di passo
// delle ricette (pesa, versa, scalda, accendi la lampada, apri la bombola, osserva, smaltisci…), riempita con i colori
// veri del contenuto, e una per ogni pagina scritta a mano (strumenti, tecniche, sicurezza). Modulo puro (niente
// DOM): restituisce stringhe SVG con viewBox 320 × 180.
import { DRAW, TUTORIAL_DRAWINGS } from './tutorial.js';

const { f, path, rect, circle, text, g, beaker, flask, arrow, turn, flame, key, bubbles, ghs, display, bench, bin, INK, GLASS, WATER, OK, HOT } = DRAW;
const css = (rgb, fallback = WATER) => (rgb ? `rgb(${rgb.map(Math.round).join(',')})` : fallback);
const PORCELAIN = '#f4f1ea';
const BIN_COLORS = { sink: '#8fb7c9', heavy: '#3b4048', inorganic: '#2f6fd1', organic: '#c8161d', glass: '#2f9a4c', solid: '#8a7a5c' };

// ------------------------------------------------------------------ recipienti

/** Crogiolo di porcellana con la base in (x, y), largo w; contenuto del colore dato. */
function crucible(x, y, w, h, fill) {
  const top = w;
  const bot = w * 0.62;
  const cx = x + w / 2;
  let s = '';
  if (fill) s += `<path d="M${f(cx - bot / 2 + 3)} ${f(y - 3)} L${f(cx - top * 0.42)} ${f(y - h * 0.45)} L${f(cx + top * 0.42)} ${f(y - h * 0.45)} L${f(cx + bot / 2 - 3)} ${f(y - 3)} Z" fill="${fill}"/>`;
  return s + `<path d="M${f(cx - top / 2)} ${f(y - h)} L${f(cx - bot / 2)} ${f(y)} L${f(cx + bot / 2)} ${f(y)} L${f(cx + top / 2)} ${f(y - h)}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
}

/** Capsula di porcellana (bassa e larga) con la base in (x, y). */
function dish(x, y, w, fill) {
  let s = '';
  if (fill) s += `<path d="M${f(x + 6)} ${f(y - 8)} Q${f(x + w / 2)} ${f(y + 2)} ${f(x + w - 6)} ${f(y - 8)} Z" fill="${fill}"/>`;
  return s + `<path d="M${f(x)} ${f(y - 16)} Q${f(x + w / 2)} ${f(y + 8)} ${f(x + w)} ${f(y - 16)}" fill="${PORCELAIN}" fill-opacity="0.35" stroke="${INK}" stroke-width="2.4"/>`;
}

/** Il recipiente della ricetta con il suo contenuto, base in (x, y). */
function vessel(kind, x, y, { liquid = null, solid = null, level = 0.45 } = {}) {
  if (kind === 'crucible') return crucible(x, y, 46, 40, solid ?? liquid);
  if (kind === 'dish') return dish(x - 8, y, 66, solid ?? liquid);
  const w = kind === 'beaker100' ? 40 : 50;
  const h = kind === 'beaker100' ? 46 : 58;
  let s = beaker(x, y, w, h, { level: liquid ? level : 0, color: liquid ?? WATER });
  if (solid) s += `<path d="M${f(x + 4)} ${f(y - 2)} Q${f(x + w / 2)} ${f(y - 12)} ${f(x + w - 4)} ${f(y - 2)} Z" fill="${solid}"/>`;
  return s;
}

/** Cilindro graduato con liquido, base in (x, y). */
function cylinderG(x, y, h, color) {
  return `<rect x="${f(x + 2)}" y="${f(y - h * 0.6)}" width="12" height="${f(h * 0.6 - 2)}" fill="${color}" opacity="0.85"/>`
    + path(`M${f(x)} ${f(y - h)} V${f(y)} H${f(x + 16)} V${f(y - h)}`, { fill: GLASS }) + path(`M${f(x - 6)} ${f(y)} H${f(x + 22)}`, { 'stroke-width': 3 })
    + [1, 2, 3, 4].map((k) => path(`M${f(x + 9)} ${f(y - (h * k) / 5)} h6`, { 'stroke-width': 1.2 })).join('');
}

/** Spatola con un mucchietto del colore dato sulla punta (x, y). */
const spatula = (x, y, color, len = 70) => path(`M${f(x - len)} ${f(y - len * 0.28)} L${f(x)} ${f(y)}`, { 'stroke-width': 3.4 })
  + `<ellipse cx="${f(x + 4)}" cy="${f(y + 1)}" rx="9" ry="4" fill="${color}" stroke="${INK}" stroke-width="2"/>`;

/** Becco Bunsen con treppiede e reticella; il recipiente si disegna sopra a quota y − 52. */
const bunsenStand = (x, y, flameColor = '#5a7dff') => path(`M${f(x - 30)} ${f(y)} v-46 M${f(x + 30)} ${f(y)} v-46 M${f(x - 36)} ${f(y - 48)} h72`, { 'stroke-width': 3 })
  + rect(x - 8, y - 22, 16, 22, { fill: '#5a6068' }) + flame(x, y - 24, 22, flameColor);

/** Piastra riscaldante con il livello. */
const plate = (x, y, level) => rect(x, y - 22, 90, 22, { fill: '#aeb4bb' }) + circle(x + 76, y - 11, 5, { fill: INK })
  + rect(x + 10, y - 26, 70, 5, { fill: HOT, stroke: 'none', rx: 2 }) + text(x + 30, y - 6, `${level}`, { 'font-size': 12 });

/** Onde di calore sopra (x, y). */
const heatWaves = (x, y, n = 3) => Array.from({ length: n }, (_, k) => path(`M${f(x + k * 12)} ${f(y)} q4 -8 0 -16 q-4 -8 0 -16`, { stroke: '#b9c6d2', 'stroke-width': 2 })).join('');

// ------------------------------------------------------------------ vignette dei passi

/**
 * Vignetta di un passo di ricetta.
 * @param {{kind: string, params: object}} step passo (book.js)
 * @param {{vessel: string, liquid?: number[], solid?: number[], ingredient?: number[], gas?: string, bin?: string,
 *   tags?: string[], product?: number[], words?: (w: string) => string}} look colori e parole (nella lingua scelta)
 */
export function stepFigure(step, look = {}) {
  const W = look.words ?? ((w) => w);
  const kind = look.vessel ?? 'beaker250';
  const liq = look.liquid ? css(look.liquid) : null;
  const sol = look.solid ? css(look.solid, '#e8e8e8') : null;
  const ing = css(look.ingredient, '#e8e8e8');
  const v = (x = 190, y = 160, o = {}) => vessel(kind, x, y, { liquid: liq, solid: sol, ...o });
  let s = bench();
  switch (step.kind) {
    case 'hood':
      s += path('M40 160 V40 H280 V160', { 'stroke-width': 3, fill: 'rgba(150,200,225,0.12)' }) + rect(120, 18, 80, 22, { fill: '#5a6068' })
        + turn(160, 30, 18, 1) + path('M60 120 h200', { 'stroke-dasharray': '6 5', 'stroke-width': 1.6 }) + vessel(kind, 136, 160, {});
      break;
    case 'vessel':
      s += vessel(kind, 130, 160, {}) + arrow(220, 60, 170, 104, { color: OK });
      break;
    case 'weigh':
      s += rect(140, 132, 120, 28, { fill: '#aeb4bb' }) + `<ellipse cx="200" cy="132" rx="44" ry="6" fill="#d7dbe0" stroke="${INK}" stroke-width="2"/>`
        + display(148, 138, 60, `${String(step.params.g).replace('.', ',')} g`) + vessel(kind, 178, 128, { solid: ing }) + spatula(176, 96, ing);
      break;
    case 'measure':
    case 'liquid':
    case 'aux':
      s += g(cylinderG(0, 0, 70, css(look.ingredient ?? null)), 'translate(96 96) rotate(-55)') + path('M150 52 Q170 80 190 112', { stroke: css(look.ingredient ?? null), 'stroke-width': 4 })
        + v(176, 160, { level: 0.35 });
      break;
    case 'water':
      s += rect(70, 70, 30, 60, { rx: 10, fill: '#e8f4ff' }) + path('M85 70 V56 L130 44', { 'stroke-width': 3 }) + path('M132 44 Q160 60 190 110', { stroke: WATER, 'stroke-width': 3 })
        + v(170, 160, { level: 0.4 });
      break;
    case 'catalyst':
      s += v(170, 160, { level: 0.4 }) + spatula(196, 92, ing, 60) + text(110, 60, W('catalyst'), { 'font-size': 12 });
      break;
    case 'stir':
      s += v(136, 160, { level: 0.5 }) + turn(166, 82, 30, 1) + key(240, 70, 'E');
      break;
    case 'plate':
      s += plate(110, 160, step.params.level ?? 3) + vessel(kind, 128, 134, { liquid: liq, solid: sol }) + heatWaves(138, 66);
      break;
    case 'bunsen':
    case 'flame':
      s += bunsenStand(160, 160) + vessel(kind, 138, 110, { liquid: liq, solid: sol, level: 0.35 });
      if (step.kind === 'flame') s += flame(160, 76, 26, HOT) + flame(146, 80, 16, '#ffb347');
      break;
    case 'lamp':
      s += path('M60 160 V40 L120 30', { 'stroke-width': 3 }) + `<path d="M108 24 L150 30 L136 54 Z" fill="#2f6fd1" stroke="${INK}" stroke-width="2"/>`
        + [0, 1, 2].map((k) => path(`M${148 + k * 4} ${50 + k * 6} L${180 + k * 12} ${98 + k * 2}`, { stroke: '#ffd36a', 'stroke-width': 3 })).join('') + v(170, 160);
      break;
    case 'power':
      s += rect(30, 120, 70, 40, { fill: '#3b4048' }) + display(38, 128, 54, `${step.params.volts ?? 6} V`)
        + path('M46 120 Q60 70 176 66 M84 120 Q100 90 212 66', { 'stroke-width': 1.8 }) + path('M176 60 V140 M212 60 V140', { 'stroke-width': 5, stroke: '#3a3f46' })
        + beaker(162, 160, 64, 80, { level: 0.65, color: liq ?? WATER }) + bubbles(170, 100, 10, 36, 5, 2) + bubbles(206, 100, 10, 36, 5, 2);
      break;
    case 'gas':
      s += `<rect x="40" y="40" width="34" height="120" rx="16" fill="#9aa5b1" stroke="${INK}" stroke-width="2.4"/>` + rect(48, 26, 18, 16, { fill: '#5a6068' })
        + circle(57, 22, 7, { fill: '#c8161d' }) + text(57, 110, look.gas ?? '', { 'font-size': 11 }) + path('M64 30 Q130 10 196 60 V128', { 'stroke-width': 3 })
        + v(170, 160, { level: 0.5 }) + bubbles(186, 110, 20, 30, 6, 2.2);
      break;
    case 'wait':
      s += circle(160, 86, 46, { fill: '#f6f4ee', 'stroke-width': 3 }) + path('M160 86 V54 M160 86 L184 98', { 'stroke-width': 3.4 })
        + [0, 1, 2, 3].map((k) => path(`M${f(160 + Math.cos((k * Math.PI) / 2) * 40)} ${f(86 + Math.sin((k * Math.PI) / 2) * 40)} l${f(-Math.cos((k * Math.PI) / 2) * 6)} ${f(-Math.sin((k * Math.PI) / 2) * 6)}`, { 'stroke-width': 2 })).join('');
      break;
    case 'observe': {
      const tags = look.tags ?? [];
      const out = css(look.product ?? look.liquid ?? null);
      s += vessel(kind, 150, 160, { liquid: kind.startsWith('beaker') ? out : null, solid: kind.startsWith('beaker') ? null : out, level: 0.55 });
      if (tags.includes('gas') || tags.includes('coloredGas')) s += bubbles(158, 110, 34, 40, 8, 2.4);
      if (tags.includes('coloredGas')) s += `<ellipse cx="176" cy="74" rx="34" ry="14" fill="${out}" opacity="0.55"/>`;
      if (tags.includes('precipitate') || tags.includes('deposit')) s += `<path d="M156 156 Q176 146 196 156 Z" fill="${out}"/>` + [0, 1, 2, 3].map((k) => circle(162 + k * 9, 126 + (k % 2) * 10, 1.8, { fill: out, stroke: 'none' })).join('');
      if (tags.includes('hot') || tags.includes('warm') || tags.includes('fire')) s += heatWaves(162, 92, 2);
      if (tags.includes('fire')) s += flame(176, 100, 30, HOT);
      s += `<ellipse cx="74" cy="76" rx="26" ry="15" fill="#ffffff" stroke="${INK}" stroke-width="2.4"/>` + circle(74, 76, 7, { fill: INK }) + arrow(104, 82, 140, 104, { color: OK });
      break;
    }
    case 'filter':
      s += path('M60 160 V30 M60 60 H140', { 'stroke-width': 4 }) + `<path d="M110 50 L170 50 L144 92 L144 116 L136 116 L136 92 Z" fill="${GLASS}" stroke="${INK}" stroke-width="2.4"/>`
        + `<path d="M116 54 L164 54 L140 88 Z" fill="${PORCELAIN}" stroke="#b8b1a0" stroke-width="1.4"/>` + `<path d="M128 74 L152 74 L140 88 Z" fill="${css(look.product ?? null, '#f6d21a')}"/>`
        + circle(140, 130, 2.4, { fill: WATER, stroke: 'none' }) + flask(116, 160, 48, 40, { level: 0.25 });
      break;
    case 'tongs':
      s += path('M90 40 L150 98 M98 34 L158 92 M150 98 Q164 110 156 118 M158 92 Q174 102 166 114', { 'stroke-width': 3 }) + crucible(150, 160, 46, 40, sol ?? liq)
        + text(250, 90, '> 60 °C', { 'font-size': 13, fill: HOT });
      break;
    case 'dispose': {
      const b = look.bin ?? 'inorganic';
      s += g(vessel(kind, 0, 0, { liquid: liq, solid: sol }), 'translate(96 110) rotate(-70)') + path('M150 70 Q176 90 190 112', { stroke: liq ?? WATER, 'stroke-width': 4 })
        + bin(168, 160, BIN_COLORS[b] ?? '#3b4048', W(`bin_${b}`).slice(0, 12));
      break;
    }
    default:
      s += v(150, 160);
  }
  return svg(s);
}

const svg = (inner) => `<svg class="gm-bk__svg" viewBox="0 0 320 180" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

// ------------------------------------------------------------------ vignette delle pagine scritte a mano

/** Pagine che riusano un'illustrazione del tutorial. */
const FROM_TUTORIAL = {
  balance: 'weigh', weigh: 'weigh', hotplate: 'heat', bunsen: 'heat', heat: 'heat', thermometer: 'measure', phmeter: 'measure', ph: 'measure',
  pipette: 'pipette', burette: 'burette', titrate: 'burette', filter: 'filter', still: 'distill', distill: 'distill', power: 'electro',
  electrolysis: 'electro', cylinders: 'gas', gas: 'gas', tongs: 'hot', crucible: 'hot', waste: 'safety', wash: 'water',
};

const PAGES = {
  beaker: () => bench() + beaker(60, 160, 50, 60, { level: 0.5 }) + beaker(150, 160, 70, 90, { level: 0.35, color: '#ffd36a' }) + flask(250, 160, 50, 70),
  flask: () => bench() + flask(110, 160, 90, 120, { level: 0.35, color: '#f4a6d9' }) + turn(156, 60, 40, 1),
  cylinder: () => bench() + cylinderG(70, 160, 130, WATER) + circle(220, 80, 50, { fill: '#ffffff' }) + path('M180 80 Q220 100 260 80', { stroke: '#2f6fd1', 'stroke-width': 3 })
    + path('M176 70 h20 M176 90 h14', { 'stroke-width': 1.6 }) + path('M150 80 H170', { 'stroke-dasharray': '4 3' }) + path('M86 82 L170 80', { 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }),
  meniscus: () => bench() + circle(160, 90, 62, { fill: '#ffffff' }) + `<path d="M98 90 Q160 128 222 90 L222 150 L98 150 Z" fill="${WATER}" opacity="0.7"/>`
    + path('M100 104 H220', { stroke: '#c8161d', 'stroke-width': 2, 'stroke-dasharray': '6 4' }) + `<ellipse cx="40" cy="104" rx="16" ry="9" fill="#ffffff" stroke="${INK}" stroke-width="2"/>` + circle(40, 104, 4, { fill: INK })
    + path('M58 104 H96', { 'stroke-dasharray': '4 3' }),
  washbottle: () => bench() + rect(100, 70, 50, 90, { rx: 14, fill: '#e8f4ff' }) + path('M125 70 V50 L190 36', { 'stroke-width': 3 }) + path('M192 36 Q220 60 236 100', { stroke: WATER, 'stroke-width': 3 }) + beaker(214, 160, 46, 50, { level: 0.3 }),
  dropper: () => bench() + rect(140, 20, 20, 22, { rx: 8, fill: '#c8161d', stroke: 'none' }) + path('M150 42 V110', { 'stroke-width': 4 }) + circle(150, 124, 3.2, { fill: '#f4a6d9', stroke: 'none' }) + flask(118, 160, 64, 40, { level: 0.3, color: '#f4a6d9' }),
  spatula: () => bench() + spatula(200, 100, '#3d6fd8', 120) + beaker(186, 160, 46, 50, { level: 0 }) + key(40, 120, 'E') + text(130, 150, '1 g', { 'font-size': 12 }),
  lamp: () => bench() + path('M60 160 V40 L120 30', { 'stroke-width': 3 }) + `<path d="M108 24 L150 30 L136 54 Z" fill="#2f6fd1" stroke="${INK}" stroke-width="2"/>`
    + [0, 1, 2].map((k) => path(`M${148 + k * 4} ${50 + k * 6} L${180 + k * 12} ${98 + k * 2}`, { stroke: '#ffd36a', 'stroke-width': 3 })).join('')
    + beaker(170, 160, 50, 56, { level: 0.3, color: '#e8e8e8' }) + text(260, 80, 'hν', { 'font-size': 18 }),
  loop: () => bench() + rect(140, 138, 20, 22, { fill: '#5a6068' }) + flame(150, 134, 46, '#d64ad6') + path('M40 80 L140 92', { 'stroke-width': 3 }) + circle(144, 92, 5),
  flametest: () => bench() + ['#e8243c', '#f7a823', '#c58bf0', '#e85c2a', '#4fc36a'].map((c, k) => rect(26 + k * 58, 138, 16, 22, { fill: '#5a6068' }) + flame(34 + k * 58, 134, 40, c)).join(''),
  strip: () => bench() + ['#d6141f', '#f0592a', '#f7a823', '#e3dc1e', '#3ea94b', '#1d7f95', '#3546a0'].map((c, k) => `<rect x="${40 + k * 34}" y="60" width="30" height="40" fill="${c}"/>`).join('')
    + text(160, 124, 'pH 0 → 14', { 'font-size': 13 }),
  icebath: () => bench() + rect(80, 100, 160, 60, { fill: 'rgba(150,200,225,0.45)' }) + [0, 1, 2, 3, 4].map((k) => rect(92 + k * 28, 108 + (k % 2) * 8, 16, 14, { fill: '#ffffff', rx: 2 })).join('') + beaker(136, 150, 46, 80, { level: 0.5 }),
  hood: () => bench() + path('M40 160 V40 H280 V160', { 'stroke-width': 3, fill: 'rgba(150,200,225,0.12)' }) + rect(120, 18, 80, 22, { fill: '#5a6068' }) + turn(160, 30, 18, 1)
    + `<ellipse cx="150" cy="110" rx="30" ry="14" fill="#bfe24a" opacity="0.6"/>` + arrow(150, 100, 150, 50, { color: '#7a8a2a' }),
  dissolve: () => bench() + beaker(110, 160, 70, 80, { level: 0.6 }) + spatula(150, 70, '#3d6fd8', 80) + turn(146, 110, 26, 1) + key(240, 80, 'E'),
  dilute: () => bench() + beaker(40, 160, 50, 60, { level: 0.6, color: '#4f7fe0' }) + arrow(100, 110, 140, 110) + beaker(150, 160, 70, 90, { level: 0.7, color: '#a9c4f5' })
    + text(250, 70, 'C₁V₁ = C₂V₂', { 'font-size': 14, 'font-family': 'IBM Plex Mono, monospace' }),
  crystallize: () => bench() + bunsenStand(160, 160) + dish(126, 112, 68, '#4f86e0') + [0, 1, 2].map((k) => `<path d="M${144 + k * 12} 102 l5 -9 l5 9 Z" fill="#2a5fc8"/>`).join(''),
  fire: () => bench() + rect(60, 60, 40, 100, { rx: 12, fill: '#c8161d' }) + path('M80 60 V44 L130 40', { 'stroke-width': 4 }) + path('M132 40 Q190 60 210 120', { stroke: '#e8eef2', 'stroke-width': 8 })
    + flame(220, 150, 40, HOT),
  ppe: () => path('M70 70 Q160 30 250 70 L240 100 Q200 112 160 96 Q120 112 80 100 Z', { fill: 'rgba(150,200,225,0.35)', 'stroke-width': 3 }) + path('M70 70 L40 60 M250 70 L280 60', { 'stroke-width': 3 })
    + path('M110 178 L120 128 H200 L210 178', { 'stroke-width': 3, fill: '#ffffff' }) + path('M160 128 V178', { 'stroke-width': 2 }),
  ghs: () => ['GHS01', 'GHS02', 'GHS03', 'GHS04', 'GHS05', 'GHS06', 'GHS07', 'GHS08', 'GHS09'].map((id, k) => ghs(id, 40 + (k % 5) * 60, 50 + Math.floor(k / 5) * 72, 50)).join(''),
  incompatible: () => bench() + beaker(50, 160, 50, 60, { level: 0.6, color: '#f6f9d0' }) + text(160, 100, '+', { 'font-size': 30 }) + beaker(210, 160, 50, 60, { level: 0.6, color: '#ffd9a0' })
    + path('M110 40 L210 140 M210 40 L110 140', { stroke: '#c8161d', 'stroke-width': 6 }),
  // pila Daniell: zinco nel solfato di zinco, rame nel solfato di rame, il ponte salino e il voltmetro (fase G8)
  cell: () => bench() + beaker(50, 160, 70, 80, { level: 0.6, color: '#e8eef2' }) + beaker(200, 160, 70, 80, { level: 0.6, color: '#4f86e0' })
    + rect(78, 70, 10, 80, { fill: '#9aa0a8' }) + rect(228, 70, 10, 80, { fill: '#c8743a' }) + text(83, 64, 'Zn', { 'font-size': 11 }) + text(233, 64, 'Cu', { 'font-size': 11 })
    + path('M104 130 V96 H216 V130', { stroke: '#e8e6df', 'stroke-width': 9 }) + path('M104 130 V96 H216 V130', { 'stroke-width': 1.4 })
    + rect(120, 22, 80, 34, { fill: '#d9a21b' }) + display(128, 27, 64, '1.10 V') + path('M120 40 H83 V70', { stroke: INK, 'stroke-width': 2 }) + path('M200 40 H233 V70', { stroke: '#c8161d', 'stroke-width': 2 }),
  // contatore del gas: i litri di metano bruciati dal Bunsen mentre l'acqua si scalda
  gasmeter: () => bench() + bunsenStand(150, 160) + beaker(126, 110, 48, 56, { level: 0.6 }) + path('M150 52 V112', { stroke: '#c8161d', 'stroke-width': 3 })
    + rect(230, 120, 60, 40, { fill: '#8a9099' }) + display(234, 126, 52, '1.47 L') + path('M230 156 H160', { stroke: '#c8161d', 'stroke-width': 4 }),
  incidents: () => bench() + path('M60 160 V40 H120', { 'stroke-width': 4 }) + circle(120, 52, 14, { fill: '#2f9a4c' }) + [0, 1, 2, 3].map((k) => path(`M${112 + k * 6} 68 l-6 ${30 + k * 4}`, { stroke: WATER, 'stroke-width': 2.4 })).join('')
    + rect(200, 70, 40, 90, { rx: 12, fill: '#c8161d' }) + text(220, 60, 'CO₂', { 'font-size': 12 }),
};

/**
 * Vignetta di una pagina scritta a mano (book-pages.js).
 * @param {string} fig id della vignetta
 * @param {(w: string) => string} [words] parole delle illustrazioni del tutorial nella lingua scelta
 */
export function pageFigure(fig, words = (w) => w) {
  const tut = FROM_TUTORIAL[fig];
  if (tut) return svg(TUTORIAL_DRAWINGS[tut](words));
  const draw = PAGES[fig];
  return draw ? svg(draw()) : '';
}

/** Vignette disponibili per le pagine (per i test). */
export const PAGE_FIGURES = [...Object.keys(FROM_TUTORIAL), ...Object.keys(PAGES)];
