import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const packageRoot = process.cwd();
const sourceManifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as { name: string };
const expectedExtensionName = process.env.VSCODE_EXTENSION_NAME ?? sourceManifest.name;
const archives = fs
  .readdirSync(packageRoot)
  .filter((file) => file.endsWith('.vsix'))
  .map((file) => ({ file, modified: fs.statSync(path.join(packageRoot, file)).mtimeMs }))
  .sort((left, right) => right.modified - left.modified);
const archive = archives[0];

describe('VSIX archive', () => {
  test('exists', () => {
    expect(archive?.file).toBeTruthy();
  });

  test('contains runtime files and excludes development files', () => {
    expect(archive).toBeDefined();
    if (!archive) return;

    const listing = spawnSync('unzip', ['-Z1', path.join(packageRoot, archive.file)], { encoding: 'utf8' });
    expect(listing.status, listing.stderr).toBe(0);
    const files = listing.stdout.trim().split('\n');

    expect(files).toEqual(
      expect.arrayContaining([
        'extension/package.json',
        'extension/dist/extension.js',
        'extension/web-resources/dist/index.js',
        'extension/web-resources/dist/index.css',
        'extension/web-resources/dist/mathjax.js',
      ]),
    );

    const developmentFile = files.find((file) =>
      [
        /^extension\/src\//,
        /^extension\/test\//,
        /^extension\/.*\.map$/,
        /^extension\/tsconfig\.json$/,
        /^extension\/.*\.config\.mts$/,
        /^extension\/.vscode-test\.mjs$/,
        /^extension\/web-resources\/scripts\/index\.ts$/,
        /global-vars\.js$/,
      ].some((pattern) => pattern.test(file)),
    );
    expect(developmentFile).toBeUndefined();
  });

  test('contains the expected extension identity', () => {
    expect(archive).toBeDefined();
    if (!archive) return;

    const manifest = spawnSync('unzip', ['-p', path.join(packageRoot, archive.file), 'extension/package.json'], {
      encoding: 'utf8',
    });
    expect(manifest.status, manifest.stderr).toBe(0);
    expect((JSON.parse(manifest.stdout) as { name: string }).name).toBe(expectedExtensionName);
  });
});
