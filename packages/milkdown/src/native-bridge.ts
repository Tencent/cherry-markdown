import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { Fragment } from '@milkdown/kit/prose/model';
import { NodeSelection, TextSelection, type EditorState } from '@milkdown/kit/prose/state';
import { toggleEmphasisCommand, toggleStrongCommand, wrapInBlockquoteCommand } from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import type { CherryMilkdownInstance } from './types.js';
import { updateImageLayout, updateMermaidLayout, type NativeLayoutChange } from './native-layout.js';
import type { NativeCherryHost, NativePreviewElementKind } from './native-cherry.js';
import { isEditorRectVisible, positionNativeBubble } from './native-bubble.js';

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
  const previewOnly = Boolean(cherry.options.isPreviewOnly || cherry.options.editor?.defaultModel === 'previewOnly');
  let destroyed = false;
  let linkUiOpen = false;
  let previewOwnsBubble = previewOnly;
  let bubbleSuppressed = false;
  let cancelBubbleRefresh: (() => void) | undefined;

  if (!bubble || !(bubbleDom instanceof HTMLElement)) return () => {};

  // Cherry already creates its configured Bubble. In previewOnly it has no
  // visible source owner, so move it to the preview and detach CodeMirror's
  // listeners. In edit&preview the same Bubble remains in CodeMirror and its
  // menu calls are routed according to the editor that most recently owned an
  // explicit selection. This avoids two competing menus and keeps the native
  // source-editor behavior intact.
  const cherryBubbleEvents = [
    ['afterChange', 'boundHandleAfterChange'],
    ['layoutChange', 'boundHandleLayoutChange'],
    ['onScroll', 'boundHandleScroll'],
    ['beforeSelectionChange', 'boundHandleBeforeSelectionChange'],
  ] as const;
  if (previewOnly) {
    for (const [eventName, property] of cherryBubbleEvents) {
      const listener = bubble[property];
      if (typeof listener === 'function') cherry.$event?.off(eventName, listener);
    }
    previewer.getDom().append(bubbleDom);
  }
  bubbleDom.classList.add('cherry-bubble--preview');
  bubbleDom.setAttribute('role', 'toolbar');
  bubbleDom.setAttribute('aria-label', '文本格式');
  const preserveSelection = (event: PointerEvent) => {
    if (previewOwnsBubble) event.preventDefault();
  };
  bubbleDom.addEventListener('pointerdown', preserveSelection);

  const sourceEditorDom = bubble.editorDom instanceof HTMLElement ? bubble.editorDom : undefined;
  const takeSourceOwnership = (event?: Event) => {
    // In dual-pane mode the shared Bubble remains physically inside the
    // CodeMirror container. Clicking the Bubble must retain whichever editor
    // opened it instead of being mistaken for a click in the source surface.
    if (event?.target instanceof Node && bubbleDom.contains(event.target)) return;
    previewOwnsBubble = false;
    bubbleDom.style.position = '';
  };
  const takePreviewOwnership = () => {
    previewOwnsBubble = true;
  };
  if (!previewOnly) sourceEditorDom?.addEventListener('pointerdown', takeSourceOwnership, true);

  const hideNativeBubble = () => {
    bubbleSuppressed = true;
    if (bubble.bubbleDom) bubble.visible = false;
  };

  const call = (command: { key: unknown }) => {
    let handled = false;
    instance.editor.action((ctx) => {
      handled = ctx.get(commandsCtx).call(command.key as never) !== false;
    });
    if (handled) {
      view.focus();
      hideNativeBubble();
    }
    return handled;
  };

  const toggleCustomMark = (name: string, attrs?: Record<string, string>) => {
    const mark = view.state.schema.marks[name];
    if (!mark || !supportsTextFormatting(view.state)) return false;
    const handled = toggleMark(mark, attrs)(view.state, view.dispatch);
    if (handled) {
      view.focus();
      hideNativeBubble();
    }
    return handled;
  };

  const toggleBlockquote = () => {
    const { state } = view;
    const blockquote = state.schema.nodes.blockquote;
    if (!blockquote) return false;

    // Cherry's source Bubble prefixes the complete selected line. Inside a
    // list that means `> - item`, i.e. the list block itself is quoted. The
    // stock Milkdown command cannot wrap the leading paragraph of a list item
    // because it must remain that item's first child, and therefore silently
    // does nothing. Resolve the structural owner explicitly.
    let quotePosition: number | undefined;
    let quoteNode: typeof state.doc | undefined;
    let listPosition: number | undefined;
    let listNode: typeof state.doc | undefined;
    let listDepth: number | undefined;
    for (let depth = state.selection.$from.depth; depth > 0; depth -= 1) {
      const node = state.selection.$from.node(depth);
      const position = state.selection.$from.before(depth);
      if (node.type === blockquote && quotePosition === undefined) {
        quotePosition = position;
        quoteNode = node;
        break;
      }
      if ((node.type.name === 'bullet_list' || node.type.name === 'ordered_list') && listPosition === undefined) {
        listPosition = position;
        listNode = node;
        listDepth = depth;
      }
    }

    if (quotePosition !== undefined && quoteNode) {
      view.dispatch(state.tr.replaceWith(quotePosition, quotePosition + quoteNode.nodeSize, quoteNode.content));
      view.focus();
      hideNativeBubble();
      return true;
    }

    if (listPosition !== undefined && listNode && listDepth !== undefined) {
      const selectedIndex = state.selection.$from.index(listDepth);
      const items = Array.from({ length: listNode.childCount }, (_, index) => listNode.child(index));
      const listAttrs = (offset: number) =>
        listNode.type.name === 'ordered_list'
          ? { ...listNode.attrs, order: Number(listNode.attrs.order ?? 1) + offset }
          : listNode.attrs;
      const replacement: (typeof listNode)[] = [];
      if (selectedIndex > 0) {
        replacement.push(listNode.type.create(listAttrs(0), Fragment.fromArray(items.slice(0, selectedIndex))));
      }
      const quotedList = listNode.type.create(listAttrs(selectedIndex), items[selectedIndex]);
      const quoted = blockquote.create(null, quotedList);
      const quotePosition = listPosition + (replacement[0]?.nodeSize ?? 0);
      replacement.push(quoted);
      if (selectedIndex + 1 < items.length) {
        replacement.push(
          listNode.type.create(listAttrs(selectedIndex + 1), Fragment.fromArray(items.slice(selectedIndex + 1))),
        );
      }
      const transaction = state.tr.replaceWith(
        listPosition,
        listPosition + listNode.nodeSize,
        Fragment.fromArray(replacement),
      );
      view.dispatch(transaction.setSelection(NodeSelection.create(transaction.doc, quotePosition)));
      view.focus();
      hideNativeBubble();
      return true;
    }

    return call(wrapInBlockquoteCommand);
  };

  const applyColor = (menu: any, shortKey: string, event?: Event) => {
    if (!menu?.hasCacheOnce?.() && !/(?:background-)?color\s*:/.test(shortKey)) {
      const selection = view.state.doc.textBetween(view.state.selection.from, view.state.selection.to, '\n');
      const previous = menu.isSelections;
      menu.isSelections = true;
      try {
        // Color's first click opens Cherry's native picker and uses the
        // clicked element to calculate its position. Preserve that event
        // instead of calling the menu with an undefined target.
        const pickerEvent = event ?? { target: menu?.dom };
        menu.onClick?.(selection, shortKey, pickerEvent);
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

  const updateImage = (target: HTMLImageElement, change: NativeLayoutChange) => {
    let position: number;
    try {
      position = view.posAtDOM(target, 0);
    } catch {
      return false;
    }
    const node = view.state.doc.nodeAt(position);
    if (node?.type.name !== 'image') return false;
    const alt = updateImageLayout(String(node.attrs.alt ?? ''), change);
    const transaction = view.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, alt });
    view.dispatch(transaction.setSelection(NodeSelection.create(transaction.doc, position)));
    return true;
  };

  const updateMermaid = (target: HTMLElement, change: NativeLayoutChange) => {
    let position: number;
    try {
      position = view.posAtDOM(target, 0);
    } catch {
      return false;
    }
    const node = view.state.doc.nodeAt(position);
    if (node?.type.name !== 'cherry_diagram' || node.attrs.diagramType !== 'mermaid') return false;
    const source = updateMermaidLayout(String(node.attrs.source ?? ''), change);
    const transaction = view.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, source });
    view.dispatch(transaction.setSelection(NodeSelection.create(transaction.doc, position)));
    return true;
  };

  const bridge = {
    isActive: () => !destroyed && view.editable,
    runCommand(command: { name: string; shortKey: string; menu?: any; event?: Event }) {
      if (!supportsTextFormatting(view.state) && command.name !== 'quote') return false;
      switch (command.name) {
        case 'bold':
          return call(toggleStrongCommand);
        case 'italic':
          return call(toggleEmphasisCommand);
        case 'strikethrough':
          return call(toggleStrikethroughCommand);
        case 'underline':
          return toggleCustomMark('cherry_underline');
        case 'sub':
          return toggleCustomMark('cherry_subscript');
        case 'sup':
          return toggleCustomMark('cherry_superscript');
        case 'quote':
          return toggleBlockquote();
        case 'size':
          return toggleCustomMark('cherry_font_size', {
            size: /^\d+$/.test(command.shortKey) ? command.shortKey : '17',
          });
        case 'color':
          return applyColor(command.menu, command.shortKey, command.event);
        default:
          return false;
      }
    },
    ownsPreviewElement(target: Element, kind: NativePreviewElementKind) {
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
    updatePreviewElement(target: Element, change: NativeLayoutChange & { kind?: NativePreviewElementKind }) {
      return change.kind === 'image' && target instanceof HTMLImageElement
        ? updateImage(target, change)
        : target instanceof HTMLElement && updateMermaid(target, change);
    },
    resolvePreviewElement(kind: NativePreviewElementKind) {
      const selection = view.state.selection;
      if (!(selection instanceof NodeSelection)) return null;
      if (kind === 'image' && selection.node.type.name !== 'image') return null;
      if (
        kind === 'mermaid' &&
        (selection.node.type.name !== 'cherry_diagram' || selection.node.attrs.diagramType !== 'mermaid')
      )
        return null;
      const dom = view.nodeDOM(selection.from);
      return dom instanceof Element ? dom : null;
    },
  };

  const hideBubble = () => {
    if (bubble.bubbleDom) bubble.visible = false;
  };

  const onLinkUiChange = (event: Event) => {
    linkUiOpen = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
    if (linkUiOpen) hideBubble();
  };

  const restoredMenuFire: Array<() => void> = [];
  for (const [name, menu] of Object.entries<any>(bubble.menus?.hooks ?? {})) {
    if (!menu || typeof menu.fire !== 'function') continue;
    const original = menu.fire;
    menu.fire = (event?: Event, shortKey = '') => {
      if (!previewOwnsBubble) {
        original.call(menu, event, shortKey);
        return;
      }
      event?.stopPropagation();
      bridge.runCommand({ name, shortKey, menu, event });
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

    const resolveElement = (kind: NativePreviewElementKind) => bridge.resolvePreviewElement(kind);
    const isOwned = (target: Element, kind: NativePreviewElementKind) => bridge.ownsPreviewElement(target, kind);
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
        originalMermaid.previewIndex = [...previewerDom.querySelectorAll('figure[data-type="mermaid"]')].indexOf(
          target,
        );
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
      // A diagram source editor and Cherry's native size/alignment session are
      // mutually exclusive.  Controls and the source surface live inside the
      // same <figure>, so allowing this click to reach PreviewerBubble would
      // immediately recreate the Mermaid handles above the caret.
      if (target?.closest('.cherry-embed__controls, .cherry-embed__source')) {
        previewerBubble.$removeImgPreviewerBubbles?.();
        return;
      }
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
      const point =
        event.target instanceof Element
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
      const horizontal = imageResize.handle.startsWith('left') ? -dx : imageResize.handle.startsWith('right') ? dx : 0;
      const vertical = imageResize.handle.endsWith('Top') ? -dy : imageResize.handle.endsWith('Bottom') ? dy : 0;
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
      if (destroyed || bubbleSuppressed || linkUiOpen || !ownsSelection || !supportsTextFormatting(view.state)) {
        // In dual-pane mode CodeMirror has its own synthetic selection and
        // Bubble lifecycle. Once source ownership is explicit, a DOM
        // selectionchange outside ProseMirror must not immediately hide the
        // native source Bubble that Cherry just opened.
        if (previewOnly || previewOwnsBubble) hideBubble();
        return;
      }
      takePreviewOwnership();
      try {
        const from = view.coordsAtPos(view.state.selection.from);
        const to = view.coordsAtPos(view.state.selection.to);
        const rect = {
          top: Math.min(from.top, to.top),
          bottom: Math.max(from.bottom, to.bottom),
          left: Math.min(from.left, to.left),
          right: Math.max(from.right, to.right),
        };
        if (!isEditorRectVisible(view.dom, rect)) {
          hideBubble();
          return;
        }
        positionNativeBubble(bubble, rect, view.dom.ownerDocument);
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
  const hideBubbleAtPointer = () => {
    bubbleSuppressed = false;
    hideBubble();
  };
  const refreshBubbleFromKeyboard = () => {
    bubbleSuppressed = false;
    refreshBubble();
  };
  const hideBubbleOutside = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (view.dom.contains(target)) {
      takePreviewOwnership();
      return;
    }
    if (!bubbleDom.contains(target) && !sourceEditorDom?.contains(target)) hideBubble();
  };
  view.dom.ownerDocument.addEventListener('selectionchange', refreshBubble);
  // The native Cherry Bubble remains attached to its selection while the
  // CodeMirror scroller moves. Milkdown positions the shared Bubble against
  // the viewport, so every enclosing scroller (including window) must request
  // the same position refresh. Capture observes non-bubbling element scrolls.
  view.dom.ownerDocument.addEventListener('scroll', refreshBubble, true);
  view.dom.ownerDocument.defaultView?.addEventListener('scroll', refreshBubble);
  view.dom.addEventListener('cherry-milkdown:link-ui-change', onLinkUiChange);
  view.dom.ownerDocument.addEventListener('pointerdown', hideBubbleOutside, true);
  view.dom.addEventListener('mouseup', refreshBubble, true);
  view.dom.addEventListener('keyup', refreshBubbleFromKeyboard, true);
  view.dom.addEventListener('pointerdown', hideBubbleAtPointer, true);
  const unsubscribeSelectionChange = subscribeSelectionChange?.(refreshBubble);

  return () => {
    if (destroyed) return;
    destroyed = true;
    cancelBubbleRefresh?.();
    cancelBubbleRefresh = undefined;
    view.dom.ownerDocument.removeEventListener('selectionchange', refreshBubble);
    view.dom.ownerDocument.removeEventListener('scroll', refreshBubble, true);
    view.dom.ownerDocument.defaultView?.removeEventListener('scroll', refreshBubble);
    view.dom.removeEventListener('cherry-milkdown:link-ui-change', onLinkUiChange);
    view.dom.ownerDocument.removeEventListener('pointerdown', hideBubbleOutside, true);
    view.dom.removeEventListener('mouseup', refreshBubble, true);
    view.dom.removeEventListener('keyup', refreshBubbleFromKeyboard, true);
    view.dom.removeEventListener('pointerdown', hideBubbleAtPointer, true);
    unsubscribeSelectionChange?.();
    hideBubble();
    bubbleDom.removeEventListener('pointerdown', preserveSelection);
    sourceEditorDom?.removeEventListener('pointerdown', takeSourceOwnership, true);
    restoredMenuFire.forEach((restore) => restore());
    restorePreviewControls.forEach((restore) => restore());
    bubbleDom.classList.remove('cherry-bubble--preview');
    bubbleDom.removeAttribute('role');
    bubbleDom.removeAttribute('aria-label');
    if (previewOnly) {
      for (const [eventName, property] of cherryBubbleEvents) {
        const listener = bubble[property];
        if (typeof listener === 'function') cherry.$event?.on(eventName, listener);
      }
    }
  };
}
