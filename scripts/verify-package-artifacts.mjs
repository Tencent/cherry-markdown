import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const root = resolve(import.meta.dirname, '..');
const packages = [
  ['engine', 'cherry-markdown-engine', 'CherryEngine'],
  ['preview', 'cherry-markdown-preview', 'CherryPreview', 'cherry-markdown-preview.css'],
  ['stream', 'cherry-markdown-stream', 'CherryStream'],
  ['milkdown', 'cherry-markdown-milkdown', 'CherryMilkdown', 'cherry-markdown-milkdown.css'],
];
const require = createRequire(import.meta.url);
const npmCache = mkdtempSync(resolve(tmpdir(), 'cherry-npm-pack-'));
const consumerDir = mkdtempSync(resolve(tmpdir(), 'cherry-package-consumer-'));
const tarballs = [];

for (const [dir, stem, globalName, cssFile] of packages) {
  const packageDir = resolve(root, 'packages', dir);
  const manifest = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'));
  const esm = resolve(packageDir, `dist/${stem}.esm.js`);
  const cjs = resolve(packageDir, `dist/${stem}.cjs`);
  const umd = resolve(packageDir, `dist/${stem}.js`);
  const types = resolve(packageDir, 'dist/types/index.d.ts');

  for (const file of [esm, cjs, umd, types, cssFile && resolve(packageDir, `dist/${cssFile}`)].filter(Boolean)) {
    readFileSync(file);
  }
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

  const pack = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', consumerDir], {
    cwd: packageDir,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: npmCache },
  }));
  if (!pack[0]?.files?.some((file) => file.path === `dist/${stem}.esm.js`)) {
    throw new Error(`${manifest.name} npm pack omits its ESM artifact`);
  }
  if (cssFile && !pack[0]?.files?.some((file) => file.path === `dist/${cssFile}`)) {
    throw new Error(`${manifest.name} npm pack omits ${cssFile}`);
  }
  tarballs.push(resolve(consumerDir, pack[0].filename));
  console.log(`${manifest.name}: ESM, CJS, UMD, types and npm pack verified`);
}

writeFileSync(
  resolve(consumerDir, 'package.json'),
  JSON.stringify({ private: true, type: 'module', dependencies: {} }, null, 2),
);
execFileSync(
  'npm',
  ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs],
  { cwd: consumerDir, stdio: 'inherit', env: { ...process.env, npm_config_cache: npmCache } },
);
writeFileSync(
  resolve(consumerDir, 'consume.mjs'),
  `import Engine from '@cherry-markdown/engine';
import Preview from '@cherry-markdown/preview';
import Stream from '@cherry-markdown/stream';
import Milkdown, { EditorAdapter } from '@cherry-markdown/milkdown';
if (![Engine, Preview, Stream, Milkdown, EditorAdapter].every(Boolean)) throw new Error('missing ESM exports');
`,
);
writeFileSync(
  resolve(consumerDir, 'consume.cjs'),
  `const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.CustomEvent = dom.window.CustomEvent;
global.MutationObserver = dom.window.MutationObserver;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.DOMParser = dom.window.DOMParser;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
for (const name of ['engine', 'preview', 'stream', 'milkdown']) {
  const value = require('@cherry-markdown/' + name);
  if (!value.default) throw new Error(name + ' missing CommonJS default export');
}
`,
);
writeFileSync(
  resolve(consumerDir, 'consume.ts'),
  `import Engine, { HookCenter, SyntaxHookBase } from '@cherry-markdown/engine';
import Preview from '@cherry-markdown/preview';
import Stream from '@cherry-markdown/stream';
import Milkdown, { type EditorAdapter } from '@cherry-markdown/milkdown';

const exportsToCheck: unknown[] = [Engine, HookCenter, SyntaxHookBase, Preview, Stream, Milkdown];
const adapter: EditorAdapter | undefined = undefined;
void exportsToCheck;
void adapter;
`,
);
writeFileSync(
  resolve(consumerDir, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'ES2020',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      files: ['consume.ts'],
    },
    null,
    2,
  ),
);
execFileSync(process.execPath, ['consume.mjs'], { cwd: consumerDir, stdio: 'inherit' });
execFileSync(process.execPath, ['consume.cjs'], { cwd: consumerDir, stdio: 'inherit' });
execFileSync(resolve(root, 'node_modules/.bin/tsc'), ['--project', 'tsconfig.json'], {
  cwd: consumerDir,
  stdio: 'inherit',
});
console.log('empty-project tarball installation and ESM/CommonJS/TypeScript consumption verified');
