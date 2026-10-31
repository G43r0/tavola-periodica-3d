// Pannello delle reazioni: elenco, scheda della reazione (equazione, "bilancia tu", energia, diagramma).
import { esc, fmtNumber } from '../chem/format.js';
import { REACTION_GROUPS } from './data/reactions.js';
import { normalizeName } from './chem/identify.js';
import { balanceTable } from './chem/reactions.js';
import { reactionDH } from './chem/simulate.js';
import { icons } from '../ui/icons.js';
import { createT } from '../i18n/index.js';

/** Coefficiente più alto che si può scegliere in «Bilancia tu» (nel catalogo si arriva a 51 O₂, acido oleico). */
export const MAX_COEF = 99;

const tr = createT({
  it: {
    running: 'Simulazione in corso…',
    none: 'Nessuna reazione',
    one: 'Reazione avvenuta',
    many: '{n} reazioni avvenute',
    forms: 'Si forma: {name}',
    card: 'Scheda della reazione',
    modelNote: (p) => `Non è nella libreria delle reazioni: prodotto previsto dal modello (la sostanza nota che si forma con gli stessi atomi), ΔH ${p.precise ? 'dalle entalpie di formazione' : 'stimato con le energie di legame medie'}.`,
    times: 'L\'equazione è avvenuta {n} volte',
    exo: 'esotermica',
    endo: 'endotermica',
    missing: (p) => `Per «${p.title}» ${p.n === 1 ? 'manca' : 'mancano'} <b>${p.list}</b>:`,
    addSim: 'Aggiungi e simula',
    endoHint: '«{title}» è endotermica (ΔH° = {dh} kJ): avviene solo fornendo energia.',
    needs: '«{title}» richiede {needs}: non avviene da sola.',
    equilibrium: '«{title}» è un equilibrio: non si completa da sola.',
    bounce: (p) => `Le molecole si urtano ma <b>rimbalzano</b>: nessun urto è efficace${p.energy ? ', nemmeno fornendo energia' : ''}.`,
    giveEnergy: 'Fornisci energia e simula',
    energyNote: 'Calore, luce o corrente elettrica forniscono l\'energia che manca alle reazioni endotermiche.',
    stable: 'Queste sostanze sono stabili insieme. Aggiungi un altro reagente (es. O₂ per una combustione) oppure apri <b>Reazioni</b> per vedere quelle della libreria.',
    leftover: 'Non hanno reagito: <b>{list}</b> <small>(in eccesso o senza un partner adatto)</small>',
    simulation: 'Simulazione',
    withEnergy: ' · con energia fornita',
    closeReport: 'Chiudi il resoconto',
    effective: 'Una reazione avviene solo con un <b>urto efficace</b>: le molecole devono scontrarsi con abbastanza energia (energia di attivazione) e con l\'orientamento giusto. Gli atomi non si creano né si distruggono: si riorganizzano.',
    noneFound: 'Nessuna reazione trovata. Prova con una formula (es. NaCl), il nome di una sostanza o una parola chiave.',
    found: (p) => `${p.n} ${p.n === 1 ? 'reazione trovata' : 'reazioni trovate'}${p.more ? `: mostro le prime ${p.max}, restringi la ricerca per vedere le altre` : ''}.`,
    reactions: 'Reazioni',
    choose: 'Scegli una reazione',
    closeReactions: 'Chiudi le reazioni',
    searchPlaceholder: 'Cerca: formula, sostanza, parola…',
    searchLabel: 'Cerca una reazione',
    possible: 'Possibili con le molecole sul banco',
    almost: 'Quasi pronte sul banco',
    lacks: 'manca: {list}',
    diagram: 'Diagramma energetico',
    energyAxis: 'energia',
    decrease: 'Diminuisci',
    increase: 'Aumenta',
    simplify: 'Bilanciata ✓ — ma i coefficienti si possono semplificare dividendo per {g}.',
    balanced: 'Bilanciata ✓ — stessi atomi a sinistra e a destra: la massa si conserva (legge di Lavoisier).',
    notBalanced: 'Non ancora bilanciata: cambia i coefficienti finché ogni elemento ha lo stesso numero di atomi nei due lati.',
    element: 'Elemento',
    reactants: 'Reagenti',
    products: 'Prodotti',
    solution: 'Mostra la soluzione',
    bondEstimate: 'Stima con le energie di legame: ≈ {v} kJ',
    broken: 'Legami rotti (energia assorbita): {list} = <b>{kj} kJ</b>',
    formed: 'Legami formati (energia liberata): {list} = <b>{kj} kJ</b>',
    bondNote: 'ΔH ≈ rotti − formati. La stima usa energie di legame medie e sostanze gassose, quindi differisce dal valore preciso (che tiene conto anche dei cambiamenti di stato, es. l\'acqua liquida).',
    equation: 'Equazione',
    practice: 'Bilancia tu',
    run: 'Avvia la reazione',
    prepareRun: 'Prepara e avvia',
    prepareTitle: 'Mette sul banco le molecole dei reagenti',
    onlyReactants: 'Solo reagenti',
    tooBig: 'Troppo grande per il banco: i reagenti hanno {atoms} atomi e il banco ne contiene al massimo {max}. L\'equazione, il bilanciamento e l\'energia restano consultabili.',
    available: 'I reagenti sono già sul banco: la reazione userà quelle molecole.',
    willCreate: 'Le molecole dei reagenti verranno create sul banco.',
    energy: 'Energia',
    noHf: 'Entalpie di formazione non disponibili per tutte le specie.',
    exoText: 'I prodotti hanno meno energia dei reagenti: la reazione <b>libera</b> calore.',
    endoText: 'I prodotti hanno più energia dei reagenti: la reazione <b>assorbe</b> energia dall\'esterno.',
    perEquation: 'Valore per le quantità dell\'equazione (in moli), a 25 °C e 1 bar, dalle entalpie di formazione standard.',
    diagramNote: 'Diagramma schematico: i livelli di reagenti e prodotti seguono ΔH; l\'energia di attivazione Eₐ (la "collina" da superare) è solo indicativa.',
    theReaction: 'La reazione',
    conditions: 'Condizioni:',
    requires: 'Richiede:',
    requiresNote: '(la simulazione non la esegue da sola).',
    reversible: 'Reazione di equilibrio (⇌): qui è scritta nel verso diretto, non si completa.',
  },
  en: {
    running: 'Simulation running…',
    none: 'No reaction',
    one: 'Reaction happened',
    many: '{n} reactions happened',
    forms: 'Forms: {name}',
    card: 'Reaction card',
    modelNote: (p) => `Not in the reaction library: product predicted by the model (the known substance that forms from the same atoms), ΔH ${p.precise ? 'from enthalpies of formation' : 'estimated from average bond energies'}.`,
    times: 'The equation happened {n} times',
    exo: 'exothermic',
    endo: 'endothermic',
    missing: (p) => `For «${p.title}» <b>${p.list}</b> ${p.n === 1 ? 'is' : 'are'} missing:`,
    addSim: 'Add and simulate',
    endoHint: '«{title}» is endothermic (ΔH° = {dh} kJ): it happens only if energy is supplied.',
    needs: '«{title}» requires {needs}: it does not happen by itself.',
    equilibrium: '«{title}» is an equilibrium: it does not go to completion by itself.',
    bounce: (p) => `The molecules collide but <b>bounce off</b>: no collision is effective${p.energy ? ', not even when energy is supplied' : ''}.`,
    giveEnergy: 'Supply energy and simulate',
    energyNote: 'Heat, light or electric current supply the energy that endothermic reactions lack.',
    stable: 'These substances are stable together. Add another reactant (e.g. O₂ for a combustion) or open <b>Reactions</b> to see those in the library.',
    leftover: 'Did not react: <b>{list}</b> <small>(in excess or without a suitable partner)</small>',
    simulation: 'Simulation',
    withEnergy: ' · with energy supplied',
    closeReport: 'Close the report',
    effective: 'A reaction happens only with an <b>effective collision</b>: the molecules must collide with enough energy (activation energy) and the right orientation. Atoms are neither created nor destroyed: they rearrange.',
    noneFound: 'No reaction found. Try a formula (e.g. NaCl), the name of a substance or a keyword.',
    found: (p) => `${p.n} ${p.n === 1 ? 'reaction found' : 'reactions found'}${p.more ? `: showing the first ${p.max}, narrow the search to see the others` : ''}.`,
    reactions: 'Reactions',
    choose: 'Choose a reaction',
    closeReactions: 'Close the reactions',
    searchPlaceholder: 'Search: formula, substance, word…',
    searchLabel: 'Search a reaction',
    possible: 'Possible with the molecules on the bench',
    almost: 'Almost ready on the bench',
    lacks: 'missing: {list}',
    diagram: 'Energy diagram',
    energyAxis: 'energy',
    decrease: 'Decrease',
    increase: 'Increase',
    simplify: 'Balanced ✓ — but the coefficients can be simplified by dividing by {g}.',
    balanced: 'Balanced ✓ — same atoms on the left and on the right: mass is conserved (Lavoisier\'s law).',
    notBalanced: 'Not balanced yet: change the coefficients until every element has the same number of atoms on both sides.',
    element: 'Element',
    reactants: 'Reactants',
    products: 'Products',
    solution: 'Show the solution',
    bondEstimate: 'Bond-energy estimate: ≈ {v} kJ',
    broken: 'Bonds broken (energy absorbed): {list} = <b>{kj} kJ</b>',
    formed: 'Bonds formed (energy released): {list} = <b>{kj} kJ</b>',
    bondNote: 'ΔH ≈ broken − formed. The estimate uses average bond energies and gaseous substances, so it differs from the precise value (which also accounts for changes of state, e.g. liquid water).',
    equation: 'Equation',
    practice: 'Balance it yourself',
    run: 'Start the reaction',
    prepareRun: 'Prepare and start',
    prepareTitle: 'Puts the reactant molecules on the bench',
    onlyReactants: 'Reactants only',
    tooBig: 'Too big for the bench: the reactants have {atoms} atoms and the bench holds at most {max}. The equation, the balancing and the energy can still be viewed.',
    available: 'The reactants are already on the bench: the reaction will use those molecules.',
    willCreate: 'The reactant molecules will be created on the bench.',
    energy: 'Energy',
    noHf: 'Enthalpies of formation are not available for every species.',
    exoText: 'The products have less energy than the reactants: the reaction <b>releases</b> heat.',
    endoText: 'The products have more energy than the reactants: the reaction <b>absorbs</b> energy from outside.',
    perEquation: 'Value for the amounts in the equation (in moles), at 25 °C and 1 bar, from standard enthalpies of formation.',
    diagramNote: 'Schematic diagram: the reactant and product levels follow ΔH; the activation energy Eₐ (the "hill" to climb) is only indicative.',
    theReaction: 'The reaction',
    conditions: 'Conditions:',
    requires: 'Requires:',
    requiresNote: '(the simulation does not run it by itself).',
    reversible: 'Equilibrium reaction (⇌): written here in the forward direction, it does not go to completion.',
  },
  eli6: {
    exo: 'libera calore',
    endo: 'assorbe energia',
    bounce: () => 'Le molecole si scontrano ma <b>rimbalzano</b>: non succede niente.',
    effective: 'Perché due sostanze si trasformino, le loro molecole devono scontrarsi abbastanza forte e nel verso giusto. Gli atomi non spariscono e non nascono: cambiano solo compagni.',
    balanced: 'Giusto ✓ — a sinistra e a destra ci sono gli stessi atomi: niente si perde e niente si crea.',
    notBalanced: 'Non ancora: cambia i numeri finché ogni tipo di atomo è presente lo stesso numero di volte a sinistra e a destra.',
    practice: 'Prova tu a pareggiare',
    exoText: 'Alla fine c\'è meno energia di prima: la differenza esce come <b>calore</b> (come in un fuoco).',
    endoText: 'Alla fine c\'è più energia di prima: bisogna <b>dare</b> energia (calore, luce o elettricità) perché la reazione avvenga.',
    diagramNote: 'Il disegno mostra la «collina» di energia che le molecole devono superare per trasformarsi.',
  },
});

