import { resolve } from 'path';
import { createBrowserTestConfig } from '../../build/test.mjs';
import { prismLanguagePlugin } from '../cherry-markdown/build/prism.plugin.js';

export default createBrowserTestConfig({
  plugins: [prismLanguagePlugin()],
  define: { BUILD_ENV: JSON.stringify('production') },
  resolve: {
    alias: {
      '@/Sanitizer': resolve(import.meta.dirname, '../cherry-markdown/src/semantic/sanitizer.ts'),
      '@': resolve(import.meta.dirname, '../cherry-markdown/src'),
      '@cherry': resolve(import.meta.dirname, '../cherry-markdown/src'),
    },
  },
});
