// Contenuto della scheda "Analisi della particella" (protone, neutrone, elettrone e quark).
import { PARTICLES, QUARKS, COLOR_CHARGES, ELEMENTARY_CHARGE_C, PROTON_ELECTRON_MASS_RATIO } from '../chem/particles.js';
import { electronBinding, outermostSubshell } from '../chem/electron-binding.js';
import { bindingPerNucleon } from '../chem/nuclear.js';
import { orbitalHtml } from '../chem/quantum-numbers.js';
import { L_LETTERS } from '../chem/electron-config.js';
import { esc, fmtNumber, fmtAbundance, isotopeNotation, superscript } from '../chem/format.js';
import { createT, isSimple } from '../i18n/index.js';
import { icons } from '../ui/icons.js';

const t = createT({
  it: {
    close: 'Chiudi l\'analisi (Esc)',
    charge: 'Carica',
    mass: 'Massa',
    spin: 'Spin',
    composition: 'Composizione',
    family: 'Famiglia',
    radius: 'Raggio',
    stability: 'Stabilità',
    alone: 'Da solo',
    baryon: 'Barione (adrone)',
    lepton: 'Leptone (fermione)',
    stable: '<b>Stabile</b>',
    unstable: '<b>Instabile</b>',
    neutral: '<b>0</b> (neutro)',
    h1Binding: '<p>Il nucleo dell\'idrogeno-1 è un singolo protone: non c\'è energia di legame nucleare.</p>',
    srcMeasured: 'valore sperimentale (AME2020)',
    srcEstimate: 'stima con la formula semi-empirica di Weizsäcker',
    bindingEnergy: 'Energia di legame',
    perNucleon: 'per nucleone',
    inTotal: '≈ {total} MeV in tutto · {src}',
    bindingText: '<p>È l\'energia necessaria per separare tutti i nucleoni: per questo la massa del nucleo è un po\' minore della somma delle masse di protoni e neutroni (<i>difetto di massa</i>, E = mc²).</p>',
    inNucleus: 'Nel nucleo {name}',
    insideProton: 'Dentro il protone: i quark',
    insideNeutron: 'Dentro il neutrone: i quark',
    backToNucleus: 'Torna al nucleo',
    lookInside: 'Guarda dentro: i quark',
    wheelOut: 'Allontanati con la rotella per tornare al nucleo.',
    wheelIn: 'Oppure avvicinati con la rotella del mouse.',
    quark: 'Quark',
    totalCharge: (p) => `Carica totale: ${p.sum} = <b>${p.total}</b>. Insieme i tre quark pesano circa ${p.valence} MeV/c², appena l'${p.share} % della massa del ${p.proton ? 'protone' : 'neutrone'}: il resto è energia dei gluoni e del moto dei quark (E = mc²).`,
    colorCharge: (p) => `Ogni quark ha una <b>carica di colore</b> (${p.colors}): insieme formano una combinazione «bianca». I <b>gluoni</b>, mediatori della forza forte, scambiano di continuo il colore tra i quark e li tengono legati: un quark non si può mai isolare (<i>confinamento</i>).`,
    quarkNote: 'Rappresentazione schematica: dimensioni, moto e numero di gluoni non sono reali. Nel nucleone compaiono e scompaiono anche coppie quark–antiquark virtuali (i puntini).',
    nextZ: (p) => `con un protone in più sarebbe ${p.name} (${p.symbol})`,
    next119: 'con un protone in più sarebbe l\'elemento 119, mai osservato',
    prevZ: (p) => `con uno in meno ${p.name} (${p.symbol})`,
    prev0: 'con uno in meno non resterebbe alcun nucleo',
    protonEyebrow: (p) => `Particella del nucleo · ${p.z === 1 ? 'l\'unico protone' : `uno dei ${p.z} protoni`}`,
    protonMassExtra: '≈ {ratio} volte la massa dell\'elettrone',
    fermionPauli: 'fermione: obbedisce al principio di esclusione di Pauli',
    radiusNote: '1 fm = 10⁻¹⁵ m (raggio di carica)',
    protonStable: 'vita media > 10³⁴ anni: non è mai stato osservato decadere',
    roleInAtom: 'Ruolo nell\'atomo',
    protonRole: (p) => `<p>Il numero di protoni è il <b>numero atomico Z</b> e identifica l'elemento: ogni atomo con ${p.z} protoni è <b>${p.name}</b>; ${p.neighbours}.</p>
       <p>La carica positiva del nucleo (+${p.z}) trattiene ${p.z === 1 ? 'l\'elettrone' : `i ${p.z} elettroni`} dell'atomo neutro.
         ${p.z > 1 ? 'I protoni si respingono per la forza elettrica: a tenerli uniti è la forza nucleare forte, che agisce tra nucleoni vicini (circa 1 fm).' : ''}</p>`,
    stableNucleus: (p) => `<p>In ${p.name}, nucleo stabile, i neutroni non decadono: lo impedisce l'energia di legame del nucleo.</p>`,
    radioT: 'radioattivo, t½ {t}',
    decayBminus: (p) => `un neutrone si trasforma in protone emettendo un elettrone e un antineutrino (decadimento β⁻)${p.to ? `: l'atomo di ${p.from} diventa un atomo di ${p.to}` : ''}`,
    decay2B: 'due neutroni si trasformano insieme in protoni (doppio decadimento β⁻, rarissimo)',
    decayBplus: (p) => `avviene il contrario: un protone si trasforma in neutrone (${p.ce ? 'cattura elettronica' : 'decadimento β⁺'})${p.to ? `: l'atomo diventa un atomo di ${p.to}` : ''}`,
    decayAlpha: (p) => `il nucleo emette una particella α, cioè 2 protoni e 2 neutroni${p.to ? `, e diventa un nucleo di ${p.to}` : ''}`,
    decayFission: 'il nucleo può spezzarsi in due nuclei più leggeri (fissione spontanea)',
    decayJoin: '; oppure ',
    decaySentence: (p) => `<p>In ${p.name} (${p.t}): ${p.parts}.</p>`,
    naturalIsotopes: 'Isotopi presenti in natura: {list}.',
    noNatural: '{name} non si trova in natura: i suoi isotopi sono prodotti artificialmente.',
    noneStable: ' Nessuno dei suoi isotopi è stabile.',
    neutronEyebrow: (p) => `Particella del nucleo · ${p.n === 1 ? 'l\'unico neutrone' : `uno dei ${p.n} neutroni`}`,
    neutronMassExtra: '≈ {diff} MeV/c² più del protone',
    fermion: 'fermione',
    neutronDecay: (p) => `decade β⁻: n → p⁺ + e⁻ + ν̄<sub>e</sub> · vita media ≈ ${p.tau} s (${p.min} min ${p.sec} s), emivita ≈ ${p.half} min`,
    stabilityHere: 'Stabilità in questo nucleo',
    roleIsotopes: 'Ruolo negli isotopi',
    isotopesText: (p) => `<p>Atomi dello stesso elemento con un numero diverso di neutroni sono <b>isotopi</b>: hanno le stesse proprietà chimiche ma massa diversa. ${p.natText}</p>
       <p>Questo nucleo ha ${p.n} neutroni (N/Z = ${p.ratio}).
         ${p.heavy ? 'Nei nuclei pesanti servono più neutroni che protoni: aggiungono attrazione nucleare senza aumentare la repulsione elettrica.' : 'Nei nuclei leggeri stabili neutroni e protoni sono circa in ugual numero.'}</p>
       <p class="pp-hint">Cambia isotopo dal pannello dei controlli per aggiungere o togliere neutroni.</p>`,
    pauliPair: (p) => `Condivide l'orbitale con un elettrone di spin opposto (m<sub>s</sub> = ${p.other}): per il <b>principio di Pauli</b> due elettroni non possono avere tutti e quattro i numeri quantici uguali.`,
    hundSingle: 'È <b>spaiato</b>: per la <b>regola di Hund</b> gli elettroni occupano prima orbitali diversi dello stesso sottolivello, con spin paralleli.',
    methodIe: (p) => `${p.predicted ? 'valore previsto' : 'valore misurato (NIST)'}: è la <b>prima energia di ionizzazione</b>, perché questo è uno degli elettroni più esterni`,
    methodXray: 'valore sperimentale (X-ray Data Booklet) per l\'elemento nella sua forma naturale',
    methodSlater: (p) => `stima con le regole di Slater (modello non relativistico): indica solo l'ordine di grandezza${p.heavy ? '; negli elementi pesanti gli effetti relativistici la aumentano' : ''}`,
    spinOrbit: 'livelli separati dall\'interazione spin-orbita',
    qnPrincipal: 'principale',
    qnPrincipalDesc: 'guscio {shell}: energia e distanza media dal nucleo',
    qnSecondary: 'secondario',
    qnSecondaryDesc: 'forma dell\'orbitale: {l}',
    qnMagnetic: 'magnetico',
    qnMagneticDesc: 'orientamento: orbitale {orb}',
    qnSpin: 'di spin',
    qnSpinDesc: (p) => `spin ${p.up ? '«su»' : '«giù»'}`,
    quantumNote: 'Nel modello quantistico l\'elettrone non ha una traiettoria: è distribuito nella nuvola di probabilità del suo orbitale ({orb}).',
    followBohr: 'Segui l\'elettrone nel modello di Bohr',
    showOrbital: 'Mostra l\'orbitale {orb}',
    electronEyebrow: 'Particella dell\'atomo · guscio {shell}',
    electronMassExtra: 'circa 1/{ratio} della massa del protone',
    spinHere: 'qui m<sub>s</sub> = {ms} ({arrow})',
    quantumNumbers: 'Numeri quantici',
    realOrbitals: 'Gli orbitali reali ({orb}…) sono combinazioni di stati con +m<sub>l</sub> e −m<sub>l</sub>; qui si usa la corrispondenza convenzionale.',
    position: 'Posizione nell\'atomo',
    positionText: (p) => `Guscio <b>${p.shell}</b> (n = ${p.n}) · sottolivello <b>${p.sub}</b> · orbitale <b>${p.orb}</b> con ${p.pair ? '2 elettroni (↑↓)' : '1 elettrone (↑)'}.`,
    electronBinding: 'Energia di legame',
    minEnergy: 'Energia minima per strapparlo all\'atomo: {method}.',
    zeff: 'Z efficace',
    zeffH: 'un solo elettrone: nessuna schermatura',
    zeffSlater: 'regole di Slater: della carica del nucleo (+{z}) gli altri elettroni ne schermano circa {screen}',
    outerCompare: 'Per confronto, l\'elettrone più esterno ({sub}) è legato con {e}.',
    elementary: 'Particella elementare',
    elementaryText: '<p>A differenza di protoni e neutroni, l\'elettrone non è formato da particelle più piccole: gli esperimenti non hanno mai rilevato una struttura interna (dimensione &lt; 10⁻¹⁸ m).</p>',
    quarkTip: (p) => `<b class="q-${p.key}">Quark ${p.name} (${p.flavor})</b> · carica ${p.charge} e · colore ${p.color}
    <br><small>massa ≈ ${p.mass} MeV/c² · i gluoni gli fanno cambiare colore di continuo</small>`,
    simpleTitle: 'In parole semplici',
  },
  en: {
    close: 'Close the analysis (Esc)',
    charge: 'Charge',
    mass: 'Mass',
    spin: 'Spin',
    composition: 'Composition',
    family: 'Family',
    radius: 'Radius',
    stability: 'Stability',
    alone: 'On its own',
    baryon: 'Baryon (hadron)',
    lepton: 'Lepton (fermion)',
    stable: '<b>Stable</b>',
    unstable: '<b>Unstable</b>',
    neutral: '<b>0</b> (neutral)',
    h1Binding: '<p>The nucleus of hydrogen-1 is a single proton: there is no nuclear binding energy.</p>',
    srcMeasured: 'experimental value (AME2020)',
    srcEstimate: 'estimate from the Weizsäcker semi-empirical formula',
    bindingEnergy: 'Binding energy',
    perNucleon: 'per nucleon',
    inTotal: '≈ {total} MeV in total · {src}',
    bindingText: '<p>It is the energy needed to pull all the nucleons apart: that is why the mass of the nucleus is a little smaller than the sum of the masses of its protons and neutrons (<i>mass defect</i>, E = mc²).</p>',
    inNucleus: 'In the {name} nucleus',
    insideProton: 'Inside the proton: the quarks',
    insideNeutron: 'Inside the neutron: the quarks',
    backToNucleus: 'Back to the nucleus',
    lookInside: 'Look inside: the quarks',
    wheelOut: 'Zoom out with the wheel to go back to the nucleus.',
    wheelIn: 'Or zoom in with the mouse wheel.',
    quark: 'Quark',
    totalCharge: (p) => `Total charge: ${p.sum} = <b>${p.total}</b>. Together the three quarks weigh about ${p.valence} MeV/c², just ${p.share} % of the mass of the ${p.proton ? 'proton' : 'neutron'}: the rest is the energy of the gluons and of the quarks' motion (E = mc²).`,
    colorCharge: (p) => `Each quark carries a <b>colour charge</b> (${p.colors}): together they form a «white» combination. The <b>gluons</b>, carriers of the strong force, keep swapping colour between the quarks and hold them together: a quark can never be isolated (<i>confinement</i>).`,
    quarkNote: 'Schematic picture: sizes, motion and number of gluons are not real. Virtual quark–antiquark pairs (the dots) also pop in and out of the nucleon.',
    nextZ: (p) => `with one more proton it would be ${p.name} (${p.symbol})`,
    next119: 'with one more proton it would be element 119, never observed',
    prevZ: (p) => `with one fewer, ${p.name} (${p.symbol})`,
    prev0: 'with one fewer, no nucleus would be left',
    protonEyebrow: (p) => `Particle of the nucleus · ${p.z === 1 ? 'the only proton' : `one of ${p.z} protons`}`,
    protonMassExtra: '≈ {ratio} times the mass of the electron',
    fermionPauli: 'fermion: it obeys the Pauli exclusion principle',
    radiusNote: '1 fm = 10⁻¹⁵ m (charge radius)',
    protonStable: 'mean lifetime > 10³⁴ years: it has never been seen to decay',
    roleInAtom: 'Role in the atom',
    protonRole: (p) => `<p>The number of protons is the <b>atomic number Z</b> and identifies the element: every atom with ${p.z} protons is <b>${p.name}</b>; ${p.neighbours}.</p>
       <p>The positive charge of the nucleus (+${p.z}) holds ${p.z === 1 ? 'the electron' : `the ${p.z} electrons`} of the neutral atom.
         ${p.z > 1 ? 'Protons repel each other through the electric force: what holds them together is the strong nuclear force, which acts between nearby nucleons (about 1 fm).' : ''}</p>`,
    stableNucleus: (p) => `<p>In ${p.name}, a stable nucleus, the neutrons do not decay: the binding energy of the nucleus prevents it.</p>`,
    radioT: 'radioactive, t½ {t}',
    decayBminus: (p) => `a neutron turns into a proton by emitting an electron and an antineutrino (β⁻ decay)${p.to ? `: the ${p.from} atom becomes a ${p.to} atom` : ''}`,
    decay2B: 'two neutrons turn into protons together (double β⁻ decay, extremely rare)',
    decayBplus: (p) => `the opposite happens: a proton turns into a neutron (${p.ce ? 'electron capture' : 'β⁺ decay'})${p.to ? `: the atom becomes a ${p.to} atom` : ''}`,
    decayAlpha: (p) => `the nucleus emits an α particle, i.e. 2 protons and 2 neutrons${p.to ? `, and becomes a ${p.to} nucleus` : ''}`,
    decayFission: 'the nucleus can split into two lighter nuclei (spontaneous fission)',
    decayJoin: '; or ',
    decaySentence: (p) => `<p>In ${p.name} (${p.t}): ${p.parts}.</p>`,
    naturalIsotopes: 'Isotopes found in nature: {list}.',
    noNatural: '{name} is not found in nature: its isotopes are made artificially.',
    noneStable: ' None of its isotopes is stable.',
    neutronEyebrow: (p) => `Particle of the nucleus · ${p.n === 1 ? 'the only neutron' : `one of ${p.n} neutrons`}`,
    neutronMassExtra: '≈ {diff} MeV/c² more than the proton',
    fermion: 'fermion',
    neutronDecay: (p) => `β⁻ decays: n → p⁺ + e⁻ + ν̄<sub>e</sub> · mean lifetime ≈ ${p.tau} s (${p.min} min ${p.sec} s), half-life ≈ ${p.half} min`,
    stabilityHere: 'Stability in this nucleus',
    roleIsotopes: 'Role in isotopes',
    isotopesText: (p) => `<p>Atoms of the same element with a different number of neutrons are <b>isotopes</b>: they have the same chemical properties but different masses. ${p.natText}</p>
       <p>This nucleus has ${p.n} neutrons (N/Z = ${p.ratio}).
         ${p.heavy ? 'Heavy nuclei need more neutrons than protons: they add nuclear attraction without increasing electric repulsion.' : 'In light stable nuclei neutrons and protons are roughly equal in number.'}</p>
       <p class="pp-hint">Change the isotope in the control panel to add or remove neutrons.</p>`,
    pauliPair: (p) => `It shares the orbital with an electron of opposite spin (m<sub>s</sub> = ${p.other}): by the <b>Pauli principle</b> no two electrons can have all four quantum numbers equal.`,
    hundSingle: 'It is <b>unpaired</b>: by <b>Hund\'s rule</b> electrons first occupy different orbitals of the same subshell, with parallel spins.',
    methodIe: (p) => `${p.predicted ? 'predicted value' : 'measured value (NIST)'}: it is the <b>first ionisation energy</b>, because this is one of the outermost electrons`,
    methodXray: 'experimental value (X-ray Data Booklet) for the element in its natural form',
    methodSlater: (p) => `estimate from Slater's rules (non-relativistic model): it only gives the order of magnitude${p.heavy ? '; in heavy elements relativistic effects increase it' : ''}`,
    spinOrbit: 'levels split by the spin-orbit interaction',
    qnPrincipal: 'principal',
    qnPrincipalDesc: 'shell {shell}: energy and average distance from the nucleus',
    qnSecondary: 'azimuthal',
    qnSecondaryDesc: 'shape of the orbital: {l}',
    qnMagnetic: 'magnetic',
    qnMagneticDesc: 'orientation: orbital {orb}',
    qnSpin: 'spin',
    qnSpinDesc: (p) => `spin ${p.up ? '«up»' : '«down»'}`,
    quantumNote: 'In the quantum model the electron has no path: it is spread over the probability cloud of its orbital ({orb}).',
    followBohr: 'Follow the electron in the Bohr model',
    showOrbital: 'Show the {orb} orbital',
    electronEyebrow: 'Particle of the atom · shell {shell}',
    electronMassExtra: 'about 1/{ratio} of the proton mass',
    spinHere: 'here m<sub>s</sub> = {ms} ({arrow})',
    quantumNumbers: 'Quantum numbers',
    realOrbitals: 'Real orbitals ({orb}…) are combinations of states with +m<sub>l</sub> and −m<sub>l</sub>; the usual correspondence is used here.',
    position: 'Position in the atom',
    positionText: (p) => `Shell <b>${p.shell}</b> (n = ${p.n}) · subshell <b>${p.sub}</b> · orbital <b>${p.orb}</b> with ${p.pair ? '2 electrons (↑↓)' : '1 electron (↑)'}.`,
    electronBinding: 'Binding energy',
    minEnergy: 'Minimum energy to pull it out of the atom: {method}.',
    zeff: 'Effective Z',
    zeffH: 'a single electron: no shielding',
    zeffSlater: 'Slater\'s rules: of the nuclear charge (+{z}) the other electrons shield about {screen}',
    outerCompare: 'For comparison, the outermost electron ({sub}) is bound by {e}.',
    elementary: 'Elementary particle',
    elementaryText: '<p>Unlike protons and neutrons, the electron is not made of smaller particles: experiments have never detected any internal structure (size &lt; 10⁻¹⁸ m).</p>',
    quarkTip: (p) => `<b class="q-${p.key}">${p.name} quark (${p.flavor})</b> · charge ${p.charge} e · colour ${p.color}
    <br><small>mass ≈ ${p.mass} MeV/c² · the gluons keep changing its colour</small>`,
    simpleTitle: 'In simple words',
  },
  eli6: {
    simpleTitle: 'In parole semplici',
    'simple.proton': 'Il <b>protone</b> è un pallino con carica positiva che sta nel centro dell\'atomo, il nucleo. Il numero di protoni decide che elemento è: con 1 protone è idrogeno, con 6 è carbonio, con 26 è ferro. Se ne togli o ne aggiungi uno, diventa un altro elemento!',
    'simple.neutron': 'Il <b>neutrone</b> sta nel nucleo insieme ai protoni, ma non ha carica: è neutro. Fa da «colla»: aiuta a tenere uniti i protoni, che altrimenti si respingerebbero. Atomi uguali con più o meno neutroni si chiamano <b>isotopi</b>: pesano diversamente, ma si comportano allo stesso modo.',
    'simple.electron': 'L\'<b>elettrone</b> è leggerissimo (quasi 2000 volte meno di un protone) e ha carica negativa. Sta intorno al nucleo, attirato dai protoni. Sono gli elettroni più esterni che decidono come un atomo si lega agli altri: è da loro che nasce tutta la chimica.',
    'simple.quarks': 'Protoni e neutroni non sono pallini pieni: dentro ognuno ci sono tre pezzetti ancora più piccoli, i <b>quark</b>, tenuti insieme da una forza fortissima. I fili colorati che vedi sono i <b>gluoni</b>, la «colla» dei quark. Un quark non si può mai tirare fuori da solo.',
    h1Binding: '<p>Il nucleo dell\'idrogeno è un protone da solo: non c\'è niente da tenere insieme.</p>',
    bindingText: '<p>È quanta energia servirebbe per smontare il nucleo pezzo per pezzo. Più è alta, più il nucleo è robusto.</p>',
    stableNucleus: (p) => `<p>Il nucleo ${p.name} è stabile: i suoi neutroni restano come sono, per sempre.</p>`,
    roleInAtom: 'A cosa serve nell\'atomo',
    protonRole: (p) => `<p>Il numero di protoni è il <b>numero atomico</b>: decide che elemento è. Ogni atomo con ${p.z} protoni è <b>${p.name}</b>; ${p.neighbours}.</p>
       <p>I protoni hanno carica positiva e attirano gli elettroni, che hanno carica negativa: per questo gli elettroni restano intorno al nucleo.</p>`,
    roleIsotopes: 'Le versioni dello stesso atomo',
    isotopesText: (p) => `<p>Atomi dello stesso elemento con più o meno neutroni si chiamano <b>isotopi</b>. Si comportano allo stesso modo, ma pesano in modo diverso. ${p.natText}</p>
       <p class="pp-hint">Dal pannello a destra puoi cambiare versione e aggiungere o togliere neutroni.</p>`,
    quantumNumbers: 'Il suo «indirizzo» (numeri quantici)',
    position: 'Dove si trova',
    pauliPair: () => 'Divide la sua nuvola con un altro elettrone che gira al contrario: in ogni nuvola ci stanno al massimo due elettroni, e devono essere diversi (<b>principio di Pauli</b>).',
    hundSingle: 'È da solo nella sua nuvola: gli elettroni preferiscono prima occupare nuvole vuote, e solo dopo mettersi in coppia (<b>regola di Hund</b>).',
    electronBinding: 'Quanto è attaccato all\'atomo',
    minEnergy: 'È l\'energia che serve per strapparlo via: {method}.',
    elementary: 'Non è fatto di pezzi più piccoli',
    elementaryText: '<p>Protoni e neutroni sono fatti di quark, ma l\'elettrone no: per quanto ne sappiamo, è un pezzo unico.</p>',
    lookInside: 'Guarda dentro: i quark',
    wheelIn: 'Oppure avvicinati con la rotella del mouse.',
    quarkNote: 'È un disegno semplificato: in realtà nessuno può fotografare un quark.',
  },
});

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).replace(/[-0-9]/g, (c) => SUP[c]);

