import * as THREE from 'three';
import { createAllSegmentGeometries } from '../shapes/ShapeFactory.js';
import { DIMENSION_COUNT } from '../data/TaxonomyDimensions.js';

const CROSSFADE_DURATION = 0.4;
const WAVE_LAPS = 2;
const WAVE_DURATION = 1.75 * WAVE_LAPS;
const SETTLE_DURATION = 1.5;
const TOTAL_DURATION = WAVE_DURATION + SETTLE_DURATION;
const WAVE_MAX_SCALE = 3.0;
const BUMP_SPAN = 0.3;
const DARK_COLOR = new THREE.Color(0x222222);

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export class Animator {
  /** @param {import('../scene/SceneManager.js').SceneManager} sceneManager */
  constructor(sceneManager) {
    this._tweens = [];
    sceneManager.onTick((dt) => this._update(dt));
  }

  /**
   * Stadium-wave entrance: a peak rotates around the chart one sector at a
   * time, then needed segments rise to their final height.
   * @param {import('../shapes/ExperienceShape.js').ExperienceShape} shape
   * @param {number[]} targetScores
   */
  animateWaveEntrance(shape, targetScores) {
    shape.mesh.visible = false;
    const baseY = shape.mesh.position.y;
    const parent = shape.mesh.parent;

    const group = new THREE.Group();
    const allSegments = createAllSegmentGeometries();
    const profileColor = shape.mesh.material.color.clone();
    const profileEmissive = shape.mesh.material.emissive.clone();

    const entries = allSegments.map(({ geometry, sector, level }, idx) => {
      const mat = shape.mesh.material.clone();
      mat.color.copy(DARK_COLOR);
      mat.emissive.copy(DARK_COLOR);
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = baseY;
      mesh.scale.z = 0;
      group.add(mesh);
      return { mesh, sector, level, idx };
    });

    parent.add(group);

    this._tweens.push({
      elapsed: 0,
      duration: TOTAL_DURATION,
      tick(t) {
        const elapsed = t * TOTAL_DURATION;

        if (elapsed <= WAVE_DURATION) {
          const waveFront = (elapsed / WAVE_DURATION * WAVE_LAPS) % 1;

          for (const { mesh, sector } of entries) {
            const sectorPos = sector / DIMENSION_COUNT;
            let dist = waveFront - sectorPos;
            if (dist < -0.5) dist += 1;
            if (dist > 0.5) dist -= 1;
            const localT = dist / BUMP_SPAN + 0.5;

            if (localT > 0 && localT < 1) {
              const intensity = Math.sin(localT * Math.PI);
              mesh.scale.z = WAVE_MAX_SCALE * intensity;
              mesh.material.color.lerpColors(DARK_COLOR, profileColor, intensity);
              mesh.material.emissive.lerpColors(DARK_COLOR, profileEmissive, intensity);
            } else {
              mesh.scale.z = 0;
              mesh.material.color.copy(DARK_COLOR);
              mesh.material.emissive.copy(DARK_COLOR);
            }
          }
        } else {
          const settleT = easeOutCubic((elapsed - WAVE_DURATION) / SETTLE_DURATION);
          for (const { mesh, sector, level } of entries) {
            const needed = level <= targetScores[sector];
            if (needed) {
              mesh.scale.z = settleT;
              mesh.material.color.lerpColors(DARK_COLOR, profileColor, settleT);
              mesh.material.emissive.lerpColors(DARK_COLOR, profileEmissive, settleT);
            } else {
              mesh.scale.z = 0;
            }
          }
        }
      },
      onComplete() {
        parent.remove(group);
        for (const { mesh } of entries) {
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
        shape.mesh.visible = true;
      },
    });
  }

  /**
   * Scale-out exit animation, calls onComplete when done.
   * @param {THREE.Mesh} mesh
   * @param {() => void} onComplete
   */
  animateExit(mesh, onComplete) {
    const startScale = mesh.scale.x;
    this._tweens.push({
      elapsed: 0,
      duration: CROSSFADE_DURATION,
      tick(t) {
        const s = startScale * (1 - easeOutCubic(t));
        mesh.scale.set(s, s, s);
      },
      onComplete,
    });
  }

  /**
   * Crossfade from old mesh to new mesh.
   * @param {THREE.Mesh} oldMesh
   * @param {THREE.Mesh} newMesh
   * @param {() => void} onComplete  Called when old mesh can be removed.
   */
  crossfade(oldMesh, newMesh, onComplete) {
    const oldOpacity = oldMesh.material.opacity;
    const newOpacity = newMesh.material.opacity;
    newMesh.material.opacity = 0;

    this._tweens.push({
      elapsed: 0,
      duration: CROSSFADE_DURATION,
      tick(t) {
        const e = easeOutCubic(t);
        oldMesh.material.opacity = oldOpacity * (1 - e);
        newMesh.material.opacity = newOpacity * e;
      },
      onComplete,
    });
  }

  _update(dt) {
    for (let i = this._tweens.length - 1; i >= 0; i--) {
      const tween = this._tweens[i];
      tween.elapsed += dt;
      const t = Math.min(tween.elapsed / tween.duration, 1);
      tween.tick(t);
      if (t >= 1) {
        this._tweens.splice(i, 1);
        tween.onComplete?.();
      }
    }
  }
}
