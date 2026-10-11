// Icone SVG inline (stroke = currentColor).

const svg = (body, size = 18, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const icons = {
  atom: (s = 22) =>
    svg(
      `<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>`,
      s,
    ),
  search: (s) => svg(`<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>`, s),
  clipboard: (s) => svg(`<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 3h6v3.5H9zM8.5 11.5h7M8.5 15.5h4.5"/>`, s),
  close: (s) => svg(`<path d="M6 6l12 12M18 6 6 18"/>`, s),
  prev: (s) => svg(`<path d="m15 18-6-6 6-6"/>`, s),
  next: (s) => svg(`<path d="m9 18 6-6-6-6"/>`, s),
  cube: (s) => svg(`<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/>`, s),
  info: (s) => svg(`<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.01"/>`, s),
  reset: (s) => svg(`<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>`, s),
  warn: (s) => svg(`<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>`, s),
  solid: (s) => svg(`<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M5 12h14M12 5v14"/>`, s),
  liquid: (s) => svg(`<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>`, s),
  gas: (s) => svg(`<path d="M4 9h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/><path d="M6 19h4"/>`, s),
  unknown: (s) => svg(`<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01"/>`, s),
  play: (s) => svg(`<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>`, s),
  pause: (s) => svg(`<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>`, s),
  sliders: (s) => svg(`<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>`, s),
  explode: (s) => svg(`<circle cx="12" cy="12" r="2.2"/><circle cx="5" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/><path d="M7 7l2.6 2.6M17 7l-2.6 2.6M7 17l2.6-2.6M17 17l-2.6-2.6"/>`, s),
  zoom: (s) => svg(`<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6"/>`, s),
  flask: (s) => svg(`<path d="M9 3h6M10 3v6.5L4.6 18.2A1.8 1.8 0 0 0 6.1 21h11.8a1.8 1.8 0 0 0 1.5-2.8L14 9.5V3"/><path d="M7.2 14h9.6"/>`, s),
  move: (s) => svg(`<path d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>`, s),
  link: (s) => svg(`<circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M9 12h6"/>`, s),
  scissors: (s) => svg(`<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8.2 7.6 20 18M8.2 16.4 20 6"/>`, s),
  merge: (s) => svg(`<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="18" cy="12" r="3"/><path d="M7 7l8 3.6M7 17l8-3.6"/>`, s),
  split: (s) => svg(`<circle cx="12" cy="12" r="2.4"/><circle cx="4.5" cy="5" r="1.8"/><circle cx="19.5" cy="5" r="1.8"/><circle cx="12" cy="20.5" r="1.8"/><path d="M10.2 10.4 6 6.4M13.8 10.4 18 6.4M12 14.5v4.2" stroke-dasharray="2 2"/>`, s),
  undo: (s) => svg(`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`, s),
  redo: (s) => svg(`<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>`, s),
  trash: (s) => svg(`<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>`, s),
  plus: (s) => svg(`<path d="M12 5v14M5 12h14"/>`, s),
  minus: (s) => svg(`<path d="M5 12h14"/>`, s),
  book: (s) => svg(`<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>`, s),
  broom: (s) => svg(`<path d="M15 3 9.5 12.5"/><path d="M6 13h8l1.5 8H4.5z"/><path d="M8 17v4M11.5 17v4"/>`, s),
  keyboard: (s) => svg(`<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>`, s),
};
