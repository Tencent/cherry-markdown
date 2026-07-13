import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Ref } from 'vue';
import { useFileStore } from '../../store';
import type { FileOperationResult } from '../types';

type ClientWindow = Window & {
  checkUnsavedChanges?: () => boolean;
};

interface UseAppWindowLifecycleOptions {
  hasUnsavedChanges: Ref<boolean>;
  checkUnsavedChanges: () => boolean;
  confirmProceedWhenUnsaved: () => Promise<boolean>;
  saveMarkdown: () => Promise<FileOperationResult>;
}

export function useAppWindowLifecycle({
  hasUnsavedChanges,
  checkUnsavedChanges,
  confirmProceedWhenUnsaved,
  saveMarkdown,
}: UseAppWindowLifecycleOptions) {
  const fileStore = useFileStore();
  const appWindow = getCurrentWindow();
  let unlistenCloseRequested: (() => void) | undefined;

  const preventNativeContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  const updateTitle = async (path: string | null, unsaved = false): Promise<void> => {
    let fileName = '';
    if (path) {
      const pathParts = path.split(/[\\/]/);
      fileName = pathParts[pathParts.length - 1].replace(/\.[^.]+$/, '');
    } else if (fileStore.untitledDraft) {
      fileName = fileStore.untitledDraft.name.replace(/\.[^.]+$/, '');
    }
    const unsavedIndicator = unsaved ? '● ' : '';
    const title = fileName ? `${unsavedIndicator}${fileName}` : 'Cherry Markdown';
    await appWindow.setTitle(title);
  };

  const handleSaveShortcut = (event: KeyboardEvent): void => {
    const isSaveShortcut =
      (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 's';
    if (!isSaveShortcut) return;

    event.preventDefault();
    event.stopPropagation();

    if (fileStore.currentFilePath || hasUnsavedChanges.value) {
      void saveMarkdown();
    }
  };

  const mountWindowLifecycle = async (): Promise<void> => {
    (window as ClientWindow).checkUnsavedChanges = checkUnsavedChanges;
    document.addEventListener('contextmenu', preventNativeContextMenu);
    window.addEventListener('keydown', handleSaveShortcut, true);

    unlistenCloseRequested = await appWindow.onCloseRequested(async (event) => {
      const canClose = await confirmProceedWhenUnsaved();
      if (!canClose) {
        event.preventDefault();
      }
    });
  };

  const cleanupWindowLifecycle = (): void => {
    document.removeEventListener('contextmenu', preventNativeContextMenu);
    window.removeEventListener('keydown', handleSaveShortcut, true);
    delete (window as ClientWindow).checkUnsavedChanges;
    unlistenCloseRequested?.();
  };

  return {
    updateTitle,
    mountWindowLifecycle,
    cleanupWindowLifecycle,
  };
}
