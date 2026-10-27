import { resolve } from 'node:path';
import { nativeEntityTables } from './entities.js';
import { fileURLToPath } from 'node:url';
import { prismLanguagePlugin } from '../../cherry-markdown/build/prism.plugin.js';
import { createLibraryBuild } from '../../../build/library.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const repoRoot = resolve(root, '../..');
const cherrySrc = resolve(repoRoot, 'packages/cherry-markdown/src');
const sanitizer = resolve(root, 'src/shared/Sanitizer.miniProgram.ts');

export function createMiniProgramBuild(output) {
  return createLibraryBuild(output, {
    plugins: [prismLanguagePlugin(), nativeEntityTables()],
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
      rolldownOptions: {
        external: ['mermaid', 'codemirror', /^codemirror\//],
        output: {
          format: output.format,
          entryFileNames: output.file,
          exports: 'named',
        },
      },
    },
  });
}
