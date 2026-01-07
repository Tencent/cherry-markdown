import { describe, expect, it } from 'vitest';
import {
  escapeHTMLSpecialChar,
  unescapeHTMLSpecialChar,
  escapeHTMLSpecialCharOnce,
  convertHTMLNumberToName,
  unescapeHTMLNumberEntities,
  unescapeHTMLHexEntities,
  isValidScheme,
  encodeURIComponentRFC3986,
  encodeURIOnce,
  escapeHTMLEntitiesWithoutSemicolon,
  whiteList,
} from '../../src/utils/sanitize';

describe('utils/sanitize', () => {
  describe('escapeHTMLSpecialChar', () => {
    it('转义HTML特殊字符', () => {
      const cases = [
        ['<div>', '&lt;div&gt;'],
        ['&test', '&amp;test'],
        ['"quote"', '&quot;quote&quot;'],
      ];
      cases.forEach(([input, expected]) => {
        expect(escapeHTMLSpecialChar(input)).toBe(expected);
      });
    });

    it('处理enableQuote参数', () => {
      expect(escapeHTMLSpecialChar('<div>"test"', false)).toBe('&lt;div&gt;&quot;test&quot;');
      expect(escapeHTMLSpecialChar('<div>"test"', true)).toBe('&lt;div&gt;"test"');
    });

    it('处理空值和非字符串输入', () => {
      const cases = ['', null, undefined];
      cases.forEach((input) => {
        expect(escapeHTMLSpecialChar(input as any)).toBe('');
      });
    });

    it('不转义映射表外的字符', () => {
      expect(escapeHTMLSpecialChar('hello')).toBe('hello');
      expect(escapeHTMLSpecialChar('hello world')).toBe('hello world');
    });
  });

  describe('unescapeHTMLSpecialChar', () => {
    it('反转义HTML特殊字符', () => {
      const cases = [
        ['&lt;div&gt;', '<div>'],
        ['&amp;test', '&test'],
        ['&quot;quote&quot;', '"quote"'],
      ];
      cases.forEach(([input, expected]) => {
        expect(unescapeHTMLSpecialChar(input)).toBe(expected);
      });
    });

    it('处理空值和非字符串输入', () => {
      const cases = ['', null, undefined];
      cases.forEach((input) => {
        expect(unescapeHTMLSpecialChar(input as any)).toBe('');
      });
    });
  });

  describe('escapeHTMLSpecialCharOnce', () => {
    it('仅转义一次HTML特殊字符', () => {
      expect(escapeHTMLSpecialCharOnce('<div>')).toBe('&lt;div&gt;');
      expect(escapeHTMLSpecialCharOnce('&lt;div&gt;')).toBe('&lt;div&gt;');
    });
  });

  describe('convertHTMLNumberToName', () => {
    it('转换HTML数字实体为命名实体', () => {
      const cases = [
        ['&#34;', '&quot;'],
        ['&#38;', '&amp;'],
        ['&#60;', '&lt;'],
      ];
      cases.forEach(([input, expected]) => {
        expect(convertHTMLNumberToName(input)).toBe(expected);
      });
    });

    it('保留未知实体不变', () => {
      expect(convertHTMLNumberToName('&#999;')).toBe('&#999;');
    });
  });

  describe('unescapeHTMLNumberEntities', () => {
    it('反转义HTML数字实体', () => {
      const cases = [
        ['&#34;', '"'],
        ['&#38;', '&'],
        ['&#60;', '<'],
      ];
      cases.forEach(([input, expected]) => {
        expect(unescapeHTMLNumberEntities(input)).toBe(expected);
      });
    });

    it('处理Unicode字符', () => {
      const cases = [
        ['&#169;', '©'],
        ['&#8364;', '€'],
      ];
      cases.forEach(([input, expected]) => {
        expect(unescapeHTMLNumberEntities(input)).toBe(expected);
      });
    });
  });

  describe('unescapeHTMLHexEntities', () => {
    it('反转义HTML十六进制实体', () => {
      const cases = [
        ['&#x22;', '"'],
        ['&#x26;', '&'],
        ['&#x3C;', '<'],
      ];
      cases.forEach(([input, expected]) => {
        expect(unescapeHTMLHexEntities(input)).toBe(expected);
      });
    });

    it('处理Unicode字符', () => {
      const cases = [
        ['&#xA9;', '©'],
        ['&#x20AC;', '€'],
      ];
      cases.forEach(([input, expected]) => {
        expect(unescapeHTMLHexEntities(input)).toBe(expected);
      });
    });
  });

  describe('isValidScheme', () => {
    it('安全的协议返回true', () => {
      expect(isValidScheme('http://example.com')).toBe(true);
      expect(isValidScheme('https://example.com')).toBe(true);
      expect(isValidScheme('ftp://example.com')).toBe(true);
      expect(isValidScheme('//example.com')).toBe(true);
      expect(isValidScheme('mailto:test@example.com')).toBe(true);
    });

    it('危险的协议返回false', () => {
      expect(isValidScheme('javascript:alert(1)')).toBe(false);
      expect(isValidScheme('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('处理协议中的空格', () => {
      expect(isValidScheme('java script:alert(1)')).toBe(false);
      expect(isValidScheme('javascript:alert(1)')).toBe(false);
    });
  });

  describe('encodeURIComponentRFC3986', () => {
    it('按RFC3986编码URI组件', () => {
      const cases = [
        ['hello world', 'hello%20world'],
        ['!@#$', '%21%40%23%24'],
        ['test*', 'test%2a'],
      ];
      cases.forEach(([input, expected]) => {
        expect(encodeURIComponentRFC3986(input)).toBe(expected);
      });
    });
  });

  describe('encodeURIOnce', () => {
    it('仅编码一次URI', () => {
      const cases = [
        ['hello world', 'hello%20world'],
        ['hello%20world', 'hello%20world'],
      ];
      cases.forEach(([input, expected]) => {
        expect(encodeURIOnce(input)).toBe(expected);
      });
    });
  });

  describe('escapeHTMLEntitiesWithoutSemicolon', () => {
    it('转义无分号的HTML实体', () => {
      const cases = [
        ['&lt', '&amp;lt'],
        ['&gt', '&amp;gt'],
        ['&#34', '&amp;#34'],
      ];
      cases.forEach(([input, expected]) => {
        expect(escapeHTMLEntitiesWithoutSemicolon(input)).toBe(expected);
      });
    });

    it('保留有效的HTML实体', () => {
      const cases = [
        ['&lt;', '&lt;'],
        ['&gt;', '&gt;'],
        ['&amp;', '&amp;'],
      ];
      cases.forEach(([input, expected]) => {
        expect(escapeHTMLEntitiesWithoutSemicolon(input)).toBe(expected);
      });
    });

    it('处理空值和非字符串输入', () => {
      const cases = ['', null, undefined];
      cases.forEach((input) => {
        expect(escapeHTMLEntitiesWithoutSemicolon(input as any)).toBe('');
      });
    });
  });

  describe('whiteList', () => {
    it('匹配允许的块级标签', () => {
      const cases = ['div ', 'article ', 'section'];
      cases.forEach((tag) => {
        expect(whiteList.test(tag)).toBe(true);
      });
    });

    it('匹配允许的内联标签', () => {
      const cases = ['span ', 'a ', 'strong'];
      cases.forEach((tag) => {
        expect(whiteList.test(tag)).toBe(true);
      });
    });

    it('匹配内联块标签', () => {
      const cases = ['br ', 'img', 'hr'];
      cases.forEach((tag) => {
        expect(whiteList.test(tag)).toBe(true);
      });
    });

    it('不匹配禁止的标签', () => {
      const cases = ['script ', 'style', 'iframe'];
      cases.forEach((tag) => {
        expect(whiteList.test(tag)).toBe(false);
      });
    });
  });
});
