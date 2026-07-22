import { describe, expect, it, vi } from 'vitest';
import { getExternal } from '@/utils/external';

vi.mock('@/utils/env', () => ({
  isBrowser: () => false,
}));

describe('utils/external in non-browser environments', () => {
  it('仍优先返回显式注入的依赖', () => {
    const injected = { render: vi.fn() };

    expect(getExternal('missingExternal', injected)).toBe(injected);
  });

  it('无法读取浏览器全局变量时返回 undefined', () => {
    expect(getExternal('missingExternal')).toBeUndefined();
  });
});
