// @vitest-environment node
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from 'vite';
import { afterEach, expect, it } from 'vite-plus/test';
import { createLibraryBuild } from '../../../../build/library.mjs';

const fixtures = [];
afterEach(() => fixtures.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

it('preserves previous files when sequential builds share one output directory', async () => {
  const root = mkdtempSync(join(tmpdir(), 'cherry-library-build-'));
  fixtures.push(root);
  const entry = join(root, 'entry.js');
  const output = join(root, 'dist');
  writeFileSync(join(root, 'package.json'), '{"type":"module"}');
  writeFileSync(entry, 'export const answer = 42;');
  const config = (file, format, overrides = {}) =>
    createLibraryBuild(
      { root, entry, file, format, name: 'Fixture' },
      { logLevel: 'silent', build: { outDir: output, ...overrides } },
    );

  await build(config('fixture.esm.js', 'es', { minify: false, sourcemap: true }));
  const first = readFileSync(join(output, 'fixture.esm.js'));
  const firstMap = readFileSync(join(output, 'fixture.esm.js.map'));
  await build(config('fixture.js', 'umd'));

  expect(readdirSync(output).sort()).toEqual(['fixture.esm.js', 'fixture.esm.js.map', 'fixture.js']);
  expect(readFileSync(join(output, 'fixture.esm.js'))).toEqual(first);
  expect(readFileSync(join(output, 'fixture.esm.js.map'))).toEqual(firstMap);
  const map = JSON.parse(firstMap.toString());
  expect(map.file).toBe('fixture.esm.js');
  expect(map.sourcesContent).toContain('export const answer = 42;');
  // Exercise both formats without pinning bundler whitespace or hashes.
  const esm = await import(pathToFileURL(join(output, 'fixture.esm.js')).href);
  expect(esm.answer).toBe(42);
  const context = {};
  runInNewContext(readFileSync(join(output, 'fixture.js'), 'utf8'), context);
  expect(context.Fixture.answer).toBe(42);
});
