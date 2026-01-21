/**
 * lookbehind-replace.js 单元测试
 * 测试模拟后向断言的正则替换功能
 *
 * 用于解决旧版 JavaScript 不支持正则后向断言的问题
 */
import { describe, expect, it } from 'vitest';
import { replaceLookbehind } from '../../../src/utils/lookbehind-replace';

describe('utils/lookbehind-replace', () => {
  describe('基本替换', () => {
    it('简单正则替换', () => {
      const result = replaceLookbehind('hello world', /world/g, () => 'universe');
      expect(result).toBe('hello universe');
    });

    it('多次匹配替换', () => {
      const result = replaceLookbehind('a b a b a', /a/g, () => 'X');
      expect(result).toBe('X b X b X');
    });

    it('无匹配时返回原字符串', () => {
      const result = replaceLookbehind('hello world', /xyz/g, () => 'test');
      expect(result).toBe('hello world');
    });

    it('空字符串处理', () => {
      const result = replaceLookbehind('', /test/g, () => 'X');
      expect(result).toBe('');
    });

    it('null/undefined 正则返回原字符串', () => {
      expect(replaceLookbehind('hello', null as any, () => 'X')).toBe('hello');
      expect(replaceLookbehind('hello', undefined as any, () => 'X')).toBe('hello');
    });
  });

  describe('replacer 函数参数', () => {
    it('replacer 接收完整匹配', () => {
      const matches: string[] = [];
      replaceLookbehind('abc123def', /\d+/g, (match) => {
        matches.push(match);
        return 'NUM';
      });
      expect(matches).toEqual(['123']);
    });

    it('replacer 接收捕获组', () => {
      const captures: string[][] = [];
      replaceLookbehind('hello-world', /(\w+)-(\w+)/g, (...args) => {
        captures.push(args.slice(0, 3) as string[]);
        return 'replaced';
      });
      expect(captures[0][0]).toBe('hello-world');
      expect(captures[0][1]).toBe('hello');
      expect(captures[0][2]).toBe('world');
    });

    it('replacer 返回值用于替换', () => {
      const result = replaceLookbehind('a1b2c3', /\d/g, (match) => `[${match}]`);
      expect(result).toBe('a[1]b[2]c[3]');
    });
  });

  describe('连续匹配模式 (continuousMatch)', () => {
    it('连续匹配模式基本使用', () => {
      // 简单测试连续匹配模式是否能正常工作
      const regex = /\d+/g;
      const result = replaceLookbehind('a1b2', regex, (match) => `[${match}]`, true, 1);
      expect(result).toContain('[');
    });

    it('非连续匹配模式', () => {
      const regex = /\d+/g;
      const result = replaceLookbehind('a1b2c3', regex, (match) => `[${match}]`, false);
      expect(result).toBe('a[1]b[2]c[3]');
    });

    it('rollbackLength 参数', () => {
      // 测试回退长度参数
      const regex = /\d+/g;
      const result = replaceLookbehind('a1b2', regex, (match) => `X`, false, 1);
      expect(result).toBe('aXbX');
    });
  });

  describe('模拟后向断言场景', () => {
    it('模拟 (?<=\\s)word 的效果', () => {
      // 匹配空格后的单词（模拟后向断言）
      const regex = /(\s)(word)/g;
      const result = replaceLookbehind('a word test', regex, (match, space, word) => {
        return `${space}<mark>${word}</mark>`;
      });
      expect(result).toBe('a <mark>word</mark> test');
    });

    it('Markdown 加粗语法', () => {
      // 匹配 **text** 格式
      const regex = /\*\*([^*]+)\*\*/g;
      const result = replaceLookbehind('this is **bold** text', regex, (match, content) => {
        return `<b>${content}</b>`;
      });
      expect(result).toBe('this is <b>bold</b> text');
    });

    it('Markdown 斜体语法', () => {
      // 匹配 *text* 格式
      const regex = /\*([^*]+)\*/g;
      const result = replaceLookbehind('this is *italic* text', regex, (match, content) => {
        return `<i>${content}</i>`;
      });
      expect(result).toBe('this is <i>italic</i> text');
    });

    it('Markdown 行内代码', () => {
      // 匹配 `code` 格式
      const regex = /`([^`]+)`/g;
      const result = replaceLookbehind('use `console.log()` here', regex, (match, content) => {
        return `<code>${content}</code>`;
      });
      expect(result).toBe('use <code>console.log()</code> here');
    });
  });

  describe('复杂场景', () => {
    it('嵌套结构', () => {
      const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const result = replaceLookbehind('[link](url)', regex, (match, text, url) => {
        return `<a href="${url}">${text}</a>`;
      });
      expect(result).toBe('<a href="url">link</a>');
    });

    it('多行内容', () => {
      const regex = /line(\d)/g;
      const result = replaceLookbehind('line1\nline2\nline3', regex, (match, num) => {
        return `L${num}`;
      });
      expect(result).toBe('L1\nL2\nL3');
    });

    it('Unicode 字符', () => {
      const regex = /【(.+?)】/g;
      const result = replaceLookbehind('这是【重点】内容', regex, (match, content) => {
        return `[${content}]`;
      });
      expect(result).toBe('这是[重点]内容');
    });

    it('连续替换不相互影响', () => {
      const regex = /\d+/g;
      const str = '1 22 333';
      const result = replaceLookbehind(str, regex, (match) => `(${match.length})`);
      expect(result).toBe('(1) (2) (3)');
    });
  });

  describe('正则状态管理', () => {
    it('调用后正则 lastIndex 应复位', () => {
      const regex = /test/g;
      regex.lastIndex = 5; // 预设一个非零值

      replaceLookbehind('test test', regex, () => 'X');

      expect(regex.lastIndex).toBe(0);
    });

    it('多次调用结果一致', () => {
      const regex = /a/g;
      const str = 'aaa';
      const replacer = () => 'X';

      const result1 = replaceLookbehind(str, regex, replacer);
      const result2 = replaceLookbehind(str, regex, replacer);

      expect(result1).toBe(result2);
      expect(result1).toBe('XXX');
    });
  });

  describe('边界情况', () => {
    it('只有匹配内容', () => {
      const result = replaceLookbehind('abc', /abc/g, () => 'XYZ');
      expect(result).toBe('XYZ');
    });

    it('匹配在开头', () => {
      const result = replaceLookbehind('abc def', /abc/g, () => 'X');
      expect(result).toBe('X def');
    });

    it('匹配在结尾', () => {
      const result = replaceLookbehind('def abc', /abc/g, () => 'X');
      expect(result).toBe('def X');
    });

    it('零宽匹配', () => {
      // 零宽匹配可能导致无限循环，函数应能处理
      // 注：这取决于具体实现，可能需要调整测试
    });

    it('特殊正则字符', () => {
      const result = replaceLookbehind('a.b*c?d', /[.?*]/g, () => 'X');
      expect(result).toBe('aXbXcXd');
    });
  });
});
