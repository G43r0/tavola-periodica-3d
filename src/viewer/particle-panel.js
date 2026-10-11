// Contenuto della scheda "Analisi della particella" (protone, neutrone, elettrone e quark).
import { PARTICLES, QUARKS, COLOR_CHARGES, ELEMENTARY_CHARGE_C, PROTON_ELECTRON_MASS_RATIO } from '../chem/particles.js';
import { electronBinding, outermostSubshell } from '../chem/electron-binding.js';
import { bindingPerNucleon } from '../chem/nuclear.js';
import { orbitalHtml } from '../chem/quantum-numbers.js';
import { L_LETTERS } from '../chem/electron-config.js';
import { esc, fmtNumber, fmtAbundance, isotopeNotation, superscript } from '../chem/format.js';
import { icons } from '../ui/icons.js';

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).replace(/[-0-9]/g, (c) => SUP[c]);

/** Notazione scientifica in italiano: 1,672 62 × 10⁻²⁷ */
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

const row = (label, value, note = '') =>
  `<div class="pp-row"><dt>${label}</dt><dd>${value}${note ? `<small>${note}</small>` : ''}</dd></div>`;

const section = (title, body, cls = '') => `<section class="pp-sec ${cls}"><h4>${title}</h4>${body}</section>`;

function header(kind, eyebrow) {
  const p = PARTICLES[kind];
  return `<header class="pp-head">
      <span class="pp-icon pp-icon--${kind}" aria-hidden="true"></span>
      <div class="pp-head__text">
        <p class="pp-eyebrow">${eyebrow}</p>
        <h3 id="pp-title">${p.name} <span class="pp-sym">${p.symbol}</span></h3>
      </div>
      <button type="button" class="btn-icon" data-act="deselect" title="Chiudi l'analisi (Esc)">${icons.close(17)}</button>
    </header>`;
}

function chargeRow(p) {
  const sign = p.charge > 0 ? '+' : p.charge < 0 ? '−' : '';
  const coulomb = p.charge === 0 ? '0 C' : `${sign}${sci(ELEMENTARY_CHARGE_C, 6)} C`;
  return row('Carica', `<b>${sign}${Math.abs(p.charge)}</b> e`, coulomb);
}

function massRow(p, extra = '') {
  const mev = p.massMeV < 1 ? fmtNumber(p.massMeV, 6, 6) : fmtNumber(p.massMeV, 3, 3);
  const u = p.massU < 0.01 ? sci(p.massU, 5) : fmtNumber(p.massU, 6, 6);
  return row('Massa', `<b>${sci(p.massKg, 5)} kg</b>`, `${mev} MeV/c² · ${u} u${extra ? `<br>${extra}` : ''}`);
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
    binding = `<p>Il nucleo dell'idrogeno-1 è un singolo protone: non c'è energia di legame nucleare.</p>`;
  } else {
    const src = b.measured ? 'valore sperimentale (AME2020)' : 'stima con la formula semi-empirica di Weizsäcker';
    binding = `<dl class="pp-list">${row('Energia di legame', `<b>≈ ${fmtNumber(b.mev, 2, 2)} MeV</b> per nucleone`, `≈ ${fmtNumber(sig(b.mev * A, 3), 0)} MeV in tutto · ${src}`)}</dl>
      <p>È l'energia necessaria per separare tutti i nucleoni: per questo la massa del nucleo è un po' minore della somma
        delle masse di protoni e neutroni (<i>difetto di massa</i>, E = mc²).</p>`;
  }
  return section(`Nel nucleo ${name}`, `<p class="pp-eq"><b class="p">${el.z}</b> p⁺ + <b class="n">${iso.neutrons}</b> n⁰ = A <b>${A}</b></p>${binding}`);
}

