/**
 * HTML paste cursor regression tests.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import Editor from '../../src/Editor';
import pasteHelper from '../../src/utils/pasteHelper';
import { createCm6View, getDoc, getSelection } from '../helpers/cM6View';

describe('HTML paste cursor position', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves the cursor to the end of converted Markdown', () => {
    const view = createCm6View('AAABBB', 3);
    vi.spyOn(pasteHelper, 'showSwitchBtnAfterPasteHtml').mockImplementation(() => {});

    const editor = Object.create(Editor.prototype);
    editor.$cherry = {};

    editor.formatHtml2MdWhenPaste(null, '<span>PASTED</span>', 'PASTED', view);

    expect(getDoc(view)).toBe('AAAPASTEDBBB');
    expect(getSelection(view)).toEqual({ anchor: 9, head: 9 });

    view.destroy();
  });

  it('places the cursor after content that replaces a selection', () => {
    const view = createCm6View('AAA-old-BBB', 4, 7);
    vi.spyOn(pasteHelper, 'showSwitchBtnAfterPasteHtml').mockImplementation(() => {});

    const editor = Object.create(Editor.prototype);
    editor.$cherry = {};

    editor.formatHtml2MdWhenPaste(null, '<strong>NEW</strong>', 'NEW', view);

    expect(getDoc(view)).toBe('AAA-**NEW**-BBB');
    expect(getSelection(view)).toEqual({ anchor: 11, head: 11 });

    view.destroy();
  });
});
