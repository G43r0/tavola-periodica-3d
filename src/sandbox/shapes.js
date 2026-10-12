// Forme geometriche per la sandbox: linea, rettangolo, ellisse (pieni o solo contorno) come elenco di celle.
// Modulo puro, provato dai test.

/** Celle della linea (x0,y0)→(x1,y1), con l'algoritmo di Bresenham. */
export function lineCells(x0, y0, x1, y1) {
  const cells = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    cells.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return cells;
}

/** Celle del rettangolo con due angoli opposti (x0,y0) e (x1,y1). */
export function rectCells(x0, y0, x1, y1, filled) {
  const xa = Math.min(x0, x1);
  const xb = Math.max(x0, x1);
  const ya = Math.min(y0, y1);
  const yb = Math.max(y0, y1);
  const cells = [];
  for (let y = ya; y <= yb; y++) {
    for (let x = xa; x <= xb; x++) {
      if (filled || x === xa || x === xb || y === ya || y === yb) cells.push([x, y]);
    }
  }
  return cells;
}

/** Celle dell'ellisse inscritta nel rettangolo di angoli (x0,y0) e (x1,y1). */
export function ellipseCells(x0, y0, x1, y1, filled) {
  const xa = Math.min(x0, x1);
  const xb = Math.max(x0, x1);
  const ya = Math.min(y0, y1);
  const yb = Math.max(y0, y1);
  const cx = (xa + xb) / 2;
  const cy = (ya + yb) / 2;
  const rx = (xb - xa) / 2 + 0.5;
  const ry = (yb - ya) / 2 + 0.5;
  const inside = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const cells = [];
  for (let y = ya; y <= yb; y++) {
    for (let x = xa; x <= xb; x++) {
      if (!inside(x, y)) continue;
      // il contorno: le celle interne che toccano l'esterno
      if (filled || !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) cells.push([x, y]);
    }
  }
  return cells;
}

/** @param {'line'|'rect'|'ellipse'} kind */
export function shapeCells(kind, x0, y0, x1, y1, filled = false) {
  if (kind === 'line') return lineCells(x0, y0, x1, y1);
  if (kind === 'rect') return rectCells(x0, y0, x1, y1, filled);
  if (kind === 'ellipse') return ellipseCells(x0, y0, x1, y1, filled);
  return [[x1, y1]];
}
