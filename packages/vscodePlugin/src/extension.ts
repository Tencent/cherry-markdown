import * as vscode from 'vscode';
import * as path from 'path';
import { getWebviewContent } from './webview';
import { uploadFileHandler } from './handler/uploadFile';

// 状态管理器
// 更简化的状态对象
const state = {
  panel: undefined as vscode.WebviewPanel | undefined,
  targetEditor: undefined as vscode.TextEditor | undefined,
  webviewMsgDisposable: undefined as vscode.Disposable | undefined,
  extPath: '',
  scrollTimeout: undefined as ReturnType<typeof setTimeout> | undefined,
  editTimeout: undefined as ReturnType<typeof setTimeout> | undefined,
  disableScroll: false,
  disableEdit: false,
  isPanelInit: false,
  theme: vscode.workspace.getConfiguration('cherryMarkdown').get('theme') as string | undefined,
  reset() {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    if (this.editTimeout) clearTimeout(this.editTimeout);
    this.webviewMsgDisposable?.dispose();
    this.panel = undefined;
    this.targetEditor = undefined;
    this.webviewMsgDisposable = undefined;
    this.scrollTimeout = undefined;
    this.editTimeout = undefined;
    this.disableScroll = false;
    this.disableEdit = false;
    this.isPanelInit = false;
    this.theme = vscode.workspace.getConfiguration('cherryMarkdown').get('theme') as string | undefined;
  },
};

export function activate(context: vscode.ExtensionContext) {
  state.extPath = context.extensionPath;
  context.subscriptions.push(
    vscode.commands.registerCommand('cherrymarkdown.preview', () => triggerEditorContentChange(true)),
  );
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(() => triggerEditorContentChange()));
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((e) => handleActiveEditorChange(e)));
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (state.isPanelInit && e?.document && !state.disableEdit) {
        triggerEditorContentChange();
      }
    }),
  );
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
      if (!state.isPanelInit || !state.panel) return;
      if (!state.disableScroll) {
        state.panel.webview.postMessage({ cmd: 'editor-scroll', data: e.visibleRanges[0].start.line });
      }
    }),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * 获取当前文件的信息
 * @returns
 */
const getMarkdownFileInfo = () => {
  let editor = vscode.window.activeTextEditor;
  let doc = editor?.document;
  let text = '';
  let title = '';
  if (doc?.languageId !== 'markdown' && state.targetEditor?.document?.languageId === 'markdown') {
    editor = state.targetEditor;
    doc = state.targetEditor?.document;
  }
  if (doc?.languageId === 'markdown' && editor) {
    state.targetEditor = editor;
    text = doc.getText() || '';
    title = path.basename(doc.fileName) || '';
  }
  title = title
    ? `${vscode.l10n.t('Preview')} ${title} ${vscode.l10n.t('By')} Cherry Markdown`
    : `${vscode.l10n.t('UnSupported')} ${vscode.l10n.t('By')} Cherry Markdown`;
  const theme = state.theme ?? vscode.workspace.getConfiguration('cherryMarkdown').get('theme');
  return { mdInfo: { text, theme }, currentTitle: title };
};

/**
 * 初始化cherry预览窗口
 */
const initCherryPanel = () => {
  if (state.isPanelInit && state.panel) {
    state.panel.reveal(vscode.ViewColumn.Two);
    return;
  }
  const { mdInfo, currentTitle } = getMarkdownFileInfo();
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? '';
  state.panel = vscode.window.createWebviewPanel('cherrymarkdown.preview', currentTitle, vscode.ViewColumn.Two, {
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: [
      vscode.Uri.file(path.join(state.extPath, 'web-resources')),
      vscode.Uri.file(path.join(state.extPath, 'web-resources', 'dist')),
      vscode.Uri.file(workspaceFolder),
    ],
  });
  try {
    state.panel.webview.html = getWebviewContent(
      { ...mdInfo, vscodeLanguage: vscode.env.language },
      state.panel,
      state.extPath,
    );
  } catch (err) {
    vscode.window.showErrorMessage('Failed to initialize Cherry Markdown webview.');
    console.error(err);
  }
  state.panel.iconPath = vscode.Uri.file(path.join(state.extPath, 'favicon.ico'));
  state.isPanelInit = true;
  state.panel.onDidDispose(() => state.reset());
  initCherryPanelEvent();
};

