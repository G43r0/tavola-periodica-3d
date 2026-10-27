// La Carriera: un anno scolastico in capitoli, con le esercitazioni scritte come dati (data/career-exercises.js).
// Questo modulo puro (niente Three.js né DOM) sa leggere quei dati: misure sulle miscele e sullo stato del banco,
// condizioni dei passi, valutazione del preparato con le tolleranze della chimica realistica e semplificata, risposte,
// relazione di laboratorio, reputazione con l'insegnante, capitoli sbloccati e negozio. In più esegue la «soluzione»
// scritta nei dati di ogni esercitazione con il motore dei contenitori, così i test provano che ognuna si può risolvere.
import { Mixture } from './mixture.js';
import { SOLID } from '../sandbox/substances.js';
import { SHELF, CABINET, SOLUBILITY, FLAME_SALTS } from './reagents.js';
import { GAS_FLOW, splitVapours } from './apparatus-logic.js';
import { score, grade } from './orders.js';
import { EXERCISES, CHALLENGES } from './data/career-exercises.js';

export { EXERCISES, CHALLENGES, score, grade };

/**
 * Capitoli dell'anno. rep: reputazione minima per aprirlo (oltre ad aver superato il capitolo prima); groups: gruppi di
 * reazioni del catalogo le cui ricette del libro si sbloccano con il capitolo. Ogni capitolo da 1 a 8 finisce con una
 * verifica (esercitazione con exam: true); il 9 è l'esame di fine anno, tre prove con il loro voto.
 */
export const CHAPTERS = [
  { id: 0, rep: 0, groups: [] },
  { id: 1, rep: 5, groups: [] },
  { id: 2, rep: 20, groups: ['acidi-basi'] },
  { id: 3, rep: 35, groups: ['precipitazioni', 'ioni'] },
  { id: 4, rep: 50, groups: ['spostamento', 'decomposizioni'] },
  { id: 5, rep: 60, groups: ['acqua', 'addizione'] },
  { id: 6, rep: 70, groups: ['redox', 'metallurgia'] },
  { id: 7, rep: 78, groups: ['combustioni', 'sintesi-elementi'] },
  { id: 8, rep: 86, groups: ['organica'] },
  { id: 9, rep: 94, groups: ['industria'] },
];

/** Pagine del libro sempre aperte nella Carriera: la sicurezza (le si legge prima di entrare in laboratorio). */
export const BASE_PAGES = ['safety:ghs', 'safety:ppe', 'safety:incompatible', 'safety:incidents', 'safety:waste'];

export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

/** Esercitazioni di un capitolo, nell'ordine dei dati (le richieste extra sono a parte). */
export const chapterExercises = (ch) => EXERCISES.filter((e) => e.chapter === ch && !e.extra);

/** Richieste extra: esercitazioni facoltative che si aprono con un capitolo completato e la reputazione richiesta. */
export const EXTRAS = EXERCISES.filter((e) => e.extra);

/** Verifiche di fine capitolo (e le prove dell'esame finale): danno un voto da 4 a 10. */
export const EXAMS = EXERCISES.filter((e) => e.exam);

/** Stelle per superare un'esercitazione (e contare per aprire il capitolo dopo). */
export const PASS_STARS = 2;

/** Titoli dello studente per la reputazione (chiavi rep_<id>), dal più basso. */
export const REP_TITLES = [
  { id: 'freshman', min: 0 },
  { id: 'apprentice', min: 15 },
  { id: 'assistant', min: 35 },
  { id: 'technician', min: 55 },
  { id: 'chemist', min: 75 },
  { id: 'head', min: 92 },
];

// ------------------------------------------------------------------ misure

const pickMode = (v, mode) => (v !== null && typeof v === 'object' && !Array.isArray(v) && ('real' in v || 'simple' in v) ? v[mode] ?? v.real : v);
const sidOf = (ctx, key) => ctx.id(key) || key;

/** Solubilità (g di soluto anidro in 100 g d'acqua) alla temperatura T (K), interpolata nella tabella. */
export function solubilityAt(key, T) {
  const tab = SOLUBILITY[key];
  if (!tab) return 50;
  const c = T - 273.15;
  if (c <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (c <= tab[i][0]) {
      const [a, va] = tab[i - 1];
      const [b, vb] = tab[i];
      return va + ((vb - va) * (c - a)) / (b - a);
    }
  }
  return tab[tab.length - 1][1];
}

/** Grammi di soluto non sciolto (sul fondo). */
function undissolvedGrams(m, key) {
  const ctx = m.ctx;
  const sid = sidOf(ctx, key);
  const mol = m.n.get(sid) ?? 0;
  return Math.max(0, (mol - (m.d.get(sid) ?? 0)) * (typeof sid === 'string' ? 0 : ctx.molar(sid)));
}

