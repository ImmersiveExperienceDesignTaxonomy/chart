# Immersive Experience Design Taxonomy Chart

A 3D radar chart for visualizing the **[Immersive Experience Design Taxonomy](https://ieeexplore.ieee.org/document/9459328)** (Ruscella & Obeid, iLRN 2021). Built with [Three.js](https://threejs.org/).

![Chart preview showing a sector-fill (Nightingale) visualization of an experience profile](docs/chart-preview.png)

The chart renders a 10-sector decagon grid representing the taxonomy dimensions. Experience profiles are displayed as extruded Nightingale (Coxcomb) shapes — each sector fills independently to its score radius, creating stepped transitions between dimensions. Includes orbit camera controls and optional interactive score editing.

## Dimensions

| # | Dimension | Levels (0 &rarr; 4) |
|---|-----------|----------------------|
| 1 | Interactivity | None &rarr; Passive &rarr; Responsive &rarr; Manipulative &rarr; Creative |
| 2 | Embodiment | None &rarr; Visual Only &rarr; Partial Body &rarr; Full Body &rarr; Full Sensory |
| 3 | Co-Participation | None &rarr; Spectating &rarr; Parallel &rarr; Cooperative &rarr; Collaborative |
| 4 | Story | None &rarr; Background &rarr; Linear &rarr; Branching &rarr; Emergent |
| 5 | Dynamics | Static &rarr; Scripted &rarr; Reactive &rarr; Adaptive &rarr; Procedural |
| 6 | Gamification | None &rarr; Points/Badges &rarr; Challenges &rarr; Progression &rarr; Full Game |
| 7 | Immersive Tech | Screen &rarr; Surround Screen &rarr; HMD (3DoF) &rarr; HMD (6DoF) &rarr; Multi-Sensory |
| 8 | Meta Control | None &rarr; Preset Selection &rarr; Parameter Tuning &rarr; Scripting &rarr; Full Authoring |
| 9 | Didactic Capacity | None &rarr; Informational &rarr; Instructional &rarr; Constructivist &rarr; Transformative |
| 10 | Data | Anonymous &rarr; Identity &rarr; In-Game &rarr; Personalization &rarr; Biometrics |

## Quick Start

```bash
npm install
npm run dev
```

Open the printed URL to see the demo.

## Usage

```js
import { TaxonomyChart, ExperienceProfile } from 'immersive-experience-design-taxonomy-chart';

const chart = new TaxonomyChart(document.getElementById('chart'), {
  showLabels: true,   // show dimension names next to icons (default: true)
  editable: true,     // allow click-drag on axes to set scores
  onChange: (id, scores) => console.log(id, scores),
});

chart.addProfile(
  new ExperienceProfile({
    name: 'Museum VR Tour',
    scores: [2, 3, 1, 3, 1, 1, 3, 1, 4, 1], // one per dimension, 0-4
    color: 0xff6600,
  }),
);
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showLabels` | `boolean` | `true` | Show dimension name text next to axis icons. Icons are always visible. |
| `editable` | `boolean` | `false` | Enable click-drag within sectors to change scores interactively. |
| `onChange` | `(id, scores) => void` | `null` | Callback fired when a score is changed via drag editing. |

### API

| Method / Property | Description |
|-------------------|-------------|
| `addProfile(profile)` | Add an `ExperienceProfile` to the chart. |
| `removeProfile(id)` | Remove a profile by id (animated). |
| `updateProfile(id, scores)` | Replace a profile's scores (crossfade animation). |
| `clearProfiles()` | Remove all profiles. |
| `chart.editable` | Get/set whether drag editing is enabled. |
| `chart.showLabels` | Get/set label text visibility. Icons enlarge when labels are hidden. |
| `setEditableProfile(id)` | Choose which profile responds to drag editing (defaults to first). |
| `dispose()` | Tear down the chart and release resources. |

### Interactive Editing

When `editable` is true, click and drag within any sector to set its score (snaps to integer levels 0-4). Orbit camera controls remain active for clicks outside the grid area. A popover shows the dimension name and current level during hover and drag.

## Peer Dependencies

- [three](https://www.npmjs.com/package/three) >= 0.150.0

## License

See repository root.
