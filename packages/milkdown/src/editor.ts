import {
  defaultValueCtx,
  Editor,
  editorViewCtx,
  editorViewOptionsCtx,
  parserCtx,
  remarkStringifyOptionsCtx,
  rootCtx,
} from '@milkdown/kit/core';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { history } from '@milkdown/kit/plugin/history';
import { indent } from '@milkdown/kit/plugin/indent';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { Plugin, TextSelection } from '@milkdown/kit/prose/state';
import { $prose, getMarkdown } from '@milkdown/kit/utils';
import type { CherryMilkdownHost, CherryMilkdownInstance, CherryMilkdownPluginOptions } from './types.js';
import { connectNativeCherryControls } from './native-bridge.js';
import { createSelectionTracker } from './selection-tracker.js';
import { loadCodeLanguages } from './wysiwyg/code-block.js';
import { cherryWysiwyg, cherryWysiwygConfigCtx } from './wysiwyg/index.js';

const DEFAULT_DEBOUNCE = 30;

function assertRoot(root: HTMLElement): void {
  if (!(root instanceof HTMLElement)) throw new TypeError('MilkdownPlugin requires a Cherry preview HTMLElement.');
}

function replaceMarkdownWithMinimalTransaction(editor: Editor, markdown: string): void {
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const nextDocument = ctx.get(parserCtx)(markdown);
    if (!nextDocument) return;
    const currentContent = view.state.doc.content;
    const nextContent = nextDocument.content;
    const from = currentContent.findDiffStart(nextContent);
    if (from === null) return;
    let { a: to, b: nextTo } = currentContent.findDiffEnd(nextContent) ?? {
      a: currentContent.size,
      b: nextContent.size,
    };

    // Repeated text can make the end diff cross the start diff. Expand the
    // shorter side to a valid replace range while retaining the smallest edit.
    if (to < from && currentContent.size < nextContent.size) {
      nextTo = from + (nextTo - to);
      to = from;
    } else if (nextTo < from) {
      to = from + (to - nextTo);
      nextTo = from;
    }
    // The replace transaction maps both the live caret and saved selections.
    // Restoring absolute offsets afterwards would undo that mapping.
    view.dispatch(view.state.tr.replace(from, to, nextDocument.slice(from, nextTo)).setMeta('addToHistory', false));
  });
}

function reconcileSerializedMarkdown(raw: string, previous: string, next: string): string {
  if (previous === next) return raw;
  if (raw === previous) return next;

  let from = 0;
  const sharedLength = Math.min(previous.length, next.length);
  while (from < sharedLength && previous[from] === next[from]) from += 1;
  let suffix = 0;
  while (
    suffix < previous.length - from &&
    suffix < next.length - from &&
    previous[previous.length - suffix - 1] === next[next.length - suffix - 1]
  ) {
    suffix += 1;
  }

  const previousTo = previous.length - suffix;
  const nextTo = next.length - suffix;
  const changedBefore = previous.slice(from, previousTo);
  const changedAfter = next.slice(from, nextTo);
  for (const contextLength of [128, 96, 64, 48, 32, 24, 16, 8]) {
    const left = previous.slice(Math.max(0, from - contextLength), from);
    const right = previous.slice(previousTo, previousTo + contextLength);
    const needle = `${left}${changedBefore}${right}`;
    if (!needle) continue;
    const index = raw.indexOf(needle);
    if (index < 0 || raw.indexOf(needle, index + 1) >= 0) continue;
    return `${raw.slice(0, index)}${left}${changedAfter}${right}${raw.slice(index + needle.length)}`;
  }

  if (changedBefore) {
    const index = raw.indexOf(changedBefore);
    if (index >= 0 && raw.indexOf(changedBefore, index + 1) < 0) {
      return `${raw.slice(0, index)}${changedAfter}${raw.slice(index + changedBefore.length)}`;
    }

    // Serializer-only differences (for example an original `*` list marker
    // normalized to `-`) can make the surrounding context unavailable. Map
    // the edited occurrence by ordinal instead of replacing the whole
    // document and losing untouched Cherry/raw formatting. Ambiguous mappings
    // still fall back to the canonical serializer below.
    let occurrence = 0;
    let cursor = 0;
    while (cursor < from) {
      const found = previous.indexOf(changedBefore, cursor);
      if (found < 0 || found >= from) break;
      occurrence += 1;
      cursor = found + Math.max(1, changedBefore.length);
    }
    let rawIndex = -1;
    cursor = 0;
    for (let index = 0; index <= occurrence; index += 1) {
      rawIndex = raw.indexOf(changedBefore, cursor);
      if (rawIndex < 0) break;
      cursor = rawIndex + Math.max(1, changedBefore.length);
    }
    if (rawIndex >= 0) {
      return `${raw.slice(0, rawIndex)}${changedAfter}${raw.slice(rawIndex + changedBefore.length)}`;
    }
  }
  return next;
}

