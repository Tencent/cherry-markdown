import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Toc from '../../../src/core/hooks/Toc';
import { hashHex } from '../../../src/utils/hash';

interface TocOptions {
  tocStyle?: 'plain' | 'nested';
  tocNodeClass?: string;
  tocContainerClass?: string;
  tocTitleClass?: string;
  linkProcessor?: (link: string) => string;
  showAutoNumber?: boolean;
  allowMultiToc?: boolean;
}

interface TocNode {
  level: number;
  id: string;
  text: string;
  isInBlockquote: boolean;
}

function createToc(config: TocOptions = {}) {
  const hook = new Toc({ externals: {}, config });
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
    },
  });
  hook.setLocale({ toc: 'Contents' });
  return hook;
}

function renderToc(hook: Toc, marker: string, headings: string) {
  const prepared = hook.beforeMakeHtml(marker);
  return hook.afterMakeHtml(`${prepared}\n${headings}`);
}

describe('core/hooks/Toc', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it.each(['[toc]', '[TOC]', '[[toc]]', '【【TOC】】'])('recognizes and caches the %s marker', (marker) => {
    const hook = createToc();
    const prepared = hook.beforeMakeHtml(marker);

    expect(prepared).toMatch(/~~C\d+I\w+_L0\$/);
    expect(hook.restoreCache(prepared)).toContain(marker);
    expect(hook.makeHtml('unchanged')).toBe('unchanged');
  });

  it('replaces duplicate markers with an empty line placeholder by default', () => {
    const hook = createToc();
    const prepared = hook.beforeMakeHtml('[toc]\n\n[[toc]]');

    expect(hook.restoreCache(prepared)).toContain('[toc]');
    expect(prepared).toContain('data-sign="empty-toc"');
    expect(hook.restoreCache(prepared).match(/\[+toc\]+/g)).toHaveLength(1);
  });

  it('creates whitespace indentation relative to the minimum heading level', () => {
    const hook = createToc();
    hook.baseLevel = 2;

    expect(hook.$makeLevel(2)).toBe('');
    expect(hook.$makeLevel(4)).toBe('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
  });

  it('renders item classes, numbering, optional closing tags, and blockquote state', () => {
    const hook = createToc({ showAutoNumber: true });
    const node: TocNode = { level: 3, id: 'safe_section', text: '<strong>Section</strong>', isInBlockquote: true };
    const closed = hook.$makeTocItem(node, true);
    const open = hook.$makeTocItem(node, false, false);

    expect(closed).toContain('class="toc-li toc-li-3"');
    expect(closed).toContain('cherry-toc-in-blockquote');
    expect(closed).toContain('href="#section"');
    expect(closed).toContain('class="level-3"');
    expect(closed).toContain('</li>');
    expect(open).not.toContain('</li>');
  });

  it('renders a plain table of contents with whitespace indentation', () => {
    const hook = createToc({ tocStyle: 'plain' });
    hook.baseLevel = 1;
    const html = hook.$makePlainToc([
      { level: 1, id: 'one', text: 'One', isInBlockquote: false },
      { level: 3, id: 'three', text: 'Three', isInBlockquote: false },
    ]);

    expect(html.match(/<li /g)).toHaveLength(2);
    expect(html).toContain('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    expect(html).not.toContain('<ul>');
  });

  it('renders balanced nested lists across increasing, equal, and decreasing levels', () => {
    const hook = createToc({ tocStyle: 'nested' });
    hook.baseLevel = 1;
    const nodes: TocNode[] = [
      { level: 2, id: 'two', text: 'Two', isInBlockquote: false },
      { level: 4, id: 'four-a', text: 'Four A', isInBlockquote: false },
      { level: 4, id: 'four-b', text: 'Four B', isInBlockquote: false },
      { level: 3, id: 'three', text: 'Three', isInBlockquote: false },
      { level: 1, id: 'one', text: 'One', isInBlockquote: false },
    ];
    const html = hook.$makeNestedToc(nodes);
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelectorAll('li')).toHaveLength(5);
    expect(container.querySelectorAll('ul')).toHaveLength(4);
    expect(container.querySelector('a[href="#four-a"]')?.closest('li')).not.toBeNull();
    expect(html.match(/<ul>/g)).toHaveLength(html.match(/<\/ul>/g)?.length ?? 0);
    expect(html.match(/<li /g)).toHaveLength(html.match(/<\/li>/g)?.length ?? 0);
  });

  it('returns no container for an empty heading list', () => {
    const hook = createToc();

    expect(hook.$makeToc([], 'empty', '')).toBe('');
  });

  it('renders final plain TOC HTML from headings and removes footnote placeholders', () => {
    const hook = createToc({ tocStyle: 'plain', showAutoNumber: true });
    const headings = [
      '<h2 id="safe_intro">Intro</h2>',
      '<h3 data-in-blockquote="true" id="safe_details">Details~fn#1#</h3>',
    ].join('\n');
    const html = renderToc(hook, '[toc]', headings);
    const container = document.createElement('div');
    container.innerHTML = html;
    const toc = container.querySelector('.toc.auto-num-toc');

    expect(toc).not.toBeNull();
    expect(toc?.querySelector('.toc-title')?.textContent).toBe('Contents');
    expect(toc?.querySelectorAll('li')).toHaveLength(2);
    expect(toc?.querySelector('a[href="#intro"]')?.textContent).toBe('Intro');
    expect(toc?.querySelector('a[href="#details"]')?.textContent).toBe('Details');
    expect(toc?.querySelector('.cherry-toc-in-blockquote')).not.toBeNull();
    expect(toc?.textContent).not.toContain('~fn#1#');
  });

  it('renders nested TOC HTML and separates a marker adjacent to generated HTML', () => {
    const hook = createToc({ tocStyle: 'nested' });
    const headings = '<h1 id="safe_one">One</h1>\n<h2 id="safe_two">Two</h2>';
    const html = renderToc(hook, '[[toc]]<p>next</p>', headings);
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelector('.toc > ul')).not.toBeNull();
    expect(container.querySelector('a[href="#two"]')?.closest('ul')).not.toBeNull();
    const trailingParagraph = Array.from(container.children).find((element) => element.tagName === 'P');
    expect(trailingParagraph?.textContent).toBe('next');
  });

  it('resets marker state after final rendering', () => {
    const hook = createToc();

    renderToc(hook, '[toc]', '<h1 id="safe_one">One</h1>');

    expect(hook.isFirstTocToken).toBe(true);
    expect(hook.beforeMakeHtml('[toc]')).not.toContain('empty-toc');
  });
});
