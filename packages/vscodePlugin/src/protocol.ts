import type { CherryTheme } from './config';
import type { UploadFileRequest, UploadFileResult } from './types/upload';

export interface EditorState {
  text: string;
  theme: CherryTheme;
  documentUri: string;
  documentVersion: number;
  resourceUri: string;
  vscodeLanguage: string;
  labels: WebviewLabels;
}

export interface WebviewLabels {
  edit: string;
  fontStyle: string;
  save: string;
  savePng: string;
  editDisabled: string;
}

export type ExtensionToWebviewMessage =
  | { cmd: 'editor-init'; data: EditorState }
  | { cmd: 'editor-change'; data: EditorState }
  | { cmd: 'editor-ack'; data: { requestId: number; documentVersion: number; text: string } }
  | { cmd: 'editor-scroll'; data: number }
  | { cmd: 'disable-edit'; data: Record<string, never> }
  | { cmd: 'enable-edit'; data: Record<string, never> }
  | { cmd: 'upload-file-result'; data: UploadFileResult }
  | { cmd: 'operation-error'; data: { operation: string; message: string; requestId?: number } };

export type WebviewToExtensionMessage =
  | { type: 'ready'; data?: undefined }
  | { type: 'preview-scroll'; data: number }
  | { type: 'change-theme'; data: CherryTheme }
  | {
      type: 'editor-change';
      data: { documentUri: string; baseVersion: number; requestId: number; markdown: string };
    }
  | { type: 'show-message'; data: string }
  | { type: 'upload-file'; data: UploadFileRequest }
  | { type: 'open-url'; data: string }
  | { type: 'export-png'; data: string };

const themes: CherryTheme[] = ['default', 'dark', 'gray', 'abyss', 'green', 'red', 'violet', 'blue'];
const MAX_PNG_MESSAGE_LENGTH = Math.ceil((50 * 1024 * 1024 * 4) / 3) + 'data:image/png;base64,'.length;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isUploadFileRequest(value: unknown): value is UploadFileRequest {
  return (
    isRecord(value) &&
    isFiniteNonNegativeNumber(value.requestId) &&
    typeof value.name === 'string' &&
    value.name.length <= 1024 &&
    typeof value.type === 'string' &&
    typeof value.path === 'string' &&
    value.path.length <= 32_768 &&
    isFiniteNonNegativeNumber(value.size)
  );
}

export function parseWebviewMessage(value: unknown): WebviewToExtensionMessage | undefined {
  if (!isRecord(value) || typeof value.type !== 'string') return undefined;

  switch (value.type) {
    case 'ready':
      return value.data === undefined ? { type: 'ready' } : undefined;
    case 'preview-scroll':
      return typeof value.data === 'number' && Number.isFinite(value.data)
        ? { type: value.type, data: value.data }
        : undefined;
    case 'change-theme':
      return themes.includes(value.data as CherryTheme)
        ? { type: value.type, data: value.data as CherryTheme }
        : undefined;
    case 'editor-change':
      return isRecord(value.data) &&
        typeof value.data.documentUri === 'string' &&
        value.data.documentUri.length > 0 &&
        isFiniteNonNegativeNumber(value.data.baseVersion) &&
        isFiniteNonNegativeNumber(value.data.requestId) &&
        typeof value.data.markdown === 'string'
        ? {
            type: value.type,
            data: {
              documentUri: value.data.documentUri,
              baseVersion: value.data.baseVersion,
              requestId: value.data.requestId,
              markdown: value.data.markdown,
            },
          }
        : undefined;
    case 'show-message':
      return typeof value.data === 'string' && value.data.length <= 2000
        ? { type: value.type, data: value.data }
        : undefined;
    case 'open-url':
      return typeof value.data === 'string' && value.data.length <= 32_768
        ? { type: value.type, data: value.data }
        : undefined;
    case 'upload-file':
      return isUploadFileRequest(value.data) ? { type: value.type, data: value.data } : undefined;
    case 'export-png':
      return typeof value.data === 'string' &&
        value.data.length <= MAX_PNG_MESSAGE_LENGTH &&
        (value.data === 'export-fail' || value.data.startsWith('data:image/png;base64,'))
        ? { type: value.type, data: value.data }
        : undefined;
    default:
      return undefined;
  }
}
