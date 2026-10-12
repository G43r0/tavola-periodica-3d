// Disegno 2D della struttura di Lewis (SVG): simboli, legami (trattini singoli, doppi, tripli),
// coppie solitarie (due puntini), elettroni spaiati (un puntino), cariche formali, parentesi degli ioni.
// Il disegno parte dalla proiezione della geometria 3D e si rilassa in 2D distribuendo i domini.
import { chargeText } from './chem/identify.js';
import { isItalian } from '../i18n/index.js';

const PX = 46; // pixel per unità di legame

/** Proiezione sul piano dei due assi principali (analisi delle componenti principali). */
function project(points) {
  const n = points.length;
  if (n === 1) return [[0, 0]];
  const c = [0, 0, 0];
  for (const p of points) for (let k = 0; k < 3; k++) c[k] += p[k] / n;
  const q = points.map((p) => [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of q) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) C[a][b] += p[a] * p[b];
  const power = (avoid) => {
    let v = [0.57, 0.62, 0.53];
    for (let it = 0; it < 60; it++) {
      let w = [0, 1, 2].map((a) => C[a][0] * v[0] + C[a][1] * v[1] + C[a][2] * v[2]);
      if (avoid) {
        const d = w[0] * avoid[0] + w[1] * avoid[1] + w[2] * avoid[2];
        w = w.map((x, k) => x - d * avoid[k]);
      }
      const l = Math.hypot(...w) || 1;
      v = w.map((x) => x / l);
    }
    return v;
  };
  const e1 = power(null);
  let e2 = power(e1);
  if (Math.abs(e1[0] * e2[0] + e1[1] * e2[1] + e1[2] * e2[2]) > 0.5 || !Number.isFinite(e2[0])) e2 = [-e1[1], e1[0], 0];
  return q.map((p) => [p[0] * e1[0] + p[1] * e1[1] + p[2] * e1[2], p[0] * e2[0] + p[1] * e2[1] + p[2] * e2[2]]);
}

const wrap = (a) => {
  while (a <= -Math.PI) a += 2 * Math.PI;
  while (a > Math.PI) a -= 2 * Math.PI;
  return a;
};

/** Rilassamento 2D: legami di lunghezza 1, domini (legami e coppie) distribuiti attorno a ogni atomo. */
function relax2d(pos, bonds, lone) {
  const n = pos.length;
  const nb = pos.map(() => []);
  for (const b of bonds) {
    nb[b.i].push(b.j);
    nb[b.j].push(b.i);
  }
  // angoli iniziali delle coppie: negli spazi più ampi tra i legami
  const lpAngles = pos.map((p, i) => {
    const count = lone[i];
    if (!count) return [];
    const taken = nb[i].map((j) => Math.atan2(pos[j][1] - p[1], pos[j][0] - p[0]));
    if (!taken.length) return Array.from({ length: count }, (_, k) => Math.PI / 2 - (k * 2 * Math.PI) / count);
    const out = [];
    for (let k = 0; k < count; k++) {
      const all = [...taken, ...out].sort((a, b) => a - b);
      let best = { gap: -1, mid: 0 };
      all.forEach((a, idx) => {
        const next = idx + 1 < all.length ? all[idx + 1] : all[0] + 2 * Math.PI;
        if (next - a > best.gap) best = { gap: next - a, mid: a + (next - a) / 2 };
      });
      out.push(wrap(best.mid));
    }
    return out;
  });

  for (let it = 0; it < 260; it++) {
    for (const b of bonds) {
      const dx = pos[b.j][0] - pos[b.i][0];
      const dy = pos[b.j][1] - pos[b.i][1];
      const l = Math.hypot(dx, dy) || 1e-6;
      const e = ((l - 1) / l) * 0.5;
      pos[b.i][0] += dx * e;
      pos[b.i][1] += dy * e;
      pos[b.j][0] -= dx * e;
      pos[b.j][1] -= dy * e;
    }
    for (let c = 0; c < n; c++) {
      const doms = [
        ...nb[c].map((k) => ({ k, a: Math.atan2(pos[k][1] - pos[c][1], pos[k][0] - pos[c][0]), w: 1 })),
        ...lpAngles[c].map((a, m) => ({ lp: m, a, w: 1.15 })),
      ];
      if (doms.length < 2) continue;
      const push = doms.map(() => 0);
      for (let p = 0; p < doms.length; p++) {
        for (let q = 0; q < doms.length; q++) {
          if (p === q) continue;
          const d = wrap(doms[p].a - doms[q].a);
          const mag = (doms[p].w * doms[q].w) / Math.max(Math.abs(d), 0.08) ** 2;
          push[p] += Math.sign(d || 1) * mag;
        }
      }
      doms.forEach((dom, p) => {
        const delta = Math.max(-0.12, Math.min(0.12, push[p] * 0.012));
        if (dom.lp !== undefined) lpAngles[c][dom.lp] = wrap(dom.a + delta);
        else if (nb[dom.k].length === 1 || nb[c].length > 1) {
          const r = Math.hypot(pos[dom.k][0] - pos[c][0], pos[dom.k][1] - pos[c][1]);
          const na = dom.a + delta * (nb[dom.k].length === 1 ? 1 : 0.4);
          pos[dom.k] = [pos[c][0] + Math.cos(na) * r, pos[c][1] + Math.sin(na) * r];
        }
      });
    }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[j][0] - pos[i][0];
        const dy = pos[j][1] - pos[i][1];
        const l = Math.hypot(dx, dy) || 1e-6;
        if (l > 0.95) continue;
        const e = ((0.95 - l) / l) * 0.3;
        pos[i][0] -= dx * e;
        pos[i][1] -= dy * e;
        pos[j][0] += dx * e;
        pos[j][1] += dy * e;
      }
    }
  }
  return lpAngles;
}

