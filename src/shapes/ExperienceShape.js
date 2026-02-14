import * as THREE from 'three';
import { createShapeGeometry } from './ShapeFactory.js';

export const STACK_SPACING = 0.2;

/**
 * A styled, positioned mesh representing one experience profile on the chart.
 */
export class ExperienceShape {
  /**
   * @param {import('../data/ExperienceProfile.js').ExperienceProfile} profile
   * @param {number} stackIndex  Vertical stacking position (0 = bottom)
   */
  constructor(profile, stackIndex) {
    this.profile = profile;

    const geometry = createShapeGeometry(profile.scores);
    const color = new THREE.Color(profile.color);

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.25,
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      roughness: 0.4,
      metalness: 0.1,
    });

    this.mesh = new THREE.Mesh(geometry, material);

    // ExtrudeGeometry extrudes along +Z in local space.
    // Rotate so the shape lies on the XZ world plane with extrusion going up (+Y).
    this.mesh.rotation.x = -Math.PI / 2;

    this.stackIndex = stackIndex;
    this.mesh.position.y = stackIndex * STACK_SPACING;

    this.mesh.userData.profileId = profile.id;
  }

  rebuildGeometry(scores) {
    const oldGeometry = this.mesh.geometry;
    this.mesh.geometry = createShapeGeometry(scores);
    oldGeometry.dispose();
    this.profile.scores = [...scores];
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
