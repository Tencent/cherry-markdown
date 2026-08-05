import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import './revision.js';
import { cherryBuildTargets } from './artifact-contract.js';
import { legacyUmdPlugin } from './legacy-umd.plugin.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const src = resolve(root, 'src');

for (const current of cherryBuildTargets) {
  console.log(`[vite build] ${current.id}`);
  await build({
    configFile: false,
    root,
    plugins: [legacyUmdPlugin()],
    define: {
      BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || ''),
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
        entry: resolve(root, current.entry),
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
