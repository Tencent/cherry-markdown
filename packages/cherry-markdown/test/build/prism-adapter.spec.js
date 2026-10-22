// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, normalizePath } from 'vite';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { createRequire } from 'node:module';
import { parseAsync } from '@babel/core';
import { prismLanguagePlugin } from '../../build/prism.plugin.js';
import languages from '../../build/prism-languages.json';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(projectRoot, '../..');
const fixtures = [];
const require = createRequire(import.meta.url);
const getLoader = require('prismjs/dependencies.js');
const components = require('prismjs/components.json');

function createFixture(prefix = 'cherry-prism-') {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  fixtures.push(root);
  writeFileSync(join(root, 'package.json'), '{"type":"module"}');
  symlinkSync(join(repoRoot, 'node_modules'), join(root, 'node_modules'), 'junction');
  mkdirSync(join(root, 'examples'), { recursive: true });
  const cherry = join(root, 'packages/cherry-markdown');
  mkdirSync(cherry, { recursive: true });
  for (const file of ['src', 'build', 'package.json', 'vite.config.ts', 'vite.plugins.ts']) {
    cpSync(join(projectRoot, file), join(cherry, file), { recursive: true });
  }
  return {
    root,
    cherry,
    languageFile: join(cherry, 'build/prism-languages.json'),
    entryFile: join(cherry, 'src/core/hooks/CodeBlock.js'),
  };
}

function addLanguage(fixture, language) {
  const languages = JSON.parse(readFileSync(fixture.languageFile, 'utf8'));
  writeFileSync(fixture.languageFile, JSON.stringify([...languages, language]));
}

