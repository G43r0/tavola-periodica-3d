// Finestra "Fonti e guida": provenienza dei dati e convenzioni usate.
import { icons } from './icons.js';
import { createT } from '../i18n/index.js';

const t = createT({
  it: {
    sources: [
      'IUPAC/CIAAW — pesi atomici standard (valori abbreviati); numero di massa dell\'isotopo più stabile tra parentesi quadre',
      'PubChem (NCBI) — Periodic Table of Elements: punti di fusione/ebollizione, densità, elettronegatività, raggi di van der Waals',
      'NIST Atomic Spectra Database — energie di prima ionizzazione e configurazioni elettroniche',
      'IUPAC / NUBASE2020 — composizione isotopica naturale ed emivite',
      'Cordero et al., Dalton Trans. 2008 — raggi covalenti',
      'CODATA 2022 (NIST) — masse, cariche e momenti magnetici di protone, neutrone ed elettrone',
      'Particle Data Group 2024 — masse dei quark, vita media del neutrone libero',
      'X-ray Data Booklet (LBNL), tab. 1-1 — energie di legame degli elettroni interni (Z = 1–92)',
      'AME2020 (Atomic Mass Evaluation) — energie di legame dei nuclei leggeri',
      'NIST CCCBDB e CRC Handbook — geometrie e momenti dipolari sperimentali delle molecole del laboratorio',
      'Shannon (1976) — raggi ionici; energie di legame medie dai testi di chimica generale (Housecroft & Sharpe, CRC)',
      'NIST Chemistry WebBook e CRC Handbook — entalpie di formazione standard ΔHf° (25 °C) per le reazioni del laboratorio',
    ],
    title: 'Fonti dei dati e convenzioni',
    close: 'Chiudi',
    hSources: 'Fonti',
    hConventions: 'Convenzioni',
    conventions: [
      '<b>Massa atomica</b>: peso atomico standard IUPAC in unità di massa atomica (u). Tra parentesi quadre, per gli elementi senza isotopi stabili, il numero di massa dell\'isotopo più longevo.',
      '<b>Neutroni</b>: riferiti all\'isotopo più abbondante in natura o, per gli elementi radioattivi, all\'isotopo più stabile.',
      '<b>Configurazioni elettroniche</b>: stato fondamentale dell\'atomo neutro (NIST), ordinate per guscio. Seguono la regola di Madelung con le eccezioni sperimentali (Cr, Cu, Pd, Pt, Au, La, Gd, Th, U…).',
      '<b>Raggio atomico</b>: raggio di van der Waals (PubChem); il raggio covalente è quello di Cordero et al.',
      '<b>Densità dei gas</b>: espressa in g/L a 0 °C e 1 atm.',
      '<b>Categorie</b>: astato incluso tra gli alogeni, polonio tra i metalli post-transizione; dal meitnerio (109) in poi le proprietà chimiche non sono note.',
      '<b>Blocco f</b>: lantanio–itterbio e attinio–nobelio; lutezio e laurenzio sono considerati elementi del blocco d.',
      '<b>~ / stima / previsto</b>: valori non misurati direttamente (elementi mai osservati in quantità visibili o superpesanti). Nella tavola, le caselle con <b>bordo tratteggiato</b> indicano elementi con proprietà in gran parte previste (Z ≥ 104).',
    ],
    hLanguages: 'Lingue e modalità Spiega',
    languages: 'L\'interfaccia è disponibile in <b>italiano</b>, in <b>inglese</b> e in <b>«Spiegamelo come se avessi 6 anni»</b>, un italiano con parole semplici. Si sceglie con il globo nella barra in alto. La <b>modalità Spiega</b> (<kbd>F1</kbd> o il pulsante «Spiega») apre una scheda con la spiegazione di una parola, di un pulsante o di un comando: evidenzia il testo oppure fai clic destro su qualunque cosa. <kbd>Esc</kbd> chiude la scheda, <kbd>F1</kbd> esce dalla modalità.',
    hShortcuts: 'Scorciatoie',
    keysMain: '<kbd>/</kbd> o <kbd>Ctrl</kbd>+<kbd>F</kbd> cerca · <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> muovi nella tavola · <kbd>Invio</kbd> apri la scheda · <kbd>Esc</kbd> chiudi · <kbd>F1</kbd> modalità Spiega · <kbd>F11</kbd> schermo intero',
    keys3d: 'Nel visualizzatore 3D: <kbd>B</kbd> modello di Bohr · <kbd>Q</kbd> modello quantistico · <kbd>E</kbd> esplodi il nucleo · <kbd>L</kbd> etichette · <kbd>Spazio</kbd> pausa · <kbd>F</kbd> fps · <b>clic</b> su una particella per analizzarla · <kbd>Esc</kbd> chiude l\'analisi',
    keysLab: 'Nel laboratorio: <kbd>V</kbd> sposta · <kbd>B</kbd> lega · <kbd>X</kbd> forbici · <kbd>C</kbd> combina · <kbd>S</kbd> separa · <kbd>R</kbd> simula la reazione · <kbd>F</kbd> o <kbd>Ctrl</kbd>+<kbd>V</kbd> formula · <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> annulla / ripeti · <kbd>Canc</kbd> elimina',
    keysSandbox: 'Nella sandbox: <kbd>Spazio</kbd> pausa · <kbd>F</kbd> un passo · <kbd>H</kbd> vista termica · <kbd>G</kbd> bagliore · <kbd>E</kbd> gomma · <kbd>M</kbd> mescola · <kbd>W</kbd> vento · <kbd>[</kbd> <kbd>]</kbd> pennello · <kbd>Ctrl</kbd>+<kbd>Z</kbd> annulla · clic destro cancella · clic centrale preleva',
    hModels: 'Modelli 3D',
    models: [
      '<b>Nucleo</b>: protoni e neutroni impacchettati come sfere rigide mescolate; il raggio cresce come A<sup>⅓</sup>, come nei nuclei reali.',
      '<b>Modello di Bohr</b>: un anello per guscio con il numero corretto di elettroni; i gusci interni ruotano più velocemente.',
      '<b>Modello quantistico</b>: punti campionati dalla densità di probabilità |ψ|² delle funzioni d\'onda dell\'atomo di idrogeno (forme esatte di s, p, d, f); il colore distingue il segno di ψ. Le dimensioni sono compresse per mostrare insieme tutti i gusci.',
      '<b>Analisi delle particelle</b>: clic su un protone, un neutrone o un elettrone (modello di Bohr) per vederne le proprietà; avvicinandosi a un protone o a un neutrone compaiono i tre quark e i gluoni (rappresentazione schematica). Le energie di legame degli elettroni sono misurate (prima ionizzazione, NIST; livelli interni, X-ray Data Booklet) oppure, dove mancano i dati, stimate con le regole di Slater e indicate con ≈.',
      '<b>Laboratorio molecolare</b>: legami secondo le regole di valenza, strutture di Lewis (ottetto, cariche formali, radicali) e forme VSEPR. Legame ionico se la differenza di elettronegatività supera 1,7 tra un metallo e un non metallo (convenzione). «Combina» sceglie la struttura con la maggiore energia di legame totale; le molecole della libreria usano lunghezze, angoli e momenti dipolari sperimentali, le altre valori stimati (≈). Metalli d/f: «struttura non verificata»; Z ≥ 104: «chimica sconosciuta».',
      '<b>Reazioni</b>: ΔH° = Σ ΔHf°(prodotti) − Σ ΔHf°(reagenti), per le quantità dell\'equazione, a 25 °C e nello stato fisico indicato; la stima con le energie di legame (rotti − formati) usa valori medi in fase gassosa. Il diagramma energetico è schematico.',
      '<b>Sandbox degli elementi</b>: ogni cella è un granello di sostanza con la sua temperatura. Fusione, ebollizione e densità sono quelle reali (elements.json); la radioattività usa l\'isotopo principale con il tempo accelerato in scala logaritmica. Reazioni, conducibilità e velocità sono semplificate per il gioco.',
      '<b>Scala</b>: nessun modello è in scala. Il nucleo reale è da decine a centinaia di migliaia di volte più piccolo dell\'atomo.',
    ],
  },
  en: {
    sources: [
      'IUPAC/CIAAW — standard atomic weights (abridged values); mass number of the most stable isotope in square brackets',
      'PubChem (NCBI) — Periodic Table of Elements: melting/boiling points, density, electronegativity, van der Waals radii',
      'NIST Atomic Spectra Database — first ionisation energies and electron configurations',
      'IUPAC / NUBASE2020 — natural isotopic composition and half-lives',
      'Cordero et al., Dalton Trans. 2008 — covalent radii',
      'CODATA 2022 (NIST) — masses, charges and magnetic moments of the proton, neutron and electron',
      'Particle Data Group 2024 — quark masses, lifetime of the free neutron',
      'X-ray Data Booklet (LBNL), table 1-1 — binding energies of inner electrons (Z = 1–92)',
      'AME2020 (Atomic Mass Evaluation) — binding energies of light nuclei',
      'NIST CCCBDB and CRC Handbook — experimental geometries and dipole moments of the laboratory molecules',
      'Shannon (1976) — ionic radii; average bond energies from general chemistry textbooks (Housecroft & Sharpe, CRC)',
      'NIST Chemistry WebBook and CRC Handbook — standard enthalpies of formation ΔHf° (25 °C) for the laboratory reactions',
    ],
    title: 'Data sources and conventions',
    close: 'Close',
    hSources: 'Sources',
    hConventions: 'Conventions',
    conventions: [
      '<b>Atomic mass</b>: IUPAC standard atomic weight in atomic mass units (u). In square brackets, for elements without stable isotopes, the mass number of the longest-lived isotope.',
      '<b>Neutrons</b>: those of the most abundant natural isotope or, for radioactive elements, of the most stable isotope.',
      '<b>Electron configurations</b>: ground state of the neutral atom (NIST), ordered by shell. They follow the Madelung rule with the experimental exceptions (Cr, Cu, Pd, Pt, Au, La, Gd, Th, U…).',
      '<b>Atomic radius</b>: van der Waals radius (PubChem); the covalent radius is that of Cordero et al.',
      '<b>Density of gases</b>: given in g/L at 0 °C and 1 atm.',
      '<b>Categories</b>: astatine is counted among the halogens, polonium among the post-transition metals; from meitnerium (109) onwards the chemical properties are unknown.',
      '<b>f-block</b>: lanthanum–ytterbium and actinium–nobelium; lutetium and lawrencium are considered d-block elements.',
      '<b>~ / estimate / predicted</b>: values not measured directly (elements never seen in visible amounts, or superheavy). In the table, cells with a <b>dashed border</b> are elements whose properties are largely predicted (Z ≥ 104).',
    ],
    hLanguages: 'Languages and Explain mode',
    languages: 'The interface is available in <b>Italian</b>, <b>English</b> and <b>«Spiegamelo come se avessi 6 anni»</b> («explain it like I\'m 6»), an Italian with simple words. Choose it with the globe in the top bar. <b>Explain mode</b> (<kbd>F1</kbd> or the «Explain» button) opens a card explaining a word, a button or a command: highlight the text or right-click anything. <kbd>Esc</kbd> closes the card, <kbd>F1</kbd> leaves the mode.',
    hShortcuts: 'Shortcuts',
    keysMain: '<kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>F</kbd> search · <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> move around the table · <kbd>Enter</kbd> open the card · <kbd>Esc</kbd> close · <kbd>F1</kbd> Explain mode · <kbd>F11</kbd> full screen',
    keys3d: 'In the 3D viewer: <kbd>B</kbd> Bohr model · <kbd>Q</kbd> quantum model · <kbd>E</kbd> explode the nucleus · <kbd>L</kbd> labels · <kbd>Space</kbd> pause · <kbd>F</kbd> fps · <b>click</b> a particle to analyse it · <kbd>Esc</kbd> closes the analysis',
    keysLab: 'In the laboratory: <kbd>V</kbd> move · <kbd>B</kbd> bond · <kbd>X</kbd> scissors · <kbd>C</kbd> combine · <kbd>S</kbd> split · <kbd>R</kbd> simulate the reaction · <kbd>F</kbd> or <kbd>Ctrl</kbd>+<kbd>V</kbd> formula · <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> undo / redo · <kbd>Del</kbd> delete',
    keysSandbox: 'In the sandbox: <kbd>Space</kbd> pause · <kbd>F</kbd> one step · <kbd>H</kbd> heat view · <kbd>G</kbd> glow · <kbd>E</kbd> eraser · <kbd>M</kbd> mix · <kbd>W</kbd> wind · <kbd>[</kbd> <kbd>]</kbd> brush · <kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · right-click erases · middle-click picks',
    hModels: '3D models',
    models: [
      '<b>Nucleus</b>: protons and neutrons packed as mixed hard spheres; the radius grows as A<sup>⅓</sup>, as in real nuclei.',
      '<b>Bohr model</b>: one ring per shell with the correct number of electrons; inner shells spin faster.',
      '<b>Quantum model</b>: points sampled from the probability density |ψ|² of the hydrogen atom wave functions (exact shapes of s, p, d, f); the colour shows the sign of ψ. Sizes are compressed to show all the shells together.',
      '<b>Particle analysis</b>: click a proton, a neutron or an electron (Bohr model) to see its properties; zooming in on a proton or neutron reveals the three quarks and the gluons (schematic picture). Electron binding energies are measured (first ionisation, NIST; inner levels, X-ray Data Booklet) or, where data are missing, estimated with Slater\'s rules and marked with ≈.',
      '<b>Molecular laboratory</b>: bonds follow valence rules, Lewis structures (octet, formal charges, radicals) and VSEPR shapes. A bond is ionic if the electronegativity difference between a metal and a nonmetal exceeds 1.7 (a convention). «Combine» picks the structure with the largest total bond energy; library molecules use experimental lengths, angles and dipole moments, the others estimated values (≈). d/f metals: «structure not verified»; Z ≥ 104: «unknown chemistry».',
      '<b>Reactions</b>: ΔH° = Σ ΔHf°(products) − Σ ΔHf°(reactants), for the amounts in the equation, at 25 °C and in the stated physical state; the bond-energy estimate (broken − formed) uses average gas-phase values. The energy diagram is schematic.',
      '<b>Element sandbox</b>: each cell is a grain of substance with its own temperature. Melting, boiling and density are the real values (elements.json); radioactivity follows the main isotope with time sped up on a logarithmic scale. Reactions, conductivity and speeds are simplified for the game.',
      '<b>Scale</b>: no model is to scale. A real nucleus is tens to hundreds of thousands of times smaller than the atom.',
    ],
  },
  eli6: {
    title: 'Da dove vengono i dati, e come si usa',
    hSources: 'Dove abbiamo preso i numeri',
    hConventions: 'Regole che usiamo',
    hLanguages: 'Le lingue e la modalità Spiega',
    languages: 'Puoi usare l\'app in <b>italiano</b>, in <b>inglese</b> o in questa lingua, dove tutto è spiegato con parole semplici. Si cambia con il globo in alto. Con la <b>modalità Spiega</b> (<kbd>F1</kbd> o il pulsante «Spiega») ti spiego qualunque cosa: evidenzia una parola o premi il tasto destro sopra un pulsante. <kbd>Esc</kbd> chiude la scheda.',
    hShortcuts: 'Tasti rapidi',
    hModels: 'Come sono fatti i disegni 3D',
    models: [
      '<b>Il nucleo</b>: è il centro dell\'atomo, fatto di protoni (rossi) e neutroni (grigi) stretti stretti.',
      '<b>Il modello di Bohr</b>: disegna gli elettroni su cerchi intorno al nucleo, come pianeti intorno al Sole. È un\'idea semplice, utile per contarli.',
      '<b>Il modello quantistico</b>: in realtà gli elettroni non girano su cerchi: sono come nuvole intorno al nucleo. Dove la nuvola è più fitta è più probabile trovarli.',
      '<b>Le particelle</b>: fai clic su un protone, un neutrone o un elettrone per sapere tutto di lui. Avvicinati a un protone: dentro ci sono tre pezzetti ancora più piccoli, i quark.',
      '<b>Il laboratorio</b>: gli atomi si attaccano tra loro seguendo regole vere della chimica, e formano molecole come l\'acqua.',
      '<b>Le reazioni</b>: quando le molecole si scontrano possono scambiarsi atomi e diventare sostanze nuove, liberando o assorbendo energia (calore).',
      '<b>La sabbiera</b>: ogni quadratino è un granello di una sostanza, con la sua temperatura. Il ghiaccio si scioglie, il ferro brucia, l\'acqua bolle: come nella realtà, ma più semplice e più veloce.',
      '<b>Attenzione</b>: nessun disegno ha le misure vere. Se un atomo fosse grande come uno stadio, il nucleo sarebbe una formica in mezzo al campo!',
    ],
  },
});

