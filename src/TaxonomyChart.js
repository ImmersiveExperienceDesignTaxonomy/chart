import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { createRadarGrid } from './grid/RadarGrid.js';
import { createAxisLabels } from './grid/AxisLabel.js';
import { ExperienceProfile } from './data/ExperienceProfile.js';
import { ExperienceShape } from './shapes/ExperienceShape.js';
import { Animator } from './animation/Animator.js';
import { EditHandler } from './interaction/EditHandler.js';
import { TAXONOMY_DIMENSIONS, MAX_SCORE } from './data/TaxonomyDimensions.js';
import { paletteColor } from './utils/colors.js';

const HOVER_EMISSIVE_BOOST = 0.45;

export class TaxonomyChart {
  /**
   * @param {HTMLElement} container
   * @param {{ showLabels?: boolean, editable?: boolean, onChange?: (id: number, scores: number[]) => void }} options
   */
  constructor(container, options = {}) {
    this._sceneManager = new SceneManager(container);
    this._shapes = new Map();
    this._profileCount = 0;

    // Grid
    const grid = createRadarGrid();
    this._sceneManager.scene.add(grid);

    // Labels
    this._labels = createAxisLabels();
    for (const label of this._labels) {
      this._sceneManager.scene.add(label);
    }

    // Animator
    this._animator = new Animator(this._sceneManager);

    // Label visibility
    this._showLabels = options.showLabels ?? true;
    this._applyLabelVisibility();

    // Popover
    this._popoverEl = this._createPopover();
    this._labels.forEach((label, i) => {
      label.element.addEventListener('mouseenter', () => {
        const shape = this._getEditableShape();
        const score = shape?.profile.scores[i] ?? null;
        this._showPopover(i, score);
      });
      label.element.addEventListener('mouseleave', () => this._hidePopover());
    });

    // Editing
    this._editable = options.editable ?? false;
    this._onChange = options.onChange ?? null;
    this._editableProfileId = null;
    this._editHandler = null;

    if (this._editable) {
      this._initEditHandler();
    }

    // Shape hover highlighting
    this._hoverRaycaster = new THREE.Raycaster();
    this._hoveredCellMesh = null;
    this._cellTooltip = this._createCellTooltip();
    this._onShapeHover = this._onShapeHover.bind(this);
    this._sceneManager.renderer.domElement.addEventListener('pointermove', this._onShapeHover);
  }

  get editable() {
    return this._editable;
  }

  set editable(value) {
    this._editable = value;
    if (value && !this._editHandler) {
      this._initEditHandler();
    } else if (!value && this._editHandler) {
      this._editHandler.dispose();
      this._editHandler = null;
    }
  }

  get showLabels() {
    return this._showLabels;
  }

  set showLabels(value) {
    this._showLabels = value;
    this._applyLabelVisibility();
  }

  _applyLabelVisibility() {
    const display = this._showLabels ? '' : 'none';
    const iconSize = this._showLabels ? '' : '18px';
    const iconMargin = this._showLabels ? '4px' : '0';
    for (const label of this._labels) {
      label.element.querySelector('.axis-label-text').style.display = display;
      const icon = label.element.querySelector('i');
      icon.style.fontSize = iconSize;
      icon.style.marginRight = iconMargin;
    }
  }

  _createPopover() {
    const el = document.createElement('div');
    el.style.cssText = [
      'position: absolute',
      'background: rgba(0, 0, 0, 0.88)',
      'color: #fff',
      'padding: 6px 10px',
      'border-radius: 4px',
      'font-size: 12px',
      'line-height: 1.4',
      'pointer-events: none',
      'white-space: nowrap',
      'opacity: 0',
      'transition: opacity 0.15s',
      'z-index: 10',
      'transform: translateX(-50%)',
    ].join('; ');
    this._sceneManager.container.appendChild(el);
    return el;
  }

  _showPopover(axisIndex, score) {
    const dim = TAXONOMY_DIMENSIONS[axisIndex];
    const name = `<strong>${dim.name}</strong>`;
    this._popoverEl.innerHTML = score != null
      ? `${name}<br>${dim.levels[score]} (${score}/${MAX_SCORE})`
      : name;

    const labelEl = this._labels[axisIndex].element;
    const labelRect = labelEl.getBoundingClientRect();
    const containerRect = this._sceneManager.container.getBoundingClientRect();

    this._popoverEl.style.left = `${labelRect.left - containerRect.left + labelRect.width / 2}px`;
    this._popoverEl.style.top = `${labelRect.top - containerRect.top - this._popoverEl.offsetHeight - 6}px`;
    this._popoverEl.style.opacity = '1';
  }

  _hidePopover() {
    this._popoverEl.style.opacity = '0';
  }

  setEditableProfile(id) {
    this._editableProfileId = id;
  }