/** Notazione scientifica: 1,672 62 × 10⁻²⁷ */
function sci(value, digits) {
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mant = value / 10 ** exp;
  return `${fmtNumber(mant, digits, digits)} × 10${sup(exp)}`;
}

/** Arrotonda a `n` cifre significative. */
function sig(value, n) {
  if (!value) return value;
  const p = 10 ** (Math.floor(Math.log10(Math.abs(value))) - n + 1);
  return Math.round(value / p) * p;
}

/** Energia già arrotondata alla precisione voluta: sopra 1000 eV si passa ai keV (1 keV = 1000 eV). */
function fmtEnergy(ev) {
  if (ev >= 1000) return `${fmtNumber(ev / 1000, 3)} keV`;
  return `${fmtNumber(ev, 3)} eV`;
}

const row = (label, value, note = '', help = '') =>
  `<div class="pp-row"${help ? ` data-help="${help}"` : ''}><dt>${label}</dt><dd>${value}${note ? `<small>${note}</small>` : ''}</dd></div>`;

const section = (title, body, cls = '') => `<section class="pp-sec ${cls}"><h4>${title}</h4>${body}</section>`;

/** Nella lingua semplice: un riquadro introduttivo con la spiegazione per tutti. */
const simple = (key) => (isSimple() && t.has(`simple.${key}`) ? section(t('simpleTitle'), `<p>${t(`simple.${key}`)}</p>`, 'pp-sec--simple') : '');

