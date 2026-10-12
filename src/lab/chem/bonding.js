// Regole per formare, cambiare o rompere legami, con il motivo (nella lingua dell'interfaccia) quando non si può.
import { analyzeLewis, usesOctet, octetTarget } from './lewis.js';
import { TIER } from './elements-lab.js';
import { createT, isItalian } from '../../i18n/index.js';

const t = createT({
  it: {
    unknown: 'sconosciuto',
    ionic: 'ionico',
    nonpolar: 'covalente apolare',
    polar: 'covalente polare',
    order: ['ionico', 'singolo', 'doppio', 'triplo'],
    hOne: "L'idrogeno ha un solo elettrone: forma un solo legame.",
    noble: '{X} è un gas nobile: il suo guscio esterno è già completo e non forma legami.',
    noCovalent: '{X} non forma legami covalenti in questo modello.',
    fluorine: 'Il fluoro forma un solo legame (gli manca un solo elettrone per l\'ottetto).',
    maxBonds: (p) => `${p.X} ha già ${p.cur} legam${p.cur === 1 ? 'e' : 'i'}: al massimo ne può formare ${p.max}.`,
    same: 'Scegli due atomi diversi.',
    already: 'Questi atomi sono già legati: fai clic sul legame per cambiarne l\'ordine.',
    metallic: 'Tra due metalli si forma un legame metallico: gli elettroni sono condivisi da tutto il reticolo, non tra due atomi. Il banco non lo simula.',
    gaveAll: '{X} ha già ceduto tutti i suoi elettroni di valenza.',
    fullOctet: '{X} ha già l\'ottetto completo: non può accettare altri elettroni.',
    dative: '{X} ha già l\'ottetto completo. Un altro legame è possibile solo se l\'altro atomo arriva senza elettroni e usa una coppia solitaria (legame dativo): ad esempio con lo ione H⁺ — seleziona l\'idrogeno e premi −e⁻ — si forma NH₄⁺.',
    unknownChem: 'Chimica sconosciuta: per gli elementi superpesanti i legami non sono mai stati osservati.',
    unverified: 'Struttura non verificata: per i metalli d e f le regole di valenza semplici non bastano.',
    ionicOrder: 'Un legame ionico non ha un ordine: è l\'attrazione tra due ioni.',
    hSingle: "L'idrogeno forma solo legami singoli.",
    orderMax: '{X} non può avere legami per un totale di {n} (massimo {max}).',
  },
  en: {
    unknown: 'unknown',
    ionic: 'ionic',
    nonpolar: 'nonpolar covalent',
    polar: 'polar covalent',
    order: ['ionic', 'single', 'double', 'triple'],
    hOne: 'Hydrogen has only one electron: it forms only one bond.',
    noble: '{X} is a noble gas: its outer shell is already full and it forms no bonds.',
    noCovalent: '{X} forms no covalent bonds in this model.',
    fluorine: 'Fluorine forms only one bond (it lacks just one electron for the octet).',
    maxBonds: (p) => `${p.X} already has ${p.cur} bond${p.cur === 1 ? '' : 's'}: it can form at most ${p.max}.`,
    same: 'Choose two different atoms.',
    already: 'These atoms are already bonded: click the bond to change its order.',
    metallic: 'Two metals form a metallic bond: the electrons are shared by the whole lattice, not between two atoms. The bench does not simulate it.',
    gaveAll: '{X} has already given away all its valence electrons.',
    fullOctet: '{X} already has a full octet: it cannot accept more electrons.',
    dative: '{X} already has a full octet. Another bond is possible only if the other atom arrives without electrons and uses a lone pair (dative bond): for example with the H⁺ ion — select the hydrogen and press −e⁻ — NH₄⁺ forms.',
    unknownChem: 'Unknown chemistry: bonds of superheavy elements have never been observed.',
    unverified: 'Structure not verified: for d and f metals simple valence rules are not enough.',
    ionicOrder: 'An ionic bond has no order: it is the attraction between two ions.',
    hSingle: 'Hydrogen forms only single bonds.',
    orderMax: '{X} cannot have bonds adding up to {n} (maximum {max}).',
  },
  eli6: {
    hOne: "L'idrogeno ha un solo elettrone, quindi può tenere per mano un solo atomo alla volta.",
    noble: '{X} è un gas nobile: è già «completo» e non ha bisogno di legarsi con nessuno.',
    fluorine: 'Il fluoro può fare un solo legame: gli manca un solo elettrone per essere completo.',
    maxBonds: (p) => `${p.X} ha già ${p.cur} legam${p.cur === 1 ? 'e' : 'i'}, e più di ${p.max} non ne può fare: ha finito le «mani».`,
    already: 'Questi due atomi sono già attaccati. Clicca il legame per renderlo doppio o triplo.',
    metallic: 'Due metalli non si legano a coppie: nei metalli gli elettroni sono condivisi da tutti gli atomi insieme. Qui non si può fare.',
    gaveAll: '{X} ha già regalato tutti gli elettroni che poteva dare.',
    fullOctet: '{X} è già completo (ha 8 elettroni intorno): non ne accetta altri.',
    unknownChem: 'Nessuno ha mai visto questo elemento legarsi: questo legame è solo un\'ipotesi.',
    unverified: 'Attenzione: per questi metalli le regole semplici non bastano, la struttura potrebbe non essere quella vera.',
    ionicOrder: 'Questo legame è diverso: non è una stretta di mano, ma due atomi con cariche opposte che si attirano come calamite.',
    hSingle: "L'idrogeno ha una sola «mano»: può fare solo legami singoli.",
  },
});

