// Genera src/data/elements.json unendo:
//  - data-sources/pubchem-periodictable.json  (PubChem, NCBI: proprietà fisiche e chimiche)
//  - data-sources/curated/*.mjs                (nomi italiani, masse IUPAC, isotopi, storia, usi,
//                                               correzioni NIST/CRC dove PubChem è impreciso)
//  - src/chem/electron-config.js               (configurazioni elettroniche, regola di Madelung + eccezioni NIST)
// Uso: npm run data

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fullConfiguration, shortConfiguration, shells } from '../src/chem/electron-config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'data', 'elements.json');

const CATEGORIES = [
  'alkali', 'alkaline-earth', 'transition', 'post-transition', 'metalloid',
  'nonmetal', 'halogen', 'noble-gas', 'lanthanide', 'actinide', 'unknown',
];

// ---------------------------------------------------------------- sorgenti
const pubchemRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-sources', 'pubchem-periodictable.json'), 'utf8'));
const columns = pubchemRaw.Table.Columns.Column;
const pubchem = new Map(
  pubchemRaw.Table.Row.map((row) => {
    const rec = Object.fromEntries(columns.map((c, i) => [c, row.Cell[i]]));
    return [Number(rec.AtomicNumber), rec];
  }),
);

const curatedDir = path.join(ROOT, 'data-sources', 'curated');
const curated = {};
for (const file of fs.readdirSync(curatedDir).filter((f) => f.endsWith('.mjs')).sort()) {
  const mod = await import(pathToFileURL(path.join(curatedDir, file)).href);
  Object.assign(curated, mod.default);
}

// ---------------------------------------------------------------- utilità
const num = (s) => (s === undefined || s === null || String(s).trim() === '' ? null : Number(s));
const pick = (c, key, fallback) => (Object.prototype.hasOwnProperty.call(c, key) ? c[key] : fallback);
const fmtIt = (v, opts = {}) => new Intl.NumberFormat('it-IT', { maximumSignificantDigits: 6, ...opts }).format(v);
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => SUP[d]);

const PERIOD_STARTS = [1, 3, 11, 19, 37, 55, 87];

function position(z) {
  if (z >= 57 && z <= 71) return { period: 6, group: null, x: z - 57 + 3, y: 9 };
  if (z >= 89 && z <= 103) return { period: 7, group: null, x: z - 89 + 3, y: 10 };
  const period = PERIOD_STARTS.filter((s) => z >= s).length;
  const off = z - PERIOD_STARTS[period - 1];
  let group;
  if (z === 1) group = 1;
  else if (z === 2) group = 18;
  else if (period <= 3) group = off < 2 ? off + 1 : off + 11;
  else if (period <= 5) group = off + 1;
  else group = off < 2 ? off + 1 : off - 13;
  return { period, group, x: group, y: period };
}

function blockOf(z, group) {
  if (z === 2) return 's';
  if ((z >= 57 && z <= 70) || (z >= 89 && z <= 102)) return 'f';
  if (z === 71 || z === 103) return 'd';
  if (group <= 2) return 's';
  if (group >= 13) return 'p';
  return 'd';
}

// ---------------------------------------------------------------- isotopi
const UNIT = {
  a: { s: 31557600, one: 'anno', many: 'anni' },
  d: { s: 86400, one: 'giorno', many: 'giorni' },
  h: { s: 3600, one: 'ora', many: 'ore' },
  min: { s: 60, one: 'minuto', many: 'minuti' },
  s: { s: 1, one: 'secondo', many: 'secondi' },
  ms: { s: 1e-3, one: 'millisecondo', many: 'millisecondi' },
};

const DECAY = {
  'α': 'decadimento α',
  'β-': 'decadimento β⁻',
  'β+': 'decadimento β⁺',
  '2β-': 'doppio decadimento β⁻',
  CE: 'cattura elettronica',
  FS: 'fissione spontanea',
  TI: 'transizione isomerica',
};
const DECAY_SHORT = { 'α': 'α', 'β-': 'β⁻', 'β+': 'β⁺', '2β-': '2β⁻', CE: 'CE', FS: 'FS', TI: 'TI' };

