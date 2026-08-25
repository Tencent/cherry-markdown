import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(packageRoot, '../..');
const output = resolve(packageRoot, 'preview');

await build({
  root: resolve(packageRoot, 'examples'),
  base: './',
  build: {
    outDir: output,
    emptyOutDir: true,
  },
});

await mkdir(resolve(output, 'assets'), { recursive: true });
await cp(resolve(workspaceRoot, 'examples/assets'), resolve(output, 'assets'), { recursive: true });
await cp(resolve(workspaceRoot, 'examples/drawio_demo.html'), resolve(output, 'drawio_demo.html'));
