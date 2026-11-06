import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { Editor, defaultValueCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import { history, historyProviderPlugin } from '@milkdown/kit/plugin/history';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { closeHistory, redo, redoDepth, undo, undoDepth } from '@milkdown/kit/prose/history';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { $prose, getMarkdown } from '@milkdown/kit/utils';
import { clearHistory, documentChanges, writeMarkdown } from '../src/components/composables/milkdown/document';

const editors: Editor[] = [];
afterEach(async () => {
  await Promise.all(editors.splice(0).map((editor) => editor.destroy()));
  document.body.replaceChildren();
});

async function create() {
  const onChange = vi.fn();
  const other = new PluginKey<object>('unrelated-state');
  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, document.body.appendChild(document.createElement('div')));
      ctx.set(defaultValueCtx, 'A');
    })
    .use(commonmark)
    .use(history)
    .use(trailing)
    .use(
      $prose(
        () =>
          new Plugin({
            key: other,
            state: { init: () => ({}), apply: (_tr, value) => value },
          }),
      ),
    )
    .use($prose(() => documentChanges(onChange)));
  editors.push(editor);
  await editor.create();
  onChange.mockClear();
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  return {
    editor,
    view,
    onChange,
    other,
    write: (value: string, addToHistory = false) => editor.action((ctx) => writeMarkdown(ctx, value, addToHistory)),
    reset: () => clearHistory(view, historyProviderPlugin.plugin()),
  };
}

describe('client Milkdown document updates', () => {
  it('allows an applied historical version to be undone and redone independently of earlier typing', async () => {
    const { view, onChange, write } = await create();
    view.dispatch(view.state.tr.insertText(' edited', 2));
    write('restored', true);
    expect(view.state.doc.textContent).toBe('restored');
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('A edited');
    expect(redo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('restored');
    expect(onChange).toHaveBeenCalledTimes(3);
  });
  it('keeps external writes and their trailing-node transactions silent, but reports immediate typing', async () => {
    const { view, onChange, write } = await create();
    write('---');
    expect(view.state.doc.lastChild?.type.name).toBe('paragraph');
    expect(onChange).not.toHaveBeenCalled();
    view.dispatch(view.state.tr.insertText('!', 2));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(view.state.doc.textContent).toBe('!');
  });

  it('reports user edits back to an earlier programmatic value and subsequent undo/redo', async () => {
    const { view, onChange, write } = await create();
    write('A');
    write('B');
    view.dispatch(view.state.tr.insertText('A', 1, 2));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('B');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(redo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toBe('A');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('does not swallow the first edit after repeated same-value external writes', async () => {
    const { view, onChange, write } = await create();
    write('A');
    write('A');
    view.dispatch(view.state.tr.insertText('new ', 1));
    expect(view.state.doc.textContent).toBe('new A');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('resets both history branches at a file boundary and preserves unrelated state and content DOM', async () => {
    const { editor, view, onChange, write, reset, other } = await create();
    view.dispatch(view.state.tr.insertText(' edited', 2));
    view.dispatch(closeHistory(view.state.tr).insertText(' again', 9));
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(undoDepth(view.state)).toBeGreaterThan(0);
    expect(redoDepth(view.state)).toBeGreaterThan(0);
    write('B');
    const state = other.getState(view.state);
    const doc = view.state.doc;
    const selection = view.state.selection;
    const dom = view.dom;
    const paragraph = view.dom.firstChild;
    onChange.mockClear();
    reset();
    expect(view.state.doc).toBe(doc);
    expect(view.state.selection).toBe(selection);
    expect(other.getState(view.state)).toBe(state);
    expect(view.dom).toBe(dom);
    expect(view.dom.firstChild).toBe(paragraph);
    expect(onChange).not.toHaveBeenCalled();
    expect(undo(view.state, view.dispatch)).toBe(false);
    expect(redo(view.state, view.dispatch)).toBe(false);
    view.dispatch(view.state.tr.insertText(' edited', 2));
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(editor.action(getMarkdown()).trim()).toBe('B');
    expect(undo(view.state, view.dispatch)).toBe(false);
    expect(redo(view.state, view.dispatch)).toBe(true);
    expect(editor.action(getMarkdown()).trim()).toBe('B edited');
  });
});
