// Firma breve di un testo (FNV-1a a 32 bit) per riconoscere alcune parole senza scriverle in chiaro.
export const clean = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9а-я ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function sig(s) {
  let h = 0x811c9dc5;
  for (const ch of clean(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
