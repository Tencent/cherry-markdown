import { expect, it, vi } from 'vite-plus/test';
import { editorViewCtx } from '@milkdown/kit/core';
import { TextSelection } from '@milkdown/kit/prose/state';
import { undo } from '@milkdown/kit/prose/history';
import * as editorDom from '../src/wysiwyg/editor-dom';
import { createTestEditor, editorShadow } from './helpers/create-editor';

it.each(['copy', 'cut'])('%s uses the visible range when the editor selection is one event behind', async (type) => {
  const root = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el: root, value: 'Paste this' });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.focus();
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 9)));
      const text = view.dom.querySelector('p')!.lastChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 10);
      // jsdom does not expose composed selections inside a Shadow Root.
      vi.spyOn(editorDom, 'editorSelectionRange').mockReturnValue(range);
      const data = new Map<string, string>();
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', {
        value: { clearData: () => data.clear(), setData: (key: string, value: string) => data.set(key, value) },
      });
      view.dom.dispatchEvent(event);
      expect(data.get('text/plain')).toBe('Paste this');
      expect(event.defaultPrevented).toBe(true);
      expect(view.state.doc.textContent).toBe(type === 'cut' ? '' : 'Paste this');
    });
  } finally {
    vi.restoreAllMocks();
    await instance.destroy();
    root.remove();
  }
});

it.each([false, true])('formats the visible range when a Bubble action races selectionchange (late update: %s)', async (lateUpdate) => {
  const root = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el: root, value: 'Selected text' });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.focus();
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 3, 14)));
      const text = view.dom.querySelector('p')!.lastChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 13);
      vi.spyOn(editorDom, 'editorSelectionRange').mockReturnValue(range);
      const button = editorShadow(root).querySelector<HTMLButtonElement>('[aria-label="行内代码"]')!;
      button.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
      if (lateUpdate) view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 3, 14)));
      button.click();
      expect(view.state.doc.firstChild!.childCount).toBe(1);
      expect(view.state.doc.firstChild!.firstChild!.text).toBe('Selected text');
      expect(view.state.doc.firstChild!.firstChild!.marks.some((mark) => mark.type.spec.code)).toBe(true);
    });
  } finally {
    vi.restoreAllMocks();
    await instance.destroy();
    root.remove();
  }
});

it('does not group a cut after an external replacement with typing in the previous document', async () => {
  const root = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el: root, value: 'Paste this' });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.dispatch(view.state.tr.insertText('/Paste this', 11));
    });
    instance.setMarkdown('Cut this', { emit: false });
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 9)).deleteSelection());
      expect(undo(view.state, view.dispatch)).toBe(true);
      expect(view.state.doc.textContent).toBe('Cut this');
    });
  } finally {
    await instance.destroy();
    root.remove();
  }
});

it('maps the visible caret through an external prepend before selectionchange is delivered', async () => {
  const root = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el: root, value: 'First\n\nLast' });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.focus();
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 12)));
      const text = view.dom.querySelector('p')!.lastChild!;
      const range = document.createRange();
      range.setStart(text, 5);
      range.collapse(true);
      vi.spyOn(editorDom, 'editorSelectionRange').mockReturnValue(range);
    });
    instance.setMarkdown('Remote\n\nFirst\n\nLast', { emit: false });
    instance.editor.action((ctx) => {
      const { selection } = ctx.get(editorViewCtx).state;
      expect(selection.$from.parent.textContent).toBe('First');
      expect(selection.$from.parentOffset).toBe(5);
    });
  } finally {
    vi.restoreAllMocks();
    await instance.destroy();
    root.remove();
  }
});
