import { commandsCtx, editorViewCtx, parserCtx } from '@milkdown/kit/core';
import { Slice } from '@milkdown/kit/prose/model';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { TextSelection } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import {
  insertHrCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
} from '@milkdown/kit/preset/commonmark';
import { insertTableCommand, toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { redoCommand, undoCommand } from '@milkdown/kit/plugin/history';
import type { CherryMilkdownHost, CherryPreviewEditingBridge, CherryToolbarCommand } from './types.js';
import type { CherryMilkdownInstance } from './types.js';

interface CherryMenuLike {
  isSelections?: boolean;
  updateMarkdown?: boolean;
  hasCacheOnce?: () => boolean;
  onClick?: (selection: string, shortKey?: string, event?: Event) => unknown;
  $getTypeAndColor?: (shortKey: string) => { type: string; color?: string } | undefined;
  bubbleColor?: { toggle(options: { forceHide: boolean }): void };
}

const TRANSFORMED_MARKDOWN_COMMANDS = new Set([
  'align',
  'audio',
  'checklist',
  'detail',
  'draw.io',
  'file',
  'formula',
  'graph',
  'image',
  'insert',
  'link',
  'panel',
  'proTable',
  'quickTable',
  'ruby',
  'timeline',
  'toc',
  'video',
]);

function selectedText(view: EditorView) {
  const { from, to } = view.state.selection;
  return view.state.doc.textBetween(from, to, '\n');
}

export function createCherryEditingBridge(
  cherry: CherryMilkdownHost,
  instance: CherryMilkdownInstance,
): CherryPreviewEditingBridge {
  let previewWasActive = false;
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  const rememberPreview = () => {
    previewWasActive = true;
  };
  view.dom.addEventListener('focusin', rememberPreview);
  view.dom.addEventListener('pointerdown', rememberPreview);

  const isActive = () => previewWasActive && !cherry.getCodeMirror?.()?.hasFocus;

  const call = (command: { key: unknown }, payload?: unknown) => {
    let handled = false;
    instance.editor.action((ctx) => {
      handled = ctx.get(commandsCtx).call(command.key as never, payload as never) !== false;
    });
    if (handled) view.focus();
    return handled;
  };

  const setTextBlock = (
    type: NonNullable<(typeof view.state.schema.nodes)[string]>,
    attrs?: Record<string, unknown>,
  ) => {
    let transaction = view.state.tr;
    try {
      for (const range of view.state.selection.ranges) {
        transaction = transaction.setBlockType(range.$from.pos, range.$to.pos, type, attrs);
      }
    } catch {
      return false;
    }
    if (!transaction.docChanged) return false;
    view.dispatch(transaction);
    view.focus();
    return true;
  };

  const setHeading = (level: number) => {
    const { heading, paragraph } = view.state.schema.nodes;
    if (!heading || !paragraph) return false;
    const { $from } = view.state.selection;
    const sameLevel = $from.parent.type === heading && Number($from.parent.attrs.level) === level;
    return setTextBlock(sameLevel ? paragraph : heading, sameLevel ? undefined : { level });
  };

  const toggleCustomMark = (name: string, attrs?: Record<string, string>) => {
    const type = view.state.schema.marks[name];
    if (!type) return false;
    toggleMark(type, attrs)(view.state, view.dispatch);
    view.focus();
    return true;
  };

  const insertMarkdown = (markdown: string, select = false) => {
    if (!markdown) return false;
    instance.editor.action((ctx) => {
      const parsed = ctx.get(parserCtx)(markdown);
      const transaction = view.state.tr.replaceSelection(new Slice(parsed.content, 0, 0));
      if (!select) transaction.setSelection(view.state.selection.map(transaction.doc, transaction.mapping));
      view.dispatch(transaction);
    });
    view.focus();
    return true;
  };

  const runCherryTransform = (command: CherryToolbarCommand) => {
    const menu = command.menu as CherryMenuLike | undefined;
    if (!menu?.onClick) return false;
    const selection = selectedText(view);
    const previousIsSelections = menu.isSelections;
    menu.isSelections = true;
    let result: unknown;
    try {
      result = menu.onClick(selection, command.shortKey, command.event);
    } finally {
      menu.isSelections = previousIsSelections;
    }
    if (result instanceof Promise) {
      void result.then((value) => {
        if (typeof value === 'string' && value !== selection) insertMarkdown(value);
      });
      return true;
    }
    if (typeof result === 'string' && result !== selection) insertMarkdown(result);
    return true;
  };

  const runCommand = (command: CherryToolbarCommand) => {
    switch (command.name) {
      case 'bold':
        call(toggleStrongCommand);
        return true;
      case 'italic':
        call(toggleEmphasisCommand);
        return true;
      case 'strikethrough':
        call(toggleStrikethroughCommand);
        return true;
      case 'inlineCode':
        call(toggleInlineCodeCommand);
        return true;
      case 'code':
      case 'codeBlock': {
        const type = view.state.schema.nodes.code_block;
        return type ? setTextBlock(type, { language: '' }) : false;
      }
      case 'quote':
        call(wrapInBlockquoteCommand);
        return true;
      case 'ul':
        call(wrapInBulletListCommand);
        return true;
      case 'ol':
        call(wrapInOrderedListCommand);
        return true;
      case 'hr':
        call(insertHrCommand);
        return true;
      case 'table':
        call(insertTableCommand, { row: 3, col: 3 });
        return true;
      case 'header': {
        const level = Number(String(command.shortKey).replace(/\D/g, '')) || 1;
        return setHeading(Math.min(6, level));
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return setHeading(Number(command.name.slice(1)));
      case 'undo':
        return call(undoCommand);
      case 'redo':
        return call(redoCommand);
      case 'underline':
        return toggleCustomMark('cherry_underline');
      case 'sub':
        return toggleCustomMark('cherry_subscript');
      case 'sup':
        return toggleCustomMark('cherry_superscript');
      case 'size': {
        const size = /^\d+$/.test(command.shortKey) ? command.shortKey : '17';
        return toggleCustomMark('cherry_font_size', { size });
      }
      case 'color': {
        const menu = command.menu as CherryMenuLike | undefined;
        if (!menu?.hasCacheOnce?.() && !/(?:background-)?color\s*:/.test(command.shortKey)) {
          return runCherryTransform(command);
        }
        const color = menu?.$getTypeAndColor?.(command.shortKey);
        if (!color) return true;
        if (color.type === 'clear') {
          const transaction = view.state.tr
            .removeMark(view.state.selection.from, view.state.selection.to, view.state.schema.marks.cherry_color)
            .removeMark(
              view.state.selection.from,
              view.state.selection.to,
              view.state.schema.marks.cherry_background_color,
            );
          view.dispatch(transaction);
          menu?.bubbleColor?.toggle({ forceHide: true });
          return true;
        }
        return toggleCustomMark(color.type === 'text' ? 'cherry_color' : 'cherry_background_color', {
          color: color.color ?? '',
        });
      }
      default:
        return TRANSFORMED_MARKDOWN_COMMANDS.has(command.name) ? runCherryTransform(command) : false;
    }
  };

  const queryCommandState = (command: CherryToolbarCommand) => {
    const { $from } = view.state.selection;
    const parent = $from.parent;
    if (command.name === 'header') {
      const level = parent.type.name === 'heading' ? Number(parent.attrs.level) : 0;
      return { active: level > 0, enabled: true, value: level };
    }
    if (/^h[1-6]$/.test(command.name)) {
      const level = Number(command.name.slice(1));
      return {
        active: parent.type.name === 'heading' && Number(parent.attrs.level) === level,
        enabled: true,
        value: level,
      };
    }
    if (command.name === 'code' || command.name === 'codeBlock') {
      return { active: parent.type.name === 'code_block', enabled: true };
    }
    return { active: false, enabled: view.editable };
  };

  const searchableDocument = () => {
    const characters = Array.from({ length: view.state.doc.content.size }, () => '\n');
    view.state.doc.descendants((node, position) => {
      if (!node.isText || !node.text) return;
      Array.from(node.text).forEach((character, offset) => {
        characters[position + offset] = character;
      });
    });
    return characters.join('');
  };

  const setSearchSelection = (from: number, to: number, scrollIntoView = false) => {
    const max = view.state.doc.content.size;
    const safeFrom = Math.max(0, Math.min(from, max));
    const safeTo = Math.max(safeFrom, Math.min(to, max));
    let transaction = view.state.tr.setSelection(
      TextSelection.between(view.state.doc.resolve(safeFrom), view.state.doc.resolve(safeTo)),
    );
    if (scrollIntoView) transaction = transaction.scrollIntoView();
    view.dispatch(transaction);
  };

  const searchAdapter = {
    getDocString: searchableDocument,
    getSelection: () => ({ from: view.state.selection.from, to: view.state.selection.to }),
    getSelectedText: () => selectedText(view),
    getCursorHead: () => view.state.selection.head,
    setSelection: (from: number, to: number, options?: { scrollIntoView?: boolean }) =>
      setSearchSelection(from, to, options?.scrollIntoView),
    setSelections: (ranges: Array<{ from: number; to: number }>, options?: { scrollIntoView?: boolean }) => {
      const range = ranges[0];
      if (range) setSearchSelection(range.from, range.to, options?.scrollIntoView);
    },
    replaceRange: (text: string, from: number, to: number) => {
      view.dispatch(view.state.tr.insertText(text, from, to));
    },
    setSearchQuery: (_pattern: string, _caseSensitive: boolean, _asRegex: boolean) => {},
    clearSearchQuery: () => {},
    focus: () => view.focus(),
    isReadOnly: () => !view.editable,
  };

  return {
    isActive,
    queryCommandState,
    runCommand,
    insert: (content, options) => insertMarkdown(content, options.select),
    getSearchAdapter: () => searchAdapter,
    destroy() {
      view.dom.removeEventListener('focusin', rememberPreview);
      view.dom.removeEventListener('pointerdown', rememberPreview);
    },
  };
}
