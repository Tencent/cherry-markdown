import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMiniProgramBuild } from './config.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
await build(
  createMiniProgramBuild({ root, entry: resolve(root, 'src/index.ts'), file: 'miniProgram.esm.js', format: 'es' }),
);
