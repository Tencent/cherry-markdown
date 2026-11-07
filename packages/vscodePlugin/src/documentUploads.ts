import type * as vscode from 'vscode';
import type { DocumentUploadRequest, DocumentUploadResult, UploadFileResult } from './types/upload';
import { findUploadPlaceholder } from './uploadAnchor';

type UploadDocument = Pick<vscode.TextDocument, 'uri' | 'isClosed' | 'getText'>;

interface UploadHost {
  findDocument(uri: string): UploadDocument | undefined;
  upload(request: DocumentUploadRequest, uri: vscode.Uri): Promise<UploadFileResult>;
  isPreviewing(document: UploadDocument): boolean;
  publish(result: DocumentUploadResult): Promise<boolean>;
  replace(document: UploadDocument, offset: number, length: number, url: string): Promise<boolean>;
  enqueue(operation: () => Promise<void>): Promise<void>;
}

interface PendingUpload {
  document: UploadDocument;
  result?: DocumentUploadResult;
}

/** Holds the original open document, rather than resolving the active editor after an await. */
export class DocumentUploadManager {
  private readonly pending = new Map<string, PendingUpload>();

  constructor(private readonly host: UploadHost) {}

  async start(request: DocumentUploadRequest): Promise<void> {
    const document = this.host.findDocument(request.documentUri);
    if (
      !document ||
      document.isClosed ||
      findUploadPlaceholder(document.getText(), request.placeholder) === undefined
    ) {
      return;
    }
    if (this.pending.has(request.placeholder)) return;
    const pending: PendingUpload = { document };
    this.pending.set(request.placeholder, pending);
    try {
      const result = await this.host.upload(request, document.uri);
      if (this.pending.get(request.placeholder) !== pending) return;
      if (document.isClosed || findUploadPlaceholder(document.getText(), request.placeholder) === undefined) {
        this.pending.delete(request.placeholder);
        return;
      }
      pending.result = { ...result, documentUri: request.documentUri, placeholder: request.placeholder };
      // The active Webview merges into its latest text so in-flight typing is preserved.
      if (this.host.isPreviewing(document) && (await this.host.publish(pending.result))) return;
      await this.finish(request.placeholder);
    } catch (error) {
      this.pending.delete(request.placeholder);
      throw error;
    }
  }

  async finish(placeholder: string): Promise<void> {
    await this.host.enqueue(async () => {
      const pending = this.pending.get(placeholder);
      if (!pending?.result) return;
      this.pending.delete(placeholder);
      const { document, result } = pending;
      if (document.isClosed) return;
      const offset = findUploadPlaceholder(document.getText(), placeholder);
      if (offset === undefined) return;
      if (!(await this.host.replace(document, offset, placeholder.length, result.url))) {
        throw new Error('Unable to insert the upload result into its original document.');
      }
    });
  }

  async finishInactive(): Promise<void> {
    await Promise.all(
      [...this.pending]
        .filter(([, pending]) => pending.result && !this.host.isPreviewing(pending.document))
        .map(([placeholder]) => this.finish(placeholder)),
    );
  }

  documentChanged(document: UploadDocument): void {
    for (const [placeholder, pending] of this.pending) {
      if (
        pending.document === document &&
        (document.isClosed || findUploadPlaceholder(document.getText(), placeholder) === undefined)
      ) {
        this.pending.delete(placeholder);
      }
    }
  }
}
