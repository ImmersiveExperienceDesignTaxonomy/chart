import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'IEDTaxonomyChart',
      fileName: 'ied-taxonomy-chart',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['three', /^three\//],
    },
  },
});
