/**
 * Regression tests for issue #1955.
 *
 * Root causes (all verified against 0.11.13 / dev@4feb275):
 *  1. Engine encodes ~ -> ~T before hooks run. ~~http://x~~ becomes
 *     ~~T~~Thttp://x~~T~~T; the AutoLink protocol group swallowed the
 *     adjacent T ('Thttp:') and the trailing ~~T leaked into the URL.
 *  2. CommentReference refRegex required a non-empty second bracket, so
 *     collapsed references [text][] left '[]' in the output.
 *  3. Emphasis matched the * inside alt="*" of inline HTML, corrupting
 *     the attribute and swallowing the closing marker of the next pair.
 *
 * Case 4 (emphasis around a link containing emphasis producing duplicate
 * <a> tags) requires reordering Link after Emphasis; too invasive for this
 * PR — tracked separately in the issue discussion.
 */
import { describe, expect, it, vi, beforeEach } from 'vite-plus/test';
import CherryEngine from '../../../src/index.engine.core';

function createEngine() {
  return new CherryEngine({});
}

describe('issue #1955: links and emphasis rendering', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('case 1: ~~url~~ renders a strikethrough link with the real protocol', () => {
    const html = createEngine().makeHtml('~~http://example.com~~');
    expect(html).toContain('<del><a href="http://example.com"');
    expect(html).not.toContain('thttp');
  });

  it('case 2 (inline variant): keeps delimiters out of the URL tail', () => {
    const html = createEngine().makeHtml('~~see https://example.com/a~~');
    expect(html).toContain('<a href="https://example.com/a"');
    expect(html).not.toContain('</del>"');
  });

  it('case 3: collapsed reference links [text][] drop the empty brackets', () => {
    const md = 'See [Docs][].' + String.fromCharCode(10, 10) + '[Docs]: http://example.com/';
    const html = createEngine().makeHtml(md);
    expect(html).toContain('<a href="http://example.com/">Docs</a>');
    expect(html).not.toContain('][');
  });

  it('case 4: * inside an HTML attribute is not treated as emphasis', () => {
    const html = createEngine().makeHtml('<img src="a.png" alt="*"> and *this*');
    expect(html).toContain('alt="*"');
    expect(html).toContain('<em>this</em>');
    expect(html).not.toContain('alt="<em>"');
  });

  it('plain emphasis and links still render normally', () => {
    const html = createEngine().makeHtml('*Read [Dune](/dune) now*');
    expect(html).toContain('<em>Read <a href="/dune">Dune</a> now</em>');
  });
});
