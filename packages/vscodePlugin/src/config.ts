import * as vscode from 'vscode';
import type { BackfillImageProp, CustomUploader, ImageUploadMode } from './types/upload';

export type UsageMode = 'active' | 'only-manual';
export type CherryTheme = 'default' | 'dark' | 'gray' | 'abyss' | 'green' | 'red' | 'violet' | 'blue';
export const THEME_STATE_KEY = 'cherryMarkdown.theme';
export const IMAGE_UPLOAD_MODE_MIGRATED_KEY = 'cherryMarkdown.imageUploadModeMigrated';
export const DEFAULT_ASSET_DIRECTORY = '.cherry-assets';

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
  gray: 'gray',
  Gray: 'gray',
  沉稳: 'gray',
  abyss: 'abyss',
  Abyss: 'abyss',
  深海: 'abyss',
  green: 'green',
  Green: 'green',
  绿色: 'green',
  Зелёная: 'green',
  red: 'red',
  Red: 'red',
  红色: 'red',
  Красная: 'red',
  violet: 'violet',
  Violet: 'violet',
  淡雅: 'violet',
  blue: 'blue',
  Blue: 'blue',
  清幽: 'blue',
};

const imageUploadModeAliases: Record<string, ImageUploadMode> = {
  workspace: 'workspace',
  Workspace: 'workspace',
  工作区: 'workspace',
  data: 'data',
  Data: 'data',
  Base64: 'data',
  base64: 'data',
  remote: 'remote',
  Remote: 'remote',
  远程: 'remote',
  custom: 'remote',
  CustomUploader: 'remote',
  自定义上传器: 'remote',
  'Пользовательский загрузчик': 'remote',
};
const legacyPicGoAliases = new Set(['PicGoServer', 'PicGo Server', 'PicGo 服务器', 'PicGo服务器']);

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

export function normalizeImageUploadMode(value: unknown): ImageUploadMode {
  return typeof value === 'string' ? (imageUploadModeAliases[value] ?? 'workspace') : 'workspace';
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

export function getTheme(globalState: Pick<vscode.Memento, 'get'>, resource?: vscode.Uri): CherryTheme {
  const storedTheme = globalState.get<unknown>(THEME_STATE_KEY);
  if (storedTheme !== undefined) return normalizeTheme(storedTheme);

  // Read the removed setting once for existing users, then all new writes use globalState.
  return normalizeTheme(vscode.workspace.getConfiguration('cherryMarkdown', resource).get('Theme'));
}

export async function migrateTheme(globalState: Pick<vscode.Memento, 'get' | 'update'>): Promise<void> {
  if (globalState.get<unknown>(THEME_STATE_KEY) !== undefined) return;
  const legacyTheme = vscode.workspace.getConfiguration('cherryMarkdown').get('Theme');
  if (legacyTheme !== undefined) await globalState.update(THEME_STATE_KEY, normalizeTheme(legacyTheme));
}

function readLegacyImageUploadMode(resource?: vscode.Uri): ImageUploadMode | undefined {
  const configuration = vscode.workspace.getConfiguration('cherryMarkdown', resource);
  const legacy = configuration.get<unknown>('UploadType');
  if (legacy === undefined) return undefined;
  if (typeof legacy === 'string' && legacyPicGoAliases.has(legacy)) {
    const picGoUrl = configuration.get<unknown>('PicGoServer');
    const custom = configuration.get<CustomUploader>('CustomUploader');
    if (typeof picGoUrl === 'string' && picGoUrl.trim() && !custom?.url) return 'remote';
    return custom?.enable ? 'remote' : 'workspace';
  }
  return normalizeImageUploadMode(legacy);
}

function hasExplicitImageUploadMode(configuration: vscode.WorkspaceConfiguration): boolean {
  if (!configuration.inspect) return configuration.get<unknown>('ImageUploadMode') !== undefined;
  const inspected = configuration.inspect<unknown>('ImageUploadMode');
  if (!inspected) return configuration.get<unknown>('ImageUploadMode') !== undefined;
  return [
    inspected.globalValue,
    inspected.workspaceValue,
    inspected.workspaceFolderValue,
    inspected.globalLanguageValue,
    inspected.workspaceLanguageValue,
    inspected.workspaceFolderLanguageValue,
  ].some((value) => value !== undefined);
}

export function getImageUploadMode(resource?: vscode.Uri): ImageUploadMode {
  const configuration = vscode.workspace.getConfiguration('cherryMarkdown', resource);
  const explicitlyConfigured = hasExplicitImageUploadMode(configuration);
  const configured = explicitlyConfigured ? configuration.get<unknown>('ImageUploadMode') : undefined;
  return configured === undefined
    ? (readLegacyImageUploadMode(resource) ?? 'workspace')
    : normalizeImageUploadMode(configured);
}

export async function migrateImageUploadMode(globalState: Pick<vscode.Memento, 'get' | 'update'>): Promise<void> {
  if (globalState.get<boolean>(IMAGE_UPLOAD_MODE_MIGRATED_KEY)) return;
  const configuration = vscode.workspace.getConfiguration('cherryMarkdown');
  const configured = hasExplicitImageUploadMode(configuration);
  if (!configured) {
    const legacyMode = readLegacyImageUploadMode();
    if (legacyMode !== undefined) {
      await configuration.update('ImageUploadMode', legacyMode, vscode.ConfigurationTarget.Global);
      const legacy = configuration.get<unknown>('UploadType');
      const picGoUrl = configuration.get<unknown>('PicGoServer');
      const custom = configuration.get<CustomUploader>('CustomUploader');
      if (
        typeof legacy === 'string' &&
        legacyPicGoAliases.has(legacy) &&
        typeof picGoUrl === 'string' &&
        picGoUrl.trim() &&
        !custom?.url
      ) {
        await configuration.update(
          'CustomUploader',
          { enable: true, url: picGoUrl.trim(), headers: custom?.headers ?? {} },
          vscode.ConfigurationTarget.Global,
        );
      }
    }
  }
  await globalState.update(IMAGE_UPLOAD_MODE_MIGRATED_KEY, true);
}

export function getCustomUploader(resource?: vscode.Uri): CustomUploader | undefined {
  return vscode.workspace.getConfiguration('cherryMarkdown', resource).get<CustomUploader>('CustomUploader');
}

export function getAssetDirectory(resource?: vscode.Uri): string {
  const configured = vscode.workspace
    .getConfiguration('cherryMarkdown', resource)
    .get<unknown>('AssetDirectory', DEFAULT_ASSET_DIRECTORY);
  if (typeof configured !== 'string') return DEFAULT_ASSET_DIRECTORY;
  const segments = configured
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== '.' && segment !== '..');
  return segments.join('/') || DEFAULT_ASSET_DIRECTORY;
}

export function getBackfillImageProps(resource?: vscode.Uri): BackfillImageProp[] {
  return normalizeBackfillImageProps(
    vscode.workspace.getConfiguration('cherryMarkdown', resource).get('BackfillImageProps'),
  );
}
