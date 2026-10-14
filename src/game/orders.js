// Le esercitazioni della Carriera: cosa c'è sul banco, i passi (con la verifica in tempo reale), la valutazione del
// preparato consegnato. Modulo puro: riceve le miscele e lo stato del banco, restituisce numeri e chiavi di testo
// (i testi sono in game-strings.js). Due modalità di chimica: 'real' (tolleranze strette) e 'simple' (dosi
// arrotondate, tolleranze larghe).
import { FLAME_SALTS } from './reagents.js';

/** Punteggio 1 fino a `full` di errore, 0 da `zero` in su, lineare in mezzo. */
export const score = (err, full, zero) => (err <= full ? 1 : err >= zero ? 0 : 1 - (err - full) / (zero - full));

const NACL = 58.44;

/**
 * Definizioni. setup(mode, rand): oggetti da mettere sul banco (tipo, contenuto, posto); steps(mode): chiavi dei passi
 * con la funzione che dice se sono fatti; evaluate(...): qualità 0–1 e righe del resoconto.
 * Ogni contenuto è descritto in modo dichiarativo: { solution: [soluto, M, mL] } | { solid: [chiave, g] } | { water: mL }.
 */
export const ORDERS = [
  {
    id: 'nacl',
    pay: 30,
    par: 300,
    target: (mode) => (mode === 'simple' ? { grams: 3, volume: 100 } : { molar: 0.5, volume: 100 }),
    setup: () => [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'beaker250', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { kind: 'washbottle', at: 'shelf', reagent: 'water' },
      { kind: 'jar', at: 'shelf', reagent: 'nacl' },
    ],
    steps: (mode) => [
      { key: 'naclStep1', done: (s) => s.best('nacl', (m) => m.grams('nacl')) >= (mode === 'simple' ? 2.5 : 2.85) },
      { key: 'naclStep2', done: (s) => s.containers.some((c) => c.mix.grams('nacl') > 1 && c.mix.liquidVolume >= 90) },
      { key: 'naclStep3', done: (s) => s.containers.some((c) => c.mix.grams('nacl') > 1 && c.mix.liquidVolume > 50 && c.mix.dissolved('nacl') > c.mix.amount('nacl') * 0.99) },
      { key: 'stepDeliver', done: (s) => s.delivered },
    ],
    evaluate({ mode, product }) {
      const lines = [];
      if (!product) return { quality: 0, lines: [{ ok: false, key: 'evNoProduct' }] };
      const m = product.mixture;
      const V = m.liquidVolume;
      const g = m.grams('nacl');
      const undissolved = g - m.dissolved('nacl') * NACL;
      const simple = mode === 'simple';
      const t = ORDERS[0].target(mode);
      const conc = m.molarity('nacl');
      const targetConc = simple ? t.grams / NACL / 0.1 : t.molar;
      const cErr = Math.abs(conc - targetConc) / targetConc;
      const vErr = Math.abs(V - t.volume) / t.volume;
      const qc = score(cErr, simple ? 0.08 : 0.02, simple ? 0.35 : 0.12);
      const qv = score(vErr, simple ? 0.05 : 0.02, simple ? 0.3 : 0.12);
      lines.push({ ok: qc > 0.8 ? true : qc > 0.3 ? 'warn' : false, key: simple ? 'evSaltSimple' : 'evConc', p: { value: simple ? g : conc, target: simple ? t.grams : targetConc } });
      lines.push({ ok: qv > 0.8 ? true : qv > 0.3 ? 'warn' : false, key: 'evVolume', p: { value: V, target: t.volume } });
      let qd = 1;
      if (undissolved > 0.03) {
        qd = 0.3;
        lines.push({ ok: false, key: 'evUndissolved', p: { value: undissolved } });
      }
      const impurity = impurities(m, ['nacl']);
      if (impurity.tap && !simple) {
        qd -= 0.4;
        lines.push({ ok: 'warn', key: 'evTapWater' });
      } else if (impurity.other) {
        qd -= 0.6;
        lines.push({ ok: false, key: 'evImpure', p: { names: impurity.names } });
      }
      return { quality: Math.max(0, 0.45 * qc + 0.35 * qv + 0.2 * Math.max(0, qd)), lines };
    },
  },
  {
    id: 'titration',
    pay: 35,
    par: 300,
    setup: () => [
      { kind: 'flask250', at: 'bench', content: { solution: ['hcl', 0.1, 25] }, labelKey: 'labelHclFlask' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'dropper', at: 'shelf', reagent: 'php' },
      { kind: 'bottle', at: 'shelf', reagent: 'naoh01' },
      { kind: 'washbottle', at: 'shelf', reagent: 'water' },
    ],
    steps: () => [
      { key: 'titStep1', done: (s) => s.containers.some((c) => c.mix.amount('php') > 0 && (c.mix.amount('hcl') > 0 || c.mix.amount('nacl') > 0)) },
      { key: 'titStep2', done: (s) => s.containers.some((c) => c.mix.amount('nacl') > 0.0005) },
      { key: 'titStep3', done: (s) => s.containers.some((c) => c.mix.amount('php') > 0 && c.mix.appearance().pink > 0.25 && c.mix.amount('nacl') > 0.002) },
      { key: 'stepDeliver', done: (s) => s.delivered },
    ],
    evaluate({ mode, product }) {
      if (!product) return { quality: 0, lines: [{ ok: false, key: 'evNoProduct' }] };
      const m = product.mixture;
      const lines = [];
      const hcl0 = 0.0025;
      const naohTotal = m.amount('nacl') + m.amount('naoh');
      const ml = (naohTotal / 0.1) * 1000;
      const ph = m.pH() ?? 7;
      const hasIndicator = m.amount('php') > 0;
      const simple = mode === 'simple';
      lines.push({ ok: hasIndicator ? true : false, key: hasIndicator ? 'evIndicator' : 'evNoIndicator' });
      const excess = (naohTotal - hcl0) / hcl0;
      let q;
      if (m.amount('nacl') < hcl0 * 0.5) q = 0;
      else if (excess < -0.01) q = simple ? score(-excess, 0.04, 0.3) : score(-excess, 0.005, 0.12) * 0.6;
      else q = simple ? score(excess, 0.06, 0.4) : score(excess, 0.02, 0.2);
      lines.push({ ok: q > 0.8 ? true : q > 0.3 ? 'warn' : false, key: 'evTitrationMl', p: { value: ml, target: 25 } });
      lines.push({ ok: ph >= (simple ? 6.5 : 7.5) && ph <= (simple ? 10.5 : 10) ? true : 'warn', key: 'evPH', p: { value: ph } });
      const impurity = impurities(m, ['nacl', 'naoh', 'hcl', 'php']);
      if (impurity.other) lines.push({ ok: false, key: 'evImpure', p: { names: impurity.names } });
      return { quality: Math.max(0, q * (hasIndicator ? 1 : 0.4) - (impurity.other ? 0.4 : 0)), lines };
    },
  },
  {
    id: 'goldrain',
    pay: 40,
    par: 240,
    setup: () => [
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'bottle', at: 'shelf', reagent: 'pbno3' },
      { kind: 'bottle', at: 'shelf', reagent: 'ki01' },
      { kind: 'washbottle', at: 'shelf', reagent: 'water' },
    ],
    steps: (mode) => [
      { key: 'goldStep1', done: (s) => s.containers.some((c) => c.kind !== 'bottle' && (c.mix.amount('pbno32') > 0.0008 || c.mix.amount('pbi2') > 0.0008)) },
      { key: 'goldStep2', done: (s) => s.best('pbi2', (m) => m.amount('pbi2')) > (mode === 'simple' ? 0.0005 : 0.0009) },
      { key: 'stepDeliver', done: (s) => s.delivered },
      { key: 'goldStep4', done: (s) => s.delivered && !s.containers.some((c) => c.kind !== 'bottle' && (c.mix.amount('pbi2') > 1e-6 || c.mix.amount('pbno32') > 1e-6)) },
    ],
    evaluate({ mode, product }) {
      if (!product) return { quality: 0, lines: [{ ok: false, key: 'evNoProduct' }] };
      const m = product.mixture;
      const lines = [];
      const simple = mode === 'simple';
      const g = m.grams('pbi2');
      const qy = simple ? score(Math.max(0, 0.3 - g) / 0.3, 0, 0.9) : score(Math.max(0, 0.461 - g) / 0.461, 0.1, 0.8);
      lines.push({ ok: qy > 0.8 ? true : qy > 0.3 ? 'warn' : false, key: 'evPrecipitate', p: { value: g, target: simple ? 0.3 : 0.461 } });
      // eccesso di un reagente: la «pioggia d'oro» migliore viene con il rapporto 1 : 2
      const pb = m.amount('pbno32');
      const ki = m.amount('ki');
      const made = m.amount('pbi2');
      const excess = made > 0 ? Math.max(pb / made, ki / 2 / made) : 1;
      const qe = simple ? 1 : score(excess, 0.12, 1.2);
      if (!simple) lines.push({ ok: qe > 0.8 ? true : 'warn', key: 'evExcess', p: { value: excess * 100 } });
      return { quality: Math.max(0, simple ? qy : 0.7 * qy + 0.3 * qe), lines };
    },
  },
  {
    id: 'crystals',
    pay: 45,
    par: 420,
    setup: () => [
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { kind: 'jar', at: 'shelf', reagent: 'cuso4' },
      { kind: 'washbottle', at: 'shelf', reagent: 'water' },
    ],
    steps: () => [
      { key: 'cryStep1', done: (s) => s.containers.some((c) => c.kind !== 'jar' && c.mix.dissolved('cuso4') > 0.02) },
      { key: 'cryStep2', done: (s) => s.containers.some((c) => c.kind !== 'jar' && c.mix.amount('cuso4') + c.mix.amount('cuso4-5h2o') > 0.02 && c.mix.water < 18 && c.peakT > 360) },
      { key: 'cryStep3', done: (s) => s.containers.some((c) => c.kind !== 'jar' && c.mix.grams('cuso4-5h2o') > 1.5 && c.mix.T < 310) },
      { key: 'stepDeliver', done: (s) => s.delivered },
    ],
    evaluate({ mode, product }) {
      if (!product) return { quality: 0, lines: [{ ok: false, key: 'evNoProduct' }] };
      const m = product.mixture;
      const lines = [];
      const simple = mode === 'simple';
      const g = m.grams('cuso4-5h2o');
      const target = simple ? 2 : 4;
      const qc = score(Math.max(0, target - g) / target, 0, 0.85);
      lines.push({ ok: qc > 0.8 ? true : qc > 0.3 ? 'warn' : false, key: 'evCrystals', p: { value: g, target } });
      let q = qc;
      const white = m.grams('cuso4') - m.dissolved('cuso4') * 159.6;
      if (white > 0.3) {
        q -= simple ? 0.3 : 0.5;
        lines.push({ ok: false, key: 'evBurnt', p: { value: white } });
      }
      if (m.T > 313) {
        q -= 0.2;
        lines.push({ ok: 'warn', key: 'evHot', p: { value: m.T - 273.15 } });
      }
      return { quality: Math.max(0, q), lines };
    },
  },
  {
    id: 'flame',
    pay: 40,
    par: 240,
    answers: true,
    setup: (mode, rand = Math.random) => {
      const pool = Object.keys(FLAME_SALTS);
      const picked = [];
      while (picked.length < 3) {
        const k = pool[Math.floor(rand() * pool.length)];
        if (!picked.includes(k)) picked.push(k);
      }
      return [
        { kind: 'loop', at: 'bench' },
        ...picked.map((salt, i) => ({ kind: 'jar', at: 'bench', content: { solid: [salt, 15] }, sample: i, unknown: salt })),
        { kind: 'bottle', at: 'shelf', reagent: 'hcl1' },
        { kind: 'beaker100', at: 'bench' },
      ];
    },
    steps: () => [
      { key: 'flameStep1', done: (s) => s.bunsenOn || s.flameSeen.size > 0 },
      { key: 'flameStep2', done: (s) => s.flameSeen.size >= 3 },
      { key: 'flameStep3', done: (s) => s.delivered },
    ],
    evaluate({ answers = {}, unknowns = [] }) {
      const lines = [];
      let right = 0;
      unknowns.forEach((salt, i) => {
        const metal = FLAME_SALTS[salt];
        const ok = answers[i] === metal;
        if (ok) right++;
        lines.push({ ok, key: 'evSample', p: { sample: 'ABC'[i], answer: answers[i] ?? '—', metal } });
      });
      return { quality: right / Math.max(1, unknowns.length), lines };
    },
  },
];

