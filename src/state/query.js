// Logica di ricerca e filtro (pura, senza DOM).
import { normalize } from '../chem/format.js';

/**
 * Punteggio di corrispondenza tra elemento e testo cercato.
 * 4 = numero atomico o simbolo esatto, 3 = nome che inizia con il testo,
 * 2 = nome che contiene il testo, 1 = nome inglese, 0 = nessuna corrispondenza.
 */
export function searchScore(el, rawQuery) {
  const q = normalize(rawQuery);
  if (!q) return 0;
  if (/^\d+$/.test(q)) return Number(q) === el.z ? 4 : 0;
  if (normalize(el.symbol) === q) return 4;
  const name = normalize(el.name);
  if (name.startsWith(q)) return 3;
  if (name.includes(q)) return 2;
  if (normalize(el.nameEn).includes(q) || normalize(el.symbol).startsWith(q)) return 1;
  return 0;
}

export function passesFilters(el, s) {
  if (s.categories.size && !s.categories.has(el.category)) return false;
  if (s.physState !== 'all' && el.state !== s.physState) return false;
  if (s.blocks.size && !s.blocks.has(el.block)) return false;
  return true;
}

/** @returns {{ visible: Set<number>, best: object|null, count: number }} */
export function computeVisibility(elements, s) {
  const visible = new Set();
  let best = null;
  let bestScore = 0;
  for (const el of elements) {
    if (!passesFilters(el, s)) continue;
    if (s.query) {
      const score = searchScore(el, s.query);
      if (!score) continue;
      if (score > bestScore) {
        best = el;
        bestScore = score;
      }
    }
    visible.add(el.z);
  }
  return { visible, best, count: visible.size };
}
