import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import * as vscode from 'vscode';
import { UploadConfigurationError } from '../src/config';
import { showUploadConfigurationError } from '../src/uploadConfigurationUi';
vi.mock('vscode', () => ({
  l10n: { t: (text: string) => text },
  window: { showWarningMessage: vi.fn() },
  commands: { executeCommand: vi.fn() },
  env: { openExternal: vi.fn() },
  Uri: { parse: (url: string) => url },
}));
beforeEach(() => vi.clearAllMocks());
describe('upload configuration warning actions', () => {
  test('opens settings without migrating anything', async () => {
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Open upload settings' as never);
    await showUploadConfigurationError(new UploadConfigurationError('legacy', 'Legacy settings stopped. No upload.'));
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'Legacy settings stopped. No upload.',
      'Open upload settings',
      'View configuration guide',
    );
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
      'workbench.action.openSettings',
      '@ext:cherryMarkdownPublisher.cherry-markdown-vscode-plugin',
    );
  });
  test('opens the guide', async () => {
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('View configuration guide' as never);
    await showUploadConfigurationError(new UploadConfigurationError('legacy', 'Legacy'));
    expect(vscode.env.openExternal).toHaveBeenCalledWith(expect.stringContaining('#upload-settings-upgrade'));
  });
  test('opens native trust management instead of automatically granting trust', async () => {
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Manage Workspace Trust' as never);
    await showUploadConfigurationError(new UploadConfigurationError('untrusted', 'Restricted'));
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.trust.manage');
  });
  test('dismissal has no side effects', async () => {
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined);
    await showUploadConfigurationError(new UploadConfigurationError('invalid', 'Invalid'));
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
    expect(vscode.env.openExternal).not.toHaveBeenCalled();
  });
});
