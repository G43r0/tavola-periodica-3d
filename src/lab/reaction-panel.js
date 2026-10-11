// Pannello delle reazioni: elenco, scheda della reazione (equazione, "bilancia tu", energia, diagramma).
import { esc, fmtNumber } from '../chem/format.js';
import { REACTION_GROUPS } from './data/reactions.js';
import { balanceTable } from './chem/reactions.js';
import { reactionDH } from './chem/simulate.js';
import { icons } from '../ui/icons.js';

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
    ? 'Simulazione in corso…'
    : sim.status === 'none'
      ? 'Nessuna reazione'
      : sim.steps.length === 1
        ? 'Reazione avvenuta'
        : `${sim.steps.length} reazioni avvenute`;
  const steps = sim.steps
    .map((s, i) => {
      const exo = s.dH < 0;
      const precise = s.kind === 'library' || s.method === 'formation';
      // minuscola solo la prima lettera: «cloruro di ferro(III)» conserva il numero romano
      const product = s.kind === 'library' ? '' : s.product.entry.name.charAt(0).toLowerCase() + s.product.entry.name.slice(1);
      const name = s.kind === 'library' ? s.re.r.name : `Si forma: ${product}`;
      const what = s.kind === 'library'
        ? `<button type="button" class="chip-btn" data-reaction="${s.re.r.id}">Scheda della reazione</button>`
        : `<p class="mp-note">Non è nella libreria delle reazioni: prodotto previsto dal modello (la sostanza nota che si forma con gli stessi atomi),
            ΔH ${precise ? 'dalle entalpie di formazione' : 'stimato con le energie di legame medie'}.</p>`;
      return `<li class="sim-step">
        <p class="sim-step__name"><span class="sim-step__n">${i + 1}</span><b>${esc(name)}</b>${s.times > 1 ? `<span class="sim-times" title="L'equazione è avvenuta ${s.times} volte">× ${s.times}</span>` : ''}</p>
        ${equationHtml(stepEquation(s))}
        <p class="rx-dh sim-step__dh ${exo ? 'is-exo' : 'is-endo'}">ΔH${precise ? '°' : ' ≈'} <b>${kj(s.dH, precise ? 1 : 0)} kJ</b> <span>${exo ? 'esotermica' : 'endotermica'}</span></p>
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
        return `<div class="sim-hint"><p>Per «${esc(m.re.r.name)}» ${n === 1 ? 'manca' : 'mancano'} <b>${countText(m.lack)}</b>:</p>${equationHtml(m.re)}
          <button type="button" class="chip-btn" data-sim-add="${m.re.r.id}">Aggiungi e simula</button></div>`;
      }),
      ...endothermic.slice(0, 3).map((re) => `<div class="sim-hint is-endo"><p>«${esc(re.r.name)}» è endotermica (ΔH° = ${kj(reactionDH(re))} kJ):
          avviene solo fornendo energia.</p>${equationHtml(re)}</div>`),
      ...needs.map((re) => `<div class="sim-hint"><p>«${esc(re.r.name)}» richiede ${esc(re.r.needs)}: non avviene da sola.</p></div>`),
    ];
    body = `<p>Le molecole si urtano ma <b>rimbalzano</b>: nessun urto è efficace${sim.energy ? ', nemmeno fornendo energia' : ''}.</p>
      ${hints.join('')}
      ${endothermic.length ? `<button type="button" class="lab-act sim-energy" data-act="sim-energy">${icons.bolt(16)}<span>Fornisci energia e simula</span></button>
        <p class="mp-note">Calore, luce o corrente elettrica forniscono l'energia che manca alle reazioni endotermiche.</p>` : ''}
      ${hints.length ? '' : '<p class="mp-note">Queste sostanze sono stabili insieme. Aggiungi un altro reagente (es. O₂ per una combustione) oppure apri <b>Reazioni</b> per vedere quelle della libreria.</p>'}`;
  } else {
    body = `${steps ? `<ol class="sim-steps">${steps}</ol>` : ''}
      ${sim.leftover?.length ? `<p class="sim-left">Non hanno reagito: <b>${countText(sim.leftover)}</b> <small>(in eccesso o senza un partner adatto)</small></p>` : ''}`;
  }

  return `<section class="sim-report${running ? ' is-running' : ''}">
    <header class="mp-head">
      <p class="mp-kind">Simulazione${sim.energy ? ' · con energia fornita' : ''}</p>
      <h3 class="mp-name">${title}</h3>
      ${running ? '' : `<button type="button" class="btn-icon mp-close" data-act="sim-close" title="Chiudi il resoconto">${icons.close(16)}</button>`}
    </header>
    ${body}
    <p class="mp-note">Una reazione avviene solo con un <b>urto efficace</b>: le molecole devono scontrarsi con abbastanza energia
      (energia di attivazione) e con l'orientamento giusto. Gli atomi non si creano né si distruggono: si riorganizzano.</p>
  </section>`;
}

/** Elenco delle reazioni, con in testa quelle possibili con le molecole presenti sul banco. */
export function reactionListHtml(loaded, matches) {
  const item = (re) => `<li><button type="button" class="rx-item" data-reaction="${re.r.id}"><b>${esc(re.r.name)}</b>${equationHtml(re)}</button></li>`;
  const possible = matches.filter((m) => m.missing.length === 0);
  const near = matches.filter((m) => m.missing.length > 0).slice(0, 4);
  return `
    <header class="mp-head"><p class="mp-kind">Reazioni</p><h3 class="mp-name">Scegli una reazione</h3>
      <button type="button" class="btn-icon mp-close" data-act="reactions" title="Chiudi le reazioni">${icons.close(16)}</button></header>
    ${possible.length ? `<section class="rx-group rx-group--bench"><h4>Possibili con le molecole sul banco</h4><ul>${possible.map((m) => item(m.re)).join('')}</ul></section>` : ''}
    ${near.length ? `<section class="rx-group rx-group--near"><h4>Quasi pronte sul banco</h4><ul>${near
      .map((m) => `<li><button type="button" class="rx-item" data-reaction="${m.re.r.id}"><b>${esc(m.re.r.name)}</b><small>manca: ${m.missing.map((x) => `${x.count} ${sub(x.display)}`).join(', ')}</small></button></li>`)
      .join('')}</ul></section>` : ''}
    ${REACTION_GROUPS.map(
      (g) => `<section class="rx-group"><h4>${g.label}</h4><ul>${loaded.filter((re) => re.r.group === g.key).map(item).join('')}</ul></section>`,
    ).join('')}`;
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
  return `<svg class="rx-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagramma energetico">
    <line class="rx-axis" x1="${x0 - 12}" y1="12" x2="${x0 - 12}" y2="${H - 22}"/>
    <text class="rx-axis-label" x="${x0 - 18}" y="10" text-anchor="start">energia</text>
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
        <span class="stepper"><button type="button" data-coef="${side}:${i}:-1" aria-label="Diminuisci">−</button><b>${c}</b><button type="button" data-coef="${side}:${i}:1" aria-label="Aumenta">+</button></span>
        ${sub(s.display)}<small class="eq-state">(${s.mark})</small></span>`;
    const side = (list, coeffs, key) => list.map((s, i) => stepper(key, i, s, coeffs[i])).join('<span class="eq-plus">+</span>');
    const status = balanced
      ? g > 1
        ? `<p class="rx-status is-ok">Bilanciata ✓ — ma i coefficienti si possono semplificare dividendo per ${g}.</p>`
        : '<p class="rx-status is-ok">Bilanciata ✓ — stessi atomi a sinistra e a destra: la massa si conserva (legge di Lavoisier).</p>'
      : '<p class="rx-status is-warn">Non ancora bilanciata: cambia i coefficienti finché ogni elemento ha lo stesso numero di atomi nei due lati.</p>';
    practice = `
      <p class="eq eq--edit">${side(re.reactants, ui.coeffs.r, 'r')}<span class="eq-arrow">→</span>${side(re.products, ui.coeffs.p, 'p')}</p>
      <table class="mp-table rx-count"><thead><tr><th>Elemento</th><th>Reagenti</th><th>Prodotti</th><th></th></tr></thead><tbody>${rows
        .map((x) => `<tr class="${x.left === x.right ? 'is-ok' : 'is-bad'}"><td><b>${lab.get(x.z).symbol}</b></td><td>${x.left}</td><td>${x.right}</td><td>${x.left === x.right ? '✓' : '✗'}</td></tr>`)
        .join('')}</tbody></table>
      ${status}
      <button type="button" class="chip-btn" data-act="rx-solution">Mostra la soluzione</button>`;
  }

  let bondsBlock = '';
  if (enthalpy.bonds) {
    const list = (m) => [...m].map(([k, c]) => `${c} × ${k}`).join(', ');
    bondsBlock = `<details class="rx-bonds"><summary>Stima con le energie di legame: ≈ ${kj(enthalpy.bonds.value, 0)} kJ</summary>
      <p>Legami rotti (energia assorbita): ${list(enthalpy.bonds.broken)} = <b>${fmtNumber(enthalpy.bonds.brokenKj, 0)} kJ</b></p>
      <p>Legami formati (energia liberata): ${list(enthalpy.bonds.formed)} = <b>${fmtNumber(enthalpy.bonds.formedKj, 0)} kJ</b></p>
      <p class="mp-note">ΔH ≈ rotti − formati. La stima usa energie di legame medie e sostanze gassose, quindi differisce dal valore preciso
        (che tiene conto anche dei cambiamenti di stato, es. l'acqua liquida).</p></details>`;
  }

  const available = ui.available;
  return `
    <header class="mp-head">
      <p class="mp-kind"><button type="button" class="rx-back" data-act="rx-list">${icons.prev(13)} Reazioni</button> · ${esc(groupLabel)}</p>
      <h3 class="mp-name">${esc(r.name)}</h3>
      <button type="button" class="btn-icon mp-close" data-act="reactions" title="Chiudi le reazioni">${icons.close(16)}</button>
    </header>
    <div class="segmented rx-tabs" role="group">
      <button type="button" class="segmented__btn" data-rx-tab="eq" aria-pressed="${!ui.practice}">Equazione</button>
      <button type="button" class="segmented__btn" data-rx-tab="practice" aria-pressed="${ui.practice}">Bilancia tu</button>
    </div>
    ${ui.practice ? practice : equationHtml(re)}
    <div class="rx-actions">
      <button type="button" class="lab-act lab-act--primary" data-act="rx-run">${icons.flask(17)}<span>${available ? 'Avvia la reazione' : 'Prepara e avvia'}</span></button>
      <button type="button" class="lab-act" data-act="rx-prepare" title="Mette sul banco le molecole dei reagenti">${icons.plus(16)}<span>Solo reagenti</span></button>
    </div>
    <p class="mp-note">${available ? 'I reagenti sono già sul banco: la reazione userà quelle molecole.' : 'Le molecole dei reagenti verranno create sul banco.'}</p>
    <section class="mp-sec">
      <h4>Energia</h4>
      ${dH == null ? '<p>Entalpie di formazione non disponibili per tutte le specie.</p>' : `
      <p class="rx-dh ${exo ? 'is-exo' : 'is-endo'}">ΔH° = <b>${kj(dH)} kJ</b> <span>${exo ? 'esotermica' : 'endotermica'}</span></p>
      <p>${exo ? 'I prodotti hanno meno energia dei reagenti: la reazione <b>libera</b> calore.' : 'I prodotti hanno più energia dei reagenti: la reazione <b>assorbe</b> energia dall\'esterno.'}
        Valore per le quantità dell'equazione (in moli), a 25 °C e 1 bar, dalle entalpie di formazione standard.</p>
      ${energyDiagram(dH, re)}
      <p class="mp-note">Diagramma schematico: i livelli di reagenti e prodotti seguono ΔH; l'energia di attivazione Eₐ (la "collina" da superare) è solo indicativa.</p>`}
      ${bondsBlock}
    </section>
    <section class="mp-sec"><h4>La reazione</h4><p>${esc(r.desc)}</p>${r.note ? `<p class="mp-callout">${esc(r.note)}</p>` : ''}</section>`;
}
