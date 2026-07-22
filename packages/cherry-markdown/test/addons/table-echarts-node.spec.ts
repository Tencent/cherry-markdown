import { describe, expect, it, vi } from 'vitest';
import EChartsTableEngine from '../../src/addons/advance/cherry-table-echarts-plugin';

const isBrowserMock = vi.hoisted(() => vi.fn(() => false));

vi.mock('../../src/utils/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/env')>();
  return { ...actual, isBrowser: isBrowserMock };
});

describe('addons/EChartsTableEngine Node installation', () => {
  it('disables table charts and warns outside browser environments', () => {
    vi.stubGlobal('BUILD_ENV', 'test');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const options = { engine: { syntax: {} } };

    EChartsTableEngine.install(options);

    expect(options.engine.syntax).toEqual({ table: { enableChart: false } });
    expect(warn).toHaveBeenCalledWith('echarts-table-engine only works in browser.');
    vi.unstubAllGlobals();
  });
});
