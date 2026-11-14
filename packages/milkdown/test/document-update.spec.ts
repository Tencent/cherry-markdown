import { describe, expect, it } from 'vite-plus/test';
import { Schema } from '@milkdown/kit/prose/model';
import { EditorState, Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { history, undo } from '@milkdown/kit/prose/history';
import {
  createDocumentUpdate,
  rebaseCompositionUpdate,
  sameSourceDocument,
  withEditableTail,
  withoutEditableTail,
} from '../src/document-update';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    heading: { group: 'block', content: 'text*', attrs: { id: { default: '' }, level: { default: 1 } } },
    diagram: { group: 'block', atom: true, attrs: { source: { default: '' } } },
    text: { group: 'inline' },
  },
  marks: { strong: {} },
});
const document = (...paragraphs: string[]) =>
  schema.node(
    'doc',
    null,
    paragraphs.map((text) => schema.node('paragraph', null, text ? schema.text(text) : undefined)),
  );

describe('external document updates', () => {
  it('compares source documents including content, attributes and real trailing paragraphs', () => {
    const heading = (id: string, level = 1) => schema.node('heading', { id, level }, schema.text('Title'));
    const parsed = schema.node('doc', null, [heading(''), schema.node('diagram', { source: 'x' })]);
    const live = schema.node('doc', null, [
      heading('title'),
      schema.node('diagram', { source: 'x' }),
      schema.node('paragraph'),
    ]);
    expect(sameSourceDocument(parsed, live)).toBe(true);
    const explicit = schema.node('doc', null, [heading('explicit'), schema.node('diagram', { source: 'x' })]);
    expect(sameSourceDocument(explicit, live)).toBe(false);
    expect(
      sameSourceDocument(
        parsed,
        schema.node('doc', null, [
          heading('title', 2),
          schema.node('diagram', { source: 'x' }),
          schema.node('paragraph'),
        ]),
      ),
    ).toBe(false);
    expect(
      sameSourceDocument(
        parsed,
        schema.node('doc', null, [
          heading('title'),
          schema.node('diagram', { source: 'changed' }),
          schema.node('paragraph'),
        ]),
      ),
    ).toBe(false);
    expect(
      sameSourceDocument(
        parsed,
        schema.node('doc', null, [
          heading('title'),
          schema.node('diagram', { source: 'x' }),
          schema.node('paragraph'),
          schema.node('paragraph'),
        ]),
      ),
    ).toBe(false);
    const bold = schema.node('doc', null, [
      schema.node('paragraph', null, schema.text('Text', [schema.mark('strong')])),
    ]);
    expect(sameSourceDocument(bold, document('Text'))).toBe(false);
  });
  it('can map a reversal around a separate plugin append without discarding it', () => {
    const result = rebaseCompositionUpdate(document('External'), document('External!'), document('Local'));
    expect(result?.doc.eq(document('Local!'))).toBe(true);
  });

  it('rejects a reversal that overlaps a plugin edit instead of guessing', () => {
    const result = rebaseCompositionUpdate(document('External'), document('Exchanged'), document('Local'));
    expect(result).toBeUndefined();
  });

  it('keeps local undo when a separate plugin append is mapped onto the prior state', () => {
    let state = EditorState.create({ doc: document('Before'), plugins: [history()] });
    state = state.apply(state.tr.insertText('Local', 1, 7));
    const rebased = rebaseCompositionUpdate(document('External'), state.doc, document('External!'));
    expect(rebased?.doc.eq(document('Local!'))).toBe(true);
    const transaction = state.tr;
    rebased!.steps.forEach((step) => transaction.step(step));
    state = state.apply(transaction.setMeta('addToHistory', false));
    expect(
      undo(state, (tr) => {
        state = state.apply(tr);
      }),
    ).toBe(true);
    expect(state.doc.eq(document('Before!'))).toBe(true);
  });

  it('cannot reconstruct arbitrary plugin state from document differences alone', () => {
    const key = new PluginKey<number>('plugin-transaction-state');
    const plugin = new Plugin({
      key,
      state: { init: () => 0, apply: (tr, count) => count + (tr.getMeta('plugin-edit') ? 1 : 0) },
      appendTransaction: (_transactions, _oldState, next) =>
        next.doc.textContent === 'External'
          ? next.tr.insertText('!', next.doc.content.size - 1).setMeta('plugin-edit', true)
          : null,
    });
    const previous = EditorState.create({ doc: document('Local'), plugins: [plugin] });
    const external = createDocumentUpdate(previous.doc, document('External'));
    const transaction = previous.tr;
    external.steps.forEach((step) => transaction.step(step));
    const applied = previous.apply(transaction);
    expect(applied.doc.eq(document('External!'))).toBe(true);
    expect(key.getState(applied)).toBe(1);
    const rebased = rebaseCompositionUpdate(document('External'), previous.doc, applied.doc);
    const replay = previous.tr;
    rebased!.steps.forEach((step) => replay.step(step));
    const restored = previous.apply(replay.setMeta('addToHistory', false));
    expect(restored.doc.eq(document('Local!'))).toBe(true);
    expect(key.getState(restored)).toBe(0);
  });
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

  it('removes only a known unchanged editor tail for serialization', () => {
    const atom = schema.node('doc', null, schema.node('diagram', { source: 'A-->B' }));
    const normalized = withEditableTail(atom);
    expect(withoutEditableTail(normalized, atom).eq(atom)).toBe(true);
    expect(withoutEditableTail(normalized, document('Text'))).toBe(normalized);
    const editedTail = schema.node('doc', null, [atom.firstChild!, schema.node('paragraph', null, schema.text('new'))]);
    expect(withoutEditableTail(editedTail, atom)).toBe(editedTail);
    const extraEmpty = schema.node('doc', null, [atom.firstChild!, schema.node('paragraph'), schema.node('paragraph')]);
    expect(withoutEditableTail(extraEmpty, atom)).toBe(extraEmpty);
    const otherBlock = schema.node('doc', null, [
      schema.node('paragraph', null, schema.text('new')),
      schema.node('paragraph'),
    ]);
    expect(withoutEditableTail(otherBlock, atom)).toBe(otherBlock);
    expect(normalized.childCount).toBe(2);
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