/** Grammi di tutti i solidi non sciolti. */
function solidGrams(m) {
  const ctx = m.ctx;
  let g = 0;
  for (const [sid, mol] of m.n) {
    if (typeof sid === 'string' || mol < 1e-9) continue;
    const free = mol - (m.d.get(sid) ?? 0);
    if (free > 1e-9 && m.phaseOf(sid) === SOLID) g += free * ctx.molar(sid);
  }
  return g;
}

/** Sostanze estranee (oltre all'acqua e a quelle ammesse) e sali dell'acqua del rubinetto. */
export function foreign(m, allowed) {
  const ctx = m.ctx;
  const ok = new Set(['water', ...allowed].map((k) => sidOf(ctx, k)));
  const tap = new Set(['cacl2', 'nahco3'].map((k) => ctx.id(k)));
  let tapFound = false;
  const names = [];
  for (const [sid, mol] of m.n) {
    if (mol < 1e-6 || ok.has(sid)) continue;
    if (tap.has(sid)) tapFound = true;
    else names.push(typeof sid === 'string' ? sid : ctx.name(sid));
  }
  return { tap: tapFound, count: names.length, names: names.slice(0, 3).join(', ') };
}

/**
 * Valore di una misura su una miscela. spec: 'grams:K' 'mol:K' 'aq:K' (moli sciolte) 'molar:K' 'sum:K1,K2' (moli)
 * 'volume' (mL) 'mass' (g) 'ph' 'tempC' 'peakC' (la temperatura più alta raggiunta, m.peakT) 'pink' 'solids' (g non sciolti) 'undissolved:K' (g) 'dissolvedFrac:K'
 * 'massPct:K' 'saturation:K' (1 = satura) 'density' (g/mL) 'impure:K1,K2' (sostanze estranee) 'tap' (0/1)
 * 'leftover:P:R1/c1,R2/c2' (reagente rimasto rispetto al prodotto, 0 = nessun eccesso).
 */
export function mixMeasure(m, spec) {
  if (!m) return 0;
  const ctx = m.ctx;
  const i = spec.indexOf(':');
  const name = i < 0 ? spec : spec.slice(0, i);
  const arg = i < 0 ? '' : spec.slice(i + 1);
  switch (name) {
    case 'grams':
      return m.grams(arg);
    case 'mol':
      return m.amount(sidOf(ctx, arg));
    case 'aq':
      return m.dissolved(sidOf(ctx, arg));
    case 'molar':
      return m.molarity(arg);
    case 'sum':
      return arg.split(',').reduce((s, k) => s + m.amount(sidOf(ctx, k)), 0);
    case 'volume':
      return m.liquidVolume;
    case 'mass':
      return m.mass;
    case 'ph':
      return m.pH() ?? 7;
    case 'tempC':
      return m.T - 273.15;
    case 'peakC':
      return (m.peakT ?? m.T) - 273.15;
    case 'pink':
      return m.isEmpty() ? 0 : m.appearance().pink ?? 0;
    case 'solids':
      return solidGrams(m);
    case 'undissolved':
      return undissolvedGrams(m, arg);
    case 'dissolvedFrac': {
      const a = m.amount(sidOf(ctx, arg));
      return a > 0 ? m.dissolved(sidOf(ctx, arg)) / a : 0;
    }
    case 'massPct':
      return m.mass > 0 ? (m.grams(arg) / m.mass) * 100 : 0;
    case 'saturation': {
      if (undissolvedGrams(m, arg) > 0.02) return 1;
      const w = m.water;
      if (w <= 0) return 0;
      const sid = sidOf(ctx, arg);
      return (m.dissolved(sid) * ctx.molar(sid)) / ((solubilityAt(arg, m.T) * w) / 100);
    }
    case 'density': {
      const v = m.liquidVolume;
      return v > 0 ? (m.mass - solidGrams(m)) / v : 0;
    }
    case 'impure':
      return foreign(m, arg ? arg.split(',') : []).count;
    case 'tap':
      return foreign(m, []).tap ? 1 : 0;
    case 'leftover': {
      const [p, list] = arg.split(':');
      const made = m.amount(sidOf(ctx, p));
      if (made <= 0) return 1;
      return Math.max(...list.split(',').map((x) => {
        const [k, c] = x.split('/');
        return m.amount(sidOf(ctx, k)) / Number(c || 1);
      })) / made;
    }
    default:
      throw new Error(`misura sconosciuta: ${spec}`);
  }
}

/**
 * Valore di una misura sullo stato del banco (spec che comincia con «$»): '$delivered' '$answered' '$ev:NOME' '$gas:K'
 * (moli uscite dai recipienti; s.gas è per id della sostanza e s.ctx la chimica) '$rx:ID' '$flame' '$bunsen' '$fires' '$mess' '$dirtyLeft' '$cleanFrac' '$held' (tipo dell'oggetto in mano)
 * '$tray' (recipienti sul vassoio) '$phRead' (campioni misurati) '$fireTime' (s per spegnere il fuoco).
 */
