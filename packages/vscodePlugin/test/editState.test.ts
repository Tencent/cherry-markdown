import { describe, expect, test } from 'vitest';
import { isPreviewEditEnabled } from '../src/editState';

describe('preview edit activation', () => {
  test('keeps editing enabled while the preview webview has focus', () => {
    expect(isPreviewEditEnabled('file:///workspace/readme.md', 'markdown', undefined, undefined)).toBe(true);
  });

  test('enables editing when the matching Markdown editor is active', () => {
    expect(
      isPreviewEditEnabled(
        'file:///workspace/readme.md',
        'markdown',
        'file:///workspace/readme.md',
        'markdown',
      ),
    ).toBe(true);
  });

  test('disables editing when another editor is active', () => {
    expect(
      isPreviewEditEnabled(
        'file:///workspace/readme.md',
        'markdown',
        'file:///workspace/notes.txt',
        'plaintext',
      ),
    ).toBe(false);
  });
});
