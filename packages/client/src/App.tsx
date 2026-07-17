import { defineComponent, h, onMounted, onUnmounted, ref } from 'vue';
import SidePanelManager from './components/SidePanelManager';
import SettingsDialog from './components/ui/SettingsDialog';
import StatusBar from './components/StatusBar';
import { useAppEvents } from './components/composables/useAppEvents';
import { useAppFileOperations } from './components/composables/useAppFileOperations';
import { useAppWindowLifecycle } from './components/composables/useAppWindowLifecycle';
import { useCherryEditor } from './components/composables/useCherryEditor';
import { useUnsavedGuard } from './components/composables/useUnsavedGuard';
import ToastContainer from './components/ui/ToastContainer';
import UnsavedChangesDialog from './components/ui/UnsavedChangesDialog';
import { useFileStore } from './store';
import './styles/app.css';

export default defineComponent({
  name: 'App',
  setup() {
    const fileStore = useFileStore();
    const unsavedGuard = useUnsavedGuard();

    let updateEditorTitle: (unsaved?: boolean) => void = () => undefined;
    let updateWindowTitle: (path: string | null, unsaved?: boolean) => Promise<void> = async () => undefined;
    const editor = useCherryEditor({
      onContentChanged: () => {
        unsavedGuard.setUnsavedChanges(true);
        fileStore.touchUntitledDraft();
        updateEditorTitle(true);
      },
    });

    const fileOperations = useAppFileOperations({
      getMarkdown: editor.getMarkdown,
      setMarkdown: editor.setMarkdown,
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

    const appEvents = useAppEvents({
      onOpenFileFromSidebar: fileOperations.handleOpenFileFromSidebar,
      onRequestSave: fileOperations.handleSaveFromToolbar,
      tauriHandlers: {
        onNewFile: async () => {
          await fileOperations.newFile();
        },
        onOpenFile: async () => {
          await fileOperations.openFile();
        },
        onOpenFilePath: async (filePath) => {
          await fileOperations.openFilePath(filePath);
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
          h(StatusBar, {
            unsaved: unsavedGuard.hasUnsavedChanges.value,
            toolbarVisible: editor.toolbarVisible.value,
            onToggleToolbar: editor.toggleToolbar,
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
      ]);
  },
});
