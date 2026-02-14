const ENTRANCE_DURATION = 0.6; // seconds
const CROSSFADE_DURATION = 0.4;

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
   * Scale-in entrance animation.
   * @param {THREE.Mesh} mesh
   */
  animateEntrance(mesh) {
    mesh.scale.set(0, 0, 0);
    this._tweens.push({
      elapsed: 0,
      duration: ENTRANCE_DURATION,
      tick(t) {
        const s = easeOutCubic(t);
        mesh.scale.set(s, s, s);
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
