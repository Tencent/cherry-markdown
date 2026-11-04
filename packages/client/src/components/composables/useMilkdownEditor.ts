import { ref } from 'vue';
import type { CherryEditorMode } from '../editorTypes';

export interface MilkdownAdapter {
  mount(initialMarkdown: string, onChange: () => void): Promise<void> | void;
  destroy(): void | Promise<void>;
  getMarkdown(): string;
  setMarkdown(markdown: string, options?: { addToHistory?: boolean }): void;
  clearUndoRedo(): void;
  toggleToolbar?(): void;
}

let registeredAdapter: MilkdownAdapter | null = null;

export function registerMilkdownAdapter(adapter: MilkdownAdapter | null): void {
  registeredAdapter = adapter;
}

export function isMilkdownAdapterReady(): boolean {
  return registeredAdapter !== null;
}

export function useMilkdownEditor({ onContentChanged }: { onContentChanged: () => void }) {
  const toolbarVisible = ref(true);
  let pendingMarkdown = '';
  let resetHistoryPending = false;
  let mounted = false;
  let mountRequested = false;
  let generation = 0;
  let owned: MilkdownAdapter | null = null;
  let serial = Promise.resolve();
  let ready = Promise.resolve();

  const enqueue = (action: () => Promise<void>) => {
    const task = serial.then(action);
    serial = task.catch(() => {});
    return task;
  };
  const release = async () => {
    const previous = owned;
    owned = null;
    mounted = false;
    await previous?.destroy();
  };
  const initEditor = (): Promise<void> => {
    if (mountRequested) return ready;
    mountRequested = true;
    const request = ++generation;
    ready = enqueue(async () => {
      if (request !== generation) return;
      const adapter = registeredAdapter;
      if (!adapter) {
        mountRequested = false;
        throw new Error('Milkdown adapter is not registered.');
      }
      owned = adapter;
      const initial = pendingMarkdown;
      try {
        await adapter.mount(initial, () => {
          if (!mounted || request !== generation) return;
          pendingMarkdown = adapter.getMarkdown();
          onContentChanged();
        });
        if (request !== generation) {
          await release();
          return;
        }
        // File operations may have supplied newer content while mount awaited.
        if (pendingMarkdown !== initial) adapter.setMarkdown(pendingMarkdown);
        if (resetHistoryPending) {
          adapter.clearUndoRedo();
          resetHistoryPending = false;
        }
        mounted = true;
      } catch (error) {
        if (request === generation) mountRequested = false;
        await release();
        throw error;
      }
    });
    return ready;
  };
  const getMarkdown = (): string => {
    if (mounted && owned) pendingMarkdown = owned.getMarkdown();
    return pendingMarkdown;
  };
  const disposeEditor = (): Promise<void> => {
    getMarkdown();
    ++generation;
    mountRequested = false;
    mounted = false;
    return enqueue(release);
  };
  const setMarkdown = (markdown: string, options?: { addToHistory?: boolean }): void => {
    pendingMarkdown = markdown;
    if (mounted) owned?.setMarkdown(markdown, options);
  };
  const clearUndoRedo = (): void => {
    if (mounted && owned) owned.clearUndoRedo();
    else resetHistoryPending = true;
  };
  const scrollPreviewToTop = (): void => {
    const el = document.getElementById('milkdown-editor');
    if (el) el.scrollTop = 0;
  };
  const toggleToolbar = (): void => {
    toolbarVisible.value = !toolbarVisible.value;
    owned?.toggleToolbar?.();
  };
  const switchEditorMode = (_mode: CherryEditorMode, _needSyncToolbar = true): void => {};

  return {
    toolbarVisible,
    getMarkdown,
    initEditor,
    setMarkdown,
    clearUndoRedo,
    scrollPreviewToTop,
    toggleToolbar,
    switchEditorMode,
    disposeEditor,
  };
}
