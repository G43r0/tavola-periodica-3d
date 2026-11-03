// Forme condivise dai moduli controllati da `npm run typecheck` (tsc, solo come controllore di JSDoc).
// I moduli le usano così: `@param {import('../types').Element} el` (il percorso dipende dalla cartella).
// Qui ci sono solo tipi: nessun codice, nessun comportamento.

/** Categoria chimica di un elemento (`category` in elements.json). */
export type ElementCategory =
  | 'nonmetal'
  | 'noble-gas'
  | 'alkali'
  | 'alkaline-earth'
  | 'metalloid'
  | 'halogen'
  | 'post-transition'
  | 'transition'
  | 'lanthanide'
  | 'actinide'
  | 'unknown';

/** Un isotopo di un elemento (`isotopes[]` in elements.json). */
export interface Isotope {
  label: string;
  massNumber: number;
  neutrons: number;
  isomer: boolean;
  main: boolean;
  abundance: number | null;
  trace: boolean;
  synthetic: boolean;
  stable: boolean;
  halfLife: { value: number; unit: string; approx: boolean; seconds: number; text: string } | null;
  decay: { code: string; symbol: string; label: string }[];
}

/** Una voce di src/data/elements.json (i 118 elementi), con i campi che i moduli leggono. */
export interface Element {
  z: number;
  symbol: string;
  name: string;
  nameEn: string;
  /** Seconda grafia inglese, dove c'è (Al: Aluminum). */
  nameEnAlt?: string;
  /** Nome italiano, che `src/i18n/elements.js` conserva quando la lingua dell'interfaccia è l'inglese. */
  nameIt?: string;
  atomicMass: { text: string; value: number; isMassNumber: boolean };
  category: ElementCategory;
  predictedCategory: ElementCategory | null;
  /** `null` per lantanidi e attinidi. */
  group: number | null;
  period: number;
  block: 's' | 'p' | 'd' | 'f';
  grid: { x: number; y: number };
  protons: number;
  neutrons: number;
  electrons: number;
  mainIsotope: string;
  mainIsotopeKind: 'abundant' | 'most-stable';
  electronConfiguration: { full: string; short: string };
  shells: number[];
  state: 'gas' | 'solid' | 'liquid' | 'unknown';
  statePredicted: string | null;
  meltingPointK: number | null;
  boilingPointK: number | null;
  sublimationPointK: number | null;
  meltingNote: string | null;
  densityGcm3: number | null;
  densityNote: string | null;
  electronegativity: number | null;
  vdwRadiusPm: number | null;
  covalentRadiusPm: number | null;
  ionizationEnergyEv: number;
  electronAffinityEv: number | null;
  /** Stati di ossidazione come testo, con il segno meno tipografico («−1», «+1»). */
  oxidationStates: string[];
  isotopes: Isotope[];
  discovery: { year: string; by: string };
  nameOrigin: string;
  uses: string[];
  occurrence: string;
  cpkColor: string | null;
  dataQuality: 'measured' | 'partial' | 'predicted';
  /** Quali proprietà sono stime: 'en', 'bp', 'd', 'mp', 'state', 'config', 'ie', 'ox', 'category'. */
  estimated: string[];
  /** Vero se l'anione isolato non è legato (affinità elettronica non positiva). */
  anionUnbound?: boolean;
}

/** Un sottolivello occupato (`subshells(z)` in src/chem/electron-config.js). */
export interface Subshell {
  n: number;
  l: number;
  /** «1s», «3d»… */
  label: string;
  electrons: number;
}

/** Le proprietà di un elemento per il laboratorio molecolare (`createLabElements`). */
export interface LabElement {
  z: number;
  symbol: string;
  name: string;
  group: number | null;
  period: number;
  block: 's' | 'p' | 'd' | 'f';
  category: ElementCategory;
  /** 1 gruppi principali, 2 blocchi d e f, 3 Z ≥ 104 (vedi `TIER` in elements-lab.js). */
  tier: number;
  metal: boolean;
  nobleGas: boolean;
  /** Elettroni di valenza impegnabili. */
  V: number;
  valences: number[];
  maxBonds: number;
  /** Elettronegatività di Pauling (o di riserva). */
  en: number | null;
  enEstimated: boolean;
  /** Raggio covalente in pm. */
  rCov: number;
  rCovEstimated: boolean;
  mass: number;
  massIsNumber: boolean;
  /** Colore CPK `#rrggbb`. */
  color: string;
}

