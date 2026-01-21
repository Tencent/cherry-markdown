/**
 * Vitest 测试环境设置文件
 * 用于设置 CodeMirror 相关测试所需的全局配置和 Mock
 */
import { beforeEach, afterEach, vi } from 'vitest';

// 设置 BUILD_ENV 全局变量（Logger 依赖）
(global as any).BUILD_ENV = 'test';

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
  // 使用内联类型定义，避免依赖全局 ResizeObserverCallback
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
  localStorageMock.clear();
});

/**
 * 全局清理：在每个测试后清理 DOM 泄漏
 * 这可以防止 jsdom 环境中的内存累积
 */
afterEach(() => {
  // 清理动态创建的 DOM 元素
  const body = document.body;
  while (body.firstChild) {
    body.removeChild(body.firstChild);
  }
  // 清理 head 中动态添加的样式
  document.querySelectorAll('style[data-test]').forEach((el) => el.remove());
});
