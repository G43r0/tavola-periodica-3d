// Esercitazioni della Carriera, scritte come dati (career.js le legge). Ogni esercitazione ha:
// - chapter, pay (€), par (s): capitolo, paga piena e tempo di riferimento;
// - setup: cosa c'è sul banco. { kind, at, content, label, sample, dirty, fire } per vetreria e strumenti (at: 'bench'
//   il bancone A, 'benchB' il bancone B), { reagent, at } per i reagenti dello scaffale e dell'armadio, { puddle } per
//   una pozza sul bancone; content: { solution: [soluto, M, mL] } | { solid: [chiave, g] } | { water: mL } | { liquid };
// - samples: campioni incogniti ({ pool: [{ content, answer }], count, oneOfEach }), messi nei recipienti con «sample»;
// - steps: i passi sulla lavagna, ognuno con la condizione (career.js, check) che lo spunta;
// - deliver: 'tray' (si consegna un preparato sul vassoio, il predefinito), 'bell' (basta il campanello), 'answers'
//   (il campanello apre le risposte); answers: { type: 'choice' | 'number', options, value, of, unit, tol };
// - goals: obiettivi valutati alla consegna ({ line, m, target, dir, rel, tol, w }), penalties: { line, if, minus };
// - report: domande della relazione ({ q, opts, a }: testi con «@» sono chiavi dei testi, gli altri si mostrano così);
// - book: pagine del libro «Come si fa» che l'esercitazione apre (e che l'insegnante indica);
// - solution: la soluzione per i test (career.js, runSolution).
// Le tolleranze [pieno, zero]: errore (relativo se rel) fino al primo valore = punteggio pieno, dal secondo in su = 0.

import { LATE_EXERCISES } from './career-exercises-late.js';

const ML_PER_MOL = 24500; // mL di gas per mole a circa 25 °C e 1 atm, per mostrare i gas in millilitri

export { CHALLENGES } from './career-exercises-late.js';

