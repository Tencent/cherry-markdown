import { beforeEach, describe, expect, test, vi } from 'vitest';
import axios from 'axios';
import { parseUploadResponse, uploadFileHandler } from '../src/handler/uploadFile';

const mockState = vi.hoisted(() => {
  const files = new Map<string, Uint8Array>([['/tmp/image.png', new Uint8Array([1, 2, 3])]]);
  const reportedSizes = new Map<string, number>();
  const uri = (uriPath: string) => ({ path: uriPath, fsPath: uriPath, scheme: 'file' });
  const workspace = {
    fs: {
      stat: vi.fn(async (target: { path: string }) => {
        const file = files.get(target.path);
        if (!file) throw new Error('File not found');
        return { type: 1, size: reportedSizes.get(target.path) ?? file.length };
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
    getWorkspaceFolder: vi.fn(),
  };
  return {
    files,
    reportedSizes,
    uri,
    workspace,
    mode: 'workspace',
    customUploader: undefined as { enable: boolean; url: string; headers?: Record<string, string> } | undefined,
    assetDirectory: '.cherry-assets',
  };
});

vi.mock('axios', () => ({ default: { post: vi.fn() } }));

vi.mock('vscode', () => ({
  FileType: { File: 1 },
  Uri: {
    file: (uriPath: string) => mockState.uri(uriPath),
    joinPath: (base: { path: string }, ...segments: string[]) => mockState.uri([base.path, ...segments].join('/')),
  },
  workspace: mockState.workspace,
}));

vi.mock('../src/config', () => ({
  getAssetDirectory: () => mockState.assetDirectory,
  getBackfillImageProps: () => [],
  getCustomUploader: () => mockState.customUploader,
  getImageUploadMode: () => mockState.mode,
}));

describe('image upload handler', () => {
  beforeEach(() => {
    mockState.mode = 'workspace';
    mockState.customUploader = undefined;
    mockState.assetDirectory = '.cherry-assets';
    mockState.workspace.getWorkspaceFolder.mockReturnValue({ uri: mockState.uri('/workspace') });
    mockState.reportedSizes.clear();
    mockState.files.delete('/workspace/.cherry-assets/image.png');
    mockState.files.delete('/workspace/.cherry-assets/image-1.png');
    vi.mocked(axios.post).mockReset();
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

  test('serializes same-name workspace uploads', async () => {
    const results = await Promise.all([
      uploadFileHandler(
        { requestId: 13, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
        mockState.uri('/workspace/readme.md') as never,
      ),
      uploadFileHandler(
        { requestId: 14, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
        mockState.uri('/workspace/readme.md') as never,
      ),
    ]);

    expect(results.map(({ url }) => url)).toEqual(['./.cherry-assets/image.png', './.cherry-assets/image-1.png']);
  });

  test('sanitizes file names and configured asset directories', async () => {
    mockState.assetDirectory = 'assets/images';

    const result = await uploadFileHandler(
      { requestId: 3, name: '../unsafe:image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
      mockState.uri('/workspace/readme.md') as never,
    );

    expect(result.url).toBe('./assets/images/unsafe_image.png');
    expect(mockState.files.get('/workspace/assets/images/unsafe_image.png')).toEqual(new Uint8Array([1, 2, 3]));
  });

  test('rejects local uploads without a document or workspace', async () => {
    await expect(
      uploadFileHandler(
        { requestId: 4, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
        undefined,
      ),
    ).rejects.toThrow('Markdown document');

    mockState.workspace.getWorkspaceFolder.mockReturnValue(undefined);
    await expect(
      uploadFileHandler(
        { requestId: 5, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
        mockState.uri('/tmp/readme.md') as never,
      ),
    ).rejects.toThrow('Open a workspace');
  });

  test('supports Base64 image uploads without an uploader', async () => {
    mockState.mode = 'data';

    const result = await uploadFileHandler({
      requestId: 6,
      name: 'image.png',
      type: 'image/png',
      path: '/tmp/image.png',
      size: 3,
    });

    expect(result.url).toBe('data:image/png;base64,AQID');
  });

  test('rejects Base64 uploads for non-image files', async () => {
    mockState.mode = 'data';

    await expect(
      uploadFileHandler({ requestId: 7, name: 'readme.txt', type: 'text/plain', path: '/tmp/image.png', size: 3 }),
    ).rejects.toThrow('Only images');
  });

  test('uploads binary data through the configured HTTP uploader', async () => {
    mockState.mode = 'remote';
    mockState.customUploader = {
      enable: true,
      url: 'https://upload.example.test/images',
      headers: { Authorization: 'Bearer token' },
    };
    vi.mocked(axios.post).mockResolvedValue({ data: { data: { url: 'https://cdn.example/image.png' } } });

    const result = await uploadFileHandler({
      requestId: 8,
      name: 'image.png',
      type: 'image/png',
      path: '/tmp/image.png',
      size: 3,
    });

    expect(result.url).toBe('https://cdn.example/image.png');
    expect(axios.post).toHaveBeenCalledWith(
      'https://upload.example.test/images',
      Buffer.from([1, 2, 3]),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'Content-Type': 'application/octet-stream',
          'X-File-Name': 'image.png',
        }),
      }),
    );
  });

  test.each([
    [undefined, 'Custom uploader is not configured'],
    [{ enable: false, url: 'https://upload.example.test' }, 'Custom uploader is not configured'],
    [{ enable: true, url: 'ftp://upload.example.test' }, 'must use HTTP or HTTPS'],
  ])('rejects invalid remote uploader configuration', async (customUploader, message) => {
    mockState.mode = 'remote';
    mockState.customUploader = customUploader as typeof mockState.customUploader;

    await expect(
      uploadFileHandler({ requestId: 9, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 }),
    ).rejects.toThrow(message);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('rejects changed or oversized local files before upload', async () => {
    mockState.reportedSizes.set('/tmp/image.png', 4);
    await expect(
      uploadFileHandler(
        { requestId: 10, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
        mockState.uri('/workspace/readme.md') as never,
      ),
    ).rejects.toThrow('changed');

    mockState.reportedSizes.set('/tmp/image.png', 50 * 1024 * 1024 + 1);
    await expect(
      uploadFileHandler(
        {
          requestId: 11,
          name: 'image.png',
          type: 'image/png',
          path: '/tmp/image.png',
          size: 50 * 1024 * 1024 + 1,
        },
        mockState.uri('/workspace/readme.md') as never,
      ),
    ).rejects.toThrow('50 MB');

    mockState.reportedSizes.clear();
    mockState.files.set('/tmp/image.png', new Uint8Array([1, 2, 3, 4]));
    mockState.reportedSizes.set('/tmp/image.png', 3);
    await expect(
      uploadFileHandler(
        { requestId: 12, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 },
        mockState.uri('/workspace/readme.md') as never,
      ),
    ).rejects.toThrow('changed while');
    mockState.files.set('/tmp/image.png', new Uint8Array([1, 2, 3]));
  });

  test('accepts supported remote response shapes', () => {
    expect(parseUploadResponse({ data: { url: 'https://cdn.example/image.png' } })).toBe(
      'https://cdn.example/image.png',
    );
  });

  test.each([
    'not-a-url',
    'https://',
    'https://cdn.example/image).png',
    { url: 'javascript:alert(1)' },
    { data: { url: 'ftp://cdn.example/image.png' } },
  ])('rejects unsupported remote response %j', (response) => {
    expect(() => parseUploadResponse(response)).toThrow('supported URL');
  });
});
