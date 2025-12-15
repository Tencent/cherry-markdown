// 文件相关类型定义
export interface FileInfo {
  path: string;
  name: string;
  lastAccessed: number;
  size?: number;
  type?: string;
}

// 目录节点类型定义
export interface DirectoryNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  expanded?: boolean;
  children?: DirectoryNode[];
  lastModified?: number;
  size?: number;
}

// 文件管理器状态类型
export interface FileManagerState {
  sidebarCollapsed: boolean;
  currentFilePath: string | null;
  recentFiles: FileInfo[];
  lastOpenedFile: FileInfo | null;
}

// 右键菜单状态类型
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  file: FileInfo | null;
}

// 目录展开状态类型
export interface DirectoryExpansionState {
  [path: string]: boolean;
}

// 文件过滤器类型
export interface FileFilter {
  name: string;
  extensions: string[];
}

// 文件操作结果类型
export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

// 文件读取选项类型
export interface FileReadOptions {
  encoding?: string;
  signal?: AbortSignal;
}

// 文件写入选项类型
export interface FileWriteOptions {
  encoding?: string;
  mode?: number;
  signal?: AbortSignal;
}

// 目录操作选项类型
export interface DirectoryOptions {
  recursive?: boolean;
  signal?: AbortSignal;
}

// 文件对话框选项类型
export interface DialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
  multiple?: boolean;
  directory?: boolean;
}

// 文件管理器事件类型
export interface FileManagerEvents {
  'open-file': (filePath: string, fromDirectoryManager: boolean) => void;
  'create-file': (filePath: string) => void;
  'delete-file': (filePath: string) => void;
  'rename-file': (oldPath: string, newPath: string) => void;
  'toggle-sidebar': (collapsed: boolean) => void;
}

// 目录管理器事件类型
export interface DirectoryManagerEvents {
  'toggle-directory': (dirPath: string, node: DirectoryNode) => void;
  'open-file': (filePath: string) => void;
  'refresh-directories': () => void;
}

// 文件存储接口类型
export interface FileStore {
  sidebarCollapsed: boolean;
  currentFilePath: string | null;
  recentFiles: FileInfo[];
  lastOpenedFile: FileInfo | null;
  sortedRecentFiles: FileInfo[];

  toggleSidebar(): void;
  setCurrentFilePath(filePath: string): void;
  addRecentFile(filePath: string): void;
  removeRecentFile(filePath: string): void;
}

// 工具函数返回类型
export interface DirectoryStructureResult {
  success: boolean;
  error?: string;
  data?: DirectoryNode[];
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

// 常量定义
export const SUPPORTED_FILE_EXTENSIONS = ['md', 'markdown', 'text', 'txt'];
export const MAX_RECENT_FILES = 50;
export const MAX_DIRECTORY_DEPTH = 4;
export const DEFAULT_FILE_CONTENT = '# 新文档\n\n开始编写你的内容...';
