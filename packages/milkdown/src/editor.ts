import {
  defaultValueCtx,
  Editor,
  editorStateCtx,
  editorViewCtx,
  editorViewOptionsCtx,
  parserCtx,
  remarkCtx,
  remarkStringifyOptionsCtx,
  rootCtx,
  serializerCtx,
} from '@milkdown/kit/core';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { dropCursor } from '@milkdown/kit/prose/dropcursor';
import { gapCursor } from '@milkdown/kit/prose/gapcursor';
import { history } from '@milkdown/kit/plugin/history';
import { isHistoryTransaction } from '@milkdown/kit/prose/history';
import { indent } from '@milkdown/kit/plugin/indent';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import type { Node as ProseMirrorNode } from '@milkdown/kit/prose/model';
import { Plugin } from '@milkdown/kit/prose/state';
import { $prose, getMarkdown } from '@milkdown/kit/utils';
import {
  preserveRecoveredListSource,
  reconcileSerializedMarkdown,
  sameSerializedMarkdown,
} from './markdown-reconcile.js';
import { mapMarkdownTextEdit } from './markdown-source-map.js';
import { createTerminalHistory, preserveLineEndings } from './terminal-history.js';
import { cachedRecoveryContext, lazyRecoveryContext } from './recovery-context.js';
import type {
  CherryEngineInput,
  CherryEngineLike,
  CherryMilkdownInstance,
  CherryMilkdownErrorContext,
  CherryMilkdownOptions,
  CherryMilkdownTheme,
} from './types.js';
import { cherryWysiwygConfigCtx, type CherryWysiwygConfig } from './wysiwyg/config.js';
import { TableChartDescriptorEngine } from './wysiwyg/table-chart-render-engine.js';
import { cherryTableFocusPlugin } from './wysiwyg/table-focus.js';
import { CHERRY_THEME_CHANGE } from './wysiwyg/theme.js';
import { createCompositionGate } from './composition-gate.js';
import { cherryClipboardBoundaries } from './wysiwyg/clipboard-boundaries.js';
import {
  createDocumentUpdate,
  createEditableTail,
  EXTERNAL_MARKDOWN_UPDATE,
  rebaseCompositionUpdate,
  sameSourceDocument,
  withoutEditableTail,
  withEditableTail,
} from './document-update.js';

const DEFAULT_DEBOUNCE = 30;
const CHERRY_THEMES = ['default', 'dark', 'abyss', 'green', 'red', 'gray', 'violet', 'blue'] as const;
const CHERRY_THEME_CLASSES = CHERRY_THEMES.map((theme) => `theme__${theme}`);
const internalEditors = new WeakMap<CherryMilkdownInstance, Editor>();
const releasedEngine: CherryEngineLike = {
  makeHtml: () => {
    throw new Error('The editor is destroyed.');
  },
};
// A dependency may retain a destroyed view temporarily. Do not let its
// callbacks retain the consumer's option object after teardown completes.
const releasedOptions: CherryMilkdownOptions = { root: '' };
// Milkdown's block-oriented drop indicator handles every drop itself, which
// moves inline images to block boundaries. Keep ProseMirror's drop semantics.
const cherryCursors = [
  $prose(() => gapCursor()),
  $prose(() => dropCursor({ color: 'var(--cherry-milkdown-primary)' })),
];

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

function createDestroyedReader(lifecycle: { destroyed: boolean }): () => boolean {
  return () => lifecycle.destroyed;
}

/** An external update failed to serialize and its rollback also failed. */
export class ExternalUpdateRollbackError extends Error {
  /** The serialization error followed by the rollback error. */
  readonly errors: readonly [unknown, unknown];

  constructor(original: unknown, rollback: unknown) {
    super('External update failed and rollback also failed.');
    this.name = 'ExternalUpdateRollbackError';
    this.errors = [original, rollback];
  }
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
  let documentNeedsReconciliation = false;
  const lifecycle = { destroyed: false };
  let destroyPromise: Promise<void> | undefined;
  let suppressChanges = false;
  let acceptingChanges = false;
  let documentRevision = 0;
  let externalUpdateVersion = 0;
  let pendingExternalSnapshot:
    { version: number; document: ProseMirrorNode; markdown: string; serialized: string } | undefined;
  let engine: CherryEngineLike;
  let nativeEngine: CherryEngineLike | undefined;
  let currentMarkdown = options.value ?? '';
  let serializedBaseline = '';
  let pendingHistoryChange = false;
  const terminalHistory = createTerminalHistory();

