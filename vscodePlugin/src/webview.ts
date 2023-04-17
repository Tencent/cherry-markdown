import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 返回webview需要的html页面
 * @param mdInfo MD源码 和 一些配置信息
 * @param currentPanel WebviewPanel实例
 * @param extensionPath 静态资源路径
 * @returns string
 */
export function getWebviewContent(mdInfo: object, currentPanel: vscode.WebviewPanel, extensionPath: string) {
  const baseResourcePath = getBaseResourcePath(currentPanel);
  const filePath = writeGlobalVarsToFile(extensionPath, {
    baseResourcePath,
  });
  const pageResourceUrlsMap = {
    'global-vars.js': currentPanel.webview.asWebviewUri(vscode.Uri.file(filePath)),
    'index.css': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'web-resources/index.css'))),
    'cherry-markdown.css': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'web-resources/dist/cherry-markdown.min.css'))),
    'cherry-markdown.js': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'web-resources/dist/cherry-markdown.min.js'))),
    'scripts/pinyin/pinyin_dist.js': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'web-resources/scripts/pinyin/pinyin_dist.js'))),
    'scripts/index.js': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'dist/index.js'))),
    'scripts/index.css': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'web-resources/scripts/index.css'))),
    'dist/fonts/ch-icon.woff': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'web-resources/dist/fonts/ch-icon.woff'))),
    'dist/fonts/ch-icon.woff2': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'web-resources/dist/fonts/ch-icon.woff2'))),
    'dist/fonts/ch-icon.ttf': currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'web-resources/dist/fonts/ch-icon.ttf'))),
  };
  return `<!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta
http-equiv="Content-Security-Policy"
content="default-src 'none'; img-src ${currentPanel.webview.cspSource} https: http: data:; script-src ${currentPanel.webview.cspSource}; style-src ${currentPanel.webview.cspSource}; font-src ${currentPanel.webview.cspSource};"
/>
    <title>Cherry Editor - Markdown Editor</title>
    <link rel="preload" as="font" href="${pageResourceUrlsMap['dist/fonts/ch-icon.woff']}">
    <link rel="preload" as="font" href="${pageResourceUrlsMap['dist/fonts/ch-icon.woff2']}">
    <link rel="font" href="${pageResourceUrlsMap['dist/fonts/ch-icon.ttf']}">
    <link rel="preload" as="font" crossorigin href="${pageResourceUrlsMap['dist/fonts/ch-icon.ttf']}">
    <link rel="stylesheet" type="text/css" href="${pageResourceUrlsMap['cherry-markdown.css']}">
    <link rel="stylesheet" type="text/css" href="${pageResourceUrlsMap['index.css']}">
    <link rel="stylesheet" type="text/css" href="${pageResourceUrlsMap['scripts/index.css']}">
    <script src="${pageResourceUrlsMap['global-vars.js']}"></script>
    </head>
  
  <body>
    <div id="dom_mask" style="position: absolute; top: 40px; height: 20px; width: 100%;"></div>
    <textarea id="markdown-info">${JSON.stringify(mdInfo)}</textarea>
    <div id="markdown" class="markdown-preview-only"></div>
    <script src="${pageResourceUrlsMap['cherry-markdown.js']}"></script>
    <script src="${pageResourceUrlsMap['scripts/pinyin/pinyin_dist.js']}"></script>
    <script src="${pageResourceUrlsMap['scripts/index.js']}"></script>
  </body>
  </html>`;
}

function getBaseResourcePath(currentPanel: vscode.WebviewPanel) {
  const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath ?? '';
  const webviewResourcePath = currentPanel.webview.asWebviewUri(vscode.Uri.parse(workspaceFolder)).toString();
  const basePath = path.join(webviewResourcePath, getRelativePath());
  return basePath;
}

function writeGlobalVarsToFile(extensionPath: string, globalVars: { baseResourcePath: string }): string {
  const globalVarsContent = `
    window._baseResourcePath = "${globalVars.baseResourcePath}";
  `
  const filePath = path.join(extensionPath, 'web-resources/scripts', 'global-vars.js');
  fs.writeFileSync(filePath, globalVarsContent);
  return filePath;
}

function getRelativePath(): string {
  if(!vscode.window.activeTextEditor) {
    return '';
  }
  const documentUri = vscode.window.activeTextEditor.document.uri;
  const workspaceFolderUri = vscode.workspace.getWorkspaceFolder(documentUri);
  if(!workspaceFolderUri) {
    return '';
  }
  const workspaceFolder = workspaceFolderUri.uri.fsPath;
  const mdFileFolder = path.dirname(documentUri.fsPath);
  return path.relative( workspaceFolder, mdFileFolder);
}