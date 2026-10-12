// Scena 3D del banco: atomi (sfere con i colori CPK), legami (cilindri bicolori; doppi e tripli con
// più aste), legami ionici (tratteggio), coppie solitarie (lobi) ed elettroni spaiati (puntini).
// Gestisce puntatore e trascinamento; le decisioni chimiche le prende il controllore (lab-view.js).
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Engine } from '../viewer/engine.js';
import { gfx, seg } from '../gfx/preset.js';

const sphereGeo = new THREE.SphereGeometry(1, seg(36), seg(24));
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, seg(16), 1, false);
const lobeGeo = new THREE.SphereGeometry(1, seg(20), seg(14));
const haloMat = new THREE.MeshBasicMaterial({ color: 0x5ce1ff, transparent: true, opacity: 0.22, side: THREE.BackSide, depthWrite: false });
const pendingMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false });
const lobeMat = new THREE.MeshStandardMaterial({ color: 0xb69cff, transparent: true, opacity: 0.32, roughness: 0.6, depthWrite: false, emissive: 0x3b2a7a, emissiveIntensity: 0.4 });
const singleMat = new THREE.MeshBasicMaterial({ color: 0xffe28a });
// legami che si rompono (rosso) e che si formano (verde) durante una reazione
const breakMat = new THREE.MeshStandardMaterial({ color: 0xff5d6c, emissive: 0xff2a3d, emissiveIntensity: 1.3, roughness: 0.4 });
const formMat = new THREE.MeshStandardMaterial({ color: 0x7cf29a, emissive: 0x22d46a, emissiveIntensity: 1.1, roughness: 0.4 });
const UP = new THREE.Vector3(0, 1, 0);

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _d = new THREE.Vector3();
const _m = new THREE.Vector3();
const _q = new THREE.Quaternion();

