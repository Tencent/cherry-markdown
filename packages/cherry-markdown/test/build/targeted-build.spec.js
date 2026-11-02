// @vitest-environment node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { mkdirSync } from 'node:fs';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';

vi.mock('vite', async (importOriginal) => ({
  ...(await importOriginal()),
  build: vi.fn(async () => ({ output: [] })),
}));
vi.mock('node:fs', async (importOriginal) => ({ ...(await importOriginal()), mkdirSync: vi.fn() }));

const main = new URL('../../build/vite.build.js', import.meta.url);
const addons = new URL('../../build/addons.build.js', import.meta.url);
const root = fileURLToPath(new URL('../../', import.meta.url));
const filenames = () => build.mock.calls.map(([config]) => config.build.lib.fileName()).sort();

async function run(entry, args) {
  const original = process.argv;
  process.argv = [process.execPath, fileURLToPath(entry), ...args];
  try {
    await import(entry.href);
  } finally {
    process.argv = original;
  }
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('NODE_ENV', 'production');
});
afterEach(() => vi.unstubAllEnvs());

it('builds only the public Engine ESM needed by Milkdown', async () => {
  await run(main, ['--targets=engine-core-esm']);
  expect(filenames()).toEqual(['cherry-markdown.engine.core.esm.js']);
  expect(build.mock.calls[0][0].build.lib.entry).toBe(resolve(root, 'src/index.engine.core.js'));
  expect(build.mock.calls[0][0].build.rolldownOptions.treeshake).toBe(false);
});

it('builds only the two public ECharts addon ESM entries needed by Milkdown', async () => {
  await run(addons, [
    '--targets=advance/cherry-table-echarts-plugin,advance/cherry-codeblock-echarts-plugin',
    '--formats=es',
  ]);
  expect(filenames()).toEqual(['cherry-codeblock-echarts-plugin.esm.js', 'cherry-table-echarts-plugin.esm.js']);
  for (const [config] of build.mock.calls) {
    expect(config.build.lib.formats).toEqual(['es']);
    expect(config.build.outDir).toBe(resolve(root, 'dist/addons/advance'));
  }
});

it.each([
  [main, ['--targets=engine-core-esm,typo']],
  [main, ['--targets=']],
  [main, ['--targets=engine-core-esm', '--formats=umd']],
  [main, ['--target=engine-core-esm']],
  [addons, ['--targets=advance/cherry-table-echarts-plugin', '--formats=cjs']],
  [addons, ['--targets=typo']],
])('rejects invalid build selections before writing any output (%#)', async (entry, args) => {
  await expect(run(entry, args)).rejects.toThrow();
  expect(build).not.toHaveBeenCalled();
  expect(mkdirSync).not.toHaveBeenCalled();
});
