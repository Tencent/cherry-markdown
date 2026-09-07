import { toggleMark } from '@milkdown/kit/prose/commands';
import { Plugin, TextSelection, type EditorState } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';

const commands = [
  ['strong', '粗体', 'B'],
  ['emphasis', '斜体', 'I'],
  ['cherry_underline', '下划线', 'U'],
  ['strike_through', '删除线', 'S'],
  ['cherry_subscript', '下标', 'x₂'],
  ['cherry_superscript', '上标', 'x²'],
] as const;

/** Shared by visibility and execution: never format a NodeView's source DOM. */
export function supportsTextFormatting(state: EditorState): boolean {
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

export function selectionBubble(root: HTMLElement) {
  return $prose(
    () =>
      new Plugin({
        view(view) {
          const bubble = document.createElement('div');
          bubble.className = 'cherry-milkdown-bubble';
          bubble.setAttribute('role', 'toolbar');
          bubble.setAttribute('aria-label', '文本格式');
          bubble.hidden = true;
          const buttons = commands.map(([name, label, text]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = text;
            button.setAttribute('aria-label', label);
            button.addEventListener('pointerdown', (event) => event.preventDefault());
            button.addEventListener('click', () => {
              const mark = view.state.schema.marks[name];
              if (!mark || !supportsTextFormatting(view.state) || !view.editable) return;
              toggleMark(mark)(view.state, view.dispatch);
              view.focus();
              refresh();
            });
            bubble.append(button);
            return { button, name };
          });
          root.append(bubble);
          let disposed = false;
          const hide = () => {
            bubble.hidden = true;
          };
          const refresh = () => {
            if (disposed) return;
            const domSelection = root.ownerDocument.getSelection();
            if (
              !view.editable ||
              !supportsTextFormatting(view.state) ||
              !domSelection?.rangeCount ||
              !view.dom.contains(domSelection.anchorNode) ||
              !view.dom.contains(domSelection.focusNode) ||
              (!view.hasFocus() && !bubble.contains(root.ownerDocument.activeElement)) ||
              (root.ownerDocument.activeElement instanceof Element &&
                root.ownerDocument.activeElement.closest('[contenteditable="false"],.cherry-embed__source,math-field'))
            ) {
              hide();
              return;
            }
            const { from, to } = view.state.selection;
            for (const { button, name } of buttons) {
              const mark = view.state.schema.marks[name];
              button.disabled = !mark || !toggleMark(mark)(view.state);
              button.setAttribute('aria-pressed', String(Boolean(mark && view.state.doc.rangeHasMark(from, to, mark))));
            }
            const rect = domSelection.getRangeAt(0).getBoundingClientRect();
            bubble.hidden = false;
            const bounds = bubble.getBoundingClientRect();
            bubble.style.left = `${Math.max(8, Math.min(innerWidth - bounds.width - 8, (rect.left + rect.right - bounds.width) / 2))}px`;
            bubble.style.top = `${Math.max(8, rect.top >= bounds.height + 8 ? rect.top - bounds.height - 8 : rect.bottom + 8)}px`;
          };
          root.ownerDocument.addEventListener('selectionchange', refresh);
          root.addEventListener('focusout', hide);
          window.addEventListener('scroll', hide, true);
          window.addEventListener('resize', hide);
          return {
            update() {
              queueMicrotask(refresh);
            },
            destroy() {
              disposed = true;
              root.ownerDocument.removeEventListener('selectionchange', refresh);
              root.removeEventListener('focusout', hide);
              window.removeEventListener('scroll', hide, true);
              window.removeEventListener('resize', hide);
              bubble.remove();
            },
          };
        },
      }),
  );
}
