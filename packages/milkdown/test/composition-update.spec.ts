import { afterEach, describe, expect, it, vi } from 'vitest';
import { editorViewCtx, parserCtx } from '@milkdown/kit/core';
import { undo, redo } from '@milkdown/kit/prose/history';
import { TextSelection } from '@milkdown/kit/prose/state';
import { createTestEditor, type TestCherryMilkdownInstance } from './helpers/create-editor';

vi.mock('mathlive', () => ({}));
const instances: TestCherryMilkdownInstance[] = [];
afterEach(async () => {
  await Promise.all(instances.splice(0).map((instance) => instance.destroy()));
  document.body.replaceChildren();
});

async function create(options = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const instance = await createTestEditor({ el: root, value: '开始：结束', debounce: 0, ...options });
  instances.push(instance);
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 4)));
  view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  return { instance, view };
}

describe('external updates across composition completion', () => {
  it('retains synchronous error-reporting behavior outside composition', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const instance = await createTestEditor({
      el: root,
      value: 'Original',
      onError: () => {
        throw new Error('Reporter failed');
      },
    });
    instances.push(instance);
    instance.editor.action((ctx) =>
      ctx.set(parserCtx, () => {
        throw new Error('Parser failed');
      }),
    );
    expect(() => instance.setMarkdown('Replacement')).toThrow('Reporter failed');
    expect(instance.getMarkdown()).toBe('Original');
  });

  it('preserves committed Chinese, its caret and undo/redo after a silent external prepend', async () => {
    const onChange = vi.fn();
    const { instance, view } = await create({ onChange });
    instance.setMarkdown('远程前缀\n\n开始：结束', { emit: false });
    expect(instance.getMarkdown()).toBe('开始：结束');
    view.dispatch(view.state.tr.insertText('你好'));
    view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }));
    await vi.waitFor(() => expect(instance.getMarkdown()).toBe('远程前缀\n\n开始：你好结束'));
    expect(view.state.selection.$from.parent.textContent).toBe('开始：你好结束');
    expect(view.state.selection.$from.parentOffset).toBe(5);
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ markdown: '远程前缀\n\n开始：你好结束' }));
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(instance.getMarkdown()).toBe('远程前缀\n\n开始：结束');
    expect(view.state.selection.$from.parentOffset).toBe(3);
    expect(redo(view.state, view.dispatch)).toBe(true);
    expect(instance.getMarkdown()).toBe('远程前缀\n\n开始：你好结束');
    expect(view.state.selection.$from.parentOffset).toBe(5);
  });

  it('replaces preedit captured by the external value without duplicating the final candidate', async () => {
    const { instance, view } = await create();
    view.dispatch(view.state.tr.insertText('ni'));
    instance.setMarkdown(`远程前缀\n\n${instance.getMarkdown()}`, { emit: false });
    view.dispatch(view.state.tr.insertText('nihao', 4, 6));
    view.dispatch(view.state.tr.insertText('你好', 4, 9));
    view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }));
    await vi.waitFor(() => expect(instance.getMarkdown()).toBe('远程前缀\n\n开始：你好结束'));
    expect(view.state.selection.$from.parentOffset).toBe(5);
  });

  it('coalesces external revisions but does not let an echo cancel a separate external edit', async () => {
    const { instance, view } = await create();
    instance.setMarkdown('旧前缀\n\n开始：结束', { emit: false });
    view.dispatch(view.state.tr.insertText('ni'));
    instance.setMarkdown(`新前缀\n\n${instance.getMarkdown()}`, { emit: false });
    instance.setMarkdown(instance.getMarkdown(), { emit: false });
    view.dispatch(view.state.tr.insertText('你好', 4, 6));
    view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }));
    await vi.waitFor(() => expect(instance.getMarkdown()).toBe('新前缀\n\n开始：你好结束'));
  });

  it.each([false, true])(
    'keeps local input on a conflict, including when the error reporter throws (%s)',
    async (throws) => {
      const onChange = vi.fn();
      const onError = vi.fn(() => {
        if (throws) throw new Error('Consumer reporter failed');
      });
      const { instance, view } = await create({ onChange, onError });
      view.dispatch(view.state.tr.insertText('ni'));
      instance.setMarkdown('Replace the whole document', { emit: false });
      view.dispatch(view.state.tr.insertText('你好', 4, 6));
      view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }));
      await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('overlaps') }),
        'parse',
      );
      expect(instance.getMarkdown()).toBe('开始：你好结束');
      expect(view.state.selection.$from.parentOffset).toBe(5);
      expect(onChange).toHaveBeenLastCalledWith({ markdown: '开始：你好结束' });
      // Deliberate replacements outside composition retain the original API semantics.
      instance.setMarkdown('Intentional replacement', { emit: false });
      expect(instance.getMarkdown()).toBe('Intentional replacement');
    },
  );

  it('releases a queued document snapshot on destruction', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const { instance, view } = await create({ onChange, onError });
    instance.setMarkdown('远程前缀\n\n开始：结束', { emit: false });
    view.dispatch(view.state.tr.insertText('你好'));
    view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }));
    await instance.destroy();
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(onChange).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('publishes cancellation of previously notified preedit after a silent external update', async () => {
    const onChange = vi.fn();
    const { instance, view } = await create({ onChange });
    instance.setMarkdown('远程前缀\n\n开始：结束', { emit: false });
    view.dispatch(view.state.tr.insertText('ni'));
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ markdown: '开始：ni结束' }));
    view.dispatch(view.state.tr.delete(4, 6));
    view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '', bubbles: true }));
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ markdown: '远程前缀\n\n开始：结束' }));
    expect(instance.getMarkdown()).toBe('远程前缀\n\n开始：结束');
  });

  it('keeps a purely external update silent when composition made no document changes', async () => {
    const onChange = vi.fn();
    const { instance, view } = await create({ onChange });
    instance.setMarkdown('远程前缀\n\n开始：结束', { emit: false });
    view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '', bubbles: true }));
    await vi.waitFor(() => expect(instance.getMarkdown()).toBe('远程前缀\n\n开始：结束'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('isolates queued updates and committed input between instances', async () => {
    const first = await create();
    const second = await create();
    first.instance.setMarkdown('远程前缀\n\n开始：结束', { emit: false });
    for (const { view } of [first, second]) {
      view.dispatch(view.state.tr.insertText('你好'));
      view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }));
    }
    await vi.waitFor(() => expect(first.instance.getMarkdown()).toBe('远程前缀\n\n开始：你好结束'));
    expect(second.instance.getMarkdown()).toBe('开始：你好结束');
    expect(first.view.state.selection.$from.parentOffset).toBe(5);
    expect(second.view.state.selection.$from.parentOffset).toBe(5);
  });

  it('protects committed input from a stale response received in the commit frame', async () => {
    const { instance, view } = await create();
    view.dispatch(view.state.tr.insertText('你好'));
    view.dom.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }));
    instance.setMarkdown('远程前缀\n\n开始：结束', { emit: false });
    await vi.waitFor(() => expect(instance.getMarkdown()).toBe('远程前缀\n\n开始：你好结束'));
    expect(view.state.selection.$from.parentOffset).toBe(5);
    expect(undo(view.state, view.dispatch)).toBe(true);
    expect(instance.getMarkdown()).toBe('远程前缀\n\n开始：结束');
  });
});
