import { describe, expect, it, beforeEach, vi } from 'vitest';
import { drawioDialog } from '../../src/utils/dialog';

describe('utils/dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('drawioDialog', () => {
    it('使用参数初始化对话框', () => {
      const mockCallback = vi.fn();
      // 由于 drawioDialog 涉及 DOM 操作和 iframe 创建，这里只测试不抛出错误
      expect(() => {
        drawioDialog('http://example.com/drawio', 'width:100%;height:100%', '<xml>data</xml>', mockCallback);
      }).not.toThrow();
    });
  });
});
