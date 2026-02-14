import { defineConfig } from 'vite';

export default defineConfig({
  root: 'site',
  base: '/chart/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
