import { describe, expect, it } from 'vitest';
import htmlParser from '../../src/utils/htmlparser';

describe('utils/htmlparser', () => {
  describe('run', () => {
    it('should convert simple text', () => {
      const html = '<p>hello world</p>';
      const result = htmlParser.run(html);
      expect(result).toContain('hello world');
    });

    it('should convert bold text', () => {
      const html = '<p><b>bold text</b></p>';
      const result = htmlParser.run(html);
      expect(result).toContain('**bold text**');
    });

    it('should convert italic text', () => {
      const html = '<p><i>italic text</i></p>';
      const result = htmlParser.run(html);
      expect(result).toContain('*italic text*');
    });

    it('should convert links', () => {
      const html = '<p><a href="http://example.com">link text</a></p>';
      const result = htmlParser.run(html);
      expect(result).toContain('[link text](http://example.com)');
    });

    it('should convert images', () => {
      const html = '<img src="http://example.com/image.png" alt="alt text" />';
      const result = htmlParser.run(html);
      expect(result).toContain('![alt text](http://example.com/image.png)');
    });

    it('should convert code blocks', () => {
      const html = '<pre><code>console.log("hello");</code></pre>';
      const result = htmlParser.run(html);
      expect(result).toContain('```');
      expect(result).toContain('console.log("hello");');
    });

    it('should convert inline code', () => {
      const html = '<p>inline <code>code</code> text</p>';
      const result = htmlParser.run(html);
      expect(result).toContain('`code`');
    });

    it('should convert headings', () => {
      const html = '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>';
      const result = htmlParser.run(html);
      expect(result).toContain('# Heading 1');
      expect(result).toContain('## Heading 2');
      expect(result).toContain('### Heading 3');
    });

    it('should convert lists', () => {
      const html = '<ul><li>item 1</li><li>item 2</li></ul>';
      const result = htmlParser.run(html);
      expect(result).toContain('- item 1');
      expect(result).toContain('- item 2');
    });

    it('should convert ordered lists', () => {
      const html = '<ol><li>item 1</li><li>item 2</li></ol>';
      const result = htmlParser.run(html);
      expect(result).toContain('1. item 1');
      expect(result).toContain('2. item 2');
    });

    it('should convert blockquotes', () => {
      const html = '<blockquote>quoted text</blockquote>';
      const result = htmlParser.run(html);
      // Blockquote format is: >text (no space after >)
      expect(result).toContain('quoted text');
      expect(result).toContain('>');
    });

    it('should convert horizontal rules', () => {
      const html = '<hr />';
      const result = htmlParser.run(html);
      expect(result).toContain('----');
    });

    it('should handle multiple paragraphs', () => {
      const html = '<p>paragraph 1</p><p>paragraph 2</p>';
      const result = htmlParser.run(html);
      expect(result).toContain('paragraph 1');
      expect(result).toContain('paragraph 2');
    });

    it('should convert strikethrough text', () => {
      const html = '<p><strike>strikethrough</strike></p>';
      const result = htmlParser.run(html);
      expect(result).toContain('~~strikethrough~~');
    });

    it('should convert underline text', () => {
      const html = '<p><u>underline</u></p>';
      const result = htmlParser.run(html);
      expect(result).toContain('/underline/');
    });

    it('should handle nested HTML', () => {
      const html = '<p><strong><em>nested</em> text</strong></p>';
      const result = htmlParser.run(html);
      expect(result).toContain('**');
      expect(result).toContain('*');
    });

    it('should convert tables', () => {
      const html = '<table><tr><td>cell 1</td><td>cell 2</td></tr></table>';
      const result = htmlParser.run(html);
      expect(result).toContain('|');
    });

    it('should handle line breaks', () => {
      const html = '<p>line 1<br />line 2</p>';
      const result = htmlParser.run(html);
      expect(result).toContain('line 1');
      expect(result).toContain('line 2');
    });

    it('should handle superscript', () => {
      const html = '<p>super<sup>script</sup></p>';
      const result = htmlParser.run(html);
      expect(result).toContain('^script^');
    });

    it('should handle subscript', () => {
      const html = '<p>sub<sub>script</sub></p>';
      const result = htmlParser.run(html);
      expect(result).toContain('^^script^^');
    });

    it('should convert checkboxes', () => {
      const html = '<p><span class="ch-icon-check"></span> checked</p>';
      const result = htmlParser.run(html);
      expect(result).toContain('[x]');
    });

    it('should convert unchecked checkboxes', () => {
      const html = '<p><span class="ch-icon-square"></span> unchecked</p>';
      const result = htmlParser.run(html);
      expect(result).toContain('[ ]');
    });

    it('should trim trailing newlines', () => {
      const html = '<p>text</p>';
      const result = htmlParser.run(html);
      expect(result).not.toMatch(/\n+$/);
    });

    it('should handle empty HTML', () => {
      const html = '';
      const result = htmlParser.run(html);
      expect(result).toBe('');
    });

    it('should handle HTML entities', () => {
      const html = '<p>&lt;test&gt;</p>';
      const result = htmlParser.run(html);
      expect(result).toContain('<test>');
    });

    it('should handle non-breaking spaces', () => {
      const html = '<p>word&nbsp;word</p>';
      const result = htmlParser.run(html);
      expect(result).toContain('word word');
    });
  });
});
