import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prismLanguagePlugin } from '../../cherry-markdown/build/prism.plugin.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const repoRoot = resolve(root, '../..');
const cherrySrc = resolve(repoRoot, 'packages/cherry-markdown/src');
const sanitizer = resolve(root, 'src/shared/Sanitizer.miniProgram.js');

await build({
  plugins: [prismLanguagePlugin()],
  configFile: false,
  root,
  define: {
    BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  resolve: {
    alias: {
      '@/Sanitizer': sanitizer,
      '@': cherrySrc,
      '@cherry': cherrySrc,
    },
  },
  build: {
    emptyOutDir: false,
    target: 'es2015',
    minify: 'oxc',
    lib: {
      entry: resolve(root, 'src/index.js'),
      formats: ['es'],
      fileName: () => 'miniProgram.esm.js',
    },
    rollupOptions: {
      external: ['mermaid', 'codemirror', /^codemirror\//],
      output: {
        format: 'es',
        entryFileNames: 'miniProgram.esm.js',
        codeSplitting: false,
        manualChunks: undefined,
        exports: 'named',
      },
    },
  },
});
