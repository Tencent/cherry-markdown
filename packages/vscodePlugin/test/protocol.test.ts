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

  test.each([
    null,
    {},
    { type: 'unknown' },
    { type: 'preview-scroll', data: Number.NaN },
    { type: 'change-theme', data: 'blue' },
    { type: 'editor-change', data: { markdown: '# Missing identity' } },
    { type: 'upload-file', data: { requestId: -1, name: 'x' } },
    { type: 'export-png', data: 'data:text/plain;base64,eA==' },
  ])('rejects invalid message %#', (message) => {
    expect(parseWebviewMessage(message)).toBeUndefined();
  });
});