function halfLifeText(value, unit, approx) {
  const u = UNIT[unit];
  const pre = approx ? '~' : '';
  if (unit === 'a' && value >= 1e12) {
    const exp = Math.floor(Math.log10(value));
    const mant = value / 10 ** exp;
    return `${pre}${fmtIt(mant, { maximumSignificantDigits: 4 })} × 10${sup(exp)} anni`;
  }
  if (unit === 'a' && value >= 1e9) return `${pre}${fmtIt(value / 1e9, { maximumSignificantDigits: 4 })} miliardi di anni`;
  if (unit === 'a' && value >= 1e6) return `${pre}${fmtIt(value / 1e6, { maximumSignificantDigits: 4 })} milioni di anni`;
  return `${pre}${fmtIt(value)} ${value === 1 ? u.one : u.many}`;
}

function parseIsotopes(spec, z) {
  const list = spec.split(';').map((s) => s.trim()).filter(Boolean).map((part) => {
    const main = part.startsWith('*');
    const [label, abundance, half, decay] = (main ? part.slice(1) : part).split(':');
    const massNumber = parseInt(label, 10);
    const iso = {
      label,
      massNumber,
      neutrons: massNumber - z,
      isomer: /m$/.test(label),
      main,
      abundance: abundance === 'tr' || abundance === '-' ? null : Number(abundance),
      trace: abundance === 'tr',
      synthetic: abundance === '-',
      stable: !half,
      halfLife: null,
      decay: [],
    };
    if (half) {
      const m = half.trim().match(/^(~|>)?([\d.e+]+)\s*(a|d|h|min|s|ms)$/);
      if (!m) throw new Error(`Emivita non valida per Z=${z}: "${half}"`);
      const approx = Boolean(m[1]);
      const value = Number(m[2]);
      iso.halfLife = { value, unit: m[3], approx, seconds: value * UNIT[m[3]].s, text: halfLifeText(value, m[3], approx) };
      iso.decay = (decay || '').split('/').filter(Boolean).map((code) => {
        if (!DECAY[code]) throw new Error(`Decadimento sconosciuto per Z=${z}: "${code}"`);
        return { code, symbol: DECAY_SHORT[code], label: DECAY[code] };
      });
    }
    return iso;
  });
  return list.sort((a, b) => a.massNumber - b.massNumber || a.label.localeCompare(b.label));
}

// ---------------------------------------------------------------- stato fisico
function physicalState(z, pc, c) {
  if (z >= 100) return { state: 'unknown', statePredicted: c.statePred || 'solido' };
  const s = (pc.StandardState || '').toLowerCase();
  if (s.includes('gas')) return { state: 'gas', statePredicted: null };
  if (s.includes('liquid')) return { state: 'liquid', statePredicted: null };
  return { state: 'solid', statePredicted: null };
}

// ---------------------------------------------------------------- build
const errors = [];
const warnings = [];
const elements = [];

