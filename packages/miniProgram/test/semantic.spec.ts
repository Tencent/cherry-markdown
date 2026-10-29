// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';
import CherryStream from '../src';
import { blocksToMiniProgramView } from '../src/shared/view';
import { htmlToMiniProgramBlocks } from '../src/shared/transform';
import type { MiniProgramOptions } from '../src/types';

export const compatibilityCases = [
  'Plain text',
  'literal ~D value',
  'literal ~T value',
  '中文 **加粗** *斜体* and `inline`',
  '***both*** __strong__ _em_',
  '# Heading\n\nParagraph\nsecond line',
  'Heading\n===\n\nNext',
  '### Closing ###\n\n---\n\nText',
  '\\*literal\\* \\_literal\\_ \\`code\\`',
  '[**bold**](https://example.com "title")',
  '[https://display.com](https://target.com)',
  'https://example.com/a?x=1&y=2, next',
  '<https://example.com> <a@example.com>',
  '![Alt](https://example.com/a.png)',
  'before ![Alt](/a.png) after',
  ':smile: test',
  '- a\n- b\n  - **nested**\n    - deep',
  '1. one\n2. two\n\nParagraph',
  '- [x] done\n- [ ] todo',
  '> quote\n>\n> **nested**\n\nOutside',
  '> # Header\n>\n> - a\n> - b',
  '```js\nconst a = "x";\nconsole.log(a);\n```',
  '```python\ndef f():\n    return True\n```',
  '````js\n```\ncode\n```\n````',
  '    const a = 1;\n    const b = 2;',
  '```mermaid\ngraph TD;\n A-->B;\n```',
  '```math\nx^2\n```',
  '| A | B |\n| :--- | ---: |\n| **x** | [go](/p) |',
  '| A | B |\n| --- | --- |\n| `a\\|b` | ![A](/a.png) |',
  'Inline $E=mc^2$ test',
  '$$\na^2+b^2=c^2\n$$',
  '~~strike~~ ^sup^ ~sub~',
  '!!red color!! ^^20 size^^',
  '&copy; &amp; &#x1F600; &lt;tag&gt;',
  '[ref][target]\n\n[target]: https://example.com "title"',
  '---\ntitle: demo\n---\n\nBody',
  '<strong>raw</strong> and **Markdown**',
  '<div><p>raw **bold**</p></div>',
  'line  \nbreak\n\n\nnext',
  '``code `inside` text``',
];

// Coalesce equivalent adjacent text runs; DOM tokenization is not part of the semantic contract.
function canonical(value: unknown): unknown {
  if (value && typeof value === 'object' && 'type' in value && value.type === 'code_block') {
    const { runs: _runs, ...code } = value as Record<string, unknown>;
    return code;
  }
  if (Array.isArray(value)) {
    value = value.flatMap((item) => {
      if (item?.type !== 'paragraph') return [item];
      if (item.inlines.every((run: { type: string; text?: string }) => run.type === 'text' && !run.text?.trim()))
        return [];
      const blocks: unknown[] = [];
      let inlines: unknown[] = [];
      for (const run of item.inlines) {
        if (run.type === 'image') {
          if (inlines.length) blocks.push({ type: 'paragraph', inlines });
          blocks.push(run);
          inlines = [];
        } else inlines.push(run);
      }
      if (inlines.length) blocks.push({ type: 'paragraph', inlines });
      return blocks;
    });
    const result: unknown[] = [];
    for (const item of (value as unknown[]).map(canonical)) {
      const previous = result[result.length - 1] as Record<string, unknown> | undefined;
      const node = item as Record<string, unknown>;
      if (
        previous &&
        node &&
        typeof node.text === 'string' &&
        typeof previous.text === 'string' &&
        JSON.stringify({ ...previous, text: '' }) === JSON.stringify({ ...node, text: '' })
      )
        previous.text += node.text;
      else result.push(item);
    }
    return result;
  }
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, canonical(item)]));
  return value;
}

function legacy(markdown: string, options: MiniProgramOptions = {}) {
  const renderer = new CherryStream(options);
  return blocksToMiniProgramView(htmlToMiniProgramBlocks(renderer.makeHtml(markdown)), { deferImages: false });
}