const art = (info) => {
  const name = info.name.toLowerCase();
  if (!isItalian()) return name;
  // articolo determinativo per il nome dell'elemento (l'idrogeno, il sodio, lo zolfo…)
  if (/^(z|s[^aeiou]|gn|ps|x|y|i[aeiou])/.test(name)) return `lo ${name}`;
  if (/^[aeiouh]/.test(name)) return `l'${name}`;
  return `il ${name}`;
};
const Art = (info) => art(info).replace(/^./, (c) => c.toUpperCase());

/** Carattere del legame dalla differenza di elettronegatività (scala di Pauling). */
export function bondCharacter(A, B) {
  if (A.en == null || B.en == null) return { dEN: null, type: t('unknown'), ionic: false };
  const dEN = Math.abs(A.en - B.en);
  const metalNonmetal = (A.metal && !B.metal && !B.nobleGas) || (B.metal && !A.metal && !A.nobleGas);
  if (dEN > 1.7 && metalNonmetal) return { dEN, type: t('ionic'), ionic: true };
  return { dEN, type: dEN < 0.4 ? t('nonpolar') : t('polar'), ionic: false, polar: dEN >= 0.4 };
}

/** Elettroni che un metallo può ancora cedere. */
export function donorCapacity(bench, lab, id) {
  const info = lab.get(bench.atoms.get(id).z);
  const total = info.tier === TIER.MAIN ? info.V : info.maxBonds;
  return total - bench.ionicGiven(id) - bench.covalentValence(id) + bench.atoms.get(id).extra;
}

/** Elettroni che mancano all'atomo per completare l'ottetto, nel suo frammento covalente. */
export function acceptorDeficit(bench, lab, id) {
  const info = lab.get(bench.atoms.get(id).z);
  if (!usesOctet(info) || info.nobleGas) return 0;
  const frag = bench.unitOf(id, false);
  const d = bench.describe(frag);
  const lw = analyzeLewis(lab, d.atoms, d.bonds);
  const a = lw.atoms[frag.indexOf(id)];
  return Math.max(0, octetTarget(info) - a.electronsAround);
}

function lewisAfter(bench, lab, ids, extraBond) {
  const d = bench.describe(ids);
  const bonds = d.bonds.map((b) => ({ ...b }));
  if (extraBond) {
    const i = ids.indexOf(extraBond.a);
    const j = ids.indexOf(extraBond.b);
    const existing = bonds.find((b) => (b.i === i && b.j === j) || (b.i === j && b.j === i));
    if (existing) existing.order = extraBond.order;
    else bonds.push({ i, j, order: extraBond.order });
  }
  return analyzeLewis(lab, d.atoms, bonds);
}

function maxBondsReason(info, current) {
  if (info.z === 1) return t('hOne');
  if (info.maxBonds === 0) return info.nobleGas ? t('noble', { X: Art(info) }) : t('noCovalent', { X: Art(info) });
  if (info.z === 9) return t('fluorine');
  return t('maxBonds', { X: Art(info), cur: current, max: info.maxBonds });
}

