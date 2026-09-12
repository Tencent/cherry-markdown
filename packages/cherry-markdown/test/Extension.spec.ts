import { describe, expect, it, vi } from 'vite-plus/test';
import Cherry from '../src/Cherry';

type TestExtension = { name: string; mount: (cherry: Cherry) => unknown };

function extensionHost(extensions: TestExtension[]) {
  const host = Object.create(Cherry.prototype) as Cherry & {
    extensionCleanups: Array<() => void | Promise<void>>;
    isDestroyed: boolean;
    __editorDestroy: ReturnType<typeof vi.fn>;
    __wrapperRemove: ReturnType<typeof vi.fn>;
    __clearEvents: ReturnType<typeof vi.fn>;
  };
  const editorDestroy = vi.fn();
  const wrapperRemove = vi.fn();
  const clearEvents = vi.fn();
  Reflect.set(host, 'options', { extensions });
  host.extensionCleanups = [];
  host.isDestroyed = false;
  Reflect.set(host, 'editor', { destroy: editorDestroy });
  Reflect.set(host, 'wrapperDom', { remove: wrapperRemove });
  Reflect.set(host, '$event', { clearAll: clearEvents });
  host.__editorDestroy = editorDestroy;
  host.__wrapperRemove = wrapperRemove;
  host.__clearEvents = clearEvents;
  return host;
}

describe('Cherry instance extensions', () => {
  it('mounts asynchronous extensions per instance and destroys only their own cleanup', async () => {
    const cleanupA = vi.fn();
    const cleanupB = vi.fn();
    const extensionA = { name: 'a', mount: vi.fn(async () => cleanupA) };
    const extensionB = { name: 'b', mount: vi.fn(async () => cleanupB) };
    const first = extensionHost([extensionA]);
    const second = extensionHost([extensionB]);

    first.mountExtensions();
    second.mountExtensions();
    await vi.waitFor(() => expect(first.extensionCleanups).toHaveLength(1));
    await vi.waitFor(() => expect(second.extensionCleanups).toHaveLength(1));
    expect(extensionA.mount).toHaveBeenCalledWith(first);
    expect(extensionB.mount).toHaveBeenCalledWith(second);

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
    const host = extensionHost([
      {
        name: 'late',
        mount: () => new Promise<() => void>((resolve) => (resolveMount = resolve)),
      },
    ]);

    host.mountExtensions();
    await vi.waitFor(() => expect(resolveMount).toBeTypeOf('function'));
    host.destroy();
    resolveMount?.(cleanup);
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledOnce());
    expect(host.extensionCleanups).toHaveLength(0);
  });

  it('isolates a rejected extension mount so later extensions still initialize', async () => {
    const error = new Error('mount failed');
    const cleanup = vi.fn();
    const healthyMount = vi.fn(async () => cleanup);
    const host = extensionHost([
      { name: 'broken', mount: async () => Promise.reject(error) },
      { name: 'healthy', mount: healthyMount },
    ]);

    host.mountExtensions();
    await vi.waitFor(() => expect(healthyMount).toHaveBeenCalledWith(host));
    await vi.waitFor(() => expect(host.extensionCleanups).toEqual([cleanup]));
  });
});
