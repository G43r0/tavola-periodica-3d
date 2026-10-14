// Legenda dei comandi in basso a destra: quali tasti si possono usare adesso, in base a cosa si tiene in mano, a cosa
// si guarda e alla visuale. Funzione pura (niente Three.js né DOM): game.js descrive la situazione, game-view.js
// disegna le righe. Le stesse azioni stanno sempre nella stessa riga e nello stesso ordine; un'azione che con quel
// bersaglio non funziona resta visibile ma attenuata (off), così la legenda non «salta».

/**
 * Tasti che compaiono nella legenda (etichette nei testi: key_<id>). Lo schema è quello di Cooking Simulator: clic
 * sinistro prende, posa e usa (tenuto con il mouse versa), destro tenuto ruota (un clic annulla o rimette a posto),
 * tasto centrale lancia, Maiusc tenuto per la precisione, E per pulire e usare gli strumenti.
 */
export const KEY_IDS = ['lmb', 'rmb', 'mmb', 'mouse', 'mousex', 'wheel', 'e', 'shift', 'tab', 'h', 'wasd', 'ad'];

/** Righe al massimo (le ultime sono quelle di base: movimento, visuale, aiuto). */
export const MAX_ROWS = 9;

const row = (keys, key, params = null, off = false) => ({ keys, key, params, off });

/** Azione di un elemento fisso (con il clic sinistro a mani vuote, con E se si tiene qualcosa), oppure null. */
function fixtureRow(f, key = 'lmb') {
  switch (f.kind) {
    case 'hotplate':
      return row([key], f.level ? 'lgPlateUp' : 'lgPlateOn', { n: f.level });
    case 'bunsen':
      return row([key], f.on ? 'lgBunsenOff' : 'lgBunsenOn');
    case 'sink':
      return row([key], f.on ? 'lgTapOff' : 'lgTapOn');
    case 'balance':
      return row([key], 'lgTare');
    case 'hood':
      return row([key], f.on ? 'lgHoodOff' : 'lgHoodOn');
    case 'lamp':
      return row([key], f.on ? 'lgLampOff' : 'lgLampOn');
    case 'shower':
      return row([key], 'lgShower');
    case 'bell':
      return row([key], 'lgBell');
    case 'store':
      return row([key], 'lgStore');
    case 'towels':
      return row([key], 'lgTowels');
    case 'strips':
      return row([key], 'lgStrips');
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
 *          canPlace?: boolean, pouring?: boolean, precise?: boolean, filling?: boolean, tapFlow?: number,
 *          rotated?: boolean, canPutBack?: boolean}} s
 * @returns {{keys: string[], key: string, params: object|null, off: boolean}[]}
 */
