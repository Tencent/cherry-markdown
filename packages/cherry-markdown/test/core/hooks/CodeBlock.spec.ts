import { describe, it, expect } from 'vitest';
import CodeBlock from '../../../src/core/hooks/CodeBlock';

describe('core/hooks/codeBlock', () => {
  it('should parse fenced code blocks', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const cases = [
      {
        input: '```javascript\nconst x = 1;\n```',
        expectedPattern: /<pre><code[^>]*class="language-javascript">/,
      },
      {
        input: '```python\nprint("hello")\n```',
        expectedPattern: /<pre><code[^>]*class="language-python">/,
      },
    ];

    cases.forEach((item) => {
      const result = codeBlockHook.makeHtml(item.input, () => ({ html: item.input }));
      expect(result.html).toMatch(item.expectedPattern);
    });
  });

  it('should handle code block with language specified', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```ts\ninterface User {\n  name: string;\n}\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('language-ts');
  });

  it('should handle code block without language', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```\nplain text code\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('<pre><code');
  });

  it('should preserve code content', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```javascript\nconst message = "Hello, World!";\nconsole.log(message);\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('const message');
    expect(result.html).toContain('console.log');
  });

  it('should handle code block with special characters', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const cases = [
      '```html\n<div class="test">content</div>\n```',
      '```js\nconst x = `<div>${value}</div>`;\n```',
      '```css\n.class { color: red; }\n```',
    ];

    cases.forEach((input) => {
      const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
      expect(result.html).toContain('<pre><code');
    });
  });

  it('should handle code block with line numbers', () => {
    const codeBlockHook = new CodeBlock({
      config: { codeBlock: { lineNumber: true } },
      globalConfig: {},
      externals: {},
    });

    const input = '```\nline 1\nline 2\nline 3\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('<pre><code');
  });

  it('should handle code block with copy button', () => {
    const codeBlockHook = new CodeBlock({
      config: { codeBlock: { copyButton: true } },
      globalConfig: {},
      externals: {},
    });

    const input = '```\ntest code\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('<pre><code');
  });

  it('should handle indented code blocks', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '    const x = 1;\n    const y = 2;';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('<pre><code');
  });

  it('should handle code block with tabs', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```\n\tconst x = 1;\n\ty = 2;\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('<pre><code');
  });

  it('should handle code block with empty lines', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```\nline 1\n\nline 3\n\nline 5\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('line 1');
    expect(result.html).toContain('line 3');
    expect(result.html).toContain('line 5');
  });

  it('should handle code block with backticks inside', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```\nconst str = `template literal`;\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('template literal');
  });

  it('should handle code block with Unicode characters', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```javascript\nconst message = "你好世界";\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('你好世界');
  });

  it('should handle multiple code blocks', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```js\nconst a = 1;\n```\n\nSome text\n\n```python\nb = 2\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    expect(result.html).toContain('const a = 1');
    expect(result.html).toContain('b = 2');
  });

  it('should escape HTML in code', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const input = '```html\n<div>test</div>\n```';
    const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
    // HTML should be escaped
    expect(result.html).toContain('&lt;');
  });

  it('should handle code block with language aliases', () => {
    const codeBlockHook = new CodeBlock({
      config: {},
      globalConfig: {},
      externals: {},
    });

    const cases = [
      '```js\nconst x = 1;\n```',
      '```jsx\nconst el = <div />;\n```',
      '```ts\nconst x: number = 1;\n```',
      '```tsx\nconst el: JSX.Element = <div />;\n```',
    ];

    cases.forEach((input) => {
      const result = codeBlockHook.makeHtml(input, () => ({ html: input }));
      expect(result.html).toContain('<pre><code');
    });
  });
});