/** Ciò che restituisce `createLabElements`. */
export interface LabElements {
  get(z: number): LabElement | undefined;
  all(): LabElement[];
  bySymbol: Map<string, LabElement>;
}

/** Un atomo di un grafo molecolare. */
export interface GraphAtom {
  z: number;
  charge: number;
}

/** Un legame covalente di un grafo molecolare: indici degli atomi e ordine (1–3, 1,5 per la risonanza). */
export interface GraphBond {
  i: number;
  j: number;
  order: number;
}

/** Una molecola, uno ione o un composto ionico come grafo (`parseSmiles`, `Bench.describe`). */
export interface Graph {
  atoms: GraphAtom[];
  bonds: GraphBond[];
}

/** Una voce di src/lab/data/molecules.js (la libreria del laboratorio), prima dell'indicizzazione. */
export interface Molecule {
  id: string;
  name: string;
  /** Nome italiano, conservato dalla localizzazione (`localizeLibrary`). */
  nameIt?: string;
  aka?: string;
  akaIt?: string;
  group: string;
  /** Struttura in SMILES, con le cariche esplicite; il punto separa gli ioni di un composto ionico. */
  smiles: string;
  /** Scrittura usuale, se diversa da quella generata. */
  formula?: string;
  /** Stato a 25 °C e 1 atm: «gas», «liquido», «solido», «soluzione». */
  state?: string | null;
  /** ΔHf° in kJ/mol nello stato indicato da `state`. */
  hf?: number;
  /** Lunghezze di legame (pm) e angoli (°) sperimentali, per chiave come «O-H» o «H-O-H». */
  geo?: Record<string, number>;
  /** Momento dipolare in debye. */
  dipole?: number;
  desc: string;
  note?: string;
  uses?: string;
}

/** Una voce della libreria indicizzata da `createLibraryIndex`: la molecola più il suo grafo. */
export interface LibraryEntry extends Molecule {
  graph: Graph;
  /** Carica netta. */
  charge: number;
  /** Vero per i composti ionici (la SMILES ha più componenti). */
  ionic: boolean;
}

/** Ciò che restituisce `createLibraryIndex`. */
export interface LibraryIndex {
  entries: LibraryEntry[];
  get(id: string): LibraryEntry | undefined;
  byFormula(key: string): LibraryEntry[];
  byName(query: string, limit?: number): { exact: LibraryEntry | null; matches: LibraryEntry[] };
  identify(
    atoms: GraphAtom[],
    bonds: GraphBond[],
  ): { entry: LibraryEntry | null; exact: boolean; byFormula?: boolean; sameFormula: LibraryEntry[] };
}

/** Un termine di una reazione: coefficiente stechiometrico e specie (id della libreria o «el:Simbolo»). */
export type ReactionTerm = [number, string];

/** Una voce di src/lab/data/reactions.js (il catalogo delle reazioni del laboratorio). */
export interface Reaction {
  id: string;
  group: string;
  sub: string;
  /** Numero nel catalogo (docs/catalogo-reazioni.md). */
  catalogo: number;
  name?: string;
  reactants: ReactionTerm[];
  products: ReactionTerm[];
  /** Condizioni in italiano, lette dalla sandbox (`parseConditions`): «Δ», «cat. Ni», «elettrolisi»… */
  cond?: string;
  /** Ciò che serve perché la reazione avvenga, oltre all'energia. */
  needs?: string;
  /** `cond` e `needs` da mostrare, nella lingua dell'interfaccia. */
  condText?: string;
  needsText?: string;
  /** Reazione reversibile (⇌). */
  rev?: boolean;
  desc: string;
  note?: string;
}

/** Una specie chimica per i calcoli di bilanciamento ed entalpia (`speciesInfo`). */
export interface Species {
  key: string;
  formula: string | null;
  name: string;
  nameIt?: string;
  state: string | null;
  /** «g», «l», «s» o vuoto. */
  mark: string;
  /** ΔHf° in kJ/mol, o null se manca. */
  hf: number | null;
  atoms: GraphAtom[];
  bonds: GraphBond[];
  ionic: boolean;
  element: boolean;
  /** Solo per gli elementi: è un metallo. */
  metal?: boolean;
  /** La formula da mostrare, che `lab-view.js` aggiunge alle specie delle reazioni caricate. */
  display?: string;
  /** La voce della libreria, per le molecole e gli ioni. */
  entry?: LibraryEntry;
}

/** La tabella delle sostanze della sandbox e del gioco (`createSubstances` in src/sandbox/substances.js). */
export type SubstanceTable = ReturnType<typeof import('./sandbox/substances.js').createSubstances>;

