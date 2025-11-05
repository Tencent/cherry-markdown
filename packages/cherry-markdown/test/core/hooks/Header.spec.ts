import { describe, it, expect } from 'vitest';
import Header from '../../../src/core/hooks/Header';

describe('core/hooks/header', () => {
  it('should parse ATX headers', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const cases = [
      {
        input: '# Header 1',
        expected: /<h1[^>]*>Header 1<\/h1>/,
      },
      {
        input: '## Header 2',
        expected: /<h2[^>]*>Header 2<\/h2>/,
      },
      {
        input: '### Header 3',
        expected: /<h3[^>]*>Header 3<\/h3>/,
      },
      {
        input: '#### Header 4',
        expected: /<h4[^>]*>Header 4<\/h4>/,
      },
      {
        input: '##### Header 5',
        expected: /<h5[^>]*>Header 5<\/h5>/,
      },
      {
        input: '###### Header 6',
        expected: /<h6[^>]*>Header 6<\/h6>/,
      },
    ];

    cases.forEach((item) => {
      let result = headerHook.beforeMakeHtml(item.input, () => ({ html: item.input }));
      result = headerHook.makeHtml(result, () => ({ html: result }));
      result = headerHook.afterMakeHtml(result);
      expect(result).toMatch(item.expected);
    });
  });

  it('should parse Setext headers', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const cases = [
      {
        input: 'Header 1\n=========',
        expected: /<h1[^>]*>Header 1<\/h1>/,
      },
      {
        input: 'Header 2\n---------',
        expected: /<h2[^>]*>Header 2<\/h2>/,
      },
    ];

    cases.forEach((item) => {
      let result = headerHook.beforeMakeHtml(item.input, () => ({ html: item.input }));
      result = headerHook.makeHtml(result, () => ({ html: result }));
      result = headerHook.afterMakeHtml(result);
      expect(result).toMatch(item.expected);
    });
  });

  it('should generate unique IDs for headers', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const cases = [
      {
        input: '## My Header',
        expectedId: 'my-header',
      },
      {
        input: '## My Header',
        expectedId: 'my-header-1',
      },
      {
        input: '### Special Characters & Symbols!',
        expectedId: 'special-characters--symbols',
      },
    ];

    cases.forEach((item) => {
      let result = headerHook.beforeMakeHtml(item.input, () => ({ html: item.input }));
      result = headerHook.makeHtml(result, () => ({ html: result }));
      result = headerHook.afterMakeHtml(result);
      if (item.expectedId) {
        expect(result).toContain(`id="${item.expectedId}"`);
      }
    });
  });

  it('should handle headers with inline code', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const input = '## Header with `code`';
    let result = headerHook.beforeMakeHtml(input, () => ({ html: input }));
    result = headerHook.makeHtml(result, () => ({ html: result }));
    result = headerHook.afterMakeHtml(result);
    expect(result).toContain('<h2');
    expect(result).toContain('code');
  });

  it('should handle headers with emphasis', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const input = '## Header with **bold** and *italic*';
    let result = headerHook.beforeMakeHtml(input, () => ({ html: input }));
    result = headerHook.makeHtml(result, () => ({ html: result }));
    result = headerHook.afterMakeHtml(result);
    expect(result).toContain('<h2');
    expect(result).toContain('bold');
    expect(result).toContain('italic');
  });

  it('should handle empty headers', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const cases = [
      '#',
      '##',
      'Header\n=',
    ];

    cases.forEach((input) => {
      let result = headerHook.beforeMakeHtml(input, () => ({ html: input }));
      result = headerHook.makeHtml(result, () => ({ html: result }));
      result = headerHook.afterMakeHtml(result);
      expect(result).toMatch(/<h[1-6]|<p/);
    });
  });

  it('should handle headers with special characters', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const cases = [
      '## Header with 中文',
      '## Header with 日本語',
      '## Header withالعربية',
      '## Header with 🚀 emoji',
    ];

    cases.forEach((input) => {
      let result = headerHook.beforeMakeHtml(input, () => ({ html: input }));
      result = headerHook.makeHtml(result, () => ({ html: result }));
      result = headerHook.afterMakeHtml(result);
      expect(result).toContain('<h2');
    });
  });

  it('should strip HTML tags from title text for ID generation', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const input = '## Header <script>alert("test")</script>';
    let result = headerHook.beforeMakeHtml(input, () => ({ html: input }));
    result = headerHook.makeHtml(result, () => ({ html: result }));
    result = headerHook.afterMakeHtml(result);
    // ID should be generated from text without HTML tags
    expect(result).toContain('id="header-script-alert-test"');
  });

  it('should handle closing hash marks', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const cases = [
      {
        input: '## Header ##',
        expected: /<h2[^>]*>Header\s*<\/h2>/,
      },
      {
        input: '### Header ### extra',
        expected: /<h3[^>]*>Header\s*<\/h3>/,
      },
    ];

    cases.forEach((item) => {
      let result = headerHook.beforeMakeHtml(item.input, () => ({ html: item.input }));
      result = headerHook.makeHtml(result, () => ({ html: result }));
      result = headerHook.afterMakeHtml(result);
      expect(result).toMatch(item.expected);
    });
  });

  it('should parseTitleText correctly', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const testCases = [
      {
        input: '<span>text</span>',
        expected: 'text',
      },
      {
        input: '&#60;test&#62;',
        expected: '<test>',
      },
      {
        input: '<div>multiple <span>tags</span></div>',
        expected: 'multiple tags',
      },
    ];

    testCases.forEach((item) => {
      const result = headerHook.$parseTitleText(item.input);
      expect(result).toBe(item.expected);
    });
  });

  it('should generateId with toLowerCase option', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    expect(headerHook.$generateId('Test Header')).toBe('test-header');
    expect(headerHook.$generateId('Test Header', false)).toBe('Test-header');
  });

  it('should generateId with special characters', () => {
    const headerHook = new Header({
      config: { strict: true },
    });

    const testCases = [
      {
        input: 'Test & Special',
        expected: 'test--special',
      },
      {
        input: 'Test@#$%^&*()',
        expected: 'test',
      },
      {
        input: ' spaces   multiple ',
        expected: 'spaces---multiple-',
      },
    ];

    testCases.forEach((item) => {
      const result = headerHook.$generateId(item.input);
      expect(result).toBe(item.expected);
    });
  });
});
