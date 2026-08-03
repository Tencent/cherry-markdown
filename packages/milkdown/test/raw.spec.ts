import { builtinCherryRawPatterns, detectCherryRawRanges, transformCherryRawTree } from '../src/raw';

describe('Cherry raw detection', () => {
  it('detects built-in block and inline syntax while ignoring ordinary code', () => {
    const markdown = [
      '---',
      'title: Demo',
      '---',
      '',
      '[[toc]]',
      '',
      'Text !!#f00 red!! and $a+b$.',
      '',
      '```js',
      'const value = "$not_math$";',
      '```',
      '',
      '```mermaid',
      'graph TD; A-->B;',
      '```',
    ].join('\n');

    const ranges = detectCherryRawRanges(markdown);
    expect(ranges.map((range) => range.syntax)).toEqual(['frontmatter', 'toc', 'color', 'inline-math', 'diagram']);
    expect(ranges.some((range) => range.source.includes('not_math'))).toBe(false);
  });

  it('appends custom patterns after the built-ins', () => {
    const ranges = detectCherryRawRanges('Hello @[alice]', [
      { name: 'mention', kind: 'inline', pattern: /@\[[^\]]+\]/ },
    ]);
    expect(ranges).toEqual([expect.objectContaining({ kind: 'inline', source: '@[alice]', syntax: 'mention' })]);
  });

  it('keeps built-in pattern names stable', () => {
    expect(builtinCherryRawPatterns.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'frontmatter',
        'math-block',
        'toc',
        'comment-reference',
        'panel',
        'detail',
        'ruby',
        'inline-math',
      ]),
    );
  });
});

describe('Cherry raw remark transform', () => {
  it('replaces top-level blocks and splits inline text nodes', () => {
    const source = '[[toc]]\n\nText !!red value!! end';
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: '[[toc]]' }],
          position: { start: { offset: 0 }, end: { offset: 7 } },
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Text !!red value!! end' }],
          position: { start: { offset: 9 }, end: { offset: source.length } },
        },
      ],
    };

    transformCherryRawTree(tree, source);
    expect(tree.children[0]).toEqual(
      expect.objectContaining({ type: 'cherryRawBlock', syntax: 'toc', value: '[[toc]]' }),
    );
    expect(tree.children[1]?.children).toEqual([
      { type: 'text', value: 'Text ' },
      expect.objectContaining({ type: 'cherryRawInline', syntax: 'color', value: '!!red value!!' }),
      { type: 'text', value: ' end' },
    ]);
  });
});
