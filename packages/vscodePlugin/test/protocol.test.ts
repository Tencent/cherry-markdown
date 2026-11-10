import { describe, expect, test } from 'vite-plus/test';
import { parseWebviewMessage } from '../src/protocol';

describe('Webview protocol', () => {
  test('accepts editor changes with document identity and version', () => {
    const message = {
      type: 'editor-change',
      data: { documentUri: 'file:///readme.md', baseVersion: 3, requestId: 2, markdown: '# Hello' },
    };
    expect(parseWebviewMessage(message)).toEqual(message);
  });

  test('accepts a validated upload request', () => {
    const message = {
      type: 'upload-file',
      data: {
        requestId: 1,
        name: 'image.png',
        type: 'image/png',
        path: '/tmp/image.png',
        size: 4,
        documentUri: 'file:///readme.md',
        placeholder: 'cherry-upload:11111111-1111-4111-8111-111111111111',
      },
    };
    expect(parseWebviewMessage(message)).toEqual(message);
  });

  test('requires the document and unique anchor for uploads and validates fallback messages', () => {
    const placeholder = 'cherry-upload:11111111-1111-4111-8111-111111111111';
    const data = {
      requestId: 1,
      name: 'image.png',
      type: 'image/png',
      path: '',
      size: 3,
      base64: 'AQID',
      documentUri: 'file:///A.md',
      placeholder,
    };
    expect(parseWebviewMessage({ type: 'upload-file', data })).toEqual({ type: 'upload-file', data });
    expect(parseWebviewMessage({ type: 'upload-file', data: { ...data, documentUri: '' } })).toBeUndefined();
    expect(parseWebviewMessage({ type: 'upload-file', data: { ...data, placeholder: '' } })).toBeUndefined();
    expect(parseWebviewMessage({ type: 'upload-file', data: { ...data, base64: 123 } })).toBeUndefined();
    expect(parseWebviewMessage({ type: 'finish-upload', data: { placeholder } })).toEqual({
      type: 'finish-upload',
      data: { placeholder },
    });
    expect(parseWebviewMessage({ type: 'finish-upload', data: { placeholder: 'file:///A.md' } })).toBeUndefined();
  });

  test.each(['gray', 'abyss', 'violet', 'blue'])('accepts Cherry built-in theme %s', (theme) => {
    expect(parseWebviewMessage({ type: 'change-theme', data: theme })).toEqual({ type: 'change-theme', data: theme });
  });

  test('normalizes accepted messages to their validated shape', () => {
    const raw = {
      type: 'editor-change',
      data: {
        documentUri: 'file:///readme.md',
        baseVersion: 1,
        requestId: 2,
        markdown: '# Hello',
        ignored: true,
      },
      ignored: true,
    };

    expect(parseWebviewMessage(raw)).toEqual({
      type: 'editor-change',
      data: { documentUri: 'file:///readme.md', baseVersion: 1, requestId: 2, markdown: '# Hello' },
    });
  });

  test.each([
    null,
    {},
    { type: 'unknown' },
    { type: 'preview-scroll', data: Number.NaN },
    { type: 'change-theme', data: 'unknown' },
    { type: 'editor-change', data: { markdown: '# Missing identity' } },
    { type: 'upload-file', data: { requestId: -1, name: 'x' } },
    { type: 'export-png', data: 'data:text/plain;base64,eA==' },
    { type: 'ready', data: null },
    { type: 'preview-scroll', data: Infinity },
    { type: 'change-theme', data: 'Default' },
    { type: 'show-message', data: 'x'.repeat(2001) },
    { type: 'open-url', data: 'x'.repeat(32769) },
    { type: 'editor-change', data: { documentUri: '', baseVersion: 0, requestId: 0, markdown: '' } },
    { type: 'editor-change', data: { documentUri: 'file:///x', baseVersion: -1, requestId: 0, markdown: '' } },
    { type: 'upload-file', data: { requestId: 1, name: 'x', type: 'image/png', path: '/tmp/x', size: NaN } },
  ])('rejects invalid message %#', (message) => {
    expect(parseWebviewMessage(message)).toBeUndefined();
  });
});