interface MountLifecycle {
  onDocumentChange?(markdown: string): void;
  shouldCommit?(): boolean;
}

export async function mountCherryMilkdown(
  cherry: CherryMilkdownHost,
  options: CherryMilkdownPluginOptions & {
    value: string;
    engine: CherryMilkdownInstance['engine'];
  },
  lifecycle: MountLifecycle = {},
): Promise<CherryMilkdownInstance> {
  const previewer = cherry.getPreviewer();
  const root = previewer.getDomContainer();
  assertRoot(root);
  // Build away from the live preview. Native Cherry HTML stays visible until
  // Milkdown is ready, then the new editor DOM is swapped in atomically.
  const mountRoot = root.ownerDocument.createElement('div');
  mountRoot.classList.add('cherry-milkdown');
  const debounce = Math.max(0, options.debounce ?? DEFAULT_DEBOUNCE);
  let notificationTimer: ReturnType<typeof setTimeout> | undefined;
  let changeMicrotaskQueued = false;
  let destroyed = false;
  let suppressChanges = false;
  let acceptingChanges = false;
  let engine: CherryMilkdownInstance['engine'];
  let disconnectNativeControls: (() => void) | undefined;
  let refreshNativeSelection = () => {};
  let currentMarkdown = options.value ?? cherry.getMarkdown();
  let serializedBaseline = '';
  const selectionTracker = createSelectionTracker();

  let tableBlockComponent: typeof import('@milkdown/kit/component/table-block');

  try {
    tableBlockComponent = await import('@milkdown/kit/component/table-block');
    await loadCodeLanguages();
    // Cherry's generated declaration keeps the optional object return mode in
    // `makeHtml`, while this integration always calls its default string mode.
    engine = options.engine ?? (cherry.engine as unknown as CherryMilkdownInstance['engine']);
  } catch (error) {
    options.onError?.(error, 'create');
    throw error;
  }

  const scheduleNotification = (markdown: string) => {
    if (notificationTimer) clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => {
      notificationTimer = undefined;
      if (!destroyed) options.onChange?.({ markdown });
    }, debounce);
  };

  const flushDocumentChange = () => {
    if (!changeMicrotaskQueued) return;
    changeMicrotaskQueued = false;
    if (destroyed || suppressChanges) return;
    try {
      const serialized = editor.action(getMarkdown());
      currentMarkdown = reconcileSerializedMarkdown(currentMarkdown, serializedBaseline, serialized);
      serializedBaseline = serialized;
      const markdown = currentMarkdown;
      lifecycle.onDocumentChange?.(markdown);
      scheduleNotification(markdown);
    } catch (error) {
      options.onError?.(error, 'parse');
    }
  };

  const immediateChangePlugin = $prose(
    () =>
      new Plugin({
        state: {
          init: () => null,
          apply: (transaction) => {
            if (
              transaction.docChanged &&
              acceptingChanges &&
              !suppressChanges &&
              !destroyed &&
              !changeMicrotaskQueued
            ) {
              changeMicrotaskQueued = true;
              queueMicrotask(flushDocumentChange);
            }
            return null;
          },
        },
      }),
  );

  const tablePointerSelectionPlugin = $prose(
    () =>
      new Plugin({
        view: (view) => {
          const selectCellAtPointer = (event: PointerEvent) => {
            const { target } = event;
            if (!(target instanceof Element) || !target.closest('.milkdown-table-block td, .milkdown-table-block th')) {
              return;
            }
            const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!position) return;
            const selection = TextSelection.near(view.state.doc.resolve(position.pos));
            if (!view.state.selection.eq(selection)) {
              view.dispatch(view.state.tr.setSelection(selection));
            }
          };
          view.dom.addEventListener('pointerdown', selectCellAtPointer, true);
          return {
            destroy: () => view.dom.removeEventListener('pointerdown', selectCellAtPointer, true),
          };
        },
      }),
  );

  const nativeSelectionPlugin = $prose(
    () =>
      new Plugin({
        view: () => ({
          update: (view, previousState) => {
            if (!view.state.selection.eq(previousState.selection)) refreshNativeSelection();
          },
        }),
      }),
  );

  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, mountRoot);
      ctx.set(defaultValueCtx, currentMarkdown);
      ctx.update(remarkStringifyOptionsCtx, (previous) => ({
        ...previous,
        bullet: '-' as const,
        bulletOther: '*' as const,
        rule: '-' as const,
        fences: true,
      }));
      ctx.set(cherryWysiwygConfigCtx.key, {
        engine,
        readonly: Boolean(options.readonly),
        debounce,
        mathlive: options.mathlive,
        renderers: options.renderers,
        onError: options.onError,
      });
      ctx.set(tableBlockComponent.tableBlockConfig.key, {
        renderButton: (type) => {
          const icons = {
            add_row: '+',
            add_col: '+',
            delete_row: '×',
            delete_col: '×',
            align_col_left: '⇤',
            align_col_center: '↔',
            align_col_right: '⇥',
            col_drag_handle: '⠿',
            row_drag_handle: '⠿',
          } as const;
          return icons[type];
        },
      });
      ctx.update(editorViewOptionsCtx, (previous) => ({
        ...previous,
        editable: () => !options.readonly,
      }));
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(clipboard)
    .use(cursor)
    .use(indent)
    .use(trailing)
    .use(selectionTracker.plugin)
    .use(immediateChangePlugin)
    .use(tablePointerSelectionPlugin)
    .use(nativeSelectionPlugin)
    .use(cherryWysiwyg);

  editor.use(tableBlockComponent.tableBlock);

  for (const plugin of options.plugins ?? []) editor.use(plugin);

  try {
    await editor.create();
  } catch (error) {
    await editor.destroy().catch(() => {});
    options.onError?.(error, 'create');
    throw error;
  }
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const last = view.state.doc.lastChild;
    if (!last || ['heading', 'paragraph'].includes(last.type.name)) return;
    const { paragraph } = view.state.schema.nodes;
    if (paragraph) view.dispatch(view.state.tr.insert(view.state.doc.content.size, paragraph.create()));
  });
  serializedBaseline = editor.action(getMarkdown());
  acceptingChanges = true;

  if (lifecycle.shouldCommit?.() !== false) {
    root.replaceChildren(...mountRoot.childNodes);
    root.classList.add('cherry-milkdown');
    // Milkdown plugins that read rootCtx after creation must observe the live
    // Cherry content container rather than the now-empty staging element.
    editor.action((ctx) => ctx.set(rootCtx, root));
  }

  const instance: CherryMilkdownInstance = {
    editor,
    engine,
    trackSelection() {
      return selectionTracker.track(editor.action((ctx) => ctx.get(editorViewCtx).state.selection));
    },
    getMarkdown() {
      if (changeMicrotaskQueued && !suppressChanges && !destroyed) {
        const serialized = editor.action(getMarkdown());
        currentMarkdown = reconcileSerializedMarkdown(currentMarkdown, serializedBaseline, serialized);
        serializedBaseline = serialized;
      }
      return currentMarkdown;
    },
    setMarkdown(markdown, setOptions = {}) {
      if (destroyed) return;
      changeMicrotaskQueued = false;
      if (notificationTimer) clearTimeout(notificationTimer);
      notificationTimer = undefined;
      try {
        suppressChanges = true;
        replaceMarkdownWithMinimalTransaction(editor, markdown);
        currentMarkdown = markdown;
        serializedBaseline = editor.action(getMarkdown());
      } catch (error) {
        options.onError?.(error, 'parse');
      } finally {
        suppressChanges = false;
      }
      if (setOptions.emit !== false) scheduleNotification(currentMarkdown);
    },
    focus() {
      if (!destroyed) editor.action((ctx) => ctx.get(editorViewCtx).focus());
    },
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      if (notificationTimer) clearTimeout(notificationTimer);
      notificationTimer = undefined;
      disconnectNativeControls?.();
      disconnectNativeControls = undefined;
      try {
        await editor.destroy();
      } finally {
        root.classList.remove('cherry-milkdown');
      }
    },
  };
  if (options.bubble !== false && !options.readonly) {
    disconnectNativeControls = connectNativeCherryControls(
      cherry as unknown as Parameters<typeof connectNativeCherryControls>[0],
      instance,
      (listener) => {
        refreshNativeSelection = listener;
        return () => {
          refreshNativeSelection = () => {};
        };
      },
    );
  }

  return instance;
}
