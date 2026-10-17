// Strumenti della fase G4 nel gioco: la vetreria fissa (buretta, imbuto con la carta da filtro, pallone da
// distillazione), gli strumenti sempre sul bancone (termometro, pH-metro, pipetta), la pinza per il crogiolo, il
// bagno di ghiaccio, il mantello riscaldante, l'alimentatore con gli elettrodi e le bombole dei gas.
// Le regole pure sono in apparatus-logic.js, le mesh della stanza in apparatus-room.js.
import * as THREE from 'three';
import { LAYOUT, BENCH_Y } from './room.js';
import { placeItem } from './items.js';
import { Mixture, AMBIENT } from './mixture.js';
import { tongsMesh } from './apparatus-room.js';
import { Stream } from './effects.js';
import { WATER } from '../sandbox/substances.js';
import { STOPCOCK, DROP_ML, PIPETTE_ML, GAS_FLOW, FILTER_FLOW, HOT_T, buretteReading, nextStopcock, nextVolts, nextLevel, relax, splitVapours, displayCurrent } from './apparatus-logic.js';

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** Strumenti che restano sempre nel laboratorio (non si buttano, tornano al loro posto a ogni partita). */
export const PERMANENT_TOOLS = ['thermometer', 'phmeter', 'pipette'];

export class Apparatus {
  /** @param {import('./game.js').LabGame} game */
  constructor(game) {
    this.g = game;
    const room = game.room.apparatus;
    this.room = room;
    this.tongsFx = room.tongs;
    this.mantle = room.mantle;
    this.power = room.power;
    this.icebath = room.icebath;
    this.gases = room.gases;
    this.stopcock = 0;
    this.dropAcc = { burette: 0, funnel: 0 };
    this.headT = AMBIENT; // temperatura della testa della colonna (termometro digitale)
    this.condensate = new Mixture(game.chem);
    this.condT = 0;
    this.cellCurrent = 0;
    // vetreria montata sui sostegni
    this.burette = this.mount('burette', room.mounts.burette);
    this.funnel = this.mount('funnel', room.mounts.funnel);
    this.flask = this.mount('rbflask', room.mounts.flask);
    this.rigs = [this.burette, this.funnel, this.flask];
    // termometro, pH-metro e pipetta, sdraiati davanti alla piastra con la punta verso il centro del bancone
    const pr = LAYOUT.probes;
    this.tools = PERMANENT_TOOLS.map((kind, i) => {
      const quat = new THREE.Quaternion();
      const pos = new THREE.Vector3(pr.x, BENCH_Y + 0.002, pr.z - 0.09 + i * 0.09);
      const it = game.spawn(kind, { pos, quat, name: game.t(`item_${kind}`) });
      placeItem(it, pos, quat);
      it.permanent = true;
      it.home = { pos, quat };
      it.data.reading = kind === 'thermometer' ? AMBIENT : null;
      return it;
    });
    this.tongsHeld = tongsMesh(game.mats.steel);
    this.tongsHeld.visible = false;
    game.scene.add(this.tongsHeld);
  }

  /** Mette un recipiente fisso nel suo sostegno: corpo fisso, niente ombra di contatto, non si prende. */
  mount(kind, at) {
    const g = this.g;
    const it = g.spawn(kind, { pos: new THREE.Vector3(at.x, at.y, at.z), mixture: new Mixture(g.chem), name: g.t(`item_${kind}`) });
    g.physics.fix(it.body);
    it.rig = it.def.rig;
    it.permanent = true;
    it.blob?.removeFromParent();
    it.blob = null;
    return it;
  }

  /** Nuova partita: vetreria vuota e pulita, rubinetti e valvole chiusi, strumenti al loro posto. */
  reset() {
    for (const it of this.rigs) {
      it.mixture.clear();
      it.mixture.T = AMBIENT;
      it.dirty = false;
      it.rxLog = [];
    }
    this.stopcock = 0;
    this.condensate.clear();
    this.headT = AMBIENT;
    this.mantle.level = 0;
    this.power.volts = 0;
    this.power.current = 0;
    for (const f of this.gases) f.open = false;
    this.tongsFx.taken = false;
    this.g.tongs = false;
    for (const it of this.tools) this.goHome(it);
  }

