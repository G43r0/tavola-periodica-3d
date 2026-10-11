// Categorie chimiche: etichette italiane e colori (vedi --cat-* in tokens.css).

export const CATEGORIES = [
  { key: 'alkali', short: 'Alcalini', label: 'Metalli alcalini', singular: 'Metallo alcalino', color: '#ff6b7a' },
  { key: 'alkaline-earth', short: 'Alcalino-terrosi', label: 'Metalli alcalino-terrosi', singular: 'Metallo alcalino-terroso', color: '#ffa24c' },
  { key: 'transition', short: 'Transizione', label: 'Metalli di transizione', singular: 'Metallo di transizione', color: '#f5c84b' },
  { key: 'post-transition', short: 'Post-transizione', label: 'Metalli post-transizione', singular: 'Metallo post-transizione', color: '#8fd462' },
  { key: 'metalloid', short: 'Metalloidi', label: 'Metalloidi (semimetalli)', singular: 'Metalloide', color: '#3ccf91' },
  { key: 'nonmetal', short: 'Non metalli', label: 'Non metalli', singular: 'Non metallo', color: '#4ea8ff' },
  { key: 'halogen', short: 'Alogeni', label: 'Alogeni', singular: 'Alogeno', color: '#36d6d6' },
  { key: 'noble-gas', short: 'Gas nobili', label: 'Gas nobili', singular: 'Gas nobile', color: '#9b8cff' },
  { key: 'lanthanide', short: 'Lantanidi', label: 'Lantanidi', singular: 'Lantanide', color: '#ff7ec8' },
  { key: 'actinide', short: 'Attinidi', label: 'Attinidi', singular: 'Attinide', color: '#d77bff' },
  { key: 'unknown', short: 'Sconosciute', label: 'Proprietà chimiche sconosciute', singular: 'Proprietà sconosciute', color: '#8a96a8' },
];

export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const STATES = [
  { key: 'all', label: 'Tutti' },
  { key: 'solid', label: 'Solido', icon: 'solid' },
  { key: 'liquid', label: 'Liquido', icon: 'liquid' },
  { key: 'gas', label: 'Gas', icon: 'gas' },
  { key: 'unknown', label: 'Sconosciuto', icon: 'unknown' },
];

export const STATE_LABEL = {
  solid: 'Solido',
  liquid: 'Liquido',
  gas: 'Gassoso',
  unknown: 'Sconosciuto',
};

export const BLOCKS = [
  { key: 's', label: 'Blocco s', hint: 'Ultimo elettrone in un orbitale s (gruppi 1–2 ed elio)' },
  { key: 'p', label: 'Blocco p', hint: 'Ultimo elettrone in un orbitale p (gruppi 13–18)' },
  { key: 'd', label: 'Blocco d', hint: 'Orbitali d in riempimento (gruppi 3–12)' },
  { key: 'f', label: 'Blocco f', hint: 'Orbitali f in riempimento (lantanidi e attinidi)' },
];

export const SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
