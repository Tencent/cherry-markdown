import * as vscode from 'vscode';

function resourceUri(webview: vscode.Webview, extensionUri: vscode.Uri, ...segments: string[]): vscode.Uri {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...segments));
}

/** Returns the static Webview shell. Document content is sent only after the Webview reports that it is ready. */
export function getWebviewContent(currentPanel: vscode.WebviewPanel, extensionUri: vscode.Uri): string {
  const { webview } = currentPanel;
  const bundleCss = resourceUri(webview, extensionUri, 'web-resources', 'dist', 'index.css');
  const customCss = resourceUri(webview, extensionUri, 'web-resources', 'scripts', 'index.css');
  const pinyinScript = resourceUri(webview, extensionUri, 'web-resources', 'scripts', 'pinyin', 'pinyin_dist.js');
  const bundleScript = resourceUri(webview, extensionUri, 'web-resources', 'dist', 'index.js');

  return `<!DOCTYPE html>
<html lang="${vscode.env.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; img-src ${webview.cspSource} https: http: data:; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};"
  >
  <title>Cherry Markdown</title>
  <link rel="stylesheet" type="text/css" href="${bundleCss}">
  <link rel="stylesheet" type="text/css" href="${customCss}">
</head>
<body>
  <div id="dom_mask"></div>
  <div id="markdown" class="markdown-preview-only" aria-live="polite"></div>
  <script src="${pinyinScript}"></script>
  <script type="module" src="${bundleScript}"></script>
</body>
</html>`;
}
