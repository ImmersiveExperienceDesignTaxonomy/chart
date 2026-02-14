import * as THREE from 'three';
import { createAllSegmentGeometries } from '../shapes/ShapeFactory.js';
import { DIMENSION_COUNT, MAX_SCORE } from '../data/TaxonomyDimensions.js';

const CROSSFADE_DURATION = 0.4;
const WAVE_DURATION = 1.75;
const PAUSE_DURATION = 0.3;
const SETTLE_DURATION = 1.5;
const TOTAL_DURATION = WAVE_DURATION + PAUSE_DURATION + SETTLE_DURATION;
const WAVE_MAX_SCALE = 3.0;
const BUMP_SPAN = 0.3;
const RADIAL_SPREAD = 0.15;
const DEFAULT_DARK_COLOR = new THREE.Color(0x222222);

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export class Animator {
  /** @param {import('../scene/SceneManager.js').SceneManager} sceneManager */
  constructor(sceneManager) {
    this._tweens = [];
    this._darkColor = DEFAULT_DARK_COLOR;
    sceneManager.onTick((dt) => this._update(dt));
  }

  set darkColor(hexInt) {
    this._darkColor = new THREE.Color(hexInt);
  }

  /**
   * Stadium-wave entrance: a peak rotates around the chart one sector at a
   * time, then needed segments rise to their final height.
   * @param {import('../shapes/ExperienceShape.js').ExperienceShape} shape
   * @param {number[][]} targetScores
   */
  animateWaveEntrance(shape, targetScores) {
    shape.mesh.visible = false;
    const baseY = shape.mesh.position.y;
    const parent = shape.mesh.parent;

    const group = new THREE.Group();
    const allSegments = createAllSegmentGeometries();
    const profileColor = shape.baseMaterial.color.clone();
    const profileEmissive = shape.baseMaterial.emissive.clone();
    const darkColor = this._darkColor;

    const entries = allSegments.map(({ geometry, sector, level }, idx) => {
      const mat = shape.baseMaterial.clone();
      mat.color.copy(darkColor);
      mat.emissive.copy(darkColor);
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = baseY;
      mesh.scale.z = 0;
      mesh.visible = false;
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
          const waveExtent = 1 + RADIAL_SPREAD + BUMP_SPAN;
          const waveFront = (elapsed / WAVE_DURATION) * waveExtent;

          for (const { mesh, sector, level } of entries) {
            const sectorPos = sector / DIMENSION_COUNT;
            const radialDelay = ((level - 1) / (MAX_SCORE - 1)) * RADIAL_SPREAD;
            const dist = waveFront - sectorPos - radialDelay;
            const localT = dist / BUMP_SPAN + 0.5;

            if (localT > 0 && localT < 1) {
              mesh.visible = true;
              const intensity = Math.sin(localT * Math.PI);
              mesh.scale.z = WAVE_MAX_SCALE * intensity;
              mesh.material.color.lerpColors(darkColor, profileColor, intensity);
              mesh.material.emissive.lerpColors(darkColor, profileEmissive, intensity);
            } else {
              mesh.visible = false;
            }
          }
        } else if (elapsed <= WAVE_DURATION + PAUSE_DURATION) {
          for (const { mesh } of entries) {
            mesh.visible = false;
          }
        } else {
          const settleT = easeOutCubic((elapsed - WAVE_DURATION - PAUSE_DURATION) / SETTLE_DURATION);
          for (const { mesh, sector, level } of entries) {
            const needed = targetScores[sector].includes(level);
            if (needed) {
              mesh.visible = true;
              mesh.scale.z = settleT;
              mesh.material.color.lerpColors(darkColor, profileColor, settleT);
              mesh.material.emissive.lerpColors(darkColor, profileEmissive, settleT);
            } else {
              mesh.visible = false;
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
   * Crossfade from old group to new group.
   * @param {THREE.Group} oldGroup
   * @param {THREE.Group} newGroup
   * @param {() => void} onComplete  Called when old group can be removed.
   */
  crossfade(oldGroup, newGroup, onComplete) {
    const setActiveOpacity = (group, opacity) => {
      for (const child of group.children) {
        if (!child.userData.active) continue;
        child.material.transparent = true;
        child.material.opacity = opacity;
      }
    };
    setActiveOpacity(newGroup, 0);

    this._tweens.push({
      elapsed: 0,
      duration: CROSSFADE_DURATION,
      tick(t) {
        const e = easeOutCubic(t);
        setActiveOpacity(oldGroup, 1 - e);
        setActiveOpacity(newGroup, e);
      },
      onComplete() {
        for (const child of newGroup.children) {
          if (!child.userData.active) continue;
          child.material.transparent = false;
          child.material.opacity = 1;
          child.material.depthWrite = true;
        }
        onComplete();
      },
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