/** Le reazioni del catalogo preparate per il motore (`buildChemistry` in src/sandbox/chemistry.js). */
export type SandboxChemistry = ReturnType<typeof import('./sandbox/chemistry.js').buildChemistry>;

/** La tabella delle sostanze, a cui `World` appende le reazioni alla prima creazione (una volta per tabella). */
export type Substances = SubstanceTable & { chem?: SandboxChemistry };

/** L'ambiente di un passo della miscela (`Mixture.tick`). */
export interface TickEnv {
  /** Potenza ricevuta (W). */
  heatW?: number;
  /** Dispersione (W/K). */
  lossWK?: number;
  /** Temperatura dell'ambiente (K). */
  Tenv?: number;
  /** Capacità termica del contenitore (J/K). */
  containerC?: number;
  /** Superficie libera (cm²). */
  area?: number;
  /** Agitazione (0–1). */
  stir?: number;
  open?: boolean;
  flame?: boolean;
  light?: boolean;
  /** Tensione degli elettrodi (V). */
  volts?: number;
}

/** Un legame come lo producono Combina e il banco: covalente (`order`) o ionico (`ionic`, `transfer`, `donor`). */
export interface BenchBond {
  i: number;
  j: number;
  order?: number;
  ionic?: boolean;
  /** Elettroni trasferiti dal donatore. */
  transfer?: number;
  /** Indice dell'atomo che cede gli elettroni. */
  donor?: number;
}

/** Un sale scomposto negli ioni da `ionicDecomposition`: ha la forma di una voce della libreria. */
export interface IonicSalt {
  graph: Graph;
  ionic: true;
  charge: 0;
}

/** Ciò che restituisce `combine`: la struttura trovata, oppure `ok: false` con il motivo in `message`. */
export interface CombineResult {
  ok: boolean;
  bonds?: BenchBond[];
  /** Da dove viene la struttura: 'library', 'ions', 'alkane' o 'search'. */
  source?: string;
  entry?: LibraryEntry;
  /** Quante copie della voce della libreria (4 H + 2 O → 2 H₂O). */
  copies?: number;
  salt?: IonicSalt;
  alternatives?: LibraryEntry[];
  unpaired?: number;
  message?: string;
  /** Solo per `source: 'search'`: unità separate, energia di legame (kJ/mol) e strutture provate. */
  units?: number;
  energy?: number;
  explored?: number;
}

/** La struttura di Lewis di un atomo (`analyzeLewis(...).atoms[i]`). */
export interface LewisAtom {
  /** Somma degli ordini dei legami. */
  bonds: number;
  /** Elettroni non di legame. */
  lone: number;
  lonePairs: number;
  unpaired: number;
  formalCharge: number;
  electronsAround: number;
  incomplete: boolean;
  expanded: boolean;
  overfilled: boolean;
}

/** Ciò che restituisce `analyzeLewis`. */
export interface LewisResult {
  charge: number;
  electrons: number;
  /** Il motivo per cui la struttura non è valida, o null. */
  invalid: string | null;
  atoms: LewisAtom[];
  /** Elettroni spaiati in tutto. */
  radical: number;
  /** Indici degli atomi con l'ottetto incompleto. */
  incomplete: number[];
  /** Indici degli atomi con l'ottetto espanso. */
  expanded: number[];
  /** Vero se c'è un elemento dei blocchi d o f (struttura non verificata). */
  unverified: boolean;
}

/** Un legame ionico di una descrizione del banco: indici degli atomi, elettroni trasferiti e atomo donatore. */
export interface IonicEdge {
  i: number;
  j: number;
  transfer: number;
  donor: number;
}

/** Un insieme di atomi del banco per i moduli di analisi (Lewis, geometria, riconoscimento): `Bench.describe`. */
export interface Description extends Graph {
  /** Gli id degli atomi del banco, nello stesso ordine di `atoms`. */
  ids?: number[];
  ionic?: IonicEdge[];
}

/** L'entalpia di una reazione (`reactionEnthalpy`): dalle entalpie di formazione e dalle energie di legame. */
export interface ReactionEnthalpy {
  formation: { value: number | null; missing: string[] };
  bonds: {
    value: number;
    /** Legami rotti e formati per tipo («O–H» → quanti). */
    broken: Map<string, number>;
    formed: Map<string, number>;
    brokenKj: number;
    formedKj: number;
  } | null;
}

