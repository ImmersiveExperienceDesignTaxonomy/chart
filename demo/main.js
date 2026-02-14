import { TaxonomyChart, ExperienceProfile } from '../src/index.js';

const chart = new TaxonomyChart(document.getElementById('chart'), {
  showLabels: false,
  editable: true,
  onChange: (id, scores) => console.log('Score update — profile', id, scores),
});

chart.addProfile(
  new ExperienceProfile({
    name: 'Museum VR Tour',
    scores: [2, 3, 1, 3, 1, 1, 3, 1, 4, 1],
    color: 0xff6600,
  }),
);
