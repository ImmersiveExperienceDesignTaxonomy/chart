import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/embed.js',
      name: 'TaxonomyChartEmbed',
      fileName: () => 'embed.js',
      formats: ['iife'],
    },
    outDir: 'docs',
    emptyOutDir: false,
  },
});
