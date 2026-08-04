import { editorViewCtx } from '@milkdown/kit/core';
import { NodeSelection } from '@milkdown/kit/prose/state';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createCherryMilkdown, type CherryMilkdownInstance } from '../src';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg data-rendered-mermaid="true"></svg>' })),
  },
}));

vi.mock('mathlive', () => ({}));

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

function selectNode(instance: CherryMilkdownInstance, typeName: string) {
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  let target = -1;
  view.state.doc.descendants((node, position) => {
    if (target < 0 && node.type.name === typeName) target = position;
  });
  if (target >= 0) view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, target)));
  return view;
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
    expect(element.querySelector('math-field')).not.toBeNull();
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
    const nodes = element.querySelectorAll<HTMLElement>('.cherry-compound, .cherry-embed--cherry_diagram');
    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.textContent).toContain('Panel body');
    expect(nodes[0]?.querySelector('textarea')).toBeNull();
    expect(nodes[1]?.querySelector<HTMLElement>('.cherry-embed__inspector')?.hidden).toBe(true);
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

  it('edits panel content directly without opening a source editor', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: '::: warning\nBefore\n:::', debounce: 0 });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let position = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === 'Before') position = pos;
    });
    view.dispatch(view.state.tr.insertText('After', position, position + 'Before'.length));
    expect(instance.getMarkdown()).toContain('After');
    expect(element.querySelector('.cherry-compound textarea')).toBeNull();
  });

  it('edits inline math in place through MathLive input events', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: 'Formula $x+1$.' });
    instances.push(instance);
    const field = element.querySelector<HTMLElement & { value: string }>('math-field');
    expect(field?.textContent).toBe('x+1');
    if (field) {
      field.value = '\\frac{a}{b}';
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain('$\\frac{a}{b}$');
  });

  it('exposes Milkdown table row and column controls', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '| A | B |\n| --- | --- |\n| 1 | 2 |',
    });
    instances.push(instance);
    expect(element.querySelector('.milkdown-table-block')).not.toBeNull();
  });

  it('edits frontmatter as metadata fields', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '---\ntitle: Before\nowner: Cherry\n---\n\nBody',
    });
    instances.push(instance);
    const inputs = element.querySelectorAll<HTMLInputElement>('.cherry-leaf-form--cherry_frontmatter input');
    expect(inputs).toHaveLength(4);
    const titleValue = inputs[1];
    if (titleValue) {
      titleValue.value = 'After';
      titleValue.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain('title: After');
  });

  it('adds structured tab items through the compound toolbar', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: ':::tabs\n:: First\nOne\n:::\n' });
    instances.push(instance);
    const before = element.querySelectorAll('.cherry-compound-item').length;
    element.querySelector<HTMLButtonElement>('.cherry-compound__toolbar button')?.click();
    expect(element.querySelectorAll('.cherry-compound-item')).toHaveLength(before + 1);
  });

  it('opens a diagram inspector on selection and refreshes its source', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '```mermaid\ngraph TD; A-->B;\n```',
      debounce: 0,
    });
    instances.push(instance);
    selectNode(instance, 'cherry_diagram');
    const textarea = element.querySelector<HTMLTextAreaElement>('.cherry-embed__inspector textarea');
    expect(textarea?.value).toContain('A-->B');
    if (textarea) {
      textarea.value = 'graph TD; B-->C;';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instance.getMarkdown()).toContain('B-->C');
  });

  it('sandboxes HTML previews and keeps source editing next to the selected node', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '<div>\nsafe\n<script>window.__bad = true</script>\n</div>',
    });
    instances.push(instance);
    selectNode(instance, 'cherry_html_block');
    const frame = element.querySelector<HTMLIFrameElement>('.cherry-embed__html-frame');
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute('sandbox')).toBe('');
    expect(element.querySelector('.cherry-embed__inspector textarea')).not.toBeNull();
    expect((window as typeof window & { __bad?: boolean }).__bad).toBeUndefined();
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
    const instance = await createCherryMilkdown({
      root: element,
      value: '```mermaid\ngraph TD; A-->B;\n```',
      readonly: true,
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.editable).toBe(false);
    selectNode(instance, 'cherry_diagram');
    expect(element.querySelector('.cherry-milkdown-toolbar')).toBeNull();
    expect(element.querySelector<HTMLElement>('.cherry-embed__inspector')?.hidden).toBe(true);
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
