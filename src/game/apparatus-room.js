// Apparecchi fissi dell'aula (fase G4): sostegno della buretta e pinza per il crogiolo sul bancone A; sostegno con
// l'imbuto, bagno di ghiaccio e apparecchio di distillazione sul bancone del lavandino; alimentatore con gli elettrodi
// e bombole dei gas sotto la cappa. Costruisce mesh, collisori statici ed «elementi fissi»; la vetreria montata
// (buretta, imbuto, pallone) è fatta di oggetti veri (items.js) che il gioco fissa ai punti `mounts`.
import * as THREE from 'three';
import { seg } from '../gfx/preset.js';
import { lcdTexture } from './items.js';
import { CYLINDER_GASES } from './apparatus-logic.js';

/** Gas delle bombole (CYLINDER_GASES): formula e colore dell'ogiva (EN 1089-3). */
const CYLINDER_LOOK = { O: ['O₂', '#f4f4f0'], H: ['H₂', '#c8161d'], co2: ['CO₂', '#8e959c'], Cl: ['Cl₂', '#f2c014'], nh3: ['NH₃', '#f2c014'] };
export const GAS_CYLINDERS = CYLINDER_GASES.map((gas) => ({ gas, formula: CYLINDER_LOOK[gas][0], shoulder: CYLINDER_LOOK[gas][1] }));

/** Pinza da crogiolo: due bracci d'acciaio incrociati, lunga 0,2 m lungo z (le punte verso −z). */
export function tongsMesh(steel) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, 0.2), steel);
    arm.position.set(s * 0.006, 0, 0);
    arm.rotation.y = s * 0.05;
    const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0016, 6, 12, Math.PI), steel);
    jaw.position.set(s * 0.011, 0, -0.1);
    jaw.rotation.set(Math.PI / 2, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    g.add(arm, jaw);
  }
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.006, 10), steel);
  hinge.position.z = -0.05;
  g.add(hinge);
  return g;
}

/**
 * @param {object} h aiuti di room.js: { group, scene, physics, fixtures, mesh, box, solid, std, M, BENCH_Y, LAYOUT }
 */
