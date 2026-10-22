/** Error notifications must never interrupt another renderer's teardown. */
export function reportRendererError(error: unknown, onError?: (error: unknown) => void) {
  try {
    onError?.(error);
  } catch {
    // A consumer's error reporter is not part of the resource lifecycle.
  }
}

/** Owns all renderer results, including results arriving after abort/failure. */
export function createRendererCleanup(signal: AbortSignal, onError?: (error: unknown) => void) {
  const pending: Array<() => void> = [];
  let disposed = signal.aborted;
  const release = (cleanup: () => void) => {
    try {
      cleanup();
    } catch (error) {
      reportRendererError(error, onError);
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener('abort', dispose);
    const cleanups = pending.splice(0);
    cleanups.forEach(release);
  };
  if (!disposed) signal.addEventListener('abort', dispose, { once: true });

  return {
    add(cleanup: () => void) {
      if (disposed) release(cleanup);
      else pending.push(cleanup);
    },
    dispose,
  };
}
