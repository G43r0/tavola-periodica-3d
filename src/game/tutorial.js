// Tutorial del quaderno di laboratorio: una pagina per ogni cosa da saper fare (muoversi, prendere e girare gli oggetti,
// versare, pesare, scaldare, misurare, gli strumenti, le reazioni, la sicurezza), con un'illustrazione stilizzata
// disegnata qui in SVG (nessuna immagine scaricata) e i passi in game-strings.js (tut_<id>_title, tut_<id>_steps).
// Lo stesso stile serve alle vignette del libro «Come si fa» (book-figures.js). Modulo puro (niente DOM): restituisce
// stringhe SVG.
import { GHS } from './ghs.js';

const INK = '#1d2733';
const GLASS = 'rgba(150,200,225,0.22)';
const WATER = '#8fd0ff';
const OK = '#2f9a4c';
const HOT = '#ec7a33';

// ------------------------------------------------------------------ elementi di disegno

const f = (n) => Math.round(n * 10) / 10;
const attrs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${k}="${v}"`).join(' ');
const path = (d, o = {}) => `<path ${attrs({ d, fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...o })}/>`;
const rect = (x, y, w, h, o = {}) => `<rect ${attrs({ x: f(x), y: f(y), width: f(w), height: f(h), rx: 3, fill: 'none', stroke: INK, 'stroke-width': 2.4, ...o })}/>`;
const circle = (x, y, r, o = {}) => `<circle ${attrs({ cx: f(x), cy: f(y), r: f(r), fill: 'none', stroke: INK, 'stroke-width': 2, ...o })}/>`;
const text = (x, y, s, o = {}) => `<text ${attrs({ x: f(x), y: f(y), 'font-size': 13, 'font-family': 'IBM Plex Sans, sans-serif', 'font-weight': 600, fill: INK, 'text-anchor': 'middle', ...o })}>${s}</text>`;
const g = (inner, transform) => `<g transform="${transform}">${inner}</g>`;

/** Becher: angolo in basso a sinistra (x, y), larghezza w, altezza h; liquido fino a `level` (0–1) del colore dato. */
function beaker(x, y, w, h, { level = 0.5, color = WATER, grad = true } = {}) {
  const lh = h * level;
  let s = lh > 3 ? `<rect x="${f(x + 2)}" y="${f(y - lh)}" width="${f(w - 4)}" height="${f(lh - 2)}" fill="${color}" opacity="0.85"/>` : '';
  s += path(`M${f(x - 4)} ${f(y - h)} L${f(x)} ${f(y - h + 5)} L${f(x)} ${f(y)} L${f(x + w)} ${f(y)} L${f(x + w)} ${f(y - h)}`, { fill: GLASS });
  if (grad) for (let k = 1; k <= 3; k++) s += path(`M${f(x + w - 9)} ${f(y - (h * k) / 4)} h6`, { 'stroke-width': 1.4 });
  return s;
}

/** Beuta (matraccio di Erlenmeyer): base larga a (x, y), larga w. */
function flask(x, y, w, h, { level = 0.35, color = WATER } = {}) {
  const neck = w * 0.26;
  const cx = x + w / 2;
  const lh = h * level;
  const k = lh / (h * 0.7);
  const lw = w - (w - neck) * Math.min(1, k);
  let s = `<path d="M${f(x + 2)} ${f(y - 2)} L${f(cx - lw / 2 + 1)} ${f(y - lh)} L${f(cx + lw / 2 - 1)} ${f(y - lh)} L${f(x + w - 2)} ${f(y - 2)} Z" fill="${color}" opacity="0.85"/>`;
  s += path(`M${f(cx - neck / 2)} ${f(y - h)} L${f(cx - neck / 2)} ${f(y - h * 0.7)} L${f(x)} ${f(y)} L${f(x + w)} ${f(y)} L${f(cx + neck / 2)} ${f(y - h * 0.7)} L${f(cx + neck / 2)} ${f(y - h)}`, { fill: GLASS });
  return s;
}

/** Freccia da (x1, y1) a (x2, y2), con la punta. */
function arrow(x1, y1, x2, y2, { color = INK, w = 2.4 } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p = (d, da) => `${f(x2 - Math.cos(a + da) * d)} ${f(y2 - Math.sin(a + da) * d)}`;
  return path(`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, { stroke: color, 'stroke-width': w }) + `<path d="M${f(x2)} ${f(y2)} L${p(9, 0.45)} L${p(9, -0.45)} Z" fill="${color}"/>`;
}

