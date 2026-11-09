import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import axios from 'axios';
import { parseUploadResponse, uploadFileHandler } from '../src/handler/uploadFile';
import type { CustomUploader } from '../src/types/upload';

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
    customUploader: undefined as CustomUploader | undefined,
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
  getUploadConfiguration: () => ({
    mode: mockState.mode,
    uploader: mockState.customUploader,
    assetDirectory: mockState.assetDirectory,
    backfillImageProps: [],
  }),
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

  test('a queued asset save retains the directory selected before settings change', async () => {
    mockState.assetDirectory = 'selected-assets';
    const result = uploadFileHandler(
      { requestId: 30, name: 'queued.png', type: 'image/png', path: '', size: 3, base64: 'AQID' },
      mockState.uri('/workspace/readme.md') as never,
    );
    mockState.assetDirectory = 'later-assets';
    expect((await result).url).toBe('./selected-assets/queued.png');
    expect(Array.from(mockState.files.get('/workspace/selected-assets/queued.png')!)).toEqual([1, 2, 3]);
    expect(mockState.files.has('/workspace/later-assets/queued.png')).toBe(false);
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

  test('accepts Webview file bytes without a local path in workspace mode', async () => {
    const result = await uploadFileHandler(
      {
        requestId: 20,
        name: 'image.png',
        type: 'image/png',
        path: '',
        size: 3,
        base64: 'AQID',
      },
      mockState.uri('/workspace/readme.md') as never,
    );
    expect(result.url).toBe('./.cherry-assets/image.png');
    expect(Array.from(mockState.files.get('/workspace/.cherry-assets/image.png')!)).toEqual([1, 2, 3]);
  });

  test.each([
    { base64: 'not base64', size: 3 },
    { base64: 'AQID', size: 2 },
    { base64: 'AQID', size: 4 },
  ])('rejects malformed or mismatched Webview bytes %j', async (data) => {
    mockState.mode = 'data';
    await expect(
      uploadFileHandler({
        requestId: 21,
        name: 'image.png',
        type: 'image/png',
        path: '',
        ...data,
      }),
    ).rejects.toThrow('file data');
  });

  test('rejects Base64 uploads for non-image files', async () => {
    mockState.mode = 'data';

    await expect(
      uploadFileHandler({ requestId: 7, name: 'readme.txt', type: 'text/plain', path: '/tmp/image.png', size: 3 }),
    ).rejects.toThrow('Only images');
  });

  test.each([undefined, 'binary'] as const)('uploads binary data with format %s', async (format) => {
    mockState.mode = 'remote';
    mockState.customUploader = {
      enable: true,
      url: 'https://upload.example.test/images',
      format,
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
    [undefined, 'image.png'],
    ['image', 'image.png'],
    ['files[]', 'image.png'],
    ['files', '测试图片.png'],
  ] as const)('sends a real multipart file in field %s named %s', async (fieldName, fileName) => {
    mockState.mode = 'remote';
    mockState.customUploader = {
      enable: true,
      url: 'http://127.0.0.1:36677/upload',
      format: 'multipart',
      fieldName,
      headers: { Authorization: 'Bearer test-token', 'cOnTeNt-TyPe': 'application/json', 'CONTENT-LENGTH': '1' },
    };
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true, result: ['https://cdn.example/picgo.png'] } });
    const result = await uploadFileHandler({
      requestId: 40,
      name: fileName,
      type: 'image/png',
      path: '',
      base64: 'AQID',
      size: 3,
    });
    expect(result.url).toBe('https://cdn.example/picgo.png');
    const [, body, options] = vi.mocked(axios.post).mock.calls[0];
    const headers = options!.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-token');
    expect(headers['Content-Type']).toMatch(/^multipart\/form-data; boundary=.+$/);
    expect(headers).not.toHaveProperty('cOnTeNt-TyPe');
    expect(headers).not.toHaveProperty('CONTENT-LENGTH');
    expect(options!.maxBodyLength).toBe((body as Buffer).length);
    // Parse the encoded body with the runtime's independent standards-based form parser.
    const form = await new Response(new Uint8Array(body as Buffer), { headers }).formData();
    expect([...form.keys()]).toEqual([fieldName ?? 'files']);
    const file = form.get(fieldName ?? 'files') as File;
    expect(file.name).toBe(fileName);
    expect(file.type).toBe('image/png');
    expect(Array.from(new Uint8Array(await file.arrayBuffer()))).toEqual([1, 2, 3]);
  });

  test('multipart filenames and media types cannot inject part headers', async () => {
    mockState.mode = 'remote';
    mockState.customUploader = { enable: true, url: 'https://example.test/upload', format: 'multipart' };
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true, result: ['https://cdn.example/image.png'] } });
    await uploadFileHandler({
      requestId: 41,
      name: 'bad"\r\nname.png',
      type: 'image/png\r\nX-Injected: yes',
      path: '',
      base64: 'AQID',
      size: 3,
    });
    const [, body, options] = vi.mocked(axios.post).mock.calls[0];
    const form = await new Response(new Uint8Array(body as Buffer), {
      headers: options!.headers as Record<string, string>,
    }).formData();
    const file = form.get('files') as File;
    expect(file.name).toBe('bad___name.png');
    expect(file.type).toBe('application/octet-stream');
    expect((body as Buffer).toString()).not.toContain('X-Injected');
  });

  test('PicGo failure responses cannot be mistaken for a successful URL', () => {
    expect(() =>
      parseUploadResponse({ success: false, result: ['https://example.test/not-uploaded'], message: 'Upload denied' }),
    ).toThrow('Upload denied');
    expect(() => parseUploadResponse({ success: false, result: [] })).toThrow('reported failure');
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
