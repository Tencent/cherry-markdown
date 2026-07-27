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
        nodes: expect.any(Array),
        attrs: { class: 'language-js' },
      },
    ]);
  });

  it('converts Cherry math HTML into typed math nodes', () => {
    expect(
      htmlToMiniProgramBlocks(
        '<p>Inline <span class="Cherry-InlineMath" data-type="mathBlock" data-formula-source="E%3Dmc%5E2">$E=mc^2$</span></p><div class="Cherry-Math" data-type="mathBlock" data-formula-source="a%5E2%20%2B%20b%5E2%20%3D%20c%5E2">$$a^2 + b^2 = c^2$$</div>',
      ),
    ).toEqual([
      {
        type: 'paragraph',
        attrs: {},
        children: [
          { type: 'text', text: 'Inline ' },
          {
            type: 'math_inline',
            text: 'E=mc^2',
            attrs: { class: 'Cherry-InlineMath', 'data-formula-source': 'E%3Dmc%5E2' },
          },
        ],
      },
      {
        type: 'math_block',
        text: 'a^2 + b^2 = c^2',
        display: true,
        attrs: { class: 'Cherry-Math', 'data-formula-source': 'a%5E2%20%2B%20b%5E2%20%3D%20c%5E2' },
      },
    ]);
  });

  it('converts Mermaid code blocks into diagram blocks', () => {
    expect(
      htmlToMiniProgramBlocks(
        '<div data-type="codeBlock" data-lang="mermaid" class="cherry-code-expand"><pre class="language-mermaid"><code class="language-mermaid">graph TD;\n  A--&gt;B;</code></pre></div>',
      ),
    ).toEqual([
      {
        type: 'diagram',
        kind: 'mermaid',
        text: 'graph TD;\n  A-->B;',
        attrs: { 'data-lang': 'mermaid', class: 'cherry-code-expand' },
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

  it('converts Cherry checklist markers into task list items', () => {
    expect(
      htmlToMiniProgramBlocks(
        '<ul class="cherry-list__default"><li class="cherry-list-item check-list-item"><p><span class="ch-icon ch-icon-check"></span> done</p></li><li class="cherry-list-item check-list-item"><p><span class="ch-icon ch-icon-square"></span> todo</p></li></ul>',
      ),
    ).toEqual([
      {
        type: 'list',
        ordered: false,
        attrs: { class: 'cherry-list__default' },
        children: [
          {
            type: 'list_item',
            attrs: { class: 'cherry-list-item check-list-item' },
            checked: true,
            children: [{ type: 'paragraph', attrs: {}, children: [{ type: 'text', text: 'done' }] }],
          },
          {
            type: 'list_item',
            attrs: { class: 'cherry-list-item check-list-item' },
            checked: false,
            children: [{ type: 'paragraph', attrs: {}, children: [{ type: 'text', text: 'todo' }] }],
          },
        ],
      },
    ]);
  });

  it('converts tables into native rows and cells with inline interaction nodes', () => {
    expect(
      htmlToMiniProgramBlocks(
        '<div class="cherry-table-wrapper"><div class="cherry-table-container"><table class="cherry-table"><thead><th>A</th><th>B</th></thead><tr><td><a href="/p">link</a></td><td><img src="img.png" alt="alt"></td></tr></table></div></div>',
      ),
    ).toEqual([
      {
        type: 'table',
        attrs: { class: 'cherry-table' },
        header: [
          {
            type: 'table_row',
            attrs: {},
            children: [
              { type: 'table_cell', header: true, attrs: {}, children: [{ type: 'text', text: 'A' }] },
              { type: 'table_cell', header: true, attrs: {}, children: [{ type: 'text', text: 'B' }] },
            ],
          },
        ],
        rows: [
          {
            type: 'table_row',
            attrs: {},
            children: [
              {
                type: 'table_cell',
                header: false,
                attrs: {},
                children: [
                  {
                    type: 'link',
                    href: '/p',
                    attrs: { href: '/p' },
                    children: [{ type: 'text', text: 'link' }],
                  },
                ],
              },
              {
                type: 'table_cell',
                header: false,
                attrs: {},
                children: [
                  {
                    type: 'image',
                    src: 'img.png',
                    alt: 'alt',
                    title: '',
                    attrs: { src: 'img.png', alt: 'alt' },
                  },
                ],
              },
            ],
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