/** Freccia curva (rotazione), centrata in (x, y) con raggio r; dir 1 antioraria, −1 oraria. */
function turn(x, y, r, dir = 1, color = OK) {
  const a0 = dir > 0 ? 0.3 : Math.PI - 0.3;
  const a1 = dir > 0 ? Math.PI - 0.3 : 0.3;
  const p = (a) => [x + Math.cos(a) * r, y - Math.sin(a) * r * 0.45];
  const [sx, sy] = p(a0);
  const [ex, ey] = p(a1);
  const [bx, by] = p(a1 + (dir > 0 ? -0.35 : 0.35));
  return path(`M${f(sx)} ${f(sy)} Q${f(x)} ${f(y - r * 0.95)} ${f(ex)} ${f(ey)}`, { stroke: color }) + arrow(bx, by, ex, ey, { color });
}

/** Fiamma alta s con la base in (x, y). */
const flame = (x, y, s, color = HOT) =>
  `<path d="M${f(x)} ${f(y - s)} C${f(x + s * 0.55)} ${f(y - s * 0.45)} ${f(x + s * 0.4)} ${f(y)} ${f(x)} ${f(y)} C${f(x - s * 0.4)} ${f(y)} ${f(x - s * 0.55)} ${f(y - s * 0.45)} ${f(x)} ${f(y - s)} Z" fill="${color}"/>`
  + `<path d="M${f(x)} ${f(y - s * 0.55)} C${f(x + s * 0.25)} ${f(y - s * 0.25)} ${f(x + s * 0.18)} ${f(y)} ${f(x)} ${f(y)} C${f(x - s * 0.18)} ${f(y)} ${f(x - s * 0.25)} ${f(y - s * 0.25)} ${f(x)} ${f(y - s * 0.55)} Z" fill="#ffd36a"/>`;

/** Tasto della tastiera con la scritta. */
const key = (x, y, label, w = 26) => rect(x, y, w, 24, { fill: '#f6f4ee', rx: 5 }) + text(x + w / 2, y + 17, label, { 'font-size': label.length > 3 ? 10 : 13 });

/** Mouse con il tasto sinistro (l), destro (r) o la rotella (w) colorato. */
function mouse(x, y, part = '') {
  let s = rect(x, y, 30, 44, { rx: 15, fill: '#f6f4ee' }) + path(`M${x} ${y + 18} h30 M${x + 15} ${y} v18`, { 'stroke-width': 1.8 });
  if (part === 'l') s += `<path d="M${x + 14} ${y + 1.5} A14 14 0 0 0 ${x + 1.5} ${y + 15} V${y + 17} H${x + 14} Z" fill="${OK}"/>`;
  if (part === 'r') s += `<path d="M${x + 16} ${y + 1.5} A14 14 0 0 1 ${x + 28.5} ${y + 15} V${y + 17} H${x + 16} Z" fill="${OK}"/>`;
  if (part === 'w') s += rect(x + 12, y + 4, 6, 11, { rx: 3, fill: OK, stroke: 'none' });
  return s;
}

/** Bolle (deterministiche) in un rettangolo. */
function bubbles(x, y, w, h, n = 7, r = 2.6) {
  let s = '';
  for (let k = 0; k < n; k++) s += circle(x + ((k * 37) % 97) / 97 * w, y + ((k * 61) % 89) / 89 * h, r * (0.7 + (k % 3) * 0.25), { 'stroke-width': 1.4, fill: '#ffffff' });
  return s;
}

