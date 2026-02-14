import * as THREE from 'three';
import { MAX_SCORE } from '../data/TaxonomyDimensions.js';
import { sectorFromAngle } from '../utils/polar.js';
import { RADIUS_PER_LEVEL } from '../grid/RadarGrid.js';

export class EditHandler {
  /**
   * @param {import('../scene/SceneManager.js').SceneManager} sceneManager
   * @param {() => import('../shapes/ExperienceShape.js').ExperienceShape | undefined} getEditableShape
   * @param {(id: number, scores: number[]) => void} onScoreChange
   */
  constructor(sceneManager, getEditableShape, onScoreChange, dragCallbacks = {}) {
    this._sceneManager = sceneManager;
    this._getEditableShape = getEditableShape;
    this._onScoreChange = onScoreChange;
    this._onDragStart = dragCallbacks.onDragStart ?? null;
    this._onDragUpdate = dragCallbacks.onDragUpdate ?? null;
    this._onDragEnd = dragCallbacks.onDragEnd ?? null;

    this._raycaster = new THREE.Raycaster();
    this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._intersection = new THREE.Vector3();

    this._dragging = false;
    this._activeSectorIndex = -1;
    this._workingScores = null;

    const dom = sceneManager.renderer.domElement;
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    dom.addEventListener('pointerdown', this._onPointerDown);
    dom.addEventListener('pointermove', this._onPointerMove);
    dom.addEventListener('pointerup', this._onPointerUp);
  }

  _ndcFromEvent(event) {
    const rect = this._sceneManager.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  _intersectGround(ndc) {
    this._raycaster.setFromCamera(ndc, this._sceneManager.camera);
    const hit = this._raycaster.ray.intersectPlane(this._groundPlane, this._intersection);
    return hit;
  }

  _sectorIndex(point) {
    const radialDist = Math.sqrt(point.x * point.x + point.z * point.z);
    const maxRadius = MAX_SCORE * RADIUS_PER_LEVEL;
    if (radialDist < RADIUS_PER_LEVEL * 0.4 || radialDist > maxRadius + RADIUS_PER_LEVEL) {
      return -1;
    }
    return sectorFromAngle(Math.atan2(point.x, point.z));
  }

  _scoreFromDistance(point) {
    const radialDist = Math.sqrt(point.x * point.x + point.z * point.z);
    const level = Math.round(radialDist / RADIUS_PER_LEVEL);
    return Math.max(0, Math.min(MAX_SCORE, level));
  }

  _onPointerDown(event) {
    if (event.button !== 0) return;

    const shape = this._getEditableShape();
    if (!shape) return;

    const ndc = this._ndcFromEvent(event);
    const hit = this._intersectGround(ndc);
    if (!hit) return;

    const sectorIndex = this._sectorIndex(hit);
    if (sectorIndex === -1) return;

    this._dragging = true;
    this._activeSectorIndex = sectorIndex;
    this._workingScores = [...shape.profile.scores];
    this._sceneManager.controls.enabled = false;
    event.target.setPointerCapture(event.pointerId);

    const score = this._scoreFromDistance(hit);
    this._workingScores[sectorIndex] = score;
    shape.rebuildGeometry(this._workingScores);
    this._onDragStart?.(sectorIndex, score);
  }

  _onPointerMove(event) {
    if (!this._dragging) return;

    const shape = this._getEditableShape();
    if (!shape) return;

    const ndc = this._ndcFromEvent(event);
    const hit = this._intersectGround(ndc);
    if (!hit) return;

    const score = this._scoreFromDistance(hit);
    if (score === this._workingScores[this._activeSectorIndex]) return;

    this._workingScores[this._activeSectorIndex] = score;
    shape.rebuildGeometry(this._workingScores);
    this._onDragUpdate?.(this._activeSectorIndex, score);
  }

  _onPointerUp() {
    if (!this._dragging) return;

    this._dragging = false;
    this._sceneManager.controls.enabled = true;
    this._onDragEnd?.();

    const shape = this._getEditableShape();
    if (shape && this._workingScores) {
      this._onScoreChange(shape.profile.id, [...this._workingScores]);
    }

    this._activeSectorIndex = -1;
    this._workingScores = null;
  }

  dispose() {
    const dom = this._sceneManager.renderer.domElement;
    dom.removeEventListener('pointerdown', this._onPointerDown);
    dom.removeEventListener('pointermove', this._onPointerMove);
    dom.removeEventListener('pointerup', this._onPointerUp);
  }
}
