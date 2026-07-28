import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Link from '../../../src/core/hooks/Link';
import UrlCache from '../../../src/UrlCache';

interface LinkConfig {
  target?: string;
  openNewPage?: boolean;
  rel?: string;
}

type LinkAttributes = string | Record<string, string> | null | undefined;

interface LinkFixtureOptions {
  config?: LinkConfig;
  attrRender?: (text: string, url: string) => LinkAttributes;
  urlProcessor?: (url: string, type: string) => string;
}

function createLinkHook({
  config = {},
  attrRender = () => '',
  urlProcessor = (url: string) => url,
}: LinkFixtureOptions = {}) {
  const hook = new Link({ config, globalConfig: {} });
  Object.defineProperty(hook, '$engine', {
    value: {
      urlProcessor,
      $cherry: {
        options: {
          engine: {
            syntax: {
              link: { attrRender },
            },
          },
        },
      },
    },
  });
  return hook;
}

function renderLink(hook: Link, markdown: string) {
  return UrlCache.restoreAll(hook.makeHtml(markdown));
}

afterEach(() => {
  UrlCache.clear();
});

describe('core/hooks/Link', () => {
  it('validates plain, nested, prefixed, and escaped bracket text', () => {
    const hook = createLinkHook();

    expect(hook.checkBrackets('text')).toEqual({ isValid: true, coreText: 'text', extraLeadingChar: '' });
    expect(hook.checkBrackets('2][text')).toEqual({ isValid: true, coreText: 'text', extraLeadingChar: '[2]' });
    expect(hook.checkBrackets('[nested] text')).toEqual({
      isValid: true,
      coreText: '[nested] text',
      extraLeadingChar: '',
    });
    expect(hook.checkBrackets('invalid\\')).toEqual({
      isValid: false,
      coreText: 'invalid\\',
      extraLeadingChar: '',
    });
  });

  it('renders nested square brackets without losing the visible text (issue #930)', () => {
    const hook = createLinkHook();
    const input = '[[20240803][子标题]例子段落(2)](例子.md#[20240803][子标题]例子段落(2))';
    const html = renderLink(hook, input);

    expect(html).toContain(
      'href="%E4%BE%8B%E5%AD%90.md#%5B20240803%5D%5B%E5%AD%90%E6%A0%87%E9%A2%98%5D%E4%BE%8B%E5%AD%90%E6%AE%B5%E8%90%BD(2)"',
    );
    expect(html).toContain('>[20240803][子标题]例子段落(2)</a>');
  });

  it('renders ordinary, prefixed, and balanced-parenthesis links', () => {
    const hook = createLinkHook();

    expect(renderLink(hook, '[text](https://example.com)')).toContain('href="https://example.com"');
    expect(renderLink(hook, '[text](https://example.com)')).toContain('>text</a>');
    expect(renderLink(hook, '[2][text](https://example.com)')).toContain('[2]<a href="https://example.com"');
    expect(renderLink(hook, '[text](https://example.com/f(o)o)')).toContain('href="https://example.com/f(o)o"');
  });

  it('leaves references, escaped links, and malformed bracket text unchanged', () => {
    const hook = createLinkHook();

    expect(hook.makeHtml('[text][undefinedref]')).toBe('[text][undefinedref]');
    expect(hook.makeHtml('\\[text](https://example.com)')).toBe('\\[text](https://example.com)');
    expect(
      hook.toHtml('[invalid\\](https://example.com)', '', 'invalid\\', 'https://example.com', undefined, undefined),
    ).toBe('[invalid\\](https://example.com)');
  });

  it('resolves configured target, openNewPage, rel, and inline target precedence', () => {
    const configured = createLinkHook({ config: { target: '_self', openNewPage: true, rel: 'nofollow' } });
    const newPage = createLinkHook({ config: { openNewPage: true } });
    const plain = createLinkHook();

    expect(renderLink(configured, '[text](https://example.com)')).toContain('target="_self"');
    expect(renderLink(configured, '[text](https://example.com)')).toContain('rel="nofollow"');
    expect(renderLink(configured, '[text](https://example.com){target=top}')).toContain('target="top"');
    expect(renderLink(configured, '[text](https://example.com){target=top}')).not.toContain('target="_self"');
    expect(renderLink(newPage, '[text](https://example.com)')).toContain('target="_blank"');
    expect(renderLink(plain, '[text](https://example.com)')).not.toContain('target=');
  });

  it('sanitizes title quotes and escapes title HTML characters', () => {
    const hook = createLinkHook();
    const html = renderLink(hook, `[text](https://example.com "say 'hello' & <tag>")`);

    expect(html).toContain('title="say hello &amp; &lt;tag&gt;"');
  });

  it('processes and encodes URLs exactly once', () => {
    const urlProcessor = vi.fn((url: string, type: string) => `${url}?来源=${type}`);
    const hook = createLinkHook({ urlProcessor });
    const html = renderLink(hook, '[文档](https://example.com/%E8%B7%AF径)');

    expect(urlProcessor).toHaveBeenCalledWith('https://example.com/%E8%B7%AF径', 'link');
    expect(html).toContain('href="https://example.com/%E8%B7%AF%E5%BE%84?%E6%9D%A5%E6%BA%90=link"');
    expect(html).not.toContain('%25E8');
  });

  it('passes processed text and URL to a string custom attribute renderer', () => {
    const attrRender = vi.fn((text: string, url: string) => `data-text="${text}" data-url="${url}"`);
    const hook = createLinkHook({ attrRender });
    const html = renderLink(hook, '[Docs](https://example.com/docs)');

    expect(attrRender).toHaveBeenCalledWith('Docs', 'https://example.com/docs');
    expect(html).toContain('data-text="Docs"');
    expect(html).toContain('data-url="https://example.com/docs"');
  });

  it('ignores null and non-string custom attributes', () => {
    const nullAttributes = createLinkHook({ attrRender: () => null });
    const objectAttributes = createLinkHook({ attrRender: () => ({ class: 'ignored' }) });

    expect(renderLink(nullAttributes, '[text](https://example.com)')).not.toContain('class=');
    expect(renderLink(objectAttributes, '[text](https://example.com)')).not.toContain('ignored');
  });

  it('restores protected math markers in link text and URL', () => {
    const urlProcessor = vi.fn((url: string) => url);
    const hook = createLinkHook({ urlProcessor });
    const html = renderLink(hook, '[price ~D5](https://example.com/~Dvalue)');

    expect(urlProcessor).toHaveBeenCalledWith('https://example.com/~Dvalue', 'link');
    expect(html).toContain('>price ~D5</a>');
    expect(html).toContain('href="https://example.com/~Dvalue"');
    expect(html).not.toContain('~1D');
  });

  it.each(['javascript:alert(1)', 'data:text/html,test'])('renders unsafe %s URLs as text', (url) => {
    const hook = createLinkHook();

    expect(hook.toHtml(`[text](${url})`, '', 'text', url, undefined, undefined)).toBe('<span>text</span>');
  });

  it('keeps standard Markdown conversion stable', () => {
    const hook = createLinkHook();

    expect(hook.toStdMarkdown('[text](https://example.com)')).toBe('[text](https://example.com)');
  });
});
