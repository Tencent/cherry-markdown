import { describe, it, expect } from 'vitest';
import Link from '../../../src/core/hooks/Link';

describe('core/hooks/link', () => {
  it('should parse basic link syntax', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const cases = [
      {
        input: '[link text](https://example.com)',
        expectedPattern: /<a[^>]*href="https:\/\/example\.com"[^>]*>link text<\/a>/,
      },
      {
        input: '[link text](http://example.com)',
        expectedPattern: /<a[^>]*href="http:\/\/example\.com"[^>]*>link text<\/a>/,
      },
    ];

    cases.forEach((item) => {
      const result = linkHook.makeHtml(item.input, () => ({ html: item.input }));
      expect(result.html).toMatch(item.expectedPattern);
    });
  });

  it('should handle link with title', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '[link](https://example.com "Link Title")';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toMatch(/<a[^>]*href="https:\/\/example\.com"[^>]*>/);
    expect(result.html).toContain('title="Link Title"');
  });

  it('should handle reference-style links', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const cases = [
      {
        input: '[link text][ref]\n\n[ref]: https://example.com',
        expectedPattern: /<a[^>]*href="https:\/\/example\.com"[^>]*>link text<\/a>/,
      },
      {
        input: '[link text][ref]\n\n[ref]: https://example.com "Title"',
        expectedPattern: /<a[^>]*href="https:\/\/example\.com"[^>]*title="Title"[^>]*>link text<\/a>/,
      },
    ];

    cases.forEach((item) => {
      const result = linkHook.makeHtml(item.input, () => ({ html: item.input }));
      expect(result.html).toMatch(item.expectedPattern);
    });
  });

  it('should handle links with code in link text', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '[link with `code`](https://example.com)';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toMatch(/<a[^>]*href="https:\/\/example\.com"[^>]*>/);
    expect(result.html).toContain('code');
  });

  it('should handle links with emphasis in link text', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '[link with **bold**](https://example.com)',
      '[link with *italic*](https://example.com)',
    ];

    cases.forEach((input) => {
      const result = linkHook.makeHtml(input, () => ({ html: item.input }));
      expect(result.html).toContain('<a');
      expect(result.html).toContain('https://example.com');
    });
  });

  it('should handle relative links', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '[local link](./page.html)',
      '[parent link](../page.html)',
      '[root link](/page.html)',
    ];

    cases.forEach((input) => {
      const result = linkHook.makeHtml(input, () => ({ html: input }));
      expect(result.html).toContain('<a');
      expect(result.html).toContain('href=');
    });
  });

  it('should handle email links', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '<user@example.com>';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('href="mailto:user@example.com"');
  });

  it('should handle links with special characters in URL', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const cases = [
      {
        input: '[link](https://example.com/path?param=value&other=123)',
        expected: /href="https:\/\/example\.com\/path\?param=value&other=123"/,
      },
      {
        input: '[link](https://example.com/path#section)',
        expected: /href="https:\/\/example\.com\/path#section"/,
      },
    ];

    cases.forEach((item) => {
      const result = linkHook.makeHtml(item.input, () => ({ html: item.input }));
      expect(result.html).toMatch(item.expected);
    });
  });

  it('should handle links with query parameters', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '[search](https://google.com/search?q=markdown)';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('href="https://google.com/search?q=markdown"');
  });

  it('should handle links with anchors', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '[section](#section-name)';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('href="#section-name"');
  });

  it('should handle nested brackets in link text', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '[link [with] brackets](https://example.com)';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toMatch(/<a[^>]*href="https:\/\/example\.com"[^>]*>/);
  });

  it('should handle empty link text', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '[](https://example.com)';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('href="https://example.com"');
  });

  it('should handle automatic links', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '<https://example.com>',
      '<mailto:user@example.com>',
      '<http://example.com/path>',
    ];

    cases.forEach((input) => {
      const result = linkHook.makeHtml(input, () => ({ html: input }));
      expect(result.html).toContain('<a');
    });
  });

  it('should escape HTML in link text', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '[<script>alert("test")</script>](https://example.com)';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('href="https://example.com"');
  });

  it('should handle multiple links in one line', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const input = '[link1](https://example.com) and [link2](https://example.org)';
    const result = linkHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('example.com');
    expect(result.html).toContain('example.org');
  });

  it('should handle footnote links', () => {
    const linkHook = new Link({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '[^1]',
      '[^note]',
    ];

    cases.forEach((input) => {
      const result = linkHook.makeHtml(input, () => ({ html: input }));
      // Should not be treated as regular links
      expect(result.html).toMatch(/<a|\[\^|\^/);
    });
  });
});
