import { resolve } from 'path';
import { createBrowserTestConfig } from '../../build/test.mjs';
import { prismLanguagePlugin } from '../cherry-markdown/build/prism.plugin.js';

export default createBrowserTestConfig({
  plugins: [prismLanguagePlugin()],
  resolve: {
    alias: {
      '@/Sanitizer': resolve(import.meta.dirname, './src/shared/Sanitizer.miniProgram.js'),
      '@': resolve(import.meta.dirname, '../cherry-markdown/src'),
      '@cherry': resolve(import.meta.dirname, '../cherry-markdown/src'),
    },
  },
});
