import { afterAll, beforeAll, vi } from 'vite-plus/test';

// jsdom reports Apple's vendor but has no Safari editing command support.
Object.defineProperty(navigator, 'vendor', { value: 'jsdom', configurable: true });

beforeAll(() => {
  // Milkdown's readiness timers keep their timeout callbacks even after they
  // resolve. Own these timers so they cannot run after jsdom removes globals.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
});

afterAll(() => {
  if (vi.isFakeTimers()) {
    vi.clearAllTimers();
    vi.useRealTimers();
  }
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = () => document.createElement('span').getBoundingClientRect();
}
