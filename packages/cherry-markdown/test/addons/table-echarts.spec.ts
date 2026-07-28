import { afterEach, describe, expect, it, vi } from 'vitest';
import EChartsTableEngine from '../../src/addons/advance/cherry-table-echarts-plugin';

interface TableEChartsInstallOptions {
  engine: {
    syntax: {
      table?: {
        enableChart: boolean;
        chartRenderEngine: typeof EChartsTableEngine;
        externals: string[];
      };
    };
  };
}

function createEnvironment() {
  const root = document.createElement('div');
  root.className = 'cherry theme__default';
  const previewerDom = document.createElement('div');
  root.appendChild(previewerDom);
  document.body.appendChild(root);
  let chartDom: Element | null = null;
  let disposed = false;
  const chart = {
    setOption: vi.fn(),
    getOption: vi.fn(() => ({ series: [{ type: 'bar', data: [1, 2] }] })),
    getDom: vi.fn(() => chartDom),
    isDisposed: vi.fn(() => disposed),
    dispose: vi.fn(() => {
      disposed = true;
    }),
    clear: vi.fn(),
    on: vi.fn(),
    dispatchAction: vi.fn(),
  };
  const echarts = {
    getInstanceByDom: vi.fn(() => null as typeof chart | null),
    init: vi.fn((container: Element) => {
      chartDom = container;
      return chart;
    }),
    getMap: vi.fn((_source: string) => undefined as object | undefined),
    registerMap: vi.fn(),
  };
  const locale = new Proxy<Record<string, string>>(
    {},
    {
      get: (_target, key) => String(key),
    },
  );
  const cherry = {
    locale,
    previewer: { getDom: () => previewerDom },
    options: { engine: { syntax: { global: { flowSessionContext: false } } } },
  };
  return { root, previewerDom, chart, echarts, cherry };
}

