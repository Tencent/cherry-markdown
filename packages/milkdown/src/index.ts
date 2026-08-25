import { defaultValueCtx, Editor, editorViewCtx, editorViewOptionsCtx, rootCtx } from '@milkdown/kit/core';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { history } from '@milkdown/kit/plugin/history';
import { indent } from '@milkdown/kit/plugin/indent';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { NodeSelection, TextSelection, type Selection } from '@milkdown/kit/prose/state';
import { getMarkdown, replaceAll } from '@milkdown/kit/utils';
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

export async function createCherryMilkdown(options: CherryMilkdownOptions): Promise<CherryMilkdownInstance> {
  const { root } = options;
  assertRoot(root);
  const debounce = Math.max(0, options.debounce ?? DEFAULT_DEBOUNCE);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  let suppressChanges = false;
  let engine: CherryMilkdownInstance['engine'];

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

  const scheduleChange = (markdown: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (!destroyed) options.onChange?.({ markdown });
    }, debounce);
  };

  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, options.value ?? '');
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
      ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, previousMarkdown) => {
        if (!suppressChanges && markdown !== previousMarkdown) scheduleChange(markdown);
      });
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(clipboard)
    .use(cursor)
    .use(indent)
    .use(trailing)
    .use(listener)
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

  root.classList.add('cherry-milkdown');

  return {
    editor,
    engine,
    getMarkdown() {
      return editor.action(getMarkdown());
    },
    setMarkdown(markdown, setOptions = {}) {
      if (destroyed) return;
      try {
        suppressChanges = setOptions.emit === false;
        const previous = editor.action((ctx) => ctx.get(editorViewCtx).state.selection);
        const selectedText = editor.action((ctx) => {
          const { doc } = ctx.get(editorViewCtx).state;
          return previous.empty ? '' : doc.textBetween(previous.from, previous.to, '\n', '\n');
        });
        editor.action(replaceAll(markdown, false));
        restoreSelection(editor, previous, selectedText);
        if (!suppressChanges) scheduleChange(editor.action(getMarkdown()));
      } catch (error) {
        options.onError?.(error, 'parse');
      } finally {
        suppressChanges = false;
      }
    },
    focus() {
      if (!destroyed) editor.action((ctx) => ctx.get(editorViewCtx).focus());
    },
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      if (timer) clearTimeout(timer);
      timer = undefined;
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
  CherryVisualRenderer,
  CherryVisualRenderContext,
  CherryVisualRendererResult,
} from './types.js';
export { attachCherryMilkdownPreview, milkdown } from './previewer.js';
export { cherryWysiwyg } from './wysiwyg/index.js';