export function createBenchScene(stage, deps) {
  const engine = new Engine(stage);
  if (engine.bloom) engine.bloom.strength = 0.2;
  const G = gfx();
  if (engine.sphereAO) for (const m of [breakMat, formMat]) engine.sphereAO.patch(m);
  engine.camera.position.set(0, 2.5, 14);
  engine.controls.minDistance = 2;
  engine.controls.maxDistance = 80;

  const root = new THREE.Group();
  engine.scene.add(root);
  const materials = new Map();
  const materialFor = (color) => {
    if (!materials.has(color)) {
      const c = new THREE.Color(color);
      // Professionale: plastica lucida dei modellini molecolari veri (vernice trasparente che riflette lo studio)
      materials.set(
        color,
        G.physical
          ? new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, emissive: c.clone().multiplyScalar(0.04) })
          : new THREE.MeshStandardMaterial({ color: c, roughness: 0.38, metalness: 0.06, emissive: c.clone().multiplyScalar(0.12) }),
      );
      engine.sphereAO?.patch(materials.get(color));
    }
    return materials.get(color);
  };

  /** @type {Map<number,{mesh:THREE.Mesh, label:CSS2DObject, labelEl:HTMLElement, disp:THREE.Vector3, halo:THREE.Mesh|null, radius:number}>} */
  const atoms = new Map();
  /** @type {Map<number,{group:THREE.Group, a:number, b:number, order:number, ionic:boolean, parts:THREE.Mesh[], line?:THREE.Line}>} */
  const bonds = new Map();
  const lobes = new Map(); // atomId → mesh[]
  const opts = { labels: true, lone: true };
  let selection = new Set();
  let pending = null;
  let bondHighlight = new Map();

  // ---------------------------------------------------------------- costruzione oggetti
  function rebuild() {
    const bench = deps.bench;
    // atomi
    for (const [id, o] of atoms) {
      if (!bench.atoms.has(id)) {
        root.remove(o.mesh);
        o.labelEl.remove();
        atoms.delete(id);
      }
    }
    for (const a of bench.atoms.values()) {
      let o = atoms.get(a.id);
      const info = deps.lab.get(a.z);
      if (!o) {
        const mesh = new THREE.Mesh(sphereGeo, materialFor(info.color));
        mesh.userData = { atomId: a.id };
        mesh.castShadow = mesh.receiveShadow = G.shadows;
        const labelEl = document.createElement('div');
        labelEl.className = 'lab-label';
        const label = new CSS2DObject(labelEl);
        mesh.add(label);
        root.add(mesh);
        o = { mesh, label, labelEl, disp: new THREE.Vector3(...(deps.spawnFrom?.(a.id) ?? a.pos)), halo: null, radius: 0.4 };
        atoms.set(a.id, o);
      }
      o.radius = deps.radiusOf(a.id);
      o.mesh.scale.setScalar(o.radius);
      const q = deps.chargeLabel(a.id);
      o.labelEl.innerHTML = `${info.symbol}${q ? `<sup>${q}</sup>` : ''}`;
      o.label.position.set(0, 0, 0);
    }
    // legami
    for (const o of bonds.values()) {
      root.remove(o.group);
      o.line?.geometry.dispose();
    }
    bonds.clear();
    for (const b of bench.bonds.values()) {
      const group = new THREE.Group();
      const parts = [];
      let line;
      if (b.ionic) {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
        const hl = bondHighlight.get(b.id);
        line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: hl === 'break' ? 0xff5d6c : hl === 'form' ? 0x7cf29a : 0xd8e4f5, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.85 }));
        line.userData = { bondId: b.id };
        group.add(line);
      } else {
        const ca = deps.lab.get(bench.atoms.get(b.a).z).color;
        const cb = deps.lab.get(bench.atoms.get(b.b).z).color;
        const hl = bondHighlight.get(b.id);
        for (let k = 0; k < b.order; k++) {
          for (const color of [ca, cb]) {
            const m = new THREE.Mesh(cylGeo, hl === 'break' ? breakMat : hl === 'form' ? formMat : materialFor(color));
            m.userData = { bondId: b.id };
            m.castShadow = m.receiveShadow = G.shadows;
            group.add(m);
            parts.push(m);
          }
        }
      }
      root.add(group);
      bonds.set(b.id, { group, a: b.a, b: b.b, order: b.order, ionic: b.ionic, parts, line });
    }
    rebuildLobes();
    applySelection();
    sync(0);
  }

  function rebuildLobes() {
    for (const list of lobes.values()) for (const m of list) root.remove(m);
    lobes.clear();
    if (!opts.lone) return;
    for (const id of deps.bench.atoms.keys()) {
      const dirs = deps.loneOf(id);
      if (!dirs?.length) continue;
      lobes.set(
        id,
        dirs.map((d) => {
          const m = new THREE.Mesh(d.kind === 'single' ? sphereGeo : lobeGeo, d.kind === 'single' ? singleMat : lobeMat);
          m.userData = { lone: true };
          root.add(m);
          return m;
        }),
      );
    }
  }

  function applySelection() {
    for (const [id, o] of atoms) {
      const want = id === pending ? pendingMat : selection.has(id) ? haloMat : null;
      if (o.halo && o.halo.material !== want) {
        o.mesh.remove(o.halo);
        o.halo = null;
      }
      if (want && !o.halo) {
        o.halo = new THREE.Mesh(sphereGeo, want);
        o.halo.scale.setScalar(1.32);
        o.halo.raycast = () => {};
        o.mesh.add(o.halo);
      }
    }
  }

  // ---------------------------------------------------------------- aggiornamento per fotogramma
  // (chiamato anche da rebuild con dt = 0, così gli oggetti appena creati non compaiono per un
  // fotogramma con la trasformazione predefinita)
  engine.add(sync);
  const shadowBox = new THREE.Box3();
  const shadowSphere = new THREE.Sphere();
  function sync(dt) {
    const k = 1 - Math.exp(-dt * 10);
    shadowBox.makeEmpty();
    for (const [id, o] of atoms) {
      const a = deps.bench.atoms.get(id);
      if (!a) continue;
      _a.set(a.pos[0], a.pos[1], a.pos[2]);
      if (drag && drag.unit.has(id)) o.disp.copy(_a);
      else o.disp.lerp(_a, k);
      o.mesh.position.copy(o.disp);
      o.label.visible = opts.labels;
      shadowBox.expandByPoint(o.disp);
    }
    // occlusione ambientale tra atomi e legami (preset Professionale)
    if (engine.sphereAO) {
      engine.sphereAO.begin();
      for (const o of atoms.values()) engine.sphereAO.add(o.disp.x, o.disp.y, o.disp.z, o.radius);
      engine.sphereAO.commit();
    }
    // ombre (preset Professionale): la mappa copre tutti gli atomi del banco, a passi di 0,5
    if (G.shadows && !shadowBox.isEmpty()) {
      shadowBox.getBoundingSphere(shadowSphere);
      const q = (v) => Math.round(v * 2) / 2;
      shadowSphere.center.set(q(shadowSphere.center.x), q(shadowSphere.center.y), q(shadowSphere.center.z));
      engine.setShadowFocus(shadowSphere.center, Math.ceil(shadowSphere.radius + 1.5));
    }
    for (const o of bonds.values()) {
      const A = atoms.get(o.a);
      const B = atoms.get(o.b);
      if (!A || !B) continue;
      if (o.ionic) {
        const p = o.line.geometry.attributes.position;
        p.setXYZ(0, A.disp.x, A.disp.y, A.disp.z);
        p.setXYZ(1, B.disp.x, B.disp.y, B.disp.z);
        p.needsUpdate = true;
        o.line.computeLineDistances();
        o.line.geometry.computeBoundingSphere();
        continue;
      }
      _d.subVectors(B.disp, A.disp);
      const L = _d.length();
      if (L < 1e-4) continue;
      _d.divideScalar(L);
      _q.setFromUnitVectors(UP, _d);
      // direzione per separare le aste dei legami multipli: nel piano di un atomo vicino
      const perp = perpendicular(o, _d);
      const offsets = o.order === 1 ? [0] : o.order === 2 ? [-0.075, 0.075] : [-0.12, 0, 0.12];
      const r = o.order === 1 ? 0.085 : 0.05;
      offsets.forEach((off, idx) => {
        for (let half = 0; half < 2; half++) {
          const m = o.parts[idx * 2 + half];
          const t0 = half === 0 ? 0 : 0.5;
          _m.copy(A.disp).addScaledVector(_d, L * (t0 + 0.25)).addScaledVector(perp, off);
          m.position.copy(_m);
          m.quaternion.copy(_q);
          m.scale.set(r, L / 2, r);
        }
      });
    }
    for (const [id, list] of lobes) {
      const o = atoms.get(id);
      const dirs = deps.loneOf(id);
      if (!o || !dirs) continue;
      list.forEach((m, idx) => {
        const d = dirs[idx];
        if (!d) return;
        _d.set(d.dir[0], d.dir[1], d.dir[2]).normalize();
        if (d.kind === 'single') {
          m.position.copy(o.disp).addScaledVector(_d, o.radius + 0.16);
          m.scale.setScalar(0.06);
        } else {
          m.position.copy(o.disp).addScaledVector(_d, o.radius + 0.12);
          m.quaternion.setFromUnitVectors(UP, _d);
          m.scale.set(0.13, 0.2, 0.13);
        }
      });
    }
  }

  // ---------------------------------------------------------------- effetti delle reazioni
  // lampo dell'urto (bagliore che si espande e svanisce) ed etichette che salgono e svaniscono (ΔH)
  const flashes = [];
  let glowMap = null;
  engine.add((dt) => {
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.t += dt;
      const k = f.t / 0.8;
      if (k >= 1) {
        root.remove(f.sprite);
        f.sprite.material.dispose();
        flashes.splice(i, 1);
        continue;
      }
      f.sprite.scale.setScalar(f.size * (0.35 + 1.65 * Math.sqrt(k)));
      f.sprite.material.opacity = 0.85 * (1 - k) ** 2;
    }
  });

  function flash(pos, color, size = 1.4) {
    if (!glowMap) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      glowMap = new THREE.CanvasTexture(c);
    }
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    sprite.position.set(pos[0], pos[1], pos[2]);
    sprite.raycast = () => {};
    root.add(sprite);
    flashes.push({ sprite, t: 0, size });
  }

  function floatText(pos, html, cls = '') {
    const el = document.createElement('div');
    el.className = 'lab-float';
    el.innerHTML = `<span class="${cls}">${html}</span>`;
    const obj = new CSS2DObject(el);
    obj.position.set(pos[0], pos[1], pos[2]);
    root.add(obj);
    setTimeout(() => root.remove(obj), 2400); // CSS2DObject toglie l'elemento dal DOM quando viene rimosso
  }

  function perpendicular(o, dir) {
    const bench = deps.bench;
    for (const end of [o.a, o.b]) {
      for (const nb of bench.bondsOf(end)) {
        const other = bench.other(nb, end);
        if (other === o.a || other === o.b) continue;
        const P = atoms.get(other);
        if (!P) continue;
        _b.subVectors(P.disp, atoms.get(end).disp);
        _b.addScaledVector(dir, -_b.dot(dir));
        if (_b.lengthSq() > 1e-4) return _b.normalize().clone();
      }
    }
    // nessun vicino: perpendicolare alla vista
    _b.subVectors(engine.camera.position, atoms.get(o.a).disp).cross(dir);
    if (_b.lengthSq() < 1e-6) _b.set(1, 0, 0).cross(dir);
    return _b.normalize().clone();
  }

  // ---------------------------------------------------------------- puntatore
  const canvas = engine.renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tip = deps.tipEl;
  let drag = null;
  let down = null;

  function setNdc(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, engine.camera);
    return r;
  }
  function pick(ev) {
    setNdc(ev);
    const atomMeshes = [...atoms.values()].map((o) => o.mesh);
    const hit = raycaster.intersectObjects(atomMeshes, false)[0];
    if (hit) return { atomId: hit.object.userData.atomId };
    const bondMeshes = [];
    for (const o of bonds.values()) bondMeshes.push(...o.parts);
    raycaster.params.Line.threshold = 0.12;
    const bh = raycaster.intersectObjects([...bondMeshes, ...[...bonds.values()].filter((o) => o.line).map((o) => o.line)], false)[0];
    if (bh) return { bondId: bh.object.userData.bondId };
    return null;
  }

  /** Punto nel piano perpendicolare alla vista che passa per `through` (default: il centro della vista). */
  function pointOnPlane(clientX, clientY, through = engine.controls.target) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, engine.camera);
    const normal = engine.camera.getWorldDirection(new THREE.Vector3());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, through);
    const out = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, out) ? out : null;
  }

  function showTip(ev, html, cls = '') {
    if (!tip) return;
    if (!html) {
      tip.hidden = true;
      return;
    }
    const r = stage.getBoundingClientRect();
    tip.innerHTML = html;
    tip.className = `lab-tip ${cls}`;
    tip.hidden = false;
    tip.style.transform = `translate(${ev.clientX - r.left + 16}px, ${ev.clientY - r.top + 14}px)`;
  }

  const preview = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineDashedMaterial({ color: 0x4ade80, dashSize: 0.14, gapSize: 0.08 }),
  );
  preview.visible = false;
  engine.scene.add(preview);

  stage.addEventListener(
    'pointerdown',
    (ev) => {
      if (ev.target !== canvas) return;
      down = { x: ev.clientX, y: ev.clientY, t: performance.now(), button: ev.button };
      if (ev.button !== 0 || deps.mode() !== 'move') return;
      const hit = pick(ev);
      if (!hit?.atomId) return;
      // trascinamento di un atomo (e della sua molecola): niente rotazione della vista
      engine.controls.enabled = false;
      const a = deps.bench.atoms.get(hit.atomId);
      const start = new THREE.Vector3(...a.pos);
      drag = { id: hit.atomId, unit: new Set(deps.unitOf(hit.atomId)), last: pointOnPlane(ev.clientX, ev.clientY, start) ?? start, start, moved: false, target: null };
      canvas.setPointerCapture?.(ev.pointerId);
    },
    { capture: true },
  );

  canvas.addEventListener('pointermove', (ev) => {
    if (drag) {
      const a = deps.bench.atoms.get(drag.id);
      const p = pointOnPlane(ev.clientX, ev.clientY, new THREE.Vector3(...a.pos));
      if (!p) return;
      const delta = p.clone().sub(drag.last);
      drag.last = p;
      if (Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 4) drag.moved = true;
      if (!drag.moved) return;
      deps.translate([...drag.unit], [delta.x, delta.y, delta.z]);
      // atomo più vicino di un'altra molecola: anteprima del legame
      let best = null;
      for (const [id, o] of atoms) {
        if (drag.unit.has(id)) continue;
        const dist = o.disp.distanceTo(new THREE.Vector3(...a.pos));
        const reach = o.radius + atoms.get(drag.id).radius + 0.9;
        if (dist < reach && (!best || dist < best.dist)) best = { id, dist };
      }
      drag.target = null;
      if (best) {
        const check = deps.previewBond(drag.id, best.id);
        drag.target = check.ok ? best.id : null;
        const pos = preview.geometry.attributes.position;
        pos.setXYZ(0, ...a.pos);
        const o = atoms.get(best.id);
        pos.setXYZ(1, o.disp.x, o.disp.y, o.disp.z);
        pos.needsUpdate = true;
        preview.computeLineDistances();
        preview.material.color.set(check.ok ? 0x4ade80 : 0xfb7185);
        preview.visible = true;
        showTip(ev, check.html, check.ok ? 'is-ok' : 'is-bad');
      } else {
        preview.visible = false;
        showTip(ev, null);
      }
      return;
    }
    const hit = pick(ev);
    canvas.style.cursor = hit ? (deps.mode() === 'cut' && hit.bondId ? 'crosshair' : 'pointer') : '';
    showTip(ev, hit ? deps.hoverHtml(hit) : null);
  });

  canvas.addEventListener('pointerleave', () => {
    if (!drag) showTip({}, null);
  });

  window.addEventListener('pointerup', (ev) => {
    const wasDrag = drag;
    if (drag) {
      engine.controls.enabled = true;
      preview.visible = false;
      showTip(ev, null);
      drag = null;
      if (wasDrag.moved) {
        deps.onDragEnd(wasDrag.id, wasDrag.target);
        down = null;
        return;
      }
    }
    if (!down || ev.target !== canvas) return;
    const click = Math.hypot(ev.clientX - down.x, ev.clientY - down.y) < 5 && performance.now() - down.t < 700;
    const button = down.button;
    down = null;
    if (!click) return;
    const hit = pick(ev);
    if (hit?.atomId) deps.onClickAtom(hit.atomId, ev);
    else if (hit?.bondId) {
      if (button === 2) deps.onRightClickBond(hit.bondId);
      else deps.onClickBond(hit.bondId, ev);
    } else if (button === 0) deps.onClickEmpty(ev);
  });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  // trascinamento di un elemento dalla tavolozza
  stage.addEventListener('dragover', (ev) => {
    if (ev.dataTransfer?.types.includes('text/x-element')) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy';
    }
  });
  stage.addEventListener('drop', (ev) => {
    const z = Number(ev.dataTransfer?.getData('text/x-element'));
    if (!z) return;
    ev.preventDefault();
    const p = pointOnPlane(ev.clientX, ev.clientY);
    deps.onDropElement(z, p ? [p.x, p.y, p.z] : null);
  });

  return {
    engine,
    rebuild,
    rebuildLobes,
    setSelection(ids) {
      selection = new Set(ids);
      applySelection();
    },
    setPending(id) {
      pending = id;
      applySelection();
    },
    /** Evidenzia i legami di una reazione: Map(bondId → 'break' | 'form'). */
    setBondHighlight(map) {
      bondHighlight = map;
      rebuild();
    },
    setOptions(o) {
      Object.assign(opts, o);
      rebuildLobes();
      sync(0);
    },
    /** Lampo luminoso in `pos` (urto tra molecole, energia liberata o assorbita). */
    flash,
    /** Etichetta che sale e svanisce in `pos` (es. ΔH di una reazione). */
    floatText,
    /** Punto libero vicino al centro della vista, lontano almeno `clearance` dagli atomi presenti. */
    freeSpot(clearance = 1.6) {
      const target = engine.controls.target.clone();
      const right = new THREE.Vector3().setFromMatrixColumn(engine.camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(engine.camera.matrixWorld, 1);
      const existing = [...deps.bench.atoms.values()].map((a) => new THREE.Vector3(...a.pos));
      for (let ring = 0; ring < 40; ring++) {
        const steps = ring === 0 ? 1 : 6 * ring;
        for (let s = 0; s < steps; s++) {
          const ang = (s / steps) * Math.PI * 2 + ring * 0.37;
          const p = target.clone().addScaledVector(right, Math.cos(ang) * ring * 1.3).addScaledVector(up, Math.sin(ang) * ring * 1.0);
          if (existing.every((e) => e.distanceTo(p) > clearance)) return [p.x, p.y, p.z];
        }
      }
      return [target.x, target.y, target.z];
    },
    /** Inquadra tutti gli atomi. */
    frameAll(duration = 1) {
      const pts = [...deps.bench.atoms.values()].map((a) => new THREE.Vector3(...a.pos));
      if (!pts.length) return;
      const c = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(pts.length);
      const r = Math.max(2.5, ...pts.map((p) => p.distanceTo(c) + 0.8));
      engine.flyToDistance(engine.fitDistance(r), c, duration);
    },
    pointOnPlane,
    isDragging: () => Boolean(drag),
  };
}
