/**
 * Regression test for issue #1955.
 *
 * Root cause: Engine encodes ~ -> ~T and $ -> ~D before hooks run
 * (Engine.$encodeReservedKeywords). Strikethrough input ~~https://x~~ therefore
 * reaches AutoLink as ~~T~~Thttps://x~~T~~T:
 *  - the protocol group swallowed the adjacent "T" ("Thttps:"), rendering
 *    href="thttps://x"…
 *  - the trailing ~~T~~T delimiters leaked into the URL tail, so Strikethrough
 *    later turned them into "</del>" inside href/title.
 *
 * Fixes:
 *  1. rule() lets the protocol group capture the leading encoded residue (~T/~D),
 *     makeHtml strips it and keeps it as plain text before the <a> tag.
 *  2. stripBreakChars() now also cuts trailing encoded ~T sequences from the
 *     URL tail and returns them as plain text.
 */
import { describe, expect, it, vi, beforeEach } from 'vite-plus/test';
import CherryEngine from '../../../src/index.engine.core';

function createEngine() {
  return new CherryEngine({});
}

describe('issue #1955: strikethrough around bare URLs', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('renders ~~http://example.com~~ as a strikethrough link with the real protocol', () => {
    const html = createEngine().makeHtml('~~http://example.com~~');
    expect(html).toContain('<del><a href="http://example.com"');
    expect(html).not.toContain('thttp');
  });

  it('keeps the strikethrough delimiters out of the URL tail', () => {
    const html = createEngine().makeHtml('~~see https://example.com/a~~');
    expect(html).toContain('<a href="https://example.com/a"');
    expect(html).toContain('</del></p>');
    expect(html).not.toContain('</del>"');
  });

  it('does not regress plain URLs next to tildes', () => {
    const html = createEngine().makeHtml('visit https://example.com/ok today');
    expect(html).toContain('<a href="https://example.com/ok"');
  });
});
