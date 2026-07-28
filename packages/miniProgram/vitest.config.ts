import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@/Sanitizer': resolve(__dirname, './src/shared/Sanitizer.miniProgram.js'),
      '@': resolve(__dirname, '../cherry-markdown/src'),
      '@cherry': resolve(__dirname, '../cherry-markdown/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
