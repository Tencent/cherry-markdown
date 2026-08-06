import * as vscode from 'vscode';
import type { BackfillImageProp, CustomUploader, UploadType } from './types/upload';

export type UsageMode = 'active' | 'only-manual';
export type CherryTheme = 'default' | 'dark' | 'green' | 'red';

const usageAliases: Record<string, UsageMode> = {
  active: 'active',
  Active: 'active',
  激活: 'active',
  Активный: 'active',
  'only-manual': 'only-manual',
  'Manual only': 'only-manual',
  仅手动: 'only-manual',
  'Только вручную': 'only-manual',
};

const themeAliases: Record<string, CherryTheme> = {
  default: 'default',
  Default: 'default',
  默认: 'default',
  'По умолчанию': 'default',
  dark: 'dark',
  Dark: 'dark',
  深色: 'dark',
  Тёмная: 'dark',
  green: 'green',
  Green: 'green',
  绿色: 'green',
  Зелёная: 'green',
  red: 'red',
  Red: 'red',
  红色: 'red',
  Красная: 'red',
};

const uploadTypeAliases: Record<string, UploadType> = {
  none: 'none',
  None: 'none',
  无: 'none',
  Нет: 'none',
  custom: 'custom',
  CustomUploader: 'custom',
  自定义上传器: 'custom',
  'Пользовательский загрузчик': 'custom',
  picgo: 'picgo',
  PicGoServer: 'picgo',
  'PicGo 服务器': 'picgo',
};

const backfillPropAliases: Record<string, BackfillImageProp> = {
  isBorder: 'isBorder',
  Border: 'isBorder',
  边框: 'isBorder',
  Граница: 'isBorder',
  isNotBorder: 'isNotBorder',
  'No border': 'isNotBorder',
  无边框: 'isNotBorder',
  'Без границы': 'isNotBorder',
  isShadow: 'isShadow',
  Shadow: 'isShadow',
  阴影: 'isShadow',
  Тень: 'isShadow',
  isRadius: 'isRadius',
  'Rounded corners': 'isRadius',
  圆角: 'isRadius',
  'Скруглённые углы': 'isRadius',
};

export function normalizeUsage(value: unknown): UsageMode {
  return typeof value === 'string' ? (usageAliases[value] ?? 'active') : 'active';
}

export function normalizeTheme(value: unknown): CherryTheme {
  return typeof value === 'string' ? (themeAliases[value] ?? 'default') : 'default';
}

export function normalizeUploadType(value: unknown): UploadType {
  return typeof value === 'string' ? (uploadTypeAliases[value] ?? 'none') : 'none';
}

export function normalizeBackfillImageProps(value: unknown): BackfillImageProp[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((item) => (typeof item === 'string' ? backfillPropAliases[item] : undefined))
    .filter((item): item is BackfillImageProp => item !== undefined);
  return [...new Set(normalized)];
}

export function getUsageMode(resource?: vscode.Uri): UsageMode {
  return normalizeUsage(vscode.workspace.getConfiguration('cherryMarkdown', resource).get('Usage'));
}

export function getTheme(resource?: vscode.Uri): CherryTheme {
  return normalizeTheme(vscode.workspace.getConfiguration('cherryMarkdown', resource).get('Theme'));
}

export function getUploadType(resource?: vscode.Uri): UploadType {
  return normalizeUploadType(vscode.workspace.getConfiguration('cherryMarkdown', resource).get('UploadType'));
}

export function getCustomUploader(resource?: vscode.Uri): CustomUploader | undefined {
  return vscode.workspace.getConfiguration('cherryMarkdown', resource).get<CustomUploader>('CustomUploader');
}

export function getPicGoServer(resource?: vscode.Uri): string {
  return vscode.workspace
    .getConfiguration('cherryMarkdown', resource)
    .get<string>('PicGoServer', 'http://127.0.0.1:36677/upload');
}

export function getBackfillImageProps(resource?: vscode.Uri): BackfillImageProp[] {
  return normalizeBackfillImageProps(
    vscode.workspace.getConfiguration('cherryMarkdown', resource).get('BackfillImageProps'),
  );
}
