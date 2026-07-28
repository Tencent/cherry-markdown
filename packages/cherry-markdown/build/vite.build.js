import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');

const builds = [
  {
    name: 'full-esm',
    entry: resolve(src, 'index.js'),
    file: 'cherry-markdown.esm.js',
    format: 'es',
  },
  {
    name: 'full-iife',
    entry: resolve(src, 'index.iife.js'),
    file: 'cherry-markdown.iife.js',
    format: 'iife',
    name: 'Cherry',
  },
  {
    name: 'core-esm',
    entry: resolve(src, 'index.core.js'),
    file: 'cherry-markdown.core.esm.js',
    format: 'es',
  },
  {
    name: 'core-iife',
    entry: resolve(src, 'index.core.iife.js'),
    file: 'cherry-markdown.core.iife.js',
    format: 'iife',
    name: 'Cherry',
  },
  {
    name: 'engine-esm',
    entry: resolve(src, 'index.engine.js'),
    file: 'cherry-markdown.engine.esm.js',
    format: 'es',
  },
  {
    name: 'engine-iife',
    entry: resolve(src, 'index.engine.iife.js'),
    file: 'cherry-markdown.engine.iife.js',
    format: 'iife',
    name: 'CherryEngine',
  },
  {
    name: 'stream-esm',
    entry: resolve(src, 'index.stream.js'),
    file: 'cherry-markdown.stream.esm.js',
    format: 'es',
  },
  {
    name: 'stream-iife',
    entry: resolve(src, 'index.stream.iife.js'),
    file: 'cherry-markdown.stream.iife.js',
    format: 'iife',
    name: 'Cherry',
  },
];

const external = ['mermaid', '@replit/codemirror-vim', 'codemirror', /^codemirror\//, 'jsdom'];

for (const current of builds) {
  console.log(`[vite build] ${current.name}`);
  await build({
    configFile: false,
    root,
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
        external,
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
