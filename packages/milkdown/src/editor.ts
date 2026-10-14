import {
  defaultValueCtx,
  Editor,
  editorViewCtx,
  editorViewOptionsCtx,
  parserCtx,
  remarkStringifyOptionsCtx,
  rootCtx,
  serializerCtx,
} from '@milkdown/kit/core';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { history } from '@milkdown/kit/plugin/history';
import { indent } from '@milkdown/kit/plugin/indent';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import type { Node as ProseMirrorNode } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import { $prose, getMarkdown } from '@milkdown/kit/utils';
import CherryEngine from './cherry-engine.js';
import { reconcileSerializedMarkdown } from './markdown-reconcile.js';
import type {
  CherryEngineInput,
  CherryEngineLike,
  CherryMilkdownInstance,
  CherryMilkdownOptions,
  CherryMilkdownTheme,
} from './types.js';
import { cherryWysiwyg, cherryWysiwygConfigCtx } from './wysiwyg/index.js';
import { TableChartDescriptorEngine } from './wysiwyg/table-chart-render-engine.js';
import { cherryTableFocusPlugin } from './wysiwyg/table-focus.js';
import { CHERRY_THEME_CHANGE } from './wysiwyg/theme.js';
import { createCompositionGate } from './composition-gate.js';
import {
  createDocumentUpdate,
  createEditableTail,
  EXTERNAL_MARKDOWN_UPDATE,
  rebaseCompositionUpdate,
  withEditableTail,
} from './document-update.js';

const DEFAULT_DEBOUNCE = 30;
const CHERRY_THEMES = ['default', 'dark', 'abyss', 'green', 'red', 'gray', 'violet', 'blue'] as const;
const CHERRY_THEME_CLASSES = CHERRY_THEMES.map((theme) => `theme__${theme}`);
const internalEditors = new WeakMap<CherryMilkdownInstance, Editor>();

/** @internal Test support; intentionally excluded from the package entrypoint. */
export function getInternalEditor(instance: CherryMilkdownInstance): Editor {
  const editor = internalEditors.get(instance);
  if (!editor) throw new Error('The Cherry Milkdown instance is not active.');
  return editor;
}

function normalizeTheme(theme: unknown): CherryMilkdownTheme {
  return CHERRY_THEMES.includes(theme as CherryMilkdownTheme) ? (theme as CherryMilkdownTheme) : 'default';
}

function requireCherryEngine(engine: CherryEngineInput): CherryEngineLike {
  if (!engine || typeof (engine as Partial<CherryEngineLike>).makeHtml !== 'function') {
    throw new TypeError('cherryMilkdown requires an engine with makeHtml(markdown).');
  }
  return engine as CherryEngineLike;
}

function resolveRoot(root: string | HTMLElement): HTMLElement {
  const resolved = typeof root === 'string' ? document.querySelector(root) : root;
  if (!(resolved instanceof HTMLElement)) throw new TypeError('cherryMilkdown requires a valid root HTMLElement.');
  return resolved;
}

