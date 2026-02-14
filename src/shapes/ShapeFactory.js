import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { DIMENSION_COUNT, MAX_SCORE } from '../data/TaxonomyDimensions.js';
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
 * Scores may be floats: full ring segments are drawn for levels 1–floor(score),
 * and a partial ring segment is drawn for the fractional remainder with its
 * outerR interpolated within that level's band.
 *
 * @param {number[]} scores  Array of numbers (0–4, may be fractional)
 * @returns {THREE.BufferGeometry}
 */
export function createShapeGeometry(scores) {
  const ringGeometries = [];

  for (let i = 0; i < DIMENSION_COUNT; i++) {
    const score = scores[i];
    const fullLevels = Math.floor(score);
    const frac = score - fullLevels;

    for (let level = 1; level <= fullLevels; level++) {
      ringGeometries.push(buildRingSegment(i, level));
    }

    if (frac > 0) {
      const partialLevel = fullLevels + 1;
      const innerR = (partialLevel - 1) * RADIUS_PER_LEVEL + RADIAL_GAP / 2;
      const fullOuterR = partialLevel * RADIUS_PER_LEVEL - RADIAL_GAP / 2;
      const partialOuterR = innerR + (fullOuterR - innerR) * frac;
      if (partialOuterR > innerR) {
        ringGeometries.push(buildRingSegment(i, partialLevel, partialOuterR));
      }
    }
  }

  if (ringGeometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  const merged = mergeGeometries(ringGeometries);

  for (const g of ringGeometries) g.dispose();

  return merged;
}

/**
 * Build individual cell geometries for only the cells present in the given scores.
 * Returns metadata per cell so each can be rendered as its own mesh.
 *
 * @param {number[]} scores
 * @returns {{ geometry: THREE.ExtrudeGeometry, sector: number, level: number }[]}
 */
export function createCellGeometries(scores) {
  const cells = [];
  for (let i = 0; i < DIMENSION_COUNT; i++) {
    const score = scores[i];
    const fullLevels = Math.floor(score);
    const frac = score - fullLevels;

    for (let level = 1; level <= fullLevels; level++) {
      cells.push({ geometry: buildRingSegment(i, level), sector: i, level });
    }

    if (frac > 0) {
      const partialLevel = fullLevels + 1;
      const innerR = (partialLevel - 1) * RADIUS_PER_LEVEL + RADIAL_GAP / 2;
      const fullOuterR = partialLevel * RADIUS_PER_LEVEL - RADIAL_GAP / 2;
      const partialOuterR = innerR + (fullOuterR - innerR) * frac;
      if (partialOuterR > innerR) {
        cells.push({
          geometry: buildRingSegment(i, partialLevel, partialOuterR),
          sector: i,
          level: partialLevel,
        });
      }
    }
  }
  return cells;
}

/**
 * Create individual segment geometries for every sector × level combination.
 * Used by the wave entrance animation to animate each "building" independently.
 *
 * @returns {{ geometry: THREE.ExtrudeGeometry, sector: number, level: number }[]}
 */
export function createAllSegmentGeometries() {
  const segments = [];
  for (let sector = 0; sector < DIMENSION_COUNT; sector++) {
    for (let level = 1; level <= MAX_SCORE; level++) {
      segments.push({ geometry: buildRingSegment(sector, level), sector, level });
    }
  }
  return segments;
}

/** @returns {THREE.ExtrudeGeometry} */
function buildRingSegment(sectorIndex, level, overrideOuterR) {
  const innerR = (level - 1) * RADIUS_PER_LEVEL + RADIAL_GAP / 2;
  const outerR = overrideOuterR ?? (level * RADIUS_PER_LEVEL - RADIAL_GAP / 2);

  const i = sectorIndex;
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

  return new THREE.ExtrudeGeometry(ring, EXTRUDE_SETTINGS);
}
