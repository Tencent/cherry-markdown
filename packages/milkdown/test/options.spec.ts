import { describe, expect, it, vi } from 'vite-plus/test';
import { cherryMilkdown, type CherryMilkdownOptions } from '../src';
import { validateOptions } from '../src/options';
import { createEChartsRenderers } from '../src/renderers/echarts';

describe('public configuration boundary', () => {
  it.each([
    [{ toolbar: {} }, 'options.toolbar'],
    [{ bubble: {} }, 'bubble'],
    [{ debounce: -1 }, 'debounce'],
    [{ debounce: NaN }, 'debounce'],
    [{ theme: 'night' }, 'theme'],
    [{ value: 123 }, 'value'],
    [{ plugins: [{}] }, 'plugins'],
    [{ renderers: { echarts: {} } }, 'renderers.echarts'],
    [{ engineOptions: { engine: {} } }, 'engineOptions.engine'],
    [{ engineOptions: { callback: { afterChange() {} } } }, 'engineOptions.callback.afterChange'],
    [{ engine: { makeHtml() {} }, engineOptions: {} }, 'engineOptions'],
    [{ mathlive: { macros: { foo: 12 } } }, 'mathlive.macros.foo'],
    [{ mathlive: { virtualKeyboardMode: 'never' } }, 'mathlive.virtualKeyboardMode'],
    [{ mathlive: { color: 'red' } }, 'mathlive.color'],
  ])('rejects unsupported or invalid configuration at %s', async (input, field) => {
    const root = document.body.appendChild(document.createElement('div'));
    const onError = vi.fn();
    try {
      await expect(cherryMilkdown({ root, ...input, onError } as CherryMilkdownOptions)).rejects.toThrow(field);
      expect(root.children).toHaveLength(0);
      expect(onError).toHaveBeenCalledWith(expect.any(TypeError), 'create');
    } finally {
      root.remove();
    }
  });

  it('accepts supported render hooks and optional defaults', () => {
    expect(() =>
      validateOptions({
        root: '#editor',
        engineOptions: {
          callback: { urlProcessor: (url) => url, beforeImageMounted: (srcProp, src) => ({ srcProp, src }) },
        },
      }),
    ).not.toThrow();
  });

  it('rejects ECharts renderer configuration mistakes', () => {
    expect(() => createEChartsRenderers({ data: [] } as never)).toThrow('echarts.data');
    expect(() => createEChartsRenderers({ transformOption: true } as never)).toThrow('echarts.transformOption');
  });
});
