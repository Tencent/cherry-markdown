/**
 * Editor.setCursor boundary clamping regression tests.
 */

import { describe, expect, it } from 'vitest';
import type { EditorView } from '@codemirror/view';
import Editor from '../../src/Editor';
import { createCm6View, getSelection } from '../helpers/cM6View';

/**
 * Wrap a raw CM6 EditorView into the minimal adapter shape that
 * `Editor.setCursor` expects (state / dispatch).
 */
function createEditorWithView(doc: string) {
  const view = createCm6View(doc, 0);
  const adapter = {
    view,
    get state() {
      return view.state;
    },
    dispatch: (...specs: Parameters<EditorView['dispatch']>) => view.dispatch(...specs),
  };
  const editor = Object.create(Editor.prototype);
  editor.editor = adapter;
  return { editor, view };
}

describe('Editor.setCursor', () => {
  it('sets the cursor at the given line and column', () => {
    const { editor, view } = createEditorWithView('first line\nsecond\nthird');

    editor.setCursor(1, 3);

    // 第二行 "second" 起始偏移为 11，列 3 对应位置 14
    expect(getSelection(view)).toEqual({ anchor: 14, head: 14 });
    expect(editor.getCursor()).toEqual({ line: 1, ch: 3 });

    view.destroy();
  });

  it('clamps an out-of-range line to the last line instead of throwing', () => {
    const { editor, view } = createEditorWithView('first line\nsecond\nthird');

    expect(() => editor.setCursor(9999, 0)).not.toThrow();

    // 钳制到最后一行 "third"（起始偏移 18）
    expect(getSelection(view)).toEqual({ anchor: 18, head: 18 });
    expect(editor.getCursor()).toEqual({ line: 2, ch: 0 });

    view.destroy();
  });

  it('clamps a negative line to the first line instead of throwing', () => {
    const { editor, view } = createEditorWithView('first line\nsecond\nthird');

    expect(() => editor.setCursor(-5, 2)).not.toThrow();

    // 钳制到第一行，列 2
    expect(getSelection(view)).toEqual({ anchor: 2, head: 2 });
    expect(editor.getCursor()).toEqual({ line: 0, ch: 2 });

    view.destroy();
  });

  it('clamps an out-of-range column to the end of the target line', () => {
    const { editor, view } = createEditorWithView('first line\nsecond\nthird');

    expect(() => editor.setCursor(1, 999)).not.toThrow();

    // 钳制到第二行行尾（偏移 17）
    expect(getSelection(view)).toEqual({ anchor: 17, head: 17 });
    expect(editor.getCursor()).toEqual({ line: 1, ch: 6 });

    view.destroy();
  });
});
