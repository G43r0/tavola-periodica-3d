// Lettore SMILES ridotto, per scrivere la libreria di molecole in modo compatto.
// Supporta: sottoinsieme organico (B C N O P S F Cl Br I) con idrogeni impliciti, atomi tra parentesi
// quadre con carica e idrogeni ([NH4+], [O-2], [Na+], [Xe]), legami - = #, rami ( ), chiusure
// di anello 1–9, componenti separate da "." (composti ionici). Niente aromatici minuscoli né
// stereochimica: si scrivono le strutture di Kekulé (benzene = C1=CC=CC=C1).

const ORGANIC = { B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6], F: [1], Cl: [1], Br: [1], I: [1] };
const BOND = { '-': 1, '=': 2, '#': 3 };

/**
 * @param {string} smiles
 * @param {Map<string,{z:number}>} bySymbol
 * @returns {{atoms:{z:number,charge:number}[], bonds:{i:number,j:number,order:number}[]}} con idrogeni espliciti
 */
export function parseSmiles(smiles, bySymbol) {
  const atoms = []; // {z, symbol, charge, hCount|null (implicito), organic}
  const bonds = [];
  const stack = [];
  const rings = new Map();
  let prev = null;
  let pendingOrder = null;
  let i = 0;

  const addAtom = (atom) => {
    const idx = atoms.length;
    atoms.push(atom);
    if (prev !== null) bonds.push({ i: prev, j: idx, order: pendingOrder ?? 1 });
    pendingOrder = null;
    prev = idx;
  };

  while (i < smiles.length) {
    const ch = smiles[i];
    if (ch === '(') {
      stack.push(prev);
      i++;
    } else if (ch === ')') {
      prev = stack.pop();
      i++;
    } else if (ch === '.') {
      prev = null;
      i++;
    } else if (BOND[ch]) {
      pendingOrder = BOND[ch];
      i++;
    } else if (/[0-9]/.test(ch)) {
      const d = ch;
      if (rings.has(d)) {
        const r = rings.get(d);
        bonds.push({ i: r.atom, j: prev, order: pendingOrder ?? r.order ?? 1 });
        rings.delete(d);
      } else {
        rings.set(d, { atom: prev, order: pendingOrder });
      }
      pendingOrder = null;
      i++;
    } else if (ch === '[') {
      const end = smiles.indexOf(']', i);
      const body = smiles.slice(i + 1, end);
      const m = body.match(/^([A-Z][a-z]?)(H(\d*))?([+-]+\d*|[+-]\d+)?$/);
      if (!m) throw new Error(`SMILES non valido: [${body}]`);
      const el = bySymbol.get(m[1]);
      if (!el) throw new Error(`Elemento sconosciuto: ${m[1]}`);
      let charge = 0;
      if (m[4]) {
        const sign = m[4][0] === '+' ? 1 : -1;
        const digits = m[4].replace(/[+-]/g, '');
        charge = sign * (digits ? Number(digits) : m[4].length);
      }
      const hCount = m[2] ? (m[3] ? Number(m[3]) : 1) : 0;
      addAtom({ z: el.z, symbol: m[1], charge, hCount, organic: false });
      i = end + 1;
    } else {
      const two = smiles.slice(i, i + 2);
      const sym = ORGANIC[two] ? two : ch;
      if (!ORGANIC[sym]) throw new Error(`SMILES non valido vicino a "${smiles.slice(i)}"`);
      addAtom({ z: bySymbol.get(sym).z, symbol: sym, charge: 0, hCount: null, organic: true });
      i += sym.length;
    }
  }
  if (rings.size) throw new Error(`Anello non chiuso in ${smiles}`);

  // idrogeni impliciti
  const valence = atoms.map(() => 0);
  for (const b of bonds) {
    valence[b.i] += b.order;
    valence[b.j] += b.order;
  }
  const out = atoms.map((a) => ({ z: a.z, charge: a.charge }));
  const outBonds = bonds.map((b) => ({ ...b }));
  atoms.forEach((a, idx) => {
    let h = a.hCount;
    if (a.organic) {
      const target = ORGANIC[a.symbol].find((v) => v >= valence[idx]) ?? valence[idx];
      h = target - valence[idx];
    }
    for (let k = 0; k < h; k++) {
      out.push({ z: 1, charge: 0 });
      outBonds.push({ i: idx, j: out.length - 1, order: 1 });
    }
  });
  return { atoms: out, bonds: outBonds };
}
