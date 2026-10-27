import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';

const demoRoot = import.meta.dirname;
const packageRoot = resolve(process.argv[2] || resolve(demoRoot, '../../packages/miniProgram'));
const runtimeRoot = resolve(demoRoot, 'miniprogram');
await rm(resolve(runtimeRoot, 'components/cherry'), { recursive: true, force: true });
await cp(resolve(packageRoot, 'dist/components'), resolve(runtimeRoot, 'components/cherry'), { recursive: true });
for (const page of ['index', 'skyline']) {
  const outDir = resolve(runtimeRoot, 'pages', page);
  await mkdir(outDir, { recursive: true });
  await build({
    configFile: false,
    root: demoRoot,
    build: {
      outDir,
      emptyOutDir: false,
      target: 'es2015',
      lib: {
        entry: resolve(demoRoot, 'src/pages/index/index.ts'),
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
}
