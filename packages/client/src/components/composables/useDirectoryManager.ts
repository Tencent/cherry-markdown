import { ref } from 'vue';
import type { DirectoryNode, FileStore } from '../types';
import {
  checkPathExists,
  loadDirectoryStructure,
  extractDirectoryPath,
  extractFileName,
  openDirectoryDialog,
} from '../fileUtils';
import { useDirectoryStore } from '../../store';
import { mergeSimilarDirectories } from '../../utils/path';

// 常量定义
const MAX_DIRECTORY_COUNT = 10; // 最大目录数量
const FULL_TREE_DEPTH = 64;

/**
 * 目录管理composable
 */
export function useDirectoryManager(fileStore: FileStore) {
  const directoryStore = useDirectoryStore();

  // 目录管理相关数据
  const recentDirectories = ref<DirectoryNode[]>([]);

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
    directoryStore.setExpanded(dirPath, directory.expanded);

    if (directory.expanded) {
      if (!directory.children || directory.children.length === 0) {
        const result = await loadDirectoryStructure(dirPath, 1, FULL_TREE_DEPTH);
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
      const mergedDirectories = mergeSimilarDirectories(Array.from(directories)).slice(0, MAX_DIRECTORY_COUNT);

      // 验证目录存在性并创建目录节点
      const directoryResults = await Promise.all(
        mergedDirectories.map(async (dirPath) => {
          const dirExists = await checkPathExists(dirPath);
          if (!dirExists) return null;

          const cached = directoryStore.items.find((it) => it.path === dirPath);
          return {
            path: dirPath,
            name: extractFileName(dirPath),
            type: 'directory' as const,
            expanded: cached?.expanded ?? false,
            children: [] as DirectoryNode[],
          };
        }),
      );

      const validDirectories = directoryResults.filter(Boolean) as DirectoryNode[];

      // 结合 pinia 缓存（确保缓存的目录也能恢复）
      const cachedOnly = directoryStore.items
        .filter((item) => !validDirectories.some((dir) => dir.path === item.path))
        .map((item) => ({
          path: item.path,
          name: extractFileName(item.path),
          type: 'directory' as const,
          expanded: item.expanded,
          children: [] as DirectoryNode[],
        }));

      recentDirectories.value = [...validDirectories, ...cachedOnly].slice(0, MAX_DIRECTORY_COUNT);

      // 为已展开的目录加载文件列表
      const loadPromises = recentDirectories.value
        .filter((dir) => dir.expanded)
        .map(async (currentDir) => {
          const result = await loadDirectoryStructure(currentDir.path, 1, FULL_TREE_DEPTH);
          if (result.success && result.data) {
            const updatedDir = recentDirectories.value.find((dir) => dir.path === currentDir.path);
            if (updatedDir) {
              updatedDir.children = result.data;
            }
          }
        });

      await Promise.all(loadPromises);

      directoryStore.setItems(
        recentDirectories.value.map((dir) => ({ path: dir.path, expanded: dir.expanded ?? false })),
      );
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

      directoryStore.upsertDirectory(dirPath, true);

      // 加载目录结构
      const loadResult = await loadDirectoryStructure(dirPath, 1, FULL_TREE_DEPTH);
      if (loadResult.success && loadResult.data) {
        newDir.children = loadResult.data;
      }

      // 添加到目录列表开头并限制数量
      recentDirectories.value = [newDir, ...recentDirectories.value].slice(0, MAX_DIRECTORY_COUNT);
      directoryStore.setItems(
        recentDirectories.value.map((dir) => ({ path: dir.path, expanded: dir.expanded ?? false })),
      );
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
    recentDirectories.value.forEach((currentDir) => {
      const savedState = currentExpansionState.get(currentDir.path);
      if (savedState !== undefined) {
        const updatableDir = recentDirectories.value.find((d) => d.path === currentDir.path);
        if (updatableDir) {
          updatableDir.expanded = savedState;
        }
        // 如果目录是展开的，加载文件列表
        if (savedState && currentDir.children && currentDir.children.length === 0) {
          loadDirectoryStructure(currentDir.path, 1, FULL_TREE_DEPTH).then((result) => {
            if (result.success && result.data) {
              const updatedDir = recentDirectories.value.find((d) => d.path === currentDir.path);
              if (updatedDir) {
                updatedDir.children = result.data;
              }
            }
          });
        }
      }
    });

    directoryStore.setItems(
      recentDirectories.value.map((dir) => ({ path: dir.path, expanded: dir.expanded ?? false })),
    );
  };

  return {
    recentDirectories,
    toggleDirectory,
    openDirectory,
    refreshDirectories,
    getRecentDirectories,
  };
}
