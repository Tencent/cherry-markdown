import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';

const demoRoot = import.meta.dirname;
const outputFile = resolve(demoRoot, 'miniprogram/pages/index/index.js');

await mkdir(resolve(outputFile, '..'), { recursive: true });

await build({
  configFile: false,
  root: demoRoot,
  build: {
    outDir: resolve(demoRoot, 'miniprogram/pages/index'),
    emptyOutDir: false,
    lib: {
      entry: resolve(demoRoot, 'src/pages/index/index.js'),
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      output: {
        format: 'cjs',
        entryFileNames: 'index.js',
        codeSplitting: false,
        manualChunks: undefined,
        exports: 'named',
      },
    },
  },
});
