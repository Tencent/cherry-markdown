import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { usePreferencesStore } from '../src/store';
import { useEditorAdapter } from '../src/components/composables/useEditorAdapter';

const fakes = vi.hoisted(() => ({
  cherry: undefined as ReturnType<typeof fakeEditor> | undefined,
  milkdown: undefined as ReturnType<typeof fakeEditor> | undefined,
}));
vi.mock('../src/components/composables/useCherryEditor', () => ({
  useCherryEditor: ({ onContentChanged }: { onContentChanged: () => void }) =>
    (fakes.cherry = fakeEditor(onContentChanged)),
}));
vi.mock('../src/components/composables/useMilkdownEditor', () => ({
  useMilkdownEditor: ({ onContentChanged }: { onContentChanged: () => void }) =>
    (fakes.milkdown = fakeEditor(onContentChanged)),
}));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fakeEditor(onChange: () => void) {
  let markdown = '';
  return {
    toolbarVisible: ref(true),
    initEditor: vi.fn(async () => {}),
    disposeEditor: vi.fn(async () => {}),
    setMarkdown: vi.fn((value: string) => {
      markdown = value;
    }),
    getMarkdown: () => markdown,
    clearUndoRedo: vi.fn(),
    scrollPreviewToTop: vi.fn(),
    toggleToolbar: vi.fn(),
    switchEditorMode: vi.fn(),
    type: (value: string) => {
      markdown = value;
      onChange();
    },
  };
}
const controllers: ReturnType<typeof useEditorAdapter>[] = [];
beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
});
afterEach(async () => {
  await Promise.all(controllers.splice(0).map((editor) => editor.disposeEditor()));
});
function create() {
  const changed = vi.fn();
  const controller = useEditorAdapter({ onContentChanged: changed });
  controllers.push(controller);
  return { controller, changed, prefs: usePreferencesStore() };
}

describe('client editor transitions', () => {
  it('reports typing immediately after a programmatic write without a 300ms suppression window', async () => {
    const { controller, changed, prefs } = create();
    prefs.setEngine('milkdown');
    await controller.initEditor();
    controller.setMarkdown('loaded');
    fakes.milkdown!.type('typed immediately');
    expect(changed).toHaveBeenCalledTimes(1);
    expect(controller.getMarkdown()).toBe('typed immediately');
  });

  it('waits for both teardown and mount, then applies the latest file and pending history reset', async () => {
    const { controller, changed, prefs } = create();
    await controller.initEditor();
    fakes.cherry!.type('unsaved A');
    const teardown = deferred();
    const mount = deferred();
    fakes.cherry!.disposeEditor.mockImplementationOnce(() => teardown.promise);
    fakes.milkdown!.initEditor.mockImplementationOnce(() => mount.promise);
    prefs.setEngine('milkdown');
    await vi.waitFor(() => expect(fakes.cherry!.disposeEditor).toHaveBeenCalledTimes(1));
    expect(fakes.milkdown!.initEditor).not.toHaveBeenCalled();
    controller.setMarkdown('file B');
    controller.clearUndoRedo();
    teardown.resolve();
    await vi.waitFor(() => expect(fakes.milkdown!.initEditor).toHaveBeenCalledTimes(1));
    controller.setMarkdown('file C');
    expect(controller.getMarkdown()).toBe('file C');
    expect(fakes.milkdown!.setMarkdown).not.toHaveBeenCalled();
    mount.resolve();
    await vi.waitFor(() => expect(fakes.milkdown!.setMarkdown).toHaveBeenCalledExactlyOnceWith('file C'));
    expect(fakes.milkdown!.clearUndoRedo).toHaveBeenCalledTimes(1);
    expect(controller.getMarkdown()).toBe('file C');
    expect(changed).toHaveBeenCalledTimes(1);
    fakes.milkdown!.type('file C edited');
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('discards an obsolete slow mount before the latest switch and retains newer content', async () => {
    const { controller, prefs } = create();
    await controller.initEditor();
    controller.setMarkdown('A');
    const mount = deferred();
    fakes.milkdown!.initEditor.mockImplementationOnce(() => mount.promise);
    prefs.setEngine('milkdown');
    await vi.waitFor(() => expect(fakes.milkdown!.initEditor).toHaveBeenCalledTimes(1));
    prefs.setEngine('cherry');
    controller.setMarkdown('B');
    expect(fakes.cherry!.initEditor).toHaveBeenCalledTimes(1);
    mount.resolve();
    await vi.waitFor(() => expect(fakes.cherry!.initEditor).toHaveBeenCalledTimes(2));
    expect(fakes.milkdown!.disposeEditor).toHaveBeenCalledTimes(1);
    expect(fakes.milkdown!.setMarkdown).not.toHaveBeenCalled();
    expect(controller.activeEngine.value).toBe('cherry');
    expect(controller.getMarkdown()).toBe('B');
  });

  it('cleans a mount that completes after application disposal and never remounts', async () => {
    const { controller, changed, prefs } = create();
    const gate = deferred();
    fakes.cherry!.initEditor.mockImplementationOnce(() => gate.promise);
    const mounting = controller.initEditor();
    await vi.waitFor(() => expect(fakes.cherry!.initEditor).toHaveBeenCalledTimes(1));
    const disposal = controller.disposeEditor();
    prefs.setEngine('milkdown');
    gate.resolve();
    await Promise.all([mounting, disposal]);
    expect(fakes.cherry!.disposeEditor).toHaveBeenCalledTimes(1);
    expect(fakes.milkdown!.initEditor).not.toHaveBeenCalled();
    fakes.cherry!.type('stale');
    expect(changed).not.toHaveBeenCalled();
  });

  it('recovers from a rejected mount without losing the pending file', async () => {
    const { controller } = create();
    fakes.cherry!.initEditor.mockRejectedValueOnce(new Error('failed'));
    controller.setMarkdown('retained');
    await expect(controller.initEditor()).rejects.toThrow('failed');
    await controller.initEditor();
    expect(controller.getMarkdown()).toBe('retained');
    expect(fakes.cherry!.disposeEditor).toHaveBeenCalledTimes(1);
  });

  it('shares readiness for duplicate requests and recovers after a rejected teardown', async () => {
    const { controller, prefs } = create();
    const gate = deferred();
    fakes.cherry!.initEditor.mockImplementationOnce(() => gate.promise);
    const first = controller.initEditor();
    const duplicate = controller.initEditor();
    expect(duplicate).toBe(first);
    gate.resolve();
    await first;
    controller.setMarkdown('retained');
    fakes.cherry!.disposeEditor.mockRejectedValueOnce(new Error('teardown failed'));
    prefs.setEngine('milkdown');
    await expect(controller.initEditor()).rejects.toThrow('teardown failed');
    await controller.initEditor();
    expect(controller.getMarkdown()).toBe('retained');
  });
});
