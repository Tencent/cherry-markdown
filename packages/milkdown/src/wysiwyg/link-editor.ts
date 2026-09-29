import type { Mark, Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin, TextSelection } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { sanitizeLinkHref } from '@milkdown/kit/preset/commonmark';
import { $prose } from '@milkdown/kit/utils';
import { cherryWysiwygConfigCtx } from './config.js';
import { createContextBubble, createContextButton } from './contextual-ui.js';

interface LinkRange {
  from: number;
  to: number;
  mark?: Mark;
  anchor?: HTMLAnchorElement;
}

function linkTargetAfter(doc: ProseNode, position: number) {
  const node = doc.nodeAt(position);
  return node?.type.name === 'cherry_link_target' ? { node, position } : undefined;
}

function sameLinkMark(left: Mark, right: Mark) {
  if (left.type !== right.type) return false;
  const keys = new Set([...Object.keys(left.attrs), ...Object.keys(right.attrs)]);
  return [...keys].every((key) => left.attrs[key] === right.attrs[key]);
}

function linkAtRange(view: EditorView, from: number, to = from): LinkRange | undefined {
  const linkType = view.state.schema.marks.link;
  if (!linkType) return undefined;
  let result: LinkRange | undefined;
  const start = Math.max(0, from - (from === to ? 1 : 0));
  const end = Math.min(view.state.doc.content.size, Math.max(to, from + 1));
  view.state.doc.nodesBetween(start, end, (node, position) => {
    if (result || !node.isText) return;
    const mark = linkType.isInSet(node.marks);
    if (!mark) return;
    let rangeFrom = position;
    let rangeTo = position + node.nodeSize;
    const resolved = view.state.doc.resolve(position);
    const parentStart = position - resolved.parentOffset;
    resolved.parent.forEach((sibling, offset) => {
      const siblingMark = sibling.isText ? linkType.isInSet(sibling.marks) : undefined;
      if (!siblingMark || !sameLinkMark(mark, siblingMark)) return;
      const siblingFrom = parentStart + offset;
      const siblingTo = siblingFrom + sibling.nodeSize;
      if (siblingTo >= rangeFrom && siblingFrom <= rangeTo) {
        rangeFrom = Math.min(rangeFrom, siblingFrom);
        rangeTo = Math.max(rangeTo, siblingTo);
      }
    });
    result = { from: rangeFrom, to: rangeTo, mark };
  });
  return result;
}

function sharedNonLinkMarks(doc: ProseNode, from: number, to: number) {
  let shared: readonly Mark[] | undefined;
  doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return;
    const marks = node.marks.filter((mark) => mark.type.name !== 'link');
    shared = shared === undefined ? marks : shared.filter((mark) => mark.isInSet(marks));
  });
  return [...(shared ?? [])];
}

function lastClientRect(element: Element) {
  const rects = element.getClientRects();
  return rects.length ? rects[rects.length - 1] : element.getBoundingClientRect();
}

/**
 * Link text remains normal editable document content. Placing a caret in a
 * link opens one shared inspector outside ProseMirror's DOM, so exposing the
 * hidden href never changes wrapping, clipboard content or Markdown.
 */
