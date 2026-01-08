import { describe, expect, it } from 'vitest';
import htmlParser from '../../src/utils/htmlparser';

describe('utils/htmlparser', () => {
  describe('run', () => {
    it('转换HTML到Markdown', () => {
      const cases = [
        // 基础标签
        ['<p>hello world</p>', ['hello world']],
        ['<p><b>bold text</b></p>', ['**bold text**']],
        ['<p><i>italic text</i></p>', ['*italic text*']],
        ['<p><a href="http://example.com">link text</a></p>', ['[link text](http://example.com)']],
        ['<img src="http://example.com/image.png" alt="alt text" />', ['![alt text](http://example.com/image.png)']],
        // 代码
        ['<pre><code>console.log("hello");</code></pre>', ['```', 'console.log("hello");']],
        ['<p>inline <code>code</code> text</p>', ['`code`']],
        // 标题
        ['<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>', ['# Heading 1', '## Heading 2', '### Heading 3']],
        // 列表
        ['<ul><li>item 1</li><li>item 2</li></ul>', ['- item 1', '- item 2']],
        ['<ol><li>item 1</li><li>item 2</li></ol>', ['1. item 1', '2. item 2']],
        // 其他标签
        ['<blockquote>quoted text</blockquote>', ['quoted text', '>']],
        ['<hr />', ['----']],
        ['<p><strike>strikethrough</strike></p>', ['~~strikethrough~~']],
        ['<p><u>underline</u></p>', ['/underline/']],
        ['<table><tr><td>cell 1</td><td>cell 2</td></tr></table>', ['|']],
        ['<p>line 1<br />line 2</p>', ['line 1', 'line 2']],
        ['<p>super<sup>script</sup></p>', ['^script^']],
        ['<p>sub<sub>script</sub></p>', ['^^script^^']],
        // 复选框
        ['<p><span class="ch-icon-check"></span> checked</p>', ['[x]']],
        ['<p><span class="ch-icon-square"></span> unchecked</p>', ['[ ]']],
        // 特殊字符
        ['<p>&lt;test&gt;</p>', ['<test>']],
        ['<p>word&nbsp;word</p>', ['word word']],
      ];
      cases.forEach(([html, contains]) => {
        const result = htmlParser.run(html as string);
        (contains as string[]).forEach((str) => {
          expect(result).toContain(str);
        });
      });
    });

    it('处理特殊HTML', () => {
      const cases = [
        ['', ''],
        ['<p>text</p>', /\S$/], // 不以空白结尾
        ['<p><strong><em>nested</em> text</strong></p>', ['**', '*']],
      ];
      cases.forEach(([html, expected]) => {
        const result = htmlParser.run(html as string);
        if (typeof expected === 'string') {
          expect(result).toBe(expected);
        } else if (expected instanceof RegExp) {
          expect(result).toMatch(expected);
        } else if (Array.isArray(expected)) {
          expected.forEach((str) => expect(result).toContain(str));
        }
      });
    });
  });
});
