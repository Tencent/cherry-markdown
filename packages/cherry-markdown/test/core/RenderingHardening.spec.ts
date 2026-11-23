import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import CherryEngine from '../../src/index.engine.core';
import { isValidScheme } from '../../src/utils/sanitize';
import UrlCache from '../../src/UrlCache';
import { drawioDialog } from '../../src/utils/dialog';

const createEngine = (options: any = {}) => new CherryEngine(options);

const parse = (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
};

const findUnsafeAttributes = (html: string) =>
  [...parse(html).querySelectorAll('*')].filter((el) =>
    [...el.attributes].some((attr) => attr.name.toLowerCase().startsWith('on')),
  );

describe('rendering hardening', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('escapes fenced-code language information before cache restoration', () => {
    const html = createEngine().makeHtml('```"><img src=x onerror=alert(1)>1\nx\n```');
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(parse(html).querySelectorAll('img')).toHaveLength(0);
    expect(html).toContain('&quot;');
  });

  it('escapes cached drawio data-xml values before cache restoration', () => {
    const html = createEngine().makeHtml(
      '![a](https://example.com/a.png){data-type=drawio data-xml=x" onerror="alert(1)}',
    );
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(parse(html).querySelectorAll('img')).toHaveLength(1);
  });

  it('does not let restored cache content create new elements', () => {
    const html = createEngine().makeHtml(
      '![a](https://example.com/a.png){data-type=drawio data-xml=x"><img src=x onerror=alert(1)>}',
    );
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(parse(html).querySelectorAll('img')).toHaveLength(1);
  });

  it('rejects schemes obscured with named, numeric and control-character entities', () => {
    expect(isValidScheme('javascript:alert(1)')).toBe(false);
    expect(isValidScheme('javascript&colon;alert(1)')).toBe(false);
    expect(isValidScheme('javascript&amp;colon;alert(1)')).toBe(false);
    expect(isValidScheme('java&Tab;script:alert(1)')).toBe(false);
    expect(isValidScheme('javascript&#58;alert(1)')).toBe(false);
    expect(isValidScheme('javascript&#x3A;alert(1)')).toBe(false);
    expect(isValidScheme('https://example.com/?a=1&b=2')).toBe(true);
    expect(isValidScheme('#anchor')).toBe(true);
  });

  it('does not emit executable link schemes', () => {
    const html = createEngine().makeHtml('[Open](javascript&colon;alert(1))');
    expect(parse(html).querySelectorAll('a')).toHaveLength(0);
    expect(findUnsafeAttributes(html)).toHaveLength(0);
  });

  it('escapes restored URLs so they cannot close href attributes', () => {
    const inner = UrlCache.set('https://a.com" onerror="alert(1)');
    const html = `<a href="${UrlCache.restoreAll(inner)}">x</a>`;
    expect(findUnsafeAttributes(html)).toHaveLength(0);
  });

  it('keeps legitimate data URI images renderable', () => {
    const html = createEngine().makeHtml('![a](data:image/svg+xml,%3Csvg%2F%3E)');
    expect(parse(html).querySelectorAll('img')).toHaveLength(1);
  });

  it('escapes footnote keys in HTML attributes', () => {
    const key = 'a"><img src=x onerror=alert(1)>';
    const html = createEngine().makeHtml(`text[^${key}]\n\n[^${key}]: note`);
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(parse(html).querySelectorAll('img')).toHaveLength(0);
  });

  it('validates schemes of auto-closed links in streaming mode', () => {
    const html = createEngine({ engine: { global: { flowSessionContext: true } } }).makeHtml(
      '[x](javascript&colon;alert(1)',
    );
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(parse(html).querySelector('a')).toBeNull();
  });

  it('does not let host attrRender output survive as executable attributes', () => {
    const html = createEngine({
      engine: { syntax: { autoLink: { attrRender: () => 'onerror="alert(1)"' } } },
    }).makeHtml('https://example.com');
    expect(findUnsafeAttributes(html)).toHaveLength(0);
  });

  it('keeps image decoration classes derived from a fixed whitelist', () => {
    const html = createEngine().makeHtml('![a#"><img src=x onerror=alert(1)>](https://example.com/a.png)');
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(parse(html).querySelectorAll('img')).toHaveLength(1);
    const className = parse(html).querySelector('img')?.getAttribute('class') ?? '';
    expect(className).not.toContain('onerror');
    expect(className).not.toContain('<img');
  });

  it('escapes cached inline base64 image blobs before cache restoration', () => {
    // GHSA-ww5r-cmg5-3mpm PoC: imgBase64Reg 分支在缓存值未转义时会让 blob 内的 " 闭合 src 属性
    const html = createEngine().makeHtml(
      '![a](data:image/png;base64,"><svg/onload=alert(1)><img/src=")',
    );
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(parse(html).querySelectorAll('svg')).toHaveLength(0);
    expect(html).not.toMatch(/<svg[^>]*onload/i);
  });

  it('escapes cached raw data URI blobs before cache restoration', () => {
    // base64Reg 分支：HTML 原文中直接出现的 data URI，经缓存还原后也不得能闭合属性
    const html = createEngine().makeHtml(
      '<img src="data:image/png;base64,abc"><svg onload=alert(1)><img src="y">',
    );
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(html).not.toMatch(/<svg[^>]*onload/i);
  });

  it('escapes cached long text runs before cache restoration', () => {
    // longTextReg 分支：>=6000 非空白字符会被缓存，还原时不转义会导致 XSS
    const payload = `${'a'.repeat(6000)}"><svg/onload=alert(1)><img/src="`;
    const html = createEngine().makeHtml(payload);
    expect(findUnsafeAttributes(html)).toHaveLength(0);
    expect(parse(html).querySelectorAll('svg')).toHaveLength(0);
    expect(html).not.toMatch(/<svg[^>]*onload/i);
  });

  it('keeps legitimate inline base64 images renderable after the cache fix', () => {
    // 正常 base64 图片：转义对合法字符集是幂等空操作，图片仍可正常渲染
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const html = createEngine().makeHtml(`![pic](data:image/png;base64,${b64})`);
    const img = parse(html).querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe(`data:image/png;base64,${b64}`);
  });
});

describe('drawio dialog message handling', () => {
  it('ignores messages from an unexpected origin', () => {
    const onSubmit = vi.fn();
    drawioDialog('https://draw.example.com/editor', '', '<xml/>', onSubmit);
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { eventName: 'getData:success', value: { xmlData: '<xml/>', base64: 'abc' } },
        origin: 'https://evil.example',
      }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
