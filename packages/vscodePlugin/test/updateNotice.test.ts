import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import * as vscode from 'vscode';
import {
  IMPORTANT_UPDATE_NOTICE_ID,
  IMPORTANT_UPDATE_STATE_KEY,
  showImportantUpdateNotice,
  showUpdateNotes,
} from '../src/updateNotice';

const host = vi.hoisted(() => ({ language: 'en', execute: vi.fn(), info: vi.fn(), configuration: vi.fn() }));
vi.mock('vscode', () => ({
  env: {
    get language() {
      return host.language;
    },
  },
  l10n: { t: (text: string) => text },
  Uri: { joinPath: (base: { path: string }, ...parts: string[]) => ({ path: [base.path, ...parts].join('/') }) },
  commands: { executeCommand: host.execute },
  window: { showInformationMessage: host.info },
  workspace: { getConfiguration: host.configuration },
}));

function context(initial?: unknown) {
  const state = new Map<string, unknown>();
  if (initial !== undefined) state.set(IMPORTANT_UPDATE_STATE_KEY, initial);
  const update = vi.fn(async (key: string, value: unknown) => {
    state.set(key, value);
  });
  const value = {
    extensionUri: { path: '/extension' },
    extension: { packageJSON: { version: '0.4.0' } },
    globalState: { get: (key: string) => state.get(key), update },
  } as unknown as vscode.ExtensionContext;
  return { value, state, update };
}

beforeEach(() => {
  vi.clearAllMocks();
  host.language = 'en';
  host.info.mockResolvedValue(undefined);
});

describe('important update notification', () => {
  test('records only its content identifier before delivery and never reads or migrates configuration', async () => {
    const c = context();
    host.info.mockImplementation(async () => {
      expect(c.state.get(IMPORTANT_UPDATE_STATE_KEY)).toEqual([IMPORTANT_UPDATE_NOTICE_ID]);
      return undefined;
    });
    await showImportantUpdateNotice(c.value);
    expect(c.update).toHaveBeenCalledExactlyOnceWith(IMPORTANT_UPDATE_STATE_KEY, [IMPORTANT_UPDATE_NOTICE_ID]);
    expect(host.info).toHaveBeenCalledWith(
      expect.stringContaining('important upload configuration changes'),
      'View update notes',
      'Open upload settings',
    );
    expect(host.configuration).not.toHaveBeenCalled();
    expect(host.execute).not.toHaveBeenCalled();
  });

  test('dismissal, reload and a normal patch release do not repeat the same important change', async () => {
    const c = context();
    await showImportantUpdateNotice(c.value);
    await showImportantUpdateNotice(c.value);
    c.value.extension.packageJSON.version = '0.4.1';
    await showImportantUpdateNotice(c.value);
    expect(host.info).toHaveBeenCalledTimes(1);
    expect(c.update).toHaveBeenCalledTimes(1);
  });

  test('a pending user choice does not cause a second activation to repeat the notice', async () => {
    const c = context();
    let finish!: (choice: undefined) => void;
    host.info.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = showImportantUpdateNotice(c.value);
    await vi.waitFor(() => expect(host.info).toHaveBeenCalledTimes(1));
    await showImportantUpdateNotice(c.value);
    expect(host.info).toHaveBeenCalledTimes(1);
    finish(undefined);
    await first;
  });

  test('a new important change preserves earlier notice history', async () => {
    const c = context(['earlier-important-change']);
    await showImportantUpdateNotice(c.value);
    expect(c.state.get(IMPORTANT_UPDATE_STATE_KEY)).toEqual(['earlier-important-change', IMPORTANT_UPDATE_NOTICE_ID]);
    expect(host.info).toHaveBeenCalledTimes(1);
  });

  test('an already-seen change stays silent even if a newer notice was seen afterwards', async () => {
    const c = context([IMPORTANT_UPDATE_NOTICE_ID, 'future-important-change']);
    await showImportantUpdateNotice(c.value);
    expect(host.info).not.toHaveBeenCalled();
    expect(c.update).not.toHaveBeenCalled();
  });

  test('the notes action opens a bundled local Markdown preview, without opening a browser', async () => {
    const c = context();
    host.language = 'zh-cn';
    host.info.mockResolvedValue('View update notes');
    await showImportantUpdateNotice(c.value);
    expect(host.execute).toHaveBeenCalledExactlyOnceWith('markdown.showPreview', {
      path: '/extension/docs/updates/upload-settings.zh-cn.md',
    });
  });

  test('the settings action opens only extension settings', async () => {
    const c = context();
    host.info.mockResolvedValue('Open upload settings');
    await showImportantUpdateNotice(c.value);
    expect(host.execute).toHaveBeenCalledExactlyOnceWith(
      'workbench.action.openSettings',
      '@ext:cherryMarkdownPublisher.cherry-markdown-vscode-plugin',
    );
    expect(host.configuration).not.toHaveBeenCalled();
  });

  test.each([
    ['en', 'en'],
    ['zh-cn', 'zh-cn'],
    ['zh-tw', 'zh-cn'],
    ['ru', 'ru'],
    ['de', 'en'],
  ])('manual notes use %s → %s without changing notice state', async (language, locale) => {
    const c = context([IMPORTANT_UPDATE_NOTICE_ID]);
    host.language = language;
    await showUpdateNotes(c.value);
    expect(host.execute).toHaveBeenCalledWith('markdown.showPreview', {
      path: `/extension/docs/updates/upload-settings.${locale}.md`,
    });
    expect(c.update).not.toHaveBeenCalled();
    expect(host.info).not.toHaveBeenCalled();
  });

  test('failed state persistence does not falsely deliver the notice; activation can retry', async () => {
    const c = context();
    c.update.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(showImportantUpdateNotice(c.value)).rejects.toThrow('storage unavailable');
    expect(host.info).not.toHaveBeenCalled();
    await showImportantUpdateNotice(c.value);
    expect(host.info).toHaveBeenCalledTimes(1);
  });
});
