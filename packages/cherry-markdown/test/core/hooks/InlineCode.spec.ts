import { describe, it, expect } from 'vitest';
import InlineCode from '../../../src/core/hooks/InlineCode';

describe('core/hooks/inlineCode', () => {
  it('should parse inline code with backticks', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = '`inline code`';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>inline code</code>');
  });

  it('should handle code with single backtick', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = 'Use the `command` to run';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>command</code>');
  });

  it('should handle code with multiple backticks', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '``code with `backticks` inside``',
      '```code with multiple backticks```',
    ];

    cases.forEach((input) => {
      let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
      expect(result.html).toContain('<code>');
    });
  });

  it('should handle code with spaces', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = '`  code with spaces  `';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>');
  });

  it('should escape HTML in inline code', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = '`<div>test</div>`';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('&lt;div&gt;');
  });

  it('should handle code with special characters', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '`$variable`',
      '`{key: value}`',
      '`[1, 2, 3]`',
      '`function() { return true; }`',
    ];

    cases.forEach((input) => {
      let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
      expect(result.html).toContain('<code>');
    });
  });

  it('should handle code with newline', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = '`code\nwith\nnewline`';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>');
  });

  it('should handle multiple inline codes in one line', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = 'Use `cmd1` and then `cmd2` to run';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>cmd1</code>');
    expect(result.html).toContain('<code>cmd2</code>');
  });

  it('should handle code with backslash escapes', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = '`\\`backslash\\``';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>');
  });

  it('should handle code at start of line', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = '`code` at start';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>code</code>');
  });

  it('should handle code at end of line', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = 'text at end `code`';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>code</code>');
  });

  it('should handle code with Unicode characters', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '`中文代码`',
      '`日本語コード`',
      '`العربية`',
    ];

    cases.forEach((input) => {
      let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
      expect(result.html).toContain('<code>');
    });
  });

  it('should handle code with emoji', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '`🚀 rocket`',
      '`✨ sparkles`',
      '`😀😃😄`',
    ];

    cases.forEach((input) => {
      let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
      expect(result.html).toContain('<code>');
    });
  });

  it('should handle empty code', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const input = '``';
    let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
    expect(result.html).toContain('<code>');
  });

  it('should handle code with quotes', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '`"quoted string"`',
      "`'single quotes'`",
      '`"mixed \'quotes\'"`',
    ];

    cases.forEach((input) => {
      let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
      expect(result.html).toContain('<code>');
    });
  });

  it('should handle code with math expressions', () => {
    const inlineCodeHook = new InlineCode({
      config: {},
      globalConfig: {},
    });

    const cases = [
      '`$x = y + z`',
      '`a * b / c`',
      '`{x: 1, y: 2}`',
    ];

    cases.forEach((input) => {
      let result = inlineCodeHook.beforeMakeHtml(input, () => ({ html: input }));
      result = inlineCodeHook.makeHtml(result, () => ({ html: result }));
      result = inlineCodeHook.afterMakeHtml(result);
      expect(result.html).toContain('<code>');
    });
  });
});
