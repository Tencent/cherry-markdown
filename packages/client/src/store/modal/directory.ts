import { defineStore } from 'pinia';

interface DirectoryCacheItem {
  path: string;
  expanded: boolean;
}

interface DirectoryState {
  items: DirectoryCacheItem[];
  currentPath: string | null;
}

const STORAGE_KEY = 'cherry_markdown_directories';
const CURRENT_KEY = 'cherry_markdown_current_directory';

const loadItemsFromStorage = (): DirectoryCacheItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => x && typeof x.path === 'string').map((x) => ({
          path: x.path as string,
          expanded: Boolean(x.expanded),
        }));
      }
    }
  } catch (error) {
    console.warn('加载目录缓存失败:', error);
  }
  return [];
};

const loadCurrentFromStorage = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
};

const saveToStorage = (items: DirectoryCacheItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('保存目录缓存失败:', error);
  }
};

const saveCurrentPath = (path: string | null) => {
  try {
    if (path) {
      localStorage.setItem(CURRENT_KEY, path);
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  } catch (error) {
    console.warn('保存当前目录失败:', error);
  }
};

export const useDirectoryStore = defineStore('directories', {
  state: (): DirectoryState => ({
    items: loadItemsFromStorage(),
    currentPath: loadCurrentFromStorage(),
  }),
  actions: {
    upsertDirectory(path: string, expanded: boolean = true) {
      const idx = this.items.findIndex((it) => it.path === path);
      if (idx >= 0) {
        this.items[idx].expanded = expanded;
      } else {
        this.items.unshift({ path, expanded });
      }
      saveToStorage(this.items);
    },
    setCurrent(path: string | null) {
      this.currentPath = path;
      saveCurrentPath(path);
    },
    setExpanded(path: string, expanded: boolean) {
      const idx = this.items.findIndex((it) => it.path === path);
      if (idx >= 0) {
        this.items[idx].expanded = expanded;
        saveToStorage(this.items);
      }
    },
    setItems(items: DirectoryCacheItem[]) {
      this.items = items;
      saveToStorage(this.items);
    },
    removeMissing(validPaths: Set<string>) {
      this.items = this.items.filter((it) => validPaths.has(it.path));
      saveToStorage(this.items);
    },
    clear() {
      this.items = [];
      this.currentPath = null;
      saveToStorage(this.items);
      saveCurrentPath(null);
    },
  },
});
