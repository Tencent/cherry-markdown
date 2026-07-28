import { describe, expect, it, vi } from 'vite-plus/test';
import AutoLink from '../../../src/core/hooks/AutoLink';

interface AutoLinkConfig {
  target?: string;
  openNewPage?: boolean;
  rel?: string;
  enableShortLink?: boolean;
  shortLinkLength?: number;
}

type AutoLinkAttributes = string | Record<string, string> | null | undefined;

interface AutoLinkFixtureOptions {
  config?: AutoLinkConfig;
  attrRender?: (url: string, text: string) => AutoLinkAttributes;
  urlProcessor?: (url: string, type: string) => string;
}

function createAutoLink({
  config = {},
  attrRender = () => '',
  urlProcessor = (url: string) => url,
}: AutoLinkFixtureOptions = {}) {
  const hook = new AutoLink({ config, globalConfig: {} });
  Object.defineProperty(hook, '$engine', {
    value: {
      urlProcessor,
      $cherry: {
        options: {
          engine: {
            syntax: {
              autoLink: { attrRender },
            },
          },
        },
      },
    },
  });
  return hook;
}

describe('core/hooks/AutoLink', () => {
  it('detects links inside quoted, unquoted, namespaced, and distant HTML attributes', () => {
    const hook = createAutoLink();
    const cases: Array<[string, number, number, boolean]> = [
      ['<a href="https://cherry.editor.com">', 9, 25, true],
      ["<a href='https://cherry.editor.com'>", 9, 25, true],
      ['<a href=https://cherry.editor.com>', 8, 25, true],
      ['<img src="https://example.com/image.jpg" />', 10, 26, true],
      ['<div data-url="https://data.example.com" class="test">', 15, 26, true],
      ['<a xlink:href="https://xlink.example.com">', 13, 27, true],
      ['<a href="https://short.com">', 100, 10, false],
      ['<a href="https://first.com"><span data-url="https://later.com">', 44, 17, true],
      ['plain https://not.in.attribute.com', 6, 28, false],
    ];

    cases.forEach(([source, index, length, expected]) => {
      expect(hook.isLinkInHtmlAttribute(source, index, length)).toBe(expected);
    });
  });

  it('stops scanning HTML attributes once later tags are beyond the candidate range', () => {
    const hook = createAutoLink();

    expect(hook.isLinkInHtmlAttribute('text <img src="https://later.example">', 0, 4)).toBe(false);
  });

  it('detects links inside complete anchors but not outside or in incomplete anchors', () => {
    const hook = createAutoLink();
    const cases: Array<[string, number, number, boolean]> = [
      ['<a href="https://example.com">https://example.com</a>', 30, 19, true],
      ["<a href='https://example.com'>Visit https://first.com</a>", 36, 17, true],
      ['<div><a href="https://example.com">https://example.com</a></div>', 35, 19, true],
      ['plain https://outside.com', 6, 19, false],
      ['<a href="https://incomplete.com">https://incomplete.com', 35, 22, false],
      ['<a href="https://example.com"></a> https://outside.com', 40, 19, false],
      ['<a href="https://example.com">link</a>', 100, 10, false],
    ];

    cases.forEach(([source, index, length, expected]) => {
      expect(hook.isLinkInATag(source, index, length)).toBe(expected);
    });
  });

  it('stops scanning anchors once later links are beyond the candidate range', () => {
    const hook = createAutoLink();

    expect(hook.isLinkInATag('text <a href="https://later.example">later</a>', 0, 4)).toBe(false);
  });

  it.each([
    ['https://example.com', 'https://example.com'],
    ['https://example_test.com', 'https://example&#x5f;test.com'],
    ['https://example*test.com', 'https://example&#x2a;test.com'],
    ['user_name@example.com', 'user&#x5f;name@example.com'],
    ['', ''],
  ])('escapes preserved emphasis symbols in %s', (source, expected) => {
    expect(AutoLink.escapePreservedSymbol(source)).toBe(expected);
  });

  it('returns text without a candidate URL or email unchanged', () => {
    const hook = createAutoLink();

    expect(hook.makeHtml('plain text')).toBe('plain text');
    expect(hook.makeHtml('http:invalid-url')).toBe('http:invalid-url');
    expect(hook.makeHtml('test@@example.com')).toBe('test@@example.com');
  });

  it('renders HTTP, HTTPS, FTP, and uppercase protocols', () => {
    const hook = createAutoLink();

    expect(hook.makeHtml('https://example.com/path')).toContain('href="https://example.com/path"');
    expect(hook.makeHtml('http://example.com')).toContain('href="http://example.com"');
    expect(hook.makeHtml('ftp://example.com/file')).toContain('href="ftp://example.com/file"');
    expect(hook.makeHtml('HTTPS://example.com')).toContain('href="https://example.com"');
  });

  it('keeps unsafe and protocol-plus-email candidates unchanged', () => {
    const hook = createAutoLink();

    expect(hook.makeHtml('<javascript://example.com>')).toBe('<javascript://example.com>');
    expect(hook.makeHtml('ftp:test@example.com')).toBe('ftp:test@example.com');
    expect(hook.makeHtml('<www.CHERRYFLOWSESSIONCURSOR>')).toBe('<www.CHERRYFLOWSESSIONCURSOR>');
  });

  it('does not create nested links in HTML attributes or existing anchors', () => {
    const hook = createAutoLink();
    const source = [
      '<img src="https://example.com/image.png">',
      '<a href="https://example.com">https://example.com</a>',
    ].join(' ');

    expect(hook.makeHtml(source)).toBe(source);
  });

  it('applies configured target and rel with target taking precedence over openNewPage', () => {
    const configured = createAutoLink({ config: { target: '_self', openNewPage: true, rel: 'nofollow' } });
    const newPage = createAutoLink({ config: { openNewPage: true } });

    expect(configured.makeHtml('https://example.com')).toContain('target="_self"');
    expect(configured.makeHtml('https://example.com')).toContain('rel="nofollow"');
    expect(configured.makeHtml('https://example.com')).not.toContain('target="_blank"');
    expect(newPage.makeHtml('https://example.com')).toContain('target="_blank"');
  });

  it('processes URLs and accepts only string custom attributes', () => {
    const urlProcessor = vi.fn((url: string, type: string) => `${url}?source=${type}`);
    const attrRender = vi.fn((url: string) => `data-url="${url}"`);
    const stringAttrs = createAutoLink({ urlProcessor, attrRender });
    const nullAttrs = createAutoLink({ attrRender: () => null });
    const objectAttrs = createAutoLink({ attrRender: () => ({ class: 'ignored' }) });
    const html = stringAttrs.makeHtml('https://example.com');

    expect(urlProcessor).toHaveBeenCalledWith('https://example.com', 'autolink');
    expect(attrRender).toHaveBeenCalledWith(
      'https://example.com?source=autolink',
      'https://example.com?source=autolink',
    );
    expect(html).toContain('href="https://example.com?source=autolink"');
    expect(html).toContain('data-url="https://example.com?source=autolink"');
    expect(nullAttrs.makeHtml('https://example.com')).not.toContain('null');
    expect(objectAttrs.makeHtml('https://example.com')).not.toContain('ignored');
  });

  it('shortens long display text without changing the URL or title', () => {
    const hook = createAutoLink({ config: { enableShortLink: true, shortLinkLength: 15 } });
    const longUrl = 'https://www.example.com/very/long/path';
    const short = hook.renderLink(longUrl);
    const full = createAutoLink({ config: { enableShortLink: false } }).renderLink(longUrl);

    expect(short).toContain('>www.example.com...</a>');
    expect(short).toContain(`href="${longUrl}"`);
    expect(short).toContain(`title="${longUrl}"`);
    expect(full).toContain(`>${longUrl}</a>`);
    expect(full).not.toContain('...</a>');
  });

  it('keeps short URLs whole and respects explicit display text', () => {
    const hook = createAutoLink({ config: { enableShortLink: true, shortLinkLength: 30 } });

    expect(hook.renderLink('https://example.com')).toContain('>example.com</a>');
    expect(hook.renderLink('https://example.com', 'Click Here')).toContain('>Click Here</a>');
    expect(hook.renderLink('https://example.com', 'ClickCHERRYFLOWSESSIONCURSOR')).toContain('>Click</a>');
  });

  it('removes flow cursor placeholders and escapes URL/display emphasis markers', () => {
    const hook = createAutoLink();
    const rendered = hook.renderLink('https://example.com/a_b*c', 'a_b*cCHERRYFLOWSESSIONCURSOR');
    const fromMarkdown = hook.makeHtml('https://example.com/pathCHERRYFLOWSESSIONCURSOR');

    expect(rendered).toContain('a&#x5f;b&#x2a;c');
    expect(rendered).not.toContain('CHERRYFLOWSESSIONCURSOR');
    expect(fromMarkdown).toContain('href="https://example.com/path"');
    expect(fromMarkdown).not.toContain('CHERRYFLOWSESSIONCURSOR');
  });
});
