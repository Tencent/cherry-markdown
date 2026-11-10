import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import axios from 'axios';
import { uploadFileHandler } from '../src/handler/uploadFile';
const state = vi.hoisted(() => ({
  user: {} as Record<string, unknown>,
  workspace: {} as Record<string, unknown>,
  folder: {} as Record<string, unknown>,
  trusted: true,
  readFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
  writeFile: vi.fn(),
  createDirectory: vi.fn(),
}));
vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('vscode', () => ({
  l10n: { t: (text: string) => text },
  FileType: { File: 1 },
  Uri: {
    file: (path: string) => ({ path }),
    joinPath: (base: { path: string }, ...parts: string[]) => ({ path: [base.path, ...parts].join('/') }),
  },
  workspace: {
    get isTrusted() {
      return state.trusted;
    },
    getConfiguration: () => ({
      get: (key: string) => state.folder[key] ?? state.workspace[key] ?? state.user[key],
      inspect: (key: string) => ({
        globalValue: state.user[key],
        workspaceValue: state.workspace[key],
        workspaceFolderValue: state.folder[key],
      }),
    }),
    getWorkspaceFolder: () => ({ uri: { path: '/workspace' } }),
    fs: {
      readFile: state.readFile,
      writeFile: state.writeFile,
      createDirectory: state.createDirectory,
      stat: vi.fn(async () => ({ type: 1, size: 3 })),
    },
  },
}));
const file = { requestId: 1, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 3 };
const resource = { path: '/workspace/A.md' } as never;
beforeEach(() => {
  state.user = {};
  state.workspace = {};
  state.folder = {};
  state.trusted = true;
  vi.clearAllMocks();
  vi.mocked(axios.post).mockResolvedValue({ data: { url: 'https://cdn.example/image.png' } });
});
describe('validation before file and network access', () => {
  test('retired settings never read bytes or issue a PicGo request', async () => {
    state.workspace.UploadType = 'PicGoServer';
    state.workspace.PicGoServer = 'https://legacy.example/upload';
    await expect(uploadFileHandler(file, resource)).rejects.toThrow('Legacy upload');
    expect(state.readFile).not.toHaveBeenCalled();
    expect(state.writeFile).not.toHaveBeenCalled();
    expect(state.createDirectory).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
  test('invalid folder settings never fall back to the user uploader', async () => {
    state.user.ImageUploadMode = 'remote';
    state.user.CustomUploader = { enable: true, url: 'https://user.example/upload' };
    state.folder.CustomUploader = { enable: true, url: 'invalid' };
    await expect(uploadFileHandler(file, resource)).rejects.toThrow('CustomUploader');
    expect(state.readFile).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
  test('unknown formats fail before file access and do not guess a PicGo protocol from its URL', async () => {
    state.user.ImageUploadMode = 'remote';
    state.user.CustomUploader = { enable: true, url: 'http://127.0.0.1:36677/upload', format: 'auto' };
    await expect(uploadFileHandler(file, resource)).rejects.toThrow('format');
    expect(state.readFile).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
  test('multipart uses the selected folder settings without global credentials or field name', async () => {
    state.user.ImageUploadMode = 'remote';
    state.user.CustomUploader = {
      enable: true,
      url: 'https://user.example/upload',
      format: 'multipart',
      fieldName: 'other',
      headers: { Authorization: 'global-secret' },
    };
    state.folder.CustomUploader = { enable: true, url: 'http://127.0.0.1:36677/upload', format: 'multipart' };
    await uploadFileHandler(file, resource);
    const [url, body, options] = vi.mocked(axios.post).mock.calls[0];
    expect(url).toBe('http://127.0.0.1:36677/upload');
    expect(options!.headers).not.toHaveProperty('Authorization');
    const form = await new Response(new Uint8Array(body as Buffer), {
      headers: options!.headers as Record<string, string>,
    }).formData();
    expect([...form.keys()]).toEqual(['files']);
    expect(Array.from(new Uint8Array(await (form.get('files') as File).arrayBuffer()))).toEqual([1, 2, 3]);
  });
  test('current configuration ignores retired keys and does not send an HTTP request in data mode', async () => {
    state.user.ImageUploadMode = 'data';
    state.workspace.UploadType = 'PicGoServer';
    expect((await uploadFileHandler(file, resource)).url).toBe('data:image/png;base64,AQID');
    expect(axios.post).not.toHaveBeenCalled();
  });
  test('folder uploader never inherits global authentication headers', async () => {
    state.user.ImageUploadMode = 'remote';
    state.user.CustomUploader = {
      enable: true,
      url: 'https://user.example/upload',
      headers: { Authorization: 'global-secret' },
    };
    state.folder.CustomUploader = {
      enable: true,
      url: 'https://folder.example/upload',
      headers: { 'X-Project': 'folder' },
    };
    await uploadFileHandler(file, resource);
    expect(axios.post).toHaveBeenCalledWith(
      'https://folder.example/upload',
      expect.any(Buffer),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': 'image.png', 'X-Project': 'folder' },
      }),
    );
  });
  test('Restricted Mode permits only the configured user uploader', async () => {
    state.trusted = false;
    state.user.ImageUploadMode = 'remote';
    state.user.CustomUploader = { enable: true, url: 'https://user.example/upload', headers: {} };
    state.workspace.CustomUploader = { enable: true, url: 'https://untrusted.example/upload' };
    await uploadFileHandler(file, resource);
    expect(axios.post).toHaveBeenCalledWith('https://user.example/upload', expect.any(Buffer), expect.any(Object));
  });
  test('blocked workspace uploads have no file or network side effects', async () => {
    state.trusted = false;
    state.workspace.ImageUploadMode = 'remote';
    state.workspace.CustomUploader = { enable: true, url: 'https://untrusted.example/upload' };
    await expect(uploadFileHandler(file, resource)).rejects.toThrow('Restricted Mode');
    expect(state.readFile).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
