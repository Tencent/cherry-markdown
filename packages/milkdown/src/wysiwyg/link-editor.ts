import type { Mark, Node as ProseNode } from '@milkdown/kit/prose/model';
import { Plugin, TextSelection } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { sanitizeLinkHref } from '@milkdown/kit/preset/commonmark';
import { $prose } from '@milkdown/kit/utils';

interface LinkRange {
  from: number;
  to: number;
  mark?: Mark;
  anchor?: HTMLAnchorElement;
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
      if (!sibling.isText || !linkType.isInSet(sibling.marks)) return;
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

function hasVisibleFollowingContent(anchor: HTMLAnchorElement) {
  let sibling = anchor.nextSibling;
  while (sibling) {
    if (sibling instanceof Text && sibling.data.trim()) return true;
    if (sibling instanceof Element) {
      if (!sibling.matches('.cherry-link-target, .ProseMirror-separator, br')) {
        if (sibling.textContent?.trim()) return true;
        const rect = sibling.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return true;
      }
    }
    sibling = sibling.nextSibling;
  }
  return false;
}

/**
 * Link text remains normal editable document content. The hidden href is
 * exposed through one shared, floating affordance positioned near the end
 * of the active link. Neither the trigger nor inspector enters ProseMirror's
 * DOM, so they do not alter wrapping, selection, clipboard content or Markdown.
 */
export const cherryLinkEditor = $prose(
  () =>
    new Plugin({
      props: {
        handleKeyDown: (view, event) => {
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
        const document = view.dom.ownerDocument;
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cherry-milkdown-link-trigger';
        trigger.hidden = true;
        trigger.title = '编辑链接';
        trigger.setAttribute('aria-label', '编辑链接');
        trigger.setAttribute('aria-haspopup', 'dialog');
        const triggerIcon = document.createElement('span');
        triggerIcon.className = 'ch-icon ch-icon-link';
        triggerIcon.setAttribute('aria-hidden', 'true');
        trigger.append(triggerIcon);

        const form = document.createElement('form');
        form.className = 'cherry-milkdown-link-editor';
        form.hidden = true;
        form.setAttribute('role', 'dialog');
        form.setAttribute('aria-label', '编辑链接');

        const textLabel = document.createElement('label');
        textLabel.textContent = '显示文本';
        const textInput = document.createElement('input');
        textInput.name = 'text';
        textInput.required = true;
        textInput.setAttribute('aria-label', '链接显示文本');
        textLabel.append(textInput);

        const hrefLabel = document.createElement('label');
        hrefLabel.textContent = '链接地址';
        const hrefInput = document.createElement('input');
        hrefInput.name = 'href';
        hrefInput.type = 'text';
        hrefInput.inputMode = 'url';
        hrefInput.required = true;
        hrefInput.spellcheck = false;
        hrefInput.setAttribute('aria-label', '链接地址');
        hrefLabel.append(hrefInput);

        const actions = document.createElement('div');
        actions.className = 'cherry-milkdown-link-editor__actions';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '取消链接';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.textContent = '取消';
        const confirm = document.createElement('button');
        confirm.type = 'submit';
        confirm.textContent = '保存';
        actions.append(remove, cancel, confirm);
        form.append(textLabel, hrefLabel, actions);

        // These are UI overlays owned by this plugin, not editor content. Keep
        // them below Cherry's root so theme variables continue to cascade.
        const overlayHost = view.dom.closest('.cherry') ?? document.body;
        overlayHost.append(trigger, form);

        let active: LinkRange | undefined;
        let hoveredAnchor: HTMLAnchorElement | undefined;
        let editorOpen = false;
        let hideTriggerTimer: ReturnType<typeof setTimeout> | undefined;

        const cancelScheduledHide = () => {
          if (hideTriggerTimer === undefined) return;
          clearTimeout(hideTriggerTimer);
          hideTriggerTimer = undefined;
        };

        const syncOverlayLayer = () => {
          const bubble = overlayHost.querySelector<HTMLElement>('.cherry-bubble--preview');
          const zIndex = Number.parseInt(
            bubble ? (document.defaultView?.getComputedStyle(bubble).zIndex ?? '') : '',
            10,
          );
          if (!Number.isFinite(zIndex)) return;
          trigger.style.zIndex = String(zIndex + 3);
          form.style.zIndex = String(zIndex + 3);
        };

        const notifyUi = (open: boolean) => {
          view.dom.dispatchEvent(
            new CustomEvent('cherry-milkdown:link-ui-change', { bubbles: true, detail: { open } }),
          );
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
        const placeTrigger = () => {
          const current = active;
          const anchor = current && anchorForRange(current);
          if (!anchor) {
            trigger.hidden = true;
            return;
          }
          active = { ...current, anchor };
          syncOverlayLayer();
          trigger.hidden = false;
          const rect = lastClientRect(anchor);
          const size = trigger.offsetWidth || 20;
          const gap = 4;
          const viewportWidth = document.documentElement.clientWidth;
          const viewportHeight = document.documentElement.clientHeight;
          // Cherry's target marker and ProseMirror's cursor separators are not
          // visible content. A link followed only by those nodes can safely
          // use its natural trailing position; real following prose uses the
          // above/below fallback and is never covered.
          const fitsAfter = !hasVisibleFollowingContent(anchor) && rect.right + gap + size <= viewportWidth - 8;
          const fitsAbove = rect.top - size - gap >= 8;
          const left = fitsAfter
            ? rect.right + gap
            : Math.max(8, Math.min(viewportWidth - size - 8, rect.right - size));
          const top = fitsAfter
            ? Math.max(8, Math.min(viewportHeight - size - 8, rect.top + (rect.height - size) / 2))
            : fitsAbove
              ? rect.top - size - gap
              : Math.min(viewportHeight - size - 8, rect.bottom + gap);
          trigger.style.left = `${left}px`;
          trigger.style.top = `${top}px`;
        };
        const placeForm = () => {
          const anchor = active && anchorForRange(active);
          const rect = anchor ? lastClientRect(anchor) : trigger.getBoundingClientRect();
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
        const hideTrigger = () => {
          if (editorOpen || hoveredAnchor) return;
          active = undefined;
          trigger.hidden = true;
        };
        const close = ({ restoreFocus = false } = {}) => {
          if (!editorOpen) return;
          editorOpen = false;
          form.hidden = true;
          trigger.setAttribute('aria-expanded', 'false');
          notifyUi(false);
          if (restoreFocus) view.focus();
          hideTrigger();
        };
        const open = (range: LinkRange) => {
          active = { ...range, anchor: range.anchor ?? anchorForRange(range) };
          textInput.value = view.state.doc.textBetween(range.from, range.to, '', '');
          hrefInput.value = String(range.mark?.attrs.href ?? range.anchor?.getAttribute('href') ?? '');
          remove.hidden = !range.mark;
          editorOpen = true;
          syncOverlayLayer();
          trigger.setAttribute('aria-expanded', 'true');
          form.hidden = false;
          trigger.hidden = true;
          placeForm();
          notifyUi(true);
          requestAnimationFrame(() => hrefInput.focus({ preventScroll: true }));
        };
        const showForAnchor = (anchor: HTMLAnchorElement) => {
          const range = rangeFromAnchor(anchor);
          if (!range) return;
          cancelScheduledHide();
          hoveredAnchor = anchor;
          if (!editorOpen) active = range;
          placeTrigger();
        };
        const showForSelection = () => {
          if (editorOpen || hoveredAnchor) return;
          const { from, to } = view.state.selection;
          const range = linkAtRange(view, from, to);
          if (!range) return hideTrigger();
          active = range;
          placeTrigger();
        };
        const scheduleTriggerHide = () => {
          cancelScheduledHide();
          hideTriggerTimer = setTimeout(() => {
            hideTriggerTimer = undefined;
            hoveredAnchor = undefined;
            if (!editorOpen) showForSelection();
          }, 160);
        };
        const onPointerMove = (event: PointerEvent) => {
          if (event.target instanceof Node && (form.contains(event.target) || trigger.contains(event.target))) return;
          const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
          if (anchor instanceof HTMLAnchorElement && view.dom.contains(anchor)) {
            showForAnchor(anchor);
            return;
          }
          if (!editorOpen) scheduleTriggerHide();
        };
        const onTriggerPointerEnter = () => cancelScheduledHide();
        const onTriggerPointerLeave = () => scheduleTriggerHide();
        const onTriggerPointerDown = (event: PointerEvent) => {
          // Moving focus to the overlay must not collapse the document selection.
          cancelScheduledHide();
          event.preventDefault();
          event.stopPropagation();
        };
        const onTriggerClick = (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          if (!active) return;
          view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, active.from)));
          open(active);
        };
        const onEditRequest = (event: Event) => {
          const range = (event as CustomEvent<LinkRange>).detail;
          if (range) open(range);
        };
        const onOutsidePointer = (event: PointerEvent) => {
          if (!(event.target instanceof Node) || form.contains(event.target) || trigger.contains(event.target)) return;
          cancelScheduledHide();
          hoveredAnchor = undefined;
          if (editorOpen) close();
          queueMicrotask(() => {
            if (!view.hasFocus()) {
              active = undefined;
              trigger.hidden = true;
            }
          });
        };
        const onSubmit = (event: SubmitEvent) => {
          event.preventDefault();
          if (!active) return;
          const href = sanitizeLinkHref(hrefInput.value.trim());
          const text = textInput.value;
          if (!href || !text) return;
          const linkType = view.state.schema.marks.link;
          if (!linkType) return;
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
        const reposition = () => {
          if (!trigger.hidden) placeTrigger();
          if (editorOpen) placeForm();
        };

        view.dom.addEventListener('pointermove', onPointerMove);
        view.dom.addEventListener('cherry-milkdown:edit-link', onEditRequest);
        trigger.addEventListener('pointerdown', onTriggerPointerDown);
        trigger.addEventListener('pointerenter', onTriggerPointerEnter);
        trigger.addEventListener('pointerleave', onTriggerPointerLeave);
        trigger.addEventListener('click', onTriggerClick);
        document.addEventListener('pointerdown', onOutsidePointer, true);
        document.defaultView?.addEventListener('scroll', reposition, true);
        document.defaultView?.addEventListener('resize', reposition);
        form.addEventListener('submit', onSubmit);
        form.addEventListener('keydown', onKeyDown);
        remove.addEventListener('click', removeLink);
        cancel.addEventListener('click', onCancel);

        return {
          update: (_view, previousState) => {
            if (active && !previousState.doc.eq(view.state.doc)) close();
            showForSelection();
          },
          destroy: () => {
            if (editorOpen) notifyUi(false);
            cancelScheduledHide();
            view.dom.removeEventListener('pointermove', onPointerMove);
            view.dom.removeEventListener('cherry-milkdown:edit-link', onEditRequest);
            trigger.removeEventListener('pointerdown', onTriggerPointerDown);
            trigger.removeEventListener('pointerenter', onTriggerPointerEnter);
            trigger.removeEventListener('pointerleave', onTriggerPointerLeave);
            trigger.removeEventListener('click', onTriggerClick);
            document.removeEventListener('pointerdown', onOutsidePointer, true);
            document.defaultView?.removeEventListener('scroll', reposition, true);
            document.defaultView?.removeEventListener('resize', reposition);
            form.removeEventListener('submit', onSubmit);
            form.removeEventListener('keydown', onKeyDown);
            remove.removeEventListener('click', removeLink);
            cancel.removeEventListener('click', onCancel);
            trigger.remove();
            form.remove();
          },
        };
      },
    }),
);
