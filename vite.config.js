import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'ImmersiveExperienceDesignTaxonomyChart',
      fileName: 'immersive-experience-design-taxonomy-chart',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['three', /^three\//],
    },
  },
});
