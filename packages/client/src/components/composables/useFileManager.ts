import { ref, computed, type Ref } from 'vue';
import type { FileInfo, ContextMenuState, FileStore } from '../types';
import {
  createNewFile as createNewFileUtil,
  openExistingFile as openExistingFileUtil,
  readFileContent,
  formatTimestamp,
  debounce,
} from '../fileUtils';
import { openPath } from '@tauri-apps/plugin-opener';

// 常量定义
const STORAGE_KEY_DIRECTORY_MANAGER_EXPANDED = 'cherry-markdown-directory-manager-expanded';
const DEFAULT_DIRECTORY_MANAGER_EXPANDED = true;

/**
 * 文件管理composable
 */
export function useFileManager(fileStore: FileStore, folderManagerRef: Ref<any>) {
  // 响应式数据
  const sortedRecentFiles = computed(() => fileStore.sortedRecentFiles);
  const currentFilePath = computed(() => fileStore.currentFilePath);
  const lastOpenedFile = computed(() => fileStore.lastOpenedFile);

  /**
   * 从localStorage加载目录管理展开状态
   */
  const loadDirectoryManagerExpandedState = (): boolean => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY_DIRECTORY_MANAGER_EXPANDED);
      if (savedState === null) {
        return DEFAULT_DIRECTORY_MANAGER_EXPANDED;
      }
      
      const parsed = JSON.parse(savedState);
      return typeof parsed === 'boolean' ? parsed : DEFAULT_DIRECTORY_MANAGER_EXPANDED;
    } catch (error) {
      console.warn('加载目录管理展开状态失败:', error);
      return DEFAULT_DIRECTORY_MANAGER_EXPANDED;
    }
  };

  /**
   * 保存目录管理展开状态到localStorage
   */
  const saveDirectoryManagerExpandedState = (expanded: boolean): void => {
    try {
      localStorage.setItem(STORAGE_KEY_DIRECTORY_MANAGER_EXPANDED, JSON.stringify(expanded));
    } catch (error) {
      console.warn('保存目录管理展开状态失败:', error);
    }
  };

  // 组件状态
  const recentFilesExpanded = ref(false);
  const directoryManagerExpanded = ref(loadDirectoryManagerExpandedState());

  const contextMenu = ref<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    file: null,
  });

  // 切换目录管理展开状态
  const toggleDirectoryManager = (): void => {
    directoryManagerExpanded.value = !directoryManagerExpanded.value;
    // 保存状态到localStorage
    saveDirectoryManagerExpandedState(directoryManagerExpanded.value);

    if (directoryManagerExpanded.value) {
      recentFilesExpanded.value = false;
    }
  };

  // 切换最近文件展开状态
  const toggleRecentFiles = (): void => {
    recentFilesExpanded.value = !recentFilesExpanded.value;
    if (recentFilesExpanded.value) {
      directoryManagerExpanded.value = false;
      // 保存状态到localStorage
      saveDirectoryManagerExpandedState(false);
    }
  };

  // 切换侧边栏
  const toggleSidebar = (): void => {
    fileStore.toggleSidebar();
  };

  // 创建新文件
  const createNewFile = async (): Promise<void> => {
    const result = await createNewFileUtil();
    if (result.success && result.data) {
      await openFile(result.data);
    } else if (result.error) {
      console.error('创建新文件失败:', result.error);
    }
  };

  // 打开现有文件
  const openExistingFile = async (): Promise<void> => {
    const result = await openExistingFileUtil();
    if (result.success && result.data) {
      await openFile(result.data);
    } else if (result.error) {
      console.error('打开文件失败:', result.error);
    }
  };

  // 打开目录
  const openDirectory = async (): Promise<void> => {
    try {
      if (folderManagerRef.value) {
        await folderManagerRef.value.openDirectory();
      }
    } catch (error) {
      console.error('打开目录失败:', error);
    }
  };

  // 打开文件
  const openFile = async (filePath: string, fromDirectoryManager: boolean = false): Promise<void> => {
    try {
      const result = await readFileContent(filePath);
      if (result.success && result.data) {
        // 通过自定义事件传递文件内容到App.vue
        window.dispatchEvent(
          new CustomEvent('open-file-from-sidebar', {
            detail: { filePath, content: result.data },
          }),
        );
        // 更新当前文件路径
        fileStore.setCurrentFilePath(filePath);
        // 添加到最近访问列表
        fileStore.addRecentFile(filePath);

        if (fromDirectoryManager) {
          // 如果从目录管理打开文件，始终展开目录管理区域
          directoryManagerExpanded.value = true;
          recentFilesExpanded.value = false;
          saveDirectoryManagerExpandedState(true);
        } else {
          // 如果文件不在目录管理中，展开最近访问列表并高亮文件
          recentFilesExpanded.value = true;
          directoryManagerExpanded.value = false;
          saveDirectoryManagerExpandedState(false);
        }
      } else {
        console.error('读取文件失败:', result.error);
      }
    } catch (error) {
      console.error('打开文件失败:', error);
    }
  };

  // 检查文件是否在目录管理中
  const checkFileInDirectoryManager = async (filePath: string): Promise<boolean> => {
    console.log(folderManagerRef);
    if (!folderManagerRef.value) return false;
    try {
      // 获取目录管理中的目录列表
      const directories = await folderManagerRef.value.getRecentDirectories();
      if (!directories || directories.length === 0) return false;
      // 标准化文件路径
      const normalizedFilePath = filePath.replace(/\\\\/g, '/');
      // 检查文件是否在任何一个目录中
      for (const dir of directories) {
        const normalizedDirPath = dir.path.replace(/\\\\/g, '/');
        // 检查文件路径是否以目录路径开头（考虑路径分隔符）
        if (normalizedFilePath.startsWith(`${normalizedDirPath}/`) || normalizedFilePath === normalizedDirPath) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('检查文件是否在目录管理中失败:', error);
      return false;
    }
  };

  // 处理FolderManager的open-file事件
  const handleOpenFile = (filePath: string, fromDirectoryManager: boolean): void => {
    openFile(filePath, fromDirectoryManager);
  };

  // 刷新目录
  const refreshDirectories = async (): Promise<void> => {
    if (folderManagerRef.value) {
      await folderManagerRef.value.refreshDirectories();
    }
  };

  // 清空最近文件列表
  const clearRecentFiles = (): void => {
    fileStore.recentFiles = [];
    refreshDirectories();
  };

  // 从最近文件中移除
  const removeFromRecent = (filePath: string): void => {
    fileStore.removeRecentFile(filePath);
    refreshDirectories();
  };

  // 复制文件路径
  const copyFilePath = async (filePath: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(filePath);
      hideContextMenu();
    } catch (error) {
      console.error('复制文件路径失败:', error);
    }
  };

  // 在资源管理器中打开文件
  const openInExplorer = async (filePath: string): Promise<void> => {
    try {
      // 从文件路径中提取目录路径
      const directoryPath = filePath.replace(/\\\\/g, '/').replace(/\/[^\\/]*$/, '');

      // 使用Tauri opener插件打开文件夹
      await openPath(directoryPath);
      hideContextMenu();
    } catch (error) {
      console.error('打开资源管理器失败:', error);
      // 备选方案：复制文件路径到剪贴板
      try {
        await navigator.clipboard.writeText(filePath);
        alert(`无法打开，已复制文件路径到剪贴板: ${filePath}`);
      } catch (clipboardError) {
        console.error('复制文件路径失败:', clipboardError);
      }
    }
  };

  // 显示右键菜单
  const showContextMenu = (event: MouseEvent, file: FileInfo | any): void => {
    event.preventDefault();

    // 如果已经有右键菜单显示，先关闭它
    if (contextMenu.value.visible) {
      hideContextMenu();
    }

    // 将DirectoryNode转换为FileInfo格式
    const fileInfo: FileInfo = {
      path: file.path,
      name: file.name,
      lastAccessed: file.lastModified || Date.now(),
      size: file.size,
      type: file.type,
    };

    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      file: fileInfo,
    };

    // 添加全局点击监听器，点击其他地方时关闭菜单
    setTimeout(() => {
      document.addEventListener('click', handleGlobalClick, { once: true });
    }, 0);
  };

  // 处理全局点击事件
  const handleGlobalClick = (event: MouseEvent): void => {
    if (!contextMenu.value.visible) return;

    // 检查点击是否在右键菜单内部
    const contextMenuElement = document.querySelector('.context-menu');
    if (contextMenuElement && !contextMenuElement.contains(event.target as Node)) {
      hideContextMenu();
    }
  };

  // 隐藏右键菜单
  const hideContextMenu = (): void => {
    contextMenu.value.visible = false;
    // 移除全局点击监听器
    document.removeEventListener('click', handleGlobalClick);
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return formatTimestamp(timestamp);
  };

  // 防抖处理文件操作
  const debouncedOpenFile = debounce(openFile, 300);

  return {
    sortedRecentFiles,
    currentFilePath,
    lastOpenedFile,
    recentFilesExpanded,
    directoryManagerExpanded,
    contextMenu,
    toggleDirectoryManager,
    toggleRecentFiles,
    toggleSidebar,
    createNewFile,
    openExistingFile,
    openDirectory,
    openFile,
    handleOpenFile,
    refreshDirectories,
    clearRecentFiles,
    removeFromRecent,
    copyFilePath,
    openInExplorer,
    showContextMenu,
    hideContextMenu,
    formatTime,
    debouncedOpenFile,
  };
}
