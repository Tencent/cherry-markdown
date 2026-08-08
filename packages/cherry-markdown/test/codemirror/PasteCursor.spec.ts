/**
 * HTML paste cursor regression tests.
 */

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { EditorView } from '@codemirror/view';
import Editor from '../../src/Editor';
import pasteHelper from '../../src/utils/pasteHelper';
import { createCm6View, getDoc, getSelection } from '../helpers/cM6View';

/**
 * Wrap a raw CM6 EditorView into the minimal adapter shape that
 * `formatHtml2MdWhenPaste` / `pasteHelper` expect (dispatch / state /
 * scrollDOM / view / on). All real work is still delegated to the
 * underlying EditorView so assertions on `getDoc(view)` / `getSelection(view)`
 * keep working.
 */
function createCm6Adapter(view: EditorView) {
  return {
    view,
    get state() {
      return view.state;
    },
    get scrollDOM() {
      return view.scrollDOM;
    },
    dispatch: (...specs: Parameters<EditorView['dispatch']>) => view.dispatch(...specs),
    on: vi.fn(),
    off: vi.fn(),
  };
}

describe('HTML paste cursor position', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves the cursor to the end of converted Markdown', () => {
    const view = createCm6View('AAABBB', 3);
    const adapter = createCm6Adapter(view);
    vi.spyOn(pasteHelper, 'showSwitchBtnAfterPasteHtml').mockImplementation(() => {});

    const editor = Object.create(Editor.prototype);
    editor.$cherry = {};

    editor.formatHtml2MdWhenPaste(null, '<span>PASTED</span>', 'PASTED', adapter);

    expect(getDoc(view)).toBe('AAAPASTEDBBB');
    expect(getSelection(view)).toEqual({ anchor: 3, head: 9 });

    view.destroy();
  });

  it('places the cursor after content that replaces a selection', () => {
    const view = createCm6View('AAA-old-BBB', 4, 7);
    const adapter = createCm6Adapter(view);
    vi.spyOn(pasteHelper, 'showSwitchBtnAfterPasteHtml').mockImplementation(() => {});

    const editor = Object.create(Editor.prototype);
    editor.$cherry = {};

    editor.formatHtml2MdWhenPaste(null, '<strong>NEW</strong>', 'NEW', adapter);

    expect(getDoc(view)).toBe('AAA-**NEW**-BBB');
    expect(getSelection(view)).toEqual({ anchor: 4, head: 11 });

    view.destroy();
  });
});
