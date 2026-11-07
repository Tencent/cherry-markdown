import axios from 'axios';
import { randomBytes } from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';
import { getUploadConfiguration } from '../config';
import type { CustomUploader, UploadFileRequest, UploadFileResult } from '../types/upload';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 30_000;

function parseHttpUrl(value: string, settingName: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${settingName} must be a valid URL.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${settingName} must use HTTP or HTTPS.`);
  }
  return url;
}

function normalizeHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const headers: Record<string, string> = {};
  for (const [key, headerValue] of Object.entries(value)) {
    if (typeof headerValue !== 'string') throw new Error(`Upload header "${key}" must be a string.`);
    if (/\r|\n/.test(key) || /\r|\n/.test(headerValue)) throw new Error('Upload headers cannot contain newlines.');
    headers[key] = headerValue;
  }
  return headers;
}

function isAllowedResultUrl(value: string): boolean {
  if (/[\u0000-\u001f()[\]<>\\]/.test(value)) return false;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return Boolean(url.hostname);
    } catch {
      return false;
    }
  }
  return /^data:image\/[a-z\d.+-]+;base64,[A-Za-z\d+/]*={0,2}$/i.test(value);
}

export function parseUploadResponse(data: unknown): string {
  const candidates: unknown[] = [];
  if (typeof data === 'string') {
    candidates.push(data);
  } else if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (record.success === false) {
      throw new Error(
        typeof record.message === 'string'
          ? `Upload server rejected the file: ${record.message}`
          : 'Upload server reported failure.',
      );
    }
    candidates.push(record.url);
    if (Array.isArray(record.result)) candidates.push(record.result[0]);
    if (typeof record.data === 'string') {
      candidates.push(record.data);
    } else if (record.data && typeof record.data === 'object') {
      candidates.push((record.data as Record<string, unknown>).url);
    }
    candidates.push(...Object.values(record));
  }

  const url = candidates.find((candidate): candidate is string => {
    return typeof candidate === 'string' && isAllowedResultUrl(candidate);
  });
  if (!url) throw new Error('The upload response does not contain a supported URL.');
  return url;
}

async function validateUploadFile(fileInfo: UploadFileRequest): Promise<vscode.Uri> {
  if (!fileInfo.path || !pathIsAbsolute(fileInfo.path)) throw new Error('The upload file path is invalid.');
  const uri = vscode.Uri.file(fileInfo.path);
  const stat = await vscode.workspace.fs.stat(uri);
  if ((stat.type & vscode.FileType.File) === 0) throw new Error('The upload target is not a file.');
  if (stat.size > MAX_UPLOAD_BYTES || fileInfo.size > MAX_UPLOAD_BYTES) {
    throw new Error('The upload file exceeds the 50 MB limit.');
  }
  if (fileInfo.size > 0 && stat.size !== fileInfo.size) throw new Error('The upload file changed before it was read.');
  return uri;
}

function pathIsAbsolute(value: string): boolean {
  return path.posix.isAbsolute(value) || path.win32.isAbsolute(value);
}

async function readUploadFile(fileInfo: UploadFileRequest): Promise<Uint8Array> {
  if (fileInfo.base64 !== undefined) {
    if (
      fileInfo.base64.length > Math.ceil(MAX_UPLOAD_BYTES / 3) * 4 ||
      fileInfo.base64.length % 4 !== 0 ||
      !/^[A-Za-z\d+/]*={0,2}$/.test(fileInfo.base64)
    ) {
      throw new Error('The upload file data is invalid.');
    }
    const bytes = Buffer.from(fileInfo.base64, 'base64');
    if (bytes.length > MAX_UPLOAD_BYTES || bytes.length !== fileInfo.size) {
      throw new Error('The upload file data does not match its size.');
    }
    return bytes;
  }
  const file = await vscode.workspace.fs.readFile(await validateUploadFile(fileInfo));
  if (file.length > MAX_UPLOAD_BYTES) throw new Error('The upload file exceeds the 50 MB limit.');
  if (fileInfo.size > 0 && file.length !== fileInfo.size) {
    throw new Error('The upload file changed while it was being read.');
  }
  return file;
}

function safeFileName(fileInfo: UploadFileRequest): string {
  const sourceName = (fileInfo.name || path.posix.basename(fileInfo.path.replace(/\\/g, '/'))).trim();
  const fileName = path.posix.basename(sourceName).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_');
  return fileName || 'image';
}

function encodeRemoteUpload(file: Uint8Array, fileInfo: UploadFileRequest, uploader: CustomUploader) {
  const headers = normalizeHeaders(uploader.headers);
  if (uploader.format !== 'multipart') {
    if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/octet-stream';
    if (!headers['X-File-Name'] && !headers['x-file-name']) headers['X-File-Name'] = fileInfo.name;
    return { body: Buffer.from(file), headers };
  }
  // Encode a single file, not a path or clipboard request. This also works across remote hosts.
  const boundary = `cherry-${randomBytes(16).toString('hex')}`;
  const mimeType = /^[\w!#$&^.+-]+\/[\w!#$&^.+-]+(?![\s\S])/.test(fileInfo.type)
    ? fileInfo.type
    : 'application/octet-stream';
  const prefix = `--${boundary}\r\nContent-Disposition: form-data; name="${uploader.fieldName ?? 'files'}"; filename="${safeFileName(fileInfo)}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const body = Buffer.concat([Buffer.from(prefix), Buffer.from(file), Buffer.from(`\r\n--${boundary}--\r\n`)]);
  // The encoder owns boundary and length; user headers must not corrupt the multipart framing.
  for (const key of Object.keys(headers)) {
    if (['content-type', 'content-length'].includes(key.toLowerCase())) delete headers[key];
  }
  headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
  return { body, headers };
}

