// Banco del laboratorio conservato nell'archivio del browser (localStorage): ricaricando l'app o cambiando lingua o
// grafica (che la ricaricano) le molecole restano. Il formato è quello di Bench.snapshot(); un salvataggio rovinato si
// ignora e si riparte da un banco vuoto.

export const BENCH_KEY = 'tp3d.lab.bench';

const finite = (v) => typeof v === 'number' && Number.isFinite(v);

/** Salva il banco (un banco vuoto cancella il salvataggio). Non lancia mai errori: l'archivio può mancare o essere pieno. */
export function saveBench(storage, snap) {
  try {
    if (!snap?.atoms?.length) storage?.removeItem(BENCH_KEY);
    else storage?.setItem(BENCH_KEY, JSON.stringify(snap));
  } catch {
    /* archivio non disponibile: il banco vale fino alla chiusura */
  }
}

/** Banco salvato, controllato, oppure null. */
export function loadBench(storage) {
  let snap;
  try {
    snap = JSON.parse(storage?.getItem(BENCH_KEY) ?? 'null');
  } catch {
    return null;
  }
  if (!snap || !Array.isArray(snap.atoms) || !Array.isArray(snap.bonds) || !snap.atoms.length) return null;
  const ids = new Set();
  for (const a of snap.atoms) {
    if (!a || !Number.isInteger(a.id) || !Number.isInteger(a.z) || a.z < 1 || a.z > 118) return null;
    if (!Array.isArray(a.pos) || a.pos.length !== 3 || !a.pos.every(finite)) return null;
    ids.add(a.id);
  }
  for (const b of snap.bonds) {
    if (!b || !Number.isInteger(b.id) || !ids.has(b.a) || !ids.has(b.b) || b.a === b.b || !finite(b.order)) return null;
  }
  return snap;
}
