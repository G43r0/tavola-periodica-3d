// Scheda della molecola selezionata (o riepilogo del banco).
import { esc, fmtNumber } from '../chem/format.js';
import { TIER } from './chem/elements-lab.js';
import { bondCharacter, ORDER_NAME, art } from './chem/bonding.js';
import { bondEnergy } from './chem/bond-energy.js';
import { angleAt } from './chem/geometry.js';
import { subscript, chargeText } from './chem/identify.js';
import { lewisSvg } from './lewis-svg.js';
import { icons } from '../ui/icons.js';
import { createT } from '../i18n/index.js';

const t = createT({
  it: {
    state: { gas: 'gassoso', liquido: 'liquido', solido: 'solido', soluzione: 'esiste solo in soluzione acquosa' },
    ionicCompound: 'Composto ionico',
    ion: 'Ione',
    molecule: 'Molecola',
    ionOf: 'Ione {name}',
    atomOf: 'Atomo di {name}',
    monoIon: 'Ione monoatomico',
    isolatedAtom: 'Atomo isolato',
    polyIon: 'Ione poliatomico',
    notInLibrary: 'Molecola non in libreria',
    radical: (p) => `<b>Radicale</b>: elettron${p.n === 1 ? 'e spaiato' : 'i spaiati'} su ${p.list}. I radicali sono molto reattivi.`,
    incomplete: '<b>Ottetto incompleto</b> su {list}.',
    electronsN: '{sym} ({n} elettroni)',
    incompleteException: ' Il boro, il berillio e l\'alluminio sono eccezioni note.',
    incompleteHint: ' Prova a trasformare un legame in doppio o triplo (clic sul legame).',
    expanded: '<b>Ottetto espanso</b> su {list}: possibile solo dal 3° periodo in poi.',
    allOctets: 'Tutti gli atomi hanno l\'ottetto completo (l\'idrogeno il duetto) e non ci sono elettroni spaiati.',
    formalCharges: 'Le cariche formali (+, −) indicano come sono ripartiti gli elettroni nella struttura di Lewis; la loro somma è la carica totale.',
    unknownChem: '<b>Chimica sconosciuta</b>: contiene un elemento superpesante; i suoi composti non sono mai stati osservati.',
    unverified: '<b>Struttura non verificata</b>: per i metalli d e f le regole dell\'ottetto e della VSEPR non bastano a prevedere la struttura.',
    byFormula: 'Riconosciuto dalla formula come <b>{name}</b>. ',
    byFormulaIonic: 'Nel composto reale il legame è ionico: usa Combina (o un esempio) per vedere gli ioni.',
    byFormulaOther: 'Nella struttura di riferimento gli atomi sono collegati in modo diverso.',
    differentOrders: 'Riconosciuta come <b>{name}</b>, ma nella struttura di riferimento gli ordini di legame sono diversi: cambia i legami (clic) finché la scheda la riconosce.',
    isomer: 'Stessa formula di {list}, ma con gli atomi collegati in modo diverso (isomero).',
    ideal: 'ideale {v}',
    notVerified: 'non verificata',
    geoExp: 'In grassetto i valori sperimentali; gli altri sono calcolati con il modello VSEPR.',
    geoEst: 'Angoli calcolati con il modello VSEPR (stima): le coppie solitarie respingono più dei legami.',
    geometry: 'Geometria (VSEPR)',
    ionic: 'ionico',
    transferred: (p) => `${p.n} e⁻ trasferit${p.n === 1 ? 'o' : 'i'}`,
    bonds: 'Legami',
    bond: 'Legame',
    type: 'Tipo',
    length: 'Lunghezza',
    bondsNote: 'Lunghezze in grassetto: sperimentali; ≈ stimate dai raggi covalenti (ionici per gli ioni). Energie di legame medie; ≈ stima di Pauling. ΔEN = differenza di elettronegatività (Pauling).',
    nonpolarMu: 'apolare (μ = 0)',
    polarMu: 'polare, μ = {d} D',
    dipoleNote: 'momento dipolare sperimentale (debye)',
    polar: 'polare',
    nonpolar: 'apolare',
    polarityNote: 'stima dalla simmetria e dai dipoli dei legami',
    dfMetal: '{name} è un metallo del blocco {block}: stati di ossidazione comuni {ox}.',
    nobleGas: 'Gas nobile: il guscio esterno è completo ({n} elettroni), quindi non forma legami.',
    valence: (p) => `<b>${p.lone}</b> elettroni di valenza${p.q ? ` (ione con carica ${p.q})` : ''}: ${p.pairs} coppi${p.pairs === 1 ? 'a' : 'e'} e ${p.single} elettron${p.single === 1 ? 'e spaiato' : 'i spaiati'} (regola di Hund).`,
    canBond: (p) => `Gli elettroni spaiati possono formare legami: ${p.art} forma di solito <b>${p.v}</b> legam${p.v === 1 ? 'e' : 'i'}${p.more ? ` (anche ${p.more} con atomi più elettronegativi, ottetto espanso)` : ''}.`,
    nobleConfig: 'Lo ione ha la configurazione elettronica di un gas nobile: è stabile.',
    metal: 'Metallo: con un non metallo molto elettronegativo cede elettroni e forma uno ione positivo (legame ionico).',
    composition: 'Composizione',
    element: 'Elemento',
    atoms: 'Atomi',
    massPct: '% in massa',
    massNote: 'contiene elementi senza isotopi stabili: numero di massa dell\'isotopo più stabile',
    generated: ' · nome generato',
    deselect: 'Deseleziona (Esc)',
    lewis: 'Struttura di Lewis',
    atom: 'Atomo',
    data: 'Dati',
    molarMass: 'Massa molare',
    valenceElectrons: 'Elettroni di valenza',
    charge: 'carica {q}',
    at25: 'A 25 °C',
    polarity: 'Polarità',
    sheet: 'Scheda',
    usesLabel: 'Usi e presenza:',
    isomers: 'Altri isomeri con la stessa formula',
    isomersNote: '«Combina» ha scelto la struttura con l\'energia di legame totale più alta; clic per costruire l\'altra.',
    emptyTitle: 'Banco vuoto',
    emptySteps: [
      'Aggiungi atomi dalla tavolozza (clic o trascinamento).',
      'Trascina un atomo vicino a un altro per <b>legarli</b>, oppure premi <b>Combina</b>.',
      'Clic su un legame per renderlo doppio o triplo; tasto destro (o le forbici) per romperlo.',
      'Clic su una molecola per vederne la scheda.',
      'Con due o più molecole sul banco premi <b>Simula reazione</b>: si urtano e, se possono, reagiscono.',
    ],
    emptyOr: 'Oppure scegli una molecola da <b>Esempi</b>.',
    onBench: 'Sul banco',
    units: '{n} unità',
    unitsNote: 'Clic su una voce (o sulla molecola) per la scheda. Ctrl+clic per selezionarne più di una e combinarle.',
  },
  en: {
    state: { gas: 'gas', liquido: 'liquid', solido: 'solid', soluzione: 'exists only in aqueous solution' },
    ionicCompound: 'Ionic compound',
    ion: 'Ion',
    molecule: 'Molecule',
    ionOf: '{Name} ion',
    atomOf: '{Name} atom',
    monoIon: 'Monatomic ion',
    isolatedAtom: 'Isolated atom',
    polyIon: 'Polyatomic ion',
    notInLibrary: 'Molecule not in the library',
    radical: (p) => `<b>Radical</b>: unpaired electron${p.n === 1 ? '' : 's'} on ${p.list}. Radicals are very reactive.`,
    incomplete: '<b>Incomplete octet</b> on {list}.',
    electronsN: '{sym} ({n} electrons)',
    incompleteException: ' Boron, beryllium and aluminium are well-known exceptions.',
    incompleteHint: ' Try turning a bond into a double or triple bond (click the bond).',
    expanded: '<b>Expanded octet</b> on {list}: possible only from period 3 onwards.',
    allOctets: 'Every atom has a full octet (hydrogen a duet) and there are no unpaired electrons.',
    formalCharges: 'Formal charges (+, −) show how the electrons are shared out in the Lewis structure; they add up to the total charge.',
    unknownChem: '<b>Unknown chemistry</b>: it contains a superheavy element; its compounds have never been observed.',
    unverified: '<b>Structure not verified</b>: for d and f metals the octet and VSEPR rules are not enough to predict the structure.',
    byFormula: 'Recognised from the formula as <b>{name}</b>. ',
    byFormulaIonic: 'In the real compound the bond is ionic: use Combine (or an example) to see the ions.',
    byFormulaOther: 'In the reference structure the atoms are connected differently.',
    differentOrders: 'Recognised as <b>{name}</b>, but in the reference structure the bond orders are different: change the bonds (click) until the card recognises it.',
    isomer: 'Same formula as {list}, but with the atoms connected differently (isomer).',
    ideal: 'ideal {v}',
    notVerified: 'not verified',
    geoExp: 'Experimental values in bold; the others are computed with the VSEPR model.',
    geoEst: 'Angles computed with the VSEPR model (estimate): lone pairs repel more than bonds.',
    geometry: 'Geometry (VSEPR)',
    ionic: 'ionic',
    transferred: (p) => `${p.n} e⁻ transferred`,
    bonds: 'Bonds',
    bond: 'Bond',
    type: 'Type',
    length: 'Length',
    bondsNote: 'Lengths in bold: experimental; ≈ estimated from covalent radii (ionic radii for ions). Average bond energies; ≈ Pauling estimate. ΔEN = electronegativity difference (Pauling).',
    nonpolarMu: 'nonpolar (μ = 0)',
    polarMu: 'polar, μ = {d} D',
    dipoleNote: 'experimental dipole moment (debye)',
    polar: 'polar',
    nonpolar: 'nonpolar',
    polarityNote: 'estimate from the symmetry and the bond dipoles',
    dfMetal: '{name} is a {block}-block metal: common oxidation states {ox}.',
    nobleGas: 'Noble gas: the outer shell is full ({n} electrons), so it forms no bonds.',
    valence: (p) => `<b>${p.lone}</b> valence electrons${p.q ? ` (ion with charge ${p.q})` : ''}: ${p.pairs} pair${p.pairs === 1 ? '' : 's'} and ${p.single} unpaired electron${p.single === 1 ? '' : 's'} (Hund's rule).`,
    canBond: (p) => `Unpaired electrons can form bonds: ${p.art} usually forms <b>${p.v}</b> bond${p.v === 1 ? '' : 's'}${p.more ? ` (also ${p.more} with more electronegative atoms, expanded octet)` : ''}.`,
    nobleConfig: 'The ion has the electron configuration of a noble gas: it is stable.',
    metal: 'Metal: with a very electronegative nonmetal it gives away electrons and forms a positive ion (ionic bond).',
    composition: 'Composition',
    element: 'Element',
    atoms: 'Atoms',
    massPct: '% by mass',
    massNote: 'contains elements without stable isotopes: mass number of the most stable isotope',
    generated: ' · generated name',
    deselect: 'Deselect (Esc)',
    lewis: 'Lewis structure',
    atom: 'Atom',
    data: 'Data',
    molarMass: 'Molar mass',
    valenceElectrons: 'Valence electrons',
    charge: 'charge {q}',
    at25: 'At 25 °C',
    polarity: 'Polarity',
    sheet: 'About',
    usesLabel: 'Uses and occurrence:',
    isomers: 'Other isomers with the same formula',
    isomersNote: '«Combine» picked the structure with the highest total bond energy; click to build the other one.',
    emptyTitle: 'Empty bench',
    emptySteps: [
      'Add atoms from the palette (click or drag).',
      'Drag an atom close to another to <b>bond</b> them, or press <b>Combine</b>.',
      'Click a bond to make it double or triple; right-click (or the scissors) to break it.',
      'Click a molecule to see its card.',
      'With two or more molecules on the bench press <b>Simulate reaction</b>: they collide and, if they can, react.',
    ],
    emptyOr: 'Or pick a molecule from <b>Examples</b>.',
    onBench: 'On the bench',
    units: (p) => `${p.n} unit${p.n === 1 ? '' : 's'}`,
    unitsNote: 'Click an item (or the molecule) for its card. Ctrl+click to select several and combine them.',
  },
  eli6: {
    radical: (p) => `<b>Elettron${p.n === 1 ? 'e solo' : 'i soli'}</b> su ${p.list}: un elettrone senza compagno cerca subito qualcuno con cui legarsi, per questo queste molecole reagiscono facilmente.`,
    incomplete: '<b>Non completo</b>: {list} vorrebbe 8 elettroni intorno, ma ne ha meno.',
    incompleteHint: ' Prova a cliccare un legame per renderlo doppio o triplo.',
    expanded: '<b>Più di 8 elettroni</b> intorno a {list}: gli atomi grandi possono permetterselo.',
    allOctets: 'Ogni atomo ha 8 elettroni intorno a sé (l\'idrogeno ne vuole 2): la molecola è «contenta» e stabile.',
    formalCharges: 'I piccoli + e − dicono quale atomo ha qualche elettrone in più o in meno del normale.',
    geometry: 'Che forma ha',
    geoEst: 'Gli atomi si sistemano il più lontano possibile tra loro, come palloncini legati insieme.',
    bonds: 'I legami (le «strette di mano»)',
    bondsNote: 'Un legame è una coppia di elettroni condivisa da due atomi. Più il numero dei kJ/mol è alto, più il legame è forte.',
    polarityNote: 'polare = un lato della molecola è un po\' negativo e l\'altro un po\' positivo',
    nobleGas: 'Gas nobile: è già «completo» e non ha bisogno di legarsi con nessuno.',
    valence: (p) => `Ha <b>${p.lone}</b> elettroni esterni${p.q ? ` (e carica ${p.q})` : ''}: ${p.pairs} coppi${p.pairs === 1 ? 'a' : 'e'} e ${p.single} elettron${p.single === 1 ? 'e da solo' : 'i da soli'}.`,
    canBond: (p) => `Ogni elettrone da solo è come una «mano» libera: ${p.art} di solito fa <b>${p.v}</b> legam${p.v === 1 ? 'e' : 'i'}.`,
    nobleConfig: 'Lo ione ora è «completo», come un gas nobile: è stabile.',
    metal: 'È un metallo: se incontra un atomo che attira molto gli elettroni (come il cloro), gliene regala qualcuno.',
    lewis: 'Disegno degli elettroni (struttura di Lewis)',
    data: 'Numeri',
    molarMass: 'Quanto pesa (massa molare)',
    valenceElectrons: 'Elettroni esterni',
    polarity: 'Ha due «poli»?',
    sheet: 'Che cos\'è',
    emptyTitle: 'Il banco è vuoto',
    emptySteps: [
      'Clicca un elemento a sinistra per mettere un atomo sul banco.',
      'Trascina un atomo vicino a un altro: si attaccano (legame). Oppure premi <b>Combina</b> e li attacco io.',
      'Clicca un legame per renderlo doppio o triplo; tasto destro per staccarlo.',
      'Clicca una molecola per sapere tutto di lei.',
      'Con due molecole sul banco premi <b>Simula reazione</b>: si scontrano e, se possono, si trasformano.',
    ],
    emptyOr: 'Oppure scegline una già pronta da <b>Esempi</b> (prova «acqua»).',
  },
});

