// Reagenti del magazzino: per ogni reagente il contenitore giusto, la famiglia chimica (il colore del tappo e della
// fascia dell'etichetta) e i pericoli dell'etichetta (pittogrammi GHS e avvertenza). Modulo puro (niente DOM).
//
// Pericoli: per i reagenti dello scaffale sono quelli delle schede di sicurezza (reagents.js, `curated`); per le altre
// sostanze del magazzino sono dedotti dai dati della sandbox (infiammabile, esplosivo, ossidante, reattivo con l'acqua),
// dalla forza di acidi e basi e dai metalli pesanti, quindi sono indicativi.
import { S } from '../sandbox/substances.js';
import { LIGHT_SENSITIVE } from './reagents.js';
import { GHS_IDS } from './ghs.js';

/** Colore del tappo per famiglia: un codice del laboratorio della scuola, spiegato dalla legenda sullo scaffale. */
export const FAMILIES = {
  acid: '#d8343c',
  base: '#2f6fd1',
  salt: '#eef0f2',
  inorganic: '#eef0f2',
  oxidizer: '#f2c014',
  metal: '#858e98',
  organic: '#2f9a4c',
  indicator: '#8a4fd1',
  water: '#7cc8ff',
};
/** Ordine sullo scaffale e nella legenda (le famiglie con lo stesso colore compaiono una volta). */
export const FAMILY_ORDER = ['acid', 'base', 'salt', 'inorganic', 'oxidizer', 'metal', 'organic', 'indicator', 'water'];

// elementi che nella libreria sono molecole (I₂, Br₂): chiave dell'elemento → chiave della libreria
const LIBRARY_KEY = { I: 'i2', Br: 'br2' };
const ORGANIC_GROUPS = new Set(['idrocarburi', 'organiche', 'biomolecole', 'farmaci']);
const SALT_GROUPS = new Set(['ionici', 'metalli', 'alogenuri', 'lantanidi']);
// tossicità acuta (GHS06) e pericoli per la salute a lungo termine (GHS08: cancerogeni, mutageni, tossici per la
// riproduzione) dei composti di questi elementi: Hg, As, Tl, Cd, Be; Pb, Hg, Cd, Ni, Co, As, Be
const ACUTE_Z = new Set([80, 33, 81, 48, 4]);
const CMR_Z = new Set([82, 80, 48, 28, 27, 33, 4]);
const DANGER = new Set(['GHS01', 'GHS02', 'GHS03', 'GHS05', 'GHS06', 'GHS08']);
// ossidanti forti anche in soluzione; nitrati e altri sali ossidanti, diluiti, sono soluzioni di sali
export const STRONG_OXIDIZERS = ['kmno4', 'k2cr2o7', 'h2o2', 'naclo', 'kclo3', 'naclo3', 'cro3'];

/** Forma del reagente: soluzione (con molarità), liquido puro, solido. */
export function formOf(r) {
  if (r.water || r.liquid) return 'liquid';
  if (r.indicator || r.solute) return 'solution';
  return 'solid';
}

/** Sostanza principale del reagente (id del motore chimico). */
export const mainOf = (ctx, r) => (r.water ? ctx.id('water') : ctx.id(r.solute ?? r.liquid ?? r.solid));

/**
 * Famiglia chimica di una sostanza.
 * @param {object} ctx contesto chimico (createLabChemistry)
 * @param {number} sid
 * @param {string} [form] 'solid' | 'liquid' | 'solution'
 */
export function familyOf(ctx, sid, form = 'solid') {
  const s = ctx.sub(sid);
  if (!s) return 'inorganic';
  if (s.key === 'water') return 'water';
  const ab = ctx.acidBase.get(sid);
  if (ab?.sa || s.group === 'acidi' || String(s.key).startsWith('acido-')) return 'acid';
  if (ab?.sb || s.key === 'nh3') return 'base';
  const f = ctx.P.flags[sid];
  if (f & S.OXIDIZER && (form !== 'solution' || STRONG_OXIDIZERS.includes(s.key))) return 'oxidizer';
  if (s.kind === 'element') return f & S.METAL ? 'metal' : 'inorganic';
  // prima i sali (carbonati e bicarbonati contengono carbonio, ma non sono organici)
  if (SALT_GROUPS.has(s.group)) return 'salt';
  return f & S.ORGANIC || ORGANIC_GROUPS.has(s.group) ? 'organic' : 'inorganic';
}