afterEach(() => {
  delete window.echarts;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('addons/EChartsTableEngine', () => {
  it('installs the table chart renderer in browser environments', () => {
    const options: TableEChartsInstallOptions = { engine: { syntax: {} } };

    EChartsTableEngine.install(options);

    expect(options.engine.syntax.table).toEqual({
      enableChart: true,
      chartRenderEngine: EChartsTableEngine,
      externals: ['echarts'],
    });
  });

  it('requires ECharts and initializes rendering defaults', () => {
    expect(() => new EChartsTableEngine()).toThrow('Package echarts not found');
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });

    expect(renderer.options).toMatchObject({ renderer: 'svg', width: 500, height: 300 });
    expect(renderer.instances.size).toBe(0);
  });

  it('provides chart palettes, axes, zoom controls, and numeric normalization', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);

    expect(renderer.$palette()).toHaveLength(9);
    expect(renderer.$palette('heatmap')).toHaveLength(11);
    expect(renderer.$palette('radar')).toHaveLength(5);
    expect(renderer.$palette('sankey')).toHaveLength(9);
    expect(renderer.$palette('map')).toHaveLength(2);
    expect(renderer.$grid({ top: '20%' })).toMatchObject({ containLabel: true, top: '20%' });
    expect(renderer.$axis('category').type).toBe('category');
    expect(renderer.$dataZoom()).toHaveLength(2);
    expect(renderer.$dataZoom(false)).toHaveLength(1);
    expect(renderer.$num('1,234.5')).toBe(1234.5);
    expect(renderer.$num('not-a-number')).toBe(0);
    expect(renderer.$num(null)).toBe(0);
    expect(renderer.$baseSeries('bar').type).toBe('bar');
    const lineSeries = renderer.$baseSeries('line');
    expect(lineSeries.type).toBe('line');
    expect(lineSeries.animationDelay(3)).toBe(30);
    expect(renderer.$dot('#f00')).toContain('background-color:#f00');
  });

  it('handles SVG tagging, CSS failures, and theme-root fallbacks', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    const container = document.createElement('div');
    container.innerHTML = '<svg></svg>';
    renderer.$tagEchartsSvg(container);
    expect(container.querySelector('svg')?.classList.contains('echarts-svg')).toBe(true);

    expect(renderer.$extractThemeNameFromClassList([])).toBe('default');
    expect(renderer.$extractThemeNameFromClassList(null)).toBe('default');
    const brokenClassList = {
      [Symbol.iterator]() {
        throw new Error('broken class list');
      },
    };
    expect(renderer.$extractThemeNameFromClassList(brokenClassList)).toBe('default');

    const markdownRoot = document.createElement('div');
    markdownRoot.className = 'cherry-markdown theme__dark';
    const child = document.createElement('div');
    markdownRoot.appendChild(child);
    document.body.appendChild(markdownRoot);
    expect(renderer.$getCherryRoot(child)).toBe(markdownRoot);

    vi.stubGlobal('getComputedStyle', () => {
      throw new Error('styles unavailable');
    });
    expect(renderer.$readCssVar(child, '--missing', 'fallback')).toBe('fallback');
  });

  it('falls back to document body and skips observers without a root', () => {
    document.body.innerHTML = '';
    const environment = createEnvironment();
    environment.root.remove();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });

    expect(renderer.$getCherryRoot()).toBe(document.body);
    expect(renderer.$themeCacheKey()).toBe('default');

    const root = vi.spyOn(renderer, '$getCherryRoot').mockReturnValue(null);
    expect(renderer.$themeCacheKey()).toBe('default');
    renderer.$enableThemeObserver(document.createElement('div'));
    renderer.$enableExportObserver(document.createElement('div'));
    expect(renderer.themeObservers.size).toBe(0);
    expect(renderer.exportObservers.size).toBe(0);
    root.mockRestore();
  });

  it('generates bar chart options from Markdown table data', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const tableObject = {
      header: ['Category', 'Q1', 'Q2'],
      rows: [
        ['Alpha', '1', '2'],
        ['Beta', '3', '4'],
      ],
    };

    const option = renderer.$generateChartOptions('bar', tableObject, { title: 'Sales' });

    expect(option.title.text).toBe('Sales');
    expect(option.xAxis.data).toEqual(['Q1', 'Q2']);
    expect(option.series).toHaveLength(2);
    expect(option.series[0]).toMatchObject({ name: 'Alpha', type: 'bar', data: [1, 2] });
    expect(renderer.$generateChartOptions('unsupported', tableObject, {})).toEqual({});
  });

  it('generates line, radar, heatmap, and pie chart options', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const tableObject = {
      header: ['Category', 'Q1', 'Q2'],
      rows: [
        ['Alpha', '10', '20'],
        ['Beta', '30', '40'],
      ],
    };

    const line = renderer.$generateChartOptions('line', tableObject, {});
    const radar = renderer.$generateChartOptions('radar', tableObject, {});
    const heatmap = renderer.$generateChartOptions('heatmap', tableObject, {});
    const pie = renderer.$generateChartOptions('pie', tableObject, {});

    expect(line.series.every((series: { type: string }) => series.type === 'line')).toBe(true);
    expect(radar.radar.indicator).toEqual([
      { name: 'Q1', max: 36 },
      { name: 'Q2', max: 48 },
    ]);
    expect(radar.series[0].type).toBe('radar');
    expect(heatmap.series[0].type).toBe('heatmap');
    expect(heatmap.series[0].data).toHaveLength(4);
    expect(heatmap.series[0].data[0]).toEqual([0, 0, 10]);
    expect(heatmap.visualMap).toMatchObject({ min: 10, max: 40 });
    expect(pie.series[0]).toMatchObject({
      type: 'pie',
      data: [
        { name: 'Alpha', value: 10 },
        { name: 'Beta', value: 30 },
      ],
    });
    expect(
      line.tooltip.formatter([
        { axisValueLabel: 'Q1', color: '#f00', seriesName: 'Alpha', value: 10 },
        { axisValueLabel: 'Q1', color: '#0f0', seriesName: 'Beta', value: 30 },
      ]),
    ).toContain('Alpha');
    expect(line.yAxis.axisLabel.formatter(2_000_000)).toBe('2.0M');
    expect(line.yAxis.axisLabel.formatter(2_000)).toBe('2.0K');
    expect(line.yAxis.axisLabel.formatter(20)).toBe(20);
    expect(radar.tooltip.formatter({ color: '#f00', name: 'Alpha', value: [10, 20] })).toContain('Q1');
    expect(radar.radar.axisName.formatter('Long indicator')).toBe('Long i...');
    expect(radar.radar.axisName.formatter('Short')).toBe('Short');
    expect(heatmap.tooltip.formatter({ color: '#f00', data: [0, 1, 30] })).toContain('Beta<br/>Q1');
    expect(
      pie.tooltip.formatter({ color: '#f00', seriesName: 'Share', name: 'Alpha', value: 10, percent: 25 }),
    ).toContain('Alpha: 10 (25%)');
  });

  it('generates grouped scatter options from explicit table mappings', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const tableObject = {
      header: ['Name', 'X', 'Y', 'Size', 'Group'],
      rows: [
        ['A', '10', '20', '5', 'First'],
        ['B', '30', '40', '10', 'Second'],
      ],
    };
    const mapping = { x: 'X', y: 'Y', size: 'Size', group: 'Group' };

    const option = renderer.$generateChartOptions('scatter', tableObject, { 'cherry:mapping': mapping });

    expect(option.legend.data).toEqual(['First', 'Second']);
    expect(option.series).toHaveLength(2);
    expect(option.series[0]).toMatchObject({
      name: 'First',
      type: 'scatter',
      data: [{ name: 'A', value: [10, 20], symbolSize: 6 }],
    });
    expect(option.series[1].data[0].symbolSize).toBe(28);
    expect(option.tooltip.formatter({ color: '#f00', seriesName: 'First', name: 'A', value: [10, 20] })).toContain(
      'x: <strong>10</strong>',
    );
  });

  it('supports legacy scatter column inference and equal point sizes', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const option = renderer.$generateChartOptions(
      'scatter',
      {
        header: ['Name', 'X value', 'Y value', 'Size', 'Group'],
        rows: [
          ['A', '10', '20', '5', 'First'],
          ['B', '30', '40', '5', 'First'],
        ],
      },
      {},
    );

    expect(option.series).toHaveLength(1);
    expect(option.series[0].data).toEqual([
      { name: 'A', value: [10, 20], symbolSize: 12 },
      { name: 'B', value: [30, 40], symbolSize: 12 },
    ]);
  });

  it('renders a single legacy scatter series without optional columns', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const option = renderer.$generateChartOptions(
      'scatter',
      {
        header: ['Name', 'Horizontal', 'Vertical'],
        rows: [
          ['A', '10', '20'],
          ['B', '30', '40'],
        ],
      },
      {},
    );

    expect(option.series).toHaveLength(1);
    expect(option.series[0]).toMatchObject({
      name: 'scatterData',
      data: [
        { name: 'A', value: [10, 20] },
        { name: 'B', value: [30, 40] },
      ],
    });
  });

  it('ignores an invalid optional scatter mapping while preserving required dimensions', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const option = renderer.$generateChartOptions(
      'scatter',
      { header: ['Name', 'X', 'Y'], rows: [['A', '10', '20']] },
      { 'cherry:mapping': { x: 'X', y: 'Y', size: 'Missing size' } },
    );

    expect(option.series).toHaveLength(1);
    expect(option.series[0].data).toEqual([{ name: 'A', value: [10, 20] }]);
  });

  it('builds theme-only updates without replacing chart data', () => {
    const environment = createEnvironment();
    environment.root.style.setProperty('--primary-color', '#123456');
    environment.root.style.setProperty('--base-previewer-bg', '#111111');
    environment.root.style.setProperty('--base-font-color', '#eeeeee');
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    renderer.$buildEchartsThemeFromCss(environment.root);
    const delta = renderer.$buildThemeOnlyOption(
      {
        title: { text: 'Sales' },
        tooltip: {},
        legend: [{}],
        toolbox: {},
        xAxis: [{}],
        yAxis: {},
        visualMap: [{}],
        radar: {},
        series: [
          { type: 'line', data: [1, 2] },
          { type: 'sankey', data: [{ name: 'A' }] },
        ],
      },
      renderer.$theme(),
    );

    expect(renderer.themeCache.size).toBe(1);
    expect(delta.backgroundColor).toBe('#111111');
    expect(delta.series).toHaveLength(2);
    expect(delta.series[0].itemStyle.borderColor).toBe('#fff');
    expect(delta.series[1].label).toMatchObject({ color: '#eeeeee', fontSize: 12 });
    expect(delta.series[0]).not.toHaveProperty('data');
  });

  it('applies theme-only updates to a connected chart instance', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const container = document.createElement('div');
    environment.previewerDom.appendChild(container);
    environment.echarts.init(container);
    environment.chart.setOption.mockClear();

    renderer.$applyThemeOnly(environment.chart);

    const [delta, notMerge, lazyUpdate] = environment.chart.setOption.mock.calls[0];
    expect(Array.isArray(delta.series)).toBe(true);
    expect(notMerge).toBe(false);
    expect(lazyUpdate).toBe(true);
  });

  it('handles invalid, disposed, and missing chart instances', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);

    expect(renderer.createChart(null)).toBeNull();
    renderer.$setInstanceTheme(null);
    renderer.$applyThemeOnly(null);

    const missingDom = { getDom: () => null, setOption: vi.fn() };
    renderer.$setInstanceTheme(missingDom);
    renderer.$applyThemeOnly(missingDom);

    const disposed = {
      isDisposed: () => true,
      getDom: vi.fn(),
      dispose: vi.fn(),
    };
    renderer.instances.add(disposed);
    renderer.cleanupInvalidInstances();
    expect(disposed.dispose).not.toHaveBeenCalled();
    expect(renderer.instances.has(disposed)).toBe(false);

    renderer.destroyChart(disposed);
    expect(renderer.instances.has(disposed)).toBe(false);

    const container = document.createElement('div');
    environment.previewerDom.appendChild(container);
    const noOption = { getDom: () => container, getOption: () => null, setOption: vi.fn() };
    renderer.$applyThemeOnly(noOption);

    const missingGetOption = { getDom: () => container, setOption: vi.fn() };
    renderer.$applyThemeOnly(missingGetOption);

    const noTheme = { getDom: () => container, getOption: () => ({ series: [] }), setOption: vi.fn() };
    renderer.themeRuntime = null;
    renderer.$applyThemeOnly(noTheme);
    expect(noTheme.setOption).not.toHaveBeenCalled();

    renderer.$buildEchartsThemeFromCss(environment.root);
    const broken = {
      getDom: () => container,
      getOption: () => ({ series: [] }),
      setOption: vi.fn(() => {
        throw new Error('theme failed');
      }),
    };
    expect(() => renderer.$applyThemeOnly(broken)).not.toThrow();

    vi.spyOn(renderer, '$chartOptionsFromDataset').mockReturnValue(null);
    const fullTheme = { getDom: () => container, setOption: vi.fn() };
    renderer.$setInstanceTheme(fullTheme);
    expect(fullTheme.setOption).toHaveBeenCalledWith({}, false, true);
  });

  it('attaches pie interactions when creating a new chart and reuses existing charts', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const container = document.createElement('div');
    environment.previewerDom.appendChild(container);
    const addClick = vi.spyOn(renderer, 'addClickHighlightEffect');

    expect(renderer.createChart(container, {}, 'pie')).toBe(environment.chart);
    expect(addClick).toHaveBeenCalledWith(environment.chart, 'pie');

    environment.echarts.getInstanceByDom.mockReturnValue(environment.chart);
    environment.echarts.init.mockClear();
    renderer.createChart(container, { series: [] }, 'bar');
    expect(environment.echarts.init).not.toHaveBeenCalled();
    expect(environment.chart.setOption).toHaveBeenCalledWith({ series: [] }, true);
  });

  it('applies theme changes observed on the Cherry root', async () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const container = document.createElement('div');
    environment.previewerDom.appendChild(container);
    renderer.createChart(container, { series: [{ type: 'bar', data: [1] }] }, 'bar');
    environment.chart.setOption.mockClear();

    environment.root.classList.replace('theme__default', 'theme__dark');

    await vi.waitFor(() => expect(environment.chart.setOption).toHaveBeenCalled());
    expect(renderer.themeCache.has('dark')).toBe(true);
  });

  it('rejects fatal scatter mappings and renders valid sankey links', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const invalidScatter = renderer.$generateChartOptions(
      'scatter',
      { header: ['Name', 'X'], rows: [['A', '1']] },
      { 'cherry:mapping': { x: 'X' } },
    );
    const sankey = renderer.$generateChartOptions(
      'sankey',
      {
        header: ['Source', 'Target', 'Value'],
        rows: [
          ['Input', 'Process', '10'],
          ['Process', 'Output', '8'],
          ['Ignored', '', '2'],
          [null, 'Ignored', '3'],
        ],
      },
      {},
    );

    expect(invalidScatter.series).toEqual([]);
    expect(sankey.series[0]).toMatchObject({
      type: 'sankey',
      data: [{ name: 'Input' }, { name: 'Process' }, { name: 'Output' }],
      links: [
        { source: 'Input', target: 'Process', value: 10 },
        { source: 'Process', target: 'Output', value: 8 },
      ],
    });

    expect(
      renderer.$generateChartOptions(
        'scatter',
        { header: ['Name', 'X', 'Y'], rows: [['A', '1', '2']] },
        { 'cherry:mapping': { x: 'Missing X', y: 'Y' } },
      ).series,
    ).toEqual([]);
  });

  it('covers chart formatter and scatter grouping defaults', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({
      echarts: environment.echarts,
      cherry: environment.cherry,
      renderer: 'canvas',
    });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const axis = renderer.$generateChartOptions(
      'bar',
      { header: ['Category', 'Very long quarter'], rows: [['Alpha', '1']] },
      {},
    );
    expect(axis.toolbox.feature.saveAsImage.type).toBe('png');
    expect(axis.xAxis.axisLabel.rotate).toBe(45);
    expect(axis.tooltip.formatter([])).toBe('<div style="margin-bottom:4px;font-weight:bold;"></div>');

    const grouped = renderer.$generateChartOptions(
      'scatter',
      {
        header: ['Name', 'X', 'Y', 'Size', 'Label'],
        rows: [['A', '1', '2', '3', '']],
      },
      { 'cherry:mapping': { x: 'X', y: 'Y', size: 'Size', series: 'Label' } },
    );
    expect(grouped.series[0].name).toBe('系列1');
    expect(grouped.tooltip.formatter({ color: '#f00', seriesName: '系列1', name: 'A' })).toContain(
      'x: <strong>undefined</strong>',
    );

    const inferredGroup = renderer.$generateChartOptions(
      'scatter',
      {
        header: ['Name', 'Horizontal', 'Vertical', 'Other', 'Label'],
        rows: [['A', '1', '2', 'unused', '']],
      },
      {},
    );
    expect(inferredGroup.series[0].name).toBe('系列1');
  });

  it('generates a registered map with normalized province names', () => {
    const environment = createEnvironment();
    environment.echarts.getMap.mockReturnValue({});
    Object.assign(window, { echarts: environment.echarts });
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const option = renderer.$generateChartOptions(
      'map',
      {
        header: ['Province', 'Value'],
        rows: [
          ['北京', '10'],
          ['广东省', '20'],
        ],
      },
      { mapDataSource: 'china' },
    );

    expect(option.series[0]).toMatchObject({
      type: 'map',
      map: 'china',
      data: [
        { name: '北京市', value: 10 },
        { name: '广东省', value: 20 },
      ],
    });
    expect(option.visualMap).toMatchObject({ min: 10, max: 20 });
    expect(option.tooltip.formatter({ name: '北京市', value: 10 })).toBe('北京市: 10');
    expect(option.tooltip.formatter({ name: '北京市' })).toBe('北京市: 0');
  });

  it('uses the first registered default map source when none is configured', () => {
    const environment = createEnvironment();
    const defaultSource = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
    environment.echarts.getMap.mockImplementation((source: string) => (source === defaultSource ? {} : undefined));
    Object.assign(window, { echarts: environment.echarts });
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);

    const option = renderer.$generateChartOptions(
      'map',
      { header: ['Province', 'Value'], rows: [['未知区域', '7']] },
      {},
    );

    expect(option.series[0].map).toBe(defaultSource);
    expect(option.series[0].data).toEqual([{ name: '未知区域', value: 7 }]);
  });

  it('renders a library error while map support is unavailable', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );

    const option = renderer.$generateChartOptions(
      'map',
      { header: ['Province', 'Value'], rows: [['北京', '10']] },
      { mapDataSource: 'china' },
    );

    expect(option.title.text).toBe('chartRenderError : chartLibraryNotLoadedTip');
  });

  it('loads an unregistered default map and includes toolbar source URLs', () => {
    const environment = createEnvironment();
    Object.assign(window, { echarts: environment.echarts });
    const renderer = new EChartsTableEngine({
      echarts: environment.echarts,
      cherry: environment.cherry,
      cherryOptions: {
        toolbars: { config: { mapTable: { sourceUrl: ['https://toolbar.example/map.json'] } } },
      },
    });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const fetchMock = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal('fetch', fetchMock);

    const option = renderer.$generateChartOptions(
      'map',
      { header: ['Province', 'Value'], rows: [['北京辖区', '10']] },
      {},
    );

    expect(option.title.text).toContain('mapChartLoading');
    expect(fetchMock).toHaveBeenCalledWith('https://toolbar.example/map.json', { referrerPolicy: 'no-referrer' });
  });

  it('renders a chart container and initializes ECharts after insertion', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({
      echarts: environment.echarts,
      cherry: environment.cherry,
      width: 640,
      height: 360,
    });
    const tableObject = {
      header: ['Category', 'Q1'],
      rows: [['Alpha', '10']],
    };
    const options = { title: 'Sales & Growth' };

    const html = renderer.render('bar', options, tableObject, environment.cherry);
    environment.previewerDom.innerHTML = html;
    vi.advanceTimersByTime(50);

    const container = environment.previewerDom.querySelector('.cherry-echarts-wrapper');
    expect(container).not.toBeNull();
    expect(container?.getAttribute('data-chart-type')).toBe('bar');
    expect(container?.getAttribute('data-chart-options')).toContain('Sales & Growth');
    expect(container?.getAttribute('style')).toContain('width: 640px');
    expect(environment.echarts.init).toHaveBeenCalledOnce();
    expect(environment.chart.setOption).toHaveBeenCalledOnce();
    expect(Array.isArray(environment.chart.setOption.mock.calls[0]?.[0]?.series)).toBe(true);
    expect(environment.chart.setOption.mock.calls[0]?.[1]).toBe(true);
    expect(renderer.instances.has(environment.chart)).toBe(true);
  });

  it('rehydrates options from container datasets and rejects invalid data', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const container = document.createElement('div');
    container.id = 'chart-id';
    container.dataset.chartType = 'bar';
    container.dataset.tableData = JSON.stringify({ header: ['Category', 'Q1'], rows: [['Alpha', '1']] });
    container.dataset.chartOptions = JSON.stringify({ title: 'Restored' });

    expect(renderer.$chartOptionsFromDataset(container)).toMatchObject({ title: { text: 'Restored' } });
    container.dataset.tableData = '{invalid';
    expect(renderer.$chartOptionsFromDataset(container)).toEqual({});

    container.dataset.tableData = JSON.stringify({ header: ['Category', 'Q1'], rows: [['Alpha', '1']] });
    container.dataset.chartOptions = '{invalid';
    expect(renderer.$chartOptionsFromDataset(container)).not.toHaveProperty('title');

    container.removeAttribute('data-chart-type');
    expect(renderer.$chartOptionsFromDataset(container)).toEqual({});

    expect(renderer.$chartOptionsFromDataset(document.createElement('div'))).toEqual({});
  });

  it('skips disconnected rehydration targets and contains rebuild failures', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const disconnected = document.createElement('div');
    const connected = document.createElement('div');
    connected.className = 'cherry-echarts-wrapper';
    connected.dataset.chartType = 'bar';
    connected.dataset.tableData = JSON.stringify({ header: ['Category', 'Q1'], rows: [['Alpha', '1']] });
    connected.dataset.chartOptions = '{}';
    environment.previewerDom.appendChild(connected);
    vi.spyOn(renderer, 'createChart').mockImplementation(() => {
      throw new Error('rehydrate failed');
    });

    renderer.$rehydrateChartsForContainers(new Set([disconnected, connected]), environment.root);
    expect(() => renderer.$rebuildAllCharts(null)).not.toThrow();

    const brokenRoot = {
      querySelectorAll() {
        throw new Error('query failed');
      },
    };
    expect(() => renderer.$rebuildAllCharts(brokenRoot)).not.toThrow();
  });

  it('does not initialize delayed charts when their container was not inserted', () => {
    vi.useFakeTimers();
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });

    renderer.render('bar', {}, { header: ['Category', 'Q1'], rows: [['Alpha', '1']] }, environment.cherry);
    vi.advanceTimersByTime(50);

    expect(environment.echarts.init).not.toHaveBeenCalled();
  });

  it('cleans disconnected instances and destroys active charts', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.instances.add(environment.chart);

    renderer.cleanupInvalidInstances();
    expect(environment.chart.dispose).toHaveBeenCalledOnce();
    expect(renderer.instances.size).toBe(0);

    const connected = document.createElement('div');
    document.body.appendChild(connected);
    environment.echarts.getInstanceByDom.mockReturnValue(environment.chart);
    renderer.instances.add(environment.chart);
    renderer.destroyChart(connected);
    expect(renderer.instances.size).toBe(0);
  });

  it('rehydrates charts for locale and export events and applies full themes', () => {
    vi.useFakeTimers();
    const environment = createEnvironment();
    const event = { on: vi.fn(), Events: { afterChangeLocale: 'afterChangeLocale' } };
    Object.assign(environment.cherry, { $event: event });
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.$buildEchartsThemeFromCss(environment.root);
    const container = document.createElement('div');
    container.className = 'cherry-echarts-wrapper';
    container.dataset.chartType = 'bar';
    container.dataset.tableData = JSON.stringify({ header: ['Category', 'Q1'], rows: [['Alpha', '1']] });
    container.dataset.chartOptions = '{}';
    environment.previewerDom.appendChild(container);
    environment.echarts.init(container);
    environment.chart.setOption.mockClear();

    renderer.$setInstanceTheme(environment.chart);
    const [option, notMerge, lazyUpdate] = environment.chart.setOption.mock.calls[0];
    expect(Array.isArray(option.series)).toBe(true);
    expect(notMerge).toBe(false);
    expect(lazyUpdate).toBe(true);

    const rebuild = vi.spyOn(renderer, '$rebuildAllCharts');
    const localeHandler = event.on.mock.calls[0][1];
    localeHandler('en_US');
    vi.runOnlyPendingTimers();
    expect(rebuild).toHaveBeenCalled();

    renderer.$enableExportObserver(container);
    window.dispatchEvent(new Event('cherry:export:done'));
    expect(rebuild).toHaveBeenCalledTimes(2);
  });

  it('clears click highlights and disconnects observers on destroy', () => {
    const environment = createEnvironment();
    const clickChart = {
      on: vi.fn(),
      dispatchAction: vi.fn(),
      setOption: vi.fn(),
      getOption: vi.fn(() => ({
        series: [
          {
            type: 'pie',
            data: [{ value: 1, itemStyle: { opacity: 0.5, borderWidth: 2, borderColor: '#f00' } }],
          },
        ],
      })),
    };
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    renderer.addClickHighlightEffect(clickChart, 'pie');
    const clickHandler = clickChart.on.mock.calls[0][1];
    clickHandler({ dataIndex: 0 });
    clickHandler({ dataIndex: 0 });

    expect(clickChart.dispatchAction).toHaveBeenCalledWith({ type: 'downplay', seriesIndex: 0 });
    expect(clickChart.setOption).toHaveBeenCalledWith({ series: [{ data: [{ value: 1, itemStyle: {} }] }] });

    const themeObserver = { disconnect: vi.fn() };
    const exportHandler = vi.fn();
    renderer.themeObservers.set(environment.root, themeObserver);
    renderer.exportObservers.set(environment.root, exportHandler);
    renderer.instances.add(environment.chart);
    renderer.onDestroy();

    expect(themeObserver.disconnect).toHaveBeenCalledOnce();
    expect(renderer.themeObservers.size).toBe(0);
    expect(renderer.exportObservers.size).toBe(0);
  });

  it('disposes the retained DOM chart when no managed instances remain', () => {
    const environment = createEnvironment();
    const renderer = new EChartsTableEngine({ echarts: environment.echarts, cherry: environment.cherry });
    const container = document.createElement('div');
    environment.previewerDom.appendChild(container);
    renderer.dom = container;
    environment.echarts.getInstanceByDom.mockReturnValue(environment.chart);

    renderer.onDestroy();

    expect(environment.chart.dispose).toHaveBeenCalledOnce();
    expect(renderer.dom).toBeNull();
  });
});
