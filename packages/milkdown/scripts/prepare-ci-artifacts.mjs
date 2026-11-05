import { cpSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  artifactRoot,
  npm,
  workspaceRoot,
  writeArtifactManifest,
} from './consumer-artifacts.mjs';
import { prepareConsumerPackages } from './prepare-consumer-packages.mjs';

const { values } = parseArgs({ options: { release: { type: 'boolean' }, demo: { type: 'boolean' } } });
const fixture = mkdtempSync(join(tmpdir(), 'milkdown-package-preparation-'));
const env = { ...process.env };
const current = {
  milkdown: resolve(workspaceRoot, 'packages/milkdown'),
  'cherry-markdown': resolve(workspaceRoot, 'packages/cherry-markdown'),
};
const variants = values.release
  ? { release: current }
  : { planned: prepareConsumerPackages(fixture, env), release: current };
for (const [variant, packages] of Object.entries(variants)) {
  const output = join(artifactRoot, variant);
  mkdirSync(output, { recursive: true });
  for (const [key, name] of [
    ['milkdown', 'milkdown.tgz'],
    ['cherry-markdown', 'cherry.tgz'],
  ]) {
    const packed = JSON.parse(
      npm(['pack', packages[key], '--json', '--pack-destination', fixture], { cwd: fixture, env, encoding: 'utf8' }),
    )[0];
    const tarball = join(output, name);
    cpSync(join(fixture, packed.filename), tarball);
  }
  writeArtifactManifest(output, `consumer-${variant}`);
}
if (values.demo) writeArtifactManifest(resolve(workspaceRoot, 'packages/milkdown/preview'), 'demo');
console.log(`Prepared consumer tarballs: ${artifactRoot}`);