const BASE_EXERCISES = [
  // ------------------------------------------------------------ capitolo 0: comandi e sicurezza
  {
    id: 'carry',
    chapter: 0,
    pay: 10,
    par: 120,
    setup: [{ kind: 'beaker250', at: 'benchB', content: { water: 150 } }],
    steps: [
      { key: 'carryStep1', when: { m: '$held', eq: 'beaker250' } },
      { key: 'carryStep2', when: { m: '$tray', min: 1 } },
      { key: 'stepBell', when: { m: '$delivered', min: 1 } },
    ],
    goals: [{ line: 'evWaterKept', m: 'volume', target: 150, dir: 'min', rel: true, tol: { real: [0.02, 0.3], simple: [0.05, 0.4] } }],
    report: [
      { q: 'rq_carry1', opts: ['@rqo_carry1a', '@rqo_carry1b', '@rqo_carry1c'], a: 0 },
      { q: 'rq_carry2', opts: ['@rqo_carry2a', '@rqo_carry2b', '@rqo_carry2c'], a: 0 },
    ],
    book: ['tool:beaker', 'safety:ppe'],
    solution: [['A', 'add', { water: 150 }], ['state', 'tray', 1], ['deliver', 'A']],
  },
  {
    id: 'measure50',
    chapter: 0,
    pay: 12,
    par: 150,
    setup: [
      { kind: 'beaker250', at: 'bench', content: { water: 200 } },
      { kind: 'cylinder100', at: 'bench' },
    ],
    steps: [
      { key: 'm50Step1', when: { any: [{ kind: 'cylinder100' }, { m: 'volume', min: 30 }] } },
      { key: 'm50Step2', when: { any: [{ kind: 'cylinder100' }, { m: 'volume', min: { real: 49.5, simple: 47 }, max: { real: 50.5, simple: 53 } }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [{ line: 'evVolume', m: 'volume', target: 50, rel: true, tol: { real: [0.01, 0.08], simple: [0.04, 0.2] } }],
    report: [
      { q: 'rq_m50a', opts: ['@rqo_m50a1', '@rqo_m50a2', '@rqo_m50a3'], a: 0 },
      { q: 'rq_m50b', opts: ['50 mL', '5 mL', '500 mL'], a: 0 },
    ],
    book: ['tool:cylinder', 'tech:meniscus'],
    solution: [['A', 'add', { water: 50 }], ['deliver', 'A']],
  },
  {
    id: 'weigh2',
    chapter: 0,
    pay: 15,
    par: 180,
    setup: [
      { kind: 'beaker100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { reagent: 'nacl', at: 'shelf' },
    ],
    steps: [
      { key: 'w2Step1', when: { m: '$ev:tare', min: 1 } },
      { key: 'w2Step2', when: { any: [{ m: 'grams:nacl', min: { real: 1.97, simple: 1.85 }, max: { real: 2.03, simple: 2.15 } }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evSaltGrams', m: 'grams:nacl', target: 2, rel: true, tol: { real: [0.01, 0.1], simple: [0.04, 0.3] }, w: 0.8 },
      { line: 'evTare', m: '$ev:tare', target: 1, dir: 'min', tol: [0, 1], w: 0.2 },
    ],
    penalties: [{ line: 'evImpure', if: { m: 'impure:nacl', min: 1 }, minus: 0.4, names: ['nacl'] }],
    report: [
      { q: 'rq_w2a', opts: ['@rqo_w2a1', '@rqo_w2a2', '@rqo_w2a3'], a: 0 },
      { q: 'rq_w2b', opts: ['2,00 g', '98,60 g', '48,30 g'], a: 0 },
    ],
    book: ['tool:balance', 'tool:spatula', 'tech:weigh'],
    solution: [['ev', 'tare', 1], ['A', 'add', { solid: ['nacl', 2] }], ['deliver', 'A']],
  },
  {
    id: 'cleanup',
    chapter: 0,
    pay: 15,
    par: 240,
    deliver: 'bell',
    setup: [
      { kind: 'beaker100', at: 'bench', content: { solution: ['cuso4', 0.5, 25] }, dirty: true },
      { kind: 'beaker250', at: 'bench', content: { solution: ['nacl', 0.5, 40] }, dirty: true },
      { kind: 'flask250', at: 'bench', content: { solution: ['nacl', 0.1, 30] }, dirty: true },
      { puddle: { solution: ['nacl', 0.5, 12] }, at: 'bench' },
      { kind: 'towel', at: 'bench' },
    ],
    steps: [
      { key: 'cleanStep1', when: { m: '$ev:disposed:heavy', min: 1 } },
      { key: 'cleanStep2', when: { m: '$dirtyLeft', max: 0 } },
      { key: 'cleanStep3', when: { m: '$mess', max: 0 } },
      { key: 'stepBell', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evCleaned', m: '$cleanFrac', target: 1, dir: 'min', tol: { real: [0, 0.7], simple: [0, 0.9] }, w: 0.6, show: { scale: 100 } },
      { line: 'evMessLeft', m: '$mess', target: 0, dir: 'max', tol: [0, 3], w: 0.25 },
      { line: 'evWrongBins', m: '$ev:wrongBin', target: 0, dir: 'max', tol: [0, 2], w: 0.15 },
    ],
    report: [
      { q: 'rq_cleanA', opts: ['@rqo_cleanA1', '@rqo_cleanA2', '@rqo_cleanA3'], a: 0 },
      { q: 'rq_cleanB', opts: ['@rqo_cleanB1', '@rqo_cleanB2', '@rqo_cleanB3'], a: 0 },
    ],
    book: ['tech:wash', 'tool:washbottle', 'safety:waste'],
    solution: [['ev', 'disposed:heavy', 1], ['state', 'dirtyStart', 3], ['state', 'dirtyLeft', 0], ['state', 'mess', 0], ['deliver', null]],
  },
  {
    id: 'fireDrill',
    chapter: 0,
    pay: 20,
    par: 120,
    deliver: 'bell',
    setup: [{ kind: 'dish', at: 'bench', content: { liquid: ['etanolo', 8] }, fire: true }],
    steps: [
      { key: 'fireStep1', when: { or: [{ m: '$held', eq: 'extinguisher' }, { m: '$ev:fireOut', min: 1 }] } },
      { key: 'fireStep2', when: { all: [{ m: '$ev:fireOut', min: 1 }, { m: '$fires', max: 0 }] } },
      { key: 'stepBell', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evFireOut', m: '$ev:fireOut', target: 1, dir: 'min', tol: [0, 1], w: 0.7 },
      { line: 'evFireTime', m: '$fireTime', target: 20, dir: 'max', rel: true, tol: { real: [0.5, 3], simple: [1, 5] }, w: 0.3 },
    ],
    report: [
      { q: 'rq_fireA', opts: ['@rqo_fireA1', '@rqo_fireA2', '@rqo_fireA3'], a: 0 },
      { q: 'rq_fireB', opts: ['@rqo_fireB1', '@rqo_fireB2', '@rqo_fireB3'], a: 0 },
    ],
    book: ['tech:fire', 'safety:incidents'],
    solution: [['state', 'fires', 0], ['ev', 'fireOut', 1], ['state', 'fireTime', 9], ['deliver', null]],
  },

  // ------------------------------------------------------------ capitolo 1: misure e soluzioni
  {
    id: 'nacl',
    chapter: 1,
    pay: 30,
    par: 300,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'beaker250', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { reagent: 'water', at: 'shelf' },
      { reagent: 'nacl', at: 'shelf' },
    ],
    steps: [
      { key: 'naclStep1', when: { any: [{ m: 'grams:nacl', min: { real: 2.85, simple: 2.5 } }] } },
      { key: 'naclStep2', when: { any: [{ m: 'grams:nacl', min: 1 }, { m: 'volume', min: 90 }] } },
      { key: 'naclStep3', when: { any: [{ m: 'grams:nacl', min: 1 }, { m: 'volume', min: 50 }, { m: 'dissolvedFrac:nacl', min: 0.99 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evConc', m: 'molar:nacl', target: 0.5, rel: true, tol: [0.02, 0.12], w: 0.45, modes: ['real'] },
      { line: 'evSaltSimple', m: 'grams:nacl', target: 3, rel: true, tol: [0.08, 0.35], w: 0.45, modes: ['simple'] },
      { line: 'evVolume', m: 'volume', target: 100, rel: true, tol: { real: [0.02, 0.12], simple: [0.05, 0.3] }, w: 0.35 },
    ],
    penalties: [
      { line: 'evUndissolved', if: { m: 'undissolved:nacl', min: 0.03 }, minus: 0.14 },
      { line: 'evTapWater', if: { m: 'tap', min: 1 }, minus: 0.08, ok: 'warn', modes: ['real'] },
      { line: 'evImpure', if: { m: 'impure:nacl', min: 1 }, minus: 0.12, names: ['nacl'] },
    ],
    report: [
      { q: 'rq_naclA', opts: ['2,92 g', '5,84 g', '29,2 g', '0,5 g'], a: 0 },
      { q: 'rq_naclB', opts: ['@rqo_naclB1', '@rqo_naclB2', '@rqo_naclB3'], a: 0 },
    ],
    book: ['tech:dissolve', 'tool:washbottle', 'tool:cylinder'],
    solution: [['A', 'add', { solid: ['nacl', 2.922] }], ['A', 'fill', 100], ['A', 'wait', 30], ['deliver', 'A']],
  },
  {
    id: 'dilute',
    chapter: 1,
    pay: 30,
    par: 300,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { reagent: 'cuso4sol', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'dilStep1', when: { any: [{ m: 'mol:cuso4', min: { real: 0.0095, simple: 0.008 }, max: { real: 0.0105, simple: 0.012 } }] } },
      { key: 'dilStep2', when: { any: [{ m: 'molar:cuso4', min: 0.09, max: 0.11 }, { m: 'volume', min: 95, max: 105 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evConc', m: 'molar:cuso4', target: 0.1, rel: true, tol: { real: [0.02, 0.12], simple: [0.06, 0.3] }, w: 0.55 },
      { line: 'evVolume', m: 'volume', target: 100, rel: true, tol: { real: [0.02, 0.12], simple: [0.05, 0.3] }, w: 0.45 },
    ],
    penalties: [
      { line: 'evTapWater', if: { m: 'tap', min: 1 }, minus: 0.1, ok: 'warn', modes: ['real'] },
      { line: 'evImpure', if: { m: 'impure:cuso4', min: 1 }, minus: 0.3, names: ['cuso4'] },
    ],
    report: [
      { q: 'rq_dilA', opts: ['20 mL', '50 mL', '5 mL', '10 mL'], a: 0 },
      { q: 'rq_dilB', opts: ['@rqo_dilB1', '@rqo_dilB2', '@rqo_dilB3'], a: 0 },
    ],
    book: ['tech:dilute', 'tool:cylinder'],
    solution: [['A', 'reagent', 'cuso4sol', 20], ['A', 'fill', 100], ['deliver', 'A']],
  },
  {
    id: 'density',
    chapter: 1,
    pay: 30,
    par: 300,
    deliver: 'answers',
    setup: [
      { kind: 'bottleClear', at: 'bench', sample: 0 },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
    ],
    samples: {
      count: 1,
      pool: [
        { content: { liquid: ['etanolo', 200] }, answer: 'etanolo' },
        { content: { liquid: ['glicerolo', 200] }, answer: 'glicerolo' },
        { content: { solution: ['nacl', 3, 200] }, answer: 'brine' },
        { content: { liquid: ['acetone', 200] }, answer: 'acetone' },
      ],
    },
    answers: { type: 'number', count: 1, of: 'density', unit: 'g/mL', tol: { real: [0.025, 0.12], simple: [0.06, 0.25] } },
    steps: [
      { key: 'denStep1', when: { m: '$ev:tare', min: 1 } },
      { key: 'denStep2', when: { any: [{ kind: 'cylinder100' }, { m: 'volume', min: 40, max: 60 }] } },
      { key: 'denStep3', when: { m: '$answered', min: 1 } },
    ],
    goals: [{ answers: true }],
    report: [
      { q: 'rq_denA', opts: ['0,79 g/mL', '1,27 g/mL', '89,5 g/mL'], a: 0 },
      { q: 'rq_denB', opts: ['@rqo_denB1', '@rqo_denB2', '@rqo_denB3'], a: 0 },
    ],
    book: ['tool:balance', 'tool:cylinder', 'tech:meniscus'],
    solution: [['answer', 0, true]],
  },
  {
    id: 'saturated',
    chapter: 1,
    pay: 30,
    par: 360,
    setup: [
      { kind: 'beaker100', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { reagent: 'nacl', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'satStep1', when: { any: [{ m: 'volume', min: 40 }] } },
      { key: 'satStep2', when: { any: [{ m: 'undissolved:nacl', min: 0.2 }, { m: 'volume', min: 35 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evSaturated', m: 'saturation:nacl', target: 1, dir: 'min', rel: true, tol: { real: [0.01, 0.15], simple: [0.03, 0.3] }, w: 0.6, show: { scale: 100 } },
      { line: 'evSaltLeft', m: 'undissolved:nacl', target: 3, dir: 'max', tol: { real: [0, 7], simple: [2, 15] }, w: 0.2 },
      { line: 'evVolume', m: 'volume', target: 50, dir: 'min', rel: true, tol: [0.1, 0.5], w: 0.2 },
    ],
    penalties: [{ line: 'evImpure', if: { m: 'impure:nacl', min: 1 }, minus: 0.3, names: ['nacl'] }],
    report: [
      { q: 'rq_satA', opts: ['18 g', '36 g', '72 g', '3,6 g'], a: 0 },
      { q: 'rq_satB', opts: ['@rqo_satB1', '@rqo_satB2', '@rqo_satB3'], a: 0 },
    ],
    book: ['tech:dissolve', 'tech:crystallize'],
    solution: [['A', 'add', { water: 50 }], ['A', 'add', { solid: ['nacl', 19.5] }], ['A', 'wait', 120], ['deliver', 'A']],
  },
  {
    id: 'sugar',
    chapter: 1,
    pay: 30,
    par: 300,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { reagent: 'sucrose', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'sugStep1', when: { any: [{ m: 'grams:saccarosio', min: { real: 9.5, simple: 9 }, max: { real: 10.5, simple: 11 } }] } },
      { key: 'sugStep2', when: { any: [{ m: 'massPct:saccarosio', min: 9, max: 11 }, { m: 'dissolvedFrac:saccarosio', min: 0.99 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evMassPct', m: 'massPct:saccarosio', target: 10, rel: true, tol: { real: [0.02, 0.15], simple: [0.06, 0.35] }, w: 0.6 },
      { line: 'evMass', m: 'mass', target: 100, rel: true, tol: { real: [0.03, 0.2], simple: [0.08, 0.4] }, w: 0.4 },
    ],
    penalties: [
      { line: 'evUndissolvedSugar', if: { m: 'undissolved:saccarosio', min: 0.05 }, minus: 0.2 },
      { line: 'evImpure', if: { m: 'impure:saccarosio', min: 1 }, minus: 0.3, names: ['saccarosio'] },
    ],
    report: [
      { q: 'rq_sugA', opts: ['10 %', '11,1 %', '9 %', '90 %'], a: 0 },
      { q: 'rq_sugB', opts: ['@rqo_sugB1', '@rqo_sugB2', '@rqo_sugB3'], a: 0 },
    ],
    book: ['tech:weigh', 'tech:dissolve'],
    solution: [['A', 'add', { solid: ['saccarosio', 10] }], ['A', 'add', { water: 90.2 }], ['A', 'wait', 60], ['deliver', 'A']],
  },

  // ------------------------------------------------------------ capitolo 2: acidi e basi
  {
    id: 'phTest',
    chapter: 2,
    pay: 30,
    par: 300,
    deliver: 'answers',
    setup: [
      { kind: 'beaker100', at: 'bench', sample: 0 },
      { kind: 'beaker100', at: 'bench', sample: 1 },
      { kind: 'beaker100', at: 'bench', sample: 2 },
      { kind: 'strip', at: 'bench' },
      { kind: 'strip', at: 'bench' },
      { kind: 'strip', at: 'bench' },
    ],
    samples: {
      count: 3,
      oneOfEach: true,
      pool: [
        { content: { solution: ['hcl', 0.1, 60] }, answer: 'acid' },
        { content: { solution: ['acido-acetico', 0.8, 60] }, answer: 'acid' },
        { content: { solution: ['naoh', 0.1, 60] }, answer: 'basic' },
        { content: { solution: ['na2co3', 0.1, 60] }, answer: 'basic' },
        { content: { solution: ['nacl', 0.5, 60] }, answer: 'neutral' },
        { content: { solution: ['saccarosio', 0.3, 60] }, answer: 'neutral' },
      ],
    },
    answers: { type: 'choice', count: 3, options: ['acid', 'neutral', 'basic'] },
    steps: [
      { key: 'phStep1', when: { m: '$phRead', min: 1 } },
      { key: 'phStep2', when: { m: '$phRead', min: 3 } },
      { key: 'stepAnswer', when: { m: '$answered', min: 1 } },
    ],
    goals: [{ answers: true }],
    report: [
      { q: 'rq_phA', opts: ['@ans_acid', '@ans_neutral', '@ans_basic'], a: 0 },
      { q: 'rq_phB', opts: ['@rqo_phB1', '@rqo_phB2', '@rqo_phB3'], a: 0 },
    ],
    book: ['tool:strip', 'tool:phmeter', 'tech:ph'],
    solution: [['answer', 'all', true]],
  },
  {
    id: 'acidDilute',
    chapter: 2,
    pay: 30,
    par: 300,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { reagent: 'hcl1', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'adStep1', when: { any: [{ m: 'volume', min: 40 }, { m: 'mol:hcl', max: 1e-6 }] } },
      { key: 'adStep2', when: { any: [{ m: 'mol:hcl', min: { real: 0.0095, simple: 0.008 }, max: { real: 0.0105, simple: 0.012 } }] } },
      { key: 'adStep3', when: { any: [{ m: 'molar:hcl', min: 0.09, max: 0.11 }, { m: 'volume', min: 95, max: 105 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evConc', m: 'molar:hcl', target: 0.1, rel: true, tol: { real: [0.03, 0.15], simple: [0.08, 0.35] }, w: 0.5 },
      { line: 'evPH', m: 'ph', target: 1, tol: { real: [0.05, 0.4], simple: [0.15, 0.8] }, w: 0.2 },
      { line: 'evVolume', m: 'volume', target: 100, rel: true, tol: { real: [0.02, 0.12], simple: [0.05, 0.3] }, w: 0.3 },
    ],
    penalties: [{ line: 'evImpure', if: { m: 'impure:hcl', min: 1 }, minus: 0.3, names: ['hcl'] }],
    report: [
      { q: 'rq_adA', opts: ['@rqo_adA1', '@rqo_adA2', '@rqo_adA3'], a: 0 },
      { q: 'rq_adB', opts: ['@rqo_adB1', '@rqo_adB2', '@rqo_adB3'], a: 0 },
    ],
    book: ['tech:dilute', 'safety:ghs', 'safety:ppe'],
    solution: [['A', 'add', { water: 80 }], ['A', 'reagent', 'hcl1', 10], ['A', 'fill', 100], ['deliver', 'A']],
  },
  {
    id: 'neutral',
    chapter: 2,
    pay: 35,
    par: 360,
    setup: [
      { kind: 'flask250', at: 'bench', content: { solution: ['hcl', 0.1, 25] }, label: 'labelHclFlask' },
      { kind: 'beaker100', at: 'bench' },
      { reagent: 'naoh01', at: 'shelf' },
    ],
    steps: [
      { key: 'neuStep1', when: { m: '$phRead', min: 1 } },
      { key: 'neuStep2', when: { any: [{ m: 'mol:nacl', min: 0.0005 }] } },
      { key: 'neuStep3', when: { any: [{ m: 'mol:nacl', min: 0.002 }, { m: 'ph', min: 4, max: 10 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evPH', m: 'ph', target: 7, tol: { real: [3, 5.5], simple: [4, 6] }, w: 0.7 },
      { line: 'evSaltMade', m: 'mol:nacl', target: 0.0025, dir: 'min', rel: true, tol: [0.05, 0.5], w: 0.3, show: { scale: 1000 } },
    ],
    penalties: [{ line: 'evImpure', if: { m: 'impure:nacl,naoh,hcl', min: 1 }, minus: 0.3, names: ['nacl', 'naoh', 'hcl'] }],
    report: [
      { q: 'rq_neuA', opts: ['NaCl + H₂O', 'NaOH + HCl', 'Na + Cl₂ + H₂O'], a: 0 },
      { q: 'rq_neuB', opts: ['@rqo_neuB1', '@rqo_neuB2', '@rqo_neuB3'], a: 0 },
    ],
    book: ['tool:phmeter', 'tech:ph', 'tech:titrate'],
    solution: [['A', 'add', { solution: ['hcl', 0.1, 25] }], ['A', 'reagent', 'naoh01', 25], ['A', 'wait', 5], ['state', 'phRead', new Set([1])], ['deliver', 'A']],
  },
  {
    id: 'titration',
    chapter: 2,
    pay: 35,
    par: 300,
    setup: [
      { kind: 'flask250', at: 'bench', content: { solution: ['hcl', 0.1, 25] }, label: 'labelHclFlask' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { reagent: 'php', at: 'shelf' },
      { reagent: 'naoh01', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'titStep1', when: { any: [{ m: 'mol:php', min: 1e-9 }, { or: [{ m: 'mol:hcl', min: 1e-9 }, { m: 'mol:nacl', min: 1e-9 }] }] } },
      { key: 'titStep2', when: { any: [{ m: 'mol:nacl', min: 0.0005 }] } },
      { key: 'titStep3', when: { any: [{ m: 'mol:php', min: 1e-9 }, { m: 'pink', min: 0.25 }, { m: 'mol:nacl', min: 0.002 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evIndicator', m: 'mol:php', target: 1e-7, dir: 'min', rel: true, tol: [0, 0.99], gate: 0.4 },
      {
        line: 'evTitrationMl', m: 'sum:nacl,naoh', target: 0.0025, rel: true, show: { scale: 10000 },
        tol: { real: { under: [0.005, 0.12, 0.6], over: [0.02, 0.2] }, simple: { under: [0.04, 0.3], over: [0.06, 0.4] } },
      },
      { line: 'evPH', m: 'ph', range: { real: [7.5, 10], simple: [6.5, 10.5] } },
    ],
    penalties: [{ line: 'evImpure', if: { m: 'impure:nacl,naoh,hcl,php', min: 1 }, minus: 0.4, names: ['nacl', 'naoh', 'hcl', 'php'] }],
    report: [
      { q: 'rq_titA', opts: ['@rqo_titA1', '@rqo_titA2', '@rqo_titA3'], a: 0 },
      { q: 'rq_titB', opts: ['25 mL', '50 mL', '12,5 mL', '2,5 mL'], a: 0 },
    ],
    book: ['tool:burette', 'tool:dropper', 'tool:flask', 'tech:titrate'],
    solution: [['A', 'add', { solution: ['hcl', 0.1, 25] }], ['A', 'reagent', 'php', 0.2], ['A', 'reagent', 'naoh01', 25.1], ['A', 'wait', 5], ['deliver', 'A']],
  },
  {
    id: 'vinegar',
    chapter: 2,
    pay: 40,
    par: 420,
    deliver: 'answers',
    setup: [
      { kind: 'flask250', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { reagent: 'vinegar', at: 'shelf' },
      { reagent: 'naoh01', at: 'shelf' },
      { reagent: 'php', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    answers: { type: 'number', count: 1, value: 0.8, unit: 'mol/L', tol: { real: [0.05, 0.25], simple: [0.12, 0.45] } },
    steps: [
      { key: 'vinStep1', when: { any: [{ m: 'sum:acido-acetico,acetato-di-sodio', min: 0.0012, max: 0.0025 }] } },
      { key: 'vinStep2', when: { any: [{ m: 'mol:php', min: 1e-9 }, { m: 'sum:acido-acetico,acetato-di-sodio', min: 0.0008 }] } },
      { key: 'vinStep3', when: { any: [{ m: 'pink', min: 0.25 }, { m: 'mol:acetato-di-sodio', min: 0.001 }] } },
      { key: 'stepAnswer', when: { m: '$answered', min: 1 } },
    ],
    goals: [{ answers: true }],
    report: [
      { q: 'rq_vinA', opts: ['0,8 mol/L', '0,08 mol/L', '8 mol/L', '1,6 mol/L'], a: 0 },
      { q: 'rq_vinB', opts: ['@rqo_vinB1', '@rqo_vinB2', '@rqo_vinB3'], a: 0 },
    ],
    book: ['tool:pipette', 'tool:burette', 'tech:titrate'],
    solution: [['answer', 0, true]],
  },

  // ------------------------------------------------------------ capitolo 3: precipitazioni e analisi
  {
    id: 'goldrain',
    chapter: 3,
    pay: 40,
    par: 240,
    setup: [
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { reagent: 'pbno3', at: 'shelf' },
      { reagent: 'ki01', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'goldStep1', when: { any: [{ or: [{ m: 'mol:pbno32', min: 0.0008 }, { m: 'mol:pbi2', min: 0.0008 }] }] } },
      { key: 'goldStep2', when: { any: [{ m: 'mol:pbi2', min: { real: 0.0009, simple: 0.0005 } }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evPrecipitate', m: 'grams:pbi2', target: { real: 0.461, simple: 0.3 }, dir: 'min', rel: true, tol: { real: [0.1, 0.8], simple: [0, 0.9] }, w: { real: 0.7, simple: 1 } },
      { line: 'evExcess', m: 'leftover:pbi2:pbno32/1,ki/2', target: 0, dir: 'max', tol: [0.12, 1.2], w: 0.3, modes: ['real'], show: { scale: 100 } },
    ],
    report: [
      { q: 'rq_goldA', opts: ['0,2 mmol', '0,1 mmol', '0,05 mmol'], a: 0 },
      { q: 'rq_goldB', opts: ['PbI₂', 'KNO₃', 'KI'], a: 0 },
      { q: 'rq_goldC', opts: ['@rqo_goldC1', '@rqo_goldC2', '@rqo_goldC3'], a: 0 },
    ],
    book: ['tech:filter', 'safety:waste'],
    solution: [['A', 'add', { solution: ['pbno32', 0.1, 10] }], ['A', 'reagent', 'ki01', 20], ['A', 'wait', 10], ['deliver', 'A']],
  },
  {
    id: 'silver',
    chapter: 3,
    pay: 40,
    par: 300,
    setup: [
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker250', at: 'bench', content: { solution: ['nacl', 0.1, 60] }, label: 'labelNaclSol' },
      { kind: 'cylinder100', at: 'bench' },
      { reagent: 'agno3', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'agStep1', when: { any: [{ or: [{ m: 'mol:agno3', min: 0.0009 }, { m: 'mol:agcl', min: 0.0009 }] }] } },
      { key: 'agStep2', when: { any: [{ m: 'grams:agcl', min: 0.05 }] } },
      { key: 'agStep3', when: { any: [{ m: 'grams:agcl', min: 0.13 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evAgCl', m: 'grams:agcl', target: 0.143, dir: 'min', rel: true, tol: { real: [0.05, 0.6], simple: [0.15, 0.8] }, w: 0.6 },
      { line: 'evExcessAg', m: 'leftover:agcl:agno3/1,nacl/1', target: 0, dir: 'max', tol: { real: [0.2, 1.5], simple: [0.5, 3] }, w: 0.4, show: { scale: 100 } },
    ],
    report: [
      { q: 'rq_agA', opts: ['AgCl', 'NaNO₃', 'NaCl'], a: 0 },
      { q: 'rq_agB', opts: ['@rqo_agB1', '@rqo_agB2', '@rqo_agB3'], a: 0 },
    ],
    book: ['tool:dropper', 'safety:waste'],
    solution: [['A', 'reagent', 'agno3', 10], ['A', 'add', { solution: ['nacl', 0.1, 10.5] }], ['A', 'wait', 10], ['deliver', 'A']],
  },
  {
    id: 'filterBa',
    chapter: 3,
    pay: 40,
    par: 360,
    setup: [
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { reagent: 'bacl2', at: 'shelf' },
      { reagent: 'na2so4', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'baStep1', when: { any: [{ m: 'grams:baso4', min: 0.3 }] } },
      { key: 'baStep2', when: { any: [{ m: 'mol:nacl', min: 0.003 }, { m: 'solids', max: 0.005 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evClear', m: 'solids', target: 0, dir: 'max', tol: { real: [0.002, 0.05], simple: [0.01, 0.15] }, w: 0.5 },
      { line: 'evBaLeft', m: 'mol:bacl2', target: 0, dir: 'max', tol: [2e-5, 4e-4], w: 0.25, show: { scale: 1000 } },
      { line: 'evVolume', m: 'volume', target: 35, dir: 'min', rel: true, tol: [0.15, 0.6], w: 0.25 },
    ],
    report: [
      { q: 'rq_baA', opts: ['@rqo_baA1', 'BaSO₄', '@rqo_baA3'], a: 0 },
      { q: 'rq_baB', opts: ['@rqo_baB1', '@rqo_baB2', '@rqo_baB3'], a: 0 },
    ],
    book: ['tool:filter', 'tech:filter'],
    solution: [['A', 'reagent', 'bacl2', 20], ['A', 'reagent', 'na2so4', 25], ['A', 'wait', 10], ['A', 'filter', 'B'], ['deliver', 'B']],
  },
  {
    id: 'halides',
    chapter: 3,
    pay: 45,
    par: 360,
    deliver: 'answers',
    setup: [
      { kind: 'beaker100', at: 'bench', sample: 0 },
      { kind: 'beaker100', at: 'bench', sample: 1 },
      { kind: 'beaker100', at: 'bench', sample: 2 },
      { reagent: 'agno3', at: 'shelf' },
    ],
    samples: {
      count: 3,
      oneOfEach: true,
      pool: [
        { content: { solution: ['nacl', 0.1, 40] }, answer: 'Cl' },
        { content: { solution: ['kbr', 0.1, 40] }, answer: 'Br' },
        { content: { solution: ['ki', 0.1, 40] }, answer: 'I' },
      ],
    },
    answers: { type: 'choice', count: 3, options: ['Cl', 'Br', 'I'] },
    steps: [
      { key: 'halStep1', when: { count: [{ or: [{ m: 'grams:agcl', min: 0.002 }, { m: 'grams:agbr', min: 0.002 }, { m: 'grams:agi', min: 0.002 }] }], min: 1 } },
      { key: 'halStep2', when: { count: [{ or: [{ m: 'grams:agcl', min: 0.002 }, { m: 'grams:agbr', min: 0.002 }, { m: 'grams:agi', min: 0.002 }] }], min: 3 } },
      { key: 'stepAnswer', when: { m: '$answered', min: 1 } },
    ],
    goals: [{ answers: true }],
    report: [
      { q: 'rq_halA', opts: ['@col_yellow', '@col_white', '@col_blue'], a: 0 },
      { q: 'rq_halB', opts: ['@rqo_halB1', '@rqo_halB2', '@rqo_halB3'], a: 0 },
    ],
    book: ['tool:dropper', 'safety:incompatible'],
    solution: [['answer', 'all', true]],
  },
  {
    id: 'cations',
    chapter: 3,
    pay: 45,
    par: 360,
    deliver: 'answers',
    setup: [
      { kind: 'beaker100', at: 'bench', sample: 0 },
      { kind: 'beaker100', at: 'bench', sample: 1 },
      { kind: 'beaker100', at: 'bench', sample: 2 },
      { reagent: 'naoh01', at: 'shelf' },
    ],
    samples: {
      count: 3,
      pool: [
        { content: { solution: ['cuso4', 0.1, 40] }, answer: 'Cu' },
        { content: { solution: ['fecl3', 0.1, 40] }, answer: 'Fe3' },
        { content: { solution: ['feso4', 0.1, 40] }, answer: 'Fe2' },
        { content: { solution: ['mgso4', 0.1, 40] }, answer: 'Mg' },
      ],
    },
    answers: { type: 'choice', count: 3, options: ['Cu', 'Fe3', 'Fe2', 'Mg'] },
    steps: [
      { key: 'catStep1', when: { count: [{ or: [{ m: 'grams:cuoh2', min: 0.002 }, { m: 'grams:feoh3', min: 0.002 }, { m: 'grams:feoh2', min: 0.002 }, { m: 'grams:mgoh2', min: 0.002 }] }], min: 1 } },
      { key: 'catStep2', when: { count: [{ or: [{ m: 'grams:cuoh2', min: 0.002 }, { m: 'grams:feoh3', min: 0.002 }, { m: 'grams:feoh2', min: 0.002 }, { m: 'grams:mgoh2', min: 0.002 }] }], min: 3 } },
      { key: 'stepAnswer', when: { m: '$answered', min: 1 } },
    ],
    goals: [{ answers: true }],
    report: [
      { q: 'rq_catA', opts: ['Cu(OH)₂', 'Fe(OH)₃', 'Mg(OH)₂'], a: 0 },
      { q: 'rq_catB', opts: ['@ans_Fe3', '@ans_Cu', '@ans_Mg'], a: 0 },
    ],
    book: ['tool:dropper', 'safety:ghs'],
    solution: [['answer', 'all', true]],
  },

  // ------------------------------------------------------------ capitolo 4: gas
  {
    id: 'hydrogen',
    chapter: 4,
    pay: 40,
    par: 300,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { reagent: 'zn', at: 'shelf' },
      { reagent: 'hcl1', at: 'shelf' },
    ],
    steps: [
      { key: 'hydStep1', when: { any: [{ m: 'grams:Zn', min: 0.7, max: 2 }] } },
      { key: 'hydStep2', when: { m: '$gas:H', min: 0.0005 } },
      { key: 'hydStep3', when: { m: '$gas:H', min: 0.011 } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evGasH2', m: '$gas:H', target: 0.0125, dir: 'min', rel: true, tol: { real: [0.05, 0.7], simple: [0.15, 0.85] }, w: 0.6, show: { scale: ML_PER_MOL } },
      { line: 'evZnCl2', m: 'mol:zncl2', target: 0.0125, dir: 'min', rel: true, tol: [0.05, 0.6], w: 0.4, show: { scale: 1000 } },
    ],
    report: [
      { q: 'rq_hydA', opts: ['12,5 mmol', '25 mmol', '50 mmol'], a: 0 },
      { q: 'rq_hydB', opts: ['@rqo_hydB1', '@rqo_hydB2', '@rqo_hydB3'], a: 0 },
    ],
    book: ['tech:gas', 'safety:incompatible'],
    solution: [['A', 'add', { solid: ['Zn', 1] }], ['A', 'reagent', 'hcl1', 25], ['A', 'wait', 180], ['deliver', 'A']],
  },
  {
    id: 'volcano',
    chapter: 4,
    pay: 35,
    par: 240,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { reagent: 'nahco3', at: 'shelf' },
      { reagent: 'vinegar', at: 'shelf' },
    ],
    steps: [
      { key: 'volStep1', when: { any: [{ or: [{ m: 'grams:nahco3', min: 1.6 }, { m: 'mol:acetato-di-sodio', min: 0.019 }] }] } },
      { key: 'volStep2', when: { m: '$gas:co2', min: 0.004 } },
      { key: 'volStep3', when: { any: [{ m: 'tempC', max: 20.5 }, { m: 'mol:acetato-di-sodio', min: 0.005 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evGasCO2', m: '$gas:co2', target: 0.0238, dir: 'min', rel: true, tol: { real: [0.08, 0.7], simple: [0.15, 0.85] }, w: 0.6, show: { scale: ML_PER_MOL } },
      { line: 'evAcetate', m: 'mol:acetato-di-sodio', target: 0.023, dir: 'min', rel: true, tol: [0.1, 0.7], w: 0.4, show: { scale: 1000 } },
    ],
    report: [
      { q: 'rq_volA', opts: ['CO₂', 'H₂', 'O₂'], a: 0 },
      { q: 'rq_volB', opts: ['@rqo_endo', '@rqo_exo', '@rqo_athermic'], a: 0 },
    ],
    book: ['tech:gas', 'tool:thermometer'],
    solution: [['A', 'add', { solid: ['nahco3', 2] }], ['A', 'reagent', 'vinegar', 30], ['A', 'wait', 90], ['deliver', 'A']],
  },
  {
    id: 'oxygen',
    chapter: 4,
    pay: 40,
    par: 300,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { reagent: 'h2o2', at: 'shelf' },
      { reagent: 'mno2', at: 'shelf' },
    ],
    steps: [
      { key: 'oxyStep1', when: { any: [{ m: 'mol:h2o2', min: 0.012 }] } },
      { key: 'oxyStep2', when: { m: '$gas:O', min: 0.001 } },
      { key: 'oxyStep3', when: { m: '$gas:O', min: 0.008 } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evGasO2', m: '$gas:O', target: 0.009, dir: 'min', rel: true, tol: { real: [0.08, 0.7], simple: [0.15, 0.85] }, w: 0.5, show: { scale: ML_PER_MOL } },
      { line: 'evCatalyst', m: 'grams:mno2', target: 0.05, dir: 'min', rel: true, tol: [0, 1], w: 0.2 },
      { line: 'evH2O2Left', m: 'mol:h2o2', target: 0, dir: 'max', tol: [0.0005, 0.01], w: 0.3, show: { scale: 1000 } },
    ],
    report: [
      { q: 'rq_oxyA', opts: ['@rqo_oxyA1', '@rqo_oxyA2', '@rqo_oxyA3'], a: 0 },
      { q: 'rq_oxyB', opts: ['9 mmol', '18 mmol', '36 mmol'], a: 0 },
    ],
    book: ['tech:gas', 'safety:ghs'],
    solution: [['A', 'reagent', 'h2o2', 20], ['A', 'add', { solid: ['mno2', 0.5] }], ['A', 'wait', 120], ['deliver', 'A']],
  },
  {
    id: 'limewater',
    chapter: 4,
    pay: 40,
    par: 300,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { reagent: 'limewater', at: 'shelf' },
    ],
    steps: [
      { key: 'limStep1', when: { any: [{ m: 'mol:caoh2', min: 0.0008 }] } },
      { key: 'limStep2', when: { any: [{ m: 'grams:caco3', min: 0.01 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [{ line: 'evCaCO3', m: 'grams:caco3', target: 0.07, dir: 'min', rel: true, tol: { real: [0.1, 0.85], simple: [0.25, 0.95] } }],
    report: [
      { q: 'rq_limA', opts: ['CaCO₃ + H₂O', 'CaO + H₂CO₃', 'Ca + CO₂ + H₂O'], a: 0 },
      { q: 'rq_limB', opts: ['@rqo_limB1', '@rqo_limB2', '@rqo_limB3'], a: 0 },
    ],
    book: ['tool:cylinders', 'tool:hood', 'tech:gas'],
    solution: [['A', 'reagent', 'limewater', 50], ['A', 'gas', 'co2', 3], ['A', 'wait', 5], ['deliver', 'A']],
  },
  {
    id: 'ammonia',
    chapter: 4,
    pay: 40,
    par: 300,
    setup: [
      { kind: 'beaker250', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { reagent: 'water', at: 'shelf' },
      { reagent: 'php', at: 'shelf' },
    ],
    steps: [
      { key: 'ammStep1', when: { any: [{ m: 'volume', min: 50 }, { m: 'mol:php', min: 1e-9 }] } },
      { key: 'ammStep2', when: { any: [{ m: 'mol:nh3', min: 0.0003 }] } },
      { key: 'ammStep3', when: { any: [{ m: 'pink', min: 0.25 }, { m: 'mol:nh3', min: 0.0003 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [
      { line: 'evPink', m: 'pink', target: 0.3, dir: 'min', rel: true, tol: [0.2, 1], w: 0.5, show: { scale: 100 } },
      { line: 'evPHBasic', m: 'ph', target: 10.5, dir: 'min', tol: [0.3, 2.5], w: 0.5 },
    ],
    report: [
      { q: 'rq_ammA', opts: ['@ans_basic', '@ans_acid', '@ans_neutral'], a: 0 },
      { q: 'rq_ammB', opts: ['@rqo_ammB1', '@rqo_ammB2', '@rqo_ammB3'], a: 0 },
    ],
    book: ['tool:cylinders', 'tool:hood', 'tech:ph'],
    solution: [['A', 'add', { water: 100 }], ['A', 'reagent', 'php', 0.2], ['A', 'gas', 'nh3', 4], ['A', 'wait', 3], ['deliver', 'A']],
  },

  // ------------------------------------------------------------ capitoli 5 e 7: le esercitazioni che c'erano già
  {
    id: 'crystals',
    chapter: 5,
    pay: 45,
    par: 420,
    setup: [
      { kind: 'beaker100', at: 'bench' },
      { kind: 'beaker100', at: 'bench' },
      { kind: 'cylinder100', at: 'bench' },
      { kind: 'spatula', at: 'bench' },
      { reagent: 'cuso4', at: 'shelf' },
      { reagent: 'water', at: 'shelf' },
    ],
    steps: [
      { key: 'cryStep1', when: { any: [{ m: 'aq:cuso4', min: 0.02 }] } },
      { key: 'cryStep2', when: { any: [{ m: 'sum:cuso4,cuso4-5h2o', min: 0.02 }, { m: 'peakC', min: 87 }] } },
      { key: 'cryStep3', when: { any: [{ m: 'grams:cuso4-5h2o', min: 1.5 }, { m: 'tempC', max: 37 }] } },
      { key: 'stepDeliver', when: { m: '$delivered', min: 1 } },
    ],
    goals: [{ line: 'evCrystals', m: 'grams:cuso4-5h2o', target: { real: 4, simple: 2 }, dir: 'min', rel: true, tol: [0, 0.85] }],
    penalties: [
      { line: 'evBurnt', if: { m: 'undissolved:cuso4', min: 0.3 }, minus: { real: 0.5, simple: 0.3 } },
      { line: 'evHot', if: { m: 'tempC', min: 40 }, minus: 0.2, ok: 'warn' },
    ],
    report: [
      { q: 'rq_cryA', opts: ['@rqo_cryA1', '@rqo_cryA2', '@rqo_cryA3'], a: 0 },
      { q: 'rq_cryB', opts: ['@rqo_cryB1', '@rqo_cryB2', '@rqo_cryB3'], a: 0 },
    ],
    book: ['tech:crystallize', 'tech:heat', 'tool:hotplate'],
    solution: [['A', 'add', { solid: ['cuso4-5h2o', 12] }], ['A', 'add', { water: 25 }], ['A', 'heat', 98, 200], ['A', 'cool', 400], ['deliver', 'A']],
  },
  {
    id: 'flame',
    chapter: 7,
    pay: 40,
    par: 240,
    deliver: 'answers',
    setup: [
      { kind: 'loop', at: 'bench' },
      { kind: 'jarGlass', at: 'bench', sample: 0 },
      { kind: 'jarGlass', at: 'bench', sample: 1 },
      { kind: 'jarGlass', at: 'bench', sample: 2 },
      { reagent: 'hcl1', at: 'shelf' },
      { kind: 'beaker100', at: 'bench' },
    ],
    samples: {
      count: 3,
      pool: [
        { content: { solid: ['licl', 15] }, answer: 'Li' },
        { content: { solid: ['nacl', 15] }, answer: 'Na' },
        { content: { solid: ['kcl', 15] }, answer: 'K' },
        { content: { solid: ['cacl2', 15] }, answer: 'Ca' },
        { content: { solid: ['srcl2', 15] }, answer: 'Sr' },
        { content: { solid: ['bacl2', 15] }, answer: 'Ba' },
        { content: { solid: ['cucl2', 15] }, answer: 'Cu' },
      ],
    },
    answers: { type: 'choice', count: 3, options: 'flame' },
    steps: [
      { key: 'flameStep1', when: { or: [{ m: '$bunsen', min: 1 }, { m: '$flame', min: 1 }] } },
      { key: 'flameStep2', when: { m: '$flame', min: 3 } },
      { key: 'flameStep3', when: { m: '$answered', min: 1 } },
    ],
    goals: [{ answers: true }],
    report: [
      { q: 'rq_flaA', opts: ['@col_yellow', '@col_red', '@col_green'], a: 0 },
      { q: 'rq_flaB', opts: ['@rqo_flaB1', '@rqo_flaB2', '@rqo_flaB3'], a: 0 },
    ],
    book: ['tool:loop', 'tool:bunsen', 'tech:flametest'],
    solution: [['answer', 'all', true]],
  },
];

/** Tutte le esercitazioni, nell'ordine dei capitoli (dentro un capitolo vale l'ordine della lista: le verifiche sono in fondo). */
export const EXERCISES = [...BASE_EXERCISES, ...LATE_EXERCISES];
