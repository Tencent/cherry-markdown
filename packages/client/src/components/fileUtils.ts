import { readDir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { DirectoryNode, FileOperationResult, DirectoryStructureResult } from './types';
import { SUPPORTED_FILE_EXTENSIONS, MAX_DIRECTORY_DEPTH, DEFAULT_FILE_CONTENT } from '../constants/files';

/**
 * Detect whether the current runtime is on Windows.
 * On Linux / macOS the backslash `\` is a legal character in file names,
 * so we MUST NOT convert it. We only do the conversion on Windows.
 */
const isWindowsPlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const navigatorWithUAData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = (
    navigatorWithUAData.userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    ''
  ).toLowerCase();
  return platform.includes('win');
};

const IS_WINDOWS = isWindowsPlatform();

/**
 * The path separator used to join paths.
 *
 * - On Windows we use `/` because all paths are normalized to forward slashes
 *   (the Windows kernel accepts both `/` and `\`, but Tauri's fs scope glob
 *   matching only works reliably with a single, consistent separator).
 * - On POSIX (Linux / macOS) we use `/` because it is the only legal path
 *   separator on these systems.
 */
const PATH_SEPARATOR = '/';

/**
 * Normalize a filesystem path.
 *
 * - On Windows: unify all path separators to forward slashes, because the Tauri 2
 *   `fs` plugin scope glob matching fails on mixed-slash paths
 *   (e.g. "D:\foo\bar/baz.txt"). Forward slashes are also accepted by the
 *   Windows kernel, so this is safe.
 * - On Linux / macOS: keep the path untouched, because `\` is a valid character
 *   in file names on POSIX systems and must NOT be replaced.
 */
export const normalizePath = (p: string): string => {
  if (!p) return p;
  if (!IS_WINDOWS) return p;
  return p.replace(/\\/g, '/');
};

/**
 * Join a base directory with a child name using the platform-aware separator.
 *
 * - The base path is normalized first (only effective on Windows).
 * - Trailing separators on `base` are trimmed before concatenation.
 * - On POSIX, `name` is preserved as-is so that legal backslashes in file names
 *   are not corrupted.
 */
const joinPath = (base: string, name: string): string => {
  const normalizedBase = normalizePath(base);
  // Strip trailing path separators. On Windows the base has been normalized so
  // only `/` can appear; on POSIX only `/` is a separator, so this regex is
  // safe on both platforms.
  const trimmed = normalizedBase.replace(/\/+$/, '');
  if (!trimmed) {
    // base was just "/" (POSIX root) or empty after trimming — keep the root.
    return `${PATH_SEPARATOR}${name}`;
  }
  return `${trimmed}${PATH_SEPARATOR}${name}`;
};

// 检查路径是否存在
export const checkPathExists = async (path: string): Promise<boolean> => {
  try {
    await readDir(normalizePath(path));
    return true;
  } catch {
    return false;
  }
};

// 检查文件扩展名是否支持
export const isSupportedFile = (fileName: string): boolean => {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.includes(fileExtension || '');
};

// 递归加载目录结构（可配置最大深度，包含所有子目录与文件）
export const loadDirectoryStructure = async (
  dirPath: string,
  depth = 0,
  maxDepth: number = MAX_DIRECTORY_DEPTH,
): Promise<DirectoryStructureResult> => {
  if (depth > maxDepth) {
    return { success: true, data: [] };
  }

  const normalizedDir = normalizePath(dirPath);

  try {
    const entries = await readDir(normalizedDir);

    const children: DirectoryNode[] = [];

    for (const entry of entries) {
      const fullPath = joinPath(normalizedDir, entry.name || '');

      if (entry.isDirectory) {
        const node: DirectoryNode = {
          path: fullPath,
          name: entry.name || '',
          type: 'directory',
          expanded: false,
          children: [],
        };

        // 递归预取子节点
        const nested = await loadDirectoryStructure(fullPath, depth + 1, maxDepth);
        if (nested.success && nested.data) {
          node.children = nested.data;
        }
        children.push(node);
      } else {
        if (isSupportedFile(entry.name || '')) {
          children.push({
            path: fullPath,
            name: entry.name || '',
            type: 'file',
          });
        }
      }
    }

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
      error: `加载目录结构失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

// 创建新文件
export const createNewFile = async (): Promise<FileOperationResult> => {
  try {
    const selected = await save({
      filters: [
        {
          name: 'Markdown',
          extensions: SUPPORTED_FILE_EXTENSIONS,
        },
      ],
    });

    if (!selected) {
      return { success: false, error: '用户取消操作' };
    }

    const rawFilePath = Array.isArray(selected) ? selected[0] : selected;
    const filePath = normalizePath(rawFilePath);

    // 创建空文件
    await writeTextFile(filePath, DEFAULT_FILE_CONTENT);

    return { success: true, data: filePath };
  } catch (error) {
    console.error('创建新文件失败:', error);
    return {
      success: false,
      error: `创建新文件失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

// 打开现有文件
export const openExistingFile = async (): Promise<FileOperationResult> => {
  try {
    const selected = await open({
      filters: [
        {
          name: 'Markdown',
          extensions: SUPPORTED_FILE_EXTENSIONS,
        },
      ],
      multiple: false,
    });

    if (!selected) {
      return { success: false, error: '用户取消操作' };
    }

    const rawFilePath = Array.isArray(selected) ? selected[0] : selected;
    const filePath = normalizePath(rawFilePath);
    return { success: true, data: filePath };
  } catch (error) {
    console.error('打开文件失败:', error);
    return {
      success: false,
      error: `打开文件失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

// 打开目录
export const openDirectoryDialog = async (): Promise<FileOperationResult> => {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (!selected) {
      return { success: false, error: '用户取消操作' };
    }

    const rawDirPath = Array.isArray(selected) ? selected[0] : selected;
    const dirPath = normalizePath(rawDirPath);
    return { success: true, data: dirPath };
  } catch (error) {
    console.error('打开目录失败:', error);
    return {
      success: false,
      error: `打开目录失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

// 读取文件内容
export const readFileContent = async (filePath: string): Promise<FileOperationResult> => {
  try {
    const content = await readTextFile(normalizePath(filePath));
    return { success: true, data: content };
  } catch (error) {
    console.error('读取文件失败:', error);
    return {
      success: false,
      error: `读取文件失败: ${error instanceof Error ? error.message : String(error)}`,
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

/**
 * 格式化时间戳为相对时间或绝对日期
 */
export const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  // 时间常量（毫秒）
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;

  if (diff < MINUTE) {
    return '刚刚';
  }

  if (diff < HOUR) {
    return `${Math.floor(diff / MINUTE)}分钟前`;
  }

  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}小时前`;
  }

  if (diff < WEEK) {
    return `${Math.floor(diff / DAY)}天前`;
  }

  return new Date(timestamp).toLocaleDateString();
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
