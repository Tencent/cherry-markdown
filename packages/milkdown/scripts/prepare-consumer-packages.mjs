import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

// Apply the real Changesets version command in a disposable workspace. Only
// changelog network access and commits are disabled; dependency/version rules
// are the same as the release workflow. Never version the developer's checkout.
export function prepareConsumerPackages(fixture, env) {
  const stagedRoot = join(fixture, 'release-workspace');
  mkdirSync(stagedRoot);
  const manifests = execFileSync('git', ['ls-files', '*package.json'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  })
    .trim()
    .split('\n');
  for (const manifest of manifests) {
    const target = join(stagedRoot, manifest);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(workspaceRoot, manifest), target);
  }
  cpSync(join(workspaceRoot, '.changeset'), join(stagedRoot, '.changeset'), { recursive: true });
  const configPath = join(stagedRoot, '.changeset/config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  writeFileSync(configPath, JSON.stringify({ ...config, changelog: false, commit: false }));
  const cli = resolve(dirname(require.resolve('@changesets/cli')), '../bin.js');
  execFileSync(process.execPath, [cli, 'version'], { cwd: stagedRoot, env, stdio: 'inherit' });

  const packages = {};
  for (const directory of ['cherry-markdown', 'milkdown']) {
    const source = join(workspaceRoot, 'packages', directory);
    const staged = join(stagedRoot, 'packages', directory);
    const versionedManifest = readFileSync(join(staged, 'package.json'), 'utf8');
    const packed = JSON.parse(
      execFileSync('npm', ['pack', source, '--json', '--pack-destination', fixture], {
        cwd: fixture,
        env,
        encoding: 'utf8',
      }),
    );
    execFileSync('tar', ['-xzf', join(fixture, packed[0].filename), '--strip-components=1', '-C', staged]);
    writeFileSync(join(staged, 'package.json'), versionedManifest);
    packages[directory] = staged;
    console.log(
      `Prepared release package: ${JSON.parse(versionedManifest).name}@${JSON.parse(versionedManifest).version}`,
    );
  }
  return packages;
}
