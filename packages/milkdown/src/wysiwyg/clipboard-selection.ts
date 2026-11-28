import { Plugin, TextSelection } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import { activeElementFor, editorSelectionRange } from './editor-dom.js';

export function syncNativeTextSelection(view: EditorView) {
  // Chrome can deliver copy/cut before its pending selectionchange event.
  // Let the normal clipboard serializer use the current visible text range.
  // Owned source editors and node/cell selections retain their own handling.
  if (view.composing || activeElementFor(view.dom) !== view.dom || !(view.state.selection instanceof TextSelection))
    return false;
  const range = editorSelectionRange(view.dom);
  if (!range) return false;
  const from = view.posAtDOM(range.startContainer, range.startOffset);
  const to = view.posAtDOM(range.endContainer, range.endOffset);
  const backward = view.dom.ownerDocument.getSelection()?.direction === 'backward';
  const selection = TextSelection.create(view.state.doc, backward ? to : from, backward ? from : to);
  if (!selection.eq(view.state.selection)) view.dispatch(view.state.tr.setSelection(selection));
  return false;
}

export const cherryClipboardSelection = $prose(
  () => new Plugin({ props: { handleDOMEvents: { copy: syncNativeTextSelection, cut: syncNativeTextSelection } } }),
);