  let tableBlockComponent: typeof import('@milkdown/kit/component/table-block');
  let cherryWysiwyg: typeof import('./wysiwyg/plugin.js').cherryWysiwyg;
  let wysiwygConfig: CherryWysiwygConfig | undefined;
  const releaseWysiwygConfig = () => {
    if (!wysiwygConfig) return;
    wysiwygConfig.engine = releasedEngine;
    wysiwygConfig.nativeEngine = undefined;
    wysiwygConfig.fileUpload = undefined;
    wysiwygConfig.renderers = undefined;
    wysiwygConfig.mathlive = undefined;
    wysiwygConfig.onError = undefined;
    wysiwygConfig = undefined;
  };
  const reportErrorSafely = (error: unknown, phase: 'create' | 'parse', context?: CherryMilkdownErrorContext) => {
    try {
      if (context) options.onError?.(error, phase, context);
      else options.onError?.(error, phase);
    } catch {
      // The reporter must not interrupt cleanup or asynchronous work.
    }
  };

  try {
    tableBlockComponent = await import('@milkdown/kit/component/table-block');
    // Defer NodeView registration until editor creation so bundlers initialize
    // shared Milkdown schemas before the views access them at module load.
    ({ cherryWysiwyg } = await import('./wysiwyg/plugin.js'));
    // CherryEngine is the only Cherry runtime used by this standalone editor.
    // It contributes Markdown semantics and HTML presentation, not an editor,
    // Previewer, Bubble or mode lifecycle.
    if (options.engine != null) {
      engine = requireCherryEngine(options.engine);
    } else {
      // Cherry's engine accesses browser globals during module evaluation.
      // Load it only when an editor actually needs the default engine.
      const { default: CherryEngine } = await import('./cherry-engine.js');
      engine = requireCherryEngine(new CherryEngine(options.engineOptions ?? {}));
      if (options.renderers?.tableChart) {
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
    }
  } catch (error) {
    reportErrorSafely(error, 'create');
    throw error;
  }

  const scheduleNotification = (markdown: string) => {
    if (notificationTimer) clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => {
      notificationTimer = undefined;
      if (!lifecycle.destroyed) options.onChange?.({ markdown });
    }, debounce);
  };

  const flushDocumentChange = () => {
    if (!changeMicrotaskQueued) return;
    changeMicrotaskQueued = false;
    if (lifecycle.destroyed || suppressChanges) return;
    const version = externalUpdateVersion;
    const revision = documentRevision;
    try {
      const serialized = editor.action(getMarkdown());
      if (lifecycle.destroyed || version !== externalUpdateVersion || revision !== documentRevision) return;
      if (!synchronizeMarkdown(serialized)) return;
      documentNeedsReconciliation = false;
      const markdown = currentMarkdown;
      scheduleNotification(markdown);
    } catch (error) {
      if (lifecycle.destroyed || version !== externalUpdateVersion || revision !== documentRevision) return;
      // The live document is newer than the last serialized value. Do not
      // publish an older debounced change while serialization is unavailable.
      documentNeedsReconciliation = true;
      if (notificationTimer) clearTimeout(notificationTimer);
      notificationTimer = undefined;
      reportErrorSafely(error, 'parse');
    }
  };

  const queueDocumentReconciliation = () => {
    documentNeedsReconciliation = true;
    if (notificationTimer) clearTimeout(notificationTimer);
    notificationTimer = undefined;
    if (!changeMicrotaskQueued) {
      changeMicrotaskQueued = true;
      queueMicrotask(flushDocumentChange);
    }
  };

