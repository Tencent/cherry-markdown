import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import type { EditorState, WebviewToExtensionMessage } from '../src/protocol';
import { DocumentUploads } from '../web-resources/scripts/uploads';

const placeholder = 'cherry-upload:11111111-1111-4111-8111-111111111111';
const state = { documentUri: 'file:///A.md', uploadImageProps: { isBorder: true } } as EditorState;

function fixture() {
  let currentState = state;
  let markdown = 'before ';
  const messages: WebviewToExtensionMessage[] = [];
  const setMarkdown = vi.fn((text: string) => {
    markdown = text;
  });
  const uploads = new DocumentUploads({
    getState: () => currentState,
    getMarkdown: () => markdown,
    setMarkdown,
    postMessage: (message) => messages.push(message),
  });
  const callback = vi.fn((url: string) => {
    markdown += `![image](${url})`;
  });
  const file = { name: 'image.png', size: 3, type: 'image/png', path: '/tmp/image.png' } as File & { path: string };
  const result = { requestId: 1, name: 'image.png', url: './image.png', documentUri: state.documentUri, placeholder };
  return {
    uploads,
    callback,
    file,
    result,
    messages,
    setMarkdown,
    text: () => markdown,
    edit: (text: string) => {
      markdown = text;
    },
    switchTo: (uri: string, text: string) => {
      currentState = { ...state, documentUri: uri };
      markdown = text;
    },
  };
}

describe('Webview document uploads', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', { randomUUID: () => placeholder.slice('cherry-upload:'.length) });
  });

  test('inserts the placeholder synchronously and uploads only after the source document acknowledges it', () => {
    const f = fixture();
    f.uploads.start(f.file, f.callback);
    expect(f.callback).toHaveBeenCalledWith(placeholder, { name: 'image.png', isBorder: true });
    expect(f.messages).toEqual([]);
    f.uploads.acknowledge('file:///B.md', f.text());
    expect(f.messages).toEqual([]);
    f.uploads.acknowledge(state.documentUri, f.text());
    expect(f.messages).toEqual([
      {
        type: 'upload-file',
        data: expect.objectContaining({
          documentUri: state.documentUri,
          placeholder,
          path: '/tmp/image.png',
        }),
      },
    ]);
  });

  test('A → B: an upload result never invokes the original selection callback or modifies B', () => {
    const f = fixture();
    f.uploads.start(f.file, f.callback);
    f.switchTo('file:///B.md', 'B untouched');
    f.uploads.applyResult(f.result);
    expect(f.callback).toHaveBeenCalledTimes(1);
    expect(f.setMarkdown).not.toHaveBeenCalled();
    expect(f.text()).toBe('B untouched');
    expect(f.messages).toContainEqual({ type: 'finish-upload', data: { placeholder } });
  });

  test('a source state refresh before editor-ack starts the synchronized upload exactly once', () => {
    const f = fixture();
    f.uploads.start(f.file, f.callback);
    f.uploads.synchronize(state.documentUri, f.text());
    f.uploads.acknowledge(state.documentUri, f.text());
    expect(f.messages).toHaveLength(1);
    expect(f.messages[0]).toMatchObject({ type: 'upload-file', data: { documentUri: state.documentUri } });
  });

  test('a state refresh retains a synchronized upload until its file bytes are ready', async () => {
    const f = fixture();
    let resolveRead!: (data: ArrayBuffer) => void;
    f.uploads.start(
      {
        ...f.file,
        path: '',
        arrayBuffer: () =>
          new Promise<ArrayBuffer>((r) => {
            resolveRead = r;
          }),
      },
      f.callback,
    );
    f.uploads.synchronize(state.documentUri, f.text());
    expect(f.messages).toEqual([]);
    resolveRead(new Uint8Array([1, 2, 3]).buffer);
    await Promise.resolve();
    expect(f.messages).toEqual([
      expect.objectContaining({ type: 'upload-file', data: expect.objectContaining({ base64: 'AQID' }) }),
    ]);
  });

  test('a state refresh without the pending anchor still cancels its upload', () => {
    const f = fixture();
    f.uploads.start(f.file, f.callback);
    f.uploads.synchronize(state.documentUri, 'external edit removed the anchor');
    f.uploads.acknowledge(state.documentUri, f.text());
    expect(f.messages).toEqual([]);
  });

  test('A → B → A: replaces the unique anchor and retains new typing, rather than using the current selection', () => {
    const f = fixture();
    f.uploads.start(f.file, f.callback);
    const a = f.text();
    f.switchTo('file:///B.md', 'B');
    f.switchTo(state.documentUri, `new prefix ${a} new suffix`);
    f.uploads.applyResult(f.result);
    expect(f.text()).toBe('new prefix before ![image](./image.png) new suffix');
    expect(f.callback).toHaveBeenCalledTimes(1);
  });

  test('does not resurrect an anchor undone locally before its deletion has synchronized', () => {
    const f = fixture();
    f.uploads.start(f.file, f.callback);
    f.edit('undo removed the image');
    f.uploads.applyResult(f.result);
    expect(f.setMarkdown).not.toHaveBeenCalled();
    expect(f.messages).toEqual([]);
  });

  test('cancels an upload whose placeholder was never synchronized before switching documents', () => {
    const f = fixture();
    f.uploads.start(f.file, f.callback);
    f.uploads.discardUnacknowledged(state.documentUri);
    f.uploads.acknowledge(state.documentUri, f.text());
    expect(f.messages).toEqual([]);
  });

  test('transfers file bytes without relying on File.path, even when reading finishes after switching documents', async () => {
    const f = fixture();
    let resolveRead!: (data: ArrayBuffer) => void;
    const file = {
      ...f.file,
      path: undefined,
      arrayBuffer: () =>
        new Promise<ArrayBuffer>((r) => {
          resolveRead = r;
        }),
    };
    f.uploads.start(file, f.callback);
    f.uploads.acknowledge(state.documentUri, f.text());
    f.switchTo('file:///B.md', 'B untouched');
    resolveRead(new Uint8Array([1, 2, 3]).buffer);
    await Promise.resolve();
    expect(f.messages).toEqual([
      {
        type: 'upload-file',
        data: expect.objectContaining({
          documentUri: state.documentUri,
          placeholder,
          path: '',
          base64: 'AQID',
        }),
      },
    ]);
    expect(f.text()).toBe('B untouched');
  });
});
