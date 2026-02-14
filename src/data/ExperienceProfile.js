import { DIMENSION_COUNT, MAX_SCORE } from './TaxonomyDimensions.js';

let nextId = 1;

export class ExperienceProfile {
  /**
   * @param {{ name: string, scores: number[], color?: number }} opts
   */
  constructor({ name, scores, color }) {
    if (!name) throw new Error('ExperienceProfile requires a name');
    if (!Array.isArray(scores) || scores.length !== DIMENSION_COUNT) {
      throw new Error(`scores must be an array of ${DIMENSION_COUNT} numbers`);
    }
    for (const s of scores) {
      if (s < 0 || s > MAX_SCORE || !Number.isInteger(s)) {
        throw new Error(`Each score must be an integer 0–${MAX_SCORE}`);
      }
    }

    this.id = nextId++;
    this.name = name;
    this.scores = [...scores];
    this.color = color ?? null;
  }
}
