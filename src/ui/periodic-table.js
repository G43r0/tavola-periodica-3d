// Vista tavola periodica: griglia IUPAC 18 colonne con lantanidi e attinidi separati.
import { CATEGORY } from '../data/categories.js';
import { fmtMass, esc } from '../chem/format.js';
import { computeVisibility } from '../state/query.js';
import { createInspector } from './inspector.js';

// Proporzioni della griglia rispetto al lato della cella
const LABEL_W = 0.42; // colonna dei numeri di periodo
const HEAD_H = 0.36; // riga dei numeri di gruppo
const GAP_ROW = 0.3; // spazio prima di lantanidi/attinidi
const GAP = 0.06;
const MIN_CELL = 32;
const MAX_CELL = 116;

const SERIES = {
  lanthanide: { label: 'Lantanidi', range: '57–71', from: 'La', to: 'Lu', y: 9, period: 6 },
  actinide: { label: 'Attinidi', range: '89–103', from: 'Ac', to: 'Lr', y: 10, period: 7 },
};

// riga 1 = numeri di gruppo, righe 2–8 = periodi, riga 9 = spazio, righe 10–11 = lantanidi/attinidi
const gridRow = (y) => y + 1;
const gridCol = (x) => x + 1; // colonna 1 = periodi
const seriesOf = (el) => (el.grid.y === 9 ? 'lanthanide' : el.grid.y === 10 ? 'actinide' : null);

