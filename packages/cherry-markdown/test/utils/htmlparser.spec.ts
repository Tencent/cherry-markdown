import { describe, expect, it } from 'vite-plus/test';
import htmlParser from '../../src/utils/htmlparser';

type HtmlParsedItem = {
  type?: string;
  name?: string;
  voidElement?: boolean;
  attrs?: Record<string, string>;
  children?: HtmlParsedItem[];
  content?: string;
};

describe('utils/htmlparser markdown conversion', () => {
  it('converts block and inline formatting to markdown', () => {
    const html = [
      '<h1>Title</h1>',
      '<h2>Section</h2>',
      '<h3>Three</h3>',
      '<h4>Four</h4>',
      '<h5>Five</h5>',
      '<h6>Six</h6>',
      '<p>Hello <strong>bold</strong> <b>also bold</b> <i>italic</i> <strike>old</strike> <del>gone</del> <u>under</u></p>',
      '<p>H<sub>2</sub>O x<sup>2</sup> <code>a`b</code></p>',
      '<hr>',
    ].join('');

    expect(htmlParser.run(html)).toBe(
      [
        '# Title',
        '',
        '## Section',
        '',
        '### Three',
        '',
        '#### Four',
        '',
        '##### Five',
        '',
        '###### Six',
        '',
        'Hello **bold** **also bold** *italic* ~~old~~ ~~gone~~  /under/ ',
        'H^^2^^O x^2^ `a\\`b`',
        '',
        '',
        '----',
      ].join('\n'),
    );
  });

  it('converts links, media, tapd graph images, and entities', () => {
    const html = [
      '<p><a href="https://example.com">Example</a> <a href="https://plain.test">https://plain.test</a> <a>missing</a></p>',
      '<p><img alt="Alt" src="/a.png"><img src="/b.png"></p>',
      '<p><video src="/v.mp4" poster="/p.jpg" title="Clip"></video></p>',
      '<p><img data-control="tapd-graph" title="Flow" src="/g.svg" data-origin-xml="xml" data-graph-id="42"></p>',
      '<p>&lt;b&gt;A&amp;B&lt;/b&gt;&nbsp; &gt;</p>',
      '<!-- dropped -->',
    ].join('');

    expect(htmlParser.run(html)).toBe(
      [
        '[Example](https://example.com) https://plain.test  ',
        '![Alt](/a.png)![image](/b.png)',
        '!video[Clip](/v.mp4){poster=/p.jpg}',
        '![Flow](/g.svg){data-control=tapd-graph data-origin-xml=xml data-graph-id=42}',
        '<b>A&B</b>  >',
      ].join('\n'),
    );
  });

  it('converts lists, checklist icons, and nested line breaks', () => {
    const html = [
      '<p><span class="ch-icon-check"></span> done <span class="ch-icon-square"></span> todo</p>',
      '<p>A<span class="cherry-code-preview-lang-select">js</span>B</p>',
      '<ul><li>One</li><li>Two<br>Line</li></ul>',
      '<ol><li>First</li><li>Second</li></ol>',
    ].join('');

    expect(htmlParser.run(html)).toBe('[x] done [ ] todo\nAB\n- One\n- Two\n\tLine\n\n1. First\n2. Second');
  });

  it('converts tables with generated and explicit header separators', () => {
    expect(
      htmlParser.run(
        '<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>18</td></tr></tbody></table>',
      ),
    ).toBe('|Name|Age|\n|:-:|:-:|\n|Alice|18|');

    expect(
      htmlParser.run('<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></tbody></table>'),
    ).toBe('| | |\n|:-:|:-:|\n|A|B|\n|1|2|');
  });

  it('converts quote-like blocks and drops non-content tags', () => {
    const html = [
      '<blockquote><p>A</p><p>B</p></blockquote>',
      '<address>Addr</address>',
      '<script>window.bad = true</script>',
      '<style>.bad{color:red}</style>',
      '<meta name="x">',
      '<link href="/x.css">',
    ].join('');

    expect(htmlParser.run(html)).toBe('>A\nB\n\n>Addr');
  });

  it('converts pre and code tags using block code fences when needed', () => {
    expect(htmlParser.run('<pre><code>const a = 1;<br>return a;</code></pre>')).toBe(
      '```\nconst a = 1;\nreturn a;\n```',
    );
    expect(htmlParser.run('<pre><li>one</li><br><span>two</span></pre>')).toBe('```\n\none\ntwo\n```');
    expect(htmlParser.run('<p><code>line 1\nline 2</code></p>')).toBe('```\nline 1\nline 2\n```');
  });

  it('normalizes styled span whitespace without emitting disabled style syntax', () => {
    expect(htmlParser.run('<p><span style="color: #f00;">A\n\tB</span></p>')).toBe('A B');
  });
});

