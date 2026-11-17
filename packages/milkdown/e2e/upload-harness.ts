import { cherryMilkdown, ExternalUpdateRollbackError } from '../src';
import { editorStateCtx, editorViewCtx, parserCtx, serializerCtx } from '@milkdown/kit/core';
import { Plugin } from '@milkdown/kit/prose/state';
import { isHistoryTransaction } from '@milkdown/kit/prose/history';
import { $prose } from '@milkdown/kit/utils';
import { getInternalEditor } from '../src/editor';

window.uploads = [];
window.uploadChanges = [];
window.createResourceProbe = async () => {
  const engine = { makeHtml: (markdown: string) => markdown };
  const onError = () => {};
  const fileUpload = () => {};
  const renderer = () => {};
  const instance = await cherryMilkdown({ root: '#editor', engine, onError, fileUpload, renderers: { probe: renderer }, value: 'Probe' });
  return { instance, engine, onError, fileUpload, renderer };
};
const readonly = new URLSearchParams(window.location.search).has('readonly');
const chartFailure = new URLSearchParams(window.location.search).has('chart-failure');
const engineCleanup = new URLSearchParams(window.location.search).has('engine-cleanup-failure');
const renderReentrant = new URLSearchParams(window.location.search).has('render-reentrant');
const failureReentrant = new URLSearchParams(window.location.search).has('failure-reentrant');
const externalReentrant = new URLSearchParams(window.location.search).has('external-reentrant');
const externalReentrantFailure = new URLSearchParams(window.location.search).has('external-reentrant-failure');
const reentrantSnapshot = new URLSearchParams(window.location.search).has('reentrant-snapshot');
const comparisonFailure = new URLSearchParams(window.location.search).has('comparison-failure');
const externalAppendFailure = new URLSearchParams(window.location.search).has('external-append-failure') || comparisonFailure;
const externalAppendEmpty = new URLSearchParams(window.location.search).has('external-append-empty');
const undoAppend = new URLSearchParams(window.location.search).has('undo-append');
const pluginAppendThrow = new URLSearchParams(window.location.search).has('plugin-append-throw');
const pluginFilterExternal = new URLSearchParams(window.location.search).has('plugin-filter-external');
const pluginViewFailure = new URLSearchParams(window.location.search).has('plugin-view-failure');
const destroyExternal = new URLSearchParams(window.location.search).has('destroy-external');
const rollbackReentrant = new URLSearchParams(window.location.search).has('rollback-reentrant');
const rollbackReplace = new URLSearchParams(window.location.search).has('rollback-replace');
const rollbackLocal = new URLSearchParams(window.location.search).has('rollback-local') || rollbackReplace;
const nestedDestroy = new URLSearchParams(window.location.search).has('nested-destroy');
const nestedReentrant = new URLSearchParams(window.location.search).has('nested-reentrant') || nestedDestroy;
const htmlStyleProbe = new URLSearchParams(window.location.search).has('html-style-probe');
const engineStyleProbe = new URLSearchParams(window.location.search).has('engine-style-probe');
const engineVariableProbe = new URLSearchParams(window.location.search).has('engine-variable-probe');
const engineSafeVariable = new URLSearchParams(window.location.search).has('engine-safe-variable');
const engineImageSet = new URLSearchParams(window.location.search).has('engine-image-set');
const engineDestroyProbe = new URLSearchParams(window.location.search).has('engine-destroy-probe');
const engineDestroyImageProbe = new URLSearchParams(window.location.search).has('engine-destroy-image-probe');
const engineDestroyEmojiProbe = new URLSearchParams(window.location.search).has('engine-destroy-emoji-probe');
const engineDestroyNativeProbe = new URLSearchParams(window.location.search).has('engine-destroy-native-probe');
const imageEngineFailure = new URLSearchParams(window.location.search).has('image-engine-failure');
const disabledBr = new URLSearchParams(window.location.search).has('disabled-br');
const notificationProbe = new URLSearchParams(window.location.search).has('notification-probe');
let failInit = new URLSearchParams(window.location.search).has('fail-init');
let delayDestroy = new URLSearchParams(window.location.search).has('delay-destroy');
let rejectDestroy = new URLSearchParams(window.location.search).has('reject-destroy');
if (failInit) document.querySelector('#editor')!.textContent = 'Host content';
if (imageEngineFailure) (window as Window & { imageEngineFail?: boolean }).imageEngineFail = true;
window.createUploadEditor = () =>
  cherryMilkdown({
    root: '#editor',
    value: engineDestroyEmojiProbe
      ? ':smile:'
      : engineDestroyNativeProbe
        ? ':::business-card\nInitial\n:::'
        : engineDestroyProbe
          ? '<div>\nInitial\n</div>'
          : htmlStyleProbe
            ? '<div>\n<span style="background:u\\72l(https://example.com/css-probe)">Text</span><span style="color:red">Safe</span>\n</div>'
            : engineCleanup
              ? '```custom-preview\nFirst\n```\n\n```custom-preview\nSecond\n```'
              : externalReentrant || externalReentrantFailure || reentrantSnapshot
                ? 'Old'
                : nestedReentrant
                  ? 'Start'
                  : renderReentrant || failureReentrant
                    ? '```custom-preview\nOld\n```'
                    : chartFailure
                      ? '| :line: | Value |\n| --- | --- |\n| Original | 1 |'
                      : readonly
                        ? '# Read-only\n\n- [ ] Pending\n\n| A | B |\n| --- | --- |\n| one | two |\n\n```js\nconst answer = 42;\n```\n\n![original](https://example.com/original.png)'
                        : '![original](https://example.com/original.png)',
    readonly,
    engineOptions: disabledBr ? { engine: { syntax: { br: false } } } : undefined,
    debounce: notificationProbe ? 250 : undefined,
    engine: imageEngineFailure
      ? {
          makeHtml: () => {
            if ((window as Window & { imageEngineFail?: boolean }).imageEngineFail)
              throw new Error('Image engine failed');
            return '<img src="https://example.com/recovered.png">';
          },
        }
      : engineDestroyProbe || engineDestroyImageProbe || engineDestroyEmojiProbe || engineDestroyNativeProbe
        ? {
            makeHtml: () => {
              const state = window as Window & { destroyInEngine?: boolean; engineDestruction?: Promise<void> };
              if (state.destroyInEngine) {
                state.destroyInEngine = false;
                state.engineDestruction = window.uploadEditor!.destroy();
                return engineDestroyImageProbe
                  ? '<img src="https://example.com/stale.png">'
                  : '<div>stale result</div>';
              }
              return engineDestroyImageProbe
                ? '<img src="https://example.com/initial.png">'
                : '<div>initial result</div>';
            },
          }
        : engineCleanup
          ? {
              makeHtml: (source: string) => source,
              destroyRenderedContent: () => {
                throw new Error('Engine cleanup failed');
              },
            }
          : htmlStyleProbe
            ? { makeHtml: (source: string) => source }
            : engineStyleProbe || engineVariableProbe || engineSafeVariable || engineImageSet
              ? {
                  makeHtml: () =>
                    engineImageSet
                      ? '<img alt="probe" style="width:42px;height:42px;--image:\'https://example.com/css-probe\';background-image:image-set(var(--image) 1x)">'
                      : engineSafeVariable
                        ? '<img alt="probe" style="width:42px;height:42px;--tone:#663399;background:var(--tone)">'
                        : engineVariableProbe
                          ? '<img alt="probe" style="width:42px;height:42px;--image:u\\72l(https://example.com/css-probe);background:var(--image)">'
                          : '<img alt="probe" style="width:42px;height:42px;background:u\\72l(https://example.com/css-probe)">',
                }
              : undefined,
    renderers: engineCleanup
      ? {
          'custom-preview': ({ container, source }) => {
            container.textContent = source;
            return () => {
              const state = window as Window & { engineRendererCleanups?: number };
              state.engineRendererCleanups = (state.engineRendererCleanups ?? 0) + 1;
            };
          },
        }
      : nestedReentrant
        ? {
            tableChart: ({ source, signal }) => {
              const state = window as Window & {
                nestedCalls?: Array<{ source: string; aborted: boolean }>;
                nestedCleanups?: number;
                nestedDestroyed?: boolean;
              };
              const calls = (state.nestedCalls ??= []);
              calls.push({ source, aborted: signal?.aborted ?? false });
              if (calls.length === 1) {
                if (nestedDestroy) void window.uploadEditor!.destroy().then(() => (state.nestedDestroyed = true));
                else window.uploadEditor!.setMarkdown('Replacement', { emit: false });
              }
              if (nestedDestroy) return () => (state.nestedCleanups = (state.nestedCleanups ?? 0) + 1);
            },
          }
        : failureReentrant
          ? {
              'custom-preview': ({ source, container, signal }) => {
                if (source === 'Middle') {
                  signal?.addEventListener(
                    'abort',
                    () => {
                      window.uploadEditor!.setMarkdown('```custom-preview\nLatest\n```', { emit: false });
                    },
                    { once: true },
                  );
                  return Promise.reject(new Error('Obsolete render failed'));
                }
                container.textContent = source;
              },
            }
          : renderReentrant
            ? {
                'custom-preview': ({ source, container }) => {
                  container.textContent = source;
                  return () => {
                    const state = window as Window & { reenterRender?: boolean };
                    if (source === 'Old' && state.reenterRender) {
                      state.reenterRender = false;
                      window.uploadEditor!.setMarkdown('```custom-preview\nLatest\n```', { emit: false });
                    }
                  };
                },
              }
            : chartFailure
              ? {
                  tableChart: ({ source }) => {
                    if (source.includes('Broken')) throw new Error('Simulated redraw failure');
                    return `<span data-test-chart>${source.includes('Fixed') ? 'Fixed' : 'Original'}</span>`;
                  },
                }
              : undefined,
    plugins: failInit
      ? [
          $prose(
            (ctx) =>
              new Plugin({
                view() {
                  ctx.set(serializerCtx, () => {
                    throw new Error('Initial serialization failed');
                  });
                  return {
                    destroy: () => {
                      window.failedEditorCleaned = true;
                    },
                  };
                },
              }),
          ),
        ]
      : pluginFilterExternal
        ? [$prose(() => new Plugin({ filterTransaction: (transaction) => transaction.doc.textContent !== 'External' }))]
        : destroyExternal
        ? [
            $prose(
              () =>
                new Plugin({
                  view: () => ({
                    update(view) {
                      if (view.state.doc.textContent === 'Item') window.firstEditorDestroy = window.uploadEditor!.destroy();
                    },
                  }),
                }),
            ),
          ]
        : pluginViewFailure
        ? [
            $prose(() => {
              let fail = true;
              return new Plugin({
                view: () => ({
                  update(view) {
                    if (fail && view.state.doc.textContent === 'External') {
                      fail = false;
                      throw new Error('Plugin view failed');
                    }
                  },
                }),
              });
            }),
          ]
        : externalAppendFailure || externalAppendEmpty || pluginAppendThrow
        ? [
            $prose(
              () =>
                new Plugin({
                  appendTransaction: (_transactions, _oldState, state) => {
                    if (state.doc.textContent !== 'External') return null;
                    if (pluginAppendThrow) throw new Error('Append failed');
                    if (externalAppendEmpty)
                      return state.doc.childCount === 1
                        ? state.tr.insert(state.doc.content.size, state.schema.nodes.paragraph.create())
                        : null;
                    return state.tr.insertText('!', state.doc.content.size - 1);
                  },
                }),
            ),
          ]
        : undoAppend
          ? [
              $prose(
                () =>
                  new Plugin({
                    appendTransaction(transactions, _oldState, state) {
                      if (!transactions.some(isHistoryTransaction)) return null;
                      let end = -1;
                      state.doc.descendants((node, position) => {
                        if (end < 0 && node.isText && node.text === 'Edit here.') end = position + node.nodeSize;
                      });
                      return end < 0 ? null : state.tr.insertText('!', end);
                    },
                  }),
              ),
            ]
        : externalReentrant || externalReentrantFailure || reentrantSnapshot || rollbackReentrant || rollbackLocal
          ? [
              $prose(
                (ctx) =>
                  new Plugin({
                    appendTransaction: reentrantSnapshot
                      ? (_transactions, _oldState, state) =>
                          state.doc.textContent === 'External' ? state.tr.insertText('!', state.doc.content.size - 1) : null
                      : undefined,
                    view: () => {
                      if (externalReentrantFailure) {
                        const parse = ctx.get(parserCtx);
                        ctx.set(parserCtx, (source) => {
                          if (source === 'Rejected') throw new Error('Invalid replacement');
                          return parse(source);
                        });
                      }
                      return {
                        update: (view) => {
                          if (
                            (window as Window & { externalReenter?: boolean }).externalReenter &&
                            (rollbackReentrant || rollbackLocal
                              ? view.state.doc.textContent === 'Before!'
                              : view.state.doc.textContent.includes('Middle'))
                          ) {
                            (window as Window & { externalReenter?: boolean }).externalReenter = false;
                            if (rollbackLocal) {
                              view.dispatch(rollbackReplace
                                ? view.state.tr.insertText('Plugin', 1, view.state.doc.content.size - 1)
                                : view.state.tr.insertText('?', view.state.doc.content.size - 1));
                              if (new URLSearchParams(window.location.search).has('rollback-local-throw')) {
                                throw new Error('Plugin view failed during rollback');
                              }
                              return;
                            }
                            if (rollbackReentrant) window.restoreSerializer();
                            window.uploadEditor!.setMarkdown(
                              externalReentrantFailure ? 'Rejected' : reentrantSnapshot ? 'External' : 'Latest',
                            );
                          }
                        },
                      };
                    },
                  }),
              ),
            ]
          : delayDestroy
            ? [
                () => async () => () =>
                  new Promise<void>((resolve) => {
                    window.releaseEditorCleanup = resolve;
                  }),
              ]
            : rejectDestroy
              ? [
                  $prose(
                    () =>
                      new Plugin({
                        view: () => ({
                          destroy: () => {
                            window.failedDestroyViewCleaned = true;
                          },
                        }),
                      }),
                  ),
                  () => async () => async () => {
                    throw new Error('Plugin cleanup failed');
                  },
                ]
              : [],
    onError: (error, phase, context) => {
      if (context) window.recoveryContext = context;
      if (context && new URLSearchParams(window.location.search).has('restore-in-error-callback')) {
        const previous = context.getPreviousMarkdown();
        window.restoreSerializer();
        window.uploadEditor!.setMarkdown(previous);
      }
      if (pluginViewFailure || pluginAppendThrow || pluginFilterExternal)
        (window.asyncParseErrors ??= []).push(`${phase}: ${String(error)}`);
      if (new URLSearchParams(window.location.search).has('serialize-replacement-probe')) {
        const state = window as Window & { replacementErrors?: string[]; rollbackErrors?: string[] };
        (state.replacementErrors ??= []).push(`${phase}: ${String(error)}`);
        if (error instanceof ExternalUpdateRollbackError) {
          state.rollbackErrors = error.errors.map(String);
        }
      }
      if (externalReentrantFailure) {
        const state = window as Window & { externalReentrantErrors?: string[] };
        (state.externalReentrantErrors ??= []).push(`${phase}: ${String(error)}`);
      }
      if (failureReentrant) {
        const state = window as Window & { failureReentrantErrors?: string[] };
        (state.failureReentrantErrors ??= []).push(`${phase}: ${String(error)}`);
      }
      if (new URLSearchParams(window.location.search).has('async-reporter-failure')) {
        (window.asyncParseErrors ??= []).push(`${phase}: ${String(error)}`);
        throw new Error('Reporter failed');
      }
      if (imageEngineFailure) {
        const state = window as Window & { imageEngineErrors?: string[] };
        (state.imageEngineErrors ??= []).push(`${phase}: ${String(error)}`);
      }
      if (failInit) window.failedEditorError = `${phase}: ${String(error)}`;
      if (new URLSearchParams(window.location.search).has('throw-error-reporter')) throw new Error('Reporter failed');
      if (engineCleanup) {
        const state = window as Window & { engineCleanupErrors?: string[] };
        (state.engineCleanupErrors ??= []).push(`${phase}: ${String(error)}`);
      }
      if (nestedReentrant) {
        const state = window as Window & { nestedErrors?: string[] };
        (state.nestedErrors ??= []).push(`${phase}: ${String(error)}`);
      }
    },
    onChange: ({ markdown }) => {
      window.uploadChanges.push(markdown);
    },
    fileUpload: (_file, finish, { signal }) =>
      new Promise<void>((_resolve, reject) => {
        window.uploads.push({ finish, reject, signal });
      }),
  });
