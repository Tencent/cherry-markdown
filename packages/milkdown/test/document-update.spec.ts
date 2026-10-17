import { describe, expect, it } from 'vitest';
import { Schema } from '@milkdown/kit/prose/model';
import { createDocumentUpdate, rebaseCompositionUpdate, withEditableTail } from '../src/document-update';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    diagram: { group: 'block', atom: true, attrs: { source: { default: '' } } },
    text: { group: 'inline' },
  },
});
const document = (...paragraphs: string[]) =>
  schema.node(
    'doc',
    null,
    paragraphs.map((text) => schema.node('paragraph', null, text ? schema.text(text) : undefined)),
  );

describe('external document updates', () => {
  it.each([
    ['unchanged', document('Same'), document('Same')],
    ['repeated-text insertion', document('aaa'), document('aaaa')],
    ['repeated-text deletion', document('aaaa'), document('aaa')],
    ['paragraph prepend', document('First', 'Second'), document('Remote', 'First', 'Second')],
    ['paragraph deletion', document('First', 'Second'), document('Second')],
  ])('produces the exact next document for %s', (_name, before, next) => {
    expect(createDocumentUpdate(before, next).doc.eq(next)).toBe(true);
    expect(createDocumentUpdate(before, next).steps.length).toBeLessThanOrEqual(1);
  });

  it('normalizes the editor-only tail without duplicating it', () => {
    const atom = schema.node('doc', null, schema.node('diagram', { source: 'A-->B' }));
    const normalized = withEditableTail(atom);
    expect(normalized.lastChild?.type.name).toBe('paragraph');
    expect(withEditableTail(normalized)).toBe(normalized);
    expect(withEditableTail(document('Text')).childCount).toBe(1);
  });
});

describe('composition update rebasing', () => {
  it.each([
    [
      'prepend before native input',
      document('开始：结束'),
      document('开始：你好结束'),
      document('远程', '开始：结束'),
      document('远程', '开始：你好结束'),
    ],
    [
      'prepend over preedit',
      document('开始：ni结束'),
      document('开始：你好结束'),
      document('远程', '开始：ni结束'),
      document('远程', '开始：你好结束'),
    ],
    [
      'append a separate paragraph',
      document('First', 'Startni END'),
      document('First', 'Start你好 END'),
      document('First', 'Startni END', 'Remote'),
      document('First', 'Start你好 END', 'Remote'),
    ],
    [
      'change another paragraph',
      document('Old', 'Startni'),
      document('Old', 'Start你好'),
      document('New', 'Startni'),
      document('New', 'Start你好'),
    ],
    [
      'delete another paragraph',
      document('Old', 'Startni'),
      document('Old', 'Start你好'),
      document('Startni'),
      document('Start你好'),
    ],
    [
      'non-BMP candidate',
      document('开始：ni hao结束'),
      document('开始：👋结束'),
      document('远程', '开始：ni hao结束'),
      document('远程', '开始：👋结束'),
    ],
    [
      'unchanged external semantics',
      document('Startni'),
      document('Start你好'),
      document('Startni'),
      document('Start你好'),
    ],
    ['cancelled composition', document('Start'), document('Start'), document('Replace'), document('Replace')],
  ])('preserves native changes for %s', (_name, requested, committed, next, expected) => {
    const merged = rebaseCompositionUpdate(requested, committed, next);
    expect(merged?.doc.eq(expected)).toBe(true);
  });

  it.each([
    [document('Start'), document('Start你好'), document('StartRemote')],
    [document('开始：ni结束'), document('开始：你好结束'), document('开始：Remote结束')],
    [document('First', 'Startni'), document('First', 'Start你好'), document('First')],
    [document('Startni'), document('Start你好'), document('Full replacement')],
  ])('rejects ambiguous overlapping updates without modifying committed input', (requested, committed, next) => {
    const original = committed.toJSON();
    expect(rebaseCompositionUpdate(requested, committed, next)).toBeUndefined();
    expect(committed.toJSON()).toEqual(original);
  });

  it('preserves a committed atom source and its editor-only tail', () => {
    const requested = withEditableTail(schema.node('doc', null, schema.node('diagram', { source: 'ni' })));
    const committed = withEditableTail(schema.node('doc', null, schema.node('diagram', { source: '你好' })));
    const next = schema.node('doc', null, [document('Remote').firstChild!, ...requested.content.content]);
    const expected = schema.node('doc', null, [document('Remote').firstChild!, ...committed.content.content]);
    expect(rebaseCompositionUpdate(requested, committed, next)?.doc.eq(expected)).toBe(true);
  });

  it.each(['before-commit', 'commit-frame'])('recognizes a stale composition-start snapshot received %s', (phase) => {
    const started = document('开始：结束');
    const committed = document('开始：你好结束');
    const requested = phase === 'commit-frame' ? committed : document('开始：ni结束');
    const external = document('远程', '开始：结束');
    expect(
      rebaseCompositionUpdate(requested, committed, external, started)?.doc.eq(document('远程', '开始：你好结束')),
    ).toBe(true);
  });

  it('accepts a fresh commit-frame value without inserting the candidate twice', () => {
    const started = document('开始：结束');
    const committed = document('开始：你好结束');
    const external = document('远程', '开始：你好结束');
    expect(rebaseCompositionUpdate(committed, committed, external, started)?.doc.eq(external)).toBe(true);
  });
});
