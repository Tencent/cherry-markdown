import { resolve } from 'path';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      '@/Sanitizer': resolve(__dirname, './src/shared/Sanitizer.miniProgram.js'),
      '@cherry-markdown/engine': resolve(__dirname, '../engine/src/index.js'),
      '@cherry-markdown/preview': resolve(__dirname, '../preview/src/index.js'),
      '@cherry-markdown/stream': resolve(__dirname, '../stream/src/index.js'),
      '@': resolve(__dirname, '../cherry-markdown/src'),
      '@cherry': resolve(__dirname, '../cherry-markdown/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
