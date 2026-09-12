import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import { editorViewCtx } from '@milkdown/kit/core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createCherryMilkdown, type CherryMilkdownInstance } from '../src';

vi.mock('mathlive', () => ({}));
vi.mock('mermaid', () => ({
  default: { initialize: vi.fn(), render: vi.fn(async () => ({ svg: '<svg></svg>' })) },
}));

const instances: CherryMilkdownInstance[] = [];
const fullManual = readFileSync(resolve(import.meta.dirname, '../../../examples/assets/markdown/index.md'), 'utf8');

const normalizeHtml = (html: string) =>
  html
    .replace(/\sdata-sign="[^"]*"/g, '')
    .replace(/\sid="cherry-[^"]*"/g, '')
    .replace(/\sdata-lines="[^"]*"/g, '')
    .replace(/-c\d+i[0-9a-f]+-l\d+/gi, '-cNimath-lN')
    .replace(/<p data-type="br">&nbsp;<\/p>/g, '')
    .replace(/>\s+</g, '><')
    .trim();

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(async () => {
  await Promise.all(instances.splice(0).map((instance) => instance.destroy()));
  document.body.replaceChildren();
});

const fixtures = [
  ['frontMatter', '---\ntitle: Cherry\n---\n\nBody'],
  ['codeBlock', '```js\nconst value = 1;\n```'],
  ['inlineCode', 'Use `const value = 1` here.'],
  ['inlineMath', 'Formula $E=mc^2$.'],
  ['mathBlock', '$$\na^2+b^2=c^2\n$$'],
  ['htmlBlock', '<div>HTML</div>'],
  ['footnote', 'Footnote[^one].\n\n[^one]: Definition'],
  ['commentReference', '[Cherry][ref]\n\n[ref]: https://example.com'],
  ['angleBracketCommentReference', '[Cherry][ref]\n\n[ref]: <https://example.com>'],
  ['br', 'first  \nsecond'],
  ['table', '| A | B |\n| --- | --- |\n| 1 | 2 |'],
  ['toc', '# Heading\n\n[[toc]]'],
  ['blockquote', '> Quote'],
  ['header', '## Heading'],
  ['hr', '---'],
  ['list', '- one\n- two'],
  ['detail', '+++ Detail\nBody\n+++'],
  ['panel', ':::warning\nBody\n:::'],
  ['emoji', 'Hello :smile:'],
  ['image', '![alt](https://example.com/image.png)'],
  ['link', '[Cherry](https://example.com)'],
  ['autoLink', 'https://example.com'],
  ['emphasis', '**bold** and *italic*'],
  ['backgroundColor', '!!!#fff background!!!'],
  ['color', '!!#f00 red!!'],
  ['size', '!18 large!'],
  ['sub', '^^sub^^'],
  ['sup', '^sup^'],
  ['ruby', '{字|zi}'],
  ['strikethrough', '~~removed~~'],
  ['underline', '/under/'],
  ['highLight', '==marked=='],
  ['suggester', '@Cherry'],
  ['spaceTransfer', 'escaped \\* text &amp; space'],
] as const;

describe('Cherry built-in hook fixtures', () => {
  it.each(fixtures)('%s loads, serializes, and renders with CherryEngine', async (_name, value) => {
    const root = document.createElement('div');
    document.body.append(root);
    const instance = await createCherryMilkdown({ root, value });
    instances.push(instance);
    const markdown = instance.getMarkdown();
    expect(markdown.trim().length).toBeGreaterThan(0);
    const directEngine = new CherryEngine();
    expect(normalizeHtml(instance.engine.makeHtml(markdown))).toBe(normalizeHtml(directEngine.makeHtml(value)));

    instance.setMarkdown(markdown, { emit: false });
    expect(instance.getMarkdown()).toBe(markdown);
  });

  it('round-trips the complete Cherry manual with stable Markdown and equivalent rendering', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const instance = await createCherryMilkdown({ root, value: fullManual, nativePreview: true });
    instances.push(instance);
    const first = instance.getMarkdown();
    const engine = new CherryEngine();
    expect(first.length).toBeGreaterThan(fullManual.length * 0.9);
    for (const marker of ['## 时间线', '## 语法高亮', '## 表格配图', '## 流程图', '# 编辑器操作能力', '## 协议']) {
      expect(first).toContain(marker);
    }
    expect(normalizeHtml(new CherryEngine().makeHtml(first))).toBe(
      normalizeHtml(new CherryEngine().makeHtml(fullManual)),
    );
    const rendered = document.createElement('div');
    rendered.innerHTML = engine.makeHtml(first);
    expect(rendered.querySelector('.cherry-timeline')).not.toBeNull();
    expect(rendered.querySelector('.cherry-tabs')).not.toBeNull();
    expect(rendered.querySelector('.cherry-table')).not.toBeNull();
    expect(rendered.querySelector('[data-type="codeBlock"]')).not.toBeNull();
    expect(rendered.textContent).toContain('编辑器操作能力');
    expect(rendered.textContent).toContain('协议');

    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let headingPosition = -1;
    view.state.doc.descendants((node, position) => {
      if (headingPosition < 0 && node.isText && node.text === '超链接') headingPosition = position;
    });
    expect(headingPosition).toBeGreaterThanOrEqual(0);
    view.dispatch(view.state.tr.insertText('超链接已编辑', headingPosition, headingPosition + '超链接'.length));
    const edited = instance.getMarkdown();
    const expectedEdited = fullManual.replace(/^## 超链接$/m, '## 超链接已编辑');
    expect(edited).toContain('## 超链接已编辑');
    expect(edited).toContain('## 时间线');
    expect(edited).toContain('## 协议');
    expect(normalizeHtml(new CherryEngine().makeHtml(edited))).toBe(
      normalizeHtml(new CherryEngine().makeHtml(expectedEdited)),
    );

    instance.setMarkdown(first, { emit: false });
    expect(instance.getMarkdown()).toBe(first);
  });
});