function quarkBlock(kind, ctx) {
  const p = PARTICLES[kind];
  const valence = p.quarks.reduce((s, f) => s + QUARKS[f].massMeV, 0);
  const share = (valence / p.massMeV) * 100;
  const sum = p.quarks.map((f) => QUARKS[f].charge).join(' ');
  return section(
    `Dentro il ${kind === 'proton' ? 'protone' : 'neutrone'}: i quark`,
    `<button type="button" class="av-btn pp-cta" data-act="quarks">${icons.zoom(17)}<span>${ctx.quarkView ? 'Torna al nucleo' : 'Guarda dentro: i quark'}</span></button>
     <p class="pp-hint">${ctx.quarkView ? 'Allontanati con la rotella per tornare al nucleo.' : 'Oppure avvicinati con la rotella del mouse.'}</p>
     <table class="pp-table">
       <thead><tr><th>Quark</th><th>Carica</th><th>Massa</th></tr></thead>
       <tbody>${['u', 'd']
         .filter((f) => p.quarks.includes(f))
         .map((f) => `<tr><td><b>${f}</b> (${QUARKS[f].name}) × ${p.quarks.filter((q) => q === f).length}</td><td>${QUARKS[f].charge} e</td><td>≈ ${fmtNumber(QUARKS[f].massMeV, 1, 1)} MeV/c²</td></tr>`)
         .join('')}</tbody>
     </table>
     <p>Carica totale: ${sum} = <b>${p.charge > 0 ? '+1' : '0'}</b>. Insieme i tre quark pesano circa ${fmtNumber(valence, 0)} MeV/c²,
       appena l'${fmtNumber(share, 0)} % della massa del ${kind === 'proton' ? 'protone' : 'neutrone'}: il resto è energia dei gluoni
       e del moto dei quark (E = mc²).</p>
     <p>Ogni quark ha una <b>carica di colore</b> (${COLOR_CHARGES.map((c) => `<span class="cc cc--${c.key}">${c.name}</span>`).join(', ')}):
       insieme formano una combinazione «bianca». I <b>gluoni</b>, mediatori della forza forte, scambiano di continuo il colore tra i quark
       e li tengono legati: un quark non si può mai isolare (<i>confinamento</i>).</p>
     <p class="pp-note">Rappresentazione schematica: dimensioni, moto e numero di gluoni non sono reali. Nel nucleone compaiono e scompaiono
       anche coppie quark–antiquark virtuali (i puntini).</p>`,
    'pp-sec--quarks',
  );
}

function protonHtml(ctx) {
  const p = PARTICLES.proton;
  const { el, byZ } = ctx;
  const next = byZ.get(el.z + 1);
  const prev = byZ.get(el.z - 1);
  const neighbours = [
    next ? `con un protone in più sarebbe ${esc(next.name.toLowerCase())} (${esc(next.symbol)})` : 'con un protone in più sarebbe l\'elemento 119, mai osservato',
    prev ? `con uno in meno ${esc(prev.name.toLowerCase())} (${esc(prev.symbol)})` : 'con uno in meno non resterebbe alcun nucleo',
  ];
  return `${header('proton', `Particella del nucleo · ${el.z === 1 ? "l'unico protone" : `uno dei ${el.z} protoni`}`)}
    <dl class="pp-list">
      ${chargeRow(p)}
      ${massRow(p, `≈ ${fmtNumber(PROTON_ELECTRON_MASS_RATIO, 0)} volte la massa dell'elettrone`)}
      ${row('Spin', `<b>½</b>`, 'fermione: obbedisce al principio di esclusione di Pauli')}
      ${row('Composizione', `${quarkChips(p.quarks)} <b>uud</b>`, '+⅔ +⅔ −⅓ = +1')}
      ${row('Famiglia', 'Barione (adrone)')}
      ${row('Raggio', `≈ ${fmtNumber(p.radiusFm, 2, 2)} fm`, '1 fm = 10⁻¹⁵ m (raggio di carica)')}
      ${row('Stabilità', '<b>Stabile</b>', 'vita media > 10³⁴ anni: non è mai stato osservato decadere')}
    </dl>
    ${section(
      'Ruolo nell\'atomo',
      `<p>Il numero di protoni è il <b>numero atomico Z</b> e identifica l'elemento: ogni atomo con ${el.z} protoni
         è <b>${esc(el.name.toLowerCase())}</b>; ${neighbours.join(', ')}.</p>
       <p>La carica positiva del nucleo (+${el.z}) trattiene ${el.z === 1 ? 'l\'elettrone' : `i ${el.z} elettroni`} dell'atomo neutro.
         ${el.z > 1 ? 'I protoni si respingono per la forza elettrica: a tenerli uniti è la forza nucleare forte, che agisce tra nucleoni vicini (circa 1 fm).' : ''}</p>`,
    )}
    ${nucleusBlock(ctx)}
    ${quarkBlock('proton', ctx)}`;
}

function decayText(ctx) {
  const { el, iso, byZ } = ctx;
  const name = `${isotopeNotation(iso, esc(el.symbol))}`;
  if (iso.stable) return `<p>In ${name}, nucleo stabile, i neutroni non decadono: lo impedisce l'energia di legame del nucleo.</p>`;
  const after = (dz) => byZ.get(el.z + dz);
  const t = `(radioattivo, t½ ${esc(iso.halfLife?.text ?? '?')})`;
  const parts = iso.decay.map((d) => {
    switch (d.code) {
      case 'β-': {
        const x = after(1);
        return `un neutrone si trasforma in protone emettendo un elettrone e un antineutrino (decadimento β⁻)${x ? `: l'atomo di ${esc(el.name.toLowerCase())} diventa un atomo di ${esc(x.name.toLowerCase())}` : ''}`;
      }
      case '2β-':
        return 'due neutroni si trasformano insieme in protoni (doppio decadimento β⁻, rarissimo)';
      case 'β+':
      case 'CE': {
        const x = after(-1);
        return `avviene il contrario: un protone si trasforma in neutrone (${d.code === 'CE' ? 'cattura elettronica' : 'decadimento β⁺'})${x ? `: l'atomo diventa un atomo di ${esc(x.name.toLowerCase())}` : ''}`;
      }
      case 'α': {
        const x = after(-2);
        return `il nucleo emette una particella α, cioè 2 protoni e 2 neutroni${x ? `, e diventa un nucleo di ${esc(x.name.toLowerCase())}` : ''}`;
      }
      case 'FS':
        return 'il nucleo può spezzarsi in due nuclei più leggeri (fissione spontanea)';
      default:
        return esc(d.label);
    }
  });
  return `<p>In ${name} ${t}: ${parts.join('; oppure ')}.</p>`;
}