/** Una reazione del catalogo con le sue specie, i coefficienti e l'entalpia (come la carica `lab-view.js`). */
export interface LoadedReaction {
  r: Reaction;
  reactants: Species[];
  products: Species[];
  /** Coefficienti dei reagenti e dei prodotti. */
  rc: number[];
  pc: number[];
  enthalpy: ReactionEnthalpy;
}

/** Le condizioni di una reazione, lette dal testo del catalogo (`parseConditions` in src/sandbox/chemistry.js). */
export type Conditions = ReturnType<typeof import('./sandbox/chemistry.js').parseConditions>;

/** Un reagente o un prodotto di una reazione compilata: coefficiente e sostanza (id nella tabella). */
export interface RxTerm {
  c: number;
  sid: number;
  /** Id della libreria o «el:Simbolo», dove la compilazione lo tiene. */
  key?: string;
}

/** Una reazione che il motore dei contenitori sa eseguire (`ctx.rxs` di `createLabChemistry`). */
export interface LabReaction {
  id: string;
  r: Reaction;
  reactants: RxTerm[];
  products: RxTerm[];
  cond: Conditions;
  /** ΔH° in kJ, o null se non si sa calcolare. */
  dH: number | null;
  group: string;
  combustion: boolean;
  /** Moli d'acqua formate se è una neutralizzazione con una base forte, altrimenti 0. */
  neutral: number;
  /** Indice del reagente O₂ (preso dall'aria), o -1. */
  air: number;
  slow: boolean;
  electro: boolean;
  /** Elettroni scambiati in un'elettrolisi. */
  electrons: number;
}

/** Una reazione del catalogo che il contenitore non esegue (`ctx.offline`), con il motivo. */
export interface OfflineReaction {
  id: string;
  r: Reaction;
  reactants: RxTerm[];
  products: RxTerm[];
  /** 'equilibrium', 'living', 'catalyst', 'discharge' o 'steam'. */
  why: string;
  group: string;
}

/** La chimica del simulatore: sostanze, reazioni e dati dei contenitori (`createLabChemistry` in mixture.js). */
export type LabChemistry = ReturnType<typeof import('./game/mixture.js').createLabChemistry>;

/** Una miscela di sostanze in un contenitore (la classe di src/game/mixture.js). */
export type Mixture = import('./game/mixture.js').Mixture;

/** Un ingrediente di una ricetta del libro. */
export interface Ingredient {
  role: 'water' | 'air' | 'gas' | 'reactant' | 'aux' | 'catalyst' | 'solvent';
  sid: number;
  /** Coefficiente stechiometrico. */
  c?: number;
  form: 'liquid' | 'air' | 'solution' | 'gas' | 'solid';
  /** Molarità (soluzioni). */
  molar?: number;
  /** Chiave della sostanza o del reagente del magazzino. */
  key?: string;
  /** Chiave del reagente dello scaffale o dell'armadio, se c'è. */
  shelf?: string | null;
  /** Chiave della bombola (gas). */
  gas?: string;
  mol?: number;
  ml?: number;
  g?: number;
}

/** Come si scalda nella ricetta: sulla piastra (a un livello) o con il Bunsen. */
export interface RecipeHeat {
  how: 'plate' | 'bunsen';
  /** Temperatura da raggiungere (K). */
  T: number;
  level?: number;
}

/** Il controllo che spunta un passo della ricetta nel gioco. */
export interface StepCheck {
  type: 'auto' | 'has' | 'temp' | 'rx' | 'hood' | 'waste';
  sid?: number;
  mol?: number;
  T?: number;
}

/** Un passo numerato di una ricetta: il modello del testo, i parametri (variano per tipo di passo) e il controllo. */
export interface RecipeStep {
  kind: string;
  params: Record<string, unknown>;
  check: StepCheck;
}

/** Una ricetta del libro «Come si fa» (`buildRecipe`). */
export interface Recipe {
  ok: true;
  id: string;
  rx: LabReaction;
  ingredients: Ingredient[];
  vessel: string;
  heat: RecipeHeat | null;
  flame: boolean;
  light: boolean;
  volts: number;
  gas: string | null;
  hood: boolean;
  steps: RecipeStep[];
  tags: string[];
  signals: ReturnType<typeof import('./game/signals.js').reactionSignals>;
  /** La sostanza che dà il titolo alla ricetta. */
  main: number;
  /** I reagenti da cui parte (sostanze). */
  from: number[];
  aqueous: boolean;
  slow: boolean;
  /** 1 facile, 2 media, 3 difficile. */
  difficulty: number;
  /** Tutti gli ingredienti vengono dallo scaffale o dall'armadio. */
  shelfOnly: boolean;
  /** Pittogrammi di pericolo (GHS01…GHS09). */
  ghs: string[];
  /** Secondi di gioco che il motore impiega (da book-verified.js). */
  seconds?: number;
  /** Rifiuto in cui va il preparato (da book-verified.js). */
  waste?: string | null;
}

