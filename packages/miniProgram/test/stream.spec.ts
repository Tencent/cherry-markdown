import { describe, expect, it, vi } from 'vitest';
import MiniProgramStream, { htmlToMiniProgramBlocks } from '../src/stream';

describe('@cherry-markdown/miniProgram stream', () => {
  it('returns MiniProgram block AST from the isolated stream entry', () => {
    vi.stubGlobal('BUILD_ENV', 'production');
    const stream = new MiniProgramStream({
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
  });

  it('updates markdown through setMarkdown', () => {
    vi.stubGlobal('BUILD_ENV', 'production');
    const stream = new MiniProgramStream({
      engine: {
        syntax: {
          header: {
            anchorStyle: 'none',
          },
        },
      },
    });

    expect(stream.setMarkdown('![Alt](/img.png)')).toEqual([
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

  it('exports html transform helper for future entry reuse', () => {
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

      const stream = new MiniProgramStream();
      expect(stream.setMarkdown('**hello**')).toEqual([
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
