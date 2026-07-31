import { describe, expect, it } from 'vitest';
import {
  convertHTMLNumberToName,
  encodeURIComponentRFC3986,
  encodeURIOnce,
  escapeHTMLSpecialChar,
  escapeHTMLSpecialCharOnce,
  escapeHTMLEntitiesWithoutSemicolon,
  isValidScheme,
  unescapeHTMLHexEntities,
  unescapeHTMLNumberEntities,
  unescapeHTMLSpecialChar,
} from '../../src/utils/sanitize';

describe('utils/sanitize', () => {
  it('escapes malformed entities and keeps valid named and hex entities', () => {
    expect(escapeHTMLEntitiesWithoutSemicolon(123 as never)).toBe('');

    const escaped = escapeHTMLEntitiesWithoutSemicolon(
      '&lt; &copy; &copy &unknown &#60; &#12345678; &#x3c; &#x110000; &#x;',
    );

    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&copy;');
    expect(escaped).toContain('&amp;copy');
    expect(escaped).toContain('&amp;unknown');
    expect(escaped).toContain('&#60;');
    expect(escaped).toContain('&amp;#12345678;');
    expect(escaped).toContain('&#x3c;');
    expect(escaped).toContain('&amp;#x110000;');
    expect(escaped).toContain('&amp;#x;');
  });

  it('escapes and unescapes HTML specials once', () => {
    expect(escapeHTMLSpecialChar(123 as never)).toBe('');
    expect(escapeHTMLSpecialChar('<>&"\'', false)).toBe('&lt;&gt;&amp;&quot;&#x27;');
    expect(escapeHTMLSpecialChar('<>&"\'', true)).toBe('&lt;&gt;&amp;"\'');
    expect(unescapeHTMLSpecialChar(123 as never)).toBe('');
    expect(unescapeHTMLSpecialChar('&lt;&gt;&amp;&quot;&apos;')).toBe('<>&"\'');
    expect(escapeHTMLSpecialCharOnce('&lt;&#60;&amp;', false)).toBe('&lt;&lt;&amp;');
    expect(convertHTMLNumberToName('&#60;&#169;&#999999;')).toBe('&lt;&copy;&#999999;');
    expect(unescapeHTMLNumberEntities('&#65;&#99999999;')).toBe('A&#99999999;');
    expect(unescapeHTMLHexEntities('&#x41;&#x110000;')).toBe('A&#x110000;');
  });

  it('validates schemes after decoding numeric entities', () => {
    expect(isValidScheme('relative/path')).toBe(true);
    expect(isValidScheme('https://example.com')).toBe(true);
    expect(isValidScheme('javascript:alert(1)')).toBe(false);
    expect(isValidScheme('vbscript:msgbox(1)')).toBe(false);
    expect(isValidScheme('data:text/html;base64,abc')).toBe(false);
    expect(isValidScheme('&#x6a;avascript:alert(1)')).toBe(false);
    expect(isValidScheme('java\t script:alert(1)')).toBe(false);
  });

  it('encodes URI components with RFC3986 rules and preserves encoded percent signs once', () => {
    expect(encodeURIComponentRFC3986("!'()*")).toBe('%21%27%28%29%2a');
    expect(encodeURIOnce('https://example.com/%25')).toBe('https://example.com/%25');
  });
});
