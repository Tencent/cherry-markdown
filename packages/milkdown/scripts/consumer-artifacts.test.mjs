import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkArtifactManifest, checkPackageFiles } from './consumer-artifacts.mjs';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
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

const expected = { kind: 'consumer-release', revision: 'source-sha', node: '24.15.0' };
const hashes = { 'cherry.tgz': 'cherry-digest', 'milkdown.tgz': 'milkdown-digest' };
const artifact = { schema: 1, ...expected, files: hashes };
test('accepts only artifacts from the expected commit, runtime and purpose', () => {
  checkArtifactManifest(artifact, expected, hashes);
  for (const field of ['kind', 'revision', 'node'])
    assert.throws(() => checkArtifactManifest({ ...artifact, [field]: 'other' }, expected, hashes), /does not match/);
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
