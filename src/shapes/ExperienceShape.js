import * as THREE from 'three';
import { createCellGeometries } from './ShapeFactory.js';

export const STACK_SPACING = 0.2;
const BASE_EMISSIVE_INTENSITY = 0.25;

/**
 * A group of individual cell meshes representing one experience profile.
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

    this.mesh = new THREE.Group();
    this.mesh.rotation.x = -Math.PI / 2;
    this.stackIndex = stackIndex;
    this.mesh.position.y = stackIndex * STACK_SPACING;
    this.mesh.userData.profileId = profile.id;

    /** @type {{ mesh: THREE.Mesh, sector: number, level: number }[]} */
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

    for (const { geometry, sector, level } of createCellGeometries(scores)) {
      const mat = this.baseMaterial.clone();
      const cellMesh = new THREE.Mesh(geometry, mat);
      cellMesh.userData = { sector, level };
      this.mesh.add(cellMesh);
      this.cells.push({ mesh: cellMesh, sector, level });
    }
  }

  rebuildGeometry(scores) {
    this._buildCells(scores);
    this.profile.scores = [...scores];
  }

  dispose() {
    for (const cell of this.cells) {
      cell.mesh.geometry.dispose();
      cell.mesh.material.dispose();
    }
    this.baseMaterial.dispose();
  }
}
