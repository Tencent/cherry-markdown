import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createPinia, setActivePinia } from 'pinia';
import { useFileStore } from '../src/store';
import { useAppFileOperations } from '../src/components/composables/useAppFileOperations';

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), read: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@tauri-apps/plugin-fs', () => ({ readTextFile: mocks.read, writeTextFile: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('startup file restoration', () => {
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
