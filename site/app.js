import {
  TaxonomyChart,
  ExperienceProfile,
  TAXONOMY_DIMENSIONS,
  DIMENSION_COUNT,
  MAX_SCORE,
} from '../src/index.js';

// --- Helpers ---

function hexToInt(hex) {
  return parseInt(hex.slice(1), 16);
}

function decodeState(hash) {
  try {
    const json = atob(hash);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// --- Color helpers ---

const DEFAULT_COLORS = [
  '#ff6600', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#84cc16',
];

// --- Theme ---

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let currentTheme = getInitialTheme();

function applyThemeToDocument(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const icon = document.querySelector('#btn-theme i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
}

applyThemeToDocument(currentTheme);

// --- State ---

const profiles = new Map();
const profileOrder = [];
let activeProfileId = null;
let chart = null;
let colorIndex = 0;
let draggedProfileId = null;
const expandedDims = new Set();

// --- DOM refs ---

const chartContainer = document.getElementById('chart-container');
const profileListEl = document.getElementById('profile-list');
const dimensionPanelEl = document.getElementById('dimension-panel');
const btnAddProfile = document.getElementById('btn-add-profile');
const btnShare = document.getElementById('btn-share');
const btnExport = document.getElementById('btn-export');
const btnEmbed = document.getElementById('btn-embed');
const btnTheme = document.getElementById('btn-theme');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

// --- Chart init ---

chart = new TaxonomyChart(chartContainer, {
  showLabels: false,
  editable: true,
  theme: currentTheme,
  onChange(id, scores) {
    const entry = profiles.get(id);
    if (!entry) return;
    entry.profile.scores = scores;
    if (id === activeProfileId) renderDimensionPanel(id);
    updateHash();
  },
});

// --- Theme toggle ---

btnTheme.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyThemeToDocument(currentTheme);
  chart.theme = currentTheme;
  localStorage.setItem('theme', currentTheme);
  renderDimensionPanel(activeProfileId);
});

// --- Profile management ---

function nextColor() {
  const usedColors = new Set([...profiles.values()].map((e) => e.colorHex));
  for (let i = 0; i < DEFAULT_COLORS.length; i++) {
    const c = DEFAULT_COLORS[(colorIndex + i) % DEFAULT_COLORS.length];
    if (!usedColors.has(c)) {
      colorIndex += i + 1;
      return c;
    }
  }
  const c = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length];
  colorIndex++;
  return c;
}

function addProfile(name, colorHex, scores) {
  const scoresArr = scores || Array.from({ length: DIMENSION_COUNT }, () => []);
  const profile = new ExperienceProfile({
    name,
    scores: scoresArr,
    color: hexToInt(colorHex),
  });
  profiles.set(profile.id, { profile, colorHex });
  profileOrder.push(profile.id);
  chart.addProfile(profile);
  selectProfile(profile.id);
  renderProfileList();
  updateHash();
  return profile.id;
}

function removeProfile(id) {
  chart.removeProfile(id);
  profiles.delete(id);
  profileOrder.splice(profileOrder.indexOf(id), 1);
  chart.reorderProfiles(profileOrder);
  if (activeProfileId === id) {
    activeProfileId = profileOrder.length > 0 ? profileOrder[0] : null;
    if (activeProfileId != null) chart.setEditableProfile(activeProfileId);
  }
  renderProfileList();
  renderDimensionPanel(activeProfileId);
  updateHash();
}

function selectProfile(id) {
  activeProfileId = id;
  if (id != null) chart.setEditableProfile(id);
  renderProfileList();
  renderDimensionPanel(id);
}

// --- Sidebar rendering ---

function isDark() {
  return currentTheme === 'dark';
}

