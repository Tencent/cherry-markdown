import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

import { styleBuildTargets } from './artifact-contract.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const outputDir = resolve(root, 'dist');

await mkdir(outputDir, { recursive: true });

for (const { input, name } of styleBuildTargets) {
  const source = resolve(root, input);
  const expanded = sass.compile(source, { style: 'expanded', charset: false });
  const compressed = sass.compile(source, { style: 'compressed', charset: false });
  await writeFile(resolve(outputDir, `${name}.css`), expanded.css);
  await writeFile(resolve(outputDir, `${name}.min.css`), compressed.css);
  console.log(`[styles build] ${name}`);
}
