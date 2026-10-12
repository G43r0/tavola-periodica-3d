// Nomi generati per ioni monoatomici e composti ionici non presenti in libreria
// (nomenclatura tradizionale italiana; numero di ossidazione di Stock per i metalli con più cariche).
// In inglese si usa la nomenclatura IUPAC inglese: iron(III) chloride, dinitrogen pentoxide, hexane.
import { isItalian } from '../../i18n/index.js';

const ANION_EN = {
  H: 'hydride', B: 'boride', C: 'carbide', N: 'nitride', O: 'oxide', F: 'fluoride', Si: 'silicide', P: 'phosphide',
  S: 'sulfide', Cl: 'chloride', As: 'arsenide', Se: 'selenide', Br: 'bromide', Te: 'telluride', I: 'iodide', At: 'astatide',
};
const PREFIX_EN = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca', 'undeca', 'dodeca'];
const capital = (s) => s.replace(/^./, (c) => c.toUpperCase());

const ANION = {
  H: 'idruro', B: 'boruro', C: 'carburo', N: 'nitruro', O: 'ossido', F: 'fluoruro', Si: 'siliciuro', P: 'fosfuro',
  S: 'solfuro', Cl: 'cloruro', As: 'arseniuro', Se: 'seleniuro', Br: 'bromuro', Te: 'tellururo', I: 'ioduro', At: 'astaturo',
};
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** Nome dello ione monoatomico (es. "cloruro", "sodio", "ferro(III)"). */
export function ionName(info, charge) {
  if (!isItalian() && charge < 0) return ANION_EN[info.symbol] ?? `${info.name.toLowerCase()} anion`;
  if (charge < 0) return ANION[info.symbol] ?? `ione ${info.name.toLowerCase()}`;
  const name = info.name.toLowerCase();
  const several = info.valences.filter((v) => v > 0).length > 1;
  return several ? `${name}(${ROMAN[charge] ?? charge})` : name;
}

// Ordine IUPAC per i composti binari tra non metalli: si nomina come "anione" l'elemento che viene dopo.
const SEQUENCE = ['Rn', 'Xe', 'Kr', 'Ar', 'Ne', 'He', 'B', 'Si', 'C', 'Sb', 'As', 'P', 'N', 'H', 'Te', 'Se', 'S', 'At', 'I', 'Br', 'Cl', 'O', 'F'];
const PREFIX = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'esa', 'epta', 'otta', 'nona', 'deca', 'undeca', 'dodeca'];

/** Prefisso numerico; con «ossido» si elide la vocale: tetra + ossido → tetrossido, mono + ossido → monossido. */
function prefixed(n, word, { mono = false } = {}) {
  const p = n === 1 && !mono ? '' : PREFIX[n] ?? `${n}-`;
  if (word === 'ossido' && /[ao]$/.test(p)) return p.slice(0, -1) + word;
  return p + word;
}

/**
 * Nome sistematico di una molecola binaria non in libreria (es. PCl₅ → pentacloruro di fosforo, N₂O₅ →
 * pentossido di diazoto). Restituisce null se non è un composto binario tra non metalli.
 * @param {Map<object, number>} counts info dell'elemento → numero di atomi
 */
export function binaryCovalentName(counts) {
  if (counts.size !== 2) return null;
  const [[A, a], [B, b]] = [...counts].sort(([x], [y]) => rank(x) - rank(y));
  if (A.metal && B.metal) return null;
  if (new Set([A.symbol, B.symbol]).size === 2 && [A.symbol, B.symbol].every((s) => s === 'C' || s === 'H')) return null; // idrocarburi
  if (!isItalian()) {
    const anionEn = ANION_EN[B.symbol];
    if (!anionEn) return null;
    const pre = (n, word, mono = false) => {
      const p = n === 1 && !mono ? '' : PREFIX_EN[n] ?? `${n}-`;
      return word === 'oxide' && /[ao]$/.test(p) ? p.slice(0, -1) + word : p + word;
    };
    return capital(`${pre(a, A.name.toLowerCase())} ${pre(b, anionEn, b === 1 && anionEn === 'oxide')}`);
  }
  const anion = ANION[B.symbol];
  if (!anion) return null;
  const name = `${prefixed(b, anion, { mono: b === 1 && anion === 'ossido' })} di ${prefixed(a, A.name.toLowerCase())}`;
  return name.replace(/^./, (c) => c.toUpperCase());
}

