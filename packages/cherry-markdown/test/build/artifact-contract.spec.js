import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import {
  cherryBuildTargets,
  compareExactFiles,
  fontArtifacts,
  forbiddenArtifactPatterns,
  getAddonContracts,
  styleBuildTargets,
  typeEntryArtifacts,
  validateBundleSource,
  validatePackageMetadata,
} from '../../build/artifact-contract.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readProjectFile = (filePath) => readFileSync(resolve(projectRoot, filePath), 'utf-8');
const packageJson = JSON.parse(readProjectFile('package.json'));
const normalizeExternal = (external) => external.map((item) => (item instanceof RegExp ? item.toString() : item));

describe('Cherry Markdown published artifact contract', () => {
  it('pins the full, core, engine, and stream ESM/UMD matrix', () => {
    expect(
      cherryBuildTargets.map(({ id, entry, file, format, name, global }) => ({ id, entry, file, format, name, global })),
    ).toEqual([
      { id: 'full-esm', entry: 'src/index.js', file: 'cherry-markdown.esm.js', format: 'es', name: 'Cherry', global: undefined },
      { id: 'full-umd', entry: 'src/index.browser.js', file: 'cherry-markdown.js', format: 'umd', name: 'Cherry', global: 'Cherry' },
      { id: 'core-esm', entry: 'src/index.core.js', file: 'cherry-markdown.core.esm.js', format: 'es', name: 'Cherry', global: undefined },
      { id: 'core-umd', entry: 'src/index.core.browser.js', file: 'cherry-markdown.core.js', format: 'umd', name: 'Cherry', global: 'Cherry' },
      { id: 'engine-esm', entry: 'src/index.engine.js', file: 'cherry-markdown.engine.esm.js', format: 'es', name: 'CherryEngine', global: undefined },
      { id: 'engine-umd', entry: 'src/index.engine.browser.js', file: 'cherry-markdown.engine.js', format: 'umd', name: 'CherryEngine', global: 'CherryEngine' },
      { id: 'stream-esm', entry: 'src/index.stream.js', file: 'cherry-markdown.stream.esm.js', format: 'es', name: 'Cherry', global: undefined },
      { id: 'stream-umd', entry: 'src/index.stream.browser.js', file: 'cherry-markdown.stream.js', format: 'umd', name: 'Cherry', global: 'Cherry' },
    ]);
  });

  it('pins external dependencies for every build variant', () => {
    const externals = Object.fromEntries(
      cherryBuildTargets.map(({ id, external }) => [id, normalizeExternal(external)]),
    );

    expect(externals['full-esm']).toEqual(['jsdom']);
    expect(externals['full-umd']).toEqual(['jsdom']);
    expect(externals['core-esm']).toEqual([
      'jsdom',
      'mermaid',
      '@replit/codemirror-vim',
      'codemirror',
      '/^codemirror\\//',
    ]);
    expect(externals['core-umd']).toEqual(externals['core-esm']);
    expect(externals['engine-esm']).toEqual(['jsdom', 'mermaid']);
    expect(externals['engine-umd']).toEqual(externals['engine-esm']);
    expect(externals['stream-esm']).toEqual(['jsdom', 'mermaid', 'codemirror', '/^codemirror\\//']);
    expect(externals['stream-umd']).toEqual(externals['stream-esm']);
  });

  it('pins CSS, fonts, types, and addon triples', () => {
    const modules = readProjectFile('types/modules.d.ts');

    expect(styleBuildTargets).toEqual([
      { input: 'src/sass/index.scss', name: 'cherry-markdown' },
      { input: 'src/sass/markdown_pure.scss', name: 'cherry-markdown.markdown' },
    ]);
    expect(fontArtifacts).toHaveLength(5);
    expect(typeEntryArtifacts).toContain('dist/types/index.d.ts');
    expect(typeEntryArtifacts).toContain('dist/types/index.engine.core.d.ts');
    styleBuildTargets.flatMap(({ name }) => [`${name}.css`, `${name}.min.css`]).forEach((file) => {
      expect(modules).toContain(`declare module 'cherry-markdown/dist/${file}'`);
    });

    const addons = getAddonContracts(projectRoot);
    expect(addons).toHaveLength(7);
    addons.forEach(({ esm, umd, type }) => {
      expect(esm).toMatch(/^dist\/addons\/.+\.esm\.js$/);
      expect(umd).toMatch(/^dist\/addons\/.+\.js$/);
      expect(type).toMatch(/^dist\/types\/addons\/.+\.d\.ts$/);
    });
  });

  it('pins package entrypoints without adding core, stream, or IIFE exports', () => {
    expect(validatePackageMetadata(packageJson)).toEqual([]);
    expect(packageJson.exports['./core']).toBeUndefined();
    expect(packageJson.exports['./stream']).toBeUndefined();
    expect(packageJson.exports['./iife']).toBeUndefined();
  });

  it('rejects missing and unexpected files', () => {
    expect(compareExactFiles(['a.js'], ['a.js', 'b.js'], 'bundles')).toEqual(['bundles: missing b.js']);
    expect(compareExactFiles(['a.js', 'chunk.js'], ['a.js'], 'bundles')).toEqual([
      'bundles: unexpected chunk.js',
    ]);
  });

  it('rejects version leaks and browser globals in ESM bundles', () => {
    const target = cherryBuildTargets.find(({ id }) => id === 'full-esm');
    const errors = validateBundleSource(
      target,
      'const VERSION = `${process.env.BUILD_VERSION}`; window.Cherry = {}; export { VERSION };',
      packageJson.version,
    );

    expect(errors).toContain('cherry-markdown.esm.js: contains process.env.BUILD_VERSION');
    expect(errors).toContain(`cherry-markdown.esm.js: does not contain package version ${packageJson.version}`);
    expect(errors).toContain('cherry-markdown.esm.js: assigns a browser global');
  });

  it('accepts versioned ESM and UMD bundle shapes', () => {
    const esm = cherryBuildTargets.find(({ id }) => id === 'engine-esm');
    const umd = cherryBuildTargets.find(({ id }) => id === 'engine-umd');

    expect(validateBundleSource(esm, `const VERSION = '${packageJson.version}'; export { VERSION };`, packageJson.version)).toEqual([]);
    expect(
      validateBundleSource(
        umd,
        `typeof exports; typeof define; const VERSION = '${packageJson.version}'; window.CherryEngine = {};`,
        packageJson.version,
      ),
    ).toEqual([]);
  });

  it('forbids renamed, IIFE, explicit UMD, and minified JavaScript aliases', () => {
    const forbidden = [
      'dist/cherry-previewer.css',
      'dist/cherry-previewer.min.css',
      'dist/cherry-markdown.iife.js',
      'dist/cherry-markdown.umd.js',
      'dist/cherry-markdown.min.js',
    ];
    forbidden.forEach((file) => {
      expect(forbiddenArtifactPatterns.some((pattern) => pattern.test(file)), file).toBe(true);
    });
  });

  it('runs the real artifact verifier at the end of every production build', () => {
    const scripts = packageJson.scripts;
    const viteBuild = readProjectFile('build/vite.build.js');
    const stylesBuild = readProjectFile('build/styles.build.js');

    expect(scripts['build:all']).toMatch(/vp run build:full && vp run verify:artifacts && vp run check-bundle$/);
    expect(scripts['verify:artifacts']).toBe('node build/verify-artifacts.js');
    expect(scripts['check-bundle']).toBe('es-check es5 dist/cherry-markdown.js');
    expect(viteBuild).toMatch(/cherryBuildTargets/);
    expect(viteBuild).toMatch(/'process\.env\.BUILD_VERSION'/);
    expect(stylesBuild).toMatch(/styleBuildTargets/);
  });
});