const STATE = t('state');
const BSYM = { 1: '–', 2: '=', 3: '≡' };
const formulaHtml = (f) => esc(f).replace(/([₀-₉]+)/g, '<span class="sub">$1</span>');

const sectionHtml = (title, body, cls = '') => `<section class="mp-sec ${cls}"><h4>${title}</h4>${body}</section>`;
const row = (label, value, note = '') => `<div class="mp-row"><dt>${label}</dt><dd>${value}${note ? `<small>${note}</small>` : ''}</dd></div>`;

function title(lab, u) {
  const { ident, desc } = u;
  if (ident.entry) return { name: ident.entry.name, aka: ident.entry.aka, kind: ident.entry.ionic ? t('ionicCompound') : ident.entry.charge ? t('ion') : t('molecule') };
  if (desc.atoms.length === 1) {
    const info = lab.get(desc.atoms[0].z);
    const q = u.charge;
    const p = { name: info.name.toLowerCase(), Name: info.name };
    return { name: q ? u.generatedName ?? t('ionOf', p) : t('atomOf', p), kind: q ? t('monoIon') : t('isolatedAtom') };
  }
  if (u.ionic) return { name: u.generatedName ?? t('ionicCompound'), kind: t('ionicCompound'), generated: Boolean(u.generatedName) };
  if (u.generatedName) return { name: u.generatedName, kind: t('molecule'), generated: true };
  return { name: u.charge ? t('polyIon') : t('notInLibrary'), kind: u.charge ? t('ion') : t('molecule') };
}

