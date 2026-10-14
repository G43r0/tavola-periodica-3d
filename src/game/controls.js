// Legenda dei comandi in basso a destra: quali tasti si possono usare adesso, in base a cosa si tiene in mano, a cosa
// si guarda e alla visuale. Funzione pura (niente Three.js né DOM): game.js descrive la situazione, game-view.js
// disegna le righe. Le stesse azioni stanno sempre nella stessa riga e nello stesso ordine; un'azione che con quel
// bersaglio non funziona resta visibile ma attenuata (off), così la legenda non «salta».

/** Tasti che compaiono nella legenda (etichette nei testi: key_<id>). */
export const KEY_IDS = ['lmb', 'rmb', 'mouse', 'wheel', 'e', 'shift', 'q', 'r', 'space', 'tab', 'h', 'wasd', 'ad'];

/** Righe al massimo (le ultime sono quelle di base: movimento, visuale, aiuto). */
export const MAX_ROWS = 7;

const row = (keys, key, params = null, off = false) => ({ keys, key, params, off });

/** Azione del tasto E su un elemento fisso, oppure null se non ce n'è. */
function fixtureRow(f) {
  switch (f.kind) {
    case 'hotplate':
      return row(['e'], f.level ? 'lgPlateUp' : 'lgPlateOn', { n: f.level });
    case 'bunsen':
      return row(['e'], f.on ? 'lgBunsenOff' : 'lgBunsenOn');
    case 'sink':
      return row(['e'], f.on ? 'lgTapOff' : 'lgTapOn');
    case 'balance':
      return row(['e'], 'lgTare');
    case 'hood':
      return row(['e'], f.on ? 'lgHoodOff' : 'lgHoodOn');
    case 'shower':
      return row(['e'], 'lgShower');
    case 'bell':
      return row(['e'], 'lgBell');
    case 'store':
      return row(['e'], 'lgStore');
    case 'towels':
      return row(['e'], 'lgTowels');
    case 'strips':
      return row(['e'], 'lgStrips');
    default:
      return null;
  }
}

/** Tasto E con lo strumento in mano: cosa fa sul bersaglio (attenuato se il bersaglio non va bene). */
function toolRows(held, target) {
  const onVessel = target?.type === 'item' && target.container;
  switch (held.kind) {
    case 'spatula':
      return held.loaded
        ? [row(['e'], 'lgSpatulaDrop', null, !onVessel)]
        : [row(['e'], 'lgSpatulaTake', null, !onVessel), row(['shift', 'e'], 'lgSpatulaPinch', null, !onVessel)];
    case 'loop':
      return [row(['e'], 'lgLoop', null, !onVessel)];
    case 'strip':
      return [row(['e'], 'lgStrip', null, !onVessel)];
    case 'towel':
      return [row(['e'], target?.stain ? 'lgWipeStain' : 'lgWipe', null, target?.type !== 'puddle')];
    case 'extinguisher':
      return [row(['e'], 'lgSpray')];
    default:
      return [];
  }
}

/**
 * Righe della legenda.
 * @param {{mode: 'walk'|'bench', held: null|{kind: string, container: boolean, loaded?: boolean},
 *          target: null|{type: 'item'|'fixture'|'puddle', kind?: string, name?: string, container?: boolean,
 *                         on?: boolean, level?: number, binName?: string, stain?: boolean},
 *          canPlace?: boolean, pouring?: boolean, precise?: boolean, filling?: boolean, tapFlow?: number}} s
 * @returns {{keys: string[], key: string, params: object|null, off: boolean}[]}
 */
