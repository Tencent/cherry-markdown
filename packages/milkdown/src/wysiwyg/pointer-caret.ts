import { Plugin, TextSelection } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';

const navigationKeys = new Set([
  'Home',
  'End',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
]);

/** Keep text selection in sync when a blurred view refocuses and the user navigates. */
export const cherryPointerCaret = $prose(
  () =>
    new Plugin({
      view: (view) => {
        let refocusing: { id: number; x: number; y: number } | undefined;
        const onPointerDown = (event: PointerEvent) => {
          refocusing =
            view.editable && event.pointerType === 'mouse' && event.button === 0 && !view.hasFocus()
              ? { id: event.pointerId, x: event.clientX, y: event.clientY }
              : undefined;
        };
        const onPointerUp = (event: PointerEvent) => {
          const shouldSync =
            refocusing &&
            event.pointerType === 'mouse' &&
            event.button === 0 &&
            event.pointerId === refocusing.id &&
            Math.abs(event.clientX - refocusing.x) <= 4 &&
            Math.abs(event.clientY - refocusing.y) <= 4;
          refocusing = undefined;
          if (!shouldSync || !view.editable || !(event.target instanceof Element)) return;
          const selector = 'p,h1,h2,h3,h4,h5,h6';
          const clicked = event.target.closest(selector);
          if (!clicked || !view.dom.contains(clicked) || event.target.closest('[contenteditable]') !== view.dom) return;
          let next: TextSelection;
          try {
            const hit = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!hit) return;
            const pos = hit.pos;
            const resolved = view.state.doc.resolve(pos);
            if (!resolved.parent.inlineContent || resolved.depth < 1) return;
            const dom = view.nodeDOM(resolved.before());
            if (!dom) return;
            if (dom !== clicked && !clicked.contains(dom)) return;
            next = TextSelection.create(view.state.doc, pos);
          } catch {
            return;
          }
          if (!next.eq(view.state.selection)) view.dispatch(view.state.tr.setSelection(next).setMeta('pointer', true));
        };
        const onPointerCancel = () => {
          refocusing = undefined;
        };
        const onKeyUp = (event: KeyboardEvent) => {
          if (
            !(view.state.selection instanceof TextSelection) ||
            view.composing ||
            event.isComposing ||
            !view.editable ||
            !view.hasFocus() ||
            !navigationKeys.has(event.key)
          )
            return;
          const selection = view.dom.ownerDocument.getSelection();
          if (
            !selection?.anchorNode ||
            !selection.focusNode ||
            !view.dom.contains(selection.anchorNode) ||
            !view.dom.contains(selection.focusNode)
          )
            return;
          let next: ReturnType<typeof TextSelection.between>;
          try {
            const anchor = view.state.doc.resolve(view.posAtDOM(selection.anchorNode, selection.anchorOffset));
            const head = view.state.doc.resolve(view.posAtDOM(selection.focusNode, selection.focusOffset));
            if (!anchor.parent.inlineContent || !head.parent.inlineContent) return;
            next = TextSelection.between(anchor, head);
          } catch {
            // A detached or non-editable DOM selection cannot be mapped safely.
            return;
          }
          // Commit the browser's latest keyboard position before the delayed
          // focus sync can restore an older editor selection.
          if (!next.eq(view.state.selection))
            view.dispatch(view.state.tr.setSelection(next).setMeta('addToHistory', false));
        };
        view.dom.addEventListener('pointerdown', onPointerDown, true);
        view.dom.addEventListener('pointerup', onPointerUp, true);
        view.dom.addEventListener('pointercancel', onPointerCancel, true);
        view.dom.addEventListener('keyup', onKeyUp, true);
        return {
          destroy: () => {
            view.dom.removeEventListener('pointerdown', onPointerDown, true);
            view.dom.removeEventListener('pointerup', onPointerUp, true);
            view.dom.removeEventListener('pointercancel', onPointerCancel, true);
            view.dom.removeEventListener('keyup', onKeyUp, true);
          },
        };
      },
    }),
);
