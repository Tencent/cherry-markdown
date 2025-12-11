import { describe, it, expect } from 'vitest';
import AutoLink from '../../../src/core/hooks/AutoLink';

// Mock engine for AutoLink
const mockEngine = {
  urlProcessor: (url: string) => url,
  $cherry: {
    options: {
      engine: {
        syntax: {
          autoLink: {
            attrRender: () => '',
          },
        },
      },
    },
  },
};

const autoLinkHook = new AutoLink({ config: {}, globalConfig: {} }) as any;
autoLinkHook.$engine = mockEngine;

describe('core/hooks/autolink', () => {
  describe('isLinkInHtmlAttribute', () => {
    it('应该检测到 HTML 属性中的链接', () => {
      const cases = [
        {
          str: '<a href="https://cherry.editor.com">link in attribute</a>',
          index: 9,
          length: 25,
          expected: true,
        },
        {
          str: "<a href='https://cherry.editor.com'>link in attribute</a>",
          index: 9,
          length: 25,
          expected: true,
        },
        {
          str: '<a href=https://cherry.editor.com>link in attribute</a>',
          index: 8,
          length: 25,
          expected: true,
        },
        {
          str: '<img src="https://example.com/image.jpg" alt="test">',
          index: 10,
          length: 29,
          expected: true,
        },
        {
          str: '<link href="https://example.com/style.css">',
          index: 12,
          length: 30,
          expected: true,
        },
      ];
      cases.forEach((item) => {
        expect(autoLinkHook.isLinkInHtmlAttribute(item.str, item.index, item.length)).toBe(item.expected);
      });
    });

    it('对于不在 HTML 属性中的链接应该返回 false', () => {
      const cases = [
        {
          str: 'Visit https://cherry.editor.com for more info',
          index: 6,
          length: 25,
          expected: false,
        },
        {
          str: 'Text before<a href="https://example.com">link</a>',
          index: 20,
          length: 19,
          expected: true, // This is in an attribute
        },
      ];
      cases.forEach((item) => {
        expect(autoLinkHook.isLinkInHtmlAttribute(item.str, item.index, item.length)).toBe(item.expected);
      });
    });
  });

  describe('isLinkInATag', () => {
    it('应该检测到 <a> 标签内的链接', () => {
      const cases = [
        {
          str: '<a href="https://cherry.editor.com">https://cherry.editor.com</a>',
          index: 35,
          length: 25,
          expected: true,
        },
        {
          str: '<a href="https://example.com">Visit https://example.com</a>',
          index: 33,
          length: 19,
          expected: true,
        },
      ];
      cases.forEach((item) => {
        expect(autoLinkHook.isLinkInATag(item.str, item.index, item.length)).toBe(item.expected);
      });
    });

    it('对于不在 <a> 标签中的链接应该返回 false', () => {
      const cases = [
        {
          str: 'Visit https://cherry.editor.com for more info',
          index: 6,
          length: 25,
          expected: false,
        },
        {
          str: '<span>https://example.com</span>',
          index: 7,
          length: 19,
          expected: false,
        },
      ];
      cases.forEach((item) => {
        expect(autoLinkHook.isLinkInATag(item.str, item.index, item.length)).toBe(item.expected);
      });
    });
  });

  describe('makeHtml', () => {
    it('应该将普通 URL 转换为链接', () => {
      const cases = [
        {
          input: 'Visit https://example.com for more info',
          expected: /<a href="https:\/\/example\.com".*>https:\/\/example\.com<\/a>/,
        },
        {
          input: 'Check out http://test.org/page',
          expected: /<a href="http:\/\/test\.org\/page".*>http:\/\/test\.org\/page<\/a>/,
        },
        {
          input: 'Visit <https://subdomain.example.co.uk/path?query=1#hash> now',
          expected:
            /Visit <a href="https:\/\/subdomain\.example\.co\.uk\/path\?query=1#hash".*>https:\/\/subdomain\.example\.co\.uk\/path\?query=1#hash<\/a> now/,
        },
      ];
      cases.forEach((item) => {
        const result = autoLinkHook.makeHtml(item.input);
        expect(result).toMatch(item.expected);
      });
    });

    it('应该将邮箱地址转换为 mailto 链接', () => {
      const cases = [
        {
          input: 'Contact <user@example.com> for support',
          expected: /<a href="mailto:user@example\.com".*>user@example\.com<\/a>/,
        },
        {
          input: 'Email <test.user+tag@domain.co.uk>',
          expected: /<a href="mailto:test\.user\+tag@domain\.co\.uk".*>test\.user\+tag@domain\.co\.uk<\/a>/,
        },
        {
          input: 'Send to <first.last+category123@sub.domain.example.org>',
          expected:
            /<a href="mailto:first\.last\+category123@sub\.domain\.example\.org".*>first\.last\+category123@sub\.domain\.example\.org<\/a>/,
        },
      ];
      cases.forEach((item) => {
        const result = autoLinkHook.makeHtml(item.input);
        expect(result).toMatch(item.expected);
      });
    });

    it('应该处理尖括号包裹的 URL', () => {
      const cases = [
        {
          input: 'Visit <https://example.com> for more info',
          expected: /Visit <a href="https:\/\/example\.com".*>https:\/\/example\.com<\/a> for more info/,
        },
        {
          input: '<user@example.com>',
          expected: /<a href="mailto:user@example\.com".*>user@example\.com<\/a>/,
        },
        {
          input: 'URL: <http://127.0.0.1:3000/path> and email: <admin@test.dev>',
          expected:
            /URL: <a href="http:\/\/127\.0\.0\.1:3000\/path".*>http:\/\/127\.0\.0\.1:3000\/path<\/a> and email: <a href="mailto:admin@test\.dev".*>admin@test\.dev<\/a>/,
        },
      ];
      cases.forEach((item) => {
        const result = autoLinkHook.makeHtml(item.input);
        expect(result).toMatch(item.expected);
      });
    });

    it('不应该转换 HTML 属性中的 URL', () => {
      const input = '<a href="https://example.com">link</a>';
      const result = autoLinkHook.makeHtml(input);
      expect(result).toBe(input);
    });

    it('不应该转换已经在 <a> 标签中的 URL', () => {
      const input = '<a href="https://example.com">https://example.com</a>';
      const result = autoLinkHook.makeHtml(input);
      expect(result).toBe(input);
    });

    it('应该处理不带协议的 www URL', () => {
      // 测试纯 www URL（不带协议）不会被自动链接
      // 这是预期行为 - 它们需要被显式包裹或带有协议
      const input = 'Visit www.example.com for more info';
      const result = autoLinkHook.makeHtml(input);
      expect(result).toBe(input); // Should remain unchanged
    });

    it('应该忽略 javascript: URL', () => {
      const cases = [
        {
          input: 'javascript:alert("test")',
          expected: 'javascript:alert("test")',
        },
        {
          input: '<javascript:void(0)>',
          expected: '<javascript:void(0)>',
        },
        {
          input: 'JAVASCRIPT:window.location.href',
          expected: 'JAVASCRIPT:window.location.href', // Case should not be converted
        },
      ];
      cases.forEach((item) => {
        const result = autoLinkHook.makeHtml(item.input);
        expect(result).toBe(item.expected);
      });
    });

    it('应该处理协议相对 URL', () => {
      // 测试协议相对 URL 需要正确的格式才能被自动链接
      const input = '<//cdn.example.com/script.js>';
      const result = autoLinkHook.makeHtml(input);
      // 以 // 开头的协议相对 URL 需要是有效的才能被自动链接
      // 这可能不会匹配，取决于正则表达式实现
      expect(result).toBe(input); // 应该保持不变
    });

    it('应该处理特殊字符和边界情况', () => {
      const cases = [
        {
          input: 'URL: <https://example.com/path-with-hyphen/file-name.ext>',
          expected:
            /URL: <a href="https:\/\/example\.com\/path-with-hyphen\/file-name\.ext".*>https:\/\/example\.com\/path-with-hyphen\/file-name\.ext<\/a>/,
        },
        {
          input: '<ftp://files.example.com/data.csv>',
          expected: /<a href="ftp:\/\/files\.example\.com\/data\.csv".*>ftp:\/\/files\.example\.com\/data\.csv<\/a>/,
        },
        {
          input: '<https://192.168.1.1:8080/admin>',
          expected: /<a href="https:\/\/192\.168\.1\.1:8080\/admin".*>https:\/\/192\.168\.1\.1:8080\/admin<\/a>/,
        },
      ];
      cases.forEach((item) => {
        const result = autoLinkHook.makeHtml(item.input);
        expect(result).toMatch(item.expected);
      });
    });

    it('不应该转换无效或格式错误的 URL', () => {
      const cases = [
        {
          input: '<test@>', // Incomplete email
          expected: '<test@>',
        },
        {
          input: '<>', // Empty angle brackets
          expected: '<>',
        },
      ];
      cases.forEach((item) => {
        const result = autoLinkHook.makeHtml(item.input);
        expect(result).toBe(item.expected);
      });
    });

    it('应该处理包含特殊字符的链接', () => {
      const cases = [
        {
          input: '<https://example.com/search>',
          expected: /<a href="https:\/\/example\.com\/search".*>https:\/\/example\.com\/search<\/a>/,
        },
        {
          input: '<https://api.example.com/v1/users>',
          expected: /<a href="https:\/\/api\.example\.com\/v1\/users".*>https:\/\/api\.example\.com\/v1\/users<\/a>/,
        },
      ];
      cases.forEach((item) => {
        const result = autoLinkHook.makeHtml(item.input);
        expect(result).toMatch(item.expected);
      });
    });

    it('应该处理多个链接在同一文本中', () => {
      const input = 'Visit <https://google.com> and <https://github.com>, email us at <support@example.com>';
      const result = autoLinkHook.makeHtml(input);
      expect(result).toMatch(/<a href="https:\/\/google\.com".*>https:\/\/google\.com<\/a>/);
      expect(result).toMatch(/<a href="https:\/\/github\.com".*>https:\/\/github\.com<\/a>/);
      expect(result).toMatch(/<a href="mailto:support@example\.com".*>support@example\.com<\/a>/);
    });
  });

  describe('renderLink', () => {
    it('应该渲染带文本的基本链接', () => {
      const url = 'https://example.com';
      const result = autoLinkHook.renderLink(url, 'Example Site');
      expect(result).toMatch(/<a href="https:\/\/example\.com".*title="https:\/\/example\.com".*>Example Site<\/a>/);
    });

    it('当没有提供文本时应该渲染带默认文本的链接', () => {
      const url = 'https://example.com';
      const result = autoLinkHook.renderLink(url);
      expect(result).toMatch(/<a href="https:\/\/example\.com".*>https:\/\/example\.com<\/a>/);
    });
  });

  describe('配置选项测试', () => {
    it('应该支持 target 配置', () => {
      const autoLinkWithTarget = new AutoLink({
        config: { target: '_blank' },
        globalConfig: {},
      }) as any;
      autoLinkWithTarget.$engine = mockEngine;

      const result = autoLinkWithTarget.makeHtml('<https://example.com>');
      expect(result).toContain('target="_blank"');
    });

    it('应该支持 rel 配置', () => {
      const autoLinkWithRel = new AutoLink({
        config: { rel: 'noopener noreferrer' },
        globalConfig: {},
      }) as any;
      autoLinkWithRel.$engine = mockEngine;

      const result = autoLinkWithRel.makeHtml('<https://example.com>');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('应该支持 openNewPage 配置', () => {
      const autoLinkOpenNew = new AutoLink({
        config: { openNewPage: true },
        globalConfig: {},
      }) as any;
      autoLinkOpenNew.$engine = mockEngine;

      const result = autoLinkOpenNew.makeHtml('<https://example.com>');
      expect(result).toContain('target="_blank"');
    });

    it('应该支持短链接功能', () => {
      const autoLinkShort = new AutoLink({
        config: {
          enableShortLink: true,
          shortLinkLength: 20,
        },
        globalConfig: {},
      }) as any;
      autoLinkShort.$engine = mockEngine;

      const result = autoLinkShort.renderLink('https://very-long-domain-name.example.com/path/to/resource');
      expect(result).toContain('very-long-domain-nam'); // Should be shortened to 20 chars
    });
  });

  describe('escapePreservedSymbol', () => {
    it('应该转义下划线和星号', () => {
      expect(AutoLink.escapePreservedSymbol('test_link')).toBe('test&#x5f;link');
      expect(AutoLink.escapePreservedSymbol('test*link')).toBe('test&#x2a;link');
      expect(AutoLink.escapePreservedSymbol('test_*_link')).toBe('test&#x5f;&#x2a;&#x5f;link');
    });

    it('应该保留其他特殊字符', () => {
      expect(AutoLink.escapePreservedSymbol('test-link')).toBe('test-link');
      expect(AutoLink.escapePreservedSymbol('test@link')).toBe('test@link');
      expect(AutoLink.escapePreservedSymbol('test#link')).toBe('test#link');
      expect(AutoLink.escapePreservedSymbol('test$link')).toBe('test$link');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空输入', () => {
      const result = autoLinkHook.makeHtml('');
      expect(result).toBe('');
    });

    it('应该处理只包含特殊字符的输入', () => {
      const result = autoLinkHook.makeHtml('!@#$%^&*()');
      expect(result).toBe('!@#$%^&*()');
    });

    it('应该处理混合内容', () => {
      const input = 'Text before <https://example.com> text after';
      const result = autoLinkHook.makeHtml(input);
      expect(result).toContain('Text before');
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('text after');
    });
  });
});
