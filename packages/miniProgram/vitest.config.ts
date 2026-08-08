import { resolve } from 'path';
import { defineConfig } from 'vite-plus';

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
