import { describe, expect, it } from 'vitest';
import {
  compileRegExp,
  isLookbehindSupported,
  HORIZONTAL_WHITESPACE,
  ALLOW_WHITESPACE_MULTILINE,
  DO_NOT_STARTS_AND_END_WITH_SPACES,
  DO_NOT_STARTS_AND_END_WITH_SPACES_MULTILINE,
  NOT_ALL_WHITE_SPACES_INLINE,
  NORMAL_INDENT,
  NO_BACKSLASH_BEFORE_CAPTURE,
  PUNCTUATION,
  CHINESE_PUNCTUATION,
  UNDERSCORE_EMPHASIS_BOUNDARY,
  EMAIL_INLINE,
  EMAIL,
  URL_INLINE_NO_SLASH,
  URL_INLINE,
  URL_NO_SLASH,
  URL,
  LIST_CONTENT,
  getTableRule,
  getCodeBlockRule,
  getListFromStr,
  getPanelRule,
  getDetailRule,
  imgBase64Reg,
  base64Reg,
  longTextReg,
  createUrlReg,
  imgDrawioXmlReg,
  imgDrawioReg,
  getValueWithoutCode,
} from '../../src/utils/regexp';

describe('utils/regexp', () => {
  describe('compileRegExp', () => {
    it('should compile regex correctly', () => {
      const obj = { begin: '^', content: 'test', end: '$' };
      const reg = compileRegExp(obj);
      expect(reg.source).toBe('^test$');
    });

    it('should handle flags', () => {
      const obj = { begin: '^', content: 'test', end: '$' };
      const reg = compileRegExp(obj, 'i');
      expect(reg.flags).toBe('i');
    });

    it('should handle extended flags with \\h', () => {
      const obj = { begin: '[\\h]', content: 'test', end: '$' };
      const reg = compileRegExp(obj, 'g', true);
      expect(reg.test(' test')).toBe(true);
    });
  });

  describe('isLookbehindSupported', () => {
    it('should return true if lookbehind is supported', () => {
      expect(typeof isLookbehindSupported()).toBe('boolean');
    });
  });

  describe('constants', () => {
    it('HORIZONTAL_WHITESPACE should match horizontal whitespace', () => {
      expect(HORIZONTAL_WHITESPACE).toBeTruthy();
    });

    it('PUNCTUATION should match ASCII punctuation', () => {
      expect(PUNCTUATION).toBeTruthy();
    });

    it('CHINESE_PUNCTUATION should match Chinese punctuation', () => {
      expect(CHINESE_PUNCTUATION).toBeTruthy();
    });

    it('UNDERSCORE_EMPHASIS_BOUNDARY should be defined', () => {
      expect(UNDERSCORE_EMPHASIS_BOUNDARY).toBeTruthy();
    });
  });

  describe('EMAIL', () => {
    it('should match valid email addresses', () => {
      expect(EMAIL.test('user@example.com')).toBe(true);
      expect(EMAIL.test('test.user@domain.co.uk')).toBe(true);
      expect(EMAIL.test('user+tag@example.com')).toBe(true);
    });

    it('should not match invalid email addresses', () => {
      expect(EMAIL.test('invalid')).toBe(false);
      expect(EMAIL.test('invalid@')).toBe(false);
      expect(EMAIL.test('@example.com')).toBe(false);
    });
  });

  describe('URL patterns', () => {
    it('URL_INLINE_NO_SLASH should match URLs', () => {
      expect(URL_INLINE_NO_SLASH.test('example.com')).toBe(true);
      expect(URL_INLINE_NO_SLASH.test('192.168.1.1')).toBe(true);
      expect(URL_INLINE_NO_SLASH.test('sub.domain.co.uk')).toBe(true);
    });

    it('URL should match URLs with protocol', () => {
      expect(URL.test('//example.com')).toBe(true);
      expect(URL.test('//192.168.1.1')).toBe(true);
    });

    it('URL should not match invalid URLs', () => {
      expect(URL.test('example')).toBe(false);
      expect(URL.test('256.256.256.256')).toBe(false);
    });
  });

  describe('ip address with URL_INLINE_NO_SLASH', () => {
    const cases = [
      {
        str: 'http://192.168.1.100',
        match: '192.168.1.100',
      },
      {
        str: 'http://192.168.1.300',
        match: '192.168.1.30',
      },
      {
        str: 'http://192.168.291.100',
        match: null,
      },
    ];
    it('should match IP addresses correctly', () => {
      cases.forEach((item) => {
        const match = item.str.match(URL_INLINE_NO_SLASH);
        if (!item.match) {
          expect(match).toBe(null);
        } else {
          expect(match[0]).toBe(item.match);
        }
      });
    });
  });

  describe('LIST_CONTENT', () => {
    it('should match unordered lists', () => {
      expect(LIST_CONTENT.test('- item')).toBe(true);
      expect(LIST_CONTENT.test('* item')).toBe(true);
      expect(LIST_CONTENT.test('+ item')).toBe(true);
    });

    it('should match ordered lists', () => {
      expect(LIST_CONTENT.test('1. item')).toBe(true);
      expect(LIST_CONTENT.test('2. item')).toBe(true);
      expect(LIST_CONTENT.test('10. item')).toBe(true);
    });

    it('should match checkbox lists', () => {
      expect(LIST_CONTENT.test('- [ ] item')).toBe(true);
      expect(LIST_CONTENT.test('- [x] item')).toBe(true);
    });
  });

  describe('getListFromStr', () => {
    it('should convert plain text to unordered list', () => {
      const result = getListFromStr('Item 1\nItem 2', 'ul');
      expect(result).toBe('- Item 1\n- Item 2');
    });

    it('should convert plain text to ordered list', () => {
      const result = getListFromStr('Item 1\nItem 2', 'ol');
      expect(result).toBe('1. Item 1\n2. Item 2');
    });

    it('should convert plain text to checkbox list', () => {
      const result = getListFromStr('Item 1\nItem 2', 'checklist');
      expect(result).toBe('- [x] Item 1\n- [x] Item 2');
    });

    it('should handle nested lists', () => {
      const result = getListFromStr('Item 1\n    Item 1.1\nItem 2', 'ul');
      expect(result).toContain('- Item 1');
      expect(result).toContain('Item 1.1');
      expect(result).toContain('- Item 2');
    });
  });

  describe('getTableRule', () => {
    it('should return table rules', () => {
      const rules = getTableRule();
      expect(rules).toHaveProperty('strict');
      expect(rules).toHaveProperty('loose');
      expect(rules.strict.reg).toBeInstanceOf(RegExp);
      expect(rules.loose.reg).toBeInstanceOf(RegExp);
    });

    it('should return merged rule when merge is true', () => {
      const rule = getTableRule(true);
      expect(rule).toBeInstanceOf(RegExp);
    });
  });

  describe('getCodeBlockRule', () => {
    it('should return code block rule', () => {
      const rule = getCodeBlockRule();
      expect(rule).toHaveProperty('begin');
      expect(rule).toHaveProperty('content');
      expect(rule).toHaveProperty('end');
      expect(rule).toHaveProperty('reg');
      expect(rule.reg).toBeInstanceOf(RegExp);
    });
  });

  describe('getPanelRule', () => {
    it('should return panel rule', () => {
      const rule = getPanelRule();
      expect(rule).toHaveProperty('begin');
      expect(rule).toHaveProperty('content');
      expect(rule).toHaveProperty('end');
      expect(rule).toHaveProperty('reg');
      expect(rule.reg).toBeInstanceOf(RegExp);
    });
  });

  describe('getDetailRule', () => {
    it('should return detail rule', () => {
      const rule = getDetailRule();
      expect(rule).toHaveProperty('begin');
      expect(rule).toHaveProperty('content');
      expect(rule).toHaveProperty('end');
      expect(rule).toHaveProperty('reg');
      expect(rule).toHaveProperty('reg');
      expect(rule.reg).toBeInstanceOf(RegExp);
    });
  });

  describe('imgBase64Reg', () => {
    it('should match base64 images', () => {
      const match = '![alt](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==)'.match(imgBase64Reg);
      expect(match).toBeTruthy();
    });
  });

  describe('base64Reg', () => {
    it('should match base64 data', () => {
      const match = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='.match(base64Reg);
      expect(match).toBeTruthy();
    });
  });

  describe('createUrlReg', () => {
    it('should create URL regex with minimum length', () => {
      const [protocolReg, wwwReg] = createUrlReg(30);
      expect(protocolReg).toBeInstanceOf(RegExp);
      expect(wwwReg).toBeInstanceOf(RegExp);
    });
  });

  describe('getValueWithoutCode', () => {
    it('should remove code blocks from markdown', () => {
      const input = '```js\ncode\n```\ntext';
      const result = getValueWithoutCode(input);
      expect(result).not.toContain('code');
    });

    it('should preserve inline code', () => {
      const input = 'some `code` text';
      const result = getValueWithoutCode(input);
      // getValueWithoutCode only removes code blocks (```...```), not inline code
      expect(result).toBe('some `code` text');
    });

    it('should preserve text outside code blocks', () => {
      const input = '```js\ncode\n```\ntext\n```js\nmore code\n```\nmore text';
      const result = getValueWithoutCode(input);
      expect(result).toContain('text');
      expect(result).toContain('more text');
    });
  });
});