function statusList(lab, u) {
  const items = [];
  const sym = (i) => lab.get(u.desc.atoms[i].z).symbol;
  const radicals = u.lewisAtoms.map((a, i) => (a.unpaired ? i : -1)).filter((i) => i >= 0);
  const incomplete = u.lewisAtoms.map((a, i) => (a.incomplete ? i : -1)).filter((i) => i >= 0);
  const expanded = u.lewisAtoms.map((a, i) => (a.expanded ? i : -1)).filter((i) => i >= 0);
  if (u.desc.atoms.length === 1) return items;
  if (u.invalid) items.push(['bad', esc(u.invalid)]);
  if (radicals.length) {
    items.push(['warn', t('radical', { n: radicals.length, list: radicals.map(sym).join(', ') })]);
  }
  if (incomplete.length) {
    const exception = incomplete.every((i) => [4, 5, 13].includes(u.desc.atoms[i].z) || lab.get(u.desc.atoms[i].z).group <= 2);
    const list = incomplete.map((i) => t('electronsN', { sym: sym(i), n: u.lewisAtoms[i].electronsAround })).join(', ');
    items.push([exception ? 'info' : 'warn', `${t('incomplete', { list })}${exception ? t('incompleteException') : t('incompleteHint')}`]);
  }
  if (expanded.length) items.push(['info', t('expanded', { list: expanded.map((i) => t('electronsN', { sym: sym(i), n: u.lewisAtoms[i].electronsAround })).join(', ') })]);
  if (!radicals.length && !incomplete.length && !u.invalid && !u.unverified) items.push(['ok', t('allOctets')]);
  const fc = u.lewisAtoms.filter((a) => a.formalCharge).length;
  if (fc && !u.ionic) items.push(['info', t('formalCharges')]);
  if (u.tier === TIER.UNKNOWN) items.push(['bad', t('unknownChem')]);
  else if (u.tier === TIER.UNVERIFIED) items.push(['warn', t('unverified')]);
  if (u.ident.byFormula) {
    items.push(['info', `${t('byFormula', { name: esc(u.ident.entry.name) })}${u.ident.entry.ionic ? t('byFormulaIonic') : t('byFormulaOther')}`]);
  } else if (u.ident.entry && !u.ident.exact) {
    items.push(['warn', t('differentOrders', { name: esc(u.ident.entry.name) })]);
  } else if (!u.ident.entry && u.ident.sameFormula?.length) {
    items.push(['info', t('isomer', { list: u.ident.sameFormula.map((e) => `<b>${esc(e.name.toLowerCase())}</b>`).join(', ') })]);
  }
  return items;
}

