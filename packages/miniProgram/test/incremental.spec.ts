// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';
import CherryStream from '../src';
import type { MiniProgramOptions } from '../src/types';

const cases = [
  '---\ntitle: demo\n\nbody\n\nmore\n---\n\nvisible',
  'first\n\nsecond\n\nthird',
  '# Same\n\nFirst\n\n# Same\n\nLast',
  '# `code` $x$\n\nFirst\n\n# `code` $x$\n\nLast',
  'paragraph\n\n```js\nconst a = 1;\n\nconsole.log(a);\n```\n\ntail\n\nmore',
  'prefix\n\n- a\n- b\n  - nested\n\nparagraph\n\nlast',
  'prefix\n\n> quote\n>\n> ```js\n> let x = 1;\n> ```\n\nafter\n\nlast',
  'prefix\n\n| A | B |\n| --- | --- |\n| x | y |\n\nafter\n\nlast',
  'prefix\n\n$$\nx^2\n$$\n\nafter\n\nlast',
  'prefix\n\n+++ title\nbody\n\nmore\n+++\n\nafter\n\nlast',
  'prefix\n\n:::tip Title\nbody\n\nmore\n:::\n\nafter\n\nlast',
  'prefix\n\n[go][target]\n\ntail\n\n[target]: https://example.com',
  'prefix\n\nref[^x]\n\ntail\n\n[^x]: **note**',
  '# Heading\n\n[TOC]\n\nSecond\n\n## Last',
  'prefix\n\n<div>raw\n\n**text**\n</div>\n\nlast',
  'prefix\r\n\r\nparagraph\r\n\r\nlast',
  'prefix\r\rparagraph\r\rlast',
  'plain\n\n```text\n[ref]: https://literal.com\n<literal>\n```\n\nafter\n\nlast',
];

function compareChunks(markdown: string, size: number, options: MiniProgramOptions = {}) {
  const incremental = new CherryStream(options);
  for (let end = 1; end <= markdown.length + size - 1; end += size) {
    const current = markdown.slice(0, Math.min(end, markdown.length));
    const actual = incremental.setMarkdown(current, { deferImages: end < markdown.length });
    const expected = new CherryStream(options).setMarkdown(current, { deferImages: end < markdown.length });
    expect(actual, `chunk ${end}: ${JSON.stringify(current)}`).toEqual(expected);
  }
  return incremental;
}

describe('Cherry streaming checkpoints', () => {
  it.each(cases)('matches a fresh semantic parse at every character: %s', (markdown) => {
    compareChunks(markdown, 1);
    compareChunks(markdown, 7);
  });

  it('parses only the active suffix after a long stable prefix', () => {
    const stream = new CherryStream();
    const prefix = Array.from({ length: 300 }, (_, i) => `Paragraph ${i}`).join('\n\n');
    stream.setMarkdown(prefix + '\n\nTail');
    stream.setMarkdown(prefix + '\n\nTail updated');
    const stats = stream.getParseStats();
    expect(stats.mode).toBe('incremental');
    expect(stats.reusedCharacters).toBeGreaterThan(prefix.length - 20);
    expect(stats.parsedCharacters).toBeLessThan(100);
  });

  it('invalidates frozen blocks when a later reference definition arrives', () => {
    const stream = new CherryStream();
    const prefix = '[go][target]\n\nparagraph\n\ntail';
    stream.setMarkdown(prefix);
    stream.setMarkdown(prefix + '\n\n[target]: https://example.com');
    expect(stream.getParseStats().reason).toBe('document-dependency');
    expect(stream.setMarkdown(prefix + '\n\n[target]: https://example.com')[0]).toMatchObject({
      type: 'paragraph',
      inlines: [{ type: 'link', text: 'go', href: 'https://example.com' }],
    });
  });

  it('restarts for non-append edits and render option changes', () => {
    const stream = new CherryStream();
    stream.setMarkdown('a\n\nb\n\nc');
    expect(stream.setMarkdown('changed\n\nb\n\nc')).toEqual(new CherryStream().setMarkdown('changed\n\nb\n\nc'));
    expect(stream.getParseStats().reason).toBe('replacement');
    stream.setMarkdown('changed\n\nb\n\nc', { unknownTag: 'drop' });
    expect(stream.getParseStats().reason).toBe('configuration');
  });

  it('uses full parsing for multiline emphasis configurations and callbacks', () => {
    const options = { engine: { syntax: { fontEmphasis: { allowWhitespace: true } } } };
    const stream = compareChunks('**first\n\nsecond**\n\nlast', 1, options);
    expect(stream.getParseStats().reason).toBe('configuration');
  });

  it('does not treat reference-looking code as a document dependency', () => {
    const source = '```text\n[ref]: https://literal.com\n<literal>\n```\n\nparagraph\n\ntail';
    const stream = new CherryStream();
    stream.setMarkdown(source);
    stream.setMarkdown(source + ' more');
    expect(stream.getParseStats().mode).toBe('incremental');
  });
  it('matches fresh parsing under deterministic mixed-block chunk partitions', () => {
    const fragments = [
      'paragraph',
      '# heading',
      '**bold** [link](/p)',
      '- one\n  - two',
      '> quote',
      '```js\nlet x = 1;\n```',
      '| A |\n| --- |\n| B |',
      '$$\nx^2\n$$',
      ':::tip Title\nbody\n:::',
      '+++ Title\nbody\n+++',
    ];
    let state = 1729;
    for (let sample = 0; sample < 40; sample++) {
      const blocks: string[] = [];
      for (let index = 0; index < 8; index++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        blocks.push(fragments[state % fragments.length]);
      }
      compareChunks(blocks.join('\n\n'), 1 + (state % 19));
    }
  });

  it('does not expose mutable cached semantic nodes', () => {
    const stream = new CherryStream();
    const blocks = stream.makeBlocks('one\n\ntwo\n\nthree');
    if (blocks[0].type === 'paragraph' && blocks[0].children[0].type === 'text') blocks[0].children[0].text = 'mutated';
    expect(stream.setMarkdown('one\n\ntwo\n\nthree more')).toEqual(
      new CherryStream().setMarkdown('one\n\ntwo\n\nthree more'),
    );
  });
});
