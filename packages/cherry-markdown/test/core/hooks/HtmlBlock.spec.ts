import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import HtmlBlock from '../../../src/core/hooks/HtmlBlock';
import { hashHex } from '../../../src/utils/hash';

interface HtmlBlockOptions {
  filterStyle?: boolean;
  removeTrailingNewline?: boolean;
  whiteList?: string;
  blackList?: string;
  htmlAttrWhiteList?: string;
  omitHtmlAttrWhiteList?: boolean;
}

function createHtmlBlock(options: HtmlBlockOptions = {}) {
  const urlProcessor = vi.fn((url: string, type: string) => `${type}:${url}`);
  const hook = new HtmlBlock({
    config: {
      filterStyle: options.filterStyle ?? false,
      removeTrailingNewline: options.removeTrailingNewline ?? false,
    },
  });
  Object.defineProperty(hook, '$engine', {
    value: {
      htmlWhiteListAppend: options.whiteList ?? '',
      htmlBlackList: options.blackList ?? '',
      urlProcessor,
      hashHex: (value: string) => hashHex(value),
      $cherry: {
        options: {
          engine: {
            global: {
              htmlAttrWhiteList: options.omitHtmlAttrWhiteList ? undefined : (options.htmlAttrWhiteList ?? ''),
            },
          },
        },
      },
    },
  });
  return { hook, urlProcessor };
}