  const reconcileMarkdown = (
    serialized: string,
    raw = currentMarkdown,
    previous = serializedBaseline,
    restore = false,
  ) =>
    editor.action((ctx) => {
      const parser = ctx.get(parserCtx);
      const serialize = ctx.get(serializerCtx);
      const matchesDocument = (candidate: string) => {
        try {
          const parsed = parser(candidate);
          // Compare the serializer's semantics, not schema bookkeeping (e.g.
          // original list markers or the editor-only trailing empty paragraph).
          return Boolean(parsed && sameSerializedMarkdown(serialize(parsed), serialized));
        } catch {
          return false;
        }
      };
      let reconciled = preserveLineEndings(
        raw,
        reconcileSerializedMarkdown(raw, previous, serialized, matchesDocument, (from, to) =>
          mapMarkdownTextEdit(raw, previous, from, to, (source) => ctx.get(remarkCtx).parse(source)),
        ),
        matchesDocument,
      );
      // Preserve list spelling for same-shape edits without masking an
      // intentional change to terminal newlines.
      if (!restore && /^[ \t]*[*+](?=[ \t])/m.test(raw)) {
        const previousSuffix = previous.replace(/\r\n/g, '\n').match(/\n*$/)![0];
        const nextSuffix = serialized.replace(/\r\n/g, '\n').match(/\n*$/)![0];
        if (previousSuffix === nextSuffix) reconciled = preserveRecoveredListSource(raw, reconciled, matchesDocument);
      }
      if (!restore) return reconciled;
      const restored = terminalHistory.restore(serialized, reconciled, matchesDocument);
      return terminalHistory.restoreSource(serialized, restored, matchesDocument, (candidate) => {
        try {
          const parsed = parser(candidate);
          return Boolean(parsed && sameSourceDocument(parsed, ctx.get(editorViewCtx).state.doc));
        } catch {
          return false;
        }
      });
    });

  const synchronizeMarkdown = (serialized: string) => {
    const version = externalUpdateVersion;
    const revision = documentRevision;
    terminalHistory.remember(serializedBaseline, currentMarkdown);
    const reconciled = reconcileMarkdown(serialized, currentMarkdown, serializedBaseline, pendingHistoryChange);
    if (lifecycle.destroyed || version !== externalUpdateVersion || revision !== documentRevision) return false;
    currentMarkdown = reconciled;
    pendingHistoryChange = false;
    serializedBaseline = serialized;
    terminalHistory.remember(serializedBaseline, currentMarkdown);
    return true;
  };