const fmtCharge = (q) => (q > 0 ? (q === 1 ? '+' : `${q}+`) : q === -1 ? '−' : `${-q}−`);

/**
 * @param {object} lab
 * @param {object} unit { desc:{atoms,bonds,ionic}, frags:[{indices,atoms,bonds,charge}], lewisAtoms:[], positions:[[x,y,z]] }
 * @returns {string} SVG
 */
export function lewisSvg(lab, unit) {
  const frags = [...unit.frags].sort((a, b) => b.charge - a.charge || b.indices.length - a.indices.length);
  const ionicUnit = unit.desc.ionic.length > 0 || frags.length > 1;
  const pieces = [];
  let cursor = 0;
  for (const f of frags) {
    const pts = project(f.indices.map((i) => unit.positions[i]));
    // scala: lunghezza media dei legami = 1
    let avg = 0;
    for (const b of f.bonds) avg += Math.hypot(pts[b.i][0] - pts[b.j][0], pts[b.i][1] - pts[b.j][1]);
    avg = f.bonds.length ? avg / f.bonds.length : 1;
    const pos = pts.map((p) => [p[0] / (avg || 1), -p[1] / (avg || 1)]);
    const lone = f.indices.map((i) => unit.lewisAtoms[i].lonePairs + unit.lewisAtoms[i].unpaired);
    const lp = relax2d(pos, f.bonds, lone);
    const xs = pos.map((p) => p[0]);
    const ys = pos.map((p) => p[1]);
    const minX = Math.min(...xs) - 0.45;
    const maxX = Math.max(...xs) + 0.45;
    const bracket = ionicUnit && f.charge !== 0;
    const pad = bracket ? 0.35 : 0;
    const shift = cursor - minX + pad;
    pieces.push({ f, pos: pos.map((p) => [p[0] + shift, p[1]]), lp, bracket, box: [cursor, Math.min(...ys) - 0.55, maxX + shift + pad, Math.max(...ys) + 0.55] });
    cursor = maxX + shift + pad + (bracket ? 0.9 : 0.7);
  }

  const out = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const extend = (x, y) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const piece of pieces) {
    const { f, pos, lp, bracket } = piece;
    const P = pos.map(([x, y]) => [x * PX, y * PX]);
    // legami
    for (const b of f.bonds) {
      const [x1, y1] = P[b.i];
      const [x2, y2] = P[b.j];
      const l = Math.hypot(x2 - x1, y2 - y1) || 1;
      const ux = (x2 - x1) / l;
      const uy = (y2 - y1) / l;
      const trim = 12;
      const nx = -uy;
      const ny = ux;
      const offsets = b.order === 1 ? [0] : b.order === 2 ? [-3.2, 3.2] : [-5, 0, 5];
      for (const o of offsets) {
        out.push(`<line class="lw-bond" x1="${(x1 + ux * trim + nx * o).toFixed(1)}" y1="${(y1 + uy * trim + ny * o).toFixed(1)}" x2="${(x2 - ux * trim + nx * o).toFixed(1)}" y2="${(y2 - uy * trim + ny * o).toFixed(1)}"/>`);
      }
    }
    // atomi, coppie, cariche formali
    f.indices.forEach((ui, k) => {
      const info = lab.get(unit.desc.atoms[ui].z);
      const la = unit.lewisAtoms[ui];
      const [x, y] = P[k];
      extend(x - 14, y - 14);
      extend(x + 14, y + 14);
      out.push(`<text class="lw-atom" x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}">${info.symbol}</text>`);
      const angles = lp[k];
      let m = 0;
      for (let p = 0; p < la.lonePairs; p++, m++) {
        const a = angles[m] ?? 0;
        const cx = x + Math.cos(a) * 15;
        const cy = y + Math.sin(a) * 15;
        const px = -Math.sin(a) * 3;
        const py = Math.cos(a) * 3;
        out.push(`<circle class="lw-e" cx="${(cx + px).toFixed(1)}" cy="${(cy + py).toFixed(1)}" r="1.9"/><circle class="lw-e" cx="${(cx - px).toFixed(1)}" cy="${(cy - py).toFixed(1)}" r="1.9"/>`);
        extend(cx, cy);
      }
      for (let s = 0; s < la.unpaired; s++, m++) {
        const a = angles[m] ?? -Math.PI / 2;
        out.push(`<circle class="lw-e lw-e--single" cx="${(x + Math.cos(a) * 15).toFixed(1)}" cy="${(y + Math.sin(a) * 15).toFixed(1)}" r="2.2"/>`);
      }
      const singleIon = bracket && f.indices.length === 1;
      if (la.formalCharge && !singleIon) {
        // nello spazio libero più ampio
        const doms = [...angles];
        for (const b of f.bonds) {
          if (b.i === k) doms.push(Math.atan2(P[b.j][1] - y, P[b.j][0] - x));
          if (b.j === k) doms.push(Math.atan2(P[b.i][1] - y, P[b.i][0] - x));
        }
        let a = -Math.PI / 4;
        if (doms.length) {
          const s = doms.map(wrap).sort((p, q) => p - q);
          let best = -1;
          s.forEach((v, idx) => {
            const next = idx + 1 < s.length ? s[idx + 1] : s[0] + 2 * Math.PI;
            if (next - v > best) {
              best = next - v;
              a = v + (next - v) / 2;
            }
          });
        }
        out.push(`<text class="lw-fc" x="${(x + Math.cos(a) * 17).toFixed(1)}" y="${(y + Math.sin(a) * 17 + 4).toFixed(1)}">${fmtCharge(la.formalCharge)}</text>`);
      }
    });
    if (bracket) {
      const [bx0, by0, bx1, by1] = piece.box.map((v) => v * PX);
      const x0 = bx0 + 2;
      const x1 = bx1 - 2;
      const y0 = Math.min(by0, minY) - 2;
      const y1 = Math.max(by1, maxY) + 2;
      out.push(`<path class="lw-bracket" d="M${x0 + 6},${y0} H${x0} V${y1} H${x0 + 6} M${x1 - 6},${y0} H${x1} V${y1} H${x1 - 6}"/>`);
      out.push(`<text class="lw-ion" x="${(x1 + 3).toFixed(1)}" y="${(y0 + 9).toFixed(1)}">${chargeText(f.charge)}</text>`);
      extend(x0 - 4, y0 - 6);
      extend(x1 + 18, y1 + 4);
    }
  }
  if (!Number.isFinite(minX)) return '';
  const m = 10;
  const w = maxX - minX + 2 * m;
  const h = maxY - minY + 2 * m;
  return `<svg class="lewis" viewBox="${(minX - m).toFixed(1)} ${(minY - m).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" width="${Math.min(Math.max(w * 1.5, 130), 300).toFixed(0)}" role="img" aria-label="${isItalian() ? 'Struttura di Lewis' : 'Lewis structure'}">${out.join('')}</svg>`;
}