  goHome(it) {
    it.body.setGravityScale(1, true);
    placeItem(it, it.home.pos, it.home.quat);
    it.load = null;
    it.data.reading = it.kind === 'thermometer' ? AMBIENT : null;
  }

  /** Il recipiente scotta (oltre 60 °C): senza la pinza non si prende. */
  isHot(item) {
    const m = item.mixture;
    return Boolean(item.def.container && m && !m.isEmpty() && m.T > HOT_T);
  }

  // ------------------------------------------------------------------ comandi

  /** Clic (dir = 1), clic destro (dir = −1) o E su un recipiente fisso. */
  use(item, dir = 1) {
    const { t } = this.g;
    if (item.rig === 'burette') {
      this.stopcock = nextStopcock(this.stopcock, dir);
      this.g.toast(t(`stopcock${this.stopcock}`));
    } else if (item.rig === 'funnel') {
      if (dir > 0) this.removePaper();
    } else if (item.rig === 'still') this.g.toast(t('stillHint'));
  }

  /** Elementi fissi della fase G4; true se gestito. */
  useFixture(f, dir = 1) {
    const g = this.g;
    const { t } = g;
    switch (f.kind) {
      case 'tongs':
        if (g.held) {
          g.toast(t('tongsHandsFull'));
          return true;
        }
        g.tongs = !g.tongs;
        f.taken = g.tongs;
        g.toast(t(g.tongs ? 'tongsTaken' : 'tongsBack'));
        return true;
      case 'mantle':
        this.setMantle(nextLevel(f.level, dir));
        return true;
      case 'power':
        this.setVolts(nextVolts(f.volts, dir));
        return true;
      case 'gas':
        f.open = dir > 0 ? !f.open : false;
        g.toast(t(f.open ? 'valveOpen' : 'valveClosed', { gas: f.formula }));
        return true;
      case 'icebath':
        g.toast(t('iceHint'));
        return true;
      default:
        return false;
    }
  }

  setMantle(level) {
    this.mantle.level = clamp(level, 0, 5);
    this.g.toast(this.mantle.level ? this.g.t('mantleLevel', { n: this.mantle.level, temp: Math.round(22 + this.mantle.level * 45) }) : this.g.t('mantleOff'));
  }

  setVolts(v) {
    this.power.volts = v;
    this.g.toast(v ? this.g.t('powerOn', { v }) : this.g.t('powerOff'));
  }

  /** Clic sull'imbuto: si toglie la carta con il solido (in mano), e nell'imbuto ne va una nuova. */
  removePaper() {
    const g = this.g;
    const { t } = g;
    const mix = this.funnel.mixture;
    if (g.held) return;
    if (mix.isEmpty()) {
      g.toast(t('paperClean'));
      return;
    }
    if (mix.liquidVolume > 1) {
      g.toast(t('paperWait'));
      return;
    }
    const content = mix.takeFraction(1);
    content.add(mix.takeFraction(1, { solidOnly: true }));
    mix.clear();
    this.funnel.dirty = false;
    const paper = g.spawn('filterPaper', { pos: g.handPoint(), mixture: content, name: t('item_filterPaper') });
    this.paperLook(paper);
    g.grab(paper);
    g.toast(t('paperTaken', { what: g.componentsText(content) || t('paperNothing') }));
  }

  /** Colore del mucchietto sulla carta da filtro: quello del solido raccolto. */
  paperLook(paper) {
    const mix = paper.mixture;
    const c = mix.appearance().solid;
    paper.heap.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
    paper.heap.visible = mix.solidVolume > 0.005;
    paper.heap.scale.setScalar(clamp(Math.cbrt(mix.solidVolume) * 0.9, 0.35, 1.2));
    paper.heap.scale.y *= 0.25;
  }

