import * as vscode from 'vscode';

export const IMPORTANT_UPDATE_STATE_KEY = 'cherryMarkdown.seenImportantUpdates';
// This is a content identifier, NOT the extension version. Change it only for a new important behavior change.
// Patch releases and edits to this notice must not cause another automatic notification.
export const IMPORTANT_UPDATE_NOTICE_ID = 'upload-configuration-v1';

type NoticeContext = Pick<vscode.ExtensionContext, 'globalState' | 'extensionUri'>;

export async function showUpdateNotes(context: Pick<vscode.ExtensionContext, 'extensionUri'>): Promise<void> {
  const language = vscode.env.language.toLowerCase();
  const locale = language.startsWith('zh') ? 'zh-cn' : language.startsWith('ru') ? 'ru' : 'en';
  const notes = vscode.Uri.joinPath(context.extensionUri, 'docs', 'updates', `upload-settings.${locale}.md`);
  await vscode.commands.executeCommand('markdown.showPreview', notes);
}

export async function showImportantUpdateNotice(context: NoticeContext): Promise<void> {
  const recorded = context.globalState.get<unknown>(IMPORTANT_UPDATE_STATE_KEY);
  const seen = Array.isArray(recorded) ? recorded.filter((id): id is string => typeof id === 'string') : [];
  if (seen.includes(IMPORTANT_UPDATE_NOTICE_ID)) return;
  // Record only notice delivery, never migrate settings. Dismissing counts as seen too.
  // The first release with this feature cannot distinguish new installs from upgrades: both see this once.
  await context.globalState.update(IMPORTANT_UPDATE_STATE_KEY, [...seen, IMPORTANT_UPDATE_NOTICE_ID]);
  const notes = vscode.l10n.t('View update notes');
  const settings = vscode.l10n.t('Open upload settings');
  const choice = await vscode.window.showInformationMessage(
    vscode.l10n.t(
      'Cherry Markdown has important upload configuration changes. Existing binary upload settings stay unchanged. PicGo users should review the setup guide.',
    ),
    notes,
    settings,
  );
  if (choice === notes) await showUpdateNotes(context);
  else if (choice === settings) {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      '@ext:cherryMarkdownPublisher.cherry-markdown-vscode-plugin',
    );
  }
}
