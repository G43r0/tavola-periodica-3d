// Modalità Spiega (F1): evidenziando una parola o facendo clic destro su qualcosa si apre una scheda che la
// spiega — termini di chimica e fisica, elementi, sostanze, funzioni dell'interfaccia e scorciatoie da tastiera.
// Il glossario e la libreria delle sostanze si caricano solo quando servono.
import '../styles/explain.css';
import { createT, getLang, isSimple } from '../i18n/index.js';
import { esc } from '../chem/format.js';
import { CATEGORY } from '../data/categories.js';
import { icons } from './icons.js';

const t = createT({
  it: {
    banner: 'Modalità Spiega',
    bannerHint: 'Evidenzia una parola o fai clic destro su qualsiasi cosa',
    exit: 'Esci',
    term: 'Termine',
    ui: 'Funzione',
    key: 'Scorciatoia',
    cat: 'Famiglia',
    element: 'Elemento',
    substance: 'Sostanza',
    group: 'Gruppo',
    period: 'Periodo',
    secret: 'Segreto',
    none: 'Spiega',
    shortcuts: 'Scorciatoie',
    see: 'Vedi anche',
    back: 'Indietro',
    close: 'Chiudi (Esc)',
    openCard: 'Apri la scheda',
    loading: 'Cerco…',
    notFound: 'Non ho ancora una spiegazione per «{w}».',
    notFoundHint: 'Prova con una parola sola, oppure fai clic destro su un pulsante, un elemento o un valore: conosco i 118 elementi, le sostanze del laboratorio, i termini di chimica e fisica e tutti i comandi dell\'app.',
    elIntro: '{name} ({sym}) è un {cat}: ogni suo atomo ha {z} protoni nel nucleo.',
    elIntroUnknown: '{name} ({sym}) è un elemento superpesante: ogni suo atomo ha {z} protoni nel nucleo e la sua chimica non è ancora nota.',
    elPos: 'Si trova nel gruppo {g}, periodo {p}, blocco {b}.',
    elPosNoGroup: 'Si trova nel periodo {p}, blocco {b}.',
    elState: 'A 25 °C è {state}.',
    states: { solid: 'solido', liquid: 'liquido', gas: 'un gas' },
    uses: 'Usi: {list}.',
    aka: 'Detto anche: {list}.',
    molState: { gas: 'A 25 °C è un gas.', liquido: 'A 25 °C è liquido.', solido: 'A 25 °C è solido.', soluzione: 'Esiste solo sciolto in acqua.' },
    groupTitle: 'Gruppo {g}',
    groupText: 'La colonna {g} della tavola periodica: {list}. Gli elementi della stessa colonna hanno lo stesso numero di elettroni esterni e si comportano in modo simile.',
    periodTitle: 'Periodo {p}',
    periodText: 'La riga {p} della tavola, da {first} a {last}: atomi con {shells} di elettroni occupati.',
    shells: (p) => (p.n === 1 ? 'un solo guscio' : `${p.n} gusci`),
  },
  en: {
    banner: 'Explain mode',
    bannerHint: 'Highlight a word or right-click anything',
    exit: 'Exit',
    term: 'Term',
    ui: 'Feature',
    key: 'Shortcut',
    cat: 'Family',
    element: 'Element',
    substance: 'Substance',
    group: 'Group',
    period: 'Period',
    secret: 'Secret',
    none: 'Explain',
    shortcuts: 'Shortcuts',
    see: 'See also',
    back: 'Back',
    close: 'Close (Esc)',
    openCard: 'Open the card',
    loading: 'Looking it up…',
    notFound: 'I do not have an explanation for “{w}” yet.',
    notFoundHint: 'Try a single word, or right-click a button, an element or a value: I know the 118 elements, the lab substances, the terms of chemistry and physics and every command in the app.',
    elIntro: '{name} ({sym}) is {a} {cat}: each of its atoms has {z} protons in the nucleus.',
    elIntroUnknown: '{name} ({sym}) is a superheavy element: each of its atoms has {z} protons in the nucleus and its chemistry is not known yet.',
    elPos: 'It is in group {g}, period {p}, {b}-block.',
    elPosNoGroup: 'It is in period {p}, {b}-block.',
    elState: 'At 25 °C it is {state}.',
    states: { solid: 'solid', liquid: 'liquid', gas: 'a gas' },
    uses: 'Uses: {list}.',
    aka: 'Also known as: {list}.',
    molState: { gas: 'At 25 °C it is a gas.', liquido: 'At 25 °C it is liquid.', solido: 'At 25 °C it is solid.', soluzione: 'It only exists dissolved in water.' },
    groupTitle: 'Group {g}',
    groupText: 'Column {g} of the periodic table: {list}. Elements in the same column have the same number of outer electrons and behave alike.',
    periodTitle: 'Period {p}',
    periodText: 'Row {p} of the table, from {first} to {last}: atoms with {shells} of electrons.',
    shells: (p) => (p.n === 1 ? 'a single occupied shell' : `${p.n} occupied shells`),
  },
  eli6: {
    bannerHint: 'Evidenzia una parola o premi il tasto destro su qualsiasi cosa e te la spiego',
    notFound: 'Questa parola non la conosco ancora: «{w}».',
    notFoundHint: 'Prova con una parola sola, oppure premi il tasto destro su un pulsante, su un elemento o su un numero.',
    elPos: 'Sta nella colonna {g} e nella riga {p} della tavola.',
    elPosNoGroup: 'Sta nella riga {p} della tavola, in una delle due file staccate in basso.',
    groupText: 'La colonna {g} della tavola: {list}. Gli elementi della stessa colonna sono come una famiglia e si comportano in modo simile.',
    periodText: 'La riga {p} della tavola, da {first} a {last}: atomi con {shells} di elettroni.',
    shells: (p) => (p.n === 1 ? 'un solo piano' : `${p.n} piani`),
  },
});

