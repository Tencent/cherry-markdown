import * as path from 'path';
import * as vscode from 'vscode';
import { getTheme, getUsageMode, migrateImageUploadMode, migrateTheme, THEME_STATE_KEY } from './config';
import { uploadFileHandler } from './handler/uploadFile';
import type { EditorState, ExtensionToWebviewMessage } from './protocol';
import { parseWebviewMessage } from './protocol';
import { calculateTextReplacement } from './textEdit';
import { getWebviewContent } from './webview';

const MAX_PNG_BYTES = 50 * 1024 * 1024;

function sameUri(left: vscode.Uri | undefined, right: vscode.Uri | undefined): boolean {
  return left?.toString() === right?.toString();
}

function uriDirectory(uri: vscode.Uri): vscode.Uri {
  return uri.with({ path: path.posix.dirname(uri.path), query: '', fragment: '' });
}

class CherryMarkdownPreview {
  private panel: vscode.WebviewPanel | undefined;
  private targetEditor: vscode.TextEditor | undefined;
  private messageDisposable: vscode.Disposable | undefined;
  private webviewReady = false;
  private suppressEditorScroll = false;
  private scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  private pendingWebviewText: string | undefined;
  private editQueue: Promise<void> = Promise.resolve();
  private panelGeneration = 0;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly output: vscode.OutputChannel,
  ) {}

  register(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('cherrymarkdown.preview', () => this.show(true)),
      vscode.window.onDidChangeActiveTextEditor((editor) => this.handleActiveEditorChange(editor)),
      vscode.workspace.onDidChangeTextDocument((event) => this.handleDocumentChange(event)),
      vscode.window.onDidChangeTextEditorVisibleRanges((event) => this.handleVisibleRangesChange(event)),
      vscode.workspace.onDidChangeConfiguration((event) => this.handleConfigurationChange(event)),
    );

    void this.handleActiveEditorChange(vscode.window.activeTextEditor);
  }

  dispose(): void {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.messageDisposable?.dispose();
    this.panel?.dispose();
  }

  private async show(manual: boolean): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor?.document.languageId === 'markdown') {
      this.targetEditor = editor;
    }
    if (!this.targetEditor || (!manual && getUsageMode(this.targetEditor.document.uri) !== 'active')) return;

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
      this.updateResourceRoots();
      await this.postEditorState('editor-change');
      return;
    }

    const title = this.getTitle();
    this.panel = vscode.window.createWebviewPanel('cherrymarkdown.preview', title, vscode.ViewColumn.Two, {
      enableScripts: true,
      enableForms: false,
      retainContextWhenHidden: false,
      localResourceRoots: this.getResourceRoots(),
    });
    this.panelGeneration += 1;
    this.panel.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'favicon.ico');
    this.panel.webview.html = getWebviewContent(this.panel, this.context.extensionUri);
    this.webviewReady = false;

    this.panel.onDidDispose(() => this.resetPanel(), undefined, this.context.subscriptions);
    this.panel.onDidChangeViewState(
      async ({ webviewPanel }) => {
        if (webviewPanel.visible && this.webviewReady) await this.postEditorState('editor-change');
      },
      undefined,
      this.context.subscriptions,
    );
    this.registerWebviewMessages();
  }

  private resetPanel(): void {
    this.panelGeneration += 1;
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.messageDisposable?.dispose();
    this.messageDisposable = undefined;
    this.panel = undefined;
    this.webviewReady = false;
    this.pendingWebviewText = undefined;
    this.suppressEditorScroll = false;
  }

  private registerWebviewMessages(): void {
    if (!this.panel) return;
    this.messageDisposable?.dispose();
    this.messageDisposable = this.panel.webview.onDidReceiveMessage((rawMessage: unknown) => {
      const message = parseWebviewMessage(rawMessage);
      if (!message) {
        this.output.appendLine('[protocol] Ignored an invalid message from the Webview.');
        return;
      }

      switch (message.type) {
        case 'ready':
          this.webviewReady = true;
          void (async () => {
            await this.postEditorState('editor-init');
            await this.postMessage({
              cmd: this.isEditEnabled() ? 'enable-edit' : 'disable-edit',
              data: {},
            });
          })();
          break;
        case 'preview-scroll':
          this.revealEditorLine(message.data);
          break;
        case 'change-theme':
          void this.updateTheme(message.data);
          break;
        case 'editor-change':
          this.editQueue = this.editQueue
            .then(() => this.applyWebviewEdit(message.data))
            .catch(async (error: unknown) => {
              this.reportError('editor-change', error);
              await this.postOperationError('editor-change', vscode.l10n.t('Unable to apply the preview edit.'));
              await this.postEditorState('editor-change');
            });
          break;
        case 'show-message':
          void vscode.window.showInformationMessage(message.data);
          break;
        case 'upload-file':
          void this.uploadFile(message.data);
          break;
        case 'open-url':
          void this.openUrl(message.data);
          break;
        case 'export-png':
          void this.exportPng(message.data);
          break;
      }
    });
  }

  private async handleActiveEditorChange(editor: vscode.TextEditor | undefined): Promise<void> {
    if (editor?.document.languageId === 'markdown') {
      this.targetEditor = editor;
      if (this.panel) {
        this.updateResourceRoots();
        await this.postMessage({ cmd: 'enable-edit', data: {} });
        await this.postEditorState('editor-change');
      } else if (getUsageMode(editor.document.uri) === 'active') {
        await this.show(false);
      }
      return;
    }

    if (this.panel) await this.postMessage({ cmd: 'disable-edit', data: {} });
  }

  private isEditEnabled(): boolean {
    const activeEditor = vscode.window.activeTextEditor;
    return Boolean(
      activeEditor?.document.languageId === 'markdown' &&
      this.targetEditor &&
      sameUri(activeEditor.document.uri, this.targetEditor.document.uri),
    );
  }

  private async handleDocumentChange(event: vscode.TextDocumentChangeEvent): Promise<void> {
    if (!this.targetEditor || !sameUri(event.document.uri, this.targetEditor.document.uri)) return;
    if (this.pendingWebviewText === event.document.getText()) {
      this.pendingWebviewText = undefined;
      return;
    }
    this.pendingWebviewText = undefined;
    await this.postEditorState('editor-change');
  }

  private handleVisibleRangesChange(event: vscode.TextEditorVisibleRangesChangeEvent): void {
    if (
      !this.panel ||
      !this.targetEditor ||
      !sameUri(event.textEditor.document.uri, this.targetEditor.document.uri) ||
      this.suppressEditorScroll ||
      event.visibleRanges.length === 0
    ) {
      return;
    }
    void this.postMessage({ cmd: 'editor-scroll', data: event.visibleRanges[0].start.line });
  }

  private async handleConfigurationChange(event: vscode.ConfigurationChangeEvent): Promise<void> {
    if (!this.targetEditor) return;
    if (
      !this.panel &&
      event.affectsConfiguration('cherryMarkdown.Usage', this.targetEditor.document.uri) &&
      getUsageMode(this.targetEditor.document.uri) === 'active'
    ) {
      await this.show(false);
    }
  }

  private async applyWebviewEdit(data: {
    documentUri: string;
    baseVersion: number;
    requestId: number;
    markdown: string;
  }): Promise<void> {
    const editor = this.targetEditor;
    if (editor?.document.uri.toString() !== data.documentUri) {
      await this.postOperationError('editor-change', vscode.l10n.t('The preview document is no longer active.'));
      await this.postEditorState('editor-change');
      return;
    }

    const { document } = editor;
    if (document.version !== data.baseVersion) {
      await this.postOperationError('editor-change', vscode.l10n.t('The document changed outside the preview.'));
      await this.postEditorState('editor-change');
      return;
    }

    const normalizedMarkdown = data.markdown.replace(/\r?\n/g, document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n');
    const replacement = calculateTextReplacement(document.getText(), normalizedMarkdown);
    if (!replacement) {
      await this.postMessage({
        cmd: 'editor-ack',
        data: { requestId: data.requestId, documentVersion: document.version, text: document.getText() },
      });
      return;
    }

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(document.positionAt(replacement.startOffset), document.positionAt(replacement.endOffset)),
      replacement.text,
    );
    this.pendingWebviewText = normalizedMarkdown;
    const applied = await vscode.workspace.applyEdit(edit);
    if (!applied) {
      this.pendingWebviewText = undefined;
      await this.postOperationError('editor-change', vscode.l10n.t('Unable to apply the preview edit.'));
      await this.postEditorState('editor-change');
      return;
    }

    await this.postMessage({
      cmd: 'editor-ack',
      data: { requestId: data.requestId, documentVersion: document.version, text: document.getText() },
    });
  }

  private revealEditorLine(line: number): void {
    if (!this.targetEditor) return;
    const lastLine = Math.max(0, this.targetEditor.document.lineCount - 1);
    const targetLine = line < 0 ? lastLine : Math.min(Math.floor(line), lastLine);
    const position = new vscode.Position(targetLine, 0);
    this.suppressEditorScroll = true;
    this.targetEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.suppressEditorScroll = false;
    }, 150);
  }

  private async updateTheme(theme: string): Promise<void> {
    if (!this.targetEditor) return;
    await this.context.globalState.update(THEME_STATE_KEY, theme);
    await this.postEditorState('editor-change');
  }

  private async uploadFile(file: Parameters<typeof uploadFileHandler>[0]): Promise<void> {
    const { panel } = this;
    const generation = this.panelGeneration;
    try {
      const result = await uploadFileHandler(file, this.targetEditor?.document.uri);
      if (generation === this.panelGeneration && panel === this.panel) {
        await this.postMessage({ cmd: 'upload-file-result', data: result }, panel);
      }
    } catch (error: unknown) {
      this.reportError('upload-file', error);
      if (generation === this.panelGeneration && panel === this.panel) {
        await this.postOperationError('upload-file', vscode.l10n.t('Upload failed.'), file.requestId, panel);
      }
    }
  }

  private async openUrl(rawUrl: string): Promise<void> {
    if (!rawUrl) {
      await vscode.window.showErrorMessage(vscode.l10n.t('The link is invalid.'));
      return;
    }

    let decodedUrl: string;
    try {
      decodedUrl = decodeURIComponent(rawUrl);
    } catch {
      await vscode.window.showErrorMessage(vscode.l10n.t('The link is invalid.'));
      return;
    }

    if (/^https?:\/\//i.test(rawUrl)) {
      try {
        const parsed = new URL(rawUrl);
        if (!parsed.hostname || /[\u0000-\u001f]/.test(rawUrl)) throw new Error('Invalid URL');
        await vscode.env.openExternal(vscode.Uri.parse(rawUrl));
      } catch {
        await vscode.window.showErrorMessage(vscode.l10n.t('The link is invalid.'));
      }
      return;
    }
    if (decodedUrl.startsWith('#')) return;
    if (/^[a-z][a-z\d+.-]*:/i.test(decodedUrl) && !path.win32.isAbsolute(decodedUrl)) {
      await vscode.window.showErrorMessage(vscode.l10n.t('This link protocol is not allowed.'));
      return;
    }
    if (!this.targetEditor) return;

    let targetUri: vscode.Uri;
    const reference = vscode.Uri.parse(decodedUrl);
    if (path.win32.isAbsolute(reference.fsPath) || path.posix.isAbsolute(reference.path)) {
      targetUri = vscode.Uri.file(reference.fsPath).with({ query: reference.query, fragment: reference.fragment });
    } else {
      targetUri = vscode.Uri.joinPath(uriDirectory(this.targetEditor.document.uri), reference.path).with({
        query: reference.query,
        fragment: reference.fragment,
      });
    }
    await vscode.commands.executeCommand('vscode.open', targetUri, { preview: true });
  }

  private async exportPng(data: string): Promise<void> {
    if (data === 'export-fail') {
      await vscode.window.showErrorMessage(vscode.l10n.t('Unable to export the preview as PNG.'));
      return;
    }

    const base64Data = data.slice('data:image/png;base64,'.length);
    const estimatedSize = Math.floor((base64Data.length * 3) / 4);
    if (estimatedSize > MAX_PNG_BYTES) {
      await vscode.window.showErrorMessage(vscode.l10n.t('The exported PNG is too large.'));
      return;
    }
    if (base64Data.length % 4 !== 0 || !/^[A-Za-z\d+/]*={0,2}$/.test(base64Data)) {
      await vscode.window.showErrorMessage(vscode.l10n.t('Unable to export the preview as PNG.'));
      return;
    }

    const uri = await vscode.window.showSaveDialog({
      filters: { Images: ['png'] },
      saveLabel: vscode.l10n.t('Save PNG'),
    });
    if (!uri) return;

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        throw new Error('The exported data is not a PNG file.');
      }
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: vscode.l10n.t('Saving Cherry Markdown PNG...') },
        () => vscode.workspace.fs.writeFile(uri, buffer),
      );
      await vscode.window.showInformationMessage(vscode.l10n.t('Image saved successfully.'));
    } catch (error: unknown) {
      this.reportError('export-png', error);
      await vscode.window.showErrorMessage(vscode.l10n.t('Unable to save the PNG.'));
    }
  }

  private getEditorState(): EditorState | undefined {
    const editor = this.targetEditor;
    if (editor?.document.languageId !== 'markdown' || !this.panel) return undefined;
    const { document } = editor;
    return {
      text: document.getText(),
      theme: getTheme(this.context.globalState, document.uri),
      documentUri: document.uri.toString(),
      documentVersion: document.version,
      resourceUri: this.panel.webview.asWebviewUri(document.uri).toString(),
      vscodeLanguage: vscode.env.language,
      labels: {
        edit: vscode.l10n.t('Edit'),
        fontStyle: vscode.l10n.t('Font style'),
        save: vscode.l10n.t('Save'),
        savePng: vscode.l10n.t('Save as PNG'),
        editDisabled: vscode.l10n.t('The Markdown document is not active, so preview editing is disabled.'),
      },
    };
  }

  private async postEditorState(cmd: 'editor-init' | 'editor-change'): Promise<void> {
    const state = this.getEditorState();
    if (!state || !this.panel || !this.webviewReady) return;
    this.panel.title = this.getTitle();
    await this.postMessage({ cmd, data: state });
  }

  private async postOperationError(
    operation: string,
    message: string,
    requestId?: number,
    panel = this.panel,
  ): Promise<void> {
    await this.postMessage({ cmd: 'operation-error', data: { operation, message, requestId } }, panel);
  }

  private async postMessage(message: ExtensionToWebviewMessage, panel = this.panel): Promise<boolean> {
    return (await panel?.webview.postMessage(message)) ?? false;
  }

  private updateResourceRoots(): void {
    if (!this.panel) return;
    this.panel.webview.options = {
      enableScripts: true,
      enableForms: false,
      localResourceRoots: this.getResourceRoots(),
    };
  }

  private getResourceRoots(): vscode.Uri[] {
    const roots = [vscode.Uri.joinPath(this.context.extensionUri, 'web-resources')];
    if (!this.targetEditor) return roots;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(this.targetEditor.document.uri);
    roots.push(workspaceFolder?.uri ?? uriDirectory(this.targetEditor.document.uri));
    return roots;
  }

  private getTitle(): string {
    if (!this.targetEditor) return `${vscode.l10n.t('Unsupported')} · Cherry Markdown`;
    return `${vscode.l10n.t('Preview')} ${path.posix.basename(this.targetEditor.document.uri.path)} · Cherry Markdown`;
  }

  private reportError(operation: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.output.appendLine(`[${operation}] ${message}`);
  }
}

let preview: CherryMarkdownPreview | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Cherry Markdown');
  preview = new CherryMarkdownPreview(context, output);
  preview.register();
  context.subscriptions.push(output, preview);
  void migrateTheme(context.globalState);
  void migrateImageUploadMode(context.globalState);
}

export function deactivate(): void {
  preview?.dispose();
  preview = undefined;
}
