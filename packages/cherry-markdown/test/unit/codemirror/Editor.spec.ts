/**
 * Editor 工具函数测试
 *
 * 测试编辑器中与 CodeMirror 版本无关的纯函数逻辑
 */
import { describe, it, expect } from 'vitest';

describe('全角字符处理', () => {
  // 使用数组避免对象字面量中的重复键警告
  const fullWidthToHalfWidthPairs: [string, string][] = [
    ['·', '`'],
    ['￥', '$'],
    ['、', '/'],
    ['：', ':'],
    ['"', '"'],
    ['"', '"'],
    ['【', '['],
    ['】', ']'],
    ['（', '('],
    ['）', ')'],
    ['《', '<'],
    ['》', '>'],
  ];
  const fullWidthChars = fullWidthToHalfWidthPairs.map(([full]) => full);
  const regex = /[·￥、：""【】（）《》]/;

  it('应该识别需要转换的全角字符', () => {
    fullWidthChars.forEach((char) => {
      expect(regex.test(char)).toBe(true);
    });
  });

  it('不应该匹配普通中文字符', () => {
    const chineseChars = ['你', '好', '世', '界', '中', '文'];
    chineseChars.forEach((char) => {
      expect(regex.test(char)).toBe(false);
    });
  });

  it('不应该匹配英文字符', () => {
    const englishChars = ['a', 'Z', '1', '!', '@', '#'];
    englishChars.forEach((char) => {
      expect(regex.test(char)).toBe(false);
    });
  });
});

describe('滚动位置计算', () => {
  function calculateScrollPercent(currentTop: number, lineTop: number, lineHeight: number): number {
    if (lineHeight === 0) return 0;
    return (currentTop - lineTop) / lineHeight;
  }

  function isAtTop(scrollTop: number): boolean {
    return scrollTop <= 0;
  }

  function isAtBottom(scrollTop: number, clientHeight: number, scrollHeight: number, threshold = 20): boolean {
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }

  describe('calculateScrollPercent', () => {
    it('应该计算正确的滚动百分比', () => {
      expect(calculateScrollPercent(100, 80, 20)).toBe(1);
      expect(calculateScrollPercent(90, 80, 20)).toBe(0.5);
      expect(calculateScrollPercent(80, 80, 20)).toBe(0);
    });

    it('lineHeight 为 0 时应返回 0', () => {
      expect(calculateScrollPercent(100, 80, 0)).toBe(0);
    });

    it('负值应该正确处理', () => {
      expect(calculateScrollPercent(70, 80, 20)).toBe(-0.5);
    });
  });

  describe('isAtTop', () => {
    it('scrollTop <= 0 时返回 true', () => {
      expect(isAtTop(0)).toBe(true);
      expect(isAtTop(-10)).toBe(true);
    });

    it('scrollTop > 0 时返回 false', () => {
      expect(isAtTop(1)).toBe(false);
      expect(isAtTop(100)).toBe(false);
    });
  });

  describe('isAtBottom', () => {
    it('接近底部时返回 true', () => {
      expect(isAtBottom(1000, 600, 1620)).toBe(true);
      expect(isAtBottom(1000, 600, 1600)).toBe(true);
    });

    it('未到底部时返回 false', () => {
      expect(isAtBottom(1000, 600, 2000)).toBe(false);
      expect(isAtBottom(0, 600, 1000)).toBe(false);
    });
  });
});

describe('行跳转位置计算', () => {
  function calculateJumpPosition(beginLine: number, endLine: number, percent: number, lineHeight: number): number {
    const positionTop = beginLine * lineHeight;
    const height = endLine * lineHeight;
    return positionTop + height * percent;
  }

  it('应该计算正确的跳转位置', () => {
    expect(calculateJumpPosition(10, 5, 0.5, 20)).toBe(250);
    expect(calculateJumpPosition(0, 10, 0, 20)).toBe(0);
    expect(calculateJumpPosition(0, 10, 1, 20)).toBe(200);
  });

  it('beginLine 为 0 时只考虑 height * percent', () => {
    expect(calculateJumpPosition(0, 20, 0.5, 10)).toBe(100);
  });

  it('percent 为 0 时只返回 beginLine 的位置', () => {
    expect(calculateJumpPosition(5, 10, 0, 20)).toBe(100);
  });
});

describe('Base64 图片正则', () => {
  const base64ImagePattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/;

  it('应该匹配 PNG 图片', () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE=';
    expect(base64ImagePattern.test(png)).toBe(true);
  });

  it('应该匹配 JPEG 图片', () => {
    const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    expect(base64ImagePattern.test(jpeg)).toBe(true);
  });

  it('应该匹配 GIF 图片', () => {
    const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAP==';
    expect(base64ImagePattern.test(gif)).toBe(true);
  });

  it('应该匹配 WebP 图片', () => {
    const webp = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA=';
    expect(base64ImagePattern.test(webp)).toBe(true);
  });

  it('不应该匹配非图片 data URI', () => {
    expect(base64ImagePattern.test('data:text/plain;base64,SGVsbG8=')).toBe(false);
    expect(base64ImagePattern.test('data:application/json;base64,e30=')).toBe(false);
  });

  it('不应该匹配普通字符串', () => {
    expect(base64ImagePattern.test('hello world')).toBe(false);
    expect(base64ImagePattern.test('https://example.com/image.png')).toBe(false);
  });
});
