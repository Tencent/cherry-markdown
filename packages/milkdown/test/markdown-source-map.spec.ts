import { describe, expect, it } from 'vite-plus/test';
import { mapMarkdownTextEdit } from '../src/markdown-source-map';

const tree = (source: string, offset: number, value = 'Same') => ({
  type: 'root',
  children: [{ type: 'paragraph', children: [{ type: 'text', value, position: { start: { offset }, end: { offset: offset + source.length } } }] }],
});

describe('Markdown text source mapping', () => {
  it('maps matching literal text and ignores source positions when comparing trees', () => {
    const parse = (source: string) => source === '* Same' ? tree('Same', 2) : tree('Same', 0);
    expect(mapMarkdownTextEdit('* Same', 'Same', 4, 4, parse)).toBe(6);
  });

  it('maps UTF-16 offsets after a surrogate pair', () => {
    const parse = (source: string) => source === '* 🙂相同' ? tree('🙂相同', 2, '🙂相同') : tree('🙂相同', 0, '🙂相同');
    expect(mapMarkdownTextEdit('* 🙂相同', '🙂相同', 4, 4, parse)).toBe(6);
  });

  it('rejects escaped text, different structure and parser failures', () => {
    expect(mapMarkdownTextEdit('S\\ame', 'Same', 2, 2, (source) =>
      source === 'Same' ? tree('Same', 0) : tree('S\\ame', 0),
    )).toBeUndefined();
    expect(mapMarkdownTextEdit('* Same', 'Same', 2, 2, (source) =>
      source === 'Same' ? tree('Same', 0) : { ...tree('Same', 2), type: 'different' },
    )).toBeUndefined();
    expect(mapMarkdownTextEdit('* Same', 'Same', 2, 2, () => { throw new Error('parse failed'); })).toBeUndefined();
  });
});