  /**
   * E con uno strumento da immergere in mano: termometro e pH-metro scrivono la lettura nell'avviso, la pipetta
   * aspira 10 mL o li fa scendere (Maiusc: 1 mL); al lavandino la pipetta si lava, sui rifiuti si svuota.
   * @returns {boolean} true se gestito
   */
  useTool(held, target, fixture, fine) {
    const g = this.g;
    const { t } = g;
    if (held.kind === 'thermometer' || held.kind === 'phmeter') {
      if (!this.probed(held)) {
        g.toast(t(held.kind === 'thermometer' ? 'thermoHint' : 'phHint'));
        return true;
      }
      g.toast(t(held.kind === 'thermometer' ? 'readTemp' : 'readPh', { value: this.readout(held), name: g.itemName(g.probing) }), 'ok');
      return true;
    }
    if (held.kind !== 'pipette') return false;
    if (fixture?.kind === 'sink') {
      if (held.load && !held.load.isEmpty()) g.disposeWaste(held.load, 'sink', held, true);
      held.load = null;
      g.toast(t('pipetteWashed'));
      return true;
    }
    if (fixture?.kind === 'bin') {
      if (held.load && !held.load.isEmpty()) g.disposeWaste(held.load, fixture.bin, held, true);
      held.load = null;
      return true;
    }
    const vessel = g.probing;
    if (!vessel) {
      g.toast(t('pipetteHint'));
      return true;
    }
    vessel.data.usedAt = g.time;
    const loaded = held.load && held.load.liquidVolume > 0.01;
    if (loaded) {
      const ml = fine ? Math.min(1, held.load.liquidVolume) : held.load.liquidVolume;
      const part = ml >= held.load.liquidVolume - 1e-6 ? held.load : held.load.take(ml);
      vessel.mixture.add(part);
      vessel.lookStale = true;
      if (part === held.load) held.load = null;
      this.pipetteDrops(held, part);
      g.toast(t('pipetteOut', { ml: g.fmt(ml, 1), name: g.itemName(vessel) }));
      return true;
    }
    const mix = vessel.mixture;
    const avail = mix.liquidVolume - 0.2;
    if (avail < 0.5) {
      g.toast(t('pipetteNoLiquid'));
      return true;
    }
    const ml = Math.min(PIPETTE_ML, avail);
    held.load = mix.take(ml);
    if (vessel.data.reagent) g.addCost(ml * (vessel.data.price ?? 0.01));
    vessel.lookStale = true;
    g.toast(t('pipetteIn', { ml: g.fmt(ml, 1), name: g.itemName(vessel) }));
    return true;
  }

  /** Qualche goccia che scende dalla punta della pipetta. */
  pipetteDrops(pip, part) {
    const tip = _v.set(0.166, 0.013, 0).applyMatrix4(pip.mesh.matrixWorld);
    const c = part.appearance().liquid;
    for (let k = 0; k < 4; k++) this.g.drops.emit(tip.x, tip.y - k * 0.004, tip.z, 0, -0.1, 0, 0.0018, c, 0.6, tip.y - 0.08);
  }

  /** Lo strumento in mano è immerso in un recipiente (quello guardato, con del liquido)? */
  probed(tool) {
    const v = this.g.probing;
    return Boolean(this.g.held === tool && v && v.mixture && v.mixture.liquidVolume > 1);
  }

  /** Lettura dello strumento come testo: «23,4 °C», «pH 4,72» oppure «—». */
  readout(tool) {
    const g = this.g;
    if (tool.kind === 'thermometer') return `${g.fmt(tool.data.reading - 273.15, 1)} °C`;
    if (tool.kind === 'phmeter') return tool.data.reading === null ? '—' : `pH ${g.fmt(tool.data.reading, 2)}`;
    if (tool.kind === 'pipette') return `${g.fmt(tool.load?.liquidVolume ?? 0, 1)} mL`;
    return '';
  }

