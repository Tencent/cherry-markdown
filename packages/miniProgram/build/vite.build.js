import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prismLanguagePlugin } from '../../cherry-markdown/build/prism.plugin.js';
import { createLibraryBuild } from '../../../build/library.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const repoRoot = resolve(root, '../..');
const cherrySrc = resolve(repoRoot, 'packages/cherry-markdown/src');
const sanitizer = resolve(root, 'src/shared/Sanitizer.miniProgram.js');

await build(
  createLibraryBuild(
    { root, entry: resolve(root, 'src/index.js'), file: 'miniProgram.esm.js', format: 'es' },
    {
      plugins: [prismLanguagePlugin()],
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
        rollupOptions: {
          external: ['mermaid', 'codemirror', /^codemirror\//],
          output: {
            format: 'es',
            entryFileNames: 'miniProgram.esm.js',
            exports: 'named',
          },
        },
      },
    },
  ),
);
