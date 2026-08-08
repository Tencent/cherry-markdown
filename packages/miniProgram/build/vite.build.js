import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const repoRoot = resolve(root, '../..');
const cherrySrc = resolve(repoRoot, 'packages/cherry-markdown/src');
const sanitizer = resolve(root, 'src/shared/Sanitizer.miniProgram.js');

await build({
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
    minify: 'esbuild',
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