window.retryUploadEditor = () => {
  failInit = false;
  delayDestroy = false;
  rejectDestroy = false;
  return window.createUploadEditor();
};
window.editAndDestroySynchronously = async () => {
  const instance = window.uploadEditor!;
  const view = getInternalEditor(instance).action((ctx) => ctx.get(editorViewCtx));
  view.dispatch(view.state.tr.insertText('draft ', 1));
  const destruction = instance.destroy();
  const immediate = instance.getMarkdown();
  await destruction;
  return { immediate, after: instance.getMarkdown() };
};
window.editorStateIsAligned = () =>
  getInternalEditor(window.uploadEditor!).action((ctx) => ctx.get(editorStateCtx) === ctx.get(editorViewCtx).state);
window.recoverPendingEditDuringFailure = () => {
  const instance = window.uploadEditor!;
  const editor = getInternalEditor(instance);
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  view.dispatch(view.state.tr.insertText('!', view.state.doc.content.size - 1));
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  let broken = false;
  editor.action((ctx) =>
    ctx.set(serializerCtx, (doc) => {
      if (doc.textContent === 'External!') broken = true;
      if (broken) throw new Error('Persistent serialization failure');
      return original(doc);
    }),
  );
  instance.setMarkdown('External');
  const previous = window.recoveryContext!.getPreviousMarkdown();
  editor.action((ctx) => ctx.set(serializerCtx, original));
  return { previous, current: instance.getMarkdown() };
};
window.measureExternalAfterLocalEdit = async (source, target, settle) => {
  const instance = window.uploadEditor!;
  instance.setMarkdown(source, { emit: false });
  await Promise.resolve();
  const view = getInternalEditor(instance).action((ctx) => ctx.get(editorViewCtx));
  view.dispatch(view.state.tr.insertText('!', 1));
  if (settle) await Promise.resolve();
  const start = performance.now();
  instance.setMarkdown(target);
  const elapsed = performance.now() - start;
  if (instance.getMarkdown() !== target) throw new Error('Benchmark external update was not applied');
  return elapsed;
};
window.editAndDestroyReentrantly = () => {
  const instance = window.uploadEditor!;
  const editor = getInternalEditor(instance);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  let nested: Promise<void> | undefined;
  editor.action((ctx) =>
    ctx.set(serializerCtx, (doc) => {
      nested ??= instance.destroy();
      return original(doc);
    }),
  );
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  view.dispatch(view.state.tr.insertText('draft ', 1));
  const outer = instance.destroy();
  window.firstEditorDestroy = outer;
  return { shared: nested === outer, markdown: instance.getMarkdown() };
};
window.editDuringDestroySnapshot = async () => {
  const instance = window.uploadEditor!;
  const editor = getInternalEditor(instance);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  let reenter = true;
  editor.action((ctx) =>
    ctx.set(serializerCtx, (doc) => {
      if (reenter) {
        reenter = false;
        const view = editor.action((inner) => inner.get(editorViewCtx));
        view.dispatch(view.state.tr.insertText('latest ', 1));
      }
      return original(doc);
    }),
  );
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  view.dispatch(view.state.tr.insertText('draft ', 1));
  await instance.destroy();
  return instance.getMarkdown();
};
window.destroyDuringExternalSerialization = async () => {
  const instance = window.uploadEditor!;
  const editor = getInternalEditor(instance);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  let calls = 0;
  let destruction: Promise<void> | undefined;
  editor.action((ctx) =>
    ctx.set(serializerCtx, (doc) => {
      if (++calls === 2) destruction = instance.destroy();
      return original(doc);
    }),
  );
  instance.setMarkdown('* Item\r\n\r\n');
  if (!destruction) throw new Error('Serializer did not destroy the editor');
  await destruction;
  return instance.getMarkdown();
};
window.installSerializerFailure = (after = 0) => {
  const editor = getInternalEditor(window.uploadEditor!);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  window.restoreSerializer = () => editor.action((ctx) => ctx.set(serializerCtx, original));
  let calls = 0;
  editor.action((ctx) =>
    ctx.set(serializerCtx, (doc) => {
      if (calls++ < after) return original(doc);
      throw new Error('Serialization failed');
    }),
  );
};
(window as Window & { installReentrantSnapshotFailure?: () => void }).installReentrantSnapshotFailure = () => {
  const editor = getInternalEditor(window.uploadEditor!);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  editor.action((ctx) => ctx.set(serializerCtx, (doc) => {
    if (doc.textContent === 'External!') throw new Error('Serialization failed');
    return original(doc);
  }));
};
(window as Window & { installComparisonFailure?: () => void }).installComparisonFailure = () => {
  const editor = getInternalEditor(window.uploadEditor!);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  window.restoreSerializer = () => editor.action((ctx) => ctx.set(serializerCtx, original));
  editor.action((ctx) => ctx.set(serializerCtx, (doc) => {
    if (doc.childCount === 1 && doc.firstChild?.type.name === 'bullet_list' && doc.textContent === 'External') {
      throw new Error('Comparison serialization failed');
    }
    return original(doc);
  }));
};
window.installSerializerCounter = () => {
  const editor = getInternalEditor(window.uploadEditor!);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  window.serializerCalls = 0;
  window.restoreSerializer = () => editor.action((ctx) => ctx.set(serializerCtx, original));
  editor.action((ctx) =>
    ctx.set(serializerCtx, (doc) => {
      window.serializerCalls! += 1;
      return original(doc);
    }),
  );
};
window.installSerializerReentry = () => {
  const editor = getInternalEditor(window.uploadEditor!);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  let reenter = true;
  window.restoreSerializer = () => editor.action((ctx) => ctx.set(serializerCtx, original));
  editor.action((ctx) =>
    ctx.set(serializerCtx, (doc) => {
      if (reenter) {
        reenter = false;
        window.uploadEditor!.setMarkdown('Latest', { emit: false });
      }
      return original(doc);
    }),
  );
};
window.installFinalSerializerEdit = () => {
  const editor = getInternalEditor(window.uploadEditor!);
  const original = editor.action((ctx) => ctx.get(serializerCtx));
  let calls = 0;
  editor.action((ctx) =>
    ctx.set(serializerCtx, (doc) => {
      if (++calls === 2) {
        const view = editor.action((ctx) => ctx.get(editorViewCtx));
        view.dispatch(view.state.tr.insertText(' latest', 1));
      }
      return original(doc);
    }),
  );
};
if (imageEngineFailure) {
  (window as Window & { insertImageProbe?: (src: string) => void }).insertImageProbe = (src) => {
    const view = getInternalEditor(window.uploadEditor!).action((ctx) => ctx.get(editorViewCtx));
    view.dispatch(view.state.tr.insert(1, view.state.schema.nodes.image.create({ src, alt: 'probe' })));
  };
}
void window
  .createUploadEditor()
  .then((editor) => {
    window.uploadEditor = editor;
  })
  .catch((error: unknown) => {
    if (!failInit) throw error;
    window.failedEditorRejection = String(error);
    window.failedEditorRejected = true;
  });
