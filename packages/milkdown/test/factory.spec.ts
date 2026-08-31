import { editorViewCtx } from '@milkdown/kit/core';
import { NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  attachCherryMilkdownPreview,
  createCherryMilkdown,
  milkdown,
  type CherryMilkdownHost,
  type CherryMilkdownInstance,
  type CherryPreviewContentRenderer,
  type CherryPreviewEditingBridge,
} from '../src';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg data-rendered-mermaid="true"></svg>' })),
  },
}));

vi.mock('mathlive', () => ({}));

// Keep typechecking independent from generated Cherry declarations while loading the
// actual workspace package at runtime. The test command builds Cherry before Vitest.
const { default: Cherry } = await vi.importActual<{
  default: new (options: { el: HTMLElement; value: string; extensions: ReturnType<typeof milkdown>[] }) => {
    getMarkdown(): string;
    setValue(markdown: string): void;
    switchModel(model: 'editOnly' | 'previewOnly'): void;
    destroy(): void;
  };
}>('cherry-markdown');

const instances: CherryMilkdownInstance[] = [];
const fullManual = readFileSync(resolve(import.meta.dirname, '../../../examples/assets/markdown/index.md'), 'utf8');

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
  it('integrates through a real new Cherry({ extensions: [milkdown()] }) instance', async () => {
    const element = root();
    const initialMarkdown = '# Real Cherry\n\n* [Original marker](https://example.com){target=\\_blank}';
    const cherry = new Cherry({
      el: element,
      value: initialMarkdown,
      extensions: [milkdown({ debounce: 0 })],
    });

    await vi.waitFor(() => expect(element.querySelector('.cherry-milkdown--previewer .ProseMirror')).not.toBeNull());
    expect(element.querySelector('.cherry-editor')).not.toBeNull();
    expect(element.querySelector('.cherry-toolbar')).not.toBeNull();
    expect(element.querySelector('.milkdown-table-block')).toBeNull();
    expect(element.querySelector('.cherry-previewer h1')?.textContent).toBe('Real Cherry');
    expect(cherry.getMarkdown()).toBe(initialMarkdown);

    cherry.setValue('# Synced from Cherry API\n\nUpdated body.');
    await vi.waitFor(() =>
      expect(element.querySelector('.cherry-previewer h1')?.textContent).toBe('Synced from Cherry API'),
    );
    const preview = element.querySelector<HTMLElement>('.cherry-previewer');
    if (preview) {
      preview.scrollTop = 73;
      preview.scrollLeft = 11;
    }
    cherry.setValue('# Synced again\n\nUpdated body.');
    await vi.waitFor(() => expect(element.querySelector('.cherry-previewer h1')?.textContent).toBe('Synced again'));
    expect(preview?.scrollTop).toBe(73);
    expect(preview?.scrollLeft).toBe(11);
    const previewEditor = element.querySelector('.ProseMirror');
    cherry.switchModel('editOnly');
    expect(element.querySelector('.cherry-previewer')?.classList.contains('cherry-previewer--hidden')).toBe(true);
    cherry.switchModel('previewOnly');
    await vi.waitFor(() => expect(element.querySelector('.ProseMirror')).toBe(previewEditor));

    cherry.destroy();
    await vi.waitFor(() => expect(element.childElementCount).toBe(0));
  });

  it('exposes milkdown() as the instance extension and returns Cherry-owned cleanup', async () => {
    const element = root();
    let renderer: CherryPreviewContentRenderer | undefined;
    const previewer = {
      getDom: () => element,
      setContentRenderer: (next: CherryPreviewContentRenderer) => {
        renderer = next;
      },
      clearContentRenderer: (target?: CherryPreviewContentRenderer) => {
        if (!renderer || (target && target !== renderer)) return false;
        renderer = undefined;
        return true;
      },
      update: (html: string) => {
        if (renderer) return renderer.update({ container: element, markdown: '# Extension preview', html });
        element.innerHTML = html;
      },
    };
    const host: CherryMilkdownHost = {
      engine: { makeHtml: (value: string) => `<p>${value}</p>` },
      getMarkdown: () => '# Extension preview',
      getPreviewer: () => previewer,
      setValue: vi.fn(),
    };
    const extension = milkdown({ debounce: 0 });

    expect(extension.name).toBe('@cherry-markdown/milkdown');
    const cleanup = await extension.mount(host);
    expect(element.querySelector('h1')?.textContent).toBe('Extension preview');
    expect(cleanup).toBeTypeOf('function');
    await cleanup?.();
    expect(renderer).toBeUndefined();
    expect(element.textContent).toContain('# Extension preview');
  });

  it('restores the native Cherry preview and reports one error when extension initialization fails', async () => {
    const element = root();
    let renderer: CherryPreviewContentRenderer | undefined;
    const previewer = {
      getDom: () => element,
      setContentRenderer: (next: CherryPreviewContentRenderer) => {
        renderer = next;
      },
      clearContentRenderer: (target?: CherryPreviewContentRenderer) => {
        if (!renderer || (target && target !== renderer)) return false;
        renderer = undefined;
        return true;
      },
      update: (html: string) => {
        if (renderer) return renderer.update({ container: element, markdown: '# Native fallback', html });
        element.innerHTML = html;
      },
    };
    const error = new Error('broken preview initialization');
    let renderCount = 0;
    const host: CherryMilkdownHost = {
      engine: {
        makeHtml: (value: string) => {
          renderCount += 1;
          if (renderCount === 1) throw error;
          return `<article>${value}</article>`;
        },
      },
      getMarkdown: () => '# Native fallback',
      getPreviewer: () => previewer,
      setValue: vi.fn(),
    };
    const onError = vi.fn();

    await expect(
      attachCherryMilkdownPreview(host, {
        onError,
      }),
    ).rejects.toThrow(error);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error, 'create');
    expect(renderer).toBeUndefined();
    expect(element.querySelector('article')?.textContent).toBe('# Native fallback');
  });

  it('edits inside the existing Cherry preview surface and writes Markdown back', async () => {
    const element = root();
    element.className = 'cherry-previewer cherry-markdown theme__default';
    let renderer: CherryPreviewContentRenderer | undefined;
    let markdown = '# Before\n\nCherry preview body.';
    const engine = { makeHtml: vi.fn((value: string) => `<h1>${value}</h1>`) };
    const previewer = {
      getDom: () => element,
      setContentRenderer: vi.fn((next: CherryPreviewContentRenderer) => {
        renderer = next;
      }),
      clearContentRenderer: vi.fn((target?: CherryPreviewContentRenderer) => {
        if (!renderer || (target && target !== renderer)) return false;
        renderer = undefined;
        return true;
      }),
      update: vi.fn((html: string) => {
        if (renderer) return renderer.update({ container: element, markdown, html });
        element.innerHTML = html;
      }),
    };
    const host: CherryMilkdownHost = {
      engine,
      getMarkdown: () => markdown,
      getPreviewer: () => previewer,
      setValue: vi.fn((value: string) => {
        markdown = value;
      }),
    };

    const instance = await attachCherryMilkdownPreview(host, { debounce: 0 });
    instances.push(instance);

    expect(element.classList.contains('cherry-previewer')).toBe(true);
    expect(element.classList.contains('cherry-markdown')).toBe(true);
    expect(element.querySelector('h1')?.textContent).toBe('Before');
    expect(instance.engine).toBe(engine);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(host.setValue).not.toHaveBeenCalled();

    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let headingEnd = -1;
    view.state.doc.descendants((node, position) => {
      if (node.isText && node.text === 'Before') headingEnd = position + node.nodeSize;
    });
    vi.mocked(host.setValue).mockClear();
    view.dispatch(view.state.tr.insertText(' editable', headingEnd));
    await vi.waitFor(() =>
      expect(host.setValue).toHaveBeenCalledWith(
        expect.stringContaining('Before editable'),
        true,
        expect.objectContaining({ source: expect.stringContaining('@cherry-markdown/milkdown:'), revision: 1 }),
      ),
    );
    expect(markdown).toContain('Before editable');

    markdown = '# From source editor';
    await previewer.update(engine.makeHtml(markdown));
    expect(element.querySelector('h1')?.textContent).toBe('From source editor');

    await instance.detach();
    expect(previewer.clearContentRenderer).toHaveBeenCalled();
    expect(element.classList.contains('cherry-milkdown--previewer')).toBe(false);
    expect(element.textContent).toContain('# From source editor');
  });

  it('synchronizes a local transaction in the current microtask instead of waiting for listener debounce', async () => {
    const element = root();
    let renderer: CherryPreviewContentRenderer | undefined;
    let markdown = 'Use `a` here.';
    const host: CherryMilkdownHost = {
      engine: { makeHtml: (value: string) => `<p>${value}</p>` },
      getMarkdown: () => markdown,
      getPreviewer: () => ({
        getDom: () => element,
        setContentRenderer: (next) => {
          renderer = next;
        },
        clearContentRenderer: () => {
          renderer = undefined;
          return true;
        },
        update: (html) => renderer?.update({ container: element, markdown, html }),
      }),
      setValue: vi.fn((value: string) => {
        markdown = value;
      }),
    };
    const instance = await attachCherryMilkdownPreview(host, { debounce: 1000 });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let position = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === 'a') position = pos + 1;
    });

    view.dispatch(view.state.tr.insertText('bc', position));
    await Promise.resolve();

    expect(host.setValue).toHaveBeenCalledTimes(1);
    expect(markdown).toContain('`abc`');

    const updateContext = vi.mocked(host.setValue).mock.calls[0]?.[2];
    await renderer?.update({
      container: element,
      markdown: 'Use `stale` here.',
      html: '<p>stale</p>',
      updateContext: { ...updateContext, revision: 0 },
    });
    expect(instance.getMarkdown()).toContain('`abc`');

    await renderer?.update({
      container: element,
      markdown: 'Use `external` here.',
      html: '<p>external</p>',
      updateContext: { source: 'external-api', revision: 1 },
    });
    expect(instance.getMarkdown()).toContain('`external`');
  });

  it('keeps 50 rapid inline-code edits monotonic while public notifications stay debounced', async () => {
    const element = root();
    const immediate: string[] = [];
    const onChange = vi.fn();
    const instance = await createCherryMilkdown({
      root: element,
      value: 'Use `x` here.',
      debounce: 1000,
      onImmediateChange: ({ markdown }) => immediate.push(markdown),
      onChange,
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let position = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.isText && node.text === 'x') position = pos + 1;
    });

    for (let index = 0; index < 50; index += 1) {
      view.dispatch(view.state.tr.insertText(String(index % 10), position + index));
      await Promise.resolve();
      expect(immediate.at(-1)).toContain(`\`x${Array.from({ length: index + 1 }, (_, i) => i % 10).join('')}\``);
    }

    expect(immediate).toHaveLength(50);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a single editable content surface with no raw cards or preview pane', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '# Hello\n\n[[toc]]\n\nText !!red color!!, ==highlight== and $E=mc^2$.',
    });
    instances.push(instance);

    expect(element.querySelector('h1')?.textContent).toBe('Hello');
    expect(element.querySelector('.toc')).not.toBeNull();
    expect(element.querySelector('.cherry-wysiwyg-color')?.textContent).toBe('color');
    expect(element.querySelector('.cherry-wysiwyg-highlight')?.textContent).toBe('highlight');
    expect(element.querySelector('math-field')).not.toBeNull();
    expect(element.querySelector('[data-cherry-raw]')).toBeNull();
    expect(element.querySelector('textarea')).toBeNull();
  });

  it('does not turn Cherry document content into native form controls', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: [
        '---',
        'title: Cherry',
        '---',
        '',
        ':::warning Notice',
        'Body',
        ':::',
        '',
        '[ref]: https://example.com',
        '',
        '```mermaid',
        'graph TD; A-->B;',
        '```',
      ].join('\n'),
    });
    instances.push(instance);

    expect(element.querySelector('input, select, textarea')).toBeNull();
    expect(element.querySelectorAll('[contenteditable="true"]')).not.toHaveLength(0);
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

  it('keeps Cherry link attributes out of the visible text and round-trips them', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '[Cherry](https://example.com){target=\\_blank}',
    });
    instances.push(instance);

    const link = element.querySelector<HTMLAnchorElement>('a');
    expect(element.querySelector('.ProseMirror')?.textContent).toBe('Cherry');
    expect(link?.target).toBe('');
    link?.addEventListener('click', (event) => event.preventDefault());
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toContain('noopener');
    expect(instance.getMarkdown()).toContain('{target=\\_blank}');
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

  it('renders and round-trips nested foreground and background colors', async () => {
    const element = root();
    const value = '[!!#ffffff !!!#000000 black on white!!!!!](https://example.com)';
    const instance = await createCherryMilkdown({ root: element, value });
    instances.push(instance);

    const foreground = element.querySelector<HTMLElement>('.cherry-wysiwyg-color');
    const background = element.querySelector<HTMLElement>('.cherry-wysiwyg-bg');
    expect(foreground?.textContent).toBe('black on white');
    expect(background?.textContent).toBe('black on white');
    expect(foreground?.style.color).toBe('rgb(255, 255, 255)');
    expect(background?.style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(instance.getMarkdown()).toContain('!!#ffffff !!!#000000 black on white!!!!!');
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

  it('renders a table chart with Cherry HTML, preserves its exact source, and cleans rendered resources', async () => {
    const element = root();
    const value = ['| :line:{"title":"Trend"} | Jan | Feb |', '| --- | ---: | ---: |', '| Sales | 1 | 2 |'].join('\n');
    const engine = {
      makeHtml: vi.fn(
        () =>
          '<div class="cherry-table-wrapper"><table class="cherry-table"><tbody><tr><td>Sales</td></tr></tbody></table></div><figure class="cherry-table-figure"><div class="cherry-echarts-wrapper"></div></figure>',
      ),
      destroyRenderedContent: vi.fn(),
    };
    const instance = await createCherryMilkdown({ root: element, value, engine, debounce: 0 });
    instances.push(instance);

    expect(instance.getMarkdown().trim()).toBe(value);
    expect(element.querySelector('.cherry-echarts-wrapper')).not.toBeNull();
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    element.querySelector<HTMLButtonElement>('[aria-label="在节点内编辑表格图表源码"]')?.click();
    expect(element.querySelector('.cherry-table-chart')?.classList.contains('is-editing')).toBe(true);
    expect(view.state.selection).toBeInstanceOf(NodeSelection);
    const source = element.querySelector<HTMLElement>('.cherry-table-chart__source code');
    expect(source?.textContent).toBe(value);
    if (source) {
      source.innerText = value.replace('Trend', 'Updated').replace('| Sales | 1 | 2 |', '| Sales | 3 | 5 |');
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }

    expect(instance.getMarkdown()).toContain('"title":"Updated"');
    expect(instance.getMarkdown()).toContain('| Sales | 3 | 5 |');
    expect(view.state.selection).toBeInstanceOf(NodeSelection);
    await instance.destroy();
    instances.splice(instances.indexOf(instance), 1);
    expect(engine.destroyRenderedContent).toHaveBeenCalled();
  });

  it('keeps preview tables directly editable without mounting floating component chrome', async () => {
    const element = root();
    const cherry = new Cherry({
      el: element,
      value: '| Name | Value |\n| --- | --- |\n| Milkdown | WYSIWYG |',
      extensions: [milkdown({ debounce: 0 })],
    });

    await vi.waitFor(() => expect(element.querySelector('.cherry-milkdown--previewer table')).not.toBeNull());
    expect(element.querySelector('.milkdown-table-block')).toBeNull();
    expect(element.querySelector('.cherry-milkdown--previewer td')?.closest('.ProseMirror')).not.toBeNull();
    expect(element.querySelector('.cherry-milkdown--previewer .ProseMirror')?.getAttribute('contenteditable')).toBe(
      'true',
    );

    cherry.destroy();
    await vi.waitFor(() => expect(element.childElementCount).toBe(0));
  });

  it('mounts the complete Cherry manual once without an initial synchronization write', async () => {
    const element = root();
    const onChange = vi.fn();
    const instance = await createCherryMilkdown({
      root: element,
      value: fullManual,
      nativePreview: true,
      debounce: 0,
      onChange,
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let frontmatterCount = 0;
    view.state.doc.descendants((node) => {
      if (node.type.name === 'cherry_frontmatter') frontmatterCount += 1;
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(frontmatterCount).toBe(0);
    expect(onChange.mock.calls.length).toBe(0);
    expect(element.querySelectorAll('.milkdown-table-block')).toHaveLength(0);

    await instance.destroy();
    instances.splice(instances.indexOf(instance), 1);
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

    expect(element.querySelector('.toc')?.textContent).toContain('After');
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
    expect(nodes[0]?.classList.contains('cherry-panel')).toBe(true);
    expect(nodes[0]?.querySelector('.cherry-panel--title')).not.toBeNull();
    expect(nodes[0]?.querySelector('.cherry-panel--body')).not.toBeNull();
    expect(nodes[0]?.querySelector('input, select, textarea')).toBeNull();
    expect(nodes[0]?.querySelector<HTMLButtonElement>('[title="增加项目"]')?.hidden).toBe(true);
    expect(nodes[1]?.dataset.type).toBe('mermaid');
    expect(nodes[1]?.querySelector<HTMLElement>('.cherry-embed__source')?.hidden).toBe(true);
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

  it('edits compound titles in place without form controls', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: ':::warning Before\nBody\n:::' });
    instances.push(instance);
    const title = element.querySelector<HTMLElement>('.cherry-compound__title');

    expect(title?.contentEditable).toBe('true');
    expect(
      element.querySelector('.cherry-compound input, .cherry-compound select, .cherry-compound textarea'),
    ).toBeNull();
    if (title) {
      title.textContent = 'After';
      title.dispatchEvent(new Event('input', { bubbles: true }));
    }

    expect(instance.getMarkdown()).toContain(':::warning After');
  });

  it('selects Detail from real header mouse input while its title remains directly editable', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: '+++ 更多能力\n正文\n+++' });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const detail = element.querySelector<HTMLDetailsElement>('[data-role="detail-item"]');
    const header = detail?.querySelector<HTMLElement>('.cherry-compound-item__header');
    const label = detail?.querySelector<HTMLElement>('.cherry-compound-item__label');
    const disclosure = detail?.querySelector<HTMLButtonElement>('.cherry-compound-item__disclosure');

    expect(detail?.open).toBe(false);
    header?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    expect(view.state.selection).toBeInstanceOf(NodeSelection);
    expect((view.state.selection as NodeSelection).node.type.name).toBe('cherry_compound_item');

    label?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(detail?.open).toBe(false);
    if (label) {
      label.textContent = '直接编辑后的更多能力';
      label.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain('+++ 直接编辑后的更多能力');

    disclosure?.click();
    expect(detail?.open).toBe(true);
  });

  it('routes Cherry toolbar commands to the focused Milkdown selection', async () => {
    const element = root();
    let markdown = 'Before and after';
    let bridge: CherryPreviewEditingBridge | undefined;
    let renderer: CherryPreviewContentRenderer | undefined;
    const previewer = {
      getDom: () => element,
      setContentRenderer: (next: CherryPreviewContentRenderer) => {
        renderer = next;
      },
      clearContentRenderer: () => {
        renderer = undefined;
        return true;
      },
      update: (html: string) => renderer?.update({ container: element, markdown, html }),
      setEditingBridge: (next: typeof bridge) => {
        bridge = next;
      },
      clearEditingBridge: () => {
        bridge = undefined;
        return true;
      },
    };
    const host: CherryMilkdownHost = {
      engine: { makeHtml: (value: string) => value },
      getMarkdown: () => markdown,
      getPreviewer: () => previewer,
      getCodeMirror: () => ({ hasFocus: false }),
      setValue: vi.fn((value: string) => {
        markdown = value;
      }),
    };
    const instance = await attachCherryMilkdownPreview(host, { debounce: 0 });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let start = -1;
    view.state.doc.descendants((node, position) => {
      if (node.isText && node.text?.startsWith('Before')) start = position;
    });
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, start + 6)));
    element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(bridge?.runCommand?.({ name: 'bold', shortKey: '', menu: {} })).toBe(true);
    await vi.waitFor(() => expect(markdown).toContain('**Before**'));
    expect(instance.getMarkdown()).toContain('**Before**');

    expect(bridge?.runCommand?.({ name: 'h1', shortKey: '1', menu: {} })).toBe(true);
    await vi.waitFor(() => expect(view.state.doc.firstChild?.type.name).toBe('heading'));
    expect(view.state.doc.firstChild?.attrs.level).toBe(1);
    expect(bridge?.runCommand?.({ name: 'h1', shortKey: '1', menu: {} })).toBe(true);
    await vi.waitFor(() => expect(view.state.doc.firstChild?.type.name).toBe('paragraph'));

    expect(bridge?.runCommand?.({ name: 'codeBlock', shortKey: '', menu: {} })).toBe(true);
    await vi.waitFor(() => expect(view.state.doc.firstChild?.type.name).toBe('code_block'));
    expect(instance.getMarkdown()).toContain('```');

    const search = bridge?.getSearchAdapter?.();
    const after = search?.getDocString().indexOf('after') ?? -1;
    search?.setSelection(after, after + 5);
    expect(search?.getSelectedText()).toBe('after');
    search?.replaceRange('Milkdown', after, after + 5);
    await vi.waitFor(() => expect(markdown).toContain('Milkdown'));

    let hasUploadedImage = false;
    const imageMenu = {
      onClick: (selection: string) => {
        if (!hasUploadedImage) {
          hasUploadedImage = true;
          return selection;
        }
        return '![uploaded](https://example.com/image.png)';
      },
    };
    expect(bridge?.runCommand?.({ name: 'image', shortKey: '', menu: imageMenu })).toBe(true);
    expect(bridge?.runCommand?.({ name: 'image', shortKey: '', menu: imageMenu })).toBe(true);
    await vi.waitFor(() => expect(markdown).toContain('![uploaded](https://example.com/image.png)'));

    const image = element.querySelector<HTMLImageElement>('.ProseMirror img[src]');
    expect(image).not.toBeNull();
    expect(bridge?.updateImage?.(image!, { width: '160px', height: '90px' })).toBe(true);
    await vi.waitFor(() => expect(markdown).toContain('![uploaded#160px#90px](https://example.com/image.png)'));
    expect(bridge?.updateImage?.(image!, { type: 'border' })).toBe(true);
    await vi.waitFor(() => expect(markdown).toContain('![uploaded#160px#90px#B](https://example.com/image.png)'));
    expect(bridge?.updateImage?.(image!, { type: 'center' })).toBe(true);
    await vi.waitFor(() =>
      expect(markdown).toContain('![uploaded#160px#90px#B#center](https://example.com/image.png)'),
    );
  });

  it('keeps Cherry source and Milkdown preview synchronized during TOC navigation and scrolling', async () => {
    const element = root();
    let markdown = '# First\n\n[[toc]]\n\n## Second\n\nBody';
    let bridge: CherryPreviewEditingBridge | undefined;
    let renderer: CherryPreviewContentRenderer | undefined;
    let codeMirrorHasFocus = false;
    const scrollToLineNum = vi.fn();
    const previewer = {
      getDom: () => element,
      setContentRenderer: (next: CherryPreviewContentRenderer) => {
        renderer = next;
      },
      clearContentRenderer: () => {
        renderer = undefined;
        return true;
      },
      update: (html: string) => renderer?.update({ container: element, markdown, html }),
      setEditingBridge: (next: typeof bridge) => {
        bridge = next;
      },
      clearEditingBridge: () => {
        bridge = undefined;
        return true;
      },
    };
    const host: CherryMilkdownHost = {
      engine: { makeHtml: (value: string) => value },
      editor: { scrollToLineNum },
      getMarkdown: () => markdown,
      getPreviewer: () => previewer,
      getCodeMirror: () => ({ hasFocus: codeMirrorHasFocus }),
      setValue: vi.fn((value: string) => {
        markdown = value;
      }),
    };
    const instance = await attachCherryMilkdownPreview(host, { debounce: 0 });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const blocks = Array.from(view.dom.children) as HTMLElement[];
    element.getBoundingClientRect = () =>
      ({ top: 0, bottom: 400, left: 0, right: 600, width: 600, height: 400, x: 0, y: 0, toJSON() {} }) as DOMRect;
    blocks.forEach((block, index) => {
      block.getBoundingClientRect = () => {
        const top = index * 100 - element.scrollTop;
        return {
          top,
          bottom: top + 100,
          left: 0,
          right: 600,
          width: 600,
          height: 100,
          x: 0,
          y: top,
          toJSON() {},
        } as DOMRect;
      };
    });

    const secondTocLink = element.querySelector<HTMLAnchorElement>('.cherry-source-node--cherry_toc a[href="#second"]');
    const secondHeading = element.querySelector<HTMLElement>('#second');
    expect(secondTocLink).not.toBeNull();
    expect(secondHeading).not.toBeNull();
    if (secondHeading) secondHeading.scrollIntoView = vi.fn();
    secondTocLink?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(scrollToLineNum).toHaveBeenLastCalledWith(4, 5, 0);

    element.scrollTop = 0;
    codeMirrorHasFocus = true;
    bridge?.handleEditorScroll?.(4, 0);
    expect(element.scrollTop).toBe(200);

    scrollToLineNum.mockClear();
    codeMirrorHasFocus = false;
    view.dom.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    bridge?.handleScroll?.(element);
    expect(scrollToLineNum).toHaveBeenLastCalledWith(4, 5, 0);
  });

  it('keeps ordinary fenced code directly editable with Cherry code-block chrome', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '```js\nconst value = 1;\n```',
      nativePreview: true,
      debounce: 0,
    });
    instances.push(instance);

    const codeBlock = element.querySelector<HTMLElement>('.cherry-milkdown-code-block');
    expect(codeBlock).not.toBeNull();
    expect(codeBlock?.classList.contains('cherry-milkdown-code-block')).toBe(true);
    expect(codeBlock?.closest('.cherry-embed')).toBeNull();
    expect(codeBlock?.querySelector('code')?.textContent).toBe('const value = 1;');

    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let codePosition = -1;
    view.state.doc.descendants((node, position) => {
      if (node.type.name === 'code_block') codePosition = position;
    });
    view.dispatch(view.state.tr.insertText('\nconst next = 2;', codePosition + 'const value = 1;'.length + 1));
    await vi.waitFor(() => expect(instance.getMarkdown()).toContain('const next = 2;'));
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

  it('keeps frontmatter compact and edits its source in place', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '---\ntitle: Before\nowner: Cherry\n---\n\nBody',
    });
    instances.push(instance);
    expect(element.querySelector('.cherry-source-node--cherry_frontmatter input')).toBeNull();
    element.querySelector<HTMLElement>('.cherry-source-node--cherry_frontmatter .cherry-source-node__header')?.click();
    const source = element.querySelector<HTMLElement>('.cherry-source-node--cherry_frontmatter code');
    expect(source?.hidden).toBe(false);
    if (source) {
      source.textContent = source.textContent?.replace('Before', 'After') ?? '';
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain('title: After');
  });

  it('keeps Tabs in one source-preserving native visual node', async () => {
    const element = root();
    const value = ':::tabs\n:: First\nOne\n:::\n';
    const instance = await createCherryMilkdown({ root: element, value });
    instances.push(instance);
    expect(instance.getMarkdown().trim()).toBe(value.trim());
    selectNode(instance, 'cherry_native_block');
    element
      .querySelector<HTMLButtonElement>('.cherry-embed--cherry_native_block .cherry-embed__controls button')
      ?.click();
    expect(element.querySelector<HTMLElement>('.cherry-embed--cherry_native_block .cherry-embed__source')?.hidden).toBe(
      false,
    );
  });

  it('opens diagram source inside the selected node only when requested', async () => {
    const element = root();
    const instance = await createCherryMilkdown({
      root: element,
      value: '```mermaid\ngraph TD; A-->B;\n```',
      debounce: 0,
    });
    instances.push(instance);
    selectNode(instance, 'cherry_diagram');
    const sourcePanel = element.querySelector<HTMLElement>('.cherry-embed__source');
    expect(sourcePanel?.hidden).toBe(true);
    element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.click();
    expect(sourcePanel?.hidden).toBe(false);
    const source = sourcePanel?.querySelector<HTMLElement>('code');
    expect(source?.textContent).toContain('A-->B');
    if (source) {
      source.textContent = 'graph TD; B-->C;';
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instance.getMarkdown()).toContain('B-->C');
  });

  it('updates Mermaid size and alignment through the preview editing bridge', async () => {
    const element = root();
    let markdown = '```mermaid\ngraph TD; A-->B;\n```';
    let bridge: CherryPreviewEditingBridge | undefined;
    let renderer: CherryPreviewContentRenderer | undefined;
    const previewer = {
      getDom: () => element,
      setContentRenderer: (next: CherryPreviewContentRenderer) => {
        renderer = next;
      },
      clearContentRenderer: () => {
        renderer = undefined;
        return true;
      },
      update: (html: string) => renderer?.update({ container: element, markdown, html }),
      setEditingBridge: (next: typeof bridge) => {
        bridge = next;
      },
      clearEditingBridge: () => {
        bridge = undefined;
        return true;
      },
    };
    const host: CherryMilkdownHost = {
      engine: { makeHtml: (value: string) => value },
      getMarkdown: () => markdown,
      getPreviewer: () => previewer,
      getCodeMirror: () => ({ hasFocus: false }),
      setValue: vi.fn((value: string) => {
        markdown = value;
      }),
    };
    const instance = await attachCherryMilkdownPreview(host, { debounce: 0 });
    instances.push(instance);
    const figure = element.querySelector<HTMLElement>('.cherry-embed--cherry_diagram[data-type="mermaid"]');

    expect(figure).not.toBeNull();
    expect(bridge?.updateMermaid?.(figure!, { width: '360px', height: '240px' })).toBe(true);
    await vi.waitFor(() => expect(markdown).toContain('```mermaid #360px #240px'));
    expect(figure?.style.width).toBe('360px');
    expect(figure?.style.height).toBe('240px');
    expect(bridge?.updateMermaid?.(figure!, { type: 'center' })).toBe(true);
    await vi.waitFor(() => expect(markdown).toContain('```mermaid #360px #240px #center'));
    expect(figure?.classList.contains('cherry-mermaid-align-center')).toBe(true);
  });

  it('uses the sanitized Cherry engine shell for HTML and keeps source editing next to the selected node', async () => {
    const element = root();
    const makeHtml = vi.fn(
      (source: string) => `<div class="cherry-native-html" onclick="window.__bad=true">${source}</div>`,
    );
    const instance = await createCherryMilkdown({
      root: element,
      value: '<div>\nsafe\n<script>window.__bad = true</script>\n</div>',
      engine: { makeHtml },
    });
    instances.push(instance);
    selectNode(instance, 'cherry_html_block');
    const shell = element.querySelector<HTMLElement>('.cherry-native-html');
    expect(makeHtml).toHaveBeenCalledWith(expect.stringContaining('<div>'));
    expect(shell).not.toBeNull();
    expect(shell?.hasAttribute('onclick')).toBe(false);
    expect(shell?.querySelector('script')).toBeNull();
    expect(element.querySelector('iframe')).toBeNull();
    element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.click();
    expect(element.querySelector('.cherry-embed__source code')).not.toBeNull();
    expect(element.querySelector('.cherry-embed textarea')).toBeNull();
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

  it('preserves the active text selection across API/source Markdown synchronization', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: 'Before selected text after.' });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const paragraph = view.state.doc.firstChild;
    const start = (paragraph?.textContent.indexOf('selected text') ?? 0) + 1;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, start + 13)));

    instance.setMarkdown('Prefix.\n\nBefore selected text after.', { emit: false });

    const selection = view.state.selection;
    expect(view.state.doc.textBetween(selection.from, selection.to)).toBe('selected text');
  });

  it('applies external Markdown as a minimal ProseMirror transaction', async () => {
    const element = root();
    const instance = await createCherryMilkdown({ root: element, value: 'Stable paragraph.\n\nBefore.' });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const unchangedParagraph = view.state.doc.firstChild;

    instance.setMarkdown('Stable paragraph.\n\nAfter.', { emit: false });

    expect(view.state.doc.firstChild).toBe(unchangedParagraph);
    expect(view.state.doc.lastChild?.textContent).toBe('After.');
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
    expect(element.querySelector<HTMLElement>('.cherry-embed__source')?.hidden).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.hidden).toBe(true);
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
