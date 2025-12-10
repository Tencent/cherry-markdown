import { ref, type Ref } from 'vue';
import type { DirectoryNode, FileStore } from '../types';
import {
  checkPathExists,
  loadDirectoryStructure,
  extractDirectoryPath,
  extractFileName,
  openDirectoryDialog
} from '../fileUtils';

/**
 * 目录管理composable
 */
export function useDirectoryManager(
  fileStore: FileStore,
  emit: (event: string, ...args: any[]) => void
) {
  // 目录管理相关数据
  const recentDirectories = ref<DirectoryNode[]>([]);
  
  // 存储目录展开状态的Map
  const directoryExpansionState = ref(new Map<string, boolean>());

  // 从localStorage加载保存的目录展开状态
  const loadExpansionStateFromStorage = (): Map<string, boolean> => {
    try {
      const savedState = localStorage.getItem('cherry-markdown-directory-expansion-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        return new Map(Object.entries(parsedState));
      }
    } catch (error) {
      console.warn('加载目录展开状态失败:', error);
    }
    return new Map();
  };

  // 保存目录展开状态到localStorage
  const saveExpansionStateToStorage = () => {
    try {
      const stateObject = Object.fromEntries(directoryExpansionState.value);
      localStorage.setItem('cherry-markdown-directory-expansion-state', JSON.stringify(stateObject));
    } catch (error) {
      console.warn('保存目录展开状态失败:', error);
    }
  };

  // 从localStorage加载保存的最近目录列表
  const loadRecentDirectoriesFromStorage = (): DirectoryNode[] => {
    try {
      const savedDirectories = localStorage.getItem('cherry-markdown-recent-directories');
      if (savedDirectories) {
        const parsedDirectories = JSON.parse(savedDirectories);
        return parsedDirectories.map((dir: any) => ({
          ...dir,
          expanded: directoryExpansionState.value.get(dir.path) || false
        }));
      }
    } catch (error) {
      console.warn('加载最近目录列表失败:', error);
    }
    return [];
  };

  // 保存最近目录列表到localStorage
  const saveRecentDirectoriesToStorage = () => {
    try {
      // 只保存目录的基本信息，不保存children数据
      const directoriesToSave = recentDirectories.value.map(dir => ({
        path: dir.path,
        name: dir.name,
        type: dir.type,
        expanded: dir.expanded
      }));
      localStorage.setItem('cherry-markdown-recent-directories', JSON.stringify(directoriesToSave));
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
   */
  const mergeSimilarDirectories = (directories: string[]): string[] => {
    const mergedDirectories = new Set<string>();
    
    // 按路径长度排序，从长到短
    const sortedDirs = [...directories].sort((a, b) => b.length - a.length);
    
    // 收集所有相对路径
    const relativePaths = new Set<string>();
    const absolutePaths = new Set<string>();
    
    // 先分类路径
    directories.forEach(dir => {
      if (dir.includes('/') || dir.includes('\\')) {
        absolutePaths.add(dir);
      } else {
        relativePaths.add(dir);
      }
    });
    
    for (const dirPath of sortedDirs) {
      let shouldAdd = true;
      
      // 检查当前目录是否已经是其他目录的子目录
      for (const existingDir of mergedDirectories) {
        // 标准化路径分隔符进行比较
        const normalizedDirPath = dirPath.replace(/\\/g, '/');
        const normalizedExistingDir = existingDir.replace(/\\/g, '/');
        
        // 使用路径分隔符进行更精确的匹配
        if (normalizedDirPath.startsWith(normalizedExistingDir + '/') || normalizedDirPath === normalizedExistingDir) {
          shouldAdd = false;
          break;
        }
        
        // 检查当前目录是否是现有目录的父目录
        if (normalizedExistingDir.startsWith(normalizedDirPath + '/') || normalizedExistingDir === normalizedDirPath) {
          // 如果现有目录是当前目录的子目录，移除现有目录
          mergedDirectories.delete(existingDir);
        }
      }
      
      // 对于相对路径，检查是否已有包含该相对路径的绝对路径
      if (shouldAdd && !dirPath.includes('/') && !dirPath.includes('\\')) {
        for (const absolutePath of absolutePaths) {
          const normalizedAbsolutePath = absolutePath.replace(/\\/g, '/');
          if (normalizedAbsolutePath.endsWith('/' + dirPath) || normalizedAbsolutePath.includes('/' + dirPath + '/')) {
            shouldAdd = false;
            break;
          }
        }
      }
      
      if (shouldAdd) {
        mergedDirectories.add(dirPath);
      }
    }
    
    return Array.from(mergedDirectories);
  };

  // 切换目录展开状态
  const toggleDirectory = async (dirPath: string, node?: DirectoryNode): Promise<void> => {
    let directory: DirectoryNode | undefined;
    
    if (node) {
      // 如果是子目录节点
      directory = node;
    } else {
      // 如果是根目录
      directory = recentDirectories.value.find(dir => dir.path === dirPath);
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

  // 获取最近访问的目录列表
  const getRecentDirectories = async (): Promise<void> => {
    try {
      // 从store中获取最近文件列表
      const recentFiles = fileStore.sortedRecentFiles;
      
      // 从最近访问的文件中提取目录路径
      const directories = new Set<string>();
      
      recentFiles.forEach(file => {
        const dirPath = extractDirectoryPath(file.path);
        if (dirPath) {
          directories.add(dirPath);
        }
      });
      
      // 合并相似目录
      const mergedDirectories = mergeSimilarDirectories(Array.from(directories));
      
      // 检查目录是否存在并获取目录信息
      const directoryList = mergedDirectories.slice(0, 10); // 最多显示10个目录
      
      const directoryResults = await Promise.all(
        directoryList.map(async (dirPath) => {
          const dirExists = await checkPathExists(dirPath);
          if (!dirExists) return null;
          
          const dirName = extractFileName(dirPath);
          
          // 从Map中恢复展开状态，如果没有记录则默认为false
          const expanded = directoryExpansionState.value.get(dirPath) || false;
          
          return {
            path: dirPath,
            name: dirName,
            type: 'directory' as const,
            expanded: expanded,
            children: [] as DirectoryNode[]
          };
        })
      );
      
      // 合并从localStorage加载的目录和从最近文件提取的目录
      const storedDirectories = recentDirectories.value.filter(storedDir => 
        !directoryResults.some(newDir => newDir && newDir.path === storedDir.path)
      );
      
      recentDirectories.value = [
        ...directoryResults.filter(Boolean) as DirectoryNode[],
        ...storedDirectories
      ].slice(0, 10); // 限制最多10个目录
      
      // 为每个目录加载文件列表
      await Promise.all(
        recentDirectories.value.map(async (dir) => {
          if (dir.expanded) {
            const result = await loadDirectoryStructure(dir.path, 1);
            if (result.success && result.data) {
              dir.children = result.data;
            }
          }
        })
      );
      
      // 保存更新后的目录列表
      saveRecentDirectoriesToStorage();
      
    } catch (error) {
      console.error('获取目录列表失败:', error);
    }
  };

  // 打开目录
  const openDirectory = async (): Promise<void> => {
    try {
      const result = await openDirectoryDialog();
      if (!result.success || !result.data) return;
      
      const dirPath = result.data;
      
      // 检查目录是否已经在列表中
      const existingDir = recentDirectories.value.find(dir => dir.path === dirPath);
      if (existingDir) {
        await toggleDirectory(dirPath);
      } else {
        // 添加到目录列表并展开
        const dirName = extractFileName(dirPath);
        const newDir: DirectoryNode = {
          path: dirPath,
          name: dirName,
          type: 'directory',
          expanded: true,
          children: []
        };
        
        // 保存展开状态
        directoryExpansionState.value.set(dirPath, true);
        saveExpansionStateToStorage();
        
        // 加载目录结构
        const loadResult = await loadDirectoryStructure(dirPath, 1);
        if (loadResult.success && loadResult.data) {
          newDir.children = loadResult.data;
        }
        
        // 添加到目录列表开头，并限制最大数量
        recentDirectories.value.unshift(newDir);
        if (recentDirectories.value.length > 10) {
          recentDirectories.value = recentDirectories.value.slice(0, 10);
        }
        
        // 保存到localStorage
        saveRecentDirectoriesToStorage();
      }
      
    } catch (error) {
      console.error('打开目录失败:', error);
    }
  };

  // 刷新目录列表
  const refreshDirectories = async (): Promise<void> => {
    // 在刷新前保存当前所有目录的展开状态
    const currentExpansionState = new Map<string, boolean>();
    recentDirectories.value.forEach(dir => {
      currentExpansionState.set(dir.path, dir.expanded || false);
    });
    
    // 刷新目录列表
    await getRecentDirectories();
    
    // 恢复之前保存的展开状态
    recentDirectories.value.forEach(dir => {
      const savedState = currentExpansionState.get(dir.path);
      if (savedState !== undefined) {
        dir.expanded = savedState;
        // 如果目录是展开的，加载文件列表
        if (dir.expanded && dir.children && dir.children.length === 0) {
          loadDirectoryStructure(dir.path, 1).then(result => {
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
    getRecentDirectories
  };
}
