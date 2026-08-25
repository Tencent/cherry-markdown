import { ref } from 'vue';
import type { FileOperationResult } from '../types';
import type { UnsavedDialogResult } from '../ui/UnsavedChangesDialog';

/**
 * 未保存拦截（保留兼容 API）
 *
 * 本地版本（IndexedDB）功能上线后，编辑器所有变更都会通过 useLocalVersioning
 * 自动持久化到本地，切换/关闭文件不再有真正意义上的“数据丢失”。因此本 hook
 * 保留 setUnsavedChanges / hasUnsavedChanges 供状态栏红点显示未保存状态使用，
 * 而 confirmProceedWhenUnsaved 直接返回 true，不再弹出旧的“未保存”对话框。
 *
 * 若日后需要重新启用弹窗，只需恢复本 hook 内注释掉的旧逻辑即可。
 */
export function useUnsavedGuard() {
  const hasUnsavedChanges = ref(false);
  // 保留 ref 以兼容 App.tsx 内 UnsavedChangesDialog 的可见性绑定；始终为 false
  const showUnsavedDialog = ref(false);

  const checkUnsavedChanges = (): boolean => hasUnsavedChanges.value;

  const setUnsavedChanges = (value: boolean): void => {
    hasUnsavedChanges.value = value;
  };

  const handleUnsavedDialogClose = (_result: UnsavedDialogResult): void => {
    showUnsavedDialog.value = false;
  };

  /**
   * 直接放行：本地版本已经保证零丢失，无需再阻塞用户操作
   */
  const confirmProceedWhenUnsaved = async (_saveMarkdown: () => Promise<FileOperationResult>): Promise<boolean> => {
    return true;
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