const initCherryPanelEvent = () => {
  if (!state.panel) return;
  state.webviewMsgDisposable?.dispose();
  state.webviewMsgDisposable = state.panel.webview.onDidReceiveMessage(async (e) => {
    const { type, data } = e;
    switch (type) {
      case 'preview-scroll': {
        state.disableScroll = true;
        if (!state.targetEditor) return;
        const pos = new vscode.Position(data, 0);
        const range = new vscode.Range(pos, pos);
        state.targetEditor.revealRange(range, vscode.TextEditorRevealType.AtTop);
        if (state.scrollTimeout) clearTimeout(state.scrollTimeout);
        state.scrollTimeout = setTimeout(() => {
          state.disableScroll = false;
        }, 500);
        return;
      }
      case 'change-theme': {
        state.theme = data;
        vscode.workspace.getConfiguration('cherryMarkdown').update('theme', data, true);
        break;
      }
      case 'cherry-change': {
        if (!state.targetEditor) break;
        state.disableEdit = true;
        state.targetEditor.edit((editBuilder) => {
          const endNum = state.targetEditor!.document.lineCount + 1;
          const end = new vscode.Position(endNum, 0);
          editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), data.markdown);
        });
        if (state.editTimeout) clearTimeout(state.editTimeout);
        state.editTimeout = setTimeout(() => {
          state.disableEdit = false;
        }, 500);
        break;
      }
      case 'tips':
        vscode.window.showInformationMessage(data, 'OK');
        break;
      case 'cherry-load-img':
        // 可扩展图片加载逻辑
        break;
      case 'upload-file': {
        try {
          const res = await uploadFileHandler(data);
          if (res.url) {
            state.panel?.webview.postMessage({ cmd: 'upload-file-callback', data: res });
          } else {
            vscode.window.showInformationMessage('上传不成功');
          }
        } catch (err) {
          vscode.window.showErrorMessage('上传失败');
          console.error(err);
        }
        break;
      }
      case 'open-url': {
        if (data === 'href-invalid') {
          vscode.window.showErrorMessage('link is not valid, please check it.');
          return;
        }
        if (/^(http|https):\/\//.test(data)) {
          vscode.env.openExternal(vscode.Uri.parse(data));
          return;
        }
        const decodedData = decodeURIComponent(data);
        if (path.isAbsolute(decodedData)) {
          const decodedDataPath = vscode.Uri.file(decodedData);
          vscode.commands.executeCommand('vscode.open', decodedDataPath, { preview: true });
          return;
        }
        if (data.startsWith('#')) return;
        if (!state.targetEditor) return;
        const uri = vscode.Uri.file(path.join(state.targetEditor.document.uri.fsPath, '..', data));
        vscode.commands.executeCommand('vscode.open', uri, { preview: true });
        break;
      }
      case 'export-png': {
        if (data === 'export-fail') {
          vscode.window.showErrorMessage('导出错误，请重新尝试');
          return;
        }
        const uri = await vscode.window.showSaveDialog({
          filters: { Images: ['png'] },
          saveLabel: '保存截图',
        });
        if (uri) {
          const base64Data = data.replace(/^data:image\/png;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          await vscode.workspace.fs.writeFile(uri, buffer);
          vscode.window.showInformationMessage('Image saved successfully!');
        } else {
          vscode.window.showWarningMessage('Save cancelled.');
        }
        break;
      }
    }
  });
};

// handle active editor change
const handleActiveEditorChange = (e: vscode.TextEditor | undefined) => {
  const cherryUsage = vscode.workspace.getConfiguration('cherryMarkdown').get<'active' | 'only-manual'>('Usage');
  if (!e?.document || cherryUsage !== 'active') return;
  triggerEditorContentChange();
  if (e.document.languageId !== 'markdown') {
    state.panel?.webview.postMessage({ cmd: 'disable-edit', data: {} });
  } else {
    state.panel?.webview.postMessage({ cmd: 'enable-edit', data: {} });
  }
};

/**
 * 向预览区发送vscode编辑区内容变更的消息
 */
const triggerEditorContentChange = (focus = false) => {
  if (state.isPanelInit && state.panel) {
    const { mdInfo, currentTitle } = getMarkdownFileInfo();
    state.panel.title = currentTitle;
    state.panel.webview.postMessage({ cmd: 'editor-change', data: mdInfo });
    return;
  }
  if (vscode.window.activeTextEditor?.document?.languageId === 'markdown') {
    const cherryUsage = vscode.workspace.getConfiguration('cherryMarkdown').get<'active' | 'only-manual'>('Usage');
    if (cherryUsage === 'active' || focus) {
      initCherryPanel();
    }
  }
};
