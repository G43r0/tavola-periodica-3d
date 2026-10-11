// Mini modello di Bohr in SVG: nucleo + gusci con il numero corretto di elettroni.
// Anteprima 2D; il modello 3D completo è nel visualizzatore (fase 2).

let uid = 0;

export function bohrSvg(el, { size = 120, animated = true } = {}) {
  const id = `bohr${++uid}`;
  const c = size / 2;
  const shells = el.shells;
  const n = shells.length;
  const rNuc = size * 0.075;
  const rMin = rNuc + size * 0.07;
  const rMax = size * 0.47;
  const step = n > 1 ? (rMax - rMin) / (n - 1) : 0;

  const rings = shells
    .map((count, i) => {
      const r = n > 1 ? rMin + i * step : (rMin + rMax) / 2;
      const dotR = Math.max(0.9, Math.min(size * 0.024, ((2 * Math.PI * r) / count) * 0.28));
      const offset = i * 0.7;
      const dots = Array.from({ length: count }, (_, k) => {
        const a = (2 * Math.PI * k) / count + offset;
        return `<circle cx="${(c + r * Math.cos(a)).toFixed(2)}" cy="${(c + r * Math.sin(a)).toFixed(2)}" r="${dotR.toFixed(2)}"/>`;
      }).join('');
      const dur = (6 + i * 3.5).toFixed(1);
      const dir = i % 2 ? 'reverse' : 'normal';
      return `
        <circle class="bohr__orbit" cx="${c}" cy="${c}" r="${r.toFixed(2)}"/>
        <g class="bohr__shell" style="animation-duration:${dur}s;animation-direction:${dir}" fill="var(--electron)">${dots}</g>`;
    })
    .join('');

  // nucleo stilizzato: piccolo grappolo di protoni (rossi) e neutroni (grigio-blu)
  const blob = [];
  const k = Math.min(9, 2 + Math.round(Math.log2(el.z + 1)));
  for (let i = 0; i < k; i++) {
    const a = i * 2.39996; // angolo aureo
    const rr = rNuc * 0.55 * Math.sqrt(i / k);
    const fill = i % 2 ? 'var(--neutron)' : 'var(--proton)';
    blob.push(`<circle cx="${(c + rr * Math.cos(a)).toFixed(2)}" cy="${(c + rr * Math.sin(a)).toFixed(2)}" r="${(rNuc * 0.42).toFixed(2)}" fill="${fill}"/>`);
  }

  return `
    <svg class="bohr ${animated ? 'is-animated' : ''}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img"
         aria-label="Modello di Bohr: ${shells.join(', ')} elettroni per guscio">
      <defs>
        <radialGradient id="${id}g">
          <stop offset="0" stop-color="var(--c, var(--accent))" stop-opacity="0.35"/>
          <stop offset="1" stop-color="var(--c, var(--accent))" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="${c}" cy="${c}" r="${(rNuc * 2.4).toFixed(2)}" fill="url(#${id}g)"/>
      ${rings}
      <g class="bohr__nucleus">${blob.join('')}</g>
    </svg>`;
}
