// Campioni realistici degli elementi (preset grafico Professionale): un piccolo studio fotografico 3D
// con riflessi dell'ambiente, ombre morbide e materiali fisici (metalli spazzolati o lucidati, cristalli,
// vetro che rifrange, gas che brillano nei tubi a scarica). Due usi:
//  - createSpecimenView(): vista interattiva nella scheda dell'elemento (ruota da sola, si trascina);
//  - renderThumbnails(): miniature di tutti gli elementi per la tavola, generate poche alla volta.
// Caricato su richiesta solo con il preset Professionale.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { APPEARANCE } from './appearance.js';
import { mulberry32 } from '../viewer/orbital-math.js';

const GROUND_Y = -0.52;

// ---------------------------------------------------------------- texture procedurali (condivise)
const textures = new Map();
function canvasTexture(key, size, paint, { repeat = 1, color = false } = {}) {
  if (textures.has(key)) return textures.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  paint(g, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  textures.set(key, tex);
  return tex;
}

/** Righe sottili e irregolari: la spazzolatura dei metalli lavorati. */
const brushedTex = () =>
  canvasTexture('brushed', 512, (g, s) => {
    const rand = mulberry32(7);
    g.fillStyle = 'rgb(200,200,200)';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const y = rand() * s;
      const v = 175 + rand() * 70;
      g.strokeStyle = `rgba(${v},${v},${v},${0.15 + rand() * 0.35})`;
      g.lineWidth = 0.4 + rand() * 1.4;
      const x = rand() * s;
      const len = s * (0.3 + rand() * 0.9);
      g.beginPath();
      g.moveTo(x - len / 2, y);
      g.lineTo(x + len / 2, y + (rand() - 0.5) * 2);
      g.stroke();
    }
  });

/** Grana fitta e irregolare: metalli fusi, opachi o leggermente ossidati. */
const castTex = () =>
  canvasTexture('cast', 256, (g, s) => {
    const rand = mulberry32(11);
    const img = g.createImageData(s, s);
    for (let i = 0; i < s * s; i++) {
      const v = 160 + rand() * 95;
      img.data.set([v, v, v, 255], i * 4);
    }
    g.putImageData(img, 0, 0);
    // macchie più larghe (ossido, segni di lavorazione)
    for (let i = 0; i < 60; i++) {
      const r = 6 + rand() * 26;
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
      const v = rand() < 0.5 ? 120 : 245;
      grd.addColorStop(0, `rgba(${v},${v},${v},0.35)`);
      grd.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.save();
      g.translate(rand() * s, rand() * s);
      g.fillStyle = grd;
      g.fillRect(-r, -r, 2 * r, 2 * r);
      g.restore();
    }
  });

/** Aloni leggeri (impronte, polvere) sui metalli lucidati a specchio. */
const smudgeTex = () =>
  canvasTexture('smudge', 256, (g, s) => {
    const rand = mulberry32(5);
    g.fillStyle = 'rgb(205,205,205)';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      const r = 10 + rand() * 40;
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
      grd.addColorStop(0, 'rgba(255,255,255,0.22)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.save();
      g.translate(rand() * s, rand() * s);
      g.fillStyle = grd;
      g.fillRect(-r, -r, 2 * r, 2 * r);
      g.restore();
    }
  });

/** Fondale dello studio: grigio-blu scuro, più chiaro al centro. */
const backdropTex = () =>
  canvasTexture(
    'backdrop',
    512,
    (g, s) => {
      const grd = g.createRadialGradient(s * 0.5, s * 0.42, s * 0.05, s * 0.5, s * 0.5, s * 0.72);
      grd.addColorStop(0, '#2a3546');
      grd.addColorStop(0.55, '#141c28');
      grd.addColorStop(1, '#070b11');
      g.fillStyle = grd;
      g.fillRect(0, 0, s, s);
    },
    { color: true },
  );

