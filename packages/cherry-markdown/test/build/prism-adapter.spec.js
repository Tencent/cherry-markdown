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
import { prismLanguagePlugin } from '../../build/prism.plugin.js';
import languages from '../../build/prism-languages.json';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(projectRoot, '../..');
const fixtures = [];
const require = createRequire(import.meta.url);
const getLoader = require('prismjs/dependencies.js');
const components = require('prismjs/components.json');

function createFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'cherry-prism-')));
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
    entryFile: join(cherry, 'src/utils/prism.js'),
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

  it('injects the original dependency order after runtime initialization and returns a source map', async () => {
    const entry = join(projectRoot, 'src/utils/prism.js');
    const source = readFileSync(entry, 'utf8');
    const result = await prismLanguagePlugin().transform(source, `${entry}?test`);
    const imports = [...result.code.matchAll(/import ["']prismjs\/components\/prism-([^"']+)["'];/g)].map(
      (match) => match[1],
    );
    expect(imports).toEqual(['core', ...getLoader(components, languages).getIds()]);
    expect(result.code.indexOf('prism-runtime.js')).toBeLessThan(result.code.indexOf('prism-core'));
    expect(result.code).not.toMatch(/from ["']prismjs["']/);
    expect(result.map.sourcesContent).toContain(source);
    expect(result.map.mappings.length).toBeGreaterThan(0);
  });

  it('leaves other source files and dependencies untouched', async () => {
    const plugin = prismLanguagePlugin();
    const code = "import Prism from 'prismjs';";
    expect(await plugin.transform(code, join(projectRoot, 'src/utils/prism-runtime.js'))).toBeNull();
    expect(await plugin.transform(code, join(repoRoot, 'node_modules/prismjs/prism.js'))).toBeNull();
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

  it('injects updated languages in a standalone MiniProgram build without generated files or host globals', () => {
    const fixture = createFixture();
    const mini = join(fixture.root, 'packages/miniProgram');
    mkdirSync(mini, { recursive: true });
    for (const file of ['src', 'build', 'package.json']) {
      cpSync(join(repoRoot, 'packages/miniProgram', file), join(mini, file), { recursive: true });
    }
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
