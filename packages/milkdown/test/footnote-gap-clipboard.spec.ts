import { Fragment, Schema, Slice } from '@milkdown/kit/prose/model';
import { describe, expect, it } from 'vite-plus/test';
import { stripFootnoteGapsFromCopy } from '../src/wysiwyg/nodes/footnotes';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    cherry_footnote_gap: { group: 'block', content: 'text*' },
    blockquote: { group: 'block', content: 'block+' },
    text: { group: 'inline' },
  },
});
const transform = stripFootnoteGapsFromCopy;

describe('copying footnote layout gaps', () => {
  it('omits only the layout gap and preserves partial selection openness', () => {
    const first = schema.node('paragraph', null, schema.text('first'));
    const gap = schema.node('cherry_footnote_gap');
    const empty = schema.node('paragraph');
    const last = schema.node('paragraph', null, schema.text('last'));
    const result = transform(new Slice(Fragment.fromArray([first, gap, empty, last]), 1, 1));
    expect(result.openStart).toBe(1);
    expect(result.openEnd).toBe(1);
    expect(result.content.childCount).toBe(3);
    expect(result.content.child(0)).toBe(first);
    expect(result.content.child(1)).toBe(empty);
    expect(result.content.child(2)).toBe(last);
  });

  it('keeps an unchanged slice and returns an empty slice for a selected gap', () => {
    const ordinary = new Slice(Fragment.from(schema.node('paragraph', null, schema.text('text'))), 1, 1);
    expect(transform(ordinary)).toBe(ordinary);
    expect(transform(new Slice(Fragment.from(schema.node('cherry_footnote_gap')), 0, 0))).toBe(Slice.empty);
    const typedGap = new Slice(Fragment.from(schema.node('cherry_footnote_gap', null, schema.text('typed'))), 0, 0);
    expect(transform(typedGap)).toBe(typedGap);
  });

  it('does not remove the only child of a parent that requires content', () => {
    const quote = schema.node('blockquote', null, schema.node('cherry_footnote_gap'));
    const original = new Slice(Fragment.from(quote), 0, 0);
    expect(transform(original)).toBe(original);
  });
});
