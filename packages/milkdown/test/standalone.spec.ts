import { afterEach, describe, expect, it, vi } from 'vitest';
import { editorViewCtx } from '@milkdown/kit/core';
import { redo, undo } from '@milkdown/kit/prose/history';
import { NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import type { CherryMilkdownInstance } from '../src';
import { supportsTextFormatting } from '../src';
import { echarts } from '../src/renderers/echarts';
import { createTestEditor as cherryMilkdown } from './helpers/create-editor';

vi.mock('mathlive', () => ({}));
const instances: CherryMilkdownInstance[] = [];
afterEach(async () => {
  await Promise.all(instances.splice(0).map((editor) => editor.destroy()));
  document.body.replaceChildren();
});
async function create(value: string, options = {}) {
  const el = document.createElement('div');
  document.body.append(el);
  const instance = await cherryMilkdown({ el, value, ...options });
  instances.push(instance);
  return instance;
}

function replaceText(instance: CherryMilkdownInstance, before: string, after: string) {
  const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
  let from = -1;
  view.state.doc.descendants((node, position) => {
    const offset = node.isText ? (node.text?.indexOf(before) ?? -1) : -1;
    if (from < 0 && offset >= 0) from = position + offset;
  });
  if (from < 0) throw new Error(`Missing document text: ${before}`);
  view.dispatch(view.state.tr.insertText(after, from, from + before.length));
  return view;
}

describe('standalone contracts', () => {
  it('keeps Cherry layout directives engine-owned instead of rebuilding their DOM', async () => {
    const source = ':::timeline History\n:: [done] 2025 First\nDescription\n:::';
    const instance = await create(source);
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.state.doc.firstChild?.type.name).toBe('cherry_native_block');
    expect(instance.getMarkdown()).toBe(source);
  });

  it('mounts nested table charts through package-owned descriptors', async () => {
    const chart = ['| :line:{"title":"Nested"} | Jan | Feb |', '| --- | --- | --- |', '| Sales | 1 | 2 |'].join('\n');
    const renderer = vi.fn(({ container }: { container: HTMLElement }) => {
      container.innerHTML = '<svg data-nested-table-chart="true"></svg>';
    });
    await create(['::: 2cols', 'Example', '::', chart, ':::'].join('\n'), { renderers: { tableChart: renderer } });

    await vi.waitFor(() => expect(document.querySelector('[data-nested-table-chart]')).not.toBeNull());
    expect(renderer).toHaveBeenCalledTimes(1);
    expect(renderer.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ syntax: 'line', source: expect.stringContaining(':line:{"title":"Nested"}') }),
    );
    expect(document.querySelector('.cherry-panel-cols__2cols')).not.toBeNull();
  });

  it('cleans completed nested renderers when a sibling chart fails', async () => {
    const cleanup = vi.fn();
    const onError = vi.fn();
    let call = 0;
    const renderer = vi.fn(() => {
      call += 1;
      if (call === 1) return cleanup;
      return new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('Nested failure')), 0));
    });
    const chart = (title: string) =>
      [`| :line:{"title":"${title}"} | Jan |`, '| --- | --- |', '| Sales | 1 |'].join('\n');
    await create(['::: 2cols', chart('First'), '::', chart('Second'), ':::'].join('\n'), {
      renderers: { tableChart: renderer },
      onError,
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-render-pending]')).toBeNull();
  });

  it('uses Cherry native preview structure without duplicating its layout styles', async () => {
    await create('# Native preview');
    const surface = document.querySelector<HTMLElement>('.cherry.cherry-milkdown');
    const editor = surface?.querySelector<HTMLElement>('.ProseMirror.cherry-previewer.cherry-markdown');
    expect(editor).not.toBeNull();
    expect(editor?.style.padding).toBe('');
    expect(editor?.style.backgroundColor).toBe('');
  });

  it('does not mount the removed imitation node controls', async () => {
    await create('![first#100px](first.png)');
    expect(document.querySelector('.cherry-milkdown-node-controls')).toBeNull();
  });

  it('isolates synchronous renderer failures and clears the error after a valid update', async () => {
    const onError = vi.fn();
    const renderer = vi.fn(({ source }: { source: string }) => {
      if (source.includes('invalid')) throw new Error('Invalid chart');
      return '<div data-chart="valid">Valid chart</div>';
    });
    const instance = await create('```echarts\ninvalid\n```', { renderers: { echarts: renderer }, onError });
    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    instance.setMarkdown('```echarts\nvalid\n```');
    await vi.waitFor(() => expect(document.querySelector('[data-chart="valid"]')).not.toBeNull());
    expect(document.querySelector('[data-render-error]')).toBeNull();
  });

  it('prevents a late diagram renderer from overwriting a newer chart', async () => {
    let completeOld: (() => void) | undefined;
    const cleanup = vi.fn();
    const renderer = vi.fn(({ source, container }: { source: string; container: HTMLElement }) => {
      if (source.includes('old')) {
        return new Promise<() => void>((resolve) => {
          completeOld = () => {
            container.textContent = 'Old chart';
            resolve(cleanup);
          };
        });
      }
      container.textContent = 'New chart';
      return undefined;
    });
    const instance = await create('```echarts\nold\n```', { renderers: { echarts: renderer } });
    await vi.waitFor(() => expect(completeOld).toBeDefined());
    instance.setMarkdown('```echarts\nnew\n```');
    await vi.waitFor(() => expect(document.querySelector('.cherry-embed__preview')?.textContent).toBe('New chart'));
    completeOld?.();
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
    expect(document.querySelector('.cherry-embed__preview')?.textContent).toBe('New chart');
  });

  it('aborts replaced and destroyed renderer revisions', async () => {
    const signals: AbortSignal[] = [];
    const renderer = vi.fn(({ signal }: { signal?: AbortSignal }) => {
      signals.push(signal!);
      return () => undefined;
    });
    const instance = await create('```echarts\nold\n```', { renderers: { echarts: renderer } });
    await vi.waitFor(() => expect(signals).toHaveLength(1));
    expect(signals[0]?.aborted).toBe(false);

    instance.setMarkdown('```echarts\nnew\n```');
    await vi.waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);

    await instance.destroy();
    instances.splice(instances.indexOf(instance), 1);
    expect(signals[1]?.aborted).toBe(true);
  });

  it('hot edits a configured custom fenced renderer and preserves its markdown', async () => {
    const renderer = vi.fn(({ source, container }: { source: string; container: HTMLElement }) => {
      container.textContent = `Custom: ${source.trim()}`;
    });
    const instance = await create('```custom-chart\nold\n```', {
      debounce: 0,
      renderers: { 'custom-chart': renderer },
    });
    await vi.waitFor(() => expect(document.querySelector('.cherry-embed__preview')?.textContent).toBe('Custom: old'));

    document.querySelector<HTMLButtonElement>('[aria-label="在节点内编辑源码"]')?.click();
    const source = document.querySelector<HTMLElement>('.cherry-embed__source code')!;
    source.textContent = 'new';
    source.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'new' }));

    await vi.waitFor(() => expect(document.querySelector('.cherry-embed__preview')?.textContent).toBe('Custom: new'));
    expect(renderer).toHaveBeenLastCalledWith(expect.objectContaining({ syntax: 'custom-chart', source: 'new' }));
    expect(instance.getMarkdown()).toBe('```custom-chart\nnew\n```');
  });

  it('keeps the previous diagram visible until an asynchronous redraw succeeds', async () => {
    let complete: ((value: string) => void) | undefined;
    const renderer = ({ source }: { source: string }) =>
      source.includes('old')
        ? '<span>Old chart</span>'
        : new Promise<string>((resolve) => {
            complete = resolve;
          });
    const instance = await create('```echarts\nold\n```', { renderers: { echarts: renderer } });
    await vi.waitFor(() => expect(document.querySelector('.cherry-embed__preview')?.textContent).toBe('Old chart'));
    instance.setMarkdown('```echarts\nnew\n```');
    await vi.waitFor(() => expect(complete).toBeDefined());
    expect(document.querySelector('.cherry-embed > .cherry-embed__preview')?.textContent).toBe('Old chart');
    complete?.('<span>New chart</span>');
    await vi.waitFor(() =>
      expect(document.querySelector('.cherry-embed > .cherry-embed__preview')?.textContent).toBe('New chart'),
    );
    expect(document.querySelector('[data-render-pending]')).toBeNull();
  });

  it('preserves renderer-owned styles and avoids redrawing unchanged diagram content', async () => {
    const renderer = vi.fn(({ container }: { container: HTMLElement }) => {
      container.style.backgroundColor = 'rgb(1, 2, 3)';
      return '<svg data-chart="styled"></svg>';
    });
    const instance = await create('```mermaid #100px\ngraph LR\n A-->B\n```', { renderers: { mermaid: renderer } });
    await vi.waitFor(() => expect(document.querySelector('.cherry-embed [data-chart="styled"]')).not.toBeNull());
    const preview = document.querySelector<HTMLElement>('.cherry-embed > .cherry-embed__preview')!;
    expect(preview.style.backgroundColor).toBe('rgb(1, 2, 3)');
    instance.setMarkdown('```mermaid #200px\ngraph LR\n A-->B\n```');
    await Promise.resolve();
    expect(renderer).toHaveBeenCalledTimes(1);
    expect(document.querySelector<HTMLElement>('.cherry-embed')?.style.width).toBe('200px');
    expect(document.querySelector('.cherry-embed > .cherry-embed__preview')).toBe(preview);
  });

  it('keeps a failed table chart local and clears its status when repaired', async () => {
    const renderer = vi.fn(({ source }: { source: string }) => {
      if (source.includes('Broken')) throw new Error('Invalid table chart');
      return '<span data-chart="repaired">Repaired</span>';
    });
    const value = '| :line:{} | A |\n| --- | --- |\n| Broken | 1 |';
    const instance = await create(value, { renderers: { tableChart: renderer } });
    await vi.waitFor(() => expect(document.querySelector('.cherry-table-chart [role="alert"]')).not.toBeNull());
    instance.setMarkdown(value.replace('Broken', 'Repaired'));
    await vi.waitFor(() => expect(document.querySelector('[data-chart="repaired"]')).not.toBeNull());
    expect(document.querySelector('[role="alert"], [data-render-error]')).toBeNull();
  });

  it('recognizes table chart options containing an external URL', async () => {
    const renderer = vi.fn(() => '<span data-map-chart="true">Map</span>');
    await create(
      '| :map:{"title":"China","mapDataSource":"https://maps.example/china.json"} | Value |\n' +
        '| --- | --- |\n' +
        '| 北京 | 100 |',
      { renderers: { tableChart: renderer } },
    );
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(1));
    expect(renderer).toHaveBeenCalledWith(expect.objectContaining({ syntax: 'map' }));
  });

  it('synchronizes table chart source immediately while coalescing expensive redraws', async () => {
    const renderer = vi.fn(() => '<span data-chart="coalesced">Chart</span>');
    const value = '| :line:{"title":"Before"} | A |\n| --- | --- |\n| Row | 1 |';
    const instance = await create(value, { renderers: { tableChart: renderer }, debounce: 20 });
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(1));
    for (const title of ['One', 'Two', 'Final']) {
      const current = title === 'One' ? 'Before' : title === 'Two' ? 'One' : 'Two';
      replaceText(instance, current, title);
    }
    await vi.waitFor(() => expect(instance.getMarkdown()).toContain('Final'));
    expect(renderer).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(2));
  });

  it('routes table cell edits through Milkdown history', async () => {
    const value = '| :line:{"title":"Before"} | A |\n| --- | --- |\n| Row | 1 |';
    const instance = await create(value, { renderers: { tableChart: () => '<span>Chart</span>' }, debounce: 0 });
    const view = replaceText(instance, 'Before', 'After');
    expect(instance.getMarkdown()).toContain('After');

    undo(view.state, view.dispatch);
    await vi.waitFor(() => expect(instance.getMarkdown()).toContain('Before'));

    redo(view.state, view.dispatch);
    await vi.waitFor(() => expect(instance.getMarkdown()).toContain('After'));
  });

  it('keeps the native table mounted while chart data redraws', async () => {
    const renderer = vi.fn(() => '<span>Chart</span>');
    const value = '| :line:{"title":"Before"} | A |\n| --- | --- |\n| Row | 1 |';
    const instance = await create(value, { renderers: { tableChart: renderer }, debounce: 10 });
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(1));
    const table = document.querySelector('.milkdown-table-block');
    replaceText(instance, 'Before', '输入中');
    expect(instance.getMarkdown()).toContain('输入中');
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(2));
    expect(document.querySelector('.milkdown-table-block')).toBe(table);
  });

  it('keeps an external table chart revision authoritative', async () => {
    const renderer = vi.fn(() => '<span>Chart</span>');
    const value = '| :line:{"title":"Before"} | A |\n| --- | --- |\n| Row | 1 |';
    const external = value.replace('Before', 'External');
    const instance = await create(value, { renderers: { tableChart: renderer }, debounce: 0 });
    await vi.waitFor(() => expect(renderer).toHaveBeenCalledTimes(1));
    replaceText(instance, 'Before', 'Local');
    instance.setMarkdown(external);

    expect(instance.getMarkdown()).toContain('External');
    expect(instance.getMarkdown()).not.toContain('Local');
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.state.doc.textContent).toContain('External');
    expect(document.querySelectorAll('[data-cherry-milkdown-table-chart-widget]')).toHaveLength(1);
    await vi.waitFor(() =>
      expect(renderer).toHaveBeenLastCalledWith(
        expect.objectContaining({ source: expect.stringContaining('External') }),
      ),
    );
  });

  it('rejects executable chart code before importing or mounting ECharts', async () => {
    const container = document.createElement('div');
    await expect(
      echarts({
        container,
        source: '({ title: (() => { throw new Error("executed") })() })',
        syntax: 'echarts',
        engine: { makeHtml: () => '' },
      }),
    ).rejects.toThrow();
    expect(container.childElementCount).toBe(0);
  });

  it('cleans late renderer results after node removal', async () => {
    let finish: ((cleanup: () => void) => void) | undefined;
    const cleanup = vi.fn();
    const renderer = vi.fn(
      () =>
        new Promise<() => void>((resolve) => {
          finish = resolve;
        }),
    );
    const instance = await create('| :line:{} | A |\n| --- | --- |\n| Row | 1 |', {
      renderers: { tableChart: renderer },
    });
    await vi.waitFor(() => expect(renderer).toHaveBeenCalled());
    instance.setMarkdown('Removed');
    finish?.(cleanup);
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
  });

  it('does not format code or atomic selections but permits ordinary text', async () => {
    const instance = await create('Text\n\n```js\ncode\n```');
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 5)));
    expect(supportsTextFormatting(view.state)).toBe(true);
    const codeStart = view.state.doc.firstChild!.nodeSize;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, codeStart + 1, codeStart + 3)));
    expect(supportsTextFormatting(view.state)).toBe(false);
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, codeStart)));
    expect(supportsTextFormatting(view.state)).toBe(false);
  });

  it('keeps readonly editors presentation-only', async () => {
    const value = '[Link](https://example.com)\n\n- [ ] Task\n\nMovable';
    const instance = await create(value, { readonly: true });
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.editable).toBe(false);
    expect(document.querySelector('.cherry-milkdown-text-bubble')).toBeNull();
    expect(document.querySelector('.cherry-milkdown-link-bubble')).toBeNull();
    expect(document.querySelector('.cherry-milkdown-image-controls')).toBeNull();
    expect(document.querySelector('[data-cherry-block-drag-handle]')).toBeNull();
    document
      .querySelector<HTMLElement>('[data-cherry-task-checkbox]')
      ?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
    expect(instance.getMarkdown()).toBe(value);
  });

  it('switches Cherry theme scopes without changing document state', async () => {
    const instance = await create('# Theme', { theme: 'dark' });
    const surface = document.querySelector<HTMLElement>('.cherry.cherry-milkdown');
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(surface?.classList.contains('theme__dark')).toBe(true);
    expect(view.dom.classList.contains('theme__dark')).toBe(true);

    instance.setTheme('red');

    expect(surface?.classList.contains('theme__dark')).toBe(false);
    expect(surface?.classList.contains('theme__red')).toBe(true);
    expect(view.dom.classList.contains('theme__red')).toBe(true);
    expect(instance.getMarkdown()).toBe('# Theme');

    instance.setTheme('unknown' as 'default');
    expect(surface?.classList.contains('theme__default')).toBe(true);
  });

  it('aborts an in-flight image upload when its editor closes', async () => {
    let uploadSignal: AbortSignal | undefined;
    const instance = await create('![dog](dog.png)', {
      fileUpload: (_file: File, _done: (url: string) => void, { signal }: { signal: AbortSignal }) => {
        uploadSignal = signal;
      },
    });
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    let imagePosition = -1;
    view.state.doc.descendants((node, position) => {
      if (node.type.name === 'image') imagePosition = position;
    });
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, imagePosition)));
    document.querySelector<HTMLButtonElement>('[aria-label="编辑图片"]')?.click();
    const input = document.querySelector<HTMLInputElement>('.cherry-milkdown-image-source input[type="file"]');
    Object.defineProperty(input, 'files', { configurable: true, value: [new File(['image'], 'dog.png')] });
    input?.dispatchEvent(new Event('change', { bubbles: true }));

    expect(uploadSignal?.aborted).toBe(false);
    [...document.querySelectorAll<HTMLButtonElement>('.cherry-milkdown-image-source button')]
      .find((button) => button.textContent === '取消')
      ?.click();
    expect(uploadSignal?.aborted).toBe(true);
    expect(instance.getMarkdown()).toBe('![dog](dog.png)');
  });

  it('repeated creation and destruction removes owned DOM', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    for (let index = 0; index < 10; index++) {
      const instance = await cherryMilkdown({ el: container, value: 'Text' });
      instance.setMarkdown('Changed');
      await instance.destroy();
      expect(container.childElementCount).toBe(0);
    }
  });
});