function geometryHtml(lab, u) {
  const entryGeo = u.ident.exact ? u.ident.entry?.geo : null;
  const lines = [];
  u.vs.forEach((v, c) => {
    if (!v || lines.length >= 6) return;
    const centre = lab.get(u.desc.atoms[c].z).symbol;
    const nb = [];
    for (const b of u.desc.bonds) {
      if (b.i === c) nb.push(b.j);
      if (b.j === c) nb.push(b.i);
    }
    // angoli misurati sul modello, raggruppati per tipo (es. H–O–H)
    const groups = new Map();
    for (let p = 0; p < nb.length; p++) {
      for (let q = p + 1; q < nb.length; q++) {
        const pair = [lab.get(u.desc.atoms[nb[p]].z).symbol, lab.get(u.desc.atoms[nb[q]].z).symbol].sort();
        const key = `${pair[0]}–${centre}–${pair[1]}`;
        const a = angleAt(u.positions, c, nb[p], nb[q]);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(a);
      }
    }
    const angles = [...groups.entries()].map(([k, list]) => {
      const vals = [...new Set(list.map((a) => Math.round(a)))].sort((x, y) => x - y).slice(0, 3);
      const expKey = k.replace(/–/g, '-');
      const exp = entryGeo?.[expKey] ?? entryGeo?.[expKey.split('-').reverse().join('-')];
      return exp && v.steric <= 4 ? `${k} <b>${fmtNumber(exp, 1)}°</b>` : `${k} ≈ ${vals.map((x) => `${x}°`).join(', ')}`;
    });
    lines.push(`<li><b>${centre}</b> <span class="mp-vsepr">${v.notation.replace(/(\d)/g, (d) => subscript(d))}</span> ${esc(v.shape)}${
      v.ideal ? ` <small>(${esc(t('ideal', { v: v.ideal }))})</small>` : ''}${v.reliable ? '' : ` <small class="mp-warn">${t('notVerified')}</small>`}<br><small>${angles.join(' · ')}</small></li>`);
  });
  if (!lines.length) return '';
  const src = entryGeo ? t('geoExp') : t('geoEst');
  return sectionHtml(t('geometry'), `<ul class="mp-geo">${lines.join('')}</ul><p class="mp-note">${src}</p>`);
}