function splitFileName(fileName: string): { stem: string; extension: string } {
  const parsed = path.posix.parse(fileName);
  return { stem: parsed.name || 'image', extension: parsed.ext };
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function nextAssetUri(directory: vscode.Uri, fileName: string): Promise<vscode.Uri> {
  const { stem, extension } = splitFileName(fileName);
  let index = 0;
  while (true) {
    const candidateName = index === 0 ? `${stem}${extension}` : `${stem}-${index}${extension}`;
    const candidate = vscode.Uri.joinPath(directory, candidateName);
    if (!(await fileExists(candidate))) return candidate;
    index += 1;
  }
}

function relativeAssetPath(document: vscode.Uri, asset: vscode.Uri): string {
  const relative = path.posix.relative(path.posix.dirname(document.path), asset.path).replace(/\\/g, '/');
  const encoded = relative.split('/').map(encodeURIComponent).join('/');
  return relative.startsWith('..') ? encoded : `./${encoded}`;
}

let workspaceUploadQueue: Promise<void> = Promise.resolve();

async function saveWorkspaceAsset(
  fileInfo: UploadFileRequest,
  resource: vscode.Uri | undefined,
  directory: string,
): Promise<string> {
  if (!resource) throw new Error('A Markdown document is required to save workspace assets.');
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource);
  if (!workspaceFolder) {
    throw new Error('Open a workspace to save uploaded files locally.');
  }

  const source = await readUploadFile(fileInfo);
  const assetDirectory = vscode.Uri.joinPath(workspaceFolder.uri, ...directory.split('/'));
  await vscode.workspace.fs.createDirectory(assetDirectory);
  const assetUri = await nextAssetUri(assetDirectory, safeFileName(fileInfo));
  await vscode.workspace.fs.writeFile(assetUri, source);
  return relativeAssetPath(resource, assetUri);
}

function queueWorkspaceAssetSave(
  fileInfo: UploadFileRequest,
  resource: vscode.Uri | undefined,
  directory: string,
): Promise<string> {
  const task = workspaceUploadQueue.then(() => saveWorkspaceAsset(fileInfo, resource, directory));
  workspaceUploadQueue = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

export const uploadFileHandler = async (
  fileInfo: UploadFileRequest,
  resource?: vscode.Uri,
): Promise<UploadFileResult> => {
  const { requestId, name = '', type = '' } = fileInfo;
  // Validate the selected settings before reading bytes, copying assets or starting a network request.
  const settings = getUploadConfiguration(resource);
  const uploadMode = settings.mode;
  const result: UploadFileResult = { requestId, name, url: '' };
  for (const property of settings.backfillImageProps) result[property] = true;

  switch (uploadMode) {
    case 'workspace': {
      result.url = await queueWorkspaceAssetSave(fileInfo, resource, settings.assetDirectory);
      break;
    }
    case 'remote': {
      const customUploader = settings.uploader;
      if (customUploader?.enable !== true || !customUploader.url) {
        throw new Error('Custom uploader is not configured.');
      }
      const uploadUrl = parseHttpUrl(customUploader.url, 'Custom uploader URL');
      const file = await readUploadFile(fileInfo);
      const { body, headers } = encodeRemoteUpload(file, fileInfo, customUploader);

      const response = await axios.post<unknown>(uploadUrl.toString(), body, {
        headers,
        responseType: 'json',
        timeout: UPLOAD_TIMEOUT_MS,
        // The file has already passed the 50 MB limit; multipart adds a small envelope.
        maxBodyLength: body.length,
        maxContentLength: MAX_RESPONSE_BYTES,
      });
      result.url = parseUploadResponse(response.data);
      break;
    }
    case 'data': {
      if (!type.startsWith('image/')) throw new Error('Only images are supported without an uploader.');
      const file = await readUploadFile(fileInfo);
      result.url = `data:${type};base64,${Buffer.from(file).toString('base64')}`;
      break;
    }
  }
  return result;
};
