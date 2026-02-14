import * as THREE from 'three';
import { createAllCellGeometries } from './ShapeFactory.js';

export const STACK_SPACING = 0.2;
export const BASE_EMISSIVE_INTENSITY = 0.25;

/**
 * A group of 40 cell meshes (10 dims × 4 levels) representing one experience
 * profile. Active cells use the profile colour; inactive "ghost" cells are
 * fully transparent but still raycastable for hover/click interactions.
 */
export class ExperienceShape {
  /**
   * @param {import('../data/ExperienceProfile.js').ExperienceProfile} profile
   * @param {number} stackIndex  Vertical stacking position (0 = bottom)
   */
  constructor(profile, stackIndex) {
    this.profile = profile;

    const color = new THREE.Color(profile.color);
    this.baseMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: BASE_EMISSIVE_INTENSITY,
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      roughness: 0.4,
      metalness: 0.1,
    });

    this._ghostMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.4,
      metalness: 0.1,
    });

    this.mesh = new THREE.Group();
    this.mesh.rotation.x = -Math.PI / 2;
    this.stackIndex = stackIndex;
    this.mesh.position.y = stackIndex * STACK_SPACING;
    this.mesh.userData.profileId = profile.id;

    /** @type {{ mesh: THREE.Mesh, sector: number, level: number, active: boolean }[]} */
    this.cells = [];
    this._buildCells(profile.scores);
  }

  _buildCells(scores) {
    for (const cell of this.cells) {
      this.mesh.remove(cell.mesh);
      cell.mesh.geometry.dispose();
      cell.mesh.material.dispose();
    }
    this.cells = [];

    for (const { geometry, sector, level, active } of createAllCellGeometries(scores)) {
      const mat = active ? this.baseMaterial.clone() : this._ghostMaterial.clone();
      const cellMesh = new THREE.Mesh(geometry, mat);
      cellMesh.userData = { sector, level, active };
      this.mesh.add(cellMesh);
      this.cells.push({ mesh: cellMesh, sector, level, active });
    }
  }

  /**
   * Toggle a single cell between active and ghost. Returns the updated scores.
   * @param {number} sector
   * @param {number} level
   * @returns {number[][]}
   */
  toggleCell(sector, level) {
    const cell = this.cells.find((c) => c.sector === sector && c.level === level);
    if (!cell) return this.profile.scores;

    const dimLevels = this.profile.scores[sector];
    const wasActive = cell.active;

    if (wasActive) {
      this.profile.scores[sector] = dimLevels.filter((l) => l !== level);
    } else {
      this.profile.scores[sector] = [...dimLevels, level].sort((a, b) => a - b);
    }

    cell.active = !wasActive;
    cell.mesh.userData.active = cell.active;

    cell.mesh.material.dispose();
    cell.mesh.material = cell.active
      ? this.baseMaterial.clone()
      : this._ghostMaterial.clone();

    return this.profile.scores;
  }

  rebuildGeometry(scores) {
    this._buildCells(scores);
    this.profile.scores = scores.map((s) => [...s]);
  }

  dispose() {
    for (const cell of this.cells) {
      cell.mesh.geometry.dispose();
      cell.mesh.material.dispose();
    }
    this.baseMaterial.dispose();
    this._ghostMaterial.dispose();
  }
}