describe('core/hooks/HtmlBlock', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it.each(['<https://example.com/path>', '<mailto:user@example.com>', '<user@example.com>'])(
    'recognizes %s as an automatic link rather than an HTML tag',
    (source) => {
      expect(createHtmlBlock().hook.isAutoLinkTag(source)).toBe(true);
    },
  );

  it('rejects malformed auto links and recognizes one-line comments', () => {
    const { hook } = createHtmlBlock();

    expect(hook.isAutoLinkTag('<not a link>')).toBe(false);
    expect(hook.isHtmlComment('<!-- comment -->')).toBe(true);
    expect(hook.isHtmlComment('<!-- multi\nline -->')).toBe(false);
  });

  it('escapes unknown tags while preserving comments and automatic links', () => {
    const { hook } = createHtmlBlock();
    const html = hook.beforeMakeHtml('<unknown>value</unknown> <!-- keep --> <https://example.com>');

    expect(html).toContain('&#60;unknown&#62;value&#60;/unknown&#62;');
    expect(html).toContain('<!-- keep -->');
    expect(html).toContain('<https://example.com>');
  });

  it('escapes multiline unknown and blacklisted tag openings without consuming their newline', () => {
    const unknown = createHtmlBlock().hook.beforeMakeHtml('<unknown\n   >body');
    const blocked = createHtmlBlock({ blackList: '*' }).hook.beforeMakeHtml('<div\n   >body');

    expect(unknown).toContain('&#60;unknown\n   >body');
    expect(blocked).toContain('&#60;div\n   >body');
  });

  it('allows configured custom tags unless a blacklist takes priority', () => {
    const allowed = createHtmlBlock({ whiteList: 'custom-tag' }).hook;
    const blocked = createHtmlBlock({ whiteList: 'custom-tag', blackList: 'custom-tag' }).hook;

    expect(allowed.beforeMakeHtml('<custom-tag>value</custom-tag>')).toBe('<custom-tag>value</custom-tag>');
    expect(blocked.beforeMakeHtml('<custom-tag>value</custom-tag>')).toContain('&#60;custom-tag&#62;');
  });

  it('supports wildcard and specific blacklists without blocking comments or auto links', () => {
    const wildcard = createHtmlBlock({ blackList: '*' }).hook;
    const specific = createHtmlBlock({ blackList: 'div|span' }).hook;

    expect(wildcard.beforeMakeHtml('<div>value</div>')).toContain('&#60;div&#62;');
    expect(wildcard.beforeMakeHtml('<!-- keep --> <https://example.com>')).toBe('<!-- keep --> <https://example.com>');
    expect(specific.beforeMakeHtml('<span>value</span><p>keep</p>')).toContain('&#60;span&#62;value&#60;/span&#62;');
    expect(specific.beforeMakeHtml('<span>value</span><p>keep</p>')).toContain('<p>keep</p>');
  });

  it('processes link and image URLs in different attribute positions', () => {
    const { hook, urlProcessor } = createHtmlBlock();
    const html = hook.beforeMakeHtml(
      '<a href="one">one</a><a class="x" href="two">two</a><img src="three"><img alt="x" src="four">',
    );

    expect(html).toContain('href="link:one"');
    expect(html).toContain('href="link:two"');
    expect(html).toContain('src="image:three"');
    expect(html).toContain('src="image:four"');
    expect(urlProcessor).toHaveBeenCalledTimes(4);
  });

  it('escapes malformed angle brackets, backslash escapes, and incomplete entities', () => {
    const { hook } = createHtmlBlock();
    const html = hook.beforeMakeHtml('a <broken and </broken \\< \\> &copy text');

    expect(html).toContain('a &#60;broken');
    expect(html).toContain('&#60;/broken');
    expect(html).toContain('&lt; &gt;');
    expect(html).toContain('&amp;copy text');
  });

  it('removes single- and double-quoted style attributes when configured', () => {
    const { hook } = createHtmlBlock({ filterStyle: true });
    const html = hook.beforeMakeHtml(
      '<div id="one" style="color:red" title="x">a</div><span style=\'font-size:20px\'>b</span>',
    );

    expect(html).toContain('<div id="one" title="x">');
    expect(html).toContain('<span>');
    expect(html).not.toContain('style=');
  });

  it('collapses repeated newlines after closing tags when configured', () => {
    const { hook } = createHtmlBlock({ removeTrailingNewline: true });

    expect(hook.beforeMakeHtml('<div>one</div>\n\n\nnext')).toBe('<div>one</div>\nnext');
    expect(hook.makeHtml('already processed', () => ({ html: '' }))).toBe('already processed');
  });

  it('sanitizes dangerous markup and encodes backslashes in URL attributes', () => {
    const { hook } = createHtmlBlock();
    hook.beforeMakeHtml('<p>initialize whitelist</p>');
    const html = hook.afterMakeHtml(
      '<p data-sign="keep" data-lines="1" onclick="evil()">safe</p><a href="https:\\example.com">link</a><script>evil()</script>',
    );

    expect(html).toContain('<p data-sign="keep" data-lines="1">safe</p>');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('<script>');
    expect(html).toContain('href="https:%5cexample.com"');
  });

  it('keeps configured custom attributes and SVG foreignObject content', () => {
    const { hook } = createHtmlBlock({ htmlAttrWhiteList: 'data-extra;aria-label' });
    hook.beforeMakeHtml('<p>initialize whitelist</p>');
    const html = hook.afterMakeHtml(
      '<div data-extra="yes" aria-label="label"><svg><foreignObject><div>inside</div></foreignObject></svg></div>',
    );

    expect(html).toContain('data-extra="yes"');
    expect(html).toContain('aria-label="label"');
    expect(html.toLowerCase()).toContain('<foreignobject>');
    expect(html).toContain('<div>inside</div>');
  });

  it('uses default sanitizer attributes when no custom attribute list is provided', () => {
    const { hook } = createHtmlBlock({ omitHtmlAttrWhiteList: true });
    hook.beforeMakeHtml('<p>initialize whitelist</p>');

    expect(hook.afterMakeHtml('<a target="_blank" data-extra="retained">link</a>')).toBe(
      '<a target="_blank" data-extra="retained">link</a>',
    );
  });

  it('returns allowed script markup without sanitizing it', () => {
    const { hook } = createHtmlBlock({ whiteList: 'script' });
    hook.beforeMakeHtml('<script>initialize()</script>');

    const html = hook.afterMakeHtml('<script><br>window.value = "<unsafe>";</script>');

    expect(html).toBe('<script>window.value = "<unsafe>";</script>');
  });

  it('sanitizes large documents in batches and reuses cached batches', () => {
    const { hook } = createHtmlBlock();
    hook.beforeMakeHtml('<p>initialize whitelist</p>');
    const source = Array.from(
      { length: 55 },
      (_, index) => `<p data-sign="${index}" data-lines="1" onclick="evil()">item ${index}</p>`,
    ).join('');

    const first = hook.afterMakeHtml(source);
    const second = hook.afterMakeHtml(source);

    expect(first).toBe(second);
    expect(first.match(/<p /g)).toHaveLength(55);
    expect(first).not.toContain('onclick');
    expect(hook.cacheDataMap.length).toBe(2);
  });
});
