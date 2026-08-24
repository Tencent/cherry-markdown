import { beforeEach, describe, expect, it } from 'vite-plus/test';
import CherryMilkdown, { EditorAdapter, MarkdownRoundTripError, MilkdownEditorAdapter } from '../src/index';

describe('@cherry-markdown/milkdown lifecycle contract', () => {
  beforeEach(() => {
    // @ts-expect-error build constant
    globalThis.BUILD_ENV = 'production';
  });

  it('exposes the adapter contract and rejects silent proprietary syntax loss', () => {
    const editor = new CherryMilkdown({});
    expect(editor).toBeInstanceOf(EditorAdapter);
    expect(MilkdownEditorAdapter).toBe(CherryMilkdown);
    expect(typeof editor.setMarkdown).toBe('function');
    expect(typeof editor.getEngineHtml).toBe('function');
    expect(editor.assertRoundTrip('# title\n', '# title')).toBe('# title');
    expect(() => editor.assertRoundTrip('::: panel', 'panel')).toThrow(MarkdownRoundTripError);
  });

  it('creates, updates, reads and destroys a real CommonMark editor', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const editor = new CherryMilkdown({ el, value: '# Initial' });

    await editor.create();
    expect(editor.getEditor()).not.toBeNull();
    expect(await editor.getMarkdown()).toContain('# Initial');

    await editor.setMarkdown('## Updated\n\n- one\n- two');
    expect(await editor.getMarkdown()).toContain('## Updated');
    expect(await editor.getEngineHtml()).toContain('Updated');

    await editor.destroy();
    expect(editor.getEditor()).toBeNull();
  });

  it('rolls back unsupported Markdown instead of silently replacing persisted content', async () => {
    const el = document.createElement('div');
    const editor = new CherryMilkdown({ el, value: '# Safe' });
    await editor.create();
    editor.assertRoundTrip = () => {
      throw new MarkdownRoundTripError('unsupported', 'changed');
    };

    await expect(editor.setMarkdown('unsupported')).rejects.toBeInstanceOf(MarkdownRoundTripError);
    expect(await editor.getMarkdown()).toContain('# Safe');
    await editor.destroy();
  });

  it('cleans up a failed initial proprietary-syntax round trip', async () => {
    const el = document.createElement('div');
    class UnsupportedMilkdown extends CherryMilkdown {
      assertRoundTrip() {
        throw new MarkdownRoundTripError('unsupported', 'changed');
      }
    }
    const editor = new UnsupportedMilkdown({ el, value: 'unsupported' });

    await expect(editor.create()).rejects.toBeInstanceOf(MarkdownRoundTripError);
    expect(editor.getEditor()).toBeNull();
  });
});
