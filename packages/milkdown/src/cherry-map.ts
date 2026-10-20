/** Milkdown owns network requests; Cherry still generates all map styling/data. */
export function createMapOptions<Table>(
  mount: HTMLElement,
  echarts: typeof import('echarts'),
  signal: AbortSignal,
  generate: (table: Table, options: Record<string, unknown>) => Record<string, unknown>,
  messages: { mapChartLoading: string; mapChartError: string; mapChartRetry: string },
) {
  let pending = false;
  let failed = false;
  let resolvedSource: string | undefined;
  let latest: { table: Table; options: Record<string, unknown> };
  const refresh = () => {
    if (signal.aborted || !latest) return;
    try {
      echarts.getInstanceByDom(mount)?.setOption(optionsFor(latest.table, latest.options), true);
    } catch {
      // A failed asynchronous refresh stays local to its owned chart.
      mount.dataset.mapStatus = 'failed';
    }
  };
  const load = async (sources: string[]) => {
    pending = true;
    mount.dataset.mapStatus = 'loading';
    for (const source of sources) {
      try {
        const response = await fetch(source, { referrerPolicy: 'no-referrer', signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (signal.aborted) return;
        echarts.registerMap(source, data);
        resolvedSource = source;
        pending = false;
        mount.dataset.mapStatus = 'success';
        refresh();
        return;
      } catch {
        if (signal.aborted) return;
      }
    }
    pending = false;
    failed = true;
    mount.dataset.mapStatus = 'failed';
    refresh();
  };
  function optionsFor(table: Table, options: Record<string, unknown>): Record<string, unknown> {
    latest = { table, options };
    if (signal.aborted) return {};
    const sources = [
      ...new Set([
        ...(typeof options.mapDataSource === 'string' ? [options.mapDataSource] : []),
        'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
        './assets/data/china.json',
      ]),
    ];
    const registered =
      resolvedSource ??
      sources.find(
        (source, index) => (typeof options.mapDataSource !== 'string' || index === 0) && echarts.getMap(source),
      );
    if (registered) {
      mount.dataset.mapStatus = 'success';
      return generate(table, { ...options, mapDataSource: registered });
    }
    if (!pending && !failed) void load(sources);
    return {
      title: {
        text: failed ? messages.mapChartError : `${messages.mapChartLoading}...`,
        left: 'center',
        top: 'middle',
      },
      ...(failed && {
        graphic: {
          type: 'text',
          left: 'center',
          top: '60%',
          style: { text: messages.mapChartRetry, fill: '#888' },
          onclick: () => {
            failed = false;
            refresh();
          },
        },
      }),
    };
  }
  return optionsFor;
}
