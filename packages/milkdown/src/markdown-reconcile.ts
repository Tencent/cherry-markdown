/** Compare canonical serialization without treating CRLF and LF as different lines. */
export function sameSerializedMarkdown(left: string, right: string): boolean {
  return left.replace(/\r\n/g, '\n').trimEnd() === right.replace(/\r\n/g, '\n').trimEnd();
}

/** Restore list markers and line endings only when the complete result parses to the recovered document. */
export function preserveRecoveredListSource(
  original: string,
  recovered: string,
  matchesDocument: (candidate: string) => boolean,
): string {
  const withoutPairs = original.replace(/\r\n/g, '');
  if (withoutPairs.includes('\r') || (original.includes('\r') && withoutPairs.includes('\n'))) return recovered;
  const oldLines = original.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  const newLines = recovered.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  if (oldLines.length !== newLines.length) return recovered;
  const lines = newLines.map((line, index) => {
    const originalMarker = oldLines[index]!.match(/^[ \t]*([*+-])(?=[ \t])/);
    return originalMarker ? line.replace(/^([ \t]*)[*+-](?=[ \t])/, `$1${originalMarker[1]}`) : line;
  });
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const suffix = original.match(/(?:\r\n|\n)*$/)![0];
  const candidate = lines.join(newline) + suffix;
  return candidate === recovered || matchesDocument(candidate) ? candidate : recovered;
}

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
  mapTextEdit?: (from: number, to: number) => number | undefined,
): string {
  if (previous === next) return raw;
  if (raw === previous) return next;

  // The serializer can add final newlines even when the source has none.
  // Appending or undoing a final block can otherwise fall back to the
  // canonical form and permanently introduce that newline. Restrict this to
  // an exact canonical-prefix change, and never collapse a change consisting
  // solely of terminal whitespace (which may be an intentional empty line).
  if (
    !raw.endsWith('\n') &&
    previous.startsWith(raw) &&
    /^\n+$/.test(previous.slice(raw.length)) &&
    next.endsWith('\n') &&
    (next.startsWith(previous) || previous.startsWith(next)) &&
    previous.trimEnd() !== next.trimEnd()
  ) {
    const candidate = next.replace(/\n+$/, '');
    if (matchesDocument(candidate)) return candidate;
  }

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
    // The serializer adds a terminal newline even when the source has none.
    // Try without that synthetic context, but still validate the whole result.
    const rightContexts = right === '\n' && !raw.endsWith('\n') ? [right, ''] : [right];
    for (const context of rightContexts) {
      const needle = `${left}${changedBefore}${context}`;
      if (!needle) continue;
      const index = raw.indexOf(needle);
      if (index < 0 || raw.indexOf(needle, index + 1) >= 0) continue;
      const candidate = propose(index, needle.length, `${left}${changedAfter}${context}`);
      if (candidate !== undefined) return candidate;
    }
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

  // Formatting differences can make both surrounding contexts unavailable,
  // especially when the same text appears in several blocks. Try bounded
  // candidates using the left context and accept only a unique full-document
  // match. Normalize uniform CRLF for searching, then restore it before
  // validation so untouched source spelling and line endings remain intact.
  const normalizedRaw = raw.replace(/\r\n/g, '\n');
  const uniformCRLF = raw.includes('\r\n') && !normalizedRaw.includes('\r') && !raw.replace(/\r\n/g, '').includes('\n');
  if (!raw.includes('\r') || uniformCRLF) {
    // Full-document parsing dominates the cost. Bound both candidate count
    // and the total input size sent to the validator on each edit.
    const limit = Math.min(16, Math.max(1, Math.floor(16_384 / Math.max(1, normalizedRaw.length))));
    let checked = 0;
    let mappingAttempted = false;
    for (const length of [32, 16, 8, 4, 2, 1]) {
      const left = previous.slice(Math.max(0, from - length), from);
      if (!left) continue;
      const needle = left + changedBefore;
      const positions: number[] = [];
      for (let index = normalizedRaw.indexOf(needle); index >= 0; index = normalizedRaw.indexOf(needle, index + 1)) {
        positions.push(index + left.length);
        if (positions.length > limit) break;
      }
      if (!positions.length) continue;
      if (positions.length > limit) {
        if (!mappingAttempted && mapTextEdit && !/[\r\n]/.test(changedBefore + changedAfter)) {
          mappingAttempted = true;
          const offset = mapTextEdit(from, previousTo);
          if (offset !== undefined && raw.slice(offset, offset + changedBefore.length) === changedBefore) {
            const candidate = propose(offset, changedBefore.length, changedAfter);
            if (candidate !== undefined) return candidate;
          }
        }
        continue;
      }
      let match: string | undefined;
      let ambiguous = false;
      for (const index of positions) {
        const normalizedCandidate =
          normalizedRaw.slice(0, index) + changedAfter + normalizedRaw.slice(index + changedBefore.length);
        const candidate = uniformCRLF ? normalizedCandidate.replace(/\n/g, '\r\n') : normalizedCandidate;
        if (tried.has(candidate)) continue;
        if (checked === limit) return next;
        checked += 1;
        tried.add(candidate);
        if (!matchesDocument(candidate)) continue;
        if (match !== undefined && match !== candidate) {
          ambiguous = true;
          break;
        }
        match = candidate;
      }
      if (match !== undefined && !ambiguous) return match;
      if (ambiguous) break;
    }
  }
  // Canonical serialization is safer than guessing an ambiguous source range.
  return next;
}
