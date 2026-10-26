import assert from 'node:assert/strict';
import { globSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { version as viteVersion } from 'vite-plus';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const require = createRequire(resolve(root, 'package.json'));
const vp = require('vite-plus/package.json');
const vitestVersion = vp.dependencies.vitest;
const viteAlias = `npm:@voidzero-dev/vite-plus-core@${vp.version}`;
assert.equal(manifest.devDependencies['vite-plus'], vp.version, 'Installed Vite+ must match the project pin');
assert.equal(manifest.resolutions.vite, viteAlias, 'Vite must resolve to the matching Vite+ core');
assert.equal(manifest.resolutions.vitest, vitestVersion, 'Vitest must match the bundled runner');
assert.equal(require('@vitest/coverage-v8/package.json').version, vitestVersion, 'Coverage must match Vitest');
const runner = realpathSync(require.resolve('vitest'));
const vpRequire = createRequire(require.resolve('vite-plus/package.json'));
assert.equal(realpathSync(vpRequire.resolve('vitest')), runner, 'Vite+ and project must share one test runner');

const manifests = [
  'package.json',
  ...globSync(
    manifest.workspaces.map((path) => `${path}/package.json`),
    { cwd: root },
  ),
];
for (const path of manifests) {
  const file = resolve(root, path);
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  const localRequire = createRequire(file);
  for (const field of ['dependencies', 'devDependencies']) {
    const dependencies = pkg[field] || {};
    if (dependencies['vite-plus']) assert.equal(dependencies['vite-plus'], vp.version, `${path}: Vite+ pin`);
    if (dependencies.vite) assert.equal(dependencies.vite, viteAlias, `${path}: Vite alias`);
    if (dependencies.vitest) assert.equal(dependencies.vitest, vitestVersion, `${path}: Vitest pin`);
  }
  const vite = localRequire('vite/package.json');
  assert.equal(vite.name, '@voidzero-dev/vite-plus-core', `${path}: installed Vite implementation`);
  assert.equal(vite.version, vp.version, `${path}: installed Vite+ core`);
  assert.equal(realpathSync(localRequire.resolve('vitest')), runner, `${path}: shared test runner`);
}
console.log(
  `Verified ${manifests.length} workspace manifests: Vite+ ${vp.version}, Vite ${viteVersion}, Vitest/coverage ${vitestVersion}.`,
);