/** Pittogramma GHS (rombo bordato di rosso con il simbolo), centro (x, y), lato del quadrato inscritto s. */
function ghs(id, x, y, s) {
  const h = s / 2;
  let out = `<path d="M${f(x)} ${f(y - h)} L${f(x + h)} ${f(y)} L${f(x)} ${f(y + h)} L${f(x - h)} ${f(y)} Z" fill="#ffffff" stroke="#e30613" stroke-width="${f(s * 0.07)}"/>`;
  const k = (s * 0.74) / 100;
  let inner = '';
  for (const p of GHS[id].parts) {
    const c = p.white ? '#ffffff' : '#111111';
    if (p.fill) inner += `<path d="${p.fill}" fill="${c}"/>`;
    if (p.stroke) inner += `<path d="${p.d}" fill="none" stroke="${c}" stroke-width="${p.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  out += g(inner, `translate(${f(x - 50 * k)} ${f(y - 50 * k)}) scale(${f(k * 1000) / 1000})`);
  return out;
}

/** Display digitale (sfondo scuro, cifre chiare). */
const display = (x, y, w, s) => rect(x, y, w, 24, { fill: '#18202a', rx: 4 }) + text(x + w / 2, y + 17, s, { fill: '#9fe6ff', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 13 });

/** Piano del bancone. */
const bench = (y = 160) => `<rect x="10" y="${y}" width="300" height="10" rx="3" fill="#2c323b"/>`;

/** Bidone dei rifiuti colorato con l'etichetta. */
const bin = (x, y, color, label) => rect(x, y - 44, 40, 44, { fill: color, rx: 4 }) + rect(x - 3, y - 50, 46, 7, { fill: color, rx: 2 }) + text(x + 20, y - 18, label, { 'font-size': 9, fill: '#ffffff' });

// ------------------------------------------------------------------ illustrazioni

const ILLUSTRATIONS = {
  move: (L) => key(46, 34, 'W') + key(18, 62, 'A') + key(46, 62, 'S') + key(74, 62, 'D') + key(28, 100, L('space'), 70)
    + mouse(126, 40) + arrow(160, 62, 182, 62) + `<ellipse cx="141" cy="118" rx="15" ry="8" fill="#ffffff" stroke="${INK}" stroke-width="2"/>` + circle(141, 118, 4, { fill: INK })
    + key(214, 30, 'Tab', 40) + arrow(234, 60, 234, 84) + `<rect x="196" y="140" width="112" height="9" rx="3" fill="#2c323b"/>`
    + beaker(212, 139, 24, 30, { level: 0.4 }) + flask(254, 139, 30, 38),
  hold: (L) => bench() + beaker(70, 110, 46, 58, { level: 0.45 }) + path('M93 44 v-14', { 'stroke-dasharray': '4 4' }) + arrow(93, 42, 93, 34)
    + `<rect x="64" y="122" width="58" height="38" rx="4" fill="${OK}" opacity="0.25" stroke="${OK}" stroke-width="2" stroke-dasharray="5 4"/>`
    + arrow(93, 114, 93, 130, { color: OK }) + mouse(150, 40, 'l') + text(165, 104, L('place'), { 'font-size': 11 })
    + key(212, 50, 'A') + key(246, 50, 'D') + turn(250, 116, 30, 1),
  pour: () => bench() + beaker(186, 160, 52, 56, { level: 0.25 })
    + g(beaker(0, 0, 44, 54, { level: 0.6 }), 'translate(150 92) rotate(-58)')
    + path('M176 62 Q184 92 204 130', { stroke: WATER, 'stroke-width': 5 })
    + `<ellipse cx="212" cy="104" rx="20" ry="5" fill="none" stroke="${OK}" stroke-width="2.4"/>`
    + mouse(36, 60, 'l') + arrow(51, 54, 51, 30, { color: OK }) + text(52, 126, '↕', { 'font-size': 16 }),
  weigh: (L) => bench() + rect(150, 132, 120, 28, { fill: '#aeb4bb' }) + `<ellipse cx="210" cy="132" rx="44" ry="6" fill="#d7dbe0" stroke="${INK}" stroke-width="2"/>`
    + display(158, 138, 60, L('mass')) + rect(226, 140, 34, 14, { rx: 4, fill: '#f6f4ee' }) + text(243, 151, L('tare'), { 'font-size': 8 })
    + beaker(190, 128, 40, 34, { level: 0.15, color: '#f2f2f2' })
    + path('M60 70 L140 92', { 'stroke-width': 3.4 }) + `<ellipse cx="144" cy="94" rx="9" ry="4" fill="#f2f2f2" stroke="${INK}" stroke-width="2"/>`
    + key(40, 110, 'E') + text(54, 152, L('spoon'), { 'font-size': 10 }),
  water: (L) => bench() + path('M70 160 V40 Q70 26 84 26 H128 Q140 26 140 40 V52', { 'stroke-width': 6 }) + rect(62, 74, 16, 10, { fill: '#c8161d', stroke: 'none' })
    + path('M140 56 V120', { stroke: WATER, 'stroke-width': 6 }) + beaker(118, 160, 44, 48, { level: 0.5 })
    + mouse(200, 40, 'l') + text(215, 104, L('water'), { 'font-size': 11 }) + key(250, 52, 'E') + text(263, 104, L('wash'), { 'font-size': 11 }),
  heat: () => bench() + rect(40, 138, 90, 22, { fill: '#aeb4bb' }) + circle(116, 149, 5, { fill: INK })
    + rect(50, 134, 70, 5, { fill: HOT, stroke: 'none', rx: 2 }) + beaker(62, 132, 46, 52, { level: 0.5 })
    + path('M74 70 q4 -8 0 -16 q-4 -8 0 -16 M86 70 q4 -8 0 -16 q-4 -8 0 -16 M98 70 q4 -8 0 -16 q-4 -8 0 -16', { stroke: '#b9c6d2', 'stroke-width': 2 })
    + path('M200 160 v-40 M256 160 v-40 M194 118 h68', { 'stroke-width': 3 }) + rect(220, 140, 16, 20, { fill: '#5a6068' }) + flame(228, 136, 30, '#5a7dff')
    + beaker(206, 116, 44, 44, { level: 0.45 }),
  measure: (L) => bench() + beaker(40, 160, 54, 70, { level: 0.6, color: '#ffd36a' })
    + path('M66 40 V140', { 'stroke-width': 4 }) + rect(54, 20, 24, 22, { fill: '#2f6fd1' }) + display(90, 22, 70, L('ph'))
    + beaker(190, 160, 54, 70, { level: 0.6 }) + path('M216 34 V140', { 'stroke-width': 3 }) + circle(216, 142, 4, { fill: '#c8161d' })
    + display(232, 22, 70, L('temp'))
    + [0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="${110 + k * 10}" y="70" width="10" height="16" fill="${['#d6141f', '#f0592a', '#f7a823', '#e3dc1e', '#3ea94b', '#1d7f95', '#3546a0'][k]}"/>`).join('') + text(145, 102, 'pH', { 'font-size': 11 }),
  react: (L) => bench() + beaker(40, 160, 60, 72, { level: 0.6 }) + bubbles(46, 102, 46, 52, 9) + rect(60, 150, 18, 8, { fill: '#9aa0a8', stroke: 'none' })
    + rect(124, 30, 180, 34, { fill: '#f6f4ee' }) + text(214, 52, 'Zn + 2 HCl → ZnCl₂ + H₂', { 'font-family': 'IBM Plex Mono, monospace', 'font-size': 12 })
    + arrow(110, 70, 140, 66) + rect(150, 92, 150, 50, { fill: '#fff4d6', stroke: '#e2ad2f' }) + text(225, 112, L('whyNot'), { 'font-size': 11 }) + text(225, 130, L('whyNotEx'), { 'font-size': 9.5, 'font-weight': 400 }),
  book: (L) => rect(30, 30, 100, 130, { fill: '#8a3f1c', rx: 6 }) + rect(42, 44, 76, 34, { fill: '#f6e7c1' }) + text(80, 66, L('bookCover'), { 'font-size': 12 })
    + path('M66 96 v14 l-12 24 h52 l-12 -24 v-14', { stroke: '#f6e7c1', 'stroke-width': 3 }) + key(146, 70, 'B')
    + rect(190, 40, 116, 110, { fill: '#fdfaf2', rx: 8 }) + text(248, 58, L('recipe'), { 'font-size': 11 })
    + [0, 1, 2, 3].map((k) => (k < 2 ? path(`M200 ${76 + k * 18} l4 5 l8 -9`, { stroke: OK, 'stroke-width': 2.4 }) : circle(206, 76 + k * 18, 3, { 'stroke-width': 1.6 })) + path(`M218 ${76 + k * 18} h76`, { 'stroke-width': 1.6, stroke: k < 2 ? '#9aa5b1' : INK })).join(''),
  notebook: (L) => rect(60, 26, 110, 140, { fill: '#1f5f4a', rx: 6 }) + rect(74, 46, 82, 40, { fill: '#f1ede2' }) + text(115, 70, L('cover'), { 'font-size': 11 })
    + path('M80 110 h70 M80 124 h70 M80 138 h70', { stroke: '#e8efe9', 'stroke-width': 1.6 }) + mouse(196, 60, 'l') + key(240, 70, 'N'),
  safety: (L) => bench() + ghs('GHS05', 50, 60, 52) + ghs('GHS02', 106, 60, 52) + ghs('GHS06', 162, 60, 52)
    + bin(200, 160, '#3b4048', L('binHeavy')) + bin(250, 160, '#2f6fd1', L('binAcid')) + bin(150, 160, '#2f9a4c', L('binGlass'))
    + path('M20 160 V112 H120 V160', { 'stroke-width': 2 }) + `<ellipse cx="60" cy="130" rx="18" ry="10" fill="#bfe24a" opacity="0.7"/>` + arrow(60, 122, 60, 102, { color: '#7a8a2a' }),
  // strumenti della G4
  hot: (L) => bench() + rect(40, 140, 40, 20, { fill: '#5a6068' }) + flame(60, 136, 34) + path('M30 104 h60 M60 104 l-24 -10 M60 104 l24 -10', { stroke: '#c9b48a', 'stroke-width': 3 })
    + `<path d="M48 104 L52 84 H68 L72 104 Z" fill="#f4f1ea" stroke="${INK}" stroke-width="2.4"/>`
    + path('M150 40 L200 88 M156 34 L206 82 M200 88 Q214 100 206 108 M206 82 Q222 92 214 104', { 'stroke-width': 3 }) + text(220, 138, L('tongs'), { 'font-size': 12 })
    + `<path d="M228 160 L232 140 H252 L256 160 Z" fill="#f4f1ea" stroke="${INK}" stroke-width="2.4"/>` + text(272, 150, L('hotTemp'), { 'font-size': 10, fill: HOT }),
  pipette: (L) => bench() + beaker(150, 160, 56, 60, { level: 0.55 }) + path('M178 20 V120', { 'stroke-width': 3 }) + path('M178 120 l0 8', { 'stroke-width': 1.6 })
    + rect(170, 6, 16, 22, { rx: 7, fill: '#c8161d', stroke: 'none' }) + path('M178 60 V100', { stroke: WATER, 'stroke-width': 3 })
    + path('M172 70 h4 M172 80 h4 M172 90 h4 M172 100 h4', { 'stroke-width': 1.2 }) + key(40, 60, 'E') + text(54, 104, '10 mL', { 'font-size': 11 })
    + key(232, 60, L('shift'), 46) + key(282, 60, 'E') + text(270, 104, '1 mL', { 'font-size': 11 }),
  burette: (L) => bench() + path('M60 160 V20 M60 30 H120', { 'stroke-width': 4 }) + rect(54, 152, 60, 8, { fill: '#5a6068', stroke: 'none' })
    + rect(116, 14, 12, 100, { fill: GLASS, rx: 2 }) + `<rect x="118" y="30" width="8" height="82" fill="#ffffff" opacity="0.9"/>`
    + path('M116 114 L122 124 L128 114 M122 124 v8', { 'stroke-width': 2.2 }) + rect(114, 116, 16, 5, { fill: '#2f6fd1', stroke: 'none' })
    + circle(122, 140, 2.4, { fill: WATER, stroke: 'none' }) + flask(100, 160, 44, 44, { level: 0.35, color: '#f4a6d9' })
    + display(170, 40, 94, L('volume')) + mouse(190, 92, 'l') + text(205, 152, L('flow'), { 'font-size': 9.5 }),
  filter: (L) => bench() + path('M60 160 V30 M60 60 H120', { 'stroke-width': 4 }) + `<ellipse cx="120" cy="52" rx="36" ry="8" fill="none" stroke="${INK}" stroke-width="2.4"/>`
    + `<path d="M90 50 L150 50 L124 92 L124 116 L116 116 L116 92 Z" fill="${GLASS}" stroke="${INK}" stroke-width="2.4"/>`
    + `<path d="M96 54 L144 54 L120 88 Z" fill="#f4f1ea" stroke="#b8b1a0" stroke-width="1.4"/>` + `<path d="M108 74 L132 74 L120 88 Z" fill="#f6d21a"/>`
    + circle(120, 130, 2.4, { fill: WATER, stroke: 'none' }) + flask(96, 160, 48, 40, { level: 0.25 })
    + text(230, 70, L('precipitate'), { 'font-size': 11 }) + arrow(196, 70, 136, 80) + text(230, 140, L('filtrate'), { 'font-size': 11 }) + arrow(200, 140, 140, 146),
  distill: () => bench() + rect(26, 136, 64, 24, { fill: '#aeb4bb' }) + circle(58, 116, 22, { fill: GLASS }) + `<path d="M40 126 A22 22 0 0 0 76 126 Z" fill="${WATER}" opacity="0.85"/>`
    + path('M58 94 V70 L66 70', { 'stroke-width': 2.4 }) + rect(54, 44, 8, 26, { fill: '#c8161d', stroke: 'none', rx: 2 })
    + path('M66 70 L230 112', { 'stroke-width': 9, stroke: 'rgba(150,200,225,0.55)' }) + path('M66 70 L230 112', { 'stroke-width': 2 })
    + path('M112 70 l0 -14 M196 108 l0 14', { stroke: '#2f6fd1', 'stroke-width': 3 }) + circle(232, 124, 2.4, { fill: WATER, stroke: 'none' })
    + flask(212, 160, 44, 34, { level: 0.25 }) + bubbles(46, 116, 24, 12, 4, 1.8),
  electro: (L) => bench() + rect(30, 120, 70, 40, { fill: '#3b4048' }) + display(38, 128, 54, L('voltage')) + circle(46, 156, 3, { fill: '#c8161d' }) + circle(84, 156, 3, { fill: INK, stroke: '#ffffff' })
    + path('M46 120 Q60 70 160 66 M84 120 Q100 90 196 66', { 'stroke-width': 1.8 }) + path('M160 60 V140 M196 60 V140', { 'stroke-width': 5, stroke: '#3a3f46' })
    + beaker(146, 160, 64, 80, { level: 0.65 }) + bubbles(154, 100, 10, 36, 5, 2) + bubbles(190, 100, 10, 36, 5, 2)
    + text(160, 50, '−', { 'font-size': 16 }) + text(196, 50, '+', { 'font-size': 16 }) + text(262, 110, 'H₂  O₂', { 'font-size': 12 }),
  gas: (L) => bench() + `<rect x="40" y="40" width="34" height="120" rx="16" fill="#9aa5b1" stroke="${INK}" stroke-width="2.4"/>` + rect(48, 26, 18, 16, { fill: '#5a6068' })
    + circle(57, 22, 7, { fill: '#c8161d' }) + text(57, 110, 'CO₂', { 'font-size': 11 }) + path('M64 30 Q120 10 150 60 V136', { 'stroke-width': 3 })
    + beaker(124, 160, 56, 66, { level: 0.6, color: '#e9eef2' }) + bubbles(140, 108, 20, 40, 7, 2.2)
    + text(240, 80, L('limewater'), { 'font-size': 11 }) + text(240, 98, L('limewaterResult'), { 'font-size': 11 }),
};

