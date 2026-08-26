import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Engine from '../../src/Engine';
import EChartsTableEngine from '../../src/addons/advance/cherry-table-echarts-plugin';

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('rendered content lifecycle', () => {
  it('fans container cleanup out to sentence and paragraph hooks', () => {
    const cleanupA = vi.fn();
    const cleanupB = vi.fn();
    const engine = Object.create(Engine.prototype) as Engine;
    Reflect.set(engine, 'hooks', {
      sentence: [{ destroyRenderedContent: cleanupA }],
      paragraph: [{ destroyRenderedContent: cleanupB }],
    });
    const container = document.createElement('section');

    engine.destroyRenderedContent(container);

    expect(cleanupA).toHaveBeenCalledWith(container);
    expect(cleanupB).toHaveBeenCalledWith(container);
  });

  it('disposes chart instances and cancels pending renderer timers', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    container.className = 'cherry-echarts-wrapper';
    document.body.append(container);
    const dispose = vi.fn();
    const instance = {
      getDom: () => container,
      isDisposed: () => false,
      dispose,
    };
    const echarts = {
      getInstanceByDom: vi.fn(() => instance),
    };
    const engine = new EChartsTableEngine({ echarts });
    const delayed = vi.fn();
    engine.instances.add(instance);
    engine.$schedule(delayed, 50);

    engine.destroyChart(container);
    engine.onDestroy();
    vi.runAllTimers();

    expect(dispose).toHaveBeenCalledOnce();
    expect(delayed).not.toHaveBeenCalled();
    expect(engine.instances.size).toBe(0);
    expect(engine.pendingTimers.size).toBe(0);
  });

  it('is safe to destroy when ECharts is unavailable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = new EChartsTableEngine({ echarts: null });

    expect(() => engine.onDestroy()).not.toThrow();
    expect(engine.isValid()).toBe(false);
    warn.mockRestore();
  });
});
