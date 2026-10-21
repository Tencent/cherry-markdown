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
import { generatePrismLanguages } from '../../build/generate-prism.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(projectRoot, '../..');
const fixtures = [];

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
    outputFile: join(cherry, 'src/utils/prism.js'),
  };
}

function addLanguage(fixture, language) {
  const languages = JSON.parse(readFileSync(fixture.languageFile, 'utf8'));
  writeFileSync(fixture.languageFile, JSON.stringify([...languages, language]));
}

describe('generated Prism imports', () => {
  afterEach(() => {
    fixtures.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
  });

  it('matches the language list and installed Prism dependency metadata', () => {
    expect(() => generatePrismLanguages({ check: true })).not.toThrow();
  });

  it('restarts development generation when the language list changes', async () => {
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
      expect(readFileSync(fixture.outputFile, 'utf8')).not.toContain('prism-kotlin.js');
      const url = `/@fs/${normalizePath(fixture.outputFile)}`;
      expect((await server.transformRequest(url)).code).not.toContain('prism-kotlin.js');
      await expect
        .poll(() => Object.values(server.watcher.getWatched()).flat(), { timeout: 10000 })
        .toContain('prism-languages.json');
      addLanguage(fixture, 'kotlin');
      await expect
        .poll(() => readFileSync(fixture.outputFile, 'utf8'), { timeout: 10000 })
        .toContain('prism-kotlin.js');
      await expect
        .poll(async () => (await server.transformRequest(url)).code, { timeout: 10000 })
        .toContain('prism-kotlin.js');
    } finally {
      await server.close();
    }
  }, 20000);

  it('regenerates a missing module during a standalone MiniProgram build and loads it without host globals', () => {
    const fixture = createFixture();
    const mini = join(fixture.root, 'packages/miniProgram');
    mkdirSync(mini, { recursive: true });
    for (const file of ['src', 'build', 'package.json']) {
      cpSync(join(repoRoot, 'packages/miniProgram', file), join(mini, file), { recursive: true });
    }
    addLanguage(fixture, 'kotlin');
    rmSync(fixture.outputFile);
    execFileSync(process.execPath, [join(mini, 'build/vite.build.js')], {
      cwd: fixture.root,
      stdio: 'pipe',
      timeout: 30000,
    });
    expect(readFileSync(fixture.outputFile, 'utf8')).toContain('prism-kotlin.js');
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
