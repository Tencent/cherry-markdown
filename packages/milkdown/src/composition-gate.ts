/** Schedule/coalesce external writes; document reconciliation remains editor-owned. */
export function createCompositionGate<T = undefined>(surface: HTMLElement, capture?: () => T) {
  let composing = false;
  let frame: number | undefined;
  let pending: (() => void) | undefined;
  let snapshot: T | undefined;
  const start = () => {
    if (snapshot === undefined) snapshot = capture?.();
    composing = true;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  };
  const end = () => {
    composing = false;
    // Commit after the browser's final input and ProseMirror's DOM observer.
    frame = requestAnimationFrame(() => {
      frame = undefined;
      const update = pending;
      pending = undefined;
      try {
        update?.();
      } finally {
        snapshot = undefined;
      }
    });
  };
  surface.addEventListener('compositionstart', start, true);
  surface.addEventListener('compositionend', end, true);
  return {
    get active() {
      return composing || frame !== undefined;
    },
    get snapshot() {
      return snapshot;
    },
    run(update: () => void) {
      if (composing || frame !== undefined) pending = update;
      else update?.();
    },
    destroy() {
      surface.removeEventListener('compositionstart', start, true);
      surface.removeEventListener('compositionend', end, true);
      if (frame !== undefined) cancelAnimationFrame(frame);
      pending = undefined;
      snapshot = undefined;
      frame = undefined;
      composing = false;
    },
  };
}
