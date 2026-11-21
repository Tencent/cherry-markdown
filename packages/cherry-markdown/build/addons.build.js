import { build } from 'vite';
import glob from 'glob';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { legacyUmdPlugin } from './legacy-umd.plugin.js';
import { createLibraryBuild } from '../../../build/library.mjs';
import { buildArguments, selectBuilds } from './build-targets.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');
const addonEntries = glob.sync('src/addons/**/*-plugin.js', { cwd: root });
const builds = addonEntries.flatMap((entry) =>
  ['es', 'umd'].map((format) => ({
    id: entry.replace(/^src\/addons\//, '').replace(/\.js$/, ''),
    entry,
    format,
  })),
);

for (const { entry, format } of selectBuilds(builds, buildArguments(import.meta.url))) {
  const input = resolve(root, entry);
  const relative = entry.replace(/^src\/addons\//, '');
  const outputDir = resolve(root, 'dist/addons', dirname(relative));
  const baseName = basename(relative, extname(relative));
  const globalName = baseName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  mkdirSync(outputDir, { recursive: true });

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
