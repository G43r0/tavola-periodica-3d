// Regole degli strumenti della fase G4 (buretta, filtrazione, distillazione, alimentatore, bombole, pinza, sonde):
// numeri e funzioni pure, senza Three.js né DOM, così i test le provano da sole.
import { WATER } from '../sandbox/substances.js';

/** Gas delle bombole sotto la cappa (chiavi delle sostanze): ossigeno, idrogeno, anidride carbonica, cloro, ammoniaca. */
export const CYLINDER_GASES = ['O', 'H', 'co2', 'Cl', 'nh3'];

/** Portata della buretta per posizione del rubinetto (mL/s): chiuso, goccia a goccia, a filo, aperto. */
export const STOPCOCK = [0, 0.12, 0.8, 3];
/** Volume di una goccia (mL): quella della buretta e della pipetta. */
export const DROP_ML = 0.05;
/** Capacità della buretta (mL): lo zero è in alto. */
export const BURETTE_ML = 50;
/** Volume della pipetta graduata (mL). */
export const PIPETTE_ML = 10;
/** Tensioni dell'alimentatore (V): ogni clic passa alla successiva. */
export const VOLTS = [0, 2, 4, 6, 9, 12];
/** Portata di gas di una bombola aperta (mol/s, ≈ 10 mL/s): una bolla continua nel liquido. */
export const GAS_FLOW = 4e-4;
/** Velocità della filtrazione per gravità (mL/s, accelerata come il resto del gioco). */
export const FILTER_FLOW = 2;
/** Sopra questa temperatura (K) un recipiente scotta: si prende con la pinza. */
export const HOT_T = 333.15;
/** Punto di ebollizione minimo (K) di un vapore che il refrigerante condensa (l'acqua fredda è a 15–20 °C). */
export const CONDENSE_BP = 300;

/**
 * Lettura della buretta (mL) con `volume` mL dentro: lo zero è in alto, la lettura cresce scendendo. Negativa se il
 * liquido è sopra lo zero (nell'imbutino). Arrotondata a 0,05 mL, la sensibilità della scala.
 */
export function buretteReading(volume) {
  return Math.round((BURETTE_ML - volume) * 20) / 20;
}

/** Prossima posizione del rubinetto con un clic (dir = 1) o il clic destro (dir = −1: chiude). */
export function nextStopcock(state, dir) {
  if (dir < 0) return 0;
  return (state + 1) % STOPCOCK.length;
}

/** Prossima tensione dell'alimentatore: un clic alza (da 12 V torna a 0), il clic destro spegne. */
export function nextVolts(volts, dir) {
  if (dir < 0) return 0;
  const i = VOLTS.indexOf(volts);
  return VOLTS[(i + 1) % VOLTS.length];
}

/** Livello (0–5) del mantello o della piastra dopo un clic (dir = 1, da 5 torna a 0) o un clic destro (−1). */
export function nextLevel(level, dir, max = 5) {
  if (dir < 0) return Math.max(0, level - 1);
  return level + 1 > max ? 0 : level + 1;
}

/** Una lettura che insegue il valore vero con costante di tempo `tau` (s): il termometro è lento, il pH-metro no. */
export function relax(value, target, dt, tau) {
  if (value === null || value === undefined || !Number.isFinite(value)) return target;
  return value + (target - value) * (1 - Math.exp(-dt / tau));
}

/** Il vapore di questa sostanza condensa nel refrigerante? (acqua, etanolo, acetone sì; CO₂, H₂, O₂ no). */
export function condensable(ctx, sid) {
  if (sid === WATER) return true;
  if (typeof sid !== 'number') return false;
  return (ctx.sub(sid)?.bp ?? 0) > CONDENSE_BP;
}

/**
 * Divide i gas usciti dal pallone: il vapore che condensa va nel distillato, il resto esce dal refrigerante.
 * @param {object} ctx contesto chimico
 * @param {[number, number][]} gases [sostanza, moli]
 * @returns {{liquid: [number, number][], gas: [number, number][]}}
 */