for (let z = 1; z <= 118; z++) {
  const pc = pubchem.get(z);
  const c = curated[z];
  if (!pc) { errors.push(`Z=${z}: manca in PubChem`); continue; }
  if (!c) { errors.push(`Z=${z}: mancano i dati curati`); continue; }
  for (const key of ['name', 'cat', 'm', 'ox', 'iso', 'year', 'by', 'orig', 'uses', 'occ']) {
    if (c[key] === undefined || c[key] === '') errors.push(`Z=${z}: campo curato mancante "${key}"`);
  }
  if (!CATEGORIES.includes(c.cat)) errors.push(`Z=${z}: categoria non valida "${c.cat}"`);

  const pos = position(z);
  const isotopes = parseIsotopes(c.iso, z);
  const mains = isotopes.filter((i) => i.main);
  if (mains.length !== 1) errors.push(`Z=${z}: serve esattamente un isotopo principale (*)`);
  const main = mains[0] || isotopes[0];

  const natural = isotopes.filter((i) => i.abundance !== null);
  if (natural.length) {
    const sum = natural.reduce((s, i) => s + i.abundance, 0);
    if (sum < 98.5 || sum > 100.5) warnings.push(`Z=${z}: somma abbondanze ${sum.toFixed(3)}%`);
  }

  const shellList = shells(z);
  if (shellList.reduce((a, b) => a + b, 0) !== z) errors.push(`Z=${z}: elettroni per guscio non tornano`);

  const massText = c.m;
  const isMassNumber = massText.startsWith('[');
  const { state, statePredicted } = physicalState(z, pc, c);

  // Campi stimati o previsti
  const estimated = new Set(c.estimated || []);
  if (z >= 100) ['mp', 'state'].forEach((k) => estimated.add(k));
  if (z >= 104) ['config', 'd', 'ie', 'ox', 'state'].forEach((k) => estimated.add(k));
  if (c.cat === 'unknown') estimated.add('category');

  const mp = pick(c, 'mp', num(pc.MeltingPoint));
  const bp = pick(c, 'bp', num(pc.BoilingPoint));
  let density = pick(c, 'd', num(pc.Density));
  if (z === 1) density = 0.00008988;

  const dataQuality = z >= 104 ? 'predicted' : estimated.size ? 'partial' : 'measured';

  elements.push({
    z,
    symbol: pc.Symbol,
    name: c.name,
    nameEn: pc.Name,
    atomicMass: {
      text: massText,
      value: isMassNumber ? Number(massText.slice(1, -1)) : Number(massText),
      isMassNumber,
    },
    category: c.cat,
    predictedCategory: c.predCat || null,
    group: pos.group,
    period: pos.period,
    block: blockOf(z, pos.group),
    grid: { x: pos.x, y: pos.y },
    protons: z,
    neutrons: main.neutrons,
    electrons: z,
    mainIsotope: main.label,
    mainIsotopeKind: main.stable || main.abundance !== null ? 'abundant' : 'most-stable',
    electronConfiguration: { full: fullConfiguration(z), short: shortConfiguration(z) },
    shells: shellList,
    state,
    statePredicted,
    meltingPointK: mp,
    boilingPointK: bp,
    sublimationPointK: c.sub ?? null,
    meltingNote: c.mpNote ?? null,
    densityGcm3: density,
    densityNote: c.dNote ?? null,
    electronegativity: pick(c, 'en', num(pc.Electronegativity)),
    vdwRadiusPm: num(pc.AtomicRadius),
    covalentRadiusPm: c.cr ?? null,
    ionizationEnergyEv: pick(c, 'ie', num(pc.IonizationEnergy)),
    electronAffinityEv: num(pc.ElectronAffinity),
    oxidationStates: c.ox.split(',').map((s) => s.trim()).filter(Boolean),
    isotopes,
    discovery: { year: c.year, by: c.by },
    nameOrigin: c.orig,
    uses: c.uses,
    occurrence: c.occ,
    cpkColor: pc.CPKHexColor ? `#${pc.CPKHexColor}` : null,
    dataQuality,
    estimated: [...estimated].sort(),
  });
}

if (warnings.length) console.warn('Avvisi:\n  ' + warnings.join('\n  '));
if (errors.length) {
  console.error('Errori:\n  ' + errors.join('\n  '));
  process.exit(1);
}

const output = {
  meta: {
    description: 'Dati dei 118 elementi per Tavola Periodica 3D',
    generatedAt: new Date().toISOString().slice(0, 10),
    sources: [
      'IUPAC/CIAAW — pesi atomici standard (valori abbreviati); numero di massa dell\'isotopo più stabile tra parentesi quadre',
      'PubChem (NCBI) — Periodic Table of Elements: punti di fusione/ebollizione, densità, elettronegatività, raggi di van der Waals',
      'NIST Atomic Spectra Database — energie di prima ionizzazione e configurazioni elettroniche',
      'IUPAC / NUBASE2020 — composizione isotopica naturale ed emivite',
      'Cordero et al., Dalton Trans. 2008 — raggi covalenti',
    ],
    units: {
      meltingPointK: 'K', boilingPointK: 'K', densityGcm3: 'g/cm³ (gas: g/cm³ a 0 °C, 1 atm)',
      vdwRadiusPm: 'pm', covalentRadiusPm: 'pm', ionizationEnergyEv: 'eV', electronAffinityEv: 'eV',
    },
  },
  elements,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(output, null, 1) + '\n');
console.log(`OK: ${elements.length} elementi → ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
