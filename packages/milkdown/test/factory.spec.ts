import { editorStateCtx, editorViewCtx, parserCtx, serializerCtx } from '@milkdown/kit/core';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state';
import { isHistoryTransaction, undo } from '@milkdown/kit/prose/history';
import { DOMParser, DOMSerializer, type Node as ProseMirrorNode } from '@milkdown/kit/prose/model';
import { $prose } from '@milkdown/kit/utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';
import {
  createTestEditor as cherryMilkdown,
  type TestCherryMilkdownInstance as CherryMilkdownInstance,
} from './helpers/create-editor';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg data-rendered-mermaid="true"></svg>' })),
  },
}));

vi.mock('mathlive', () => ({}));

const instances: CherryMilkdownInstance[] = [];
const fullManual = readFileSync(resolve(import.meta.dirname, '../../../examples/assets/markdown/index.md'), 'utf8');

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

afterEach(async () => {
  await Promise.all(instances.splice(0).map((instance) => instance.destroy()));
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function root() {
  const element = document.createElement('div');
  document.body.append(element);
  return element;
}

function selectNode(instance: CherryMilkdownInstance, typeName: string) {
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  let target = -1;
  view.state.doc.descendants((node, position) => {
    if (target < 0 && node.type.name === typeName) target = position;
  });
  if (target >= 0) view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, target)));
  return view;
}

function replaceText(instance: CherryMilkdownInstance, before: string, after: string) {
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  let from = -1;
  view.state.doc.descendants((node, position) => {
    const offset = node.isText ? (node.text?.indexOf(before) ?? -1) : -1;
    if (from < 0 && offset >= 0) from = position + offset;
  });
  if (from < 0) throw new Error(`Missing document text: ${before}`);
  view.dispatch(view.state.tr.insertText(after, from, from + before.length));
  return view;
}

