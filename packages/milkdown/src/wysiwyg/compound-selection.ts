import { Plugin, TextSelection } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';

/** Commit a native compound-block drag selection before delayed view sync. */
export const cherryCompoundSelection = $prose(
  () =>
    new Plugin({
      view: (view) => {
        const onPointerUp = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse' || event.button !== 0) return;
          const selection = view.dom.ownerDocument.getSelection();
          const anchor = selection?.anchorNode;
          const head = selection?.focusNode;
          if (!selection || selection.isCollapsed || !anchor || !head) return;
          const container = (node: Node) =>
            (node instanceof Element ? node : node.parentElement)?.closest('.cherry-compound__content');
          const scope = container(anchor);
          if (!scope || scope !== container(head) || !view.dom.contains(scope)) return;
          if ((anchor.parentElement ?? scope).closest('[contenteditable="false"]')) return;
          if ((head.parentElement ?? scope).closest('[contenteditable="false"]')) return;
          let next: TextSelection;
          try {
            const anchorPos = view.posAtDOM(anchor, selection.anchorOffset);
            const headPos = view.posAtDOM(head, selection.focusOffset);
            const $anchor = view.state.doc.resolve(anchorPos);
            const $head = view.state.doc.resolve(headPos);
            if (!$anchor.parent.inlineContent || !$head.parent.inlineContent) return;
            next = TextSelection.create(view.state.doc, anchorPos, headPos);
          } catch {
            // Detached or non-editable DOM is not a ProseMirror text range.
            return;
          }
          if (!next.eq(view.state.selection)) view.dispatch(view.state.tr.setSelection(next).setMeta('pointer', true));
        };
        view.dom.addEventListener('pointerup', onPointerUp, true);
        return { destroy: () => view.dom.removeEventListener('pointerup', onPointerUp, true) };
      },
    }),
);
