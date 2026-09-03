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
import { describe, expect, it } from 'vite-plus/test';
import CherryEngine from '../../src/index.engine.core';
import Engine from '../../src/Engine';

type EngineOptions = ConstructorParameters<typeof CherryEngine>[0];

function createEngine(options: EngineOptions = {}): Engine {
  // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
  return new CherryEngine(options);
}

const MINIMAL_TRIGGER = '$$\n行内公式： $e=mc^2$';

function richMarkdown() {
  return [
    '# Heading **bold**',
    '',
    'Plain paragraph with *italic* and `code` and [link](https://e.com).',
    '',
    '$$\n\\begin{aligned}\nE &= mc^2 \\\\\nF &= ma\n\\end{aligned}\n$$',
    '',
    '行内公式： $e=mc^2$',
    '',
    '| a | b |',
    '| - | - |',
    '| 1 | 2 |',
    '',
    '```js\nconst x = 1;\n```',
    '',
    '- li1',
    '- li2',
    '',
    '> blockquote line',
    '',
    '<div data-x="1"><b>html</b></div>',
    '',
    // 追加最小触发形态（未闭合块级公式后接行内公式）
    '$$\n行内公式： $e=mc^2$',
  ].join('\n');
}

function plain(n: number) {
  return Array.from({ length: n }, (_, i) => `P${i}: normal **bold ${i}** *em* and [link ${i}](https://e.com/${i}).`).join(
    '\n\n',
  );
}

const corpus = [
  MINIMAL_TRIGGER,
  richMarkdown(),
  plain(8),
  '| a | b |\n| - | - |\n| 1 | 2 |\n\nrow text',
  '```js\nconst x = 1;\n```\n\npara after code',
  '- li1\n- li2\n\n> quote',
];

function render(md: string): string {
  return createEngine().makeHtml(md);
}

describe('Engine cross-instance determinism', () => {
  it('two fresh engines agree on the minimal trigger', () => {
    expect(render(MINIMAL_TRIGGER)).toBe(render(MINIMAL_TRIGGER));
  });

  it('two fresh engines agree on the rich synthetic document', () => {
    const md = richMarkdown();
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
    const md = richMarkdown();
    const e1 = createEngine();
    const first = e1.makeHtml(md);
    createEngine().makeHtml(md);
    createEngine().makeHtml(MINIMAL_TRIGGER);
    // 全局计数器在创建后续引擎时被归零，不应影响已存在的 e1
    expect(e1.makeHtml(md)).toBe(first);
  });
});
