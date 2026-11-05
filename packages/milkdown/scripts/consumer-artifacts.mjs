import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const artifactRoot = resolve(workspaceRoot, 'packages/milkdown/artifacts/consumer');

export function allowUnpublishedMinimum({ requirePublished, registryCode, minimumVersion, localVersion }) {
  if (registryCode !== 'E404') return false;
  if (requirePublished)
    throw new Error(`Cherry ${minimumVersion} must be available in the registry before publishing Milkdown.`);
  if (localVersion !== minimumVersion)
    throw new Error(`Unpublished minimum ${minimumVersion} must match planned Cherry ${localVersion}.`);
  return true;
}

export function npm(args, options = {}) {
  if (process.platform !== 'win32') return execFileSync('npm', args, options);
  const cli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  if (!existsSync(cli)) throw new Error('Cannot locate npm-cli.js beside the Node.js installation.');
  return execFileSync(process.execPath, [cli, ...args], options);
}

export function revision() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workspaceRoot, encoding: 'utf8' }).trim();
}

export function digest(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function filesUnder(directory, prefix = '') {
  return readdirSync(directory)
    .sort()
    .flatMap((name) => {
      if (!prefix && name === 'artifact-manifest.json') return [];
      const relative = posix.join(prefix, name);
      const file = join(directory, name);
      return statSync(file).isDirectory() ? filesUnder(file, relative) : [[relative, digest(file)]];
    });
}

export function writeArtifactManifest(directory, kind) {
  writeFileSync(
    join(directory, 'artifact-manifest.json'),
    JSON.stringify(
      {
        schema: 1,
        kind,
        revision: revision(),
        node: process.versions.node,
        files: Object.fromEntries(filesUnder(directory)),
      },
      null,
      2,
    ) + '\n',
  );
}

export function checkArtifactManifest(manifest, expected, files) {
  if (
    manifest.schema !== 1 ||
    manifest.kind !== expected.kind ||
    manifest.revision !== expected.revision ||
    manifest.node !== expected.node
  )
    throw new Error('Artifact source revision, Node.js version or kind does not match this checkout.');
  if (!Object.keys(manifest.files ?? {}).length || JSON.stringify(manifest.files) !== JSON.stringify(files))
    throw new Error('Artifact files or SHA-256 digests do not match the manifest.');
}

export function verifyArtifactManifest(directory, kind) {
  const manifest = JSON.parse(readFileSync(join(directory, 'artifact-manifest.json'), 'utf8'));
  checkArtifactManifest(
    manifest,
    { kind, revision: revision(), node: process.versions.node },
    Object.fromEntries(filesUnder(directory)),
  );
  console.log(`Verified ${kind} artifacts for ${manifest.revision} on Node.js ${manifest.node}`);
}

export function checkPackageFiles(manifest, filenames) {
  if (manifest.name !== '@cherry-markdown/milkdown' || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(manifest.version))
    throw new Error('Unexpected Milkdown package identity or version.');
  const files = new Set(filenames);
  const targets = (value) => (typeof value === 'string' ? [value] : Object.values(value ?? {}).flatMap(targets));
  const required = [
    'package.json',
    'LICENSE',
    'README.md',
    'README.CN.md',
    'styles.css',
    'dist/generated/cherry-helpers.js',
    'dist/generated/cherry-helpers.d.ts',
    'dist/generated/cherry-prism.js',
    'dist/generated/cherry-prism.d.ts',
    ...[manifest.main, manifest.module, manifest.types, manifest.style, ...targets(manifest.exports)]
      .filter(Boolean)
      .map((target) => target.replace(/^\.\//, '')),
  ];
  for (const file of required) if (!files.has(file)) throw new Error(`Missing published file: ${file}`);
  for (const file of files) {
    if (file.startsWith('/') || file.split('/').includes('..') || /^(src|test|e2e|scripts|node_modules)\//.test(file))
      throw new Error(`Unexpected published file: ${file}`);
  }
}

export function verifyMilkdownTarball(tarball, directory) {
  const filenames = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .map((file) => file.replace(/^package\//, ''))
    .filter((file) => !file.endsWith('/'));
  for (const file of filenames)
    if (file.startsWith('/') || file.split('/').includes('..')) throw new Error(`Invalid archive path: ${file}`);
  execFileSync('tar', ['-xzf', tarball, '--strip-components=1', '-C', directory]);
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  checkPackageFiles(manifest, filenames);
  const files = new Set(filenames);
  for (const file of filenames.filter((file) => file.endsWith('.js'))) {
    const source = readFileSync(join(directory, file), 'utf8');
    for (const [, target] of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(|\bimport\s*)['"](\.[^'"]+)['"]/g)) {
      const destination = posix.normalize(posix.join(posix.dirname(file), target));
      if (!files.has(destination)) throw new Error(`Unpacked runtime import is missing: ${file} -> ${target}`);
    }
  }
  console.log(`Verified published file contract: ${manifest.name}@${manifest.version}`);
  return manifest;
}
