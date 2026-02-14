import * as THREE from 'three';
import { DIMENSION_COUNT } from '../data/TaxonomyDimensions.js';
import { polarToCartesian } from '../utils/polar.js';
import { RADIUS_PER_LEVEL } from '../grid/RadarGrid.js';

const EXTRUDE_DEPTH = 0.15;

/**
 * Build an ExtrudeGeometry from 9 dimension scores.
 * The shape is constructed on the XY plane, then the caller rotates it onto XZ.
 *
 * @param {number[]} scores  Array of 9 integers (0–4)
 * @returns {THREE.ExtrudeGeometry}
 */
export function createShapeGeometry(scores) {
  const shape = new THREE.Shape();

  for (let i = 0; i <= DIMENSION_COUNT; i++) {
    const idx = i % DIMENSION_COUNT;
    const radius = Math.max(scores[idx], 0.05) * RADIUS_PER_LEVEL;
    const { x, z } = polarToCartesian(idx, radius);
    // Shape lives in XY; after -PI/2 rotation, local Y maps to world -Z.
    // Negate z so the rotated mesh aligns with the grid on the XZ plane.
    if (i === 0) {
      shape.moveTo(x, -z);
    } else {
      shape.lineTo(x, -z);
    }
  }

  return new THREE.ExtrudeGeometry(shape, {
    depth: EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
}