function bondsHtml(lab, u) {
  const entryGeo = u.ident.exact ? u.ident.entry?.geo : null;
  const map = new Map();
  for (const b of u.desc.bonds) {
    const A = lab.get(u.desc.atoms[b.i].z);
    const B = lab.get(u.desc.atoms[b.j].z);
    const [P, Q] = [A, B].sort((x, y) => (x.symbol < y.symbol ? -1 : 1));
    const key = `${P.symbol}${b.order}${Q.symbol}`;
    const d = Math.hypot(...[0, 1, 2].map((k) => u.positions[b.i][k] - u.positions[b.j][k])) * 100;
    if (!map.has(key)) map.set(key, { A: P, B: Q, order: b.order, count: 0, d });
    map.get(key).count++;
  }
  const rows = [...map.values()].map((x) => {
    const ch = bondCharacter(x.A, x.B);
    const e = bondEnergy(x.A, x.B, x.order);
    const s = { 1: '-', 2: '=', 3: '#' }[x.order];
    const exp = entryGeo?.[`${x.A.symbol}${s}${x.B.symbol}`] ?? entryGeo?.[`${x.B.symbol}${s}${x.A.symbol}`];
    const len = exp ? `<b>${fmtNumber(exp, 1)} pm</b>` : `≈ ${fmtNumber(Math.round(x.d), 0)} pm`;
    return `<tr><td><b>${x.A.symbol}${BSYM[x.order]}${x.B.symbol}</b>${x.count > 1 ? ` <small>×${x.count}</small>` : ''}</td>
      <td>${ORDER_NAME[x.order]}<br><small>${ch.type}${ch.dEN != null ? ` · ΔEN ${fmtNumber(ch.dEN, 2, 2)}` : ''}</small></td>
      <td>${len}</td><td>${e.kj ? `${e.estimated ? '≈ ' : ''}${e.kj}` : '—'}</td></tr>`;
  });
  for (const b of u.desc.ionic) {
    const A = lab.get(u.desc.atoms[b.i].z);
    const B = lab.get(u.desc.atoms[b.j].z);
    const ch = bondCharacter(A, B);
    const d = Math.hypot(...[0, 1, 2].map((k) => u.positions[b.i][k] - u.positions[b.j][k])) * 100;
    const qa = chargeText(u.desc.atoms[b.i].charge);
    const qb = chargeText(u.desc.atoms[b.j].charge);
    rows.push(`<tr><td><b>${A.symbol}${qa}···${B.symbol}${qb}</b></td><td>${t('ionic')}<br><small>${t('transferred', { n: b.transfer })}${ch.dEN != null ? ` · ΔEN ${fmtNumber(ch.dEN, 2, 2)}` : ''}</small></td><td>≈ ${Math.round(d)} pm</td><td>—</td></tr>`);
  }
  if (!rows.length) return '';
  return sectionHtml(
    t('bonds'),
    `<table class="mp-table" data-help="term.bond"><thead><tr><th>${t('bond')}</th><th>${t('type')}</th><th>${t('length')}</th><th>kJ/mol</th></tr></thead><tbody>${rows.join('')}</tbody></table>
     <p class="mp-note">${t('bondsNote')}</p>`,
  );
}