function renderProfileList() {
  profileListEl.innerHTML = '';
  for (const id of profileOrder) {
    const { profile, colorHex } = profiles.get(id);
    const isActive = id === activeProfileId;
    const item = document.createElement('div');
    item.className = `profile-item flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 ${isActive ? 'active' : ''}`;
    item.draggable = true;
    item.dataset.profileId = id;
    item.innerHTML = `
      <i class="fa-solid fa-grip-vertical text-xs text-gray-400 dark:text-gray-600 cursor-grab drag-handle shrink-0"></i>
      <input
        type="color"
        value="${colorHex}"
        class="w-7 h-7 rounded shrink-0"
        title="Change color"
      />
      <span class="flex-1 text-sm font-medium truncate">${escapeHtml(profile.name)}</span>
      <button class="rename-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" title="Rename">
        <i class="fa-solid fa-pen text-xs"></i>
      </button>
      <button class="dupe-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" title="Duplicate">
        <i class="fa-solid fa-clone text-xs"></i>
      </button>
      <button class="delete-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-400 transition-colors" title="Delete">
        <i class="fa-solid fa-trash text-xs"></i>
      </button>
    `;

    // Drag-and-drop
    item.addEventListener('dragstart', (e) => {
      draggedProfileId = id;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      draggedProfileId = null;
      item.classList.remove('dragging');
      profileListEl.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedProfileId != null && draggedProfileId !== id) {
        item.classList.add('drag-over');
      }
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (draggedProfileId == null || draggedProfileId === id) return;
      moveProfile(draggedProfileId, id);
    });

    // Selection
    item.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn') || e.target.closest('.rename-btn') || e.target.closest('.dupe-btn') || e.target.closest('input[type="color"]') || e.target.closest('.drag-handle')) return;
      selectProfile(id);
    });

    item.querySelector('input[type="color"]').addEventListener('input', (e) => {
      const newHex = e.target.value;
      const entry = profiles.get(id);
      entry.colorHex = newHex;
      chart.updateProfile(id, entry.profile.scores, hexToInt(newHex));
      entry.profile.color = hexToInt(newHex);
      if (id === activeProfileId) renderDimensionPanel(id);
      updateHash();
    });

    item.querySelector('.rename-btn').addEventListener('click', () => {
      const newName = prompt('Profile name:', profile.name);
      if (newName && newName.trim()) {
        profile.name = newName.trim();
        renderProfileList();
        updateHash();
      }
    });

    item.querySelector('.dupe-btn').addEventListener('click', () => {
      const scoresCopy = profile.scores.map((s) => [...s]);
      addProfile(profile.name + ' (copy)', nextColor(), scoresCopy);
    });

    item.querySelector('.delete-btn').addEventListener('click', () => removeProfile(id));
    profileListEl.appendChild(item);
  }
}

function moveProfile(fromId, toId) {
  const fromIdx = profileOrder.indexOf(fromId);
  const toIdx = profileOrder.indexOf(toId);
  if (fromIdx === -1 || toIdx === -1) return;
  profileOrder.splice(fromIdx, 1);
  profileOrder.splice(toIdx, 0, fromId);
  chart.reorderProfiles(profileOrder);
  renderProfileList();
  updateHash();
}

