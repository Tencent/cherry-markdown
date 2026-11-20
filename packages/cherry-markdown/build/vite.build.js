import { build } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { legacyUmdPlugin } from './legacy-umd.plugin.js';
import { getBuildVersion } from './revision.js';
import { prismLanguagePlugin } from './prism.plugin.js';
import { bundledDependencyLinks, createLibraryBuild, formatDependencyBanner } from '../../../build/library.mjs';
import { buildArguments, selectBuilds } from './build-targets.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');
const buildVersion = getBuildVersion(process.env.NODE_ENV);
const baseExternal = ['jsdom'];
const coreExternal = [...baseExternal, 'mermaid', '@replit/codemirror-vim', 'codemirror', /^codemirror\//];
const engineExternal = [...baseExternal, 'mermaid'];
const streamExternal = [...engineExternal, 'codemirror', /^codemirror\//];

/** @param {{ moduleIds: string[] }} chunk */
function dependencyBanner(chunk) {
  const links = bundledDependencyLinks(chunk);
  for (const key of links.keys()) {
    if (!key.startsWith('elkjs@')) continue;
    const version = key.slice('elkjs@'.length);
    links.set(
      key,
      `${key} | Source: https://github.com/kieler/elkjs/releases/tag/${version} | License: https://www.eclipse.org/legal/epl-2.0/`,
    );
    if (version === '0.12.1') {
      links.set(
        'Eclipse Layout Kernel',
        'Eclipse Layout Kernel | Source: https://github.com/eclipse-elk/elk/releases/tag/v0.12.1 | License: https://www.eclipse.org/legal/epl-2.0/',
      );
    }
  }

  // Mermaid vendors js-yaml in its compiled chunks, outside the module graph.
  for (const id of chunk.moduleIds) {
    if (!/\/mermaid\/dist\/chunks\/mermaid\.core\/chunk-[^/]+\.mjs$/.test(id)) continue;
    const version = readFileSync(id, 'utf8').match(/\/\.pnpm\/js-yaml@(\d+\.\d+\.\d+)\//)?.[1];
    if (!version) continue;
    const key = `js-yaml@${version}`;
    links.set(
      key,
      `${key} | Source: https://github.com/nodeca/js-yaml/tree/${version} | License: https://spdx.org/licenses/MIT.html`,
    );
    break;
  }
  return formatDependencyBanner(links.values());
}

const builds = [
  {
    id: 'full-esm',
    entry: resolve(src, 'index.js'),
    file: 'cherry-markdown.esm.js',
    format: 'es',
    external: baseExternal,
  },
  {
    id: 'full-umd',
    entry: resolve(src, 'index.umd.js'),
    file: 'cherry-markdown.js',
    format: 'umd',
    name: 'Cherry',
    external: baseExternal,
    sourcemap: true,
  },
  {
    id: 'core-umd',
    entry: resolve(src, 'index.core.umd.js'),
    file: 'cherry-markdown.core.js',
    format: 'umd',
    name: 'Cherry',
    external: coreExternal,
  },
  {
    id: 'core-esm',
    entry: resolve(src, 'index.core.js'),
    file: 'cherry-markdown.core.esm.js',
    format: 'es',
    external: coreExternal,
  },
  {
    id: 'engine-esm',
    entry: resolve(src, 'index.engine.js'),
    file: 'cherry-markdown.engine.esm.js',
    format: 'es',
    external: engineExternal,
  },
  {
    id: 'engine-umd',
    entry: resolve(src, 'index.engine.js'),
    file: 'cherry-markdown.engine.js',
    format: 'umd',
    name: 'CherryEngine',
    external: engineExternal,
  },
  {
    id: 'engine-core-esm',
    entry: resolve(src, 'index.engine.core.js'),
    file: 'cherry-markdown.engine.core.esm.js',
    format: 'es',
    external: engineExternal,
  },
  {
    id: 'engine-core-umd',
    entry: resolve(src, 'index.engine.core.js'),
    file: 'cherry-markdown.engine.core.js',
    format: 'umd',
    name: 'CherryEngine',
    external: engineExternal,
  },
  {
    id: 'stream-esm',
    entry: resolve(src, 'index.stream.js'),
    file: 'cherry-markdown.stream.esm.js',
    format: 'es',
    external: streamExternal,
  },
  {
    id: 'stream-umd',
    entry: resolve(src, 'index.stream.umd.js'),
    file: 'cherry-markdown.stream.js',
    format: 'umd',
    name: 'Cherry',
    external: streamExternal,
  },
];

for (const current of selectBuilds(builds, buildArguments(import.meta.url))) {
  console.log(`[vite build] ${current.id}`);
  await build(
    createLibraryBuild(
      {
        root,
        entry: current.entry,
        file: current.file,
        format: current.format,
        name: current.name,
      },
      {
        plugins: [
          prismLanguagePlugin(),
          ...(current.format === 'umd'
            ? [
                legacyUmdPlugin({
                  compact: current.id !== 'full-umd',
                  sourceMaps: Boolean(current.sourcemap),
                  banner: dependencyBanner,
                }),
              ]
            : []),
        ],
        define: {
          BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
          'process.env.BUILD_VERSION': JSON.stringify(buildVersion),
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        },
        resolve: {
          alias: {
            '@': src,
            '@cherry': src,
          },
        },
        build: {
          // The historical full UMD bundle is Babel-transformed but not minified.
          // Other bundles retain their Terser contract.
          minify: current.id === 'full-umd' ? false : 'terser',
          terserOptions: {
            compress: {
              pure_funcs: ['console.log', 'console.info'],
              passes: 3,
              toplevel: true,
              pure_getters: true,
              unsafe_comps: true,
              unsafe_math: true,
            },
            mangle: {
              toplevel: true,
            },
            format: {
              comments: /^! Bundled third-party dependencies/,
            },
          },
          sourcemap: current.sourcemap || false,
          rolldownOptions: {
            // Cherry relies on registration side effects that are not fully covered by
            // runtime tests yet. Preserve the historical published-bundle contract.
            treeshake: false,
            external: current.external,
            output: {
              ...(current.format === 'es' ? { banner: dependencyBanner } : {}),
              exports: 'named',
              generatedCode: { preset: 'es5' },
              globals: current.format === 'umd' && current.external.includes('mermaid') ? { mermaid: 'mermaid' } : {},
            },
          },
        },
      },
    ),
  );
}
