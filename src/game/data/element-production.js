// Come si ottiene davvero ogni elemento (libro «Come si fa», capitolo «Ottenere gli elementi»): una voce per Z con
//   way: la via principale — 'native' (si trova libero in natura), 'air' (distillazione dell'aria liquida), 'industry'
//        (impianto chimico o metallurgico), 'electrolysis' (elettrolisi, anche dei sali fusi), 'byproduct' (sottoprodotto
//        della lavorazione di altri minerali o del gas naturale), 'reactor' (reattore nucleare), 'accelerator'
//        (acceleratore di particelle), 'decay' (raccolto dal decadimento di altri elementi);
//   it / en: due o tre frasi su fonte e processo.
// Fonti: CRC Handbook of Chemistry and Physics, sezione 4 «The Elements»; N. N. Greenwood, A. Earnshaw, Chemistry of
// the Elements, 2ª ed. (1997); per gli elementi 101–118 i rapporti IUPAC/IUPAP sulla loro scoperta.
import a from './production-001-040.js';
import b from './production-041-080.js';
import c from './production-081-118.js';

export const PRODUCTION_WAYS = ['native', 'air', 'industry', 'electrolysis', 'byproduct', 'reactor', 'accelerator', 'decay'];

export const PRODUCTION = { ...a, ...b, ...c };