export async function cherryMilkdown(options: CherryMilkdownOptions): Promise<CherryMilkdownInstance> {
  const root = resolveRoot(options.root);
  let currentTheme = normalizeTheme(options.theme);
  // Build away from the live host, then swap the editor DOM in atomically.
  const mountRoot = root.ownerDocument.createElement('div');
  // Cherry's published Bubble and Markdown tokens are scoped by a theme
  // class. Keep the same scope on the standalone host so contextual
  // Milkdown controls inherit the exact Cherry theme without demo CSS.
  // Mirror Cherry's toolbar-free preview layout state. In particular,
  // `.cherry-previewer` defaults to the 50% split-view width, while the
  // native `--full` modifier below makes this standalone editor occupy the
  // complete host without introducing a Milkdown-only width override.
  mountRoot.classList.add('cherry', 'cherry--no-toolbar', `theme__${currentTheme}`, 'cherry-milkdown');
  const debounce = Math.max(0, options.debounce ?? DEFAULT_DEBOUNCE);
  let notificationTimer: ReturnType<typeof setTimeout> | undefined;
  let changeMicrotaskQueued = false;
  let destroyed = false;
  let suppressChanges = false;
  let acceptingChanges = false;
  let documentRevision = 0;
  let engine: CherryEngineLike;
  let nativeEngine: CherryEngineLike | undefined;
  let currentMarkdown = options.value ?? '';
  let serializedBaseline = '';

  let tableBlockComponent: typeof import('@milkdown/kit/component/table-block');

  try {
    tableBlockComponent = await import('@milkdown/kit/component/table-block');
    // CherryEngine is the only Cherry runtime used by this standalone editor.
    // It contributes Markdown semantics and HTML presentation, not an editor,
    // Previewer, Bubble or mode lifecycle.
    engine = requireCherryEngine(options.engine ?? new CherryEngine(options.engineOptions ?? {}));
    if (!options.engine && options.renderers?.tableChart) {
      const configuredEngine = (options.engineOptions?.engine ?? {}) as Record<string, unknown>;
      const configuredSyntax = (configuredEngine.syntax ?? {}) as Record<string, unknown>;
      const configuredTable = (configuredSyntax.table ?? {}) as Record<string, unknown>;
      nativeEngine = requireCherryEngine(
        new CherryEngine({
          ...options.engineOptions,
          engine: {
            ...configuredEngine,
            syntax: {
              ...configuredSyntax,
              table: {
                ...configuredTable,
                enableChart: true,
                chartRenderEngine: TableChartDescriptorEngine,
              },
            },
          },
        }),
      );
    }
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
      currentMarkdown = reconcileMarkdown(serialized);
      serializedBaseline = serialized;
      const markdown = currentMarkdown;
      scheduleNotification(markdown);
    } catch (error) {
      options.onError?.(error, 'parse');
    }
  };

  const reconcileMarkdown = (serialized: string, raw = currentMarkdown, previous = serializedBaseline) =>
    editor.action((ctx) => {
      const parser = ctx.get(parserCtx);
      const serialize = ctx.get(serializerCtx);
      return reconcileSerializedMarkdown(raw, previous, serialized, (candidate) => {
        try {
          const parsed = parser(candidate);
          // Compare the serializer's semantics, not schema bookkeeping (e.g.
          // original list markers or the editor-only trailing empty paragraph).
          return Boolean(parsed && serialize(parsed).trimEnd() === serialized.trimEnd());
        } catch {
          return false;
        }
      });
    });

  const immediateChangePlugin = $prose(
    () =>
      new Plugin({
        state: {
          init: () => null,
          apply: (transaction) => {
            if (transaction.docChanged && acceptingChanges && !suppressChanges && !destroyed) {
              documentRevision += 1;
              if (!changeMicrotaskQueued) {
                changeMicrotaskQueued = true;
                queueMicrotask(flushDocumentChange);
              }
            }
            return null;
          },
        },
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
        nativeEngine,
        readonly: Boolean(options.readonly),
        bubble: options.bubble !== false,
        debounce,
        mathlive: options.mathlive,
        fileUpload: options.fileUpload,
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
        attributes: {
          class: `cherry-previewer cherry-previewer--full cherry-markdown theme__${currentTheme} cherry-milkdown__editor`,
        },
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
    .use(cherryTableFocusPlugin)
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
    const tail = createEditableTail(view.state.doc);
    if (tail) view.dispatch(view.state.tr.insert(view.state.doc.content.size, tail));
  });
  serializedBaseline = editor.action(getMarkdown());
  acceptingChanges = true;

  root.append(mountRoot);

  const composition = createCompositionGate(
    editor.action((ctx) => ctx.get(editorViewCtx).dom),
    () => editor.action((ctx) => ({ document: ctx.get(editorViewCtx).state.doc, revision: documentRevision })),
  );
  const applyMarkdown = (
    markdown: string,
    emit?: boolean,
    requested?: { document: ProseMirrorNode; started: ProseMirrorNode; revision: number },
  ) => {
    let notify = false;
    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const parsed = ctx.get(parserCtx)(markdown);
        if (!parsed) throw new Error('Unable to parse external Markdown.');
        const next = withEditableTail(parsed);
        const localChanged = Boolean(requested && !requested.document.eq(view.state.doc));
        const nativeNotificationPending = Boolean(
          requested &&
          (requested.revision !== documentRevision || changeMicrotaskQueued || notificationTimer !== undefined),
        );
        const update = requested
          ? rebaseCompositionUpdate(requested.document, view.state.doc, next, requested.started)
          : createDocumentUpdate(view.state.doc, next);
        if (!update) {
          throw new Error('External Markdown overlaps the active composition. Local input was preserved.');
        }
        // Keep ordinary full writes byte-for-byte, including Cherry source
        // formatting. Reconciliation is only needed to retain native IME edits.
        const reconciled =
          requested && !update.doc.eq(next)
            ? reconcileMarkdown(ctx.get(serializerCtx)(update.doc), markdown, ctx.get(serializerCtx)(next))
            : markdown;
        // Do not cancel native change notifications until the external update
        // is validated. A rejected conflict must still publish committed input.
        suppressChanges = true;
        changeMicrotaskQueued = false;
        if (notificationTimer) clearTimeout(notificationTimer);
        notificationTimer = undefined;
        if (update.steps.length) {
          const transaction = view.state.tr;
          update.steps.forEach((step) => transaction.step(step));
          view.dispatch(transaction.setMeta('addToHistory', false).setMeta(EXTERNAL_MARKDOWN_UPDATE, true));
        }
        currentMarkdown = reconciled;
        serializedBaseline = editor.action(getMarkdown());
        // emit:false silences external edits, not a concurrently committed IME edit.
        notify = emit !== false || localChanged || nativeNotificationPending;
      });
    } catch (error) {
      if (!requested) options.onError?.(error, 'parse');
      else {
        try {
          options.onError?.(error, 'parse');
        } catch {
          // An error reporter must not interrupt an asynchronous IME completion.
        }
      }
    } finally {
      suppressChanges = false;
    }
    if (notify) scheduleNotification(currentMarkdown);
  };

  const instance: CherryMilkdownInstance = {
    engine,
    getMarkdown() {
      if (changeMicrotaskQueued && !suppressChanges && !destroyed) {
        const serialized = editor.action(getMarkdown());
        currentMarkdown = reconcileMarkdown(serialized);
        serializedBaseline = serialized;
      }
      return currentMarkdown;
    },
    setMarkdown(markdown, setOptions = {}) {
      if (destroyed) return;
      const { emit } = setOptions;
      const composing = composition.active;
      // Ignore echoes without cancelling a separately queued external edit.
      if (composing && markdown === instance.getMarkdown()) return;
      const requested = composing
        ? editor.action((ctx) => ({
            document: ctx.get(editorViewCtx).state.doc,
            started: composition.snapshot?.document ?? ctx.get(editorViewCtx).state.doc,
            revision: composition.snapshot?.revision ?? documentRevision,
          }))
        : undefined;
      composition.run(() => applyMarkdown(markdown, emit, requested));
    },
    setTheme(theme) {
      const nextTheme = normalizeTheme(theme);
      if (destroyed || nextTheme === currentTheme) return;
      currentTheme = nextTheme;
      const view = editor.action((ctx) => ctx.get(editorViewCtx));
      [mountRoot, view.dom].forEach((element) => {
        element.classList.remove(...CHERRY_THEME_CLASSES);
        element.classList.add(`theme__${currentTheme}`);
      });
      view.dom.dispatchEvent(new Event(CHERRY_THEME_CHANGE));
    },
    focus() {
      if (!destroyed) editor.action((ctx) => ctx.get(editorViewCtx).focus());
    },
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      composition.destroy();
      if (notificationTimer) clearTimeout(notificationTimer);
      notificationTimer = undefined;
      try {
        await editor.destroy();
      } finally {
        internalEditors.delete(instance);
        mountRoot.remove();
      }
    },
  };
  internalEditors.set(instance, editor);
  return instance;
}
