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

    // HUD overlay (GitHub link)
    this._hudScene = new THREE.Scene();
    this._hudCamera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 1);
    this._githubSprite = this._createGitHubSprite();
    this._hudScene.add(this._githubSprite);
    this._updateHudLayout();
    this.renderer.domElement.addEventListener('click', (e) => this._onHudClick(e));
    this.renderer.domElement.addEventListener('pointermove', (e) => this._onHudHover(e));

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

  _createGitHubSprite(fillColor = '#ffffff') {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // GitHub mark SVG path (standard octocat silhouette)
    const path = new Path2D(
      'M64 4C30.1 4 3 31.1 3 65c0 27 17.5 49.9 41.8 58 3 .6 4.2-1.3 4.2-2.9' +
      ' 0-1.5-.1-6.2-.1-11.3-15.4 2.8-19.5-3.7-20.7-7.1-0.7-1.8-3.7-7.1-6.3-8.5' +
      '-2.2-1.2-5.2-4-.1-4.1 4.8-.1 8.2 4.4 9.3 6.2 5.4 9.1 14.1 6.6 17.6 5' +
      ' .5-3.9 2.1-6.6 3.8-8.1-13.3-1.5-27.2-6.6-27.2-29.5 0-6.5 2.3-11.9' +
      ' 6.2-16.1-.6-1.5-2.7-7.6.6-15.9 0 0 5-1.6 16.5 6.2a57.3 57.3 0 0 1 30.1' +
      ' 0c11.5-7.8 16.5-6.2 16.5-6.2 3.3 8.3 1.2 14.4.6 15.9 3.8 4.2 6.2 9.5' +
      ' 6.2 16.1 0 23-14 28-27.3 29.5 2.2 1.8 4 5.4 4 10.9 0 7.9-.1 14.2-.1' +
      ' 16.2 0 1.6 1.1 3.5 4.1 2.9A61 61 0 0 0 125 65C125 31.1 97.9 4 64 4Z',
    );
    ctx.fillStyle = fillColor;
    ctx.fill(path);

    this._githubCanvas = canvas;
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 0.4 });
    return new THREE.Sprite(mat);
  }

  updateGitHubIconColor(fillColor) {
    const canvas = this._githubCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const path = new Path2D(
      'M64 4C30.1 4 3 31.1 3 65c0 27 17.5 49.9 41.8 58 3 .6 4.2-1.3 4.2-2.9' +
      ' 0-1.5-.1-6.2-.1-11.3-15.4 2.8-19.5-3.7-20.7-7.1-0.7-1.8-3.7-7.1-6.3-8.5' +
      '-2.2-1.2-5.2-4-.1-4.1 4.8-.1 8.2 4.4 9.3 6.2 5.4 9.1 14.1 6.6 17.6 5' +
      ' .5-3.9 2.1-6.6 3.8-8.1-13.3-1.5-27.2-6.6-27.2-29.5 0-6.5 2.3-11.9' +
      ' 6.2-16.1-.6-1.5-2.7-7.6.6-15.9 0 0 5-1.6 16.5 6.2a57.3 57.3 0 0 1 30.1' +
      ' 0c11.5-7.8 16.5-6.2 16.5-6.2 3.3 8.3 1.2 14.4.6 15.9 3.8 4.2 6.2 9.5' +
      ' 6.2 16.1 0 23-14 28-27.3 29.5 2.2 1.8 4 5.4 4 10.9 0 7.9-.1 14.2-.1' +
      ' 16.2 0 1.6 1.1 3.5 4.1 2.9A61 61 0 0 0 125 65C125 31.1 97.9 4 64 4Z',
    );
    ctx.fillStyle = fillColor;
    ctx.fill(path);
    this._githubSprite.material.map.needsUpdate = true;
  }

  _updateHudLayout() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this._hudCamera.right = w;
    this._hudCamera.top = h;
    this._hudCamera.updateProjectionMatrix();
    const iconSize = 28;
    const margin = 14;
    this._githubSprite.scale.set(iconSize, iconSize, 1);
    this._githubSprite.position.set(w - margin - iconSize / 2, margin + iconSize / 2, 0);
  }

  _hitGitHub(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = rect.height - (event.clientY - rect.top);
    const sp = this._githubSprite;
    const half = sp.scale.x / 2;
    return (
      Math.abs(x - sp.position.x) < half &&
      Math.abs(y - sp.position.y) < half
    );
  }

  _onHudClick(event) {
    if (this._hitGitHub(event)) {
      window.open('https://github.com/ImmersiveExperienceDesignTaxonomy/Chart', '_blank', 'noopener');
    }
  }

  _onHudHover(event) {
    const hit = this._hitGitHub(event);
    this._githubSprite.material.opacity = hit ? 1.0 : 0.4;
    this.renderer.domElement.style.cursor = hit ? 'pointer' : '';
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    this._updateHudLayout();
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
      this.renderer.autoClear = false;
      this.renderer.render(this._hudScene, this._hudCamera);
      this.renderer.autoClear = true;
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
