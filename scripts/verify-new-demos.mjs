import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const examples = resolve(root, 'examples');
const configFile = resolve(root, 'packages/cherry-markdown/vite.config.ts');
const demos = [
  ['new-engine.html', '@cherry-markdown/engine'],
  ['new-preview.html', '@cherry-markdown/preview'],
  ['new-stream.html', '@cherry-markdown/stream'],
  ['new-milkdown.html', '@cherry-markdown/milkdown'],
];

const configSource = await readFile(configFile, 'utf8');
for (const [file, packageName] of demos) {
  const route = `/${file}`;
  const packageDir = packageName.slice('@cherry-markdown/'.length);
  const packageJson = JSON.parse(await readFile(resolve(root, 'packages', packageDir, 'package.json'), 'utf8'));
  const source = await readFile(resolve(examples, file), 'utf8');
  if (!source.includes('【new】')) throw new Error(`${route} is missing the 【new】 marker`);
  if (!source.includes(`from '${packageName}'`)) throw new Error(`${route} does not consume ${packageName}`);
  if (!configSource.includes(`'${route}'`)) throw new Error(`${route} is missing from the dev route list`);
  if (!configSource.includes(`find: '${packageName}'`)) throw new Error(`${packageName} is missing from the demo aliases`);

  const browserEntry = packageJson.exports?.['.']?.browser || packageJson.module;
  if (!browserEntry) throw new Error(`${packageName} has no browser or ESM entry`);
  const builtModule = await readFile(resolve(root, 'packages', packageDir, browserEntry), 'utf8');
  if (!builtModule.trim()) throw new Error(`${packageName} browser entry is empty`);
  if (packageName === '@cherry-markdown/engine' && /(?:from|require\()["']jsdom["']/.test(builtModule)) {
    throw new Error(`${packageName} browser entry leaks jsdom`);
  }

  console.log(`${route}: marker, route, Vite alias and browser entry verified`);
}
