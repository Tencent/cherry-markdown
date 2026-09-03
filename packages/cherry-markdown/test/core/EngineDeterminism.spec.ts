/**
 * Regression test: two fresh engine instances must render the same document
 * to byte-identical HTML.
 *
 * Motivation: paragraph-level cache key prefixes (~~C{n}) come from a
 * module-level counter shared across instances. On documents where a block's
 * hashed content still contains another hook's placeholder token, `data-sign`
 * ends up instance-dependent, so fresh instances produce slightly different
 * HTML (previously only stable within one instance).
 */
import CherryEngine from '../../src/index.engine.core';
import { readFileSync } from 'node:fs';

function richMarkdown() {
  // 文档需同时包含段落级占位与行内公式，触发“hash 内容含另一 hook 占位符”路径
  return readFileSync(new URL('../example.md', import.meta.url), 'utf8');
}

describe('Engine cross-instance determinism', () => {
  it('two fresh engines produce byte-identical HTML for the same document', () => {
    const md = richMarkdown();
    const htmlA = new CherryEngine().makeHtml(md);
    const htmlB = new CherryEngine().makeHtml(md);
    expect(htmlA).toBe(htmlB);
  });

  it('three fresh engines all agree (stability)', () => {
    const md = richMarkdown();
    const outs = [new CherryEngine().makeHtml(md), new CherryEngine().makeHtml(md), new CherryEngine().makeHtml(md)];
    expect(outs[1]).toBe(outs[0]);
    expect(outs[2]).toBe(outs[0]);
  });
});
