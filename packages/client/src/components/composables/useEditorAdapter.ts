import { computed, ref, watch } from 'vue';
import { usePreferencesStore, type EditorEngine } from '../../store';
import { notifyError } from '../../utils/notifications';
import type { CherryEditorMode } from '../editorTypes';
import { useCherryEditor } from './useCherryEditor';
import { useMilkdownEditor } from './useMilkdownEditor';

export function useEditorAdapter({ onContentChanged }: { onContentChanged: () => void }) {
  const preferences = usePreferencesStore();
  const activeEngine = ref<EditorEngine>(preferences.engine);
  let mountedEngine: EditorEngine | null = null;
  let pendingMarkdown: string | undefined;
  let resetHistoryPending = false;
  let transitioning = false;
  let disposed = false;
  let generation = 0;
  let serial = Promise.resolve();
  let latest = Promise.resolve();
  let requestedEngine: EditorEngine | null = null;

  const changed = (engine: EditorEngine) => {
    if (disposed || transitioning || mountedEngine !== engine) return;
    pendingMarkdown = editors[engine].getMarkdown();
    onContentChanged();
  };
  const editors = {
    cherry: useCherryEditor({ onContentChanged: () => changed('cherry') }),
    milkdown: useMilkdownEditor({ onContentChanged: () => changed('milkdown') }),
  };
  const current = () => editors[activeEngine.value];
  const toolbarVisible = computed(() => current().toolbarVisible.value);
  applyContainerVisibility(activeEngine.value);

  const getMarkdown = (): string => {
    if (!transitioning && mountedEngine) pendingMarkdown = editors[mountedEngine].getMarkdown();
    return pendingMarkdown ?? '';
  };
  const setMarkdown = (markdown: string): void => {
    pendingMarkdown = markdown;
    if (!transitioning && mountedEngine) editors[mountedEngine].setMarkdown(markdown);
  };
  const clearUndoRedo = (): void => {
    if (!transitioning && mountedEngine) editors[mountedEngine].clearUndoRedo();
    else resetHistoryPending = true;
  };
  const enqueue = (action: () => Promise<void>) => {
    const task = serial.then(action);
    serial = task.catch(() => {});
    return task;
  };
  const release = async () => {
    const previous = mountedEngine;
    mountedEngine = null;
    if (previous) await editors[previous].disposeEditor();
  };
  const switchEngine = (next: EditorEngine): Promise<void> => {
    if (disposed) return serial;
    if (!transitioning && mountedEngine === next) return serial;
    if (transitioning && requestedEngine === next) return latest;
    getMarkdown();
    const request = ++generation;
    transitioning = true;
    requestedEngine = next;
    latest = enqueue(async () => {
      if (request !== generation) return;
      let target: ReturnType<typeof current> | undefined;
      try {
        await release();
        if (request !== generation) return;
        activeEngine.value = next;
        applyContainerVisibility(next);
        target = editors[next];
        await target.initEditor();
        if (request !== generation) {
          await target.disposeEditor();
          return;
        }
        if (pendingMarkdown !== undefined) target.setMarkdown(pendingMarkdown);
        if (resetHistoryPending) {
          target.clearUndoRedo();
          resetHistoryPending = false;
        }
        pendingMarkdown = target.getMarkdown();
        mountedEngine = next;
      } catch (error) {
        await target?.disposeEditor();
        throw error;
      } finally {
        if (request === generation) transitioning = false;
      }
    });
    return latest;
  };

  const initEditor = () => switchEngine(preferences.engine);
  const disposeEditor = (): Promise<void> => {
    getMarkdown();
    disposed = true;
    ++generation;
    stopWatching();
    return enqueue(release);
  };
  const stopWatching = watch(
    () => preferences.engine,
    (next) => {
      void switchEngine(next).catch((error) => {
        notifyError(`编辑器切换失败：${error instanceof Error ? error.message : String(error)}`);
      });
    },
    { flush: 'sync' },
  );

  return {
    toolbarVisible,
    activeEngine,
    getMarkdown,
    setMarkdown,
    clearUndoRedo,
    initEditor,
    disposeEditor,
    scrollPreviewToTop: () => {
      if (!transitioning && mountedEngine) editors[mountedEngine].scrollPreviewToTop();
    },
    toggleToolbar: () => {
      if (!transitioning && mountedEngine) editors[mountedEngine].toggleToolbar();
    },
    switchEditorMode: (mode: CherryEditorMode, needSyncToolbar = true) => {
      if (!transitioning && mountedEngine) editors[mountedEngine].switchEditorMode(mode, needSyncToolbar);
    },
  };
}

function applyContainerVisibility(engine: EditorEngine): void {
  document.body.classList.remove('engine-cherry', 'engine-milkdown');
  document.body.classList.add(engine === 'cherry' ? 'engine-cherry' : 'engine-milkdown');
}
