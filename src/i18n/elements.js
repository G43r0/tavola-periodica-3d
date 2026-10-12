// Applica ai dati degli elementi (elements.json, in italiano) i testi della lingua attiva.
// Si chiama una volta all'avvio: gli oggetti sono condivisi da tavola, visualizzatore, laboratorio e sandbox.
import { getLang, locale } from './index.js';
import { ELEMENTS_EN } from './data/elements-en.js';
import { ELEMENTS_ELI6 } from './data/elements-eli6.js';

const UNIT_EN = {
  a: ['year', 'years'],
  d: ['day', 'days'],
  h: ['hour', 'hours'],
  min: ['minute', 'minutes'],
  s: ['second', 'seconds'],
  ms: ['millisecond', 'milliseconds'],
};

const DECAY_EN = {
  'α': 'α decay',
  'β-': 'β⁻ decay',
  'β+': 'β⁺ decay',
  '2β-': 'double β⁻ decay',
  CE: 'electron capture',
  FS: 'spontaneous fission',
  TI: 'isomeric transition',
};

const DECAY_ELI6 = {
  'α': 'il nucleo sputa un pezzetto fatto di 2 protoni e 2 neutroni',
  'β-': 'un neutrone si trasforma in protone',
  'β+': 'un protone si trasforma in neutrone',
  '2β-': 'due neutroni si trasformano in protoni insieme',
  CE: 'il nucleo «mangia» un elettrone',
  FS: 'il nucleo si spezza in due',
  TI: 'il nucleo si calma e manda fuori un lampo di energia',
};

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).replace(/[-0-9]/g, (c) => SUP[c]);

/** Emivita in inglese (stesse regole di scripts/build-data.mjs). */
export function halfLifeTextEn({ value, unit, approx }) {
  const fmt = (v) => new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 4 }).format(v);
  const pre = approx ? '~' : '';
  if (unit === 'a' && value >= 1e12) {
    const exp = Math.floor(Math.log10(value));
    return `${pre}${fmt(value / 10 ** exp)} × 10${sup(exp)} years`;
  }
  if (unit === 'a' && value >= 1e9) return `${pre}${fmt(value / 1e9)} billion years`;
  if (unit === 'a' && value >= 1e6) return `${pre}${fmt(value / 1e6)} million years`;
  const [one, many] = UNIT_EN[unit];
  return `${pre}${new Intl.NumberFormat(locale()).format(value)} ${value === 1 ? one : many}`;
}

let done = false;

/** @param {object[]} elements array di elements.json (modificato sul posto) */
export function localizeElements(elements) {
  if (done) return elements;
  done = true;
  const lang = getLang();
  for (const el of elements) {
    el.nameIt = el.name;
    if (lang === 'en') {
      const x = ELEMENTS_EN[el.z];
      el.name = el.nameEn;
      el.nameOrigin = x.o;
      el.uses = x.u;
      el.occurrence = x.c;
      el.discovery = { year: x.y ?? el.discovery.year, by: x.by };
      if (x.mn) el.meltingNote = x.mn;
      if (x.dn) el.densityNote = x.dn;
      if (x.sp) el.statePredicted = x.sp;
      for (const iso of el.isotopes) {
        if (iso.halfLife) iso.halfLife.text = halfLifeTextEn(iso.halfLife);
        for (const d of iso.decay) d.label = DECAY_EN[d.code] ?? d.label;
      }
    } else if (lang === 'eli6') {
      const x = ELEMENTS_ELI6[el.z];
      el.simple = x.s;
      el.uses = x.u;
      el.occurrence = x.c;
      for (const iso of el.isotopes) for (const d of iso.decay) d.simple = DECAY_ELI6[d.code];
    }
  }
  return elements;
}
