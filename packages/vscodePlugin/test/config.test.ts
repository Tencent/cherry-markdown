import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import * as vscode from 'vscode';
import * as config from '../src/config';

const mock = vi.hoisted(() => ({ getConfiguration: vi.fn(), isTrusted: true }));
vi.mock('vscode', () => ({
  ColorThemeKind: { Light: 1, Dark: 2, HighContrast: 3, HighContrastLight: 4 },
  window: { activeColorTheme: { kind: 1 } },
  l10n: { t: (text: string, ...args: unknown[]) => text.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)])) },
  Uri: { file: (path: string) => ({ path }) },
  workspace: {
    get isTrusted() {
      return mock.isTrusted;
    },
    getConfiguration: mock.getConfiguration,
  },
}));

type Layer = Record<string, unknown>;
let user: Layer;
let workspace: Layer;
let folders: Record<string, Layer>;
const defaults: Layer = {
  ImageUploadMode: 'workspace',
  AssetDirectory: '.cherry-assets',
  ThemeMode: 'vscode',
  LightTheme: 'default',
  DarkTheme: 'dark',
};
const update = vi.fn();
const a = vscode.Uri.file('/project-a/readme.md');
const b = vscode.Uri.file('/project-b/readme.md');
const uploader = (url: string, headers = {}) => ({ enable: true, url, headers });

beforeEach(() => {
  user = {};
  workspace = {};
  folders = {};
  mock.isTrusted = true;
  update.mockReset();
  mock.getConfiguration.mockImplementation((_section, resource) => ({
    get: (key: string, fallback?: unknown) => {
      const folder = folders[resource?.path] ?? {};
      return mock.isTrusted
        ? (folder[key] ?? workspace[key] ?? user[key] ?? defaults[key] ?? fallback)
        : (user[key] ?? defaults[key] ?? fallback);
    },
    inspect: (key: string) => ({
      defaultValue: defaults[key],
      globalValue: user[key],
      workspaceValue: workspace[key],
      workspaceFolderValue: folders[resource?.path]?.[key],
    }),
    update,
  }));
});