  // ------------------------------------------------------------------ chimica e calore

  /** Calore e condizioni dei punti speciali: mantello, bagno di ghiaccio, elettrodi, porcellana rovente. */
  env(item, env) {
    const p = item.mesh.position;
    if (item === this.flask) {
      const m = this.mantle;
      if (m.level > 0) env.heatW += Math.max(0, Math.min(m.level * 55, 4 * (m.T - item.mixture.T)));
      env.open = false; // chiuso dalla testa: il vapore va nel refrigerante
      env.lossWK = 0.25;
    }
    const z = this.icebath.zone;
    if (Math.abs(p.x - z.x) < z.hx && Math.abs(p.z - z.z) < z.hz && p.y < z.y + 0.03 && p.y > z.y - 0.02) {
      env.Tenv = 273.15;
      env.lossWK += 3 + item.def.area * 0.05;
      item.inIce = true;
    } else item.inIce = false;
    const c = this.power.cell;
    const upright = _v.set(0, 1, 0).applyQuaternion(item.mesh.quaternion).y > 0.85;
    item.inCell = upright && Math.hypot(p.x - c.x, p.z - c.z) < c.r && Math.abs(p.y - c.y) < 0.03 && item.mixture.liquidVolume > 8;
    if (item.inCell && this.power.volts > 0) env.volts = this.power.volts;
    // la porcellana rovente irraggia: sul Bunsen il crogiolo arriva a 800–850 °C, non oltre
    const T = item.mixture.T;
    if (item.def.porcelain && T > 400) env.lossWK += item.def.area * 0.005 * ((T / 400) ** 3 - 1);
    return env;
  }

  /** Prima di un passo della chimica. */
  beginChem() {
    this.cellCurrent = 0;
  }

  /**
   * Dopo il passo della chimica di un recipiente: nel pallone il vapore condensa (va nel distillato e scalda la
   * testa), negli elettrodi si conta la corrente e salgono le bolle.
   */
  afterTick(item, ev, dt) {
    const g = this.g;
    if (item === this.flask) {
      const { liquid, gas } = splitVapours(g.chem, ev.gases);
      let mol = 0;
      for (const [sid, n] of liquid) {
        this.condensate.addSpecies(sid, n);
        mol += n;
      }
      ev.gases = gas;
      if (mol > 1e-6) this.headT = relax(this.headT, item.mixture.T, dt, 1.2);
      else this.headT = relax(this.headT, AMBIENT, dt, 25);
    }
    if (item.inCell && ev.current > 0) {
      this.cellCurrent += ev.current;
      if (ev.current > 0.005 && item.liquidMesh.visible) {
        const floor = item.mesh.position.y + item.def.profile[0][1];
        const top = item.liquidMesh.material.userData.uniforms.uLevel.value - 0.001;
        const n = Math.min(6, 1 + Math.floor(ev.current * 8));
        for (let k = 0; k < n; k++) {
          const e = this.power.electrodes[k % 2];
          g.motes.emit(e.x + (Math.random() - 0.5) * 0.005, BENCH_Y + 0.014 + Math.random() * 0.02, e.z + (Math.random() - 0.5) * 0.005, 0.04 + Math.random() * 0.03, 0.001 + Math.random() * 0.001, [236, 243, 250], top, floor - 1, 3);
        }
      }
    }
  }

  // ------------------------------------------------------------------ a ogni fotogramma

  update(dt) {
    const g = this.g;
    if (!(dt > 0)) return;
    this.updateBurette(dt);
    this.updateFunnel(dt);
    this.updateCondenser(dt);
    this.updateGases(dt);
    this.power.current = displayCurrent(this.cellCurrent);
    this.power.lcd.set(this.power.volts ? `${this.power.volts.toFixed(1)} V  ${this.power.current.toFixed(2)} A` : '-- V');
    this.room.still.headLcd.set(`${(this.headT - 273.15).toFixed(1)} °C`);
    this.burette.stopcock.rotation.x = Math.PI / 2 - (this.stopcock / 3) * (Math.PI / 2);
    this.funnel.paper.visible = true;
    for (const it of this.tools) this.updateTool(it, dt);
    for (const it of g.items) if (it.kind === 'filterPaper' && it.mixture) this.paperLook(it);
    this.updateTongs();
  }

