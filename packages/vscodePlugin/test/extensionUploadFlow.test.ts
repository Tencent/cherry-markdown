import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { activate, deactivate } from '../src/extension';
import type * as vscode from 'vscode';

const host = vi.hoisted(() => {
  const callbacks = new Map<string, (...args: any[]) => any>();
  const disposable = { dispose() {} };
  const listen = (name: string) => (callback: (...args: any[]) => any) => {
    callbacks.set(name, callback);
    return disposable;
  };
  const uri = (path: string): any => ({
    path,
    fsPath: path,
    scheme: 'file',
    toString: () => `file://${path}`,
    with: (parts: Record<string, string>) => uri(parts.path ?? path),
  });
  const documents: any[] = [];
  const messages: any[] = [];
  const panel = {
    visible: true,
    title: '',
    iconPath: undefined,
    webview: {
      html: '',
      options: {},
      asWebviewUri: (value: any) => value,
      postMessage: vi.fn(async (message: any) => {
        messages.push(message);
        return true;
      }),
      onDidReceiveMessage: listen('message'),
    },
    onDidDispose: listen('dispose'),
    onDidChangeViewState: listen('view-state'),
    dispose() {
      callbacks.get('dispose')?.();
    },
    reveal() {},
  };
  const applyEdit = vi.fn(async (edit: any) => {
    for (const item of edit.edits) {
      const document = documents.find((value) => value.uri.toString() === item.uri.toString());
      if (!document || document.isClosed) return false;
      document.text =
        document.text.slice(0, item.range.start.character) + item.text + document.text.slice(item.range.end.character);
      document.version++;
      await callbacks.get('document-change')?.({ document });
    }
    return true;
  });
  return { callbacks, disposable, listen, uri, documents, messages, panel, applyEdit };
});

const upload = vi.hoisted(() => ({
  run: vi.fn(),
}));

vi.mock('../src/handler/uploadFile', () => ({ uploadFileHandler: (...args: unknown[]) => upload.run(...args) }));
vi.mock('../src/webview', () => ({ getWebviewContent: () => '<html></html>' }));
vi.mock('../src/config', () => ({
  getTheme: () => 'default',
  getUsageMode: () => 'only-manual',
  getBackfillImageProps: () => [],
  describeUploadConfiguration: () => 'Upload test',
  UploadConfigurationError: class extends Error {},
  migrateImageUploadMode: async () => {},
  migrateTheme: async () => {},
  THEME_STATE_KEY: 'theme',
}));
vi.mock('vscode', () => ({
  Uri: { file: host.uri, joinPath: (base: any, ...parts: string[]) => host.uri([base.path, ...parts].join('/')) },
  Range: class {
    constructor(
      public start: any,
      public end: any,
    ) {}
  },
  WorkspaceEdit: class {
    edits: any[] = [];
    replace(uri: any, range: any, text: string) {
      this.edits.push({ uri, range, text });
    }
  },
  ViewColumn: { Two: 2 },
  EndOfLine: { LF: 1, CRLF: 2 },
  env: { language: 'en' },
  l10n: { t: (text: string) => text },
  commands: {
    registerCommand: (name: string, callback: (...args: any[]) => any) => {
      host.callbacks.set(name, callback);
      return host.disposable;
    },
  },
  window: {
    activeTextEditor: undefined,
    createOutputChannel: () => ({ appendLine: vi.fn(), dispose() {} }),
    createWebviewPanel: () => host.panel,
    onDidChangeActiveTextEditor: host.listen('active-editor'),
    onDidChangeTextEditorVisibleRanges: host.listen('visible-ranges'),
    onDidChangeActiveColorTheme: host.listen('theme'),
  },
  workspace: {
    textDocuments: host.documents,
    applyEdit: host.applyEdit,
    onDidChangeTextDocument: host.listen('document-change'),
    onDidCloseTextDocument: host.listen('document-close'),
    onDidChangeConfiguration: host.listen('configuration'),
    onDidGrantWorkspaceTrust: host.listen('trust'),
    getWorkspaceFolder: () => undefined,
  },
}));

const placeholder = 'cherry-upload:11111111-1111-4111-8111-111111111111';

function document(path: string, text: string) {
  return {
    uri: host.uri(path),
    text,
    version: 1,
    eol: 1,
    languageId: 'markdown',
    isClosed: false,
    getText() {
      return this.text;
    },
    positionAt: (character: number) => ({ line: 0, character }),
    save: vi.fn(),
  };
}

async function setup() {
  const vscode = await import('vscode');
  const a = document('/A.md', `![image](${placeholder})`);
  const b = document('/B.md', 'B untouched');
  host.documents.push(a, b);
  (vscode.window as any).activeTextEditor = { document: a };
  activate({
    subscriptions: [],
    extensionUri: host.uri('/extension'),
    globalState: {},
  } as unknown as vscode.ExtensionContext);
  await host.callbacks.get('cherrymarkdown.preview')!();
  host.callbacks.get('message')!({ type: 'ready' });
  await vi.waitFor(() => expect(host.messages.some((message) => message.cmd === 'editor-init')).toBe(true));
  let resolveUpload!: (result: unknown) => void;
  upload.run.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveUpload = resolve;
      }),
  );
  host.callbacks.get('message')!({
    type: 'upload-file',
    data: {
      requestId: 1,
      documentUri: a.uri.toString(),
      placeholder,
      name: 'image.png',
      type: 'image/png',
      path: '',
      size: 3,
      base64: 'AQID',
    },
  });
  expect(upload.run).toHaveBeenCalledTimes(1);
  return { a, b, resolve: () => resolveUpload({ requestId: 1, name: 'image.png', url: './image.png' }) };
}

describe('extension upload message wiring', () => {
  beforeEach(() => {
    deactivate();
    host.callbacks.clear();
    host.documents.length = 0;
    host.messages.length = 0;
    host.panel.visible = true;
    host.applyEdit.mockClear();
    upload.run.mockReset();
  });

  test('upload in A, activate B, then finish: edits A only and never saves either document', async () => {
    const f = await setup();
    await host.callbacks.get('active-editor')!({ document: f.b });
    f.resolve();
    await vi.waitFor(() => expect(f.a.text).toBe('![image](./image.png)'));
    expect(f.b.text).toBe('B untouched');
    expect(f.a.save).not.toHaveBeenCalled();
    expect(f.b.save).not.toHaveBeenCalled();
    expect(host.messages.filter((message) => message.cmd === 'upload-file-result')).toEqual([]);
  });

  test('closing the preview during upload still updates the original open document', async () => {
    const f = await setup();
    host.panel.dispose();
    f.resolve();
    await vi.waitFor(() => expect(f.a.text).toBe('![image](./image.png)'));
    expect(f.b.text).toBe('B untouched');
  });

  test('closing A cancels completion rather than reopening or saving it', async () => {
    const f = await setup();
    f.a.isClosed = true;
    host.callbacks.get('document-close')!(f.a);
    f.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(host.applyEdit).not.toHaveBeenCalled();
    expect(f.a.save).not.toHaveBeenCalled();
  });

  test('hiding the preview after a result was published completes the anchored edit in the document', async () => {
    const f = await setup();
    f.resolve();
    await vi.waitFor(() => expect(host.messages.some((message) => message.cmd === 'upload-file-result')).toBe(true));
    expect(f.a.text).toContain(placeholder);
    host.panel.visible = false;
    await host.callbacks.get('view-state')!({ webviewPanel: host.panel });
    expect(f.a.text).toBe('![image](./image.png)');
    expect(f.b.text).toBe('B untouched');
    expect(f.a.save).not.toHaveBeenCalled();
  });
});
