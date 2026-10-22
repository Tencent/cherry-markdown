import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountCherryChart } from '../src/cherry-echarts';
import { cherryChartLocale } from '../src/cherry-chart-locale';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const table = { header: ['', 'Jan'], rows: [['Sales', '1']], colLength: 2, rowLength: 1 };
const option = { series: [{ type: 'line', data: [1] }] };
type ChartMountOptions = Parameters<typeof mountCherryChart>[1];
const cleanups: Array<() => void> = [];

function fixture() {
  const addListener = vi.spyOn(window, 'addEventListener');
  const removeListener = vi.spyOn(window, 'removeEventListener');
  const disconnectTheme = vi.spyOn(MutationObserver.prototype, 'disconnect');
  const root = document.body.appendChild(document.createElement('div'));
  root.className = 'cherry theme__default';
  const container = root.appendChild(document.createElement('div'));
  const sibling = container.appendChild(document.createElement('span'));
  sibling.textContent = 'Consumer content';
  const createChart = (element: HTMLElement) => {
    let disposed = false;
    let options: Record<string, unknown> = {};
    return {
      getDom: () => element,
      getOption: () => options,
      setOption: vi.fn((value: Record<string, unknown>) => {
        options = value;
      }),
      isDisposed: () => disposed,
      dispose: vi.fn(() => {
        disposed = true;
        registry.delete(element);
      }),
      resize: vi.fn(),
      clear: vi.fn(),
      on: vi.fn(),
      dispatchAction: vi.fn(),
    };
  };
  type Chart = ReturnType<typeof createChart>;
  const registry = new Map<HTMLElement, Chart>();
  const charts: Chart[] = [];
  const library = {
    getInstanceByDom: vi.fn((element: HTMLElement) => registry.get(element)),
    getMap: vi.fn(),
    registerMap: vi.fn(),
    init: vi.fn((element: HTMLElement) => {
      const chart = createChart(element);
      charts.push(chart);
      registry.set(element, chart);
      return chart;
    }),
  };
  const observers: Array<{ disconnect: ReturnType<typeof vi.fn>; notify(): void }> = [];
  vi.stubGlobal(
    'ResizeObserver',
    class implements ResizeObserver {
      disconnect = vi.fn();
      constructor(callback: ResizeObserverCallback) {
        observers.push({ notify: () => callback([], this), disconnect: this.disconnect });
      }
      observe() {}
      unobserve() {}
    },
  );
  const echarts = library as unknown as ChartMountOptions['echarts'];
  const mount = (settings: Partial<ChartMountOptions> = {}) => {
    const cleanup = mountCherryChart(container, { echarts, type: 'line', options: {}, table, ...settings });
    cleanups.push(cleanup);
    return cleanup;
  };
  return {
    root,
    container,
    sibling,
    library,
    echarts,
    mount,
    charts,
    registry,
    observers,
    addListener,
    removeListener,
    disconnectTheme,
  };
}

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup());
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Cherry chart mounting boundary', () => {
  it('derives chart messages from Cherry instead of a second translation table', () => {
    expect(() =>
      execFileSync(process.execPath, [resolve(import.meta.dirname, '../scripts/sync-chart-locale.mjs'), '--check']),
    ).not.toThrow();
    expect(Object.keys(cherryChartLocale).length).toBeGreaterThan(0);
  });
  it.each(['table', 'codeblock'])('owns only its %s mount and releases it once', (kind) => {
    const { container, sibling, library, mount, charts, registry, observers } = fixture();
    const controller = new AbortController();
    const cleanup = mount({
      ...(kind === 'codeblock' ? { type: 'codeblock', options: option, table: undefined } : {}),
      signal: controller.signal,
    });
    const chartRoot = container.querySelector<HTMLElement>('.cherry-echarts-wrapper')!;
    expect(library.init).toHaveBeenCalledTimes(1);
    expect(chartRoot.style.height).toBe('300px');
    if (kind === 'table') expect(JSON.parse(chartRoot.dataset.tableData!)).toEqual(table);
    expect(charts[0].setOption).toHaveBeenCalledWith(
      expect.objectContaining({ series: [expect.objectContaining({ type: 'line', data: [1] })] }),
      true,
    );
    controller.abort();
    cleanup();
    cleanup();
    expect(charts[0].dispose).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(sibling);
    window.dispatchEvent(new Event('cherry:export:done'));
    expect(library.init).toHaveBeenCalledTimes(1);
  });

  it.each(['table', 'codeblock'])('does not mount an already cancelled %s revision', (kind) => {
    const { container, sibling, mount, library, observers } = fixture();
    const controller = new AbortController();
    controller.abort();
    mount({
      ...(kind === 'codeblock' ? { type: 'codeblock', options: option, table: undefined } : {}),
      signal: controller.signal,
    })();
    expect(library.init).not.toHaveBeenCalled();
    expect(observers).toHaveLength(0);
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(sibling);
  });

  it.each(['table', 'codeblock'])('resizes and disposes the current %s instance after export rebuilds', (kind) => {
    const { mount, charts, registry, observers, library, addListener, removeListener, disconnectTheme } = fixture();
    const cleanup = mount(kind === 'codeblock' ? { type: 'codeblock', options: option, table: undefined } : {});
    for (let revision = 1; revision <= 3; revision += 1) {
      window.dispatchEvent(new Event('cherry:export:done'));
      expect(charts).toHaveLength(revision + 1);
      expect(charts[revision - 1].isDisposed()).toBe(true);
      expect(charts[revision].setOption).toHaveBeenCalledWith(
        expect.objectContaining({ series: [expect.objectContaining({ type: 'line', data: [1] })] }),
        true,
      );
      observers[0].notify();
      expect(charts[revision].resize).toHaveBeenCalledTimes(1);
    }
    cleanup();
    cleanup();
    expect(registry.size).toBe(0);
    charts.forEach((chart) => expect(chart.dispose).toHaveBeenCalledTimes(1));
    window.dispatchEvent(new Event('cherry:export:done'));
    expect(library.init).toHaveBeenCalledTimes(4);
    observers[0].notify();
    expect(charts[3].resize).toHaveBeenCalledTimes(1);
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(disconnectTheme).toHaveBeenCalledTimes(1);
    addListener.mock.calls
      .filter(([name]) => name === 'cherry:export:done')
      .forEach(([name, handler]) => expect(removeListener).toHaveBeenCalledWith(name, handler));
  });

  it('cleans an instance whose initial setOption fails before Cherry tracks it', () => {
    const { mount, library, charts, registry, container, sibling } = fixture();
    const init = library.init.getMockImplementation()!;
    library.init.mockImplementationOnce((element) => {
      const chart = init(element);
      chart.setOption.mockImplementationOnce(() => {
        throw new Error('Invalid options');
      });
      return chart;
    });
    expect(() => mount()).toThrow('Invalid options');
    expect(charts[0].dispose).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
    expect(container.firstElementChild).toBe(sibling);
    expect(container.children).toHaveLength(1);
  });

  it('keeps another mount alive when one chart is destroyed', () => {
    const { root, mount, echarts, charts, registry } = fixture();
    const other = root.appendChild(document.createElement('div'));
    const cleanup = mount();
    const cleanupOther = mountCherryChart(other, { echarts, type: 'line', options: {}, table });
    cleanups.push(cleanupOther);
    cleanup();
    expect(registry.size).toBe(1);
    expect(charts[1].isDisposed()).toBe(false);
    window.dispatchEvent(new Event('cherry:export:done'));
    expect(charts).toHaveLength(3);
    expect(charts[2].isDisposed()).toBe(false);
    cleanupOther();
    expect(registry.size).toBe(0);
  });

  it.each([0, 1])('keeps the sibling chart alive when mount %i is removed after a shared export', (removed) => {
    const { root, container, mount, echarts, registry } = fixture();
    const other = root.appendChild(document.createElement('div'));
    const cleanupFirst = mount();
    const cleanupSecond = mountCherryChart(other, { echarts, type: 'line', options: {}, table });
    cleanups.push(cleanupSecond);
    const mounts = [
      container.querySelector<HTMLElement>('.cherry-echarts-wrapper')!,
      other.firstElementChild as HTMLElement,
    ];
    const release = [cleanupFirst, cleanupSecond];
    window.dispatchEvent(new Event('cherry:export:done'));
    const survivor = registry.get(mounts[1 - removed])!;
    release[removed]();
    expect(survivor.isDisposed()).toBe(false);
    expect(registry.get(mounts[1 - removed])).toBe(survivor);
    expect(registry.size).toBe(1);
    window.dispatchEvent(new Event('cherry:export:done'));
    expect(registry.get(mounts[1 - removed])?.isDisposed()).toBe(false);
    release[1 - removed]();
    expect(registry.size).toBe(0);
  });

  it('cancels pending map requests, including export rebuilds, on explicit cleanup', async () => {
    const { mount, library, registry } = fixture();
    const pending: Array<{ signal: AbortSignal; resolve(value: Response): void }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((resolve) => pending.push({ signal: init.signal!, resolve })),
      ),
    );
    const cleanup = mount({ type: 'map', options: { mapDataSource: 'china' } });
    window.dispatchEvent(new Event('cherry:export:done'));
    expect(pending).toHaveLength(1);
    cleanup();
    expect(registry.size).toBe(0);
    pending.forEach(({ signal, resolve }) => {
      expect(signal.aborted).toBe(true);
      resolve(new Response(JSON.stringify({ type: 'FeatureCollection', features: [] })));
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(library.registerMap).not.toHaveBeenCalled();
    expect(library.init).toHaveBeenCalledTimes(2);
  });

  it('does not require ResizeObserver to release a chart', () => {
    const { mount, charts, registry } = fixture();
    vi.stubGlobal('ResizeObserver', undefined);
    const cleanup = mount();
    cleanup();
    expect(charts[0].dispose).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
  });

  it('uses the injected map registry without modifying a different global ECharts', async () => {
    const { mount, library, charts } = fixture();
    const globalLibrary = { getMap: vi.fn(), registerMap: vi.fn() };
    vi.stubGlobal('echarts', globalLibrary);
    const maps = new Set<string>();
    library.getMap.mockImplementation((name) => (maps.has(name) ? {} : undefined));
    library.registerMap.mockImplementation((name) => {
      maps.add(name);
    });
    const data = { type: 'FeatureCollection', features: [] };
    const fetchMap = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
    vi.stubGlobal('fetch', fetchMap);
    mount({
      type: 'map',
      options: { mapDataSource: 'china' },
      table: {
        header: ['Province', 'Value'],
        rows: [['北京', '10']],
        colLength: 2,
        rowLength: 1,
      },
    });
    await vi.waitFor(() =>
      expect(charts[0].getOption().series).toEqual([
        expect.objectContaining({ type: 'map', map: 'china', data: [{ name: '北京市', value: 10 }] }),
      ]),
    );
    expect(library.registerMap).toHaveBeenCalledWith('china', data);
    expect(globalLibrary.getMap).not.toHaveBeenCalled();
    expect(globalLibrary.registerMap).not.toHaveBeenCalled();
    expect(window.echarts).toBe(globalLibrary);
    window.dispatchEvent(new Event('cherry:export:done'));
    expect(fetchMap).toHaveBeenCalledTimes(1);
  });

  it('tries fallback map sources and retries failures with the same owned cancellation signal', async () => {
    const { container, mount, library } = fixture();
    const fetchMap = vi.fn().mockRejectedValue(new Error('Network unavailable'));
    vi.stubGlobal('fetch', fetchMap);
    mount({ type: 'map', options: { mapDataSource: 'china' } });
    const chartRoot = container.querySelector<HTMLElement>('.cherry-echarts-wrapper')!;
    await vi.waitFor(() => expect(chartRoot.dataset.mapStatus).toBe('failed'));
    expect(fetchMap).toHaveBeenCalledTimes(3);
    const chart = library.getInstanceByDom(chartRoot)!;
    const retry = (chart.getOption().graphic as { onclick(): void }).onclick;
    fetchMap.mockResolvedValue({ ok: true, json: async () => ({ type: 'FeatureCollection', features: [] }) });
    library.registerMap.mockImplementation(() => {
      library.getMap.mockReturnValue({});
    });
    retry();
    await vi.waitFor(() => expect(chartRoot.dataset.mapStatus).toBe('success'));
    expect(fetchMap).toHaveBeenCalledTimes(4);
    expect(fetchMap.mock.calls[0][1].signal).toBe(fetchMap.mock.calls[3][1].signal);
  });

  it('keeps map cancellation independent between sibling mounts after export', async () => {
    const { root, mount, echarts, library } = fixture();
    const pending: Array<{ signal: AbortSignal; resolve(value: Response): void }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((resolve) => pending.push({ signal: init.signal!, resolve })),
      ),
    );
    const settings = { type: 'map', options: { mapDataSource: 'china' } };
    const cleanupFirst = mount(settings);
    const other = root.appendChild(document.createElement('div'));
    const cleanupSecond = mountCherryChart(other, { echarts, table, ...settings });
    cleanups.push(cleanupSecond);
    window.dispatchEvent(new Event('cherry:export:done'));
    expect(pending).toHaveLength(2);
    expect(pending[0].signal).not.toBe(pending[1].signal);
    cleanupFirst();
    expect(pending.map(({ signal }) => signal.aborted)).toEqual([true, false]);
    cleanupSecond();
    pending.forEach(({ signal, resolve }) => {
      expect(signal.aborted).toBe(true);
      resolve(new Response(JSON.stringify({ type: 'FeatureCollection', features: [] })));
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(library.registerMap).not.toHaveBeenCalled();
  });
});
