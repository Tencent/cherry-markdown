import { describe, it, expect } from 'vitest';
import Paragraph from '../../../src/core/hooks/Paragraph';

describe('core/hooks/paragraph', () => {
  it('should parse simple paragraph', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'This is a simple paragraph';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('This is a simple paragraph');
  });

  it('should handle paragraph with multiple sentences', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'First sentence. Second sentence. Third sentence.';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('First sentence');
    expect(result.html).toContain('Second sentence');
  });

  it('should handle paragraph with emphasis', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'This is **bold** and this is *italic*';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('<strong>bold</strong>');
    expect(result.html).toContain('<em>italic</em>');
  });

  it('should handle paragraph with code', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'Use the `command` to run the code';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('<code>command</code>');
  });

  it('should handle paragraph with links', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'Click [here](https://example.com) for more info';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('<a href="https://example.com">');
  });

  it('should handle paragraph with images', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'This is an image: ![alt text](image.png)';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('<img');
  });

  it('should handle empty paragraph', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = '';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toBe(input);
  });

  it('should handle paragraph with special characters', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'Special chars: & < > " \' /';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
  });

  it('should handle paragraph with Unicode', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'Chinese: 你好世界 Japanese: こんにちは Arabic: مرحبا';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('你好世界');
  });

  it('should handle paragraph with emoji', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'I love these emojis: 🚀 🎉 ✨ 😀 😍';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('🚀');
  });

  it('should handle paragraph with newlines', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'Line 1\nLine 2\nLine 3';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
  });

  it('should handle paragraph with multiple spaces', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'Multiple     spaces    between    words';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
    expect(result.html).toContain('Multiple');
    expect(result.html).toContain('spaces');
  });

  it('should handle paragraph with quotes', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'He said: "Hello, world!" and she replied: \'Hi there!\'';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
  });

  it('should handle paragraph with math', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'The equation is: $x = y + z$ and $a * b = c$';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
  });

  it('should handle paragraph with HTML', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'This is <strong>bold HTML</strong> inside paragraph';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
  });

  it('should handle paragraph with lists', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'This paragraph contains a list:\n- Item 1\n- Item 2';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
  });

  it('should handle paragraph with blockquote', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'This paragraph has a quote:\n> This is a blockquote';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
  });

  it('should handle paragraph with hard line breaks', () => {
    const paragraphHook = new Paragraph({
      config: {},
      globalConfig: {},
    });

    const input = 'Line 1  \nLine 2';
    let result = paragraphHook.beforeMakeHtml(input, () => ({ html: input }));
      result = paragraphHook.makeHtml(result, () => ({ html: result }));
      result = paragraphHook.afterMakeHtml(result);
    expect(result.html).toContain('<p>');
  });
});