/**
 * Si può legare l'atomo a con l'atomo b?
 * @returns {{ok:boolean, reason?:string, kind?:'covalent'|'ionic', transfer?:number, donor?:number, character?:object, warning?:string}}
 */
export function checkBond(bench, lab, a, b) {
  if (a === b) return { ok: false, reason: t('same') };
  const A = lab.get(bench.atoms.get(a).z);
  const B = lab.get(bench.atoms.get(b).z);
  const existing = bench.bondBetween(a, b);
  if (existing && !existing.ionic) return { ok: false, reason: t('already') };

  for (const X of [A, B]) {
    if (X.maxBonds === 0 && X.nobleGas) return { ok: false, reason: maxBondsReason(X, 0) };
  }
  if (A.metal && B.metal) {
    return { ok: false, reason: t('metallic') };
  }

  const character = bondCharacter(A, B);
  if (character.ionic) {
    const donor = A.metal ? a : b;
    const acceptor = donor === a ? b : a;
    const D = lab.get(bench.atoms.get(donor).z);
    const C = lab.get(bench.atoms.get(acceptor).z);
    const give = donorCapacity(bench, lab, donor);
    if (give <= 0) return { ok: false, reason: t('gaveAll', { X: Art(D) }) };
    const deficit = acceptorDeficit(bench, lab, acceptor);
    if (deficit <= 0) return { ok: false, reason: t('fullOctet', { X: Art(C) }) };
    const transfer = Math.min(give, deficit);
    return { ok: true, kind: 'ionic', transfer, donor, character };
  }

  for (const [X, id] of [[A, a], [B, b]]) {
    const cur = bench.covalentValence(id);
    if (cur + 1 > X.maxBonds) return { ok: false, reason: maxBondsReason(X, cur) };
  }
  const ids = [...new Set([...bench.unitOf(a, false), ...bench.unitOf(b, false)])];
  const lw = lewisAfter(bench, lab, ids, { a, b, order: 1 });
  if (lw.invalid) {
    // ottetto già completo (es. NH₃ + H): serve un legame dativo con uno ione senza elettroni (H⁺)
    const full = [[A, a], [B, b]].find(([X, id]) => usesOctet(X) && X.period === 2 && fullOctet(bench, lab, id));
    if (full) {
      return { ok: false, reason: t('dative', { X: Art(full[0]) }) };
    }
    return { ok: false, reason: lw.invalid };
  }
  let warning;
  const tier = Math.max(A.tier, B.tier);
  if (tier === TIER.UNKNOWN) warning = t('unknownChem');
  else if (tier === TIER.UNVERIFIED) warning = t('unverified');
  return { ok: true, kind: 'covalent', character, warning };
}

function fullOctet(bench, lab, id) {
  const frag = bench.unitOf(id, false);
  const d = bench.describe(frag);
  const lw = analyzeLewis(lab, d.atoms, d.bonds);
  return lw.atoms[frag.indexOf(id)].electronsAround >= 8 && frag.length > 1;
}

/** Si può portare il legame all'ordine indicato (1, 2, 3)? */
export function checkOrder(bench, lab, bondId, order) {
  const bond = bench.bonds.get(bondId);
  if (!bond || bond.ionic) return { ok: false, reason: t('ionicOrder') };
  const A = lab.get(bench.atoms.get(bond.a).z);
  const B = lab.get(bench.atoms.get(bond.b).z);
  if (order > 1 && (A.z === 1 || B.z === 1)) return { ok: false, reason: t('hSingle') };
  const delta = order - bond.order;
  for (const [X, id] of [[A, bond.a], [B, bond.b]]) {
    const cur = bench.covalentValence(id);
    if (cur + delta > X.maxBonds) {
      return { ok: false, reason: t('orderMax', { X: Art(X), n: cur + delta, max: X.maxBonds }) };
    }
  }
  const ids = bench.unitOf(bond.a, false);
  const lw = lewisAfter(bench, lab, ids, { a: bond.a, b: bond.b, order });
  if (lw.invalid) return { ok: false, reason: lw.invalid };
  return { ok: true };
}

export const ORDER_NAME = { ...t('order') };
export { art, Art };