export function splitVapours(ctx, gases) {
  const liquid = [];
  const gas = [];
  for (const g of gases) (condensable(ctx, g[0]) ? liquid : gas).push(g);
  return { liquid, gas };
}

/**
 * Corrente indicata dall'alimentatore (A): la somma delle celle sotto gli elettrodi, arrotondata a 0,01 A come il
 * display. Sotto i 5 mA il display segna zero.
 */
export function displayCurrent(amps) {
  return amps < 0.005 ? 0 : Math.round(amps * 100) / 100;
}

// ------------------------------------------------------------------ pila Daniell e contatore del gas (fase G8)

/** Carica degli ioni dei metalli in soluzione (Zn²⁺, Cu²⁺, Ag⁺, Al³⁺…), per l'equazione di Nernst. */
export const ION_CHARGE = { Li: 1, Na: 1, K: 1, Ag: 1, Mg: 2, Ca: 2, Ba: 2, Mn: 2, Zn: 2, Fe: 2, Cd: 2, Co: 2, Ni: 2, Sn: 2, Pb: 2, Cu: 2, Hg: 2, Al: 3, Cr: 3, Au: 3 };

/** (R·T·ln 10) / F a 25 °C, in volt. */
export const NERNST_SLOPE = 0.05916;

/**
 * Potenziale di un semielemento M | Mⁿ⁺ con gli ioni alla concentrazione c (mol/L), equazione di Nernst a 25 °C:
 * E = E° + (0,05916 / n) · log₁₀ c. Senza ioni (c = 0) non è definito: null.
 */
export function halfCellPotential(E0, n, c) {
  if (!(c > 0) || !(n > 0)) return null;
  return E0 + (NERNST_SLOPE / n) * Math.log10(c);
}

/**
 * Lettura del voltmetro tra due semielementi { metal, E0, n, conc } (o null se nel posto non c'è un recipiente).
 * Il voltmetro (resistenza altissima) non fa passare corrente: la pila non si consuma. Senza ponte salino il circuito è
 * aperto e segna 0. Restituisce { volts (≥ 0, arrotondati a 0,01 V come il display), plus: 'a'|'b' (il polo +, il
 * metallo più nobile), why: null | 'empty' | 'electrode' | 'ions' | 'bridge' | 'same' }.
 */
export function cellReading(a, b, bridge) {
  for (const h of [a, b]) {
    if (!h) return { volts: 0, plus: null, why: 'empty' };
    if (!h.metal) return { volts: 0, plus: null, why: 'electrode' };
    if (!(h.conc > 1e-6)) return { volts: 0, plus: null, why: 'ions' };
  }
  if (!bridge) return { volts: 0, plus: null, why: 'bridge' };
  const Ea = halfCellPotential(a.E0, a.n, a.conc);
  const Eb = halfCellPotential(b.E0, b.n, b.conc);
  const volts = Math.round(Math.abs(Eb - Ea) * 100) / 100;
  // due semielementi uguali (stesso metallo, stessa concentrazione): niente differenza di potenziale
  if (a.metal === b.metal && volts < 0.005) return { volts: 0, plus: null, why: 'same' };
  return { volts, plus: Eb >= Ea ? 'b' : 'a', why: null };
}

/** Metano che brucia il Bunsen acceso (mol/s): circa 3,5 L al minuto, una fiamma da scuola di circa 2 kW. */
export const BUNSEN_GAS = 0.0024;
/** Volume di una mole di gas a 25 °C e 1 atm (L), per il contatore del gas. */
export const MOLAR_VOLUME = 24.5;
/** Litri che segna il contatore (arrotondati a 0,01 L come il display). */
export const meterLitres = (mol) => Math.round(mol * MOLAR_VOLUME * 100) / 100;
