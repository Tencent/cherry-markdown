// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'glob';
import { build } from 'vite';
import { beforeAll, describe, expect, it, vi } from 'vite-plus/test';

// Run the real entrypoints and shared factory; stop only at Vite's build
// boundary, so these assertions cover the options actually passed to Vite.
vi.mock('vite', async (importOriginal) => ({
  ...(await importOriginal()),
  build: vi.fn(async () => ({ output: [] })),
}));
// The addon entrypoint creates output directories even when build is mocked.
vi.mock('node:fs', async (importOriginal) => ({ ...(await importOriginal()), mkdirSync: vi.fn() }));

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(projectRoot, '../..');
const src = resolve(projectRoot, 'src');
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf-8'));
let mainBuilds;
let addonBuilds;
let miniBuild;

beforeAll(async () => {
  vi.stubEnv('NODE_ENV', 'production');
  try {
    build.mockClear();
    await import('../../build/vite.build.js');
    mainBuilds = build.mock.calls.map(([config]) => config);
    build.mockClear();
    await import('../../build/addons.build.js');
    addonBuilds = build.mock.calls.map(([config]) => config);
    build.mockClear();
    await import('../../../miniProgram/build/vite.build.js');
    expect(build).toHaveBeenCalledTimes(1);
    [[miniBuild]] = build.mock.calls;
  } finally {
    vi.unstubAllEnvs();
  }
});

const bundleMatrix = [
  ['index.js', 'cherry-markdown.esm.js', 'es'],
  ['index.umd.js', 'cherry-markdown.js', 'umd', 'Cherry'],
  ['index.core.umd.js', 'cherry-markdown.core.js', 'umd', 'Cherry'],
  ['index.core.js', 'cherry-markdown.core.esm.js', 'es'],
  ['index.engine.js', 'cherry-markdown.engine.esm.js', 'es'],
  ['index.engine.js', 'cherry-markdown.engine.js', 'umd', 'CherryEngine'],
  ['index.engine.core.js', 'cherry-markdown.engine.core.esm.js', 'es'],
  ['index.engine.core.js', 'cherry-markdown.engine.core.js', 'umd', 'CherryEngine'],
  ['index.stream.js', 'cherry-markdown.stream.esm.js', 'es'],
  ['index.stream.umd.js', 'cherry-markdown.stream.js', 'umd', 'Cherry'],
];
const filename = (config) => config.build.lib.fileName(config.build.lib.formats[0]);
function expectSingleFileBuild(config) {
  expect(config.configFile).toBe(false);
  expect(config.build.emptyOutDir).toBe(false);
  expect(config.build.target).toBe('es2015');
  expect(config.build.rolldownOptions.output.codeSplitting).toBe(false);
  expect(config.build.rolldownOptions.output).not.toHaveProperty('manualChunks');
}

