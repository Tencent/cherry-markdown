import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { legacyUmdPlugin } from './legacy-umd.plugin.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');
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
    name: 'Cherry',
    external: baseExternal,
  },
  {
    id: 'full-umd',
    entry: resolve(src, 'index.browser.js'),
    file: 'cherry-markdown.js',
    format: 'umd',
    name: 'Cherry',
    external: baseExternal,
  },
  {
    id: 'core-esm',
    entry: resolve(src, 'index.core.js'),
    file: 'cherry-markdown.core.esm.js',
    format: 'es',
    name: 'Cherry',
    external: coreExternal,
  },
  {
    id: 'core-umd',
    entry: resolve(src, 'index.core.browser.js'),
    file: 'cherry-markdown.core.js',
    format: 'umd',
    name: 'Cherry',
    external: coreExternal,
  },
  {
    id: 'engine-esm',
    entry: resolve(src, 'index.engine.js'),
    file: 'cherry-markdown.engine.esm.js',
    format: 'es',
    name: 'CherryEngine',
    external: engineExternal,
  },
  {
    id: 'engine-umd',
    entry: resolve(src, 'index.engine.browser.js'),
    file: 'cherry-markdown.engine.js',
    format: 'umd',
    name: 'CherryEngine',
    external: engineExternal,
  },
  {
    id: 'stream-esm',
    entry: resolve(src, 'index.stream.js'),
    file: 'cherry-markdown.stream.esm.js',
    format: 'es',
    name: 'Cherry',
    external: streamExternal,
  },
  {
    id: 'stream-umd',
    entry: resolve(src, 'index.stream.browser.js'),
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
    plugins: [legacyUmdPlugin()],
    define: {
      BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
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
      minify: 'esbuild',
      lib: {
        entry: current.entry,
        formats: [current.format],
        fileName: () => current.file,
        name: current.name,
      },
      rollupOptions: {
        external: current.external,
        output: {
          format: current.format,
          name: current.name,
          entryFileNames: current.file,
          codeSplitting: false,
          manualChunks: undefined,
          exports: 'named',
          globals: { mermaid: 'mermaid' },
        },
      },
    },
  });
}
