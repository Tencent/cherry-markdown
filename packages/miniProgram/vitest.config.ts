import { resolve } from 'path';
import { defineConfig } from 'vite-plus';
import { prismLanguagePlugin } from '../cherry-markdown/build/prism.plugin.js';

export default defineConfig({
  plugins: [prismLanguagePlugin()],
  resolve: {
    alias: {
      '@/Sanitizer': resolve(import.meta.dirname, './src/shared/Sanitizer.miniProgram.js'),
      '@': resolve(import.meta.dirname, '../cherry-markdown/src'),
      '@cherry': resolve(import.meta.dirname, '../cherry-markdown/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
