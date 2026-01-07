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
            empty: vi.fn(() => false),
          },
        ]),
        replaceSelections: vi.fn(),
        getLine: vi.fn(() => 'test line'),
      };

      handleNewlineIndentList(mockCm);

      expect(mockCm.execCommand).toHaveBeenCalledWith('newlineAndIndentContinueMarkdownList');
    });
  });
});