export function createPeriodicTable(stage, elements, store, { onOpen }) {
  const byZ = new Map(elements.map((e) => [e.z, e]));
  const byPos = new Map(elements.map((e) => [`${e.grid.x},${e.grid.y}`, e]));

  const grid = document.createElement('div');
  grid.className = 'ptable is-entering';
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Tavola periodica degli elementi');

  // ---- intestazioni di gruppo e periodo
  const groupHeads = new Map();
  for (let g = 1; g <= 18; g++) {
    const h = document.createElement('div');
    h.className = 'ptable__group';
    h.style.gridArea = `1 / ${gridCol(g)}`;
    h.textContent = g;
    h.dataset.group = g;
    h.title = `Gruppo ${g}`;
    grid.append(h);
    groupHeads.set(g, h);
  }
  const periodHeads = new Map();
  for (let p = 1; p <= 7; p++) {
    const h = document.createElement('div');
    h.className = 'ptable__period';
    h.style.gridArea = `${gridRow(p)} / 1`;
    h.textContent = p;
    h.dataset.period = p;
    h.title = `Periodo ${p}`;
    grid.append(h);
    periodHeads.set(p, h);
  }

  // ---- etichette delle serie e segnaposto nel gruppo 3
  const seriesLabels = new Map();
  const placeholders = new Map();
  for (const [key, s] of Object.entries(SERIES)) {
    const label = document.createElement('div');
    label.className = 'ptable__series-label';
    label.style.gridArea = `${gridRow(s.y)} / 1 / span 1 / span 3`;
    label.style.setProperty('--c', CATEGORY[key].color);
    label.innerHTML = `<span>${s.label}</span><small>${s.range}</small>`;
    label.dataset.series = key;
    grid.append(label);
    seriesLabels.set(key, label);

    const ph = document.createElement('div');
    ph.className = 'cell cell--placeholder';
    ph.style.gridArea = `${gridRow(s.period)} / ${gridCol(3)}`;
    ph.style.setProperty('--c', CATEGORY[key].color);
    ph.dataset.series = key;
    ph.title = `${s.label} (${s.range}): vedi la riga in basso`;
    ph.innerHTML = `<span class="cell__range">${s.range}</span><span class="cell__name">${s.from}–${s.to}</span>`;
    grid.append(ph);
    placeholders.set(key, ph);
  }

  // ---- pannello di anteprima nello spazio vuoto (gruppi 3–12, periodi 1–3)
  const inspectorHost = document.createElement('div');
  inspectorHost.className = 'ptable__inspector';
  inspectorHost.style.gridArea = `${gridRow(1)} / ${gridCol(3)} / span 3 / span 10`;
  grid.append(inspectorHost);
  const inspector = createInspector(inspectorHost);

  // ---- celle degli elementi
  const cells = new Map();
  for (const el of elements) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.dataset.z = el.z;
    btn.style.gridArea = `${gridRow(el.grid.y)} / ${gridCol(el.grid.x)}`;
    btn.style.setProperty('--c', CATEGORY[el.category].color);
    btn.style.setProperty('--i', el.grid.x + el.grid.y * 1.6);
    btn.tabIndex = el.z === 1 ? 0 : -1;
    if (el.dataQuality === 'predicted') btn.classList.add('cell--predicted');
    btn.setAttribute(
      'aria-label',
      `${el.name}, simbolo ${el.symbol}, numero atomico ${el.z}, massa atomica ${fmtMass(el.atomicMass)}`,
    );
    btn.innerHTML = `
      <span class="cell__z">${el.z}</span>
      <span class="cell__sym">${esc(el.symbol)}</span>
      <span class="cell__name">${esc(el.name)}</span>
      <span class="cell__mass">${esc(fmtMass(el.atomicMass))}</span>`;
    grid.append(btn);
    cells.set(el.z, btn);
  }

  stage.append(grid);
  setTimeout(() => grid.classList.remove('is-entering'), 1400);

  // ---------------------------------------------------------- dimensionamento
  const fit = () => {
    const cs = getComputedStyle(stage);
    const width = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const height = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const byW = width / (18 + LABEL_W + 18 * GAP);
    const byH = height / (9 + HEAD_H + GAP_ROW + 10 * GAP);
    const cell = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(Math.min(byW, byH))));
    grid.style.setProperty('--cell', `${cell}px`);
    grid.style.setProperty('--gap', `${Math.max(2, Math.round(cell * GAP))}px`);
    grid.classList.toggle('is-compact', cell < 64);
    grid.classList.toggle('is-tiny', cell < 52);
    grid.classList.toggle('is-mini', cell < 46); // solo numero atomico e simbolo
  };
  new ResizeObserver(() => requestAnimationFrame(fit)).observe(stage);
  fit();

  // ---------------------------------------------------------- hover
  let hover = null; // { kind: 'element'|'group'|'period'|'series', value }
  const lit = new Set();

  function applyHover(next) {
    hover = next;
    lit.forEach((n) => n.classList.remove('is-hover', 'is-related', 'is-lit'));
    lit.clear();
    // passando su un elemento si evidenzia solo la sua cella (niente strisce di gruppo e periodo)
    grid.classList.toggle('is-hovering', Boolean(next) && next.kind !== 'element');
    const mark = (node, cls) => {
      if (!node) return;
      node.classList.add(cls);
      lit.add(node);
    };
    if (!next) {
      inspector.show(store.get().selectedZ ? byZ.get(store.get().selectedZ) : null, { pinned: true });
      return;
    }

    let group = null;
    let period = null;
    let series = null;
    let category = null;
    if (next.kind === 'category') category = next.value;
    else if (next.kind === 'element') {
      const el = byZ.get(next.value);
      mark(cells.get(el.z), 'is-hover');
      inspector.show(el);
      return;
    } else if (next.kind === 'group') group = next.value;
    else if (next.kind === 'period') period = next.value;
    else if (next.kind === 'series') series = next.value;

    for (const el of elements) {
      const related =
        (group !== null && el.group === group) ||
        (period !== null && el.period === period) ||
        (series !== null && seriesOf(el) === series) ||
        (category !== null && el.category === category);
      if (related) mark(cells.get(el.z), 'is-related');
    }
    if (group !== null) mark(groupHeads.get(group), 'is-lit');
    if (period !== null) mark(periodHeads.get(period), 'is-lit');
    if (series) {
      mark(seriesLabels.get(series), 'is-lit');
      mark(placeholders.get(series), 'is-lit');
    }
  }

  grid.addEventListener('pointerover', (ev) => {
    const t = ev.target.closest('[data-z], [data-group], [data-period], [data-series]');
    if (!t || !grid.contains(t)) return;
    let next = null;
    if (t.dataset.z) next = { kind: 'element', value: Number(t.dataset.z) };
    else if (t.dataset.group) next = { kind: 'group', value: Number(t.dataset.group) };
    else if (t.dataset.period) next = { kind: 'period', value: Number(t.dataset.period) };
    else if (t.dataset.series) next = { kind: 'series', value: t.dataset.series };
    if (!hover || hover.kind !== next.kind || hover.value !== next.value) applyHover(next);
  });
  grid.addEventListener('pointerleave', () => applyHover(null));

  // ---------------------------------------------------------- click e tastiera
  grid.addEventListener('click', (ev) => {
    const cell = ev.target.closest('.cell[data-z]');
    if (cell) onOpen(Number(cell.dataset.z));
  });

  grid.addEventListener('focusin', (ev) => {
    const cell = ev.target.closest('.cell[data-z]');
    if (!cell) return;
    cells.forEach((c) => (c.tabIndex = -1));
    cell.tabIndex = 0;
    if (ev.target.matches(':focus-visible')) applyHover({ kind: 'element', value: Number(cell.dataset.z) });
  });
  grid.addEventListener('focusout', (ev) => {
    if (!grid.contains(ev.relatedTarget)) applyHover(null);
  });

  const DIRS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const rows = [1, 2, 3, 4, 5, 6, 7, 9, 10];

  function neighbour(el, [dx, dy]) {
    if (dx) {
      for (let x = el.grid.x + dx; x >= 1 && x <= 18; x += dx) {
        const n = byPos.get(`${x},${el.grid.y}`);
        if (n) return n;
      }
      return null;
    }
    let idx = rows.indexOf(el.grid.y) + dy;
    while (idx >= 0 && idx < rows.length) {
      const y = rows[idx];
      // stessa colonna se esiste, altrimenti la più vicina nella riga
      let best = null;
      for (const n of elements) {
        if (n.grid.y !== y) continue;
        if (!best || Math.abs(n.grid.x - el.grid.x) < Math.abs(best.grid.x - el.grid.x)) best = n;
      }
      if (best) return best;
      idx += dy;
    }
    return null;
  }

  grid.addEventListener('keydown', (ev) => {
    const cell = ev.target.closest('.cell[data-z]');
    if (!cell) return;
    const el = byZ.get(Number(cell.dataset.z));
    let target = null;
    if (DIRS[ev.key]) target = neighbour(el, DIRS[ev.key]);
    else if (ev.key === 'Home') target = byZ.get(1);
    else if (ev.key === 'End') target = byZ.get(118);
    else return;
    ev.preventDefault();
    if (!target) return;
    cells.get(target.z).focus();
    if (store.get().selectedZ) onOpen(target.z);
  });

  // ---------------------------------------------------------- reazione allo stato
  function render(s, prev) {
    const filtersChanged =
      !prev ||
      s.query !== prev.query ||
      s.categories !== prev.categories ||
      s.physState !== prev.physState ||
      s.blocks !== prev.blocks;

    if (filtersChanged) {
      const { visible } = computeVisibility(elements, s);
      const active = visible.size !== elements.length;
      grid.classList.toggle('is-filtering', active);
      for (const [z, cell] of cells) {
        const on = visible.has(z);
        cell.classList.toggle('is-out', !on);
        cell.classList.toggle('is-match', active && on && Boolean(s.query));
      }
      for (const [key, ph] of placeholders) {
        const any = elements.some((el) => seriesOf(el) === key && visible.has(el.z));
        ph.classList.toggle('is-out', !any);
      }
    }

    if (!prev || s.selectedZ !== prev.selectedZ) {
      if (prev?.selectedZ) cells.get(prev.selectedZ)?.classList.remove('is-selected');
      if (s.selectedZ) cells.get(s.selectedZ)?.classList.add('is-selected');
      if (!hover) inspector.show(s.selectedZ ? byZ.get(s.selectedZ) : null, { pinned: true });
    }
  }
  store.subscribe(render);
  render(store.get(), null);

  return {
    focusCell(z) {
      cells.get(z)?.focus({ preventScroll: true });
    },
    highlightCategory(key) {
      applyHover(key ? { kind: 'category', value: key } : null);
    },
  };
}
