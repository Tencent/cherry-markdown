import { editorViewCtx, parserCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { Plugin, PluginKey, type Transaction } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { closeHistory } from '@milkdown/kit/prose/history';

const externalWrite = new PluginKey('client-external-markdown');

function isExternalWrite(transaction: Transaction): boolean {
  const original = transaction.getMeta('appendedTransaction') as Transaction | undefined;
  return Boolean(transaction.getMeta(externalWrite) || (original && isExternalWrite(original)));
}

/** Notify after the complete transaction batch, with the final view state available. */
export function documentChanges(onChange: () => void) {
  const key = new PluginKey<number>('client-document-changes');
  return new Plugin<number>({
    key,
    state: {
      init: () => 0,
      apply: (transaction, revision) => revision + (transaction.docChanged && !isExternalWrite(transaction) ? 1 : 0),
    },
    view: () => ({
      update: (view, previous) => {
        if (key.getState(view.state) !== key.getState(previous)) onChange();
      },
    }),
  });
}

export function writeMarkdown(ctx: Ctx, markdown: string, addToHistory = false) {
  const view = ctx.get(editorViewCtx);
  const doc = ctx.get(parserCtx)(markdown);
  if (!doc) throw new Error('Unable to parse Markdown.');
  view.dispatch(
    closeHistory(view.state.tr)
      .replaceWith(0, view.state.doc.content.size, doc.content)
      .setMeta(externalWrite, true)
      .setMeta('addToHistory', addToHistory),
  );
}

/** Reset only history; keep other plugin state, document, selection and NodeViews. */
export function clearHistory(view: EditorView, history: Plugin) {
  const { plugins } = view.state;
  view.updateState(
    view.state.reconfigure({ plugins: plugins.filter((plugin) => plugin !== history) }).reconfigure({ plugins }),
  );
}