  /** Il liquido che esce da un punto (punta della buretta, gambo dell'imbuto, refrigerante) e cade sotto. */
  release(source, portion, p, dropR) {
    const g = this.g;
    const dest = g.traceStream(p, 0, 0, source);
    g.inFlight.push({ at: g.time + dest.t, dest, portion, source });
    const c = portion.appearance().liquid;
    g.drops.emit(p.x, p.y, p.z, 0, -0.05, 0, dropR, c, 1.2, dest.y);
    return dest;
  }

  updateBurette(dt) {
    const it = this.burette;
    const mix = it.mixture;
    const rate = STOPCOCK[this.stopcock];
    const lv = mix.liquidVolume;
    if (!rate || lv < 0.01) return;
    const tip = _v2.set(0, -0.002, 0).applyMatrix4(it.mesh.matrixWorld).clone();
    if (this.stopcock === 1) {
      // goccia a goccia: gocce da 0,05 mL
      this.dropAcc.burette += rate * dt;
      while (this.dropAcc.burette >= DROP_ML && mix.liquidVolume > 0.01) {
        this.dropAcc.burette -= DROP_ML;
        this.release(it, mix.take(Math.min(DROP_ML, mix.liquidVolume)), tip, 0.0022);
      }
      return;
    }
    const dv = Math.min(rate * dt, lv);
    const dest = this.release(it, mix.take(dv), tip, 0.0016);
    if (this.stopcock === 3) {
      // aperto: un filo continuo fino al recipiente
      let st = this.g.streams.get(it);
      if (!st) this.g.streams.set(it, (st = new Stream(this.g.scene)));
      st.set(tip, 0, 0, dest.t, rate, mix.appearance().liquid);
      st.shown = this.g.time;
    }
    it.lookStale = true;
  }

  updateFunnel(dt) {
    const it = this.funnel;
    const mix = it.mixture;
    const lv = mix.liquidVolume;
    if (lv < 0.02) return;
    // il liquido passa dalla carta più piano quando ce n'è poco (meno pressione)
    const dv = Math.min(lv, FILTER_FLOW * dt * clamp(lv / 10, 0.25, 1));
    const part = mix.takeLiquid(dv);
    this.dropAcc.funnel += dt;
    it.lookStale = true;
    const tip = _v2.set(0, -0.002, 0).applyMatrix4(it.mesh.matrixWorld).clone();
    const dest = this.g.traceStream(tip, 0, 0, it);
    this.g.inFlight.push({ at: this.g.time + dest.t, dest, portion: part, source: it });
    if (this.dropAcc.funnel > 0.3) {
      this.dropAcc.funnel = 0;
      this.g.drops.emit(tip.x, tip.y, tip.z, 0, -0.05, 0, 0.002, part.appearance().liquid, 1.2, dest.y);
    }
  }

  /** Il distillato esce dal refrigerante a gocce, a temperatura ambiente. */
  updateCondenser(dt) {
    const c = this.condensate;
    this.condT += dt;
    if (c.isEmpty() || this.condT < 0.25) return;
    this.condT = 0;
    c.T = AMBIENT + 5;
    const part = c.takeFraction(1);
    c.clear();
    const o = this.room.still.outlet;
    this.release(this.flask, part, new THREE.Vector3(o.x, o.y - 0.002, o.z), 0.002);
  }

