import type { EditorState, WebviewToExtensionMessage } from '../../src/protocol';
import type { DocumentUploadRequest, DocumentUploadResult, UploadFileResult } from '../../src/types/upload';
import { replaceUploadPlaceholder } from '../../src/uploadAnchor';

interface UploadHooks {
  getState(): EditorState | undefined;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  postMessage(message: WebviewToExtensionMessage): void;
}

type UploadCallback = (url: string, properties: Omit<UploadFileResult, 'requestId' | 'url'>) => void;

export class DocumentUploads {
  private requestId = 0;
  private readonly pending = new Map<
    string,
    {
      request: DocumentUploadRequest;
      ready: boolean;
      acknowledged: boolean;
    }
  >();

  constructor(private readonly hooks: UploadHooks) {}

  start(file: File & { path?: string }, callback?: UploadCallback): void {
    const state = this.hooks.getState();
    if (!state || !callback) return;
    if (file.size > 50 * 1024 * 1024) {
      this.hooks.postMessage({ type: 'show-message', data: 'The upload file exceeds the 50 MB limit.' });
      return;
    }
    const placeholder = `cherry-upload:${crypto.randomUUID()}`;
    const pending = {
      request: {
        requestId: ++this.requestId,
        documentUri: state.documentUri,
        placeholder,
        name: file.name,
        type: file.type,
        size: file.size,
        path: file.path || '',
      } as DocumentUploadRequest,
      ready: Boolean(file.path),
      acknowledged: false,
    };
    this.pending.set(placeholder, pending);
    // This callback runs now, while its original document and selection are still active.
    callback(placeholder, { name: file.name, ...state.uploadImageProps });
    if (pending.ready) return;

    void file
      .arrayBuffer()
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        if (bytes.length !== file.size) throw new Error('The upload file changed while it was being read.');
        const chunks: string[] = [];
        for (let offset = 0; offset < bytes.length; offset += 32_768) {
          chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32_768)));
        }
        pending.request.base64 = btoa(chunks.join(''));
        pending.ready = true;
        this.dispatchReady();
      })
      .catch(() => {
        this.pending.delete(placeholder);
        this.hooks.postMessage({ type: 'show-message', data: 'Unable to read the upload file.' });
      });
  }

  acknowledge(documentUri: string, markdown: string): void {
    for (const [placeholder, pending] of this.pending) {
      if (pending.request.documentUri !== documentUri) continue;
      if (markdown.includes(`(${placeholder})`)) pending.acknowledged = true;
      else if (pending.acknowledged) this.pending.delete(placeholder);
    }
    this.dispatchReady();
  }

  discardUnacknowledged(documentUri: string): void {
    for (const [placeholder, pending] of this.pending) {
      if (pending.request.documentUri === documentUri && !pending.acknowledged) this.pending.delete(placeholder);
    }
  }

  applyResult(result: DocumentUploadResult): void {
    if (this.hooks.getState()?.documentUri === result.documentUri) {
      const markdown = replaceUploadPlaceholder(this.hooks.getMarkdown(), result.placeholder, result.url);
      if (markdown !== undefined) {
        // Replace the anchor in the current text, retaining any typing done during upload.
        this.hooks.setMarkdown(markdown);
      }
      // A local deletion/undo may not have reached the extension yet. Never restore that anchor.
      return;
    }
    // The extension owns the original document; never invoke an old Cherry selection callback.
    this.hooks.postMessage({ type: 'finish-upload', data: { placeholder: result.placeholder } });
  }

  private dispatchReady(): void {
    for (const [placeholder, pending] of this.pending) {
      if (!pending.ready || !pending.acknowledged) continue;
      this.pending.delete(placeholder);
      this.hooks.postMessage({ type: 'upload-file', data: pending.request });
    }
  }
}
