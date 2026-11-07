import * as vscode from 'vscode';
import type { BackfillImageProp, CustomUploader, ImageUploadMode } from './types/upload';

export type UsageMode = 'active' | 'only-manual';
export type CherryTheme = 'default' | 'dark' | 'gray' | 'abyss' | 'green' | 'red' | 'violet' | 'blue';
export const THEME_STATE_KEY = 'cherryMarkdown.theme';
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
  if (value === 'workspace' || value === 'data' || value === 'remote') return value;
  throw new UploadConfigurationError(
    'invalid',
    vscode.l10n.t('ImageUploadMode must be workspace, data, or remote. The file was not uploaded.'),
  );
}

export function normalizeBackfillImageProps(value: unknown): BackfillImageProp[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((item) => (typeof item === 'string' ? backfillPropAliases[item] : undefined))
    .filter((item): item is BackfillImageProp => item !== undefined);
  const properties = [...new Set(normalized)];
  // Preserve the preview's original no-border precedence before generating Markdown decorations.
  return properties.includes('isNotBorder') ? properties.filter((property) => property !== 'isBorder') : properties;
}

export function getUsageMode(resource?: vscode.Uri): UsageMode {
  return normalizeUsage(vscode.workspace.getConfiguration('cherryMarkdown', resource).get('Usage'));
}

export function getTheme(globalState: Pick<vscode.Memento, 'get'>, resource?: vscode.Uri): CherryTheme {
  const configuration = vscode.workspace.getConfiguration('cherryMarkdown', resource);
  if (configuration.get('ThemeMode') === 'vscode') {
    const kind = vscode.window.activeColorTheme.kind;
    const dark = kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
    return normalizeTheme(configuration.get(dark ? 'DarkTheme' : 'LightTheme', dark ? 'dark' : 'default'));
  }
  const storedTheme = globalState.get<unknown>(THEME_STATE_KEY);
  if (storedTheme !== undefined) return normalizeTheme(storedTheme);

  return 'default';
}

export class UploadConfigurationError extends Error {
  constructor(
    readonly reason: 'legacy' | 'invalid' | 'untrusted',
    message: string,
  ) {
    super(message);
    this.name = 'UploadConfigurationError';
  }
}

type SettingSource = 'folder' | 'workspace' | 'user' | 'default';
interface SettingValue {
  value: unknown;
  source: SettingSource;
}

function readSetting(configuration: vscode.WorkspaceConfiguration, key: string): SettingValue | undefined {
  const values = configuration.inspect<unknown>(key);
  if (!values) return undefined;
  // Select raw values as one unit: never merge a project's upload URL with user-level credentials.
  if (vscode.workspace.isTrusted) {
    if (values.workspaceFolderValue !== undefined) return { value: values.workspaceFolderValue, source: 'folder' };
    if (values.workspaceValue !== undefined) return { value: values.workspaceValue, source: 'workspace' };
  }
  if (values.globalValue !== undefined) return { value: values.globalValue, source: 'user' };
  return undefined;
}

function hasBlockedWorkspaceSetting(configuration: vscode.WorkspaceConfiguration): boolean {
  if (vscode.workspace.isTrusted) return false;
  return ['ImageUploadMode', 'CustomUploader', 'UploadType', 'PicGoServer'].some((key) => {
    const value = configuration.inspect(key);
    return value?.workspaceValue !== undefined || value?.workspaceFolderValue !== undefined;
  });
}

function hasRetiredUploadSettings(configuration: vscode.WorkspaceConfiguration): boolean {
  // Transitional upgrade notice only: these values NEVER select an uploader, endpoint, or protocol.
  // Remove this detector and its notice/tests in the next major release after the documented upgrade window.
  // Do not add migration writes, persistent "migration complete" flags, or a legacy PicGo transport here.
  return ['UploadType', 'PicGoServer'].some((key) => readSetting(configuration, key) !== undefined);
}

export function getImageUploadMode(resource?: vscode.Uri): ImageUploadMode {
  const configuration = vscode.workspace.getConfiguration('cherryMarkdown', resource);
  const selected = readSetting(configuration, 'ImageUploadMode');
  if (selected) return normalizeImageUploadMode(selected.value);
  if (hasRetiredUploadSettings(configuration)) {
    throw new UploadConfigurationError(
      'legacy',
      vscode.l10n.t(
        'Legacy upload settings are no longer read. For PicGo 2.4.0+, configure ImageUploadMode=remote and CustomUploader with format=multipart and fieldName=files. The file was not uploaded.',
      ),
    );
  }
  if (hasBlockedWorkspaceSetting(configuration)) {
    throw new UploadConfigurationError(
      'untrusted',
      vscode.l10n.t(
        'Workspace upload settings are blocked in Restricted Mode. Configure user settings or review Workspace Trust. The file was not uploaded.',
      ),
    );
  }
  return 'workspace';
}

