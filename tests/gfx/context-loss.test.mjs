// Test del ripristino dopo un contesto WebGL perso (src/gfx/context-loss.js): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { swapTexture, watchContextLoss } from '../../src/gfx/context-loss.js';

test('swapTexture: la mappa d’ambiente nuova va nella scena e in ogni materiale che usava la vecchia', () => {
  const oldTex = new THREE.Texture();
  const newTex = new THREE.Texture();
  const other = new THREE.Texture();
  const scene = new THREE.Scene();
  scene.environment = oldTex;
  const metal = new THREE.MeshStandardMaterial({ envMap: oldTex });
  const glass = new THREE.MeshPhysicalMaterial({ envMap: oldTex, map: other });
  const plain = new THREE.MeshStandardMaterial();
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(), [metal, plain]));
  scene.add(group, new THREE.Mesh(new THREE.BoxGeometry(), glass));
  // un materiale degli oggetti del simulatore che non è ancora nella scena
  const spare = new THREE.MeshStandardMaterial({ envMap: oldTex });
  const v0 = metal.version;

  const n = swapTexture({ scenes: [scene], materials: [spare, metal, null, 'x'] }, oldTex, newTex);
  assert.equal(scene.environment, newTex);
  assert.equal(metal.envMap, newTex);
  assert.equal(glass.envMap, newTex);
  assert.equal(glass.map, other, 'le altre texture restano');
  assert.equal(plain.envMap, null);
  assert.equal(spare.envMap, newTex);
  assert.ok(metal.version > v0, 'il materiale si ricompila');
  assert.equal(n, 4, 'metal, glass, spare e l’ambiente della scena (metal contato una volta)');
});

test('watchContextLoss: dice se il contesto è perso e chiama i due ganci', () => {
  const canvas = new EventTarget();
  const calls = [];
  const state = watchContextLoss(canvas, {
    onLost: () => calls.push('lost'),
    onRestored: () => calls.push('restored'),
  });
  assert.equal(state.lost, false);
  canvas.dispatchEvent(new Event('webglcontextlost'));
  assert.equal(state.lost, true);
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  assert.equal(state.lost, false);
  assert.deepEqual(calls, ['lost', 'restored']);
  assert.equal(state.losses, 1);
  state.dispose();
  canvas.dispatchEvent(new Event('webglcontextlost'));
  assert.equal(state.losses, 1, 'dopo dispose non ascolta più');
});
