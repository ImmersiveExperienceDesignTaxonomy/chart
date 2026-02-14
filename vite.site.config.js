import { defineConfig } from 'vite';

export default defineConfig({
  root: 'site',
  base: '/Chart/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
