import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { legacyUmdPlugin } from './legacy-umd.plugin.js';
import { getBuildVersion } from './revision.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');
const buildVersion = getBuildVersion(process.env.NODE_ENV);
const baseExternal = ['jsdom'];
const coreExternal = [...baseExternal, 'mermaid', '@replit/codemirror-vim', 'codemirror', /^codemirror\//];
const engineExternal = [...baseExternal, 'mermaid'];
const streamExternal = [...engineExternal, 'codemirror', /^codemirror\//];

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
