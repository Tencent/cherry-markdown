import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Blockquote from '../../../src/core/hooks/Blockquote';
import { hashHex } from '../../../src/utils/hash';

const sentenceMake = (markdown: string) => ({ html: markdown });

function createBlockquote(render = (markdown: string) => `<p>${markdown}</p>`) {
  const hook = new Blockquote();
  const makeHtmlForBlockquote = vi.fn(render);
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (markdown: string) => hashHex(markdown),
      makeHtmlForBlockquote,
    },
  });
  return { hook, makeHtmlForBlockquote };
}

describe('core/hooks/Blockquote', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('leaves text without blockquote syntax unchanged', () => {
    const { hook, makeHtmlForBlockquote } = createBlockquote();

    expect(hook.makeHtml('ordinary paragraph', sentenceMake)).toBe('ordinary paragraph');
    expect(makeHtmlForBlockquote).not.toHaveBeenCalled();
  });

  it('renders multiline quote content and annotates every nested heading', () => {
    const { hook, makeHtmlForBlockquote } = createBlockquote(
      (markdown) => `<h1 id="one">${markdown}</h1><h6 id="two">Last</h6>`,
    );
    const markdown = '> # Heading\n> **quoted**';
    const html = hook.restoreCache(hook.makeHtml(markdown, sentenceMake));
    const container = document.createElement('div');
    container.innerHTML = html;
    const quote = container.querySelector('blockquote');

    expect(makeHtmlForBlockquote).toHaveBeenCalledOnce();
    expect(makeHtmlForBlockquote).toHaveBeenCalledWith(' # Heading\n **quoted**');
    expect(quote?.getAttribute('data-sign')).toBe(`${hashHex(markdown)}_2`);
    expect(quote?.getAttribute('data-lines')).toBe('2');
    expect(quote?.querySelectorAll('[data-in-blockquote="true"]')).toHaveLength(2);
    expect(quote?.querySelector('h1')?.textContent).toContain('# Heading');
  });

  it('reuses both the paragraph cache and nested rendering cache', () => {
    const { hook, makeHtmlForBlockquote } = createBlockquote();
    const markdown = '> cached quote';
    const first = hook.makeHtml(markdown, sentenceMake);
    const second = hook.makeHtml(markdown, sentenceMake);

    expect(second).toBe(first);
    expect(makeHtmlForBlockquote).toHaveBeenCalledOnce();
    expect(hook.restoreCache(second)).toContain('<p> cached quote</p>');
  });

  it('keeps raw block HTML following quote content outside the blockquote', () => {
    const { hook, makeHtmlForBlockquote } = createBlockquote();
    const markdown = '> quoted\n<div class="outside">after</div>';
    const html = hook.restoreCache(hook.makeHtml(markdown, sentenceMake));
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(makeHtmlForBlockquote).toHaveBeenCalledWith(' quoted');
    expect(container.querySelector('blockquote .outside')).toBeNull();
    expect(container.querySelector(':scope > .outside')?.textContent).toBe('after');
    expect(container.querySelector('blockquote')?.getAttribute('data-lines')).toBe('2');
  });
});
