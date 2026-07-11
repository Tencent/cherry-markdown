import { ref } from 'vue';
import type { FileOperationResult } from '../types';
import type { UnsavedDialogResult } from '../ui/UnsavedChangesDialog';

export function useUnsavedGuard() {
  const hasUnsavedChanges = ref(false);
  const showUnsavedDialog = ref(false);
  let unsavedDialogResolve: ((result: UnsavedDialogResult) => void) | null = null;

  const checkUnsavedChanges = (): boolean => hasUnsavedChanges.value;

  const setUnsavedChanges = (value: boolean): void => {
    hasUnsavedChanges.value = value;
  };

  const showUnsavedConfirmDialog = (): Promise<UnsavedDialogResult> => {
    return new Promise((resolve) => {
      unsavedDialogResolve = resolve;
      showUnsavedDialog.value = true;
    });
  };

  const handleUnsavedDialogClose = (result: UnsavedDialogResult): void => {
    showUnsavedDialog.value = false;
    if (unsavedDialogResolve) {
      unsavedDialogResolve(result);
      unsavedDialogResolve = null;
    }
  };

  const confirmProceedWhenUnsaved = async (saveMarkdown: () => Promise<FileOperationResult>): Promise<boolean> => {
    if (!hasUnsavedChanges.value) return true;

    const result = await showUnsavedConfirmDialog();
    if (result === 'save') {
      const saveResult = await saveMarkdown();
      return saveResult.success;
    }

    return result === 'discard';
  };

  return {
    hasUnsavedChanges,
    showUnsavedDialog,
    checkUnsavedChanges,
    setUnsavedChanges,
    confirmProceedWhenUnsaved,
    handleUnsavedDialogClose,
  };
}
