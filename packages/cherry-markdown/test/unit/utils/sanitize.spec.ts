/**
 * sanitize.js 单元测试
 * 测试 HTML 转义和安全相关函数
 */
import { describe, expect, it } from 'vitest';
import {
  escapeHTMLSpecialChar,
  unescapeHTMLSpecialChar,
  escapeHTMLSpecialCharOnce,
  escapeHTMLEntitiesWithoutSemicolon,
  convertHTMLNumberToName,
  unescapeHTMLNumberEntities,
  unescapeHTMLHexEntities,
  isValidScheme,
  encodeURIComponentRFC3986,
  encodeURIOnce,
} from '../../../src/utils/sanitize';

describe('utils/sanitize', () => {
  describe('escapeHTMLSpecialChar', () => {
    it('应该转义 < > &', () => {
      expect(escapeHTMLSpecialChar('<script>')).toBe('&lt;script&gt;');
      expect(escapeHTMLSpecialChar('a & b')).toBe('a &amp; b');
      expect(escapeHTMLSpecialChar('<div>test</div>')).toBe('&lt;div&gt;test&lt;/div&gt;');
    });

    it('默认应该转义引号', () => {
      expect(escapeHTMLSpecialChar('"hello"')).toBe('&quot;hello&quot;');
      expect(escapeHTMLSpecialChar("'world'")).toBe('&#x27;world&#x27;');
    });

    it('enableQuote=true 时不转义引号', () => {
      expect(escapeHTMLSpecialChar('"hello"', true)).toBe('"hello"');
      expect(escapeHTMLSpecialChar("'world'", true)).toBe("'world'");
    });

    it('非字符串输入返回空字符串', () => {
      expect(escapeHTMLSpecialChar(null as any)).toBe('');
      expect(escapeHTMLSpecialChar(undefined as any)).toBe('');
      expect(escapeHTMLSpecialChar(123 as any)).toBe('');
    });

    it('复合测试', () => {
      expect(escapeHTMLSpecialChar('<a href="test">link</a>')).toBe(
        '&lt;a href=&quot;test&quot;&gt;link&lt;/a&gt;'
      );
    });
  });

  describe('unescapeHTMLSpecialChar', () => {
    it('应该还原转义字符', () => {
      expect(unescapeHTMLSpecialChar('&lt;script&gt;')).toBe('<script>');
      expect(unescapeHTMLSpecialChar('a &amp; b')).toBe('a & b');
      expect(unescapeHTMLSpecialChar('&quot;hello&quot;')).toBe('"hello"');
    });

    it('应该还原单引号', () => {
      expect(unescapeHTMLSpecialChar('&apos;world&apos;')).toBe("'world'");
    });

    it('非字符串输入返回空字符串', () => {
      expect(unescapeHTMLSpecialChar(null as any)).toBe('');
      expect(unescapeHTMLSpecialChar(undefined as any)).toBe('');
    });

    it('不匹配的实体保持原样', () => {
      expect(unescapeHTMLSpecialChar('&unknown;')).toBe('&unknown;');
    });
  });

  describe('escapeHTMLSpecialCharOnce', () => {
    it('已转义的不重复转义', () => {
      expect(escapeHTMLSpecialCharOnce('&lt;')).toBe('&lt;');
      expect(escapeHTMLSpecialCharOnce('&amp;')).toBe('&amp;');
    });

    it('未转义的正常转义', () => {
      expect(escapeHTMLSpecialCharOnce('<')).toBe('&lt;');
      expect(escapeHTMLSpecialCharOnce('&')).toBe('&amp;');
    });

    it('混合内容正确处理', () => {
      expect(escapeHTMLSpecialCharOnce('&lt; < &amp; &')).toBe('&lt; &lt; &amp; &amp;');
    });
  });

  describe('escapeHTMLEntitiesWithoutSemicolon', () => {
    it('非字符串输入返回空字符串', () => {
      expect(escapeHTMLEntitiesWithoutSemicolon(null as any)).toBe('');
      expect(escapeHTMLEntitiesWithoutSemicolon(123 as any)).toBe('');
    });

    it('合法的命名实体保持原样', () => {
      expect(escapeHTMLEntitiesWithoutSemicolon('&lt;')).toBe('&lt;');
      expect(escapeHTMLEntitiesWithoutSemicolon('&gt;')).toBe('&gt;');
      expect(escapeHTMLEntitiesWithoutSemicolon('&amp;')).toBe('&amp;');
    });

    it('缺少分号的实体应转义', () => {
      expect(escapeHTMLEntitiesWithoutSemicolon('&lt')).toBe('&amp;lt');
    });

    it('不合法的实体应转义', () => {
      expect(escapeHTMLEntitiesWithoutSemicolon('&invalid;')).toBe('&amp;invalid;');
    });

    it('十进制数字实体', () => {
      expect(escapeHTMLEntitiesWithoutSemicolon('&#60;')).toBe('&#60;'); // < 合法
      expect(escapeHTMLEntitiesWithoutSemicolon('&#60')).toBe('&amp;#60'); // 缺分号
    });

    it('十六进制数字实体', () => {
      expect(escapeHTMLEntitiesWithoutSemicolon('&#x3c;')).toBe('&#x3c;'); // < 合法
      expect(escapeHTMLEntitiesWithoutSemicolon('&#x3c')).toBe('&amp;#x3c'); // 缺分号
    });

    it('超长数字实体应转义', () => {
      expect(escapeHTMLEntitiesWithoutSemicolon('&#12345678;')).toBe('&amp;#12345678;');
      expect(escapeHTMLEntitiesWithoutSemicolon('&#x1234567;')).toBe('&amp;#x1234567;');
    });
  });

  describe('convertHTMLNumberToName', () => {
    it('应将数字实体转为命名实体', () => {
      expect(convertHTMLNumberToName('&#60;')).toBe('&lt;');
      expect(convertHTMLNumberToName('&#62;')).toBe('&gt;');
      expect(convertHTMLNumberToName('&#38;')).toBe('&amp;');
      expect(convertHTMLNumberToName('&#34;')).toBe('&quot;');
    });

    it('不在映射表中的保持原样', () => {
      expect(convertHTMLNumberToName('&#9999;')).toBe('&#9999;');
    });
  });

  describe('unescapeHTMLNumberEntities', () => {
    it('应将十进制实体转为字符', () => {
      expect(unescapeHTMLNumberEntities('&#60;')).toBe('<');
      expect(unescapeHTMLNumberEntities('&#62;')).toBe('>');
      expect(unescapeHTMLNumberEntities('&#38;')).toBe('&');
    });

    it('无效 code point 保持原样', () => {
      expect(unescapeHTMLNumberEntities('&#9999999999;')).toBe('&#9999999999;');
    });
  });

  describe('unescapeHTMLHexEntities', () => {
    it('应将十六进制实体转为字符', () => {
      expect(unescapeHTMLHexEntities('&#x3c;')).toBe('<');
      expect(unescapeHTMLHexEntities('&#x3C;')).toBe('<');
      expect(unescapeHTMLHexEntities('&#x3e;')).toBe('>');
    });

    it('大小写混合', () => {
      expect(unescapeHTMLHexEntities('&#xAB;')).toBe('«');
    });
  });

  describe('isValidScheme', () => {
    it('应拒绝 javascript: 协议', () => {
      expect(isValidScheme('javascript:alert(1)')).toBe(false);
      expect(isValidScheme('JAVASCRIPT:alert(1)')).toBe(false);
      expect(isValidScheme('  javascript:alert(1)')).toBe(false);
    });

    it('应拒绝 data: 协议', () => {
      expect(isValidScheme('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('应接受 http/https 协议', () => {
      expect(isValidScheme('http://example.com')).toBe(true);
      expect(isValidScheme('https://example.com')).toBe(true);
    });

    it('应接受相对路径', () => {
      expect(isValidScheme('/path/to/file')).toBe(true);
      expect(isValidScheme('./file.html')).toBe(true);
      expect(isValidScheme('../file.html')).toBe(true);
    });

    it('应接受 mailto/tel 协议', () => {
      expect(isValidScheme('mailto:test@example.com')).toBe(true);
      expect(isValidScheme('tel:+1234567890')).toBe(true);
    });

    it('应检测编码绕过', () => {
      expect(isValidScheme('&#106;avascript:alert(1)')).toBe(false); // j 的十进制
      expect(isValidScheme('&#x6a;avascript:alert(1)')).toBe(false); // j 的十六进制
    });
  });

  describe('encodeURIComponentRFC3986', () => {
    it('应编码特殊字符', () => {
      expect(encodeURIComponentRFC3986('!')).toBe('%21');
      expect(encodeURIComponentRFC3986("'")).toBe('%27');
      expect(encodeURIComponentRFC3986('(')).toBe('%28');
      expect(encodeURIComponentRFC3986(')')).toBe('%29');
      expect(encodeURIComponentRFC3986('*')).toBe('%2a');
    });

    it('普通字符保持原样', () => {
      expect(encodeURIComponentRFC3986('abc')).toBe('abc');
      expect(encodeURIComponentRFC3986('123')).toBe('123');
    });

    it('空格编码为 %20', () => {
      expect(encodeURIComponentRFC3986('hello world')).toBe('hello%20world');
    });
  });

  describe('encodeURIOnce', () => {
    it('普通字符串正常编码', () => {
      expect(encodeURIOnce('hello world')).toBe('hello%20world');
    });

    it('已编码的不重复编码', () => {
      expect(encodeURIOnce('hello%20world')).toBe('hello%20world');
    });

    it('URL 路径编码', () => {
      expect(encodeURIOnce('/path/to/file name.txt')).toBe('/path/to/file%20name.txt');
    });
  });
});