function header(kind, eyebrow) {
  const p = PARTICLES[kind];
  return `<header class="pp-head">
      <span class="pp-icon pp-icon--${kind}" aria-hidden="true"></span>
      <div class="pp-head__text">
        <p class="pp-eyebrow">${eyebrow}</p>
        <h3 id="pp-title" data-help="term.${kind}">${p.name} <span class="pp-sym">${p.symbol}</span></h3>
      </div>
      <button type="button" class="btn-icon" data-act="deselect" title="${esc(t('close'))}">${icons.close(17)}</button>
    </header>`;
}

function chargeRow(p) {
  const sign = p.charge > 0 ? '+' : p.charge < 0 ? '−' : '';
  const coulomb = p.charge === 0 ? '0 C' : `${sign}${sci(ELEMENTARY_CHARGE_C, 6)} C`;
  return row(t('charge'), `<b>${sign}${Math.abs(p.charge)}</b> e`, coulomb, 'term.charge');
}

function massRow(p, extra = '') {
  const mev = p.massMeV < 1 ? fmtNumber(p.massMeV, 6, 6) : fmtNumber(p.massMeV, 3, 3);
  const u = p.massU < 0.01 ? sci(p.massU, 5) : fmtNumber(p.massU, 6, 6);
  return row(t('mass'), `<b>${sci(p.massKg, 5)} kg</b>`, `${mev} MeV/c² · ${u} u${extra ? `<br>${extra}` : ''}`);
}

