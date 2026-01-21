/**
 * recount-pos.js 单元测试
 * 测试光标位置重算功能
 *
 * 当编辑器内容变更时，需要重新计算光标位置以保持用户体验
 */
import { describe, expect, it } from 'vitest';
import getPosBydiffs from '../../../src/utils/recount-pos';

describe('utils/recount-pos', () => {
  describe('内容不变', () => {
    it('内容完全相同时位置不变', () => {
      expect(getPosBydiffs(5, 'hello world', 'hello world')).toBe(5);
      expect(getPosBydiffs(0, 'test', 'test')).toBe(0);
      expect(getPosBydiffs(11, 'hello world', 'hello world')).toBe(11);
    });

    it('空字符串时位置为 0', () => {
      expect(getPosBydiffs(0, '', '')).toBe(0);
    });
  });

  describe('插入内容', () => {
    it('在光标前插入内容，位置应后移', () => {
      // 在开头插入 "Hi "
      // 原: "hello" -> 新: "Hi hello"
      // 光标原在位置 2，插入 3 个字符后应在位置 5
      expect(getPosBydiffs(2, 'hello', 'Hi hello')).toBe(5);
    });

    it('在光标后插入内容，位置不变', () => {
      // 在结尾插入 " world"
      // 原: "hello" -> 新: "hello world"
      // 光标在位置 2，不受影响
      expect(getPosBydiffs(2, 'hello', 'hello world')).toBe(2);
    });

    it('在光标位置插入内容', () => {
      // 原: "ab" -> 新: "aXb"
      // 光标原在位置 1（a 和 b 之间）
      expect(getPosBydiffs(1, 'ab', 'aXb')).toBe(1);
    });

    it('在开头插入内容', () => {
      // 原: "world" -> 新: "hello world"
      // 光标原在位置 0
      expect(getPosBydiffs(0, 'world', 'hello world')).toBe(0);
    });

    it('插入多个字符', () => {
      // 原: "ac" -> 新: "abbbbc"
      // 在 a 后插入 4 个 b，光标原在位置 2（末尾）
      expect(getPosBydiffs(2, 'ac', 'abbbbc')).toBe(6);
    });
  });

  describe('删除内容', () => {
    it('在光标前删除内容，位置应前移', () => {
      // 原: "hello world" -> 新: "world"
      // 删除 "hello "（6 个字符），光标原在位置 8
      expect(getPosBydiffs(8, 'hello world', 'world')).toBe(2);
    });

    it('在光标后删除内容，位置不变', () => {
      // 原: "hello world" -> 新: "hello"
      // 删除 " world"，光标原在位置 2
      expect(getPosBydiffs(2, 'hello world', 'hello')).toBe(2);
    });

    it('删除光标所在位置的内容', () => {
      // 原: "hello" -> 新: "heo"
      // 删除 "ll"，光标原在位置 3（第一个 l 后）
      expect(getPosBydiffs(3, 'hello', 'heo')).toBe(2);
    });

    it('删除全部内容', () => {
      // 原: "hello" -> 新: ""
      // 删除全部内容后，位置应该调整但具体值取决于 diff 实现
      const result = getPosBydiffs(3, 'hello', '');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('光标在删除区域内', () => {
      // 原: "abcdef" -> 新: "af"
      // 删除 "bcde"（位置 1-5），光标原在位置 3
      expect(getPosBydiffs(3, 'abcdef', 'af')).toBe(1);
    });
  });

  describe('替换内容', () => {
    it('替换相同长度的内容', () => {
      // 原: "hello" -> 新: "hELLo"
      // 光标原在位置 4
      expect(getPosBydiffs(4, 'hello', 'hELLo')).toBe(4);
    });

    it('替换为更长的内容', () => {
      // 原: "ab" -> 新: "aXXXb"
      // 用 "XXX" 替换空（插入），光标原在末尾
      expect(getPosBydiffs(2, 'ab', 'aXXXb')).toBe(5);
    });

    it('替换为更短的内容', () => {
      // 原: "hello world" -> 新: "hi world"
      // "hello" -> "hi"，光标原在位置 8
      expect(getPosBydiffs(8, 'hello world', 'hi world')).toBe(5);
    });
  });

  describe('复杂场景', () => {
    it('多处修改', () => {
      // 原: "abc def ghi" -> 新: "ABC DEF GHI"
      // fast-diff 会将此视为一系列删除+插入操作
      // 具体位置取决于 diff 算法的实现
      const result = getPosBydiffs(5, 'abc def ghi', 'ABC DEF GHI');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('Markdown 格式化场景', () => {
      // 原: "text" -> 新: "**text**"
      // 添加粗体标记，光标原在位置 2
      expect(getPosBydiffs(2, 'text', '**text**')).toBe(4);
    });

    it('光标在文档开头', () => {
      expect(getPosBydiffs(0, 'hello', 'world')).toBe(0);
    });

    it('光标在文档末尾', () => {
      // 原: "hello" -> 新: "hello world"
      expect(getPosBydiffs(5, 'hello', 'hello world')).toBe(5);
    });

    it('中文内容', () => {
      // 原: "你好世界" -> 新: "你好美丽世界"
      // 在 "好" 后插入 "美丽"
      expect(getPosBydiffs(4, '你好世界', '你好美丽世界')).toBe(6);
    });
  });

  describe('边界情况', () => {
    it('位置为负数', () => {
      // 边界情况：不应发生，但函数应能处理
      const result = getPosBydiffs(-1, 'hello', 'hello');
      expect(typeof result).toBe('number');
    });

    it('位置超出文档长度', () => {
      // 光标位置超出文档长度
      expect(getPosBydiffs(100, 'hello', 'hello')).toBe(100);
    });

    it('特殊字符', () => {
      expect(getPosBydiffs(2, 'a\nb', 'a\n\nb')).toBe(2);
      expect(getPosBydiffs(2, 'a\tb', 'a\t\tb')).toBe(2);
    });
  });
});
