import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import {
  registerMilkdownAdapter,
  useMilkdownEditor,
  type MilkdownAdapter,
} from '../src/components/composables/useMilkdownEditor';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fakeAdapter() {
  let markdown = '';
  let changed = () => {};
  const adapter: MilkdownAdapter = {
    mount: vi.fn(async (initial, onChange) => {
      markdown = initial;
      changed = onChange;
    }),
    destroy: vi.fn(async () => {}),
    getMarkdown: () => markdown,
    setMarkdown: vi.fn((value) => {
      markdown = value;
    }),
    clearUndoRedo: vi.fn(),
  };
  registerMilkdownAdapter(adapter);
  return {
    adapter,
    change: (value: string) => {
      markdown = value;
      changed();
    },
  };
}
afterEach(() => registerMilkdownAdapter(null));

describe('Milkdown adapter ownership', () => {
  it('replays only the latest content and history reset after a slow mount', async () => {
    const { adapter, change } = fakeAdapter();
    const gate = deferred();
    vi.mocked(adapter.mount).mockImplementationOnce(async () => gate.promise);
    const onChange = vi.fn();
    const editor = useMilkdownEditor({ onContentChanged: onChange });
    editor.setMarkdown('A');
    const mounting = editor.initEditor();
    await vi.waitFor(() => expect(adapter.mount).toHaveBeenCalledWith('A', expect.any(Function)));
    editor.setMarkdown('B');
    editor.setMarkdown('C');
    editor.clearUndoRedo();
    expect(adapter.setMarkdown).not.toHaveBeenCalled();
    gate.resolve();
    await mounting;
    expect(adapter.setMarkdown).toHaveBeenCalledExactlyOnceWith('C');
    expect(adapter.clearUndoRedo).toHaveBeenCalledTimes(1);
    expect(editor.getMarkdown()).toBe('C');
    expect(onChange).not.toHaveBeenCalled();
    await editor.disposeEditor();
    change('stale');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('destroys an obsolete mount before starting another and ignores its callbacks', async () => {
    const { adapter } = fakeAdapter();
    const gate = deferred();
    let stale = () => {};
    vi.mocked(adapter.mount).mockImplementationOnce(async (_initial, changed) => {
      stale = changed;
      await gate.promise;
    });
    const onChange = vi.fn();
    const editor = useMilkdownEditor({ onContentChanged: onChange });
    const mounting = editor.initEditor();
    await vi.waitFor(() => expect(adapter.mount).toHaveBeenCalledTimes(1));
    const disposal = editor.disposeEditor();
    editor.setMarkdown('new file');
    const next = editor.initEditor();
    stale();
    expect(onChange).not.toHaveBeenCalled();
    expect(adapter.destroy).not.toHaveBeenCalled();
    gate.resolve();
    await Promise.all([mounting, disposal, next]);
    expect(adapter.destroy).toHaveBeenCalledTimes(1);
    expect(adapter.mount).toHaveBeenLastCalledWith('new file', expect.any(Function));
    expect(vi.mocked(adapter.destroy).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(adapter.mount).mock.invocationCallOrder[1],
    );
    await editor.disposeEditor();
  });

  it('cleans a failed mount and permits a retry', async () => {
    const { adapter, change } = fakeAdapter();
    vi.mocked(adapter.mount).mockRejectedValueOnce(new Error('mount failed'));
    const onChange = vi.fn();
    const editor = useMilkdownEditor({ onContentChanged: onChange });
    editor.setMarkdown('retained');
    await expect(editor.initEditor()).rejects.toThrow('mount failed');
    expect(adapter.destroy).toHaveBeenCalledTimes(1);
    await editor.initEditor();
    expect(editor.getMarkdown()).toBe('retained');
    change('user edit');
    expect(onChange).toHaveBeenCalledTimes(1);
    await editor.disposeEditor();
  });
});