const quarkChips = (flavors) =>
  `<span class="pp-quarks">${flavors.map((f, i) => `<i class="q q--${COLOR_CHARGES[i].key}">${f}</i>`).join('')}</span>`;

// ------------------------------------------------------------------ nucleoni

function nucleusBlock(ctx) {
  const { el, iso } = ctx;
  const A = iso.massNumber;
  const b = bindingPerNucleon(el.z, A);
  const name = `${isotopeNotation(iso, esc(el.symbol))}`;
  let binding;
  if (!b) {
    binding = t('h1Binding');
  } else {
    const src = b.measured ? t('srcMeasured') : t('srcEstimate');
    binding = `<dl class="pp-list">${row(t('bindingEnergy'), `<b>≈ ${fmtNumber(b.mev, 2, 2)} MeV</b> ${t('perNucleon')}`, t('inTotal', { total: fmtNumber(sig(b.mev * A, 3), 0), src }), 'term.bindingEnergy')}</dl>
      ${t('bindingText')}`;
  }
  return section(t('inNucleus', { name }), `<p class="pp-eq"><b class="p">${el.z}</b> p⁺ + <b class="n">${iso.neutrons}</b> n⁰ = A <b>${A}</b></p>${binding}`);
}

function quarkBlock(kind, ctx) {
  const p = PARTICLES[kind];
  const valence = p.quarks.reduce((s, f) => s + QUARKS[f].massMeV, 0);
  const share = (valence / p.massMeV) * 100;
  const sum = p.quarks.map((f) => QUARKS[f].charge).join(' ');
  return section(
    kind === 'proton' ? t('insideProton') : t('insideNeutron'),
    `${simple('quarks')}
     <button type="button" class="av-btn pp-cta" data-act="quarks" data-help="term.quark">${icons.zoom(17)}<span>${ctx.quarkView ? t('backToNucleus') : t('lookInside')}</span></button>
     <p class="pp-hint">${ctx.quarkView ? t('wheelOut') : t('wheelIn')}</p>
     <table class="pp-table">
       <thead><tr><th>${t('quark')}</th><th>${t('charge')}</th><th>${t('mass')}</th></tr></thead>
       <tbody>${['u', 'd']
         .filter((f) => p.quarks.includes(f))
         .map((f) => `<tr><td><b>${f}</b> (${QUARKS[f].name}) × ${p.quarks.filter((q) => q === f).length}</td><td>${QUARKS[f].charge} e</td><td>≈ ${fmtNumber(QUARKS[f].massMeV, 1, 1)} MeV/c²</td></tr>`)
         .join('')}</tbody>
     </table>
     <p>${t('totalCharge', { sum, total: p.charge > 0 ? '+1' : '0', valence: fmtNumber(valence, 0), share: fmtNumber(share, 0), proton: kind === 'proton' })}</p>
     <p data-help="term.colorCharge">${t('colorCharge', { colors: COLOR_CHARGES.map((c) => `<span class="cc cc--${c.key}">${c.name}</span>`).join(', ') })}</p>
     <p class="pp-note">${t('quarkNote')}</p>`,
    'pp-sec--quarks',
  );
}

