import type { CherryMilkdownErrorContext } from './types.js';

/** A cached snapshot does not retain the editor or its previous document. */
export function cachedRecoveryContext(markdown: string): CherryMilkdownErrorContext {
  return { getPreviousMarkdown: () => markdown };
}

/** Release the document reader as soon as its snapshot has been recovered. */
export function lazyRecoveryContext(
  reader: (() => string) | undefined,
  isDestroyed: () => boolean,
): CherryMilkdownErrorContext {
  let snapshot: string | undefined;
  return {
    getPreviousMarkdown() {
      if (snapshot !== undefined) return snapshot;
      if (isDestroyed()) throw new Error('Cannot read recovery content after the editor is destroyed.');
      snapshot = reader!();
      reader = undefined;
      return snapshot;
    },
  };
}