function neutronHtml(ctx) {
  const p = PARTICLES.neutron;
  const { el, iso, isotopes } = ctx;
  const diff = PARTICLES.neutron.massMeV - PARTICLES.proton.massMeV;
  const tau = p.lifetimeS;
  const natural = isotopes.filter((i) => i.abundance !== null || i.trace);
  const natText =
    (natural.length
      ? `Isotopi presenti in natura: ${natural.map((i) => `${isotopeNotation(i, esc(el.symbol))} <small>(${fmtAbundance(i)})</small>`).join(', ')}.`
      : `${esc(el.name)} non si trova in natura: i suoi isotopi sono prodotti artificialmente.`) +
    (isotopes.some((i) => i.stable) ? '' : ' Nessuno dei suoi isotopi è stabile.');
  const ratio = iso.neutrons / el.z;
  return `${header('neutron', `Particella del nucleo · ${iso.neutrons === 1 ? "l'unico neutrone" : `uno dei ${iso.neutrons} neutroni`}`)}
    <dl class="pp-list">
      ${row('Carica', '<b>0</b> (neutro)', 'quark udd: +⅔ −⅓ −⅓ = 0')}
      ${massRow(p, `≈ ${fmtNumber(diff, 3, 3)} MeV/c² più del protone`)}
      ${row('Spin', `<b>½</b>`, 'fermione')}
      ${row('Composizione', `${quarkChips(p.quarks)} <b>udd</b>`)}
      ${row('Famiglia', 'Barione (adrone)')}
      ${row('Da solo', '<b>Instabile</b>', `decade β⁻: n → p⁺ + e⁻ + ν̄<sub>e</sub> · vita media ≈ ${fmtNumber(tau, 0)} s
        (${Math.floor(tau / 60)} min ${Math.round(tau % 60)} s), emivita ≈ ${fmtNumber((tau * Math.LN2) / 60, 1, 1)} min`)}
    </dl>
    ${section('Stabilità in questo nucleo', decayText(ctx))}
    ${section(
      'Ruolo negli isotopi',
      `<p>Atomi dello stesso elemento con un numero diverso di neutroni sono <b>isotopi</b>: hanno le stesse proprietà chimiche
         ma massa diversa. ${natText}</p>
       <p>Questo nucleo ha ${iso.neutrons} neutroni (N/Z = ${fmtNumber(ratio, 2, 2)}).
         ${el.z > 20 ? 'Nei nuclei pesanti servono più neutroni che protoni: aggiungono attrazione nucleare senza aumentare la repulsione elettrica.' : 'Nei nuclei leggeri stabili neutroni e protoni sono circa in ugual numero.'}</p>
       <p class="pp-hint">Cambia isotopo dal pannello dei controlli per aggiungere o togliere neutroni.</p>`,
    )}
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

  let pairing;
  if (orb.electrons === 2) {
    pairing = `Condivide l'orbitale con un elettrone di spin opposto (m<sub>s</sub> = ${e.ms > 0 ? '−½' : '+½'}): per il <b>principio di Pauli</b>
      due elettroni non possono avere tutti e quattro i numeri quantici uguali.`;
  } else {
    pairing = `È <b>spaiato</b>: per la <b>regola di Hund</b> gli elettroni occupano prima orbitali diversi dello stesso sottolivello, con spin paralleli.`;
  }

  const methods = {
    ie: `${b.predicted ? 'valore previsto' : 'valore misurato (NIST)'}: è la <b>prima energia di ionizzazione</b>, perché questo è uno degli elettroni più esterni`,
    xray: `valore sperimentale (X-ray Data Booklet) per l'elemento nella sua forma naturale`,
    slater: `stima con le regole di Slater (modello non relativistico): indica solo l'ordine di grandezza${el.z > 70 ? '; negli elementi pesanti gli effetti relativistici la aumentano' : ''}`,
  };
  // ≈ per le stime e per le medie dei livelli separati dallo spin-orbita
  const approx = b.method === 'slater' || Boolean(b.components);
  const value = b.method === 'slater' ? sig(b.ev, 2) : b.components ? sig(b.ev, 3) : b.ev;
  const components = b.components
    ? `<p class="pp-split">${b.components.map((c) => `${e.n}${L_LETTERS[e.l]}<sub>${c.j}</sub> ${fmtEnergy(c.ev)}`).join(' · ')}
        <small>livelli separati dall'interazione spin-orbita</small></p>`
    : '';

  const qn = [
    ['n', e.n, 'principale', `guscio ${e.shell}: energia e distanza media dal nucleo`],
    ['l', `${e.l} <small>(${L_LETTERS[e.l]})</small>`, 'secondario', `forma dell'orbitale: ${L_LETTERS[e.l]}`],
    ['m<sub>l</sub>', e.ml > 0 ? `+${e.ml}` : e.ml < 0 ? `−${-e.ml}` : '0', 'magnetico', `orientamento: orbitale ${orbName}`],
    ['m<sub>s</sub>', `${msText} <small>${spinArrow}</small>`, 'di spin', `spin ${e.ms > 0 ? '«su»' : '«giù»'}`],
  ];

  const quantumNote = mode === 'quantum'
    ? `<p class="pp-note">Nel modello quantistico l'elettrone non ha una traiettoria: è distribuito nella nuvola di probabilità del suo orbitale (${orbName}).</p>`
    : '';
  const action = mode === 'quantum'
    ? `<button type="button" class="av-btn pp-cta" data-act="bohr-follow">${icons.atom(17)}<span>Segui l'elettrone nel modello di Bohr</span></button>`
    : `<button type="button" class="av-btn pp-cta" data-act="show-orbital">${icons.atom(17)}<span>Mostra l'orbitale ${orbName}</span></button>`;

  return `${header('electron', `Particella dell'atomo · guscio ${e.shell}`)}
    <dl class="pp-list">
      ${chargeRow(p)}
      ${massRow(p, `circa 1/${fmtNumber(PROTON_ELECTRON_MASS_RATIO, 0)} della massa del protone`)}
      ${row('Spin', `<b>½</b>`, `qui m<sub>s</sub> = ${msText} (${spinArrow})`)}
      ${row('Famiglia', 'Leptone (fermione)')}
    </dl>
    ${section(
      'Numeri quantici',
      `<div class="pp-qn">${qn
        .map(([sym, val, name, desc]) => `<div class="qn"><span class="qn__sym">${sym}</span><b class="qn__val">${val}</b><span class="qn__name">${name}</span><small>${desc}</small></div>`)
        .join('')}</div>
       ${e.l > 0 ? `<p class="pp-note">Gli orbitali reali (${orbName}…) sono combinazioni di stati con +m<sub>l</sub> e −m<sub>l</sub>; qui si usa la corrispondenza convenzionale.</p>` : ''}`,
    )}
    ${section(
      'Posizione nell\'atomo',
      `<p>Guscio <b>${e.shell}</b> (n = ${e.n}) · sottolivello <b>${sub.label}${superscript(sub.electrons)}</b> · orbitale <b>${orbName}</b>
         con ${orb.electrons === 2 ? '2 elettroni (↑↓)' : '1 elettrone (↑)'}.</p>
       <p>${pairing}</p>
       ${quantumNote}
       ${action}`,
    )}
    ${section(
      'Energia di legame',
      `<p class="pp-big">${approx ? '≈ ' : ''}${fmtEnergy(value)}</p>
       <p class="pp-hint">Energia minima per strapparlo all'atomo: ${methods[b.method]}.</p>
       ${components}
       <dl class="pp-list">${row('Z efficace', `≈ ${fmtNumber(b.zeff, 2, 2)}`, el.z === 1 ? 'un solo elettrone: nessuna schermatura' : `regole di Slater: della carica del nucleo (+${el.z}) gli altri elettroni ne schermano circa ${fmtNumber(el.z - b.zeff, 1, 1)}`)}</dl>
       ${sub.label !== outer.label && el.ionizationEnergyEv
         ? `<p class="pp-hint">Per confronto, l'elettrone più esterno (${outer.label}) è legato con ${fmtEnergy(el.ionizationEnergyEv)}.</p>`
         : ''}`,
    )}
    ${section(
      'Particella elementare',
      `<p>A differenza di protoni e neutroni, l'elettrone non è formato da particelle più piccole: gli esperimenti non hanno mai
         rilevato una struttura interna (dimensione &lt; 10⁻¹⁸ m).</p>`,
    )}`;
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
  return `<b class="q-${info.color.key}">Quark ${info.name} (${info.flavor})</b> · carica ${info.charge} e · colore ${info.color.name}
    <br><small>massa ≈ ${fmtNumber(info.massMeV, 1, 1)} MeV/c² · i gluoni gli fanno cambiare colore di continuo</small>`;
}