export function createInfoDialog() {
  const dlg = document.createElement('dialog');
  dlg.className = 'info-dialog';
  dlg.setAttribute('aria-labelledby', 'info-title');
  const list = (items) => `<ul>${items.map((s) => `<li>${s}</li>`).join('')}</ul>`;
  dlg.innerHTML = `
    <form method="dialog" class="info-dialog__inner">
      <header>
        <h2 id="info-title">${t('title')}</h2>
        <button class="btn-icon" value="close" title="${t('close')}">${icons.close(18)}</button>
      </header>
      <h3>${t('hLanguages')}</h3>
      <p class="keys">${t('languages')}</p>
      <h3>${t('hSources')}</h3>
      ${list(t('sources'))}
      <h3>${t('hConventions')}</h3>
      ${list(t('conventions'))}
      <h3>${t('hShortcuts')}</h3>
      <p class="keys">${t('keysMain')}</p>
      <p class="keys">${t('keys3d')}</p>
      <p class="keys">${t('keysLab')}</p>
      <p class="keys">${t('keysSandbox')}</p>
      <h3>${t('hModels')}</h3>
      ${list(t('models'))}
    </form>`;
  document.body.append(dlg);
  dlg.addEventListener('click', (ev) => {
    if (ev.target === dlg) dlg.close();
  });
  return { open: () => dlg.showModal() };
}
