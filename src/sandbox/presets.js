// Esempi pronti della sandbox: esperimenti classici costruiti sulla griglia (coordinate pensate per 320 × 180
// e riscalate sulla griglia scelta). Ogni esempio restituisce le etichette da disegnare e un suggerimento.
import { AMBIENT, SOLID, WOOD, COAL, CONCRETE, WALL, WATER, OXIDE, SALT, GENERATOR, saltCtype } from './substances.js';
import { C_POWDER } from './world.js';

function tools(world) {
  const { W, H } = world;
  const sx = W / 320;
  const sy = H / 180;
  const X = (v) => Math.round(v * sx);
  const Y = (v) => Math.round(v * sy);
  const set = (x, y, id, o = {}) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return -1;
    const i = y * W + x;
    world.setType(i, id, o.temp ?? AMBIENT, o.ctype ?? 0);
    if (o.powder !== undefined && world.phaseOf(id, world.temp[i]) === SOLID) {
      if (o.powder) world.flags[i] |= C_POWDER;
      else world.flags[i] &= ~C_POWDER;
    }
    if (o.burn) world.setBurning(i);
    return i;
  };
  /** Rettangolo pieno (coordinate già in celle, estremi inclusi). */
  const rect = (x0, y0, x1, y1, id, o) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, id, o);
  };
  /** Contorno di un rettangolo; `open` lascia aperto il lato superiore. */
  const box = (x0, y0, x1, y1, id, { open = false, t = 1 } = {}) => {
    rect(x0, y1 - t + 1, x1, y1, id);
    rect(x0, y0, x0 + t - 1, y1, id);
    rect(x1 - t + 1, y0, x1, y1, id);
    if (!open) rect(x0, y0, x1, y0 + t - 1, id);
  };
  /** Miscuglio casuale di sostanze: [[id, opzioni, peso], …]. */
  const mixture = (x0, y0, x1, y1, parts) => {
    const total = parts.reduce((s, p) => s + (p[2] ?? 1), 0);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let r = world.rand() * total;
        for (const [id, o, w = 1] of parts) {
          if ((r -= w) < 0) {
            set(x, y, id, o);
            break;
          }
        }
      }
    }
  };
  const ground = () => rect(0, H - Y(6), W - 1, H - 1, CONCRETE);
  return { W, H, X, Y, set, rect, box, mixture, ground };
}

const Z = (subs, symbol) => subs.byKey.get(symbol).id;