function protonHtml(ctx) {
  const p = PARTICLES.proton;
  const { el, byZ } = ctx;
  const next = byZ.get(el.z + 1);
  const prev = byZ.get(el.z - 1);
  const neighbours = [
    next ? t('nextZ', { name: esc(next.name.toLowerCase()), symbol: esc(next.symbol) }) : t('next119'),
    prev ? t('prevZ', { name: esc(prev.name.toLowerCase()), symbol: esc(prev.symbol) }) : t('prev0'),
  ];
  return `${header('proton', t('protonEyebrow', { z: el.z }))}
    ${simple('proton')}
    <dl class="pp-list">
      ${chargeRow(p)}
      ${massRow(p, t('protonMassExtra', { ratio: fmtNumber(PROTON_ELECTRON_MASS_RATIO, 0) }))}
      ${row(t('spin'), `<b>½</b>`, t('fermionPauli'), 'term.spin')}
      ${row(t('composition'), `${quarkChips(p.quarks)} <b>uud</b>`, '+⅔ +⅔ −⅓ = +1', 'term.quark')}
      ${row(t('family'), t('baryon'))}
      ${row(t('radius'), `≈ ${fmtNumber(p.radiusFm, 2, 2)} fm`, t('radiusNote'))}
      ${row(t('stability'), t('stable'), t('protonStable'))}
    </dl>
    ${section(t('roleInAtom'), t('protonRole', { z: el.z, name: esc(el.name.toLowerCase()), neighbours: neighbours.join(', ') }))}
    ${nucleusBlock(ctx)}
    ${quarkBlock('proton', ctx)}`;
}

