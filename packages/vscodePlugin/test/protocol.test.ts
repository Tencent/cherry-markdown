import { describe, expect, test } from 'vitest';
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
      data: { requestId: 1, name: 'image.png', type: 'image/png', path: '/tmp/image.png', size: 4 },
    };
    expect(parseWebviewMessage(message)).toEqual(message);
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