const strongAcidBase = (ctx, sid) => {
  const ab = ctx.acidBase.get(sid);
  return Boolean(ab?.sa || ab?.sb);
};

/** Contenitore: vetro chiaro, vetro ambrato per ciò che la luce decompone, plastica (HDPE) per le basi forti e HF. */
export function containerFor(ctx, r) {
  if (r.water) return 'washbottle';
  if (r.indicator) return 'dropper';
  const sid = mainOf(ctx, r);
  const key = ctx.sub(sid)?.key;
  const base = ctx.acidBase.get(sid)?.sb;
  const dark = LIGHT_SENSITIVE.includes(key) || LIGHT_SENSITIVE.includes(LIBRARY_KEY[key]);
  if (formOf(r) === 'solid') return base ? 'jar' : dark ? 'jarAmber' : 'jarGlass';
  if (base || key === 'hf') return 'bottlePE';
  return dark ? 'bottle' : 'bottleClear';
}

/**
 * Pericoli dedotti dai dati (sostanze senza scheda): pittogrammi e avvertenza.
 * @param {object} ctx
 * @param {number} sid
 * @param {{form: string, molar?: number}} opts
 */
export function derivedHazards(ctx, sid, { form, molar = 0 }) {
  const s = ctx.sub(sid);
  const f = ctx.P.flags[sid];
  const ghs = new Set();
  const solution = form === 'solution';
  if (f & S.EXPLOSIVE) ghs.add('GHS01');
  // infiammabili: liquidi, gas e solo gli elementi solidi (fosforo, zolfo, metalli in polvere); zucchero, amido e cera
  // bruciano ma non sono «solidi infiammabili» per il CLP
  if (f & S.FLAMMABLE && !solution && (s.state25 !== 'solid' || s.kind === 'element')) ghs.add('GHS02');
  if (f & S.OXIDIZER && !solution) ghs.add('GHS03');
  if (f & S.WATER_REACTIVE && s.kind === 'element') ghs.add('GHS02').add('GHS05');
  // alogeni puri: lo iodio è nocivo, il bromo (liquido) corrosivo e tossico; entrambi per l'ambiente
  if (f & S.HALOGEN && s.kind === 'element' && !solution) {
    if (s.mp > 295) ghs.add('GHS07');
    else ghs.add('GHS05').add('GHS06');
    ghs.add('GHS09');
  }
  const strong = strongAcidBase(ctx, sid) || s.key === 'hf';
  if (strong && !(solution && molar < 0.1)) ghs.add('GHS05');
  const dilute = solution && molar < 0.05;
  const zs = Object.keys(ctx.counts(sid)).map(Number);
  const formula = String(s.formula ?? s.symbol ?? '');
  if (!dilute && (zs.some((z) => ACUTE_Z.has(z)) || /CN/.test(formula) || s.key === 'hf')) ghs.add('GHS06');
  const chromate = zs.includes(24) && /CrO₄|Cr₂O₇|CrO₃/.test(formula);
  if (!dilute && (zs.some((z) => CMR_Z.has(z)) || chromate)) ghs.add('GHS08');
  if (!dilute && ctx.heavy[sid]) ghs.add('GHS09');
  const list = GHS_IDS.filter((g) => ghs.has(g));
  // una soluzione di acido o base forte sotto 1 M è soprattutto corrosiva per i metalli (H290): «Attenzione»
  const mild = list.length === 1 && list[0] === 'GHS05' && solution && molar < 1;
  const signal = !list.length ? null : !mild && list.some((g) => DANGER.has(g)) ? 'danger' : 'warning';
  return { ghs: list, signal };
}

/**
 * Aspetto completo di un reagente del magazzino.
 * @param {object} ctx contesto chimico
 * @param {object} r voce dello scaffale (reagents.js) o del magazzino del Laboratorio libero
 * @returns {{kind: string, family: string, cap: string, ghs: string[], h: string[], signal: string|null, curated: boolean, form: string}}
 */
export function reagentLook(ctx, r) {
  const form = formOf(r);
  const family = r.water ? 'water' : r.indicator ? 'indicator' : familyOf(ctx, mainOf(ctx, r), form);
  const curated = Array.isArray(r.ghs);
  const hz = curated ? { ghs: r.ghs, signal: r.ghs.length ? r.signal ?? 'warning' : null } : derivedHazards(ctx, mainOf(ctx, r), { form, molar: r.molar });
  return { kind: containerFor(ctx, r), family, cap: FAMILIES[family], ghs: hz.ghs, h: r.h ?? [], signal: hz.signal, curated, form };
}
