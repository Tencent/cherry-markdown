import { readDir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { 
  DirectoryNode, 
  FileInfo, 
  FileFilter, 
  DialogOptions,
  FileOperationResult,
  DirectoryStructureResult
} from './types';

// 常量定义
export const SUPPORTED_FILE_EXTENSIONS = ['md', 'markdown', 'text', 'txt'];
export const MAX_RECENT_FILES = 50;
export const MAX_DIRECTORY_DEPTH = 4;
export const DEFAULT_FILE_CONTENT = '# 新文档\n\n开始编写你的内容...';

// 检查路径是否存在
export const checkPathExists = async (path: string): Promise<boolean> => {
  try {
    await readDir(path);
    return true;
  } catch (error) {
    return false;
  }
};

// 检查文件扩展名是否支持
export const isSupportedFile = (fileName: string): boolean => {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.includes(fileExtension || '');
};

// 检查目录是否包含目标文件（递归检查）
export const checkDirectoryHasTargetFiles = async (dirPath: string): Promise<boolean> => {
  try {
    const entries = await readDir(dirPath);
    
    // 检查当前目录是否有目标文件
    const hasFiles = entries.some(entry => 
      !entry.isDirectory && isSupportedFile(entry.name || '')
    );
    
    if (hasFiles) return true;
    
    // 递归检查子目录
    const subdirectories = entries.filter(entry => entry.isDirectory);
    for (const dir of subdirectories) {
      const subDirPath = `${dirPath}/${dir.name}`;
      const subHasFiles = await checkDirectoryHasTargetFiles(subDirPath);
      if (subHasFiles) return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

// 递归加载目录结构
export const loadDirectoryStructure = async (
  dirPath: string, 
  depth: number = 0
): Promise<DirectoryStructureResult> => {
  if (depth > MAX_DIRECTORY_DEPTH) {
    return { success: true, data: [] };
  }
  
  try {
    const entries = await readDir(dirPath);
    
    const children: DirectoryNode[] = [];
    
    // 处理子目录
    const subdirectories = entries.filter(entry => entry.isDirectory);
    for (const dir of subdirectories) {
      const subDirPath = `${dirPath}/${dir.name}`;
      const hasTargetFiles = await checkDirectoryHasTargetFiles(subDirPath);
      
      if (hasTargetFiles) {
        children.push({
          path: subDirPath,
          name: dir.name || '',
          type: 'directory',
          expanded: false,
          children: []
        });
      }
    }
    
    // 处理文件
    const files = entries.filter(entry => 
      !entry.isDirectory && isSupportedFile(entry.name || '')
    );
    
    files.forEach(file => {
      children.push({
        path: `${dirPath}/${file.name}`,
        name: file.name || '',
        type: 'file'
      });
    });
    
    // 按类型和名称排序
    children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
    
    return { success: true, data: children };
  } catch (error) {
    console.error('加载目录结构失败:', error);
    return { 
      success: false, 
      error: `加载目录结构失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// 创建新文件
export const createNewFile = async (): Promise<FileOperationResult> => {
  try {
    const selected = await save({
      filters: [{
        name: 'Markdown',
        extensions: SUPPORTED_FILE_EXTENSIONS
      }]
    });
    
    if (!selected) {
      return { success: false, error: '用户取消操作' };
    }
    
    const filePath = Array.isArray(selected) ? selected[0] : selected;
    
    // 创建空文件
    await writeTextFile(filePath, DEFAULT_FILE_CONTENT);
    
    return { success: true, data: filePath };
  } catch (error) {
    console.error('创建新文件失败:', error);
    return { 
      success: false, 
      error: `创建新文件失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// 打开现有文件
export const openExistingFile = async (): Promise<FileOperationResult> => {
  try {
    const selected = await open({
      filters: [{
        name: 'Markdown',
        extensions: SUPPORTED_FILE_EXTENSIONS
      }],
      multiple: false
    });
    
    if (!selected) {
      return { success: false, error: '用户取消操作' };
    }
    
    const filePath = Array.isArray(selected) ? selected[0] : selected;
    return { success: true, data: filePath };
  } catch (error) {
    console.error('打开文件失败:', error);
    return { 
      success: false, 
      error: `打开文件失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// 打开目录
export const openDirectoryDialog = async (): Promise<FileOperationResult> => {
  try {
    const selected = await open({
      directory: true,
      multiple: false
    });
    
    if (!selected) {
      return { success: false, error: '用户取消操作' };
    }
    
    const dirPath = Array.isArray(selected) ? selected[0] : selected;
    return { success: true, data: dirPath };
  } catch (error) {
    console.error('打开目录失败:', error);
    return { 
      success: false, 
      error: `打开目录失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// 读取文件内容
export const readFileContent = async (filePath: string): Promise<FileOperationResult> => {
  try {
    const content = await readTextFile(filePath);
    return { success: true, data: content };
  } catch (error) {
    console.error('读取文件失败:', error);
    return { 
      success: false, 
      error: `读取文件失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// 写入文件内容
export const writeFileContent = async (filePath: string, content: string): Promise<FileOperationResult> => {
  try {
    await writeTextFile(filePath, content);
    return { success: true };
  } catch (error) {
    console.error('写入文件失败:', error);
    return { 
      success: false, 
      error: `写入文件失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// 从文件路径中提取目录路径
export const extractDirectoryPath = (filePath: string): string => {
  const lastSlashIndex = filePath.lastIndexOf('/');
  return lastSlashIndex !== -1 ? filePath.substring(0, lastSlashIndex) : '';
};

// 从文件路径中提取文件名
export const extractFileName = (filePath: string): string => {
  const lastSlashIndex = filePath.lastIndexOf('/');
  return lastSlashIndex !== -1 ? filePath.substring(lastSlashIndex + 1) : filePath;
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化时间戳
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  
  if (diff < 60000) { // 1分钟内
    return '刚刚';
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 604800000) { // 1周内
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    return date.toLocaleDateString();
  }
};

// 验证文件路径
export const validateFilePath = (filePath: string): boolean => {
  if (!filePath) return false;
  
  // 基本路径验证
  const validPathRegex = /^[a-zA-Z0-9/._-]+$/;
  if (!validPathRegex.test(filePath)) return false;
  
  // 检查文件扩展名
  return isSupportedFile(filePath);
};

// 获取文件信息
export const getFileInfo = async (filePath: string): Promise<FileInfo | null> => {
  try {
    const exists = await checkPathExists(filePath);
    if (!exists) return null;
    
    return {
      path: filePath,
      name: extractFileName(filePath),
      lastAccessed: Date.now()
    };
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return null;
  }
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};