const sub = (f) => esc(f).replace(/([₀-₉]+)/g, '<span class="sub">$1</span>');
const kj = (v, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmtNumber(Math.abs(v), d, d)}`;

/** Una specie con coefficiente e stato fisico: "2 H₂O(l)" */
function term(coef, s, { showOne = false } = {}) {
  return `<span class="eq-term">${coef !== 1 || showOne ? `<b class="eq-coef">${coef}</b>` : ''}${sub(s.display)}<small class="eq-state">${s.mark ? `(${s.mark})` : ''}</small></span>`;
}

export function equationHtml(re) {
  const side = (list, coeffs) => list.map((s, i) => term(coeffs[i], s)).join('<span class="eq-plus">+</span>');
  return `<p class="eq">${side(re.reactants, re.rc)}<span class="eq-arrow">→</span>${side(re.products, re.pc)}</p>`;
}

/** Equazione in testo semplice: "2 H₂ + O₂ → 2 H₂O" */
export function equationText(re) {
  const side = (list, coeffs) => list.map((s, i) => `${coeffs[i] > 1 ? `${coeffs[i]} ` : ''}${s.display}`).join(' + ');
  return `${side(re.reactants, re.rc)} → ${side(re.products, re.pc)}`;
}

/** Titolo di una reazione: il nome, oppure (per quelle del catalogo senza nome) l'equazione in testo semplice. */
export const reactionTitle = (re) => re.r.name ?? equationText(re);

/** Equazione di un passo della simulazione, nella forma di una reazione caricata. */
export function stepEquation(step) {
  if (step.kind === 'library') return step.re;
  return {
    reactants: step.reactants.map((x) => ({ display: x.display, mark: '' })),
    rc: step.reactants.map((x) => x.count),
    products: [{ display: step.productFormula, mark: '' }],
    pc: [step.product.copies],
  };
}

const countText = (list) => list.map((x) => `${x.count > 1 ? `${x.count} ` : ''}${sub(x.display)}`).join(', ');

/**
 * Resoconto di «Simula reazione»: i passi avvenuti (con ΔH), le molecole che non hanno reagito o,
 * se non è successo nulla, il perché (reagenti mancanti, energia da fornire, condizioni particolari).
 */
export function simulationReportHtml(sim) {
  const running = sim.status === 'running';
  const title = running
    ? tr('running')
    : sim.status === 'none'
      ? tr('none')
      : sim.steps.length === 1
        ? tr('one')
        : tr('many', { n: sim.steps.length });
  const steps = sim.steps
    .map((s, i) => {
      const exo = s.dH < 0;
      const precise = s.kind === 'library' || s.method === 'formation';
      // minuscola solo la prima lettera: «cloruro di ferro(III)» conserva il numero romano
      const product = s.kind === 'library' ? '' : s.product.entry.name.charAt(0).toLowerCase() + s.product.entry.name.slice(1);
      const name = s.kind === 'library' ? reactionTitle(s.re) : tr('forms', { name: product });
      const what = s.kind === 'library'
        ? `<button type="button" class="chip-btn" data-reaction="${s.re.r.id}">${tr('card')}</button>`
        : `<p class="mp-note">${tr('modelNote', { precise })}</p>`;
      return `<li class="sim-step">
        <p class="sim-step__name"><span class="sim-step__n">${i + 1}</span><b>${esc(name)}</b>${s.times > 1 ? `<span class="sim-times" title="${esc(tr('times', { n: s.times }))}">× ${s.times}</span>` : ''}</p>
        ${equationHtml(stepEquation(s))}
        <p class="rx-dh sim-step__dh ${exo ? 'is-exo' : 'is-endo'}">ΔH${precise ? '°' : ' ≈'} <b>${kj(s.dH, precise ? 1 : 0)} kJ</b> <span>${exo ? tr('exo') : tr('endo')}</span></p>
        ${what}
      </li>`;
    })
    .join('');

  let body = '';
  if (sim.status === 'none' && sim.diag) {
    const { missing, endothermic, needs } = sim.diag;
    const hints = [
      ...missing.slice(0, 3).map((m) => {
        const n = m.lack.reduce((t, x) => t + x.count, 0);
        return `<div class="sim-hint"><p>${tr('missing', { title: esc(reactionTitle(m.re)), n, list: countText(m.lack) })}</p>${equationHtml(m.re)}
          <button type="button" class="chip-btn" data-sim-add="${m.re.r.id}">${tr('addSim')}</button></div>`;
      }),
      ...endothermic.slice(0, 3).map((re) => `<div class="sim-hint is-endo"><p>${tr('endoHint', { title: esc(reactionTitle(re)), dh: kj(reactionDH(re)) })}</p>${equationHtml(re)}</div>`),
      ...needs.slice(0, 4).map((re) => `<div class="sim-hint"><p>${re.r.needs ? tr('needs', { title: esc(reactionTitle(re)), needs: esc(re.r.needsText ?? re.r.needs) }) : tr('equilibrium', { title: esc(reactionTitle(re)) })}</p></div>`),
    ];
    body = `<p>${tr('bounce', { energy: sim.energy })}</p>
      ${hints.join('')}
      ${endothermic.length ? `<button type="button" class="lab-act sim-energy" data-act="sim-energy">${icons.bolt(16)}<span>${tr('giveEnergy')}</span></button>
        <p class="mp-note">${tr('energyNote')}</p>` : ''}
      ${hints.length ? '' : `<p class="mp-note">${tr('stable')}</p>`}`;
  } else {
    body = `${steps ? `<ol class="sim-steps">${steps}</ol>` : ''}
      ${sim.leftover?.length ? `<p class="sim-left">${tr('leftover', { list: countText(sim.leftover) })}</p>` : ''}`;
  }

  return `<section class="sim-report${running ? ' is-running' : ''}">
    <header class="mp-head">
      <p class="mp-kind">${tr('simulation')}${sim.energy ? tr('withEnergy') : ''}</p>
      <h3 class="mp-name">${title}</h3>
      ${running ? '' : `<button type="button" class="btn-icon mp-close" data-act="sim-close" title="${tr('closeReport')}">${icons.close(16)}</button>`}
    </header>
    ${body}
    <p class="mp-note" data-help="term.collision">${tr('effective')}</p>
  </section>`;
}

const MAX_RESULTS = 60;
const MAX_BENCH = 6;

/** Una voce dell'elenco: con il nome della reazione, se ce l'ha; altrimenti solo l'equazione. */
function reactionItem(re) {
  return `<li><button type="button" class="rx-item${re.r.name ? '' : ' rx-item--bare'}" data-reaction="${re.r.id}">${re.r.name ? `<b>${esc(re.r.name)}</b>` : ''}${equationHtml(re)}</button></li>`;
}

/** Testo in cui cercare: equazione, nome, condizioni, descrizione e nomi delle sostanze (senza accenti e pedici). */
function searchText(re) {
  if (!re.search) {
    const names = [...re.reactants, ...re.products].map((x) => x.name).join(' ');
    const text = `${equationText(re)} ${re.r.name ?? ''} ${re.r.cond ?? ''} ${re.r.condText ?? ''} ${re.r.sub ?? ''} ${re.r.desc} ${names} ${[...re.reactants, ...re.products].map((x) => x.nameIt ?? '').join(' ')}`;
    re.search = normalizeName(text.replace(/[₀-₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)));
  }
  return re.search;
}

/**
 * Corpo dell'elenco: i risultati della ricerca, oppure i gruppi del catalogo (chiusi, con le voci solo se aperti).
 * @param {object[]} loaded reazioni caricate
 * @param {{query:string, open:Set<string>}} ui testo cercato e gruppi aperti
 */
export function reactionResultsHtml(loaded, ui) {
  const terms = normalizeName(ui.query).split(' ').filter(Boolean);
  if (terms.length) {
    const hits = loaded.filter((re) => {
      const text = searchText(re);
      return terms.every((t) => text.includes(t));
    });
    if (!hits.length) return `<p class="mp-note">${tr('noneFound')}</p>`;
    return `<p class="mp-note">${tr('found', { n: hits.length, more: hits.length > MAX_RESULTS, max: MAX_RESULTS })}</p>
      <ul class="rx-list">${hits.slice(0, MAX_RESULTS).map(reactionItem).join('')}</ul>`;
  }
  return REACTION_GROUPS.map((g) => {
    const list = loaded.filter((re) => re.r.group === g.key);
    const open = ui.open.has(g.key);
    return `<details class="rx-group rx-fold" data-rx-group="${g.key}"${open ? ' open' : ''}>
      <summary><h4>${esc(g.label)}</h4><small>${list.length}</small></summary><div class="rx-fold__body">${open ? reactionGroupBodyHtml(list) : ''}</div></details>`;
  }).join('');
}

/** Voci di un gruppo del catalogo, divise per sottogruppo. */
export function reactionGroupBodyHtml(list) {
  let body = '';
  let last = null;
  for (const re of list) {
    if (re.r.sub !== last) {
      body += `${last === null ? '' : '</ul>'}<h5>${esc(re.r.sub ?? '')}</h5><ul class="rx-list">`;
      last = re.r.sub;
    }
    body += reactionItem(re);
  }
  return body + (last === null ? '' : '</ul>');
}

/** Elenco delle reazioni, con in testa quelle possibili con le molecole presenti sul banco. */
export function reactionListHtml(loaded, matches, ui) {
  const possible = matches.filter((m) => m.missing.length === 0);
  const near = matches.filter((m) => m.missing.length > 0).slice(0, 4);
  const searching = normalizeName(ui.query) !== '';
  return `
    <header class="mp-head"><p class="mp-kind">${tr('reactions')} · ${loaded.length}</p><h3 class="mp-name">${tr('choose')}</h3>
      <button type="button" class="btn-icon mp-close" data-act="reactions" title="${tr('closeReactions')}">${icons.close(16)}</button></header>
    <label class="rx-search"><input type="search" data-rx-search placeholder="${esc(tr('searchPlaceholder'))}" value="${esc(ui.query)}" autocomplete="off" spellcheck="false" aria-label="${esc(tr('searchLabel'))}"></label>
    ${possible.length && !searching ? `<section class="rx-group rx-group--bench"><h4>${tr('possible')}${possible.length > MAX_BENCH ? ` (${possible.length})` : ''}</h4><ul class="rx-list">${possible
      .slice(0, MAX_BENCH)
      .map((m) => reactionItem(m.re))
      .join('')}</ul></section>` : ''}
    ${near.length && !searching ? `<section class="rx-group rx-group--near"><h4>${tr('almost')}</h4><ul class="rx-list">${near
      .map((m) => `<li><button type="button" class="rx-item" data-reaction="${m.re.r.id}"><b>${esc(reactionTitle(m.re))}</b><small>${tr('lacks', { list: m.missing.map((x) => `${x.count} ${sub(x.display)}`).join(', ') })}</small></button></li>`)
      .join('')}</ul></section>` : ''}
    <div class="rx-results">${reactionResultsHtml(loaded, ui)}</div>`;
}

/** Diagramma energetico schematico (livelli reali, gobba dell'energia di attivazione indicativa). */
export function energyDiagram(dH, re) {
  const W = 300;
  const H = 190;
  const exo = dH < 0;
  const span = 78;
  const yR = exo ? 62 : 62 + span;
  const yP = exo ? 62 + span : 62;
  const peak = Math.min(yR, yP) - 44;
  const color = exo ? 'var(--ok)' : 'var(--warn)';
  const x0 = 34;
  const path = `M${x0},${yR} H92 C125,${yR} 128,${peak} 150,${peak} C172,${peak} 175,${yP} 208,${yP} H272`;
  const left = re.reactants.map((s, i) => `${re.rc[i] > 1 ? re.rc[i] : ''}${s.display}`).join(' + ');
  const right = re.products.map((s, i) => `${re.pc[i] > 1 ? re.pc[i] : ''}${s.display}`).join(' + ');
  return `<svg class="rx-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr('diagram')}">
    <line class="rx-axis" x1="${x0 - 12}" y1="12" x2="${x0 - 12}" y2="${H - 22}"/>
    <text class="rx-axis-label" x="${x0 - 18}" y="10" text-anchor="start">${tr('energyAxis')}</text>
    <path class="rx-curve" d="${path}"/>
    <line class="rx-level" x1="${x0}" y1="${yR}" x2="92" y2="${yR}"/>
    <line class="rx-level" x1="208" y1="${yP}" x2="272" y2="${yP}"/>
    <line class="rx-ea" x1="66" y1="${yR}" x2="66" y2="${peak}" marker-end="url(#rx-arrow)"/>
    <text class="rx-small" x="72" y="${(yR + peak) / 2 + 3}">Eₐ</text>
    <line class="rx-dh" x1="285" y1="${yR}" x2="285" y2="${yP}" style="stroke:${color}" marker-end="url(#rx-arrow-dh)"/>
    <line class="rx-guide" x1="92" y1="${yR}" x2="290" y2="${yR}"/>
    <text class="rx-dh-label" x="${exo ? 280 : 280}" y="${(yR + yP) / 2 + 4}" text-anchor="end" style="fill:${color}">ΔH</text>
    <text class="rx-small" x="${x0}" y="${yR + 14}">${esc(left)}</text>
    <text class="rx-small" x="272" y="${yP + 14}" text-anchor="end">${esc(right)}</text>
    <defs>
      <marker id="rx-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--text-2)"/></marker>
      <marker id="rx-arrow-dh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker>
    </defs>
  </svg>`;
}

/**
 * Scheda di una reazione.
 * @param {object} re reazione caricata { r, reactants, products, rc, pc, enthalpy }
 * @param {object} ui { practice:boolean, coeffs:{r:number[],p:number[]}, available:boolean, missing:[] }
 */
export function reactionCardHtml(lab, re, ui) {
  const { r, enthalpy } = re;
  const dH = enthalpy.formation.value;
  const exo = dH < 0;
  const groupLabel = REACTION_GROUPS.find((g) => g.key === r.group)?.label ?? '';

  let practice = '';
  if (ui.practice) {
    const rows = balanceTable(re.reactants, re.products, ui.coeffs.r, ui.coeffs.p);
    const balanced = rows.every((x) => x.left === x.right);
    const all = [...ui.coeffs.r, ...ui.coeffs.p];
    const g = all.reduce((a, b) => {
      while (b) [a, b] = [b, a % b];
      return a;
    });
    const stepper = (side, i, s, c) => `<span class="eq-term eq-term--edit">
        <span class="stepper"><button type="button" data-coef="${side}:${i}:-1" aria-label="${tr('decrease')}">−</button><b>${c}</b><button type="button" data-coef="${side}:${i}:1" aria-label="${tr('increase')}">+</button></span>
        ${sub(s.display)}<small class="eq-state">(${s.mark})</small></span>`;
    const side = (list, coeffs, key) => list.map((s, i) => stepper(key, i, s, coeffs[i])).join('<span class="eq-plus">+</span>');
    const status = balanced
      ? g > 1
        ? `<p class="rx-status is-ok">${tr('simplify', { g })}</p>`
        : `<p class="rx-status is-ok">${tr('balanced')}</p>`
      : `<p class="rx-status is-warn">${tr('notBalanced')}</p>`;
    practice = `
      <p class="eq eq--edit">${side(re.reactants, ui.coeffs.r, 'r')}<span class="eq-arrow">→</span>${side(re.products, ui.coeffs.p, 'p')}</p>
      <table class="mp-table rx-count"><thead><tr><th>${tr('element')}</th><th>${tr('reactants')}</th><th>${tr('products')}</th><th></th></tr></thead><tbody>${rows
        .map((x) => `<tr class="${x.left === x.right ? 'is-ok' : 'is-bad'}"><td><b>${lab.get(x.z).symbol}</b></td><td>${x.left}</td><td>${x.right}</td><td>${x.left === x.right ? '✓' : '✗'}</td></tr>`)
        .join('')}</tbody></table>
      ${status}
      <button type="button" class="chip-btn" data-act="rx-solution">${tr('solution')}</button>`;
  }

  let bondsBlock = '';
  if (enthalpy.bonds) {
    const list = (m) => [...m].map(([k, c]) => `${c} × ${k}`).join(', ');
    bondsBlock = `<details class="rx-bonds"><summary>${tr('bondEstimate', { v: kj(enthalpy.bonds.value, 0) })}</summary>
      <p>${tr('broken', { list: list(enthalpy.bonds.broken), kj: fmtNumber(enthalpy.bonds.brokenKj, 0) })}</p>
      <p>${tr('formed', { list: list(enthalpy.bonds.formed), kj: fmtNumber(enthalpy.bonds.formedKj, 0) })}</p>
      <p class="mp-note">${tr('bondNote')}</p></details>`;
  }

  const available = ui.available;
  const tooBig = !available && ui.atoms > ui.maxAtoms;
  return `
    <header class="mp-head">
      <p class="mp-kind"><button type="button" class="rx-back" data-act="rx-list">${icons.prev(13)} ${tr('reactions')}</button> · ${esc(groupLabel)}</p>
      <h3 class="mp-name">${esc(reactionTitle(re))}</h3>
      <button type="button" class="btn-icon mp-close" data-act="reactions" title="${tr('closeReactions')}">${icons.close(16)}</button>
    </header>
    <div class="segmented rx-tabs" role="group">
      <button type="button" class="segmented__btn" data-rx-tab="eq" aria-pressed="${!ui.practice}">${tr('equation')}</button>
      <button type="button" class="segmented__btn" data-rx-tab="practice" data-help="term.balancing" aria-pressed="${ui.practice}">${tr('practice')}</button>
    </div>
    ${ui.practice ? practice : equationHtml(re)}
    <div class="rx-actions">
      <button type="button" class="lab-act lab-act--primary" data-act="rx-run"${tooBig ? ' disabled' : ''}>${icons.flask(17)}<span>${available ? tr('run') : tr('prepareRun')}</span></button>
      <button type="button" class="lab-act" data-act="rx-prepare"${tooBig ? ' disabled' : ''} title="${tr('prepareTitle')}">${icons.plus(16)}<span>${tr('onlyReactants')}</span></button>
    </div>
    <p class="mp-note">${tooBig ? tr('tooBig', { atoms: ui.atoms, max: ui.maxAtoms }) : available ? tr('available') : tr('willCreate')}</p>
    <section class="mp-sec">
      <h4 data-help="term.enthalpy">${tr('energy')}</h4>
      ${dH == null ? `<p>${tr('noHf')}</p>` : `
      <p class="rx-dh ${exo ? 'is-exo' : 'is-endo'}" data-help="${exo ? 'term.exothermic' : 'term.endothermic'}">ΔH° = <b>${kj(dH)} kJ</b> <span>${exo ? tr('exo') : tr('endo')}</span></p>
      <p>${exo ? tr('exoText') : tr('endoText')} ${tr('perEquation')}</p>
      ${energyDiagram(dH, re)}
      <p class="mp-note">${tr('diagramNote')}</p>`}
      ${bondsBlock}
    </section>
    <section class="mp-sec"><h4>${tr('theReaction')}</h4><p>${esc(r.desc)}</p>${r.note ? `<p class="mp-callout">${esc(r.note)}</p>` : ''}
      ${r.cond ? `<p class="rx-cond"><b>${tr('conditions')}</b> ${esc(r.condText ?? r.cond)}</p>` : ''}
      ${r.needs ? `<p class="rx-cond"><b>${tr('requires')}</b> ${esc(r.needsText ?? r.needs)} ${tr('requiresNote')}</p>` : ''}
      ${r.rev ? `<p class="rx-cond">${tr('reversible')}</p>` : ''}</section>`;
}
