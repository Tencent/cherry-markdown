<script setup lang="ts">
import { cherryInstance } from './components/CherryMarkdown';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { useFileStore } from './store';
import { onMounted, onUnmounted } from 'vue';
import SidePanelManager from './components/SidePanelManager.vue';
import type { FileOperationResult } from './components/types';
import { useAppEvents } from './components/composables/useAppEvents';
import { notifyError } from './utils/notifications';

// 响应式数据
let cherryMarkdown = cherryInstance();
const fileStore = useFileStore();
const appWindow = getCurrentWindow();
let needDealAfterChange = false;
let hasUnsavedChanges = false;
let unlistenCloseRequested: (() => void) | undefined;
const preventNativeContextMenu = (event: Event): void => {
  event.preventDefault();
};

// 暴露未保存更改的检查函数供外部使用
const checkUnsavedChanges = (): boolean => {
  return hasUnsavedChanges;
};

const confirmProceedWhenUnsaved = async (): Promise<boolean> => {
  if (!hasUnsavedChanges) return true;

  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return window.confirm('检测到未保存的更改，继续操作将丢失未保存内容，是否继续？');
  }

  return true;
};

// ========== 窗口标题管理 ==========
const updateTitle = async (path: string | null, unsaved: boolean = false): Promise<void> => {
  let fileName = '';
  if (path) {
    // 从路径中提取文件名
    const pathParts = path.split(/[\\\\/]/);
    fileName = pathParts[pathParts.length - 1];
  }
  const unsavedIndicator = unsaved ? '● ' : '';
  const title = path ? `${unsavedIndicator}${fileName} - Cherry Markdown` : 'Cherry Markdown';
  await appWindow.setTitle(title);
};

// ========== 文件操作函数 ==========
const newFile = async (): Promise<void> => {
  if (!(await confirmProceedWhenUnsaved())) return;
  needDealAfterChange = false;
  hasUnsavedChanges = false;
  cherryMarkdown.setMarkdown('');
  fileStore.setCurrentFilePath('');
  await updateTitle(null, false);
};

const openFile = async (): Promise<FileOperationResult> => {
  if (!(await confirmProceedWhenUnsaved())) {
    return { success: false, error: '已取消：存在未保存的更改' };
  }

  try {
    const path = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: 'markdown',
          extensions: ['md', 'text'],
        },
      ],
    });

    if (path === null) {
      return { success: false, error: '用户取消选择文件' };
    }

    const markdown = await readTextFile(path);
    needDealAfterChange = false;
    hasUnsavedChanges = false;
    cherryMarkdown.setMarkdown(markdown);
    fileStore.setCurrentFilePath(path);

    // 添加到最近访问列表
    fileStore.addRecentFile(path);
    await updateTitle(path, false);

    return { success: true, path };
  } catch (error) {
    const message = `打开文件失败: ${error instanceof Error ? error.message : '未知错误'}`;
    notifyError(message);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};

