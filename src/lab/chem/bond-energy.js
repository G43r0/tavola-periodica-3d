// Energie di legame medie (kJ/mol, molecole in fase gassosa), valori dei testi di chimica generale
// (Housecroft & Sharpe, CRC Handbook). Sono medie su molte molecole: indicative, non esatte.
// Per le coppie mancanti: stima di Pauling D(A–B) = ½[D(A–A) + D(B–B)] + 96,5·(ΔEN)².

const TABLE = {
  'H-H': 436, 'C-H': 413, 'H-N': 391, 'H-O': 463, 'F-H': 565, 'Cl-H': 431, 'Br-H': 366, 'H-I': 299,
  'H-S': 363, 'H-P': 322, 'H-Si': 323, 'B-H': 389, 'H-Se': 276, 'Ge-H': 288, 'As-H': 247,
  'C-C': 348, 'C-N': 293, 'C-O': 358, 'C-F': 485, 'C-Cl': 328, 'Br-C': 276, 'C-I': 240, 'C-S': 259,
  'C-Si': 301, 'C-P': 264,
  'N-N': 163, 'N-O': 201, 'F-N': 272, 'Cl-N': 200,
  'O-O': 146, 'F-O': 190, 'Cl-O': 203, 'O-S': 265, 'O-P': 335, 'O-Si': 452, 'B-O': 536,
  'F-F': 155, 'Cl-Cl': 242, 'Br-Br': 193, 'I-I': 151, 'Cl-F': 253, 'Br-Cl': 218, 'Cl-I': 208, 'Br-F': 237, 'F-I': 280,
  'S-S': 266, 'F-S': 327, 'Cl-S': 271,
  'P-P': 201, 'Cl-P': 326, 'F-P': 490, 'Br-P': 264,
  'Si-Si': 226, 'F-Si': 565, 'Cl-Si': 381,
  'B-B': 293, 'B-F': 613, 'B-Cl': 456,
  'F-Xe': 133, 'O-Xe': 84, 'F-Kr': 50,
  'Se-Se': 172, 'Te-Te': 126, 'As-As': 146, 'Sb-Sb': 121, 'Ge-Ge': 188, 'Sn-Sn': 146, 'Li-Li': 105,
  'Na-Na': 72, 'K-K': 49,
  'C=C': 614, 'C=O': 799, 'C=N': 615, 'N=N': 418, 'N=O': 607, 'O=O': 498, 'O=S': 523, 'C=S': 573,
  'O=P': 544, 'S=S': 425, 'O=Se': 343,
  'C#C': 839, 'C#N': 891, 'N#N': 945, 'C#O': 1072,
};

const SYM = { 1: '-', 2: '=', 3: '#' };
const key = (a, b, order) => [a, b].sort().join(SYM[order]);

/**
 * @returns {{ kj:number|null, estimated:boolean }}
 */
export function bondEnergy(A, B, order = 1) {
  const exact = TABLE[key(A.symbol, B.symbol, order)];
  if (exact) return { kj: exact, estimated: false };
  // singolo stimato con Pauling
  let single = TABLE[key(A.symbol, B.symbol, 1)];
  let estimated = false;
  if (!single) {
    const aa = TABLE[key(A.symbol, A.symbol, 1)];
    const bb = TABLE[key(B.symbol, B.symbol, 1)];
    if (aa && bb && A.en != null && B.en != null) single = (aa + bb) / 2 + 96.5 * (A.en - B.en) ** 2;
    else if (A.en != null && B.en != null) single = 180 + 96.5 * (A.en - B.en) ** 2; // stima molto grossolana
    else return { kj: null, estimated: true };
    estimated = true;
  }
  if (order === 1) return { kj: Math.round(single), estimated };
  // legami multipli non tabulati: rapporti tipici del carbonio (C=C/C–C ≈ 1,76; C≡C/C–C ≈ 2,4)
  return { kj: Math.round(single * (order === 2 ? 1.76 : 2.4)), estimated: true };
}
