// Banco di lavoro come grafo: atomi, legami covalenti (ordine 1–3) e legami ionici
// (elettroni trasferiti dal metallo al non metallo). Nessuna grafica qui.

let nextId = 1;

export class Bench {
  constructor() {
    /** @type {Map<number,{id:number,z:number,pos:number[],extra:number}>} extra = elettroni aggiunti (+) o tolti (−) */
    this.atoms = new Map();
    /** @type {Map<number,{id:number,a:number,b:number,order:number,ionic:boolean,transfer:number,donor:number|null}>} */
    this.bonds = new Map();
  }

  addAtom(z, pos = [0, 0, 0], extra = 0) {
    const id = nextId++;
    this.atoms.set(id, { id, z, pos: [...pos], extra });
    return id;
  }

  removeAtom(id) {
    for (const b of this.bondsOf(id)) this.bonds.delete(b.id);
    this.atoms.delete(id);
  }

  addBond(a, b, { order = 1, ionic = false, transfer = 0, donor = null } = {}) {
    const id = nextId++;
    this.bonds.set(id, { id, a, b, order: ionic ? 0 : order, ionic, transfer, donor });
    return id;
  }

  removeBond(id) {
    this.bonds.delete(id);
  }

  bondBetween(a, b) {
    for (const bond of this.bonds.values()) {
      if ((bond.a === a && bond.b === b) || (bond.a === b && bond.b === a)) return bond;
    }
    return null;
  }

  bondsOf(id) {
    return [...this.bonds.values()].filter((b) => b.a === id || b.b === id);
  }

  other(bond, id) {
    return bond.a === id ? bond.b : bond.a;
  }

  /** Somma degli ordini dei legami covalenti dell'atomo. */
  covalentValence(id) {
    let n = 0;
    for (const b of this.bonds.values()) if (!b.ionic && (b.a === id || b.b === id)) n += b.order;
    return n;
  }

  /** Carica dovuta ai legami ionici (+ per chi cede elettroni, − per chi li riceve). */
  ionicCharge(id) {
    let q = 0;
    for (const b of this.bonds.values()) {
      if (!b.ionic || (b.a !== id && b.b !== id)) continue;
      q += b.donor === id ? b.transfer : -b.transfer;
    }
    return q;
  }

  /** Elettroni ceduti tramite legami ionici. */
  ionicGiven(id) {
    let n = 0;
    for (const b of this.bonds.values()) if (b.ionic && b.donor === id) n += b.transfer;
    return n;
  }

  /** Carica netta dell'atomo come "contenitore di elettroni" (ioni e elettroni aggiunti/tolti). */
  atomCharge(id) {
    return this.ionicCharge(id) - this.atoms.get(id).extra;
  }

  /**
   * Componenti connesse.
   * @param {boolean} includeIonic true = unità complete (es. Na⁺Cl⁻), false = solo legami covalenti
   * @returns {number[][]}
   */
  components(includeIonic = true) {
    const seen = new Set();
    const out = [];
    const adj = new Map([...this.atoms.keys()].map((id) => [id, []]));
    for (const b of this.bonds.values()) {
      if (!includeIonic && b.ionic) continue;
      adj.get(b.a)?.push(b.b);
      adj.get(b.b)?.push(b.a);
    }
    for (const id of this.atoms.keys()) {
      if (seen.has(id)) continue;
      const comp = [];
      const stack = [id];
      seen.add(id);
      while (stack.length) {
        const cur = stack.pop();
        comp.push(cur);
        for (const n of adj.get(cur)) {
          if (!seen.has(n)) {
            seen.add(n);
            stack.push(n);
          }
        }
      }
      out.push(comp.sort((a, b) => a - b));
    }
    return out;
  }

  /** Unità (molecola o composto ionico) che contiene l'atomo. */
  unitOf(id, includeIonic = true) {
    return this.components(includeIonic).find((c) => c.includes(id)) ?? [];
  }

  /** Legami interni a un insieme di atomi. */
  bondsWithin(ids) {
    const set = new Set(ids);
    return [...this.bonds.values()].filter((b) => set.has(b.a) && set.has(b.b));
  }

  snapshot() {
    return {
      atoms: [...this.atoms.values()].map((a) => ({ ...a, pos: [...a.pos] })),
      bonds: [...this.bonds.values()].map((b) => ({ ...b })),
    };
  }

  restore(snap) {
    this.atoms = new Map(snap.atoms.map((a) => [a.id, { ...a, pos: [...a.pos] }]));
    this.bonds = new Map(snap.bonds.map((b) => [b.id, { ...b }]));
    const maxId = Math.max(0, ...snap.atoms.map((a) => a.id), ...snap.bonds.map((b) => b.id));
    if (maxId >= nextId) nextId = maxId + 1;
  }

  clear() {
    this.atoms.clear();
    this.bonds.clear();
  }

  /**
   * Descrizione semplice di un insieme di atomi per i moduli di analisi (Lewis, geometria, riconoscimento).
   * @returns {{ ids:number[], atoms:{z:number,charge:number}[], bonds:{i:number,j:number,order:number}[], ionic:{i:number,j:number,transfer:number,donor:number}[] }}
   */
  describe(ids) {
    const index = new Map(ids.map((id, i) => [id, i]));
    const bonds = [];
    const ionic = [];
    for (const b of this.bondsWithin(ids)) {
      const i = index.get(b.a);
      const j = index.get(b.b);
      if (b.ionic) ionic.push({ i, j, transfer: b.transfer, donor: index.get(b.donor) });
      else bonds.push({ i, j, order: b.order });
    }
    return {
      ids,
      atoms: ids.map((id) => ({ z: this.atoms.get(id).z, charge: this.atomCharge(id) })),
      bonds,
      ionic,
    };
  }
}
