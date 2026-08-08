import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Detail from '../../../src/core/hooks/Detail';
import { hashHex } from '../../../src/utils/hash';

const sentenceMake = (markdown: string) => ({
  html: markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
  sign: hashHex(markdown),
});

function createDetail() {
  const hook = new Detail();
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
      htmlWhiteListAppend: '',
    },
  });
  return hook;
}

describe('core/hooks/Detail', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('renders collapsed and expanded single sections', () => {
    const hook = createDetail();
    const collapsed = hook.$getDetailInfo('', 'More', '**body**', sentenceMake);
    const expanded = hook.$getDetailInfo('-', 'Open', 'body', sentenceMake);

    expect(collapsed.type).toBe('single');
    expect(collapsed.html).toContain('<details >');
    expect(collapsed.html).toContain('<summary>More</summary>');
    expect(collapsed.html).toContain('<p><strong>body</strong></p>');
    expect(expanded.type).toBe('single');
    expect(expanded.html).toContain('<details open>');
    expect(expanded.html).toContain('<summary>Open</summary>');
  });

  it('renders multiple sections and updates title and open state independently', () => {
    const hook = createDetail();
    const detail = hook.$getDetailInfo(
      '',
      'First',
      'first body\n++- Second\nsecond body\n++ Third\nthird body',
      sentenceMake,
    );
    const container = document.createElement('div');
    container.innerHTML = detail.html;
    const sections = container.querySelectorAll('details');

    expect(detail.type).toBe('multiple');
    expect(sections).toHaveLength(3);
    expect(sections[0].hasAttribute('open')).toBe(false);
    expect(sections[0].querySelector('summary')?.textContent).toBe('First');
    expect(sections[1].hasAttribute('open')).toBe(true);
    expect(sections[1].querySelector('summary')?.textContent).toBe('Second');
    expect(sections[2].hasAttribute('open')).toBe(false);
    expect(sections[2].querySelector('summary')?.textContent).toBe('Third');
    expect(sections[2].querySelector('.cherry-detail-body')?.textContent).toContain('third body');
  });

  it('skips empty paragraphs and uses a div wrapper for block HTML', () => {
    const hook = createDetail();
    const empty = hook.$getDetailHtml(false, 'Empty', '   ', sentenceMake);
    const block = hook.$getDetailHtml(true, '**Block**', '<blockquote>quoted</blockquote>', sentenceMake);

    expect(empty).toContain('<div class="cherry-detail-body"></div>');
    expect(empty).not.toContain('<p>');
    expect(block).toContain('<summary><strong>Block</strong></summary>');
    expect(block).toContain('<div><blockquote>quoted</blockquote></div>');
  });

  it('converts body line breaks according to non-classic paragraph rendering', () => {
    const hook = createDetail();
    const html = hook.$getDetailHtml(false, 'Lines', 'line one\nline two', sentenceMake);

    expect(html).toContain('<p>line one<br>line two</p>');
  });

  it('preserves nested paragraph cache entries between ordinary paragraphs', () => {
    const hook = createDetail();
    const nestedCache = hook.pushCache('<blockquote>cached</blockquote>', 'nested', 1);
    const detail = hook.$getDetailHtml(false, 'Cached', `before\n${nestedCache}\nafter`, sentenceMake);
    const html = hook.restoreCache(detail);

    expect(html).toContain('<p>before</p><blockquote>cached</blockquote><p>after</p>');
  });

  it('renders final wrapper metadata and reuses a cached result', () => {
    const hook = createDetail();
    const markdown = '+++ More\n**body**\n+++';
    const first = hook.makeHtml(markdown, sentenceMake);
    const second = hook.makeHtml(markdown, sentenceMake);
    const html = hook.restoreCache(first);

    expect(second).toBe(first);
    expect(html).toContain('class="cherry-detail cherry-detail__single"');
    expect(html).toContain(`data-sign="${hashHex(markdown)}"`);
    expect(html).toContain('data-lines="3"');
    expect(html).toContain('<strong>body</strong>');
  });

  it('preserves leading paragraph spacing around a rendered detail', () => {
    const hook = createDetail();
    const markdown = '\n\n+++ More\nbody\n+++';
    const rendered = hook.makeHtml(markdown, sentenceMake);

    expect(rendered.startsWith('\n')).toBe(true);
    expect(hook.restoreCache(rendered)).toContain('data-lines="3"');
  });

  it.each([['+++ Missing body\n+++'], ['+++ Missing close\nbody'], ['+++Missing space\nbody\n+++']])(
    'leaves malformed detail syntax unchanged: %s',
    (markdown) => {
      const hook = createDetail();

      expect(hook.makeHtml(markdown, sentenceMake)).toBe(markdown);
    },
  );
});
