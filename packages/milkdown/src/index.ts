import { defaultValueCtx, Editor, editorViewCtx, editorViewOptionsCtx, rootCtx } from '@milkdown/kit/core';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { history } from '@milkdown/kit/plugin/history';
import { indent } from '@milkdown/kit/plugin/indent';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { getMarkdown, replaceAll } from '@milkdown/kit/utils';
import { math } from '@milkdown/plugin-math';
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import type { CherryMilkdownInstance, CherryMilkdownOptions } from './types.js';
import { cherryWysiwyg, cherryWysiwygConfigCtx } from './wysiwyg/index.js';

const DEFAULT_DEBOUNCE = 30;

function assertRoot(root: HTMLElement): void {
  if (!(root instanceof HTMLElement)) throw new TypeError('createCherryMilkdown: options.root must be an HTMLElement.');
}

export async function createCherryMilkdown(options: CherryMilkdownOptions): Promise<CherryMilkdownInstance> {
  const { root } = options;
  assertRoot(root);
  const debounce = Math.max(0, options.debounce ?? DEFAULT_DEBOUNCE);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  let engine: InstanceType<typeof CherryEngine>;

  try {
    engine = new CherryEngine(options.cherryOptions);
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
        renderers: options.renderers,
        onError: options.onError,
      });
      ctx.update(editorViewOptionsCtx, (previous) => ({
        ...previous,
        editable: () => !options.readonly,
      }));
      ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, previousMarkdown) => {
        if (markdown !== previousMarkdown) scheduleChange(markdown);
      });
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(clipboard)
    .use(cursor)
    .use(indent)
    .use(trailing)
    .use(math)
    .use(listener)
    .use(cherryWysiwyg);

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
    setMarkdown(markdown) {
      if (destroyed) return;
      try {
        editor.action(replaceAll(markdown, true));
        scheduleChange(editor.action(getMarkdown()));
      } catch (error) {
        options.onError?.(error, 'parse');
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
  CherryEngineLike,
  CherryMilkdownChange,
  CherryMilkdownErrorPhase,
  CherryMilkdownInstance,
  CherryMilkdownOptions,
  CherryVisualRenderer,
  CherryVisualRenderContext,
  CherryVisualRendererResult,
} from './types.js';
export { cherryWysiwyg } from './wysiwyg/index.js';
