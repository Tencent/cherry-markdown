import { describe, expect, it } from 'vite-plus/test';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { indentMore } from '@codemirror/commands';
import { allowListTabInput } from '../../src/utils/listTabInput';

function stateFor(doc: string) {
  return EditorState.create({
    doc,
    selection: { anchor: doc.length },
    extensions: [markdown(), EditorState.changeFilter.of(allowListTabInput)],
  });
}

describe('empty list native Tab input', () => {
  it.each(['- ', '  - ', '1. ', '* ', '+ '])('filters duplicate native Tab before %j then indents once', (line) => {
    const doc = `- Item 1\n    - Item 1.1\n- Item 2\n${line}`;
    let state = stateFor(doc);
    state = state.update({ changes: { from: state.doc.line(4).from, insert: '\t' }, userEvent: 'input.type' }).state;
    expect(state.doc.toString()).toBe(doc);
    indentMore({
      state,
      dispatch: (tr) => {
        state = tr.state;
      },
    });
    expect(state.doc.line(4).text).toBe(`  ${line}`);
    state = state.update({ changes: { from: state.doc.length, insert: '12313' }, userEvent: 'input.type' }).state;
    expect(state.doc.line(4).text).toBe(`  ${line}12313`);
  });

  it.each(['plain text', '- content', '```\n- \n```', '    - '])('preserves native tabs in %j', (doc) => {
    const state = stateFor(doc);
    const from = doc.indexOf('-') >= 0 ? doc.indexOf('-') : 0;
    expect(state.update({ changes: { from, insert: '\t' }, userEvent: 'input.type' }).newDoc.toString()).toBe(
      `${doc.slice(0, from)}\t${doc.slice(from)}`,
    );
  });

  it.each(['input.paste', 'input.type.compose', 'api', undefined])('preserves %j transactions', (userEvent) => {
    const state = stateFor('- ');
    expect(state.update({ changes: { from: 0, insert: '\t' }, userEvent }).newDoc.toString()).toBe('\t- ');
  });

  it('preserves selection replacement and tabs after the marker', () => {
    const state = stateFor('- ');
    expect(state.update({ changes: { from: 0, to: 2, insert: '\t' }, userEvent: 'input.type' }).newDoc.toString()).toBe(
      '\t',
    );
    expect(state.update({ changes: { from: 2, insert: '\t' }, userEvent: 'input.type' }).newDoc.toString()).toBe(
      '- \t',
    );
  });
});
