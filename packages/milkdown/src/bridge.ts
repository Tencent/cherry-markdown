import { commandsCtx, editorViewCtx, parserCtx, serializerCtx } from '@milkdown/kit/core';
import { Slice } from '@milkdown/kit/prose/model';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { NodeSelection } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import {
  insertHrCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
} from '@milkdown/kit/preset/commonmark';
import { insertTableCommand, toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { redoCommand, undoCommand } from '@milkdown/kit/plugin/history';
import type {
  CherryMilkdownHost,
  CherryMilkdownInstance,
  CherryPreviewEditingBridge,
  CherryToolbarCommand,
} from './types.js';

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
  // Compound and chart submenu names are separate Cherry menu instances but
  // still transform the current Markdown selection.
  'tips',
  'info',
  'warning',
  'danger',
  'success',
  'pinyin',
  'lineTable',
  'barTable',
  'radarTable',
  'mapTable',
  'heatmapTable',
  'scatterTable',
  'sankeyTable',
  'pieTable',
  'insertFlow',
  'insertSeq',
  'insertState',
  'insertClass',
  'insertPie',
  'insertGantt',
]);

// Cherry's compound block menus (and its list menus) transform the complete
// source line under the caret. Keep these commands on the same replacement
// path so an empty paragraph is replaced by one valid block instead of
// leaving a trailing paragraph behind.
const CHERRY_LINE_TRANSFORM_COMMANDS = new Set(['ol', 'ul', 'checklist', 'panel', 'detail', 'timeline']);

