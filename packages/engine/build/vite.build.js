import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');

const baseExternal = ['jsdom', 'mermaid', /^mermaid\//];

const builds = [
  {
    id: 'engine-esm',
    entry: resolve(src, 'index.js'),
    file: 'cherry-markdown-engine.esm.js',
    format: 'es',
    external: baseExternal,
  },
  {
    id: 'engine-umd',
    entry: resolve(src, 'index.js'),
    file: 'cherry-markdown-engine.js',
    format: 'umd',
    name: 'CherryEngine',
    external: baseExternal,
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
          globals: current.format === 'umd' && current.external.includes('mermaid') ? { mermaid: 'mermaid' } : {},
        },
      },
    },
  });
}
