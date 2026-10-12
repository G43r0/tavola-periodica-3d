// Esempi pronti della sandbox: esperimenti classici costruiti sulla griglia (coordinate pensate per 320 × 180
// e riscalate sulla griglia scelta). Ogni esempio restituisce le etichette da disegnare e un suggerimento.
import { AMBIENT, SOLID, WOOD, COAL, CONCRETE, WALL, WATER, SALT, GENERATOR, SOURCE, DRAIN, saltCtype } from './substances.js';
import { C_POWDER, C_DISSOLVED } from './world.js';
import { pick, isItalian } from '../i18n/index.js';

const P = (it, en) => pick({ it, en });

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
    if (o.dissolved) world.flags[i] = (world.flags[i] & ~(C_POWDER | (3 << 2))) | C_DISSOLVED | (2 << 2);
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
  /** Sorgente già carica: clona `id` (con temperatura e forma) senza aspettare un vicino. */
  const source = (x, y, id, o = {}) => {
    if (x >= 0 && y >= 0 && x < W && y < H) world.paintCell(y * W + x, SOURCE, { ctype: id, temp: o.temp ?? AMBIENT, powder: o.powder, dissolved: o.dissolved });
  };
  const ground = () => rect(0, H - Y(6), W - 1, H - 1, CONCRETE);
  return { W, H, X, Y, set, rect, box, mixture, source, ground };
}

const Z = (subs, symbol) => subs.byKey.get(symbol).id;
const aq = { dissolved: true };

