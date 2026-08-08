import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const packageRoot = process.cwd();
const packageManifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
  contributes: {
    commands: Array<{ command: string; title: string }>;
    keybindings: Array<{ command: string; key: string }>;
    configuration: { properties: Record<string, unknown> };
  };
};
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as { main: string };
const requiredFiles = [
  manifest.main,
  'web-resources/dist/index.js',
  'web-resources/dist/index.css',
  'web-resources/scripts/index.css',
  'favicon.ico',
].map((file) => file.replace(/^\.\//, ''));

describe('VS Code extension build artifacts', () => {
  test.each(requiredFiles)('contains %s', (relativePath) => {
    expect(fs.statSync(path.join(packageRoot, relativePath), { throwIfNoEntry: false })?.isFile()).toBe(true);
  });

  test('does not recreate the obsolete global variables file', () => {
    expect(fs.existsSync(path.join(packageRoot, 'web-resources/scripts/global-vars.js'))).toBe(false);
  });

  test('bundles the Cherry Markdown workspace dependency into the webview', () => {
    const webviewBundle = fs.readFileSync(path.join(packageRoot, 'web-resources/dist/index.js'), 'utf8');
    const runtimeImport = /(?:from\s*|import\s*\(\s*|require\(\s*)['"]cherry-markdown(?:\/[^'"]*)?['"]/;

    expect(webviewBundle).not.toMatch(runtimeImport);
    expect(webviewBundle).toContain('Cherry Markdown');
  });

  test('keeps theme ownership inside Cherry Markdown', () => {
    expect(packageManifest.contributes.configuration.properties['cherryMarkdown.Theme']).toBeUndefined();
    expect(packageManifest.contributes.configuration.properties['cherryMarkdown.PicGoServer']).toBeUndefined();
  });

  test('declares self-contained image upload defaults', () => {
    const { properties } = packageManifest.contributes.configuration;
    expect(properties['cherryMarkdown.ImageUploadMode']).toMatchObject({
      type: 'string',
      default: 'workspace',
      enum: ['workspace', 'data', 'remote'],
    });
    expect(properties['cherryMarkdown.AssetDirectory']).toMatchObject({
      type: 'string',
      default: '.cherry-assets',
    });
  });

  test('provides a localized command manifest and an explicit shortcut', () => {
    expect(packageManifest.contributes.commands).toContainEqual({
      command: 'cherrymarkdown.preview',
      title: '%commands.preview.title%',
    });
    expect(packageManifest.contributes.keybindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ command: 'cherrymarkdown.preview', key: 'F10' })]),
    );
    const zhCnMessages = JSON.parse(
      fs.readFileSync(path.join(packageRoot, 'package.nls.zh-cn.json'), 'utf8'),
    ) as Record<string, string>;
    expect(zhCnMessages['commands.preview.title']).toBe('在 Cherry Markdown 中预览');

    for (const locale of ['package.nls.json', 'package.nls.ru.json', 'package.nls.zh-cn.json']) {
      const messages = JSON.parse(fs.readFileSync(path.join(packageRoot, locale), 'utf8')) as Record<string, string>;
      expect(messages['commands.preview.title']).toBeTruthy();
      expect(messages['imageUploadMode.description']).toBeTruthy();
      expect(messages['assetDirectory.description']).toBeTruthy();
    }
  });
});
