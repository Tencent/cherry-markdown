import { describe, expect, test, vi } from 'vitest';
import { getWebviewContent } from '../src/webview';

const mockVscode = vi.hoisted(() => ({
  env: { language: 'zh-cn' },
  Uri: {
    file: vi.fn((path: string) => ({
      scheme: 'file',
      authority: '',
      path,
      query: '',
      fragment: '',
      fsPath: path,
      toString: () => `file://${path}`,
      with: vi.fn(),
      toJSON: vi.fn(),
    })),
    joinPath: vi.fn((base: { path: string }, ...segments: string[]) => ({
      path: [base.path, ...segments].join('/'),
    })),
  },
}));

vi.mock('vscode', () => mockVscode);

describe('webview shell', () => {
  test('uses extension-scoped resources and a restrictive CSP', () => {
    const asWebviewUri = vi.fn((uri: { path: string }) => ({
      scheme: 'vscode-webview',
      authority: 'test',
      path: uri.path,
      query: '',
      fragment: '',
      fsPath: uri.path,
      toString: () => `webview://${uri.path}`,
      with: vi.fn(),
      toJSON: vi.fn(),
    }));
    const html = getWebviewContent(
      { webview: { cspSource: 'vscode-webview://test', asWebviewUri } },
      mockVscode.Uri.file('/extension'),
    );

    expect(html).toContain('<html lang="zh-cn">');
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("base-uri 'none'");
    expect(html).toContain("form-action 'none'");
    expect(html).toContain("frame-src 'none'");
    expect(html).toContain('script-src vscode-webview://test');
    expect(html).toContain('webview:///extension/web-resources/dist/index.css');
    expect(html).toContain('webview:///extension/web-resources/dist/index.js');
    expect(html).toContain('webview:///extension/web-resources/scripts/pinyin/pinyin_dist.js');
    expect(html).not.toContain('global-vars.js');
    expect(asWebviewUri).toHaveBeenCalledTimes(4);
  });
});
