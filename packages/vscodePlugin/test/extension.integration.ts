import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Cherry Markdown extension', () => {
  suiteTeardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('activates and registers the preview command without a workspace', async () => {
    const extension = vscode.extensions.all.find((candidate) => {
      return (
        candidate.packageJSON.publisher === 'cherryMarkdownPublisher' &&
        candidate.packageJSON.contributes?.commands?.some(
          (command: { command?: string }) => command.command === 'cherrymarkdown.preview',
        )
      );
    });
    assert.ok(extension, 'The extension should be available in the Extension Development Host.');
    await extension.activate();

    const document = await vscode.workspace.openTextDocument({ language: 'markdown', content: '# Preview' });
    await vscode.window.showTextDocument(document);
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('cherrymarkdown.preview'));
    await vscode.commands.executeCommand('cherrymarkdown.preview');
  });

  test('exposes the self-contained upload settings and no legacy theme setting', () => {
    const configuration = vscode.workspace.getConfiguration('cherryMarkdown');
    assert.strictEqual(configuration.has('Theme'), false);
    assert.strictEqual(configuration.has('PicGoServer'), false);
    assert.strictEqual(configuration.get('ImageUploadMode'), 'workspace');
    assert.strictEqual(configuration.get('AssetDirectory'), '.cherry-assets');
  });

  test('keeps the preview command callable when a non-Markdown editor is active', async () => {
    const document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'plain text' });
    await vscode.window.showTextDocument(document);
    await assert.doesNotReject(Promise.resolve(vscode.commands.executeCommand('cherrymarkdown.preview')));
  });
});