export const cherryLinkEditor = $prose((ctx) => {
  const config = ctx.get(cherryWysiwygConfigCtx.key);
  return new Plugin({
    props: {
      handleKeyDown: (view, event) => {
        if (config.readonly) return false;
        if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return false;
        const { from, to } = view.state.selection;
        const range = linkAtRange(view, from, to) ?? (from !== to ? { from, to } : undefined);
        if (!range) return false;
        event.preventDefault();
        view.dom.dispatchEvent(new CustomEvent('cherry-milkdown:edit-link', { bubbles: true, detail: range }));
        return true;
      },
    },
    view: (view) => {
      if (config.readonly) return {};
      const document = view.dom.ownerDocument;
      const inspector = createContextBubble(document, 'cherry-milkdown-link-bubble', '链接');

      const iconButton = (label: string, icon: string) => {
        return createContextButton(document, { label, icon }).button;
      };
      const copy = iconButton('复制链接', 'ch-icon-copy');
      const copyIcon = copy.querySelector<HTMLElement>('.ch-icon');
      const hrefPreview = document.createElement('a');
      hrefPreview.className = 'cherry-milkdown-link-bubble__href';
      hrefPreview.target = '_blank';
      hrefPreview.rel = 'noopener noreferrer';
      const edit = iconButton('编辑链接', 'ch-icon-edit');
      edit.setAttribute('aria-haspopup', 'dialog');
      const unlink = document.createElement('button');
      unlink.type = 'button';
      unlink.className = 'cherry-toolbar-button cherry-milkdown-link-editor__unlink';
      unlink.textContent = '取消链接';
      unlink.title = '取消链接';
      unlink.setAttribute('aria-label', '取消链接');
      const arrow = document.createElement('span');
      arrow.className = 'cherry-bubble-bottom';
      // Keep destructive link actions in the editor panel. The compact
      // inspector remains read-only (URL/copy/edit), matching Cherry's
      // native link Bubble interaction and avoiding accidental unlinking.
      inspector.append(arrow, hrefPreview, copy, edit);

      const form = document.createElement('form');
      form.className = 'cherry-milkdown-context-form cherry-milkdown-link-editor';
      form.hidden = true;
      form.setAttribute('role', 'dialog');
      form.setAttribute('aria-label', '编辑链接');

      const textLabel = document.createElement('label');
      textLabel.textContent = '显示文本';
      const textInput = document.createElement('input');
      textInput.className = 'cherry-milkdown-context-form__input';
      textInput.name = 'text';
      textInput.required = true;
      textInput.setAttribute('aria-label', '链接显示文本');
      textLabel.append(textInput);

      const hrefLabel = document.createElement('label');
      hrefLabel.textContent = '链接地址';
      const hrefInput = document.createElement('input');
      hrefInput.className = 'cherry-milkdown-context-form__input';
      hrefInput.name = 'href';
      hrefInput.type = 'text';
      hrefInput.inputMode = 'url';
      hrefInput.required = true;
      hrefInput.spellcheck = false;
      hrefInput.setAttribute('aria-label', '链接地址');
      hrefLabel.append(hrefInput);

      const error = document.createElement('div');
      error.className = 'cherry-milkdown-link-editor__error';
      error.hidden = true;
      // This is a form validation status, not a renderer failure. Keeping it
      // out of role=alert prevents Cherry's renderer-error gates from treating
      // the hidden link form as a document rendering error.
      error.setAttribute('role', 'status');
      error.setAttribute('aria-live', 'polite');
      error.id = 'cherry-milkdown-link-editor-error';
      hrefInput.setAttribute('aria-describedby', error.id);

      const targetLabel = document.createElement('label');
      targetLabel.textContent = '打开方式';
      const targetSelect = document.createElement('select');
      targetSelect.className = 'cherry-milkdown-context-form__input';
      targetSelect.name = 'target';
      targetSelect.setAttribute('aria-label', '链接打开方式');
      [
        ['', '跟随配置'],
        ['self', '当前页面'],
        ['_blank', '新窗口'],
      ].forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        targetSelect.append(option);
      });
      targetLabel.append(targetSelect);

      const actions = document.createElement('div');
      actions.className = 'cherry-milkdown-link-editor__actions';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'cherry-toolbar-button';
      cancel.textContent = '取消';
      const confirm = document.createElement('button');
      confirm.type = 'submit';
      confirm.className = 'cherry-toolbar-button is-primary';
      confirm.textContent = '保存';
      actions.append(unlink, cancel, confirm);
      form.append(textLabel, hrefLabel, targetLabel, error, actions);

      // These are UI overlays owned by this plugin, not editor content. Keep
      // them below Cherry's root so theme variables continue to cascade.
      const overlayHost = view.dom.closest('.cherry-milkdown') ?? document.body;
      overlayHost.append(inspector, form);

      let active: LinkRange | undefined;
      let editorOpen = false;
      let uiVisible = false;
      let unlinkPending = false;
      let copyFeedbackTimer: number | undefined;

      const notifyUi = (open: boolean) => {
        view.dom.dispatchEvent(new CustomEvent('cherry-milkdown:link-ui-change', { bubbles: true, detail: { open } }));
      };
      const rangeFromAnchor = (anchor: HTMLAnchorElement) => {
        try {
          const from = view.posAtDOM(anchor, 0);
          const to = view.posAtDOM(anchor, anchor.childNodes.length);
          const range = linkAtRange(view, from, to);
          return range ? { ...range, anchor } : undefined;
        } catch {
          // The mark DOM can be replaced between pointer movement and lookup.
          return undefined;
        }
      };
      const anchorForRange = (range: LinkRange) => {
        if (range.anchor?.isConnected) return range.anchor;
        return [...view.dom.querySelectorAll<HTMLAnchorElement>('a[href]')].find((anchor) => {
          const candidate = rangeFromAnchor(anchor);
          return candidate?.from === range.from && candidate.to === range.to;
        });
      };
      const placeInspector = () => {
        const current = active;
        const anchor = current && anchorForRange(current);
        if (!anchor) {
          inspector.hidden = true;
          return;
        }
        active = { ...current, anchor };
        inspector.hidden = false;
        const rect = lastClientRect(anchor);
        const width = inspector.offsetWidth;
        const height = inspector.offsetHeight;
        const gap = 8;
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const left = Math.max(8, Math.min(viewportWidth - width - 8, rect.left + rect.width / 2 - width / 2));
        const above = rect.top - height - gap >= 8;
        const top = above ? rect.top - height - gap : Math.min(viewportHeight - height - 8, rect.bottom + gap);
        inspector.classList.toggle('is-below', !above);
        arrow.className = above ? 'cherry-bubble-bottom' : 'cherry-bubble-top';
        inspector.style.left = `${left}px`;
        inspector.style.top = `${top}px`;
      };
      const placeForm = () => {
        const anchor = active && anchorForRange(active);
        const rect = anchor ? lastClientRect(anchor) : inspector.getBoundingClientRect();
        const width = Math.min(360, document.documentElement.clientWidth - 16);
        const left = Math.max(8, Math.min(rect.left, document.documentElement.clientWidth - width - 8));
        const below = rect.bottom + 8;
        const top =
          below + form.offsetHeight <= document.documentElement.clientHeight - 8
            ? below
            : Math.max(8, rect.top - form.offsetHeight - 8);
        form.style.width = `${width}px`;
        form.style.left = `${left}px`;
        form.style.top = `${top}px`;
      };
      const setUiVisible = (visible: boolean) => {
        if (uiVisible === visible) return;
        uiVisible = visible;
        notifyUi(visible);
      };
      const setUnlinkPending = (pending: boolean) => {
        unlinkPending = pending;
        unlink.textContent = pending ? '保留链接' : '取消链接';
        unlink.title = pending ? '保留链接' : '取消链接';
        unlink.setAttribute('aria-label', pending ? '保留链接' : '取消链接');
        confirm.textContent = pending ? '确认取消链接' : '保存';
        confirm.classList.toggle('is-danger', pending);
        textInput.disabled = pending;
        hrefInput.disabled = pending;
        targetSelect.disabled = pending;
      };
      const hideInspector = () => {
        if (editorOpen) return;
        active = undefined;
        inspector.hidden = true;
      };
      const close = ({ restoreFocus = false } = {}) => {
        if (!editorOpen) return;
        const previous = active;
        editorOpen = false;
        form.hidden = true;
        setUnlinkPending(false);
        error.hidden = true;
        error.textContent = '';
        edit.setAttribute('aria-expanded', 'false');
        inspector.hidden = true;
        setUiVisible(false);
        active = undefined;
        if (restoreFocus) {
          if (previous) {
            const caret = Math.min(previous.to, previous.from + 1);
            view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, caret)));
          }
          view.focus();
          requestAnimationFrame(showForSelection);
        }
      };
      const open = (range: LinkRange) => {
        active = { ...range, anchor: range.anchor ?? anchorForRange(range) };
        setUnlinkPending(false);
        textInput.value = view.state.doc.textBetween(range.from, range.to, '', '');
        hrefInput.value = String(range.mark?.attrs.href ?? range.anchor?.getAttribute('href') ?? '');
        const currentTarget = String(linkTargetAfter(view.state.doc, range.to)?.node.attrs.target ?? '');
        const knownTarget = [...targetSelect.options].some((option) => option.value === currentTarget);
        targetSelect.querySelector('option[data-preserved-target]')?.remove();
        if (currentTarget && !knownTarget) {
          const option = document.createElement('option');
          option.value = currentTarget;
          option.textContent = `保留原设置 (${currentTarget})`;
          option.dataset.preservedTarget = '';
          targetSelect.append(option);
        }
        targetSelect.value = currentTarget;
        error.hidden = true;
        error.textContent = '';
        editorOpen = true;
        edit.setAttribute('aria-expanded', 'true');
        form.hidden = false;
        inspector.hidden = true;
        placeForm();
        setUiVisible(true);
        requestAnimationFrame(() => hrefInput.focus({ preventScroll: true }));
      };
      const showForSelection = () => {
        if (editorOpen) return;
        const { from, to } = view.state.selection;
        const domSelection = document.getSelection();
        const hasDocumentRange = Boolean(
          domSelection &&
          !domSelection.isCollapsed &&
          domSelection.anchorNode &&
          domSelection.focusNode &&
          view.dom.contains(domSelection.anchorNode) &&
          view.dom.contains(domSelection.focusNode),
        );
        // A range selection belongs to Milkdown's text-formatting Bubble.
        // Link inspection only owns a collapsed caret inside the link;
        // Cmd/Ctrl+K remains the explicit editing path for selected text.
        if (from !== to || hasDocumentRange) return hideInspector();
        const range = linkAtRange(view, from, to);
        if (!range) return hideInspector();
        active = range;
        const href = String(range.mark?.attrs.href ?? range.anchor?.getAttribute('href') ?? '');
        hrefPreview.href = href;
        hrefPreview.textContent = href;
        inspector.hidden = false;
        requestAnimationFrame(placeInspector);
      };
      const preserveSelection = (event: PointerEvent) => {
        // Moving focus to the overlay must not collapse the document selection.
        event.preventDefault();
        event.stopPropagation();
      };
      const onEdit = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!active) return;
        open(active);
      };
      const onEditRequest = (event: Event) => {
        const range = (event as CustomEvent<LinkRange>).detail;
        if (range) open(range);
      };
      const onOutsidePointer = (event: PointerEvent) => {
        if (!(event.target instanceof Node) || form.contains(event.target) || inspector.contains(event.target)) return;
        if (editorOpen) close();
        queueMicrotask(() => {
          if (!view.hasFocus()) {
            active = undefined;
            inspector.hidden = true;
          }
        });
      };
      const copyLink = async () => {
        const href = String(active?.mark?.attrs.href ?? active?.anchor?.getAttribute('href') ?? '');
        if (!href) return;
        const setCopyFeedback = (state: 'success' | 'error' | 'idle') => {
          copy.classList.toggle('is-success', state === 'success');
          copy.classList.toggle('is-error', state === 'error');
          copyIcon?.classList.toggle('ch-icon-copy', state === 'idle');
          copyIcon?.classList.toggle('ch-icon-ok', state === 'success');
          copyIcon?.classList.toggle('ch-icon-warning', state === 'error');
          const label = state === 'success' ? '已复制' : state === 'error' ? '复制失败' : '复制链接';
          copy.title = label;
          copy.setAttribute('aria-label', label);
        };
        if (copyFeedbackTimer !== undefined) window.clearTimeout(copyFeedbackTimer);
        try {
          const clipboard = document.defaultView?.navigator.clipboard;
          if (!clipboard) throw new Error('Clipboard API is unavailable');
          await clipboard.writeText(href);
          setCopyFeedback('success');
        } catch {
          setCopyFeedback('error');
        }
        copyFeedbackTimer = window.setTimeout(() => {
          setCopyFeedback('idle');
          copyFeedbackTimer = undefined;
        }, 1200);
      };
      const onSubmit = (event: SubmitEvent) => {
        event.preventDefault();
        if (!active) return;
        if (unlinkPending) {
          removeLink();
          return;
        }
        const href = sanitizeLinkHref(hrefInput.value.trim());
        const text = textInput.value.trim();
        if (!href || !text) {
          error.textContent = !href ? '请输入有效的链接地址。' : '链接显示文本不能为空。';
          error.hidden = false;
          (href ? textInput : hrefInput).focus({ preventScroll: true });
          return;
        }
        const linkType = view.state.schema.marks.link;
        if (!linkType) return;
        const existingTarget = linkTargetAfter(view.state.doc, active.to);
        const desiredTarget = targetSelect.value;
        const attrs = { ...(active.mark?.attrs ?? {}), href };
        const link = linkType.create(attrs);
        let transaction = view.state.tr;
        const previousText = view.state.doc.textBetween(active.from, active.to, '', '');
        if (text !== previousText) {
          const marks = [...sharedNonLinkMarks(view.state.doc, active.from, active.to), link];
          transaction = transaction.replaceWith(active.from, active.to, view.state.schema.text(text, marks));
          transaction = transaction.setSelection(TextSelection.create(transaction.doc, active.from + text.length));
        } else {
          if (active.mark) transaction = transaction.removeMark(active.from, active.to, active.mark);
          transaction = transaction.addMark(active.from, active.to, link);
          transaction = transaction.setSelection(TextSelection.create(transaction.doc, active.to));
        }
        const mappedTargetPosition = transaction.mapping.map(active.to, 1);
        if (existingTarget) {
          const mappedTarget = transaction.doc.nodeAt(mappedTargetPosition);
          if (mappedTarget?.type.name === 'cherry_link_target') {
            if (desiredTarget) {
              transaction = transaction.setNodeMarkup(mappedTargetPosition, undefined, {
                ...mappedTarget.attrs,
                source: `{target=${desiredTarget}}`,
                target: desiredTarget,
              });
            } else {
              transaction = transaction.delete(mappedTargetPosition, mappedTargetPosition + mappedTarget.nodeSize);
            }
          }
        } else if (desiredTarget) {
          const targetType = view.state.schema.nodes.cherry_link_target;
          if (targetType) {
            transaction = transaction.insert(
              mappedTargetPosition,
              targetType.create({ source: `{target=${desiredTarget}}`, target: desiredTarget }),
            );
          }
        }
        close();
        view.dispatch(transaction.scrollIntoView());
        view.focus();
      };
      const removeLink = () => {
        if (!active?.mark) return close({ restoreFocus: true });
        const transaction = view.state.tr.removeMark(active.from, active.to, active.mark);
        close();
        view.dispatch(transaction);
        view.focus();
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        close({ restoreFocus: true });
      };
      const onCancel = () => close({ restoreFocus: true });
      const onUnlink = () => {
        setUnlinkPending(!unlinkPending);
        confirm.focus({ preventScroll: true });
      };
      const hideForViewportChange = () => {
        if (editorOpen) close();
        active = undefined;
        inspector.hidden = true;
      };

      view.dom.addEventListener('cherry-milkdown:edit-link', onEditRequest);
      inspector.addEventListener('pointerdown', preserveSelection);
      const onCopy = () => {
        void copyLink();
      };
      copy.addEventListener('click', onCopy);
      edit.addEventListener('click', onEdit);
      unlink.addEventListener('click', onUnlink);
      document.addEventListener('pointerdown', onOutsidePointer, true);
      document.defaultView?.addEventListener('scroll', hideForViewportChange, true);
      document.defaultView?.addEventListener('resize', hideForViewportChange);
      form.addEventListener('submit', onSubmit);
      textInput.addEventListener('input', () => {
        error.hidden = true;
        error.textContent = '';
      });
      hrefInput.addEventListener('input', () => {
        error.hidden = true;
        error.textContent = '';
      });
      form.addEventListener('keydown', onKeyDown);
      cancel.addEventListener('click', onCancel);

      return {
        update: (_view, previousState) => {
          if (active && !previousState.doc.eq(view.state.doc)) close();
          showForSelection();
        },
        destroy: () => {
          if (uiVisible) notifyUi(false);
          view.dom.removeEventListener('cherry-milkdown:edit-link', onEditRequest);
          inspector.removeEventListener('pointerdown', preserveSelection);
          copy.removeEventListener('click', onCopy);
          edit.removeEventListener('click', onEdit);
          unlink.removeEventListener('click', onUnlink);
          if (copyFeedbackTimer !== undefined) window.clearTimeout(copyFeedbackTimer);
          document.removeEventListener('pointerdown', onOutsidePointer, true);
          document.defaultView?.removeEventListener('scroll', hideForViewportChange, true);
          document.defaultView?.removeEventListener('resize', hideForViewportChange);
          form.removeEventListener('submit', onSubmit);
          form.removeEventListener('keydown', onKeyDown);
          cancel.removeEventListener('click', onCancel);
          inspector.remove();
          form.remove();
        },
      };
    },
  });
});
