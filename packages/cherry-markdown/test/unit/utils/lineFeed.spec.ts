/**
 * lineFeed.js 单元测试
 * 测试换行相关工具函数
 */
import { describe, expect, it } from 'vitest';
import { prependLineFeedForParagraph, calculateLinesOfParagraph } from '../../../src/utils/lineFeed';

describe('utils/lineFeed', () => {
  describe('prependLineFeedForParagraph', () => {
    it('不以换行开头时直接返回内容', () => {
      expect(prependLineFeedForParagraph('hello', '<p>hello</p>')).toBe('<p>hello</p>');
      expect(prependLineFeedForParagraph('abc', 'content')).toBe('content');
    });

    it('以换行开头时添加两个换行（默认）', () => {
      expect(prependLineFeedForParagraph('\nhello', '<p>hello</p>')).toBe('\n\n<p>hello</p>');
      expect(prependLineFeedForParagraph('\n\nhello', '<p>hello</p>')).toBe('\n\n<p>hello</p>');
    });

    describe('canNestedInList = true', () => {
      it('单个换行时只添加一个换行', () => {
        expect(prependLineFeedForParagraph('\nhello', '<p>hello</p>', true)).toBe('\n<p>hello</p>');
      });

      it('两个或更多换行时添加两个换行', () => {
        expect(prependLineFeedForParagraph('\n\nhello', '<p>hello</p>', true)).toBe('\n\n<p>hello</p>');
        expect(prependLineFeedForParagraph('\n\n\nhello', '<p>hello</p>', true)).toBe('\n\n<p>hello</p>');
      });
    });

    it('复杂内容测试', () => {
      const match = '\n\n# Title';
      const content = '<h1>Title</h1>';
      expect(prependLineFeedForParagraph(match, content)).toBe('\n\n<h1>Title</h1>');
    });
  });

  describe('calculateLinesOfParagraph', () => {
    it('全文开头（空前置匹配）', () => {
      // 前置匹配为空，表示全文开头
      // 内容 3 行
      expect(calculateLinesOfParagraph('', 3)).toBe(3);
    });

    it('非全文开头需要减去 prependLineFeed 添加的换行', () => {
      // 前置匹配有 4 个换行，减去 2 个 prependLineFeed 添加的，剩 2 个
      // 加上内容 3 行 = 5
      expect(calculateLinesOfParagraph('\n\n\n\n', 3)).toBe(5);
    });

    it('前置只有 2 个换行时', () => {
      // 2 个换行 - 2 = 0，加上内容 1 行 = 1
      expect(calculateLinesOfParagraph('\n\n', 1)).toBe(1);
    });

    it('前置有混合内容', () => {
      // 前置有 2 个换行，减 2 = 0，加内容 5 行 = 5
      expect(calculateLinesOfParagraph('abc\n\n', 5)).toBe(5);
    });

    it('前置有多个换行', () => {
      // 6 个换行 - 2 = 4，加内容 2 行 = 6
      expect(calculateLinesOfParagraph('\n\n\n\n\n\n', 2)).toBe(6);
    });

    it('内容行数为 0', () => {
      expect(calculateLinesOfParagraph('', 0)).toBe(0);
      expect(calculateLinesOfParagraph('\n\n', 0)).toBe(0);
    });
  });

  describe('组合使用', () => {
    it('模拟段落处理流程', () => {
      // 模拟一个段落处理场景
      const match = '\n\nHello World';
      const processedContent = '<p>Hello World</p>';

      // 步骤 1: 添加换行前缀
      const withLineFeed = prependLineFeedForParagraph(match, processedContent);
      expect(withLineFeed).toBe('\n\n<p>Hello World</p>');

      // 步骤 2: 计算行数（假设有前置内容）
      const preLinesMatch = 'some content\n\n';
      const contentLines = 1; // <p>Hello World</p> 是 1 行
      const totalLines = calculateLinesOfParagraph(preLinesMatch, contentLines);
      expect(totalLines).toBe(1); // 2 换行 - 2 + 1 = 1
    });
  });
});