const saveAsNewMarkdown = async (): Promise<FileOperationResult> => {
  try {
    const markdown = cherryMarkdown.getMarkdown();
    const path = await save({
      filters: [
        {
          name: 'Cherry Markdown',
          extensions: ['md', 'markdown'],
        },
      ],
    });

    if (!path) {
      return { success: false, error: '用户取消保存' };
    }

    await writeTextFile(path, markdown);
    fileStore.setCurrentFilePath(path);
    fileStore.addRecentFile(path);
    fileStore.markSaved(path);
    hasUnsavedChanges = false;
    await updateTitle(path, false);

    return { success: true, path };
  } catch (error) {
    const message = `另存为失败: ${error instanceof Error ? error.message : '未知错误'}`;
    notifyError(message);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};

const saveMarkdown = async (): Promise<FileOperationResult> => {
  try {
    const markdown = cherryMarkdown.getMarkdown();

    if (!fileStore.currentFilePath) {
      return await saveAsNewMarkdown();
    }

    await writeTextFile(fileStore.currentFilePath, markdown);
    fileStore.markSaved(fileStore.currentFilePath);
    hasUnsavedChanges = false;
    await updateTitle(fileStore.currentFilePath, false);
    return { success: true, path: fileStore.currentFilePath };
  } catch (error) {
    const message = `保存文件失败: ${error instanceof Error ? error.message : '未知错误'}`;
    notifyError(message);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};

// ========== 编辑器模式管理 ==========
const switchToPreviewOnly = (): void => {
  cherryMarkdown.wrapperDom.classList.add('markdown-preview-only');

  // 隐藏编辑按钮
  const pen = cherryMarkdown.wrapperDom.querySelector('.cherry-toolbar-pen');
  if (pen) {
    pen.classList.remove('active');
  }
  cherryMarkdown.previewer.options.enablePreviewerBubble = false;
};

const switchToEdit = (): void => {
  cherryMarkdown.wrapperDom.classList.remove('markdown-preview-only');
  // 显示编辑按钮
  const pen = cherryMarkdown.wrapperDom.querySelector('.cherry-toolbar-pen');
  if (pen) {
    pen.classList.add('active');
  }
  cherryMarkdown.previewer.options.enablePreviewerBubble = true;
};

const dealAfterChange = (): void => {
  if (!needDealAfterChange) {
    needDealAfterChange = true;
    return;
  }

  // 标记为有未保存的更改，不进行自动保存
  hasUnsavedChanges = true;
  if (fileStore.currentFilePath) {
    void updateTitle(fileStore.currentFilePath, true);
  }
};

const handleEditButtonClick = (): void => {
  const pen = cherryMarkdown.wrapperDom.querySelector('.cherry-toolbar-pen');

  if (pen) {
    if (cherryMarkdown.wrapperDom.classList.contains('markdown-preview-only')) {
      switchToEdit();
    } else {
      switchToPreviewOnly();
    }
  }
};

// ========== 文件恢复功能 ==========
const restoreLastOpenedFile = async (): Promise<void> => {
  if (fileStore.currentFilePath) {
    try {
      const markdown = await readTextFile(fileStore.currentFilePath);
      needDealAfterChange = false;
      hasUnsavedChanges = false;
      cherryMarkdown.setMarkdown(markdown);
      console.log('成功恢复上次打开的文件:', fileStore.currentFilePath);
      await updateTitle(fileStore.currentFilePath, false);
    } catch (error) {
      console.warn('恢复上次打开的文件失败:', error);
      // 如果文件不存在或无法访问，清除当前文件路径并从最近记录移除
      fileStore.removeRecentFile(fileStore.currentFilePath);
      fileStore.setCurrentFilePath(null);
      await updateTitle(null, false);
    }
  }
};

// ========== 事件处理函数 ==========
const handleOpenFileFromSidebar = async (event: Event): Promise<void> => {
  const customEvent = event as CustomEvent;
  const { filePath, content } = customEvent.detail;
  if (!(await confirmProceedWhenUnsaved())) return;
  needDealAfterChange = false;
  hasUnsavedChanges = false;
  cherryMarkdown.setMarkdown(content);
  fileStore.setCurrentFilePath(filePath);
  await updateTitle(filePath, false);
};

const handleSaveFromToolbar = async (): Promise<void> => {
  const result = await saveMarkdown();
  if (!result.success && result.error) {
    notifyError(`保存失败: ${result.error}`);
  }
};

// ========== 工具栏管理 ==========
const toggleToolbar = async (): Promise<void> => {
  const cherryNoToolbar = document.querySelector('.cherry--no-toolbar');
  await invoke('get_show_toolbar', { show: !!cherryNoToolbar });
  cherryMarkdown.toolbar.toolbarHandlers.settings('toggleToolbar');
};

// ========== 键盘快捷键处理 ==========
const registerSaveShortcut = async (): Promise<void> => {
  try {
    // 注册 Ctrl+S 保存快捷键
    await register('CommandOrControl+S', async () => {
      if (fileStore.currentFilePath || hasUnsavedChanges) {
        await saveMarkdown();
      }
    });
  } catch (error) {
    console.warn('注册保存快捷键失败:', error);
  }
};

const unregisterSaveShortcut = async (): Promise<void> => {
  try {
    await unregister('CommandOrControl+S');
  } catch (error) {
    console.warn('注销保存快捷键失败:', error);
  }
};

const appEvents = useAppEvents({
  onOpenFileFromSidebar: handleOpenFileFromSidebar,
  onRequestSave: handleSaveFromToolbar,
  tauriHandlers: {
    onNewFile: newFile,
    onOpenFile: openFile,
    onSave: saveMarkdown,
    onSaveAs: saveAsNewMarkdown,
    onToggleToolbar: toggleToolbar,
  },
});

// ========== 生命周期钩子 ==========
onMounted(async () => {
  // 暴露 checkUnsavedChanges 给 window，以便外部可以使用
  (window as any).checkUnsavedChanges = checkUnsavedChanges;

  // 禁用 Tauri 默认右键菜单（防止原生“查看页面元素”）
  document.addEventListener('contextmenu', preventNativeContextMenu);

  // 初始化工具栏状态
  const cherryNoToolbar = document.querySelector('.cherry--no-toolbar');
  await invoke('get_show_toolbar', { show: !cherryNoToolbar });
  cherryMarkdown = cherryInstance();
  appEvents.registerWindowEvents();
  await appEvents.registerTauriEvents();

  // 窗口关闭防护
  unlistenCloseRequested = await appWindow.onCloseRequested(async (event) => {
    const canClose = await confirmProceedWhenUnsaved();
    if (!canClose) {
      event.preventDefault();
    }
  });

  // 注册全局保存快捷键
  await registerSaveShortcut();

  // 设置编辑按钮事件监听
  setTimeout(() => {
    const pen = cherryMarkdown.wrapperDom.querySelector('.cherry-toolbar-pen');
    if (pen) {
      pen.removeEventListener('click', handleEditButtonClick);
      pen.addEventListener('click', handleEditButtonClick);
    }
  }, 100);

  // 自动恢复上次打开的文件
  await restoreLastOpenedFile();
  cherryMarkdown.on('afterChange', dealAfterChange);
});

onUnmounted(async () => {
  document.removeEventListener('contextmenu', preventNativeContextMenu);
  if (unlistenCloseRequested) {
    unlistenCloseRequested();
  }

  // 注销全局保存快捷键
  await unregisterSaveShortcut();
  await appEvents.cleanupAll();
});
</script>

<template>
  <div class="app-container">
    <SidePanelManager />
    <div class="editor-container">
      <div id="markdown-editor"></div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

#markdown-editor {
  height: 100%;
  width: 100%;
  flex: 1;
}
</style>