  /** Gas dalle bombole aperte: nel recipiente sotto il tubo, o liberi nella cappa. */
  updateGases(dt) {
    const g = this.g;
    const o = this.room.gasOutlet;
    const open = this.gases.filter((f) => f.open);
    if (!open.length) return;
    const vessel = g.items.find((it) => it.def.container && it.mixture && !it.rig && it !== g.held && Math.hypot(it.mesh.position.x - o.x, it.mesh.position.z - o.z) < o.r && Math.abs(it.mesh.position.y - BENCH_Y) < 0.03 && _v.set(0, 1, 0).applyQuaternion(it.mesh.quaternion).y > 0.85);
    for (const f of open) {
      const sid = g.chem.id(f.gas);
      const mol = GAS_FLOW * dt;
      if (vessel) {
        vessel.mixture.addSpecies(sid, mol);
        vessel.lookStale = true;
        vessel.data.usedAt = g.time;
        if (vessel.liquidMesh.visible && Math.random() < 0.9) {
          const top = vessel.liquidMesh.material.userData.uniforms.uLevel.value - 0.001;
          const floor = vessel.mesh.position.y + vessel.def.profile[0][1];
          for (let k = 0; k < 2; k++) g.motes.emit(o.x + (Math.random() - 0.5) * 0.004, o.y + 0.002, o.z + (Math.random() - 0.5) * 0.004, 0.06 + Math.random() * 0.04, 0.0012 + Math.random() * 0.0012, [236, 243, 250], top, floor - 1, 3);
        }
      } else if (g.chem.toxic.has(sid)) g.toxicGas(sid, mol, new THREE.Vector3(o.x, o.y + 0.02, o.z));
    }
  }

  /** Letture del termometro e del pH-metro (inseguono il valore vero), colonnina, display e colonna della pipetta. */
  updateTool(it, dt) {
    const g = this.g;
    const v = g.held === it ? g.probing : null;
    const mix = v?.mixture && v.mixture.liquidVolume > 1 ? v.mixture : null;
    if (it.kind === 'thermometer') {
      // il termometro digitale del negozio risponde in mezzo secondo invece che in due e mezzo
      it.data.reading = relax(it.data.reading, mix ? mix.T : AMBIENT, dt, g.has?.('thermoPro') ? 0.5 : 2.5);
      const L = clamp(0.012 + ((it.data.reading - 263.15) / 120) * 0.15, 0.008, 0.18);
      it.column.scale.y = L;
      it.column.position.x = 0.09 - L / 2;
    } else if (it.kind === 'phmeter') {
      const ph = mix ? mix.pH() : null;
      it.data.reading = ph === null ? null : relax(it.data.reading, ph, dt, 0.4);
      it.lcd.set(it.data.reading === null ? '--.--' : it.data.reading.toFixed(2));
    } else if (it.kind === 'pipette') {
      const ml = it.load?.liquidVolume ?? 0;
      it.column.visible = ml > 0.02;
      if (it.column.visible) {
        const L = (Math.min(PIPETTE_ML, ml) / PIPETTE_ML) * 0.2;
        it.column.scale.y = L;
        it.column.position.set(0.15 - L / 2, 0.013, 0);
        const c = it.load.appearance().liquid;
        it.column.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
      }
    }
  }

