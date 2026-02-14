import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createLighting } from './Lighting.js';

export class SceneManager {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    this.camera.position.set(0, 6, 10);

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // CSS2D renderer for labels
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0.3, 0);
    this.controls.minDistance = 4;
    this.controls.maxDistance = 25;
    this._restoreCamera();
    this.controls.update();
    this.controls.addEventListener('change', () => this._saveCamera());

    // Lighting
    createLighting(this.scene);

    // Resize handling
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(container);

    // Render loop
    this._animationCallbacks = [];
    this._frameId = null;
    this._startLoop();
  }

  /**
   * Register a callback invoked every frame with (deltaTime).
   * @param {(dt: number) => void} fn
   */
  onTick(fn) {
    this._animationCallbacks.push(fn);
  }

  _saveCamera() {
    const data = {
      pos: this.camera.position.toArray(),
      target: this.controls.target.toArray(),
    };
    localStorage.setItem('cameraState', JSON.stringify(data));
  }

  _restoreCamera() {
    const raw = localStorage.getItem('cameraState');
    if (!raw) return;
    try {
      const { pos, target } = JSON.parse(raw);
      this.camera.position.fromArray(pos);
      this.controls.target.fromArray(target);
    } catch { /* ignore corrupt data */ }
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  _startLoop() {
    let prev = performance.now();
    const tick = (now) => {
      this._frameId = requestAnimationFrame(tick);
      const dt = (now - prev) / 1000;
      prev = now;
      this.controls.update();
      for (const cb of this._animationCallbacks) cb(dt);
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    this._frameId = requestAnimationFrame(tick);
  }

  dispose() {
    if (this._frameId != null) cancelAnimationFrame(this._frameId);
    this._resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }
}
