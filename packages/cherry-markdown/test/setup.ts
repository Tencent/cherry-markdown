/**
 * Vitest 测试环境设置文件
 * 用于设置 CodeMirror 相关测试所需的全局配置和 Mock
 */
import { beforeEach, afterEach, vi } from 'vitest';

// 设置 BUILD_ENV 全局变量（Logger 依赖）
(global as any).BUILD_ENV = 'test';

// ============================================================================
// CodeMirror 5 在 jsdom 中运行所需的 Mock
// 只在浏览器环境（jsdom）中添加这些 mock
// ============================================================================

if (typeof window !== 'undefined') {
  // Mock window.focus and window.blur (CM5 需要，jsdom 未实现)
  // 使用 Object.defineProperty 覆盖 jsdom 的默认实现
  // 只设置一次，避免重复设置导致的内存累积
  if (!(window as any)._mocksInitialized) {
    Object.defineProperty(window, 'focus', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'blur', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    (window as any)._mocksInitialized = true;
  }

  // Mock document.elementFromPoint (CM5 需要)
  if (!document.elementFromPoint) {
    document.elementFromPoint = vi.fn(() => null);
  }

  // Mock document.elementsFromPoint (CM5 可能需要)
  if (!document.elementsFromPoint) {
    document.elementsFromPoint = vi.fn(() => []);
  }

  // Mock Range.getBoundingClientRect (CM5 需要)
  if (typeof Range !== 'undefined' && !Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
  }

  // Mock Range.getClientRects (CM5 需要)
  if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
    Range.prototype.getClientRects = vi.fn(() => [] as any);
  }

  // Mock Element.getBoundingClientRect (CM5 需要)
  if (typeof Element !== 'undefined') {
    Element.prototype.getBoundingClientRect = vi.fn(function (this: Element) {
      return {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    });

    // Mock Element.getClientRects (CM5 需要)
    Element.prototype.getClientRects = vi.fn(() => [] as any);

    // Mock scrollIntoView (CM5 需要)
    Element.prototype.scrollIntoView = vi.fn();

    // Mock scrollTop, scrollLeft, scrollHeight, scrollWidth
    // 使用 getter/setter 避免内存累积
    Object.defineProperties(Element.prototype, {
      scrollTop: {
        get() {
          return this._scrollTop || 0;
        },
        set(value: number) {
          this._scrollTop = value;
        },
        configurable: true,
      },
      scrollLeft: {
        get() {
          return this._scrollLeft || 0;
        },
        set(value: number) {
          this._scrollLeft = value;
        },
        configurable: true,
      },
      scrollHeight: {
        get() {
          return this._scrollHeight || 1000;
        },
        configurable: true,
      },
      scrollWidth: {
        get() {
          return this._scrollWidth || 1000;
        },
        configurable: true,
      },
      clientHeight: {
        get() {
          return this._clientHeight || 500;
        },
        configurable: true,
      },
      clientWidth: {
        get() {
          return this._clientWidth || 500;
        },
        configurable: true,
      },
    });
  }
}

// ============================================================================
// 基础 Mock（仅在 jsdom 环境中）
// ============================================================================

if (typeof window !== 'undefined') {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16) as unknown as number;
  });

  global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
  });

  // Mock ResizeObserver
  class ResizeObserverMock {
    callback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

    constructor(callback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void) {
      this.callback = callback;
    }

    observe() {}
    unobserve() {}
    disconnect() {}
  }

  global.ResizeObserver = ResizeObserverMock;

  // 重置所有 mock 在每个测试之前
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers(); // 清理所有 timer，防止内存累积
    localStorageMock.clear();
  });

  /**
   * 全局清理：在每个测试后清理 DOM 泄漏
   * 这可以防止 jsdom 环境中的内存累积
   */
  afterEach(() => {
    // 清理动态创建的 DOM 元素
    const { body } = document;
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
    // 清理 head 中动态添加的样式
    document.querySelectorAll('style[data-test]').forEach((el) => el.remove());
    // 清理所有 timer，防止内存泄漏
    vi.clearAllTimers();
  });
}
