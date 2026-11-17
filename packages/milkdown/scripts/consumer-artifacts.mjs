import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const artifactRoot = resolve(workspaceRoot, 'packages/milkdown/artifacts/consumer');

export function npm(args, options = {}) {
  if (process.platform !== 'win32') return execFileSync('npm', args, options);
  const cli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  if (!existsSync(cli)) throw new Error('Cannot locate npm-cli.js beside the Node.js installation.');
  return execFileSync(process.execPath, [cli, ...args], options);
}

/** A safe top-level peer does not guarantee that nested editor views are safe. */
export function checkProseMirrorViewTree(tree) {
  let found = false;
  const visit = (node, path = []) => {
    for (const [name, dependency] of Object.entries(node?.dependencies ?? {})) {
      const next = [...path, name];
      if (name === 'prosemirror-view') {
        found = true;
        const version = dependency?.version;
        const match = typeof version === 'string' && /^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+.*)?$/.exec(version);
        if (!match) throw new Error(`Missing or invalid prosemirror-view version at ${next.join(' > ')}.`);
        const [major, minor, patch] = match.slice(1, 4).map(Number);
        const safe =
          major > 1 || (major === 1 && (minor > 42 || (minor === 42 && (patch > 3 || (patch === 3 && !match[4])))));
        if (!safe)
          throw new Error(`Vulnerable prosemirror-view ${version} at ${next.join(' > ')}; use 1.42.3 or newer.`);
      }
      visit(dependency, next);
    }
  };
  visit(tree);
  if (!found) throw new Error('No prosemirror-view was found in the consumer dependency tree.');
}

export function revision() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workspaceRoot, encoding: 'utf8' }).trim();
}

// A commit alone cannot distinguish locally modified source from a stale build.
export function sourceChangesDigest() {
  const git = (args) => execFileSync('git', args, { cwd: workspaceRoot, maxBuffer: 64 * 1024 * 1024 });
  const hash = createHash('sha256');
  hash.update(git(['diff', '--binary', 'HEAD', '--']));
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z'])
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .sort();
  for (const file of untracked) {
    const absolute = join(workspaceRoot, file);
    const info = lstatSync(absolute);
    const contents = info.isSymbolicLink() ? Buffer.from(readlinkSync(absolute)) : readFileSync(absolute);
    hash.update(JSON.stringify([file, info.mode, contents.length]));
    hash.update(contents);
  }
  return hash.digest('hex');
}

export function digest(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function verifyInstalledPackage(unpacked, installed) {
  const expected = Object.fromEntries(filesUnder(unpacked, '', false));
  const actual = Object.fromEntries(filesUnder(installed, '', false));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('Installed Milkdown package differs from the verified tarball.');
  }
}

function filesUnder(directory, prefix = '', excludeManifest = true) {
  return readdirSync(directory)
    .sort()
    .flatMap((name) => {
      if (excludeManifest && !prefix && name === 'artifact-manifest.json') return [];
      const relative = posix.join(prefix, name);
      const file = join(directory, name);
      return statSync(file).isDirectory() ? filesUnder(file, relative, excludeManifest) : [[relative, digest(file)]];
    });
}

export function writeArtifactManifest(directory, kind) {
  writeFileSync(
    join(directory, 'artifact-manifest.json'),
    JSON.stringify(
      {
        schema: 2,
        kind,
        revision: revision(),
        sourceChanges: sourceChangesDigest(),
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
    manifest.schema !== 2 ||
    manifest.kind !== expected.kind ||
    manifest.revision !== expected.revision ||
    manifest.sourceChanges !== expected.sourceChanges ||
    manifest.node !== expected.node
  )
    throw new Error('Artifact source revision, working tree, Node.js version or kind does not match this checkout.');
  if (!Object.keys(manifest.files ?? {}).length || JSON.stringify(manifest.files) !== JSON.stringify(files))
    throw new Error('Artifact files or SHA-256 digests do not match the manifest.');
}

export function verifyArtifactManifest(directory, kind) {
  const manifest = JSON.parse(readFileSync(join(directory, 'artifact-manifest.json'), 'utf8'));
  checkArtifactManifest(
    manifest,
    { kind, revision: revision(), sourceChanges: sourceChangesDigest(), node: process.versions.node },
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

/** Cherry must contain the public entry points used by the packed consumer. */
export function checkCherryPackageFiles(manifest, filenames) {
  if (manifest.name !== 'cherry-markdown') throw new Error('Unexpected Cherry package identity.');
  const required = [
    manifest.main,
    manifest.module,
    manifest.style,
    manifest.types,
    './dist/cherry-markdown.engine.core.esm.js',
    './dist/addons/advance/cherry-codeblock-echarts-plugin.esm.js',
    './dist/addons/advance/cherry-table-echarts-plugin.esm.js',
  ];
  const files = new Set(filenames);
  for (const target of required) {
    if (typeof target !== 'string' || !files.has(target.replace(/^\.\//, '')))
      throw new Error(`Missing Cherry published file: ${String(target)}. Build Cherry before preparing consumers.`);
  }
}

export function verifyCherryTarball(tarball) {
  const filenames = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .map((file) => file.replace(/^package\//, ''));
  const manifest = JSON.parse(execFileSync('tar', ['-xOf', tarball, 'package/package.json'], { encoding: 'utf8' }));
  checkCherryPackageFiles(manifest, filenames);
  return manifest;
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