export function stateMeasure(s, spec) {
  const i = spec.indexOf(':');
  const name = i < 0 ? spec.slice(1) : spec.slice(1, i);
  const arg = i < 0 ? '' : spec.slice(i + 1);
  switch (name) {
    case 'delivered':
      return s.delivered ? 1 : 0;
    case 'answered':
      return s.answers ? 1 : 0;
    case 'ev':
      return s.ev?.[arg] ?? 0;
    case 'gas':
      return s.gas?.[s.ctx ? s.ctx.id(arg) : arg] ?? 0;
    case 'rx':
      return s.rx?.has(arg) ? 1 : 0;
    case 'flame':
      return s.flame?.size ?? 0;
    case 'bunsen':
      return s.bunsen ? 1 : 0;
    case 'fires':
      return s.fires ?? 0;
    case 'mess':
      return s.mess ?? 0;
    case 'dirtyLeft':
      return s.dirtyLeft ?? 0;
    case 'cleanFrac':
      return s.dirtyStart ? 1 - (s.dirtyLeft ?? 0) / s.dirtyStart : 1;
    case 'held':
      return s.held ?? '';
    case 'tray':
      return s.tray ?? 0;
    case 'phRead':
      return s.phRead?.size ?? 0;
    case 'fireTime':
      return s.fireTime ?? Infinity;
    default:
      throw new Error(`misura sconosciuta: ${spec}`);
  }
}

/** Una condizione semplice { m, min, max, eq } (soglie anche diverse per modalità) su un valore. */
function within(v, c, mode) {
  if (c.eq !== undefined) return v === c.eq;
  const min = pickMode(c.min, mode);
  const max = pickMode(c.max, mode);
  return (min === undefined || v >= min) && (max === undefined || v <= max);
}

/** Condizione su un contenitore: misure della sua miscela, il tipo ({ kind }), un'alternativa ({ or }). */
function containerOk(c, conds, mode) {
  return conds.every((x) => {
    if (x.or) return x.or.some((y) => containerOk(c, [y], mode));
    if (x.kind) return c.kind === x.kind;
    if (x.sample !== undefined) return c.sample === x.sample;
    return within(mixMeasure(c.mix, x.m), x, mode);
  });
}

/**
 * Condizione sullo stato del banco: { m: '$…' } sullo stato, { m: '…' } sul preparato consegnato, { any: [...] } un
 * contenitore che soddisfa tutto, { count: [...], min } quanti, { none: [...] } nessuno, { all } e { or }.
 */
export function check(s, c, mode = s.mode) {
  if (c.all) return c.all.every((x) => check(s, x, mode));
  if (c.or) return c.or.some((x) => check(s, x, mode));
  const list = s.containers ?? [];
  if (c.any) return list.some((k) => containerOk(k, c.any, mode));
  if (c.none) return !list.some((k) => containerOk(k, c.none, mode));
  if (c.count) return within(list.filter((k) => containerOk(k, c.count, mode)).length, c, mode);
  const v = c.m.startsWith('$') ? stateMeasure(s, c.m) : mixMeasure(s.product, c.m);
  return within(v, c, mode);
}

/** Testi della lavagna e dei passi: i passi fatti restano fatti (latch) e uno dopo completa anche quelli prima. */
export function stepsDone(ex, s, mode, prev = []) {
  const done = ex.steps.map((st, i) => Boolean(prev[i]) || check(s, st.when, mode));
  const last = done.lastIndexOf(true);
  return done.map((d, i) => d || i < last);
}

// ------------------------------------------------------------------ campioni e risposte

/** Mescola un array con un generatore casuale (Fisher–Yates). */
function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Campioni incogniti di un'esercitazione: ex.samples = { pool: [{ content, answer }], count, oneOfEach? }. Con
 * oneOfEach ce n'è uno per ogni risposta possibile, in ordine casuale.
 */
export function pickSamples(ex, rand = Math.random) {
  const sp = ex.samples;
  if (!sp) return [];
  if (sp.oneOfEach) {
    const answers = [...new Set(sp.pool.map((p) => p.answer))];
    return shuffle(answers.map((a) => shuffle(sp.pool.filter((p) => p.answer === a), rand)[0]), rand).slice(0, sp.count ?? answers.length);
  }
  return shuffle(sp.pool, rand).slice(0, sp.count ?? 1);
}

/** Risposte possibili (valori) per un'esercitazione con risposte a scelta. */
export function answerOptions(ex) {
  const a = ex.answers;
  if (!a || a.type !== 'choice') return [];
  if (a.options === 'flame') return [...new Set(Object.values(FLAME_SALTS))];
  return a.options;
}

/** Valore giusto della risposta i: la risposta del campione, un valore fisso o una misura sul campione. */
export function rightAnswer(ex, unknowns, i) {
  const a = ex.answers;
  if (a.value !== undefined) return a.value;
  const u = unknowns[i];
  if (a.of) return u?.value;
  return u?.answer;
}

