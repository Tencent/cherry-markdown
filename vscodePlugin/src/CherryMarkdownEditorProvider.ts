/* eslint-disable max-len */
import * as vscode from 'vscode';
import { genCherryMarkdownEditorHtml } from './IndexPage';

export default class CherryMarkdownEditorProvider
implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new CherryMarkdownEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      CherryMarkdownEditorProvider.viewType,
      provider,
    );
    return providerRegistration;
  }

  constructor(private readonly context: vscode.ExtensionContext) {
    this.context = context;
  }

  private static readonly viewType = 'cherryMarkdown.editor';

  /**
   * Called when our custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = genCherryMarkdownEditorHtml(
      this.context,
      webviewPanel.webview,
    );

    function updateMarkdownContent() {
      webviewPanel.webview.postMessage({
        type: 'update',
        text: document.getText(),
      });
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        //   updateMarkdownContent();
      }
    },);

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((e) => {
      const { type, data } = e;
      switch (type) {
        case 'save':
          this.saveMarkdownContent(data, document);
          return;
      }
    });

    updateMarkdownContent();
  }

  private saveMarkdownContent(
    data: { text: string },
    document: vscode.TextDocument,
  ) {
    const { text } = data;
    const edit = new vscode.WorkspaceEdit();

    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      text,
    );

    return vscode.workspace.applyEdit(edit);
  }
}
