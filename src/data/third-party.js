// Componenti di terzi che entrano nell'app, con la licenza e a che cosa servono: software, caratteri, suoni e fonti dei
// dati. Li mostra la sezione «Licenze» della finestra «Fonti e guida» (src/ui/info-dialog.js); gli stessi nomi e le
// stesse licenze stanno in THIRD_PARTY_NOTICES.md. tests/docs/licenses.test.mjs li confronta con node_modules, con
// l'elenco dei suoni e con il file degli avvisi. Gli strumenti di sviluppo (Vite, electron-builder…) non entrano
// nell'app e non sono qui.
//
// `license` è l'identificatore SPDX del pacchetto (quello di node_modules/<nome>/package.json). Per le fonti dei dati è
// «Published data»: valori numerici pubblicati, citati con la fonte; il diritto d'autore sulle opere originali resta ai
// rispettivi titolari.
// `use` è il testo mostrato nell'app, nella lingua scelta (eli6 ripiega sull'italiano).

const DATA = 'Published data';

export const THIRD_PARTY = [
  {
    name: 'three',
    license: 'MIT',
    url: 'https://threejs.org/',
    use: {
      it: 'Grafica 3D del visualizzatore, del laboratorio e del simulatore',
      en: 'The 3D graphics of the viewer, the laboratory and the simulator',
    },
  },
  {
    name: '@dimforge/rapier3d-compat',
    license: 'Apache-2.0',
    url: 'https://rapier.rs/',
    use: {
      it: 'Fisica del simulatore di laboratorio: collisioni, oggetti che cadono e si urtano',
      en: 'Physics of the laboratory simulator: collisions, objects that fall and bump into each other',
    },
  },
  {
    name: '@fontsource/ibm-plex-sans',
    license: 'OFL-1.1',
    url: 'https://github.com/IBM/plex',
    use: {
      it: 'Carattere dell\'interfaccia (IBM Plex Sans), incluso nell\'app',
      en: 'Interface typeface (IBM Plex Sans), bundled with the app',
    },
  },
  {
    name: '@fontsource/ibm-plex-mono',
    license: 'OFL-1.1',
    url: 'https://github.com/IBM/plex',
    use: {
      it: 'Carattere dei numeri e delle formule (IBM Plex Mono), incluso nell\'app',
      en: 'Typeface of numbers and formulas (IBM Plex Mono), bundled with the app',
    },
  },
  {
    name: 'electron',
    license: 'MIT',
    url: 'https://www.electronjs.org/',
    use: {
      it: 'Finestra e motore dell\'app desktop (include Chromium, con le sue licenze)',
      en: 'Window and engine of the desktop app (includes Chromium, with its own licenses)',
    },
  },
  {
    name: 'electron-updater',
    license: 'MIT',
    url: 'https://www.electron.build/auto-update',
    use: {
      it: 'Aggiornamenti automatici dell\'app desktop',
      en: 'Automatic updates of the desktop app',
    },
  },
  {
    name: 'Freesound',
    license: 'CC0-1.0',
    url: 'https://freesound.org/',
    use: {
      it: '21 suoni del simulatore, tutti con licenza Creative Commons 0 (pubblico dominio)',
      en: '21 simulator sounds, all under the Creative Commons 0 license (public domain)',
    },
  },
  {
    name: 'IUPAC/CIAAW',
    license: DATA,
    url: 'https://ciaaw.org/',
    use: {
      it: 'Pesi atomici standard (valori abbreviati) e composizione isotopica naturale',
      en: 'Standard atomic weights (abridged values) and natural isotopic composition',
    },
  },
  {
    name: 'PubChem (NCBI)',
    license: DATA,
    url: 'https://pubchem.ncbi.nlm.nih.gov/periodic-table/',
    use: {
      it: 'Tavola periodica di PubChem: punti di fusione/ebollizione, densità, elettronegatività, raggi di van der Waals',
      en: 'PubChem Periodic Table: melting/boiling points, density, electronegativity, van der Waals radii',
    },
  },
  {
    name: 'NIST Atomic Spectra Database',
    license: DATA,
    url: 'https://www.nist.gov/pml/atomic-spectra-database',
    use: {
      it: 'Energie di prima ionizzazione e configurazioni elettroniche',
      en: 'First ionisation energies and electron configurations',
    },
  },
  {
    name: 'NUBASE2020',
    license: DATA,
    url: 'https://amdc.in2p3.fr/web/nubase_en.html',
    use: {
      it: 'Emivite dei nuclidi',
      en: 'Half-lives of the nuclides',
    },
  },
  {
    name: 'AME2020',
    license: DATA,
    url: 'https://amdc.in2p3.fr/web/masseval.html',
    use: {
      it: 'Atomic Mass Evaluation: energie di legame dei nuclei misurati',
      en: 'Atomic Mass Evaluation: binding energies of the measured nuclei',
    },
  },
  {
    name: 'Cordero et al. (2008)',
    license: DATA,
    url: 'https://doi.org/10.1039/B801115J',
    use: {
      it: 'Raggi covalenti (Dalton Trans. 2008)',
      en: 'Covalent radii (Dalton Trans. 2008)',
    },
  },
  {
    name: 'CODATA 2022 (NIST)',
    license: DATA,
    url: 'https://physics.nist.gov/cuu/Constants/',
    use: {
      it: 'Masse, cariche e momenti magnetici di protone, neutrone ed elettrone',
      en: 'Masses, charges and magnetic moments of the proton, neutron and electron',
    },
  },
  {
    name: 'Particle Data Group 2024',
    license: DATA,
    url: 'https://pdg.lbl.gov/',
    use: {
      it: 'Masse dei quark e vita media del neutrone libero',
      en: 'Quark masses and lifetime of the free neutron',
    },
  },
  {
    name: 'X-ray Data Booklet (LBNL)',
    license: DATA,
    url: 'https://xdb.lbl.gov/',
    use: {
      it: 'Energie di legame degli elettroni interni, tabella 1-1 (Z = 1–92)',
      en: 'Binding energies of inner electrons, table 1-1 (Z = 1–92)',
    },
  },
  {
    name: 'NIST CCCBDB',
    license: DATA,
    url: 'https://cccbdb.nist.gov/',
    use: {
      it: 'Geometrie e momenti dipolari sperimentali delle molecole del laboratorio',
      en: 'Experimental geometries and dipole moments of the laboratory molecules',
    },
  },
  {
    name: 'NIST Chemistry WebBook',
    license: DATA,
    url: 'https://webbook.nist.gov/chemistry/',
    use: {
      it: 'Entalpie di formazione standard ΔHf° (25 °C) per le reazioni del laboratorio',
      en: 'Standard enthalpies of formation ΔHf° (25 °C) for the laboratory reactions',
    },
  },
  {
    name: 'CRC Handbook of Chemistry and Physics',
    license: DATA,
    url: 'https://hbcp.chemnetbase.com/',
    use: {
      it: 'Geometrie, momenti dipolari ed entalpie di formazione; energie di legame medie (con Housecroft & Sharpe, Inorganic Chemistry)',
      en: 'Geometries, dipole moments and enthalpies of formation; average bond energies (with Housecroft & Sharpe, Inorganic Chemistry)',
    },
  },
  {
    name: 'Shannon (1976)',
    license: DATA,
    url: 'https://doi.org/10.1107/S0567739476001551',
    use: {
      it: 'Raggi ionici (Acta Cryst. A32)',
      en: 'Ionic radii (Acta Cryst. A32)',
    },
  },
];
