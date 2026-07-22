import { afterEach, describe, expect, it, vi } from 'vitest';
import EChartsCodeBlockEngine from '../../src/addons/advance/cherry-codeblock-echarts-plugin';
import CherryEngine from '../../src/index.engine.core';

interface EChartsInstallOptions {
  engine: {
    syntax: {
      codeBlock?: { customRenderer: { echarts: EChartsCodeBlockEngine } };
    };
  };
  externals?: { echarts: object };
}

const createChartEnvironment = (flowSessionContext = false) => {
  const previewerDom = document.createElement('div');
  previewerDom.innerHTML =
    '<div data-sign="chart-sign" data-type="echarts"><div class="cherry-echarts-codeblock-wrapper"></div></div>';
  const chart = { setOption: vi.fn() };
  const echarts = {
    getInstanceByDom: vi.fn(() => null as typeof chart | null),
    init: vi.fn(() => chart),
  };
  const engine = {
    $cherry: {
      previewer: { getDom: () => previewerDom },
      options: { engine: { global: { flowSessionContext } } },
    },
  };
  return { previewerDom, chart, echarts, engine };
};

afterEach(() => {
  delete window.echarts;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('addons/EChartsCodeBlockEngine', () => {
  it('requires an injected or browser ECharts implementation', () => {
    expect(() => new EChartsCodeBlockEngine()).toThrow('Package echarts not found');
  });

  it('leaves install options unchanged when ECharts is unavailable', () => {
    const options: EChartsInstallOptions = { engine: { syntax: {} } };

    EChartsCodeBlockEngine.install(options);

    expect(options.engine.syntax.codeBlock).toBeUndefined();
    expect(options.externals).toBeUndefined();
  });

  it('installs the browser implementation into custom renderers and externals', () => {
    const { echarts } = createChartEnvironment();
    Object.assign(window, { echarts });
    const options: EChartsInstallOptions = { engine: { syntax: {} } };

    EChartsCodeBlockEngine.install(options, { size: { width: '640px' } });

    expect(options.engine.syntax.codeBlock?.customRenderer.echarts).toBeInstanceOf(EChartsCodeBlockEngine);
    expect(options.externals?.echarts).toBe(echarts);
  });

  it('parses JSON5 data and optional JavaScript object literals', () => {
    const environment = createChartEnvironment();
    const strict = new EChartsCodeBlockEngine({ echarts: environment.echarts });
    const enabled = new EChartsCodeBlockEngine({ echarts: environment.echarts, enableJs: true });

    expect(strict.parseOption('{ series: [{ data: [1, 2,], },], };')).toEqual({
      series: [{ data: [1, 2] }],
    });
    const option = enabled.parseOption('{ formatter: (value) => value + "!" }');
    expect(option.formatter('ok')).toBe('ok!');
    expect(() => strict.parseOption('{ formatter: () => true }')).toThrow();
    expect(() => enabled.parseOption('1 + 1')).toThrow();
  });

  it('renders chart options into the matching preview container', () => {
    vi.useFakeTimers();
    const environment = createChartEnvironment();
    const renderer = new EChartsCodeBlockEngine({
      echarts: environment.echarts,
      size: { width: '640px', height: '360px' },
    });

    expect(renderer.render('', 'chart-sign', environment.engine, 'echarts')).toBe('');
    expect(renderer.render('{ series: [] }', 'chart-sign', environment.engine, 'echarts')).toBe(
      '<div style="width: 640px; height: 360px;" class="cherry-echarts-codeblock-wrapper"></div>',
    );
    vi.advanceTimersByTime(50);

    expect(environment.echarts.init).toHaveBeenCalledOnce();
    expect(environment.chart.setOption).toHaveBeenCalledWith({ series: [] }, true);
  });

  it('does not redraw an initialized chart with an unchanged sign', () => {
    vi.useFakeTimers();
    const environment = createChartEnvironment();
    environment.echarts.getInstanceByDom.mockReturnValue(environment.chart);
    const renderer = new EChartsCodeBlockEngine({ echarts: environment.echarts });
    renderer.srcCache.set('chart-sign', 1);

    renderer.render('{ series: [] }', 'chart-sign', environment.engine, 'echarts');
    vi.advanceTimersByTime(50);

    expect(environment.echarts.init).not.toHaveBeenCalled();
    expect(environment.chart.setOption).not.toHaveBeenCalled();
  });

  it('does not initialize a chart when the matching preview container is absent', () => {
    vi.useFakeTimers();
    const environment = createChartEnvironment();
    environment.previewerDom.innerHTML = '';
    const renderer = new EChartsCodeBlockEngine({ echarts: environment.echarts });

    renderer.render('{ series: [] }', 'missing-sign', environment.engine, 'echarts');
    vi.advanceTimersByTime(50);

    expect(environment.echarts.getInstanceByDom).not.toHaveBeenCalled();
    expect(environment.echarts.init).not.toHaveBeenCalled();
  });

  it('renders escaped errors or drawing state after failures', () => {
    vi.useFakeTimers();
    const normal = createChartEnvironment();
    const normalRenderer = new EChartsCodeBlockEngine({ echarts: normal.echarts });
    vi.spyOn(normalRenderer, 'parseOption').mockImplementation(() => {
      throw new Error('<invalid>');
    });
    normalRenderer.render('invalid', 'chart-sign', normal.engine, 'echarts');
    vi.advanceTimersByTime(50);
    expect(normal.previewerDom.querySelector('.cherry-echarts-codeblock-wrapper')?.innerHTML).toContain(
      'Render Error: &lt;invalid&gt;',
    );

    const streaming = createChartEnvironment(true);
    const streamingRenderer = new EChartsCodeBlockEngine({ echarts: streaming.echarts });
    vi.spyOn(streamingRenderer, 'parseOption').mockImplementation(() => {
      throw new Error('invalid');
    });
    streamingRenderer.render('invalid', 'chart-sign', streaming.engine, 'echarts');
    vi.advanceTimersByTime(50);
    expect(streaming.previewerDom.querySelector('.cherry-echarts-codeblock-wrapper')?.innerHTML).toBe('drawing...');
  });

  it('renders a fenced ECharts block and applies its parsed option', () => {
    vi.useFakeTimers();
    const environment = createChartEnvironment();
    environment.previewerDom.innerHTML = '';
    const renderer = new EChartsCodeBlockEngine({ echarts: environment.echarts });
    const engine = new CherryEngine({
      engine: { syntax: { codeBlock: { customRenderer: { echarts: renderer } } } },
    });
    // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
    Object.defineProperty(engine.$cherry, 'previewer', {
      value: { getDom: () => environment.previewerDom },
    });
    // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
    const html = engine.makeHtml('```echarts\n{ series: [{ type: "bar", data: [3, 5] }] }\n```');
    environment.previewerDom.innerHTML = html;
    const wrapper = environment.previewerDom.querySelector('[data-type="echarts"]');

    expect(wrapper?.querySelector('.cherry-echarts-codeblock-wrapper')?.getAttribute('style')).toBe(
      'width: 100%; height: 300px;',
    );
    vi.advanceTimersByTime(50);
    expect(environment.echarts.init).toHaveBeenCalledOnce();
    expect(environment.chart.setOption).toHaveBeenCalledWith({ series: [{ type: 'bar', data: [3, 5] }] }, true);
  });
});
