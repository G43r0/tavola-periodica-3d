// Liquidi nei contenitori: livello sempre orizzontale a qualunque inclinazione, versamento dal punto più basso del
// bordo e disegno (shader che taglia il liquido al livello e mostra le facce interne come superficie).
//
// Il volume interno di un contenitore (un solido di rotazione descritto dal profilo [raggio, altezza]) è campionato
// con N punti distribuiti uniformemente. Se il contenitore è pieno per una frazione f, il livello del liquido è
// l'altezza (nel mondo) sotto cui sta la frazione f dei punti: un quantile, che resta corretto comunque sia inclinato.
// Il liquido che sta sopra il punto più basso del bordo esce da lì.
import * as THREE from 'three';

export const SAMPLES = 320;

/** Generatore pseudo-casuale riproducibile (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Raggio interno del profilo all'altezza y (interpolazione lineare). */
export function radiusAt(profile, y) {
  if (y <= profile[0][1]) return profile[0][0];
  for (let k = 1; k < profile.length; k++) {
    const [r1, y1] = profile[k];
    if (y <= y1) {
      const [r0, y0] = profile[k - 1];
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1);
    }
  }
  return profile[profile.length - 1][0];
}

/** Volume del solido di rotazione (m³) per strati sottili. */
export function profileVolume(profile, steps = 400) {
  const y0 = profile[0][1];
  const y1 = profile[profile.length - 1][1];
  const h = (y1 - y0) / steps;
  let v = 0;
  for (let i = 0; i < steps; i++) {
    const r = radiusAt(profile, y0 + (i + 0.5) * h);
    v += Math.PI * r * r * h;
  }
  return v;
}

/**
 * Punti uniformi nel volume interno (coordinate locali del contenitore): l'altezza è scelta con probabilità
 * proporzionale all'area della sezione, poi un punto a caso nel cerchio.
 */
export function interiorSamples(profile, n = SAMPLES, seed = 7) {
  const rand = rng(seed);
  const y0 = profile[0][1];
  const y1 = profile[profile.length - 1][1];
  // distribuzione cumulativa dell'area lungo l'altezza
  const steps = 200;
  const cdf = new Float64Array(steps + 1);
  for (let i = 0; i < steps; i++) {
    const r = radiusAt(profile, y0 + ((i + 0.5) / steps) * (y1 - y0));
    cdf[i + 1] = cdf[i] + r * r;
  }
  const pts = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    // stratificato: un campione per intervallo di probabilità, così il quantile è stabile
    const u = ((k + rand()) / n) * cdf[steps];
    let i = 0;
    while (i < steps - 1 && cdf[i + 1] < u) i++;
    const frac = (u - cdf[i]) / (cdf[i + 1] - cdf[i] || 1);
    const y = y0 + ((i + frac) / steps) * (y1 - y0);
    const r = radiusAt(profile, y) * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    pts[k * 3] = Math.cos(a) * r;
    pts[k * 3 + 1] = y;
    pts[k * 3 + 2] = Math.sin(a) * r;
  }
  return pts;
}

/** Punti del bordo (anello interno in cima) in coordinate locali. */
export function rimPoints(profile, n = 16) {
  const [r, y] = profile[profile.length - 1];
  const pts = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    pts[k * 3] = Math.cos(a) * r;
    pts[k * 3 + 1] = y;
    pts[k * 3 + 2] = Math.sin(a) * r;
  }
  return pts;
}

/** k-esimo valore più piccolo (quickselect, modifica l'array). */
function select(a, k, n) {
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const pivot = a[(lo + hi) >> 1];
    let i = lo;
    let j = hi;
    while (i <= j) {
      while (a[i] < pivot) i++;
      while (a[j] > pivot) j--;
      if (i <= j) {
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
        i++;
        j--;
      }
    }
    if (k <= j) hi = j;
    else if (k >= i) lo = i;
    else break;
  }
  return a[k];
}

const scratch = new Float32Array(SAMPLES * 4);

/**
 * Livello del liquido nel mondo e volume che sporge sopra il punto più basso del bordo.
 * @param {Float32Array} samples punti interni (locali)
 * @param {Float32Array} rim punti del bordo (locali)
 * @param {THREE.Matrix4} m matrice del contenitore nel mondo
 * @param {number} fraction frazione riempita (0–1)
 * @returns {{level: number, rimY: number, rimIndex: number, over: number}} over = frazione del volume interno che sporge
 */
export function liquidLevel(samples, rim, m, fraction) {
  const e = m.elements;
  const n = samples.length / 3;
  for (let k = 0; k < n; k++) scratch[k] = e[1] * samples[k * 3] + e[5] * samples[k * 3 + 1] + e[9] * samples[k * 3 + 2] + e[13];
  let rimY = Infinity;
  let rimIndex = 0;
  for (let k = 0; k < rim.length / 3; k++) {
    const y = e[1] * rim[k * 3] + e[5] * rim[k * 3 + 1] + e[9] * rim[k * 3 + 2] + e[13];
    if (y < rimY) {
      rimY = y;
      rimIndex = k;
    }
  }
  if (fraction <= 0) return { level: -Infinity, rimY, rimIndex, over: 0 };
  let over = 0;
  let level;
  if (fraction >= 1) {
    level = Infinity;
    for (let k = 0; k < n; k++) if (scratch[k] > rimY) over++;
    return { level, rimY, rimIndex, over: over / n + (fraction - 1) };
  }
  const kq = Math.min(n - 1, Math.max(0, Math.floor(fraction * n)));
  for (let k = 0; k < n; k++) scratch[n + k] = scratch[k];
  level = select(scratch.subarray(n, 2 * n), kq, n);
  for (let k = 0; k < n; k++) if (scratch[k] > rimY && scratch[k] <= level) over++;
  return { level, rimY, rimIndex, over: over / n };
}

// ------------------------------------------------------------------ disegno

/**
 * Materiale del liquido: scarta i frammenti sopra il livello (uniform uLevel, nel mondo) e colora le facce interne
 * come superficie (più chiara e opaca).
 */
export function liquidMaterial({ physical = false } = {}) {
  const Base = physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const mat = new Base({
    color: 0xd6e8f6,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  if (physical) mat.clearcoat = 0.4;
  const uniforms = { uLevel: { value: 1e3 }, uSurface: { value: new THREE.Color(0xffffff) }, uSurfaceAlpha: { value: 0.6 } };
  mat.userData.uniforms = uniforms;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vWorldY;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldY = (modelMatrix * vec4(transformed, 1.0)).y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vWorldY;\nuniform float uLevel;\nuniform vec3 uSurface;\nuniform float uSurfaceAlpha;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vWorldY > uLevel) discard;')
      .replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\nif (!gl_FrontFacing) { gl_FragColor = vec4(mix(gl_FragColor.rgb, uSurface, 0.55), max(gl_FragColor.a, uSurfaceAlpha)); }',
      );
  };
  mat.customProgramCacheKey = () => `liquid-${physical}`;
  return mat;
}

/** Geometria del volume interno (solido di rotazione chiuso sul fondo), leggermente più stretta del vetro. */
export function interiorGeometry(profile, segments = 28) {
  const pts = [new THREE.Vector2(0, profile[0][1])];
  for (const [r, y] of profile) pts.push(new THREE.Vector2(Math.max(0.0005, r * 0.985), y));
  pts.push(new THREE.Vector2(0, profile[profile.length - 1][1]));
  return new THREE.LatheGeometry(pts, segments);
}