export function buildApparatus(h) {
  const { group, physics, fixtures, mesh, box, solid, std, M, BENCH_Y, LAYOUT } = h;
  const Y = BENCH_Y;
  const rod = (x, z, y0, len, mat = M.steel, r = 0.006) => mesh(new THREE.CylinderGeometry(r, r, len, 10), mat, x, y0 + len / 2, z);
  /** Tubo tra due punti (cilindro orientato). */
  const tube = (a, b, r, mat, opts) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 10, 1, true), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, opts);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return m;
  };
  const glass = new THREE.MeshStandardMaterial({ color: 0xdcecf2, roughness: 0.06, metalness: 0.05, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
  const water = new THREE.MeshStandardMaterial({ color: 0x9cc8e6, roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false });
  const graphite = std({ color: 0x2a2b2e, roughness: 0.55 });
  const brass = std({ color: 0xc9a54a, metalness: 0.8, roughness: 0.3 });

  // ------------------------------------------------------------ buretta su sostegno (bancone A, a destra)
  const bu = LAYOUT.burette;
  solid(0.16, 0.012, 0.26, M.darkSteel, bu.x, Y + 0.006, bu.z - 0.05, { kind: 'surface' });
  // piastrella bianca sotto la punta: il viraggio dell'indicatore si vede meglio
  box(0.1, 0.002, 0.1, std({ color: 0xf2f2ee, roughness: 0.4 }), bu.x, Y + 0.0125, bu.z, { cast: false });
  rod(bu.x, bu.z - 0.15, Y, 0.86);
  physics.cylinder(bu.x, Y + 0.43, bu.z - 0.15, 0.43, 0.007);
  for (const y of [Y + 0.42, Y + 0.72]) {
    box(0.012, 0.012, 0.15, M.darkSteel, bu.x, y, bu.z - 0.075);
    mesh(new THREE.TorusGeometry(0.01, 0.0025, 6, 14), M.darkSteel, bu.x, y, bu.z).rotation.x = Math.PI / 2;
  }

  // ------------------------------------------------------------ pinza per il crogiolo (accanto al Bunsen)
  const tg = LAYOUT.tongs;
  const tongs = { kind: 'tongs', id: 'tongs', hit: [], taken: false };
  tongs.hit.push(solid(0.05, 0.02, 0.14, M.darkSteel, tg.x, Y + 0.01, tg.z, tongs));
  const rackTongs = tongsMesh(M.steel);
  rackTongs.position.set(tg.x, Y + 0.023, tg.z);
  rackTongs.scale.setScalar(0.85);
  group.add(rackTongs);
  rackTongs.traverse((m) => m.isMesh && tongs.hit.push(m));
  tongs.mesh = rackTongs;
  fixtures.push(tongs);

  // ------------------------------------------------------------ bancone del lavandino: filtrazione
  const fl = LAYOUT.filter;
  solid(0.12, 0.012, 0.16, M.darkSteel, fl.x - 0.13, Y + 0.006, fl.z, { kind: 'surface' });
  rod(fl.x - 0.13, fl.z, Y, 0.5);
  physics.cylinder(fl.x - 0.13, Y + 0.25, fl.z, 0.25, 0.007);
  box(0.13, 0.008, 0.012, M.darkSteel, fl.x - 0.065, Y + 0.205, fl.z);
  mesh(new THREE.TorusGeometry(0.03, 0.003, 6, 20), M.darkSteel, fl.x, Y + 0.205, fl.z).rotation.x = Math.PI / 2;

  // ------------------------------------------------------------ bagno di ghiaccio
  const ib = LAYOUT.icebath;
  const icebath = { kind: 'icebath', id: 'icebath', hit: [], zone: { x: ib.x, z: ib.z, hx: 0.115, hz: 0.135, y: Y + 0.006 } };
  const tub = std({ color: 0x2f6fd1, roughness: 0.5 });
  const [tw, td, th] = [0.26, 0.3, 0.09];
  icebath.hit.push(solid(tw, 0.006, td, tub, ib.x, Y + 0.003, ib.z, icebath));
  for (const [w, d, dx, dz] of [[tw, 0.01, 0, -td / 2], [tw, 0.01, 0, td / 2], [0.01, td, -tw / 2, 0], [0.01, td, tw / 2, 0]]) icebath.hit.push(solid(w, th, d, tub, ib.x + dx, Y + th / 2, ib.z + dz, icebath));
  icebath.hit.push(box(tw - 0.02, 0.05, td - 0.02, water, ib.x, Y + 0.031, ib.z, { cast: false }));
  const ice = std({ color: 0xeef6fb, roughness: 0.15, transparent: true, opacity: 0.8 });
  for (let k = 0; k < 16; k++) {
    const s = 0.018 + (k % 4) * 0.004;
    const cube = mesh(new THREE.BoxGeometry(s, s, s), ice, ib.x + (((k * 37) % 11) / 11 - 0.5) * 0.2, Y + 0.054, ib.z + (((k * 53) % 13) / 13 - 0.5) * 0.24, { cast: false });
    cube.rotation.set(k * 0.7, k * 1.3, k * 0.4);
  }
  fixtures.push(icebath);

  // ------------------------------------------------------------ distillazione: mantello, testa, refrigerante
  const st = LAYOUT.still;
  const mantle = { kind: 'mantle', id: 'mantle', hit: [], level: 0, T: 295 };
  const mantleMat = std({ color: 0x8b9097, roughness: 0.6, emissive: 0xff3300, emissiveIntensity: 0 });
  mantle.hit.push(mesh(new THREE.CylinderGeometry(0.068, 0.072, 0.09, seg(24, 12), 1, true), mantleMat, st.x, Y + 0.045, st.z));
  mantle.hit.push(mesh(new THREE.TorusGeometry(0.06, 0.009, 8, seg(24, 12)), mantleMat, st.x, Y + 0.09, st.z));
  mantle.hit[1].rotation.x = Math.PI / 2;
  const cup = mesh(new THREE.SphereGeometry(0.044, seg(20, 10), 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std({ color: 0xd8cfb8, roughness: 0.9, side: THREE.DoubleSide }), st.x, Y + 0.086, st.z);
  mantle.hit.push(cup);
  physics.cylinder(st.x, Y + 0.03, st.z, 0.03, 0.07, mantle);
  mantle.hit.push(solid(0.06, 0.05, 0.1, M.instrument, st.x + 0.1, Y + 0.025, st.z, mantle));
  const mKnob = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 14), M.black, st.x + 0.134, Y + 0.028, st.z);
  mKnob.rotation.z = Math.PI / 2;
  mantle.hit.push(mKnob);
  mantle.mat = mantleMat;
  mantle.knob = mKnob;
  fixtures.push(mantle);
  // la testa sul collo del pallone (che il gioco monta in `mounts.flask`), il braccio verso il refrigerante
  const flaskY = Y + 0.062;
  const neckTop = flaskY + 0.135;
  tube(new THREE.Vector3(st.x, neckTop - 0.01, st.z), new THREE.Vector3(st.x, neckTop + 0.1, st.z), 0.0125, glass);
  const armA = new THREE.Vector3(st.x, neckTop + 0.07, st.z);
  const condA = new THREE.Vector3(st.x, neckTop + 0.055, st.z + 0.08);
  const condB = new THREE.Vector3(st.x, Y + 0.2, st.z + 0.45);
  tube(armA, condA, 0.006, glass);
  tube(condA, condB, 0.017, glass);
  tube(condA, condB, 0.0055, glass);
  // acqua di raffreddamento: entra dal basso, esce dall'alto
  const hoseIn = std({ color: 0x2f6fd1, roughness: 0.6 });
  const hoseOut = std({ color: 0xc8161d, roughness: 0.6 });
  const along = (t) => condA.clone().lerp(condB, t);
  tube(along(0.9), along(0.9).add(new THREE.Vector3(-0.12, -0.05, 0)), 0.004, hoseIn);
  tube(along(0.1), along(0.1).add(new THREE.Vector3(-0.12, 0.02, 0)), 0.004, hoseOut);
  const outlet = { x: st.x, y: Y + 0.158, z: st.z + 0.475 };
  tube(condB, new THREE.Vector3(outlet.x, outlet.y + 0.03, outlet.z), 0.006, glass);
  tube(new THREE.Vector3(outlet.x, outlet.y + 0.03, outlet.z), new THREE.Vector3(outlet.x, outlet.y, outlet.z), 0.004, glass);
  // sostegno del refrigerante
  rod(st.x - 0.12, st.z + 0.26, Y, 0.38);
  physics.cylinder(st.x - 0.12, Y + 0.19, st.z + 0.26, 0.19, 0.007);
  solid(0.1, 0.012, 0.14, M.darkSteel, st.x - 0.12, Y + 0.006, st.z + 0.26, { kind: 'surface' });
  box(0.12, 0.01, 0.01, M.darkSteel, st.x - 0.06, along(0.48).y, along(0.48).z);
  // termometro digitale nella testa, con il display
  const headY = neckTop + 0.1;
  rod(st.x, st.z, headY, 0.03, M.darkSteel, 0.008);
  const headLcd = lcdTexture(160, 56);
  const headScreen = mesh(new THREE.PlaneGeometry(0.06, 0.021), new THREE.MeshBasicMaterial({ map: headLcd.tex, toneMapped: false }), st.x + 0.012, headY + 0.045, st.z, { cast: false });
  headScreen.rotation.y = Math.PI / 2;
  box(0.012, 0.03, 0.068, M.darkSteel, st.x + 0.005, headY + 0.045, st.z);
  mantle.hit.push(headScreen);

  // ------------------------------------------------------------ cappa: alimentatore ed elettrodi
  const pw = LAYOUT.power;
  const power = { kind: 'power', id: 'power', hit: [], volts: 0, current: 0, cell: { x: pw.x - 0.36, z: pw.z, r: 0.045, y: Y } };
  power.hit.push(solid(0.16, 0.1, 0.2, std({ color: 0x3b4450, roughness: 0.5 }), pw.x, Y + 0.05, pw.z, power));
  const pLcd = lcdTexture(320, 64);
  const pScreen = mesh(new THREE.PlaneGeometry(0.13, 0.026), new THREE.MeshBasicMaterial({ map: pLcd.tex, toneMapped: false }), pw.x - 0.081, Y + 0.068, pw.z, { cast: false });
  pScreen.rotation.y = -Math.PI / 2;
  power.hit.push(pScreen);
  const pKnob = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 14), M.black, pw.x - 0.086, Y + 0.028, pw.z + 0.05);
  pKnob.rotation.z = Math.PI / 2;
  power.hit.push(pKnob);
  power.knob = pKnob;
  const terminals = [[M.red, -0.03], [M.black, 0.03]].map(([mat, dz]) => mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.014, 10), mat, pw.x - 0.086, Y + 0.028, pw.z - 0.04 + dz).rotateZ(Math.PI / 2));
  power.hit.push(...terminals);
  // sostegno con la barra degli elettrodi di grafite, sopra il punto in cui va il becher
  const c = power.cell;
  rod(pw.x - 0.16, pw.z, Y, 0.3);
  physics.cylinder(pw.x - 0.16, Y + 0.15, pw.z, 0.15, 0.007);
  box(0.21, 0.012, 0.012, M.darkSteel, c.x + 0.095, Y + 0.24, c.z);
  box(0.018, 0.016, 0.05, std({ color: 0xe8e6df, roughness: 0.5 }), c.x, Y + 0.24, c.z);
  for (const dz of [-0.013, 0.013]) mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.225, 10), graphite, c.x, Y + 0.012 + 0.1125, c.z + dz, { cast: false });
  power.electrodes = [{ x: c.x, z: c.z - 0.013 }, { x: c.x, z: c.z + 0.013 }];
  // fili dai morsetti agli elettrodi
  tube(new THREE.Vector3(pw.x - 0.09, Y + 0.028, pw.z - 0.07), new THREE.Vector3(c.x, Y + 0.25, c.z - 0.013), 0.0018, M.red);
  tube(new THREE.Vector3(pw.x - 0.09, Y + 0.028, pw.z - 0.01), new THREE.Vector3(c.x, Y + 0.25, c.z + 0.013), 0.0018, M.black);
  power.lcd = pLcd;
  fixtures.push(power);

  // ------------------------------------------------------------ cappa: bombole dei gas con il tubo di uscita
  const gr = LAYOUT.gasRack;
  const gasOutlet = { x: gr.outX, y: Y + 0.012, z: gr.outZ, r: 0.04 };
  const zs = GAS_CYLINDERS.map((_, i) => gr.z0 + i * gr.step);
  const body = std({ color: 0x5c6670, roughness: 0.4, metalness: 0.3 });
  const gases = GAS_CYLINDERS.map((g, i) => {
    const z = zs[i];
    const f = { kind: 'gas', id: `gas-${g.gas}`, gas: g.gas, formula: g.formula, hit: [], open: false };
    f.hit.push(mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.36, seg(20, 12)), body, gr.x, Y + 0.18, z));
    f.hit.push(mesh(new THREE.SphereGeometry(0.034, seg(20, 12), 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: g.shoulder, roughness: 0.4 }), gr.x, Y + 0.36, z));
    physics.cylinder(gr.x, Y + 0.2, z, 0.2, 0.035, f);
    // valvola con il volantino (gira quando si apre)
    f.hit.push(mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.05, 10), brass, gr.x, Y + 0.415, z));
    const wheel = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 12), M.black, gr.x, Y + 0.445, z);
    f.hit.push(wheel);
    f.wheel = wheel;
    // fascia con la formula, rivolta verso chi guarda dalla cappa (−x)
    const lbl = mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshStandardMaterial({ map: h.canvasTexture(128, 128, (cg, w, hh) => {
      cg.fillStyle = '#ffffff';
      cg.fillRect(0, 0, w, hh);
      cg.fillStyle = g.shoulder === '#f4f4f0' ? '#1d2733' : g.shoulder;
      cg.fillRect(0, 0, w, 18);
      cg.fillStyle = '#10161e';
      cg.font = '700 52px "IBM Plex Sans", sans-serif';
      cg.textAlign = 'center';
      cg.fillText(g.formula, w / 2, 84);
    }), roughness: 0.7 }), gr.x - 0.0345, Y + 0.24, z, { cast: false });
    lbl.rotation.y = -Math.PI / 2;
    f.hit.push(lbl);
    // tubo dalla valvola al collettore
    tube(new THREE.Vector3(gr.x, Y + 0.43, z), new THREE.Vector3(gr.x - 0.05, Y + 0.48, z), 0.003, std({ color: 0xd8dde2, roughness: 0.4 }));
    fixtures.push(f);
    return f;
  });
  const pipe = std({ color: 0xd8dde2, roughness: 0.4 });
  tube(new THREE.Vector3(gr.x - 0.05, Y + 0.48, zs[0] - 0.01), new THREE.Vector3(gr.x - 0.05, Y + 0.48, zs[zs.length - 1] + 0.01), 0.004, pipe);
  tube(new THREE.Vector3(gr.x - 0.05, Y + 0.48, gr.outZ), new THREE.Vector3(gasOutlet.x, Y + 0.48, gr.outZ), 0.004, pipe);
  tube(new THREE.Vector3(gasOutlet.x, Y + 0.48, gr.outZ), new THREE.Vector3(gasOutlet.x, gasOutlet.y, gr.outZ), 0.003, glass);

  const update = (dt) => {
    mantle.T += (295 + mantle.level * 45 - mantle.T) * Math.min(1, dt * 0.5);
    mantleMat.emissiveIntensity = Math.max(0, (mantle.T - 420) / 600);
    mantle.knob.rotation.x = -mantle.level * 0.9;
    power.knob.rotation.x = -power.volts * 0.35;
    for (const g of gases) g.wheel.rotation.y += ((g.open ? -2.4 : 0) - g.wheel.rotation.y) * Math.min(1, dt * 6);
    rackTongs.visible = !tongs.taken;
  };

  return {
    update,
    tongs,
    mantle,
    power,
    gases,
    icebath,
    gasOutlet,
    still: { outlet, headLcd },
    // dove il gioco monta la vetreria fissa: buretta (punta), imbuto (punta del gambo), pallone (fondo)
    mounts: {
      burette: { x: bu.x, y: Y + 0.165, z: bu.z },
      funnel: { x: fl.x, y: Y + 0.15, z: fl.z },
      flask: { x: st.x, y: flaskY, z: st.z },
    },
  };
}