describe('Cherry Markdown published artifact configuration', () => {
  it('preserves the complete entry, filename, format and global-name matrix', () => {
    expect(mainBuilds).toHaveLength(bundleMatrix.length);
    expect(mainBuilds.map(filename).sort()).toEqual(bundleMatrix.map(([, file]) => file).sort());
    for (const [entry, file, format, name] of bundleMatrix) {
      const config = mainBuilds.find((candidate) => filename(candidate) === file);
      expect(config.root).toBe(projectRoot);
      expect(config.build.lib.entry).toBe(resolve(src, entry));
      expect(config.build.lib.formats).toEqual([format]);
      expect(config.build.lib.name).toBe(name);
      expectSingleFileBuild(config);
      expect(config.build.rolldownOptions.treeshake).toBe(false);
      expect(config.build.rolldownOptions.output.exports).toBe('named');
      expect(config.build.rolldownOptions.output.generatedCode).toEqual({ preset: 'es5' });
    }
  });

  it('preserves compression, source maps and compatibility plugins after merging', () => {
    for (const config of mainBuilds) {
      const file = filename(config);
      const fullUmd = file === 'cherry-markdown.js';
      expect(config.build.minify, file).toBe(fullUmd ? false : 'terser');
      expect(config.build.sourcemap, file).toBe(fullUmd);
      expect(config.build.terserOptions).toEqual({
        compress: {
          pure_funcs: ['console.log', 'console.info'],
          passes: 3,
          toplevel: true,
          pure_getters: true,
          unsafe_comps: true,
          unsafe_math: true,
        },
        mangle: { toplevel: true },
        format: { comments: false },
      });
      expect(
        config.plugins.map((plugin) => plugin.name),
        file,
      ).toEqual(
        config.build.lib.formats[0] === 'umd'
          ? ['cherry-prism-languages', 'cherry-legacy-umd']
          : ['cherry-prism-languages'],
      );
    }
  });

  it('keeps each bundle external dependency boundary and UMD globals', () => {
    const externalMatrix = {
      'cherry-markdown.esm.js': ['jsdom'],
      'cherry-markdown.js': ['jsdom'],
      'cherry-markdown.core.js': ['jsdom', 'mermaid', '@replit/codemirror-vim', 'codemirror', /^codemirror\//],
      'cherry-markdown.core.esm.js': ['jsdom', 'mermaid', '@replit/codemirror-vim', 'codemirror', /^codemirror\//],
      'cherry-markdown.engine.esm.js': ['jsdom', 'mermaid'],
      'cherry-markdown.engine.js': ['jsdom', 'mermaid'],
      'cherry-markdown.engine.core.esm.js': ['jsdom', 'mermaid'],
      'cherry-markdown.engine.core.js': ['jsdom', 'mermaid'],
      'cherry-markdown.stream.esm.js': ['jsdom', 'mermaid', 'codemirror', /^codemirror\//],
      'cherry-markdown.stream.js': ['jsdom', 'mermaid', 'codemirror', /^codemirror\//],
    };
    for (const config of mainBuilds) {
      const file = filename(config);
      expect(config.build.rolldownOptions.external, file).toEqual(externalMatrix[file]);
      expect(config.build.rolldownOptions.output.globals, file).toEqual(
        config.build.lib.formats[0] === 'umd' && externalMatrix[file].includes('mermaid') ? { mermaid: 'mermaid' } : {},
      );
    }
  });

  it('injects the production package version and preserves source aliases', () => {
    for (const config of mainBuilds) {
      expect(config.define).toEqual({
        BUILD_ENV: JSON.stringify('production'),
        'process.env.BUILD_VERSION': JSON.stringify(packageJson.version),
        'process.env.NODE_ENV': JSON.stringify('production'),
      });
      expect(config.resolve.alias).toEqual({ '@': src, '@cherry': src });
    }
  });

  it('builds every addon as ESM and UMD with its own output directory and global name', () => {
    const entries = glob.sync('src/addons/**/*-plugin.js', { cwd: projectRoot });
    expect(entries).toHaveLength(7);
    expect(addonBuilds).toHaveLength(entries.length * 2);
    for (const entry of entries) {
      const relative = entry.replace(/^src\/addons\//, '');
      const baseName = relative.split('/').pop().replace(/\.js$/, '');
      const globalName = baseName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      const configs = addonBuilds.filter((config) => config.build.lib.entry === resolve(projectRoot, entry));
      expect(configs).toHaveLength(2);
      expect(configs.map((config) => config.build.lib.formats[0]).sort()).toEqual(['es', 'umd']);
      for (const config of configs) {
        const format = config.build.lib.formats[0];
        const file = `${baseName}${format === 'es' ? '.esm.js' : '.js'}`;
        expectSingleFileBuild(config);
        expect(config.root).toBe(projectRoot);
        expect(filename(config)).toBe(file);
        expect(config.build.minify).toBe('oxc');
        expect(config.build.outDir).toBe(resolve(projectRoot, 'dist/addons', dirname(relative)));
        expect(config.build.lib.name).toBe(globalName);
        expect(config.build.rolldownOptions.output).toMatchObject({ format, name: globalName, entryFileNames: file });
        expect(config.plugins.map((plugin) => plugin.name)).toEqual(format === 'umd' ? ['cherry-legacy-umd'] : []);
        expect(config.resolve.alias).toEqual({ '@': src, '@cherry': src });
        expect(config.define).toEqual({ BUILD_ENV: JSON.stringify('production') });
      }
    }
  });

  it('preserves MiniProgram Sanitizer replacement, externals and standalone ESM output', () => {
    const root = resolve(repoRoot, 'packages/miniProgram');
    expectSingleFileBuild(miniBuild);
    expect(miniBuild.root).toBe(root);
    expect(miniBuild.build.lib.entry).toBe(resolve(root, 'src/index.js'));
    expect(miniBuild.build.lib.formats).toEqual(['es']);
    expect(filename(miniBuild)).toBe('miniProgram.esm.js');
    expect(miniBuild.build.minify).toBe('oxc');
    expect(miniBuild.build.rolldownOptions.external).toEqual(['mermaid', 'codemirror', /^codemirror\//]);
    expect(miniBuild.build.rolldownOptions.output).toMatchObject({
      format: 'es',
      entryFileNames: 'miniProgram.esm.js',
      exports: 'named',
    });
    expect(miniBuild.resolve.alias).toEqual({
      '@/Sanitizer': resolve(root, 'src/shared/Sanitizer.miniProgram.js'),
      '@': src,
      '@cherry': src,
    });
    expect(miniBuild.plugins.map((plugin) => plugin.name)).toEqual(['cherry-prism-languages']);
    expect(miniBuild.define).toEqual({ BUILD_ENV: JSON.stringify('production') });
  });

  it('pins the public package entrypoints', () => {
    expect(packageJson.main).toBe('./dist/cherry-markdown.js');
    expect(packageJson.module).toBe('./dist/cherry-markdown.esm.js');
    expect(packageJson.style).toBe('./dist/cherry-markdown.min.css');
    expect(packageJson.types).toBe('./dist/types/index.d.ts');
    expect(packageJson.exports).toBeUndefined();
    expect(packageJson.files).toEqual(['dist', 'types', '!types/env.d.ts']);
  });
});
