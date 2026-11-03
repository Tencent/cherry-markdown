import { defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue';
import SidePanelManager from './components/SidePanelManager';
import SettingsDialog from './components/ui/SettingsDialog';
import StatusBar from './components/StatusBar';
import { useAppEvents } from './components/composables/useAppEvents';
import { useAppFileOperations } from './components/composables/useAppFileOperations';
import { useAppWindowLifecycle } from './components/composables/useAppWindowLifecycle';
import { useEditorAdapter } from './components/composables/useEditorAdapter';
import { useUnsavedGuard } from './components/composables/useUnsavedGuard';
import { useLocalVersioning } from './components/composables/useLocalVersioning';
import ToastContainer from './components/ui/ToastContainer';
import UnsavedChangesDialog from './components/ui/UnsavedChangesDialog';
import VersionHistoryDialog from './components/ui/VersionHistoryDialog';
import { useFileStore } from './store';
import { notifyInfo } from './utils/notifications';
import { toast } from './components/composables/useToast';
import './styles/app.css';

export default defineComponent({
  name: 'App',
  setup() {
    const fileStore = useFileStore();
    const unsavedGuard = useUnsavedGuard();
    const localVersioning = useLocalVersioning();

    let updateEditorTitle: (unsaved?: boolean) => void = () => undefined;
    let updateWindowTitle: (path: string | null, unsaved?: boolean) => Promise<void> = async () => undefined;
    const editor = useEditorAdapter({
      onContentChanged: () => {
        unsavedGuard.setUnsavedChanges(true);
        fileStore.touchUntitledDraft();
        updateEditorTitle(true);
        // 本地版本：每次内容变更防抖后写入 IndexedDB
        localVersioning.onContentChanged(() => editor.getMarkdown());
      },
    });

    const fileOperations = useAppFileOperations({
      getMarkdown: editor.getMarkdown,
      setMarkdown: editor.setMarkdown,
      clearUndoRedo: editor.clearUndoRedo,
      scrollPreviewToTop: editor.scrollPreviewToTop,
      setUnsavedChanges: unsavedGuard.setUnsavedChanges,
      confirmProceedWhenUnsaved: unsavedGuard.confirmProceedWhenUnsaved,
      updateTitle: (path, unsaved = false) => updateWindowTitle(path, unsaved),
    });

    const windowLifecycle = useAppWindowLifecycle({
      hasUnsavedChanges: unsavedGuard.hasUnsavedChanges,
      checkUnsavedChanges: unsavedGuard.checkUnsavedChanges,
      confirmProceedWhenUnsaved: () => unsavedGuard.confirmProceedWhenUnsaved(fileOperations.saveMarkdown),
      saveMarkdown: () => fileOperations.saveMarkdown(),
    });

    updateWindowTitle = windowLifecycle.updateTitle;

    updateEditorTitle = (unsaved = false): void => {
      if (fileStore.currentFilePath) {
        void windowLifecycle.updateTitle(fileStore.currentFilePath, unsaved);
      }
    };

    // 设置弹窗可见性（当前包含图床配置）
    const settingsDialogVisible = ref(false);

    // 历史版本对话框（本地版本浏览器）
    const historyDialogVisible = ref(false);

    // 当前“发现更新的本地版本”提示 toast 的 id：切换文件时用于关闭旧提示
    let restoreToastId = -1;

    // 简短格式化：MM/DD HH:mm
    const formatShort = (ts: number): string => {
      const d = new Date(ts);
      const pad = (n: number): string => String(n).padStart(2, '0');
      return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    /**
     * 打开文件后：若本地版本比磁盘新，通过“带操作按钮的消息提醒”提示用户，
     * 不阻塞界面。用户可以点击“应用本地版本”按钮进行恢复，或忽略。
     *
     * 若本地版本内容与磁盘当前内容完全一致，则跳过提示（内容无差异，恢复无意义）。
     */
    const maybePromptRestore = async (filePath: string): Promise<void> => {
      try {
        const fsMod = await import('@tauri-apps/plugin-fs');
        const [info, newer] = await Promise.all([
          fsMod.stat(filePath),
          localVersioning.checkNewerLocalVersion(filePath),
        ]);
        if (!newer) return;

        // 与磁盘内容做严格比较，若无差异则不提示
        try {
          const diskContent = await fsMod.readTextFile(filePath);
          if (diskContent === newer.content) return;
        } catch (readErr) {
          // 读盘失败时降级为原行为（继续按 mtime 判定弹提示）
          console.warn('[App] read disk for diff-check failed:', readErr);
        }

        const diskMtime = info.mtime ? new Date(info.mtime).getTime() : 0;
        const localLabel = formatShort(newer.updatedAt);
        const diskLabel = diskMtime ? formatShort(diskMtime) : '-';
        const versionContent = newer.content;
        const targetPath = filePath;

        // 弹新提示前先关闭上一个未消失的提示，避免叠加
        if (restoreToastId !== -1) {
          toast.remove(restoreToastId);
          restoreToastId = -1;
        }

        restoreToastId = toast.action(
          `发现更新的本地版本\n · 本地 ${localLabel}\n · 磁盘 ${diskLabel}`,
          {
            label: '应用本地版本',
            onClick: () => {
              restoreToastId = -1;
              // 若切换到其他文件后再点，则不做覆盖，避免误伤
              if (fileStore.currentFilePath !== targetPath) {
                toast.warning('当前文件已切换，忽略本次恢复');
                return;
              }
              editor.setMarkdown(versionContent);
              unsavedGuard.setUnsavedChanges(true);
              updateEditorTitle(true);
              notifyInfo('已应用本地版本');
            },
          },
          { type: 'warning', duration: 10000 },
        );
      } catch (err) {
        console.warn('[App] maybePromptRestore failed:', err);
      }
    };

    const handleVersionApply = (content: string): void => {
      editor.setMarkdown(content);
      unsavedGuard.setUnsavedChanges(true);
      updateEditorTitle(true);
      historyDialogVisible.value = false;
      notifyInfo('已应用选中的历史版本');
    };

    // 切换文件时，立即关闭上一份文件残留的“发现更新的本地版本”提示。
    // 若新文件也存在更新的本地版本，maybePromptRestore 会再弹一个新 toast。
    watch(
      () => fileStore.currentFilePath,
      () => {
        if (restoreToastId !== -1) {
          toast.remove(restoreToastId);
          restoreToastId = -1;
        }
      },
    );

    const appEvents = useAppEvents({
      onOpenFileFromSidebar: async (event) => {
        await fileOperations.handleOpenFileFromSidebar(event);
        const p = event.detail.filePath;
        if (p) await maybePromptRestore(p);
      },
      onRequestSave: fileOperations.handleSaveFromToolbar,
      tauriHandlers: {
        onNewFile: async () => {
          await fileOperations.newFile();
        },
        onOpenFile: async () => {
          await fileOperations.openFile();
          if (fileStore.currentFilePath) {
            await maybePromptRestore(fileStore.currentFilePath);
          }
        },
        onOpenFilePath: async (filePath) => {
          await fileOperations.openFilePath(filePath);
          if (fileStore.currentFilePath) {
            await maybePromptRestore(fileStore.currentFilePath);
          }
        },
        onSave: async () => {
          await fileOperations.saveMarkdown();
        },
        onSaveAs: async () => {
          await fileOperations.saveAsNewMarkdown();
        },
        onToggleToolbar: editor.toggleToolbar,
      },
    });

    onMounted(async () => {
      editor.initEditor();
      appEvents.registerWindowEvents();
      await appEvents.registerTauriEvents();
      await windowLifecycle.mountWindowLifecycle();
      await fileOperations.restoreInitialFile();
      // 初次启动后：若已恢复的文件在本地存有更新版本，弹提示
      if (fileStore.currentFilePath) {
        await maybePromptRestore(fileStore.currentFilePath);
      }
    });

    onUnmounted(async () => {
      windowLifecycle.cleanupWindowLifecycle();
      editor.disposeEditor();
      await appEvents.cleanupAll();
    });

    return () =>
      h('div', { class: 'app-container' }, [
        h(SidePanelManager, {
          onNewFile: async () => {
            await fileOperations.newFile();
          },
          onOpenSettings: () => {
            settingsDialogVisible.value = true;
          },
        }),
        h('div', { class: 'editor-container' }, [
          h('div', { id: 'markdown-editor' }),
          h('div', { id: 'milkdown-editor' }),
          h(StatusBar, {
            unsaved: unsavedGuard.hasUnsavedChanges.value,
            toolbarVisible: editor.toolbarVisible.value,
            lastAutoSavedAt: localVersioning.lastAutoSavedAt.value,
            hasVersion: localVersioning.hasVersion.value,
            onToggleToolbar: editor.toggleToolbar,
            onOpenVersionHistory: () => {
              historyDialogVisible.value = true;
            },
          }),
        ]),
        h(ToastContainer),
        h(SettingsDialog, {
          visible: settingsDialogVisible.value,
          onClose: () => {
            settingsDialogVisible.value = false;
          },
        }),
        h(UnsavedChangesDialog, {
          visible: unsavedGuard.showUnsavedDialog.value,
          onClose: unsavedGuard.handleUnsavedDialogClose,
        }),
        h(VersionHistoryDialog, {
          visible: historyDialogVisible.value,
          filePath: fileStore.currentFilePath,
          onClose: () => {
            historyDialogVisible.value = false;
          },
          onApply: handleVersionApply,
        }),
      ]);
  },
});
