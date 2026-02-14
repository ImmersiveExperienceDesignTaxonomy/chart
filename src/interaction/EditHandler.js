import * as THREE from 'three';

const CLICK_THRESHOLD = 5; // px — movement below this counts as a click

export class EditHandler {
  /**
   * @param {import('../scene/SceneManager.js').SceneManager} sceneManager
   * @param {() => import('../shapes/ExperienceShape.js').ExperienceShape | undefined} getEditableShape
   * @param {(id: number, scores: number[][]) => void} onScoreChange
   */
  constructor(sceneManager, getEditableShape, onScoreChange) {
    this._sceneManager = sceneManager;
    this._getEditableShape = getEditableShape;
    this._onScoreChange = onScoreChange;

    this._raycaster = new THREE.Raycaster();
    this._downPos = null;

    const dom = sceneManager.renderer.domElement;
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    dom.addEventListener('pointerdown', this._onPointerDown);
    dom.addEventListener('pointerup', this._onPointerUp);
  }

  _onPointerDown(event) {
    if (event.button !== 0) return;
    this._downPos = { x: event.clientX, y: event.clientY };
  }

  _onPointerUp(event) {
    if (!this._downPos) return;

    const dx = event.clientX - this._downPos.x;
    const dy = event.clientY - this._downPos.y;
    this._downPos = null;

    if (Math.sqrt(dx * dx + dy * dy) >= CLICK_THRESHOLD) return;

    const shape = this._getEditableShape();
    if (!shape) return;

    const rect = this._sceneManager.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this._raycaster.setFromCamera(ndc, this._sceneManager.camera);

    const hits = this._raycaster.intersectObjects(shape.mesh.children, false);
    if (hits.length === 0) return;

    const { sector, level } = hits[0].object.userData;
    if (sector == null || level == null) return;

    const newScores = shape.toggleCell(sector, level);
    this._onScoreChange(shape.profile.id, newScores);
  }

  dispose() {
    const dom = this._sceneManager.renderer.domElement;
    dom.removeEventListener('pointerdown', this._onPointerDown);
    dom.removeEventListener('pointerup', this._onPointerUp);
  }
}
