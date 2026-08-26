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
import { NodeSelection, Plugin, TextSelection, type Selection } from '@milkdown/kit/prose/state';
import { $prose, getMarkdown } from '@milkdown/kit/utils';
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import type { CherryMilkdownInstance, CherryMilkdownOptions } from './types.js';
import { cherryWysiwyg, cherryWysiwygConfigCtx } from './wysiwyg/index.js';

const DEFAULT_DEBOUNCE = 30;

function assertRoot(root: HTMLElement): void {
  if (!(root instanceof HTMLElement)) throw new TypeError('createCherryMilkdown: options.root must be an HTMLElement.');
}

function restoreSelection(editor: Editor, previous: Selection, selectedText: string): void {
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { doc } = view.state;
    let next: Selection | undefined;

    if (previous instanceof NodeSelection) {
      let nearest: { distance: number; position: number } | undefined;
      doc.descendants((node, position) => {
        if (node.type.name !== previous.node.type.name) return;
        const distance = Math.abs(position - previous.from);
        if (!nearest || distance < nearest.distance) nearest = { distance, position };
      });
      if (nearest) next = NodeSelection.create(doc, nearest.position);
    } else if (selectedText) {
      let nearest: { distance: number; from: number; to: number } | undefined;
      doc.descendants((node, position) => {
        if (!node.isText || !node.text) return;
        let offset = node.text.indexOf(selectedText);
        while (offset >= 0) {
          const from = position + offset;
          const distance = Math.abs(from - previous.from);
          if (!nearest || distance < nearest.distance) {
            nearest = { distance, from, to: from + selectedText.length };
          }
          offset = node.text.indexOf(selectedText, offset + 1);
        }
      });
      if (nearest) next = TextSelection.create(doc, nearest.from, nearest.to);
    }

    if (!next) {
      const anchor = Math.min(Math.max(previous.anchor, 0), doc.content.size);
      const head = Math.min(Math.max(previous.head, 0), doc.content.size);
      next = TextSelection.between(doc.resolve(anchor), doc.resolve(head));
    }
    view.dispatch(view.state.tr.setSelection(next));
  });
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
    view.dispatch(view.state.tr.replace(from, to, nextDocument.slice(from, nextTo)));
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
  }
  return next;
}

export async function createCherryMilkdown(options: CherryMilkdownOptions): Promise<CherryMilkdownInstance> {
  const { root } = options;
  assertRoot(root);
  const debounce = Math.max(0, options.debounce ?? DEFAULT_DEBOUNCE);
  let notificationTimer: ReturnType<typeof setTimeout> | undefined;
  let changeMicrotaskQueued = false;
  let destroyed = false;
  let suppressChanges = false;
  let acceptingChanges = false;
  let engine: CherryMilkdownInstance['engine'];
  let currentMarkdown = options.value ?? '';
  let serializedBaseline = '';

  // Cherry's preview already supplies the native visual shell. The floating
  // Milkdown components are useful for standalone consumers, but mounting them
  // for every table, image, link and code block in the full manual adds a large
  // amount of DOM and event work before the user edits anything.
  const interactiveComponents = options.nativePreview
    ? undefined
    : await Promise.all([
        import('@milkdown/kit/component/table-block'),
        import('@milkdown/kit/component/code-block'),
        import('@milkdown/kit/component/image-inline'),
        import('@milkdown/kit/component/link-tooltip'),
      ]);

  try {
    engine = options.engine ?? new CherryEngine(options.cherryOptions);
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
    changeMicrotaskQueued = false;
    if (destroyed || suppressChanges) return;
    try {
      const serialized = editor.action(getMarkdown());
      currentMarkdown = reconcileSerializedMarkdown(currentMarkdown, serializedBaseline, serialized);
      serializedBaseline = serialized;
      const markdown = currentMarkdown;
      options.onImmediateChange?.({ markdown });
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

  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, options.value ?? '');
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
      if (interactiveComponents) {
        ctx.set(interactiveComponents[0].tableBlockConfig.key, {
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
      }
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
    .use(immediateChangePlugin)
    .use(cherryWysiwyg);

  if (interactiveComponents) {
    editor
      .use(interactiveComponents[0].tableBlock)
      .use(interactiveComponents[1].codeBlockComponent)
      .use(interactiveComponents[2].imageInlineComponent)
      .use(interactiveComponents[3].linkTooltipPlugin);
  }

  for (const plugin of options.plugins ?? []) editor.use(plugin);

  try {
    await editor.create();
  } catch (error) {
    options.onError?.(error, 'create');
    throw error;
  }
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const last = view.state.doc.lastChild;
    if (!last || ['heading', 'paragraph'].includes(last.type.name)) return;
    const paragraph = view.state.schema.nodes.paragraph;
    if (paragraph) view.dispatch(view.state.tr.insert(view.state.doc.content.size, paragraph.create()));
  });
  serializedBaseline = editor.action(getMarkdown());
  acceptingChanges = true;

  root.classList.add('cherry-milkdown');

  return {
    editor,
    engine,
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
      try {
        suppressChanges = true;
        currentMarkdown = markdown;
        const previous = editor.action((ctx) => ctx.get(editorViewCtx).state.selection);
        const selectedText = editor.action((ctx) => {
          const { doc } = ctx.get(editorViewCtx).state;
          return previous.empty ? '' : doc.textBetween(previous.from, previous.to, '\n', '\n');
        });
        replaceMarkdownWithMinimalTransaction(editor, markdown);
        restoreSelection(editor, previous, selectedText);
        serializedBaseline = editor.action(getMarkdown());
      } catch (error) {
        options.onError?.(error, 'parse');
      } finally {
        suppressChanges = false;
      }
      if (setOptions.emit !== false) {
        options.onImmediateChange?.({ markdown: currentMarkdown });
        scheduleNotification(currentMarkdown);
      }
    },
    focus() {
      if (!destroyed) editor.action((ctx) => ctx.get(editorViewCtx).focus());
    },
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      if (notificationTimer) clearTimeout(notificationTimer);
      notificationTimer = undefined;
      await editor.destroy();
      root.classList.remove('cherry-milkdown');
      root.replaceChildren();
    },
  };
}

export type {
  CherryMilkdownHost,
  CherryEngineLike,
  CherryDiagramRenderContext,
  CherryMilkdownChange,
  CherryMilkdownErrorPhase,
  CherryMilkdownInstance,
  CherryMilkdownMathliveOptions,
  CherryMilkdownOptions,
  CherryMilkdownPreviewInstance,
  CherryMilkdownPreviewOptions,
  CherryPreviewContentRenderer,
  CherryPreviewContentRendererContext,
  CherryPreviewEditingBridge,
  CherryPreviewerHost,
  CherrySearchAdapter,
  CherryUpdateContext,
  CherryVisualRenderer,
  CherryVisualRenderContext,
  CherryVisualRendererResult,
} from './types.js';
export { attachCherryMilkdownPreview, milkdown } from './previewer.js';
export { cherryCompatibilityCases } from './compatibility.js';
export type { CherryCompatibilityCase, CherryCompatibilityMode } from './compatibility.js';
export { cherryWysiwyg } from './wysiwyg/index.js';
