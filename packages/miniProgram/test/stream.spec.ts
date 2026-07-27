/* global globalThis */
import { describe, expect, it, vi } from 'vitest';
import CherryStream from '../src';
import { blocksToMiniProgramView, resolvePendingImages } from '../src/shared/view';
import { htmlToMiniProgramBlocks } from '../src/shared/transform';
import { markdownToHtml } from '../src/renderer';

describe('@cherry-markdown/miniprogram stream', () => {
  it('returns MiniProgram block AST from the isolated stream entry', () => {
    vi.stubGlobal('BUILD_ENV', 'production');
    const stream = new CherryStream({
      engine: {
        syntax: {
          header: {
            anchorStyle: 'none',
          },
        },
      },
    });

    expect(stream.makeBlocks('**hello**')).toEqual([
      {
        type: 'paragraph',
        attrs: {},
        children: [{ type: 'strong', attrs: {}, children: [{ type: 'text', text: 'hello' }] }],
      },
    ]);
    expect(stream.makeHtml('**hello**', 'miniProgramBlocks')).toEqual([
      {
        type: 'paragraph',
        attrs: {},
        children: [{ type: 'strong', attrs: {}, children: [{ type: 'text', text: 'hello' }] }],
      },
    ]);
  });

  it('updates markdown through setMarkdown', () => {
    vi.stubGlobal('BUILD_ENV', 'production');
    const stream = new CherryStream({
      engine: {
        syntax: {
          header: {
            anchorStyle: 'none',
          },
        },
      },
    });

    stream.setMarkdown('![Alt](/img.png)');
    expect(stream.makeBlocks(stream.getMarkdown())).toEqual([
      {
        type: 'image',
        src: '/img.png',
        alt: 'Alt',
        title: '',
        attrs: expect.objectContaining({ src: '/img.png', alt: 'Alt' }),
      },
    ]);
    expect(stream.getMarkdown()).toBe('![Alt](/img.png)');
  });

  it('returns WXML-friendly view blocks from setMarkdownView', () => {
    const stream = new CherryStream();

    expect(stream.setMarkdownView('**hello** [go](/page)')).toEqual([
      {
        type: 'paragraph',
        inlines: [
          { type: 'text', text: 'hello', className: 'md-strong', href: '' },
          { type: 'text', text: ' ', className: '', href: '' },
          { type: 'link', text: 'go', className: 'md-link', href: '/page' },
        ],
      },
    ]);
  });

  it('normalizes unfinished Markdown syntax during token streaming', () => {
    const stream = new CherryStream();

    expect(stream.setMarkdownView('#')).toEqual([]);
    expect(stream.setMarkdownView('# ')).toEqual([]);
    expect(stream.setMarkdownView('# H')).toEqual([
      {
        type: 'heading',
        level: 1,
        inlines: [{ type: 'text', text: 'H', className: '', href: '' }],
      },
    ]);
    expect(stream.setMarkdownView('**bo')).toEqual([
      {
        type: 'paragraph',
        inlines: [{ type: 'text', text: 'bo', className: 'md-strong', href: '' }],
      },
    ]);
  });

  it('resolves deferred image src values for post-setData activation', () => {
    const blocks = [{ type: 'image', src: '', pendingSrc: '/img.png', alt: 'A' }];

    expect(resolvePendingImages(blocks)).toEqual([
      { type: 'image', src: '/img.png', pendingSrc: '/img.png', alt: 'A' },
    ]);
  });

  it('keeps deferred images as placeholders to avoid native image work during streaming', () => {
    expect(blocksToMiniProgramView(htmlToMiniProgramBlocks('<img src="/img.png" alt="A" />'))).toEqual([
      { type: 'image_placeholder', src: '/img.png', alt: 'A', text: 'A' },
    ]);
  });

  it('renders basic pipe tables as native table view blocks', () => {
    const html = markdownToHtml('| A | B |\n| --- | --- |\n| **x** | [go](/page) |');
    expect(html).toContain('<table');
    const blocks = htmlToMiniProgramBlocks(html);
    expect(blocks[0].type).toBe('table');

    const stream = new CherryStream();
    expect(stream.setMarkdownView('| A | B |\n| --- | --- |\n| **x** | [go](/page) |')).toEqual([
      {
        type: 'table',
        header: [
          {
            cells: [
              { header: true, align: '', inlines: [{ type: 'text', text: 'A', className: '', href: '' }] },
              { header: true, align: '', inlines: [{ type: 'text', text: 'B', className: '', href: '' }] },
            ],
          },
        ],
        rows: [
          {
            cells: [
              { header: false, align: '', inlines: [{ type: 'text', text: 'x', className: 'md-strong', href: '' }] },
              {
                header: false,
                align: '',
                inlines: [{ type: 'link', text: 'go', className: 'md-link', href: '/page' }],
              },
            ],
          },
        ],
      },
    ]);

    expect(
      new CherryStream().setMarkdownView('| A | B |\n| --- | --- |\n| [go](/page) | ![alt](img.png) |', {
        deferImages: false,
      })[0],
    ).toEqual(
      expect.objectContaining({
        type: 'table',
        rows: [
          {
            cells: [
              {
                header: false,
                align: '',
                inlines: [{ type: 'link', text: 'go', className: 'md-link', href: '/page' }],
              },
              {
                header: false,
                align: '',
                inlines: [{ type: 'image', src: 'img.png', alt: 'alt' }],
              },
            ],
          },
        ],
      }),
    );
  });

  it('renders Cherry task lists as native checked list items', () => {
    const stream = new CherryStream();

    expect(stream.setMarkdownView('- [x] done\n- [ ] todo')).toEqual([
      {
        type: 'list',
        ordered: false,
        children: [
          {
            task: true,
            marker: '☑',
            checked: true,
            inlines: [{ type: 'text', text: 'done', className: '', href: '' }],
          },
          {
            task: true,
            marker: '☐',
            checked: false,
            inlines: [{ type: 'text', text: 'todo', className: '', href: '' }],
          },
        ],
      },
    ]);
  });

  it('returns list markers from the view model instead of requiring WXML marker logic', () => {
    const stream = new CherryStream();

    expect(stream.setMarkdownView('- one\n- two')[0]).toEqual({
      type: 'list',
      ordered: false,
      children: [
        { task: false, marker: '•', inlines: [{ type: 'text', text: 'one', className: '', href: '' }] },
        { task: false, marker: '•', inlines: [{ type: 'text', text: 'two', className: '', href: '' }] },
      ],
    });

    expect(stream.setMarkdownView('1. one\n2. two')[0]).toEqual({
      type: 'list',
      ordered: true,
      children: [
        { task: false, marker: '1.', inlines: [{ type: 'text', text: 'one', className: '', href: '' }] },
        { task: false, marker: '2.', inlines: [{ type: 'text', text: 'two', className: '', href: '' }] },
      ],
    });
  });

  it('returns highlighted code runs for native code block rendering', () => {
    const stream = new CherryStream();

    expect(stream.setMarkdownView('```js\nconst message = "hello";\n```')[0]).toEqual({
      type: 'code_block',
      lang: 'js',
      text: 'const message = "hello";',
      runs: expect.arrayContaining([
        { text: 'const', className: 'md-code-token md-code-keyword' },
        { text: '"hello"', className: 'md-code-token md-code-string' },
      ]),
    });
  });

  it('returns math and Mermaid view blocks from Cherry-rendered HTML', () => {
    const stream = new CherryStream();

    expect(stream.setMarkdownView('Inline $E=mc^2$ test')[0]).toEqual({
      type: 'paragraph',
      inlines: [
        { type: 'text', text: 'Inline ', className: '', href: '' },
        { type: 'math_inline', text: '$E=mc^2$', source: 'E=mc^2', className: 'md-math-inline' },
        { type: 'text', text: 'test', className: '', href: '' },
      ],
    });

    expect(stream.setMarkdownView('$$\nE=mc^2\n$$')[0]).toEqual({
      type: 'math_block',
      text: '$$\nE=mc^2\n$$',
      source: 'E=mc^2',
      display: true,
    });

    expect(stream.setMarkdownView('```mermaid\ngraph TD;\n  A-->B;\n```')[0]).toEqual({
      type: 'diagram',
      kind: 'mermaid',
      text: 'graph TD;\n  A-->B;',
    });
  });

  it('keeps transforms internal to the public package entry', () => {
    expect(htmlToMiniProgramBlocks('<p><a href="/page">go</a></p>')).toEqual([
      {
        type: 'paragraph',
        attrs: {},
        children: [
          {
            type: 'link',
            href: '/page',
            attrs: { href: '/page' },
            children: [{ type: 'text', text: 'go' }],
          },
        ],
      },
    ]);
  });

  it('runs without browser globals', () => {
    const originalWindow = globalThis.window;
    const originalSelf = globalThis.self;

    try {
      delete globalThis.window;
      delete globalThis.self;

      const stream = new CherryStream();
      expect(stream.makeBlocks('**hello**')).toEqual([
        {
          type: 'paragraph',
          attrs: {},
          children: [{ type: 'strong', attrs: {}, children: [{ type: 'text', text: 'hello' }] }],
        },
      ]);
    } finally {
      globalThis.window = originalWindow;
      globalThis.self = originalSelf;
    }
  });
});
