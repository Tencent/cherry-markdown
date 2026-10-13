import { describe, expect, it, vi } from 'vitest';
import { createRendererCleanup } from '../src/wysiwyg/renderer-cleanup';

describe('renderer result ownership', () => {
  it('owns one cleanup per result, even when two renderers return the same function', () => {
    const controller = new AbortController();
    const cleanup = vi.fn();
    const scope = createRendererCleanup(controller.signal);
    scope.add(cleanup);
    scope.add(cleanup);
    scope.dispose();
    scope.dispose();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('disposes completed and late results exactly once', () => {
    const controller = new AbortController();
    const completed = vi.fn();
    const late = vi.fn();
    const scope = createRendererCleanup(controller.signal);
    scope.add(completed);
    controller.abort();
    scope.add(late);
    scope.dispose();
    expect(completed).toHaveBeenCalledTimes(1);
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('accepts already aborted signals and releases subsequent results', () => {
    const controller = new AbortController();
    controller.abort();
    const cleanup = vi.fn();
    const scope = createRendererCleanup(controller.signal);
    scope.add(cleanup);
    scope.dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('releases siblings even when a renderer cleanup throws', () => {
    const controller = new AbortController();
    const onError = vi.fn();
    const cleanup = vi.fn();
    const scope = createRendererCleanup(controller.signal, onError);
    scope.add(() => {
      throw new Error('Cleanup failed');
    });
    scope.add(cleanup);
    scope.dispose();
    expect(onError).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it.each(['dispose', 'abort'] as const)('isolates a throwing error reporter during %s and late cleanup', (action) => {
    const controller = new AbortController();
    const cleanup = vi.fn();
    const late = vi.fn(() => {
      throw new Error('Late cleanup failed');
    });
    const onError = vi.fn(() => {
      throw new Error('Consumer reporter failed');
    });
    const scope = createRendererCleanup(controller.signal, onError);
    scope.add(() => {
      throw new Error('Cleanup failed');
    });
    scope.add(cleanup);
    expect(() => (action === 'abort' ? controller.abort() : scope.dispose())).not.toThrow();
    expect(() => scope.add(late)).not.toThrow();
    scope.dispose();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(late).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
