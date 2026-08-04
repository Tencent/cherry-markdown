import { findCherryInlineMatches, transformCherryWysiwygTree } from '../src/wysiwyg';

describe('Cherry WYSIWYG markdown transform', () => {
  it('converts Cherry inline syntax into editable semantic marks', () => {
    const matches = findCherryInlineMatches(
      '!!red color!! !!!#fff background!!! !18 size! ^^sub^^ ^sup^ {字|zi} /under/ ==mark== :smile:',
    );
    expect(matches.map(({ type }) => type)).toEqual([
      'cherry_color',
      'cherry_background_color',
      'cherry_font_size',
      'cherry_subscript',
      'cherry_superscript',
      'cherry_ruby',
      'cherry_underline',
      'cherry_highlight',
      'cherry_visual_inline',
    ]);
  });

  it('creates visual block nodes and leaves ordinary fenced code alone', () => {
    const source = [
      '[[toc]]',
      '',
      '```js',
      'const value = 1;',
      '```',
      '',
      '```mermaid',
      'graph TD; A-->B;',
      '```',
    ].join('\n');
    const tree = {
      type: 'root',
      children: [
        { type: 'paragraph', position: { start: { offset: 0 }, end: { offset: 7 } }, children: [] },
        {
          type: 'code',
          lang: 'js',
          value: 'const value = 1;',
          position: { start: { offset: 9 }, end: { offset: 35 } },
        },
        {
          type: 'code',
          lang: 'mermaid',
          value: 'graph TD; A-->B;',
          position: { start: { offset: 37 }, end: { offset: source.length } },
        },
      ],
    };
    transformCherryWysiwygTree(tree, source);
    expect(tree.children.map(({ type }) => type)).toEqual(['cherry_visual_block', 'code', 'cherry_visual_block']);
    expect((tree.children[2] as { syntax?: string } | undefined)?.syntax).toBe('mermaid');
  });

  it('does not consume math because Milkdown math owns its visual schema', () => {
    expect(findCherryInlineMatches('Formula $E=mc^2$')).toEqual([]);
  });

  it('does not transform Cherry-looking syntax inside inline code nodes', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'inlineCode', value: '!!red code!!' },
            { type: 'text', value: ' !!red text!!' },
          ],
        },
      ],
    };
    transformCherryWysiwygTree(tree, '');
    expect(tree.children[0]?.children?.[0]?.type).toBe('inlineCode');
    expect(tree.children[0]?.children?.[1]?.type).toBe('text');
    expect(tree.children[0]?.children?.[2]?.type).toBe('cherry_color');
  });
});
