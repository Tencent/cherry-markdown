import { describe, expect, test, vi } from 'vite-plus/test';
import type * as vscode from 'vscode';
import { DocumentUploadManager } from '../src/documentUploads';
import { findUploadPlaceholder, replaceUploadPlaceholder } from '../src/uploadAnchor';
import type { DocumentUploadRequest, UploadFileResult } from '../src/types/upload';

const placeholder = 'cherry-upload:11111111-1111-4111-8111-111111111111';
const markdown = `before ![image](${placeholder}) after`;

function fixture() {
  const a = {
    uri: { toString: () => 'vscode-remote://ssh-remote+host/home/user/A.md' } as vscode.Uri,
    text: markdown,
    isClosed: false,
    getText() {
      return this.text;
    },
  };
  const b = { ...a, uri: { toString: () => 'file:///B.md' } as vscode.Uri, text: 'B untouched' };
  let active = a;
  let resolveUpload!: (result: UploadFileResult) => void;
  const upload = vi.fn(
    () =>
      new Promise<UploadFileResult>((resolve) => {
        resolveUpload = resolve;
      }),
  );
  const publish = vi.fn(async () => true);
  const replace = vi.fn(async (document: typeof a, offset: number, length: number, url: string) => {
    document.text = document.text.slice(0, offset) + url + document.text.slice(offset + length);
    return true;
  });
  let queue = Promise.resolve();
  const manager = new DocumentUploadManager({
    findDocument: (uri) => [a, b].find((document) => document.uri.toString() === uri),
    upload,
    publish,
    replace,
    isPreviewing: (document) => document === active,
    enqueue: (operation) => {
      queue = queue.then(operation);
      return queue;
    },
  });
  const request: DocumentUploadRequest = {
    requestId: 1,
    name: 'image.png',
    type: 'image/png',
    path: '',
    size: 3,
    base64: 'AQID',
    documentUri: a.uri.toString(),
    placeholder,
  };
  return {
    a,
    b,
    manager,
    request,
    upload,
    publish,
    replace,
    activate: (document: typeof a) => {
      active = document;
    },
    resolve: () => resolveUpload({ requestId: 1, name: 'image.png', url: '../assets/image.png' }),
  };
}