/** Perché il laboratorio non sa preparare una reazione. */
export interface RecipeFailure {
  ok: false;
  id: string;
  /** 'shock', 'danger', 'molten', 'lowO2', 'tooHot', 'unavailable', 'catalyst', 'gasOnly' o 'engine'. */
  why: string;
  sid?: number;
  T?: number;
}

/** Modalità della chimica del simulatore: realistica o semplificata. */
export type ChemMode = 'real' | 'simple';

/** Un valore che può cambiare con la modalità: un numero solo oppure uno per modalità (la realistica fa da riserva). */
export type ModeValue<T> = T | { real?: T; simple?: T };

/**
 * Una condizione sullo stato del banco (career.js, `check`): una misura con le soglie, oppure una combinazione di
 * condizioni (`all`, `or`), oppure una domanda sui contenitori (`any`, `none`, `count`).
 */
export interface Condition {
  all?: Condition[];
  or?: Condition[];
  any?: Condition[];
  none?: Condition[];
  count?: Condition[];
  /** La misura: `$…` sullo stato del banco, altrimenti sul preparato consegnato. */
  m?: string;
  min?: ModeValue<number>;
  max?: ModeValue<number>;
  eq?: unknown;
  /** Solo nei contenitori: il tipo di oggetto e il campione che contiene. */
  kind?: string;
  sample?: number;
}

/** Un obiettivo di un'esercitazione: quanto vale la misura `m` rispetto al `target`, con la tolleranza `tol`. */
export interface ExerciseGoal {
  /** La riga del resoconto. */
  line?: string;
  m?: string;
  target?: ModeValue<number>;
  dir?: 'min' | 'max' | 'both';
  /** La tolleranza è relativa al valore da raggiungere. */
  rel?: boolean;
  tol?: ModeValue<number[] | { under?: number[]; over?: number[] }>;
  w?: ModeValue<number>;
  show?: { scale?: number };
  modes?: ChemMode[];
  /** Il goal è una risposta del giocatore (`answers` dell'esercitazione). */
  answers?: boolean;
  /** Il punteggio sotto 0,5 moltiplica la qualità per questo numero. */
  gate?: number;
  /** Solo una riga del resoconto: l'intervallo in cui il valore è giusto. */
  range?: ModeValue<[number, number]>;
}

/** Una penalità: toglie `minus` alla qualità se la condizione `if` è vera. */
export interface ExercisePenalty {
  if: Condition;
  minus: ModeValue<number>;
  line?: string;
  ok?: boolean | 'warn';
  modes?: ChemMode[];
  /** Sostanze di cui si dà il nome nel resoconto. */
  names?: string[];
}

/** Come si rispondono le domande di un'esercitazione con campioni incogniti. */
export interface ExerciseAnswers {
  type: 'choice' | 'number';
  count?: number;
  /** La misura sul campione che dà il valore giusto. */
  of?: string;
  unit?: string;
  /** La risposta giusta fissa, se non viene dal campione. */
  value?: number | string;
  tol?: ModeValue<number[]>;
  /** Le scelte possibili, o «flame» per i colori della fiamma. */
  options?: string[] | 'flame';
}

/** Un campione incognito di un'esercitazione. */
export interface ExerciseSample {
  /** Il contenuto, come lo descrive `contentMixture`. */
  content: Record<string, unknown>;
  answer?: number | string;
}

/** Una voce di src/game/data/career-exercises.js (le esercitazioni della Carriera). */
export interface Exercise {
  id: string;
  chapter: number;
  /** Paga e tempo di riferimento (secondi). */
  pay: number;
  par: number;
  /** Gli oggetti sul banco all'inizio. */
  setup: Record<string, unknown>[];
  steps: { key: string; when: Condition }[];
  goals: ExerciseGoal[];
  penalties?: ExercisePenalty[];
  /** Dove si consegna il preparato (di solito il vassoio). */
  deliver?: string;
  samples?: { pool: ExerciseSample[]; count?: number; oneOfEach?: boolean };
  answers?: ExerciseAnswers;
  /** Verifica di fine capitolo: dà un voto. */
  exam?: boolean;
  /** Richiesta extra, facoltativa: serve la reputazione `rep`. */
  extra?: { rep: number };
  report?: { q: string; opts: string[]; a: number }[];
  /** Le pagine del libro che si aprono con l'esercitazione. */
  book?: string[];
  /**
   * La soluzione scritta nei dati, eseguita da `runSolution`: [contenitore, azione, …argomenti]. Gli argomenti hanno
   * un tipo diverso per ogni azione, quindi qui sono `any`.
   */
  solution?: any[][];
}

