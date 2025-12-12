import { ref } from 'vue';
import type { DirectoryNode, FileStore } from '../types';
import {
  checkPathExists,
  loadDirectoryStructure,
  extractDirectoryPath,
  extractFileName,
  openDirectoryDialog,
} from '../fileUtils';

// 常量定义
const MAX_DIRECTORY_COUNT = 10; // 最大目录数量
const STORAGE_KEY_EXPANSION_STATE = 'cherry-markdown-directory-expansion-state';
const STORAGE_KEY_RECENT_DIRECTORIES = 'cherry-markdown-recent-directories';

/**
 * 标准化路径分隔符为正斜杠
 */
const normalizePath = (path: string): string => path.replace(/\\/g, '/');

/**
 * 检查路径是否为绝对路径
 */
const isAbsolutePath = (path: string): boolean => path.includes('/') || path.includes('\\');

/**
 * 目录管理composable
 */
export function useDirectoryManager(fileStore: FileStore, emit: (event: string, ...args: any[]) => void) {
  // 目录管理相关数据
  const recentDirectories = ref<DirectoryNode[]>([]);

  // 存储目录展开状态的Map
  const directoryExpansionState = ref(new Map<string, boolean>());

  /**
   * 从localStorage加载保存的目录展开状态
   */
  const loadExpansionStateFromStorage = (): Map<string, boolean> => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY_EXPANSION_STATE);
      if (!savedState) return new Map();

      const parsedState = JSON.parse(savedState);
      if (typeof parsedState !== 'object' || parsedState === null) {
        console.warn('目录展开状态数据格式错误');
        return new Map();
      }
      return new Map(Object.entries(parsedState));
    } catch (error) {
      console.warn('加载目录展开状态失败:', error);
      return new Map();
    }
  };

  /**
   * 保存目录展开状态到localStorage
   */
  const saveExpansionStateToStorage = (): void => {
    try {
      const stateObject = Object.fromEntries(directoryExpansionState.value);
      localStorage.setItem(STORAGE_KEY_EXPANSION_STATE, JSON.stringify(stateObject));
    } catch (error) {
      console.warn('保存目录展开状态失败:', error);
    }
  };

  /**
   * 从localStorage加载保存的最近目录列表
   */
  const loadRecentDirectoriesFromStorage = (): DirectoryNode[] => {
    try {
      const savedDirectories = localStorage.getItem(STORAGE_KEY_RECENT_DIRECTORIES);
      if (!savedDirectories) return [];

      const parsedDirectories = JSON.parse(savedDirectories);
      if (!Array.isArray(parsedDirectories)) {
        console.warn('最近目录列表数据格式错误');
        return [];
      }

      return parsedDirectories
        .filter((dir) => dir && typeof dir.path === 'string')
        .map((dir) => ({
          ...dir,
          expanded: directoryExpansionState.value.get(dir.path) || false,
          children: [],
        }));
    } catch (error) {
      console.warn('加载最近目录列表失败:', error);
      return [];
    }
  };

  /**
   * 保存最近目录列表到localStorage
   * 只保存目录的基本信息，不保存children数据
   */
  const saveRecentDirectoriesToStorage = (): void => {
    try {
      const directoriesToSave = recentDirectories.value.map((dir) => ({
        path: dir.path,
        name: dir.name,
        type: dir.type,
        expanded: dir.expanded,
      }));
      localStorage.setItem(STORAGE_KEY_RECENT_DIRECTORIES, JSON.stringify(directoriesToSave));
    } catch (error) {
      console.warn('保存最近目录列表失败:', error);
    }
  };

  // 初始化时从localStorage加载状态
  directoryExpansionState.value = loadExpansionStateFromStorage();
  recentDirectories.value = loadRecentDirectoriesFromStorage();

  /**
   * 合并相似目录路径
   * 例如：将 D:\A\doc, doc, D:\A\doc\dir 合并为 D:\A\doc
   * 
   * 算法逻辑：
   * 1. 分离绝对路径和相对路径
   * 2. 按路径长度从短到长排序（父目录优先）
   * 3. 对于每个路径，检查是否已有父路径存在
   * 4. 对于相对路径，检查是否已有对应的绝对路径
   */
  const mergeSimilarDirectories = (directories: string[]): string[] => {
    if (directories.length === 0) return [];
    if (directories.length === 1) return directories;

    // 分离并标准化路径
    const absolutePaths = new Map<string, string>(); // normalized -> original
    const relativePaths = new Set<string>();

    directories.forEach((dir) => {
      if (isAbsolutePath(dir)) {
        const normalized = normalizePath(dir);
        if (!absolutePaths.has(normalized)) {
          absolutePaths.set(normalized, dir);
        }
      } else {
        relativePaths.add(dir);
      }
    });

    // 处理绝对路径：按长度排序，保留最短的父目录
    const sortedAbsolutePaths = Array.from(absolutePaths.keys())
      .sort((a, b) => a.length - b.length);

    const mergedAbsolutePaths = new Set<string>();
    for (const path of sortedAbsolutePaths) {
      // 检查是否已有父目录
      let hasParent = false;
      for (const existingPath of mergedAbsolutePaths) {
        if (path.startsWith(`${existingPath}/`)) {
          hasParent = true;
          break;
        }
      }

      if (!hasParent) {
        mergedAbsolutePaths.add(absolutePaths.get(path)!);
      }
    }

    // 处理相对路径：排除已有对应绝对路径的相对路径
    const mergedRelativePaths = Array.from(relativePaths).filter((relPath) => {
      return !Array.from(mergedAbsolutePaths).some((absPath) => {
        const normalized = normalizePath(absPath);
        return normalized.endsWith(`/${relPath}`) || normalized.includes(`/${relPath}/`);
      });
    });

    return [...mergedAbsolutePaths, ...mergedRelativePaths];
  };

  // 切换目录展开状态
  const toggleDirectory = async (dirPath: string, node?: DirectoryNode): Promise<void> => {
    let directory: DirectoryNode | undefined;

    if (node) {
      // 如果是子目录节点
      directory = node;
    } else {
      // 如果是根目录
      directory = recentDirectories.value.find((dir) => dir.path === dirPath);
    }

    if (!directory) return;

    directory.expanded = !directory.expanded;

    // 保存展开状态到Map
    directoryExpansionState.value.set(dirPath, directory.expanded);

    // 保存状态到localStorage
    saveExpansionStateToStorage();

    if (directory.expanded) {
      // 如果展开且没有子节点数据，加载子节点
      if (!directory.children || directory.children.length === 0) {
        const result = await loadDirectoryStructure(dirPath, 1);
        if (result.success && result.data) {
          directory.children = result.data;
        }
      }
    }
  };

  /**
   * 获取最近访问的目录列表
   */
  const getRecentDirectories = async (): Promise<void> => {
    try {
      // 从最近文件中提取目录路径
      const directories = new Set<string>();
      fileStore.sortedRecentFiles.forEach((file) => {
        const dirPath = extractDirectoryPath(file.path);
        if (dirPath) directories.add(dirPath);
      });

      // 合并相似目录并限制数量
      const mergedDirectories = mergeSimilarDirectories(Array.from(directories))
        .slice(0, MAX_DIRECTORY_COUNT);

      // 验证目录存在性并创建目录节点
      const directoryResults = await Promise.all(
        mergedDirectories.map(async (dirPath) => {
          const dirExists = await checkPathExists(dirPath);
          if (!dirExists) return null;

          return {
            path: dirPath,
            name: extractFileName(dirPath),
            type: 'directory' as const,
            expanded: directoryExpansionState.value.get(dirPath) || false,
            children: [] as DirectoryNode[],
          };
        }),
      );

      // 合并从localStorage加载的目录和新提取的目录
      const validDirectories = directoryResults.filter(Boolean) as DirectoryNode[];
      const storedDirectories = recentDirectories.value.filter(
        (storedDir) => !validDirectories.some((newDir) => newDir.path === storedDir.path),
      );

      recentDirectories.value = [...validDirectories, ...storedDirectories]
        .slice(0, MAX_DIRECTORY_COUNT);

      // 为已展开的目录加载文件列表
      const loadPromises = recentDirectories.value
        .filter((dir) => dir.expanded)
        .map(async (dir) => {
          const result = await loadDirectoryStructure(dir.path, 1);
          if (result.success && result.data) {
            dir.children = result.data;
          }
        });

      await Promise.all(loadPromises);

      // 保存更新后的目录列表
      saveRecentDirectoriesToStorage();
    } catch (error) {
      console.error('获取目录列表失败:', error);
    }
  };

  /**
   * 打开目录对话框并添加到列表
   */
  const openDirectory = async (): Promise<void> => {
    try {
      const result = await openDirectoryDialog();
      if (!result.success || !result.data) return;

      const dirPath = result.data;

      // 检查目录是否已经在列表中
      const existingDir = recentDirectories.value.find((dir) => dir.path === dirPath);
      if (existingDir) {
        // 如果已存在，切换展开状态
        await toggleDirectory(dirPath);
        return;
      }

      // 创建新目录节点
      const newDir: DirectoryNode = {
        path: dirPath,
        name: extractFileName(dirPath),
        type: 'directory',
        expanded: true,
        children: [],
      };

      // 保存展开状态
      directoryExpansionState.value.set(dirPath, true);
      saveExpansionStateToStorage();

      // 加载目录结构
      const loadResult = await loadDirectoryStructure(dirPath, 1);
      if (loadResult.success && loadResult.data) {
        newDir.children = loadResult.data;
      }

      // 添加到目录列表开头并限制数量
      recentDirectories.value = [newDir, ...recentDirectories.value]
        .slice(0, MAX_DIRECTORY_COUNT);

      // 保存到localStorage
      saveRecentDirectoriesToStorage();
    } catch (error) {
      console.error('打开目录失败:', error);
    }
  };

  // 刷新目录列表
  const refreshDirectories = async (): Promise<void> => {
    // 在刷新前保存当前所有目录的展开状态
    const currentExpansionState = new Map<string, boolean>();
    recentDirectories.value.forEach((dir) => {
      currentExpansionState.set(dir.path, dir.expanded || false);
    });

    // 刷新目录列表
    await getRecentDirectories();

    // 恢复之前保存的展开状态
    recentDirectories.value.forEach((dir) => {
      const savedState = currentExpansionState.get(dir.path);
      if (savedState !== undefined) {
        dir.expanded = savedState;
        // 如果目录是展开的，加载文件列表
        if (dir.expanded && dir.children && dir.children.length === 0) {
          loadDirectoryStructure(dir.path, 1).then((result) => {
            if (result.success && result.data) {
              dir.children = result.data;
            }
          });
        }
      }
    });

    // 保存更新后的目录列表
    saveRecentDirectoriesToStorage();
  };

  return {
    recentDirectories,
    directoryExpansionState,
    toggleDirectory,
    openDirectory,
    refreshDirectories,
    getRecentDirectories,
  };
}