  const immediateChangePlugin = $prose(
    () =>
      new Plugin({
        state: {
          init: () => null,
          apply: (transaction) => {
            if (transaction.docChanged && acceptingChanges && !suppressChanges && !lifecycle.destroyed) {
              documentRevision += 1;
              const appended = transaction.getMeta('appendedTransaction');
              pendingHistoryChange =
                isHistoryTransaction(transaction) || Boolean(appended && isHistoryTransaction(appended));
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
      wysiwygConfig = {
        engine,
        nativeEngine,
        readonly: Boolean(options.readonly),
        bubble: options.bubble !== false,
        debounce,
        mathlive: options.mathlive,
        fileUpload: options.fileUpload,
        renderers: options.renderers,
        onError: options.onError,
        isDestroyed: createDestroyedReader(lifecycle),
      };
      ctx.set(cherryWysiwygConfigCtx.key, wysiwygConfig);
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
    .use(cherryClipboardBoundaries)
    .use(clipboard)
    .use(cherryCursors)
    .use(indent)
    .use(trailing)
    .use(immediateChangePlugin)
    .use(cherryTableFocusPlugin)
    .use(cherryWysiwyg);

  editor.use(tableBlockComponent.tableBlock);

  for (const plugin of options.plugins ?? []) editor.use(plugin);

  const destroyEditor = async () => {
    try {
      await editor.destroy();
    } catch (error) {
      // Milkdown stops its internal cleanup when a user plugin rejects.
      // Release the ProseMirror view and its listeners where it exists,
      // without masking the plugin's original failure.
      try {
        editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          if (!view.isDestroyed) view.destroy();
        });
      } catch {
        // A partial create may not have installed a view, or a view cleanup
        // may itself throw. Preserve the original error in either case.
      }
      throw error;
    }
  };

  let composition: ReturnType<typeof createCompositionGate<{ document: ProseMirrorNode; revision: number }>>;
  try {
    await editor.create();
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const tail = createEditableTail(view.state.doc);
      if (tail) view.dispatch(view.state.tr.insert(view.state.doc.content.size, tail));
    });
    serializedBaseline = editor.action(getMarkdown());
    terminalHistory.remember(serializedBaseline, currentMarkdown);
    root.append(mountRoot);
    composition = createCompositionGate(
      editor.action((ctx) => ctx.get(editorViewCtx).dom),
      () => editor.action((ctx) => ({ document: ctx.get(editorViewCtx).state.doc, revision: documentRevision })),
    );
    acceptingChanges = true;
  } catch (error) {
    await destroyEditor().catch(() => {});
    mountRoot.remove();
    releaseWysiwygConfig();
    reportErrorSafely(error, 'create');
    throw error;
  }
  const applyMarkdown = (
    markdown: string,
    emit?: boolean,
    requested?: { document: ProseMirrorNode; started: ProseMirrorNode; revision: number },
  ) => {
    const startingVersion = externalUpdateVersion;
    const wasSuppressingChanges = suppressChanges;
    const previousSnapshot = pendingExternalSnapshot;
    const previousMarkdown = currentMarkdown;
    const previousSerialized = serializedBaseline;
    const previousMarkdownIsCurrent = !wasSuppressingChanges && !changeMicrotaskQueued && !documentNeedsReconciliation;
    let previousRecoveryMarkdown: string | undefined = previousMarkdownIsCurrent ? previousMarkdown : undefined;
    let errorContext: CherryMilkdownErrorContext | undefined;
    let reconcileCommittedFailure: (() => void) | undefined;
    let notify = false;
    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const previousState = view.state;
        const readPreviousMarkdown = () => {
          const { serialized, baseline } = editor.action((recoveryCtx) => {
            const serialize = recoveryCtx.get(serializerCtx);
            const doc = previousState.doc;
            const last = doc.lastChild;
            const beforeLast = doc.childCount > 1 ? doc.child(doc.childCount - 2) : undefined;
            const mayHaveEditableTail =
              last?.type.name === 'paragraph' &&
              last.content.size === 0 &&
              beforeLast &&
              !['paragraph', 'heading'].includes(beforeLast.type.name);
            if (!wasSuppressingChanges && !mayHaveEditableTail) {
              return { serialized: serialize(doc), baseline: previousSerialized };
            }
            const parsed = recoveryCtx.get(parserCtx)(previousMarkdown);
            if (!parsed) throw new Error('Unable to parse previous Markdown for recovery.');
            return {
              serialized: serialize(withoutEditableTail(doc, parsed)),
              baseline: serialize(parsed),
            };
          });
          const recovered = reconcileMarkdown(serialized, previousMarkdown, baseline);
          return preserveRecoveredListSource(previousMarkdown, recovered, (candidate) =>
            editor.action((recoveryCtx) => {
              const parsed = recoveryCtx.get(parserCtx)(candidate);
              return Boolean(parsed && sameSerializedMarkdown(recoveryCtx.get(serializerCtx)(parsed), serialized));
            }),
          );
        };
        const makeRecoveryContext = (): CherryMilkdownErrorContext => {
          if (previousRecoveryMarkdown !== undefined) return cachedRecoveryContext(previousRecoveryMarkdown);
          return lazyRecoveryContext(readPreviousMarkdown, createDestroyedReader(lifecycle));
        };
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
        if (update.steps.length && !previousMarkdownIsCurrent) {
          const revision = documentRevision;
          previousRecoveryMarkdown = readPreviousMarkdown();
          if (
            lifecycle.destroyed ||
            startingVersion !== externalUpdateVersion ||
            revision !== documentRevision ||
            !view.state.doc.eq(previousState.doc)
          )
            return;
        }
        // Validate before replacing the document. A no-op has no transaction
        // to guard, so its final serialization below is sufficient.
        const serializedUpdate = update.steps.length ? ctx.get(serializerCtx)(update.doc) : undefined;
        // Keep ordinary full writes byte-for-byte, including Cherry source
        // formatting. Reconciliation is only needed to retain native IME edits.
        // The raw Markdown corresponds to `parsed`, not `next`: the latter
        // includes an editor-only tail which may serialize as an extra break.
        const preserveComposedInput = Boolean(requested && !update.doc.eq(next));
        const serializedExternal = preserveComposedInput ? ctx.get(serializerCtx)(parsed) : undefined;
        const reconciled = preserveComposedInput
          ? reconcileMarkdown(
              ctx.get(serializerCtx)(withoutEditableTail(update.doc, parsed)),
              markdown,
              serializedExternal!,
            )
          : markdown;
        // Consumer plugins and renderers can synchronously submit a newer
        // replacement while this update is being prepared or dispatched.
        if (lifecycle.destroyed || startingVersion !== externalUpdateVersion || !view.state.doc.eq(previousState.doc))
          return;
        const version = ++externalUpdateVersion;
        // Do not cancel native change notifications until the external update
        // is validated. A rejected conflict must still publish committed input.
        suppressChanges = true;
        if (update.steps.length) {
          const transaction = view.state.tr;
          update.steps.forEach((step) => transaction.step(step));
          pendingExternalSnapshot = {
            version,
            document: update.doc,
            markdown: reconciled,
            serialized: serializedUpdate!,
          };
          try {
            view.dispatch(transaction.setMeta('addToHistory', false).setMeta(EXTERNAL_MARKDOWN_UPDATE, true));
          } catch (error) {
            if (lifecycle.destroyed || version !== externalUpdateVersion) return;
            // Milkdown updates its context during transaction application,
            // even when an appended transaction throws before the view commits.
            ctx.set(editorStateCtx, view.state);
            // A plugin view may throw after ProseMirror has committed state.
            if (!view.state.doc.eq(previousState.doc)) {
              queueDocumentReconciliation();
              errorContext = makeRecoveryContext();
            }
            throw error;
          }
        }
        if (lifecycle.destroyed || version !== externalUpdateVersion) return;
        // Any later failure may leave a committed document, including changes
        // dispatched by a plugin while rollback is updating its view.
        reconcileCommittedFailure = () => {
          if (lifecycle.destroyed || version !== externalUpdateVersion || view.state.doc.eq(previousState.doc)) return;
          queueDocumentReconciliation();
          errorContext ??= makeRecoveryContext();
        };
        if (update.steps.length && view.state === previousState) {
          throw new Error('External Markdown update was not applied by the editor.');
        }
        let finalSerialized: string;
        const documentBeforeSerialization = view.state.doc;
        try {
          finalSerialized = editor.action(getMarkdown());
        } catch (error) {
          if (lifecycle.destroyed || version !== externalUpdateVersion) return;
          // Do not overwrite changes made by a plugin after the external
          // transaction. Only reverse the exact document this write produced.
          if (update.steps.length && view.state.doc.eq(update.doc)) {
            ctx.set(editorStateCtx, previousState);
            try {
              view.updateState(previousState);
            } catch (rollbackError) {
              if (lifecycle.destroyed || version !== externalUpdateVersion) return;
              throw new ExternalUpdateRollbackError(error, rollbackError);
            }
          }
          if (lifecycle.destroyed || version !== externalUpdateVersion) return;
          throw error;
        }
        if (lifecycle.destroyed || version !== externalUpdateVersion) return;
        const pluginChangedDocument = !view.state.doc.eq(update.doc);
        let sameWithoutTail = serializedUpdate === finalSerialized;
        if (pluginChangedDocument && !sameWithoutTail) {
          const beforeDoc = withoutEditableTail(update.doc, parsed);
          const afterDoc = withoutEditableTail(view.state.doc, parsed);
          const before =
            beforeDoc === update.doc && serializedUpdate !== undefined
              ? serializedUpdate
              : ctx.get(serializerCtx)(beforeDoc);
          if (lifecycle.destroyed || version !== externalUpdateVersion) return;
          const after = afterDoc === view.state.doc ? finalSerialized : ctx.get(serializerCtx)(afterDoc);
          if (lifecycle.destroyed || version !== externalUpdateVersion) return;
          sameWithoutTail = before === after;
        }
        const finalMarkdown =
          pluginChangedDocument && !sameWithoutTail
            ? reconcileMarkdown(finalSerialized, reconciled, serializedUpdate ?? finalSerialized)
            : reconciled;
        if (lifecycle.destroyed || version !== externalUpdateVersion) return;
        if (!view.state.doc.eq(documentBeforeSerialization)) {
          // A serializer can synchronously dispatch a transaction. Its result
          // describes the previous document, so reconcile the live one instead.
          queueDocumentReconciliation();
          return;
        }
        changeMicrotaskQueued = false;
        if (notificationTimer) clearTimeout(notificationTimer);
        notificationTimer = undefined;
        if (finalMarkdown !== currentMarkdown || update.steps.length) terminalHistory.clear();
        pendingHistoryChange = false;
        if (serializedExternal !== undefined) terminalHistory.rememberExternalAlias(serializedExternal, markdown);
        currentMarkdown = finalMarkdown;
        serializedBaseline = finalSerialized;
        documentNeedsReconciliation = false;
        terminalHistory.remember(serializedBaseline, currentMarkdown);
        // emit:false silences external edits, not a concurrently committed IME edit.
        notify = emit !== false || localChanged || nativeNotificationPending || pluginChangedDocument;
      });
    } catch (error) {
      reconcileCommittedFailure?.();
      if (!requested) {
        if (errorContext) options.onError?.(error, 'parse', errorContext);
        else options.onError?.(error, 'parse');
      } else reportErrorSafely(error, 'parse', errorContext);
    } finally {
      pendingExternalSnapshot = previousSnapshot;
      suppressChanges = wasSuppressingChanges;
    }
    if (notify) scheduleNotification(currentMarkdown);
  };

  let instance: CherryMilkdownInstance | undefined = {
    engine,
    getMarkdown() {
      if ((changeMicrotaskQueued || documentNeedsReconciliation) && !suppressChanges && !lifecycle.destroyed) {
        const recovering = documentNeedsReconciliation;
        const version = externalUpdateVersion;
        const revision = documentRevision;
        const serialized = editor.action(getMarkdown());
        if (lifecycle.destroyed || version !== externalUpdateVersion || revision !== documentRevision)
          return currentMarkdown;
        if (!synchronizeMarkdown(serialized)) return currentMarkdown;
        documentNeedsReconciliation = false;
        if (recovering && !changeMicrotaskQueued) scheduleNotification(currentMarkdown);
      }
      return currentMarkdown;
    },
    setMarkdown(markdown, setOptions = {}) {
      if (lifecycle.destroyed) return;
      const { emit } = setOptions;
      const composing = composition.active;
      // Ignore silent echoes without cancelling a pending local notification.
      // During composition, any same-value echo must also leave a separately
      // queued external edit intact, including the default emitting form.
      if ((composing || emit === false) && markdown === instance!.getMarkdown()) return;
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
      if (lifecycle.destroyed || nextTheme === currentTheme) return;
      currentTheme = nextTheme;
      const view = editor.action((ctx) => ctx.get(editorViewCtx));
      [mountRoot, view.dom].forEach((element) => {
        element.classList.remove(...CHERRY_THEME_CLASSES);
        element.classList.add(`theme__${currentTheme}`);
      });
      view.dom.dispatchEvent(new Event(CHERRY_THEME_CHANGE));
    },
    focus() {
      if (!lifecycle.destroyed) editor.action((ctx) => ctx.get(editorViewCtx).focus());
    },
    destroy() {
      if (destroyPromise) return destroyPromise;
      // Publish the shared promise before invoking consumer-provided serializers,
      // which can synchronously call destroy again during the final snapshot.
      destroyPromise = Promise.resolve()
        .then(() => destroyEditor())
        .finally(() => {
          if (instance) internalEditors.delete(instance);
          instance = undefined;
          mountRoot.remove();
          releaseWysiwygConfig();
          engine = releasedEngine;
          nativeEngine = undefined;
          options = releasedOptions;
        });
      // Snapshot pending edits, including ones whose earlier serialization
      // failed. Pending debounced callbacks are still cancelled during teardown.
      let snapshotFailure: { error: unknown } | undefined;
      if (changeMicrotaskQueued || documentNeedsReconciliation || suppressChanges) {
        changeMicrotaskQueued = false;
        try {
          let synchronized = false;
          const pending = pendingExternalSnapshot;
          const initialView = editor.action((ctx) => ctx.get(editorViewCtx));
          if (pending && pending.version === externalUpdateVersion && initialView.state.doc.eq(pending.document)) {
            currentMarkdown = pending.markdown;
            serializedBaseline = pending.serialized;
            synchronized = true;
          }
          for (let attempt = 0; attempt < 5 && !synchronized; attempt += 1) {
            const version = externalUpdateVersion;
            const revision = documentRevision;
            const view = editor.action((ctx) => ctx.get(editorViewCtx));
            const document = view.state.doc;
            const serialized = editor.action(getMarkdown());
            if (version === externalUpdateVersion && revision === documentRevision && view.state.doc.eq(document)) {
              synchronized = synchronizeMarkdown(serialized) && view.state.doc.eq(document);
            }
          }
          if (!synchronized) throw new Error('Unable to snapshot a document that keeps changing during destruction.');
        } catch (error) {
          snapshotFailure = { error };
        }
      }
      lifecycle.destroyed = true;
      composition.destroy();
      if (notificationTimer) clearTimeout(notificationTimer);
      notificationTimer = undefined;
      if (snapshotFailure) reportErrorSafely(snapshotFailure.error, 'parse');
      return destroyPromise;
    },
  };
  internalEditors.set(instance, editor);
  return instance;
}
