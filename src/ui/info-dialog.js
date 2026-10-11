// Finestra "Fonti e guida": provenienza dei dati e convenzioni usate.
import { icons } from './icons.js';

// fonti usate dall'analisi delle particelle (visualizzatore 3D)
const PARTICLE_SOURCES = [
  'CODATA 2022 (NIST) — masse, cariche e momenti magnetici di protone, neutrone ed elettrone',
  'Particle Data Group 2024 — masse dei quark, vita media del neutrone libero',
  'X-ray Data Booklet (LBNL), tab. 1-1 — energie di legame degli elettroni interni (Z = 1–92)',
  'AME2020 (Atomic Mass Evaluation) — energie di legame dei nuclei leggeri',
  'NIST CCCBDB e CRC Handbook — geometrie e momenti dipolari sperimentali delle molecole del laboratorio',
  'Shannon (1976) — raggi ionici; energie di legame medie dai testi di chimica generale (Housecroft & Sharpe, CRC)',
  'NIST Chemistry WebBook e CRC Handbook — entalpie di formazione standard ΔHf° (25 °C) per le reazioni del laboratorio',
];

export function createInfoDialog(meta) {
  const dlg = document.createElement('dialog');
  dlg.className = 'info-dialog';
  dlg.setAttribute('aria-labelledby', 'info-title');
  dlg.innerHTML = `
    <form method="dialog" class="info-dialog__inner">
      <header>
        <h2 id="info-title">Fonti dei dati e convenzioni</h2>
        <button class="btn-icon" value="close" title="Chiudi">${icons.close(18)}</button>
      </header>
      <h3>Fonti</h3>
      <ul>${[...meta.sources, ...PARTICLE_SOURCES].map((s) => `<li>${s}</li>`).join('')}</ul>
      <h3>Convenzioni</h3>
      <ul>
        <li><b>Massa atomica</b>: peso atomico standard IUPAC in unità di massa atomica (u). Tra parentesi quadre,
            per gli elementi senza isotopi stabili, il numero di massa dell'isotopo più longevo.</li>
        <li><b>Neutroni</b>: riferiti all'isotopo più abbondante in natura o, per gli elementi radioattivi, all'isotopo più stabile.</li>
        <li><b>Configurazioni elettroniche</b>: stato fondamentale dell'atomo neutro (NIST), ordinate per guscio.
            Seguono la regola di Madelung con le eccezioni sperimentali (Cr, Cu, Pd, Pt, Au, La, Gd, Th, U…).</li>
        <li><b>Raggio atomico</b>: raggio di van der Waals (PubChem); il raggio covalente è quello di Cordero et al.</li>
        <li><b>Densità dei gas</b>: espressa in g/L a 0 °C e 1 atm.</li>
        <li><b>Categorie</b>: astato incluso tra gli alogeni, polonio tra i metalli post-transizione;
            dal meitnerio (109) in poi le proprietà chimiche non sono note.</li>
        <li><b>Blocco f</b>: lantanio–itterbio e attinio–nobelio; lutezio e laurenzio sono considerati elementi del blocco d.</li>
        <li><b>~ / stima / previsto</b>: valori non misurati direttamente (elementi mai osservati in quantità visibili o superpesanti).
            Nella tavola, le caselle con <b>bordo tratteggiato</b> indicano elementi con proprietà in gran parte previste (Z ≥ 104).</li>
      </ul>
      <h3>Scorciatoie</h3>
      <p class="keys"><kbd>/</kbd> o <kbd>Ctrl</kbd>+<kbd>F</kbd> cerca ·
        <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> muovi nella tavola · <kbd>Invio</kbd> apri la scheda ·
        <kbd>Esc</kbd> chiudi · <kbd>F11</kbd> schermo intero</p>
      <p class="keys">Nel visualizzatore 3D: <kbd>B</kbd> modello di Bohr · <kbd>Q</kbd> modello quantistico ·
        <kbd>E</kbd> esplodi il nucleo · <kbd>L</kbd> etichette · <kbd>Spazio</kbd> pausa · <kbd>F</kbd> fps ·
        <b>clic</b> su una particella per analizzarla · <kbd>Esc</kbd> chiude l'analisi</p>
      <h3>Modelli 3D</h3>
      <ul>
        <li><b>Nucleo</b>: protoni e neutroni impacchettati come sfere rigide mescolate; il raggio cresce come A<sup>⅓</sup>, come nei nuclei reali.</li>
        <li><b>Modello di Bohr</b>: un anello per guscio con il numero corretto di elettroni; i gusci interni ruotano più velocemente.</li>
        <li><b>Modello quantistico</b>: punti campionati dalla densità di probabilità |ψ|² delle funzioni d'onda dell'atomo di idrogeno
            (forme esatte di s, p, d, f); il colore distingue il segno di ψ. Le dimensioni sono compresse per mostrare insieme tutti i gusci.</li>
        <li><b>Analisi delle particelle</b>: clic su un protone, un neutrone o un elettrone (modello di Bohr) per vederne le proprietà;
            avvicinandosi a un protone o a un neutrone compaiono i tre quark e i gluoni (rappresentazione schematica).
            Le energie di legame degli elettroni sono misurate (prima ionizzazione, NIST; livelli interni, X-ray Data Booklet)
            oppure, dove mancano i dati, stimate con le regole di Slater e indicate con ≈.</li>
        <li><b>Laboratorio molecolare</b>: legami secondo le regole di valenza, strutture di Lewis (ottetto, cariche formali, radicali)
            e forme VSEPR. Legame ionico se la differenza di elettronegatività supera 1,7 tra un metallo e un non metallo (convenzione).
            «Combina» sceglie la struttura con la maggiore energia di legame totale; le molecole della libreria usano lunghezze, angoli e
            momenti dipolari sperimentali, le altre valori stimati (≈). Metalli d/f: «struttura non verificata»; Z ≥ 104: «chimica sconosciuta».</li>
        <li><b>Reazioni</b>: ΔH° = Σ ΔHf°(prodotti) − Σ ΔHf°(reagenti), per le quantità dell'equazione, a 25 °C e nello stato fisico
            indicato; la stima con le energie di legame (rotti − formati) usa valori medi in fase gassosa. Il diagramma energetico è schematico.</li>
        <li><b>Scala</b>: nessun modello è in scala. Il nucleo reale è da decine a centinaia di migliaia di volte più piccolo dell'atomo.</li>
      </ul>
    </form>`;
  document.body.append(dlg);
  dlg.addEventListener('click', (ev) => {
    if (ev.target === dlg) dlg.close();
  });
  return { open: () => dlg.showModal() };
}