/** Punto interrogativo per gli elementi mai visti. */
const questionTex = () =>
  canvasTexture(
    'question',
    256,
    (g, s) => {
      g.clearRect(0, 0, s, s);
      g.fillStyle = '#d8e4f5';
      g.font = `600 ${s * 0.78}px 'IBM Plex Sans', system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('?', s / 2, s * 0.54);
    },
    { color: true },
  );

// ---------------------------------------------------------------- geometrie
const flat = (g) => (g.index ? g.toNonIndexed() : g);
function noise3(seed) {
  const rand = mulberry32(seed);
  const waves = Array.from({ length: 7 }, () => ({
    d: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
    f: 2 + rand() * 5,
    p: rand() * 6.28,
    a: 0.5 + rand(),
  }));
  const total = waves.reduce((s, w) => s + w.a, 0);
  return (v) => waves.reduce((s, w) => s + w.a * Math.sin(v.dot(w.d) * w.f + w.p), 0) / total;
}

/** Pezzo irregolare (sasso o cristallo grezzo): icosaedro deformato. */
function lumpGeometry(seed, facets) {
  const geo = new THREE.IcosahedronGeometry(0.62, facets ? 2 : 5);
  const n = noise3(seed);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 1 + 0.22 * n(v) + (facets ? 0.06 * Math.sin(v.x * 23 + v.y * 17) : 0);
    v.multiplyScalar(k);
    v.y *= 0.72;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); // geometria non indicizzata: normali per faccia (cristallo)
  if (!facets) smoothNormals(geo);
  return geo;
}

/** Normali morbide: media delle normali delle facce che condividono lo stesso punto (anche lungo le cuciture delle UV). */
function smoothNormals(geo) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const sum = new Map();
  const key = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    const v = sum.get(k) ?? [0, 0, 0];
    v[0] += nor.getX(i);
    v[1] += nor.getY(i);
    v[2] += nor.getZ(i);
    sum.set(k, v);
  }
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = sum.get(key(i));
    const l = Math.hypot(x, y, z) || 1;
    nor.setXYZ(i, x / l, y / l, z / l);
  }
  nor.needsUpdate = true;
}

/** Gruppo di cristalli (bipiramidi allungate) che crescono da una base comune. */
function crystalsGeometry(seed, plates) {
  const rand = mulberry32(seed);
  const parts = [];
  const count = plates ? 9 : 6;
  for (let i = 0; i < count; i++) {
    const g = new THREE.OctahedronGeometry(1, 0);
    // zolfo: bipiramidi tozze; iodio: scaglie sottili
    const len = plates ? 0.3 + rand() * 0.3 : 0.28 + rand() * 0.2;
    const w = plates ? 0.24 + rand() * 0.14 : 0.2 + rand() * 0.12;
    g.scale(w, len, plates ? 0.05 + rand() * 0.04 : w * (0.75 + rand() * 0.3));
    const tilt = plates ? 1.6 : 0.9;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rand() - 0.5) * tilt, rand() * 6.28, (rand() - 0.5) * tilt));
    g.applyQuaternion(q);
    g.translate((rand() - 0.5) * 0.5, (rand() - 0.5) * 0.18, (rand() - 0.5) * 0.5);
    parts.push(flat(g));
  }
  const merged = mergeGeometries(parts);
  merged.computeVertexNormals();
  return merged;
}

/** Cristallo «a tramoggia» del bismuto: cornici quadrate che scendono a gradini. */
function hopperGeometry() {
  const parts = [];
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const size = 1 - i * 0.12;
    const bar = 0.07;
    const y = -0.32 + i * 0.075;
    const h = 0.09;
    for (const [w, d, x, z] of [
      [size, bar, 0, size / 2 - bar / 2],
      [size, bar, 0, -size / 2 + bar / 2],
      [bar, size - 2 * bar, size / 2 - bar / 2, 0],
      [bar, size - 2 * bar, -size / 2 + bar / 2, 0],
    ]) {
      const g = new THREE.BoxGeometry(w, h, d);
      g.translate(x, y, z);
      parts.push(flat(g));
    }
  }
  // fondo pieno del gradino più basso
  const base = new THREE.BoxGeometry(0.98, 0.06, 0.98);
  base.translate(0, -0.37, 0);
  parts.push(flat(base));
  return mergeGeometries(parts);
}

const AMPOULE_R = 0.6;
/** Ampolla di vetro: sfera con il collo sigillato in alto. */
function ampouleGeometry() {
  const sphere = new THREE.SphereGeometry(AMPOULE_R, 64, 48);
  const neck = new THREE.CylinderGeometry(0.05, 0.11, 0.32, 32, 1, true);
  neck.translate(0, AMPOULE_R + 0.1, 0);
  const tip = new THREE.SphereGeometry(0.05, 16, 12);
  tip.translate(0, AMPOULE_R + 0.26, 0);
  return mergeGeometries([flat(sphere), flat(neck), flat(tip)]);
}

// ---------------------------------------------------------------- materiali
const glassMaterial = () =>
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    thickness: 0.06,
    ior: 1.5,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    depthWrite: false,
  });

function metalMaterial(a) {
  // i metalli si fotografano con pannelli luminosi grandi: riflessi dell'ambiente più forti
  const m = new THREE.MeshPhysicalMaterial({ color: a.c, metalness: a.m ?? 1, roughness: a.r, envMapIntensity: 1.35 });
  if (a.fin === 'brushed') {
    m.roughnessMap = brushedTex();
    m.bumpMap = brushedTex();
    m.bumpScale = 0.22;
    m.anisotropy = 0.8;
    m.roughness = a.r * 1.15;
  } else if (a.fin === 'cast') {
    m.roughnessMap = castTex();
    m.bumpMap = castTex();
    m.bumpScale = 0.5;
    m.roughness = a.r * 1.2;
  } else {
    m.roughnessMap = smudgeTex();
    m.roughness = a.r * 1.15;
    m.clearcoat = 0.3;
    m.clearcoatRoughness = 0.04;
  }
  if (a.iri) {
    m.iridescence = a.iri;
    m.iridescenceIOR = 2.0;
    m.iridescenceThicknessRange = [180, 620];
  }
  if (a.glow) {
    m.emissive = new THREE.Color(a.glow);
    m.emissiveIntensity = a.glowK ?? 0.2;
  }
  return m;
}

/** Gas che brilla in un tubo a scarica: bagliore più intenso al centro, con filamenti che si muovono. */
function glowMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        vP = position;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;
      void main() {
        float core = pow(max(dot(vN, vV), 0.0), 1.2);
        float fil = 0.5 + 0.5 * sin(vP.x * 9.0 + sin(vP.y * 7.0 + uTime * 1.3) * 2.0 + uTime * 0.7)
                  * sin(vP.z * 8.0 - uTime * 0.9 + vP.y * 5.0);
        float a = core * (0.55 + 0.45 * fil);
        vec3 c = mix(uColor, vec3(1.0), 0.16 * core * core);
        gl_FragColor = vec4(c * a * 2.6, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Alone tenue (luce propria degli elementi molto radioattivi). */
let haloTexture = null;
function halo(color, strength, size = 2.4) {
  if (!haloTexture) {
    haloTexture = canvasTexture(
      'halo',
      128,
      (g, s) => {
        const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        grd.addColorStop(0, 'rgba(255,255,255,1)');
        grd.addColorStop(0.4, 'rgba(255,255,255,0.35)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, s, s);
      },
      { color: true },
    );
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, color, transparent: true, opacity: strength, depthWrite: false, blending: THREE.AdditiveBlending }));
  sprite.scale.setScalar(size);
  return sprite;
}

// ---------------------------------------------------------------- costruzione del campione
const shapeCache = new Map();
const cached = (key, make) => {
  if (!shapeCache.has(key)) shapeCache.set(key, make());
  return shapeCache.get(key);
};

/** Gruppo 3D del campione dell'elemento z, appoggiato a GROUND_Y. `tick(t)` anima le parti luminose. */
export function buildSpecimen(z) {
  const a = APPEARANCE[z];
  const group = new THREE.Group();
  const ticks = [];
  const solid = (geo, mat) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const ampoule = () => {
    const glass = new THREE.Mesh(cached('ampoule', ampouleGeometry), glassMaterial());
    glass.renderOrder = 2;
    group.add(glass);
    return glass;
  };

  switch (a.form) {
    case 'cube': {
      const geo = z === 83 ? cached('hopper', hopperGeometry) : cached('cube', () => new RoundedBoxGeometry(0.86, 0.86, 0.86, 6, 0.045));
      const mesh = solid(geo, metalMaterial(a));
      mesh.rotation.y = 0.55;
      break;
    }
    case 'lump': {
      const mat = new THREE.MeshPhysicalMaterial({ color: a.c, metalness: a.m, roughness: a.r, flatShading: Boolean(a.facets) });
      if (a.waxy) {
        // fosforo bianco: ceroso e un po' traslucido
        mat.transmission = 0.35;
        mat.thickness = 0.6;
        mat.attenuationColor = new THREE.Color('#e6c86e');
        mat.attenuationDistance = 0.5;
        mat.sheen = 0.4;
        mat.sheenColor = new THREE.Color('#fff6d8');
      } else {
        mat.bumpMap = castTex();
        mat.bumpScale = 0.5;
      }
      solid(lumpGeometry(z * 131, a.facets), mat);
      break;
    }
    case 'crystals': {
      const mat = new THREE.MeshPhysicalMaterial({ color: a.c, metalness: a.m, roughness: a.r, flatShading: true });
      if (z === 16) {
        // zolfo: cristalli gialli un po' traslucidi
        mat.transmission = 0.25;
        mat.thickness = 0.4;
        mat.attenuationColor = new THREE.Color('#d9a400');
        mat.attenuationDistance = 0.4;
        mat.clearcoat = 0.4;
      }
      solid(crystalsGeometry(z * 17, z === 53), mat);
      break;
    }
    case 'gas': {
      ampoule();
      if (a.glow) {
        const mat = glowMaterial(a.glow);
        const inner = new THREE.Mesh(cached('inner', () => new THREE.SphereGeometry(AMPOULE_R * 0.93, 48, 32)), mat);
        inner.renderOrder = 3;
        group.add(inner);
        // la luce del gas illumina il vetro e il piano d'appoggio
        const light = new THREE.PointLight(a.glow, 1.6, 3, 2);
        group.add(light);
        ticks.push((t) => {
          mat.uniforms.uTime.value = t;
          light.intensity = 1.5 + 0.15 * Math.sin(t * 9.0);
        });
      } else {
        const inner = new THREE.Mesh(
          cached('inner', () => new THREE.SphereGeometry(AMPOULE_R * 0.93, 48, 32)),
          new THREE.MeshBasicMaterial({ color: a.gas, transparent: true, opacity: 0.42, depthWrite: false }),
        );
        inner.renderOrder = 3;
        group.add(inner);
      }
      break;
    }
    case 'liquid': {
      ampoule();
      // liquido sul fondo (calotta sferica chiusa da una superficie piana) e vapore sopra
      const level = -0.12;
      const theta = Math.acos(level / (AMPOULE_R * 0.94));
      const cap = new THREE.SphereGeometry(AMPOULE_R * 0.94, 48, 24, 0, Math.PI * 2, theta, Math.PI - theta);
      const surfR = Math.sqrt((AMPOULE_R * 0.94) ** 2 - level ** 2);
      const surf = new THREE.CircleGeometry(surfR, 48);
      surf.rotateX(-Math.PI / 2);
      surf.translate(0, level, 0);
      const liquid = mergeGeometries([flat(cap), flat(surf)]);
      solid(liquid, new THREE.MeshPhysicalMaterial({ color: a.c, roughness: 0.08, metalness: 0, specularIntensity: 0.6, envMapIntensity: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.05 })).castShadow = false;
      const vapor = new THREE.Mesh(
        cached('inner', () => new THREE.SphereGeometry(AMPOULE_R * 0.93, 48, 32)),
        new THREE.MeshBasicMaterial({ color: a.gas, transparent: true, opacity: 0.26, depthWrite: false }),
      );
      vapor.renderOrder = 3;
      group.add(vapor);
      break;
    }
    case 'drop': {
      const geo = cached('drop', () => {
        const g = new THREE.SphereGeometry(0.5, 96, 64);
        // goccia schiacciata dal proprio peso, con il fondo piatto
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i);
          y = y < 0 ? y * 0.35 : y * 0.62;
          pos.setY(i, y);
        }
        g.computeVertexNormals();
        g.scale(1.25, 1, 1.25);
        return g;
      });
      solid(geo, new THREE.MeshPhysicalMaterial({ color: a.c, metalness: 1, roughness: a.r }));
      break;
    }
    case 'sealed': {
      ampoule();
      const blob = solid(lumpGeometry(z * 7, false), new THREE.MeshPhysicalMaterial({ color: a.c, metalness: 1, roughness: a.r }));
      blob.scale.setScalar(0.46);
      blob.position.y = -0.33;
      break;
    }
    default: {
      // mai visto: cubo di vetro smerigliato con un punto interrogativo
      const cube = new THREE.Mesh(
        cached('cube', () => new RoundedBoxGeometry(0.86, 0.86, 0.86, 6, 0.045)),
        new THREE.MeshPhysicalMaterial({ color: '#b8c6da', roughness: 0.32, transmission: 1, thickness: 0.8, ior: 1.45, depthWrite: false }),
      );
      cube.rotation.y = 0.55;
      cube.renderOrder = 2;
      group.add(cube);
      const q = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: questionTex(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
      q.rotation.y = 0.55;
      group.add(q);
    }
  }

  // appoggia il campione sul piano
  const box = new THREE.Box3().setFromObject(group);
  group.position.y = GROUND_Y - box.min.y;
  // ingombro durante la rotazione attorno all'asse verticale: sfera che lo contiene, per inquadrarlo
  group.updateMatrixWorld(true);
  let radial = 0;
  const v = new THREE.Vector3();
  group.traverse((o) => {
    const pos = o.isMesh && o.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      radial = Math.max(radial, Math.hypot(v.x, v.z));
    }
  });
  const height = box.max.y - box.min.y;
  group.userData.bounds = new THREE.Sphere(new THREE.Vector3(0, GROUND_Y + height / 2, 0), Math.hypot(radial, height / 2));

  if (a.glow && a.form === 'cube') {
    const h = halo(a.glow, (a.glowK ?? 0.2) * 1.4);
    h.position.y = box.getCenter(new THREE.Vector3()).y;
    group.add(h);
    ticks.push((t) => (h.material.opacity = (a.glowK ?? 0.2) * (1.2 + 0.3 * Math.sin(t * 1.7))));
  }
  group.userData.tick = (t) => ticks.forEach((f) => f(t));
  return group;
}

function disposeGroup(group) {
  group.traverse((o) => {
    if (!o.material) return;
    for (const m of [].concat(o.material)) m.dispose();
    // le geometrie in cache restano; le altre si liberano
    if (o.geometry && ![...shapeCache.values()].includes(o.geometry)) o.geometry.dispose();
  });
}

/** Inquadra il campione: la camera guarda il centro dell'oggetto da una distanza che lo contiene tutto. */
const VIEW_DIR = new THREE.Vector3(0, 0.27, 1).normalize();
function frameObject(camera, sphere, margin = 1) {
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * camera.aspect));
  const dist = (sphere.radius / Math.sin(fit / 2)) * margin;
  camera.position.copy(sphere.center).addScaledVector(VIEW_DIR, dist);
  camera.lookAt(sphere.center);
}

// ---------------------------------------------------------------- studio fotografico
function createStudio(renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = backdropTex();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.02).texture;
  scene.environmentIntensity = 1.25;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(-2.2, 4, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.01;
  Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 0.5, far: 10 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xb8d4ff, 0.35);
  fill.position.set(3, 1.2, -2);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.ShadowMaterial({ opacity: 0.45 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 30);
  camera.position.set(0, 0.95, 3.5);
  camera.lookAt(0, -0.06, 0);

  const holder = new THREE.Group();
  scene.add(holder);
  return { scene, camera, holder };
}

// ---------------------------------------------------------------- vista interattiva (scheda dell'elemento)
export function createSpecimenView() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * 1.25);
  const canvas = renderer.domElement;
  canvas.className = 'specimen__canvas';
  const { scene, camera, holder } = createStudio(renderer);

  let current = null;
  let host = null;
  let visible = false;
  let raf = 0;
  let last = 0;
  let time = 0;
  const rot = { yaw: 0.4, pitch: 0, vyaw: 0.35, dragging: false, lastX: 0, lastY: 0, idle: 0 };

  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) start();
  });

  function resize() {
    if (!host) return;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);

  function frame(now) {
    raf = 0;
    if (!visible || !host?.isConnected || document.hidden) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    time += dt;
    if (!rot.dragging) {
      rot.idle += dt;
      // dopo un trascinamento riprende piano la rotazione automatica
      const target = rot.idle > 1.5 ? 0.35 : rot.vyaw;
      rot.vyaw += (target - rot.vyaw) * (1 - Math.exp(-dt * 1.5));
      rot.yaw += rot.vyaw * dt;
      rot.pitch *= 1 - Math.min(1, dt * 0.8);
    }
    holder.rotation.set(rot.pitch, rot.yaw, 0);
    current?.userData.tick(time);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  canvas.addEventListener('pointerdown', (ev) => {
    rot.dragging = true;
    rot.lastX = ev.clientX;
    rot.lastY = ev.clientY;
    rot.vyaw = 0;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!rot.dragging) return;
    const dx = ev.clientX - rot.lastX;
    const dy = ev.clientY - rot.lastY;
    rot.lastX = ev.clientX;
    rot.lastY = ev.clientY;
    rot.yaw += dx * 0.012;
    rot.vyaw = dx * 0.6;
    rot.pitch = THREE.MathUtils.clamp(rot.pitch + dy * 0.008, -0.5, 0.6);
  });
  const end = () => {
    rot.dragging = false;
    rot.idle = 0;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  return {
    /** Mostra l'elemento z dentro il contenitore `el` (la tela si sposta da una scheda all'altra). */
    show(el, z) {
      if (host !== el) {
        if (host) {
          observer.unobserve(host);
          ro.unobserve(host);
        }
        host = el;
        el.append(canvas);
        observer.observe(el);
        ro.observe(el);
        resize();
      }
      if (current) {
        holder.remove(current);
        disposeGroup(current);
      }
      current = buildSpecimen(z);
      holder.add(current);
      frameObject(camera, current.userData.bounds, 0.98);
      rot.yaw = 0.4;
      rot.pitch = 0;
      start();
    },
  };
}

// ---------------------------------------------------------------- miniature per la tavola
/**
 * Genera le miniature degli elementi `zs` (poche per fotogramma) e le passa a `onThumb(z, url)`.
 * Alla fine libera il contesto grafico. Restituisce una funzione per interrompere.
 */
export function renderThumbnails(zs, size, onThumb) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  const { scene, camera, holder } = createStudio(renderer);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  holder.rotation.set(0, 0.35, 0);

  const queue = [...zs];
  let stopped = false;
  const finish = () => {
    stopped = true;
    renderer.dispose();
    renderer.forceContextLoss();
  };
  const step = () => {
    if (stopped) return;
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 12) {
      const z = queue.shift();
      const group = buildSpecimen(z);
      holder.add(group);
      frameObject(camera, group.userData.bounds, 0.95);
      group.userData.tick(1.3);
      renderer.render(scene, camera);
      holder.remove(group);
      disposeGroup(group);
      renderer.domElement.toBlob((blob) => blob && onThumb(z, URL.createObjectURL(blob)), 'image/webp', 0.9);
    }
    if (queue.length) requestAnimationFrame(step);
    else setTimeout(finish, 500); // lascia finire le ultime conversioni in immagine
  };
  requestAnimationFrame(step);
  return () => finish();
}
