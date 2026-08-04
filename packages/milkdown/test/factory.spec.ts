import { editorViewCtx } from '@milkdown/kit/core';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createCherryMilkdown, type CherryMilkdownInstance } from '../src';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg data-rendered-mermaid="true"></svg>' })),
  },
}));

const instances: CherryMilkdownInstance[] = [];

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

afterEach(async () => {
  await Promise.all(instances.splice(0).map((instance) => instance.destroy()));
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function root() {
  const element = document.createElement('div');
  document.body.append(element);
  return element;
}

describe('createCherryMilkdown WYSIWYG', () => {
  it('renders a single editable content surface with no raw cards or preview pane', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '# Hello\n\n[[toc]]\n\nText !!red color!! and $E=mc^2$.',
    });
    instances.push(instance);

    expect(element.querySelector('h1')?.textContent).toBe('Hello');
    expect(element.querySelector('.cherry-wysiwyg-toc')).not.toBeNull();
    expect(element.querySelector('.cherry-wysiwyg-color')?.textContent).toBe('color');
    expect(element.querySelector('[data-type="math_inline"]')).not.toBeNull();
    expect(element.querySelector('[data-cherry-raw]')).toBeNull();
    expect(element.querySelector('textarea')).toBeNull();
  });

  it('keeps Cherry visual syntax reversible through Markdown serialization', async () => {
    const element = root();
    const value = [
      '[[toc]]',
      '',
      'Text !!#f00 red!!, !!!#fff bg!!!, !18 size!, ^^sub^^, ^sup^, {字|zi}, /under/, ==mark==.',
    ].join('\n');
    const instance = await createCherryMilkdown({ root: element, value });
    instances.push(instance);
    const markdown = instance.getMarkdown();

    for (const syntax of ['[[toc]]', '!!#f00 red!!', '!!!#fff bg!!!', '!18 size!', '^^sub^^', '^sup^']) {
      expect(markdown).toContain(syntax);
    }
    expect(markdown).toContain('{字|zi}');
    expect(markdown).toContain('/under/');
    expect(markdown).toContain('==mark==');
  });

  it('edits Cherry typography directly while preserving its Markdown mark', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: 'Text !!red color!!.' });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let colorTextPosition = 0;
    view.state.doc.descendants((node, position) => {
      if (node.isText && node.text === 'color') colorTextPosition = position;
    });

    view.dispatch(view.state.tr.insertText(' vivid', colorTextPosition + 2));

    expect(element.querySelector('.cherry-wysiwyg-color')?.textContent).toBe('co vividlor');
    expect(instance.getMarkdown()).toContain('!!red co vividlor!!');
  });

  it('preserves parameterized Cherry marks when parsing editor DOM', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: '!!#f00 red!! !20 large! {字|zi}' });
    instances.push(instance);

    const color = element.querySelector('.cherry-wysiwyg-color');
    const size = element.querySelector('.cherry-wysiwyg-size');
    const ruby = element.querySelector('.cherry-wysiwyg-ruby');
    expect(color?.getAttribute('data-cherry-color')).toBe('#f00');
    expect(size?.getAttribute('data-cherry-size')).toBe('20');
    expect(ruby?.getAttribute('data-cherry-annotation')).toBe('zi');
  });

  it('uses native editable GFM table nodes', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '| Name | Value |\n| --- | --- |\n| Milkdown | WYSIWYG |',
    });
    instances.push(instance);
    expect(element.querySelector('table')).not.toBeNull();
    expect(element.querySelectorAll('td')).toHaveLength(2);
    expect(element.querySelector('table')?.closest('[data-cherry-visual]')).toBeNull();
  });

  it('updates the visual TOC when a heading is edited', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: '# Before\n\n[[toc]]' });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let headingTextPosition = 0;
    view.state.doc.descendants((node, position) => {
      if (node.isText && node.text === 'Before') headingTextPosition = position;
    });

    view.dispatch(view.state.tr.insertText('After', headingTextPosition, headingTextPosition + 'Before'.length));

    expect(element.querySelector('.cherry-wysiwyg-toc')?.textContent).toContain('After');
  });

  it('shows Cherry panels and Mermaid as rendered visual nodes by default', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '::: warning\nPanel body\n:::\n\n```mermaid\ngraph TD; A-->B;\n```',
    });
    instances.push(instance);
    const nodes = element.querySelectorAll<HTMLElement>('[data-cherry-visual="block"]');
    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.textContent).toContain('Panel body');
    expect(nodes[0]?.querySelector('textarea')).toBeNull();
    expect(nodes[1]?.dataset.syntax).toBe('mermaid');
    await vi.waitFor(() => expect(nodes[1]?.querySelector('[data-rendered-mermaid]')).not.toBeNull());
  });

  it('uses a custom renderer for other visual diagram nodes', async () => {
    const element = root();
    const renderer = vi.fn(async () => '<div data-rendered-echarts="true">Chart</div>');
    const instance = await createCherryMilkdown({
      root: element,
      value: '```echarts\n{"series": []}\n```',
      renderers: { echarts: renderer },
    });
    instances.push(instance);

    await vi.waitFor(() => expect(element.querySelector('[data-rendered-echarts]')).not.toBeNull());
    expect(renderer).toHaveBeenCalledWith(
      expect.objectContaining({ syntax: 'echarts', source: expect.stringContaining('"series"') }),
    );
  });

  it('reveals source only while editing an embedded visual object', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: '::: warning\nBefore\n:::', debounce: 0 });
    instances.push(instance);
    const node = element.querySelector<HTMLElement>('[data-cherry-visual="block"]');
    node?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const textarea = node?.querySelector<HTMLTextAreaElement>('textarea');
    expect(textarea?.value).toContain('Before');
    if (textarea) textarea.value = '::: success\nAfter\n:::';
    node?.querySelector<HTMLButtonElement>('.cherry-wysiwyg-node__source-editor button:last-child')?.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instance.getMarkdown()).toContain('After');
    expect(node?.querySelector('textarea')).toBeNull();
  });

  it('updates Markdown and emits debounced changes without rendering a second pane', async () => {
    const element = root();
    const onChange = vi.fn();
    const instance = await createCherryMilkdown({ root: element, debounce: 0, onChange });
    instances.push(instance);
    instance.setMarkdown('# Updated\n\n$E=mc^2$');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(element.querySelector('h1')?.textContent).toBe('Updated');
    expect(onChange).toHaveBeenCalledWith({ markdown: expect.stringContaining('# Updated') });
  });

  it('keeps embedded source editing disabled in readonly mode', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: '[[toc]]', readonly: true });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.editable).toBe(false);
    element
      .querySelector<HTMLElement>('[data-cherry-visual="block"]')
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(element.querySelector('textarea')).toBeNull();
  });

  it('focuses and destroys the editor cleanly', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: '# Cleanup' });
    instance.focus();
    expect(instance.editor.action((ctx) => ctx.get(editorViewCtx)).hasFocus()).toBe(true);
    await instance.destroy();
    expect(element.childElementCount).toBe(0);
  });

  it('rejects invalid roots', async () => {
    await expect(createCherryMilkdown({ root: null as unknown as HTMLElement })).rejects.toThrow(TypeError);
  });
});