function rank(info) {
  const k = SEQUENCE.indexOf(info.symbol);
  return k < 0 ? -1 : k; // i metalli vengono prima di tutti
}

/**
 * Nome di un composto ionico dai suoi frammenti.
 * @param {{info:object|null, charge:number, libraryName:string|null}[]} parts frammenti con carica
 */
export function ionicCompoundName(parts) {
  if (!isItalian()) {
    const stripEn = (n) => n.replace(/ ion$/i, '').toLowerCase();
    const namesEn = (list) => [...new Set(list.map((p) => (p.libraryName ? stripEn(p.libraryName) : p.info ? ionName(p.info, p.charge) : '?')))];
    const an = namesEn(parts.filter((p) => p.charge < 0));
    const cat = namesEn(parts.filter((p) => p.charge > 0));
    if (!an.length || !cat.length) return null;
    return capital(`${cat.join(' ')} ${an.join(' ')}`);
  }
  const strip = (n) => n.replace(/^Ione /i, '').toLowerCase();
  const names = (list) => [...new Set(list.map((p) => (p.libraryName ? strip(p.libraryName) : p.info ? ionName(p.info, p.charge) : '?')))];
  const anions = names(parts.filter((p) => p.charge < 0));
  const cations = names(parts.filter((p) => p.charge > 0));
  if (!anions.length || !cations.length) return null;
  return `${anions.join(' e ')} di ${cations.join(' e ')}`.replace(/^./, (c) => c.toUpperCase());
}

const ALKANE_EN = {
  1: 'methane', 2: 'ethane', 3: 'propane', 4: 'butane', 5: 'pentane', 6: 'hexane', 7: 'heptane', 8: 'octane', 9: 'nonane', 10: 'decane',
  11: 'undecane', 12: 'dodecane', 13: 'tridecane', 14: 'tetradecane', 15: 'pentadecane', 16: 'hexadecane', 17: 'heptadecane',
  18: 'octadecane', 19: 'nonadecane', 20: 'icosane', 30: 'triacontane', 40: 'tetracontane',
};

const ALKANE = {
  1: 'metano', 2: 'etano', 3: 'propano', 4: 'butano', 5: 'pentano', 6: 'esano', 7: 'eptano', 8: 'ottano', 9: 'nonano', 10: 'decano',
  11: 'undecano', 12: 'dodecano', 13: 'tridecano', 14: 'tetradecano', 15: 'pentadecano', 16: 'esadecano', 17: 'eptadecano',
  18: 'ottadecano', 19: 'nonadecano', 20: 'icosano', 30: 'triacontano', 40: 'tetracontano',
};

/**
 * Nome di un alcano a catena lineare (CₙH₂ₙ₊₂ senza ramificazioni né anelli), o null.
 * @param {{z:number}[]} atoms
 * @param {{i:number,j:number,order:number}[]} bonds
 */
export function linearAlkaneName(atoms, bonds) {
  const c = atoms.filter((a) => a.z === 6).length;
  const h = atoms.filter((a) => a.z === 1).length;
  if (!c || c + h !== atoms.length || h !== 2 * c + 2 || bonds.length !== atoms.length - 1 || bonds.some((b) => b.order !== 1)) return null;
  const carbonNeighbours = atoms.map(() => 0);
  for (const b of bonds) {
    if (atoms[b.i].z === 6 && atoms[b.j].z === 6) {
      carbonNeighbours[b.i]++;
      carbonNeighbours[b.j]++;
    }
  }
  if (carbonNeighbours.some((k) => k > 2)) return null; // ramificato
  const name = isItalian() ? ALKANE[c] ?? `alcano lineare a ${c} atomi di carbonio` : ALKANE_EN[c] ?? `linear alkane with ${c} carbon atoms`;
  return name.replace(/^./, (x) => x.toUpperCase());
}
