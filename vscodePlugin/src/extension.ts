import * as vscode from 'vscode';
import * as path from 'path';
import { getWebviewContent } from './webview';

let cherryPanel: vscode.WebviewPanel; // 保存预览窗口的webview实例
let isCherryPanelInit: boolean = false;
let extensionPath: string = '';
let targetDocument: vscode.TextEditor;
let disableScrollTrigger: boolean = false; // true：滚动时不往webview发送滚动事件，反之发送
let disableEditTrigger: boolean = false; // true：变更内容时不往webview发送内容变更事件，反之发送
let cherryTheme: string | undefined = vscode.workspace.getConfiguration('cherryMarkdown').get('theme'); // 缓存主题
export function activate(context: vscode.ExtensionContext) {
  extensionPath = context.extensionPath;
  // 注册命令
  const disposable = vscode.commands.registerCommand(
    'cherrymarkdown.preview',
    () => {
      triggerEditorContentChange();
    }
  );

  context.subscriptions.push(disposable);

  // 打开文件的时候触发
  vscode.workspace.onDidOpenTextDocument(() => {
    vscode.commands.executeCommand('cherrymarkdown.preview');
  });

  // 切换文件的时候更新预览区域内容
  vscode.window.onDidChangeActiveTextEditor((e) => {
    if (e?.document) {
      triggerEditorContentChange();
      // 如果打开的不是md文件，则让cherry强制进入预览模式
      if (e.document.languageId !== 'markdown' && targetDocument) {
        cherryPanel.webview.postMessage({ cmd: 'disable-edit', data: {} });
      } else {
        cherryPanel.webview.postMessage({ cmd: 'enable-edit', data: {} });
      }
    }
  });

  // 当修改文档内容的时候更新预览区域内容，如果已经关闭预览了，则不需要重新打开预览
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (isCherryPanelInit && e?.document && !disableEditTrigger) {
      triggerEditorContentChange();
    }
  });

  // 滚动的时候让预览区域同步滚动
  vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
    if (!isCherryPanelInit) {
      return true;
    }
    disableScrollTrigger || cherryPanel.webview.postMessage({ cmd: 'editor-scroll', data: e.visibleRanges[0].start.line });
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * 获取当前文件的信息
 * @returns
 */
const getMarkdownFileInfo = () => {
  let currentEditor = vscode.window.activeTextEditor;
  // const currentLine = currentEditor?.visibleRanges[0].start.line;
  let currentDoc = currentEditor?.document;
  let currentText = '';
  let currentTitle = '';
  if (currentDoc?.languageId !== 'markdown' && targetDocument.document.languageId === 'markdown') {
    currentEditor = targetDocument;
    currentDoc = targetDocument.document;
  }
  if (currentDoc?.languageId === 'markdown') {
    if (currentEditor) {
      targetDocument = currentEditor;
    }
    currentText = currentDoc?.getText() || '';
    currentTitle = path.basename(currentDoc?.fileName) || '';
  }
  currentTitle = currentTitle ? `预览 ${currentTitle}   by cherry-markdown` : '不支持当前文件 by cherry-markdown';
  const theme = cherryTheme ? cherryTheme : vscode.workspace.getConfiguration('cherryMarkdown').get('theme');
  const mdInfo = { text: currentText, theme };
  return { mdInfo, currentTitle };
};

/**
 * 初始化cherry预览窗口
 */
const initCherryPanel = () => {
  const { mdInfo, currentTitle } = getMarkdownFileInfo();
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? '';
  cherryPanel = vscode.window.createWebviewPanel(
    'cherrymarkdown.preview',
    currentTitle,
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(extensionPath, 'web-resources')),
        vscode.Uri.file(path.join(extensionPath, 'dist')),
        vscode.Uri.file(workspaceFolder),
      ],
    }
  );
  cherryPanel.webview.html = getWebviewContent(mdInfo, cherryPanel, extensionPath);
  isCherryPanelInit = true;

  initCherryPanelEvent();
};

// eslint-disable-next-line no-unused-vars, no-undef
let scrollTimeOut: NodeJS.Timeout;
// eslint-disable-next-line no-unused-vars, no-undef
let editTimeOut: NodeJS.Timeout;
const initCherryPanelEvent = () => {
  cherryPanel?.webview?.onDidReceiveMessage((e) => {
    const { type, data } = e;
    switch (type) {
      // 滚动的时候同步滚动
      case 'preview-scroll':
        disableScrollTrigger = true;
        // eslint-disable-next-line no-case-declarations
        const pos = new vscode.Position(data, 0);
        // eslint-disable-next-line no-case-declarations
        const range = new vscode.Range(pos, pos);
        targetDocument.revealRange(range, vscode.TextEditorRevealType.AtTop);
        scrollTimeOut && clearTimeout(scrollTimeOut);
        scrollTimeOut = setTimeout(() => {
          disableScrollTrigger = false;
        }, 500);
        return;
      // 变更主题的时候同时更新配置
      case 'change-theme':
        cherryTheme = data;
        vscode.workspace.getConfiguration('cherryMarkdown').update('theme', data, true);
        break;
      // 内容变更的时候同时更新对应的文档内容
      case 'cherry-change':
        disableEditTrigger = true;
        targetDocument.edit((editBuilder) => {
          const endNum = targetDocument.document.lineCount + 1;
          const end = new vscode.Position(endNum, 0);
          editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), data.markdown);
        });
        editTimeOut && clearTimeout(editTimeOut);
        editTimeOut = setTimeout(() => {
          disableEditTrigger = false;
        }, 500);
        break;
      case 'tips':
        vscode.window.showInformationMessage(data, 'OK');
        break;
      case 'cherry-load-img':
        // vscode.window.showInformationMessage('暂不支持展示图片，如需要，请前往 https://github.com/Tencent/cherry-markdown 反馈', 'OK');
        // loadOneImg(data);
        break;
    }
  });

  cherryPanel?.onDidDispose(() => {
    isCherryPanelInit = false;
  });
};

/**
 * 向预览区发送vscode编辑区内容变更的消息
 */
const triggerEditorContentChange = () => {
  if (isCherryPanelInit) {
    const { mdInfo, currentTitle } = getMarkdownFileInfo();
    cherryPanel.title = currentTitle;
    cherryPanel.webview.postMessage({ cmd: 'editor-change', data: mdInfo });
  } else {
    if (vscode.window.activeTextEditor?.document?.languageId === 'markdown') {
      initCherryPanel();
    }
  }
};