  /** La pinza in mano: stringe l'oggetto preso, o resta davanti in basso a destra se le mani sono vuote. */
  updateTongs() {
    const g = this.g;
    const m = this.tongsHeld;
    m.visible = Boolean(g.tongs);
    if (!m.visible) return;
    const cam = g.camera;
    if (g.held) {
      const it = g.held;
      const top = it.def.container ? it.def.height * 0.7 : 0.01;
      const p = _v.set(0, top, 0).applyMatrix4(it.mesh.matrixWorld);
      // le punte stringono l'oggetto, i manici vanno verso la mano (in basso a destra nella vista)
      const hand = _v2.set(0.18, -0.3, 0).applyQuaternion(cam.quaternion).add(cam.position);
      const dir = hand.sub(p).normalize();
      m.position.copy(p).addScaledVector(dir, 0.085 + (it.def.outer?.[0] ?? 0.02) * 0.6);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir.negate());
    } else {
      cam.getWorldDirection(_v);
      m.position.copy(cam.position).addScaledVector(_v, 0.38);
      m.position.add(_v2.set(0.16, -0.17, 0).applyQuaternion(cam.quaternion));
      m.quaternion.copy(cam.quaternion).multiply(_q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3));
    }
  }

  // ------------------------------------------------------------------ schede per l'interfaccia

  /** Scheda di uno strumento da immergere o della carta da filtro (null se non è uno di questi). */
  describeTool(item) {
    const g = this.g;
    const { t } = g;
    const out = { name: g.itemName(item), rows: [], notes: [] };
    if (item.kind === 'thermometer' || item.kind === 'phmeter') {
      out.readout = this.readout(item);
      if (this.probed(item)) out.notes.push(t('probeIn', { name: g.itemName(g.probing) }));
      else out.notes.push(t(item.kind === 'thermometer' ? 'thermoHint' : 'phHint'));
      return out;
    }
    if (item.kind === 'pipette') {
      const load = item.load;
      out.readout = this.readout(item);
      if (load && !load.isEmpty()) {
        out.rows.push({ label: g.componentsText(load) || t('state_liquid'), value: '' });
        const c = load.appearance().liquid;
        out.color = `rgb(${c[0]},${c[1]},${c[2]})`;
      }
      out.notes.push(t(load && !load.isEmpty() ? 'pipetteLoadedNote' : 'pipetteEmptyNote'));
      return out;
    }
    if (item.kind === 'filterPaper') {
      const mix = item.mixture;
      for (const c of mix.components()) {
        if (c.sid === WATER || c.mol < 2e-6) continue;
        out.rows.push({ label: c.name, formula: c.formula, value: g.chemMode === 'simple' ? `${g.fmt(c.grams, 2)} g · ${t(`state_${c.state}`)}` : t(`state_${c.state}`) });
      }
      out.notes.push(t(mix.water > 0.2 ? 'paperWet' : 'paperDry'));
      return out;
    }
    return null;
  }

  /** Aggiunge alla scheda di un recipiente fisso le sue letture: buretta, imbuto, pallone. */
  describeRig(item, out) {
    const g = this.g;
    const { t } = g;
    const lv = item.mixture.liquidVolume;
    if (item.rig === 'burette') {
      const r = buretteReading(lv);
      out.volume = r < 0 ? t('buretteAbove') : `${g.fmt(r, 2)} mL`;
      out.notes = [t(`stopcockSt${this.stopcock}`), t(lv > 0.01 ? 'buretteNote' : 'buretteEmpty')];
    } else if (item.rig === 'funnel') {
      out.notes.unshift(t(lv > 0.05 ? 'funnelFiltering' : 'funnelNote'));
      out.why = null;
    } else if (item.rig === 'still') {
      out.notes.unshift(t('stillHead', { temp: g.fmt(this.headT - 273.15, 0) }));
      if (!this.mantle.level) out.notes.push(t('stillOff'));
      out.why = null;
    }
    return out;
  }

  /** Scheda di un elemento fisso della fase G4 (stato), o null. */
  fixtureState(f) {
    const g = this.g;
    const { t } = g;
    switch (f.kind) {
      case 'tongs':
        return { note: t(f.taken ? 'stTongsTaken' : 'stTongsHere') };
      case 'mantle':
        return { note: f.level ? t('stMantle', { n: f.level, temp: Math.round(f.T - 273.15) }) : t('stOffM'), hot: f.level > 0 };
      case 'power':
        return { note: f.volts ? t('stPower', { v: f.volts, a: g.fmt(f.current, 2) }) : t('stOffM'), on: f.volts > 0 };
      case 'gas':
        return { note: t(f.open ? 'stValveOpen' : 'stValveClosed'), on: f.open };
      case 'icebath':
        return { note: t('stIce') };
      default:
        return null;
    }
  }
}
