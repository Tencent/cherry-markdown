import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CherryEngine from '../../src/index.engine.core';

const createEngine = (options = {}) =>
  new CherryEngine({
    engine: {
      global: {
        classicBr: false,
      },
      syntax: {
        header: {
          anchorStyle: 'none',
        },
      },
    },
    ...options,
  });

const render = (markdown: string, options = {}) => {
  const engine = createEngine(options);
  const container = document.createElement('div');
  // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
  container.innerHTML = engine.makeHtml(markdown);
  return container;
};

interface CustomRenderEngine {
  makeHtml(markdown: string): string;
}

interface CustomRenderOptions {
  showSourceToolbar?: boolean;
}

interface RenderedTableData {
  header: string[];
  rows: string[][];
  colLength: number;
  rowLength: number;
}

interface TestChartCherry {
  options: {
    engine: {
      global: {
        flowSessionContext: boolean;
      };
    };
  };
}

interface TestChartRenderCall {
  type: string;
  options: Record<string, unknown>;
  table: RenderedTableData;
  cherry: TestChartCherry;
}

class TestMarkdownChartRenderer {
  static latestOptions: Record<string, unknown> | undefined;
  static latestRender: TestChartRenderCall | undefined;

  constructor(options: Record<string, unknown>) {
    TestMarkdownChartRenderer.latestOptions = options;
  }

  render(type: string, options: Record<string, unknown>, table: RenderedTableData, cherry: TestChartCherry) {
    TestMarkdownChartRenderer.latestRender = { type, options, table, cherry };
    return `<section class="test-table-chart" data-type="${type}" data-title="${String(options.title ?? '')}">${table.rows.length}</section>`;
  }
}

