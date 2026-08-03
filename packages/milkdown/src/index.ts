import { defaultValueCtx, Editor, editorViewCtx, editorViewOptionsCtx, rootCtx } from '@milkdown/kit/core';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { getMarkdown, replaceAll } from '@milkdown/kit/utils';
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import { cherryRaw, cherryRawConfigCtx, createCherryRawDialog } from './raw/index.js';
import type { CherryMilkdownInstance, CherryMilkdownOptions } from './types.js';

const DEFAULT_DEBOUNCE = 30;

function assertRoot(root: HTMLElement): void {
  if (!(root instanceof HTMLElement)) throw new TypeError('createCherryMilkdown: options.root must be an HTMLElement.');
}

export async function createCherryMilkdown(options: CherryMilkdownOptions): Promise<CherryMilkdownInstance> {
  const { root, previewRoot } = options;
  assertRoot(root);
  const debounce = Math.max(0, options.debounce ?? DEFAULT_DEBOUNCE);
  const dialog = createCherryRawDialog(root);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  let lastHtml = previewRoot?.innerHTML ?? '';
  let engine: InstanceType<typeof CherryEngine>;

  try {
    engine = new CherryEngine(options.cherryOptions);
  } catch (error) {
    dialog.destroy();
    options.onError?.(error, 'create');
    throw error;
  }

  const render = (markdown: string, notify: boolean) => {
    try {
      const html = engine.makeHtml(markdown);
      lastHtml = html;
      if (previewRoot) previewRoot.innerHTML = html;
      if (notify) options.onChange?.({ markdown, html });
      return html;
    } catch (error) {
      options.onError?.(error, 'render');
      return lastHtml;
    }
  };

  const scheduleRender = (markdown: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (!destroyed) render(markdown, true);
    }, debounce);
  };

  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, options.value ?? '');
      ctx.set(cherryRawConfigCtx.key, {
        patterns: options.rawPatterns ?? [],
        editSource: options.readonly ? undefined : dialog.open,
      });
      ctx.update(editorViewOptionsCtx, (previous) => ({
        ...previous,
        editable: () => !options.readonly,
      }));
      ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, previousMarkdown) => {
        if (markdown !== previousMarkdown) scheduleRender(markdown);
      });
    })
    .use(commonmark)
    .use(gfm)
    .use(listener)
    .use(cherryRaw);

  for (const plugin of options.plugins ?? []) editor.use(plugin);

  try {
    await editor.create();
  } catch (error) {
    dialog.destroy();
    options.onError?.(error, 'create');
    throw error;
  }

  root.classList.add('cherry-milkdown');
  previewRoot?.classList.add('cherry-milkdown-preview');
  render(editor.action(getMarkdown()), false);

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
        scheduleRender(editor.action(getMarkdown()));
      } catch (error) {
        options.onError?.(error, 'parse');
      }
    },
    renderPreview() {
      return render(editor.action(getMarkdown()), false);
    },
    focus() {
      if (!destroyed) editor.action((ctx) => ctx.get(editorViewCtx).focus());
    },
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      if (timer) clearTimeout(timer);
      timer = undefined;
      dialog.destroy();
      await editor.destroy();
      root.classList.remove('cherry-milkdown');
      root.replaceChildren();
      if (previewRoot) {
        previewRoot.classList.remove('cherry-milkdown-preview');
        previewRoot.replaceChildren();
      }
    },
  };
}

export type {
  CherryEngineLike,
  CherryMilkdownChange,
  CherryMilkdownErrorPhase,
  CherryMilkdownInstance,
  CherryMilkdownOptions,
} from './types.js';
export type { CherryRawPattern } from './raw/index.js';
