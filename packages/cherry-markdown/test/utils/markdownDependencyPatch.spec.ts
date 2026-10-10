/// <reference types="node" />
// @vitest-environment node
import { createRequire } from 'node:module';
import * as esmState from '@codemirror/state';
import * as esmMarkdown from '@codemirror/lang-markdown';
import { describe, expect, it } from 'vite-plus/test';

const require = createRequire(import.meta.url);
const variants = [
  { name: 'ESM', state: esmState, markdown: esmMarkdown },
  {
    name: 'CJS',
    state: require('@codemirror/state') as typeof esmState,
    markdown: require('@codemirror/lang-markdown') as typeof esmMarkdown,
  },
];

// Load each runtime with its own state/language modules to test the installed
// dependency, rather than testing a second copy of Cherry's implementation.
describe.each(variants)('installed Markdown patch ($name)', ({ state: { EditorState }, markdown }) => {
  const run = (before: string, config = {}, readOnly = false, lineSeparator = '\n') => {
    const cursor = before.indexOf('|');
    const doc = before.replace('|', '').replace(/\n/g, lineSeparator);
    let state = EditorState.create({
      doc,
      selection: { anchor: cursor },
      extensions: [markdown.markdown(), EditorState.readOnly.of(readOnly), EditorState.lineSeparator.of(lineSeparator)],
    });
    const command = markdown.insertNewlineContinueMarkupCommand(config);
    const handled = command({
      state,
      dispatch: (tr) => {
        state = tr.state;
      },
    });
    const text = state.doc.sliceString(0, state.doc.length, '\n');
    return { handled, text: `${text.slice(0, state.selection.main.head)}|${text.slice(state.selection.main.head)}` };
  };
  const options = { nonTightLists: false, continueLooseLists: false, exitParagraphBoundary: true };

  it.each([
    ['- a\n\n- b|', '- a\n\n- b\n- |'],
    ['- a\n- |\n- c', '- a\n\n|\n\n- c'],
    ['> - a\n> - |', '> - a\n>\n> |'],
    ['- a\n  - b\n  - |', '- a\n  - b\n- |'],
    ['1. a\n\n2. b|\n3. c', '1. a\n\n2. b\n3. |\n4. c'],
  ])('applies Cherry options to %j', (before, after) => {
    expect(run(before, options)).toEqual({ handled: true, text: after });
  });

  it('preserves upstream defaults when options are omitted', () => {
    expect(run('- a\n\n- b|')).toEqual({ handled: true, text: '- a\n\n- b\n\n- |' });
    expect(run('- a\n- |')).toEqual({ handled: true, text: '- a\n\n- |' });
  });

  it('respects read-only state', () => {
    expect(run('- a|', options, true)).toEqual({ handled: false, text: '- a|' });
  });

  it('uses document coordinates for CRLF cursors', () => {
    expect(run('- a\n\n- b|', options, false, '\r\n')).toEqual({ handled: true, text: '- a\n\n- b\n- |' });
    expect(run('- a\n- |', options, false, '\r\n')).toEqual({ handled: true, text: '- a\n\n|' });
  });
});
