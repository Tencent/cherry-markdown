/**
 * Line-level diff helper built on top of MyersDiff.
 *
 * Given a "current" text and a "version" text, returns an ordered list of
 * segments annotated with type (equal / insert / delete / update) that can be
 * directly rendered as a colored diff view.
 *
 * Semantics:
 *   - insert: appears in the version but not in the current file (i.e. the
 *     version was created with these lines, but the current file no longer has
 *     them). In UI they are shown in green with a leading "+".
 *   - delete: appears in the current file but not in the version (i.e. lines
 *     that have been added since the version was captured). Shown in red with
 *     a leading "-".
 *   - update: a delete adjacent to an insert; rendered as two rows
 *     (a "-" row followed by a "+" row) to make the change readable.
 *   - equal: unchanged lines. Rendered in muted color with a leading " ".
 */
import MyersDiff, { type DiffChange } from './myersDiff';

export type DiffSegmentType = 'equal' | 'insert' | 'delete';

export interface DiffLine {
  type: DiffSegmentType;
  text: string;
}

/**
 * Diff two texts line by line.
 *
 * @param currentText content read from disk (the "old" side of the diff — the
 *                    baseline we compare the version against)
 * @param versionText content of the version being previewed (the "new" side)
 * @returns array of line-level diff entries, in display order
 */
export function diffLines(currentText: string, versionText: string): DiffLine[] {
  const oldLines = currentText.split('\n'); // current file (old side)
  const newLines = versionText.split('\n'); // version (new side)

  const changes: DiffChange[] = new MyersDiff<string>(newLines, oldLines).doDiff();

  // Walk the change list; MyersDiff returns operations sufficient to transform
  // oldObj into newObj. We interleave them with the untouched lines from
  // oldLines to produce a full line-by-line rendering.
  const result: DiffLine[] = [];
  let oldCursor = 0; // position in oldLines
  let newCursor = 0; // position in newLines

  const emitEqualUntil = (targetOldIndex: number): void => {
    while (oldCursor < targetOldIndex && oldCursor < oldLines.length) {
      result.push({ type: 'equal', text: oldLines[oldCursor] });
      oldCursor += 1;
      newCursor += 1;
    }
  };

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    // First fast-forward through unchanged lines up to this change point.
    emitEqualUntil(change.oldIndex);

    if (change.type === 'delete') {
      // A line existed in old (current file) but not in new (version).
      // In our UI language: "-" (removed compared to the version).
      result.push({ type: 'delete', text: oldLines[change.oldIndex] ?? '' });
      oldCursor += 1;
    } else if (change.type === 'insert') {
      // A line exists in new (version) but not in old (current file).
      // "+" row (version has it, current file doesn't).
      const inserted = newLines[change.newIndex] ?? '';
      result.push({ type: 'insert', text: inserted });
      newCursor += 1;
    } else if (change.type === 'update') {
      // Update = consecutive delete + insert. Render as a delete row followed
      // by an insert row so both sides are visible.
      result.push({ type: 'delete', text: oldLines[change.oldIndex] ?? '' });
      result.push({ type: 'insert', text: newLines[change.newIndex] ?? '' });
      oldCursor += 1;
      newCursor += 1;
    }
  }

  // Drain remaining trailing equal lines.
  while (oldCursor < oldLines.length) {
    result.push({ type: 'equal', text: oldLines[oldCursor] });
    oldCursor += 1;
    newCursor += 1;
  }

  return result;
}

/** Summarise how many lines were added / removed / unchanged. */
export function summarizeDiff(diff: DiffLine[]): { added: number; removed: number; equal: number } {
  let added = 0;
  let removed = 0;
  let equal = 0;
  for (const line of diff) {
    if (line.type === 'insert') added += 1;
    else if (line.type === 'delete') removed += 1;
    else equal += 1;
  }
  return { added, removed, equal };
}
