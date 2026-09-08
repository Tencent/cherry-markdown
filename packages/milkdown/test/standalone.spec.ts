import { afterEach, describe, expect, it, vi } from 'vitest';
import { editorViewCtx } from '@milkdown/kit/core';
import { NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import { cherryMilkdown, type CherryMilkdownInstance } from '../src';
import { supportsTextFormatting } from '../src/ui/bubble';
import { echarts } from '../src/renderers/echarts';

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

describe('standalone contracts', () => {
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

  it('does not mount controls for readonly editors', async () => {
    const instance = await create('Text', { readonly: true });
    const view = instance.editor.action((ctx) => ctx.get(editorViewCtx));
    expect(view.editable).toBe(false);
    expect(document.querySelector('.cherry-milkdown-bubble')).toBeNull();
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
