import { it, expect } from 'vitest';
import { editorViewCtx } from '@milkdown/kit/core';
import { TextSelection } from '@milkdown/kit/prose/state';
import { createTestEditor } from './helpers/create-editor';

it('preserves a closing parenthesis in an imported image URL', async () => {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el, value: '![photo](<https://example.com/a)b.png>)' });
  try {
    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a%29b.png');
  } finally {
    await instance.destroy();
    el.remove();
  }
});

it('keeps Cherry image decorations when the title contains quotes', async () => {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el, value: `![photo#border](https://example.com/a.png 'A "quote"')` });
  try {
    expect(el.querySelector('img')?.getAttribute('title')).toBe('A "quote"');
    expect(el.querySelector('img')?.classList.contains('cherry-img-deco-border')).toBe(true);
  } finally {
    await instance.destroy();
    el.remove();
  }
});

it('does not rewrite Cherry syntax typed inside inline code', async () => {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el, value: '`!!red literal!`' });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const pos = 1 + view.state.doc.firstChild!.content.size;
      view.dispatch(
        view.state.tr
          .setSelection(TextSelection.create(view.state.doc, pos))
          .setStoredMarks([view.state.schema.marks.inlineCode.create()]),
      );
      const handled = view.someProp('handleTextInput', (handler) =>
        handler(view, pos, pos, '!', () => view.state.tr.insertText('!')),
      );
      if (!handled) view.dispatch(view.state.tr.insertText('!', pos));
      expect(view.state.doc.textContent).toBe('!!red literal!!');
      expect(view.state.doc.firstChild!.firstChild!.marks.some((mark) => mark.type.spec.code)).toBe(true);
    });
  } finally {
    await instance.destroy();
    el.remove();
  }
});

it('edits the complete link from its third formatted text segment', async () => {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el, value: '[one **two** three](https://example.com)' });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const pos = 1 + view.state.doc.firstChild!.content.size - 2;
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)));
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true });
      view.someProp('handleKeyDown', (handler) => handler(view, event));
      expect(el.querySelector<HTMLInputElement>('input[name="text"]')?.value).toBe('one two three');
    });
  } finally {
    await instance.destroy();
    el.remove();
  }
});

it.each([
  ['a(b.png', 'a%28b.png'],
  ['a(b).png', 'a%28b%29.png'],
  ['a%29b.png', 'a%29b.png'],
  ['a b.png', 'a%20b.png'],
])('renders a parsed image destination without reparsing delimiters: %s', async (path, encoded) => {
  const el = document.body.appendChild(document.createElement('div'));
  const value = `![photo#border](<https://example.com/${path}>)`;
  const instance = await createTestEditor({ el, value });
  try {
    expect(el.querySelector('img')?.getAttribute('src')).toBe(`https://example.com/${encoded}`);
    expect(el.querySelector('img')?.classList.contains('cherry-img-deco-border')).toBe(true);
    expect(instance.getMarkdown()).toBe(value);
  } finally {
    await instance.destroy();
    el.remove();
  }
});

it('keeps literal image alt delimiters from selecting a different image', async () => {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el, value: 'image' });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const node = view.state.schema.nodes.image.create({
        src: 'https://example.com/photo.png',
        alt: 'a](wrong.png) ![b#border',
      });
      view.dispatch(view.state.tr.replaceWith(1, 6, node));
    });
    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://example.com/photo.png');
    expect(el.querySelector('img')?.getAttribute('alt')).toBe('a](wrong.png) ![b#border');
    expect(el.querySelector('img')?.classList.contains('cherry-img-deco-border')).toBe(true);
  } finally {
    await instance.destroy();
    el.remove();
  }
});

it('retains Cherry image URL hooks and lazy source attributes', async () => {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({
    el,
    value: `![photo#border](https://example.com/a.png 'A "quote"')`,
    engineOptions: {
      callback: {
        beforeImageMounted: (_property: string, src: string) => ({
          srcProp: 'data-src',
          src: src.replace('/a.png', '/b.png'),
        }),
        urlProcessor: (src: string) => src.replace('example.com', 'cdn.example.com'),
      },
    },
  });
  try {
    expect(el.querySelector('img')?.getAttribute('data-src')).toBe('https://cdn.example.com/b.png');
    expect(el.querySelector('img')?.hasAttribute('src')).toBe(false);
    expect(el.querySelector('img')?.getAttribute('title')).toBe('A "quote"');
    expect(el.querySelector('img')?.classList.contains('cherry-img-deco-border')).toBe(true);
  } finally {
    await instance.destroy();
    el.remove();
  }
});

it('does not consume inline code inside a match even when the caret is plain text', async () => {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el, value: '!!red `literal`!' });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const pos = 1 + view.state.doc.firstChild!.content.size;
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)).setStoredMarks([]));
      const handled = view.someProp('handleTextInput', (handler) =>
        handler(view, pos, pos, '!', () => view.state.tr.insertText('!')),
      );
      if (!handled) view.dispatch(view.state.tr.insertText('!', pos));
      expect(view.state.doc.textContent).toBe('!!red literal!!');
      expect(view.state.doc.firstChild!.child(1).marks.some((mark) => mark.type.spec.code)).toBe(true);
    });
  } finally {
    await instance.destroy();
    el.remove();
  }
});

it.each([1, 6, 11])('expands a formatted link from position %s without joining a different URL', async (position) => {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({
    el,
    value: '[one **two** three](https://example.com)[next](https://example.org)',
  });
  try {
    instance.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, position)));
      view.someProp('handleKeyDown', (handler) =>
        handler(view, new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })),
      );
      expect(el.querySelector<HTMLInputElement>('input[name="text"]')?.value).toBe('one two three');
    });
  } finally {
    await instance.destroy();
    el.remove();
  }
});
