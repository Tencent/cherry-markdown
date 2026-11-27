import { toggleMark } from '@milkdown/kit/prose/commands';
import type { MarkType } from '@milkdown/kit/prose/model';
import { Plugin, TextSelection, type EditorState } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import { openSelectionLinkEditor } from './link-editor.js';
import { activeElementFor, editorSelectionRange } from './editor-dom.js';
import { syncNativeTextSelection } from './clipboard-selection.js';
import {
  createContextBubble,
  createContextButton,
  createContextFrame,
  placeContextBubble,
  preserveContextSelection,
  watchContextViewport,
} from './contextual-ui.js';

export function supportsTextFormatting(state: EditorState) {
  const { selection, doc } = state;
  if (!(selection instanceof TextSelection) || selection.empty) return false;
  let supported = true;
  doc.nodesBetween(selection.from, selection.to, (node, position) => {
    // Link target metadata is an invisible sibling of its formatted text.
    if (node.type.name === 'cherry_link_target') return false;
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
        { label: '行内代码', text: '<>', style: 'code', names: ['inlineCode'] },
        { label: '高亮', text: '高亮', style: 'highlight', names: ['cherry_highlight'], extra: true },
      ].map((definition) => {
        const { button } = createContextButton(document, {
          label: definition.label,
          text: definition.text,
          contentClassName: `cherry-milkdown-text-bubble__glyph cherry-milkdown-text-bubble__glyph--${definition.style}`,
        });
        if (!definition.extra) bubble.append(button);
        return { ...definition, button };
      });

      const { button: link } = createContextButton(document, { label: '链接', icon: 'ch-icon-link' });
      const { button: more } = createContextButton(document, { label: '更多', text: '…' });
      more.setAttribute('aria-expanded', 'false');
      const extras = document.createElement('div');
      extras.className = 'cherry-milkdown-text-bubble__more';
      extras.setAttribute('role', 'group');
      extras.setAttribute('aria-label', '更多格式');
      extras.hidden = true;
      const highlight = actions.find((action) => action.extra)!.button;
      const { button: clear } = createContextButton(document, { label: '清除格式', text: '清除格式' });
      extras.append(highlight, clear);
      bubble.append(link, more, extras);
      let expandedSelection: { from: number; to: number } | undefined;
      const closeMore = () => {
        extras.hidden = true;
        more.setAttribute('aria-expanded', 'false');
        expandedSelection = undefined;
      };

      const host = view.dom.closest('.cherry-milkdown') ?? document.body;
      host.append(bubble);
      let linkUiOpen = false;
      let dismissedSelection: { from: number; to: number } | undefined;

      const hide = () => {
        bubble.hidden = true;
        closeMore();
      };
      const updateFrame = createContextFrame(() => {
        const { from, to } = view.state.selection;
        if (dismissedSelection?.from === from && dismissedSelection.to === to) return hide();
        dismissedSelection = undefined;
        if (expandedSelection && (expandedSelection.from !== from || expandedSelection.to !== to)) closeMore();
        const controlsFocused = bubble.contains(activeElementFor(view.dom));
        if (linkUiOpen || (!view.hasFocus() && !controlsFocused) || !supportsTextFormatting(view.state)) return hide();
        const range = editorSelectionRange(view.dom);
        if (!range || range.collapsed) return hide();
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) return hide();
        bubble.hidden = false;
        placeContextBubble(bubble, rect, { gap: 10, arrow });
        actions.forEach((action) => {
          const mark = findMark(view.state, action.names);
          const active = Boolean(mark && markIsActive(view.state, mark));
          action.button.classList.toggle('is-active', active);
          action.button.setAttribute('aria-pressed', String(active));
          action.button.disabled = !mark;
        });
      });
      const update = updateFrame.schedule;
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
      const onLink = () => {
        if (!supportsTextFormatting(view.state)) return;
        openSelectionLinkEditor(view);
      };
      const onMore = (event: MouseEvent) => {
        if (!supportsTextFormatting(view.state)) return;
        if (extras.hidden) {
          extras.hidden = false;
          more.setAttribute('aria-expanded', 'true');
          const { from, to } = view.state.selection;
          expandedSelection = { from, to };
          if (event.detail === 0) highlight.focus({ preventScroll: true });
        } else {
          closeMore();
        }
        update();
      };
      const onClear = () => {
        if (!supportsTextFormatting(view.state)) return;
        const { from, to } = view.state.selection;
        const transaction = view.state.tr;
        // Link destinations and their separate target nodes retain meaning.
        for (const mark of Object.values(view.state.schema.marks)) {
          if (mark.name !== 'link') transaction.removeMark(from, to, mark);
        }
        dismissedSelection = { from, to };
        view.dispatch(transaction);
        view.focus();
        hide();
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        if (!extras.hidden) {
          closeMore();
          more.focus({ preventScroll: true });
          update();
        } else {
          dismissedSelection = { from: view.state.selection.from, to: view.state.selection.to };
          hide();
          view.focus();
        }
      };
      const onOutsidePointer = (event: PointerEvent) => {
        if (!event.composedPath().includes(bubble)) hide();
      };
      const onLinkUi = (event: Event) => {
        linkUiOpen = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
        if (linkUiOpen) hide();
        else update();
      };
      const onScroll = () => hide();
      const onPointerDown = (event: PointerEvent) => {
        syncNativeTextSelection(view);
        preserveContextSelection(event);
      };

      bubble.addEventListener('pointerdown', onPointerDown);
      bubble.addEventListener('keydown', onKeyDown);
      link.addEventListener('click', onLink);
      more.addEventListener('click', onMore);
      clear.addEventListener('click', onClear);
      document.addEventListener('pointerdown', onOutsidePointer, true);
      actions.forEach(({ button }) => button.addEventListener('click', onClick));
      view.dom.addEventListener('cherry-milkdown:link-ui-change', onLinkUi);
      const releaseViewport = watchContextViewport(host, onScroll, hide);

      return {
        update,
        destroy: () => {
          updateFrame.cancel();
          bubble.removeEventListener('pointerdown', onPointerDown);
          bubble.removeEventListener('keydown', onKeyDown);
          link.removeEventListener('click', onLink);
          more.removeEventListener('click', onMore);
          clear.removeEventListener('click', onClear);
          document.removeEventListener('pointerdown', onOutsidePointer, true);
          actions.forEach(({ button }) => button.removeEventListener('click', onClick));
          view.dom.removeEventListener('cherry-milkdown:link-ui-change', onLinkUi);
          releaseViewport();
          bubble.remove();
        },
      };
    },
  });
});