export function getCustomUploader(resource?: vscode.Uri): CustomUploader | undefined {
  const configuration = vscode.workspace.getConfiguration('cherryMarkdown', resource);
  const selected = readSetting(configuration, 'CustomUploader');
  if (!selected) return undefined;
  const value = selected.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as CustomUploader;
}

export function getAssetDirectory(resource?: vscode.Uri): string {
  const configuration = vscode.workspace.getConfiguration('cherryMarkdown', resource);
  const selected = readSetting(configuration, 'AssetDirectory');
  const configured = selected ? selected.value : DEFAULT_ASSET_DIRECTORY;
  if (
    typeof configured !== 'string' ||
    !configured.trim() ||
    /^[\\/]|^[a-z]:/i.test(configured) ||
    configured
      .replace(/\\/g, '/')
      .split('/')
      .some((part) => part === '..')
  ) {
    throw new UploadConfigurationError(
      'invalid',
      vscode.l10n.t('AssetDirectory must be a relative directory inside the workspace. The file was not uploaded.'),
    );
  }
  return (
    configured
      .replace(/\\/g, '/')
      .split('/')
      .filter((part) => part && part !== '.')
      .join('/') || '.'
  );
}

export function getBackfillImageProps(resource?: vscode.Uri): BackfillImageProp[] {
  return normalizeBackfillImageProps(
    vscode.workspace.getConfiguration('cherryMarkdown', resource).get('BackfillImageProps'),
  );
}

export function getUploadConfiguration(resource?: vscode.Uri) {
  const configuration = vscode.workspace.getConfiguration('cherryMarkdown', resource);
  const mode = getImageUploadMode(resource);
  const source =
    readSetting(
      configuration,
      mode === 'remote' ? 'CustomUploader' : mode === 'workspace' ? 'AssetDirectory' : 'ImageUploadMode',
    )?.source ??
    readSetting(configuration, 'ImageUploadMode')?.source ??
    'default';
  const assetDirectory = mode === 'workspace' ? getAssetDirectory(resource) : DEFAULT_ASSET_DIRECTORY;
  const uploader = mode === 'remote' ? getCustomUploader(resource) : undefined;
  if (mode === 'remote') {
    if (!uploader && !readSetting(configuration, 'CustomUploader') && hasBlockedWorkspaceSetting(configuration)) {
      throw new UploadConfigurationError(
        'untrusted',
        vscode.l10n.t(
          'Workspace upload settings are blocked in Restricted Mode. Configure user settings or review Workspace Trust. The file was not uploaded.',
        ),
      );
    }
    if (
      uploader &&
      ((uploader.format !== undefined && uploader.format !== 'binary' && uploader.format !== 'multipart') ||
        (uploader.fieldName !== undefined &&
          (typeof uploader.fieldName !== 'string' || !/^[a-zA-Z0-9_.[\]-]{1,128}(?![\s\S])/.test(uploader.fieldName))))
    ) {
      throw new UploadConfigurationError(
        'invalid',
        vscode.l10n.t(
          'CustomUploader format must be binary or multipart; fieldName must be a nonempty form field name. The file was not uploaded.',
        ),
      );
    }
    let valid = Boolean(uploader && uploader.enable === true && typeof uploader.url === 'string');
    try {
      const url = new URL(uploader?.url ?? '');
      valid = valid && (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
    } catch {
      valid = false;
    }
    const headers = uploader?.headers;
    valid =
      valid &&
      (headers === undefined ||
        (headers !== null &&
          typeof headers === 'object' &&
          !Array.isArray(headers) &&
          Object.entries(headers).every(([key, value]) => typeof value === 'string' && !/[\r\n]/.test(key + value))));
    if (!valid)
      throw new UploadConfigurationError(
        'invalid',
        vscode.l10n.t(
          'CustomUploader must enable a valid HTTP or HTTPS URL and string headers. The file was not uploaded.',
        ),
      );
  }
  return { mode, source, assetDirectory, uploader, backfillImageProps: getBackfillImageProps(resource) };
}

export function describeUploadConfiguration(resource?: vscode.Uri): string {
  try {
    const settings = getUploadConfiguration(resource);
    const sources = {
      folder: vscode.l10n.t('Folder'),
      workspace: vscode.l10n.t('Workspace'),
      user: vscode.l10n.t('User'),
      default: vscode.l10n.t('Default'),
    };
    const target =
      settings.mode === 'remote'
        ? new URL(settings.uploader!.url).origin
        : settings.mode === 'workspace'
          ? settings.assetDirectory
          : vscode.l10n.t('Base64 data');
    return vscode.l10n.t('Upload: {0} ({1})', target, sources[settings.source]);
  } catch (error) {
    return error instanceof UploadConfigurationError ? error.message : vscode.l10n.t('Upload settings are invalid.');
  }
}