/** Punteggio di una risposta: 1 o 0 a scelta, con la tolleranza (relativa) per un numero. */
export function answerScore(ex, unknowns, answers, i, mode) {
  const a = ex.answers;
  const right = rightAnswer(ex, unknowns, i);
  const given = answers?.[i];
  if (a.type === 'number') {
    const v = Number(String(given ?? '').replace(',', '.'));
    if (!Number.isFinite(v) || given === '' || given === undefined) return 0;
    const [full, zero] = pickMode(a.tol, mode);
    return score(Math.abs(v - right) / Math.abs(right), full, zero);
  }
  return given === right ? 1 : 0;
}

/** Numero di risposte che l'esercitazione chiede. */
export const answerCount = (ex, unknowns) => (ex.answers ? ex.answers.count ?? Math.max(1, unknowns.length) : 0);

// ------------------------------------------------------------------ valutazione

const mark = (q) => (q > 0.8 ? true : q > 0.3 ? 'warn' : false);

/** Punteggio di un obiettivo { m, target, dir, rel, tol } su un valore. */
function goalScore(g, v, mode) {
  const t = pickMode(g.target, mode);
  const tol = pickMode(g.tol, mode);
  const d = g.dir ?? 'both';
  let under = Math.max(0, t - v);
  let over = Math.max(0, v - t);
  if (d === 'min') over = 0;
  if (d === 'max') under = 0;
  const den = g.rel ? Math.abs(t) || 1 : 1;
  if (tol.under || tol.over) {
    if (under > 0) return score(under / den, tol.under[0], tol.under[1]) * (tol.under[2] ?? 1);
    return score(over / den, tol.over[0], tol.over[1]);
  }
  return score((under + over) / den, tol[0], tol[1]);
}

/**
 * Valuta un'esercitazione sullo stato finale: s.product è la miscela consegnata (null se non c'è), s.answers le
 * risposte. Restituisce la qualità (0–1) e le righe del resoconto ({ ok, key, p }).
 */
export function evaluateExercise(ex, s, mode = s.mode) {
  const lines = [];
  const needsProduct = (ex.deliver ?? 'tray') === 'tray';
  if (needsProduct && !s.product) return { quality: 0, lines: [{ ok: false, key: 'evNoProduct' }] };
  let sum = 0;
  let wsum = 0;
  let gate = 1;
  for (const g of ex.goals) {
    if (g.modes && !g.modes.includes(mode)) continue;
    const w = pickMode(g.w ?? 1, mode);
    if (g.answers) {
      const n = answerCount(ex, s.unknowns ?? []);
      let right = 0;
      for (let i = 0; i < n; i++) {
        const q = answerScore(ex, s.unknowns ?? [], s.answers, i, mode);
        right += q;
        lines.push({ ok: mark(q), key: ex.answers.type === 'number' ? 'evAnswerNum' : 'evSampleAns', p: { sample: 'ABCDE'[i], answer: s.answers?.[i] ?? '—', right: rightAnswer(ex, s.unknowns ?? [], i), unit: ex.answers.unit ?? '', ex: ex.id, i } });
      }
      sum += (w * right) / Math.max(1, n);
      wsum += w;
      continue;
    }
    const v = g.m.startsWith('$') ? stateMeasure(s, g.m) : mixMeasure(s.product, g.m);
    const scale = g.show?.scale ?? 1;
    const p = { value: v * scale, target: (pickMode(g.target, mode) ?? 0) * scale };
    if (g.range) {
      // solo una riga del resoconto: il valore è nell'intervallo giusto?
      const [lo, hi] = pickMode(g.range, mode);
      lines.push({ ok: v >= lo && v <= hi ? true : 'warn', key: g.line, p: { value: v * scale } });
      continue;
    }
    const q = goalScore(g, v, mode);
    lines.push({ ok: mark(q), key: g.line, p });
    if (g.gate !== undefined) {
      if (q < 0.5) gate *= g.gate;
      continue;
    }
    sum += w * q;
    wsum += w;
  }
  let quality = (wsum > 0 ? sum / wsum : 1) * gate;
  for (const pen of ex.penalties ?? []) {
    if (pen.modes && !pen.modes.includes(mode)) continue;
    if (!check(s, pen.if, mode)) continue;
    const v = pen.if.m && !pen.if.m.startsWith('$') ? mixMeasure(s.product, pen.if.m) : null;
    const minus = pickMode(pen.minus, mode);
    quality -= minus;
    const p = { value: v };
    if (pen.names) p.names = foreign(s.product, pen.names).names;
    lines.push({ ok: pen.ok ?? false, key: pen.line, p });
  }
  return { quality: Math.max(0, Math.min(1, quality)), lines };
}

// ------------------------------------------------------------------ relazione, reputazione, capitoli

