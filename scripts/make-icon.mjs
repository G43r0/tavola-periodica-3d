// Genera build/icon.png (512×512) senza dipendenze: atomo stilizzato su fondo scuro.
// electron-builder lo converte automaticamente in .ico / .icns.
// Uso: npm run icon

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'build', 'icon.png');
const S = 512;
const SS = 3; // supersampling per lato

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const CYAN = hex('#5ce1ff');
const RED = hex('#ff5d6c');
const BLUE = hex('#8ea4c4');
const C = S / 2;

// ---- forme
function roundRectAlpha(x, y, inset, r) {
  const w = S - 2 * inset;
  const dx = Math.max(Math.abs(x - C) - (w / 2 - r), 0);
  const dy = Math.max(Math.abs(y - C) - (w / 2 - r), 0);
  return Math.hypot(dx, dy) - r; // <0 dentro
}

function ellipseDist(x, y, rx, ry, rot) {
  const c = Math.cos(-rot);
  const s = Math.sin(-rot);
  const px = (x - C) * c - (y - C) * s;
  const py = (x - C) * s + (y - C) * c;
  const r = Math.hypot(px / rx, py / ry);
  const gx = px / (rx * rx * r);
  const gy = py / (ry * ry * r);
  return Math.abs(r - 1) / Math.hypot(gx, gy);
}

const ORBITS = [0, Math.PI / 3, (2 * Math.PI) / 3].map((rot) => ({ rot, rx: 178, ry: 64 }));
const ELECTRONS = ORBITS.map((o, i) => {
  const t = [0.35, 2.4, 4.3][i];
  const ex = o.rx * Math.cos(t);
  const ey = o.ry * Math.sin(t);
  return { x: C + ex * Math.cos(o.rot) - ey * Math.sin(o.rot), y: C + ex * Math.sin(o.rot) + ey * Math.cos(o.rot) };
});
const NUCLEUS = Array.from({ length: 7 }, (_, i) => {
  const a = i * 2.39996;
  const rr = i === 0 ? 0 : 22 * Math.sqrt(i / 7) + 6;
  return { x: C + rr * Math.cos(a), y: C + rr * Math.sin(a), color: i % 2 ? BLUE : RED };
});

function over(dst, rgb, a) {
  // compositing "source over" su pixel RGBA (valori 0..1 per alpha)
  const outA = a + dst[3] * (1 - a);
  if (outA === 0) return;
  for (let k = 0; k < 3; k++) dst[k] = (rgb[k] * a + dst[k] * dst[3] * (1 - a)) / outA;
  dst[3] = outA;
}

function sample(x, y) {
  const px = [0, 0, 0, 0];
  const bg = roundRectAlpha(x, y, 20, 112);
  if (bg > 0) return px;
  // sfondo con gradiente verticale e alone centrale
  const t = y / S;
  const base = [14 + (5 - 14) * t, 26 + (10 - 26) * t, 44 + (18 - 44) * t];
  const halo = Math.exp(-((x - C) ** 2 + (y - C) ** 2) / (2 * 150 ** 2)) * 0.35;
  over(px, base.map((v, k) => v + (CYAN[k] - v) * halo * 0.4), 1);
  // bordo luminoso
  if (bg > -7) over(px, CYAN, 0.35);

  for (const o of ORBITS) {
    const d = ellipseDist(x, y, o.rx, o.ry, o.rot);
    over(px, CYAN, Math.exp(-d / 14) * 0.22); // bagliore
    if (d < 7) over(px, CYAN, Math.min(1, 7 - d) * 0.95);
  }
  for (const n of NUCLEUS) {
    const d = Math.hypot(x - n.x, y - n.y);
    if (d < 20) over(px, n.color, Math.min(1, 20 - d));
  }
  for (const e of ELECTRONS) {
    const d = Math.hypot(x - e.x, y - e.y);
    over(px, CYAN, Math.exp(-d / 10) * 0.5);
    if (d < 15) over(px, [235, 252, 255], Math.min(1, 15 - d));
  }
  return px;
}

// ---- rasterizzazione con supersampling
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0; // filtro PNG: nessuno
  for (let x = 0; x < S; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const p = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
        r += p[0] * p[3];
        g += p[1] * p[3];
        b += p[2] * p[3];
        a += p[3];
      }
    }
    const o = y * (S * 4 + 1) + 1 + x * 4;
    raw[o] = a ? Math.round(r / a) : 0;
    raw[o + 1] = a ? Math.round(g / a) : 0;
    raw[o + 2] = a ? Math.round(b / a) : 0;
    raw[o + 3] = Math.round((a / (SS * SS)) * 255);
  }
}

// ---- codifica PNG
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; // profondità
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, png);
console.log(`OK: ${path.relative(ROOT, OUT)} (${(png.length / 1024).toFixed(0)} KB)`);
