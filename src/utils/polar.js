import { DIMENSION_COUNT } from '../data/TaxonomyDimensions.js';

export const ANGLE_STEP = (2 * Math.PI) / DIMENSION_COUNT;

/**
 * Convert a dimension index and radius to XZ-plane cartesian coordinates.
 * Axis 0 points along +Z; subsequent axes proceed clockwise when viewed from above.
 *
 * @param {number} index  Dimension index (0 to DIMENSION_COUNT−1)
 * @param {number} radius Distance from center
 * @returns {{ x: number, z: number }}
 */
export function polarToCartesian(index, radius) {
  const angle = index * ANGLE_STEP;
  return {
    x: radius * Math.sin(angle),
    z: radius * Math.cos(angle),
  };
}

/**
 * Returns the angle in radians for a given dimension index.
 * @param {number} index
 * @returns {number}
 */
export function axisAngle(index) {
  return index * ANGLE_STEP;
}

/**
 * Returns the midpoint angle of sector `index` (halfway between two spokes).
 * @param {number} index
 * @returns {number}
 */
export function sectorMidAngle(index) {
  return (index + 0.5) * ANGLE_STEP;
}

/**
 * Returns the sector index (0 to DIMENSION_COUNT−1) that contains the given angle.
 * @param {number} angle  Angle in radians (from atan2)
 * @returns {number}
 */
export function sectorFromAngle(angle) {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor(normalized / ANGLE_STEP) % DIMENSION_COUNT;
}
