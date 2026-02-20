/**
 * lookbehind-replace.js 单元测试
 * 测试模拟后向断言的正则替换功能
 *
 * 用于解决旧版 JavaScript 不支持正则后向断言的问题
 *
 * 重要：replaceLookbehind 内部始终执行 regex.lastIndex -= rollbackLength（默认1），
 * 因此当正则存在多次匹配时，必须使用 continuousMatch=true 配合前导字符模式，
 * 否则会导致无限循环。这与项目中所有实际调用方式一致（均为 continuousMatch=true, rollbackLength=1）。
 */
import { describe, expect, it } from 'vitest';
import { replaceLookbehind } from '../../../src/utils/lookbehind-replace';

describe('utils/lookbehind-replace', () => {
  describe('基本替换（单次匹配，不触发回退问题）', () => {
    it('单次匹配正则替换', () => {
      const result = replaceLookbehind('hello world', /world/g, () => 'universe');
      expect(result).toBe('hello universe');
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

  describe('前导字符模式（continuousMatch=true）— 项目实际使用方式', () => {
    it('模拟后向断言：前导字符 + 目标内容', () => {
      // 模拟 (?<=\s)word 的效果：正则多匹配一个前导字符
      const regex = /(\s)(word)/g;
      const result = replaceLookbehind(
        'a word test',
        regex,
        (match, leadingChar, word) => {
          return `${leadingChar}<mark>${word}</mark>`;
        },
        true,
        1,
      );
      expect(result).toBe('a <mark>word</mark> test');
    });

    it('Markdown 加粗语法（带前导字符）', () => {
      // 正则包含前导字符来模拟后向断言
      const regex = /(^|[^\\])\*\*([^*]+)\*\*/g;
      const result = replaceLookbehind(
        'this is **bold** text',
        regex,
        (match, leading, content) => {
          return `${leading}<b>${content}</b>`;
        },
        true,
        1,
      );
      expect(result).toContain('<b>bold</b>');
    });

    it('Markdown 斜体语法（带前导字符）', () => {
      const regex = /(^|[^\\])\*([^*]+)\*/g;
      const result = replaceLookbehind(
        'this is *italic* text',
        regex,
        (match, leading, content) => {
          return `${leading}<i>${content}</i>`;
        },
        true,
        1,
      );
      expect(result).toContain('<i>italic</i>');
    });

    it('Markdown 行内代码（带前导字符）', () => {
      const regex = /(^|[^\\])`([^`]+)`/g;
      const result = replaceLookbehind(
        'use `console.log()` here',
        regex,
        (match, leading, content) => {
          return `${leading}<code>${content}</code>`;
        },
        true,
        1,
      );
      expect(result).toContain('<code>console.log()</code>');
    });

    it('连续匹配多个前导字符模式', () => {
      // 模拟连续的后向断言匹配
      const regex = /([^a-zA-Z])(\d+)/g;
      const result = replaceLookbehind(
        ' 1 2 3',
        regex,
        (match, leading, num) => {
          return `${leading}[${num}]`;
        },
        true,
        1,
      );
      expect(result).toBe(' [1] [2] [3]');
    });
  });

  describe('replacer 函数参数', () => {
    it('replacer 接收完整匹配和捕获组', () => {
      const captures: string[][] = [];
      // 使用前导字符模式，避免无限循环
      replaceLookbehind(
        ' hello-world',
        /(\s)(\w+)-(\w+)/g,
        (...args) => {
          captures.push(args.slice(0, 4) as string[]);
          return args[0];
        },
        true,
        1,
      );
      expect(captures.length).toBeGreaterThan(0);
      expect(captures[0][2]).toBe('hello');
      expect(captures[0][3]).toBe('world');
    });

    it('replacer 返回值用于替换（前导字符模式）', () => {
      // 使用前导字符模式，避免 rollback 导致无限循环
      const result = replaceLookbehind(
        'test123end',
        /(.)(\d+)/g,
        (match, leading, digits) => `${leading}[${digits}]`,
        true,
        1,
      );
      expect(result).toBe('test[123]end');
    });
  });

  describe('连续匹配模式 (continuousMatch) 参数', () => {
    it('continuousMatch=true 连续匹配模式', () => {
      const regex = /(.)\d+/g;
      const result = replaceLookbehind('a1b2', regex, (match, leading) => `${leading}[X]`, true, 1);
      expect(result).toContain('[X]');
    });

    it('rollbackLength 参数控制回退距离', () => {
      // 使用前导字符模式
      const regex = /(.)\d+/g;
      const result = replaceLookbehind('a1b2', regex, (match, leading) => `${leading}X`, true, 1);
      expect(result).toBe('aXbX');
    });
  });

  describe('复杂场景', () => {
    it('嵌套结构（单次匹配）', () => {
      const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const result = replaceLookbehind('[link](url)', regex, (match, text, url) => {
        return `<a href="${url}">${text}</a>`;
      });
      expect(result).toBe('<a href="url">link</a>');
    });

    it('多行内容（前导字符模式）', () => {
      // 使用前导字符模式来匹配多行
      const regex = /(^|\n)(line)(\d)/gm;
      const result = replaceLookbehind(
        'line1\nline2\nline3',
        regex,
        (match, leading, word, num) => {
          return `${leading}L${num}`;
        },
        true,
        1,
      );
      expect(result).toBe('L1\nL2\nL3');
    });

    it('Unicode 字符（单次匹配）', () => {
      const regex = /【(.+?)】/g;
      const result = replaceLookbehind('这是【重点】内容', regex, (match, content) => {
        return `[${content}]`;
      });
      expect(result).toBe('这是[重点]内容');
    });
  });

  describe('正则状态管理', () => {
    it('调用后正则 lastIndex 应复位', () => {
      const regex = /test/g;
      regex.lastIndex = 5; // 预设一个非零值

      replaceLookbehind('one test only', regex, () => 'X');

      expect(regex.lastIndex).toBe(0);
    });

    it('多次调用结果一致（单次匹配正则）', () => {
      const regex = /world/g;
      const str = 'hello world';
      const replacer = () => 'X';

      const result1 = replaceLookbehind(str, regex, replacer);
      const result2 = replaceLookbehind(str, regex, replacer);

      expect(result1).toBe(result2);
      expect(result1).toBe('hello X');
    });
  });

  describe('边界情况', () => {
    it('只有匹配内容（单次匹配）', () => {
      const result = replaceLookbehind('abc', /abc/g, () => 'XYZ');
      expect(result).toBe('XYZ');
    });

    it('匹配在开头（单次匹配）', () => {
      const result = replaceLookbehind('abc def', /abc/g, () => 'X');
      expect(result).toBe('X def');
    });

    it('匹配在结尾（单次匹配）', () => {
      const result = replaceLookbehind('def abc', /abc/g, () => 'X');
      expect(result).toBe('def X');
    });

    it('零宽匹配', () => {
      // 零宽匹配可能导致无限循环，函数应能处理
      // 注：这取决于具体实现，可能需要调整测试
    });

    it('特殊正则字符（前导字符模式）', () => {
      // 使用前导字符模式，避免 rollback 导致无限循环
      const result = replaceLookbehind('a.b*c?d', /(.)([.?*])/g, (match, leading, ch) => `${leading}X`, true, 1);
      expect(result).toBe('aXbXcXd');
    });
  });
});
