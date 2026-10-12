// Occlusione ambientale analitica tra sfere (preset Professionale): ogni punto di una superficie
// si scurisce in base a quanta parte del cielo gli coprono le sfere vicine. Per una sfera di raggio r
// a distanza l, vista con angolo θ rispetto alla normale, la copertura è cos θ · (r / l)²: una formula
// esatta e senza rumore, adatta ai nuclei (protoni e neutroni) e ai modellini molecolari.
import * as THREE from 'three';

const MAX = 1024;

export class SphereAO {
  constructor() {
    this.data = new Float32Array(MAX * 4);
    this.texture = new THREE.DataTexture(this.data, MAX, 1, THREE.RGBAFormat, THREE.FloatType);
    this.texture.needsUpdate = true;
    this.uniforms = {
      uAoSpheres: { value: this.texture },
      uAoCount: { value: 0 },
      uAoStrength: { value: 1 },
    };
    this.count = 0;
  }

  /** Inizia un nuovo elenco di sfere (da chiamare a ogni fotogramma prima di add). */
  begin() {
    this.count = 0;
  }

  add(x, y, z, r) {
    if (this.count >= MAX) return;
    this.data.set([x, y, z, r], this.count * 4);
    this.count++;
  }

  commit() {
    this.uniforms.uAoCount.value = this.count;
    this.texture.needsUpdate = true;
  }

  set enabled(on) {
    this.uniforms.uAoStrength.value = on ? 1 : 0;
  }

  /** Aggiunge l'occlusione al materiale (MeshStandardMaterial o MeshPhysicalMaterial, anche istanziato). */
  patch(material) {
    const uniforms = this.uniforms;
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vAoWorld;')
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
          vec4 aoWorld = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            aoWorld = instanceMatrix * aoWorld;
          #endif
          vAoWorld = (modelMatrix * aoWorld).xyz;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vAoWorld;
          uniform highp sampler2D uAoSpheres;
          uniform int uAoCount;
          uniform float uAoStrength;
          float sphereOcclusion(vec3 p, vec3 n) {
            float vis = 1.0;
            for (int i = 0; i < ${MAX}; i++) {
              if (i >= uAoCount) break;
              vec4 s = texelFetch(uAoSpheres, ivec2(i, 0), 0);
              vec3 d = s.xyz - p;
              float l2 = dot(d, d);
              float r2 = s.w * s.w;
              if (l2 > 20.0 * r2) continue; // troppo lontana per fare ombra
              float l = sqrt(l2);
              float c = dot(n, d) / l;
              vis *= 1.0 - clamp(c * r2 / l2, 0.0, 0.95);
            }
            return vis;
          }`,
        )
        .replace(
          '#include <lights_fragment_end>',
          `#include <lights_fragment_end>
          if (uAoStrength > 0.0) {
            float aoVis = mix(1.0, sphereOcclusion(vAoWorld, inverseTransformDirection(normal, viewMatrix)), uAoStrength);
            reflectedLight.indirectDiffuse *= aoVis;
            reflectedLight.indirectSpecular *= aoVis;
            reflectedLight.directDiffuse *= mix(1.0, aoVis, 0.55);
          }`,
        );
    };
    material.customProgramCacheKey = () => 'sphere-ao';
    material.needsUpdate = true;
    return material;
  }
}
