import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  define: {
    BUILD_ENV: '"production"',
  },
  resolve: {
    alias: {
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