describe('document-scoped upload configuration', () => {
  test('folder → workspace → user → default, using the originating document URI', () => {
    expect(config.getImageUploadMode(a)).toBe('workspace');
    user.ImageUploadMode = 'data';
    expect(config.getImageUploadMode(a)).toBe('data');
    workspace.ImageUploadMode = 'remote';
    expect(config.getImageUploadMode(a)).toBe('remote');
    folders[a.path] = { ImageUploadMode: 'workspace', AssetDirectory: 'a-assets' };
    folders[b.path] = { ImageUploadMode: 'data' };
    expect(config.getImageUploadMode(a)).toBe('workspace');
    expect(config.getAssetDirectory(a)).toBe('a-assets');
    expect(config.getImageUploadMode(b)).toBe('data');
    expect(mock.getConfiguration).toHaveBeenCalledWith('cherryMarkdown', b);
    expect(update).not.toHaveBeenCalled();
  });

  test('selects the uploader object as one unit and never sends global credentials to a folder endpoint', () => {
    user.ImageUploadMode = 'remote';
    user.CustomUploader = uploader('https://user.example/upload', { Authorization: 'user-secret' });
    workspace.CustomUploader = uploader('https://workspace.example/upload');
    folders[a.path] = { CustomUploader: uploader('https://folder.example/upload') };
    expect(config.getUploadConfiguration(a)).toMatchObject({
      mode: 'remote',
      source: 'folder',
      uploader: { url: 'https://folder.example/upload', headers: {} },
    });
    expect(config.getUploadConfiguration(b).uploader?.url).toBe('https://workspace.example/upload');
  });

  test.each([
    { format: 'guess' },
    { format: null },
    { fieldName: '' },
    { fieldName: 'files\n' },
    { fieldName: 'files\r\nX-Evil: true' },
    { fieldName: 'bad"name' },
    { fieldName: null },
  ])('rejects invalid request encoding settings %j before uploading', (value) => {
    user.ImageUploadMode = 'remote';
    user.CustomUploader = { ...uploader('https://example.test/upload'), ...value };
    expect(() => config.getUploadConfiguration(a)).toThrow('format');
  });

  test('preserves multipart encoding with its selected uploader instead of inheriting another scope format', () => {
    user.ImageUploadMode = 'remote';
    user.CustomUploader = { ...uploader('https://user.example/upload'), format: 'multipart', fieldName: 'other' };
    workspace.CustomUploader = uploader('https://workspace.example/upload');
    expect(config.getUploadConfiguration(a).uploader).not.toHaveProperty('format');
    folders[a.path] = {
      CustomUploader: { ...uploader('http://127.0.0.1:36677/upload'), format: 'multipart', fieldName: 'files' },
    };
    expect(config.getUploadConfiguration(a).uploader).toMatchObject({ format: 'multipart', fieldName: 'files' });
  });

  test.each(['wrong', '', null, false, {}, 'PicGoServer', '远程'])(
    'rejects invalid explicit mode %j without fallback',
    (value) => {
      user.ImageUploadMode = 'data';
      workspace.ImageUploadMode = value;
      expect(() => config.getImageUploadMode(a)).toThrow(config.UploadConfigurationError);
    },
  );

  test('detects retired keys only to block an upload, without converting or writing settings', () => {
    workspace.UploadType = 'PicGoServer';
    workspace.PicGoServer = 'https://legacy.example/upload';
    expect(() => config.getUploadConfiguration(a)).toThrow('Legacy upload');
    expect(update).not.toHaveBeenCalled();
    expect(config).not.toHaveProperty('migrateImageUploadMode');
    expect(config).not.toHaveProperty('migrateTheme');
  });

  test.each(['workspace', 'Base64', 'PicGoServer'])(
    'retired mode %s explains all replacement modes without migrating',
    (mode) => {
      workspace.UploadType = mode;
      expect(() => config.getUploadConfiguration(a)).toThrow('workspace (local files), data (Base64), or remote');
      expect(update).not.toHaveBeenCalled();
    },
  );

  test.each(['workspace', 'data', 'remote'])('ignores leftover retired keys with valid new mode %s', (mode) => {
    user.ImageUploadMode = mode;
    user.CustomUploader = uploader('https://current.example/upload');
    workspace.UploadType = 'PicGoServer';
    workspace.PicGoServer = 'https://legacy.example/upload';
    expect(config.getUploadConfiguration(a).mode).toBe(mode);
    expect(update).not.toHaveBeenCalled();
  });

  test('Restricted Mode ignores workspace endpoints and permits user-level settings', () => {
    mock.isTrusted = false;
    user.ImageUploadMode = 'remote';
    user.CustomUploader = uploader('https://user.example/upload');
    workspace.ImageUploadMode = 'remote';
    workspace.CustomUploader = uploader('https://untrusted.example/upload');
    folders[a.path] = { CustomUploader: uploader('https://folder.example/upload') };
    expect(config.getUploadConfiguration(a)).toMatchObject({
      mode: 'remote',
      source: 'user',
      uploader: { url: 'https://user.example/upload' },
    });
  });

  test('offers trust management instead of silently choosing workspace assets when project uploads are blocked', () => {
    mock.isTrusted = false;
    workspace.ImageUploadMode = 'remote';
    workspace.CustomUploader = uploader('https://untrusted.example/upload');
    expect(() => config.getUploadConfiguration(a)).toThrow('Restricted Mode');
    mock.isTrusted = true;
    expect(config.getUploadConfiguration(a).uploader?.url).toBe('https://untrusted.example/upload');
    expect(update).not.toHaveBeenCalled();
  });

  test('untrusted legacy endpoints never become user configuration', () => {
    mock.isTrusted = false;
    workspace.UploadType = 'PicGoServer';
    workspace.PicGoServer = 'https://legacy.example/upload';
    expect(() => config.getUploadConfiguration(a)).toThrow('Restricted Mode');
    expect(update).not.toHaveBeenCalled();
  });

  test.each([null, 'invalid'])('invalid explicit user uploader %j is not disguised as a trust error', (value) => {
    mock.isTrusted = false;
    user.ImageUploadMode = 'remote';
    user.CustomUploader = value;
    workspace.CustomUploader = uploader('https://untrusted.example/upload');
    expect(() => config.getUploadConfiguration(a)).toThrow('CustomUploader');
  });

  test.each([
    { url: 'https://folder.example/upload' },
    { enable: true, url: 'not-a-url' },
    { enable: true, url: 'ftp://example/upload' },
    { enable: true, url: 'https://example/upload', headers: { Authorization: 42 } },
    { enable: true, url: 'https://example/upload', headers: { Authorization: 'x\r\ny' } },
    { enable: true, url: 'https://example/upload', headers: null },
  ])('rejects incomplete/invalid project uploader %j rather than falling back to user settings', (value) => {
    user.ImageUploadMode = 'remote';
    user.CustomUploader = uploader('https://user.example/upload');
    workspace.CustomUploader = value;
    expect(() => config.getUploadConfiguration(a)).toThrow(config.UploadConfigurationError);
  });

  test.each(['../outside', '/absolute', 'C:\\outside', '', null, {}])('rejects invalid asset directory %j', (value) => {
    workspace.AssetDirectory = value;
    expect(() => config.getUploadConfiguration(a)).toThrow('AssetDirectory');
  });

  test('shows upload origin and configuration source without exposing user info, query tokens or headers', () => {
    user.ImageUploadMode = 'remote';
    user.CustomUploader = uploader('https://name:password@example.com/upload?token=secret', {
      Authorization: 'secret',
    });
    const hint = config.describeUploadConfiguration(a);
    expect(hint).toBe('Upload: https://example.com (User)');
    expect(hint).not.toMatch(/password|secret|Authorization/);
  });

  test('all per-document upload settings declare resource scope', async () => {
    const manifest = await import('../package.json');
    const properties = manifest.default.contributes.configuration.properties;
    const uploaderProperties = properties['cherryMarkdown.CustomUploader'].properties;
    expect(uploaderProperties.format).toMatchObject({ default: 'binary', enum: ['binary', 'multipart'] });
    expect(uploaderProperties.fieldName.default).toBe('files');
    const fieldNamePattern = new RegExp(uploaderProperties.fieldName.pattern);
    expect(fieldNamePattern.test('files[]')).toBe(true);
    expect(fieldNamePattern.test('files\r\n')).toBe(false);
    expect(fieldNamePattern.test('files\n')).toBe(false);
    for (const key of ['Usage', 'ImageUploadMode', 'AssetDirectory', 'CustomUploader', 'BackfillImageProps']) {
      expect((properties as Record<string, { scope?: string }>)[`cherryMarkdown.${key}`].scope).toBe('resource');
    }
  });
});

describe('theme and image styles', () => {
  test('follows VS Code by default and preserves stored manual selections without migrating legacy Theme', () => {
    vi.mocked(vscode.window).activeColorTheme = { kind: 2 };
    expect(config.getTheme({ get: () => 'green' } as never, a)).toBe('dark');
    workspace.ThemeMode = 'manual';
    workspace.Theme = 'red';
    expect(config.getTheme({ get: () => 'green' } as never, a)).toBe('green');
    expect(config.getTheme({ get: () => undefined } as never, a)).toBe('default');
    expect(update).not.toHaveBeenCalled();
  });
  test.each([
    ['isBorder', 'isNotBorder', 'isShadow', 'isRadius'],
    ['isNotBorder', 'isBorder', 'isShadow', 'isRadius'],
    ['无边框', '边框', '阴影', '圆角'],
  ])('keeps no-border priority: %j', (...values) => {
    expect(config.normalizeBackfillImageProps(values)).toEqual(['isNotBorder', 'isShadow', 'isRadius']);
  });
});
