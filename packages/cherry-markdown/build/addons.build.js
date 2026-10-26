import { build } from 'vite';
import glob from 'glob';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { legacyUmdPlugin } from './legacy-umd.plugin.js';
import { createLibraryBuild } from '../../../build/library.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');
const addonEntries = glob.sync('src/addons/**/*-plugin.js', { cwd: root });

for (const entry of addonEntries) {
  const input = resolve(root, entry);
  const relative = entry.replace(/^src\/addons\//, '');
  const outputDir = resolve(root, 'dist/addons', dirname(relative));
  const baseName = basename(relative, extname(relative));
  const globalName = baseName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  mkdirSync(outputDir, { recursive: true });

  for (const format of ['es', 'umd']) {
    const suffix = format === 'es' ? '.esm.js' : '.js';
    await build(
      createLibraryBuild(
        { root, entry: input, file: `${baseName}${suffix}`, format, name: globalName },
        {
          plugins: format === 'umd' ? [legacyUmdPlugin()] : [],
          define: {
            BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
          },
          resolve: {
            alias: {
              '@': src,
              '@cherry': src,
            },
          },
          build: {
            outDir: outputDir,
            rolldownOptions: {
              output: {
                format,
                name: globalName,
                entryFileNames: `${baseName}${suffix}`,
              },
            },
          },
        },
      ),
    );
    console.log(`[addons build] ${join(outputDir, `${baseName}${suffix}`)}`);
  }
}
