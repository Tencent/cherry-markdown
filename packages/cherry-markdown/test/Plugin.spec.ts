import { describe, expect, it, vi } from 'vite-plus/test';
import Cherry from '../src/Cherry';

type TestPlugin = { name: string; mount: (cherry: Cherry) => unknown };

function pluginHost(plugins: TestPlugin[]) {
  const host = Object.create(Cherry.prototype) as Cherry & {
    pluginCleanups: Array<() => void | Promise<void>>;
    isDestroyed: boolean;
    __editorDestroy: ReturnType<typeof vi.fn>;
    __wrapperRemove: ReturnType<typeof vi.fn>;
    __clearEvents: ReturnType<typeof vi.fn>;
  };
  const editorDestroy = vi.fn();
  const wrapperRemove = vi.fn();
  const clearEvents = vi.fn();
  Reflect.set(host, 'options', { plugins });
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