const FAMILY_OF_GROUP = { 1: 'cat.alkali', 2: 'cat.alkaline-earth', 13: 'term.block', 14: 'term.block', 15: 'term.block', 16: 'term.block', 17: 'cat.halogen', 18: 'cat.noble-gas' };
const loadGlossary = () => import('../i18n/glossary.js');

export function createExplain(elements, { onModeChange, onOpenElement } = {}) {
  let on = false;
  let G = null; // modulo del glossario, quando caricato
  let lib = null; // libreria delle sostanze, quando caricata
  let libLoading = null;
  const resolvers = []; // risolutori aggiuntivi (testo normalizzato → voce)
  const history = [];

  // ---- elementi: nomi in tutte le lingue e simboli
  const byName = new Map();
  const bySymbol = new Map(elements.map((el) => [el.symbol, el]));
  const plain = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  for (const el of elements) for (const n of [el.name, el.nameIt, el.nameEn]) if (n) byName.set(plain(n), el);

  // ---- interfaccia
  const banner = document.createElement('div');
  banner.className = 'xp-banner';
  banner.hidden = true;
  banner.setAttribute('role', 'status');
  banner.innerHTML = `${icons.explain(16)}<b>${esc(t('banner'))}</b><span>${esc(t('bannerHint'))}</span><kbd>F1</kbd><button type="button" class="xp-banner__exit">${esc(t('exit'))}</button>`;
  const card = document.createElement('div');
  card.className = 'xp-card';
  card.hidden = true;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-live', 'polite');
  document.body.append(banner, card);
  banner.querySelector('.xp-banner__exit').addEventListener('click', () => setMode(false));

  let bannerTimer = 0;
  function setMode(v) {
    on = Boolean(v);
    // l'avviso resta qualche secondo: poi bastano il pulsante acceso e il cursore a punto interrogativo
    banner.hidden = !on;
    clearTimeout(bannerTimer);
    if (on) bannerTimer = setTimeout(() => (banner.hidden = true), 4500);
    document.documentElement.classList.toggle('is-explaining', on);
    document.querySelectorAll('[data-action="explain"]').forEach((b) => b.setAttribute('aria-pressed', String(on)));
    if (!on) close();
    else loadGlossary().then((m) => (G = m));
    onModeChange?.(on);
  }

  // ---- costruzione delle voci
  const kindOf = (key) => (key.startsWith('term.') ? 'term' : key.startsWith('cat.') ? 'cat' : 'ui');

  function glossaryEntry(key, extra = {}) {
    const e = G?.entry(key);
    if (!e) return null;
    const color = key.startsWith('cat.') ? CATEGORY[key.slice(4)]?.color : null;
    return { kind: kindOf(key), key, title: e.t, body: [].concat(e.d ?? []), keys: e.k, see: e.s, color, ...extra };
  }

  function elementEntry(el) {
    const cat = CATEGORY[el.category] ?? CATEGORY.unknown;
    const catName = cat.singular.toLowerCase();
    const body = [];
    if (isSimple() && el.simple) body.push(el.simple);
    else if (el.category === 'unknown') body.push(t('elIntroUnknown', { name: el.name, sym: el.symbol, z: el.z }));
    else body.push(t('elIntro', { name: el.name, sym: el.symbol, z: el.z, cat: catName, a: /^[aeiou]/i.test(catName) ? 'an' : 'a' }));
    body.push(el.group ? t('elPos', { g: el.group, p: el.period, b: el.block }) : t('elPosNoGroup', { p: el.period, b: el.block }));
    const st = t('states')[el.state];
    if (st && !el.statePredicted) body.push(t('elState', { state: st }));
    if (el.uses?.length) body.push(t('uses', { list: el.uses.slice(0, 3).map((u) => u.replace(/\.$/, '')).join('; ') }));
    return {
      kind: 'element',
      title: el.name,
      sub: `${el.symbol} · Z = ${el.z}`,
      color: cat.color,
      body,
      see: [`cat.${el.category}`, 'term.atomicNumber'],
      action: onOpenElement && !document.querySelector('.sbx:not([hidden]), .lab:not([hidden]), .atom-view:not([hidden])') ? { label: t('openCard'), run: () => onOpenElement(el.z) } : null,
    };
  }

  function groupEntry(g) {
    const list = elements.filter((el) => el.group === g).map((el) => el.name);
    return { kind: 'group', title: t('groupTitle', { g }), body: [t('groupText', { g, list: list.join(', ') })], see: [FAMILY_OF_GROUP[g] ?? (g >= 3 && g <= 12 ? 'cat.transition' : 'term.group'), 'term.group'] };
  }

  function periodEntry(p) {
    const row = elements.filter((el) => el.period === p);
    return {
      kind: 'period',
      title: t('periodTitle', { p }),
      body: [t('periodText', { p, first: row[0].name, last: row[row.length - 1].name, shells: t('shells', { n: p }) })],
      see: ['term.period', 'term.shell'],
    };
  }

  function keyEntry(text) {
    const s = G?.shortcut(text);
    if (!s) return null;
    return { kind: 'key', title: s.title, rows: s.rows, see: ['ui.explain'] };
  }

  function moleculeEntry(m) {
    const body = [];
    if (m.desc) body.push(m.desc);
    const aka = [m.aka, m.akaIt && m.akaIt !== m.aka && getLang() !== 'it' ? m.akaIt : null].filter(Boolean);
    if (aka.length) body.push(t('aka', { list: aka.join(', ') }));
    if (m.state && t('molState')[m.state]) body.push(t('molState')[m.state]);
    if (m.uses) body.push(t('uses', { list: String(m.uses).replace(/\.$/, '') }));
    return { kind: 'substance', title: m.name, sub: lib.formulaOf(m), body, see: ['term.molecule', 'lab.examples'] };
  }

  // ---- libreria delle sostanze (dal laboratorio), caricata alla prima ricerca che non trova nulla
  function loadLibrary() {
    libLoading ??= Promise.all([import('../lab/data/molecules.js'), import('../lab/chem/identify.js'), import('../lab/chem/smiles.js')]).then(([mol, idf, smi]) => {
      const labCtx = {
        get: (z) => elements[z - 1],
        bySymbol: new Map(elements.map((el) => [el.symbol, { z: el.z, en: el.electronegativity ?? 2, group: el.group }])),
      };
      const names = new Map();
      const formulas = new Map();
      const cache = new Map();
      const formulaOf = (m) => {
        if (cache.has(m.id)) return cache.get(m.id);
        let f = m.formula ?? '';
        if (!f) {
          try {
            const g = smi.parseSmiles(m.smiles, labCtx.bySymbol);
            const q = g.atoms.reduce((s, a) => s + (a.charge || 0), 0);
            f = idf.displayFormula(labCtx, g.atoms, q, { ionic: m.group === 'ionici' });
          } catch {
            f = '';
          }
        }
        cache.set(m.id, f);
        return f;
      };
      for (const m of mol.MOLECULES) {
        for (const n of [m.name, m.nameIt, ...String(m.aka ?? '').split(/,| o | or /), ...String(m.akaIt ?? '').split(/,| o /)]) {
          const k = plain(n);
          if (k && !names.has(k)) names.set(k, m);
        }
      }
      lib = { names, formulas, formulaOf, all: mol.MOLECULES };
      for (const m of mol.MOLECULES) {
        const f = formulaOf(m);
        if (f) {
          const k = G ? G.norm(f) : plain(f);
          if (!formulas.has(k)) formulas.set(k, m);
        }
      }
      return lib;
    });
    return libLoading;
  }

  // ---- ricerca di un testo (parola, frase, selezione)
  function lookupText(text, { exactSymbol = false } = {}) {
    const raw = String(text ?? '').trim();
    if (!raw || !G) return null;
    const n = G.norm(raw);
    for (const r of resolvers) {
      const hit = r(n, raw);
      if (hit) return hit;
    }
    if (exactSymbol && bySymbol.has(raw)) return elementEntry(bySymbol.get(raw));
    const idx = G.wordIndex();
    const words = n.split(' ');
    const forms = words.length === 1 ? G.variants(raw) : [n];
    for (const f of forms) {
      if (idx.has(f)) return glossaryEntry(idx.get(f));
      const el = byName.get(f);
      if (el) return elementEntry(el);
    }
    if (lib) {
      const m = lib.names.get(n) ?? lib.formulas.get(n);
      if (m) return moleculeEntry(m);
    }
    return null;
  }

  /** Prova le frasi di 4, 3, 2 e 1 parole attorno alla parola indicata, dalla più lunga. */
  function lookupPhrases(tokens, i) {
    for (let len = Math.min(4, tokens.length); len >= 1; len--) {
      for (let start = Math.max(0, i - len + 1); start <= i && start + len <= tokens.length; start++) {
        const hit = lookupText(tokens.slice(start, start + len).join(' '));
        if (hit) return hit;
      }
    }
    return null;
  }

  /** La parola sotto il punto (x, y) e le parole vicine dello stesso testo. */
  function wordAt(x, y) {
    let node;
    let offset;
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      node = r?.startContainer;
      offset = r?.startOffset;
    } else if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      node = p?.offsetNode;
      offset = p?.offset;
    }
    if (!node || node.nodeType !== Node.TEXT_NODE) return null;
    const text = node.data;
    const re = /[\p{L}\p{N}₀-₉⁰-⁹⁺⁻°]+(?:[-][\p{L}\p{N}₀-₉]+)*/gu;
    const tokens = [];
    let at = -1;
    for (let m; (m = re.exec(text)); ) {
      if (offset >= m.index && offset <= m.index + m[0].length && at < 0) at = tokens.length;
      tokens.push({ s: m[0], from: m.index, to: m.index + m[0].length });
    }
    if (at < 0) return null;
    // il punto deve stare davvero sopra la parola, non nello spazio vuoto accanto
    const range = document.createRange();
    range.setStart(node, tokens[at].from);
    range.setEnd(node, tokens[at].to);
    const rects = [...range.getClientRects()];
    if (!rects.some((r) => x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2)) return null;
    return { tokens: tokens.map((tk) => tk.s), i: at, word: tokens[at].s, node };
  }

  const CONTROL = 'button, label, summary, select, [role="button"], [role="menuitemradio"], .chip, .segmented__btn';

  /** Cosa c'è sotto il punto: dal più specifico (tasto, elemento, voce del glossario) al più generico. */
  async function resolveAt(target, x, y) {
    if (!G) G = await loadGlossary();
    const el = target instanceof Element ? target : target?.parentElement;
    if (!el) return null;

    const kbd = el.closest('kbd');
    if (kbd) {
      let text = kbd.textContent;
      const prev = kbd.previousElementSibling;
      if (prev?.matches('kbd') && /\+\s*$/.test(kbd.previousSibling?.textContent ?? '')) text = `${prev.textContent} + ${text}`;
      const e = keyEntry(text);
      if (e) return e;
    }

    // cose con un'identità precisa
    const z = el.closest('[data-z]')?.dataset.z ?? el.closest('.sbx-cell[data-id]')?.dataset.id;
    if (z && elements[Number(z) - 1]) return elementEntry(elements[Number(z) - 1]);
    const libItem = el.closest('.sbx-libitem');
    if (libItem) {
      await loadLibrary();
      const m = lib.names.get(plain(libItem.querySelector('.sbx-libitem__name')?.textContent));
      if (m) return moleculeEntry(m);
    }
    const cat = el.closest('[data-cat]')?.dataset.cat ?? el.closest('[data-series]')?.dataset.series;
    if (cat) return glossaryEntry(`cat.${cat}`);
    const group = el.closest('[data-group]')?.dataset.group;
    if (group && /^\d+$/.test(group)) return groupEntry(Number(group));
    const period = el.closest('[data-period]')?.dataset.period;
    if (period && /^\d+$/.test(period)) return periodEntry(Number(period));
    if (el.closest('.lang')) return glossaryEntry('ui.language');
    if (el.closest('.toolbar [data-state]')) return glossaryEntry('ui.stateFilter');
    if (el.closest('.toolbar [data-block]')) return glossaryEntry('term.block');

    // parola sotto il mouse e voce dell'interfaccia (data-help): vince la voce se l'oggetto è piccolo
    const w = wordAt(x, y);
    const exact = w && w.tokens.length === 1 && bySymbol.has(w.word) && w.node.data.trim() === w.word;
    let wordHit = w ? (exact ? elementEntry(bySymbol.get(w.word)) : lookupPhrases(w.tokens, w.i)) : null;
    const helpEl = el.closest('[data-help]');
    const helpHit = helpEl ? glossaryEntry(helpEl.dataset.help) : null;
    if (helpHit && (helpEl.textContent.length <= 120 || el.closest(CONTROL))) return helpHit;
    if (wordHit) return wordHit;
    if (w) {
      await loadLibrary();
      wordHit = lookupPhrases(w.tokens, w.i);
      if (wordHit) return wordHit;
    }
    if (helpHit) return helpHit;
    if (el.closest('.sbx-mats .sbx-item')) return glossaryEntry('sandbox.materials', { title: el.closest('.sbx-item').textContent.trim() });

    // pulsanti senza voce: il loro titolo o la loro etichetta
    const ctl = el.closest('[title], [aria-label]');
    const tip = ctl?.getAttribute('title') || ctl?.getAttribute('aria-label');
    if (tip) {
      const [head, ...rest] = tip.split(/:\s+/);
      const name = (rest.length ? head : ctl.textContent.trim()) || head;
      return { kind: 'ui', title: name, body: [rest.length ? rest.join(': ') : tip] };
    }
    return w ? notFound(w.word) : null;
  }

  async function resolveText(text) {
    if (!G) G = await loadGlossary();
    const clean = text.replace(/\s+/g, ' ').trim();
    let hit = lookupText(clean, { exactSymbol: true });
    if (!hit) {
      await loadLibrary();
      hit = lookupText(clean, { exactSymbol: true });
    }
    if (!hit && clean.includes(' ')) {
      const tokens = clean.split(' ');
      for (let i = 0; i < tokens.length && !hit; i++) hit = lookupPhrases(tokens, i);
    }
    return hit ?? notFound(clean);
  }

  const notFound = (word) => ({ kind: 'none', title: word.length > 40 ? `${word.slice(0, 40)}…` : word, body: [t('notFound', { w: word.length > 40 ? `${word.slice(0, 40)}…` : word }), t('notFoundHint')], see: ['ui.explain'] });

  // ---- scheda
  let anchor = { x: 0, y: 0 };
  function render(entry) {
    const seeChips = (entry.see ?? [])
      .map((k) => (k ? [k, G?.entry(k)?.t] : null))
      .filter((x) => x?.[1])
      .map(([k, title]) => `<button type="button" class="xp-chip" data-key="${esc(k)}">${esc(title)}</button>`)
      .join('');
    const keys = entry.keys?.length
      ? `<div class="xp-sec"><h4>${esc(t('shortcuts'))}</h4><dl class="xp-keys">${entry.keys.map(([k, d]) => `<dt>${k.split(' / ').map((x) => `<kbd>${esc(x)}</kbd>`).join(' / ')}</dt><dd>${esc(d)}</dd>`).join('')}</dl></div>`
      : '';
    const rows = entry.rows?.length ? `<dl class="xp-keys xp-keys--ctx">${entry.rows.map(([c, d]) => `<dt>${esc(c)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>` : '';
    card.className = `xp-card xp-card--${entry.kind}`;
    card.style.setProperty('--xc', entry.color ?? '');
    card.setAttribute('aria-label', entry.title);
    card.innerHTML = `
      <header class="xp-head">
        <button type="button" class="xp-icon xp-back" data-xp="back" title="${esc(t('back'))}" aria-label="${esc(t('back'))}" ${history.length ? '' : 'hidden'}>${icons.prev(14)}</button>
        <span class="xp-kind">${entry.kind === 'secret' ? icons.sparkle(12) : ''}${esc(t(entry.kind))}</span>
        <button type="button" class="xp-icon xp-close" data-xp="close" title="${esc(t('close'))}" aria-label="${esc(t('close'))}">×</button>
      </header>
      <h3 class="xp-title">${esc(entry.title)}${entry.sub ? ` <small>${esc(entry.sub)}</small>` : ''}</h3>
      <div class="xp-body">${(entry.body ?? []).map((p) => `<p>${esc(p)}</p>`).join('')}${entry.html ?? ''}</div>
      ${rows}${keys}
      ${seeChips ? `<div class="xp-sec"><h4>${esc(t('see'))}</h4><div class="xp-chips">${seeChips}</div></div>` : ''}
      ${entry.action ? `<footer class="xp-foot"><button type="button" class="btn-ghost" data-xp="action">${esc(entry.action.label)}</button></footer>` : ''}
      ${entry.foot ? `<p class="xp-note">${esc(entry.foot)}</p>` : ''}`;
    // sopra un dialogo modale (Informazioni) la scheda deve stare dentro il dialogo, altrimenti resta sotto
    const host = document.querySelector('dialog[open]') ?? document.body;
    if (card.parentElement !== host) host.append(card);
    card.hidden = false;
    current = entry;
    place();
  }
  let current = null;

  function place() {
    const m = 12;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let x = anchor.x + 16;
    let y = anchor.y + 16;
    if (x + w > innerWidth - m) x = Math.max(m, anchor.x - w - 16);
    if (y + h > innerHeight - m) y = Math.max(m, innerHeight - h - m);
    card.style.left = `${Math.round(x)}px`;
    card.style.top = `${Math.round(y)}px`;
  }

  function show(entry, point) {
    if (!entry) return;
    if (point) anchor = point;
    if (!card.hidden && current && point === undefined) history.push(current);
    else if (point) history.length = 0;
    render(entry);
  }

  function close() {
    card.hidden = true;
    current = null;
    history.length = 0;
  }

  card.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-xp], [data-key]');
    if (!b) return;
    if (b.dataset.key) {
      if (!G) G = await loadGlossary();
      const e = glossaryEntry(b.dataset.key);
      if (e) show(e);
    } else if (b.dataset.xp === 'close') close();
    else if (b.dataset.xp === 'back' && history.length) render(history.pop());
    else if (b.dataset.xp === 'action') {
      const run = current?.action?.run;
      close();
      run?.();
    }
  });

  // ---- eventi
  async function explainPoint(ev) {
    const point = { x: ev.clientX, y: ev.clientY };
    const inCard = card.contains(ev.target);
    const entry = await resolveAt(ev.target, point.x, point.y);
    if (!entry) return;
    if (inCard) show(entry);
    else show(entry, point);
  }

  window.addEventListener(
    'contextmenu',
    (ev) => {
      if (!on && !card.contains(ev.target)) return;
      if (ev.target instanceof Element && ev.target.closest('input, textarea, [contenteditable="true"]')) return;
      ev.preventDefault();
      ev.stopPropagation();
      explainPoint(ev);
    },
    true,
  );
  // in modalità Spiega il tasto destro non deve anche cancellare, ruotare o rompere legami
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
    window.addEventListener(
      type,
      (ev) => {
        if (ev.button === 2 && (on || card.contains(ev.target))) {
          ev.stopPropagation();
          if (type.endsWith('down')) ev.preventDefault();
        }
      },
      true,
    );
  }
  window.addEventListener(
    'pointerdown',
    (ev) => {
      if (ev.button === 0 && !card.hidden && !card.contains(ev.target) && !banner.contains(ev.target)) close();
    },
    true,
  );
  document.addEventListener('mouseup', (ev) => {
    if (ev.button !== 0 || (!on && !card.contains(ev.target))) return;
    setTimeout(async () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (!text || text.length > 80 || sel.rangeCount === 0) return;
      const node = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
      if (node?.closest('input, textarea')) return;
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const inCard = card.contains(node);
      const entry = await resolveText(text);
      if (inCard) show(entry);
      else show(entry, { x: r.left, y: r.bottom });
    }, 0);
  });
  window.addEventListener(
    'keydown',
    (ev) => {
      if (ev.key === 'F1') {
        ev.preventDefault();
        ev.stopPropagation();
        setMode(!on);
      } else if (ev.key === 'Escape' && !card.hidden) {
        // Esc chiude solo la scheda: la modalità si spegne con F1 o con il pulsante
        ev.preventDefault();
        ev.stopPropagation();
        close();
      }
    },
    true,
  );
  document.addEventListener('click', (ev) => {
    if (ev.target instanceof Element && ev.target.closest('[data-action="explain"]')) setMode(!on);
  });
  window.addEventListener('resize', () => !card.hidden && place());

  return {
    toggle: () => setMode(!on),
    isOn: () => on,
    /** Mostra una scheda già pronta (usata anche dai segreti). */
    showCard(entry, point = { x: innerWidth / 2 - 180, y: innerHeight / 3 }) {
      history.length = 0;
      anchor = point;
      render(entry);
    },
    /** Aggiunge un riconoscitore di parole: (testo normalizzato, testo originale) → voce o null. */
    addResolver(fn) {
      resolvers.push(fn);
    },
  };
}
