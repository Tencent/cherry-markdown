import { describe, expect, it, vi } from 'vitest';
import { handleNewlineIndentList } from '../../src/utils/autoindent';

describe('utils/autoindent', () => {
  describe('handleNewlineIndentList', () => {
    it('非cherry列表时调用newlineAndIndentContinueMarkdownList', () => {
      const mockCm = {
        getOption: vi.fn(() => false),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 10 },
            empty: vi.fn(() => true),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => 'test line'),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });

    it('cherry列表格式匹配时创建新行', () => {
      const mockCm = {
        getOption: vi.fn(() => false),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 5 },
            empty: vi.fn(() => true),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => 'I. item'),
        replaceRange: vi.fn(),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.replaceSelections).toHaveBeenCalledWith(['\nI. ']);
      expect(mockCm.execCommand).not.toHaveBeenCalled();
    });

    it('cherry列表带缩进时保持缩进', () => {
      const mockCm = {
        getOption: vi.fn(() => false),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 8 },
            empty: vi.fn(() => true),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => '  I. item'),
        replaceRange: vi.fn(),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.replaceSelections).toHaveBeenCalledWith(['\n  I. ']);
    });

    it('cherry列表为空时删除当前行', () => {
      const mockCm = {
        getOption: vi.fn(() => false),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 4 },
            empty: vi.fn(() => true),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => 'I. '),
        replaceRange: vi.fn(),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.replaceRange).toHaveBeenCalledWith(
        '',
        { line: 0, ch: 0 },
        { line: 0, ch: 5 }
      );
      expect(mockCm.replaceSelections).toHaveBeenCalledWith(['\n']);
    });

    it('支持中文数字列表', () => {
      const mockCm = {
        getOption: vi.fn(() => false),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 6 },
            empty: vi.fn(() => true),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => '一. item'),
        replaceRange: vi.fn(),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.replaceSelections).toHaveBeenCalledWith(['\n一. ']);
    });

    it('禁用输入时不处理cherry列表', () => {
      const mockCm = {
        getOption: vi.fn(() => true),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 5 },
            empty: vi.fn(() => true),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => 'I. item'),
        replaceRange: vi.fn(),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });

    it('光标在列表符号前时使用默认行为', () => {
      const mockCm = {
        getOption: vi.fn(() => false),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 0 },
            empty: vi.fn(() => true),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => 'I. item'),
        replaceRange: vi.fn(),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });

    it('非空选择时使用默认行为', () => {
      const mockCm = {
        getOption: vi.fn(() => false),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 5 },
            empty: vi.fn(() => false),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => 'I. item'),
        replaceRange: vi.fn(),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });

    it('列表格式不匹配时使用默认行为', () => {
      const mockCm = {
        getOption: vi.fn(() => false),
        execCommand: vi.fn(),
        listSelections: vi.fn(() => [
          {
            head: { line: 0, ch: 5 },
            empty: vi.fn(() => true),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => '1. item'),
        replaceRange: vi.fn(),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });
  });
});