describe('Cherry Markdown final rendering', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
    TestMarkdownChartRenderer.latestOptions = undefined;
    TestMarkdownChartRenderer.latestRender = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders JSON front matter as escaped metadata before the document body', () => {
    const container = render('---\n{"title":"A < B","draft":true}\n---\n\n# Document title');
    const metadata = container.querySelector('[data-type="frontMatter"]');

    expect(metadata?.getAttribute('data-lines')).toBe('3');
    expect(metadata?.getAttribute('data-content')).toBe('{"title":"A < B","draft":true}');
    expect(container.querySelector('h1')?.textContent).toBe('Document title');
  });

  it('renders an aligned table with inline Markdown in its cells', () => {
    const container = render('| Name | Value |\n| :--- | ---: |\n| **Cherry** | 42 |');
    const table = container.querySelector('table');

    expect(table).not.toBeNull();
    expect(table?.querySelectorAll('thead th')).toHaveLength(2);
    expect(table?.querySelectorAll('tbody td')).toHaveLength(2);
    expect(table?.querySelector('thead th')?.getAttribute('align')).toBe('left');
    expect(table?.querySelector('thead th:last-child')?.getAttribute('align')).toBe('right');
    expect(table?.querySelector('strong')?.textContent).toBe('Cherry');
  });

  it('renders task list state without losing item text', () => {
    const container = render('- [x] shipped\n- [ ] pending');
    const items = container.querySelectorAll('li.check-list-item');

    expect(items).toHaveLength(2);
    expect(items[0].querySelector('.ch-icon-check')).not.toBeNull();
    expect(items[1].querySelector('.ch-icon-square')).not.toBeNull();
    expect(container.textContent).toContain('shipped');
    expect(container.textContent).toContain('pending');
  });

  it('renders paragraph boundaries, line breaks, and source-line metadata', () => {
    const normal = render('first **strong**\nsecond\n\nthird');
    const classic = render('first\nsecond', { engine: { global: { classicBr: true } } });
    const paragraphs = normal.querySelectorAll('p[data-type="p"]');

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].getAttribute('data-lines')).toBe('2');
    expect(paragraphs[0].querySelector('strong')?.textContent).toBe('strong');
    expect(paragraphs[0].querySelector('br')).not.toBeNull();
    expect(paragraphs[1].textContent).toBe('third');
    expect(classic.querySelector('p[data-type="p"]')?.querySelector('br')).toBeNull();
    expect(classic.querySelector('p[data-type="p"]')?.textContent).toContain('first\nsecond');
  });

  it('nests a marker type change when listNested is enabled', () => {
    const container = render('- parent\n1. ordered child', {
      engine: { syntax: { list: { indentSpace: 2, listNested: true } } },
    });

    expect(container.querySelectorAll(':scope > ul')).toHaveLength(1);
    expect(container.querySelector('ul > li > ol > li')?.textContent).toBe('ordered child');
  });

  it('renders rules, strikethrough, and extra blank lines in final HTML', () => {
    const container = render('~~removed~~\n\n---\n\nfirst\n\n\nsecond');

    expect(container.querySelector('hr')?.getAttribute('data-lines')).toBe('2');
    expect(container.querySelector('del')?.textContent).toBe('removed');
    expect(container.querySelector('[data-type="br"]')?.getAttribute('data-lines')).toBe('2');
    expect(container.textContent).toContain('first');
    expect(container.textContent).toContain('second');
  });

  it('renders consecutive spaces when the optional space syntax is enabled', () => {
    const container = render('before  after', { engine: { syntax: { space: true } } });

    expect(container.innerHTML).toContain('before&nbsp;&nbsp;after');
    expect(container.textContent).toContain('before\u00a0\u00a0after');
  });

  it('renders a table of contents linked to final heading IDs', () => {
    const container = render('[toc]\n\n# Introduction\n\n## Details');
    const toc = container.querySelector('.toc');

    expect(toc).not.toBeNull();
    expect(toc?.querySelectorAll('li')).toHaveLength(2);
    expect(toc?.querySelector('a[href="#introduction"]')?.textContent).toBe('Introduction');
    expect(toc?.querySelector('a[href="#details"]')?.textContent).toBe('Details');
    expect(container.querySelector('h1#introduction')?.textContent).toBe('Introduction');
    expect(container.querySelector('h2#details')?.textContent).toBe('Details');
  });

  it('renders a titled information panel', () => {
    const container = render(':::warning Build status\n**Check** the logs.\n:::');
    const panel = container.querySelector('.cherry-panel.cherry-panel__warning');

    expect(panel).not.toBeNull();
    expect(panel?.querySelector('.cherry-panel--title')?.textContent).toBe('Build status');
    expect(panel?.querySelector('.cherry-panel--body strong')?.textContent).toBe('Check');
    expect(panel?.querySelector('.cherry-panel--body')?.textContent).toContain('the logs.');
  });

  it('renders each column in a two-column panel', () => {
    const container = render('::: 2cols\nleft **column**\n::\nright column\n:::');
    const panel = container.querySelector('.cherry-panel-cols.cherry-panel-cols__2cols');
    const columns = panel?.querySelectorAll('.cherry-panel--col');

    expect(columns).toHaveLength(2);
    expect(columns?.[0].textContent).toContain('left column');
    expect(columns?.[0].querySelector('strong')?.textContent).toBe('column');
    expect(columns?.[1].textContent).toContain('right column');
  });

  it('leaves disabled panel and alignment syntax as text', () => {
    const panel = render(':::warning Warning\nbody\n:::', {
      engine: { syntax: { panel: { enablePanel: false } } },
    });
    const alignment = render(':::center\nbody\n:::', {
      engine: { syntax: { panel: { enableAlign: false, enableJustify: false } } },
    });

    expect(panel.querySelector('.cherry-panel')).toBeNull();
    expect(panel.textContent).toContain(':::warning Warning');
    expect(alignment.querySelector('.cherry-text-align')).toBeNull();
    expect(alignment.textContent).toContain(':::center');
  });

  it('renders collapsed and expanded detail sections', () => {
    const collapsed = render('+++ More details\ncollapsed body\n+++');
    const expanded = render('+++- Open details\nexpanded body\n+++');

    expect(collapsed.querySelector('.cherry-detail__single details')?.hasAttribute('open')).toBe(false);
    expect(collapsed.querySelector('summary')?.textContent).toBe('More details');
    expect(collapsed.querySelector('.cherry-detail-body')?.textContent).toContain('collapsed body');
    expect(expanded.querySelector('.cherry-detail__single details')?.hasAttribute('open')).toBe(true);
    expect(expanded.querySelector('summary')?.textContent).toBe('Open details');
  });

  it('renders multiple detail sections with independent open state', () => {
    const container = render('+++ First\nfirst body\n++- Second\nsecond **body**\n+++');
    const detail = container.querySelector('.cherry-detail__multiple');
    const sections = detail?.querySelectorAll('details');

    expect(sections).toHaveLength(2);
    expect(sections?.[0].hasAttribute('open')).toBe(false);
    expect(sections?.[0].querySelector('summary')?.textContent).toBe('First');
    expect(sections?.[1].hasAttribute('open')).toBe(true);
    expect(sections?.[1].querySelector('summary')?.textContent).toBe('Second');
    expect(sections?.[1].querySelector('strong')?.textContent).toBe('body');
  });

  it('renders inline and block Markdown inside a detail section', () => {
    const container = render('+++ **More**\n> quoted **text**\n\n- one\n- two\n\n+++');
    const detail = container.querySelector('.cherry-detail');

    expect(detail?.querySelector('summary strong')?.textContent).toBe('More');
    expect(detail?.querySelector('.cherry-detail-body blockquote strong')?.textContent).toBe('text');
    expect(detail?.querySelectorAll('.cherry-detail-body li')).toHaveLength(2);
    expect(detail?.querySelectorAll('.cherry-detail-body li')[0].textContent).toContain('one');
    expect(detail?.querySelectorAll('.cherry-detail-body li')[1].textContent).toContain('two');
  });

  it('renders headings, inline syntax, and nested lists inside a blockquote', () => {
    const container = render('> # Quoted heading\n> **quoted text**\n>\n> - one\n> - two');
    const quote = container.querySelector(':scope > blockquote');
    const heading = quote?.querySelector('h1');
    const items = quote?.querySelectorAll('ul > li');

    expect(quote?.getAttribute('data-lines')).toBe('5');
    expect(heading?.getAttribute('data-in-blockquote')).toBe('true');
    expect(heading?.textContent).toBe('Quoted heading');
    expect(quote?.querySelector('strong')?.textContent).toBe('quoted text');
    expect(items).toHaveLength(2);
    expect(items?.[0].textContent).toBe('one');
    expect(items?.[1].textContent).toBe('two');
  });

  it('renders nested blockquotes while leaving following block HTML outside', () => {
    const container = render('> outer\n>> inner\n<div class="after-quote">after</div>');
    const outer = container.querySelector(':scope > blockquote');

    expect(outer?.getAttribute('data-lines')).toBe('3');
    expect(outer?.querySelector('blockquote')?.textContent).toContain('inner');
    expect(outer?.querySelector('.after-quote')).toBeNull();
    expect(container.querySelector(':scope > .after-quote')?.textContent).toBe('after');
  });

  it('resolves case-insensitive link and image reference definitions', () => {
    const container = render(
      '[Cherry guide][DOCS] and [docs].\n\n![Cherry logo][ASSET]\n\n[docs]: <https://example.com/guide?q=1> "Guide"\n[asset]: https://example.com/logo.png "Logo"',
    );
    const links = container.querySelectorAll('a[href="https://example.com/guide?q=1"]');
    const image = container.querySelector('img[src="https://example.com/logo.png"]');

    expect(links).toHaveLength(2);
    expect(links[0].textContent).toBe('Cherry guide');
    expect(links[0].getAttribute('title')).toBe('Guide');
    expect(links[1].textContent).toBe('docs');
    expect(image?.getAttribute('alt')).toBe('Cherry logo');
    expect(image?.getAttribute('title')).toBe('Logo');
    expect(container.textContent).not.toContain('[docs]:');
    expect(container.textContent).not.toContain('[asset]:');
  });

  it('renders inline and block formulas with their source attached', () => {
    const container = render('Inline $x^2$ formula.\n\n$$\ny = x + 1\n$$');
    const inlineMath = container.querySelector('.Cherry-InlineMath');
    const blockMath = container.querySelector('.Cherry-Math[data-type="mathBlock"]');

    expect(inlineMath).not.toBeNull();
    expect(inlineMath?.classList.contains('cherry-mathjax-need-render')).toBe(true);
    expect(inlineMath?.getAttribute('data-formula-source')).toBe('x%5E2');
    expect(decodeURIComponent(inlineMath?.getAttribute('data-content') ?? '')).toBe('x^2');
    expect(blockMath).not.toBeNull();
    expect(blockMath?.classList.contains('cherry-mathjax-need-render')).toBe(true);
    expect(decodeURIComponent(blockMath?.getAttribute('data-formula-source') ?? '')).toBe('y = x + 1');
    expect(decodeURIComponent(blockMath?.getAttribute('data-content') ?? '')).toBe('y = x + 1');
  });

  it('renders repeated footnote references and one definition', () => {
    const container = render('First[^note], second[^note].\n\n[^note]: **Footnote** content');
    const references = container.querySelectorAll('sup.cherry-footnote-number a');
    const notes = container.querySelectorAll('.one-footnote');

    expect(references).toHaveLength(2);
    expect(references[0].getAttribute('href')).toBe('#fn:1');
    expect(references[1].getAttribute('href')).toBe('#fn:1');
    expect(notes).toHaveLength(1);
    expect(notes[0].querySelector('strong')?.textContent).toBe('Footnote');
    expect(notes[0].textContent).toContain('content');
  });

  it('renders an undefined footnote in self-closing mode', () => {
    const container = render('Draft reference[^later].', {
      engine: { syntax: { footnote: { selfClosing: true } } },
    });
    const reference = container.querySelector('sup.cherry-footnote-number a');

    expect(reference?.getAttribute('href')).toBe('#fn:1');
    expect(reference?.textContent).toBe('[1]');
    expect(container.querySelector('.one-footnote')).toBeNull();
  });

  it('uses custom footnote number and list renderers', () => {
    const container = render('Text[^note].\n\n[^note]: Note body', {
      engine: {
        syntax: {
          footnote: {
            refNumber: {
              appendClass: 'custom-reference',
              render: (number: number, title: string) => `${title}-${number}`,
            },
            refList: {
              appendClass: 'custom-list',
              title: {
                appendClass: 'custom-title',
                render: () => 'References',
              },
              listItem: {
                appendClass: 'custom-item',
                render: (_number: number, _title: string, content: string) => `<em>${content.trim()}</em>`,
              },
            },
          },
        },
      },
    });

    expect(container.querySelector('a.custom-reference')?.textContent).toBe('note-1');
    expect(container.querySelector('.footnote.custom-list')).not.toBeNull();
    expect(container.querySelector('.footnote-title.custom-title')?.textContent).toBe('References');
    expect(container.querySelector('.one-footnote.custom-item em')?.textContent).toBe('Note body');
  });

  it('hides the footnote list while keeping defined and draft references usable', () => {
    const container = render('Known[^known], draft[^later].\n\n[^known]: Known body', {
      engine: {
        syntax: {
          footnote: {
            selfClosing: true,
            refList: false,
          },
        },
      },
    });
    const references = container.querySelectorAll('sup.cherry-footnote-number a');

    expect(references).toHaveLength(2);
    expect(references[0].getAttribute('href')).toBe('#fn:1');
    expect(references[1].getAttribute('href')).toBe('#fn:2');
    expect(container.querySelector('.footnote.hidden')).not.toBeNull();
    expect(container.querySelectorAll('.one-footnote')).toHaveLength(1);
    expect(container.querySelector('.one-footnote')?.textContent).toContain('Known body');
  });

  it('renders emoji and leaves unknown emoji names intact', () => {
    const container = render(':airplane: :smile: :afghanistan: :not_a_cherry_emoji:');

    expect(container.textContent).toContain('✈');
    expect(container.textContent).toContain('😄');
    expect(container.textContent).toContain('🇦🇫');
    expect(container.textContent).toContain(':not_a_cherry_emoji:');
  });

  it('renders emoji with a configured image resource', () => {
    const container = render(':smile:', {
      engine: {
        syntax: {
          emoji: {
            useUnicode: false,
            upperCase: true,
            customResourceURL: '/emoji/${code}.png',
          },
        },
      },
    });
    const image = container.querySelector('img.emoji');

    expect(image?.getAttribute('src')).toBe('/emoji/1F604.png');
    expect(image?.getAttribute('alt')).toBe('smile');
  });

  it('uses a custom emoji renderer', () => {
    const container = render(':smile:', {
      engine: {
        syntax: {
          emoji: {
            customRenderer: (name: string) => `<span class="custom-emoji">${name}</span>`,
          },
        },
      },
    });

    expect(container.querySelector('.custom-emoji')?.textContent).toBe('smile');
  });

  it('renders Cherry inline typography extensions', () => {
    const container = render(
      '{Cherry|cherry} !24 large! !!#ff0000 red!! !!blue named!! !!!#00ff00 green!!! ^up^ ^^down^^ ==mark== /underlined/',
    );

    expect(container.querySelector('ruby')?.childNodes[0].textContent).toBe('Cherry');
    expect(container.querySelector('ruby rt')?.textContent).toBe('cherry');
    expect(container.querySelector('span[style*="font-size:24px"]')?.textContent).toBe('large');
    expect(container.querySelector('span[style="color:#ff0000"]')?.textContent).toBe('red');
    expect(container.querySelector('span[style="color:blue"]')?.textContent).toBe('named');
    expect(container.querySelector('span[style="background-color:#00ff00"]')?.textContent).toBe('green');
    expect(container.querySelector('sup')?.textContent).toBe('up');
    expect(container.querySelector('sub')?.textContent).toBe('down');
    expect(container.querySelector('mark')?.textContent).toBe('mark');
    expect(container.querySelector('span[style="text-decoration: underline;"]')?.textContent).toBe('underlined');
  });

  it('renders strict ATX, Setext, custom, Unicode, and duplicate heading IDs', () => {
    const container = render('# First\n\nSecond\n===\n\n## 标题 {#custom-id}\n\n# First');
    const headings = container.querySelectorAll('h1, h2');

    expect(headings).toHaveLength(4);
    expect(container.querySelector('h1#first')?.textContent).toBe('First');
    expect(container.querySelector('h1#second')?.textContent).toBe('Second');
    expect(container.querySelector('h2#custom-id')?.textContent).toBe('标题');
    expect(container.querySelector('h1#first-2')?.textContent).toBe('First');
  });

  it('renders nested emphasis and Chinese-ending emphasis in final HTML', () => {
    const container = render('*italic* **strong** ***both*** *中文* snake_case_value \\*literal*');

    expect(container.querySelector('em')?.textContent).toBe('italic');
    expect(container.querySelector('strong')?.textContent).toBe('strong');
    expect(container.querySelector('strong em')?.textContent).toBe('both');
    expect(container.querySelector('em.cherry-right-padding')?.textContent).toBe('中文');
    expect(container.textContent).toContain('snake_case_value');
    expect(container.textContent).toContain('*literal*');
  });

  it('renders unfinished emphasis, links, and media during a flow session', () => {
    vi.useFakeTimers();
    const options = {
      engine: {
        global: {
          flowSessionContext: true,
          flowSessionCursor: '<span class="flow-cursor"></span>',
        },
      },
    };
    const emphasis = render('**streaming', options);
    const link = render('[Cherry](https://example.com/docs', options);
    const image = render('![preview', options);

    expect(emphasis.querySelector('strong')?.textContent).toBe('streaming');
    expect(emphasis.querySelector('.flow-cursor')).not.toBeNull();
    expect(link.querySelector('a')?.getAttribute('href')).toBe('https://example.com/docs');
    expect(link.querySelector('a')?.textContent).toBe('Cherry');
    expect(link.querySelector('.flow-cursor')).not.toBeNull();
    expect(image.querySelector('img')).not.toBeNull();
    expect(image.querySelector('.flow-cursor')).not.toBeNull();
  });

  it('renders safe link attributes and degrades unsafe schemes to text', () => {
    const safe = render('[Docs](https://example.com/%E8%B7%AF径 "Guide"){target=_blank}', {
      engine: {
        syntax: {
          link: {
            rel: 'nofollow',
            attrRender: (text: string, url: string) => `data-link-text="${text}" data-link-url="${url}"`,
          },
        },
      },
    });
    const unsafe = render('[Unsafe](javascript:alert(1))');
    const link = safe.querySelector('a');

    expect(link?.getAttribute('href')).toBe('https://example.com/%E8%B7%AF%E5%BE%84');
    expect(link?.getAttribute('title')).toBe('Guide');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('nofollow');
    expect(link?.getAttribute('data-link-text')).toBe('Docs');
    expect(link?.getAttribute('data-link-url')).toBe('https://example.com/%E8%B7%AF%E5%BE%84');
    expect(unsafe.querySelector('a')).toBeNull();
    expect(unsafe.textContent).toContain('Unsafe');
  });

  it('renders inline, fenced, and indented code with escaped source text', () => {
    const container = render(
      'Inline `const x = 1 < 2` code.\n\n```javascript\nconst value = 1;\nconsole.log(value);\n```\n\n    <tag>\n    `inline`',
    );
    const inlineCode = container.querySelector('p code');
    const fenced = container.querySelector('[data-type="codeBlock"][data-lang="javascript"]');
    const indented = container.querySelector('pre code.indent-code');

    expect(inlineCode?.textContent).toBe('const x = 1 < 2');
    expect(fenced?.querySelector('pre.language-javascript')).not.toBeNull();
    expect(fenced?.querySelectorAll('.code-line')).toHaveLength(2);
    expect(fenced?.textContent).toContain('const value = 1;');
    expect(fenced?.textContent).toContain('console.log(value);');
    expect(indented?.textContent).toContain('<tag>');
    expect(indented?.textContent).toContain('`inline`');
    expect(indented?.innerHTML).not.toContain('<tag>');
  });

  it('sanitizes unsafe HTML while preserving allowed block and inline markup', () => {
    const container = render(
      '<div class="safe" onclick="alert(1)">**not parsed** <strong>safe</strong></div>\n\n<script>alert(1)</script>\n\n<span style="color:red">kept text</span>',
    );
    const safe = container.querySelector('.safe');
    const span = container.querySelector('span');

    expect(safe).not.toBeNull();
    expect(safe?.getAttribute('onclick')).toBeNull();
    expect(safe?.querySelectorAll('strong')).toHaveLength(2);
    expect(safe?.querySelectorAll('strong')[0].textContent).toBe('not parsed');
    expect(safe?.textContent).toContain('safe');
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
    expect(span?.textContent).toBe('kept text');
  });

  it('renders images and media with sizing, alignment, titles, and explicit attributes', () => {
    const container = render(
      '![Preview #120px #80px #border #center](image.png "Title"){loading=lazy data-id=hero}\n\n!video[Demo #320px #right](movie.mp4 "Movie"){poster=poster.jpg}\n\n!audio[Sound](sound.mp3 "Audio")',
    );
    const image = container.querySelector('img');
    const video = container.querySelector('video');
    const audio = container.querySelector('audio');

    expect(image?.getAttribute('src')).toBe('image.png');
    expect(image?.getAttribute('alt')).toBe('Preview #120px #80px #border #center');
    expect(image?.getAttribute('title')).toBe('Title');
    expect(image?.getAttribute('loading')).toBe('lazy');
    expect(image?.getAttribute('data-id')).toBe('hero');
    expect(image?.classList.contains('cherry-img-align-center')).toBe(true);
    expect(image?.classList.contains('cherry-img-deco-border')).toBe(true);
    expect(image?.getAttribute('style')).toContain('width:120px;height:80px');
    expect(video?.getAttribute('src')).toBe('movie.mp4');
    expect(video?.getAttribute('poster')).toBe('poster.jpg');
    expect(video?.classList.contains('cherry-img-align-right')).toBe(true);
    expect(video?.getAttribute('style')).toContain('width:320px');
    expect(video?.textContent).toBe('Demo #320px #right');
    expect(audio?.getAttribute('src')).toBe('sound.mp3');
    expect(audio?.getAttribute('controls')).toBe('controls');
    expect(audio?.textContent).toBe('Sound');
  });

  it('renders a custom fenced plugin through the final Markdown pipeline', () => {
    const pluginRender = vi.fn(
      (source: string, sign: string, _engine: CustomRenderEngine, _options: CustomRenderOptions) => {
        const escapedSource = source.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<section class="custom-diagram" data-sign="${sign}">${escapedSource}</section>`;
      },
    );
    const container = render('```diagram\nA < B\n```', {
      engine: {
        syntax: {
          codeBlock: {
            customRenderer: {
              diagram: {
                render: pluginRender,
              },
            },
          },
        },
      },
    });
    const diagram = container.querySelector('.custom-diagram');

    const [source, sign, engine, options] = pluginRender.mock.calls[0];
    expect(source.trim()).toBe('A < B');
    expect(sign).toEqual(expect.any(String));
    expect(engine).toHaveProperty('makeHtml');
    expect(options).toMatchObject({ showSourceToolbar: false });
    expect(diagram).not.toBeNull();
    expect(container.querySelector('pre')).toBeNull();
    expect(diagram?.textContent?.trim()).toBe('A < B');
    expect(diagram?.getAttribute('data-sign')).toBe(sign);
  });

  it('renders table charts through the final Markdown pipeline while preserving the source table', () => {
    const container = render(
      '| :bar: {"title":"Sales"} | Q1 | Q2 |\n| --- | ---: | ---: |\n| **Alpha** | 10 | 20 |\n| Beta | 30 | 40 |',
      {
        engine: {
          syntax: {
            table: {
              enableChart: true,
              chartRenderEngine: TestMarkdownChartRenderer,
              chartEngineOptions: { width: 720, title: 'ignored-default' },
            },
          },
        },
      },
    );
    const wrapper = container.querySelector('.cherry-table-wrapper');
    const chart = wrapper?.querySelector('.cherry-table-figure .test-table-chart');
    const table = wrapper?.querySelector('table.cherry-table');

    expect(TestMarkdownChartRenderer.latestOptions).toMatchObject({
      renderer: 'svg',
      width: 720,
      height: 300,
    });
    expect(TestMarkdownChartRenderer.latestRender?.type).toBe('bar');
    expect(TestMarkdownChartRenderer.latestRender?.options).toEqual({ title: 'Sales' });
    expect(TestMarkdownChartRenderer.latestRender?.table).toEqual({
      header: ['', 'Q1', 'Q2'],
      rows: [
        ['**Alpha**', '10', '20'],
        ['Beta', '30', '40'],
      ],
      colLength: 3,
      rowLength: 2,
    });
    expect(chart?.getAttribute('data-type')).toBe('bar');
    expect(chart?.getAttribute('data-title')).toBe('Sales');
    expect(chart?.textContent).toBe('2');
    expect(table).not.toBeNull();
    expect(table?.querySelector('thead th:first-child')?.textContent).toBe('');
    expect(table?.querySelector('tbody strong')?.textContent).toBe('Alpha');
    expect(table?.querySelector('tbody td:last-child')?.getAttribute('align')).toBe('right');
  });

  it('applies HTML whitelist, blacklist, and extra attribute options in final rendering', () => {
    const container = render(
      '<style>\n.card { color: red; }\n</style>\n\n<iframe src="https://example.com/embed" width="640" data-safe="yes"><br>\n</iframe>\n\n<custom-card data-safe="yes" onclick="evil()">Body</custom-card>\n\n<div class="blocked">Blocked</div>',
      {
        engine: {
          global: {
            htmlWhiteList: 'style|iframe|custom-card',
            htmlBlackList: 'div',
            htmlAttrWhiteList: 'data-safe',
          },
        },
      },
    );
    const style = container.querySelector('style');
    const iframe = container.querySelector('iframe');
    const custom = container.querySelector('custom-card');

    expect(style?.textContent).toBe('.card { color: red; }');
    expect(iframe?.getAttribute('src')).toBe('https://example.com/embed');
    expect(iframe?.getAttribute('width')).toBe('640');
    expect(iframe?.getAttribute('data-safe')).toBe('yes');
    expect(iframe?.innerHTML).toBe('');
    expect(custom?.getAttribute('data-safe')).toBe('yes');
    expect(custom?.getAttribute('onclick')).toBeNull();
    expect(custom?.textContent).toBe('Body');
    expect(container.querySelector('div.blocked')).toBeNull();
    expect(container.textContent).toContain('<div class="blocked">Blocked</div>');
  });
});
