import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Cherry from '../../src/Cherry';
import { createCm6View } from '../helpers/cM6View';

describe('Cherry runtime plugin lifecycle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('creates, mounts and destroys an isolated runtime for every Cherry instance', async () => {
    createCm6View('').destroy();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    class RuntimeCherry extends Cherry {}
    Object.defineProperty(RuntimeCherry, 'initialized', { configurable: true, writable: true, value: false });
    const firstDestroy = vi.fn();
    const secondDestroy = vi.fn();
    const runtimes = [
      { mount: vi.fn(async () => {}), destroy: firstDestroy },
      { mount: vi.fn(async () => {}), destroy: secondDestroy },
    ];
    const plugin = {
      $cherry$runtime: true,
      create: vi.fn(() => runtimes.shift()),
    };
    const pluginOptions = { enabled: true };
    RuntimeCherry.usePlugin(plugin, pluginOptions);

    const firstRoot = document.createElement('div');
    const secondRoot = document.createElement('div');
    document.body.append(firstRoot, secondRoot);
    const first = new RuntimeCherry({ el: firstRoot, value: '# First', isPreviewOnly: true });
    const second = new RuntimeCherry({ el: secondRoot, value: '# Second', isPreviewOnly: true });
    await Promise.all([first.whenPluginsReady(), second.whenPluginsReady()]);

    expect(plugin.create).toHaveBeenNthCalledWith(1, first, pluginOptions);
    expect(plugin.create).toHaveBeenNthCalledWith(2, second, pluginOptions);
    expect(first.getPlugin(plugin)).toBeDefined();
    expect(second.getPlugin(plugin)).toBeDefined();

    first.destroy();
    second.destroy();
    expect(firstDestroy).toHaveBeenCalledOnce();
    expect(secondDestroy).toHaveBeenCalledOnce();
  });

  it('removes and cleans a runtime whose asynchronous mount fails', async () => {
    createCm6View('').destroy();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    class RuntimeCherry extends Cherry {}
    Object.defineProperty(RuntimeCherry, 'initialized', { configurable: true, writable: true, value: false });
    const destroy = vi.fn();
    const plugin = {
      $cherry$runtime: true,
      create: () => ({
        mount: () => Promise.reject(new Error('mount failed')),
        destroy,
      }),
    };
    RuntimeCherry.usePlugin(plugin);
    const root = document.createElement('div');
    document.body.append(root);
    const cherry = new RuntimeCherry({ el: root, value: '# Native fallback', isPreviewOnly: true });

    await expect(cherry.whenPluginsReady()).rejects.toThrow('mount failed');
    expect(cherry.getPlugin(plugin)).toBeUndefined();
    expect(root.querySelector('h1')?.textContent).toBe('Native fallback');
    expect(destroy).toHaveBeenCalledOnce();
    cherry.destroy();
  });

  it('mounts runtime plugins in registration order', async () => {
    createCm6View('').destroy();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    class RuntimeCherry extends Cherry {}
    Object.defineProperty(RuntimeCherry, 'initialized', { configurable: true, writable: true, value: false });
    const order: string[] = [];
    let releaseFirst = () => {};
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = {
      $cherry$runtime: true,
      create: () => ({
        mount: async () => {
          order.push('first:start');
          await firstPending;
          order.push('first:end');
        },
      }),
    };
    const second = {
      $cherry$runtime: true,
      create: () => ({ mount: () => order.push('second') }),
    };
    RuntimeCherry.usePlugin(first);
    RuntimeCherry.usePlugin(second);
    const root = document.createElement('div');
    document.body.append(root);
    const cherry = new RuntimeCherry({ el: root, value: '# Ordered', isPreviewOnly: true });

    await vi.waitFor(() => expect(order).toEqual(['first:start']));
    releaseFirst();
    await cherry.whenPluginsReady();
    expect(order).toEqual(['first:start', 'first:end', 'second']);
    cherry.destroy();
  });
});
