import { defineStore } from 'pinia';

interface RecentFile {
  path: string;
  name: string;
  lastOpened: number;
  lastSaved?: number | null;
}

interface FileState {
  currentFilePath: string | null;
  recentFiles: RecentFile[];
  sidebarCollapsed: boolean;
}

// 持久化存储键名
const STORAGE_KEYS = {
  FILE_STATE: 'cherry_markdown_file_state',
  LAST_OPENED_FILE: 'cherry_markdown_last_opened_file',
};

// 从持久化存储加载数据
const loadFromStorage = (): Partial<FileState> => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEYS.FILE_STATE);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.warn('加载文件状态失败:', error);
  }
  return {};
};

// 保存数据到持久化存储
const saveToStorage = (state: FileState) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.FILE_STATE,
      JSON.stringify({
        recentFiles: state.recentFiles,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    );

    // 单独保存最后打开的文件路径
    if (state.currentFilePath) {
      localStorage.setItem(STORAGE_KEYS.LAST_OPENED_FILE, state.currentFilePath);
    }
  } catch (error) {
    console.warn('保存文件状态失败:', error);
  }
};

export const useFileStore = defineStore('file', {
  state: (): FileState => {
    const savedState = loadFromStorage();
    const lastOpenedFile = localStorage.getItem(STORAGE_KEYS.LAST_OPENED_FILE);

    return {
      currentFilePath: lastOpenedFile || savedState.currentFilePath || null,
      recentFiles: savedState.recentFiles || [],
      sidebarCollapsed: savedState.sidebarCollapsed || false,
    };
  },

  getters: {
    sortedRecentFiles: (state) => {
      return state.recentFiles
        .slice()
        .sort((a, b) => {
          const timeA = a.lastSaved ?? a.lastOpened;
          const timeB = b.lastSaved ?? b.lastOpened;
          return timeB - timeA;
        });
    },

    // 获取最后打开的文件（按时间排序的第一个文件）
    lastOpenedFile: (state) => {
      if (state.recentFiles.length === 0) return null;
      return state.recentFiles.slice().sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
    },
  },

  actions: {
    setCurrentFilePath(filePath: string | null) {
      this.currentFilePath = filePath;
      this.saveState();
    },

    addRecentFile(filePath: string) {
      const fileName = filePath.split(/[\\/]/).pop() || filePath;
      const now = Date.now();

      // 检查是否已存在
      const existingIndex = this.recentFiles.findIndex((file) => file.path === filePath);

      if (existingIndex >= 0) {
        // 更新访问时间
        this.recentFiles[existingIndex].lastOpened = now;
      } else {
        // 添加新文件
        this.recentFiles.push({
          path: filePath,
          name: fileName,
          lastOpened: now,
          lastSaved: null,
        });
      }

      this.saveState();
    },

    markSaved(filePath: string) {
      const existingIndex = this.recentFiles.findIndex((file) => file.path === filePath);
      if (existingIndex >= 0) {
        this.recentFiles[existingIndex].lastSaved = Date.now();
        this.saveState();
      }
    },

    removeRecentFile(filePath: string) {
      this.recentFiles = this.recentFiles.filter((file) => file.path !== filePath);
      this.saveState();
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      this.saveState();
    },

    // 保存状态到持久化存储
    saveState() {
      saveToStorage(this.$state);
    },

    // 清空所有文件记忆
    clearAllFileMemory() {
      this.currentFilePath = null;
      this.recentFiles = [];
      localStorage.removeItem(STORAGE_KEYS.FILE_STATE);
      localStorage.removeItem(STORAGE_KEYS.LAST_OPENED_FILE);
    },
  },
});