export const PRESETS = [
  {
    id: 'alcalini',
    name: 'Metalli alcalini in acqua',
    description: 'Litio, sodio e potassio galleggiano e reagiscono: idrogeno, calore e la fiamma lilla del potassio.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      t.box(X(30), Y(110), X(290), t.H - Y(6), CONCRETE, { open: true, t: 3 });
      t.rect(X(30) + 3, Y(128), X(290) - 3, t.H - Y(6) - 3, WATER);
      const labels = [];
      [['Li', 85], ['Na', 160], ['K', 235]].forEach(([s, x]) => {
        t.rect(X(x) - 5, Y(60), X(x) + 5, Y(66), Z(subs, s), { powder: true });
        labels.push({ x: X(x), y: Y(52), text: subs.byKey.get(s).name });
      });
      return { labels, hint: 'Prova anche rubidio e cesio: reagiscono in modo esplosivo.' };
    },
  },
  {
    id: 'fiamma',
    name: 'Saggio alla fiamma',
    description: 'Sette cloruri sopra fuochi di legna: ogni metallo colora la fiamma in modo diverso.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      const metals = ['Li', 'Na', 'K', 'Ca', 'Sr', 'Ba', 'Cu'];
      const labels = [];
      metals.forEach((s, k) => {
        const cx = X(30 + k * 43);
        const top = t.H - Y(6) - Y(14);
        const salt = { ctype: saltCtype(Z(subs, s), Z(subs, 'Cl')), powder: true };
        // legna imbevuta di sale, con un mucchietto di sale sopra
        t.mixture(cx - X(9), top, cx + X(9), t.H - Y(6) - 1, [[WOOD, {}, 4], [SALT, salt, 1]]);
        for (let x = cx - X(9); x <= cx + X(9); x++) t.set(x, top, WOOD, { burn: true });
        t.rect(cx - X(7), top - 3, cx + X(7), top - 1, SALT, salt);
        labels.push({ x: cx, y: top - Y(40), text: `${s}Cl${s === 'Ca' || s === 'Sr' || s === 'Ba' || s === 'Cu' ? '₂' : ''}` });
      });
      return { labels, hint: 'Aggiungi sale con il pennello per ravvivare i colori; prova anche boro e tallio in polvere.' };
    },
  },
  {
    id: 'termite',
    name: 'Termite',
    description: 'Alluminio e ruggine innescati dal magnesio: ferro fuso a oltre 2 500 °C che buca il crogiolo.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      const fe = Z(subs, 'Fe');
      // lastra di ferro su due pilastri
      t.rect(X(110), Y(150), X(210), Y(155), fe, { powder: false });
      t.rect(X(112), Y(156), X(118), t.H - Y(6) - 1, CONCRETE);
      t.rect(X(202), Y(156), X(208), t.H - Y(6) - 1, CONCRETE);
      // crogiolo di calcestruzzo
      t.box(X(135), Y(85), X(185), Y(125), CONCRETE, { open: true, t: 3 });
      t.mixture(X(135) + 3, Y(97), X(185) - 3, Y(125) - 3, [
        [Z(subs, 'Al'), { powder: true }, 1],
        [OXIDE, { ctype: fe, powder: true }, 1],
      ]);
      // innesco: magnesio acceso
      const mg = Z(subs, 'Mg');
      t.rect(X(152), Y(95), X(168), Y(96), mg, { powder: true });
      for (let x = X(152); x <= X(168); x++) t.set(x, Y(95), mg, { powder: true, burn: true });
      return {
        labels: [{ x: X(160), y: Y(78), text: 'Al + Fe₂O₃' }, { x: X(160), y: Y(146), text: 'lastra di ferro' }],
        hint: 'Il fuoco della legna (≈ 900 °C) non basta: serve il magnesio, che brucia a oltre 2 800 °C.',
      };
    },
  },
  {
    id: 'fissione',
    name: 'Reazione a catena',
    description: 'Un blocco di plutonio e barre di uranio in acqua con barre di cadmio: lancia i neutroni e guarda.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.rect(0, t.H - Y(6), t.W - 1, t.H - 1, WALL);
      // bunker con il plutonio
      t.box(X(20), Y(70), X(120), t.H - Y(6), WALL, { open: true, t: 2 });
      t.rect(X(52), Y(120), X(88), t.H - Y(6) - 2, Z(subs, 'Pu'), { powder: false });
      // reattore: uranio in acqua, cadmio come barre di controllo
      t.box(X(160), Y(80), X(300), t.H - Y(6), CONCRETE, { open: true, t: 3 });
      t.rect(X(160) + 3, Y(92), X(300) - 3, t.H - Y(6) - 3, WATER);
      for (let k = 0; k < 6; k++) {
        const x = X(175 + k * 22);
        t.rect(x, Y(110), x + X(4), t.H - Y(6) - 4, Z(subs, 'U'), { powder: false });
        if (k < 5) t.rect(x + X(11), Y(84), x + X(12), Y(150), Z(subs, 'Cd'), { powder: false });
      }
      return {
        labels: [{ x: X(70), y: Y(62), text: 'plutonio (massa critica)' }, { x: X(230), y: Y(72), text: 'uranio + acqua (moderatore) + cadmio' }],
        hint: 'Scegli lo strumento Neutroni e cliccaci sopra. Con la Gomma togli le barre di cadmio e il reattore si accende.',
      };
    },
  },
  {
    id: 'neon',
    name: 'Scarica nei gas',
    description: 'Tubi di elio, neon, argon, kripton, xeno e idrogeno collegati a un generatore: ogni gas ha il suo colore.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const gases = ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'H'];
      const labels = [];
      const cu = Z(subs, 'Cu');
      gases.forEach((s, k) => {
        const y0 = Y(18 + k * 26);
        const y1 = y0 + Y(14);
        t.box(X(50), y0, X(290), y1, WALL);
        t.rect(X(50) + 1, y0 + 1, X(290) - 1, y1 - 1, Z(subs, s));
        t.rect(X(50) + 1, y0 + 1, X(50) + 2, y1 - 1, cu, { powder: false });
        t.rect(X(50) - 4, y0 + 2, X(50), y1 - 2, cu, { powder: false });
        t.rect(X(50) - 8, y0 + 2, X(50) - 5, y1 - 2, GENERATOR);
        labels.push({ x: X(25), y: Math.round((y0 + y1) / 2) + 3, text: subs.byKey.get(s).name });
      });
      return { labels, hint: 'I generatori mandano un impulso ogni 0,2 s attraverso il rame; prova a disegnare un tubo con il mercurio scaldato.' };
    },
  },
  {
    id: 'decadimento',
    name: 'Decadimento radioattivo',
    description: 'Radio, radon e astato in scatole chiuse: si formano elio, radon, polonio e alla fine piombo.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.rect(0, t.H - Y(6), t.W - 1, t.H - 1, WALL);
      const items = [['Ra', 'radio → radon → polonio → piombo'], ['Rn', 'radon → polonio → piombo'], ['At', 'astato → polonio → piombo']];
      const labels = [];
      items.forEach(([s, text], k) => {
        const x0 = X(15 + k * 102);
        const x1 = x0 + X(88);
        t.box(x0, Y(40), x1, t.H - Y(6), WALL, { t: 2 });
        if (s === 'Rn') t.rect(x0 + 2, Y(42), x1 - 2, Y(100), Z(subs, s));
        else t.rect(x0 + X(20), t.H - Y(6) - Y(20), x1 - X(20), t.H - Y(6) - 2, Z(subs, s), { powder: true });
        labels.push({ x: Math.round((x0 + x1) / 2), y: Y(32), text });
      });
      return { labels, hint: 'Il tempo è accelerato in scala logaritmica: il radio (1 600 anni) qui dimezza in circa 2 minuti e mezzo. Passa il mouse sulle celle per riconoscerle.' };
    },
  },
  {
    id: 'incendio',
    name: 'Legno e carbone',
    description: 'Una capanna di legno e una catasta di carbone: fiamme, fumo, cenere, brace e pirolisi.',
    build(world) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      const base = t.H - Y(6) - 1;
      // capanna
      t.rect(X(60), base - Y(40), X(64), base, WOOD);
      t.rect(X(126), base - Y(40), X(130), base, WOOD);
      for (let k = 0; k <= X(40); k++) {
        t.rect(X(55) + k, base - Y(40) - Math.round(k * 0.6), X(55) + k, base - Y(40) - Math.round(k * 0.6) + 2, WOOD);
        t.rect(X(135) - k, base - Y(40) - Math.round(k * 0.6), X(135) - k, base - Y(40) - Math.round(k * 0.6) + 2, WOOD);
      }
      // catasta di carbone in un braciere
      t.box(X(190), base - Y(22), X(270), base, CONCRETE, { open: true, t: 2 });
      t.mixture(X(192), base - Y(16), X(268), base - 2, [[COAL, {}, 3], [COAL, { powder: true }, 1]]);
      t.rect(X(192), base - Y(16) - 2, X(268), base - Y(16) - 1, WOOD);
      for (let x = X(192); x <= X(268); x += 3) t.set(x, base - Y(16) - 2, WOOD, { burn: true });
      t.set(X(62), base, WOOD, { burn: true });
      return { labels: [], hint: 'Spegni le fiamme con l\'acqua, oppure soffoca il fuoco con anidride carbonica fredda (scegli CO₂ nella tavolozza dei composti).' };
    },
  },
  {
    id: 'idrogeno',
    name: 'Idrogeno e ossigeno',
    description: 'Una camera piena di miscela tonante (2 H₂ + O₂): una scintilla e diventa vapore che si condensa in acqua.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      t.box(X(90), Y(50), X(230), t.H - Y(6), CONCRETE, { t: 3 });
      t.mixture(X(90) + 3, Y(50) + 3, X(230) - 3, t.H - Y(6) - 3, [[Z(subs, 'H'), {}, 2], [Z(subs, 'O'), {}, 1]]);
      const cu = Z(subs, 'Cu');
      t.rect(X(40), Y(120), X(90) + 6, Y(121), cu, { powder: false });
      return { labels: [{ x: X(55), y: Y(114), text: 'filo di rame' }], hint: 'Usa la Scintilla sul filo di rame (o il Fuoco nella camera).' };
    },
  },
  {
    id: 'mercurio',
    name: 'Galleggiare sul mercurio',
    description: 'Mercurio e acqua: ferro e piombo galleggiano sul mercurio, oro e tungsteno affondano.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      t.box(X(40), Y(80), X(280), t.H - Y(6), CONCRETE, { open: true, t: 3 });
      t.rect(X(40) + 3, Y(140), X(280) - 3, t.H - Y(6) - 3, Z(subs, 'Hg'));
      t.rect(X(40) + 3, Y(110), X(280) - 3, Y(139), WATER);
      const labels = [];
      ['Al', 'Fe', 'Pb', 'Au', 'W'].forEach((s, k) => {
        const x = X(70 + k * 45);
        t.rect(x - 4, Y(40), x + 4, Y(45), Z(subs, s), { powder: true });
        labels.push({ x, y: Y(33), text: `${subs.byKey.get(s).name} ${subs.list[Z(subs, s)].densS.toFixed(1).replace('.', ',')}` });
      });
      return { labels, hint: 'Densità in g/cm³: acqua 1, mercurio 13,5. Chi è più denso affonda.' };
    },
  },
  {
    id: 'elettrolisi',
    name: 'Elettrolisi dell\'acqua',
    description: 'Due elettrodi di rame in acqua: la corrente libera bolle di idrogeno e ossigeno.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      t.box(X(80), Y(90), X(240), t.H - Y(6), CONCRETE, { open: true, t: 3 });
      t.rect(X(80) + 3, Y(105), X(240) - 3, t.H - Y(6) - 3, WATER);
      const cu = Z(subs, 'Cu');
      for (const x of [X(120), X(200)]) {
        t.rect(x, Y(70), x + 1, t.H - Y(6) - 8, cu, { powder: false });
        t.rect(x - 1, Y(64), x + 2, Y(69), GENERATOR);
      }
      return { labels: [], hint: 'Le bolle salgono e si accumulano in alto: avvicina il Fuoco e senti lo scoppio dell\'idrogeno.' };
    },
  },
  {
    id: 'sale',
    name: 'Sodio e cloro',
    description: 'Il sodio metallico in un\'atmosfera di cloro diventa cloruro di sodio, il sale da cucina.',
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      t.box(X(90), Y(40), X(230), t.H - Y(6), WALL, { t: 2 });
      t.rect(X(90) + 2, Y(40) + 2, X(230) - 2, Y(130), Z(subs, 'Cl'));
      t.rect(X(130), t.H - Y(6) - Y(16), X(190), t.H - Y(6) - 2, Z(subs, 'Na'), { powder: false });
      return { labels: [{ x: X(160), y: Y(32), text: '2 Na + Cl₂ → 2 NaCl' }], hint: 'Il cloro (gas giallo-verde, più pesante dell\'aria) scende sul sodio: la reazione scalda tanto da fonderlo.' };
    },
  },
];
