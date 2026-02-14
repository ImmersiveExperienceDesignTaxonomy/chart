import * as THREE from 'three';
import { DIMENSION_COUNT, MAX_SCORE } from '../data/TaxonomyDimensions.js';
import { polarToCartesian } from '../utils/polar.js';

/**
 * Unit radius per score level — each concentric ring sits at level * RADIUS_PER_LEVEL.
 */
export const RADIUS_PER_LEVEL = 1;

/**
 * Build concentric nonagon rings (levels 1–4) and 9 axis spokes on the XZ plane.
 * Returns a Group to add to the scene.
 */
export function createRadarGrid({
  gridColor = 0x555555,
  gridOpacity = 0.5,
  spokeColor = 0x444444,
  spokeOpacity = 0.35,
} = {}) {
  const group = new THREE.Group();
  group.userData.type = 'radarGrid';

  // Concentric rings
  for (let level = 1; level <= MAX_SCORE; level++) {
    const radius = level * RADIUS_PER_LEVEL;
    const points = [];
    for (let i = 0; i <= DIMENSION_COUNT; i++) {
      const idx = i % DIMENSION_COUNT;
      const { x, z } = polarToCartesian(idx, radius);
      points.push(new THREE.Vector3(x, 0, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: gridColor, transparent: true, opacity: gridOpacity });
    const line = new THREE.Line(geometry, material);
    line.userData.gridRole = 'ring';
    group.add(line);
  }

  // Axis spokes
  const maxRadius = MAX_SCORE * RADIUS_PER_LEVEL;
  for (let i = 0; i < DIMENSION_COUNT; i++) {
    const { x, z } = polarToCartesian(i, maxRadius);
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, 0, z),
    ]);
    const material = new THREE.LineBasicMaterial({ color: spokeColor, transparent: true, opacity: spokeOpacity });
    const line = new THREE.Line(geometry, material);
    line.userData.gridRole = 'spoke';
    group.add(line);
  }

  return group;
}
