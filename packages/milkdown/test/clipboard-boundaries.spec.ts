import { editorViewCtx } from '@milkdown/kit/core';
import { Fragment, Slice } from '@milkdown/kit/prose/model';
import { TextSelection } from '@milkdown/kit/prose/state';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { cherryClipboardBoundaries } from '../src/wysiwyg/clipboard-boundaries';
import { createTestEditor, type TestCherryMilkdownInstance } from './helpers/create-editor';

const instances: TestCherryMilkdownInstance[] = [];
afterEach(async () => {
  await Promise.all(instances.splice(0).map((instance) => instance.destroy()));
  document.body.replaceChildren();
});

async function editor(value = '**BeforeAfter**', readonly = false) {
  const el = document.body.appendChild(document.createElement('div'));
  const instance = await createTestEditor({ el, value, readonly });
  instances.push(instance);
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  if (view.state.doc.resolve(7).parent.isTextblock) {
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 7)));
  }
  const plugin = cherryClipboardBoundaries.plugin();
  return { instance, view, handler: plugin.props.handlePaste!.bind(plugin) };
}

function clipboard(text: string, html = '<span>middle</span>') {
  return { clipboardData: { getData: (type: string) => (type === 'text/plain' ? text : html) } } as ClipboardEvent;
}

describe('inline clipboard boundaries', () => {
  it.each([' middle ', '  middle', 'middle  ', '   '])('preserves plain text spaces in %j', async (text) => {
    const { view, handler } = await editor();
    const slice = new Slice(Fragment.from(view.state.schema.text('middle')), 0, 0);
    expect(handler(view, clipboard(text, ''), slice)).toBe(true);
    expect(view.state.doc.textContent).toBe(`Before${text}After`);
  });

  it.each([' # heading', '    code'])('leaves Markdown syntax %j to Milkdown', async (text) => {
    const { view, handler } = await editor();
    const slice = new Slice(Fragment.from(view.state.schema.text('middle')), 0, 0);
    expect(handler(view, clipboard(text, ''), slice)).toBe(false);
  });

  it.each([
    [' **bold** ', 'bold', 'strong'],
    [' *italic* ', 'italic', 'emphasis'],
    [' [link](https://example.com) ', 'link', 'link'],
  ])('preserves spaces and Markdown formatting for %j', async (text, content, mark) => {
    const { view, handler } = await editor('BeforeAfter');
    const slice = new Slice(Fragment.from(view.state.schema.text(content)), 0, 0);
    expect(handler(view, clipboard(text, ''), slice)).toBe(true);
    expect(view.state.doc.textContent).toBe(`Before ${content} After`);
    const node = view.state.doc.firstChild!.content.content.find((child) => child.text === content);
    expect(node?.marks.map((item) => item.type.name)).toContain(mark);
  });

  it('preserves repeated boundary spaces around formatted Markdown', async () => {
    const { view, handler } = await editor('BeforeAfter');
    const slice = new Slice(Fragment.from(view.state.schema.text('italic')), 0, 0);
    expect(handler(view, clipboard('  *italic*  ', ''), slice)).toBe(true);
    expect(view.state.doc.textContent).toBe('Before  italic  After');
  });

  it('restores boundary spaces while inheriting the current text mark', async () => {
    const { instance, view, handler } = await editor();
    const slice = new Slice(Fragment.from(view.state.schema.text('middle')), 0, 0);
    expect(handler(view, clipboard(' middle '), slice)).toBe(true);
    expect(instance.getMarkdown()).toBe('**Before middle After**');
  });

  it('synchronizes a focused DOM caret before paste without handling the event', async () => {
    const { view } = await editor();
    view.focus();
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 3)));
    const text = view.dom.querySelector('strong')!.firstChild!;
    const range = document.createRange();
    range.setStart(text, 6);
    range.collapse(true);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    const plugin = cherryClipboardBoundaries.plugin();
    expect(plugin.props.handleDOMEvents!.paste!.call(plugin, view, new Event('paste') as ClipboardEvent)).toBe(false);
    expect(view.state.selection.from).toBe(7);
  });

  it('retains marks supplied by the clipboard instead of inheriting the surrounding mark', async () => {
    const { view, handler } = await editor();
    const mark = view.state.schema.marks.emphasis.create();
    const slice = new Slice(Fragment.from(view.state.schema.text('middle', [mark])), 0, 0);
    expect(handler(view, clipboard(' middle '), slice)).toBe(true);
    expect(view.state.doc.textContent).toBe('Before middle After');
    const middle = view.state.doc.firstChild!.content.content.find((node) => node.text === 'middle');
    expect(middle?.marks.map((item) => item.type.name)).toEqual(['emphasis']);
  });

  it('preserves repeated spaces surrounding inline HTML', async () => {
    const { view, handler } = await editor('BeforeAfter');
    const mark = view.state.schema.marks.emphasis.create();
    const slice = new Slice(Fragment.from(view.state.schema.text('middle', [mark])), 0, 0);
    expect(handler(view, clipboard('  middle  '), slice)).toBe(true);
    expect(view.state.doc.textContent).toBe('Before  middle  After');
  });

  it.each([
    ['different text', ' different ', '<span>middle</span>'],
    ['multiline text', 'middle\nmore', '<span>middle</span>'],
    ['no missing boundary', 'middle', '<span>middle</span>'],
  ])('leaves %s to Milkdown', async (_name, text, html) => {
    const { instance, view, handler } = await editor();
    const slice = new Slice(Fragment.from(view.state.schema.text('middle')), 0, 0);
    expect(handler(view, clipboard(text, html), slice)).toBe(false);
    expect(instance.getMarkdown()).toBe('**BeforeAfter**');
  });

  it('leaves inline atoms and open slices to Milkdown', async () => {
    const { view, handler } = await editor();
    const image = view.state.schema.nodes.image.create({ src: 'https://example.com/image.png' });
    expect(handler(view, clipboard(' middle '), new Slice(Fragment.from(image), 0, 0))).toBe(false);
    expect(handler(view, clipboard(' middle '), new Slice(Fragment.from(view.state.schema.text('middle')), 1, 1))).toBe(
      false,
    );
    expect(view.state.doc.textContent).toBe('BeforeAfter');
  });

  it('does not intercept paste in a code block or without clipboard data', async () => {
    const { instance, view, handler } = await editor('```js\nBeforeAfter\n```');
    const slice = new Slice(Fragment.from(view.state.schema.text('middle')), 0, 0);
    expect(handler(view, clipboard(' middle '), slice)).toBe(false);
    expect(handler(view, {} as ClipboardEvent, slice)).toBe(false);
    expect(instance.getMarkdown()).toBe('```js\nBeforeAfter\n```');
  });

  it('does not intercept read-only content', async () => {
    const readonlyEditor = await editor('**BeforeAfter**', true);
    const readonlySlice = new Slice(Fragment.from(readonlyEditor.view.state.schema.text('middle')), 0, 0);
    expect(readonlyEditor.handler(readonlyEditor.view, clipboard(' middle '), readonlySlice)).toBe(false);
    expect(readonlyEditor.instance.getMarkdown()).toBe('**BeforeAfter**');
  });

  it('preserves HTML formatting and spaces across paragraphs', async () => {
    const { view, handler } = await editor('BeforeXXX\n\nYYYAfter');
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 7, 15)));
    const mark = view.state.schema.marks.emphasis.create();
    const slice = new Slice(Fragment.from(view.state.schema.text('middle', [mark])), 0, 0);
    expect(handler(view, clipboard(' middle '), slice)).toBe(true);
    expect(view.state.doc.textContent).toBe('Before middle After');
    const node = view.state.doc.firstChild!.content.content.find((child) => child.text === 'middle');
    expect(node?.marks.map((item) => item.type.name)).toContain('emphasis');
  });

  it('preserves plain text spaces while replacing text across paragraphs', async () => {
    const { view, handler } = await editor('BeforeXXX\n\nYYYAfter');
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 7, 15)));
    const slice = new Slice(Fragment.from(view.state.schema.text('middle')), 0, 0);
    expect(handler(view, clipboard(' middle ', ''), slice)).toBe(true);
    expect(view.state.doc.textContent).toBe('Before middle After');
  });
});
