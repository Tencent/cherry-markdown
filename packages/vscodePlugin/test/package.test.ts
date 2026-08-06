import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const packageRoot = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as { main: string };
const requiredFiles = [
  manifest.main,
  'web-resources/dist/index.js',
  'web-resources/dist/index.css',
  'web-resources/scripts/index.css',
  'favicon.ico',
].map((file) => file.replace(/^\.\//, ''));

describe('VS Code extension build artifacts', () => {
  test.each(requiredFiles)('contains %s', (relativePath) => {
    expect(fs.statSync(path.join(packageRoot, relativePath), { throwIfNoEntry: false })?.isFile()).toBe(true);
  });

  test('does not recreate the obsolete global variables file', () => {
    expect(fs.existsSync(path.join(packageRoot, 'web-resources/scripts/global-vars.js'))).toBe(false);
  });
});
