import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  checkArtifactManifest,
  checkCherryPackageFiles,
  checkPackageFiles,
  checkProseMirrorViewTree,
  npm,
  sourceChangesDigest,
  verifyInstalledPackage,
  workspaceRoot,
} from './consumer-artifacts.mjs';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const cherryManifest = JSON.parse(readFileSync(new URL('../../cherry-markdown/package.json', import.meta.url), 'utf8'));
const files = [
  'package.json',
  'LICENSE',
  'README.md',
  'README.CN.md',
  'styles.css',
  'dist/index.js',
  'dist/index.d.ts',
  'dist/renderers/echarts.js',
  'dist/renderers/echarts.d.ts',
  'dist/generated/cherry-helpers.js',
  'dist/generated/cherry-helpers.d.ts',
  'dist/generated/cherry-prism.js',
  'dist/generated/cherry-prism.d.ts',
];

test('rejects a Cherry package without its public entry points and renderer addons', () => {
  const cherryFiles = [
    cherryManifest.main,
    cherryManifest.module,
    cherryManifest.style,
    cherryManifest.types,
    'dist/cherry-markdown.engine.core.esm.js',
    'dist/addons/advance/cherry-codeblock-echarts-plugin.esm.js',
    'dist/addons/advance/cherry-table-echarts-plugin.esm.js',
  ].map((name) => name.replace(/^\.\//, ''));
  checkCherryPackageFiles(cherryManifest, cherryFiles);
  for (const missing of cherryFiles)
    assert.throws(
      () =>
        checkCherryPackageFiles(
          cherryManifest,
          cherryFiles.filter((file) => file !== missing),
        ),
      /Missing Cherry/,
    );
});

test('rejects vulnerable nested ProseMirror views even with a safe top-level peer', () => {
  const tree = {
    dependencies: {
      'prosemirror-view': { version: '1.42.9' },
      '@milkdown/kit': {
        dependencies: { '@milkdown/prose': { dependencies: { 'prosemirror-view': { version: '1.42.2' } } } },
      },
    },
  };
  assert.throws(() => checkProseMirrorViewTree(tree), /1\.42\.2.*@milkdown\/prose/);
  tree.dependencies['@milkdown/kit'].dependencies['@milkdown/prose'].dependencies['prosemirror-view'].version =
    '1.42.3';
  assert.doesNotThrow(() => checkProseMirrorViewTree(tree));
  tree.dependencies['@milkdown/kit'].dependencies['@milkdown/prose'].dependencies['prosemirror-view'].version =
    '1.42.3-rc.1';
  assert.throws(() => checkProseMirrorViewTree(tree), /1\.42\.3-rc\.1/);
  assert.throws(() => checkProseMirrorViewTree({ dependencies: {} }), /No prosemirror-view/);
});

test('checks the actual npm dependency tree for a nested vulnerable view', () => {
  const root = mkdtempSync(join(tmpdir(), 'milkdown-nested-view-'));
  const writePackage = (directory, value) => {
    mkdirSync(join(root, directory), { recursive: true });
    writeFileSync(join(root, directory, 'package.json'), JSON.stringify(value));
  };
  try {
    writePackage('', {
      name: 'consumer-fixture',
      version: '1.0.0',
      dependencies: { '@milkdown/kit': '1.0.0', 'prosemirror-view': '1.42.9' },
    });
    writePackage('node_modules/@milkdown/kit', {
      name: '@milkdown/kit',
      version: '1.0.0',
      dependencies: { '@milkdown/prose': '1.0.0' },
    });
    writePackage('node_modules/@milkdown/prose', {
      name: '@milkdown/prose',
      version: '1.0.0',
      dependencies: { 'prosemirror-view': '^1.41.3' },
    });
    writePackage('node_modules/prosemirror-view', { name: 'prosemirror-view', version: '1.42.9' });
    const nested = 'node_modules/@milkdown/prose/node_modules/prosemirror-view';
    writePackage(nested, { name: 'prosemirror-view', version: '1.42.2' });
    const tree = () =>
      JSON.parse(
        npm(['ls', 'prosemirror-view', '--all', '--json'], {
          cwd: root,
          encoding: 'utf8',
          env: { ...process.env, npm_config_cache: join(root, '.npm-cache') },
        }),
      );
    assert.throws(() => checkProseMirrorViewTree(tree()), /1\.42\.2.*@milkdown\/prose/);
    writePackage(nested, { name: 'prosemirror-view', version: '1.42.3' });
    assert.doesNotThrow(() => checkProseMirrorViewTree(tree()));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('requires every public export, stylesheet and generated runtime in the tarball', () => {
  checkPackageFiles(manifest, files);
  for (const missing of ['styles.css', 'dist/renderers/echarts.d.ts', 'dist/generated/cherry-prism.js', 'LICENSE'])
    assert.throws(
      () =>
        checkPackageFiles(
          manifest,
          files.filter((file) => file !== missing),
        ),
      /Missing published file/,
    );
});
test('does not allow a newly exported entry to bypass the published file contract', () => {
  assert.throws(
    () => checkPackageFiles({ ...manifest, exports: { ...manifest.exports, './new': './dist/missing.js' } }, files),
    /Missing published file/,
  );
});
test('rejects accidentally packed source, dependencies and path traversal', () => {
  for (const file of ['src/index.ts', 'node_modules/dependency.js', '../outside.js'])
    assert.throws(() => checkPackageFiles(manifest, [...files, file]), /Unexpected published file/);
});

const expected = { kind: 'consumer-release', revision: 'source-sha', sourceChanges: 'source-digest', node: '24.15.0' };
const hashes = { 'cherry.tgz': 'cherry-digest', 'milkdown.tgz': 'milkdown-digest' };
const artifact = { schema: 2, ...expected, files: hashes };
test('accepts only artifacts from the expected commit, runtime and purpose', () => {
  checkArtifactManifest(artifact, expected, hashes);
  for (const field of ['kind', 'revision', 'sourceChanges', 'node'])
    assert.throws(() => checkArtifactManifest({ ...artifact, [field]: 'other' }, expected, hashes), /does not match/);
});

test('detects source changes without a new commit', () => {
  const fixture = join(workspaceRoot, `.milkdown-source-fingerprint-${process.pid}`);
  const before = sourceChangesDigest();
  try {
    writeFileSync(fixture, 'first');
    const added = sourceChangesDigest();
    assert.notEqual(added, before);
    writeFileSync(fixture, 'second');
    assert.notEqual(sourceChangesDigest(), added);
  } finally {
    rmSync(fixture, { force: true });
  }
  assert.equal(sourceChangesDigest(), before);
});
test('rejects changed, missing, extra and empty artifact files', () => {
  for (const files of [
    { ...hashes, 'milkdown.tgz': 'changed' },
    { 'cherry.tgz': 'cherry-digest' },
    { ...hashes, extra: 'digest' },
    {},
  ])
    assert.throws(() => checkArtifactManifest(artifact, expected, files), /do not match/);
});

test('rejects a stale, incomplete or altered installed package', () => {
  const root = mkdtempSync(join(tmpdir(), 'milkdown-installed-package-'));
  try {
    const unpacked = join(root, 'unpacked');
    const installed = join(root, 'installed');
    for (const directory of [unpacked, installed]) {
      mkdirSync(join(directory, 'dist'), { recursive: true });
      writeFileSync(join(directory, 'dist/index.js'), 'current');
    }
    verifyInstalledPackage(unpacked, installed);
    writeFileSync(join(installed, 'dist/index.js'), 'stale');
    assert.throws(() => verifyInstalledPackage(unpacked, installed), /differs from the verified tarball/);
    rmSync(join(installed, 'dist/index.js'));
    assert.throws(() => verifyInstalledPackage(unpacked, installed), /differs from the verified tarball/);
    writeFileSync(join(installed, 'dist/index.js'), 'current');
    writeFileSync(join(installed, 'dist/extra.js'), 'unexpected');
    assert.throws(() => verifyInstalledPackage(unpacked, installed), /differs from the verified tarball/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
