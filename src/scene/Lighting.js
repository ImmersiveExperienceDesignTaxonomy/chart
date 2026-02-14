import * as THREE from 'three';

/**
 * Add ambient + directional lights to the scene.
 * @param {THREE.Scene} scene
 */
export function createLighting(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(4, 8, 3);
  scene.add(directional);
}
