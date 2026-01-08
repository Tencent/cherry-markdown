import { describe, expect, it } from 'vitest';
import { prependLineFeedForParagraph, calculateLinesOfParagraph } from '../../src/utils/lineFeed';

describe('utils/lineFeed', () => {
  describe('prependLineFeedForParagraph', () => {
    it('为段落添加前导换行符', () => {
      const cases = [
        ['\ncontent', '<p>content</p>', false, '\n\n<p>content</p>'],
        ['\n\ncontent', '<p>content</p>', false, '\n\n<p>content</p>'],
        ['content', '<p>content</p>', false, '<p>content</p>'],
        ['\ncontent', '<p>content</p>', true, '\n<p>content</p>'],
        ['\n\ncontent', '<p>content</p>', true, '\n\n<p>content</p>'],
        ['\n\n\ncontent', '<p>content</p>', true, '\n\n<p>content</p>'],
      ];
      cases.forEach(([match, processedContent, canNestedInList, expected]) => {
        const result = prependLineFeedForParagraph(match as string, processedContent as string, canNestedInList as boolean);
        expect(result).toBe(expected);
      });
    });
  });

  describe('calculateLinesOfParagraph', () => {
    it('计算段落的行数', () => {
      const cases = [
        ['', 3, 3],
        ['\n', 3, 2],
        ['\n\n', 3, 3],
        ['\n\n\n', 3, 4],
        ['\n\n', 0, 0],
      ];
      cases.forEach(([preLinesMatch, contentLines, expected]) => {
        const result = calculateLinesOfParagraph(preLinesMatch as string, contentLines as number);
        expect(result).toBe(expected);
      });
    });
  });
});