describe('shared Prism Babel adapter', () => {
  afterEach(() => {
    fixtures.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
  });

  it('injects core before the original language dependency order and returns a source map', async () => {
    const entry = join(projectRoot, 'src/core/hooks/CodeBlock.js');
    const source = readFileSync(entry, 'utf8');
    const result = await prismLanguagePlugin().transform(source, `${entry}?test`);
    const imports = [...result.code.matchAll(/import (?:\w+ from )?["']prismjs\/components\/prism-([^"']+)["'];/g)].map(
      (match) => match[1],
    );
    expect(imports).toEqual(['core', ...getLoader(components, languages).getIds()]);
    expect(result.code).not.toContain('prism-runtime');
    expect(result.code).not.toContain('utils/prism');
    expect(result.code).not.toMatch(/from ["']prismjs["']/);
    expect(result.code.match(/Prism\.manual = true/g)).toHaveLength(1);
    expect(result.map.sourcesContent).toContain(source);
    expect(result.map.mappings.length).toBeGreaterThan(0);
    expect((await prismLanguagePlugin().transform(source, entry.replace(/\//g, '\\'))).code).toBe(result.code);
  });

  it('leaves other source files and dependencies untouched', async () => {
    const plugin = prismLanguagePlugin();
    const code = "import Prism from 'prismjs';";
    expect(await plugin.transform(code, join(projectRoot, 'src/utils/other.js'))).toBeNull();
    expect(await plugin.transform(code, join(projectRoot, 'src/other/CodeBlock.js'))).toBeNull();
    expect(await plugin.transform(code, join(repoRoot, 'node_modules/prismjs/prism.js'))).toBeNull();
    expect(
      await plugin.transform('global.Prism = value;', join(repoRoot, 'node_modules/other/prism-core.js')),
    ).toBeNull();
  });

  it('rewrites only unbound global references in the resolved Prism core in both pipelines', async () => {
    const plugin = prismLanguagePlugin();
    const core = require.resolve('prismjs/components/prism-core.js');
    const source = `if (typeof global !== 'undefined') global.Prism = Prism;
      function local(global) { return global.Prism; }
      const value = { global: 'global' };`;
    for (const adapter of [plugin, plugin.config().optimizeDeps.rolldownOptions.plugins[0]]) {
      const result = await adapter.transform(source, `${core}?test`);
      expect(result.code).toContain('globalThis.Prism = Prism');
      expect(result.code).toContain('typeof globalThis');
      expect(result.code).toContain('return global.Prism');
      expect(result.code).toContain("global: 'global'");
      expect(result.map.sourcesContent).toContain(source);
      expect(await adapter.transform(source, join(repoRoot, 'node_modules/other/prism-core.js'))).toBeNull();
    }
    expect(plugin.config()).not.toHaveProperty('define');
    expect(plugin.config().optimizeDeps.rolldownOptions).not.toHaveProperty('transform.define');
  });

  it('reloads development language injection without rewriting source files', async () => {
    const fixture = createFixture();
    const server = await createServer({
      configFile: join(fixture.cherry, 'vite.config.ts'),
      cacheDir: join(fixture.root, 'vite-cache'),
      server: { middlewareMode: true, ws: false, watch: { usePolling: true, interval: 50 } },
      optimizeDeps: { noDiscovery: true },
      logLevel: 'silent',
    });
    try {
      expect(server.config.configFileDependencies.map(normalizePath)).toContain(normalizePath(fixture.languageFile));
      const source = readFileSync(fixture.entryFile, 'utf8');
      const url = `/@fs/${normalizePath(fixture.entryFile)}`;
      expect((await server.transformRequest(url)).code).not.toContain('prism-kotlin.js');
      await expect
        .poll(() => Object.values(server.watcher.getWatched()).flat(), { timeout: 10000 })
        .toContain('prism-languages.json');
      addLanguage(fixture, 'kotlin');
      await expect
        .poll(async () => (await server.transformRequest(url)).code, { timeout: 10000 })
        .toContain('prism-kotlin.js');
      expect(readFileSync(fixture.entryFile, 'utf8')).toBe(source);
    } finally {
      await server.close();
    }
  }, 20000);

  it('initializes actual development prebundles without changing another dependency global', async () => {
    // Exercise encoded dependency URLs without relying on the host's TMPDIR.
    const fixture = createFixture('cherry prism-');
    const probe = join(fixture.root, 'other-global-probe.cjs');
    writeFileSync(probe, 'module.exports = typeof global;');
    writeFileSync(
      fixture.entryFile,
      `${readFileSync(fixture.entryFile, 'utf8')}\nimport probe from 'other-global-probe';\nexport { Prism, probe };`,
    );
    const server = await createServer({
      configFile: join(fixture.cherry, 'vite.config.ts'),
      cacheDir: join(fixture.root, 'vite-cache'),
      resolve: { alias: { 'other-global-probe': probe } },
      server: { middlewareMode: true, ws: false },
      optimizeDeps: { include: ['prismjs/components/prism-core.js', 'other-global-probe'] },
      logLevel: 'silent',
    });
    try {
      const graphFile = join(fixture.root, 'dev-graph.json');
      async function captureGraph(url, graph) {
        const path = decodeURI(url.split('?')[0]);
        const file = path.startsWith('/@fs/') ? resolve(path.slice(4)) : resolve(server.config.root, `.${path}`);
        if (file.startsWith(join(fixture.root, 'vite-cache')) || graph.has(file)) return;
        const result = await server.transformRequest(decodeURI(url));
        graph.set(file, result.code);
        const ast = await parseAsync(result.code, { babelrc: false, configFile: false, sourceType: 'module' });
        for (const node of ast.program.body) {
          if (node.source?.value)
            await captureGraph(new URL(node.source.value, `http://vite.local${url}`).pathname, graph);
        }
      }
      await expect
        .poll(
          async () => {
            try {
              const graph = new Map();
              await captureGraph(`/@fs/${normalizePath(fixture.entryFile)}`, graph);
              writeFileSync(graphFile, JSON.stringify(Object.fromEntries(graph)));
              return execFileSync(
                process.execPath,
                [
                  '--experimental-vm-modules',
                  join(projectRoot, 'test/build/verify-prism-dev.mjs'),
                  server.config.root,
                  fixture.entryFile,
                  graphFile,
                ],
                { encoding: 'utf8', stdio: 'pipe', timeout: 5000 },
              ).trim();
            } catch (error) {
              return error.stderr?.toString() || String(error);
            }
          },
          { timeout: 15000 },
        )
        .toBe('Verified development prebundling and Prism-only global compatibility.');
    } finally {
      await server.close();
    }
  }, 20000);

  it('injects updated languages in a standalone MiniProgram build without generated files or host globals', () => {
    const fixture = createFixture();
    const mini = join(fixture.root, 'packages/miniProgram');
    mkdirSync(mini, { recursive: true });
    for (const file of ['src', 'build', 'package.json']) {
      cpSync(join(repoRoot, 'packages/miniProgram', file), join(mini, file), { recursive: true });
    }
    writeFileSync(join(mini, 'src/other-global-probe.cjs'), 'module.exports = typeof global;');
    const miniEntry = join(mini, 'src/index.js');
    writeFileSync(
      miniEntry,
      `${readFileSync(miniEntry, 'utf8')}\nexport { default as probe } from './other-global-probe.cjs';`,
    );
    addLanguage(fixture, 'kotlin');
    const source = readFileSync(fixture.entryFile, 'utf8');
    execFileSync(process.execPath, [join(mini, 'build/vite.build.js')], {
      cwd: fixture.root,
      stdio: 'pipe',
      timeout: 30000,
    });
    expect(readFileSync(fixture.entryFile, 'utf8')).toBe(source);
    execFileSync(
      process.execPath,
      [
        '--experimental-vm-modules',
        join(projectRoot, 'test/build/verify-prism-headless.mjs'),
        join(mini, 'dist/miniProgram.esm.js'),
        'kotlin',
      ],
      { stdio: 'pipe', timeout: 30000 },
    );
  }, 35000);
});
