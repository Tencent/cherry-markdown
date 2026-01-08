import { describe, expect, it, beforeEach, vi } from 'vitest';
import { drawioDialog } from '../../src/utils/dialog';

describe('utils/dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('drawioDialog', () => {
    it('初始化对话框', () => {
      const mockCallback = vi.fn();
      // drawioDialog 涉及 DOM 操作和 iframe 创建，测试不抛出错误
      expect(() => {
        drawioDialog('http://example.com/drawio', 'width:100%;height:100%', '<xml>data</xml>', mockCallback);
      }).not.toThrow();
    });
  });
});