function decayText(ctx) {
  const { el, iso, byZ } = ctx;
  const name = `${isotopeNotation(iso, esc(el.symbol))}`;
  if (iso.stable) return t('stableNucleus', { name });
  const after = (dz) => byZ.get(el.z + dz);
  const low = (x) => (x ? esc(x.name.toLowerCase()) : '');
  const parts = iso.decay.map((d) => {
    switch (d.code) {
      case 'β-':
        return t('decayBminus', { from: esc(el.name.toLowerCase()), to: low(after(1)) });
      case '2β-':
        return t('decay2B');
      case 'β+':
      case 'CE':
        return t('decayBplus', { ce: d.code === 'CE', to: low(after(-1)) });
      case 'α':
        return t('decayAlpha', { to: low(after(-2)) });
      case 'FS':
        return t('decayFission');
      default:
        return esc(d.label);
    }
  });
  return t('decaySentence', { name, t: t('radioT', { t: esc(iso.halfLife?.text ?? '?') }), parts: parts.join(t('decayJoin')) });
}

function neutronHtml(ctx) {
  const p = PARTICLES.neutron;
  const { el, iso, isotopes } = ctx;
  const diff = PARTICLES.neutron.massMeV - PARTICLES.proton.massMeV;
  const tau = p.lifetimeS;
  const natural = isotopes.filter((i) => i.abundance !== null || i.trace);
  const natText =
    (natural.length
      ? t('naturalIsotopes', { list: natural.map((i) => `${isotopeNotation(i, esc(el.symbol))} <small>(${fmtAbundance(i)})</small>`).join(', ') })
      : t('noNatural', { name: esc(el.name) })) +
    (isotopes.some((i) => i.stable) ? '' : t('noneStable'));
  const ratio = iso.neutrons / el.z;
  return `${header('neutron', t('neutronEyebrow', { n: iso.neutrons }))}
    ${simple('neutron')}
    <dl class="pp-list">
      ${row(t('charge'), t('neutral'), '+⅔ −⅓ −⅓ = 0', 'term.charge')}
      ${massRow(p, t('neutronMassExtra', { diff: fmtNumber(diff, 3, 3) }))}
      ${row(t('spin'), `<b>½</b>`, t('fermion'), 'term.spin')}
      ${row(t('composition'), `${quarkChips(p.quarks)} <b>udd</b>`, '', 'term.quark')}
      ${row(t('family'), t('baryon'))}
      ${row(t('alone'), t('unstable'), t('neutronDecay', { tau: fmtNumber(tau, 0), min: Math.floor(tau / 60), sec: Math.round(tau % 60), half: fmtNumber((tau * Math.LN2) / 60, 1, 1) }), 'term.betaDecay')}
    </dl>
    ${section(t('stabilityHere'), decayText(ctx))}
    ${section(t('roleIsotopes'), t('isotopesText', { natText, n: iso.neutrons, ratio: fmtNumber(ratio, 2, 2), heavy: el.z > 20 }))}
    ${nucleusBlock(ctx)}
    ${quarkBlock('neutron', ctx)}`;
}