function renderDimensionPanel(id) {
  if (id == null) {
    dimensionPanelEl.classList.add('hidden');
    return;
  }
  const entry = profiles.get(id);
  if (!entry) {
    dimensionPanelEl.classList.add('hidden');
    return;
  }

  dimensionPanelEl.classList.remove('hidden');
  dimensionPanelEl.innerHTML = '';

  const { profile, colorHex } = entry;
  const inactiveTextColor = isDark() ? '#9ca3af' : '#6b7280';

  for (let d = 0; d < DIMENSION_COUNT; d++) {
    const dim = TAXONOMY_DIMENSIONS[d];
    const activeLevels = profile.scores[d];

    const isExpanded = expandedDims.has(d);
    const activeCount = activeLevels.length;

    const row = document.createElement('div');
    row.className = 'border-b border-gray-200/50 dark:border-gray-800/50';

    const header = document.createElement('button');
    header.className = 'flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100/50 dark:hover:bg-gray-900/50 transition-colors';
    header.innerHTML = `
      <i class="fa-solid fa-chevron-right text-[10px] text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}" style="width: 10px"></i>
      <i class="${dim.icon} text-xs text-gray-500 dark:text-gray-400 w-4 text-center"></i>
      <span class="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">${dim.name}</span>
      <span class="text-[10px] text-gray-400 dark:text-gray-500">${activeCount}/${MAX_SCORE}</span>
    `;
    header.addEventListener('click', () => {
      if (expandedDims.has(d)) expandedDims.delete(d);
      else expandedDims.add(d);
      renderDimensionPanel(id);
    });
    row.appendChild(header);

    if (isExpanded) {
      const checkboxList = document.createElement('div');
      checkboxList.className = 'flex flex-col gap-0.5 pl-10 pb-2 pr-4';

      // Baseline (level 0) — mutually exclusive with levels 1-4
      const baselineActive = activeLevels.length === 0;
      const baselineLabel = document.createElement('label');
      baselineLabel.className = 'level-checkbox flex items-center gap-2 cursor-pointer py-0.5';
      const baselineCheckbox = document.createElement('input');
      baselineCheckbox.type = 'checkbox';
      baselineCheckbox.checked = baselineActive;
      baselineCheckbox.className = 'accent-current shrink-0';
      baselineCheckbox.style.accentColor = colorHex;
      const baselineText = document.createElement('span');
      baselineText.className = 'text-xs';
      baselineText.style.color = baselineActive ? colorHex : inactiveTextColor;
      baselineText.textContent = dim.levels[0];
      baselineCheckbox.addEventListener('change', () => {
        clearDimension(id, d);
      });
      baselineLabel.appendChild(baselineCheckbox);
      baselineLabel.appendChild(baselineText);
      checkboxList.appendChild(baselineLabel);

      for (let l = 1; l <= MAX_SCORE; l++) {
        const isActive = activeLevels.includes(l);
        const label = document.createElement('label');
        label.className = 'level-checkbox flex items-center gap-2 cursor-pointer py-0.5';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isActive;
        checkbox.className = 'accent-current shrink-0';
        checkbox.style.accentColor = colorHex;

        const text = document.createElement('span');
        text.className = 'text-xs';
        text.style.color = isActive ? colorHex : inactiveTextColor;
        text.textContent = dim.levels[l];

        checkbox.addEventListener('change', () => {
          toggleLevel(id, d, l);
        });

        label.appendChild(checkbox);
        label.appendChild(text);
        checkboxList.appendChild(label);
      }

      row.appendChild(checkboxList);
    }

    dimensionPanelEl.appendChild(row);
  }
}

function clearDimension(profileId, dimIndex) {
  const entry = profiles.get(profileId);
  if (!entry) return;

  entry.profile.scores[dimIndex] = [];
  chart.updateProfile(profileId, entry.profile.scores, hexToInt(entry.colorHex));
  renderDimensionPanel(profileId);
  updateHash();
}

function toggleLevel(profileId, dimIndex, level) {
  const entry = profiles.get(profileId);
  if (!entry) return;

  const scores = entry.profile.scores;
  const current = scores[dimIndex];
  const idx = current.indexOf(level);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(level);
    current.sort((a, b) => a - b);
  }

  chart.updateProfile(profileId, scores, hexToInt(entry.colorHex));
  renderDimensionPanel(profileId);
  updateHash();
}

// --- URL hash sharing ---

function encodeState() {
  const data = [];
  for (const id of profileOrder) {
    const { profile, colorHex } = profiles.get(id);
    data.push({
      n: profile.name,
      c: colorHex,
      s: profile.scores,
    });
  }
  return btoa(JSON.stringify(data));
}

function updateHash() {
  if (profiles.size === 0) {
    history.replaceState(null, '', location.pathname + location.search);
    return;
  }
  history.replaceState(null, '', '#' + encodeState());
}

function restoreFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return false;

  const data = decodeState(hash);
  if (!Array.isArray(data) || data.length === 0) return false;

  for (const item of data) {
    if (!item.n || !item.c || !Array.isArray(item.s)) continue;
    addProfile(item.n, item.c, item.s);
  }
  return true;
}

