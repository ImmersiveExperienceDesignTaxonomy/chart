/**
 * The 10 dimensions of the Immersive Experience Design Taxonomy.
 * Each dimension is scored 0–4.
 *
 * Source: Ruscella & Obeid, iLRN 2021 (extended).
 */
export const TAXONOMY_DIMENSIONS = [
  {
    key: 'interactivity',
    name: 'Interactivity',
    icon: 'fa-solid fa-hand-pointer',
    levels: ['None', 'Passive', 'Responsive', 'Manipulative', 'Creative'],
  },
  {
    key: 'embodiment',
    name: 'Embodiment',
    icon: 'fa-solid fa-person',
    levels: ['None', 'Visual Only', 'Partial Body', 'Full Body', 'Full Sensory'],
  },
  {
    key: 'coParticipation',
    name: 'Co-Participation',
    icon: 'fa-solid fa-users',
    levels: ['None', 'Spectating', 'Parallel', 'Cooperative', 'Collaborative'],
  },
  {
    key: 'story',
    name: 'Story',
    icon: 'fa-solid fa-book-open',
    levels: ['None', 'Background', 'Linear', 'Branching', 'Emergent'],
  },
  {
    key: 'dynamics',
    name: 'Dynamics',
    icon: 'fa-solid fa-shuffle',
    levels: ['Static', 'Scripted', 'Reactive', 'Adaptive', 'Procedural'],
  },
  {
    key: 'gamification',
    name: 'Gamification',
    icon: 'fa-solid fa-gamepad',
    levels: ['None', 'Points/Badges', 'Challenges', 'Progression', 'Full Game'],
  },
  {
    key: 'immersiveTech',
    name: 'Immersive Tech',
    icon: 'fa-solid fa-vr-cardboard',
    levels: ['Screen', 'Surround Screen', 'HMD (3DoF)', 'HMD (6DoF)', 'Multi-Sensory'],
  },
  {
    key: 'metaControl',
    name: 'Meta Control',
    icon: 'fa-solid fa-sliders',
    levels: ['None', 'Preset Selection', 'Parameter Tuning', 'Scripting', 'Full Authoring'],
  },
  {
    key: 'didacticCapacity',
    name: 'Didactic Capacity',
    icon: 'fa-solid fa-graduation-cap',
    levels: ['None', 'Informational', 'Instructional', 'Constructivist', 'Transformative'],
  },
  {
    key: 'data',
    name: 'Data',
    icon: 'fa-solid fa-database',
    levels: ['Anonymous', 'Identity', 'In-Game', 'Personalization', 'Biometrics'],
  },
];

export const DIMENSION_COUNT = TAXONOMY_DIMENSIONS.length;
export const MAX_SCORE = 4;