/** Domande della relazione: { q, opts, a } con le opzioni mescolate (l'indice giusto segue). */
export function reportQuestions(ex, rand = Math.random) {
  return (ex.report ?? []).map((r, k) => {
    const order = shuffle(r.opts.map((_, i) => i), rand);
    return { id: `${ex.id}.${k}`, q: r.q, opts: order.map((i) => r.opts[i]), right: order.indexOf(r.a) };
  });
}

/** Stelle in più dalla relazione: una per tutte le risposte giuste, mezza per almeno metà (le stelle restano ≤ 5). */
export function reportStars(right, total) {
  if (!total) return 0;
  if (right >= total) return 1;
  return right * 2 >= total ? 0.5 : 0;
}

/**
 * Reputazione con l'insegnante (0–100), calcolata dai risultati migliori di ogni esercitazione: 2 punti per stella meno
 * 3 (sotto 1,5 stelle si perde), +1 per ogni risposta giusta della relazione, −2 per ogni incidente (fuoco, gas, schizzi,
 * esplosioni) di tutto l'anno. Calcolata e non accumulata: rifare un'esercitazione conta solo se si migliora.
 */
export function reputation(career) {
  let r = 0;
  for (const res of Object.values(career?.results ?? {})) r += 2 * (res.stars ?? 0) - 3 + (res.report ?? 0);
  for (const c of Object.values(career?.challenges ?? {})) r += c.medal ?? 0;
  r -= 2 * (career?.incidents ?? 0);
  return Math.max(0, Math.min(100, Math.round(r)));
}

/** Titolo dello studente per la reputazione (id di REP_TITLES). */
export const repTitle = (rep) => [...REP_TITLES].reverse().find((x) => rep >= x.min).id;

/** Un'esercitazione è superata con almeno PASS_STARS stelle. */
export const passed = (career, id) => (career?.results?.[id]?.stars ?? 0) >= PASS_STARS;

/** Un capitolo è completato se ha esercitazioni e sono tutte superate. */
export function chapterDone(career, ch) {
  const list = chapterExercises(ch);
  return list.length > 0 && list.every((e) => passed(career, e.id));
}

/**
 * Stato di un capitolo: 'open' (si gioca), 'locked' (manca il capitolo prima o la reputazione), 'soon' (esercitazioni in
 * arrivo). Un capitolo senza esercitazioni non ferma quelli dopo.
 */
export function chapterState(career, ch) {
  const c = CHAPTERS[ch];
  if (!chapterExercises(ch).length) return 'soon';
  if (ch === 0) return 'open';
  let prev = ch - 1;
  while (prev > 0 && !chapterExercises(prev).length) prev--;
  if (!chapterDone(career, prev)) return 'locked';
  return reputation(career) >= c.rep ? 'open' : 'locked';
}

/** Un'esercitazione si gioca se il suo capitolo è aperto e quella prima nel capitolo è stata fatta (anche male). */
export function exerciseOpen(career, id) {
  const ex = EXERCISE_BY_ID.get(id);
  if (ex?.extra) return extraOpen(career, ex);
  if (!ex || chapterState(career, ex.chapter) !== 'open') return false;
  const list = chapterExercises(ex.chapter);
  const i = list.indexOf(ex);
  return i === 0 || career?.results?.[list[i - 1].id] !== undefined;
}

/** Prossima esercitazione da fare: la prima aperta non ancora superata, altrimenti null. */
export function nextExercise(career) {
  for (const ex of EXERCISES) if (!ex.extra && exerciseOpen(career, ex.id) && !passed(career, ex.id)) return ex;
  return null;
}

/** Una richiesta extra si apre con il capitolo (chapter) completato e la reputazione richiesta. */
export function extraOpen(career, ex) {
  return Boolean(ex?.extra) && chapterDone(career, ex.chapter) && reputation(career) >= ex.extra.rep;
}

// ------------------------------------------------------------------ verifiche e pagella

/**
 * Voto di una verifica (da 4 a 10, a passi di mezzo punto) dalla qualità del lavoro (0–1): 60 % di qualità è la
 * sufficienza (6), il 100 % è 10, senza niente si prende 4.
 */
export function examMark(quality) {
  const q = Math.max(0, Math.min(1, Number(quality) || 0));
  const raw = q < 0.6 ? 4 + (q / 0.6) * 2 : 6 + ((q - 0.6) / 0.4) * 4;
  return Math.round(raw * 2) / 2;
}

const mean = (list) => list.reduce((a, b) => a + b, 0) / list.length;

/** Giudizio sulla media dei voti (id dei testi judge_<id>). */
export function judgement(average) {
  return average < 6 ? 'insufficient' : average < 7 ? 'sufficient' : average < 8 ? 'good' : average < 9 ? 'veryGood' : 'excellent';
}

