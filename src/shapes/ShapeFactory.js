import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DIMENSION_COUNT } from '../data/TaxonomyDimensions.js';
import { polarToCartesian } from '../utils/polar.js';
import { RADIUS_PER_LEVEL } from '../grid/RadarGrid.js';

const EXTRUDE_DEPTH = 0.15;
const SECTOR_GAP = 0.08; // fraction of one sector's angular span
const RADIAL_GAP = 0.08; // world units, gap between concentric levels

const EXTRUDE_SETTINGS = {
  depth: EXTRUDE_DEPTH,
  bevelEnabled: true,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelSegments: 2,
};

/**
 * Build a merged BufferGeometry from dimension scores.
 * Each level of each sector is an independent ring segment with gaps
 * both angularly (between sectors) and radially (between levels).
 * The shape is constructed on the XY plane, then the caller rotates it onto XZ.
 *
 * @param {number[]} scores  Array of integers (0–4)
 * @returns {THREE.BufferGeometry}
 */
export function createShapeGeometry(scores) {
  const ringGeometries = [];

  for (let i = 0; i < DIMENSION_COUNT; i++) {
    const score = scores[i];

    for (let level = 1; level <= score; level++) {
      const innerR = (level - 1) * RADIUS_PER_LEVEL + RADIAL_GAP / 2;
      const outerR = level * RADIUS_PER_LEVEL - RADIAL_GAP / 2;

      const innerLeft = polarToCartesian(i + SECTOR_GAP / 2, innerR);
      const innerRight = polarToCartesian(i + 1 - SECTOR_GAP / 2, innerR);
      const outerLeft = polarToCartesian(i + SECTOR_GAP / 2, outerR);
      const outerRight = polarToCartesian(i + 1 - SECTOR_GAP / 2, outerR);

      // Shape lives in XY; after -PI/2 rotation, local Y maps to world -Z.
      // Negate z so the rotated mesh aligns with the grid on the XZ plane.
      const ring = new THREE.Shape();
      ring.moveTo(innerLeft.x, -innerLeft.z);
      ring.lineTo(outerLeft.x, -outerLeft.z);
      ring.lineTo(outerRight.x, -outerRight.z);
      ring.lineTo(innerRight.x, -innerRight.z);
      ring.closePath();

      ringGeometries.push(new THREE.ExtrudeGeometry(ring, EXTRUDE_SETTINGS));
    }
  }

  if (ringGeometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  const merged = mergeGeometries(ringGeometries);

  for (const g of ringGeometries) g.dispose();

  return merged;
}
