import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const readProjectFile = (filePath) => readFileSync(resolve(projectRoot, filePath), 'utf-8');

describe('browser global entry split', () => {
  it('keeps ESM entries free of window.Cherry side effects', () => {
    const esmEntries = ['src/index.js', 'src/index.core.js', 'src/index.stream.js'];

    esmEntries.forEach((entry) => {
      expect(readProjectFile(entry), entry).not.toMatch(/window\.Cherry\s*=/);
    });
  });

  it('keeps window globals in IIFE-only entries', () => {
    const iifeEntries = ['src/index.iife.js', 'src/index.core.iife.js', 'src/index.stream.iife.js'];

    iifeEntries.forEach((entry) => {
      expect(readProjectFile(entry), entry).toMatch(/window\.Cherry\s*=/);
    });
  });
});

describe('browser global Vite outputs', () => {
  it('builds full IIFE and ESM bundles from separate entries', () => {
    const config = readProjectFile('build/vite.build.js');

    expect(config).toMatch(/index\.iife\.js/);
    expect(config).toMatch(/cherry-markdown\.iife\.js/);
    expect(config).toMatch(/format: 'iife'/);
    expect(config).toMatch(/index\.js/);
    expect(config).toMatch(/cherry-markdown\.esm\.js/);
    expect(config).toMatch(/format: 'es'/);
  });

  it('does not retain UMD entry or output configuration', () => {
    expect(readProjectFile('build/vite.build.js')).not.toMatch(/format: 'umd'/);
    expect(readProjectFile('build/vite.build.js')).not.toMatch(/cherry-markdown\.js/);
  });

  it('includes core and stream ESM/IIFE outputs', () => {
    const config = readProjectFile('build/vite.build.js');

    expect(config).toMatch(/cherry-markdown\.core\.iife\.js/);
    expect(config).toMatch(/cherry-markdown\.core\.esm\.js/);
    expect(config).toMatch(/cherry-markdown\.stream\.iife\.js/);
    expect(config).toMatch(/cherry-markdown\.stream\.esm\.js/);
  });
});
