import { toggleMark } from '@milkdown/kit/prose/commands';
import type { MarkType } from '@milkdown/kit/prose/model';
import { Plugin, TextSelection, type EditorState } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import { createContextBubble, createContextButton } from './contextual-ui.js';

export function supportsTextFormatting(state: EditorState) {
  const { selection, doc } = state;
  if (!(selection instanceof TextSelection) || selection.empty) return false;
  let supported = true;
  doc.nodesBetween(selection.from, selection.to, (node, position) => {
    if (
      node.type.spec.code ||
      (!node.isText && (node.isAtom || node.isLeaf)) ||
      (node.type.spec.isolating && position >= selection.from && position + node.nodeSize <= selection.to)
    ) {
      supported = false;
      return false;
    }
    return supported;
  });
  return supported;
}

function findMark(state: EditorState, names: string[]) {
  return names.map((name) => state.schema.marks[name]).find(Boolean);
}

function markIsActive(state: EditorState, mark: MarkType) {
  const { from, to, empty, $from } = state.selection;
  if (empty) return Boolean(mark.isInSet(state.storedMarks ?? $from.marks()));
  let active = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (node.isText && mark.isInSet(node.marks)) active = true;
  });
  return active;
}

/**
 * Milkdown owns selection formatting. The component only reuses Cherry's
 * visual class contract; it never instantiates or forwards to Cherry Bubble.
 */
export const cherryTextBubble = $prose((ctx) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new Plugin({
    view: (view) => {
      if (config.readonly || !config.bubble) return {};
      const document = view.dom.ownerDocument;
      const bubble = createContextBubble(document, 'cherry-milkdown-text-bubble', '文本格式');
      const arrow = document.createElement('span');
      arrow.className = 'cherry-bubble-bottom';
      bubble.append(arrow);

      const actions = [
        { label: '加粗', text: 'B', style: 'bold', names: ['strong'] },
        { label: '斜体', text: 'I', style: 'italic', names: ['emphasis', 'em'] },
        { label: '下划线', text: 'U', style: 'underline', names: ['cherry_underline'] },
        { label: '删除线', text: 'S', style: 'strike', names: ['strike_through', 'strike'] },
      ].map((definition) => {
        const { button } = createContextButton(document, {
          label: definition.label,
          text: definition.text,
          contentClassName: `cherry-milkdown-text-bubble__glyph cherry-milkdown-text-bubble__glyph--${definition.style}`,
        });
        bubble.append(button);
        return { ...definition, button };
      });

      const host = view.dom.closest('.cherry-milkdown') ?? document.body;
      host.append(bubble);
      let linkUiOpen = false;
      let dismissedSelection: { from: number; to: number } | undefined;
      let frame = 0;

      const hide = () => {
        bubble.hidden = true;
      };
      const update = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const { from, to } = view.state.selection;
          if (dismissedSelection?.from === from && dismissedSelection.to === to) return hide();
          dismissedSelection = undefined;
          if (linkUiOpen || !view.hasFocus() || !supportsTextFormatting(view.state)) return hide();
          const selection = document.getSelection();
          if (
            !selection ||
            selection.isCollapsed ||
            !selection.anchorNode ||
            !selection.focusNode ||
            !view.dom.contains(selection.anchorNode) ||
            !view.dom.contains(selection.focusNode)
          ) {
            return hide();
          }
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (!rect.width && !rect.height) return hide();
          bubble.hidden = false;
          const width = bubble.offsetWidth;
          const height = bubble.offsetHeight;
          const viewportWidth = document.documentElement.clientWidth;
          const above = rect.top - height - 10 >= 8;
          bubble.classList.toggle('is-below', !above);
          arrow.className = above ? 'cherry-bubble-bottom' : 'cherry-bubble-top';
          bubble.style.left = `${Math.max(8, Math.min(viewportWidth - width - 8, rect.left + rect.width / 2 - width / 2))}px`;
          bubble.style.top = `${above ? rect.top - height - 10 : rect.bottom + 10}px`;
          actions.forEach((action) => {
            const mark = findMark(view.state, action.names);
            const active = Boolean(mark && markIsActive(view.state, mark));
            action.button.classList.toggle('is-active', active);
            action.button.setAttribute('aria-pressed', String(active));
            action.button.disabled = !mark;
          });
        });
      };
      const preserveSelection = (event: PointerEvent) => event.preventDefault();
      const onClick = (event: MouseEvent) => {
        const action = actions.find(({ button }) => button === event.currentTarget);
        if (!action || !supportsTextFormatting(view.state)) return;
        const mark = findMark(view.state, action.names);
        if (!mark) return;
        event.preventDefault();
        dismissedSelection = { from: view.state.selection.from, to: view.state.selection.to };
        toggleMark(mark)(view.state, view.dispatch);
        view.focus();
        // Applying a command completes this contextual interaction. Closing
        // the Bubble avoids covering the next editor target while keeping the
        // ProseMirror selection available for undo or another fresh gesture.
        hide();
      };
      const onLinkUi = (event: Event) => {
        linkUiOpen = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
        if (linkUiOpen) hide();
        else update();
      };
      const onScroll = () => hide();

      bubble.addEventListener('pointerdown', preserveSelection);
      actions.forEach(({ button }) => button.addEventListener('click', onClick));
      view.dom.addEventListener('cherry-milkdown:link-ui-change', onLinkUi);
      document.defaultView?.addEventListener('scroll', onScroll, true);
      document.defaultView?.addEventListener('resize', hide);

      return {
        update,
        destroy: () => {
          cancelAnimationFrame(frame);
          bubble.removeEventListener('pointerdown', preserveSelection);
          actions.forEach(({ button }) => button.removeEventListener('click', onClick));
          view.dom.removeEventListener('cherry-milkdown:link-ui-change', onLinkUi);
          document.defaultView?.removeEventListener('scroll', onScroll, true);
          document.defaultView?.removeEventListener('resize', hide);
          bubble.remove();
        },
      };
    },
  });
});
