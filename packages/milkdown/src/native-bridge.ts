import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { NodeSelection, TextSelection, type EditorState } from '@milkdown/kit/prose/state';
import { toggleEmphasisCommand, toggleStrongCommand, wrapInBlockquoteCommand } from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import type { CherryMilkdownInstance } from './types.js';

type ElementKind = 'image' | 'mermaid';

interface NativeCherryHost {
  bubble?: any;
  toolbarBubbleContainer?: HTMLElement;
  $event?: { off(name: string, listener: (...args: any[]) => void): void };
  getPreviewer(): any;
}

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

export function connectNativeCherryControls(
  cherry: NativeCherryHost,
  instance: CherryMilkdownInstance,
  subscribeSelectionChange?: (listener: () => void) => () => void,
) {
  const previewer = cherry.getPreviewer();
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  const bubble = cherry.bubble;
  const bubbleDom = cherry.toolbarBubbleContainer ?? bubble?.getBubbleDom?.();
  const previewerBubble = previewer.previewerBubble;
  let destroyed = false;
  let cancelBubbleRefresh: (() => void) | undefined;

  if (!bubble || !(bubbleDom instanceof HTMLElement)) return () => {};

  // Cherry already creates its configured Bubble while constructing the
  // preview-only shell. Reuse that exact menu DOM and menu instances, but
  // detach their CodeMirror selection ownership. This adapter deliberately
  // lives in @cherry-markdown/milkdown so Cherry itself needs no plugin API.
  const cherryBubbleEvents = [
    ['afterChange', 'boundHandleAfterChange'],
    ['layoutChange', 'boundHandleLayoutChange'],
    ['onScroll', 'boundHandleScroll'],
    ['beforeSelectionChange', 'boundHandleBeforeSelectionChange'],
  ] as const;
  for (const [eventName, property] of cherryBubbleEvents) {
    const listener = bubble[property];
    if (typeof listener === 'function') cherry.$event?.off(eventName, listener);
  }
  previewer.getDom().append(bubbleDom);
  bubbleDom.classList.add('cherry-bubble--preview');
  bubbleDom.setAttribute('role', 'toolbar');
  bubbleDom.setAttribute('aria-label', '文本格式');
  const preserveSelection = (event: PointerEvent) => event.preventDefault();
  bubbleDom.addEventListener('pointerdown', preserveSelection);

  const call = (command: { key: unknown }) => {
    let handled = false;
    instance.editor.action((ctx) => {
      handled = ctx.get(commandsCtx).call(command.key as never) !== false;
    });
    if (handled) view.focus();
    return handled;
  };

  const toggleCustomMark = (name: string, attrs?: Record<string, string>) => {
    const mark = view.state.schema.marks[name];
    if (!mark || !supportsTextFormatting(view.state)) return false;
    const handled = toggleMark(mark, attrs)(view.state, view.dispatch);
    if (handled) view.focus();
    return handled;
  };

  const applyColor = (menu: any, shortKey: string) => {
    if (!menu?.hasCacheOnce?.() && !/(?:background-)?color\s*:/.test(shortKey)) {
      const selection = view.state.doc.textBetween(view.state.selection.from, view.state.selection.to, '\n');
      const previous = menu.isSelections;
      menu.isSelections = true;
      try {
        menu.onClick?.(selection, shortKey);
      } finally {
        menu.isSelections = previous;
      }
      return true;
    }
    const color = menu?.$getTypeAndColor?.(shortKey);
    if (!color) return true;
    if (color.type === 'clear') {
      const { from, to } = view.state.selection;
      let transaction = view.state.tr;
      for (const name of ['cherry_color', 'cherry_background_color']) {
        const mark = view.state.schema.marks[name];
        if (mark) transaction = transaction.removeMark(from, to, mark);
      }
      view.dispatch(transaction);
      menu?.bubbleColor?.toggle?.({ forceHide: true });
      return true;
    }
    return toggleCustomMark(color.type === 'text' ? 'cherry_color' : 'cherry_background_color', {
      color: color.color ?? '',
    });
  };

  const updateImage = (target: HTMLImageElement, change: any) => {
    let position: number;
    try {
      position = view.posAtDOM(target, 0);
    } catch {
      return false;
    }
    const node = view.state.doc.nodeAt(position);
    if (node?.type.name !== 'image') return false;
    const extension = /#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto|border|shadow|radius|B|S|R|center|right|left|float-right|float-left)/g;
    const source = String(node.attrs.alt ?? '');
    const tokens = source.match(extension) ?? [];
    const base = source.replace(extension, '').trimEnd();
    let sizes = tokens.filter((token) => /^#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)$/.test(token));
    let decorations = tokens.filter((token) => /^#(?:border|shadow|radius|B|S|R)$/.test(token));
    let alignment = tokens.find((token) => /^#(?:center|right|left|float-right|float-left)$/.test(token));
    if (change.width !== undefined || change.height !== undefined) {
      const width = Math.round(Number.parseFloat(String(change.width)));
      const height = Math.round(Number.parseFloat(String(change.height)));
      sizes = [Number.isFinite(width) ? `#${width}px` : '', Number.isFinite(height) ? `#${height}px` : ''].filter(Boolean);
    }
    const aliases: Record<string, string> = { border: '#B', shadow: '#S', radius: '#R' };
    if (aliases[change.type]) {
      const alias = new RegExp(`^#(?:${change.type}|${aliases[change.type].slice(1)})$`);
      const active = decorations.some((token) => alias.test(token));
      decorations = decorations.filter((token) => !alias.test(token));
      if (!active) decorations.push(aliases[change.type]);
    } else if (change.type === 'clear-align') alignment = undefined;
    else if (/^(?:left|right|center|float-left|float-right)$/.test(change.type)) alignment = `#${change.type}`;
    const alt = `${base}${[...sizes, ...decorations, ...(alignment ? [alignment] : [])].join('')}`;
    const transaction = view.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, alt });
    view.dispatch(transaction.setSelection(NodeSelection.create(transaction.doc, position)));
    return true;
  };

  const updateMermaid = (target: HTMLElement, change: any) => {
    let position: number;
    try {
      position = view.posAtDOM(target, 0);
    } catch {
      return false;
    }
    const node = view.state.doc.nodeAt(position);
    if (node?.type.name !== 'cherry_diagram' || node.attrs.diagramType !== 'mermaid') return false;
    const lines = String(node.attrs.source ?? '').split(/\r?\n/);
    const layout = /#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto|center|right|left|float-right|float-left)/gi;
    const opener = lines[0] ?? '```mermaid';
    const tokens = opener.match(layout) ?? [];
    let sizes = tokens.filter((token) => /^#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)$/i.test(token));
    let alignment = tokens.find((token) => /^#(?:center|right|left|float-right|float-left)$/i.test(token));
    if (change.width !== undefined || change.height !== undefined) {
      const width = Math.round(Number.parseFloat(String(change.width)));
      const height = Math.round(Number.parseFloat(String(change.height)));
      sizes = [Number.isFinite(width) ? `#${width}px` : '', Number.isFinite(height) ? `#${height}px` : ''].filter(Boolean);
    }
    if (change.type === 'clear-align') alignment = undefined;
    else if (/^(?:left|right|center|float-left|float-right)$/.test(change.type)) alignment = `#${change.type}`;
    const suffix = [...sizes, ...(alignment ? [alignment] : [])].join(' ');
    lines[0] = `${opener.replace(layout, '').trimEnd()}${suffix ? ` ${suffix}` : ''}`;
    const transaction = view.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, source: lines.join('\n') });
    view.dispatch(transaction.setSelection(NodeSelection.create(transaction.doc, position)));
    return true;
  };

  const bridge = {
    isActive: () => !destroyed && view.editable,
    runCommand(command: { name: string; shortKey: string; menu?: any }) {
      if (!supportsTextFormatting(view.state) && command.name !== 'quote') return false;
      switch (command.name) {
        case 'bold': return call(toggleStrongCommand);
        case 'italic': return call(toggleEmphasisCommand);
        case 'strikethrough': return call(toggleStrikethroughCommand);
        case 'underline': return toggleCustomMark('cherry_underline');
        case 'sub': return toggleCustomMark('cherry_subscript');
        case 'sup': return toggleCustomMark('cherry_superscript');
        case 'quote': return call(wrapInBlockquoteCommand);
        case 'size': return toggleCustomMark('cherry_font_size', { size: /^\d+$/.test(command.shortKey) ? command.shortKey : '17' });
        case 'color': return applyColor(command.menu, command.shortKey);
        default: return false;
      }
    },
    ownsPreviewElement(target: Element, kind: ElementKind) {
      let position: number;
      try {
        position = view.posAtDOM(target, 0);
      } catch {
        return false;
      }
      const node = view.state.doc.nodeAt(position);
      return kind === 'image'
        ? target instanceof HTMLImageElement && node?.type.name === 'image'
        : node?.type.name === 'cherry_diagram' && node.attrs.diagramType === 'mermaid';
    },
    updatePreviewElement(target: Element, change: any) {
      return change.kind === 'image' && target instanceof HTMLImageElement
        ? updateImage(target, change)
        : target instanceof HTMLElement && updateMermaid(target, change);
    },
    resolvePreviewElement(kind: ElementKind) {
      const selection = view.state.selection;
      if (!(selection instanceof NodeSelection)) return null;
      if (kind === 'image' && selection.node.type.name !== 'image') return null;
      if (kind === 'mermaid' && (selection.node.type.name !== 'cherry_diagram' || selection.node.attrs.diagramType !== 'mermaid')) return null;
      const dom = view.nodeDOM(selection.from);
      return dom instanceof Element ? dom : null;
    },
  };

  const hideBubble = () => {
    if (bubble.bubbleDom) bubble.visible = false;
  };

  const showBubbleAt = (rect: { top: number; bottom: number; left: number; right: number }) => {
    if (!bubble.bubbleDom) return;
    bubble.bubbleDom.style.position = 'fixed';
    bubble.visible = true;
    const gap = 6;
    const height = bubble.bubbleDom.offsetHeight;
    const above = rect.top - height >= 8;
    const top = above ? rect.top - height - gap : rect.bottom + gap;
    const center = (rect.left + rect.right) / 2;
    const maxLeft = Math.max(8, document.documentElement.clientWidth - bubble.bubbleDom.offsetWidth - 8);
    const left = Math.max(8, Math.min(maxLeft, center - bubble.bubbleDom.offsetWidth / 2));
    bubble.bubbleDom.style.top = `${top}px`;
    bubble.bubbleDom.style.left = `${left}px`;
    if (bubble.bubbleTop) bubble.bubbleTop.style.display = above ? 'none' : 'block';
    if (bubble.bubbleBottom) bubble.bubbleBottom.style.display = above ? 'block' : 'none';
    bubble.$setBubbleCursorPosition?.(
      `${Math.max(10, Math.min(bubble.bubbleDom.offsetWidth - 10, center - left))}px`,
    );
  };

  const restoredMenuFire: Array<() => void> = [];
  for (const [name, menu] of Object.entries<any>(bubble.menus?.hooks ?? {})) {
    if (!menu || typeof menu.fire !== 'function') continue;
    const original = menu.fire;
    menu.fire = (event?: Event, shortKey = '') => {
      event?.stopPropagation();
      bridge.runCommand({ name, shortKey, menu });
    };
    restoredMenuFire.push(() => {
      menu.fire = original;
    });
  }

  const restorePreviewControls: Array<() => void> = [];
  if (previewerBubble) {
    let editingNativeNode = false;
    let imageResize:
      | {
          target: HTMLImageElement;
          handle: string;
          startX: number;
          startY: number;
          width: number;
          height: number;
          nextWidth: number;
          nextHeight: number;
        }
      | undefined;
    const previewerDom = previewer.getDom() as HTMLElement;
    const originalClick = previewerBubble.$bindedOnClick;
    const originalEnableCheck = previewerBubble.$isEnableBubbleAndEditorShow;
    const originalBeginImage = previewerBubble.beginChangeImgValue;
    const originalImageValid = previewerBubble.$isImgHandlerValid;
    const originalChangeImageSize = previewerBubble.changeImgSize;
    const originalChangeImageStyle = previewerBubble.changeImgStyle;
    const originalMermaid = previewerBubble.mermaidSession;
    const mermaidMethods = originalMermaid
      ? {
          beginEdit: originalMermaid.beginEdit,
          createHandlerOptions: originalMermaid.createHandlerOptions,
          resolveFigure: originalMermaid.resolveFigure,
          getEditorIndex: originalMermaid.getEditorIndex,
          isValid: originalMermaid.isValid,
          changeSize: originalMermaid.changeSize,
          changeAlign: originalMermaid.changeAlign,
        }
      : undefined;

    const resolveElement = (kind: ElementKind) => bridge.resolvePreviewElement(kind);
    const isOwned = (target: Element, kind: ElementKind) => bridge.ownsPreviewElement(target, kind);
    previewerBubble.$isEnableBubbleAndEditorShow = () => editingNativeNode;
    previewerBubble.beginChangeImgValue = (target: HTMLImageElement) => {
      if (!isOwned(target, 'image')) return false;
      const position = view.posAtDOM(target, 0);
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, position)));
      return true;
    };
    previewerBubble.$isImgHandlerValid = () => {
      const target = resolveElement('image');
      return target instanceof HTMLImageElement && target.isConnected;
    };
    previewerBubble.changeImgSize = (target: HTMLImageElement, style: { width: number; height: number }) => {
      // The native handler emits every drag frame. Replacing the ProseMirror
      // node here would detach its target and truncate the gesture, so the
      // capture handlers below own the visual preview and commit once on up.
      if (!imageResize) {
        target.style.width = `${style.width}px`;
        target.style.height = `${style.height}px`;
      }
      return true;
    };
    previewerBubble.changeImgStyle = (target: HTMLImageElement, type: string) => updateImage(target, { type });

    if (originalMermaid) {
      originalMermaid.beginEdit = (target: HTMLElement) => {
        if (!isOwned(target, 'mermaid')) return false;
        const position = view.posAtDOM(target, 0);
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, position)));
        originalMermaid.previewIndex = [...previewerDom.querySelectorAll('figure[data-type="mermaid"]')].indexOf(target);
        return true;
      };
      originalMermaid.resolveFigure = () => resolveElement('mermaid');
      originalMermaid.getEditorIndex = () =>
        view.state.selection instanceof NodeSelection && view.state.selection.node.type.name === 'cherry_diagram'
          ? view.state.selection.from
          : -1;
      originalMermaid.isValid = () => {
        const target = resolveElement('mermaid');
        return target instanceof HTMLElement && target.isConnected;
      };
      originalMermaid.createHandlerOptions = (onInvalidTarget: () => void) => ({
        onInvalidTarget,
        resolveTarget: () => resolveElement('mermaid'),
        validateTarget: () => originalMermaid.isValid(),
      });
      originalMermaid.changeSize = (style: { width: number; height: number }) => {
        const target = resolveElement('mermaid');
        return target instanceof HTMLElement && updateMermaid(target, style);
      };
      originalMermaid.changeAlign = (type: string) => {
        const target = resolveElement('mermaid');
        return target instanceof HTMLElement && updateMermaid(target, { type });
      };
    }

    const onPreviewClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const image = target instanceof HTMLImageElement && isOwned(target, 'image');
      const mermaid = target?.closest('figure[data-type="mermaid"]');
      editingNativeNode = image || (mermaid instanceof HTMLElement && isOwned(mermaid, 'mermaid'));
      try {
        originalClick.call(previewerBubble, event);
      } finally {
        editingNativeNode = false;
      }
    };
    const beginImageResize = (event: MouseEvent) => {
      const point = event.target instanceof Element
        ? event.target.closest<HTMLElement>('.cherry-previewer-img-size-handler__points')
        : null;
      const target = resolveElement('image');
      if (!point || !(target instanceof HTMLImageElement)) return;
      const rect = target.getBoundingClientRect();
      imageResize = {
        target,
        handle: point.dataset.name ?? '',
        startX: event.clientX,
        startY: event.clientY,
        width: rect.width,
        height: rect.height,
        nextWidth: rect.width,
        nextHeight: rect.height,
      };
    };
    const previewImageResize = (event: MouseEvent) => {
      if (!imageResize) return;
      const dx = event.clientX - imageResize.startX;
      const dy = event.clientY - imageResize.startY;
      const horizontal = imageResize.handle.startsWith('left')
        ? -dx
        : imageResize.handle.startsWith('right')
          ? dx
          : 0;
      const vertical = imageResize.handle.endsWith('Top')
        ? -dy
        : imageResize.handle.endsWith('Bottom')
          ? dy
          : 0;
      if (horizontal) {
        imageResize.nextWidth = Math.max(1, imageResize.width + horizontal);
        if (!imageResize.handle.endsWith('Middle')) {
          imageResize.nextHeight = Math.max(1, imageResize.height * (imageResize.nextWidth / imageResize.width));
        }
      } else if (vertical) {
        imageResize.nextHeight = Math.max(1, imageResize.height + vertical);
        imageResize.nextWidth = Math.max(1, imageResize.width * (imageResize.nextHeight / imageResize.height));
      }
      imageResize.target.style.width = `${imageResize.nextWidth}px`;
      imageResize.target.style.height = `${imageResize.nextHeight}px`;
    };
    const commitImageResize = () => {
      if (!imageResize) return;
      const finished = imageResize;
      imageResize = undefined;
      queueMicrotask(() => {
        if (!destroyed) updateImage(finished.target, { width: finished.nextWidth, height: finished.nextHeight });
      });
    };
    previewerDom.removeEventListener('click', originalClick);
    previewerDom.addEventListener('click', onPreviewClick);
    document.addEventListener('mousedown', beginImageResize, true);
    document.addEventListener('mousemove', previewImageResize, true);
    document.addEventListener('mouseup', commitImageResize, true);
    restorePreviewControls.push(() => {
      commitImageResize();
      document.removeEventListener('mousedown', beginImageResize, true);
      document.removeEventListener('mousemove', previewImageResize, true);
      document.removeEventListener('mouseup', commitImageResize, true);
      previewerDom.removeEventListener('click', onPreviewClick);
      previewerDom.addEventListener('click', originalClick);
      previewerBubble.$isEnableBubbleAndEditorShow = originalEnableCheck;
      previewerBubble.beginChangeImgValue = originalBeginImage;
      previewerBubble.$isImgHandlerValid = originalImageValid;
      previewerBubble.changeImgSize = originalChangeImageSize;
      previewerBubble.changeImgStyle = originalChangeImageStyle;
      if (originalMermaid && mermaidMethods) Object.assign(originalMermaid, mermaidMethods);
    });
  }

  const refreshBubble = () => {
    if (cancelBubbleRefresh) return;
    const refresh = () => {
      cancelBubbleRefresh = undefined;
      const selection = view.dom.ownerDocument.getSelection();
      const ownsSelection = Boolean(
        selection &&
        !selection.isCollapsed &&
        selection.anchorNode &&
        selection.focusNode &&
        view.dom.contains(selection.anchorNode) &&
        view.dom.contains(selection.focusNode),
      );
      if (destroyed || !ownsSelection || !supportsTextFormatting(view.state)) {
        hideBubble();
        return;
      }
      try {
        const from = view.coordsAtPos(view.state.selection.from);
        const to = view.coordsAtPos(view.state.selection.to);
        showBubbleAt({
          top: Math.min(from.top, to.top), bottom: Math.max(from.bottom, to.bottom),
          left: Math.min(from.left, to.left), right: Math.max(from.right, to.right),
        });
      } catch {
        hideBubble();
      }
    };
    // ProseMirror reconciles the DOM selection through its observer. A
    // selectionchange/keyup callback can run before the corresponding editor
    // state is committed, so read it at the next animation frame.
    const frameWindow = view.dom.ownerDocument.defaultView;
    if (frameWindow?.requestAnimationFrame) {
      const frame = frameWindow.requestAnimationFrame(refresh);
      cancelBubbleRefresh = () => frameWindow.cancelAnimationFrame(frame);
    } else {
      const timer = setTimeout(refresh);
      cancelBubbleRefresh = () => clearTimeout(timer);
    }
  };
  const hideBubbleAtPointer = hideBubble;
  const hideBubbleOutside = (event: PointerEvent) => {
    const target = event.target;
    if (target instanceof Node && !view.dom.contains(target) && !bubbleDom.contains(target)) hideBubble();
  };
  view.dom.ownerDocument.addEventListener('selectionchange', refreshBubble);
  view.dom.ownerDocument.addEventListener('pointerdown', hideBubbleOutside, true);
  view.dom.addEventListener('mouseup', refreshBubble, true);
  view.dom.addEventListener('keyup', refreshBubble, true);
  view.dom.addEventListener('pointerdown', hideBubbleAtPointer, true);
  const unsubscribeSelectionChange = subscribeSelectionChange?.(refreshBubble);

  return () => {
    if (destroyed) return;
    destroyed = true;
    cancelBubbleRefresh?.();
    cancelBubbleRefresh = undefined;
    view.dom.ownerDocument.removeEventListener('selectionchange', refreshBubble);
    view.dom.ownerDocument.removeEventListener('pointerdown', hideBubbleOutside, true);
    view.dom.removeEventListener('mouseup', refreshBubble, true);
    view.dom.removeEventListener('keyup', refreshBubble, true);
    view.dom.removeEventListener('pointerdown', hideBubbleAtPointer, true);
    unsubscribeSelectionChange?.();
    hideBubble();
    bubbleDom.removeEventListener('pointerdown', preserveSelection);
    restoredMenuFire.forEach((restore) => restore());
    restorePreviewControls.forEach((restore) => restore());
  };
}
