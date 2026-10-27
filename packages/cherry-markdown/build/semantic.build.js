import { build } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createLibraryBuild } from '../../../build/library.mjs';
import { prismLanguagePlugin } from './prism.plugin.js';
import { semanticThemePlugin } from './semantic-theme.js';
import { nativeEntityTables } from './semantic-entities.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
for (const [entry, format, file] of [
  ['index.ts', 'es', 'cherry-markdown.semantic.esm.js'],
  ['index.ts', 'cjs', 'cherry-markdown.semantic.cjs'],
  ['theme.ts', 'es', 'cherry-markdown.theme.esm.js'],
  ['theme.ts', 'cjs', 'cherry-markdown.theme.cjs'],
]) {
  await build(
    createLibraryBuild(
      { root, entry: resolve(root, 'src/semantic', entry), format, file },
      {
        plugins: [prismLanguagePlugin(), nativeEntityTables(), semanticThemePlugin()],
        define: {
          BUILD_ENV: JSON.stringify('production'),
          CHERRY_SEMANTIC_CORE_VERSION: JSON.stringify(
            JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version,
          ),
        },
        build: { rolldownOptions: { output: { exports: 'named' } } },
        resolve: {
          alias: {
            '@/Sanitizer': resolve(root, 'src/semantic/sanitizer.ts'),
            '@': resolve(root, 'src'),
            '@cherry': resolve(root, 'src'),
          },
        },
      },
    ),
  );
}
