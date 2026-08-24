import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const root = resolve(import.meta.dirname, '..');
const packages = [
  ['engine', 'cherry-markdown-engine', 'CherryEngine'],
  ['preview', 'cherry-markdown-preview', 'CherryPreview'],
  ['stream', 'cherry-markdown-stream', 'CherryStream'],
  ['milkdown', 'cherry-markdown-milkdown', 'CherryMilkdown'],
];
const require = createRequire(import.meta.url);
const npmCache = mkdtempSync(resolve(tmpdir(), 'cherry-npm-pack-'));

for (const [dir, stem, globalName] of packages) {
  const packageDir = resolve(root, 'packages', dir);
  const manifest = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'));
  const esm = resolve(packageDir, `dist/${stem}.esm.js`);
  const cjs = resolve(packageDir, `dist/${stem}.cjs`);
  const umd = resolve(packageDir, `dist/${stem}.js`);
  const types = resolve(packageDir, 'dist/types/index.d.ts');

  for (const file of [esm, cjs, umd, types]) readFileSync(file);
  const imported = await import(esm);
  if (dir === 'milkdown' && typeof document === 'undefined') {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.CustomEvent = dom.window.CustomEvent;
    globalThis.MutationObserver = dom.window.MutationObserver;
    globalThis.Element = dom.window.Element;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.Node = dom.window.Node;
    globalThis.DOMParser = dom.window.DOMParser;
    Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
  }
  const required = require(cjs);
  if (!imported.default || !required.default) throw new Error(`${manifest.name} is missing ESM/CJS default export`);
  const umdSource = readFileSync(umd, 'utf8');
  if (!umdSource.includes(globalName)) throw new Error(`${manifest.name} UMD global ${globalName} is missing`);
  if (umdSource.includes('cherry-markdown/src')) throw new Error(`${manifest.name} leaks root source paths`);

  const pack = JSON.parse(execFileSync('npm', ['pack', '--json', '--dry-run', '--ignore-scripts'], {
    cwd: packageDir,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: npmCache },
  }));
  if (!pack[0]?.files?.some((file) => file.path === `dist/${stem}.esm.js`)) {
    throw new Error(`${manifest.name} npm pack omits its ESM artifact`);
  }
  console.log(`${manifest.name}: ESM, CJS, UMD, types and npm pack verified`);
}
