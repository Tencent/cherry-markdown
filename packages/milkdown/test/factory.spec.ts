import { editorViewCtx } from '@milkdown/kit/core';
import { NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cherryMilkdown, type CherryMilkdownInstance } from '../src';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg data-rendered-mermaid="true"></svg>' })),
  },
}));

vi.mock('mathlive', () => ({}));

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

describe('cherryMilkdown WYSIWYG', () => {
  it('does not emit an old draft after a silent API update', async () => {
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: root(), value: 'Before', debounce: 10, onChange });
    instances.push(instance);
    instance.setMarkdown('Pending');
    instance.setMarkdown('Latest', { emit: false });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onChange).not.toHaveBeenCalled();
    expect(instance.getMarkdown()).toBe('Latest');
  });

  it('keeps sibling DOM and isolated instances intact during destruction', async () => {
    const container = root();
    const sibling = document.createElement('span');
    sibling.textContent = 'Consumer-owned';
    container.append(sibling);
    const first = await cherryMilkdown({ el: container, value: 'One' });
    const second = await cherryMilkdown({ el: root(), value: 'Two' });
    instances.push(first, second);
    await first.destroy();
    await first.destroy();
    expect(container.textContent).toBe('Consumer-owned');
    expect(second.getMarkdown()).toBe('Two');
    second.setMarkdown('Independent');
    expect(second.getMarkdown()).toBe('Independent');
  });
  it('keeps 50 rapid inline-code edits monotonic while public notifications stay debounced', async () => {
    const element = root();
    const onChange = vi.fn();
    const instance = await cherryMilkdown({
      el: element,
      value: 'Use `x` here.',
      debounce: 1000,
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
      expect(instance.getMarkdown()).toContain(`\`x${Array.from({ length: index + 1 }, (_, i) => i % 10).join('')}\``);
    }

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a single editable content surface with no raw cards or preview pane', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
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

  it('keeps native controls limited to compound labels', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
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

    expect(element.querySelectorAll('input')).not.toHaveLength(0);
    expect(element.querySelector('.ProseMirror select, .ProseMirror textarea')).toBeNull();
    expect(element.querySelector('.cherry-milkdown-node-controls')).toBeNull();
    expect(element.querySelectorAll('[contenteditable="true"]')).not.toHaveLength(0);
  });

  it('keeps Cherry visual syntax reversible through Markdown serialization', async () => {
    const element = root();
    const value = [
      '[[toc]]',
      '',
      'Text !!#f00 red!!, !!!#fff bg!!!, !18 size!, ^^sub^^, ^sup^, {字|zi}, /under/, ==mark==.',
    ].join('\n');
    const instance = await cherryMilkdown({ el: element, value });
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
    const instance = await cherryMilkdown({
      el: element,
      value: '[Cherry](https://example.com){target=\\_blank}',
    });
    instances.push(instance);

    const link = element.querySelector<HTMLAnchorElement>('.ProseMirror a');
    expect(element.querySelector('.ProseMirror')?.textContent).toBe('Cherry');
    expect(link?.target).toBe('');
    const paragraphHtml = link?.parentElement?.innerHTML;
    link?.addEventListener('click', (event) => event.preventDefault());
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(link?.target).toBe('');
    expect(link?.rel).toBe('');
    expect(link?.parentElement?.innerHTML).toBe(paragraphHtml);

    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(open).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener');
    expect(instance.getMarkdown()).toContain('{target=\\_blank}');
  });

  it('edits Cherry typography directly while preserving its Markdown mark', async () => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: 'Text !!red color!!.' });
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
    const instance = await cherryMilkdown({
      el: element,
      value: '!!#f00 red!! !20 large! {字|zi}',
    });
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
    const instance = await cherryMilkdown({ el: element, value });
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
    const instance = await cherryMilkdown({
      el: element,
      value: '| Name | Value |\n| --- | --- |\n| Milkdown | WYSIWYG |',
    });
    instances.push(instance);
    expect(element.querySelector('.ProseMirror table')).not.toBeNull();
    expect(element.querySelectorAll('.ProseMirror td')).toHaveLength(2);
    expect(element.querySelector('.ProseMirror table')?.closest('[data-cherry-visual]')).toBeNull();
  });

  it('uses Cherry icon-font task markers instead of Unicode checkbox glyphs', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '- [ ] todo\n- [x] done',
    });
    instances.push(instance);

    const items = [...element.querySelectorAll<HTMLLIElement>('li[data-item-type="task"]')];
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.classList.contains('cherry-list-item'))).toBe(true);
    expect(items.every((item) => item.classList.contains('check-list-item'))).toBe(true);
    expect(items.map((item) => item.querySelector('.ch-icon')?.className)).toEqual([
      expect.stringContaining('ch-icon-square'),
      expect.stringContaining('ch-icon-check'),
    ]);
  });

  it('renders a table chart with Cherry HTML, preserves its exact source, and cleans rendered resources', async () => {
    const element = root();
    const value = ['| :line:{"title":"Trend"} | Jan | Feb |', '| --- | ---: | ---: |', '| Sales | 1 | 2 |'].join('\n');
    const destroyChart = vi.fn();
    const engine = {
      makeHtml: vi.fn(
        () =>
          '<div class="cherry-table-wrapper"><table class="cherry-table"><tbody><tr><td>Sales</td></tr></tbody></table></div><figure class="cherry-table-figure"><div class="cherry-echarts-wrapper"></div></figure>',
      ),
      destroyRenderedContent: destroyChart,
    };
    const instance = await cherryMilkdown({ el: element, value, engine, debounce: 0 });
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
    expect(destroyChart).toHaveBeenCalled();
  });

  it('does not insert a synthetic paragraph between a table chart and the following Cherry block', async () => {
    const element = root();
    const value = [
      '| :line:{"title":"Trend"} | Jan | Feb |',
      '| --- | ---: | ---: |',
      '| Sales | 1 | 2 |',
      '',
      ':::warning Notice',
      'Panel body.',
      ':::',
    ].join('\n');
    const engine = {
      makeHtml: () =>
        '<div class="cherry-table-wrapper"><figure class="cherry-table-figure"><div class="cherry-echarts-wrapper"></div></figure><table><tbody><tr><td>Sales</td></tr></tbody></table></div>',
    };
    const instance = await cherryMilkdown({ el: element, value, engine });
    instances.push(instance);

    const chart = element.querySelector('.cherry-table-chart');
    expect(chart).not.toBeNull();
    expect(chart?.nextElementSibling?.classList.contains('cherry-panel')).toBe(true);
    expect(element.querySelector('.cherry-table-chart + p:empty + .cherry-panel')).toBeNull();
  });

  it('enhances a table chart nested in Cherry-owned columns without rendering the fenced example', async () => {
    const element = root();
    const chart = [
      '| :line:{"title":"Real"} | Jan | Feb |',
      '| --- | --- | --- |',
      '| Sales | 1 | 2 |',
    ].join('\n');
    const value = [
      '::: 2cols',
      '```markdown',
      chart.replace('Real', 'Example'),
      '```',
      '::',
      chart,
      ':::',
    ].join('\n');
    const renderer = vi.fn(({ container }) => {
      container.innerHTML = '<svg data-nested-table-chart="true"></svg>';
    });
    const engine = {
      makeHtml: vi.fn(
        () =>
          '<div class="cherry-panel-cols cherry-panel-cols__2cols"><pre><code>example</code></pre><div class="cherry-table-wrapper"><table><thead><tr><th>Ordinary</th></tr></thead></table></div><div class="cherry-table-wrapper" data-chart-table><table><thead><tr><th>:line:{"title":"Real"}</th></tr></thead></table></div></div>',
      ),
    };
    const instance = await cherryMilkdown({ el: element, value, engine, renderers: { tableChart: renderer } });
    instances.push(instance);
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(1));

    expect(renderer).toHaveBeenCalledWith(expect.objectContaining({ source: chart, syntax: 'line' }));
    expect(element.querySelectorAll('[data-nested-table-chart]')).toHaveLength(1);
    expect(element.querySelector('[data-chart-table] .cherry-table-figure')).not.toBeNull();
    expect(element.querySelector('.cherry-table-wrapper:not([data-chart-table]) .cherry-table-figure')).toBeNull();
    expect(element.querySelector('.cherry-panel-cols__2cols pre .cherry-table-figure')).toBeNull();
  });

  it('mounts the complete Cherry manual once without an initial synchronization write', async () => {
    const element = root();
    const onChange = vi.fn();
    const instance = await cherryMilkdown({
      el: element,
      value: fullManual,
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
    expect(element.querySelectorAll('.milkdown-table-block')).toHaveLength(2);

    await instance.destroy();
    instances.splice(instances.indexOf(instance), 1);
  }, 15_000);

  it('updates the visual TOC when a heading is edited', async () => {
    const element = root();
    const instance = await cherryMilkdown({ el: element, value: '# Before\n\n[[toc]]' });
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
    const instance = await cherryMilkdown({
      el: element,
      value: '::: warning\nPanel body\n:::\n\n```mermaid\ngraph TD; A-->B;\n```',
    });
    instances.push(instance);
    const nodes = element.querySelectorAll<HTMLElement>('.cherry-compound, .cherry-embed--cherry_diagram');
    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.textContent).toContain('Panel body');
    expect(nodes[0]?.classList.contains('cherry-panel')).toBe(true);
    expect(nodes[0]?.querySelector('.cherry-panel--title')).not.toBeNull();
    expect(nodes[0]?.querySelector('.cherry-panel--body')).not.toBeNull();
    expect(nodes[0]?.querySelector('.cherry-compound__title')).not.toBeNull();
    expect(nodes[0]?.querySelector('select, textarea')).toBeNull();
    expect(nodes[0]?.querySelector<HTMLButtonElement>('[title="增加项目"]')?.hidden).toBe(true);
    expect(nodes[1]?.dataset.type).toBe('mermaid');
    expect(nodes[1]?.querySelector<HTMLElement>('.cherry-embed__source')?.hidden).toBe(true);
    await vi.waitFor(() => expect(nodes[1]?.querySelector('[data-rendered-mermaid]')).not.toBeNull());
  });

  it('canonicalizes Cherry panel aliases instead of treating them as raw HTML', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: ':::p Alias title\nPanel body\n:::',
    });
    instances.push(instance);

    const panel = element.querySelector<HTMLElement>('.cherry-compound');
    expect(panel).not.toBeNull();
    expect(panel?.classList.contains('cherry-panel__primary')).toBe(true);
    expect(panel?.querySelector('[title="在节点内编辑源码"]')).toBeNull();
    expect((panel?.querySelector('.cherry-compound__title') as HTMLInputElement | null)?.value).toBe('Alias title');
    expect(instance.getMarkdown()).toContain(':::p Alias title');
  });

  it('uses a custom renderer for other visual diagram nodes', async () => {
    const element = root();
    const renderer = vi.fn(async () => '<div data-rendered-echarts="true">Chart</div>');
    const instance = await cherryMilkdown({
      el: element,
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
    const instance = await cherryMilkdown({
      el: element,
      value: '::: warning\nBefore\n:::',
      debounce: 0,
    });
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

  it('edits compound titles in place with native text controls', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: ':::warning Before\nBody\n:::',
    });
    instances.push(instance);
    const title = element.querySelector<HTMLInputElement>('.cherry-compound__title');

    expect(title?.readOnly).toBe(false);
    if (title) {
      title.value = 'After';
      title.dispatchEvent(new Event('input', { bubbles: true }));
    }

    expect(instance.getMarkdown()).toContain(':::warning After');
  });

  it('selects Detail from real header mouse input while its title remains directly editable', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '+++ 更多能力\n正文\n+++',
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const detail = element.querySelector<HTMLElement>('[data-role="detail-item"]');
    const header = detail?.querySelector<HTMLElement>('.cherry-compound-item__header');
    const label = detail?.querySelector<HTMLElement>('.cherry-compound-item__label');
    const disclosure = detail?.querySelector<HTMLButtonElement>('.cherry-compound-item__disclosure');

    expect(detail?.dataset.open).toBe('false');
    header?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    expect(view.state.selection).toBeInstanceOf(NodeSelection);
    expect((view.state.selection as NodeSelection).node.type.name).toBe('cherry_compound_item');

    label?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(detail?.dataset.open).toBe('false');
    if (label) {
      (label as HTMLInputElement).value = '直接编辑后的更多能力';
      label.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain('+++ 直接编辑后的更多能力');

    disclosure?.click();
    expect(detail?.dataset.open).toBe('true');
  });

  it('keeps ordinary fenced code directly editable with Cherry code-block chrome', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '```js\nconst value = 1;\n```',
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
    const instance = await cherryMilkdown({ el: element, value: 'Formula $x+1$.' });
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
    const instance = await cherryMilkdown({
      el: element,
      value: '| A | B |\n| --- | --- |\n| 1 | 2 |',
    });
    instances.push(instance);
    expect(element.querySelector('.milkdown-table-block')).not.toBeNull();
  });

  it('keeps frontmatter compact and edits its source in place', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
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

  it('keeps Tabs native and source-stable while editing inside the node', async () => {
    const element = root();
    const value = ':::tabs\n:: First\nOne\n:::\n';
    const instance = await cherryMilkdown({ el: element, value });
    instances.push(instance);
    expect(instance.getMarkdown().trim()).toBe(value.trim());
    expect(element.querySelector('.cherry-embed--cherry_native_block .cherry-tabs')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.click();
    const source = element.querySelector<HTMLElement>('.cherry-embed__source code');
    expect(source).not.toBeNull();
    if (source) {
      source.textContent = source.textContent?.replace('First', 'Renamed') ?? '';
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(instance.getMarkdown()).toContain(':: Renamed');
  });

  it('opens diagram source inside the selected node only when requested', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: '```mermaid\ngraph TD; A-->B;\n```\n\n+++ More\nBody\n+++',
      debounce: 0,
    });
    instances.push(instance);
    selectNode(instance, 'cherry_diagram');
    const sourcePanel = element.querySelector<HTMLElement>('.cherry-embed__source');
    expect(sourcePanel?.hidden).toBe(true);
    const toggle = element.querySelector<HTMLButtonElement>('.cherry-embed__controls button');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    toggle?.click();
    expect(sourcePanel?.hidden).toBe(false);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(toggle?.classList.contains('is-active')).toBe(true);
    const source = sourcePanel?.querySelector<HTMLElement>('code');
    expect(source?.textContent).toContain('A-->B');
    if (source) {
      source.textContent = 'graph TD; B-->C;';
      source.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(instance.getMarkdown()).toContain('B-->C');
    expect(sourcePanel?.hidden).toBe(false);

    const disclosure = element.querySelector<HTMLButtonElement>('.cherry-compound-item__disclosure');
    disclosure?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    disclosure?.click();
    expect(sourcePanel?.hidden).toBe(false);
    toggle?.click();
    expect(sourcePanel?.hidden).toBe(true);
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });

  it('uses the sanitized Cherry engine shell for HTML and keeps source editing next to the selected node', async () => {
    const element = root();
    const makeHtml = vi.fn(
      (source: string) => `<div class="cherry-native-html" onclick="window.__bad=true">${source}</div>`,
    );
    const instance = await cherryMilkdown({
      el: element,
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

  it('keeps unknown business directives intact and edits them in the native Cherry shell', async () => {
    const element = root();
    const source = ':::business-card\nOpaque source\n:::';
    const instance = await cherryMilkdown({
      el: element,
      value: source,
      engine: { makeHtml: (value) => value },
    });
    instances.push(instance);
    expect(element.querySelector('.cherry-embed--cherry_native_block')).not.toBeNull();
    selectNode(instance, 'cherry_native_block');
    element.querySelector<HTMLButtonElement>('.cherry-embed__controls button')?.click();
    const editor = element.querySelector<HTMLElement>('.cherry-embed__source code');
    expect(editor).not.toBeNull();
    if (editor) {
      editor.textContent = ':::business-card\nUpdated source\n:::';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }
    await vi.waitFor(() => expect(instance.getMarkdown()).toContain('Updated source'));
  });

  it('updates Markdown and emits debounced changes without rendering a second pane', async () => {
    const element = root();
    const onChange = vi.fn();
    const instance = await cherryMilkdown({ el: element, debounce: 0, onChange });
    instances.push(instance);
    instance.setMarkdown('# Updated\n\n$E=mc^2$');
    await vi.waitFor(() => {
      expect(element.querySelector('h1')?.textContent).toBe('Updated');
      expect(onChange).toHaveBeenCalledWith({ markdown: expect.stringContaining('# Updated') });
    });
  });

  it('preserves the active text selection across API/source Markdown synchronization', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: 'Before selected text after.',
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const paragraph = view.state.doc.firstChild;
    const start = (paragraph?.textContent.indexOf('selected text') ?? 0) + 1;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, start + 13)));

    instance.setMarkdown('Prefix.\n\nBefore selected text after.', { emit: false });

    const { selection } = view.state;
    expect(view.state.doc.textBetween(selection.from, selection.to)).toBe('selected text');
  });

  it('maps a saved async-menu selection through intervening document changes', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: 'Before and after\n\nSecond paragraph.',
      engine: { makeHtml: (value: string) => value },
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let start = -1;
    view.state.doc.descendants((node, position) => {
      if (start < 0 && node.isText && node.text?.startsWith('Before')) start = position;
    });
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, start, start + 6)));
    const tracked = instance.trackSelection?.();

    const end = view.state.doc.content.size - 1;
    view.dispatch(view.state.tr.insertText(' updated', end));
    const mapped = tracked?.resolve();

    expect(mapped).not.toBeNull();
    expect(view.state.doc.textBetween(mapped!.from, mapped!.to)).toBe('Before');
    tracked?.release();
  });

  it('applies external Markdown as a minimal ProseMirror transaction', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
      value: 'Stable paragraph.\n\nBefore.',
    });
    instances.push(instance);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    const unchangedParagraph = view.state.doc.firstChild;

    instance.setMarkdown('Stable paragraph.\n\nAfter.', { emit: false });

    expect(view.state.doc.firstChild).toBe(unchangedParagraph);
    expect(view.state.doc.lastChild?.textContent).toBe('After.');
  });

  it('keeps embedded source editing disabled in readonly mode', async () => {
    const element = root();
    const instance = await cherryMilkdown({
      el: element,
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
    const instance = await cherryMilkdown({ el: element, value: '# Cleanup' });
    instance.focus();
    expect(instance.editor.action((ctx) => ctx.get(editorViewCtx)).hasFocus()).toBe(true);
    await instance.destroy();
    expect(element.childElementCount).toBe(0);
  });

  it('rejects invalid roots', async () => {
    await expect(cherryMilkdown({ el: null as unknown as HTMLElement })).rejects.toThrow(TypeError);
  });
});
