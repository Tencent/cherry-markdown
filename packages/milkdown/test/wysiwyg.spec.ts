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
      'cherry_emoji',
    ]);
  });

  it('keeps ordinary fenced code structured while diagrams remain native visual nodes', () => {
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
    expect(tree.children.map(({ type }) => type)).toEqual(['cherryToc', 'code', 'cherryDiagram']);
    expect((tree.children[2] as { diagramType?: string } | undefined)?.diagramType).toBe('mermaid');
  });

  it('turns a Cherry table chart into one source-preserving native visual node', () => {
    const source = ['| :line:{"title":"Trend"} | Jan | Feb |', '| --- | ---: | ---: |', '| Sales | 1 | 2 |'].join('\n');
    const tree = {
      type: 'root',
      children: [
        {
          type: 'table',
          position: { start: { offset: 0 }, end: { offset: source.length } },
          children: [],
        },
      ],
    };

    transformCherryWysiwygTree(tree, source);

    expect(tree.children).toEqual([
      expect.objectContaining({
        type: 'cherryTableChart',
        chartType: 'line',
        source,
      }),
    ]);
  });

  it('only recognizes strict YAML frontmatter at the document start', () => {
    const source = ['---', 'title: Cherry', '---', '', '# Heading', '', '---', '', 'Body', '', '---'].join('\n');
    const tree = {
      type: 'root',
      children: [
        { type: 'thematicBreak', position: { start: { offset: 0 }, end: { offset: 3 } } },
        { type: 'paragraph', position: { start: { offset: 4 }, end: { offset: 17 } }, children: [] },
        { type: 'thematicBreak', position: { start: { offset: 18 }, end: { offset: 21 } } },
        { type: 'heading', position: { start: { offset: 23 }, end: { offset: 32 } }, children: [] },
        { type: 'thematicBreak', position: { start: { offset: 34 }, end: { offset: 37 } } },
        { type: 'paragraph', position: { start: { offset: 39 }, end: { offset: 43 } }, children: [] },
        { type: 'thematicBreak', position: { start: { offset: 45 }, end: { offset: 48 } } },
      ],
    };

    transformCherryWysiwygTree(tree, source);

    expect(tree.children.map(({ type }) => type)).toEqual([
      'cherryFrontmatter',
      'heading',
      'thematicBreak',
      'paragraph',
      'thematicBreak',
    ]);
  });

  it('does not interpret horizontal rules around a fenced example as frontmatter', () => {
    const source = [
      '# Before',
      '',
      '---',
      '',
      '```yaml',
      '---',
      'title: example',
      '---',
      '```',
      '',
      '---',
      '',
      '# After',
    ].join('\n');
    const tree = {
      type: 'root',
      children: [
        { type: 'heading', position: { start: { offset: 0 }, end: { offset: 8 } }, children: [] },
        { type: 'thematicBreak', position: { start: { offset: 10 }, end: { offset: 13 } } },
        { type: 'code', position: { start: { offset: 15 }, end: { offset: 52 } }, value: '---\ntitle: example\n---' },
        { type: 'thematicBreak', position: { start: { offset: 54 }, end: { offset: 57 } } },
        { type: 'heading', position: { start: { offset: 59 }, end: { offset: source.length } }, children: [] },
      ],
    };

    transformCherryWysiwygTree(tree, source);

    expect(tree.children.map(({ type }) => type)).toEqual([
      'heading',
      'thematicBreak',
      'code',
      'thematicBreak',
      'heading',
    ]);
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
