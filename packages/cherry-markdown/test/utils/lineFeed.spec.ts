import { describe, expect, it } from 'vitest';
import { prependLineFeedForParagraph, calculateLinesOfParagraph } from '../../src/utils/lineFeed';

describe('utils/lineFeed', () => {
  describe('prependLineFeedForParagraph', () => {
    it('以换行符开头的内容添加双换行符', () => {
      const match = '\ncontent';
      const processedContent = '<p>content</p>';
      const result = prependLineFeedForParagraph(match, processedContent);
      expect(result).toBe('\n\n<p>content</p>');
    });

    it('以双换行符开头的内容保留双换行符', () => {
      const match = '\n\ncontent';
      const processedContent = '<p>content</p>';
      const result = prependLineFeedForParagraph(match, processedContent);
      expect(result).toBe('\n\n<p>content</p>');
    });

    it('无前导换行符不添加换行符', () => {
      const match = 'content';
      const processedContent = '<p>content</p>';
      const result = prependLineFeedForParagraph(match, processedContent);
      expect(result).toBe('<p>content</p>');
    });

    it('canNestedInList=true处理单前导换行', () => {
      const match = '\ncontent';
      const processedContent = '<p>content</p>';
      const result = prependLineFeedForParagraph(match, processedContent, true);
      expect(result).toBe('\n<p>content</p>');
    });

    it('canNestedInList=true处理双前导换行', () => {
      const match = '\n\ncontent';
      const processedContent = '<p>content</p>';
      const result = prependLineFeedForParagraph(match, processedContent, true);
      expect(result).toBe('\n\n<p>content</p>');
    });

    it('canNestedInList=true处理三前导换行', () => {
      const match = '\n\n\ncontent';
      const processedContent = '<p>content</p>';
      const result = prependLineFeedForParagraph(match, processedContent, true);
      expect(result).toBe('\n\n<p>content</p>');
    });
  });

  describe('calculateLinesOfParagraph', () => {
    it('计算文档开头内容的行数', () => {
      const preLinesMatch = '';
      const contentLines = 3;
      const result = calculateLinesOfParagraph(preLinesMatch, contentLines);
      expect(result).toBe(3);
    });

    it('计算单前导换行内容的行数', () => {
      const preLinesMatch = '\n';
      const contentLines = 3;
      const result = calculateLinesOfParagraph(preLinesMatch, contentLines);
      expect(result).toBe(2); // 1 - 2 + 3 = 2
    });

    it('计算双前导换行内容的行数', () => {
      const preLinesMatch = '\n\n';
      const contentLines = 3;
      const result = calculateLinesOfParagraph(preLinesMatch, contentLines);
      expect(result).toBe(3); // 2 - 2 + 3 = 3
    });

    it('计算三前导换行内容的行数', () => {
      const preLinesMatch = '\n\n\n';
      const contentLines = 3;
      const result = calculateLinesOfParagraph(preLinesMatch, contentLines);
      expect(result).toBe(4); // 3 - 2 + 3 = 4
    });

    it('处理空内容', () => {
      const preLinesMatch = '\n\n';
      const contentLines = 0;
      const result = calculateLinesOfParagraph(preLinesMatch, contentLines);
      expect(result).toBe(0); // 2 - 2 + 0 = 0
    });
  });
});
