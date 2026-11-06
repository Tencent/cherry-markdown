import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import * as vscode from 'vscode';
import * as config from '../src/config';

const mockGetConfiguration = vi.hoisted(() => vi.fn());

vi.mock('vscode', () => ({
  ConfigurationTarget: { Global: 1 },
  ColorThemeKind: { Light: 1, Dark: 2, HighContrast: 3, HighContrastLight: 4 },
  window: { activeColorTheme: { kind: 1 } },
  Uri: { file: (path: string) => ({ path }) },
  workspace: { getConfiguration: mockGetConfiguration },
}));

const getConfiguration = mockGetConfiguration;

beforeEach(() => {
  getConfiguration.mockReset();
  getConfiguration.mockReturnValue({ get: vi.fn() });
});

describe('configuration normalization', () => {
  test.each([
    ['active', 'active'],
    ['Active', 'active'],
    ['激活', 'active'],
    ['Активный', 'active'],
    ['only-manual', 'only-manual'],
    ['仅手动', 'only-manual'],
  ])('normalizes usage %s', (value, expected) => {
    expect(config.normalizeUsage(value)).toBe(expected);
  });

  test.each([
    ['default', 'default'],
    ['默认', 'default'],
    ['Тёмная', 'dark'],
    ['Green', 'green'],
    ['红色', 'red'],
  ])('normalizes theme %s', (value, expected) => {
    expect(config.normalizeTheme(value)).toBe(expected);
  });

  test.each([
    ['workspace', 'workspace'],
    ['工作区', 'workspace'],
    ['data', 'data'],
    ['Base64', 'data'],
    ['remote', 'remote'],
    ['自定义上传器', 'remote'],
  ])('normalizes image upload mode %s', (value, expected) => {
    expect(config.normalizeImageUploadMode(value)).toBe(expected);
  });

  test('filters and deduplicates image properties', () => {
    expect(config.normalizeBackfillImageProps(['Border', '边框', 'isRadius', 'invalid'])).toEqual([
      'isBorder',
      'isRadius',
    ]);
  });

  test('falls back for invalid values', () => {
    expect(config.normalizeUsage(null)).toBe('active');
    expect(config.normalizeTheme('unknown')).toBe('default');
    expect(config.normalizeImageUploadMode({})).toBe('workspace');
    expect(config.normalizeBackfillImageProps('isBorder')).toEqual([]);
  });

  test('contributes theme settings in order and follows VS Code by default', async () => {
    const manifest = await import('../package.json');
    const settings = manifest.default.contributes.configuration.properties;
    expect(settings['cherryMarkdown.ThemeMode'].default).toBe('vscode');
    expect([
      settings['cherryMarkdown.ThemeMode'].order,
      settings['cherryMarkdown.LightTheme'].order,
      settings['cherryMarkdown.DarkTheme'].order,
    ]).toEqual([1, 2, 3]);
  });

  test('uses the contributed follow mode when no theme setting is configured', async () => {
    const manifest = await import('../package.json');
    const properties = manifest.default.contributes.configuration.properties;
    getConfiguration.mockReturnValue({
      get: (key: string) => properties[`cherryMarkdown.${key}` as keyof typeof properties]?.default,
    });
    vi.mocked(vscode.window).activeColorTheme = { kind: vscode.ColorThemeKind.Dark };
    expect(config.getTheme({ get: vi.fn().mockReturnValue('green') })).toBe('dark');
  });

  test('prefers the globally persisted Cherry theme', () => {
    const globalState = { get: vi.fn().mockReturnValue('dark') };
    expect(config.getTheme(globalState)).toBe('dark');
  });

  test('falls back to the legacy theme setting when global state is empty', () => {
    const get = vi.fn().mockReturnValue('绿色');
    getConfiguration.mockReturnValue({ get });

    expect(config.getTheme({ get: vi.fn().mockReturnValue(undefined) })).toBe('green');
    expect(get).toHaveBeenCalledWith('Theme');
  });

  test.each([[1, 'green'], [2, 'abyss'], [3, 'abyss'], [4, 'green']])(
    'follows VS Code color theme kind %s', (kind, expected) => {
      const settings: Record<string, string> = { ThemeMode: 'vscode', LightTheme: 'green', DarkTheme: 'abyss' };
      getConfiguration.mockReturnValue({ get: (key: string) => settings[key] });
      vi.mocked(vscode.window).activeColorTheme = { kind };
      expect(config.getTheme({ get: vi.fn().mockReturnValue('red') })).toBe(expected);
    },
  );

  test('migrates the legacy theme into global state only once', async () => {
    const get = vi.fn().mockReturnValue('深色');
    getConfiguration.mockReturnValue({ get });
    const globalState = { get: vi.fn().mockReturnValue(undefined), update: vi.fn() };

    await config.migrateTheme(globalState);

    expect(globalState.update).toHaveBeenCalledWith(config.THEME_STATE_KEY, 'dark');

    globalState.get.mockReturnValue('red');
    await config.migrateTheme(globalState);
    expect(globalState.update).toHaveBeenCalledTimes(1);
  });

  test('does not write a migration value when the legacy setting is absent', async () => {
    getConfiguration.mockReturnValue({ get: vi.fn().mockReturnValue(undefined) });
    const globalState = { get: vi.fn().mockReturnValue(undefined), update: vi.fn() };

    await config.migrateTheme(globalState);

    expect(globalState.update).not.toHaveBeenCalled();
  });

  test('migrates the legacy PicGo uploader explicitly', async () => {
    const update = vi.fn();
    const get = vi.fn((key: string) => {
      if (key === 'UploadType') return 'PicGoServer';
      if (key === 'PicGoServer') return 'https://picgo.example/upload';
      return undefined;
    });
    getConfiguration.mockReturnValue({ get, update });
    const globalState = { get: vi.fn().mockReturnValue(false), update: vi.fn() };

    await config.migrateImageUploadMode(globalState);

    expect(update).toHaveBeenCalledWith('ImageUploadMode', 'remote', 1);
    expect(update).toHaveBeenCalledWith(
      'CustomUploader',
      { enable: true, url: 'https://picgo.example/upload', headers: {} },
      1,
    );
    expect(globalState.update).toHaveBeenCalledWith(config.IMAGE_UPLOAD_MODE_MIGRATED_KEY, true);
  });

  test('reads configuration values with the document resource scope', () => {
    const resource = vscode.Uri.file('/workspace/readme.md');
    const get = vi.fn((key: string, fallback?: unknown) => {
      if (key === 'Usage') return 'only-manual';
      if (key === 'ImageUploadMode') return '远程';
      if (key === 'CustomUploader') return { enable: true, url: 'https://upload.example' };
      if (key === 'BackfillImageProps') return ['阴影'];
      return fallback;
    });
    getConfiguration.mockReturnValue({ get });

    expect(config.getUsageMode(resource)).toBe('only-manual');
    expect(config.getImageUploadMode(resource)).toBe('remote');
    expect(config.getCustomUploader(resource)).toEqual({ enable: true, url: 'https://upload.example' });
    expect(config.getBackfillImageProps(resource)).toEqual(['isShadow']);
    expect(getConfiguration).toHaveBeenCalledWith('cherryMarkdown', resource);
  });

  test('uses legacy upload mode when the new setting is only a contributed default', () => {
    const get = vi.fn((key: string) => {
      if (key === 'ImageUploadMode') return 'workspace';
      if (key === 'UploadType') return 'data';
      return undefined;
    });
    getConfiguration.mockReturnValue({
      get,
      inspect: vi.fn().mockReturnValue({
        defaultValue: 'workspace',
        globalValue: undefined,
        workspaceValue: undefined,
        workspaceFolderValue: undefined,
      }),
    });

    expect(config.getImageUploadMode()).toBe('data');
  });

  test.each([
    ['.cherry-assets', '.cherry-assets'],
    ['assets/images', 'assets/images'],
    ['../assets\\images/..', 'assets/images'],
    ['', '.cherry-assets'],
    [null, '.cherry-assets'],
    [{ path: 'assets' }, '.cherry-assets'],
  ])('normalizes asset directory %s', (value, expected) => {
    getConfiguration.mockReturnValue({ get: vi.fn().mockReturnValue(value) });
    expect(config.getAssetDirectory()).toBe(expected);
  });
});
