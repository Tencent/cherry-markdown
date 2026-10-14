import { describe, expect, it, vi } from 'vitest';
import { createRenderLifecycle } from '../src/wysiwyg/render-lifecycle';
import type { CherryVisualRendererResult } from '../src/wysiwyg/types';

function deferred() {
  let resolve!: (value: CherryVisualRendererResult) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<CherryVisualRendererResult>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function callbacks() {
  return { prepare: vi.fn(), commit: vi.fn(), failure: vi.fn() };
}

describe('shared preview revision lifecycle', () => {
  it('retains the committed preview until its replacement succeeds', async () => {
    const lifecycle = createRenderLifecycle();
    const oldCleanup = vi.fn();
    const initial = lifecycle.begin();
    await initial.settle(oldCleanup, callbacks());
    const next = lifecycle.begin();
    expect(initial.signal.aborted).toBe(false);
    expect(oldCleanup).not.toHaveBeenCalled();
    await next.settle(undefined, callbacks());
    expect(initial.signal.aborted).toBe(true);
    expect(oldCleanup).toHaveBeenCalledOnce();
    expect(lifecycle.hasActive).toBe(true);
    lifecycle.destroy();
  });

  it('never commits an older result and immediately releases its late cleanup', async () => {
    const lifecycle = createRenderLifecycle();
    const result = deferred();
    const older = lifecycle.begin();
    const oldCallbacks = callbacks();
    const lateCleanup = vi.fn();
    const settled = older.settle(result.promise, oldCallbacks);
    const latest = lifecycle.begin();
    const latestCallbacks = callbacks();
    await latest.settle(undefined, latestCallbacks);
    result.resolve(lateCleanup);
    await settled;
    expect(older.signal.aborted).toBe(true);
    expect(oldCallbacks.prepare).not.toHaveBeenCalled();
    expect(oldCallbacks.commit).not.toHaveBeenCalled();
    expect(lateCleanup).toHaveBeenCalledOnce();
    expect(latestCallbacks.commit).toHaveBeenCalledOnce();
    lifecycle.destroy();
  });

  it('a rejected replacement preserves the active preview and reports only once', async () => {
    const lifecycle = createRenderLifecycle();
    const cleanup = vi.fn();
    const initial = lifecycle.begin();
    await initial.settle(cleanup, callbacks());
    const next = lifecycle.begin();
    const hooks = callbacks();
    const error = new Error('Renderer failed');
    await next.settle(Promise.reject(error), hooks);
    expect(next.signal.aborted).toBe(true);
    expect(initial.signal.aborted).toBe(false);
    expect(cleanup).not.toHaveBeenCalled();
    expect(hooks.failure).toHaveBeenCalledExactlyOnceWith(error);
    expect(hooks.commit).not.toHaveBeenCalled();
    expect(next.fail()).toBe(false);
    lifecycle.destroy();
  });

  it('preparation errors clean the new result without disposing the old one', async () => {
    const lifecycle = createRenderLifecycle();
    const oldCleanup = vi.fn();
    await lifecycle.begin().settle(oldCleanup, callbacks());
    const newCleanup = vi.fn();
    const hooks = callbacks();
    const error = new Error('Invalid renderer output');
    hooks.prepare.mockImplementation(() => {
      throw error;
    });
    await lifecycle.begin().settle(newCleanup, hooks);
    expect(newCleanup).toHaveBeenCalledOnce();
    expect(oldCleanup).not.toHaveBeenCalled();
    expect(hooks.failure).toHaveBeenCalledExactlyOnceWith(error);
    lifecycle.destroy();
  });

  it('ignores stale failures after a new revision starts', async () => {
    const lifecycle = createRenderLifecycle();
    const result = deferred();
    const hooks = callbacks();
    const settled = lifecycle.begin().settle(result.promise, hooks);
    lifecycle.begin();
    result.reject(new Error('Obsolete failure'));
    await settled;
    expect(hooks.failure).not.toHaveBeenCalled();
    lifecycle.destroy();
  });

  it('destroy cancels pending and active resources, including late nested results', async () => {
    const lifecycle = createRenderLifecycle();
    const activeCleanup = vi.fn();
    const active = lifecycle.begin();
    await active.settle(activeCleanup, callbacks());
    const pending = lifecycle.begin();
    const staging = document.createElement('div');
    document.body.append(staging);
    pending.addCleanup(() => staging.remove());
    const result = deferred();
    const hooks = callbacks();
    const settled = pending.settle(result.promise, hooks);
    lifecycle.destroy();
    lifecycle.destroy();
    const late = vi.fn();
    pending.addCleanup(late);
    result.resolve(undefined);
    await settled;
    expect(staging.isConnected).toBe(false);
    expect(active.signal.aborted).toBe(true);
    expect(pending.signal.aborted).toBe(true);
    expect(activeCleanup).toHaveBeenCalledOnce();
    expect(late).toHaveBeenCalledOnce();
    expect(hooks.commit).not.toHaveBeenCalled();
  });

  it.each([undefined, '<svg></svg>'])(
    'can commit static output without retaining a render scope: %s',
    async (result) => {
      const lifecycle = createRenderLifecycle();
      const revision = lifecycle.begin();
      const hooks = callbacks();
      await revision.settle(result, { ...hooks, retain: false });
      expect(hooks.prepare).toHaveBeenCalledExactlyOnceWith(result);
      expect(hooks.commit).toHaveBeenCalledOnce();
      expect(revision.signal.aborted).toBe(true);
      expect(lifecycle.hasActive).toBe(false);
      lifecycle.destroy();
    },
  );

  it('keeps the resource-retention policy with the rendering owner', async () => {
    const lifecycle = createRenderLifecycle();
    const revision = lifecycle.begin();
    const cleanup = vi.fn();
    await revision.settle(cleanup, { ...callbacks(), retain: (result) => typeof result === 'function' });
    expect(revision.signal.aborted).toBe(false);
    lifecycle.clear();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(lifecycle.hasActive).toBe(false);
    lifecycle.destroy();
  });

  it('isolates cleanup/reporting failures while releasing sibling resources', async () => {
    const report = vi.fn(() => {
      throw new Error('Reporter failed');
    });
    const lifecycle = createRenderLifecycle(report);
    const revision = lifecycle.begin();
    const sibling = vi.fn();
    revision.addCleanup(() => {
      throw new Error('Cleanup failed');
    });
    revision.addCleanup(sibling);
    await revision.settle(undefined, callbacks());
    expect(() => lifecycle.destroy()).not.toThrow();
    expect(sibling).toHaveBeenCalledOnce();
    expect(report).toHaveBeenCalledOnce();
  });

  it('does not reactivate rendering after destruction', async () => {
    const lifecycle = createRenderLifecycle();
    lifecycle.destroy();
    const revision = lifecycle.begin();
    const cleanup = vi.fn();
    const hooks = callbacks();
    await revision.settle(cleanup, hooks);
    expect(revision.current()).toBe(false);
    expect(revision.signal.aborted).toBe(true);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(hooks.commit).not.toHaveBeenCalled();
    expect(hooks.failure).not.toHaveBeenCalled();
  });
});
