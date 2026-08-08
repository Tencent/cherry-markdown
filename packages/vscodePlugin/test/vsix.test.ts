import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const nodeRequire = createRequire(__filename);
const { readZip } = nodeRequire('@vscode/vsce/out/zip.js') as {
  readZip: (archivePath: string, filter: (name: string) => boolean) => Promise<Map<string, Buffer>>;
};

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

  test('contains runtime files and excludes development files', async () => {
    expect(archive).toBeDefined();
    if (!archive) return;

    const files = [...(await readZip(path.join(packageRoot, archive.file), () => true)).keys()];

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

  test('contains the expected extension identity', async () => {
    expect(archive).toBeDefined();
    if (!archive) return;

    const files = await readZip(path.join(packageRoot, archive.file), (name) => name === 'extension/package.json');
    const manifest = files.get('extension/package.json');
    expect(manifest).toBeDefined();
    expect((JSON.parse(manifest?.toString('utf8') ?? '{}') as { name: string }).name).toBe(expectedExtensionName);
  });
});
