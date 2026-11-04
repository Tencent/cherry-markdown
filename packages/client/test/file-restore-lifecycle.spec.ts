import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createPinia, setActivePinia } from 'pinia';
import { useFileStore } from '../src/store';
import { useAppFileOperations } from '../src/components/composables/useAppFileOperations';

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), read: vi.fn(), open: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@tauri-apps/plugin-fs', () => ({ readTextFile: mocks.read, writeTextFile: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: mocks.open, save: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('startup file restoration', () => {
  it('does not start reading the launch file when the app unmounts while resolving its path', async () => {
    let finish!: (value: string | null) => void;
    mocks.invoke.mockReturnValue(new Promise<string | null>((resolve) => { finish = resolve; }));
    const setMarkdown = vi.fn();
    const ops = useAppFileOperations({
      getMarkdown: () => 'unsaved', setMarkdown, clearUndoRedo: vi.fn(), setUnsavedChanges: vi.fn(),
      updateTitle: vi.fn(async () => {}), scrollPreviewToTop: vi.fn(), confirmProceedWhenUnsaved: vi.fn(async () => true),
    });
    let active = true;
    const restoring = ops.restoreInitialFile(() => active);
    active = false;
    finish('launch.md');
    await restoring;
    expect(mocks.read).not.toHaveBeenCalled();
    expect(setMarkdown).not.toHaveBeenCalled();
  });

  it('does not apply a launch file whose read finishes after unmount', async () => {
    let finish!: (value: string) => void;
    mocks.invoke.mockResolvedValue('launch.md');
    mocks.read.mockReturnValue(new Promise<string>((resolve) => { finish = resolve; }));
    const setMarkdown = vi.fn();
    const ops = useAppFileOperations({
      getMarkdown: () => 'unsaved', setMarkdown, clearUndoRedo: vi.fn(), setUnsavedChanges: vi.fn(),
      updateTitle: vi.fn(async () => {}), scrollPreviewToTop: vi.fn(), confirmProceedWhenUnsaved: vi.fn(async () => true),
    });
    let active = true;
    const restoring = ops.restoreInitialFile(() => active);
    await vi.waitFor(() => expect(mocks.read).toHaveBeenCalledOnce());
    active = false;
    finish('late');
    await restoring;
    expect(setMarkdown).not.toHaveBeenCalled();
    expect(useFileStore().currentFilePath).toBeNull();
  });

  it('does not clear the previous file if its pending startup read fails after unmount', async () => {
    let fail!: (reason: Error) => void;
    mocks.invoke.mockResolvedValue(null);
    mocks.read.mockReturnValue(new Promise<string>((_resolve, reject) => { fail = reject; }));
    const store = useFileStore();
    store.setCurrentFilePath('old.md');
    const setUnsavedChanges = vi.fn();
    const updateTitle = vi.fn(async () => {});
    const ops = useAppFileOperations({
      getMarkdown: () => '', setMarkdown: vi.fn(), clearUndoRedo: vi.fn(), setUnsavedChanges, updateTitle,
      scrollPreviewToTop: vi.fn(), confirmProceedWhenUnsaved: vi.fn(async () => true),
    });
    let active = true;
    const restoring = ops.restoreInitialFile(() => active);
    await vi.waitFor(() => expect(mocks.read).toHaveBeenCalledOnce());
    active = false;
    fail(new Error('read failed'));
    await restoring;
    expect(store.currentFilePath).toBe('old.md');
    expect(setUnsavedChanges).not.toHaveBeenCalled();
    expect(updateTitle).not.toHaveBeenCalled();
  });

  it.each(['cancel', 'read failure'])('retains the current document when open ends in %s', async (kind) => {
    const store = useFileStore();
    store.setCurrentFilePath('old.md');
    mocks.open.mockResolvedValue(kind === 'cancel' ? null : 'new.md');
    mocks.read.mockRejectedValue(new Error('read failed'));
    const setMarkdown = vi.fn();
    const setUnsavedChanges = vi.fn();
    const clearUndoRedo = vi.fn();
    const ops = useAppFileOperations({
      getMarkdown: () => 'unsaved A', setMarkdown, clearUndoRedo, setUnsavedChanges,
      updateTitle: vi.fn(async () => {}), scrollPreviewToTop: vi.fn(), confirmProceedWhenUnsaved: vi.fn(async () => true),
    });
    expect((await ops.openFile()).success).toBe(false);
    expect(store.currentFilePath).toBe('old.md');
    expect(setMarkdown).not.toHaveBeenCalled();
    expect(clearUndoRedo).not.toHaveBeenCalled();
    expect(setUnsavedChanges).not.toHaveBeenCalled();
  });
  it('does not apply a pending file read after the app is unmounted', async () => {
    let finish!: (value: string) => void;
    mocks.invoke.mockResolvedValue(null);
    mocks.read.mockReturnValue(new Promise<string>((resolve) => { finish = resolve; }));
    const fileStore = useFileStore();
    fileStore.setCurrentFilePath('test.md');
    const setMarkdown = vi.fn();
    const clearUndoRedo = vi.fn();
    const setUnsavedChanges = vi.fn();
    const updateTitle = vi.fn(async () => {});
    const ops = useAppFileOperations({
      getMarkdown: () => '', setMarkdown, clearUndoRedo, setUnsavedChanges, updateTitle,
      scrollPreviewToTop: vi.fn(), confirmProceedWhenUnsaved: vi.fn(async () => true),
    });
    let active = true;
    const restoring = ops.restoreInitialFile(() => active);
    await vi.waitFor(() => expect(mocks.read).toHaveBeenCalledOnce());
    active = false;
    finish('late content');
    await restoring;
    expect(setMarkdown).not.toHaveBeenCalled();
    expect(clearUndoRedo).not.toHaveBeenCalled();
    expect(setUnsavedChanges).not.toHaveBeenCalled();
    expect(updateTitle).not.toHaveBeenCalled();
    expect(fileStore.currentFilePath).toBe('test.md');
  });
});
