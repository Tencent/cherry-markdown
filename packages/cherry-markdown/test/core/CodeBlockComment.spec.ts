import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import CherryEngine from '../../src/index.engine.core';

/**
 * Regression tests for issue #885:
 * 代码段注释解析异常 — a fenced code block nested inside an HTML comment
 * (<!-- ```lang ... ``` -->) used to swallow the content that followed the
 * comment, because the code-block "self closing" pass counted the comment's
 * closing ``` line as a lone (odd) fence opener and auto-closed it to EOF.
 *
 * These tests pin the current behaviour of the code-block auto-close pass so
 * the fix stays behaviour-preserving for ordinary code blocks.
 */

// engine-core defaults codeBlock.selfClosing = true, which is what triggers the bug
const engine: any = new CherryEngine({ engine: { syntax: { header: { anchorStyle: 'none' } } } });
const render = (md: string) => engine.makeHtml(md);

describe('core/CodeBlock — fenced code inside HTML comment (issue #885)', () => {
  beforeEach(() => vi.stubGlobal('BUILD_ENV', 'production'));

  it('renders the heading that follows a commented-out fenced code block', () => {
    const md = ['<!-- ```plantuml', '@startuml', '', '@enduml', '``` -->', '', '### h3 to'].join('\n');
    const html = render(md);
    // the trailing heading must survive (it was previously eaten)
    expect(html).toMatch(/<h3[^>]*>h3 to<\/h3>/);
    // the comment must NOT have been turned into a rendered code block
    expect(html).not.toMatch(/data-type="codeBlock"/);
  });

  it('renders following content for a single-line ```-bearing comment too', () => {
    const md = ['<!-- ```js a=1 ``` -->', '', '# title'].join('\n');
    const html = render(md);
    expect(html).toMatch(/<h1[^>]*>title<\/h1>/);
    expect(html).not.toMatch(/data-type="codeBlock"/);
  });

  // ---- characterization: ordinary code-block behaviour must be unchanged ----

  it('still auto-closes a genuinely unclosed fenced code block (selfClosing)', () => {
    const html = render('```js\nvar a = 1;');
    expect(html).toMatch(/data-type="codeBlock"/);
  });

  it('still renders a normal closed code block followed by a heading', () => {
    const html = render('```js\nvar a = 1;\n```\n\n### tail');
    expect(html).toMatch(/data-type="codeBlock"/);
    expect(html).toMatch(/<h3[^>]*>tail<\/h3>/);
  });

  it('a real fence whose body contains an HTML comment is unaffected', () => {
    const html = render('```html\n<!-- hi -->\n```\n\n### after');
    expect(html).toMatch(/data-type="codeBlock"/);
    expect(html).toMatch(/<h3[^>]*>after<\/h3>/);
  });
});
