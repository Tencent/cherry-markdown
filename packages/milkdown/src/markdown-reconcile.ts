/**
 * Retain untouched source formatting only when the proposed edit parses to
 * the actual editor document. Serialization can reorder footnotes or normalize
 * list markers, so neither a unique substring nor its ordinal proves identity.
 */
export function reconcileSerializedMarkdown(
  raw: string,
  previous: string,
  next: string,
  matchesDocument: (markdown: string) => boolean,
): string {
  if (previous === next) return raw;
  if (raw === previous) return next;

  let from = 0;
  const sharedLength = Math.min(previous.length, next.length);
  while (from < sharedLength && previous[from] === next[from]) from += 1;
  let suffix = 0;
  while (
    suffix < previous.length - from &&
    suffix < next.length - from &&
    previous[previous.length - suffix - 1] === next[next.length - suffix - 1]
  ) {
    suffix += 1;
  }

  const previousTo = previous.length - suffix;
  const changedBefore = previous.slice(from, previousTo);
  const changedAfter = next.slice(from, next.length - suffix);
  const tried = new Set<string>();
  const propose = (index: number, length: number, replacement: string) => {
    const candidate = `${raw.slice(0, index)}${replacement}${raw.slice(index + length)}`;
    if (tried.has(candidate)) return undefined;
    tried.add(candidate);
    return matchesDocument(candidate) ? candidate : undefined;
  };

  for (const contextLength of [128, 96, 64, 48, 32, 24, 16, 8, 4, 2, 1]) {
    const left = previous.slice(Math.max(0, from - contextLength), from);
    const right = previous.slice(previousTo, previousTo + contextLength);
    const needle = `${left}${changedBefore}${right}`;
    if (!needle) continue;
    const index = raw.indexOf(needle);
    if (index < 0 || raw.indexOf(needle, index + 1) >= 0) continue;
    const candidate = propose(index, needle.length, `${left}${changedAfter}${right}`);
    if (candidate !== undefined) return candidate;
  }

  if (changedBefore) {
    // This proposal preserves e.g. `*` list markers for repeated list items.
    // A reordered definition can invalidate the ordinal; validation below
    // rejects that edit instead of silently modifying the wrong source block.
    let occurrence = 0;
    let cursor = 0;
    while (cursor < from) {
      const found = previous.indexOf(changedBefore, cursor);
      if (found < 0 || found >= from) break;
      occurrence += 1;
      cursor = found + changedBefore.length;
    }
    let rawIndex = -1;
    cursor = 0;
    for (let index = 0; index <= occurrence; index += 1) {
      rawIndex = raw.indexOf(changedBefore, cursor);
      if (rawIndex < 0) break;
      cursor = rawIndex + changedBefore.length;
    }
    if (rawIndex >= 0) {
      const candidate = propose(rawIndex, changedBefore.length, changedAfter);
      if (candidate !== undefined) return candidate;
    }
  }
  // Canonical serialization is safer than guessing an ambiguous source range.
  return next;
}