export const PRESETS = [
  {
    id: 'alcalini',
    name: P('Metalli alcalini in acqua', 'Alkali metals in water'),
    description: P('Litio, sodio e potassio galleggiano e reagiscono: idrogeno, calore e la fiamma lilla del potassio.', 'Lithium, sodium and potassium float and react: hydrogen, heat and the lilac flame of potassium.'),
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
      return { labels, hint: P('Prova anche rubidio e cesio: reagiscono in modo esplosivo.', 'Try rubidium and caesium too: they react explosively.') };
    },
  },
  {
    id: 'fiamma',
    name: P('Saggio alla fiamma', 'Flame test'),
    description: P('Sette cloruri sopra fuochi di legna: ogni metallo colora la fiamma in modo diverso.', 'Seven chlorides over wood fires: each metal colours the flame differently.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      const metals = ['Li', 'Na', 'K', 'Ca', 'Sr', 'Ba', 'Cu'];
      const labels = [];
      metals.forEach((s, k) => {
        const cx = X(30 + k * 43);
        const top = t.H - Y(6) - Y(14);
        // il cloruro della libreria (LiCl, NaCl… CuCl₂) o, se mancasse, un sale generico
        const lib = subs.saltFor(Z(subs, s), Z(subs, 'Cl'));
        const [saltId, salt] = lib ? [lib, { powder: true }] : [SALT, { ctype: saltCtype(Z(subs, s), Z(subs, 'Cl')), powder: true }];
        // legna imbevuta di sale, con un mucchietto di sale sopra
        t.mixture(cx - X(9), top, cx + X(9), t.H - Y(6) - 1, [[WOOD, {}, 4], [saltId, salt, 1]]);
        for (let x = cx - X(9); x <= cx + X(9); x++) t.set(x, top, WOOD, { burn: true });
        t.rect(cx - X(7), top - 3, cx + X(7), top - 1, saltId, salt);
        labels.push({ x: cx, y: top - Y(40), text: `${s}Cl${s === 'Ca' || s === 'Sr' || s === 'Ba' || s === 'Cu' ? '₂' : ''}` });
      });
      return { labels, hint: P('Aggiungi sale con il pennello per ravvivare i colori; prova anche boro e tallio in polvere.', 'Add salt with the brush to brighten the colours; try powdered boron and thallium too.') };
    },
  },
  {
    id: 'termite',
    name: P('Termite', 'Thermite'),
    description: P('Alluminio e ruggine innescati dal magnesio: ferro fuso a oltre 2 500 °C che buca il crogiolo.', 'Aluminium and rust ignited by magnesium: molten iron at over 2,500 °C burns through the crucible.'),
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
        [subs.byKey.get('fe2o3').id, { powder: true }, 1],
      ]);
      // innesco: magnesio acceso
      const mg = Z(subs, 'Mg');
      t.rect(X(152), Y(95), X(168), Y(96), mg, { powder: true });
      for (let x = X(152); x <= X(168); x++) t.set(x, Y(95), mg, { powder: true, burn: true });
      return {
        labels: [{ x: X(160), y: Y(78), text: 'Al + Fe₂O₃' }, { x: X(160), y: Y(146), text: P('lastra di ferro', 'iron plate') }],
        hint: P('Il fuoco della legna (≈ 900 °C) non basta: serve il magnesio, che brucia a oltre 2 800 °C.', 'A wood fire (≈ 900 °C) is not enough: you need magnesium, which burns at over 2,800 °C.'),
      };
    },
  },
  {
    id: 'fissione',
    name: P('Reazione a catena', 'Chain reaction'),
    description: P('Un blocco di plutonio e barre di uranio in acqua con barre di cadmio: lancia i neutroni e guarda.', 'A block of plutonium and uranium rods in water with cadmium rods: fire the neutrons and watch.'),
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
        labels: [{ x: X(70), y: Y(62), text: P('plutonio (massa critica)', 'plutonium (critical mass)') }, { x: X(230), y: Y(72), text: P('uranio + acqua (moderatore) + cadmio', 'uranium + water (moderator) + cadmium') }],
        hint: P('Scegli lo strumento Neutroni e cliccaci sopra. Con la Gomma togli le barre di cadmio e il reattore si accende.', 'Pick the Neutrons tool and click on them. Remove the cadmium rods with the Eraser and the reactor starts up.'),
      };
    },
  },
  {
    id: 'neon',
    name: P('Scarica nei gas', 'Gas discharge'),
    description: P('Tubi di elio, neon, argon, kripton, xeno e idrogeno collegati a un generatore: ogni gas ha il suo colore.', 'Tubes of helium, neon, argon, krypton, xenon and hydrogen connected to a generator: each gas has its own colour.'),
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
      return { labels, hint: P('I generatori mandano un impulso ogni 0,2 s attraverso il rame; prova a disegnare un tubo con il mercurio scaldato.', 'The generators send a pulse every 0.2 s through the copper; try drawing a tube with heated mercury.') };
    },
  },
  {
    id: 'decadimento',
    name: P('Decadimento radioattivo', 'Radioactive decay'),
    description: P('Radio, radon e astato in scatole chiuse: si formano elio, radon, polonio e alla fine piombo.', 'Radium, radon and astatine in closed boxes: helium, radon, polonium and finally lead form.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.rect(0, t.H - Y(6), t.W - 1, t.H - 1, WALL);
      const items = [['Ra', P('radio → radon → polonio → piombo', 'radium → radon → polonium → lead')], ['Rn', P('radon → polonio → piombo', 'radon → polonium → lead')], ['At', P('astato → polonio → piombo', 'astatine → polonium → lead')]];
      const labels = [];
      items.forEach(([s, text], k) => {
        const x0 = X(15 + k * 102);
        const x1 = x0 + X(88);
        t.box(x0, Y(40), x1, t.H - Y(6), WALL, { t: 2 });
        if (s === 'Rn') t.rect(x0 + 2, Y(42), x1 - 2, Y(100), Z(subs, s));
        else t.rect(x0 + X(20), t.H - Y(6) - Y(20), x1 - X(20), t.H - Y(6) - 2, Z(subs, s), { powder: true });
        labels.push({ x: Math.round((x0 + x1) / 2), y: Y(32), text });
      });
      return { labels, hint: P('Il tempo è accelerato in scala logaritmica: il radio (1 600 anni) qui dimezza in circa 2 minuti e mezzo. Passa il mouse sulle celle per riconoscerle.', 'Time is sped up on a logarithmic scale: radium (1,600 years) halves here in about 2½ minutes. Hover over the cells to identify them.') };
    },
  },
  {
    id: 'incendio',
    name: P('Legno e carbone', 'Wood and coal'),
    description: P('Una capanna di legno e una catasta di carbone: fiamme, fumo, cenere, brace e pirolisi.', 'A wooden hut and a pile of coal: flames, smoke, ash, embers and pyrolysis.'),
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
      return { labels: [], hint: P('Spegni le fiamme con l\'acqua, oppure soffoca il fuoco con anidride carbonica fredda (scegli CO₂ nella tavolozza dei composti).', 'Put out the flames with water, or smother the fire with cold carbon dioxide (pick CO₂ in the compound palette).') };
    },
  },
  {
    id: 'idrogeno',
    name: P('Idrogeno e ossigeno', 'Hydrogen and oxygen'),
    description: P('Una camera piena di miscela tonante (2 H₂ + O₂): una scintilla e diventa vapore che si condensa in acqua.', 'A chamber full of oxyhydrogen (2 H₂ + O₂): one spark and it becomes steam that condenses into water.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      t.box(X(90), Y(50), X(230), t.H - Y(6), CONCRETE, { t: 3 });
      t.mixture(X(90) + 3, Y(50) + 3, X(230) - 3, t.H - Y(6) - 3, [[Z(subs, 'H'), {}, 2], [Z(subs, 'O'), {}, 1]]);
      const cu = Z(subs, 'Cu');
      t.rect(X(40), Y(120), X(90) + 6, Y(121), cu, { powder: false });
      return { labels: [{ x: X(55), y: Y(114), text: P('filo di rame', 'copper wire') }], hint: P('Usa la Scintilla sul filo di rame (o il Fuoco nella camera).', 'Use the Spark on the copper wire (or the Fire in the chamber).') };
    },
  },
  {
    id: 'mercurio',
    name: P('Galleggiare sul mercurio', 'Floating on mercury'),
    description: P('Mercurio e acqua: ferro e piombo galleggiano sul mercurio, oro e tungsteno affondano.', 'Mercury and water: iron and lead float on mercury, gold and tungsten sink.'),
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
        labels.push({ x, y: Y(33), text: `${subs.byKey.get(s).name} ${subs.list[Z(subs, s)].densS.toFixed(1).replace('.', isItalian() ? ',' : '.')}` });
      });
      return { labels, hint: P('Densità in g/cm³: acqua 1, mercurio 13,5. Chi è più denso affonda.', 'Density in g/cm³: water 1, mercury 13.5. The denser one sinks.') };
    },
  },
  {
    id: 'elettrolisi',
    name: P('Elettrolisi dell\'acqua', 'Electrolysis of water'),
    description: P('Due elettrodi di rame in acqua: la corrente libera bolle di idrogeno e ossigeno.', 'Two copper electrodes in water: the current releases bubbles of hydrogen and oxygen.'),
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
      return { labels: [], hint: P('Le bolle salgono e si accumulano in alto: avvicina il Fuoco e senti lo scoppio dell\'idrogeno.', 'The bubbles rise and collect at the top: bring the Fire close and hear the hydrogen pop.') };
    },
  },
  {
    id: 'precipitazioni',
    name: P('Precipitazioni colorate', 'Coloured precipitates'),
    description: P('Soluzioni limpide che, mescolandosi, formano solidi: AgCl bianco, PbI₂ giallo oro, Cu(OH)₂ azzurro.', 'Clear solutions that form solids when they mix: white AgCl, golden yellow PbI₂, light-blue Cu(OH)₂.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const k = (key) => subs.byKey.get(key).id;
      t.ground();
      const pairs = [['agno3', 'nacl', 'AgNO₃ + NaCl → AgCl'], ['pbno32', 'ki', 'Pb(NO₃)₂ + KI → PbI₂'], ['cuso4', 'naoh', 'CuSO₄ + NaOH → Cu(OH)₂']];
      const labels = [];
      pairs.forEach(([a, b, text], n) => {
        const x0 = X(12 + n * 102);
        const x1 = x0 + X(92);
        t.box(x0, Y(70), x1, t.H - Y(6), CONCRETE, { open: true, t: 2 });
        const mid = Math.round((x0 + x1) / 2);
        t.rect(x0 + 2, Y(110), mid, t.H - Y(6) - 2, k(a), aq);
        t.rect(mid + 1, Y(110), x1 - 2, t.H - Y(6) - 2, k(b), aq);
        labels.push({ x: mid, y: Y(62), text });
      });
      return { labels, hint: P('Le due soluzioni si mescolano per diffusione: dove si incontrano si forma il precipitato, che cade sul fondo. Scegli «In soluzione» nella scheda per versarne altre.', 'The two solutions mix by diffusion: where they meet the precipitate forms and falls to the bottom. Choose «In solution» in the card to pour more.') };
    },
  },
  {
    id: 'combustibili',
    name: P('Combustibili', 'Fuels'),
    description: P('Etanolo, ottano e acetone in vaschette, una nuvola di propano: ognuno brucia con la sua reazione del catalogo.', 'Ethanol, octane and acetone in trays, a cloud of propane: each burns with its own catalogue reaction.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const k = (key) => subs.byKey.get(key).id;
      t.ground();
      const labels = [];
      ['etanolo', 'ottano', 'acetone'].forEach((key, n) => {
        const x0 = X(20 + n * 70);
        const x1 = x0 + X(50);
        t.box(x0, t.H - Y(26), x1, t.H - Y(6), CONCRETE, { open: true, t: 2 });
        t.rect(x0 + 2, t.H - Y(18), x1 - 2, t.H - Y(6) - 2, k(key));
        world.ignite(Math.round((x0 + x1) / 2), t.H - Y(19), 2);
        labels.push({ x: Math.round((x0 + x1) / 2), y: t.H - Y(34), text: subs.byKey.get(key).name });
      });
      t.box(X(232), Y(40), X(305), t.H - Y(6), CONCRETE, { open: true, t: 2 });
      t.rect(X(232) + 2, Y(90), X(305) - 2, t.H - Y(6) - 2, k('c3h8'));
      labels.push({ x: X(268), y: Y(32), text: P('propano (più pesante dell\'aria)', 'propane (heavier than air)') });
      return { labels, hint: P('Avvicina il Fuoco al propano: brucia di colpo. Prova anche benzene, metano, glucosio o lo zolfo.', 'Bring the Fire close to the propane: it burns all at once. Try benzene, methane, glucose or sulfur too.') };
    },
  },
  {
    id: 'perossido',
    name: P('Acqua ossigenata e catalizzatore', 'Hydrogen peroxide and catalyst'),
    description: P('Il diossido di manganese fa decomporre l\'acqua ossigenata: 2 H₂O₂ → 2 H₂O + O₂ (solo dove c\'è il catalizzatore).', 'Manganese dioxide makes hydrogen peroxide decompose: 2 H₂O₂ → 2 H₂O + O₂ (only where the catalyst is).'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const k = (key) => subs.byKey.get(key).id;
      t.ground();
      for (const [x0, cat] of [[X(40), true], [X(180), false]]) {
        const x1 = x0 + X(100);
        t.box(x0, Y(60), x1, t.H - Y(6), CONCRETE, { open: true, t: 2 });
        t.rect(x0 + 2, Y(100), x1 - 2, t.H - Y(6) - 2, k('h2o2'));
        if (cat) t.rect(x0 + X(40), Y(50), x0 + X(60), Y(54), k('mno2'), { powder: true });
      }
      return { labels: [{ x: X(90), y: Y(44), text: P('con MnO₂', 'with MnO₂') }, { x: X(230), y: Y(44), text: P('senza catalizzatore', 'without catalyst') }], hint: P('Le bolle di ossigeno salgono; accanto al catalizzatore puoi accendere un legnetto: brucia più vivacemente nell\'ossigeno.', 'The oxygen bubbles rise; next to the catalyst you can light a splint: it burns more brightly in oxygen.') };
    },
  },
  {
    id: 'acido',
    name: P('Metalli e acido cloridrico', 'Metals and hydrochloric acid'),
    description: P('Zinco, magnesio e rame in acido cloridrico: i primi due sviluppano idrogeno, il rame no (è meno reattivo).', 'Zinc, magnesium and copper in hydrochloric acid: the first two give off hydrogen, copper does not (it is less reactive).'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const k = (key) => subs.byKey.get(key).id;
      t.ground();
      const labels = [];
      ['Zn', 'Mg', 'Cu'].forEach((sym, n) => {
        const x0 = X(20 + n * 100);
        const x1 = x0 + X(80);
        t.box(x0, Y(70), x1, t.H - Y(6), CONCRETE, { open: true, t: 2 });
        t.rect(x0 + 2, Y(100), x1 - 2, t.H - Y(6) - 2, k('hcl'), aq);
        t.rect(x0 + X(30), t.H - Y(6) - Y(8), x1 - X(30), t.H - Y(6) - 2, Z(subs, sym), { powder: true });
        labels.push({ x: Math.round((x0 + x1) / 2), y: Y(62), text: `${subs.byKey.get(sym).name} + HCl(aq)` });
      });
      return { labels, hint: P('Zn + 2 HCl → ZnCl₂ + H₂: l\'idrogeno sale in bolle. Il rame resta intatto: non sposta l\'idrogeno dagli acidi.', 'Zn + 2 HCl → ZnCl₂ + H₂: the hydrogen rises in bubbles. Copper stays intact: it does not displace hydrogen from acids.') };
    },
  },
  {
    id: 'salamoia',
    name: P('Acqua salata ed evaporazione', 'Salt water and evaporation'),
    description: P('Una pentola di acqua salata e una di acqua zuccherata: scaldandole il sale cristallizza, lo zucchero carbonizza.', 'A pot of salt water and one of sugar water: when heated, the salt crystallises and the sugar chars.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const k = (key) => subs.byKey.get(key).id;
      t.ground();
      const cu = Z(subs, 'Cu');
      for (const [x0, key] of [[X(40), 'nacl'], [X(180), 'saccarosio']]) {
        const x1 = x0 + X(100);
        t.box(x0, Y(110), x1, Y(150), cu, { open: true, t: 2 });
        t.mixture(x0 + 2, Y(122), x1 - 2, Y(148), [[WATER, {}, 2], [k(key), aq, 1]]);
        t.rect(x0 + X(10), Y(151), x0 + X(14), t.H - Y(6) - 1, CONCRETE);
        t.rect(x1 - X(14), Y(151), x1 - X(10), t.H - Y(6) - 1, CONCRETE);
      }
      return { labels: [{ x: X(90), y: Y(102), text: P('acqua salata', 'salt water') }, { x: X(230), y: Y(102), text: P('acqua zuccherata', 'sugar water') }], hint: P('Usa lo strumento Calore sotto le pentole di rame: l\'acqua bolle via, il sale resta come polvere bianca.', 'Use the Heat tool under the copper pots: the water boils away and the salt is left as a white powder.') };
    },
  },
  {
    id: 'esplosivi',
    name: P('Esplosivi', 'Explosives'),
    description: P('TNT, nitroglicerina e nitrometano in un bunker di calcestruzzo: una detonazione innesca le altre.', 'TNT, nitroglycerine and nitromethane in a concrete bunker: one detonation sets off the others.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const k = (key) => subs.byKey.get(key).id;
      t.rect(0, t.H - Y(6), t.W - 1, t.H - 1, WALL);
      t.box(X(30), Y(60), X(290), t.H - Y(6), CONCRETE, { open: true, t: 4 });
      t.rect(X(60), t.H - Y(26), X(110), t.H - Y(6) - 4, k('tnt'), { powder: false });
      t.box(X(140), t.H - Y(40), X(180), t.H - Y(6) - 4, CONCRETE, { open: true, t: 2 });
      t.rect(X(140) + 2, t.H - Y(30), X(180) - 2, t.H - Y(6) - 6, k('nitroglicerina'));
      t.rect(X(210), t.H - Y(24), X(260), t.H - Y(6) - 4, k('nitrometano'));
      // miccia: legna che brucia fino al TNT
      t.rect(X(44), t.H - Y(27), X(64), t.H - Y(26), WOOD);
      t.set(X(44), t.H - Y(27), WOOD, { burn: true });
      return {
        labels: [{ x: X(85), y: t.H - Y(32), text: 'TNT' }, { x: X(160), y: t.H - Y(46), text: P('nitroglicerina', 'nitroglycerine') }, { x: X(235), y: t.H - Y(30), text: P('nitrometano', 'nitromethane') }],
        hint: P('La miccia di legno brucia fino al TNT. Il muro indistruttibile non si scalfisce, il calcestruzzo resiste solo in parte.', 'The wooden fuse burns up to the TNT. The indestructible wall is not even scratched, the concrete only partly holds.'),
      };
    },
  },
  {
    id: 'miscele',
    name: P('Miscele con Mescola', 'Mixtures with Mix'),
    description: P('Ferro e zolfo a strati, olio sull\'acqua, polvere nera: lo strumento Mescola li rimescola, poi scalda e guarda reagire.', 'Iron and sulfur in layers, oil on water, black powder: the Mix tool stirs them, then heat them and watch them react.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const k = (key) => subs.byKey.get(key).id;
      t.ground();
      const labels = [];
      const top = t.H - Y(6);
      // ferro e zolfo: già mescolati, restano una miscela finché non li scaldi
      t.box(X(20), Y(100), X(90), top, CONCRETE, { open: true, t: 2 });
      t.rect(X(20) + 2, Y(135), X(90) - 2, top - 2, k('S'), { powder: true });
      t.rect(X(20) + 2, Y(118), X(90) - 2, Y(134), k('Fe'), { powder: true });
      for (let n = 0; n < 6; n++) world.stir(X(55), Y(138), X(28));
      labels.push({ x: X(55), y: Y(92), text: P('ferro + zolfo', 'iron + sulfur') });
      // due liquidi che non si mescolano
      t.box(X(120), Y(100), X(190), top, CONCRETE, { open: true, t: 2 });
      t.rect(X(120) + 2, Y(140), X(190) - 2, top - 2, WATER);
      t.rect(X(120) + 2, Y(122), X(190) - 2, Y(139), k('ottano'));
      labels.push({ x: X(155), y: Y(92), text: P('ottano sull\'acqua', 'octane on water') });
      // polvere nera: nitrato di potassio, carbone e zolfo
      t.box(X(220), Y(100), X(290), top, CONCRETE, { open: true, t: 2 });
      t.rect(X(220) + 2, Y(137), X(290) - 2, top - 2, subs.libraryId.get('kno3'), { powder: true });
      t.rect(X(220) + 2, Y(126), X(290) - 2, Y(136), COAL, { powder: true });
      t.rect(X(220) + 2, Y(120), X(290) - 2, Y(125), k('S'), { powder: true });
      labels.push({ x: X(255), y: Y(92), text: P('nitrato + carbone + zolfo', 'nitrate + charcoal + sulfur') });
      return { labels, hint: P('Passa Mescola sulle polveri per rimescolarle, poi dai Calore: il ferro con lo zolfo forma solfuro di ferro. Nell\'ottano e nell\'acqua, invece, il rimescolamento dura poco: si separano di nuovo.', 'Run Mix over the powders to stir them, then apply Heat: iron and sulfur form iron sulfide. Octane and water, however, stay mixed only briefly: they separate again.') };
    },
  },
  {
    id: 'sorgenti',
    name: P('Sorgenti, pozzi e vento', 'Sources, drains and wind'),
    description: P('Una Sorgente versa acqua in una vasca con il Pozzo che la svuota; un\'altra fa una montagna di sabbia: sposta tutto con il Vento.', 'A Source pours water into a tank that the Drain empties; another one makes a mountain of sand: move everything with the Wind.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      const k = (key) => subs.byKey.get(key).id;
      t.ground();
      const top = t.H - Y(6);
      // cascata che si svuota da sola
      t.source(X(50), Y(30), WATER);
      t.box(X(20), Y(110), X(100), top, CONCRETE, { open: true, t: 2 });
      world.paintCell((top - Y(18)) * t.W + X(20) + 2, DRAIN, {});
      // montagna di polvere
      t.source(X(170), Y(40), k('S'), { powder: true });
      // gas leggero che sale
      t.box(X(240), Y(70), X(300), top, CONCRETE, { open: true, t: 2 });
      t.source(X(270), top - 4, k('H'));
      return { labels: [{ x: X(60), y: Y(20), text: P('sorgente d\'acqua', 'water source') }, { x: X(170), y: Y(28), text: P('sorgente di zolfo', 'sulfur source') }, { x: X(270), y: Y(60), text: P('sorgente di idrogeno', 'hydrogen source') }], hint: P('La Sorgente clona all\'infinito: posala accanto a una sostanza qualsiasi. Il Pozzo cancella ciò che lo tocca. Prova il Vento (trascina il cursore) sul gas e sulla polvere.', 'The Source clones endlessly: place it next to any substance. The Drain deletes whatever touches it. Try the Wind (drag the cursor) on the gas and the powder.') };
    },
  },
  {
    id: 'sale',
    name: P('Sodio e cloro', 'Sodium and chlorine'),
    description: P('Il sodio metallico in un\'atmosfera di cloro diventa cloruro di sodio, il sale da cucina.', 'Sodium metal in a chlorine atmosphere turns into sodium chloride, table salt.'),
    build(world, subs) {
      const t = tools(world);
      const { X, Y } = t;
      t.ground();
      t.box(X(90), Y(40), X(230), t.H - Y(6), WALL, { t: 2 });
      t.rect(X(90) + 2, Y(40) + 2, X(230) - 2, Y(130), Z(subs, 'Cl'));
      t.rect(X(130), t.H - Y(6) - Y(16), X(190), t.H - Y(6) - 2, Z(subs, 'Na'), { powder: false });
      return { labels: [{ x: X(160), y: Y(32), text: '2 Na + Cl₂ → 2 NaCl' }], hint: P('Il cloro (gas giallo-verde, più pesante dell\'aria) scende sul sodio: la reazione scalda tanto da fonderlo.', 'Chlorine (a yellow-green gas, heavier than air) sinks onto the sodium: the reaction gets hot enough to melt it.') };
    },
  },
];
