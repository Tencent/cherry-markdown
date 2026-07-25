// 图标组件库索引文件
export { default as FileIcon } from './FileIcon';
export { default as FolderIcon } from './FolderIcon';
export { default as ExpandIcon } from './ExpandIcon';
export { default as ArrowIcon } from './ArrowIcon';
export { default as AddIcon } from './AddIcon';
export { default as LocateIcon } from './LocateIcon';
export { default as RefreshIcon } from './RefreshIcon';
export { default as NewFileIcon } from './NewFileIcon';
export { default as OpenFileIcon } from './OpenFileIcon';
export { default as OpenFolderIcon } from './OpenFolderIcon';
export { default as SettingsIcon } from './SettingsIcon';
export { default as FocusIcon } from './FocusIcon';
export { default as FixedWidthIcon } from './FixedWidthIcon';
export { default as AutoWidthIcon } from './AutoWidthIcon';

// 图标类型定义
export interface IconProps {
  size?: number;
  color?: string;
  class?: string;
}

// 图标尺寸常量
export const ICON_SIZES = {
  SMALL: 12,
  MEDIUM: 16,
  LARGE: 20,
  XLARGE: 24,
} as const;

// 图标颜色常量
export const ICON_COLORS = {
  DEFAULT: 'currentColor',
  PRIMARY: '#007bff',
  SECONDARY: '#6c757d',
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#17a2b8',
} as const;
