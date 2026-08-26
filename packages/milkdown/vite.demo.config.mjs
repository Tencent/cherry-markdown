import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const examplesRoot = resolve(packageRoot, 'examples');

export default defineConfig({
  root: examplesRoot,
  base: './',
  plugins: [react()],
  build: {
    outDir: resolve(packageRoot, 'preview'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(examplesRoot, 'index.html'),
        visual: resolve(examplesRoot, 'visual.html'),
      },
    },
  },
});
