import { editorViewCtx } from '@milkdown/kit/core';
import type { Slice } from '@milkdown/kit/prose/model';
import * as proseView from '@milkdown/kit/prose/view';
import { expect, it } from 'vite-plus/test';
import { createTestEditor } from './helpers/create-editor';

it('rejects invalid schema attributes in clipboard slice context', async () => {
  const el = document.body.appendChild(document.createElement('div'));
  const editor = await createTestEditor({ el, value: 'before' });
  try {
    const view = editor.editor.action((ctx) => ctx.get(editorViewCtx));
    const context = JSON.stringify(['heading', { level: ['unexpected'] }]);
    const div = document.createElement('div');
    const paragraph = document.createElement('p');
    paragraph.setAttribute('data-pm-slice', `0 0 ${context}`);
    paragraph.textContent = 'safe text';
    div.append(paragraph);
    const parse = (proseView as unknown as { __parseFromClipboard: (...args: unknown[]) => Slice | null })
      .__parseFromClipboard;
    const slice = parse(view, 'safe text', div.innerHTML, false, view.state.selection.$from);
    const heading = view.state.schema.nodes.heading as unknown as { checkAttrs: (attrs: unknown) => void };
    expect(() => heading.checkAttrs({ id: '', level: ['unexpected'] })).toThrow();
    expect(slice?.content.firstChild?.type.name).toBe('paragraph');
    expect(slice?.content.textBetween(0, slice.content.size)).toBe('safe text');
  } finally {
    await editor.destroy();
    el.remove();
  }
});