// --- JSON export ---

function exportJSON() {
  const data = [];
  for (const [, { profile, colorHex }] of profiles) {
    const dimensions = {};
    for (let d = 0; d < DIMENSION_COUNT; d++) {
      const dim = TAXONOMY_DIMENSIONS[d];
      dimensions[dim.key] = profile.scores[d].map((l) => dim.levels[l]);
    }
    data.push({ name: profile.name, color: colorHex, dimensions });
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'taxonomy-chart.json';
  a.click();
  URL.revokeObjectURL(url);
}

// --- Toast ---

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// --- Mobile sidebar ---

function openSidebar() {
  sidebar.classList.add('open');
  sidebarBackdrop.classList.remove('hidden');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarBackdrop.classList.add('hidden');
}

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

sidebarBackdrop.addEventListener('click', closeSidebar);

// --- Embed dialog ---

const embedDialog = document.getElementById('embed-dialog');
const embedBackdrop = document.getElementById('embed-backdrop');
const embedClose = document.getElementById('embed-close');
const embedTheme = document.getElementById('embed-theme');
const embedLabels = document.getElementById('embed-labels');
const embedStep1 = document.getElementById('embed-step1');
const embedStep2 = document.getElementById('embed-step2');

const EMBED_SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/ImmersiveExperienceDesignTaxonomy/chart@v0.1.0/docs/embed.js';

function generateScriptTag() {
  return `<script src="${EMBED_SCRIPT_URL}"><\/script>`;
}

function generateDivTag() {
  const theme = embedTheme.value;
  const labels = embedLabels.checked;

  const attrs = ['data-taxonomy-chart'];
  if (profiles.size > 0) attrs.push(`data-state="${encodeState()}"`);
  if (theme) attrs.push(`data-theme="${theme}"`);
  if (labels) attrs.push('data-labels="true"');

  return `<div ${attrs.join(' ')}\n     style="width:100%;height:500px"></div>`;
}

function updateSnippets() {
  embedStep1.value = generateScriptTag();
  embedStep2.value = generateDivTag();
}

function openEmbedDialog() {
  updateSnippets();
  embedDialog.classList.remove('hidden');
}

function closeEmbedDialog() {
  embedDialog.classList.add('hidden');
}

btnEmbed.addEventListener('click', openEmbedDialog);
embedClose.addEventListener('click', closeEmbedDialog);
embedBackdrop.addEventListener('click', closeEmbedDialog);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !embedDialog.classList.contains('hidden')) {
    closeEmbedDialog();
  }
});

embedTheme.addEventListener('change', updateSnippets);
embedLabels.addEventListener('change', updateSnippets);

embedDialog.addEventListener('click', (e) => {
  const btn = e.target.closest('.embed-copy-btn');
  if (!btn) return;
  const target = document.getElementById(btn.dataset.target);
  if (!target) return;
  navigator.clipboard.writeText(target.value).then(
    () => showToast('Copied to clipboard'),
    () => showToast('Could not copy'),
  );
});

// --- Event listeners ---

btnAddProfile.addEventListener('click', () => {
  const name = prompt('Profile name:', 'New Experience');
  if (!name || !name.trim()) return;
  addProfile(name.trim(), nextColor());
});

btnShare.addEventListener('click', () => {
  const url = location.href;
  navigator.clipboard.writeText(url).then(
    () => showToast('Link copied to clipboard'),
    () => showToast('Could not copy link'),
  );
});

btnExport.addEventListener('click', exportJSON);

// --- Escape HTML util ---

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

// --- Init ---

const restored = restoreFromHash();
if (!restored) {
  addProfile('Museum VR Tour', '#ff6600', [
    [1, 3],
    [1, 2, 4],
    [1],
    [1, 2, 3],
    [2, 3],
    [1, 3],
    [2, 3],
    [1],
    [1, 3, 4],
    [1, 2],
  ]);
}