export const ORDER_BY_ID = Object.fromEntries(ORDERS.map((o) => [o.id, o]));

/** Sostanze estranee in un preparato (oltre all'acqua e a quelle ammesse); l'acqua del rubinetto è a parte. */
export function impurities(m, allowed) {
  const ctx = m.ctx;
  const ok = new Set(['water', ...allowed].map((k) => ctx.id(k) || k));
  const tap = new Set(['cacl2', 'nahco3'].map((k) => ctx.id(k)));
  let tapFound = false;
  const names = [];
  for (const [sid, mol] of m.n) {
    if (mol < 1e-6 || ok.has(sid)) continue;
    if (tap.has(sid)) tapFound = true;
    else names.push(ctx.name(sid));
  }
  return { tap: tapFound, other: names.length > 0, names: names.slice(0, 3).join(', ') };
}

/**
 * Stelle (0–5, a mezze stelle) e paga: qualità del preparato (3 stelle), sicurezza e pulizia (1), tempo (1).
 * @param {{quality: number, elapsed: number, par: number, mess: number, incidents: number, wrongBins: number, pay: number, costs: number}} r
 */
export function grade({ quality, elapsed, par, mess = 0, incidents = 0, wrongBins = 0, pay, costs = 0 }) {
  const safety = Math.max(0, 1 - 0.25 * mess - 0.5 * incidents - 0.3 * wrongBins);
  const time = score(elapsed / par, 1, 2.5);
  const raw = quality * 3 + safety + (quality > 0.2 ? time : 0);
  const stars = Math.round(Math.max(0, Math.min(5, raw)) * 2) / 2;
  const earned = Math.round(pay * (stars / 5) * 100) / 100;
  return { stars, safety, time, earned, net: Math.round((earned - costs) * 100) / 100 };
}