/**
 * Pagella: per ogni capitolo con verifiche il voto (la media delle sue prove, se più d'una), la media di tutte e il
 * verdetto: 'ongoing' (mancano delle verifiche), 'promoted' (tutte fatte, media almeno 6) o 'repeat'.
 */
export function reportCard(career) {
  const rows = [];
  for (const ch of CHAPTERS) {
    const exams = EXAMS.filter((e) => e.chapter === ch.id);
    if (!exams.length) continue;
    const marks = exams.map((e) => career?.results?.[e.id]?.mark).filter((m) => m !== undefined);
    rows.push({ chapter: ch.id, total: exams.length, taken: marks.length, mark: marks.length ? mean(marks) : null, marks: exams.map((e) => ({ id: e.id, mark: career?.results?.[e.id]?.mark ?? null })) });
  }
  const taken = rows.flatMap((r) => r.marks.map((m) => m.mark).filter((m) => m !== null));
  const average = taken.length ? mean(taken) : null;
  const complete = rows.every((r) => r.taken === r.total);
  const verdict = !complete ? 'ongoing' : average >= 6 ? 'promoted' : 'repeat';
  return { rows, average, complete, verdict, judgement: average === null ? null : judgement(average) };
}

// ------------------------------------------------------------------ sfide a tempo

export const CHALLENGE_BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]));

/** Medaglie: 0 nessuna, 1 bronzo, 2 argento, 3 oro. */
export const MEDALS = ['none', 'bronze', 'silver', 'gold'];

/** La sfida si gioca quando l'esercitazione è già stata superata. */
export const challengeOpen = (career, ch) => passed(career, ch.ex);

/** Medaglia di una sfida: serve una qualità di almeno 0,8 e nessun incidente; poi contano i secondi. */
export function challengeMedal(ch, { elapsed, quality, incidents = 0 }) {
  if (quality < 0.8 || incidents > 0) return 0;
  return elapsed <= ch.gold ? 3 : elapsed <= ch.silver ? 2 : elapsed <= ch.bronze ? 1 : 0;
}

/** Premio in soldi di una sfida: un quarto della paga per ogni medaglia in più di quelle già vinte (niente premio due volte). */
export function challengeBonus(ch, career, medal) {
  const ex = EXERCISE_BY_ID.get(ch.ex);
  const old = career?.challenges?.[ch.id]?.medal ?? 0;
  return Math.max(0, Math.round(ex.pay * 0.25 * (medal - old) * 100) / 100);
}

/** Registra il risultato di una sfida (nuovo oggetto): tiene la medaglia più alta e il tempo migliore tra quelle valide. */
export function recordChallenge(career, id, { medal, elapsed }) {
  const old = career.challenges?.[id];
  const best = medal > (old?.medal ?? 0) || (medal === (old?.medal ?? 0) && medal > 0 && elapsed < (old?.best ?? Infinity));
  const next = best ? { medal, best: Math.round(elapsed) } : old ?? { medal: 0, best: null };
  return { ...career, challenges: { ...(career.challenges ?? {}), [id]: { ...next, tries: (old?.tries ?? 0) + 1 } } };
}

/**
 * Pagine del libro aperte nella Carriera: la sicurezza, quelle delle esercitazioni dei capitoli aperti e i gruppi di
 * ricette dei capitoli completati (o aperti). Restituisce { pages: Set('tool:balance', …), groups: Set, chapterOf }.
 */
export function bookUnlocks(career, { exam = false } = {}) {
  const pages = new Set(BASE_PAGES);
  const groups = new Set();
  const chapterOf = new Map();
  for (const ex of EXERCISES) for (const p of ex.book ?? []) if (!chapterOf.has(p)) chapterOf.set(p, ex.chapter);
  for (const c of CHAPTERS) for (const g of c.groups) chapterOf.set(`group:${g}`, c.id);
  for (const c of CHAPTERS) {
    if (chapterState(career, c.id) !== 'open' && !chapterDone(career, c.id)) continue;
    for (const ex of chapterExercises(c.id)) for (const p of ex.book ?? []) pages.add(p);
    // in una verifica il libro mostra gli strumenti e le tecniche, non le ricette delle reazioni
    if (!exam) for (const g of c.groups) groups.add(g);
  }
  return { pages, groups, chapterOf, exam };
}

// ------------------------------------------------------------------ negozio

/**
 * Cose che si comprano con i soldi della Carriera. effect: cosa cambia nel laboratorio (game.js, upgrades).
 */
export const SHOP = [
  { id: 'goggles', price: 25 },
  { id: 'glassKit', price: 30 },
  { id: 'thermoPro', price: 40 },
  { id: 'balancePro', price: 60 },
  { id: 'hoodPro', price: 80 },
  { id: 'cabinetKey', price: 100 },
];

export const SHOP_BY_ID = new Map(SHOP.map((x) => [x.id, x]));

