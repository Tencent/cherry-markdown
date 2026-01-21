/**
 * regexp.js 单元测试
 * 测试正则表达式工具函数
 */
import { describe, expect, it } from 'vitest';
import {
  compileRegExp,
  isLookbehindSupported,
  URL_INLINE_NO_SLASH,
  URL_INLINE,
  URL,
  URL_NO_SLASH,
  EMAIL_INLINE,
  EMAIL,
  getTableRule,
  getCodeBlockRule,
  getListFromStr,
  getPanelRule,
  getDetailRule,
  imgBase64Reg,
  base64Reg,
  getValueWithoutCode,
  createUrlReg,
  PUNCTUATION,
  CHINESE_PUNCTUATION,
  HORIZONTAL_WHITESPACE,
} from '@/utils/regexp';

describe('utils/regexp', () => {
  describe('compileRegExp', () => {
    it('编译简单正则', () => {
      const obj = { begin: '^', content: '\\d+', end: '$' };
      const regex = compileRegExp(obj, 'g');

      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.source).toBe('^\\d+$');
      expect(regex.global).toBe(true);
    });

    it('自定义 flags', () => {
      const obj = { begin: '', content: 'hello', end: '' };
      const regex = compileRegExp(obj, 'gi');

      expect(regex.global).toBe(true);
      expect(regex.ignoreCase).toBe(true);
    });

    it('默认 flags 为 g', () => {
      const obj = { begin: '', content: 'test', end: '' };
      const regex = compileRegExp(obj);

      expect(regex.global).toBe(true);
    });

    it('扩展 \\h 为水平空白', () => {
      const obj = { begin: '', content: '\\h+', end: '' };
      const regex = compileRegExp(obj, 'g', true);

      expect(regex.source).toContain(HORIZONTAL_WHITESPACE);
      expect(' '.match(regex)).toBeTruthy();
      expect('\t'.match(regex)).toBeTruthy();
    });

    it('扩展 [\\h] 为水平空白', () => {
      const obj = { begin: '', content: '[\\h]', end: '' };
      const regex = compileRegExp(obj, 'g', true);

      expect(regex.source).toContain(HORIZONTAL_WHITESPACE);
    });

    it('不启用扩展时 \\h 保持原样', () => {
      const obj = { begin: '', content: '\\h', end: '' };
      const regex = compileRegExp(obj, 'g', false);

      expect(regex.source).toBe('\\h');
    });
  });

  describe('isLookbehindSupported', () => {
    it('返回布尔值', () => {
      const result = isLookbehindSupported();
      expect(typeof result).toBe('boolean');
    });

    // 现代环境一般都支持
    it('现代环境应支持后向断言', () => {
      expect(isLookbehindSupported()).toBe(true);
    });
  });

  describe('URL 正则', () => {
    it('ip address', () => {
      const cases = [
        { str: 'http://192.168.1.100', match: '192.168.1.100' },
        { str: 'http://192.168.1.300', match: '192.168.1.30' },
        { str: 'http://192.168.291.100', match: null },
      ];
      cases.forEach((item) => {
        const match = item.str.match(URL_INLINE_NO_SLASH);
        if (!item.match) {
          expect(match).toBe(null);
        } else {
          expect(match![0]).toBe(item.match);
        }
      });
    });

    it('URL_INLINE 匹配 // 开头的 URL', () => {
      expect('//example.com'.match(URL_INLINE)).toBeTruthy();
      expect('//192.168.1.1'.match(URL_INLINE)).toBeTruthy();
    });

    it('URL_INLINE_NO_SLASH 匹配域名', () => {
      expect('example.com'.match(URL_INLINE_NO_SLASH)).toBeTruthy();
      expect('www.example.com'.match(URL_INLINE_NO_SLASH)).toBeTruthy();
      expect('sub.domain.example.com'.match(URL_INLINE_NO_SLASH)).toBeTruthy();
    });

    it('URL_INLINE_NO_SLASH 匹配带端口', () => {
      expect('example.com:8080'.match(URL_INLINE_NO_SLASH)).toBeTruthy();
      expect('192.168.1.1:3000'.match(URL_INLINE_NO_SLASH)).toBeTruthy();
    });

    it('URL_INLINE_NO_SLASH 匹配带路径', () => {
      const match = 'example.com/path/to/resource'.match(URL_INLINE_NO_SLASH);
      expect(match).toBeTruthy();
      expect(match![0]).toContain('/path/to/resource');
    });

    it('URL_INLINE_NO_SLASH 匹配带查询参数', () => {
      const match = 'example.com?key=value'.match(URL_INLINE_NO_SLASH);
      expect(match).toBeTruthy();
    });

    it('URL 完整匹配', () => {
      expect(URL.test('//example.com')).toBe(true);
      expect(URL.test('//192.168.1.1:8080/path')).toBe(true);
    });

    it('URL_NO_SLASH 完整匹配', () => {
      expect(URL_NO_SLASH.test('example.com')).toBe(true);
      expect(URL_NO_SLASH.test('192.168.1.1')).toBe(true);
    });
  });

  describe('EMAIL 正则', () => {
    it('匹配有效邮箱', () => {
      expect(EMAIL.test('user@example.com')).toBe(true);
      expect(EMAIL.test('user.name@example.com')).toBe(true);
      expect(EMAIL.test('user+tag@example.com')).toBe(true);
      expect(EMAIL.test('user@sub.domain.com')).toBe(true);
    });

    it('不匹配无效邮箱', () => {
      expect(EMAIL.test('invalid')).toBe(false);
      expect(EMAIL.test('@example.com')).toBe(false);
      expect(EMAIL.test('user@')).toBe(false);
    });

    it('EMAIL_INLINE 内联匹配', () => {
      const text = 'Contact: user@example.com for info';
      const match = text.match(EMAIL_INLINE);
      expect(match).toBeTruthy();
      expect(match![0]).toBe('user@example.com');
    });
  });

  describe('getTableRule', () => {
    it('返回 strict 和 loose 两种规则', () => {
      const rules = getTableRule(false);
      expect(rules).toHaveProperty('strict');
      expect(rules).toHaveProperty('loose');
      expect(rules.strict).toHaveProperty('reg');
      expect(rules.loose).toHaveProperty('reg');
    });

    it('merge=true 返回合并后的正则', () => {
      const regex = getTableRule(true);
      expect(regex).toBeInstanceOf(RegExp);
    });

    it('strict 规则匹配标准表格', () => {
      const rules = getTableRule(false);
      const table = `
| Header1 | Header2 |
|---------|---------|
| Cell1   | Cell2   |`;
      expect(table.match(rules.strict.reg)).toBeTruthy();
    });

    it('loose 规则匹配简化表格', () => {
      const rules = getTableRule(false);
      const table = `
Header1 | Header2
--------|--------
Cell1   | Cell2`;
      expect(table.match(rules.loose.reg)).toBeTruthy();
    });
  });

  describe('getCodeBlockRule', () => {
    it('返回代码块规则对象', () => {
      const rule = getCodeBlockRule();
      expect(rule).toHaveProperty('begin');
      expect(rule).toHaveProperty('content');
      expect(rule).toHaveProperty('end');
      expect(rule).toHaveProperty('reg');
    });

    it('匹配基本代码块', () => {
      const rule = getCodeBlockRule();
      const code = '```javascript\nconsole.log("hello");\n```';
      expect(code.match(rule.reg)).toBeTruthy();
    });

    it('匹配带语言标识的代码块', () => {
      const rule = getCodeBlockRule();
      const code = '```python\nprint("hello")\n```';
      const match = code.match(rule.reg);
      expect(match).toBeTruthy();
    });

    it('匹配多行代码块', () => {
      const rule = getCodeBlockRule();
      const code = '```\nline1\nline2\nline3\n```';
      expect(code.match(rule.reg)).toBeTruthy();
    });

    it('匹配 4 个反引号的代码块', () => {
      const rule = getCodeBlockRule();
      const code = '````\ncode\n````';
      expect(code.match(rule.reg)).toBeTruthy();
    });
  });

  describe('getListFromStr', () => {
    it('有序列表', () => {
      const result = getListFromStr('Item 1\nItem 2', 'ol');
      expect(result).toContain('1. Item 1');
      expect(result).toContain('2. Item 2');
    });

    it('无序列表', () => {
      const result = getListFromStr('Item 1\nItem 2', 'ul');
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
    });

    it('勾选列表', () => {
      const result = getListFromStr('Task 1\nTask 2', 'checklist');
      expect(result).toContain('- [x] Task 1');
      expect(result).toContain('- [x] Task 2');
    });

    it('空选区使用默认值', () => {
      const result = getListFromStr('', 'ol');
      expect(result).toContain('1. Item 1');
      expect(result).toContain('Item 1.1');
      expect(result).toContain('Item 2');
    });

    it('null 选区使用默认值', () => {
      const result = getListFromStr(null as any, 'ul');
      expect(result).toContain('- Item 1');
    });

    it('保留缩进', () => {
      const result = getListFromStr('Item 1\n    Sub Item', 'ol');
      expect(result).toContain('    ');
    });

    it('移除已有的列表标记', () => {
      const result = getListFromStr('- Item 1\n- Item 2', 'ol');
      expect(result).toContain('1. Item 1');
      expect(result).not.toContain('- ');
    });

    it('处理有序列表标记', () => {
      const result = getListFromStr('1. Item 1\n2. Item 2', 'ul');
      expect(result).toContain('- Item 1');
      expect(result).not.toContain('1.');
    });
  });

  describe('getPanelRule', () => {
    it('返回面板规则对象', () => {
      const rule = getPanelRule();
      expect(rule).toHaveProperty('begin');
      expect(rule).toHaveProperty('content');
      expect(rule).toHaveProperty('end');
      expect(rule).toHaveProperty('reg');
    });

    it('匹配面板语法', () => {
      const rule = getPanelRule();
      const panel = ':::info\nThis is info panel\n:::';
      expect(panel.match(rule.reg)).toBeTruthy();
    });

    it('匹配带标题的面板', () => {
      const rule = getPanelRule();
      const panel = ':::warning Title\nContent here\n:::';
      expect(panel.match(rule.reg)).toBeTruthy();
    });
  });

  describe('getDetailRule', () => {
    it('返回详情规则对象', () => {
      const rule = getDetailRule();
      expect(rule).toHaveProperty('begin');
      expect(rule).toHaveProperty('content');
      expect(rule).toHaveProperty('end');
      expect(rule).toHaveProperty('reg');
    });

    it('匹配手风琴语法', () => {
      const rule = getDetailRule();
      const detail = '+++ Click to expand\nHidden content\n+++';
      expect(detail.match(rule.reg)).toBeTruthy();
    });

    it('匹配默认展开的手风琴', () => {
      const rule = getDetailRule();
      const detail = '+++- Expanded by default\nContent\n+++';
      expect(detail.match(rule.reg)).toBeTruthy();
    });
  });

  describe('Base64 正则', () => {
    it('imgBase64Reg 匹配图片 base64', () => {
      const md = '![alt](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ)';
      expect(md.match(imgBase64Reg)).toBeTruthy();
    });

    it('imgBase64Reg 匹配链接格式的 base64', () => {
      const md = '[name](data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD)';
      expect(md.match(imgBase64Reg)).toBeTruthy();
    });

    it('base64Reg 匹配纯 base64 数据', () => {
      const b64 = 'data:image/png;base64,iVBORw0KGgo=';
      const match = b64.match(base64Reg);
      expect(match).toBeTruthy();
    });
  });

  describe('createUrlReg', () => {
    it('创建 URL 匹配正则', () => {
      const [protocolReg, wwwReg] = createUrlReg(50);
      expect(protocolReg).toBeInstanceOf(RegExp);
      expect(wwwReg).toBeInstanceOf(RegExp);
    });

    it('匹配长 URL', () => {
      const [protocolReg] = createUrlReg(20);
      const md = '](https://example.com/very/long/path/to/resource)';
      expect(md.match(protocolReg)).toBeTruthy();
    });

    it('匹配 www 开头的 URL', () => {
      const [, wwwReg] = createUrlReg(20);
      const md = '](www.example.com/very/long/path/to/resource)';
      expect(md.match(wwwReg)).toBeTruthy();
    });

    it('短 URL 不匹配', () => {
      const [protocolReg] = createUrlReg(100);
      const md = '](https://example.com)';
      expect(md.match(protocolReg)).toBeFalsy();
    });
  });

  describe('getValueWithoutCode', () => {
    it('移除代码块内容', () => {
      const input = 'text\n```\ncode\n```\nmore text';
      const result = getValueWithoutCode(input);
      expect(result).not.toContain('code');
    });

    it('处理行内代码', () => {
      const input = 'text `![image](url)` text';
      const result = getValueWithoutCode(input);
      // 行内代码中的特殊字符应被替换
      expect(result).not.toContain('![');
    });

    it('空输入返回空字符串', () => {
      expect(getValueWithoutCode()).toBe('');
      expect(getValueWithoutCode('')).toBe('');
    });
  });

  describe('常量', () => {
    it('PUNCTUATION 匹配标点', () => {
      const regex = new RegExp(PUNCTUATION, 'g');
      expect('!'.match(regex)).toBeTruthy();
      expect('@'.match(regex)).toBeTruthy();
      expect('#'.match(regex)).toBeTruthy();
      expect('a'.match(regex)).toBeFalsy();
    });

    it('CHINESE_PUNCTUATION 匹配中文标点', () => {
      const regex = new RegExp(CHINESE_PUNCTUATION, 'g');
      expect('！'.match(regex)).toBeTruthy();
      expect('？'.match(regex)).toBeTruthy();
      expect('。'.match(regex)).toBeTruthy();
      expect('a'.match(regex)).toBeFalsy();
    });

    it('HORIZONTAL_WHITESPACE 匹配空白', () => {
      const regex = new RegExp(HORIZONTAL_WHITESPACE, 'g');
      expect(' '.match(regex)).toBeTruthy();
      expect('\t'.match(regex)).toBeTruthy();
      expect('\n'.match(regex)).toBeFalsy();
    });
  });
});
