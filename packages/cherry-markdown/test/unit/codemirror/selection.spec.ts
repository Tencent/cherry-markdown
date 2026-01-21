/**
 * selection.js 单元测试
 * 测试 CodeMirror 选区相关功能
 *
 * 这些测试记录了 CodeMirror 5 的行为，用于升级到 CodeMirror 6 时的回归测试
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getSelection } from '../../../src/utils/selection';
import { createCodeMirrorMock } from '../../__mocks__/codemirror.mock';

describe('selection.js - getSelection', () => {
  let mockCm: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    mockCm = createCodeMirrorMock('Hello World\nThis is a test\nThird line');
  });

  describe('基本选区行为', () => {
    it('当有选中文本且 focus=false 时，应返回选中的文本', () => {
      const selection = 'World';
      const result = getSelection(mockCm as any, selection, 'word', false);
      expect(result).toBe('World');
    });

    it('当有选中文本且 focus=true 时，应选中光标处的单词', () => {
      mockCm.setCursor({ line: 0, ch: 6 }); // 光标在 "World" 中
      mockCm.findWordAt.mockReturnValue({
        anchor: { line: 0, ch: 6 },
        head: { line: 0, ch: 11 },
      });
      mockCm.getSelection.mockReturnValue('World');

      getSelection(mockCm as any, 'existing', 'word', true);

      expect(mockCm.findWordAt).toHaveBeenCalled();
      expect(mockCm.setSelection).toHaveBeenCalled();
    });

    it('当没有选中文本时，应根据 type 参数选中内容', () => {
      mockCm.setCursor({ line: 0, ch: 6 });
      mockCm.findWordAt.mockReturnValue({
        anchor: { line: 0, ch: 6 },
        head: { line: 0, ch: 11 },
      });
      mockCm.getSelection.mockReturnValue('World');

      getSelection(mockCm as any, '', 'word', false);

      expect(mockCm.findWordAt).toHaveBeenCalled();
      expect(mockCm.setSelection).toHaveBeenCalled();
    });
  });

  describe('多光标模式', () => {
    it('当存在多个选区时，应直接返回传入的 selection', () => {
      mockCm.getSelections.mockReturnValue(['Hello', 'World']);

      const result = getSelection(mockCm as any, 'original', 'word', false);

      expect(result).toBe('original');
    });
  });

  describe('type=line 行为', () => {
    it('当 type=line 时，应选中整行', () => {
      mockCm.listSelections.mockReturnValue([{ anchor: { line: 1, ch: 5 }, head: { line: 1, ch: 10 } }]);
      mockCm.getLine.mockImplementation((lineNum: number) => {
        const lines = ['Hello World', 'This is a test', 'Third line'];
        return lines[lineNum] || '';
      });
      mockCm.getSelection.mockReturnValue('This is a test');

      getSelection(mockCm as any, '', 'line', false);

      expect(mockCm.setSelection).toHaveBeenCalledWith({ line: 1, ch: 0 }, { line: 1, ch: 14 });
    });

    it('当 anchor 在 head 后面时，应正确处理选区方向', () => {
      mockCm.listSelections.mockReturnValue([{ anchor: { line: 1, ch: 10 }, head: { line: 1, ch: 5 } }]);
      mockCm.getLine.mockImplementation((lineNum: number) => {
        const lines = ['Hello World', 'This is a test', 'Third line'];
        return lines[lineNum] || '';
      });
      mockCm.getSelection.mockReturnValue('This is a test');

      getSelection(mockCm as any, '', 'line', false);

      expect(mockCm.setSelection).toHaveBeenCalledWith({ line: 1, ch: 0 }, { line: 1, ch: 14 });
    });

    it('当选区跨行且 anchor.line > head.line 时，应正确选中', () => {
      mockCm.listSelections.mockReturnValue([{ anchor: { line: 2, ch: 5 }, head: { line: 0, ch: 3 } }]);
      mockCm.getLine.mockImplementation((lineNum: number) => {
        const lines = ['Hello World', 'This is a test', 'Third line'];
        return lines[lineNum] || '';
      });
      mockCm.getSelection.mockReturnValue('lo World\nThis is a test\nThird');

      getSelection(mockCm as any, '', 'line', false);

      // 当 anchor.line > head.line 时，从 head.line 开始到 anchor.line 结束
      expect(mockCm.setSelection).toHaveBeenCalledWith({ line: 0, ch: 0 }, { line: 2, ch: 10 });
    });
  });

  describe('type=word 行为', () => {
    it('当 type=word 时，应选中光标所在单词', () => {
      mockCm.getCursor.mockReturnValue({ line: 0, ch: 7 });
      mockCm.findWordAt.mockReturnValue({
        anchor: { line: 0, ch: 6 },
        head: { line: 0, ch: 11 },
      });
      mockCm.getSelection.mockReturnValue('World');

      getSelection(mockCm as any, '', 'word', false);

      expect(mockCm.findWordAt).toHaveBeenCalledWith({ line: 0, ch: 7 });
      expect(mockCm.setSelection).toHaveBeenCalledWith({ line: 0, ch: 6 }, { line: 0, ch: 11 });
    });
  });
});

describe('selection.js - 边界情况', () => {
  let mockCm: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    mockCm = createCodeMirrorMock('');
  });

  it('空文档时应正常处理', () => {
    mockCm.getSelections.mockReturnValue(['']);
    mockCm.getCursor.mockReturnValue({ line: 0, ch: 0 });
    mockCm.findWordAt.mockReturnValue({
      anchor: { line: 0, ch: 0 },
      head: { line: 0, ch: 0 },
    });
    mockCm.getSelection.mockReturnValue('');

    const result = getSelection(mockCm as any, '', 'word', false);

    expect(result).toBe('');
  });

  it('光标在行首时应正确选中单词', () => {
    mockCm = createCodeMirrorMock('Hello World');
    mockCm.getCursor.mockReturnValue({ line: 0, ch: 0 });
    mockCm.findWordAt.mockReturnValue({
      anchor: { line: 0, ch: 0 },
      head: { line: 0, ch: 5 },
    });
    mockCm.getSelection.mockReturnValue('Hello');

    getSelection(mockCm as any, '', 'word', false);

    expect(mockCm.setSelection).toHaveBeenCalledWith({ line: 0, ch: 0 }, { line: 0, ch: 5 });
  });

  it('光标在行尾时应正确选中单词', () => {
    mockCm = createCodeMirrorMock('Hello World');
    mockCm.getCursor.mockReturnValue({ line: 0, ch: 11 });
    mockCm.findWordAt.mockReturnValue({
      anchor: { line: 0, ch: 6 },
      head: { line: 0, ch: 11 },
    });
    mockCm.getSelection.mockReturnValue('World');

    getSelection(mockCm as any, '', 'word', false);

    expect(mockCm.setSelection).toHaveBeenCalledWith({ line: 0, ch: 6 }, { line: 0, ch: 11 });
  });
});
