import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  define: {
    BUILD_ENV: '"production"',
  },
  resolve: {
    alias: {
      '@cherry-markdown/engine': resolve(__dirname, '../engine/src/index.js'),
      '@cherry-markdown/preview': resolve(__dirname, '../preview/src/index.js'),
      '@': resolve(__dirname, './src'),
      '@cherry': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    unstubGlobals: true,
    environment: 'jsdom',
  },
});
