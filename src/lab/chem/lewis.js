// Struttura di Lewis di un frammento covalente (atomi uniti da legami covalenti).
// Conservazione degli elettroni: elettroni = Σ elettroni di valenza − carica.
// Procedura dei libri di testo: gli elettroni non di legame completano prima gli ottetti degli atomi
// più elettronegativi, poi quelli degli altri; gli avanzi vanno sull'atomo centrale che può espandere
// l'ottetto (dal 3° periodo); un elettrone dispari resta spaiato (radicale).
import { TIER } from './elements-lab.js';

/** L'atomo segue la regola dell'ottetto (o del duetto)? */
export function usesOctet(info) {
  if (info.tier !== TIER.MAIN) return false;
  if (info.z === 1 || info.z === 2) return true;
  return info.group >= 14;
}

export const octetTarget = (info) => (info.z <= 2 ? 2 : 8);

const canExpand = (info) => info.tier === TIER.MAIN && info.period >= 3 && info.group >= 14;

/**
 * @param {{get:(z:number)=>object}} lab
 * @param {{z:number,charge:number}[]} atoms carica di ogni atomo (ioni, elettroni aggiunti/tolti)
 * @param {{i:number,j:number,order:number}[]} bonds legami covalenti
 */
export function analyzeLewis(lab, atoms, bonds) {
  const n = atoms.length;
  const info = atoms.map((a) => lab.get(a.z));
  const B = new Array(n).fill(0);
  for (const b of bonds) {
    B[b.i] += b.order;
    B[b.j] += b.order;
  }
  const Q = atoms.reduce((s, a) => s + a.charge, 0);
  const electrons = info.reduce((s, x) => s + x.V, 0) - Q;
  let R = electrons - B.reduce((s, x) => s + x, 0);
  const L = new Array(n).fill(0);
  const result = { charge: Q, electrons, invalid: null };

  if (R < 0) {
    result.invalid = 'Non ci sono abbastanza elettroni per tutti questi legami.';
    R = 0;
  } else if (n === 1) {
    L[0] = R;
    R = 0;
  } else {
    // atomi che non seguono l'ottetto (gruppi 1, 2, 13 e metalli d/f): tengono i propri elettroni non impegnati,
    // meno quelli ceduti come ione (Fe³⁺ nel complesso [Fe(SCN)]²⁺ non ha elettroni da mettere nel legame)
    for (let i = 0; i < n; i++) {
      if (usesOctet(info[i])) continue;
      const own = Math.min(Math.max(0, info[i].V - (atoms[i].charge || 0) - B[i]), R);
      L[i] = own;
      R -= own;
    }
    // ottetti/duetti: prima gli atomi più elettronegativi (a parità, i terminali)
    const order = [...Array(n).keys()]
      .filter((i) => usesOctet(info[i]))
      .sort((a, b) => (info[b].en ?? 0) - (info[a].en ?? 0) || B[a] - B[b]);
    for (const i of order) {
      const need = octetTarget(info[i]) - 2 * B[i] - L[i];
      if (need <= 0 || R <= 0) continue;
      const give = Math.min(need, R - (R % 2 && need >= R ? 1 : 0));
      const pairs = give - (give % 2);
      L[i] += pairs;
      R -= pairs;
    }
    // elettroni avanzati: ottetto espanso sull'atomo centrale (più legami, meno elettronegativo)
    while (R >= 2) {
      const pool = [...Array(n).keys()].filter((i) => canExpand(info[i]));
      const target = (pool.length ? pool : [...Array(n).keys()].filter((i) => usesOctet(info[i]))).sort(
        (a, b) => B[b] - B[a] || (info[a].en ?? 0) - (info[b].en ?? 0),
      )[0];
      if (target === undefined) break;
      L[target] += 2;
      R -= 2;
    }
    // elettrone dispari: sull'atomo meno elettronegativo che ha ancora posto
    if (R === 1) {
      const room = [...Array(n).keys()]
        .filter((i) => usesOctet(info[i]) && octetTarget(info[i]) - 2 * B[i] - L[i] > 0)
        .sort((a, b) => (info[a].en ?? 0) - (info[b].en ?? 0));
      const i = room[0] ?? [...Array(n).keys()].filter((k) => canExpand(info[k]))[0] ?? 0;
      L[i] += 1;
      R = 0;
    }
  }

  result.atoms = atoms.map((a, i) => {
    const x = info[i];
    const around = 2 * B[i] + L[i];
    const octet = usesOctet(x);
    let lonePairs = Math.floor(L[i] / 2);
    let unpaired = L[i] % 2;
    // atomo isolato dei gruppi principali: regola di Hund sui 4 orbitali di valenza (s e tre p),
    // come nei simboli di Lewis dei libri: C con 4 elettroni spaiati, O con 2 coppie e 2 spaiati.
    // H e He hanno il solo orbitale 1s (H⁻ = coppia, nessun elettrone spaiato)
    if (n === 1 && x.tier === TIER.MAIN && x.z > 2 && L[i] <= 8) {
      if (a.charge > 0) {
        // catione: resta prima la coppia s (Sn²⁺, Pb²⁺, Tl⁺, Bi³⁺: «coppia inerte»), poi gli orbitali p
        const p = Math.max(0, L[i] - 2);
        unpaired = L[i] <= 2 ? L[i] % 2 : p <= 3 ? p : 6 - p;
      } else unpaired = L[i] <= 4 ? L[i] : 8 - L[i];
      lonePairs = (L[i] - unpaired) / 2;
    }
    // metalli d e f: gli elettroni non impegnati sono elettroni d/f, non coppie solitarie né radicali di Lewis
    if (x.tier !== TIER.MAIN) {
      lonePairs = 0;
      unpaired = 0;
    }
    return {
      bonds: B[i],
      lone: L[i],
      lonePairs,
      unpaired,
      formalCharge: x.V - L[i] - B[i],
      electronsAround: around,
      incomplete: octet && n > 1 ? around < octetTarget(x) : false,
      expanded: octet && around > 8,
      overfilled: octet && around > 8 && !canExpand(x),
    };
  });
  result.radical = result.atoms.reduce((s, a) => s + a.unpaired, 0);
  result.incomplete = result.atoms.map((a, i) => (a.incomplete ? i : -1)).filter((i) => i >= 0);
  result.expanded = result.atoms.map((a, i) => (a.expanded ? i : -1)).filter((i) => i >= 0);
  if (!result.invalid && result.atoms.some((a) => a.overfilled)) {
    result.invalid = 'Un atomo del 2° periodo non può avere più di 8 elettroni attorno.';
  }
  result.unverified = info.some((x) => x.tier !== TIER.MAIN);
  return result;
}
