// Regole per formare, cambiare o rompere legami, con il motivo in italiano quando non si può.
import { analyzeLewis, usesOctet, octetTarget } from './lewis.js';
import { TIER } from './elements-lab.js';

const art = (info) => {
  // articolo determinativo per il nome dell'elemento (l'idrogeno, il sodio, lo zolfo…)
  const name = info.name.toLowerCase();
  if (/^(z|s[^aeiou]|gn|ps|x|y|i[aeiou])/.test(name)) return `lo ${name}`;
  if (/^[aeiouh]/.test(name)) return `l'${name}`;
  return `il ${name}`;
};
const Art = (info) => art(info).replace(/^./, (c) => c.toUpperCase());

/** Carattere del legame dalla differenza di elettronegatività (scala di Pauling). */
export function bondCharacter(A, B) {
  if (A.en == null || B.en == null) return { dEN: null, type: 'sconosciuto', ionic: false };
  const dEN = Math.abs(A.en - B.en);
  const metalNonmetal = (A.metal && !B.metal && !B.nobleGas) || (B.metal && !A.metal && !A.nobleGas);
  if (dEN > 1.7 && metalNonmetal) return { dEN, type: 'ionico', ionic: true };
  return { dEN, type: dEN < 0.4 ? 'covalente apolare' : 'covalente polare', ionic: false };
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
  if (info.z === 1) return "L'idrogeno ha un solo elettrone: forma un solo legame.";
  if (info.maxBonds === 0) {
    return info.nobleGas
      ? `${Art(info)} è un gas nobile: il suo guscio esterno è già completo e non forma legami.`
      : `${Art(info)} non forma legami covalenti in questo modello.`;
  }
  if (info.z === 9) return 'Il fluoro forma un solo legame (gli manca un solo elettrone per l\'ottetto).';
  return `${Art(info)} ha già ${current} legam${current === 1 ? 'e' : 'i'}: al massimo ne può formare ${info.maxBonds}.`;
}

/**
 * Si può legare l'atomo a con l'atomo b?
 * @returns {{ok:boolean, reason?:string, kind?:'covalent'|'ionic', transfer?:number, donor?:number, character?:object, warning?:string}}
 */
export function checkBond(bench, lab, a, b) {
  if (a === b) return { ok: false, reason: 'Scegli due atomi diversi.' };
  const A = lab.get(bench.atoms.get(a).z);
  const B = lab.get(bench.atoms.get(b).z);
  const existing = bench.bondBetween(a, b);
  if (existing && !existing.ionic) return { ok: false, reason: 'Questi atomi sono già legati: fai clic sul legame per cambiarne l\'ordine.' };

  for (const X of [A, B]) {
    if (X.maxBonds === 0 && X.nobleGas) return { ok: false, reason: maxBondsReason(X, 0) };
  }
  if (A.metal && B.metal) {
    return {
      ok: false,
      reason: 'Tra due metalli si forma un legame metallico: gli elettroni sono condivisi da tutto il reticolo, non tra due atomi. Il banco non lo simula.',
    };
  }

  const character = bondCharacter(A, B);
  if (character.ionic) {
    const donor = A.metal ? a : b;
    const acceptor = donor === a ? b : a;
    const D = lab.get(bench.atoms.get(donor).z);
    const C = lab.get(bench.atoms.get(acceptor).z);
    const give = donorCapacity(bench, lab, donor);
    if (give <= 0) return { ok: false, reason: `${Art(D)} ha già ceduto tutti i suoi elettroni di valenza.` };
    const deficit = acceptorDeficit(bench, lab, acceptor);
    if (deficit <= 0) return { ok: false, reason: `${Art(C)} ha già l'ottetto completo: non può accettare altri elettroni.` };
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
      return {
        ok: false,
        reason: `${Art(full[0])} ha già l'ottetto completo. Un altro legame è possibile solo se l'altro atomo arriva senza elettroni e usa una coppia solitaria (legame dativo): ad esempio con lo ione H⁺ — seleziona l'idrogeno e premi −e⁻ — si forma NH₄⁺.`,
      };
    }
    return { ok: false, reason: lw.invalid };
  }
  let warning;
  const tier = Math.max(A.tier, B.tier);
  if (tier === TIER.UNKNOWN) warning = 'Chimica sconosciuta: per gli elementi superpesanti i legami non sono mai stati osservati.';
  else if (tier === TIER.UNVERIFIED) warning = 'Struttura non verificata: per i metalli d e f le regole di valenza semplici non bastano.';
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
  if (!bond || bond.ionic) return { ok: false, reason: 'Un legame ionico non ha un ordine: è l\'attrazione tra due ioni.' };
  const A = lab.get(bench.atoms.get(bond.a).z);
  const B = lab.get(bench.atoms.get(bond.b).z);
  if (order > 1 && (A.z === 1 || B.z === 1)) return { ok: false, reason: "L'idrogeno forma solo legami singoli." };
  const delta = order - bond.order;
  for (const [X, id] of [[A, bond.a], [B, bond.b]]) {
    const cur = bench.covalentValence(id);
    if (cur + delta > X.maxBonds) {
      return { ok: false, reason: `${Art(X)} non può avere legami per un totale di ${cur + delta} (massimo ${X.maxBonds}).` };
    }
  }
  const ids = bench.unitOf(bond.a, false);
  const lw = lewisAfter(bench, lab, ids, { a: bond.a, b: bond.b, order });
  if (lw.invalid) return { ok: false, reason: lw.invalid };
  return { ok: true };
}

export const ORDER_NAME = { 0: 'ionico', 1: 'singolo', 2: 'doppio', 3: 'triplo' };
export { art, Art };
