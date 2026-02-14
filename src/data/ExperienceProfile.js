import { DIMENSION_COUNT, MAX_SCORE } from './TaxonomyDimensions.js';

let nextId = 1;

/**
 * Accept either legacy `number[]` (cumulative: `3` → `[1,2,3]`) or
 * new `number[][]` (explicit sets) and return a normalized `number[][]`.
 *
 * @param {number[] | number[][]} scores
 * @returns {number[][]}
 */
export function normalizeScores(scores) {
  if (scores.length !== DIMENSION_COUNT) {
    throw new Error(`scores must have ${DIMENSION_COUNT} entries`);
  }

  return scores.map((entry) => {
    if (Array.isArray(entry)) {
      return [...entry].sort((a, b) => a - b);
    }
    if (typeof entry !== 'number' || !Number.isInteger(entry) || entry < 0 || entry > MAX_SCORE) {
      throw new Error(`Each legacy score must be an integer 0–${MAX_SCORE}`);
    }
    const levels = [];
    for (let l = 1; l <= entry; l++) levels.push(l);
    return levels;
  });
}

export class ExperienceProfile {
  /**
   * @param {{ name: string, scores: number[] | number[][], color?: number }} opts
   */
  constructor({ name, scores, color }) {
    if (!name) throw new Error('ExperienceProfile requires a name');
    if (!Array.isArray(scores) || scores.length !== DIMENSION_COUNT) {
      throw new Error(`scores must be an array of ${DIMENSION_COUNT} entries`);
    }

    this.id = nextId++;
    this.name = name;
    this.scores = normalizeScores(scores);
    this.color = color ?? null;
  }
}
