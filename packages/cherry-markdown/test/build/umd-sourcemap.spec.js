// @vitest-environment node
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { build } from 'vite';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { legacyUmdPlugin } from '../../build/legacy-umd.plugin.js';

const fixtures = [];
describe('published UMD source map positions', () => {
  afterEach(() => fixtures.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

  it.each([false, true])('maps the final transformed file to its original source (compact: %s)', async (compact) => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'cherry-umd-map-')));
    fixtures.push(root);
    const entry = join(root, 'entry.js');
    const fileName = compact ? 'nested/example.js' : 'example.js';
    writeFileSync(entry, 'export function reportValue() {\n  return "UNIQUE_MAP_MARKER";\n}\n');
    await build({
      configFile: false,
      root,
      logLevel: 'silent',
      plugins: [legacyUmdPlugin({ compact, sourceMaps: true })],
      build: {
        minify: false,
        sourcemap: true,
        lib: { entry, formats: ['umd'], name: 'Example', fileName: () => fileName },
      },
    });
    const output = join(root, 'dist', fileName);
    const code = readFileSync(output, 'utf8');
    const mapUrl = code.match(/\/\/# sourceMappingURL=(.+)$/)[1];
    const mapFile = resolve(dirname(output), mapUrl);
    const map = JSON.parse(readFileSync(mapFile, 'utf8'));
    const prefix = code.slice(0, code.indexOf('UNIQUE_MAP_MARKER'));
    const position = originalPositionFor(new TraceMap(map), {
      line: prefix.split('\n').length,
      column: prefix.length - prefix.lastIndexOf('\n') - 1,
    });
    expect(resolve(dirname(mapFile), position.source)).toBe(entry);
    expect(position.line).toBe(2);
    expect(map.sourcesContent).toContain(readFileSync(entry, 'utf8'));
    expect(map.file).toBe('example.js');
  });
});
