import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');

const baseExternal = ['jsdom'];

const builds = [
  {
    id: 'stream-esm',
    entry: resolve(src, 'index.js'),
    file: 'cherry-markdown-stream.esm.js',
    format: 'es',
    external: [...baseExternal, '@cherry-markdown/engine', '@cherry-markdown/preview'],
  },
  {
    id: 'stream-umd',
    entry: resolve(src, 'index.js'),
    file: 'cherry-markdown-stream.js',
    format: 'umd',
    name: 'CherryStream',
    external: baseExternal,
  },
  {
    id: 'stream-cjs',
    entry: resolve(src, 'index.js'),
    file: 'cherry-markdown-stream.cjs',
    format: 'cjs',
    external: [...baseExternal, '@cherry-markdown/engine', '@cherry-markdown/preview'],
  },
];

for (const current of builds) {
  console.log(`[vite build] ${current.id}`);
  await build({
    configFile: false,
    root,
    define: {
      BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || '0.0.1'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
    resolve: {
      alias: {
        '@': src,
        '@cherry': src,
        '@cherry-markdown/engine': resolve(root, '../engine/dist/cherry-markdown-engine.browser.esm.js'),
        '@cherry-markdown/preview': resolve(root, '../preview/dist/cherry-markdown-preview.esm.js'),
      },
    },
    build: {
      emptyOutDir: false,
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: { pure_funcs: ['console.log', 'console.info'] },
        format: { comments: false },
      },
      lib: {
        entry: current.entry,
        formats: [current.format],
        fileName: () => current.file,
        name: current.name,
      },
      rollupOptions: {
        treeshake: false,
        external: current.external,
        output: {
          codeSplitting: false,
          exports: 'named',
          generatedCode: { preset: 'es5' },
        },
      },
    },
  });
}
