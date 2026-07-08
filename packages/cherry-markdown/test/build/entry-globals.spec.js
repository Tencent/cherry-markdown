import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const readProjectFile = (filePath) => readFileSync(resolve(projectRoot, filePath), 'utf-8');

describe('browser global entry split', () => {
  it('keeps ESM entries free of window.Cherry side effects', () => {
    const esmEntries = ['src/index.js', 'src/index.core.js', 'src/index.stream.js'];

    esmEntries.forEach((entry) => {
      expect(readProjectFile(entry), entry).not.toMatch(/window\.Cherry\s*=/);
    });
  });

  it('keeps window.Cherry assignment in UMD-only entries', () => {
    const umdEntries = ['src/index.umd.js', 'src/index.core.umd.js', 'src/index.stream.umd.js'];

    umdEntries.forEach((entry) => {
      expect(readProjectFile(entry), entry).toMatch(/window\.Cherry\s*=/);
    });
  });
});

describe('browser global rollup outputs', () => {
  it('builds full UMD and ESM bundles from separate entries without changing output paths', () => {
    const config = readProjectFile('build/build.js');

    expect(config).toMatch(/input:\s*'src\/index\.umd\.js'/);
    expect(config).toMatch(/file:\s*'dist\/cherry-markdown\.js'/);
    expect(config).toMatch(/format:\s*'umd'/);
    expect(config).toMatch(/name:\s*'Cherry'/);
    expect(config).toMatch(/input:\s*'src\/index\.js'/);
    expect(config).toMatch(/file:\s*'dist\/cherry-markdown\.esm\.js'/);
    expect(config).toMatch(/format:\s*'esm'/);
    expect(config).toMatch(/export default \[umdOptions, esmOptions\]/);
  });

  it('builds core CDN bundle from the UMD-only entry without changing output path', () => {
    const config = readProjectFile('build/rollup.core.config.js');

    expect(config).toMatch(/input:\s*'src\/index\.core\.umd\.js'/);
    expect(config).toMatch(/file:\s*'dist\/cherry-markdown\.core\.js'/);
    expect(config).toMatch(/format:\s*'umd'/);
    expect(config).toMatch(/name:\s*'Cherry'/);
  });

  it('builds stream UMD and ESM bundles from separate entries without changing output paths', () => {
    const config = readProjectFile('build/rollup.stream.config.js');

    expect(config).toMatch(/input:\s*'src\/index\.stream\.umd\.js'/);
    expect(config).toMatch(/file:\s*'dist\/cherry-markdown\.stream\.js'/);
    expect(config).toMatch(/format:\s*'umd'/);
    expect(config).toMatch(/name:\s*'Cherry'/);
    expect(config).toMatch(/input:\s*'src\/index\.stream\.js'/);
    expect(config).toMatch(/file:\s*'dist\/cherry-markdown\.stream\.esm\.js'/);
    expect(config).toMatch(/format:\s*'esm'/);
    expect(config).toMatch(/export default \[umdOptions, esmOptions\]/);
  });
});
