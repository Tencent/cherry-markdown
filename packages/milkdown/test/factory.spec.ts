import { editorViewCtx } from '@milkdown/kit/core';
import { NodeSelection } from '@milkdown/kit/prose/state';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createCherryMilkdown, type CherryMilkdownInstance } from '../src';

const instances: CherryMilkdownInstance[] = [];

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(async () => {
  await Promise.all(instances.splice(0).map((instance) => instance.destroy()));
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function roots() {
  const root = document.createElement('div');
  const previewRoot = document.createElement('div');
  document.body.append(root, previewRoot);
  return { root, previewRoot };
}

describe('createCherryMilkdown', () => {
  it('creates a framework-neutral editor and renders Cherry HTML', async () => {
    const { root, previewRoot } = roots();
    const instance = await createCherryMilkdown({
      root,
      previewRoot,
      value: '# Hello\n\n[[toc]]',
    });
    instances.push(instance);

    expect(instance.getMarkdown()).toContain('# Hello');
    expect(instance.getMarkdown()).toContain('[[toc]]');
    expect(previewRoot.innerHTML).toContain('<h1');
    expect(root.querySelector('[data-cherry-raw="block"]')).not.toBeNull();
  });

  it('preserves every built-in Cherry extension category as raw Markdown', async () => {
    const { root } = roots();
    const snippets = [
      '---\ntitle: Demo\n---',
      '[[toc]]',
      '[comment]: Comment body',
      '::: warning\nPanel body\n:::',
      '+++- Details\nDetail body\n+++',
      '$$\na+b\n$$',
      '<section>HTML</section>',
      'Text $a+b$.',
      'Text !!!#fff background!!!.',
      'Text !!red color!!.',
      'Text !18 size!.',
      'Text ^^sub^^ and ^sup^.',
      'Text {字|zi} and /underline/ and ==mark==.',
      '```mermaid\ngraph TD; A-->B;\n```',
    ];
    const instance = await createCherryMilkdown({ root, value: snippets.join('\n\n') });
    instances.push(instance);
    const markdown = instance.getMarkdown();

    for (const snippet of snippets) expect(markdown).toContain(snippet);
    expect(root.querySelectorAll('[data-cherry-raw]').length).toBeGreaterThan(10);
  });

  it('updates content, notifies changes, and works without a preview root', async () => {
    const { root } = roots();
    const onChange = vi.fn();
    const instance = await createCherryMilkdown({ root, debounce: 0, onChange });
    instances.push(instance);

    instance.setMarkdown('Text $a+b$');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instance.getMarkdown()).toContain('$a+b$');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ markdown: expect.stringContaining('$a+b$'), html: expect.any(String) }),
    );
  });

  it('edits a raw node through the source dialog', async () => {
    const { root } = roots();
    const instance = await createCherryMilkdown({ root, value: '[[toc]]', debounce: 0 });
    instances.push(instance);
    const raw = root.querySelector<HTMLElement>('[data-cherry-raw="block"]');
    raw?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const dialog = root.querySelector<HTMLDialogElement>('dialog');
    const textarea = dialog?.querySelector<HTMLTextAreaElement>('textarea');
    expect(dialog?.hasAttribute('open')).toBe(true);
    if (textarea) textarea.value = '[TOC]';
    dialog
      ?.querySelector<HTMLFormElement>('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instance.getMarkdown()).toContain('[TOC]');
  });

  it('copies a selected raw node as its original Markdown', async () => {
    const { root } = roots();
    const instance = await createCherryMilkdown({ root, value: '[[toc]]' });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, 0)));
    const clipboard = new Map<string, string>();
    const event = new Event('copy', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: { setData: (type: string, value: string) => clipboard.set(type, value) },
    });
    view.dom.dispatchEvent(event);
    expect(clipboard.get('text/plain')).toBe('[[toc]]');
  });

  it('parses pasted custom raw syntax and cuts it back as Markdown', async () => {
    const { root } = roots();
    const instance = await createCherryMilkdown({
      root,
      value: 'Start',
      rawPatterns: [{ name: 'mention', kind: 'inline', pattern: /@\[[^\]]+\]/ }],
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(paste, 'clipboardData', {
      value: { getData: (type: string) => (type === 'text/plain' ? '@[alice]' : '') },
    });
    view.dom.dispatchEvent(paste);
    expect(instance.getMarkdown()).toContain('@[alice]');

    let rawPosition = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'cherryRawInline') rawPosition = pos;
    });
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, rawPosition)));
    const clipboard = new Map<string, string>();
    const cut = new Event('cut', { bubbles: true, cancelable: true });
    Object.defineProperty(cut, 'clipboardData', {
      value: { setData: (type: string, value: string) => clipboard.set(type, value) },
    });
    view.dom.dispatchEvent(cut);
    expect(clipboard.get('text/plain')).toBe('@[alice]');
    expect(instance.getMarkdown()).not.toContain('@[alice]');
  });

  it('does not open the raw source dialog in readonly mode', async () => {
    const { root } = roots();
    const instance = await createCherryMilkdown({ root, value: '[[toc]]', readonly: true });
    instances.push(instance);
    root
      .querySelector<HTMLElement>('[data-cherry-raw="block"]')
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(root.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });

  it('keeps the previous preview when Cherry rendering fails', async () => {
    const { root, previewRoot } = roots();
    const onError = vi.fn();
    const instance = await createCherryMilkdown({ root, previewRoot, value: '# Stable', onError });
    instances.push(instance);
    const previous = previewRoot.innerHTML;
    vi.spyOn(instance.engine, 'makeHtml').mockImplementation(() => {
      throw new Error('render failed');
    });

    expect(instance.renderPreview()).toBe(previous);
    expect(previewRoot.innerHTML).toBe(previous);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'render');
  });

  it('rejects invalid roots and cleans owned DOM on destroy', async () => {
    await expect(createCherryMilkdown({ root: null as unknown as HTMLElement })).rejects.toThrow(TypeError);
    const { root, previewRoot } = roots();
    const instance = await createCherryMilkdown({ root, previewRoot, value: '# Cleanup' });
    await instance.destroy();
    expect(root.childElementCount).toBe(0);
    expect(previewRoot.childElementCount).toBe(0);
  });
});