describe('document-bound uploads', () => {
  test('failed upload clears its URL in A after switching to B, preserving labels and edits', async () => {
    const f = fixture();
    f.upload.mockRejectedValue(new Error('Upload rejected'));
    f.activate(f.b);
    f.a.text = `new prefix\n${markdown}\nnew suffix`;
    await expect(f.manager.start(f.request)).rejects.toThrow('Upload rejected');
    expect(f.a.text).toBe('new prefix\nbefore ![image]() after\nnew suffix');
    expect(f.b.text).toBe('B untouched');
  });

  test('failed upload uses the existing Webview merge path for an active document', async () => {
    const f = fixture();
    f.upload.mockRejectedValue(new Error('Upload rejected'));
    await expect(f.manager.start(f.request)).rejects.toThrow('Upload rejected');
    expect(f.publish).toHaveBeenCalledWith(expect.objectContaining({ placeholder, url: '' }));
    expect(f.replace).not.toHaveBeenCalled();
    f.activate(f.b);
    await f.manager.finishInactive();
    expect(f.a.text).toBe('before ![image]() after');
  });

  test.each(['deleted', 'duplicated', 'closed'] as const)(
    'failed upload leaves a %s target untouched',
    async (reason) => {
      const f = fixture();
      let rejectUpload!: (error: Error) => void;
      f.upload.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectUpload = reject;
          }),
      );
      const task = f.manager.start(f.request);
      const rejected = expect(task).rejects.toThrow('Upload rejected');
      if (reason === 'deleted') f.a.text = 'user removed the image';
      if (reason === 'duplicated') f.a.text += markdown;
      if (reason === 'closed') f.a.isClosed = true;
      f.manager.documentChanged(f.a);
      const { text } = f.a;
      rejectUpload(new Error('Upload rejected'));
      await rejected;
      expect(f.a.text).toBe(text);
      expect(f.publish).not.toHaveBeenCalled();
      expect(f.replace).not.toHaveBeenCalled();
    },
  );

  test('A → B: finishes only in A, using its captured remote URI and latest anchor position', async () => {
    const f = fixture();
    const task = f.manager.start(f.request);
    f.a.text = `new prefix\n${markdown}\nnew suffix`;
    f.activate(f.b);
    f.resolve();
    await task;
    expect(f.upload).toHaveBeenCalledWith(f.request, f.a.uri);
    expect(f.a.text).toBe('new prefix\nbefore ![image](../assets/image.png) after\nnew suffix');
    expect(f.b.text).toBe('B untouched');
    expect(f.publish).not.toHaveBeenCalled();
  });

  test('A → B → A: publishes an anchored result instead of calling the old selection callback', async () => {
    const f = fixture();
    const task = f.manager.start(f.request);
    f.activate(f.b);
    f.activate(f.a);
    f.resolve();
    await task;
    expect(f.replace).not.toHaveBeenCalled();
    expect(f.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        documentUri: f.a.uri.toString(),
        placeholder,
        url: '../assets/image.png',
      }),
    );
  });

  test.each(['deleted', 'duplicated', 'closed'] as const)('does not insert when the target is %s', async (reason) => {
    const f = fixture();
    const task = f.manager.start(f.request);
    f.activate(f.b);
    if (reason === 'deleted') f.a.text = 'undo removed the image';
    if (reason === 'duplicated') f.a.text += markdown;
    if (reason === 'closed') f.a.isClosed = true;
    f.manager.documentChanged(f.a);
    f.resolve();
    await task;
    expect(f.replace).not.toHaveBeenCalled();
    expect(f.publish).not.toHaveBeenCalled();
    expect(f.b.text).toBe('B untouched');
  });

  test('switches documents after publishing but before the Webview applies the result', async () => {
    const f = fixture();
    const task = f.manager.start(f.request);
    f.resolve();
    await task;
    f.activate(f.b);
    await f.manager.finishInactive();
    await f.manager.finish(placeholder); // A delayed fallback message cannot insert twice.
    expect(f.replace).toHaveBeenCalledTimes(1);
    expect(f.a.text).toBe('before ![image](../assets/image.png) after');
    expect(f.b.text).toBe('B untouched');
  });

  test('falls back to the original document when the Webview cannot receive the result', async () => {
    const f = fixture();
    f.publish.mockResolvedValue(false);
    const task = f.manager.start(f.request);
    f.resolve();
    await task;
    expect(f.replace).toHaveBeenCalledTimes(1);
  });

  test('rejects requests for another document or a missing anchor before reading any file', async () => {
    const f = fixture();
    await f.manager.start({ ...f.request, documentUri: f.b.uri.toString() });
    await f.manager.start({ ...f.request, documentUri: 'file:///closed.md' });
    expect(f.upload).not.toHaveBeenCalled();
  });

  test('does not resurrect an anchor removed after the result was published', async () => {
    const f = fixture();
    const task = f.manager.start(f.request);
    f.resolve();
    await task;
    f.a.text = '';
    f.manager.documentChanged(f.a);
    f.activate(f.b);
    await f.manager.finishInactive();
    expect(f.replace).not.toHaveBeenCalled();
  });

  test('two uploads with identical file names can finish in reverse order without replacing each other', async () => {
    const f = fixture();
    const second = 'cherry-upload:22222222-2222-4222-8222-222222222222';
    f.a.text = `![first](${placeholder}) ![second](${second})`;
    const resolvers: Array<(result: UploadFileResult) => void> = [];
    f.upload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const firstTask = f.manager.start(f.request);
    const secondTask = f.manager.start({ ...f.request, requestId: 2, placeholder: second });
    f.activate(f.b);
    resolvers[1]({ requestId: 2, name: 'image.png', url: './image-1.png' });
    await secondTask;
    resolvers[0]({ requestId: 1, name: 'image.png', url: './image.png' });
    await firstTask;
    expect(f.a.text).toBe('![first](./image.png) ![second](./image-1.png)');
    expect(f.b.text).toBe('B untouched');
  });
});

describe('upload anchors', () => {
  test('replaces only a unique complete Markdown URL, preserving the surrounding text', () => {
    expect(replaceUploadPlaceholder(markdown, placeholder, './image.png')).toBe('before ![image](./image.png) after');
    expect(findUploadPlaceholder(`${markdown}\n${markdown}`, placeholder)).toBeUndefined();
    expect(findUploadPlaceholder(`plain ${placeholder}`, placeholder)).toBeUndefined();
    expect(findUploadPlaceholder(markdown, '')).toBeUndefined();
  });
});
