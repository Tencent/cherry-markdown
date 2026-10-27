import { build, mergeConfig } from 'vite';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEMANTIC_SCHEMA_VERSION, SEMANTIC_CORE_VERSION } from 'cherry-markdown/semantic';
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

await writeFile(
  resolve(root, 'dist/semantic-bridge.json'),
  JSON.stringify(
    {
      schemaVersion: SEMANTIC_SCHEMA_VERSION,
      coreVersion: SEMANTIC_CORE_VERSION,
      source: 'cherry-markdown/semantic',
    },
    null,
    2,
  ) + '\n',
);