describe('utils/htmlparser parser internals', () => {
  it('parses tags, void elements, text tails, and custom components', () => {
    expect(htmlParser.htmlParser.parseTags('<img src="a" alt="b" />')).toEqual({
      type: 'tag',
      name: 'img',
      voidElement: true,
      attrs: { src: 'a', alt: 'b' },
      children: [],
    });

    expect(
      htmlParser.htmlParser.parseHtml('<x-card><span>ignored</span></x-card><p>after<br>tail</p>', {
        components: { 'x-card': true },
      }),
    ).toEqual([
      {
        type: 'component',
        name: 'x-card',
        voidElement: false,
        attrs: {},
        children: [],
      },
      {
        type: 'tag',
        name: 'p',
        voidElement: false,
        attrs: {},
        children: [
          { type: 'text', content: 'after' },
          { type: 'tag', name: 'br', voidElement: true, attrs: {}, children: [] },
          { type: 'text', content: 'tail' },
        ],
      },
    ]);

    expect(htmlParser.htmlParser.parseHtml('<p>kept\n</p>')[0].children).toEqual([{ type: 'text', content: 'kept\n' }]);
  });

  it('clears paragraph-level color styles without dropping unrelated styles', () => {
    const parsed: HtmlParsedItem[] = [
      {
        type: 'tag',
        name: 'div',
        attrs: {},
        children: [
          {
            type: 'tag',
            name: 'p',
            attrs: { style: 'color: #f00; background-color: #fff; font-weight: bold;' },
            children: [{ type: 'text', content: 'Only paragraph' }],
          },
          {
            type: 'tag',
            name: 'p',
            attrs: { style: 'color: #0f0;' },
            children: [{ type: 'text', content: 'Color only' }],
          },
        ],
      },
    ];

    htmlParser.paragraphStyleClear(parsed);

    expect(parsed[0].children?.[0].attrs).toEqual({ style: ' font-weight: bold;' });
    expect(parsed[0].children?.[1].attrs).toEqual({});
  });

  it('counts empty and non-empty parsed items recursively', () => {
    expect(htmlParser.notEmptyTagCount(undefined)).toBe(0);
    expect(htmlParser.notEmptyTagCount({ type: 'text', content: ' \n\t ' })).toBe(0);
    expect(htmlParser.notEmptyTagCount({ type: 'tag', voidElement: true, children: [] })).toBe(0);
    expect(
      htmlParser.notEmptyTagCount({
        type: 'tag',
        children: [
          { type: 'text', content: 'A' },
          { type: 'tag', children: [{ type: 'text', content: 'B' }] },
        ],
      }),
    ).toBe(2);
  });

  it('iterates parsed descendants and removes color-only self styles', () => {
    const root: HtmlParsedItem = {
      attrs: {},
      children: [
        { attrs: { style: 'color: #111;' }, children: [] },
        { attrs: { style: 'background-color: #fff; color: #222; font-size: 12px;' }, children: [] },
      ],
    };
    const visited: number[] = [];

    htmlParser.forEachHtmlParsedItems(root, () => visited.push(1));
    htmlParser.clearChildColorAttrs(root);

    expect(visited).toHaveLength(3);
    expect(root.children?.[0].attrs).toEqual({});
    expect(root.children?.[1].attrs).toEqual({ style: ' font-size: 12px;' });
  });
});

