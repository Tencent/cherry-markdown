import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Table from '../../../src/core/hooks/Table';
import { hashHex } from '../../../src/utils/hash';

interface TableConfig {
  enableChart?: boolean;
  selfClosing?: boolean;
  chartRenderEngine?: new (options: Record<string, unknown>) => object;
  externals?: string[];
  chartEngineOptions?: Record<string, unknown>;
}

interface TableData {
  header: string[];
  rows: string[][];
  colLength: number;
  rowLength: number;
}

interface ChartRenderCall {
  type: string;
  options: Record<string, unknown>;
  table: TableData;
  cherry: TestCherry;
}

interface TestCherry {
  options: {
    engine: {
      global: {
        flowSessionContext: boolean;
      };
    };
  };
}

class TestChartEngine {
  static latestOptions: Record<string, unknown> | undefined;
  static latestRender: ChartRenderCall | undefined;

  constructor(options: Record<string, unknown>) {
    TestChartEngine.latestOptions = options;
  }

  render(type: string, options: Record<string, unknown>, table: TableData, cherry: TestCherry) {
    TestChartEngine.latestRender = { type, options, table, cherry };
    return '<div class="test-chart">chart</div>';
  }
}

const sentenceMake = (markdown: string) => ({ html: `<em>${markdown}</em>` });

function createTable(config: TableConfig = {}, externals: Record<string, unknown> = {}) {
  const cherry: TestCherry = {
    options: {
      engine: {
        global: {
          flowSessionContext: false,
        },
      },
    },
  };
  const hook = new Table({
    externals,
    config: {
      enableChart: false,
      selfClosing: false,
      ...config,
    },
    cherry,
  });
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
      $cherry: cherry,
    },
  });
  return { hook, cherry };
}

describe('core/hooks/Table', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
    TestChartEngine.latestOptions = undefined;
    TestChartEngine.latestRender = undefined;
  });

  it('extends short rows while preserving complete rows', () => {
    const { hook } = createTable();
    const complete = ['a', 'b'];

    expect(hook.$extendColumns(complete, 2)).toBe(complete);
    expect(hook.$extendColumns(['a'], 3)).toEqual(['a', '&nbsp;', '&nbsp;']);
  });

  it('parses JSON chart properties and removes unsafe keys', () => {
    const { hook } = createTable();
    const properties = hook.$parseProps(
      '"title":"Sales","nested":{"constructor":"blocked","value":2},"__proto__":{"polluted":true}',
    );

    expect(properties).toEqual({ title: 'Sales', nested: { value: 2 } });
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('returns an empty object for malformed JSON chart properties', () => {
    const { hook } = createTable();

    expect(hook.$parseProps('')).toEqual({});
    expect(hook.$parseProps('"title":')).toEqual({});
  });

  it('supports legacy chart properties and value coercion', () => {
    const { hook } = createTable();

    expect(hook.$parseProps('title: Sales, count: -2.5, visible: true, hidden: false, ignored')).toEqual({
      title: 'Sales',
      count: -2.5,
      visible: true,
      hidden: false,
    });
  });

  it('only parses chart declarations when a chart engine is available', () => {
    const { hook: plainTable } = createTable();
    const { hook: chartTable } = createTable({ enableChart: true, chartRenderEngine: TestChartEngine });

    expect(plainTable.$parseChartOptions(':bar: {"title":"Sales"}')).toBeNull();
    expect(chartTable.$parseChartOptions('ordinary heading')).toBeNull();
    expect(chartTable.$parseChartOptions(':bar:')).toEqual({ type: 'bar', options: {} });
    expect(chartTable.$parseChartOptions(':line: {"smooth":true}')).toEqual({
      type: 'line',
      options: { smooth: true },
    });
  });

  it('injects required externals and fixed rendering defaults into the chart engine', () => {
    const echarts = { version: 'test' };
    const { cherry } = createTable(
      {
        enableChart: true,
        chartRenderEngine: TestChartEngine,
        externals: ['echarts'],
        chartEngineOptions: { width: 720, echarts: 'must-be-replaced', custom: true },
      },
      { echarts },
    );

    expect(TestChartEngine.latestOptions).toMatchObject({
      echarts,
      renderer: 'svg',
      width: 720,
      height: 300,
      custom: true,
      cherryOptions: cherry.options,
      cherry,
    });
  });

  it('keeps working when chart engine construction fails', () => {
    class BrokenChartEngine {
      constructor() {
        throw new Error('missing dependency');
      }
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { hook } = createTable({
      enableChart: true,
      chartRenderEngine: BrokenChartEngine,
    });

    expect(hook.chartRenderEngine).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({ message: 'missing dependency' }));
  });

  it('maps Markdown alignment markers to table alignment codes', () => {
    const { hook } = createTable();

    expect(hook.$parseColumnAlignRules(['---', ':---', '---:', ':---:'])).toEqual({
      textAlignRules: ['U', 'L', 'R', 'C'],
      COLUMN_ALIGN_MAP: { L: 'left', R: 'right', C: 'center' },
    });
  });

  it('renders a chart before its source table and strips flow cursors from chart data', () => {
    const { hook, cherry } = createTable({ enableChart: true, chartRenderEngine: TestChartEngine });
    const result = hook.$parseTable(
      [
        '| :bar: {"title":"Sales"} | Q1 |',
        '| --- | ---: |',
        '| AlphaCHERRYFLOWSESSIONCURSOR | 10CHERRYFLOWSESSIONCURSOR |',
      ],
      sentenceMake,
      3,
    );

    expect(result.html).toContain('<figure class="cherry-table-figure"><div class="test-chart">chart</div></figure>');
    expect(result.html).toContain('<table class="cherry-table">');
    expect(TestChartEngine.latestRender).toEqual({
      type: 'bar',
      options: { title: 'Sales' },
      table: {
        header: ['', 'Q1'],
        rows: [['Alpha', '10']],
        colLength: 2,
        rowLength: 1,
      },
      cherry,
    });
  });
});
