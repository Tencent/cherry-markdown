import * as vscode from 'vscode';
import type { UploadConfigurationError } from './config';

export async function showUploadConfigurationError(error: UploadConfigurationError): Promise<void> {
  const settings = vscode.l10n.t('Open upload settings');
  const docs = vscode.l10n.t('View configuration guide');
  const trust = vscode.l10n.t('Manage Workspace Trust');
  const choice = await vscode.window.showWarningMessage(
    error.message,
    ...(error.reason === 'untrusted' ? [settings, docs, trust] : [settings, docs]),
  );
  if (choice === settings) {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      '@ext:cherryMarkdownPublisher.cherry-markdown-vscode-plugin',
    );
  } else if (choice === docs) {
    await vscode.env.openExternal(
      vscode.Uri.parse(
        'https://github.com/Tencent/cherry-markdown/blob/dev/packages/vscodePlugin/README.md#upload-settings-upgrade',
      ),
    );
  } else if (choice === trust) {
    // Native VS Code authorization trusts the workspace, not just one upload endpoint.
    // Never persist a project endpoint in user settings as a substitute for that authorization.
    await vscode.commands.executeCommand('workbench.trust.manage');
  }
}
