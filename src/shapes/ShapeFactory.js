import * as THREE from 'three';
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
 * Build individual cell geometries for only the active cells in the given scores.
 *
 * @param {number[][]} scores  Array of sorted level arrays per dimension
 * @returns {{ geometry: THREE.ExtrudeGeometry, sector: number, level: number }[]}
 */
export function createCellGeometries(scores) {
  const cells = [];
  for (let i = 0; i < DIMENSION_COUNT; i++) {
    for (const level of scores[i]) {
      cells.push({ geometry: buildRingSegment(i, level), sector: i, level });
    }
  }
  return cells;
}

/**
 * Build cell geometries for all 40 cells (10 dims × 4 levels), each tagged
 * with whether it is active based on the given scores.
 *
 * @param {number[][]} scores  Array of sorted level arrays per dimension
 * @returns {{ geometry: THREE.ExtrudeGeometry, sector: number, level: number, active: boolean }[]}
 */
export function createAllCellGeometries(scores) {
  const cells = [];
  for (let sector = 0; sector < DIMENSION_COUNT; sector++) {
    const activeLevels = scores[sector];
    for (let level = 1; level <= MAX_SCORE; level++) {
      cells.push({
        geometry: buildRingSegment(sector, level),
        sector,
        level,
        active: activeLevels.includes(level),
      });
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
function buildRingSegment(sectorIndex, level) {
  const innerR = (level - 1) * RADIUS_PER_LEVEL + RADIAL_GAP / 2;
  const outerR = level * RADIUS_PER_LEVEL - RADIAL_GAP / 2;

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
