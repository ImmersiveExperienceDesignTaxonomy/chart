import { TaxonomyChart, ExperienceProfile } from '../src/index.js';

const chart = new TaxonomyChart(document.getElementById('chart'), {
  showLabels: false,
  editable: true,
  onChange: (id, scores) => console.log('Score update — profile', id, scores),
});

chart.addProfile(
  new ExperienceProfile({
    name: 'Museum VR Tour',
    scores: [[1, 2], [1, 2, 3], [1], [1, 2, 3], [1], [1], [1, 2, 3], [1], [1, 2, 3, 4], [1]],
    color: 0xff6600,
  }),
);
