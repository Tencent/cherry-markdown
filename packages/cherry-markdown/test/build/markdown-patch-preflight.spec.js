// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const workspaces = [];

function packageRoot(name) {
  let path = dirname(require.resolve(name));
  while (path !== dirname(path)) {
    const manifest = join(path, 'package.json');
    if (existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).name === name) return path;
    path = dirname(path);
  }
  throw new Error(`Cannot find installed ${name}`);
}

function createFixture() {
  // Every process gets its own dependency copy. Never mutate installed packages
  // while the source suite is running in parallel.
  const workspace = mkdtempSync(join(tmpdir(), 'cherry-markdown-patch-'));
  workspaces.push(workspace);
  const project = join(workspace, 'packages/cherry-markdown');
  mkdirSync(join(project, 'build'), { recursive: true });
  mkdirSync(join(workspace, 'patches'));
  cpSync(join(projectRoot, 'package.json'), join(project, 'package.json'));
  for (const file of ['verify-markdown-patch.js', 'vite.build.js', 'revision.js', 'legacy-umd.plugin.js']) {
    cpSync(join(projectRoot, 'build', file), join(project, 'build', file));
  }
  const source = packageRoot('@codemirror/lang-markdown');
  const { version } = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  const patch = join(workspace, 'patches', `@codemirror+lang-markdown+${version}.patch`);
  cpSync(resolve(projectRoot, '../../patches', `@codemirror+lang-markdown+${version}.patch`), patch);
  const dependency = join(project, 'node_modules/@codemirror/lang-markdown');
  cpSync(source, dependency, { recursive: true });
  const { dependencies } = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  for (const name of [...Object.keys(dependencies), 'vite', '@babel/core']) {
    const target = join(project, 'node_modules', name);
    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(packageRoot(name), target, 'junction');
  }
  return { project, dependency, patch };
}

const run = (fixture, entry = 'verify-markdown-patch.js') =>
  spawnSync(process.execPath, [join(fixture.project, 'build', entry)], {
    cwd: fixture.project,
    encoding: 'utf8',
    timeout: 15000,
  });

function edit(path, transform) {
  writeFileSync(path, transform(readFileSync(path, 'utf8')));
}

const expectRejected = (result, reason) => {
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('[Cherry Markdown patch]');
  expect(result.stderr).toContain(reason);
  expect(result.stderr).toContain('vp install --frozen-lockfile');
};

afterEach(() => {
  for (const workspace of workspaces.splice(0)) rmSync(workspace, { recursive: true, force: true });
});

describe('Markdown dependency build preflight', () => {
  it('accepts the pinned, fully patched installed dependency', () => {
    const result = run(createFixture());
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
  });

  it('rejects an unpinned dependency', () => {
    const fixture = createFixture();
    edit(join(fixture.project, 'package.json'), (text) => {
      const manifest = JSON.parse(text);
      manifest.dependencies['@codemirror/lang-markdown'] = '^6.5.0';
      return JSON.stringify(manifest);
    });
    expectRejected(run(fixture), 'must use an exact version');
  });

  it('rejects an installed version that differs from the pin', () => {
    const fixture = createFixture();
    edit(join(fixture.dependency, 'package.json'), (text) => {
      const manifest = JSON.parse(text);
      manifest.version = '0.0.0';
      return JSON.stringify(manifest);
    });
    expectRejected(run(fixture), 'installed dependency version differs');
  });

  it('rejects a missing maintained patch file', () => {
    const fixture = createFixture();
    rmSync(fixture.patch);
    expectRejected(run(fixture), 'Missing dependency patch');
  });

  it.each(['index.d.ts', 'index.d.cts'])('rejects incomplete %s declarations', (entry) => {
    const fixture = createFixture();
    edit(join(fixture.dependency, 'dist', entry), (text) => text.replace('exitParagraphBoundary?: boolean;', ''));
    expectRejected(run(fixture), `${entry}: missing exitParagraphBoundary`);
  });

  it('rejects missing ESM continuation behavior even when declarations are patched', () => {
    const fixture = createFixture();
    edit(join(fixture.dependency, 'dist/index.js'), (text) =>
      text.replace('config.continueLooseLists !== false && ', ''),
    );
    expectRejected(run(fixture), 'ESM: patched Enter behavior is missing');
  });

  it('rejects missing CJS exit behavior even when ESM is patched', () => {
    const fixture = createFixture();
    edit(join(fixture.dependency, 'dist/index.cjs'), (text) => text.replace('config.exitParagraphBoundary', 'false'));
    expectRejected(run(fixture), 'CJS: patched Enter behavior is missing');
  });

  it('blocks the direct Vite build entry before producing bundles', () => {
    const fixture = createFixture();
    edit(join(fixture.dependency, 'dist/index.js'), (text) =>
      text.replace('config.continueLooseLists !== false && ', ''),
    );
    const result = run(fixture, 'vite.build.js');
    expectRejected(result, 'ESM: patched Enter behavior is missing');
    expect(result.stdout).not.toContain('[vite build]');
    expect(existsSync(join(fixture.project, 'dist'))).toBe(false);
  });
});