/** Si può comprare? Non già posseduto e con i soldi. */
export const canBuy = (career, id) => {
  const item = SHOP_BY_ID.get(id);
  return Boolean(item) && !(career?.owned ?? []).includes(id) && (career?.money ?? 0) >= item.price;
};

/** Compra (restituisce una nuova Carriera) o null se non si può. */
export function buy(career, id) {
  if (!canBuy(career, id)) return null;
  const price = SHOP_BY_ID.get(id).price;
  return { ...career, money: Math.round((career.money - price) * 100) / 100, owned: [...(career.owned ?? []), id] };
}

/**
 * Registra il risultato di un'esercitazione nella Carriera (nuovo oggetto): tiene il migliore, somma soldi e incidenti.
 * r: { stars, report (risposte giuste), money (soldi dopo l'esercitazione), incidents }.
 */
export function recordResult(career, id, r) {
  const old = career.results?.[id];
  const best = !old || r.stars > old.stars || (r.stars === old.stars && (r.report ?? 0) > (old.report ?? 0));
  const results = { ...(career.results ?? {}) };
  results[id] = best ? { stars: r.stars, report: Math.max(r.report ?? 0, old?.report ?? 0), tries: (old?.tries ?? 0) + 1 } : { ...old, report: Math.max(old.report ?? 0, r.report ?? 0), tries: (old.tries ?? 0) + 1 };
  // verifica: il voto migliore (4–10) dalla qualità del lavoro
  if (EXERCISE_BY_ID.get(id)?.exam && r.quality !== undefined) {
    const mark = examMark(r.quality);
    results[id].mark = Math.max(mark, old?.mark ?? 0);
  } else if (old?.mark !== undefined) results[id].mark = old.mark;
  return { ...career, results, money: r.money, incidents: (career.incidents ?? 0) + (r.incidents ?? 0), last: id };
}

/** Carriera nuova. */
export const newCareer = () => ({ results: {}, money: 0, incidents: 0, owned: [], last: null, challenges: {} });

// ------------------------------------------------------------------ reagenti e soluzione scritta nei dati

/**
 * Miscela di una porzione di un reagente dello scaffale o dell'armadio (come la dà il gioco): amount in mL per soluzioni,
 * liquidi, acqua e indicatori (fenolftaleina all'1 %), in grammi per i solidi.
 */
export function reagentPortion(ctx, key, amount) {
  const r = SHELF[key] ?? CABINET[key];
  if (!r) throw new Error(`reagente sconosciuto: ${key}`);
  if (r.water) return Mixture.liquid(ctx, 'water', amount);
  if (r.indicator) return Mixture.of(ctx, [['water', (amount * 0.99) / 18.015], [r.indicator, (amount * 0.01) / 318.3]]);
  if (r.solute) return Mixture.solution(ctx, r.solute, r.molar, amount);
  if (r.liquid) return Mixture.liquid(ctx, r.liquid, amount);
  return Mixture.solid(ctx, r.solid, amount);
}

/** Miscela descritta nei dati: { solution: [K, M, mL] } | { solid: [K, g] } | { water: mL } | { liquid: [K, mL] }. */
export function contentMixture(ctx, c) {
  if (!c) return new Mixture(ctx);
  if (c.solution) return Mixture.solution(ctx, ...c.solution);
  if (c.solid) return Mixture.solid(ctx, ...c.solid);
  if (c.liquid) return Mixture.liquid(ctx, ...c.liquid);
  if (c.water !== undefined) return Mixture.liquid(ctx, 'water', c.water);
  if (c.reagent) return reagentPortion(ctx, c.reagent, c.amount);
  throw new Error(`contenuto sconosciuto: ${JSON.stringify(c)}`);
}

/** Valore di un campione per le risposte numeriche (ex.answers.of): per ora la densità del liquido. */
export function sampleValue(ctx, ex, sample) {
  if (!ex.answers?.of) return undefined;
  return mixMeasure(contentMixture(ctx, sample.content), ex.answers.of);
}

const ENV = { lossWK: 0.5, containerC: 120, area: 30 };

/**
 * Esegue la soluzione scritta nei dati (ex.solution) con il motore dei contenitori e restituisce lo stato finale da
 * valutare. Azioni: [A, 'add', contenuto] · [A, 'reagent', chiave, quantità] · [A, 'fill', mL] (acqua fino al volume) ·
 * [A, 'pour', B, mL] · [A, 'filter', B] · [A, 'heat', °C, s] · [A, 'cool', s] · [A, 'wait', s] · [A, 'gas', K, s] ·
 * [A, 'volt', V, s] (elettrolisi) · [A, 'distill', B, °C, s] (il distillato va in B) · ['out', K, mol] · ['ev', nome, n] · ['state', campo, valore] · ['answer', i | 'all', valore | true] · ['deliver', A | null].
 */