function polarity(lab, u) {
  if (u.ident.exact && u.ident.entry.dipole != null) {
    const d = u.ident.entry.dipole;
    return { text: d === 0 ? t('nonpolarMu') : t('polarMu', { d: fmtNumber(d, 2) }), note: t('dipoleNote') };
  }
  if (u.ionic || u.desc.atoms.length < 2 || u.charge) return null;
  const v = [0, 0, 0];
  for (const b of u.desc.bonds) {
    const A = lab.get(u.desc.atoms[b.i].z);
    const B = lab.get(u.desc.atoms[b.j].z);
    if (A.en == null || B.en == null) return null;
    const k = B.en - A.en;
    for (let a = 0; a < 3; a++) v[a] += (u.positions[b.j][a] - u.positions[b.i][a]) * k;
  }
  // coppie solitarie dell'atomo centrale (es. NH₃, H₂O): contribuiscono al dipolo
  u.lone?.forEach((list, i) => {
    for (const d of list ?? []) if (d.kind === 'pair') for (let a = 0; a < 3; a++) v[a] += d.dir[a] * 0.35;
  });
  const m = Math.hypot(...v);
  return { text: m > 0.25 ? t('polar') : t('nonpolar'), note: t('polarityNote') };
}

function atomHtml(lab, u) {
  const info = lab.get(u.desc.atoms[0].z);
  const la = u.lewisAtoms[0];
  const q = u.charge;
  const parts = [];
  if (info.tier !== TIER.MAIN) {
    parts.push(`<p>${t('dfMetal', { name: esc(info.name), block: info.block, ox: info.valences.map((v) => `+${v}`).join(', ') })}</p>`);
  } else if (info.nobleGas && info.maxBonds === 0) {
    parts.push(`<p>${t('nobleGas', { n: info.V })}</p>`);
  } else {
    const pairs = la.lonePairs;
    const single = la.unpaired;
    parts.push(`<p>${t('valence', { lone: la.lone, q: q ? chargeText(q) : '', pairs, single })}</p>`);
    if (!q && single > 0) {
      parts.push(`<p>${t('canBond', { art: art(info), v: info.valences[0], more: info.valences.length > 1 ? info.valences.slice(1).join(', ') : '' })}</p>`);
    }
    if (q && single === 0) parts.push(`<p>${t('nobleConfig')}</p>`);
    if (info.metal && !q) parts.push(`<p>${t('metal')}</p>`);
  }
  return parts.join('');
}

