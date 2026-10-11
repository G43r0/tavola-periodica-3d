// Mirino attorno alla particella selezionata: un anello sottile e quattro archi che ruotano,
// sempre rivolti verso la camera e visibili anche se la particella è in parte coperta.
import * as THREE from 'three';

const COLORS = { proton: 0xff5d6c, neutron: 0xb4c6e4, electron: 0x5ce1ff };

export class SelectionMarker {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'mirino';
    this.group.visible = false;
    this.group.renderOrder = 10;
    scene.add(this.group);

    const mat = () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
    this.ringMaterial = mat();
    this.arcMaterial = mat();
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.045, 96), this.ringMaterial);
    this.arcs = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const arc = new THREE.Mesh(new THREE.RingGeometry(1.16, 1.24, 24, 1, (i * Math.PI) / 2 + 0.25, Math.PI / 2 - 0.5), this.arcMaterial);
      this.arcs.add(arc);
    }
    this.group.add(this.ring, this.arcs);
    for (const m of [this.ring, ...this.arcs.children]) m.renderOrder = 10;
    this.fade = { cur: 0, target: 0 };
    this.radius = 1;
    this.appear = 0;
  }

  show(kind, radius) {
    const color = COLORS[kind] ?? 0xffffff;
    this.ringMaterial.color.setHex(color);
    this.arcMaterial.color.setHex(color);
    this.radius = radius;
    this.fade.target = 1;
    this.appear = 0;
  }

  hide() {
    this.fade.target = 0;
  }

  /**
   * @param {THREE.Vector3|null} position posizione della particella (null = nascondi)
   * @param {number} visibility moltiplicatore (es. 0 durante la vista dei quark)
   */
  update(dt, time, position, camera, visibility = 1) {
    this.fade.cur += (this.fade.target - this.fade.cur) * (1 - Math.exp(-dt * 8));
    const opacity = this.fade.cur * visibility;
    this.group.visible = opacity > 0.01 && Boolean(position);
    if (!this.group.visible) return;
    this.appear = Math.min(1, this.appear + dt * 2.5);
    const pop = 1 + 0.6 * (1 - this.appear) ** 3; // si stringe sulla particella quando compare
    this.group.position.copy(position);
    this.group.quaternion.copy(camera.quaternion);
    this.group.scale.setScalar(this.radius * pop * (1 + 0.04 * Math.sin(time * 4)));
    this.arcs.rotation.z = -time * 0.8;
    this.ringMaterial.opacity = 0.75 * opacity;
    this.arcMaterial.opacity = 0.95 * opacity;
  }
}
