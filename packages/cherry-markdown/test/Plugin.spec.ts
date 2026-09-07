import { describe, expect, it, vi } from 'vite-plus/test';
import Cherry from '../src/Cherry';

type TestPlugin = { name: string; mount: (cherry: Cherry) => unknown };

function pluginHost(plugins: TestPlugin[]) {
  class RegisteredCherry extends Cherry {
    static initialized = false;
  }
  plugins.forEach((plugin) => RegisteredCherry.usePlugin(plugin));
  const host = Object.create(RegisteredCherry.prototype) as Cherry & {
    pluginCleanups: Array<() => void | Promise<void>>;
    isDestroyed: boolean;
    __editorDestroy: ReturnType<typeof vi.fn>;
    __wrapperRemove: ReturnType<typeof vi.fn>;
    __clearEvents: ReturnType<typeof vi.fn>;
  };
  const editorDestroy = vi.fn();
  const wrapperRemove = vi.fn();
  const clearEvents = vi.fn();
  Reflect.set(host, 'options', {});
  host.pluginCleanups = [];
  Reflect.set(host, 'pluginMountTask', Promise.resolve());
  host.isDestroyed = false;
  Reflect.set(host, 'editor', { destroy: editorDestroy });
  Reflect.set(host, 'wrapperDom', { remove: wrapperRemove });
  Reflect.set(host, '$event', { clearAll: clearEvents });
  host.__editorDestroy = editorDestroy;
  host.__wrapperRemove = wrapperRemove;
  host.__clearEvents = clearEvents;
  return host;
}

describe('Cherry instance plugins', () => {
  it('registers once with options and mounts independently for every instance', async () => {
    class RegisteredCherry extends Cherry {
      static initialized = false;
    }
    const cleanups = [vi.fn(), vi.fn()];
    let index = 0;
    const plugin = { name: 'shared', mount: vi.fn(() => cleanups[index++]) };
    const options = { debounce: 20 };
    RegisteredCherry.usePlugin(plugin, options);
    RegisteredCherry.usePlugin(plugin, options);
    const first = pluginHost([]);
    const second = pluginHost([]);
    Reflect.set(first, 'constructor', RegisteredCherry);
    Reflect.set(second, 'constructor', RegisteredCherry);
    await first.mountPlugins();
    await second.mountPlugins();
    expect(plugin.mount).toHaveBeenCalledTimes(2);
    expect(plugin.mount).toHaveBeenNthCalledWith(1, first, options);
    expect(plugin.mount).toHaveBeenNthCalledWith(2, second, options);
    first.destroy();
    expect(cleanups[0]).toHaveBeenCalledOnce();
    expect(cleanups[1]).not.toHaveBeenCalled();
    second.destroy();
    expect(cleanups[1]).toHaveBeenCalledOnce();
  });

  it('preserves legacy install registration and rejects registration after initialization', () => {
    class RegisteredCherry extends Cherry {
      static initialized = false;
    }
    const legacy = { install: vi.fn() };
    const options = { mermaid: {} };
    RegisteredCherry.usePlugin(legacy, options);
    RegisteredCherry.usePlugin(legacy, options);
    expect(legacy.install).toHaveBeenCalledExactlyOnceWith(RegisteredCherry.config.defaults, options);
    RegisteredCherry.initialized = true;
    expect(() => RegisteredCherry.usePlugin({ mount: vi.fn() })).toThrow(/before Cherry is instantiated/);
  });

  it('mounts asynchronous plugins per instance and destroys only their own cleanup', async () => {
    const cleanupA = vi.fn();
    const cleanupB = vi.fn();
    const pluginA = { name: 'a', mount: vi.fn(async () => cleanupA) };
    const pluginB = { name: 'b', mount: vi.fn(async () => cleanupB) };
    const first = pluginHost([pluginA]);
    const second = pluginHost([pluginB]);

    first.mountPlugins();
    second.mountPlugins();
    await vi.waitFor(() => expect(first.pluginCleanups).toHaveLength(1));
    await vi.waitFor(() => expect(second.pluginCleanups).toHaveLength(1));
    expect(pluginA.mount).toHaveBeenCalledWith(first);
    expect(pluginB.mount).toHaveBeenCalledWith(second);

    first.destroy();
    expect(cleanupA).toHaveBeenCalledOnce();
    expect(cleanupB).not.toHaveBeenCalled();
    expect(first.__editorDestroy).toHaveBeenCalledOnce();
    expect(first.__wrapperRemove).toHaveBeenCalledOnce();
    first.destroy();
    expect(cleanupA).toHaveBeenCalledOnce();
  });

  it('runs a late async cleanup immediately when the Cherry instance was already destroyed', async () => {
    const cleanup = vi.fn();
    let resolveMount: ((value: () => void) => void) | undefined;
    const host = pluginHost([
      {
        name: 'late',
        mount: () => new Promise<() => void>((resolve) => (resolveMount = resolve)),
      },
    ]);

    host.mountPlugins();
    await vi.waitFor(() => expect(resolveMount).toBeTypeOf('function'));
    host.destroy();
    resolveMount?.(cleanup);
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledOnce());
    expect(host.pluginCleanups).toHaveLength(0);
  });

  it('isolates a rejected plugin mount so later plugins still initialize', async () => {
    const error = new Error('mount failed');
    const cleanup = vi.fn();
    const healthyMount = vi.fn(async () => cleanup);
    const host = pluginHost([
      { name: 'broken', mount: async () => Promise.reject(error) },
      { name: 'healthy', mount: healthyMount },
    ]);

    host.mountPlugins();
    await vi.waitFor(() => expect(healthyMount).toHaveBeenCalledWith(host));
    await vi.waitFor(() => expect(host.pluginCleanups).toEqual([cleanup]));
  });

  it('mounts in declaration order and destroys in reverse dependency order', async () => {
    const calls: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const host = pluginHost([
      {
        name: 'first',
        mount: async () => {
          calls.push('mount:first');
          await new Promise<void>((resolve) => (releaseFirst = resolve));
          return () => calls.push('destroy:first');
        },
      },
      {
        name: 'second',
        mount: async () => {
          calls.push('mount:second');
          return () => calls.push('destroy:second');
        },
      },
    ]);

    const mounted = host.mountPlugins();
    await vi.waitFor(() => expect(calls).toEqual(['mount:first']));
    releaseFirst?.();
    await mounted;
    expect(calls).toEqual(['mount:first', 'mount:second']);

    host.destroy();
    expect(calls).toEqual(['mount:first', 'mount:second', 'destroy:second', 'destroy:first']);
  });
});