// Commands handled by the explicit Milkdown paths below (or by Cherry's
// non-document UI).  Any other updateMarkdown menu is a user supplied menu;
// route it through the same source-transform contract instead of silently
// falling back to CodeMirror.  This keeps custom menus working in the preview
// while preserving Cherry's global menus and selectors.
const KNOWN_NON_TRANSFORM_COMMANDS = new Set([
  'bold',
  'italic',
  'strikethrough',
  'inlineCode',
  'code',
  'codeBlock',
  'quote',
  'hr',
  'table',
  'header',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'undo',
  'redo',
  'underline',
  'sub',
  'sup',
  'size',
  'color',
  'mobilePreview',
  'copy',
  'theme',
  'codeTheme',
  'fullScreen',
  'export',
  'changeLocale',
  'wordCount',
  'shortcutKey',
  'search',
  'togglePreview',
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
  const serialize = instance.editor.action((ctx) => ctx.get(serializerCtx));
  const previewContainer = cherry.getPreviewer().getDom();
  let cachedDocument = view.state.doc;
  let cachedMarkdown = '';
  let cachedBlocks: Array<{ element: HTMLElement; fromLine: number; toLine: number }> = [];

  const lineAt = (markdown: string, offset: number) => {
    let line = 0;
    for (let index = 0; index < Math.min(offset, markdown.length); index += 1) {
      if (markdown.charCodeAt(index) === 10) line += 1;
    }
    return line;
  };

  const scrollBlocks = () => {
    const document = view.state.doc;
    const markdown = serialize(document);
    if (cachedDocument === document && cachedMarkdown === markdown && cachedBlocks.length) return cachedBlocks;

    let cursor = 0;
    const blocks: typeof cachedBlocks = [];
    document.forEach((node, offset) => {
      const dom = view.nodeDOM(offset);
      if (!(dom instanceof HTMLElement)) return;
      const isolatedDocument = document.type.create(document.attrs, [node]);
      const source = serialize(isolatedDocument).trim();
      let sourceOffset = source ? markdown.indexOf(source, cursor) : cursor;
      if (sourceOffset < 0) sourceOffset = cursor;
      const sourceEnd = Math.max(sourceOffset, sourceOffset + source.length);
      const fromLine = lineAt(markdown, sourceOffset);
      const toLine = Math.max(fromLine + 1, lineAt(markdown, sourceEnd) + 1);
      blocks.push({ element: dom, fromLine, toLine });
      cursor = sourceEnd;
    });

    cachedDocument = document;
    cachedMarkdown = markdown;
    cachedBlocks = blocks;
    return blocks;
  };

  const scrollEditorToBlock = (block: (typeof cachedBlocks)[number], percent = 0) => {
    cherry.editor?.scrollToLineNum(block.fromLine, block.toLine, Math.max(0, Math.min(percent, 1)));
  };

  const scrollEditorToElement = (target: HTMLElement) => {
    const block = scrollBlocks().find(({ element }) => element === target || element.contains(target));
    if (!block) return false;
    scrollEditorToBlock(block);
    return true;
  };

  const scrollPreviewToLine = (lineNum: number | null, linePercent = 0) => {
    if (lineNum === null) {
      previewContainer.scrollTop = previewContainer.scrollHeight;
      return;
    }
    if (lineNum <= 0) {
      previewContainer.scrollTop = 0;
      return;
    }
    const blocks = scrollBlocks();
    const block =
      blocks.find(({ fromLine, toLine }) => lineNum >= fromLine && lineNum < toLine) ??
      blocks.find(({ fromLine }) => fromLine >= lineNum) ??
      blocks.at(-1);
    if (!block) return;
    const blockLines = Math.max(1, block.toLine - block.fromLine);
    const percent = Math.max(0, Math.min(1, (lineNum - block.fromLine + linePercent) / blockLines));
    const containerRect = previewContainer.getBoundingClientRect();
    const blockRect = block.element.getBoundingClientRect();
    previewContainer.scrollTop += blockRect.top - containerRect.top + blockRect.height * percent;
  };

  const syncAnchorNavigation = (event: MouseEvent) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!(link instanceof HTMLAnchorElement)) return;
    let id = '';
    try {
      id = decodeURIComponent(link.hash.slice(1));
    } catch {
      return;
    }
    if (!id) return;
    const target = Array.from(view.dom.querySelectorAll<HTMLElement>('[id]')).find((element) => element.id === id);
    if (!target) return;
    previewWasActive = true;
    scrollEditorToElement(target);
  };
  const rememberPreview = () => {
    previewWasActive = true;
  };
  const activatePreview = (event: PointerEvent) => {
    rememberPreview();
    if (event.button !== 0 || !view.editable || view.hasFocus()) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('button, input, select, textarea, [contenteditable="false"]')) return;
    if ((event.metaKey || event.ctrlKey) && target?.closest('a')) return;

    // CodeMirror remains focused after Cherry switches the active editing
    // surface. Claim focus before the browser resolves the pointer selection;
    // the following mousedown still places or extends the native selection.
    view.focus();
  };
  const deactivatePreviewFromSource = () => {
    // Opening a toolbar can transiently move DOM focus to CodeMirror. That
    // does not change the editing owner; only an explicit pointer interaction
    // in the source editor should hand ownership back.
    previewWasActive = false;
  };
  view.dom.addEventListener('focusin', rememberPreview);
  view.dom.addEventListener('pointerdown', activatePreview, true);
  view.dom.addEventListener('click', syncAnchorNavigation, true);
  const sourceEditor = cherry.getCodeMirror?.();
  const sourceDom = sourceEditor?.dom;
  sourceDom?.addEventListener('pointerdown', deactivatePreviewFromSource, true);

  // Ownership is switched by explicit pointer/focus interaction, not by the
  // transient DOM focus move caused by opening a Cherry toolbar submenu.
  const isActive = () => {
    // Lightweight hosts used by integrations may not expose CodeMirror DOM
    // events. Preserve the legacy focus-based fallback for those hosts.
    if (!sourceDom) {
      const hasFocus = cherry.getCodeMirror?.()?.hasFocus;
      const focused = typeof hasFocus === 'function' ? hasFocus() : hasFocus;
      return previewWasActive && !focused;
    }
    return previewWasActive;
  };

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

  const insertMarkdown = (markdown: string, select = false, replaceCurrentBlock = false) => {
    if (!markdown) return false;
    instance.editor.action((ctx) => {
      const parsed = ctx.get(parserCtx)(markdown);
      let transaction = view.state.tr;
      // Cherry's block toolbar commands replace the current source line(s),
      // not the text cursor inside an existing paragraph. Replacing only the
      // cursor would leave an empty paragraph behind and Milkdown would
      // normalize a multi-item list to a single empty item. For a top-level
      // paragraph we can safely replace the complete ProseMirror node.
      const { $from, $to } = view.state.selection;
      if (replaceCurrentBlock && $from.depth === 1 && $from.parent.isBlock) {
        // A selection spanning sibling top-level paragraphs represents the
        // same set of source lines that Cherry's CodeMirror menu transforms.
        // Include the final paragraph as well, otherwise its old text would
        // remain after inserting the generated block structure.
        const from = $from.before(1);
        const to = $to.depth === 1 ? $to.after(1) : $from.after(1);
        transaction = transaction.replaceWith(from, to, parsed.content);
      } else {
        // A Cherry inline/custom menu returns Markdown such as `***text***`.
        // Milkdown's parser wraps that fragment in a paragraph; inserting the
        // paragraph node into another paragraph splits the block and leaves
        // the unselected suffix in a second paragraph.  Peel that synthetic
        // wrapper when the current selection is inline content.
        const inlineContent =
          $from.parent.inlineContent &&
          parsed.content.childCount === 1 &&
          parsed.content.firstChild?.type.name === 'paragraph'
            ? parsed.content.firstChild.content
            : parsed.content;
        transaction = transaction.replaceSelection(new Slice(inlineContent, 0, 0));
      }
      if (!select) transaction.setSelection(view.state.selection.map(transaction.doc, transaction.mapping));
      view.dispatch(transaction);
    });
    view.focus();
    return true;
  };

  const imageExtensionPattern =
    /#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto|border|shadow|radius|B|S|R|center|right|left|float-right|float-left)/g;
  const imageSizePattern = /^#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)$/;
  const imageDecorationPattern = /^#(?:border|shadow|radius|B|S|R)$/;
  const imageAlignmentPattern = /^#(?:center|right|left|float-right|float-left)$/;

  const updateImage = (
    target: HTMLImageElement,
    change: { width?: number | string; height?: number | string; type?: string },
  ) => {
    let position: number;
    try {
      position = view.posAtDOM(target, 0);
    } catch {
      return false;
    }
    const node = view.state.doc.nodeAt(position);
    if (!node) return false;
    if (node.type.name !== 'image') return false;

    const alt = String(node.attrs.alt ?? '');
    const extensions = alt.match(imageExtensionPattern) ?? [];
    const base = alt.replace(imageExtensionPattern, '').trimEnd();
    let sizes = extensions.filter((token) => imageSizePattern.test(token));
    let decorations = extensions.filter((token) => imageDecorationPattern.test(token));
    let alignment = extensions.find((token) => imageAlignmentPattern.test(token));

    if (change.width !== undefined || change.height !== undefined) {
      const width = Math.round(Number.parseFloat(String(change.width)));
      const height = Math.round(Number.parseFloat(String(change.height)));
      sizes = [Number.isFinite(width) ? `#${width}px` : '', Number.isFinite(height) ? `#${height}px` : ''].filter(
        Boolean,
      );
    }

    if (change.type) {
      const decorationAliases: Record<string, string> = { border: '#B', shadow: '#S', radius: '#R' };
      const decoration = decorationAliases[change.type];
      if (decoration) {
        const aliases: Record<string, RegExp> = {
          border: /^#(?:border|B)$/,
          shadow: /^#(?:shadow|S)$/,
          radius: /^#(?:radius|R)$/,
        };
        const alias = aliases[change.type];
        const active = decorations.some((token) => alias.test(token));
        decorations = decorations.filter((token) => !alias.test(token));
        if (!active) decorations.push(decoration);
      } else if (change.type === 'clear-align') {
        alignment = undefined;
      } else if (/^(?:left|right|center|float-left|float-right)$/.test(change.type)) {
        alignment = `#${change.type}`;
      }
    }

    const nextAlt = `${base}${[...sizes, ...decorations, ...(alignment ? [alignment] : [])].join('')}`;
    const transaction = view.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, alt: nextAlt });
    transaction.setSelection(NodeSelection.create(transaction.doc, position));
    view.dispatch(transaction);
    return true;
  };

  const updateMermaid = (
    target: HTMLElement,
    change: { width?: number | string; height?: number | string; type?: string },
  ) => {
    let position: number;
    try {
      position = view.posAtDOM(target, 0);
    } catch {
      return false;
    }
    const node = view.state.doc.nodeAt(position);
    if (!node) return false;
    if (node.type.name !== 'cherry_diagram' || node.attrs.diagramType !== 'mermaid') return false;

    const source = String(node.attrs.source ?? '');
    const lines = source.split(/\r?\n/);
    const opener = lines[0] ?? '```mermaid';
    const layoutPattern = /#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto|center|right|left|float-right|float-left)/gi;
    const sizePattern = /^#(?:[0-9]+(?:px|em|pt|pc|in|mm|cm|ex|%)|auto)$/i;
    const alignmentPattern = /^#(?:center|right|left|float-right|float-left)$/i;
    const extensions = opener.match(layoutPattern) ?? [];
    const base = opener.replace(layoutPattern, '').trimEnd();
    let sizes = extensions.filter((token) => sizePattern.test(token));
    let alignment = extensions.find((token) => alignmentPattern.test(token));

    if (change.width !== undefined || change.height !== undefined) {
      const width = Math.round(Number.parseFloat(String(change.width)));
      const height = Math.round(Number.parseFloat(String(change.height)));
      sizes = [Number.isFinite(width) ? `#${width}px` : '', Number.isFinite(height) ? `#${height}px` : ''].filter(
        Boolean,
      );
    }
    if (change.type === 'clear-align') alignment = undefined;
    else if (change.type && /^(?:left|right|center|float-left|float-right)$/.test(change.type)) {
      alignment = `#${change.type}`;
    }

    lines[0] = `${base}${sizes.length || alignment ? ' ' : ''}${[...sizes, ...(alignment ? [alignment] : [])].join(
      ' ',
    )}`;
    const nextSource = lines.join('\n');
    const transaction = view.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, source: nextSource });
    transaction.setSelection(NodeSelection.create(transaction.doc, position));
    view.dispatch(transaction);
    return true;
  };

  const runCherryTransform = (command: CherryToolbarCommand) => {
    const menu = command.menu as CherryMenuLike | undefined;
    if (!menu?.onClick) return false;
    const rawSelection = selectedText(view);
    const isLineCommand = CHERRY_LINE_TRANSFORM_COMMANDS.has(command.name);
    // Cherry's line-based list hooks operate on the complete current line
    // when the caret has no text selection. Milkdown's selectedText() is
    // intentionally empty in that case, so provide the current text block to
    // the hook instead of letting it fall back to the demo placeholder.
    const selection =
      rawSelection ||
      (isLineCommand && view.state.selection.$from.parent.isTextblock
        ? view.state.selection.$from.parent.textContent
        : '');
    // Async Cherry menus (image/file/formula/chart pickers) must resolve
    // against the selection that opened them. If the document changed while
    // the picker was open, skip the stale result instead of inserting it at a
    // newer, unrelated caret position.
    const savedSelection = view.state.selection;
    const savedDocument = view.state.doc;
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
        if (typeof value === 'string' && value !== selection) {
          if (view.state.doc !== savedDocument) return;
          const transaction = view.state.tr.setSelection(savedSelection.map(view.state.tr.doc, view.state.tr.mapping));
          view.dispatch(transaction);
          const blockCommand = CHERRY_LINE_TRANSFORM_COMMANDS.has(command.name);
          insertMarkdown(value, false, blockCommand);
        }
      });
      return true;
    }
    if (typeof result === 'string' && result !== selection) {
      const blockCommand = CHERRY_LINE_TRANSFORM_COMMANDS.has(command.name);
      insertMarkdown(result, false, blockCommand);
    }
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
      case 'ol':
      case 'checklist':
        // Cherry's list hooks provide the standard empty-selection template
        // and preserve nested list indentation. Running the native Milkdown
        // wrap command here would create only an empty `1.`/`-` item and make
        // the preview diverge from Cherry's toolbar behavior.
        return runCherryTransform(command);
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
        // Custom menus are intentionally not enumerated here: applications
        // may register arbitrary names.  Cherry marks document-producing
        // menus with updateMarkdown=true, so unknown commands can safely use
        // the transform bridge while global UI menus remain on Cherry.
        {
          const menu = command.menu as CherryMenuLike | undefined;
          if (
            TRANSFORMED_MARKDOWN_COMMANDS.has(command.name) ||
            (menu?.updateMarkdown !== false && !KNOWN_NON_TRANSFORM_COMMANDS.has(command.name))
          ) {
            return runCherryTransform(command);
          }
          return false;
        }
    }
  };

  const queryCommandState = (command: CherryToolbarCommand) => {
    const { $from } = view.state.selection;
    const { parent } = $from;
    if (command.name === 'header') {
      const level = parent.type.name === 'heading' ? Number(parent.attrs.level) : 0;
      return {
        active: level > 0,
        enabled: true,
        value: level,
        subMenuIndex: level >= 1 && level <= 6 ? level - 1 : -1,
      };
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
    const markNames: Record<string, string> = {
      bold: 'strong',
      italic: 'emphasis',
      strikethrough: 'strike_through',
      inlineCode: 'inlineCode',
      underline: 'cherry_underline',
      sub: 'cherry_subscript',
      sup: 'cherry_superscript',
    };
    const markName = markNames[command.name];
    if (markName) {
      const mark = view.state.schema.marks[markName];
      return { active: Boolean(mark?.isInSet(parent.marks)), enabled: Boolean(mark) && view.editable };
    }
    return { active: false, enabled: view.editable };
  };

  return {
    isActive,
    // Milkdown owns the preview DOM, so map its top-level nodes back to the
    // serialized Markdown instead of using Cherry's native data-lines mapper.
    handleScroll: (container) => {
      if (!isActive()) return true;
      const containerTop = container.getBoundingClientRect().top;
      const blocks = scrollBlocks();
      let current = blocks[0];
      for (const block of blocks) {
        if (block.element.getBoundingClientRect().top > containerTop + 1) break;
        current = block;
      }
      if (!current) return true;
      const rect = current.element.getBoundingClientRect();
      const percent = rect.height > 0 ? Math.max(0, Math.min(1, (containerTop - rect.top) / rect.height)) : 0;
      scrollEditorToBlock(current, percent);
      return true;
    },
    handleEditorScroll: (lineNum, linePercent) => {
      // While the preview owns focus, CodeMirror scroll events are echoes of
      // the preview-to-source synchronization and must not pull it back.
      if (!isActive()) scrollPreviewToLine(lineNum, linePercent);
      return true;
    },
    queryCommandState,
    runCommand,
    insert: (content, options) => insertMarkdown(content, options.select),
    ownsPreviewElement: (target, kind) => {
      let position: number;
      try {
        position = view.posAtDOM(target, 0);
      } catch {
        return false;
      }
      const node = view.state.doc.nodeAt(position);
      if (!node) return false;
      if (kind === 'image') return target instanceof HTMLImageElement && node.type.name === 'image';
      return node.type.name === 'cherry_diagram' && node.attrs.diagramType === 'mermaid';
    },
    updatePreviewElement: (target, change) => {
      const { kind, ...presentation } = change;
      if (kind === 'image') {
        return target instanceof HTMLImageElement ? updateImage(target, presentation) : false;
      }
      return target instanceof HTMLElement ? updateMermaid(target, presentation) : false;
    },
    destroy() {
      view.dom.removeEventListener('focusin', rememberPreview);
      view.dom.removeEventListener('pointerdown', activatePreview, true);
      view.dom.removeEventListener('click', syncAnchorNavigation, true);
      sourceDom?.removeEventListener('pointerdown', deactivatePreviewFromSource, true);
    },
  };
}
