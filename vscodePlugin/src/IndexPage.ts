import * as vscode from 'vscode';
import * as path from 'path';

export const genCherryMarkdownEditorHtml = (
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
): string => {
  const pageResourceUrlsMap = {
    'index.css': webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'web-resources/index.css'),),),
    'cherry-markdown.css': webview.asWebviewUri(vscode.Uri.file(path.join(
      context.extensionPath,
      'web-resources/dist/cherry-markdown.css',
    ),),),
    'cherry-markdown.js': webview.asWebviewUri(vscode.Uri.file(path.join(
      context.extensionPath,
      'web-resources/dist/cherry-markdown.js',
    ),),),
    'scripts/pinyin/pinyin_dist.js': webview.asWebviewUri(vscode.Uri.file(path.join(
      context.extensionPath,
      'web-resources/scripts/pinyin/pinyin_dist.js',
    ),),),
    'scripts/index-demo.js': webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'web-resources/scripts/index-demo.js'),),),
    'dist/fonts/ch-icon.woff': webview.asWebviewUri(vscode.Uri.file(path.join(
      context.extensionPath,
      'web-resources/dist/fonts/ch-icon.woff',
    ),),),
    'dist/fonts/ch-icon.woff2': webview.asWebviewUri(vscode.Uri.file(path.join(
      context.extensionPath,
      'web-resources/dist/fonts/ch-icon.woff2',
    ),),),
    'dist/fonts/ch-icon.ttf': webview.asWebviewUri(vscode.Uri.file(path.join(
      context.extensionPath,
      'web-resources/dist/fonts/ch-icon.ttf',
    ),),),
  };

  function getWebviewContent(pageResourceUrlsMap: any) {
    return `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource}; style-src ${webview.cspSource}; font-src ${webview.cspSource};"
  />
        <title>Cherry Editor - Markdown Editor</title>
        <link rel="preload" as="font" href="${pageResourceUrlsMap['dist/fonts/ch-icon.woff']}">
        <link rel="preload" as="font" href="${pageResourceUrlsMap['dist/fonts/ch-icon.woff2']}">
        <link rel="font" href="${pageResourceUrlsMap['dist/fonts/ch-icon.ttf']}">
        <link rel="preload" as="font" crossorigin href="${pageResourceUrlsMap['dist/fonts/ch-icon.ttf']}">
        <link rel="stylesheet" type="text/css" href="${pageResourceUrlsMap['cherry-markdown.css']}">
        <link rel="stylesheet" type="text/css" href="${pageResourceUrlsMap['index.css']}">
      </head>
      
      <body>
        <div id="dom_mask" style="position: absolute; top: 40px; height: 20px; width: 100%;"></div>
        <div id="markdown"></div>
        <script src="${pageResourceUrlsMap['cherry-markdown.js']}"></script>
        <script src="${pageResourceUrlsMap['scripts/pinyin/pinyin_dist.js']}"></script>
        <script src="${pageResourceUrlsMap['scripts/index-demo.js']}"></script>
      </body>
      </html>`;
  }

  return getWebviewContent(pageResourceUrlsMap);
};