export function legendRows(s) {
  const { mode, held, target } = s;
  const out = [];
  const f = target?.type === 'fixture' ? target : null;
  if (held) {
    const into = target?.type === 'item' && target.container;
    if (s.filling) {
      // al lavandino: l'acqua scorre finché si tiene premuto il sinistro
      out.push(row(['lmb'], 'lgFillHold'));
      out.push(row(['wheel'], 'lgTapFlow', { ml: s.tapFlow ?? 0 }));
      out.push(row(['rmb'], 'lgFillStop'));
    } else if (held.container && s.pouring) {
      // mentre si versa contano solo l'inclinazione e dove va il liquido
      out.push(row(['lmb', 'mouse'], into ? 'lgPouringInto' : 'lgPouring', { name: target?.name ?? '' }));
    } else if (s.precise) {
      // manipolazione precisa (Maiusc tenuto): la camera è ferma, il mouse sposta l'oggetto
      out.push(row(['mouse'], 'lgPreciseMove'));
      out.push(row(['lmb', 'mouse'], 'lgPreciseHeight'));
      out.push(row(['rmb', 'mouse'], held.container ? 'lgPreciseRotatePour' : 'lgRotate'));
      out.push(row(['mmb'], 'lgPreciseLeave'));
      if (!held.container) out.push(...toolRows(held, target).slice(0, 1));
      out.push(row(['shift'], 'lgPreciseExit'));
    } else {
      out.push(row(['lmb'], held.container && f?.kind === 'sink' ? 'lgFill' : s.canPlace ? 'lgPlace' : 'lgDrop'));
      if (held.container) {
        out.push(row(['lmb', 'mouse'], into ? 'lgPourInto' : 'lgPour', { name: into ? target.name : '' }));
        if (f?.kind === 'sink') out.push(row(['e'], 'lgWash'));
        else if (f?.kind === 'bin') out.push(row(['e'], 'lgEmpty', { bin: f.binName ?? '' }));
        else if (f && fixtureRow(f, 'e')) out.push(fixtureRow(f, 'e'));
        else out.push(row(['e'], 'lgSwirl'));
      } else out.push(...toolRows(held, target));
      out.push(row(['rmb', 'mousex'], 'lgRotate'));
      out.push(s.rotated ? row(['rmb'], 'lgCancelRotation') : row(['rmb'], 'lgPutBack', null, !s.canPutBack));
      out.push(row(['mmb'], 'lgThrow'));
      if (mode === 'walk') out.push(row(['shift'], 'lgPrecise'));
      out.push(row(['wheel'], mode === 'bench' ? 'lgHeight' : 'lgDistance'));
    }
  } else if (target?.type === 'item') {
    out.push(row(['lmb'], 'lgTake', { name: target.name ?? '' }));
  } else if (f) {
    const r = fixtureRow(f);
    if (r) out.push(r);
    if (f.kind === 'hotplate') {
      if (f.level) out.push(row(['rmb'], 'lgPlateDown'));
      out.push(row(['wheel'], 'lgPlateWheel'));
    }
    if (f.kind === 'bin') out.push(row(['e'], 'lgBinNeedsVessel', { bin: f.binName ?? '' }, true));
  } else if (target?.type === 'puddle') {
    out.push(row(['e'], target.stain ? 'lgNeedTowelStain' : 'lgNeedTowel', null, true));
  }
  const rows = out.slice(0, MAX_ROWS - 1);
  // nella manipolazione precisa e al rubinetto si sta fermi: niente righe di movimento
  const still = held && (s.precise || s.filling);
  const base = still ? [] : mode === 'bench' ? [row(['ad'], 'lgStation'), row(['tab'], 'lgFirstPerson')] : [row(['wasd'], 'lgWalk'), row(['tab'], 'lgBenchView')];
  for (const b of base) if (rows.length < MAX_ROWS - 1) rows.push(b);
  rows.push(row(['h'], 'lgHelp'));
  return rows;
}

/** Velocità con cui l'oggetto in mano torna dritto quando si lascia il tasto con cui si versa (rad/s). */
export const TILT_RETURN = 3;

/** Inclinazione dopo dt secondi: ferma finché si tiene il tasto con cui si versa, altrimenti torna verso 0 (mai negativa). */
export function relaxTilt(tilt, dt, holding) {
  if (holding) return tilt;
  return Math.max(0, tilt - TILT_RETURN * dt);
}

/** Sensibilità dell'inclinazione: più fine vicino al bordo (carico da −2 a +4 mm), dove inizia il versamento. */
export function tiltGain(head) {
  return head !== undefined && head > -0.002 && head < 0.004 ? 0.4 : 1;
}

/** Velocità di lancio (m/s) dopo aver tenuto premuto il tasto centrale per `seconds`: da 1,5 a 8 in un secondo. */
export function throwSpeed(seconds) {
  return 1.5 + 6.5 * Math.min(1, Math.max(0, seconds));
}

/**
 * Un clic (non un trascinamento): il mouse si è mosso meno di 4 pixel. Con un recipiente in mano il clic sinistro posa,
 * il trascinamento versa; il clic destro annulla la rotazione o rimette a posto, il trascinamento ruota.
 */
export function isClick(movedPx) {
  return movedPx < 4;
}
