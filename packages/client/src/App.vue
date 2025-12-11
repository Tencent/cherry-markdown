<script setup lang="ts">
import { cherryInstance } from './components/CherryMarkdown';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { useFileStore } from './store';
import { previewOnlySidebar } from './utils';
import { onMounted, onUnmounted } from 'vue';
import FileManager from './components/FileManager.vue';

// 类型定义
interface FileOperationResult {
  success: boolean;
  error?: string;
  path?: string;
}

// 响应式数据
let cherryMarkdown = cherryInstance();
const fileStore = useFileStore();
const appWindow = getCurrentWindow();
let needDealAfterChange = false;

// ========== 窗口标题管理 ==========
const updateTitle = async (path: string | null): Promise<void> => {
  let fileName = '';
  if (path) {
    // 从路径中提取文件名
    const pathParts = path.split(/[\\/]/);
    fileName = pathParts[pathParts.length - 1];
  }
  const title = path ? `${fileName} - Cherry Markdown` : 'Cherry Markdown';
  await appWindow.setTitle(title);
};

// ========== 文件操作函数 ==========
const newFile = (): void => {
  needDealAfterChange = false;
  cherryMarkdown.setMarkdown('');
  fileStore.setCurrentFilePath('');
  updateTitle(null);
};

const openFile = async (): Promise<FileOperationResult> => {
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
    cherryMarkdown.setMarkdown(markdown);
    fileStore.setCurrentFilePath(path);
    switchToPreviewOnly();
    
    // 添加到最近访问列表
    fileStore.addRecentFile(path);
    await updateTitle(path);
    
    return { success: true, path };
  } catch (error) {
    console.error('打开文件失败:', error);
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
    await updateTitle(path);
    
    return { success: true, path };
  } catch (error) {
    console.error('另存为失败:', error);
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
    return { success: true, path: fileStore.currentFilePath };
  } catch (error) {
    console.error('保存文件失败:', error);
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

const dealAfterChange = (markdown: string, html: string): void => {
  if (!needDealAfterChange) {
    needDealAfterChange = true;
    return;
  }
  
  // 自动保存功能
  if (fileStore.currentFilePath) {
    saveMarkdown();
  }
}

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
      cherryMarkdown.setMarkdown(markdown);
      switchToPreviewOnly();
      console.log('成功恢复上次打开的文件:', fileStore.currentFilePath);
      await updateTitle(fileStore.currentFilePath);
    } catch (error) {
      console.warn('恢复上次打开的文件失败:', error);
      // 如果文件不存在或无法访问，清除当前文件路径
      fileStore.setCurrentFilePath(null);
      await updateTitle(null);
    }
  }
};

// ========== 事件处理函数 ==========
const handleOpenFileFromSidebar = (event: Event): void => {
  const customEvent = event as CustomEvent;
  const { filePath, content } = customEvent.detail;
  needDealAfterChange = false;
  cherryMarkdown.setMarkdown(content);
  fileStore.setCurrentFilePath(filePath);
  switchToPreviewOnly();
  updateTitle(filePath);
};

const toggleSidebar = (): void => {
  fileStore.toggleSidebar();
};

// ========== 工具栏管理 ==========
const toggleToolbar = async (): Promise<void> => {
  const cherryNoToolbar = document.querySelector('.cherry--no-toolbar');
  await invoke('get_show_toolbar', { show: !!cherryNoToolbar });
  cherryMarkdown.toolbar.toolbarHandlers.settings('toggleToolbar');
};

// ========== 生命周期钩子 ==========
onMounted(async () => {
  // 初始化工具栏状态
  const cherryNoToolbar = document.querySelector('.cherry--no-toolbar');
  await invoke('get_show_toolbar', { show: !cherryNoToolbar });
  cherryMarkdown = cherryInstance();
  
  // 添加事件监听器
  window.addEventListener('open-file-from-sidebar', handleOpenFileFromSidebar);
  
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

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('open-file-from-sidebar', handleOpenFileFromSidebar);
});

// ========== Tauri 事件监听 ==========
listen('new_file', newFile);
listen('open_file', openFile);
listen('save', saveMarkdown);
listen('save_as', saveAsNewMarkdown);
listen('toggle_toolbar', toggleToolbar);
</script>

<template>
  <div class="app-container">
    <FileManager class="file-manager-sidebar" />
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

.file-manager-sidebar {
  flex-shrink: 0;
  width: 300px;
  height: 100%;
  border-right: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  transition: width 0.3s ease;
}

.file-manager-sidebar.sidebar-collapsed {
  width: 50px;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.sidebar-toggle-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.sidebar-toggle-btn:hover {
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

#markdown-editor {
  height: 100%;
  width: 100%;
  flex: 1;
}
</style>
