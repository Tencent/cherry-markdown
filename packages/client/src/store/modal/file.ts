import { defineStore } from 'pinia';

import type { FileInfo } from '../../components/types';

interface RecentFile extends FileInfo {}

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

// 统一路径分隔符：将所有反斜杠规范化为正斜杠。
// 这是 store 内部用于路径精确匹配的唯一形态，调用方传入的任何形式（含 `\` 或 `/`）
// 都会先经过本函数归一化，确保 addRecentFile/markSaved/removeRecentFile 等 path
// 比对始终一致，避免历史路径分隔符不统一导致 lastSaved 不更新等问题。
const normalizeStorePath = (p: string): string => (p ? p.replace(/\\/g, '/') : p);

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

    // 1) 字段补齐 + 路径归一化
    const rawList = (savedState.recentFiles || []).map((file) => ({
      ...file,
      path: normalizeStorePath(file.path),
      lastAccessed: file.lastAccessed ?? file.lastSaved ?? file.lastOpened ?? Date.now(),
    }));

    // 2) 合并历史脏数据：同一文件可能因之前反斜杠/正斜杠版本并存而出现重复，
    //    归一化后取每条 path 的最新一条（lastAccessed/lastSaved 取最大值），保证仅保留一条。
    const mergedMap = new Map<string, RecentFile>();
    for (const item of rawList) {
      const exist = mergedMap.get(item.path);
      if (!exist) {
        mergedMap.set(item.path, item);
      } else {
        mergedMap.set(item.path, {
          ...exist,
          ...item,
          lastOpened: Math.max(exist.lastOpened ?? 0, item.lastOpened ?? 0) || undefined,
          lastSaved: Math.max(exist.lastSaved ?? 0, item.lastSaved ?? 0) || null,
          lastAccessed: Math.max(exist.lastAccessed ?? 0, item.lastAccessed ?? 0),
        });
      }
    }
    const recentFiles = Array.from(mergedMap.values());

    return {
      currentFilePath: normalizeStorePath(lastOpenedFile || savedState.currentFilePath || '') || null,
      recentFiles,
      sidebarCollapsed: savedState.sidebarCollapsed || false,
    };
  },

  getters: {
    sortedRecentFiles: (state) => {
      return state.recentFiles.slice().sort((a, b) => {
        const timeA = a.lastAccessed ?? 0;
        const timeB = b.lastAccessed ?? 0;
        return timeB - timeA;
      });
    },

    // 获取最后打开的文件（按时间排序的第一个文件）
    lastOpenedFile: (state) => {
      if (state.recentFiles.length === 0) return null;
      return state.recentFiles.slice().sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))[0];
    },
  },

  actions: {
    setCurrentFilePath(filePath: string | null) {
      this.currentFilePath = filePath ? normalizeStorePath(filePath) : filePath;
      this.saveState();
    },

    addRecentFile(filePath: string) {
      const normalized = normalizeStorePath(filePath);
      const fileName = normalized.split('/').pop() || normalized;
      const now = Date.now();

      // 检查是否已存在（基于归一化后的 path）
      const existingIndex = this.recentFiles.findIndex((file) => file.path === normalized);

      if (existingIndex >= 0) {
        // 更新访问时间
        this.recentFiles[existingIndex].lastOpened = now;
        this.recentFiles[existingIndex].lastAccessed = now;
      } else {
        // 添加新文件
        this.recentFiles.push({
          path: normalized,
          name: fileName,
          lastOpened: now,
          lastAccessed: now,
          lastSaved: null,
        });
      }

      this.saveState();
    },

    markSaved(filePath: string) {
      const normalized = normalizeStorePath(filePath);
      const existingIndex = this.recentFiles.findIndex((file) => file.path === normalized);
      if (existingIndex >= 0) {
        const now = Date.now();
        this.recentFiles[existingIndex].lastSaved = now;
        this.recentFiles[existingIndex].lastAccessed = now;
      } else {
        // 兜底：若该文件还未在最近列表中（理论上不应发生），补一条记录，
        // 避免“保存了却没有任何记录”的情况。
        const fileName = normalized.split('/').pop() || normalized;
        const now = Date.now();
        this.recentFiles.push({
          path: normalized,
          name: fileName,
          lastOpened: now,
          lastAccessed: now,
          lastSaved: now,
        });
      }
      this.saveState();
    },

    removeRecentFile(filePath: string) {
      const normalized = normalizeStorePath(filePath);
      this.recentFiles = this.recentFiles.filter((file) => file.path !== normalized);
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