describe('direct Cherry semantic backend', () => {
  it.each(compatibilityCases)('preserves Cherry view semantics: %s', (markdown) => {
    const expected = legacy(markdown);
    const actual = new CherryStream().setMarkdown(markdown, { deferImages: false });
    expect(canonical(actual)).toEqual(canonical(expected));
  });

  it('does not use the HTML entrypoint when creating native nodes', () => {
    const stream = new CherryStream();
    vi.spyOn(stream.engine, 'makeHtml').mockImplementation(() => {
      throw new Error('HTML intermediate is forbidden');
    });
    expect(stream.setMarkdown('# Title\n\n**text** [link](/p)\n\n```js\nlet x = 1\n```')).toHaveLength(3);
  });

  it('retains per-instance syntax configuration', () => {
    const options = { engine: { syntax: { fontEmphasis: false, header: { strict: false }, autoLink: false } } };
    const markdown = '#heading\n\n**literal** https://example.com';
    expect(canonical(new CherryStream(options).setMarkdown(markdown))).toEqual(canonical(legacy(markdown, options)));
  });
  it('preserves literal code and large image data without HTML/entity round trips', () => {
    const text = String.raw`<tag> &amp; ~D ~T \path`;
    expect(new CherryStream().setMarkdown('```text\n' + text + '\n```')[0]).toMatchObject({ type: 'code_block', text });
    const src = 'data:image/png;base64,' + 'A'.repeat(9000);
    expect(new CherryStream().setMarkdown(`![A](${src})`, { deferImages: false })[0]).toMatchObject({
      type: 'image',
      src,
    });
    expect(new CherryStream().setMarkdown('`&amp; \\path`')[0]).toMatchObject({
      type: 'paragraph',
      inlines: [{ text: '&amp; \\path' }],
    });
  });

  it('retains structural Cherry extensions as semantic nodes', () => {
    expect(new CherryStream().makeBlocks(':::tip Title\nbody\n:::')[0]).toMatchObject({
      type: 'panel',
      title: 'Title',
      children: expect.any(Array),
    });
    expect(new CherryStream().makeBlocks('+++ Title\nbody\n+++')[0]).toMatchObject({
      type: 'detail',
      title: 'Title',
      children: expect.any(Array),
    });
    expect(new CherryStream().setMarkdown('==highlight== /underline/')[0]).toMatchObject({
      type: 'paragraph',
      inlines: expect.arrayContaining([
        expect.objectContaining({ className: 'md-highlight', text: 'highlight' }),
        expect.objectContaining({ className: 'md-underline', text: 'underline' }),
      ]),
    });
    expect(new CherryStream().makeBlocks('{汉字|han zi}')[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'ruby', annotation: 'han zi', children: [{ type: 'text', text: '汉字' }] }],
    });
  });

  it('does not turn unsafe source HTML attributes into native actions', () => {
    const output = new CherryStream().setMarkdown(
      '<a href="javascript:alert(1)">text</a><img src="javascript:alert(1)">',
      { deferImages: false },
    );
    expect(JSON.stringify(output)).not.toContain('javascript:');
    expect(new CherryStream().setMarkdown('<b>&amp;copy;</b>')[0]).toMatchObject({
      type: 'paragraph',
      inlines: [{ text: '&copy;' }],
    });
  });

  it('rejects HTML-only custom renderers instead of silently reintroducing an intermediate', () => {
    const stream = new CherryStream({
      engine: { syntax: { emoji: { customHandled: true, customRenderer: () => '<b>custom</b>' } } },
    });
    expect(() => stream.setMarkdown(':smile:')).toThrow('semantic');
    expect(stream.makeHtml('text')).toContain('text');
  });
  it('cannot confuse literal private-use text with renderer references', () => {
    const source = '\uE000a0\uE001';
    expect(new CherryStream().setMarkdown(source)[0]).toMatchObject({ type: 'paragraph', inlines: [{ text: source }] });
    expect(new CherryStream().setMarkdown(`<b>${source}</b>`)[0]).toMatchObject({
      type: 'paragraph',
      inlines: [{ text: source }],
    });
  });
  it('does not expose internal flow cursor text in native nodes', () => {
    for (const source of ['text', '`code', '```js\nconst n = 1', '$$\nx', '$x']) {
      expect(
        JSON.stringify(
          new CherryStream({ engine: { global: { flowSessionCursor: 'default' } } }).makeBlocks(source, {
            forceNoCursor: false,
          }),
        ),
      ).not.toContain('CHERRYFLOWSESSIONCURSOR');
    }
  });
  it('keeps text in unsupported source HTML without exposing hook-cache references', () => {
    const blocks = new CherryStream({ engine: { global: { htmlWhiteList: 'custom|script' } } }).makeBlocks(
      '<custom>`code`<script>bad()</script> text</custom>',
    );
    expect(blocks).toMatchObject([{ type: 'unsupported', tag: 'custom', text: 'code text' }]);
    expect(JSON.stringify(blocks)).not.toContain('~~CODE');
    expect(JSON.stringify(new CherryStream().makeBlocks('<span onclick="bad()">text</span>'))).not.toContain('onclick');
  });
});
