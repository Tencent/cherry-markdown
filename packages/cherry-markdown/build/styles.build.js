import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as sass from 'sass';

const root = resolve(new URL('.', import.meta.url).pathname, '..');
const outputDir = resolve(root, 'dist');

const styles = [
  ['src/sass/index.scss', 'cherry-markdown'],
  ['src/sass/markdown_pure.scss', 'cherry-previewer'],
];

await mkdir(outputDir, { recursive: true });

for (const [input, name] of styles) {
  const source = resolve(root, input);
  const expanded = sass.compile(source, { style: 'expanded', charset: false });
  const compressed = sass.compile(source, { style: 'compressed', charset: false });
  await writeFile(resolve(outputDir, `${name}.css`), expanded.css);
  await writeFile(resolve(outputDir, `${name}.min.css`), compressed.css);
  console.log(`[styles build] ${name}`);
}
