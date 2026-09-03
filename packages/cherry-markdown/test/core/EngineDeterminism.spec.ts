/**
 * Regression test: fresh Engine instances must render the same document to
 * byte-identical HTML (cross-instance determinism).
 *
 * Root cause: paragraph cache key prefixes (`~~C{n}`) come from a module-level
 * counter shared across instances, so different instances number their
 * placeholders differently (`~~C2` vs `~~C16`). When a paragraph's markdown is
 * hashed for `data-sign` while it still contains another hook's `~~C{n}`
 * placeholder (e.g. an unterminated block-math region followed by an inline
 * formula), the hash — and therefore the output `data-sign` — drifts per
 * instance.
 *
 * Minimal trigger (verified): "$$\n行内公式： $e=mc^2$"
 */
import CherryEngine from '../../src/index.engine.core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MINIMAL_TRIGGER = '$$\n行内公式： $e=mc^2$';

function exampleMarkdown() {
  return readFileSync(resolve(process.cwd(), 'test/example.md'), 'utf8');
}

function plain(n) {
  return Array.from({ length: n }, (_, i) => `P${i}: normal **bold ${i}** *em* and [link ${i}](https://e.com/${i}).`).join('\n\n');
}

// 一组覆盖常见语法形态的文档，用于通用确定性断言
const corpus = [
  MINIMAL_TRIGGER,
  plain(8),
  '<div data-x="1"><b>bold</b></div>\n\nplain *em* after html',
  '| a | b |\n| - | - |\n| 1 | 2 |\n\nrow text',
  '```js\nconst x = 1;\n```\n\npara after code',
  '# Heading **b**\n\n- li1\n- li2\n\n> quote',
];

function render(md) {
  return new CherryEngine().makeHtml(md);
}

describe('Engine cross-instance determinism', () => {
  it('two fresh engines agree on the minimal trigger', () => {
    expect(render(MINIMAL_TRIGGER)).toBe(render(MINIMAL_TRIGGER));
  });

  it('two fresh engines agree on the rich example document', () => {
    const md = exampleMarkdown();
    expect(render(md)).toBe(render(md));
  });

  it('three fresh engines all agree across a markdown corpus', () => {
    for (const md of corpus) {
      const out = [render(md), render(md), render(md)];
      expect(out[1]).toBe(out[0]);
      expect(out[2]).toBe(out[0]);
    }
  });

  it('creating more engines later does not change an existing engine output', () => {
    const md = exampleMarkdown();
    const e1 = new CherryEngine();
    const first = e1.makeHtml(md);
    const e2 = new CherryEngine();
    e2.makeHtml(md);
    const e3 = new CherryEngine();
    e3.makeHtml(MINIMAL_TRIGGER);
    // 全局计数器在构造 e2/e3 时被归零，不应影响已存在的 e1
    expect(e1.makeHtml(md)).toBe(first);
  });
});
