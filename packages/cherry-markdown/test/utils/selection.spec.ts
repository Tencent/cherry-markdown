import { describe, it, expect, vi } from 'vitest';
import { getSelection } from '../../src/utils/selection';

describe('selection 工具函数', () => {
  // 创建 CodeMirror mock
  const createCMMock = (overrides = {}) => ({
    getSelections: vi.fn(() => ['selected text']),
    listSelections: vi.fn(() => [{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } }]),
    getSelection: vi.fn(() => 'selected text'),
    getCursor: vi.fn(() => ({ line: 0, ch: 2 })),
    findWordAt: vi.fn(() => ({ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } })),
    getLine: vi.fn(() => 'test line'),
    setSelection: vi.fn(),
    ...overrides,
  });

  describe('getSelection', () => {
    it('多光标模式下返回原始选中文本', () => {
      const cm = createCMMock({
        getSelections: vi.fn(() => ['text1', 'text2']),
      });
      const result = getSelection(cm, 'original');
      expect(result).toBe('original');
    });

    it('有选中文本且不强制聚焦时返回选中文本', () => {
      const cm = createCMMock();
      const result = getSelection(cm, 'selected text', 'word', false);
      expect(result).toBe('selected text');
    });

    it('focus=true 时获取光标所在行内容', () => {
      const cm = createCMMock();
      const result = getSelection(cm, '', 'line', true);
      expect(cm.setSelection).toHaveBeenCalled();
    });

    it('focus=true 时获取光标所在单词内容', () => {
      const cm = createCMMock();
      const result = getSelection(cm, '', 'word', true);
      expect(cm.findWordAt).toHaveBeenCalled();
      expect(cm.setSelection).toHaveBeenCalled();
    });

    it('处理 anchor 在 head 后面的情况 (line 类型)', () => {
      const cm = createCMMock({
        listSelections: vi.fn(() => [
          { anchor: { line: 0, ch: 5 }, head: { line: 0, ch: 0 } },
        ]),
      });
      getSelection(cm, '', 'line', true);
      expect(cm.setSelection).toHaveBeenCalled();
    });

    it('处理 anchor.line > head.line 的情况', () => {
      const cm = createCMMock({
        listSelections: vi.fn(() => [
          { anchor: { line: 2, ch: 0 }, head: { line: 0, ch: 5 } },
        ]),
      });
      getSelection(cm, '', 'line', true);
      expect(cm.setSelection).toHaveBeenCalled();
    });
  });
});