  _createCellTooltip() {
    const el = document.createElement('div');
    el.style.cssText = [
      'position: absolute',
      'background: rgba(0, 0, 0, 0.88)',
      'color: #fff',
      'padding: 6px 10px',
      'border-radius: 4px',
      'font-size: 12px',
      'line-height: 1.4',
      'pointer-events: none',
      'white-space: nowrap',
      'opacity: 0',
      'transition: opacity 0.15s',
      'z-index: 10',
    ].join('; ');
    this._sceneManager.container.appendChild(el);
    return el;
  }

  _onShapeHover(event) {
    const rect = this._sceneManager.renderer.domElement.getBoundingClientRect();
    const containerRect = this._sceneManager.container.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this._hoverRaycaster.setFromCamera(ndc, this._sceneManager.camera);

    const groups = [...this._shapes.values()]
      .filter((s) => s.mesh.visible)
      .map((s) => s.mesh);
    const hits = this._hoverRaycaster.intersectObjects(groups, true);
    const hitCellMesh = hits.length > 0 ? hits[0].object : null;

    if (hitCellMesh !== this._hoveredCellMesh) {
      if (this._hoveredCellMesh) {
        this._hoveredCellMesh.material.emissiveIntensity = 0.25;
      }
      this._hoveredCellMesh = hitCellMesh;
      if (hitCellMesh) {
        hitCellMesh.material.emissiveIntensity = HOVER_EMISSIVE_BOOST;
        const { sector, level } = hitCellMesh.userData;
        const dim = TAXONOMY_DIMENSIONS[sector];
        this._cellTooltip.innerHTML =
          `<strong>${dim.name}</strong><br>${dim.levels[level]}<br>Level ${level - 1}`;
        this._cellTooltip.style.opacity = '1';
      } else {
        this._cellTooltip.style.opacity = '0';
      }
    }

    if (this._hoveredCellMesh) {
      const x = event.clientX - containerRect.left + 12;
      const y = event.clientY - containerRect.top - 12;
      this._cellTooltip.style.left = `${x}px`;
      this._cellTooltip.style.top = `${y}px`;
    }
  }

  _initEditHandler() {
    this._editHandler = new EditHandler(
      this._sceneManager,
      () => this._getEditableShape(),
      (id, scores) => this._onChange?.(id, scores),
      {
        onDragStart: (axis, score) => this._showPopover(axis, score),
        onDragUpdate: (axis, score) => this._showPopover(axis, score),
        onDragEnd: () => this._hidePopover(),
      },
    );
  }

  _getEditableShape() {
    if (this._editableProfileId != null) {
      return this._shapes.get(this._editableProfileId);
    }
    // Default: first profile added
    const first = this._shapes.values().next();
    return first.done ? undefined : first.value;
  }

  /**
   * @param {import('./data/ExperienceProfile.js').ExperienceProfile} profile
   */
  addProfile(profile) {
    if (profile.color == null) {
      profile.color = paletteColor(this._profileCount);
    }

    const shape = new ExperienceShape(profile, this._profileCount);
    this._shapes.set(profile.id, shape);
    this._sceneManager.scene.add(shape.mesh);
    this._animator.animateWaveEntrance(shape, profile.scores);
    this._profileCount++;
  }

  /**
   * @param {number} id  Profile id returned by ExperienceProfile
   */
  removeProfile(id) {
    const shape = this._shapes.get(id);
    if (!shape) return;

    this._animator.animateExit(shape.mesh, () => {
      this._sceneManager.scene.remove(shape.mesh);
      shape.dispose();
      this._shapes.delete(id);
    });
  }

  /**
   * @param {number} id
   * @param {number[]} newScores
   */
  updateProfile(id, newScores) {
    const oldShape = this._shapes.get(id);
    if (!oldShape) return;

    const updatedProfile = new ExperienceProfile({
      name: oldShape.profile.name,
      scores: newScores,
      color: oldShape.profile.color,
    });
    // Preserve the original id so the map key stays consistent
    updatedProfile.id = oldShape.profile.id;

    const newShape = new ExperienceShape(updatedProfile, oldShape.stackIndex);

    this._animator.crossfade(oldShape.mesh, newShape.mesh, () => {
      this._sceneManager.scene.remove(oldShape.mesh);
      oldShape.dispose();
    });

    this._sceneManager.scene.add(newShape.mesh);
    this._shapes.set(id, newShape);
  }

  clearProfiles() {
    for (const [id, shape] of this._shapes) {
      this._sceneManager.scene.remove(shape.mesh);
      shape.dispose();
    }
    this._shapes.clear();
    this._profileCount = 0;
  }

  dispose() {
    this._sceneManager.renderer.domElement.removeEventListener('pointermove', this._onShapeHover);
    this.clearProfiles();
    if (this._editHandler) {
      this._editHandler.dispose();
      this._editHandler = null;
    }
    this._popoverEl.remove();
    this._cellTooltip.remove();
    this._sceneManager.dispose();
  }
}