export function legendRows(s) {
  const { mode, held, target } = s;
  const out = [];
  if (held) {
    const into = target?.type === 'item' && target.container;
    if (s.filling) {
      // sotto il rubinetto: si riempie finché E resta premuto
      out.push(row(['e'], 'lgFilling'));
      out.push(row(['wheel'], 'lgTapFlow', { ml: s.tapFlow ?? 0 }));
    } else if (held.container && s.pouring) {
      // mentre si versa contano solo l'inclinazione e dove va il liquido
      out.push(row(['rmb', 'mouse'], into ? 'lgPouringInto' : 'lgPouring', { name: target?.name ?? '' }));
    } else if (s.precise) {
      // manipolazione precisa (Maiusc tenuto): la camera è ferma, il mouse sposta l'oggetto
      out.push(row(['mouse'], 'lgPreciseMove'));
      out.push(row(['wheel'], 'lgPreciseHeight'));
      out.push(row(['lmb'], 'lgPreciseLeave'));
      if (held.container) out.push(row(['rmb', 'mouse'], 'lgPourFine'));
      else out.push(...toolRows(held, target).slice(0, 1));
      out.push(row(['shift'], 'lgPreciseExit'));
    } else {
      out.push(row(['lmb'], s.canPlace ? 'lgPlace' : 'lgDrop'));
      if (held.container) {
        out.push(row(['rmb', 'mouse'], into ? 'lgPourInto' : 'lgPour', { name: into ? target.name : '' }));
        const f = target?.type === 'fixture' ? target : null;
        if (f?.kind === 'sink') out.push(row(['e'], 'lgFill'), row(['shift', 'e'], 'lgWash'));
        else if (f?.kind === 'bin') out.push(row(['e'], 'lgEmpty', { bin: f.binName ?? '' }));
        else if (f && fixtureRow(f)) out.push(fixtureRow(f));
        else out.push(row(['e'], 'lgSwirl'));
      } else out.push(...toolRows(held, target));
      out.push(row(['q'], 'lgThrow'));
      out.push(row(['r', 'mouse'], 'lgRotate'));
      if (mode === 'walk') out.push(row(['shift'], 'lgPrecise'));
      out.push(row(['wheel'], mode === 'bench' ? 'lgHeight' : 'lgDistance'));
    }
  } else if (target?.type === 'item') {
    out.push(row(['lmb'], 'lgTake', { name: target.name ?? '' }));
  } else if (target?.type === 'fixture') {
    const r = fixtureRow(target);
    if (r) out.push(r);
    if (target.kind === 'hotplate') {
      if (target.level) out.push(row(['shift', 'e'], 'lgPlateDown'));
      out.push(row(['wheel'], 'lgPlateWheel'));
    }
    if (target.kind === 'bin') out.push(row(['e'], 'lgBinNeedsVessel', { bin: target.binName ?? '' }, true));
  } else if (target?.type === 'puddle') {
    out.push(row(['e'], target.stain ? 'lgNeedTowelStain' : 'lgNeedTowel', null, true));
  }
  const rows = out.slice(0, MAX_ROWS - 1);
  // nella manipolazione precisa si sta fermi: niente righe di movimento
  const base = s.precise && held ? [] : mode === 'bench' ? [row(['ad'], 'lgStation'), row(['tab'], 'lgFirstPerson')] : [row(['wasd'], 'lgWalk'), row(['tab'], 'lgBenchView')];
  for (const b of base) if (rows.length < MAX_ROWS - 1) rows.push(b);
  rows.push(row(['h'], 'lgHelp'));
  return rows;
}

/** Velocità con cui l'oggetto in mano torna dritto quando si lascia il tasto destro (rad/s). */
export const TILT_RETURN = 3;

/** Inclinazione dopo dt secondi: ferma finché il tasto destro è premuto, altrimenti torna verso 0 (mai negativa). */
export function relaxTilt(tilt, dt, holding) {
  if (holding) return tilt;
  return Math.max(0, tilt - TILT_RETURN * dt);
}

/** Sensibilità dell'inclinazione: più fine vicino al bordo (carico da −2 a +4 mm), dove inizia il versamento. */
export function tiltGain(head) {
  return head !== undefined && head > -0.002 && head < 0.004 ? 0.4 : 1;
}

/** Velocità di lancio (m/s) dopo aver tenuto premuto Q (o il tasto centrale) per `seconds`: da 1,5 a 8 in un secondo. */
export function throwSpeed(seconds) {
  return 1.5 + 6.5 * Math.min(1, Math.max(0, seconds));
}

/** Un tocco breve di R (meno di 0,2 s, mouse quasi fermo) raddrizza l'oggetto invece di ruotarlo. */
export function isTap(seconds, movedPx) {
  return seconds < 0.2 && movedPx < 4;
}
