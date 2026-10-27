import { build, mergeConfig } from 'vite';
import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMiniProgramBuild } from './config.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
for (const component of ['markdown', 'block', 'inlines']) {
  const source = resolve(root, 'src/components', component);
  const outDir = resolve(root, 'dist/components', component);
  await mkdir(outDir, { recursive: true });
  await build(
    mergeConfig(createMiniProgramBuild({ root, entry: resolve(source, 'index.ts'), file: 'index.js', format: 'cjs' }), {
      build: { outDir },
    }),
  );
  for (const extension of ['json', 'wxml', 'wxss']) {
    await cp(resolve(source, `index.${extension}`), resolve(outDir, `index.${extension}`));
  }
}
