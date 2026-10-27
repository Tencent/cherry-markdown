/** Opaque references let existing Cherry hooks preserve their recognition order without serializing HTML. */
export interface SemanticRenderer {
  invalidateDocument(reason: string): void;
  wrap(kind: string, data: Record<string, unknown>, content: string): string;
  atom(kind: string, data: Record<string, unknown>): string;
  text(content: string): string;
  sourceHtml(source: string): string;
  isInLink(content: string, offset: number): boolean;
  headingId(base: string): string;
  protectUnclosed(source: string, begin: RegExp | string, complete: RegExp): void;
}