/** Composizione percentuale in massa (per elemento). */
export function compositionHtml(lab, u, mass) {
  if (u.desc.atoms.length < 2 || !(mass > 0)) return '';
  const by = new Map();
  for (const a of u.desc.atoms) {
    const x = lab.get(a.z);
    by.set(x, (by.get(x) || 0) + 1);
  }
  if (by.size < 2) return '';
  const rows = [...by]
    .map(([x, n]) => ({ x, n, pct: (100 * n * x.mass) / mass }))
    .sort((a, b) => b.pct - a.pct)
    .map(({ x, n, pct }) => `<tr><td><b>${x.symbol}</b> <small>${esc(x.name.toLowerCase())}</small></td><td>${n}</td>
      <td class="mp-pct"><span class="mp-bar" style="--w:${pct.toFixed(1)}%;--c:${x.color}"></span>${fmtNumber(pct, 2, 2)} %</td></tr>`);
  return sectionHtml(
    t('composition'),
    `<table class="mp-table mp-comp"><thead><tr><th>${t('element')}</th><th>${t('atoms')}</th><th>${t('massPct')}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`,
  );
}

/** HTML della scheda di un'unità selezionata. */
export function unitPanelHtml(lab, u, { alternatives = [] } = {}) {
  const ti = title(lab, u);
  const entry = u.ident.exact || u.ident.byFormula ? u.ident.entry : null;
  const mass = u.desc.atoms.reduce((s, a) => s + lab.get(a.z).mass, 0);
  const massNote = u.desc.atoms.some((a) => lab.get(a.z).massIsNumber) ? t('massNote') : '';
  const status = statusList(lab, u);
  const pol = polarity(lab, u);
  const svg = lewisSvg(lab, u);
  const electrons = u.lewisFrags.reduce((s, f) => s + f.electrons, 0);

  return `
    <header class="mp-head">
      <p class="mp-kind">${esc(ti.kind)}${ti.generated ? t('generated') : ''}</p>
      <h3 class="mp-name">${esc(ti.name)}</h3>
      ${ti.aka ? `<p class="mp-aka">${esc(ti.aka)}</p>` : ''}
      <p class="mp-formula" data-help="term.formula">${formulaHtml(u.formula)}</p>
      <button type="button" class="btn-icon mp-close" data-act="deselect" title="${t('deselect')}">${icons.close(16)}</button>
    </header>
    ${svg ? `<figure class="mp-lewis" data-help="term.lewis">${svg}<figcaption>${t('lewis')}</figcaption></figure>` : ''}
    ${status.length ? `<ul class="mp-status">${status.map(([k, h]) => `<li class="is-${k}">${h}</li>`).join('')}</ul>` : ''}
    ${u.desc.atoms.length === 1 ? sectionHtml(t('atom'), atomHtml(lab, u)) : ''}
    ${sectionHtml(
      t('data'),
      `<dl class="mp-list">
        ${row(t('molarMass'), `${fmtNumber(mass, 3)} g/mol`, massNote)}
        ${row(t('atoms'), `${u.desc.atoms.length}`)}
        ${row(t('valenceElectrons'), `${electrons}`, u.charge ? t('charge', { q: chargeText(u.charge) }) : '')}
        ${entry?.state ? row(t('at25'), STATE[entry.state] ?? esc(entry.state)) : ''}
        ${pol ? row(t('polarity'), pol.text, pol.note) : ''}
      </dl>`,
    )}
    ${compositionHtml(lab, u, mass)}
    ${u.desc.atoms.length > 2 ? geometryHtml(lab, u) : ''}
    ${bondsHtml(lab, u)}
    ${entry ? sectionHtml(t('sheet'), `<p>${esc(entry.desc)}</p>${entry.note ? `<p class="mp-callout">${esc(entry.note)}</p>` : ''}${entry.uses ? `<p><b>${t('usesLabel')}</b> ${esc(entry.uses)}</p>` : ''}`) : ''}
    ${alternatives.length ? sectionHtml(t('isomers'), `<div class="mp-alts">${alternatives.map((e) => `<button type="button" class="chip-btn" data-alt="${e.id}">${esc(e.name)}</button>`).join('')}</div><p class="mp-note">${t('isomersNote')}</p>`) : ''}`;
}

/** Riepilogo del banco quando nulla è selezionato. */
export function summaryHtml(units) {
  if (!units.length) {
    return `<div class="mp-empty">
      <p class="mp-empty__title">${t('emptyTitle')}</p>
      <ol>${t('emptySteps').map((s) => `<li>${s}</li>`).join('')}</ol>
      <p>${t('emptyOr')}</p></div>`;
  }
  return `<header class="mp-head"><p class="mp-kind">${t('onBench')}</p><h3 class="mp-name">${t('units', { n: units.length })}</h3></header>
    <ul class="mp-units">${units
      .map((u) => `<li><button type="button" class="mp-unit" data-unit="${u.key}"><b>${formulaHtml(u.formula)}</b><span>${esc(u.label)}</span></button></li>`)
      .join('')}</ul>
    <p class="mp-note">${t('unitsNote')}</p>`;
}
