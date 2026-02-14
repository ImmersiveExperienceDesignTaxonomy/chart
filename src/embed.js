import { TaxonomyChart } from './TaxonomyChart.js';
import { ExperienceProfile } from './data/ExperienceProfile.js';

const FA_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
const MARKER = 'data-taxonomy-chart-initialized';

function hexToInt(hex) {
  return parseInt(hex.slice(1), 16);
}

function decodeState(encoded) {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

function resolveTheme(value) {
  if (value === 'dark' || value === 'light') return value;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function injectFontAwesome() {
  const alreadyLoaded = document.querySelector(`link[href="${FA_CSS}"]`);
  if (alreadyLoaded) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FA_CSS;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function initChart(container) {
  if (container.hasAttribute(MARKER)) return;
  container.setAttribute(MARKER, '');

  const stateAttr = container.getAttribute('data-state');
  const theme = resolveTheme(container.getAttribute('data-theme'));
  const showLabels = container.getAttribute('data-labels') === 'true';

  // Ensure the container has positioned layout for CSS2D renderer
  const position = getComputedStyle(container).position;
  if (position === 'static') {
    container.style.position = 'relative';
  }

  // Apply background and font stack
  container.style.backgroundColor = theme === 'dark' ? '#030712' : '#ffffff';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  const chart = new TaxonomyChart(container, {
    showLabels,
    editable: false,
    theme,
  });

  if (!stateAttr) return;

  const data = decodeState(stateAttr);
  if (!Array.isArray(data)) return;

  for (const item of data) {
    if (!item.n || !item.c || !Array.isArray(item.s)) continue;
    const profile = new ExperienceProfile({
      name: item.n,
      scores: item.s,
      color: hexToInt(item.c),
    });
    chart.addProfile(profile);
  }
}

function initAll() {
  injectFontAwesome();
  const containers = document.querySelectorAll('[data-taxonomy-chart]');
  for (const el of containers) {
    initChart(el);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
