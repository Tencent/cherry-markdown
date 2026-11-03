import { afterAll, beforeAll, vi } from 'vite-plus/test';

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
});
afterAll(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList;
Range.prototype.getBoundingClientRect ??= () => document.createElement('span').getBoundingClientRect();
