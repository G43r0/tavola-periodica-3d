// Scheda della molecola selezionata (o riepilogo del banco).
import { esc, fmtNumber } from '../chem/format.js';
import { TIER } from './chem/elements-lab.js';
import { bondCharacter, ORDER_NAME, art } from './chem/bonding.js';
import { bondEnergy } from './chem/bond-energy.js';
import { angleAt } from './chem/geometry.js';
import { subscript, chargeText } from './chem/identify.js';
import { lewisSvg } from './lewis-svg.js';
import { icons } from '../ui/icons.js';

const STATE = { gas: 'gassoso', liquido: 'liquido', solido: 'solido', soluzione: 'esiste solo in soluzione acquosa' };
const BSYM = { 1: '–', 2: '=', 3: '≡' };
const formulaHtml = (f) => esc(f).replace(/([₀-₉]+)/g, '<span class="sub">$1</span>');

const sectionHtml = (title, body, cls = '') => `<section class="mp-sec ${cls}"><h4>${title}</h4>${body}</section>`;
const row = (label, value, note = '') => `<div class="mp-row"><dt>${label}</dt><dd>${value}${note ? `<small>${note}</small>` : ''}</dd></div>`;

function title(lab, u) {
  const { ident, desc } = u;
  if (ident.entry) return { name: ident.entry.name, aka: ident.entry.aka, kind: ident.entry.ionic ? 'Composto ionico' : ident.entry.charge ? 'Ione' : 'Molecola' };
  if (desc.atoms.length === 1) {
    const info = lab.get(desc.atoms[0].z);
    const q = u.charge;
    return { name: q ? u.generatedName ?? `Ione ${info.name.toLowerCase()}` : `Atomo di ${info.name.toLowerCase()}`, kind: q ? 'Ione monoatomico' : 'Atomo isolato' };
  }
  if (u.ionic) return { name: u.generatedName ?? 'Composto ionico', kind: 'Composto ionico', generated: Boolean(u.generatedName) };
  if (u.generatedName) return { name: u.generatedName, kind: 'Molecola', generated: true };
  return { name: u.charge ? 'Ione poliatomico' : 'Molecola non in libreria', kind: u.charge ? 'Ione' : 'Molecola' };
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
    items.push(['warn', `<b>Radicale</b>: elettron${radicals.length === 1 ? 'e spaiato' : 'i spaiati'} su ${radicals.map(sym).join(', ')}. I radicali sono molto reattivi${u.ident.entry && !['no', 'no2'].includes(u.ident.entry.id) ? '' : ''}.`]);
  }
  if (incomplete.length) {
    const exception = incomplete.every((i) => [4, 5, 13].includes(u.desc.atoms[i].z) || lab.get(u.desc.atoms[i].z).group <= 2);
    items.push([exception ? 'info' : 'warn', `<b>Ottetto incompleto</b> su ${incomplete.map((i) => `${sym(i)} (${u.lewisAtoms[i].electronsAround} elettroni)`).join(', ')}.${
      exception ? ' Il boro, il berillio e l\'alluminio sono eccezioni note.' : ' Prova a trasformare un legame in doppio o triplo (clic sul legame).'
    }`]);
  }
  if (expanded.length) items.push(['info', `<b>Ottetto espanso</b> su ${expanded.map((i) => `${sym(i)} (${u.lewisAtoms[i].electronsAround} elettroni)`).join(', ')}: possibile solo dal 3° periodo in poi.`]);
  if (!radicals.length && !incomplete.length && !u.invalid && !u.unverified) {
    items.push(['ok', 'Tutti gli atomi hanno l\'ottetto completo (l\'idrogeno il duetto) e non ci sono elettroni spaiati.']);
  }
  const fc = u.lewisAtoms.filter((a) => a.formalCharge).length;
  if (fc && !u.ionic) items.push(['info', 'Le cariche formali (+, −) indicano come sono ripartiti gli elettroni nella struttura di Lewis; la loro somma è la carica totale.']);
  if (u.tier === TIER.UNKNOWN) items.push(['bad', '<b>Chimica sconosciuta</b>: contiene un elemento superpesante; i suoi composti non sono mai stati osservati.']);
  else if (u.tier === TIER.UNVERIFIED) items.push(['warn', '<b>Struttura non verificata</b>: per i metalli d e f le regole dell\'ottetto e della VSEPR non bastano a prevedere la struttura.']);
  if (u.ident.byFormula) {
    items.push(['info', `Riconosciuto dalla formula come <b>${esc(u.ident.entry.name)}</b>. ${
      u.ident.entry.ionic ? 'Nel composto reale il legame è ionico: usa Combina (o un esempio) per vedere gli ioni.' : 'Nella struttura di riferimento gli atomi sono collegati in modo diverso.'}`]);
  } else if (u.ident.entry && !u.ident.exact) {
    items.push(['warn', `Riconosciuta come <b>${esc(u.ident.entry.name)}</b>, ma nella struttura di riferimento gli ordini di legame sono diversi: cambia i legami (clic) finché la scheda la riconosce.`]);
  } else if (!u.ident.entry && u.ident.sameFormula?.length) {
    items.push(['info', `Stessa formula di ${u.ident.sameFormula.map((e) => `<b>${esc(e.name.toLowerCase())}</b>`).join(', ')}, ma con gli atomi collegati in modo diverso (isomero).`]);
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
      v.ideal ? ` <small>(ideale ${esc(v.ideal)})</small>` : ''}${v.reliable ? '' : ' <small class="mp-warn">non verificata</small>'}<br><small>${angles.join(' · ')}</small></li>`);
  });
  if (!lines.length) return '';
  const src = entryGeo ? 'In grassetto i valori sperimentali; gli altri sono calcolati con il modello VSEPR.' : 'Angoli calcolati con il modello VSEPR (stima): le coppie solitarie respingono più dei legami.';
  return sectionHtml('Geometria (VSEPR)', `<ul class="mp-geo">${lines.join('')}</ul><p class="mp-note">${src}</p>`);
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
    rows.push(`<tr><td><b>${A.symbol}${qa}···${B.symbol}${qb}</b></td><td>ionico<br><small>${b.transfer} e⁻ trasferit${b.transfer === 1 ? 'o' : 'i'}${ch.dEN != null ? ` · ΔEN ${fmtNumber(ch.dEN, 2, 2)}` : ''}</small></td><td>≈ ${Math.round(d)} pm</td><td>—</td></tr>`);
  }
  if (!rows.length) return '';
  return sectionHtml(
    'Legami',
    `<table class="mp-table"><thead><tr><th>Legame</th><th>Tipo</th><th>Lunghezza</th><th>kJ/mol</th></tr></thead><tbody>${rows.join('')}</tbody></table>
     <p class="mp-note">Lunghezze in grassetto: sperimentali; ≈ stimate dai raggi covalenti (ionici per gli ioni). Energie di legame medie;
       ≈ stima di Pauling. ΔEN = differenza di elettronegatività (Pauling).</p>`,
  );
}

function polarity(lab, u) {
  if (u.ident.exact && u.ident.entry.dipole != null) {
    const d = u.ident.entry.dipole;
    return { text: d === 0 ? 'apolare (μ = 0)' : `polare, μ = ${fmtNumber(d, 2)} D`, note: 'momento dipolare sperimentale (debye)' };
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
  return { text: m > 0.25 ? 'polare' : 'apolare', note: 'stima dalla simmetria e dai dipoli dei legami' };
}

function atomHtml(lab, u) {
  const info = lab.get(u.desc.atoms[0].z);
  const la = u.lewisAtoms[0];
  const q = u.charge;
  const parts = [];
  if (info.tier !== TIER.MAIN) {
    parts.push(`<p>${esc(info.name)} è un metallo del blocco ${info.block}: stati di ossidazione comuni ${info.valences.map((v) => `+${v}`).join(', ')}.</p>`);
  } else if (info.nobleGas && info.maxBonds === 0) {
    parts.push(`<p>Gas nobile: il guscio esterno è completo (${info.V} elettroni), quindi non forma legami.</p>`);
  } else {
    const pairs = la.lonePairs;
    const single = la.unpaired;
    parts.push(`<p><b>${la.lone}</b> elettroni di valenza${q ? ` (ione con carica ${chargeText(q)})` : ''}: ${pairs} coppi${pairs === 1 ? 'a' : 'e'} e ${single} elettron${single === 1 ? 'e spaiato' : 'i spaiati'} (regola di Hund).</p>`);
    if (!q && single > 0) {
      parts.push(`<p>Gli elettroni spaiati possono formare legami: ${art(info)} forma di solito <b>${info.valences[0]}</b> legam${info.valences[0] === 1 ? 'e' : 'i'}${
        info.valences.length > 1 ? ` (anche ${info.valences.slice(1).join(', ')} con atomi più elettronegativi, ottetto espanso)` : ''}.</p>`);
    }
    if (q && single === 0) parts.push('<p>Lo ione ha la configurazione elettronica di un gas nobile: è stabile.</p>');
    if (info.metal && !q) parts.push(`<p>Metallo: con un non metallo molto elettronegativo cede elettroni e forma uno ione positivo (legame ionico).</p>`);
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
    'Composizione',
    `<table class="mp-table mp-comp"><thead><tr><th>Elemento</th><th>Atomi</th><th>% in massa</th></tr></thead><tbody>${rows.join('')}</tbody></table>`,
  );
}

/** HTML della scheda di un'unità selezionata. */
export function unitPanelHtml(lab, u, { alternatives = [] } = {}) {
  const t = title(lab, u);
  const entry = u.ident.exact || u.ident.byFormula ? u.ident.entry : null;
  const mass = u.desc.atoms.reduce((s, a) => s + lab.get(a.z).mass, 0);
  const massNote = u.desc.atoms.some((a) => lab.get(a.z).massIsNumber) ? 'contiene elementi senza isotopi stabili: numero di massa dell\'isotopo più stabile' : '';
  const status = statusList(lab, u);
  const pol = polarity(lab, u);
  const svg = lewisSvg(lab, u);
  const electrons = u.lewisFrags.reduce((s, f) => s + f.electrons, 0);

  return `
    <header class="mp-head">
      <p class="mp-kind">${esc(t.kind)}${t.generated ? ' · nome generato' : ''}</p>
      <h3 class="mp-name">${esc(t.name)}</h3>
      ${t.aka ? `<p class="mp-aka">${esc(t.aka)}</p>` : ''}
      <p class="mp-formula">${formulaHtml(u.formula)}</p>
      <button type="button" class="btn-icon mp-close" data-act="deselect" title="Deseleziona (Esc)">${icons.close(16)}</button>
    </header>
    ${svg ? `<figure class="mp-lewis">${svg}<figcaption>Struttura di Lewis</figcaption></figure>` : ''}
    ${status.length ? `<ul class="mp-status">${status.map(([k, h]) => `<li class="is-${k}">${h}</li>`).join('')}</ul>` : ''}
    ${u.desc.atoms.length === 1 ? sectionHtml('Atomo', atomHtml(lab, u)) : ''}
    ${sectionHtml(
      'Dati',
      `<dl class="mp-list">
        ${row('Massa molare', `${fmtNumber(mass, 3)} g/mol`, massNote)}
        ${row('Atomi', `${u.desc.atoms.length}`)}
        ${row('Elettroni di valenza', `${electrons}`, u.charge ? `carica ${chargeText(u.charge)}` : '')}
        ${entry?.state ? row('A 25 °C', STATE[entry.state] ?? esc(entry.state)) : ''}
        ${pol ? row('Polarità', pol.text, pol.note) : ''}
      </dl>`,
    )}
    ${compositionHtml(lab, u, mass)}
    ${u.desc.atoms.length > 2 ? geometryHtml(lab, u) : ''}
    ${bondsHtml(lab, u)}
    ${entry ? sectionHtml('Scheda', `<p>${esc(entry.desc)}</p>${entry.note ? `<p class="mp-callout">${esc(entry.note)}</p>` : ''}${entry.uses ? `<p><b>Usi e presenza:</b> ${esc(entry.uses)}</p>` : ''}`) : ''}
    ${alternatives.length ? sectionHtml('Altri isomeri con la stessa formula', `<div class="mp-alts">${alternatives.map((e) => `<button type="button" class="chip-btn" data-alt="${e.id}">${esc(e.name)}</button>`).join('')}</div><p class="mp-note">«Combina» ha scelto la struttura con l'energia di legame totale più alta; clic per costruire l'altra.</p>`) : ''}`;
}

/** Riepilogo del banco quando nulla è selezionato. */
export function summaryHtml(units) {
  if (!units.length) {
    return `<div class="mp-empty">
      <p class="mp-empty__title">Banco vuoto</p>
      <ol>
        <li>Aggiungi atomi dalla tavolozza (clic o trascinamento).</li>
        <li>Trascina un atomo vicino a un altro per <b>legarli</b>, oppure premi <b>Combina</b>.</li>
        <li>Clic su un legame per renderlo doppio o triplo; tasto destro (o le forbici) per romperlo.</li>
        <li>Clic su una molecola per vederne la scheda.</li>
      </ol>
      <p>Oppure scegli una molecola da <b>Esempi</b>.</p></div>`;
  }
  return `<header class="mp-head"><p class="mp-kind">Sul banco</p><h3 class="mp-name">${units.length} ${units.length === 1 ? 'unità' : 'unità'}</h3></header>
    <ul class="mp-units">${units
      .map((u) => `<li><button type="button" class="mp-unit" data-unit="${u.key}"><b>${formulaHtml(u.formula)}</b><span>${esc(u.label)}</span></button></li>`)
      .join('')}</ul>
    <p class="mp-note">Clic su una voce (o sulla molecola) per la scheda. Ctrl+clic per selezionarne più di una e combinarle.</p>`;
}
