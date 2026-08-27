import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const rules = {
  engine: ['@codemirror/', 'codemirror', '@milkdown/', '@cherry-markdown/preview', '@cherry-markdown/stream'],
  preview: ['@codemirror/', 'codemirror', '@milkdown/', 'cherry-markdown/src'],
  stream: ['@codemirror/', 'codemirror', '@milkdown/', 'cherry-markdown/src'],
  milkdown: ['@codemirror/', 'codemirror', 'cherry-markdown/src'],
};
const forbiddenEngineInteractionTokens = [
  '@codemirror/',
  '.view.focus(',
  'suggester-panel',
  'onCodeMirrorChange',
  'coordsAtPos(',
  'previewer',
  'wrapperDom',
  '.$event',
  '.toolbar',
];

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const file = resolve(dir, name);
  return statSync(file).isDirectory() ? walk(file) : [file];
});

const failures = [];
for (const [packageDir, forbidden] of Object.entries(rules)) {
  const dir = resolve(root, 'packages', packageDir);
  const manifest = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8'));
  const dependencies = { ...manifest.dependencies, ...manifest.optionalDependencies };
  for (const dependency of Object.keys(dependencies)) {
    if (forbidden.some((item) => dependency === item || dependency.startsWith(item))) {
      failures.push(`${manifest.name} declares forbidden dependency ${dependency}`);
    }
  }
  for (const file of walk(resolve(dir, 'src')).filter((name) => /\.(?:js|ts)$/.test(name))) {
    const source = readFileSync(file, 'utf8');
    for (const item of forbidden) {
      if (source.includes(`from '${item}`) || source.includes(`from "${item}`)) {
        failures.push(`${relative(root, file)} imports forbidden boundary ${item}`);
      }
    }
  }
}

for (const file of walk(resolve(root, 'packages/engine/src')).filter((name) => name.endsWith('.js'))) {
  const source = readFileSync(file, 'utf8');
  for (const token of forbiddenEngineInteractionTokens) {
    if (source.includes(token)) failures.push(`${relative(root, file)} leaks editor interaction token ${token}`);
  }
}

const legacyRoot = resolve(root, 'packages/cherry-markdown/src/core');
for (const file of walk(legacyRoot).filter((name) => name.endsWith('.js'))) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('@deprecated Internal compatibility path.')) {
    failures.push(`${relative(root, file)} contains implementation instead of a legacy forwarding module`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Package dependency and legacy forwarding boundaries are valid.');
}