describe('utils/htmlparser format engines', () => {
  it('keeps paragraph text unchanged when it already ends with a newline', () => {
    htmlParser.tagParser.formatEngine = htmlParser.mdFormatEngine;

    expect(htmlParser.tagParser.pParser(document.createElement('p'), 'line\n')).toBe('line\n');
    expect(htmlParser.tagParser.divParser(document.createElement('div'), 'line\n')).toBe('line\n');
  });

  it('parses supported inline style attributes', () => {
    const { styleParser } = htmlParser.tagParser;

    expect(styleParser.colorAttrParser('color: #abc123; font-size: small;')).toBe('#abc123');
    expect(styleParser.colorAttrParser('font-size: small;')).toBe('');
    expect(styleParser.sizeAttrParser('font-size: 14px;')).toBe('14');
    expect(styleParser.sizeAttrParser('font-size: x-small;')).toBe(10);
    expect(styleParser.sizeAttrParser('font-size: small;')).toBe(12);
    expect(styleParser.sizeAttrParser('font-size: medium;')).toBe(16);
    expect(styleParser.sizeAttrParser('font-size: large;')).toBe(18);
    expect(styleParser.sizeAttrParser('font-size: x-large;')).toBe(24);
    expect(styleParser.sizeAttrParser('font-size: xx-large;')).toBe(32);
    expect(styleParser.sizeAttrParser('font-size: huge;')).toBe('');
    expect(styleParser.sizeAttrParser('color: #fff;')).toBe('');
    expect(styleParser.bgColorAttrParser('background-color: rgb( 10, 11, 12);')).toBe('#abc');
    expect(styleParser.bgColorAttrParser('background-color: #ffeeaa;')).toBe('#ffeeaa');
    expect(styleParser.bgColorAttrParser('color: #fff;')).toBe('');
  });

  it('keeps style conversion empty for empty, multiline, or missing attributes', () => {
    const engine = htmlParser.mdFormatEngine;

    expect(engine.convertColor(' value ', '#fff')).toBe('!!#fff value!!');
    expect(engine.convertColor(' \n ', '#fff')).toBe('');
    expect(engine.convertColor('line\nbreak', '#fff')).toBe('line\nbreak');
    expect(engine.convertColor(' value ', '')).toBe('value');
    expect(engine.convertSize(' value ', '14')).toBe('!14 value!');
    expect(engine.convertSize('line\nbreak', '14')).toBe('line\nbreak');
    expect(engine.convertSize(' value ', '')).toBe('value');
    expect(engine.convertBgColor(' value ', '#fff')).toBe('!!!#fff value!!!');
    expect(engine.convertBgColor('line\nbreak', '#fff')).toBe('line\nbreak');
    expect(engine.convertBgColor(' value ', '')).toBe('value');
  });

  it('formats markdown primitives directly', () => {
    const engine = htmlParser.mdFormatEngine;
    const graphWithThrowingAttrs = {
      get attrs() {
        throw new Error('unreadable attrs');
      },
    };

    expect(engine.convertBr('a', '\n')).toBe('a\n');
    expect(engine.convertCode('a`b')).toBe('`a\\`b`');
    expect(engine.convertCode('a\nb')).toBe('```\na\nb\n```');
    expect(engine.convertB('   ')).toBe('');
    expect(engine.convertI('x')).toBe('*x*');
    expect(engine.convertI('   ')).toBe('');
    expect(engine.convertU('x')).toBe(' /x/ ');
    expect(engine.convertU('   ')).toBe('');
    expect(engine.convertGraph('', '/g.svg', 'xml')).toBe(
      '![graph](/g.svg){data-control=tapd-graph data-origin-xml=xml}',
    );
    expect(engine.convertGraph('Flow', '/g.svg', 'xml', graphWithThrowingAttrs)).toBe(
      '![Flow](/g.svg){data-control=tapd-graph data-origin-xml=xml}',
    );
    expect(engine.convertVideo('', '/v.mp4', undefined, '')).toBe('!video[video](/v.mp4){poster=undefined}');
    expect(engine.convertA('', '/x')).toBe('');
    expect(engine.convertA('same', 'same')).toBe('same ');
    expect(engine.convertSup('a^b')).toBe('^a\\^b^');
    expect(engine.convertSub('a^^b')).toBe('^^a\\^\\^b^^');
    expect(engine.convertTd('a b\nc')).toBe('~|a~s~b<br>c ~|');
    expect(engine.convertTh('   ')).toBe('');
    expect(engine.convertTr('   ')).toBe('');
    expect(engine.convertThead('plain')).toBe('plain\n');
    expect(engine.convertTable('\n\n')).toBe('\n');
    expect(engine.convertLi('\na\nb\n')).toBe('- a\n\tb\n');
    expect(engine.convertUl('- a\n')).toBe('- a\n\n');
    expect(engine.convertHr('text')).toBe('\n\n----\ntext');
    expect(engine.convertH3('three\n')).toBe('### three\n\n');
    expect(engine.convertH4('four\n')).toBe('#### four\n\n');
    expect(engine.convertH5('five\n')).toBe('##### five\n\n');
    expect(engine.convertH6('small\n')).toBe('###### small\n\n');
    expect(engine.convertStrong('   ')).toBe('');
    expect(engine.convertStrike('   ')).toBe('');
    expect(engine.convertDel('   ')).toBe('');
  });
});
