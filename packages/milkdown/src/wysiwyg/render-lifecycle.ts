import { createRendererCleanup } from './renderer-cleanup.js';
import type { CherryVisualRendererResult } from './types.js';

interface RenderResultOptions {
  retain?: boolean | ((result: CherryVisualRendererResult) => boolean);
  prepare?(result: CherryVisualRendererResult): void;
  commit(): void;
  failure(error: unknown): void;
}

interface RenderScope {
  controller: AbortController;
  cleanup: ReturnType<typeof createRendererCleanup>;
}

/** One pending revision and one committed preview, independent of NodeView DOM. */
export function createRenderLifecycle(onError?: (error: unknown) => void, isOwnerDestroyed?: () => boolean) {
  let pending: RenderScope | undefined;
  let active: RenderScope | undefined;
  let destroyed = false;
  let generation = 0;
  const release = (scope: RenderScope | undefined) => {
    if (!scope) return;
    try {
      scope.controller.abort();
    } finally {
      scope.cleanup.dispose();
    }
  };
  const clear = () => {
    generation += 1;
    const previousPending = pending;
    const previousActive = active;
    pending = undefined;
    active = undefined;
    release(previousPending);
    release(previousActive);
  };

  return {
    get hasActive() {
      return Boolean(active);
    },
    begin() {
      const version = ++generation;
      const previousPending = pending;
      pending = undefined;
      release(previousPending);
      const controller = new AbortController();
      const scope: RenderScope = { controller, cleanup: createRendererCleanup(controller.signal, onError) };
      if (destroyed || isOwnerDestroyed?.() || version !== generation) release(scope);
      else pending = scope;
      const current = () => !destroyed && !isOwnerDestroyed?.() && pending === scope && !controller.signal.aborted;
      const revision = {
        signal: controller.signal,
        current,
        addCleanup: scope.cleanup.add,
        /** DOM ownership stays with the caller; retain only resources needing teardown. */
        commit(apply: () => void, retain = true) {
          if (!current()) return false;
          const previousActive = active;
          active = undefined;
          release(previousActive);
          // Cleanup belongs to consumer code and can start a newer revision or
          // destroy the editor synchronously. Never commit the superseded one.
          if (!current()) return false;
          apply();
          if (!current()) return false;
          pending = undefined;
          if (retain) active = scope;
          else release(scope);
          return true;
        },
        /** A failed pending render never releases the last committed preview. */
        fail() {
          if (!current()) return false;
          pending = undefined;
          release(scope);
          // Abort handlers and cleanup can synchronously start a newer render
          // or destroy the owner. Its failure must not overwrite that state.
          return !destroyed && !isOwnerDestroyed?.() && version === generation;
        },
        settle(result: CherryVisualRendererResult | Promise<CherryVisualRendererResult>, options: RenderResultOptions) {
          return Promise.resolve(result)
            .then((value) => {
              if (typeof value === 'function') scope.cleanup.add(value);
              if (!current()) return;
              options.prepare?.(value);
              const retain = typeof options.retain === 'function' ? options.retain(value) : options.retain;
              revision.commit(options.commit, retain ?? true);
            })
            .catch((error: unknown) => {
              if (revision.fail()) options.failure(error);
            });
        },
      };
      return revision;
    },
    clear,
    destroy() {
      destroyed = true;
      try {
        clear();
      } finally {
        // Existing scopes own the reporter needed for late cleanup. The
        // destroyed lifecycle itself no longer needs to retain it.
        onError = undefined;
      }
    },
  };
}

export type RenderRevision = ReturnType<ReturnType<typeof createRenderLifecycle>['begin']>;
