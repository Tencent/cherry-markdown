import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { isBrowser } from '../../src/utils/env';

describe('utils/env', () => {
  let originalWindow: any;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('isBrowser', () => {
    it('检测浏览器环境', () => {
      // 测试环境(jsdom)中，window已定义
      expect(isBrowser()).toBe(true);

      // @ts-expect-error - 模拟非浏览器环境
      delete global.window;
      expect(isBrowser()).toBe(false);

      // 恢复window
      global.window = originalWindow;
      expect(isBrowser()).toBe(true);
    });
  });
});