// ------------------------------------------------------------------ elettrone

function electronHtml(index, ctx) {
  const p = PARTICLES.electron;
  const { el, electrons, occupancy, mode } = ctx;
  const e = electrons[index];
  const sub = occupancy.find((s) => s.label === e.subshell);
  const orb = sub.orbitals.find((o) => o.key === e.orbitalKey);
  const orbName = orbitalHtml(e.n, e.l, e.ml);
  const spinArrow = e.ms > 0 ? '↑' : '↓';
  const msText = e.ms > 0 ? '+½' : '−½';
  const b = electronBinding(el, sub, occupancy);
  const outer = outermostSubshell(occupancy);

  const pairing = orb.electrons === 2 ? t('pauliPair', { other: e.ms > 0 ? '−½' : '+½' }) : t('hundSingle');

  const methods = {
    ie: t('methodIe', { predicted: b.predicted }),
    xray: t('methodXray'),
    slater: t('methodSlater', { heavy: el.z > 70 }),
  };
  // ≈ per le stime e per le medie dei livelli separati dallo spin-orbita
  const approx = b.method === 'slater' || Boolean(b.components);
  const value = b.method === 'slater' ? sig(b.ev, 2) : b.components ? sig(b.ev, 3) : b.ev;
  const components = b.components
    ? `<p class="pp-split">${b.components.map((c) => `${e.n}${L_LETTERS[e.l]}<sub>${c.j}</sub> ${fmtEnergy(c.ev)}`).join(' · ')}
        <small>${t('spinOrbit')}</small></p>`
    : '';

  const qn = [
    ['n', e.n, t('qnPrincipal'), t('qnPrincipalDesc', { shell: e.shell })],
    ['l', `${e.l} <small>(${L_LETTERS[e.l]})</small>`, t('qnSecondary'), t('qnSecondaryDesc', { l: L_LETTERS[e.l] })],
    ['m<sub>l</sub>', e.ml > 0 ? `+${e.ml}` : e.ml < 0 ? `−${-e.ml}` : '0', t('qnMagnetic'), t('qnMagneticDesc', { orb: orbName })],
    ['m<sub>s</sub>', `${msText} <small>${spinArrow}</small>`, t('qnSpin'), t('qnSpinDesc', { up: e.ms > 0 })],
  ];

  const quantumNote = mode === 'quantum' ? `<p class="pp-note">${t('quantumNote', { orb: orbName })}</p>` : '';
  const action = mode === 'quantum'
    ? `<button type="button" class="av-btn pp-cta" data-act="bohr-follow">${icons.atom(17)}<span>${t('followBohr')}</span></button>`
    : `<button type="button" class="av-btn pp-cta" data-act="show-orbital" data-help="term.orbital">${icons.atom(17)}<span>${t('showOrbital', { orb: orbName })}</span></button>`;

  return `${header('electron', t('electronEyebrow', { shell: e.shell }))}
    ${simple('electron')}
    <dl class="pp-list">
      ${chargeRow(p)}
      ${massRow(p, t('electronMassExtra', { ratio: fmtNumber(PROTON_ELECTRON_MASS_RATIO, 0) }))}
      ${row(t('spin'), `<b>½</b>`, t('spinHere', { ms: msText, arrow: spinArrow }), 'term.spin')}
      ${row(t('family'), t('lepton'))}
    </dl>
    ${section(
      t('quantumNumbers'),
      `<div class="pp-qn" data-help="term.quantumNumbers">${qn
        .map(([sym, val, name, desc]) => `<div class="qn"><span class="qn__sym">${sym}</span><b class="qn__val">${val}</b><span class="qn__name">${name}</span><small>${desc}</small></div>`)
        .join('')}</div>
       ${e.l > 0 ? `<p class="pp-note">${t('realOrbitals', { orb: orbName })}</p>` : ''}`,
    )}
    ${section(
      t('position'),
      `<p>${t('positionText', { shell: e.shell, n: e.n, sub: `${sub.label}${superscript(sub.electrons)}`, orb: orbName, pair: orb.electrons === 2 })}</p>
       <p>${pairing}</p>
       ${quantumNote}
       ${action}`,
    )}
    ${section(
      t('electronBinding'),
      `<p class="pp-big">${approx ? '≈ ' : ''}${fmtEnergy(value)}</p>
       <p class="pp-hint">${t('minEnergy', { method: methods[b.method] })}</p>
       ${components}
       <dl class="pp-list">${row(t('zeff'), `≈ ${fmtNumber(b.zeff, 2, 2)}`, el.z === 1 ? t('zeffH') : t('zeffSlater', { z: el.z, screen: fmtNumber(el.z - b.zeff, 1, 1) }), 'term.zeff')}</dl>
       ${sub.label !== outer.label && el.ionizationEnergyEv
         ? `<p class="pp-hint">${t('outerCompare', { sub: outer.label, e: fmtEnergy(el.ionizationEnergyEv) })}</p>`
         : ''}`,
    )}
    ${section(t('elementary'), t('elementaryText'))}`;
}

/**
 * @param {{kind:'proton'|'neutron'|'electron', index:number}} sel
 * @param {object} ctx { el, iso, isotopes, electrons, occupancy, mode, byZ, quarkView }
 */
export function particleHtml(sel, ctx) {
  if (sel.kind === 'proton') return protonHtml(ctx);
  if (sel.kind === 'neutron') return neutronHtml(ctx);
  return electronHtml(sel.index, ctx);
}

/** Testo del tooltip di un quark. */
export function quarkTooltip(info) {
  return t('quarkTip', { key: info.color.key, name: info.name, flavor: info.flavor, charge: info.charge, color: info.color.name, mass: fmtNumber(info.massMeV, 1, 1) });
}