describe('cherryMilkdown WYSIWYG', () => {
  it('does not restore older source over a plugin edit appended to undo', async () => {
    const plugin = $prose(
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
    );
    const source = 'Heading\n=======\n\n[Same][ref].[^note]\n\nEdit here.\n\n[ref]: https://example.com/path\n\n[^note]: Footnote text.\n';
    const instance = await cherryMilkdown({ el: root(), value: source, plugins: [plugin] });
    instances.push(instance);
    const view = replaceText(instance, 'Edit here.', 'Changed.');
    expect(instance.getMarkdown()).toContain('Changed.');
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(view.state.doc.textContent).toContain('Edit here.!');
    expect(instance.getMarkdown()).toContain('Edit here.!');
    expect(instance.getMarkdown()).not.toBe(source);
  });

  it('preserves a pending local edit when a plugin filters an external update', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const plugin = $prose(() => new Plugin({ filterTransaction: (transaction) => transaction.doc.textContent !== 'External' }));
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onChange, onError, debounce: 0 });
    instances.push(instance);
    const view = replaceText(instance, 'Before', 'Local');
    instance.setMarkdown('External', { emit: false });
    expect(view.state.doc.textContent).toBe('Local');
    expect(instance.getMarkdown()).toBe('Local');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Local' }));
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'External' });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('not applied') }), 'parse');
  });

  it('preserves original source formatting when a plugin filters an external update', async () => {
    const plugin = $prose(() => new Plugin({ filterTransaction: (transaction) => transaction.doc.textContent !== 'External' }));
    const instance = await cherryMilkdown({ el: root(), value: '* Item\r\n\r\n', plugins: [plugin] });
    instances.push(instance);
    instance.setMarkdown('External');
    expect(instance.getMarkdown()).toBe('* Item\r\n\r\n');
  });

  it('keeps the Milkdown state context aligned when an appended transaction throws', async () => {
    const onError = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) => {
            if (state.doc.textContent === 'External') throw new Error('Append failed');
            return null;
          },
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onError });
    instances.push(instance);
    const view = replaceText(instance, 'Before', 'Local');
    await Promise.resolve();
    const previousState = view.state;
    instance.setMarkdown('External');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Append failed' }), 'parse');
    expect(view.state).toBe(previousState);
    expect(instance.editor.action((ctx) => ctx.get(editorStateCtx))).toBe(previousState);
    expect(instance.getMarkdown()).toBe('Local');
    replaceText(instance, 'Local', 'Continued');
    expect(instance.getMarkdown()).toBe('Continued');
    expect(instance.editor.action((ctx) => ctx.get(editorStateCtx))).toBe(view.state);
  });

  it('reconciles the live document after a plugin view throws during an external update', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    let fail = true;
    const plugin = $prose(
      () =>
        new Plugin({
          view: () => ({
            update: (view) => {
              if (fail && view.state.doc.textContent === 'External') {
                fail = false;
                throw new Error('Plugin view failed');
              }
            },
          }),
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onChange, onError });
    instances.push(instance);
    replaceText(instance, 'Before', 'Local');
    instance.setMarkdown('External');
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.state.doc.textContent).toBe('External');
    expect(instance.getMarkdown()).toBe('External');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Plugin view failed' }),
      'parse',
      expect.objectContaining({ getPreviousMarkdown: expect.any(Function) }),
    );
    const context = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string };
    expect(context.getPreviousMarkdown()).toBe('Local');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'External' }));
  });

  it.each([true, false])('reconciles plugin changes appended to an external update (emit: %s)', async (emit) => {
    const onChange = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) =>
            state.doc.textContent === 'External' ? state.tr.insertText('!', state.doc.content.size - 1) : null,
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onChange, debounce: 0 });
    instances.push(instance);
    instance.setMarkdown('External', { emit });
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.state.doc.textContent).toBe('External!');
    expect(instance.getMarkdown()).toBe('External!');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'External!' }));
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'External' });
  });

  it('retains an empty paragraph appended by a plugin to an external update', async () => {
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) =>
            state.doc.textContent === 'External' && state.doc.childCount === 1
              ? state.tr.insert(state.doc.content.size, state.schema.nodes.paragraph.create())
              : null,
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin] });
    instances.push(instance);
    instance.setMarkdown('External', { emit: false });
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.state.doc.childCount).toBe(2);
    expect(instance.getMarkdown()).toBe('External\n\n');
  });

  it.each([true, false])('reconciles a document changed during final serialization (emit: %s)', async (emit) => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, debounce: 0 });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (++calls === 2) replaceText(instance, 'External', 'Latest');
        return original(doc);
      }),
    );
    instance.setMarkdown('External', { emit });
    expect(instance.getMarkdown()).toBe('Latest');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Latest' }));
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'External' });
  });

  it('reconciles a newer local edit started by the serializer without publishing the old one', async () => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, debounce: 0 });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let reenter = true;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (reenter) {
          reenter = false;
          replaceText(instance, 'First', 'Latest');
        }
        return original(doc);
      }),
    );
    const view = replaceText(instance, 'Before', 'First');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Latest' }));
    expect(view.state.doc.textContent).toBe('Latest');
    expect(instance.getMarkdown()).toBe('Latest');
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'First' });
  });

  it('does not overwrite a newer external update started by local serialization', async () => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, debounce: 0 });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let reenter = true;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (reenter) {
          reenter = false;
          instance.setMarkdown('Latest', { emit: false });
        }
        return original(doc);
      }),
    );
    const view = replaceText(instance, 'Before', 'First');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(view.state.doc.textContent).toBe('Latest');
    expect(instance.getMarkdown()).toBe('Latest');
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'First' });
  });

  it('recovers a local change after serialization fails without publishing an older notification', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, onError, debounce: 250 });
    instances.push(instance);
    replaceText(instance, 'Before', 'First');
    await Promise.resolve();
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, () => {
        throw new Error('Serialization failed');
      }),
    );
    replaceText(instance, 'First', 'Latest');
    await vi.waitFor(() =>
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Serialization failed' }), 'parse'),
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(onChange).not.toHaveBeenCalled();
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(instance.getMarkdown()).toBe('Latest');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Latest' }));
  });

  it('keeps a sibling editor and its pending notification independent during rollback', async () => {
    const firstChanges = vi.fn();
    const secondChanges = vi.fn();
    const firstErrors = vi.fn();
    const first = await cherryMilkdown({
      el: root(),
      value: 'First',
      onChange: firstChanges,
      onError: firstErrors,
      debounce: 30,
    });
    const second = await cherryMilkdown({ el: root(), value: 'Second', onChange: secondChanges, debounce: 30 });
    instances.push(first, second);
    replaceText(first, 'First', 'First!');
    replaceText(second, 'Second', 'Second?');
    await Promise.resolve();
    const original = first.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    first.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (++calls > 1) throw new Error('Serialization failed');
        return original(doc);
      }),
    );
    first.setMarkdown('External');
    first.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(first.getMarkdown()).toBe('First!');
    expect(second.getMarkdown()).toBe('Second?');
    expect(firstErrors).toHaveBeenCalledWith(expect.objectContaining({ message: 'Serialization failed' }), 'parse');
    await vi.waitFor(() => expect(firstChanges).toHaveBeenCalledWith({ markdown: 'First!' }));
    await vi.waitFor(() => expect(secondChanges).toHaveBeenCalledWith({ markdown: 'Second?' }));
    await first.destroy();
    replaceText(second, 'Second?', 'Still independent');
    await vi.waitFor(() => expect(second.getMarkdown()).toBe('Still independent'));
  });

  it('serializes a no-op external update once and keeps its notification', async () => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Same', onChange, debounce: 0 });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    const serializer = vi.fn(original);
    instance.editor.action((ctx) => ctx.set(serializerCtx, serializer));
    instance.setMarkdown('Same');
    expect(serializer).toHaveBeenCalledOnce();
    expect(instance.getMarkdown()).toBe('Same');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Same' }));
  });

  it('keeps pending local notification when a no-op update cannot be serialized', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, onError, debounce: 40 });
    instances.push(instance);
    const view = replaceText(instance, 'Before', 'Local');
    await Promise.resolve();
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, () => {
        throw new Error('Serialization failed');
      }),
    );
    instance.setMarkdown('Local');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(view.state.doc.textContent).toBe('Local');
    expect(instance.getMarkdown()).toBe('Local');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Serialization failed' }), 'parse');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Local' }));
  });

  it('preserves a pending local edit when an external update cannot be serialized', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, onError, debounce: 40 });
    instances.push(instance);
    const view = replaceText(instance, 'Before', 'Local');
    await Promise.resolve();
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, () => {
        throw new Error('Serialization failed');
      }),
    );
    instance.setMarkdown('External');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Serialization failed' }), 'parse');
    expect(view.state.doc.textContent).toBe('Local');
    expect(instance.getMarkdown()).toBe('Local');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Local' }));
  });

  it('preserves local input when serialization fails after an external transaction', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, onError, debounce: 40 });
    instances.push(instance);
    const view = replaceText(instance, 'Before', 'Local');
    await Promise.resolve();
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (++calls > 1) throw new Error('Post-transaction serialization failed');
        return original(doc);
      }),
    );
    instance.setMarkdown('External');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Post-transaction serialization failed' }),
      'parse',
    );
    expect(view.state.doc.textContent).toBe('Local');
    expect(instance.getMarkdown()).toBe('Local');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Local' }));
  });

  it('restores plugin state and the Milkdown state context after a failed replacement', async () => {
    const key = new PluginKey<number>('external-rollback-counter');
    const plugin = $prose(() => new Plugin({ key, state: { init: () => 0, apply: (_tr, count) => count + 1 } }));
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin] });
    instances.push(instance);
    const view = replaceText(instance, 'Before', 'Local');
    await Promise.resolve();
    const previousState = view.state;
    const previousCount = key.getState(previousState);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (++calls > 1) throw new Error('Post-transaction serialization failed');
        return original(doc);
      }),
    );
    instance.setMarkdown('External');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(view.state).toBe(previousState);
    expect(key.getState(view.state)).toBe(previousCount);
    expect(instance.editor.action((ctx) => ctx.get(editorStateCtx))).toBe(previousState);
    expect(instance.getMarkdown()).toBe('Local');
  });

  it('does not roll back over a plugin document change after a failed replacement', async () => {
    const onError = vi.fn();
    const onChange = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) => {
            if (state.doc.textContent !== 'External') return null;
            return state.tr.insertText('!', state.doc.content.size - 1);
          },
        }),
    );
    const instance = await cherryMilkdown({
      el: root(),
      value: 'Before',
      plugins: [plugin],
      onError,
      onChange,
      debounce: 0,
    });
    instances.push(instance);
    const view = replaceText(instance, 'Before', 'Local');
    await Promise.resolve();
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (++calls > 1) throw new Error('Post-transaction serialization failed');
        return original(doc);
      }),
    );
    instance.setMarkdown('External');
    const context = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string };
    expect(context.getPreviousMarkdown()).toBe('Local');
    await Promise.resolve();
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Post-transaction serialization failed' }),
      'parse',
      expect.objectContaining({ getPreviousMarkdown: expect.any(Function) }),
    );
    expect(view.state.doc.textContent).toBe('External!');
    expect(instance.getMarkdown()).toBe('External!');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'External!' }));
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'Local' });
  });

  it('exposes the previous local document after a failed replacement with plugin changes', async () => {
    const onError = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) =>
            state.doc.textContent === 'External' ? state.tr.insertText('!', state.doc.content.size - 1) : null,
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onError });
    instances.push(instance);
    replaceText(instance, 'Before', 'Local');
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let broken = false;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (doc.textContent === 'External!') broken = true;
        if (broken) throw new Error('Serialization failed');
        return original(doc);
      }),
    );
    instance.setMarkdown('External');
    const context = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string } | undefined;
    expect(context).toBeDefined();
    expect(context!.getPreviousMarkdown()).toBe('Local');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(context!.getPreviousMarkdown()).toBe('Local');
    expect(instance.getMarkdown()).toBe('External!');
    await instance.destroy();
    expect(context!.getPreviousMarkdown()).toBe('Local');
  });

  it('retains unsynchronized local input when serialization breaks after plugin changes', async () => {
    const onError = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) =>
            state.doc.textContent === 'External' ? state.tr.insertText('!', state.doc.content.size - 1) : null,
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onError });
    instances.push(instance);
    replaceText(instance, 'Before', 'Local');
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let broken = false;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (doc.textContent === 'External!') broken = true;
        if (broken) throw new Error('Persistent serialization failure');
        return original(doc);
      }),
    );
    instance.setMarkdown('External');
    const context = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string };
    expect(context.getPreviousMarkdown()).toBe('Local');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(instance.getMarkdown()).toBe('External!');
  });

  it('reconciles a committed plugin update if source comparison serialization fails', async () => {
    const onError = vi.fn();
    const onChange = vi.fn();
    const plugin = $prose(
      () => new Plugin({
        appendTransaction(_transactions, _oldState, state) {
          if (state.doc.textContent !== 'External') return null;
          let end = -1;
          state.doc.descendants((node, position) => {
            if (node.isText && node.text === 'External') end = position + node.nodeSize;
          });
          return end < 0 ? null : state.tr.insertText('!', end);
        },
      }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onError, onChange, debounce: 0 });
    instances.push(instance);
    replaceText(instance, 'Before', 'Local');
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    instance.editor.action((ctx) => ctx.set(serializerCtx, (doc) => {
      if (doc.childCount === 1 && doc.firstChild?.type.name === 'bullet_list' && doc.textContent === 'External') {
        throw new Error('Comparison serialization failed');
      }
      return original(doc);
    }));
    instance.setMarkdown('- External');
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.state.doc.textContent).toBe('External!');
    const context = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string } | undefined;
    expect(context?.getPreviousMarkdown()).toBe('Local');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(instance.getMarkdown()).toContain('External!');
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ markdown: expect.stringContaining('External!') }));
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'Local' });
  });

  it('keeps recovery snapshots independent across failures and destruction', async () => {
    const onError = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) =>
            state.doc.textContent === 'External' ? state.tr.insertText('!', state.doc.content.size - 1) : null,
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'First', plugins: [plugin], onError });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    const failAfterAppend = () => {
      instance.editor.action((ctx) =>
        ctx.set(serializerCtx, (doc) => {
          if (doc.textContent === 'External!') throw new Error('Serialization failed');
          return original(doc);
        }),
      );
      instance.setMarkdown('External');
      instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    };
    failAfterAppend();
    const first = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string };
    instance.setMarkdown('Second', { emit: false });
    failAfterAppend();
    const second = onError.mock.calls[1]?.[2] as { getPreviousMarkdown(): string };
    expect(first.getPreviousMarkdown()).toBe('First');
    expect(second.getPreviousMarkdown()).toBe('Second');
    await instance.destroy();
    expect(first.getPreviousMarkdown()).toBe('First');
    expect(second.getPreviousMarkdown()).toBe('Second');
  });

  it('allows an application to restore the previous document from its error callback', async () => {
    const onChange = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) =>
            state.doc.textContent === 'External' ? state.tr.insertText('!', state.doc.content.size - 1) : null,
        }),
    );
    let recover: ((markdown: string) => void) | undefined;
    const onError = vi.fn((_error, _phase, context: { getPreviousMarkdown(): string } | undefined) => {
      if (context) recover?.(context.getPreviousMarkdown());
    });
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onChange, onError, debounce: 0 });
    instances.push(instance);
    replaceText(instance, 'Before', 'Local');
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (doc.textContent === 'External!') throw new Error('Serialization failed');
        return original(doc);
      }),
    );
    recover = (markdown) => {
      instance.editor.action((ctx) => ctx.set(serializerCtx, original));
      instance.setMarkdown(markdown);
    };
    instance.setMarkdown('External');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(instance.getMarkdown()).toBe('Local');
    expect(instance.editor.action((ctx) => ctx.get(editorViewCtx).state.doc.textContent)).toBe('Local');
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ markdown: 'Local' }));
  });

  it('does not apply an older external update when snapshot serialization triggers a newer one', async () => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, debounce: 0 });
    instances.push(instance);
    replaceText(instance, 'Before', 'Local');
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let reenter = true;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (reenter) {
          reenter = false;
          instance.setMarkdown('Latest');
        }
        return original(doc);
      }),
    );
    instance.setMarkdown('External');
    expect(instance.getMarkdown()).toBe('Latest');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Latest' }));
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'External' });
  });

  it('preserves source formatting in the recovered local document before notification', async () => {
    const onError = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) =>
            state.doc.textContent === 'External' ? state.tr.insertText('!', state.doc.content.size - 1) : null,
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: '* Item\r\n\r\n', plugins: [plugin], onError });
    instances.push(instance);
    replaceText(instance, 'Item', 'Item!');
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let broken = false;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (doc.textContent === 'External!') broken = true;
        if (broken) throw new Error('Serialization failed');
        return original(doc);
      }),
    );
    instance.setMarkdown('External');
    const context = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string };
    expect(context.getPreviousMarkdown()).toBe('* Item!\r\n\r\n');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    const current = instance.getMarkdown();
    expect(context.getPreviousMarkdown()).toBe('* Item!\r\n\r\n');
    expect(current.trim()).toBe('External!');
    expect(instance.getMarkdown()).toBe(current);
  });

  it.each([false, true])('keeps a newer external update started during rollback (plugin throws: %s)', async (throws) => {
    const onChange = vi.fn();
    const onError = vi.fn();
    let instance: CherryMilkdownInstance;
    let trigger = false;
    const plugin = $prose(
      (ctx) =>
        new Plugin({
          view: () => ({
            update: (view) => {
              if (trigger && view.state.doc.textContent === 'Local') {
                trigger = false;
                ctx.set(serializerCtx, original);
                instance.setMarkdown('Latest');
                if (throws) throw new Error('Obsolete rollback plugin error');
              }
            },
          }),
        }),
    );
    let original!: (doc: ProseMirrorNode) => string;
    instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onChange, onError, debounce: 0 });
    instances.push(instance);
    replaceText(instance, 'Before', 'Local');
    await Promise.resolve();
    original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (++calls > 1) throw new Error('Post-transaction serialization failed');
        return original(doc);
      }),
    );
    trigger = true;
    instance.setMarkdown('External');
    expect(instance.getMarkdown()).toBe('Latest');
    expect(onError).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Latest' }));
  });

  it.each([false, true])('publishes a plugin document transaction during rollback (plugin throws: %s)', async (throws) => {
    const onChange = vi.fn();
    const onError = vi.fn();
    let trigger = false;
    const plugin = $prose(
      () =>
        new Plugin({
          view: () => ({
            update: (view) => {
              if (trigger && view.state.doc.textContent === 'Local') {
                trigger = false;
                view.dispatch(view.state.tr.insertText('!', view.state.doc.content.size - 1));
                if (throws) throw new Error('Plugin view failed during rollback');
              }
            },
          }),
        }),
    );
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onChange, onError, debounce: 0 });
    instances.push(instance);
    const view = replaceText(instance, 'Before', 'Local');
    await Promise.resolve();
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (++calls > 1) throw new Error('Post-transaction serialization failed');
        return original(doc);
      }),
    );
    trigger = true;
    instance.setMarkdown('External');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(onError).toHaveBeenCalledTimes(1);
    const reported = onError.mock.calls[0][0] as Error;
    if (throws) {
      expect(reported.name).toBe('ExternalUpdateRollbackError');
      expect((reported as Error & { errors: Error[] }).errors.map((error) => error.message)).toEqual([
        'Post-transaction serialization failed',
        'Plugin view failed during rollback',
      ]);
    } else expect(reported.message).toBe('Post-transaction serialization failed');
    expect(view.state.doc.textContent).toBe('Local!');
    expect(instance.getMarkdown()).toBe('Local!');
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ markdown: 'Local!' }));
  });

  it.each([false, true])('exposes local source if a rollback plugin replaces it (plugin throws: %s)', async (throws) => {
    const onError = vi.fn();
    let trigger = false;
    const plugin = $prose(() => new Plugin({
      view: () => ({ update: (view) => {
        if (trigger && view.state.doc.textContent === 'Local') {
          trigger = false;
          view.dispatch(view.state.tr.insertText('Plugin', 1, view.state.doc.content.size - 1));
          if (throws) throw new Error('Plugin failed');
        }
      } }),
    }));
    const instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin], onError });
    instances.push(instance);
    replaceText(instance, 'Before', 'Local');
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let externalCalls = 0;
    instance.editor.action((ctx) => ctx.set(serializerCtx, (doc) => {
      if (doc.textContent === 'External' && ++externalCalls > 1) throw new Error('Serialization failed');
      return original(doc);
    }));
    trigger = true;
    instance.setMarkdown('External');
    const context = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string } | undefined;
    expect(context?.getPreviousMarkdown()).toBe('Local');
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    expect(instance.getMarkdown()).toBe('Plugin');
  });

  it('retains a reentrant update snapshot after a plugin changes the document and serialization fails', async () => {
    let instance: CherryMilkdownInstance;
    let reenter = false;
    const onError = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          appendTransaction: (_transactions, _oldState, state) =>
            state.doc.textContent === 'External' ? state.tr.insertText('!', state.doc.content.size - 1) : null,
          view: () => ({
            update: (view) => {
              if (reenter && view.state.doc.textContent === 'Middle') {
                reenter = false;
                instance.setMarkdown('External');
              }
            },
          }),
        }),
    );
    instance = await cherryMilkdown({ el: root(), value: 'Old', plugins: [plugin], onError });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    instance.editor.action((ctx) => ctx.set(serializerCtx, (doc) => {
      if (doc.textContent === 'External!') throw new Error('Serialization failed');
      return original(doc);
    }));
    reenter = true;
    instance.setMarkdown('Middle');
    const context = onError.mock.calls[0]?.[2] as { getPreviousMarkdown(): string } | undefined;
    expect(context).toBeDefined();
    await instance.destroy();
    expect(context!.getPreviousMarkdown()).toBe('Middle');
  });

  it('keeps a newer external update started synchronously by a plugin view', async () => {
    const container = root();
    let instance: CherryMilkdownInstance;
    let reenter = false;
    const onChange = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          view: () => ({
            update: (view) => {
              if (reenter && view.state.doc.textContent.includes('Middle')) {
                reenter = false;
                instance.setMarkdown('Latest');
              }
            },
          }),
        }),
    );
    instance = await cherryMilkdown({ el: container, value: 'Old', plugins: [plugin], onChange, debounce: 0 });
    instances.push(instance);
    reenter = true;
    instance.setMarkdown('Middle');
    expect(instance.getMarkdown()).toBe('Latest');
    expect(container.querySelector('.ProseMirror')?.textContent).toBe('Latest');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Latest' }));
    expect(onChange).not.toHaveBeenCalledWith({ markdown: 'Middle' });
  });

  it('does not emit an older external update after a reentrant silent replacement', async () => {
    let instance: CherryMilkdownInstance;
    let reenter = false;
    const onChange = vi.fn();
    const plugin = $prose(
      () =>
        new Plugin({
          view: () => ({
            update: (view) => {
              if (reenter && view.state.doc.textContent.includes('Middle')) {
                reenter = false;
                instance.setMarkdown('Latest', { emit: false });
              }
            },
          }),
        }),
    );
    instance = await cherryMilkdown({ el: root(), value: 'Old', plugins: [plugin], onChange, debounce: 0 });
    instances.push(instance);
    reenter = true;
    instance.setMarkdown('Middle');
    expect(instance.getMarkdown()).toBe('Latest');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the applied update when a reentrant replacement cannot be parsed', async () => {
    let instance: CherryMilkdownInstance;
    let reenter = false;
    const onChange = vi.fn();
    const onError = vi.fn();
    const plugin = $prose(
      (ctx) =>
        new Plugin({
          view: () => {
            const parse = ctx.get(parserCtx);
            ctx.set(parserCtx, (source) => {
              if (source === 'Rejected') throw new Error('Invalid replacement');
              return parse(source);
            });
            return {
              update: (view) => {
                if (reenter && view.state.doc.textContent.includes('Middle')) {
                  reenter = false;
                  instance.setMarkdown('Rejected');
                }
              },
            };
          },
        }),
    );
    const container = root();
    instance = await cherryMilkdown({ el: container, value: 'Old', plugins: [plugin], onChange, onError, debounce: 0 });
    instances.push(instance);
    reenter = true;
    instance.setMarkdown('Middle');
    expect(container.querySelector('.ProseMirror')?.textContent).toBe('Middle');
    expect(instance.getMarkdown()).toBe('Middle');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid replacement' }), 'parse');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ markdown: 'Middle' }));
  });

  it('preserves the engine validation error if the create error reporter throws', async () => {
    const container = root();
    container.textContent = 'Consumer-owned';
    const onError = vi.fn(() => {
      throw new Error('Reporter failed');
    });
    await expect(cherryMilkdown({ el: container, engine: {}, onError })).rejects.toThrow(
      'cherryMilkdown requires an engine with makeHtml(markdown).',
    );
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError), 'create');
    expect(container.textContent).toBe('Consumer-owned');
    expect(container.querySelector('.ProseMirror')).toBeNull();
  });

  it('cleans up an initialized editor if baseline serialization fails', async () => {
    const container = root();
    const sibling = document.createElement('span');
    sibling.textContent = 'Consumer-owned';
    container.append(sibling);
    const cleanup = vi.fn();
    const onError = vi.fn();
    const failure = new Error('Serializer failed');
    const plugin = $prose(
      (ctx) =>
        new Plugin({
          view() {
            ctx.set(serializerCtx, () => {
              throw failure;
            });
            return { destroy: cleanup };
          },
        }),
    );
    await expect(cherryMilkdown({ el: container, value: 'Text', plugins: [plugin], onError })).rejects.toThrow(failure);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(failure, 'create');
    expect(container.textContent).toBe('Consumer-owned');
    expect(container.querySelector('.ProseMirror')).toBeNull();
  });

  it('preserves the creation failure and cleanup when its reporter throws', async () => {
    const container = root();
    container.textContent = 'Consumer-owned';
    const failure = new Error('Serializer failed');
    const cleanup = vi.fn();
    const onError = vi.fn(() => {
      throw new Error('Reporter failed');
    });
    const plugin = $prose(
      (ctx) =>
        new Plugin({
          view() {
            ctx.set(serializerCtx, () => {
              throw failure;
            });
            return { destroy: cleanup };
          },
        }),
    );
    await expect(cherryMilkdown({ el: container, value: 'Text', plugins: [plugin], onError })).rejects.toBe(failure);
    expect(onError).toHaveBeenCalledWith(failure, 'create');
    expect(cleanup).toHaveBeenCalledOnce();
    expect(container.textContent).toBe('Consumer-owned');
    expect(container.querySelector('.ProseMirror')).toBeNull();
  });
  it('does not emit an old draft after a silent API update', async () => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', debounce: 10, onChange });
    instances.push(instance);
    instance.setMarkdown('Pending');
    instance.setMarkdown('Latest', { emit: false });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onChange).not.toHaveBeenCalled();
    expect(instance.getMarkdown()).toBe('Latest');
  });

  it('retains a synchronous edit when destroyed before change reconciliation', async () => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', debounce: 1000, onChange });
    instances.push(instance);
    replaceText(instance, 'Before', 'After');
    const destruction = instance.destroy();
    expect(instance.getMarkdown()).toBe('After');
    await destruction;
    expect(instance.getMarkdown()).toBe('After');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('snapshots a previously failed local edit when serialization recovers before destroy', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, onError, debounce: 1000 });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, () => {
        throw new Error('Serialization failed');
      }),
    );
    replaceText(instance, 'Before', 'Latest');
    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    instance.editor.action((ctx) => ctx.set(serializerCtx, original));
    await instance.destroy();
    expect(instance.getMarkdown()).toBe('Latest');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('snapshots a newer local edit made during destroy serialization', async () => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', onChange, debounce: 0 });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let reenter = true;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (reenter) {
          reenter = false;
          replaceText(instance, 'First', 'Latest');
        }
        return original(doc);
      }),
    );
    replaceText(instance, 'Before', 'First');
    await instance.destroy();
    expect(instance.getMarkdown()).toBe('Latest');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('snapshots an external update when a plugin view destroys the editor during dispatch', async () => {
    let instance: CherryMilkdownInstance;
    let destruction: Promise<void> | undefined;
    const plugin = $prose(
      () =>
        new Plugin({
          view: () => ({
            update: (view) => {
              if (view.state.doc.textContent === 'External') destruction = instance.destroy();
            },
          }),
        }),
    );
    instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin] });
    instances.push(instance);
    instance.setMarkdown('External');
    expect(destruction).toBeDefined();
    await destruction;
    expect(instance.getMarkdown()).toBe('External');
  });

  it('retains external source formatting when destroyed during its dispatch', async () => {
    let instance: CherryMilkdownInstance;
    let destruction: Promise<void> | undefined;
    const plugin = $prose(
      () =>
        new Plugin({
          view: () => ({
            update: (view) => {
              if (view.state.doc.textContent === 'Item') destruction = instance.destroy();
            },
          }),
        }),
    );
    instance = await cherryMilkdown({ el: root(), value: 'Before', plugins: [plugin] });
    instances.push(instance);
    instance.setMarkdown('* Item\r\n\r\n');
    await destruction;
    expect(instance.getMarkdown()).toBe('* Item\r\n\r\n');
  });

  it('retains external source formatting when destroyed during final serialization', async () => {
    const instance = await cherryMilkdown({ el: root(), value: 'Before' });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    let destruction: Promise<void> | undefined;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        if (++calls === 2) destruction = instance.destroy();
        return original(doc);
      }),
    );
    instance.setMarkdown('* Item\r\n\r\n');
    expect(destruction).toBeDefined();
    await destruction;
    expect(instance.getMarkdown()).toBe('* Item\r\n\r\n');
  });

  it('finishes destruction and reports a document that never stabilizes during the snapshot', async () => {
    const container = root();
    const onError = vi.fn();
    const instance = await cherryMilkdown({ el: container, value: 'Before', onError });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let calls = 0;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        calls += 1;
        const view = instance.editor.action((inner) => inner.get(editorViewCtx));
        view.dispatch(view.state.tr.insertText('!', 1));
        return original(doc);
      }),
    );
    replaceText(instance, 'Before', 'First');
    await instance.destroy();
    expect(calls).toBe(5);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Unable to snapshot a document that keeps changing during destruction.' }),
      'parse',
    );
    expect(container.querySelector('.ProseMirror')).toBeNull();
  });

  it('shares teardown when the snapshot serializer reenters destroy', async () => {
    const container = root();
    const cleanup = vi.fn();
    const instance = await cherryMilkdown({ el: container, value: 'Before', plugins: [() => async () => cleanup] });
    instances.push(instance);
    const original = instance.editor.action((ctx) => ctx.get(serializerCtx));
    let nested: Promise<void> | undefined;
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, (doc) => {
        nested ??= instance.destroy();
        return original(doc);
      }),
    );
    replaceText(instance, 'Before', 'After');
    const outer = instance.destroy();
    expect(nested).toBe(outer);
    await outer;
    expect(cleanup).toHaveBeenCalledOnce();
    expect(instance.getMarkdown()).toBe('After');
    expect(container.querySelector('.ProseMirror')).toBeNull();
  });

  it('finishes teardown even when snapshot serialization and its error reporter fail', async () => {
    const container = root();
    const failure = new Error('Serialization failed');
    const onError = vi.fn(() => {
      throw new Error('Reporter failed');
    });
    const instance = await cherryMilkdown({ el: container, value: 'Before', onError });
    instances.push(instance);
    replaceText(instance, 'Before', 'After');
    instance.editor.action((ctx) =>
      ctx.set(serializerCtx, () => {
        throw failure;
      }),
    );
    await expect(instance.destroy()).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith(failure, 'parse');
    expect(container.querySelector('.ProseMirror')).toBeNull();
  });

  it('keeps sibling DOM and isolated instances intact during destruction', async () => {
    const container = root();
    const sibling = document.createElement('span');
    sibling.textContent = 'Consumer-owned';
    container.append(sibling);
    const first = await cherryMilkdown({ el: container, value: 'One' });
    const second = await cherryMilkdown({ el: root(), value: 'Two' });
    instances.push(first, second);
    await first.destroy();
    await first.destroy();
    expect(container.textContent).toBe('Consumer-owned');
    expect(second.getMarkdown()).toBe('Two');
    second.setMarkdown('Independent');
    expect(second.getMarkdown()).toBe('Independent');
  });

  it('retains the public engine and last Markdown after destruction without mutating caller options', async () => {
    const engine = { makeHtml: (markdown: string) => markdown };
    const onError = vi.fn();
    const options = { el: root(), value: 'Before', engine, onError };
    const instance = await cherryMilkdown(options);
    instances.push(instance);
    replaceText(instance, 'Before', 'After');
    await instance.destroy();
    expect(instance.engine).toBe(engine);
    expect(instance.getMarkdown()).toBe('After');
    expect(options.engine).toBe(engine);
    expect(options.onError).toBe(onError);
    await expect(instance.destroy()).resolves.toBeUndefined();
  });

  it('waits for the same asynchronous cleanup on concurrent destroy calls', async () => {
    const container = root();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const cleanup = vi.fn(async () => {
      await pending;
    });
    const plugin = () => async () => cleanup;
    const instance = await cherryMilkdown({ el: container, value: 'Text', plugins: [plugin] });
    instances.push(instance);
    const first = instance.destroy();
    let secondFinished = false;
    const second = instance.destroy().then(() => {
      secondFinished = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      expect(cleanup).toHaveBeenCalledOnce();
      expect(secondFinished).toBe(false);
      expect(container.querySelector('.ProseMirror')).not.toBeNull();
    } finally {
      release();
      await Promise.all([first, second]);
    }
    expect(container.querySelector('.ProseMirror')).toBeNull();
  });

  it('reports an asynchronous cleanup failure to every concurrent destroy caller', async () => {
    const container = root();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const failure = new Error('Cleanup failed');
    const cleanup = vi.fn(async () => {
      await pending;
      throw failure;
    });
    const instance = await cherryMilkdown({ el: container, value: 'Text', plugins: [() => async () => cleanup] });
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const destroyView = vi.spyOn(view, 'destroy');
    const results = Promise.allSettled([instance.destroy(), instance.destroy()]);
    release();
    expect(await results).toEqual([
      { status: 'rejected', reason: failure },
      { status: 'rejected', reason: failure },
    ]);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(destroyView).toHaveBeenCalledOnce();
    expect(container.querySelector('.ProseMirror')).toBeNull();
  });
  it('keeps 50 rapid inline-code edits monotonic while public notifications stay debounced', async () => {
    const element = root();
    const onChange = vi.fn();
    const instance = await cherryMilkdown({
      el: element,
      value: 'Use `x` here.',
      debounce: 1000,
      onChange,
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let position = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === 'x') position = pos + 1;
    });

    for (let index = 0; index < 50; index += 1) {
      view.dispatch(view.state.tr.insertText(String(index % 10), position + index));
      await Promise.resolve();
      expect(instance.getMarkdown()).toContain(`\`x${Array.from({ length: index + 1 }, (_, i) => i % 10).join('')}\``);
    }

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a single editable content surface with no raw cards or preview pane', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '# Hello\n\n[[toc]]\n\nText !!red color!!, ==highlight== and $E=mc^2$.',
    });
    instances.push(instance);

    expect(element.querySelector('h1')?.textContent).toBe('Hello');
    expect(element.querySelector('.toc')).not.toBeNull();
    expect(element.querySelector('.cherry-wysiwyg-color')?.textContent).toBe('color');
    expect(element.querySelector('.cherry-wysiwyg-highlight')?.textContent).toBe('highlight');
    expect(element.querySelector('math-field')).not.toBeNull();
    expect(element.querySelector('[data-cherry-raw]')).toBeNull();
    expect(element.querySelector('.cherry-editor, .cm-editor')).toBeNull();
    expect(element.querySelectorAll('.ProseMirror')).toHaveLength(1);
  });

  it('keeps native controls limited to compound labels', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: [
        '---',
        'title: Cherry',
        '---',
        '',
        ':::warning Notice',
        'Body',
        ':::',
        '',
        '[ref]: https://example.com',
        '',
        '```mermaid',
        'graph TD; A-->B;',
        '```',
      ].join('\n'),
    });
    instances.push(instance);

    expect(element.querySelectorAll('input')).not.toHaveLength(0);
    expect(element.querySelector('.ProseMirror select, .ProseMirror textarea')).toBeNull();
    expect(element.querySelector('.cherry-milkdown-node-controls')).toBeNull();
    expect(element.querySelectorAll('[contenteditable="true"]')).not.toHaveLength(0);
  });

  it('keeps Cherry visual syntax reversible through Markdown serialization', async () => {
    const element = root();
    const value = [
      '[[toc]]',
      '',
      'Text !!#f00 red!!, !!!#fff bg!!!, !18 size!, ^^sub^^, ^sup^, {字|zi}, /under/, ==mark==.',
    ].join('\n');
    const instance = await cherryMilkdown({ el: element, value });
    instances.push(instance);
    const markdown = instance.getMarkdown();

    for (const syntax of ['[[toc]]', '!!#f00 red!!', '!!!#fff bg!!!', '!18 size!', '^^sub^^', '^sup^']) {
      expect(markdown).toContain(syntax);
    }
    expect(markdown).toContain('{字|zi}');
    expect(markdown).toContain('/under/');
    expect(markdown).toContain('==mark==');
  });

  it('keeps Cherry link attributes out of the visible text and round-trips them', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '[Cherry](https://example.com){target=\\_blank}',
    });
    instances.push(instance);

    const link = element.querySelector<HTMLAnchorElement>('.ProseMirror a');
    expect(element.querySelector('.ProseMirror')?.textContent).toBe('Cherry');
    expect(link?.target).toBe('');
    const paragraphHtml = link?.parentElement?.innerHTML;
    link?.addEventListener('click', (event) => event.preventDefault());
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(link?.target).toBe('');
    expect(link?.rel).toBe('');
    expect(link?.parentElement?.innerHTML).toBe(paragraphHtml);

    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(open).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener');
    expect(instance.getMarkdown()).toContain('{target=\\_blank}');
  });

  it.each([
    ['existing link', '[link](https://old.example)', 'Prefix\n\n[link](https://old.example)', true],
    ['plain selection', 'link', 'Prefix\n\nlink', true],
    ['changed link', '[link](https://old.example)', '[link](https://new.example)', false],
    ['ambiguous selection', 'link', 'link\n\nlink', false],
    [
      'duplicate link',
      '[link](https://old.example)',
      '[link](https://old.example)\n\n[link](https://old.example)',
      false,
    ],
  ] as const)('preserves only a safe %s after an external update', async (_name, value, replacement, keepOpen) => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let from = -1;
    let linkMark: ReturnType<typeof view.state.schema.marks.link.create> | undefined;
    view.state.doc.descendants((node, position) => {
      if (node.isText && node.text === 'link') {
        from = position;
        linkMark = view.state.schema.marks.link.isInSet(node.marks);
      }
    });
    expect(from).toBeGreaterThanOrEqual(0);
    view.dom.dispatchEvent(
      new CustomEvent('cherry-milkdown:edit-link', { bubbles: true, detail: { from, to: from + 4, mark: linkMark } }),
    );
    const form = element.querySelector<HTMLFormElement>('.cherry-milkdown-link-editor')!;
    const href = form.querySelector<HTMLInputElement>('input[name="href"]')!;
    href.value = 'https://edited.example';
    instance.setMarkdown(replacement);
    expect(form.hidden).toBe(!keepOpen);
    if (keepOpen) {
      expect(href.value).toBe('https://edited.example');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      expect(instance.getMarkdown()).toBe('Prefix\n\n[link](https://edited.example)');
    } else {
      expect(instance.getMarkdown()).toBe(replacement);
    }
  });

  it('edits Cherry typography directly while preserving its Markdown mark', async () => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: 'Text !!red color!!.' });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let colorTextPosition = 0;
    view.state.doc.descendants((node, position) => {
      if (node.isText && node.text === 'color') colorTextPosition = position;
    });

    view.dispatch(view.state.tr.insertText(' vivid', colorTextPosition + 2));

    expect(element.querySelector('.cherry-wysiwyg-color')?.textContent).toBe('co vividlor');
    expect(instance.getMarkdown()).toContain('!!red co vividlor!!');
  });

  it('preserves parameterized Cherry marks when parsing editor DOM', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '!!#f00 red!! !20 large! {字|zi}',
    });
    instances.push(instance);

    const color = element.querySelector('.cherry-wysiwyg-color');
    const size = element.querySelector('.cherry-wysiwyg-size');
    const ruby = element.querySelector('.cherry-wysiwyg-ruby');
    expect(color?.getAttribute('data-cherry-color')).toBe('#f00');
    expect(size?.getAttribute('data-cherry-size')).toBe('20');
    expect(ruby?.getAttribute('data-cherry-annotation')).toBe('zi');
  });

  it('renders and round-trips nested foreground and background colors', async () => {
    const element = root();
    const value = '[!!#ffffff !!!#000000 black on white!!!!!](https://example.com)';
    const instance = await cherryMilkdown({ el: element, value });
    instances.push(instance);

    const foreground = element.querySelector<HTMLElement>('.cherry-wysiwyg-color');
    const background = element.querySelector<HTMLElement>('.cherry-wysiwyg-bg');
    expect(foreground?.textContent).toBe('black on white');
    expect(background?.textContent).toBe('black on white');
    expect(foreground?.style.color).toBe('rgb(255, 255, 255)');
    expect(background?.style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(instance.getMarkdown()).toContain('!!#ffffff !!!#000000 black on white!!!!!');
  });

  it('uses native editable GFM table nodes', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '| Name | Value |\n| --- | --- |\n| Milkdown | WYSIWYG |',
    });
    instances.push(instance);
    expect(element.querySelector('.ProseMirror table')).not.toBeNull();
    expect(element.querySelectorAll('.ProseMirror td')).toHaveLength(2);
    expect(element.querySelector('.ProseMirror table')?.closest('[data-cherry-visual]')).toBeNull();
  });

  it('uses Cherry icon-font task markers instead of Unicode checkbox glyphs', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '- [ ] todo\n- [x] done',
    });
    instances.push(instance);

    const items = [...element.querySelectorAll<HTMLLIElement>('li[data-item-type="task"]')];
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.classList.contains('cherry-list-item'))).toBe(true);
    expect(items.every((item) => item.classList.contains('check-list-item'))).toBe(true);
    expect(items.map((item) => item.querySelector('.ch-icon')?.className)).toEqual([
      expect.stringContaining('ch-icon-square'),
      expect.stringContaining('ch-icon-check'),
    ]);
  });

  it('keeps task pointer handling isolated across multiple preview editors', async () => {
    const firstRoot = root();
    const secondRoot = root();
    const first = await cherryMilkdown({ el: firstRoot, value: '- [ ] first', debounce: 0 });
    const second = await cherryMilkdown({ el: secondRoot, value: '- [ ] second', debounce: 0 });
    instances.push(first, second);
    firstRoot
      .querySelector<HTMLElement>('[data-cherry-task-checkbox]')
      ?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
    await vi.waitFor(() => expect(first.getMarkdown()).toContain('- [x] first'));
    expect(second.getMarkdown()).toContain('- [ ] second');
  });

  it('renders a table chart from the native editable table and cleans rendered resources', async () => {
    const element = root();
    const value = ['| :line:{"title":"Trend"} | Jan | Feb |', '| --- | ---: | ---: |', '| Sales | 1 | 2 |'].join('\n');
    const cleanup = vi.fn();
    const renderer = vi.fn(({ container }: { container: HTMLElement }) => {
      container.innerHTML = '<svg data-table-chart="true"></svg>';
      return cleanup;
    });
    const instance = await cherryMilkdown({ el: element, value, renderers: { tableChart: renderer }, debounce: 0 });
    instances.push(instance);

    expect(instance.getMarkdown().trim()).toBe(value);
    await vi.waitFor(() => expect(element.querySelector('[data-table-chart]')).not.toBeNull());
    expect(element.querySelector('.milkdown-table-block')).not.toBeNull();
    replaceText(instance, 'Trend', 'Updated');
    replaceText(instance, 'Sales', 'Revenue');

    expect(instance.getMarkdown()).toContain('"title":"Updated"');
    expect(instance.getMarkdown()).toContain('Revenue');
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(2));
    await instance.destroy();
    instances.splice(instances.indexOf(instance), 1);
    expect(cleanup).toHaveBeenCalled();
  });

  it('does not insert a synthetic paragraph between a table chart and the following Cherry block', async () => {
    const element = root();
    const value = [
      '| :line:{"title":"Trend"} | Jan | Feb |',
      '| --- | ---: | ---: |',
      '| Sales | 1 | 2 |',
      '',
      ':::warning Notice',
      'Panel body.',
      ':::',
    ].join('\n');
    const instance = await cherryMilkdown({
      el: element,
      value,
      renderers: { tableChart: () => '<svg data-table-chart="true"></svg>' },
    });
    instances.push(instance);

    const chart = element.querySelector('.cherry-table-chart');
    expect(chart).not.toBeNull();
    expect(chart?.nextElementSibling?.classList.contains('milkdown-table-block')).toBe(true);
    expect(chart?.nextElementSibling?.nextElementSibling?.classList.contains('cherry-panel')).toBe(true);
    expect(element.querySelector('.milkdown-table-block + p:empty + .cherry-panel')).toBeNull();
  });

  it('does not patch Cherry-owned column DOM to mount or edit a nested table chart', async () => {
    const element = root();
    const chart = ['| :line:{"title":"Real"} | Jan | Feb |', '| --- | --- | --- |', '| Sales | 1 | 2 |'].join('\n');
    const value = ['::: 2cols', '```markdown', chart.replace('Real', 'Example'), '```', '::', chart, ':::'].join('\n');
    const renderer = vi.fn(({ container }) => {
      container.innerHTML = '<svg data-nested-table-chart="true"></svg>';
    });
    const engine = {
      makeHtml: vi.fn(
        () =>
          '<div class="cherry-panel-cols cherry-panel-cols__2cols"><pre><code>example</code></pre><div class="cherry-table-wrapper"><table><thead><tr><th>Ordinary</th></tr></thead></table></div><div class="cherry-table-wrapper" data-chart-table><table><thead><tr><th>:line:{"title":"Real"}</th></tr></thead></table></div></div>',
      ),
    };
    const instance = await cherryMilkdown({ el: element, value, engine, renderers: { tableChart: renderer } });
    instances.push(instance);

    expect(renderer).not.toHaveBeenCalled();
    expect(element.querySelector('[data-nested-table-chart]')).toBeNull();
    expect(element.querySelector('.cherry-native-table-chart__controls')).toBeNull();
    expect(element.querySelector<HTMLButtonElement>('[aria-label="编辑整个区块源码"]')).not.toBeNull();
  });

  it('mounts the complete Cherry manual once without an initial synchronization write', async () => {
    const element = root();
    const onChange = vi.fn();
    const instance = await cherryMilkdown({
      el: element,
      value: fullManual,
      debounce: 0,
      onChange,
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let frontmatterCount = 0;
    view.state.doc.descendants((node) => {
      if (node.type.name === 'cherry_frontmatter') frontmatterCount += 1;
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(frontmatterCount).toBe(0);
    expect(onChange.mock.calls.length).toBe(0);
    expect(element.querySelectorAll('.milkdown-table-block')).toHaveLength(12);

    await instance.destroy();
    instances.splice(instances.indexOf(instance), 1);
  }, 15_000);

  it('updates the visual TOC when a heading is edited', async () => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: '# Before\n\n[[toc]]' });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let headingTextPosition = 0;
    view.state.doc.descendants((node, position) => {
      if (node.isText && node.text === 'Before') headingTextPosition = position;
    });

    view.dispatch(view.state.tr.insertText('After', headingTextPosition, headingTextPosition + 'Before'.length));

    expect(element.querySelector('.toc')?.textContent).toContain('After');
  });

  it('shows Cherry panels and Mermaid as rendered visual nodes by default', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '::: warning\nPanel body\n:::\n\n```mermaid\ngraph TD; A-->B;\n```',
    });
    instances.push(instance);
    const nodes = element.querySelectorAll<HTMLElement>('.cherry-compound, .cherry-embed--cherry_diagram');
    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.textContent).toContain('Panel body');
    expect(nodes[0]?.classList.contains('cherry-panel')).toBe(true);
    expect(nodes[0]?.querySelector('.cherry-panel--title')).not.toBeNull();
    expect(nodes[0]?.querySelector('.cherry-panel--body')).not.toBeNull();
    expect(nodes[0]?.querySelector('.cherry-compound__title')).not.toBeNull();
    expect(nodes[0]?.querySelector('select, textarea')).toBeNull();
    expect(nodes[0]?.querySelector<HTMLButtonElement>('[title="增加项目"]')?.hidden).toBe(true);
    expect(nodes[1]?.dataset.type).toBe('mermaid');
    expect(nodes[1]?.querySelector<HTMLElement>('.cherry-embed__source')?.hidden).toBe(true);
    await vi.waitFor(() => expect(nodes[1]?.querySelector('[data-rendered-mermaid]')).not.toBeNull());
  });

  it('canonicalizes Cherry panel aliases instead of treating them as raw HTML', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: ':::p Alias title\nPanel body\n:::',
    });
    instances.push(instance);

    const panel = element.querySelector<HTMLElement>('.cherry-compound');
    expect(panel).not.toBeNull();
    expect(panel?.classList.contains('cherry-panel__primary')).toBe(true);
    expect(panel?.querySelector('[title="在节点内编辑源码"]')).toBeNull();
    expect((panel?.querySelector('.cherry-compound__title') as HTMLInputElement | null)?.value).toBe('Alias title');
    expect(instance.getMarkdown()).toContain(':::p Alias title');
  });

  it('uses a custom renderer for other visual diagram nodes', async () => {
    const element = root();
    const renderer = vi.fn(async () => '<div data-rendered-echarts="true">Chart</div>');
    const instance = await cherryMilkdown({
      el: element,
      value: '```echarts\n{"series": []}\n```',
      renderers: { echarts: renderer },
    });
    instances.push(instance);

    await vi.waitFor(() => expect(element.querySelector('[data-rendered-echarts]')).not.toBeNull());
    expect(renderer).toHaveBeenCalledWith(
      expect.objectContaining({ syntax: 'echarts', source: expect.stringContaining('"series"') }),
    );
  });

  it('edits panel content directly without opening a source editor', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '::: warning\nBefore\n:::',
      debounce: 0,
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let position = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === 'Before') position = pos;
    });
    view.dispatch(view.state.tr.insertText('After', position, position + 'Before'.length));
    expect(instance.getMarkdown()).toContain('After');
    expect(element.querySelector('.cherry-compound textarea')).toBeNull();
  });

  it('edits compound titles in place with native text controls', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: ':::warning Before\nBody\n:::',
    });
    instances.push(instance);
    const title = element.querySelector<HTMLInputElement>('.cherry-compound__title');

    expect(title?.readOnly).toBe(false);
    if (title) {
      title.value = 'After';
      title.dispatchEvent(new Event('input', { bubbles: true }));
    }

    expect(instance.getMarkdown()).toContain(':::warning After');
  });

  it('selects Detail from real header mouse input while its title remains directly editable', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '+++ 更多能力\n正文\n+++',
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const detail = element.querySelector<HTMLElement>('[data-role="detail-item"]');
    const header = detail?.querySelector<HTMLElement>('.cherry-compound-item__header');
    const label = detail?.querySelector<HTMLElement>('.cherry-compound-item__label');
    const disclosure = detail?.querySelector<HTMLButtonElement>('.cherry-compound-item__disclosure');

    expect(detail?.dataset.open).toBe('false');
    header?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(view.state.selection).toBeInstanceOf(NodeSelection);
    expect((view.state.selection as NodeSelection).node.type.name).toBe('cherry_compound_item');

    label?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(detail?.dataset.open).toBe('false');
    if (label) {
      (label as HTMLInputElement).value = '直接编辑后的更多能力';
      label.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain('+++ 直接编辑后的更多能力');

    disclosure?.click();
    expect(detail?.dataset.open).toBe('true');
  });

  it('keeps ordinary fenced code directly editable with Cherry code-block chrome', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '```js\nconst value = 1;\n```',
      debounce: 0,
    });
    instances.push(instance);

    const codeBlock = element.querySelector<HTMLElement>('.cherry-milkdown-code-block');
    expect(codeBlock).not.toBeNull();
    expect(codeBlock?.classList.contains('cherry-milkdown-code-block')).toBe(true);
    expect(codeBlock?.closest('.cherry-embed')).toBeNull();
    expect(codeBlock?.querySelector('code')?.textContent).toBe('const value = 1;');

    const native = document.createElement('div');
    native.innerHTML = instance.engine.makeHtml('```js\nconst value = 1;\n```');
    const tokens = (root: Element) =>
      Array.from(root.querySelectorAll('.token'), (token) => [token.className, token.textContent]);
    expect(tokens(codeBlock!)).toEqual(tokens(native));

    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let codePosition = -1;
    view.state.doc.descendants((node, position) => {
      if (node.type.name === 'code_block') codePosition = position;
    });
    view.dispatch(view.state.tr.insertText('\nconst next = 2;', codePosition + 'const value = 1;'.length + 1));
    await vi.waitFor(() => expect(instance.getMarkdown()).toContain('const next = 2;'));
  });

  it.each([
    ['typescript', 'const answer: number = 42;'],
    ['json', '{"answer":42}'],
    ['python', 'print("hello")'],
    ['html', '<strong>Hello</strong>'],
    ['ts', 'const answer: number = 42;'],
    ['TS', 'const answer: number = 42;'],
    ['tsx', 'const view = <div>Hello</div>;'],
    ['py', 'print("hello")'],
    ['bash', 'tar -czvf archive.tar.gz directory'],
    ['shell', 'tar -czvf archive.tar.gz directory'],
    ['json5', '{answer: 42}'],
    ['yaml', 'answer: true'],
    ['sql', 'SELECT answer FROM results;'],
    ['php', '<?php echo true; ?>'],
    ['javascript', 'const view = html`<div>Hello</div>`;'],
    ['csharp', '/// <summary>Hello</summary>'],
    ['unknown-language', 'const fallback = 1;'],
  ])('matches Cherry token styling for %s code', async (language, code) => {
    const markdown = `\`\`\`${language}\n${code}\n\`\`\``;
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: markdown });
    instances.push(instance);
    const native = document.createElement('div');
    native.innerHTML = instance.engine.makeHtml(markdown);
    const styledCharacters = (root: Element) => {
      const codeElement = root.querySelector('code');
      if (!codeElement) return [];
      const walker = document.createTreeWalker(codeElement, NodeFilter.SHOW_TEXT);
      const characters: Array<[string, string]> = [];
      let textNode: Node | null;
      while ((textNode = walker.nextNode())) {
        const classes = new Set<string>();
        for (let parent = textNode.parentElement; parent && parent !== codeElement; parent = parent.parentElement) {
          if (!parent.classList.contains('token')) continue;
          for (const name of parent.classList) if (name !== 'token') classes.add(name);
        }
        for (const character of textNode.textContent ?? '') characters.push([character, [...classes].sort().join(' ')]);
      }
      return characters;
    };
    const editable = element.querySelector('.cherry-milkdown-code-block');
    expect(editable).not.toBeNull();
    expect(styledCharacters(editable!)).toEqual(styledCharacters(native));
  });

  it('edits inline math in place through MathLive input events', async () => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: 'Formula $x+1$.' });
    instances.push(instance);
    const field = element.querySelector<HTMLElement & { value: string }>('math-field');
    expect(field?.textContent).toBe('x+1');
    if (field) {
      field.value = '\\frac{a}{b}';
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain('$\\frac{a}{b}$');
  });

  it('exposes Milkdown table row and column controls', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '| A | B |\n| --- | --- |\n| 1 | 2 |',
    });
    instances.push(instance);
    expect(element.querySelector('.milkdown-table-block')).not.toBeNull();
  });

  it('keeps frontmatter compact and edits its source in place', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '---\ntitle: Before\nowner: Cherry\n---\n\nBody',
    });
    instances.push(instance);
    expect(element.querySelector('.cherry-source-node--cherry_frontmatter input')).toBeNull();
    element.querySelector<HTMLElement>('.cherry-source-node--cherry_frontmatter .cherry-source-node__header')?.click();
    const source = element.querySelector<HTMLElement>('.cherry-source-node--cherry_frontmatter code');
    expect(source?.hidden).toBe(false);
    if (source) {
      source.textContent = source.textContent?.replace('Before', 'After') ?? '';
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain('title: After');
  });

  it('keeps Tabs native and source-stable while editing inside the node', async () => {
    const element = root();
    const value = ':::tabs\n:: First\nOne\n:::\n';
    const instance = await cherryMilkdown({ el: element, value });
    instances.push(instance);
    expect(instance.getMarkdown().trim()).toBe(value.trim());
    expect(element.querySelector('.cherry-embed--cherry_native_block .cherry-tabs')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.click();
    const source = element.querySelector<HTMLElement>('.cherry-embed__source code');
    expect(source).not.toBeNull();
    if (source) {
      source.textContent = source.textContent?.replace('First', 'Renamed') ?? '';
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain(':: Renamed');
  });

  it('opens diagram source inside the selected node only when requested', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '```mermaid\ngraph TD; A-->B;\n```\n\n+++ More\nBody\n+++',
      debounce: 0,
    });
    instances.push(instance);
    selectNode(instance, 'cherry_diagram');
    const sourcePanel = element.querySelector<HTMLElement>('.cherry-embed__source');
    expect(sourcePanel?.hidden).toBe(true);
    const toggle = element.querySelector<HTMLButtonElement>('.cherry-embed__controls button');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    toggle?.click();
    expect(sourcePanel?.hidden).toBe(false);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(toggle?.classList.contains('is-active')).toBe(true);
    const source = sourcePanel?.querySelector<HTMLElement>('code');
    expect(source?.textContent).toContain('A-->B');
    if (source) {
      source.textContent = 'graph TD; B-->C;';
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instance.getMarkdown()).toContain('B-->C');
    expect(sourcePanel?.hidden).toBe(false);

    const disclosure = element.querySelector<HTMLButtonElement>('.cherry-compound-item__disclosure');
    disclosure?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    disclosure?.click();
    expect(sourcePanel?.hidden).toBe(false);
    toggle?.click();
    expect(sourcePanel?.hidden).toBe(true);
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });

  it.each([false, true])(
    'does not commit an engine result after synchronous editor destruction (throws: %s)',
    async (throws) => {
      const element = root();
      let instance: CherryMilkdownInstance | undefined;
      let destruction: Promise<void> | undefined;
      let destroyDuringRender = false;
      const engine = {
        makeHtml: () => {
          if (destroyDuringRender) {
            destroyDuringRender = false;
            destruction = instance!.destroy();
            if (throws) throw new Error('stale engine error');
            return '<div>stale result</div>';
          }
          return '<div>initial result</div>';
        },
      };
      instance = await cherryMilkdown({ el: element, value: '<div>\nInitial\n</div>', engine });
      instances.push(instance);
      destroyDuringRender = true;
      instance.setMarkdown('<div>\nUpdated\n</div>');
      expect(destruction).toBeDefined();
      expect(element.textContent).not.toContain('stale result');
      expect(element.querySelector('.cherry-embed__preview')?.textContent).toBe('initial result');
      await destruction;
    },
  );

  it.each([
    ['emoji', ':smile:', ':heart:', '.cherry-embed--cherry_emoji .cherry-embed__preview'],
    [
      'native block',
      ':::business-card\nInitial\n:::',
      ':::business-card\nUpdated\n:::',
      '.cherry-embed--cherry_native_block .cherry-embed__preview',
    ],
  ])('does not commit a stale %s after the engine destroys the editor', async (_label, initial, updated, selector) => {
    const element = root();
    let instance: CherryMilkdownInstance | undefined;
    let destruction: Promise<void> | undefined;
    let destroyDuringRender = false;
    const engine = {
      makeHtml: () => {
        if (destroyDuringRender) {
          destroyDuringRender = false;
          destruction = instance!.destroy();
          return '<span>stale result</span>';
        }
        return '<span>initial result</span>';
      },
    };
    instance = await cherryMilkdown({ el: element, value: initial, engine });
    instances.push(instance);
    expect(element.querySelector(selector)?.textContent).toBe('initial result');
    destroyDuringRender = true;
    instance.setMarkdown(updated);
    expect(destruction).toBeDefined();
    expect(element.querySelector(selector)?.textContent).toBe('initial result');
    await destruction;
  });

  it.each([false, true])(
    'keeps the editor usable when an image engine render throws (reporter throws: %s)',
    async (reporterThrows) => {
      const element = root();
      const failure = new Error('Image rendering failed');
      const onError = vi.fn(() => {
        if (reporterThrows) throw new Error('Reporter failed');
      });
      let fail = true;
      const engine = {
        makeHtml: () => {
          if (fail) throw failure;
          return '<img src="https://example.com/recovered.png">';
        },
      };
      const instance = await cherryMilkdown({
        el: element,
        value: 'Text\n\n![picture](https://example.com/original.png)',
        engine,
        onError,
      });
      instances.push(instance);
      expect(onError).toHaveBeenCalledWith(failure, 'render');
      expect(element.querySelector<HTMLImageElement>('.ProseMirror img:not(.ProseMirror-separator)')?.src).toBe(
        'https://example.com/original.png',
      );
      fail = false;
      instance.setMarkdown('Updated\n\n![picture](https://example.com/updated.png)');
      expect(instance.getMarkdown()).toContain('Updated');
      expect(element.querySelector<HTMLImageElement>('.ProseMirror img:not(.ProseMirror-separator)')?.src).toBe(
        'https://example.com/recovered.png',
      );
    },
  );

  it.each(['javascript:alert(1)', 'JaVa\nscript:alert(1)', 'data:text/html,unsafe'])(
    'does not restore an unsafe image source when the engine fails: %s',
    async (src) => {
      const element = root();
      const engine = {
        makeHtml: () => {
          throw new Error('Image rendering failed');
        },
      };
      const instance = await cherryMilkdown({ el: element, value: 'Text', engine });
      instances.push(instance);
      const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
      const image = view.state.schema.nodes.image.create({ src, alt: 'unsafe' });
      view.dispatch(view.state.tr.insert(1, image));
      expect(element.querySelector<HTMLImageElement>('.ProseMirror img[alt="unsafe"]')?.hasAttribute('src')).toBe(
        false,
      );
    },
  );

  it('keeps an image data URL in the fallback when the engine does not render an image', async () => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: 'Text', engine: { makeHtml: () => '<span></span>' } });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const src = 'data:image/png;base64,iVBORw0KGgo=';
    view.dispatch(view.state.tr.insert(1, view.state.schema.nodes.image.create({ src, alt: 'safe' })));
    expect(element.querySelector<HTMLImageElement>('.ProseMirror img[alt="safe"]')?.getAttribute('src')).toBe(src);
  });

  it('does not replace image presentation after its engine synchronously destroys the editor', async () => {
    const element = root();
    let instance: CherryMilkdownInstance | undefined;
    let destruction: Promise<void> | undefined;
    let destroyDuringRender = false;
    const engine = {
      makeHtml: () => {
        if (destroyDuringRender) {
          destroyDuringRender = false;
          destruction = instance!.destroy();
          return '<img src="https://example.com/stale.png">';
        }
        return '<img src="https://example.com/initial.png">';
      },
    };
    instance = await cherryMilkdown({ el: element, value: '![initial](https://example.com/initial.png)', engine });
    instances.push(instance);
    const image = element.querySelector('img')!;
    destroyDuringRender = true;
    instance.setMarkdown('![updated](https://example.com/updated.png)');
    expect(destruction).toBeDefined();
    expect(image.getAttribute('src')).toBe('https://example.com/initial.png');
    await destruction;
  });

  it('uses the sanitized Cherry engine shell for HTML and keeps source editing next to the selected node', async () => {
    const element = root();
    const makeHtml = vi.fn(
      (source: string) => `<div class="cherry-native-html" onclick="window.__bad=true">${source}</div>`,
    );
    const instance = await cherryMilkdown({
      el: element,
      value:
        '<div>\nsafe\n<script>window.__bad = true</script>\n<a href="java&#x0A;script:alert(1)">bad</a>\n<a href="https://example.com">safe link</a>\n<span style="background:url(https://tracker.example/pixel)">styled</span>\n</div>',
      engine: { makeHtml },
    });
    instances.push(instance);
    selectNode(instance, 'cherry_html_block');
    const shell = element.querySelector<HTMLElement>('.cherry-native-html');
    expect(makeHtml).toHaveBeenCalledWith(expect.stringContaining('<div>'));
    expect(shell).not.toBeNull();
    expect(shell?.hasAttribute('onclick')).toBe(false);
    expect(shell?.querySelector('script')).toBeNull();
    expect(element.querySelector('iframe')).toBeNull();
    const links = shell?.querySelectorAll('a');
    expect(links?.[0]?.hasAttribute('href')).toBe(false);
    expect(links?.[1]?.getAttribute('href')).toBe('https://example.com');
    expect(shell?.querySelector('span')?.hasAttribute('style')).toBe(false);
    element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.click();
    expect(element.querySelector('.cherry-embed__source code')).not.toBeNull();
    expect(element.querySelector('.cherry-embed textarea')).toBeNull();
    expect((window as typeof window & { __bad?: boolean }).__bad).toBeUndefined();
  });

  it('sanitizes custom engine image and emoji output while retaining image presentation', async () => {
    const element = root();
    const makeHtml = vi.fn(
      () =>
        '<img class="custom-image" data-src="https://example.com/image.png" style="width:42px" onerror="window.__bad=true">',
    );
    const instance = await cherryMilkdown({
      el: element,
      value: '![picture](https://example.com/image.png)\n\n:smile:',
      engine: { makeHtml },
    });
    instances.push(instance);
    const image = element.querySelector<HTMLImageElement>('.ProseMirror > p img.custom-image');
    const emoji = element.querySelector<HTMLImageElement>('.cherry-embed--cherry_emoji img');
    expect(image).not.toBeNull();
    expect(image?.getAttribute('alt')).toBe('picture');
    expect(image?.getAttribute('data-src')).toBe('https://example.com/image.png');
    expect(image?.style.width).toBe('42px');
    expect(image?.hasAttribute('onerror')).toBe(false);
    expect(emoji).not.toBeNull();
    expect(emoji?.hasAttribute('onerror')).toBe(false);
    expect(instance.getMarkdown()).toBe('![picture](https://example.com/image.png)\n\n:smile:');
  });

  it('keeps unknown business directives intact and edits them in the native Cherry shell', async () => {
    const element = root();
    const source = ':::business-card\nOpaque source\n:::';
    const instance = await cherryMilkdown({
      el: element,
      value: source,
      engine: { makeHtml: (value: string) => value },
    });
    instances.push(instance);
    expect(element.querySelector('.cherry-embed--cherry_native_block')).not.toBeNull();
    selectNode(instance, 'cherry_native_block');
    element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.click();
    const editor = element.querySelector<HTMLElement>('.cherry-embed__source code');
    expect(editor).not.toBeNull();
    if (editor) {
      editor.textContent = ':::business-card\nUpdated source\n:::';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }
    await vi.waitFor(() => expect(instance.getMarkdown()).toContain('Updated source'));
  });

  it('preserves an opaque business directive while adjacent standard Markdown is edited', async () => {
    const element = root();
    const opaqueSource = ':::business-card custom=value  \n  Opaque source  \n:::';
    const instance = await cherryMilkdown({
      el: element,
      value: `# Before\n\n${opaqueSource}\n\nAfter`,
      engine: { makeHtml: (value: string) => value },
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let headingTextPosition = -1;
    let nativeSource = '';
    view.state.doc.descendants((node, position) => {
      if (node.type.name === 'heading') headingTextPosition = position + 1;
      if (node.type.name === 'cherry_native_block') nativeSource = String(node.attrs.source);
    });

    expect(nativeSource).toBe(opaqueSource);
    view.dispatch(view.state.tr.insertText('After', headingTextPosition, headingTextPosition + 'Before'.length));
    await vi.waitFor(() => expect(instance.getMarkdown()).toContain('# After'));
    expect(instance.getMarkdown()).toContain(opaqueSource);
  });

  it('updates Markdown and emits debounced changes without rendering a second pane', async () => {
    const element = root();
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: element, debounce: 0, onChange });
    instances.push(instance);
    instance.setMarkdown('# Updated\n\n$E=mc^2$');
    await vi.waitFor(() => {
      expect(element.querySelector('h1')?.textContent).toBe('Updated');
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ markdown: expect.stringContaining('# Updated') }),
      );
    });
  });

  it('preserves original list markers when editing repeated text', async () => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: '* repeated\n* repeated', debounce: 0 });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const positions: number[] = [];
    view.state.doc.descendants((node, position) => {
      if (node.isText && node.text === 'repeated') positions.push(position);
    });
    expect(positions).toHaveLength(2);
    view.dispatch(view.state.tr.insertText('changed', positions[1], positions[1] + 'repeated'.length));
    await vi.waitFor(() => expect(instance.getMarkdown()).toBe('* repeated\n* changed'));
  });

  it.each(['mermaid', 'echarts', 'business-chart'])(
    'preserves %s attributes through clipboard DOM serialization',
    async (language) => {
      const instance = await cherryMilkdown({
        el: root(),
        value: `\`\`\`${language}\nsource\n\`\`\``,
        renderers: { [language]: () => '<span>Rendered</span>' },
      });
      instances.push(instance);
      const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
      const container = document.createElement('div');
      container.append(DOMSerializer.fromSchema(view.state.schema).serializeFragment(view.state.doc.content));
      expect(container.firstElementChild?.getAttribute('data-diagram-type')).toBe(language);
      const reparsed = DOMParser.fromSchema(view.state.schema).parse(container);
      expect(reparsed.firstChild?.attrs).toEqual(view.state.doc.firstChild?.attrs);
    },
  );

  it.each(['edit', 'delete'])('keeps a repeated footnote body intact during a paragraph %s', async (operation) => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '[^note]: repeated\n\nText repeated.[^note]',
      debounce: 0,
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let position = -1;
    view.state.doc.descendants((node, offset) => {
      if (node.isText && node.text?.includes('Text repeated.')) position = offset + node.text.indexOf('repeated');
    });
    expect(position).toBeGreaterThan(0);
    const replacement = operation === 'edit' ? 'changed' : '';
    view.dispatch(view.state.tr.insertText(replacement, position, position + 'repeated'.length));
    expect(instance.getMarkdown()).toBe(`[^note]: repeated\n\nText ${replacement}.[^note]`);
  });

  it('preserves the active text selection across API/source Markdown synchronization', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: 'Before selected text after.',
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const paragraph = view.state.doc.firstChild;
    const start = (paragraph?.textContent.indexOf('selected text') ?? 0) + 1;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, start + 13)));

    instance.setMarkdown('Prefix.\n\nBefore selected text after.', { emit: false });

    const { selection } = view.state;
    expect(view.state.doc.textBetween(selection.from, selection.to)).toBe('selected text');
  });

  it('applies external Markdown as a minimal ProseMirror transaction', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: 'Stable paragraph.\n\nBefore.',
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const unchangedParagraph = view.state.doc.firstChild;

    instance.setMarkdown('Stable paragraph.\n\nAfter.', { emit: false });

    expect(view.state.doc.firstChild).toBe(unchangedParagraph);
    expect(view.state.doc.lastChild?.textContent).toBe('After.');
  });

  it('keeps embedded source editing disabled in readonly mode', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '```mermaid\ngraph TD; A-->B;\n```',
      readonly: true,
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.editable).toBe(false);
    selectNode(instance, 'cherry_diagram');
    expect(element.querySelector('.cherry-milkdown-toolbar')).toBeNull();
    expect(element.querySelector<HTMLElement>('.cherry-embed__source')?.hidden).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.hidden).toBe(true);
  });

  it('focuses and destroys the editor cleanly', async () => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: '# Cleanup' });
    instance.focus();
    expect(instance.editor.action((ctx) => ctx.get(editorViewCtx)).hasFocus()).toBe(true);
    await instance.destroy();
    expect(element.childElementCount).toBe(0);
  });

  it('rejects invalid roots', async () => {
    await expect(cherryMilkdown({ el: null as unknown as HTMLElement })).rejects.toThrow(TypeError);
  });
});
