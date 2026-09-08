import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { NodeSelection, TextSelection, type EditorState } from '@milkdown/kit/prose/state';
import { toggleEmphasisCommand, toggleStrongCommand, wrapInBlockquoteCommand } from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import type { CherryMilkdownInstance } from './types.js';

type ElementKind = 'image' | 'mermaid';

interface NativeCherryHost {
  getPreviewer(): {
    setEditingBridge(bridge: object): void;
    clearEditingBridge(bridge?: object): boolean;
    showEditingBubble(rect: { top: number; bottom: number; left: number; right: number }): boolean;
    hideEditingBubble(): void;
  };
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
  let destroyed = false;
  let cancelBubbleRefresh: (() => void) | undefined;

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

  const refreshBubble = () => {
    if (cancelBubbleRefresh) return;
    const refresh = () => {
      cancelBubbleRefresh = undefined;
      if (destroyed || !view.hasFocus() || !supportsTextFormatting(view.state)) {
        previewer.hideEditingBubble();
        return;
      }
      try {
        const from = view.coordsAtPos(view.state.selection.from);
        const to = view.coordsAtPos(view.state.selection.to);
        previewer.showEditingBubble({
          top: Math.min(from.top, to.top), bottom: Math.max(from.bottom, to.bottom),
          left: Math.min(from.left, to.left), right: Math.max(from.right, to.right),
        });
      } catch {
        previewer.hideEditingBubble();
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
  const hideBubbleAtPointer = () => previewer.hideEditingBubble();
  view.dom.ownerDocument.addEventListener('selectionchange', refreshBubble);
  view.dom.addEventListener('mouseup', refreshBubble, true);
  view.dom.addEventListener('keyup', refreshBubble, true);
  view.dom.addEventListener('pointerdown', hideBubbleAtPointer, true);
  const unsubscribeSelectionChange = subscribeSelectionChange?.(refreshBubble);
  previewer.setEditingBridge(bridge);

  return () => {
    if (destroyed) return;
    destroyed = true;
    cancelBubbleRefresh?.();
    cancelBubbleRefresh = undefined;
    view.dom.ownerDocument.removeEventListener('selectionchange', refreshBubble);
    view.dom.removeEventListener('mouseup', refreshBubble, true);
    view.dom.removeEventListener('keyup', refreshBubble, true);
    view.dom.removeEventListener('pointerdown', hideBubbleAtPointer, true);
    unsubscribeSelectionChange?.();
    previewer.clearEditingBridge(bridge);
  };
}