export function runSolution(ctx, ex, mode = 'real', rand = () => 0.42) {
  const mixes = new Map();
  const get = (k) => {
    if (!mixes.has(k)) mixes.set(k, new Mixture(ctx));
    return mixes.get(k);
  };
  const s = { mode, ctx, ev: {}, gas: {}, rx: new Set(), flame: new Set(), phRead: new Set(), containers: [], product: null, delivered: false, answers: null, dirtyStart: 0, dirtyLeft: 0, mess: 0, fires: 0 };
  const samples = pickSamples(ex, rand).map((x) => ({ ...x, value: sampleValue(ctx, ex, x) }));
  s.unknowns = samples;
  const tick = (m, secs, env = {}) => {
    for (let t = 0; t < secs; t += 0.2) {
      const e = { ...ENV, stir: 0.5, ...env };
      if (env.heatT) e.heatW = Math.max(0, Math.min(400, 6 * (env.heatT - m.T)));
      if (env.gas) m.addSpecies(ctx.id(env.gas), GAS_FLOW * 0.2);
      const ev = m.tick(0.2, e);
      m.peakT = Math.max(m.peakT ?? m.T, m.T);
      let gases = ev.gases;
      if (env.still) {
        // pallone con il refrigerante: il vapore che condensa va nel distillato, il resto esce
        const split = splitVapours(ctx, gases);
        for (const [sid, mol] of split.liquid) env.still.addSpecies(sid, mol);
        gases = split.gas;
      }
      for (const [sid, mol] of gases) s.gas[sid] = (s.gas[sid] ?? 0) + mol;
      for (const id of ev.reactions) s.rx.add(id);
    }
  };
  for (const step of ex.solution ?? []) {
    const [a, op, ...args] = step;
    if (a === 'ev') {
      s.ev[op] = (s.ev[op] ?? 0) + (args[0] ?? 1);
      continue;
    }
    if (a === 'state') {
      s[op] = args[0];
      continue;
    }
    if (a === 'out') {
      // gas uscito da un recipiente (op = sostanza, args[0] = moli): per gli strumenti che la soluzione non simula
      s.gas[ctx.id(op)] = (s.gas[ctx.id(op)] ?? 0) + args[0];
      continue;
    }
    if (a === 'answer') {
      s.answers ??= {};
      const n = answerCount(ex, samples);
      const value = (i) => (args[0] === true ? rightAnswer(ex, samples, i) : args[0]);
      if (op === 'all') for (let i = 0; i < n; i++) s.answers[i] = value(i);
      else s.answers[op] = value(op);
      continue;
    }
    if (a === 'deliver') {
      s.delivered = true;
      s.product = op ? get(op) : null;
      continue;
    }
    const m = get(a);
    switch (op) {
      case 'add':
        m.add(contentMixture(ctx, args[0]));
        tick(m, 0.4);
        break;
      case 'reagent':
        m.add(reagentPortion(ctx, args[0], args[1]));
        tick(m, 0.4);
        break;
      case 'fill': {
        for (let k = 0; k < 40 && m.liquidVolume < args[0] - 0.05; k++) {
          m.add(Mixture.liquid(ctx, 'water', args[0] - m.liquidVolume));
          tick(m, 0.4);
        }
        break;
      }
      case 'pour':
        get(args[0]).add(m.take(args[1]));
        tick(get(args[0]), 0.4);
        break;
      case 'filter': {
        // la carta trattiene i solidi (e un velo di liquido); il filtrato va in B
        const lv = m.liquidVolume;
        get(args[0]).add(m.takeLiquid(Math.max(0, lv - 1.5)));
        break;
      }
      case 'heat':
        tick(m, args[1], { heatT: args[0] + 273.15, stir: 1 });
        break;
      case 'cool':
        tick(m, args[0], { lossWK: 3 });
        break;
      case 'wait':
        tick(m, args[0]);
        break;
      case 'gas':
        tick(m, args[1], { gas: args[0] });
        break;
      case 'volt':
        tick(m, args[1], { volts: args[0] });
        break;
      case 'distill':
        tick(m, args[2], { heatT: args[1] + 273.15, stir: 1, still: get(args[0]) });
        break;
      default:
        throw new Error(`azione sconosciuta: ${op}`);
    }
  }
  s.containers = [...mixes].map(([name, mix]) => ({ name, mix, kind: '', stock: false }));
  return s;
}

/**
 * Stelle e paga di un'esercitazione (orders.js, grade) più la relazione: le stelle della relazione si aggiungono fino a 5.
 */
export function gradeExercise(ex, { quality, elapsed, mess, incidents, wrongBins, costs, reportRight = 0, reportTotal = 0 }) {
  const g = grade({ quality, elapsed, par: ex.par, mess, incidents, wrongBins, pay: ex.pay, costs });
  const bonus = reportStars(reportRight, reportTotal);
  const stars = Math.min(5, g.stars + bonus);
  return { ...g, stars, base: g.stars, bonus };
}
