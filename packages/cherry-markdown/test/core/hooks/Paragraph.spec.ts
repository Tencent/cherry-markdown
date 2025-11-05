import { describe, it, expect } from 'vitest';
import Paragraph from '../../../src/core/hooks/Paragraph';

describe('core/hooks/paragraph', () => {
  it('should parse simple paragraph', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'This is a simple paragraph';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('This is a simple paragraph');
  });

  it('should handle paragraph with multiple sentences', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'First sentence. Second sentence. Third sentence.';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('First sentence');
    expect(result).toContain('Second sentence');
  });

  it('should handle paragraph with emphasis', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'This is **bold** and this is *italic*';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('should handle paragraph with code', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'Use the `command` to run the code';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('<code>command</code>');
  });

  it('should handle paragraph with links', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'Click [here](https://example.com) for more info';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('<a href="https://example.com">');
  });

  it('should handle paragraph with images', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'This is an image: ![alt text](image.png)';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('<img');
  });

  it('should handle empty paragraph', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = '';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toBe(input);
  });

  it('should handle paragraph with special characters', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'Special chars: & < > " \' /';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
  });

  it('should handle paragraph with Unicode', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'Chinese: 你好世界 Japanese: こんにちは Arabic: مرحبا';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('你好世界');
  });

  it('should handle paragraph with emoji', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'I love these emojis: 🚀 🎉 ✨ 😀 😍';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('🚀');
  });

  it('should handle paragraph with newlines', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'Line 1\nLine 2\nLine 3';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
  });

  it('should handle paragraph with multiple spaces', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'Multiple     spaces    between    words';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
    expect(result).toContain('Multiple');
    expect(result).toContain('spaces');
  });

  it('should handle paragraph with quotes', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'He said: "Hello, world!" and she replied: \'Hi there!\'';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
  });

  it('should handle paragraph with math', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'The equation is: $x = y + z$ and $a * b = c$';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
  });

  it('should handle paragraph with HTML', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'This is <strong>bold HTML</strong> inside paragraph';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
  });

  it('should handle paragraph with lists', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'This paragraph contains a list:\n- Item 1\n- Item 2';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
  });

  it('should handle paragraph with blockquote', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'This paragraph has a quote:\n> This is a blockquote';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
  });

  it('should handle paragraph with hard line breaks', () => {
    const paragraphHook = new Paragraph({
      globalConfig: { classicBr: false },
    });

    const input = 'Line 1  \nLine 2';
    const result = paragraphHook.makeHtml(input, (text) => ({ html: text, sign: text }));
    expect(result).toContain('<p>');
  });
});
