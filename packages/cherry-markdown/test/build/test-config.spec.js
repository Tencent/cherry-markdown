// @vitest-environment node
import { resolve } from 'node:path';
import { loadConfigFromFile } from 'vite';
import { afterEach, expect, it, vi } from 'vite-plus/test';

const repoRoot = resolve(import.meta.dirname, '../../../..');
afterEach(() => vi.unstubAllEnvs());

it.each([false, true])('loads package test configurations with coverage gate %s', async (gate) => {
  vi.stubEnv('COVERAGE_THRESHOLDS', gate ? 'true' : '');
  const configs = {};
  for (const [pkg, extension] of [
    ['cherry-markdown', 'ts'],
    ['miniProgram', 'ts'],
    ['milkdown', 'ts'],
    ['vscodePlugin', 'mts'],
  ]) {
    const root = resolve(repoRoot, 'packages', pkg);
    const loaded = await loadConfigFromFile(
      { command: 'serve', mode: 'test' },
      resolve(root, `vitest.config.${extension}`),
      root,
    );
    expect(loaded).not.toBeNull();
    configs[pkg] = loaded.config;
  }
  for (const pkg of ['cherry-markdown', 'miniProgram', 'milkdown']) {
    expect(configs[pkg].test).toMatchObject({ globals: true, environment: 'jsdom' });
  }
  for (const [pkg, include, thresholds] of [
    ['cherry-markdown', ['src/**/*.js'], { statements: 77, branches: 91.8, functions: 85.1, lines: 77 }],
    ['milkdown', ['src/**/*.ts'], { statements: 77, branches: 59, functions: 82, lines: 81 }],
  ]) {
    expect(configs[pkg].test.coverage).toMatchObject({ enabled: true, include, reporter: ['text', 'json', 'html'] });
    expect(configs[pkg].test.coverage.thresholds).toEqual(gate ? thresholds : undefined);
  }
  expect(configs['cherry-markdown'].test.unstubGlobals).toBe(true);
  expect(configs.milkdown.test.setupFiles).toEqual(['./test/setup.ts']);
  expect(configs.milkdown.test.include).toEqual(['test/**/*.spec.ts']);
  expect(configs.milkdown.test.coverage.exclude).toContain('**/*.d.ts');
  expect(configs.miniProgram.test.coverage).toBeUndefined();
  expect(configs.miniProgram.resolve.alias['@/Sanitizer']).toBe(
    resolve(repoRoot, 'packages/miniProgram/src/shared/Sanitizer.miniProgram.ts'),
  );
  expect(configs.vscodePlugin.test).toEqual({ environment: 'node', include: ['test/**/*.test.ts'] });
});
