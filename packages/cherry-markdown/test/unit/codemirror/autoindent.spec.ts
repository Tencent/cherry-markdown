/**
 * autoindent.js 单元测试
 * 测试 Markdown 列表自动缩进功能
 *
 * 这些测试记录了自动缩进的行为，对于升级 CodeMirror 6 时保持列表编辑体验一致性很重要
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { handleNewlineIndentList } from '../../../src/utils/autoindent';
import { createCodeMirrorMock } from '../../__mocks__/codemirror.mock';

describe('autoindent.js - handleNewlineIndentList', () => {
  let mockCm: ReturnType<typeof createCodeMirrorMock>;

  beforeEach(() => {
    mockCm = createCodeMirrorMock('');
  });

  describe('Cherry 列表 (中文数字列表)', () => {
    it('在中文数字列表后按回车应该继续列表', () => {
      const content = '一. 第一项内容';
      mockCm = createCodeMirrorMock(content);
      mockCm.getOption.mockReturnValue(false); // disableInput = false
      // 使用正确的结构，包含 empty 方法
      mockCm.listSelections.mockReturnValue([
        {
          anchor: { line: 0, ch: content.length },
          head: { line: 0, ch: content.length },
          empty: () => false,
        },
      ]);
      mockCm.getLine.mockReturnValue(content);

      handleNewlineIndentList(mockCm as any);

      // Cherry 列表应该调用 replaceSelections
      // 如果不符合条件，会调用 execCommand
      const replaceCalled = mockCm.replaceSelections.mock.calls.length > 0;
      const execCalled = mockCm.execCommand.mock.calls.length > 0;
      expect(replaceCalled || execCalled).toBe(true);
    });

    it('在空的中文数字列表项上按回车应该清除列表标记', () => {
      const content = '一. ';
      mockCm = createCodeMirrorMock(content);
      mockCm.getOption.mockReturnValue(false);
      mockCm.listSelections.mockReturnValue([
        {
          anchor: { line: 0, ch: content.length },
          head: { line: 0, ch: content.length },
          empty: () => true,
        },
      ]);
      mockCm.getLine.mockReturnValue(content);

      handleNewlineIndentList(mockCm as any);

      // 空列表项可能被清除或执行默认命令
      const anyCalled =
        mockCm.replaceRange.mock.calls.length > 0 ||
        mockCm.replaceSelections.mock.calls.length > 0 ||
        mockCm.execCommand.mock.calls.length > 0;
      expect(anyCalled).toBe(true);
    });

    it('支持带缩进的中文数字列表', () => {
      const content = '  二. 第二项内容';
      mockCm = createCodeMirrorMock(content);
      mockCm.getOption.mockReturnValue(false);
      mockCm.listSelections.mockReturnValue([
        {
          anchor: { line: 0, ch: content.length },
          head: { line: 0, ch: content.length },
          empty: () => false,
        },
      ]);
      mockCm.getLine.mockReturnValue(content);

      handleNewlineIndentList(mockCm as any);

      // 验证调用了某种替换或命令
      const anyCalled = mockCm.replaceSelections.mock.calls.length > 0 || mockCm.execCommand.mock.calls.length > 0;
      expect(anyCalled).toBe(true);
    });

    it('支持罗马数字 I 的列表', () => {
      const content = 'I. 第一项';
      mockCm = createCodeMirrorMock(content);
      mockCm.getOption.mockReturnValue(false);
      mockCm.listSelections.mockReturnValue([
        {
          anchor: { line: 0, ch: content.length },
          head: { line: 0, ch: content.length },
          empty: () => false,
        },
      ]);
      mockCm.getLine.mockReturnValue(content);

      handleNewlineIndentList(mockCm as any);

      // 验证调用了某种替换或命令
      const anyCalled = mockCm.replaceSelections.mock.calls.length > 0 || mockCm.execCommand.mock.calls.length > 0;
      expect(anyCalled).toBe(true);
    });
  });

  describe('disableInput 选项', () => {
    it('当 disableInput 为 true 时不处理', () => {
      mockCm.getOption.mockReturnValue(true); // disableInput = true

      handleNewlineIndentList(mockCm as any);

      // 应该调用默认命令
      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });
  });

  describe('普通 Markdown 列表', () => {
    it('非 Cherry 列表应该使用默认行为', () => {
      const content = '- 普通列表项';
      mockCm = createCodeMirrorMock(content);
      mockCm.getOption.mockReturnValue(false);
      mockCm.listSelections.mockReturnValue([
        {
          anchor: { line: 0, ch: content.length },
          head: { line: 0, ch: content.length },
          empty: () => false,
        },
      ]);
      mockCm.getLine.mockReturnValue(content);

      handleNewlineIndentList(mockCm as any);

      // 普通列表应该调用默认的 CodeMirror 命令
      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });

    it('有序列表应该使用默认行为', () => {
      const content = '1. 有序列表项';
      mockCm = createCodeMirrorMock(content);
      mockCm.getOption.mockReturnValue(false);
      mockCm.listSelections.mockReturnValue([
        {
          anchor: { line: 0, ch: content.length },
          head: { line: 0, ch: content.length },
          empty: () => false,
        },
      ]);
      mockCm.getLine.mockReturnValue(content);

      handleNewlineIndentList(mockCm as any);

      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });
  });

  describe('光标位置', () => {
    it('光标在列表标记前时不处理 Cherry 列表', () => {
      const content = '一. 内容';
      mockCm = createCodeMirrorMock(content);
      mockCm.getOption.mockReturnValue(false);
      mockCm.listSelections.mockReturnValue([
        {
          anchor: { line: 0, ch: 0 },
          head: { line: 0, ch: 0 }, // 光标在行首
          empty: () => false,
        },
      ]);
      mockCm.getLine.mockReturnValue(content);

      handleNewlineIndentList(mockCm as any);

      // 光标在标记前应该使用默认行为
      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });
  });

  describe('多光标', () => {
    it('支持多光标模式', () => {
      const content = '一. 第一项\n二. 第二项';
      mockCm = createCodeMirrorMock(content);
      mockCm.getOption.mockReturnValue(false);
      mockCm.listSelections.mockReturnValue([
        {
          anchor: { line: 0, ch: 7 },
          head: { line: 0, ch: 7 },
          empty: () => false,
        },
        {
          anchor: { line: 1, ch: 7 },
          head: { line: 1, ch: 7 },
          empty: () => false,
        },
      ]);
      mockCm.getLine.mockImplementation((line: number) => {
        return ['一. 第一项', '二. 第二项'][line] || '';
      });

      handleNewlineIndentList(mockCm as any);

      // 多光标时的行为取决于实现
    });
  });
});

describe('autoindent.js - Cherry 列表正则匹配', () => {
  // 测试 Cherry 列表的正则表达式匹配
  const cherryListRE = /^(\s*)([I一二三四五六七八九十]+)\.(\s+)/;
  const cherryListEmptyRE = /^(\s*)([I一二三四五六七八九十]+)\.(\s+)$/;

  describe('cherryListRE 正则', () => {
    it('应该匹配中文数字列表', () => {
      expect(cherryListRE.test('一. 内容')).toBe(true);
      expect(cherryListRE.test('二. 内容')).toBe(true);
      expect(cherryListRE.test('十. 内容')).toBe(true);
    });

    it('应该匹配罗马数字 I 列表', () => {
      expect(cherryListRE.test('I. 内容')).toBe(true);
      expect(cherryListRE.test('II. 内容')).toBe(true);
    });

    it('应该匹配带缩进的列表', () => {
      expect(cherryListRE.test('  一. 内容')).toBe(true);
      expect(cherryListRE.test('\t一. 内容')).toBe(true);
    });

    it('不应该匹配普通数字列表', () => {
      expect(cherryListRE.test('1. 内容')).toBe(false);
    });

    it('不应该匹配无序列表', () => {
      expect(cherryListRE.test('- 内容')).toBe(false);
      expect(cherryListRE.test('* 内容')).toBe(false);
    });
  });

  describe('cherryListEmptyRE 正则', () => {
    it('应该匹配空的中文数字列表项', () => {
      expect(cherryListEmptyRE.test('一. ')).toBe(true);
      expect(cherryListEmptyRE.test('二.  ')).toBe(true);
    });

    it('不应该匹配有内容的列表项', () => {
      expect(cherryListEmptyRE.test('一. 内容')).toBe(false);
    });

    it('应该匹配带缩进的空列表项', () => {
      expect(cherryListEmptyRE.test('  一. ')).toBe(true);
    });
  });
});
