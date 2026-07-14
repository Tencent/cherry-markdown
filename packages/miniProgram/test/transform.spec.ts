import { describe, expect, it } from 'vitest';
import { htmlToMiniProgramBlocks } from '../src/transform';

describe('miniProgramTransform', () => {
  it('converts paragraph inline formatting', () => {
    expect(htmlToMiniProgramBlocks('<p>Hello <strong>bold</strong> <em>em</em></p>')).toEqual([
      {
        type: 'paragraph',
        attrs: {},
        children: [
          { type: 'text', text: 'Hello ' },
          { type: 'strong', attrs: {}, children: [{ type: 'text', text: 'bold' }] },
          { type: 'text', text: ' ' },
          { type: 'em', attrs: {}, children: [{ type: 'text', text: 'em' }] },
        ],
      },
    ]);
  });

  it('extracts links and images for native interactions', () => {
    expect(
      htmlToMiniProgramBlocks('<p><a href="https://example.com">link</a></p><img src="/a.png" alt="A" />'),
    ).toEqual([
      {
        type: 'paragraph',
        attrs: {},
        children: [
          {
            type: 'link',
            href: 'https://example.com',
            attrs: { href: 'https://example.com' },
            children: [{ type: 'text', text: 'link' }],
          },
        ],
      },
      {
        type: 'image',
        src: '/a.png',
        alt: 'A',
        title: '',
        attrs: { src: '/a.png', alt: 'A' },
      },
    ]);
  });

  it('extracts copy-ready code block text', () => {
    expect(
      htmlToMiniProgramBlocks(
        '<pre class="language-js"><code class="language-js">const a = 1;\nconsole.log(a);</code></pre>',
      ),
    ).toEqual([
      {
        type: 'code_block',
        lang: 'js',
        text: 'const a = 1;\nconsole.log(a);',
        attrs: { class: 'language-js' },
      },
    ]);
  });

  it('converts ordered and unordered lists', () => {
    expect(
      htmlToMiniProgramBlocks('<ul><li>One</li><li><strong>Two</strong></li></ul><ol><li>Three</li></ol>'),
    ).toEqual([
      {
        type: 'list',
        ordered: false,
        attrs: {},
        children: [
          {
            type: 'list_item',
            attrs: {},
            children: [{ type: 'paragraph', children: [{ type: 'text', text: 'One' }] }],
          },
          {
            type: 'list_item',
            attrs: {},
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'strong', attrs: {}, children: [{ type: 'text', text: 'Two' }] }],
              },
            ],
          },
        ],
      },
      {
        type: 'list',
        ordered: true,
        attrs: {},
        children: [
          {
            type: 'list_item',
            attrs: {},
            children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Three' }] }],
          },
        ],
      },
    ]);
  });

  it('falls back to sanitized rich-text nodes for unknown complex tags', () => {
    expect(
      htmlToMiniProgramBlocks(
        '<custom onclick="bad()"><script>bad()</script><span onmouseover="bad()">ok</span></custom>',
      ),
    ).toEqual([
      {
        type: 'html',
        nodes: [
          {
            name: 'custom',
            attrs: {},
            children: [
              {
                name: 'span',
                attrs: {},
                children: [{ type: 'text', text: 'ok' }],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('converts stream cursor span to a cursor inline node', () => {
    expect(htmlToMiniProgramBlocks('<p>loading<span class="cherry-flow-session-cursor"></span></p>')).toEqual([
      {
        type: 'paragraph',
        attrs: {},
        children: [{ type: 'text', text: 'loading' }, { type: 'cursor' }],
      },
    ]);
  });
});
