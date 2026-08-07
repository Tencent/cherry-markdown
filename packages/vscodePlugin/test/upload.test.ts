import { beforeEach, describe, expect, test, vi } from 'vitest';
import { parseUploadResponse, uploadFileHandler } from '../src/handler/uploadFile';

const mockState = vi.hoisted(() => {
  const files = new Map<string, Uint8Array>([['/tmp/image.png', new Uint8Array([1, 2, 3])]]);
  const uri = (uriPath: string) => ({ path: uriPath, fsPath: uriPath, scheme: 'file' });
  const workspace = {
    fs: {
      stat: vi.fn(async (target: { path: string }) => {
        const file = files.get(target.path);
        if (!file) throw new Error('File not found');
        return { type: 1, size: file.length };
      }),
      readFile: vi.fn(async (target: { path: string }) => {
        const file = files.get(target.path);
        if (!file) throw new Error('File not found');
        return file;
      }),
      createDirectory: vi.fn(async () => undefined),
      writeFile: vi.fn(async (target: { path: string }, content: Uint8Array) => {
        files.set(target.path, content);
      }),
    },
    getWorkspaceFolder: vi.fn(() => ({ uri: uri('/workspace') })),
  };
  return { files, uri, workspace, mode: 'workspace' };
});

vi.mock('vscode', () => ({
  FileType: { File: 1 },
  Uri: {
    file: (uriPath: string) => mockState.uri(uriPath),
    joinPath: (base: { path: string }, ...segments: string[]) => mockState.uri([base.path, ...segments].join('/')),
  },
  workspace: mockState.workspace,
}));

vi.mock('../src/config', () => ({
  getAssetDirectory: () => '.cherry-assets',
  getBackfillImageProps: () => [],
  getCustomUploader: () => undefined,
  getImageUploadMode: () => mockState.mode,
}));

describe('image upload handler', () => {
  beforeEach(() => {
    mockState.mode = 'workspace';
    mockState.files.delete('/workspace/.cherry-assets/image.png');
    mockState.files.delete('/workspace/.cherry-assets/image-1.png');
  });

  test('stores workspace uploads in a relative asset directory', async () => {
    const result = await uploadFileHandler(
      { requestId: 1, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
      mockState.uri('/workspace/docs/readme.md') as never,
    );

    expect(result.url).toBe('../.cherry-assets/image.png');
    expect(mockState.files.get('/workspace/.cherry-assets/image.png')).toEqual(new Uint8Array([1, 2, 3]));
  });

  test('avoids overwriting an existing workspace asset', async () => {
    mockState.files.set('/workspace/.cherry-assets/image.png', new Uint8Array([9]));

    const result = await uploadFileHandler(
      { requestId: 2, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
      mockState.uri('/workspace/docs/readme.md') as never,
    );

    expect(result.url).toBe('../.cherry-assets/image-1.png');
  });

  test('accepts supported remote response shapes', () => {
    expect(parseUploadResponse({ data: { url: 'https://cdn.example/image.png' } })).toBe(
      'https://cdn.example/image.png',
    );
  });
});
