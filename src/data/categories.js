// Categorie chimiche: etichette nella lingua dell'interfaccia e colori (vedi --cat-* in tokens.css).
import { pick } from '../i18n/index.js';

const L = (it, en, eli6) => pick({ it, en, eli6 });

export const CATEGORIES = [
  { key: 'alkali', short: L('Alcalini', 'Alkali'), label: L('Metalli alcalini', 'Alkali metals'), singular: L('Metallo alcalino', 'Alkali metal'), color: '#ff6b7a' },
  { key: 'alkaline-earth', short: L('Alcalino-terrosi', 'Alkaline earth'), label: L('Metalli alcalino-terrosi', 'Alkaline earth metals'), singular: L('Metallo alcalino-terroso', 'Alkaline earth metal'), color: '#ffa24c' },
  { key: 'transition', short: L('Transizione', 'Transition'), label: L('Metalli di transizione', 'Transition metals'), singular: L('Metallo di transizione', 'Transition metal'), color: '#f5c84b' },
  { key: 'post-transition', short: L('Post-transizione', 'Post-transition'), label: L('Metalli post-transizione', 'Post-transition metals'), singular: L('Metallo post-transizione', 'Post-transition metal'), color: '#8fd462' },
  { key: 'metalloid', short: L('Metalloidi', 'Metalloids'), label: L('Metalloidi (semimetalli)', 'Metalloids (semimetals)', 'Metalloidi (un po\' metalli e un po\' no)'), singular: L('Metalloide', 'Metalloid'), color: '#3ccf91' },
  { key: 'nonmetal', short: L('Non metalli', 'Nonmetals'), label: L('Non metalli', 'Nonmetals'), singular: L('Non metallo', 'Nonmetal'), color: '#4ea8ff' },
  { key: 'halogen', short: L('Alogeni', 'Halogens'), label: L('Alogeni', 'Halogens'), singular: L('Alogeno', 'Halogen'), color: '#36d6d6' },
  { key: 'noble-gas', short: L('Gas nobili', 'Noble gases'), label: L('Gas nobili', 'Noble gases'), singular: L('Gas nobile', 'Noble gas'), color: '#9b8cff' },
  { key: 'lanthanide', short: L('Lantanidi', 'Lanthanides'), label: L('Lantanidi', 'Lanthanides'), singular: L('Lantanide', 'Lanthanide'), color: '#ff7ec8' },
  { key: 'actinide', short: L('Attinidi', 'Actinides'), label: L('Attinidi', 'Actinides'), singular: L('Attinide', 'Actinide'), color: '#d77bff' },
  { key: 'unknown', short: L('Sconosciute', 'Unknown'), label: L('Proprietà chimiche sconosciute', 'Unknown chemical properties', 'Non sappiamo ancora come si comportano'), singular: L('Proprietà sconosciute', 'Unknown properties', 'Comportamento sconosciuto'), color: '#8a96a8' },
];

export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const STATES = [
  { key: 'all', label: L('Tutti', 'All') },
  { key: 'solid', label: L('Solido', 'Solid'), icon: 'solid' },
  { key: 'liquid', label: L('Liquido', 'Liquid'), icon: 'liquid' },
  { key: 'gas', label: L('Gas', 'Gas'), icon: 'gas' },
  { key: 'unknown', label: L('Sconosciuto', 'Unknown', 'Non si sa'), icon: 'unknown' },
];

export const STATE_LABEL = {
  solid: L('Solido', 'Solid'),
  liquid: L('Liquido', 'Liquid'),
  gas: L('Gassoso', 'Gas'),
  unknown: L('Sconosciuto', 'Unknown', 'Non si sa'),
};

export const BLOCKS = [
  { key: 's', label: L('Blocco s', 's-block'), hint: L('Ultimo elettrone in un orbitale s (gruppi 1–2 ed elio)', 'Last electron in an s orbital (groups 1–2 and helium)', "L'ultimo elettrone sta in una «stanza» di tipo s (prime due colonne ed elio)") },
  { key: 'p', label: L('Blocco p', 'p-block'), hint: L('Ultimo elettrone in un orbitale p (gruppi 13–18)', 'Last electron in a p orbital (groups 13–18)', "L'ultimo elettrone sta in una «stanza» di tipo p (le sei colonne a destra)") },
  { key: 'd', label: L('Blocco d', 'd-block'), hint: L('Orbitali d in riempimento (gruppi 3–12)', 'd orbitals being filled (groups 3–12)', 'Si riempiono le «stanze» di tipo d (le colonne in mezzo)') },
  { key: 'f', label: L('Blocco f', 'f-block'), hint: L('Orbitali f in riempimento (lantanidi e attinidi)', 'f orbitals being filled (lanthanides and actinides)', 'Si riempiono le «stanze» di tipo f (le due righe in basso)') },
];

export const SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
