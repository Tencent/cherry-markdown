import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { legacyUmdPlugin } from './legacy-umd.plugin.js';
import { getBuildVersion } from './revision.js';
import { legacyEntries } from './legacy-entries.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');
const buildVersion = getBuildVersion(process.env.NODE_ENV);
const baseExternal = ['jsdom'];
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
  ...legacyEntries.map((entry) => ({
    ...entry,
    entry: resolve(src, entry.entry),
    external: baseExternal,
  })),
];

for (const current of builds) {
  console.log(`[vite build] ${current.id}`);
  await build({
    configFile: false,
    root,
    plugins:
      current.format === 'umd'
        ? [legacyUmdPlugin({ compact: current.id !== 'full-umd', sourceMaps: Boolean(current.sourcemap) })]
        : [],
    define: {
      BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.BUILD_VERSION': JSON.stringify(buildVersion),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
    resolve: {
      alias: {
        '@': src,
        '@cherry': src,
        '@cherry-markdown/engine': resolve(root, '../engine/dist/cherry-markdown-engine.browser.esm.js'),
        '@cherry-markdown/preview': resolve(root, '../preview/dist/cherry-markdown-preview.esm.js'),
        '@cherry-markdown/stream': resolve(root, '../stream/dist/cherry-markdown-stream.esm.js'),
      },
    },
    build: {
      emptyOutDir: false,
      target: 'es2015',
      // The historical full UMD bundle is Babel-transformed but not minified.
      // Other bundles retain their Terser contract.
      minify: current.id === 'full-umd' ? false : 'terser',
      terserOptions: {
        compress: {
          pure_funcs: ['console.log', 'console.info'],
        },
        format: {
          comments: false,
        },
      },
      sourcemap: current.sourcemap || false,
      lib: {
        entry: current.entry,
        formats: [current.format],
        fileName: () => current.file,
        name: current.name,
      },
      rollupOptions: {
        // Cherry relies on registration side effects that are not fully covered by
        // runtime tests yet. Preserve the historical published-bundle contract.
        treeshake: false,
        external: current.external,
        output: {
          codeSplitting: false,
          exports: 'named',
          generatedCode: { preset: 'es5' },
          globals: current.format === 'umd' && current.external.includes('mermaid') ? { mermaid: 'mermaid' } : {},
        },
      },
    },
  });
}