/** Una sfida a tempo (src/game/data/career-exercises.js). */
export interface Challenge {
  id: string;
  /** L'esercitazione su cui si gioca. */
  ex: string;
  /** Tempi (secondi) per le tre medaglie. */
  gold: number;
  silver: number;
  bronze: number;
}

/** Un campione incognito estratto: il contenuto, la risposta e, per le risposte numeriche, il valore misurato. */
export interface Unknown {
  content: Record<string, unknown>;
  answer?: number | string;
  value?: number;
}

/** Un contenitore sul banco nello snapshot. */
export interface SnapshotContainer {
  kind: string;
  stock: boolean;
  mix: Mixture;
  peakT?: number;
  sample?: number;
  name?: string;
  item?: unknown;
}

/**
 * Lo stato del banco per i passi e la valutazione (`Game.snapshot()`; `runSolution` ne costruisce uno con gli stessi
 * campi, ma solo quelli che la soluzione scrive).
 */
export interface Snapshot {
  mode: ChemMode;
  ctx?: LabChemistry;
  containers?: SnapshotContainer[];
  /** La miscela consegnata, o null. */
  product?: Mixture | null;
  delivered?: boolean;
  answers?: Record<number, unknown> | null;
  unknowns?: Unknown[];
  /** Eventi contati (tara, lavaggio, smaltimento…). */
  ev?: Record<string, number>;
  /** Moli uscite dai recipienti, per id della sostanza. */
  gas?: Record<string | number, number>;
  /** Reazioni avvenute (id). */
  rx?: Set<string>;
  /** Colori di fiamma visti. */
  flame?: Set<unknown>;
  bunsen?: boolean;
  fires?: number;
  mess?: number;
  dirtyStart?: number;
  dirtyLeft?: number;
  /** Il tipo dell'oggetto in mano. */
  held?: string;
  /** Recipienti sul vassoio. */
  tray?: number;
  /** Campioni misurati con il pH-metro. */
  phRead?: Set<unknown>;
  /** Secondi per spegnere il fuoco. */
  fireTime?: number;
}

/** Il risultato migliore di un'esercitazione nella Carriera. */
export interface CareerResult {
  stars: number;
  /** Risposte giuste della relazione. */
  report: number;
  tries: number;
  /** Voto di una verifica (4–10). */
  mark?: number;
  /** Incidenti del tentativo più pulito. */
  incidents?: number;
  /** Dato per fatto dalla migrazione dal salvataggio della versione 1. */
  migrated?: boolean;
}

/** Il risultato di una sfida a tempo nella Carriera. */
export interface ChallengeResult {
  /** 0 nessuna, 1 bronzo, 2 argento, 3 oro. */
  medal: number;
  /** Il tempo migliore (secondi), o null. */
  best: number | null;
  tries?: number;
}

/** La Carriera di un profilo (`newCareer` in src/game/career.js). */
export interface Career {
  results: Record<string, CareerResult>;
  money: number;
  incidents: number;
  owned: string[];
  last: string | null;
  challenges: Record<string, ChallengeResult>;
}

/** Un profilo del salvataggio (`newProfile` in src/game/save.js). */
export interface Profile {
  id: string;
  name: string;
  created: string;
  career: Career;
  notebook: unknown;
}

/** Il salvataggio del simulatore, versione 2 (`migrate` in src/game/save.js). */
export interface Save {
  version: number;
  settings: {
    chemMode: ChemMode;
    legend: boolean;
    fov?: number;
    volume?: number;
    muted?: boolean;
    shake?: boolean;
  };
  active: string;
  profiles: Profile[];
  /** Quando è stato scritto, per scegliere il più recente (`newer`). */
  savedAt?: string;
}

// Il gioco aggiunge alla miscela la temperatura più alta raggiunta (game.js, career.js `runSolution`): `peakC` la legge.
declare module './game/mixture.js' {
  interface Mixture {
    /** La temperatura più alta raggiunta (K), se qualcuno l'ha registrata. */
    peakT?: number;
  }
}