/** Elementi di disegno e colori, per le vignette del libro «Come si fa» (book-figures.js): stesso stile del tutorial. */
export const DRAW = { f, path, rect, circle, text, g, beaker, flask, arrow, turn, flame, key, mouse, bubbles, ghs, display, bench, bin, INK, GLASS, WATER, OK, HOT };

/** Illustrazioni del tutorial, anche per le pagine del libro (stesse firme: (parole) → SVG interno). */
export const TUTORIAL_DRAWINGS = ILLUSTRATIONS;

/** Pagine del tutorial, nell'ordine: id (testi tut_<id>_title e tut_<id>_steps) e illustrazione. */
export const TUTORIAL = ['notebook', 'book', 'move', 'hold', 'pour', 'weigh', 'water', 'heat', 'measure', 'pipette', 'burette', 'filter', 'hot', 'distill', 'electro', 'gas', 'react', 'safety'];

/** Parole scritte nelle illustrazioni (testi tutw_<nome> in game-strings.js). */
export const ILLUSTRATION_WORDS = ['shift', 'mass', 'ph', 'temp', 'volume', 'voltage', 'hotTemp', 'space', 'place', 'tare', 'spoon', 'water', 'wash', 'whyNot', 'whyNotEx', 'cover', 'binHeavy', 'binAcid', 'binGlass', 'tongs', 'flow', 'precipitate', 'filtrate', 'limewater', 'limewaterResult', 'bookCover', 'recipe'];

const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Illustrazione di una pagina come stringa SVG (viewBox 320 × 180).
 * @param {string} id pagina (TUTORIAL)
 * @param {(word: string) => string} [words] parole nella lingua dell'interfaccia (ILLUSTRATION_WORDS)
 */
export function illustration(id, words = (w) => w) {
  const draw = ILLUSTRATIONS[id];
  if (!draw) return '';
  return `<svg class="gm-tut__svg" viewBox="0 0 320 180" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${draw((w) => escText(words(w)))}</svg>`;
}
