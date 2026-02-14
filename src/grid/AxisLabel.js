import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { TAXONOMY_DIMENSIONS, MAX_SCORE } from '../data/TaxonomyDimensions.js';
import { polarToCartesian } from '../utils/polar.js';
import { RADIUS_PER_LEVEL } from './RadarGrid.js';

const LABEL_OFFSET = 0.6;

/**
 * Create CSS2DObject labels for all 9 axes.
 * Each label renders a Font Awesome icon + dimension name.
 * @returns {CSS2DObject[]}
 */
export function createAxisLabels() {
  const labelRadius = MAX_SCORE * RADIUS_PER_LEVEL + LABEL_OFFSET;

  return TAXONOMY_DIMENSIONS.map((dim, i) => {
    const el = document.createElement('div');
    el.style.cssText =
      'font-size: 12px; color: #ccc; white-space: nowrap; user-select: none; text-align: center; pointer-events: auto; cursor: default;';

    const icon = document.createElement('i');
    icon.className = dim.icon;
    icon.style.marginRight = '4px';

    const text = document.createElement('span');
    text.className = 'axis-label-text';
    text.textContent = dim.name;

    el.appendChild(icon);
    el.appendChild(text);

    const label = new CSS2DObject(el);
    const { x, z } = polarToCartesian(i + 0.5, labelRadius);
    label.position.set(x, 0, z);

    return label;
  });
}
