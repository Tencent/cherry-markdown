import { Fragment, type Node as ProseMirrorNode } from '@milkdown/kit/prose/model';
import { Transform, type StepMap } from '@milkdown/kit/prose/transform';

/** Internal API-write boundary; unrelated non-history edits remain local. */
export const EXTERNAL_MARKDOWN_UPDATE = 'cherry-milkdown:external-markdown-update';

export function createEditableTail(document: ProseMirrorNode): ProseMirrorNode | undefined {
  const last = document.lastChild;
  if (!last || ['heading', 'paragraph'].includes(last.type.name)) return;
  return document.type.schema.nodes.paragraph?.create();
}

/** Parsed external values must have the same editor-only tail as the live document. */
export function withEditableTail(document: ProseMirrorNode): ProseMirrorNode {
  const tail = createEditableTail(document);
  return tail ? document.copy(document.content.append(Fragment.from(tail))) : document;
}

/** One structure-checked update, shared by ordinary writes and IME rebasing. */
export function createDocumentUpdate(before: ProseMirrorNode, next: ProseMirrorNode): Transform {
  const update = new Transform(before);
  const from = before.content.findDiffStart(next.content);
  if (from === null) return update;
  let { a: to, b: nextTo } = before.content.findDiffEnd(next.content) ?? {
    a: before.content.size,
    b: next.content.size,
  };
  // Repeated text can make the end diff cross the start diff.
  if (to < from && before.content.size < next.content.size) {
    nextTo = from + (nextTo - to);
    to = from;
  } else if (nextTo < from) {
    to = from + (to - nextTo);
    nextTo = from;
  }
  update.replace(from, to, next.slice(from, nextTo));
  // A minimal text diff may cross table cells. Accept it only when the fitted
  // slice produces the exact parsed structure, otherwise replace safely.
  return update.doc.eq(next) ? update : new Transform(before).replaceWith(0, before.content.size, next.content);
}

function changedRanges(map: StepMap, current = false) {
  const ranges: Array<{ from: number; to: number }> = [];
  map.forEach((from, to, nextFrom, nextTo) => ranges.push(current ? { from: nextFrom, to: nextTo } : { from, to }));
  return ranges;
}

function overlaps(local: StepMap, external: StepMap, committed?: ProseMirrorNode): boolean {
  return changedRanges(local, Boolean(committed)).some((a) =>
    changedRanges(external).some((b) => {
      if (a.from === a.to && b.from === b.to) return a.from === b.from;
      if (a.from === a.to) return b.from < a.from && a.from < b.to;
      if (b.from === b.to) {
        // Do not guess the ordering of text inserted at the composing caret.
        // Root-level inserts before an atom's owned source editor remain safe.
        if (committed?.resolve(b.from).parent.isTextblock) return a.from <= b.from && b.from <= a.to;
        return a.from < b.from && b.from < a.to;
      }
      return a.from < b.to && b.from < a.to;
    }),
  );
}

/**
 * Rebase a deferred external update over the native composition's changes.
 * ProseMirror owns offsets, fitting, caret mapping and history. This is not a
 * collaborative merge: ambiguous/overlapping replacements preserve local input.
 */
export function rebaseCompositionUpdate(
  requested: ProseMirrorNode,
  committed: ProseMirrorNode,
  next: ProseMirrorNode,
  started = requested,
): Transform | undefined {
  const protectedInput = createDocumentUpdate(started, committed).steps[0]?.getMap();
  const rebase = (base: ProseMirrorNode) => {
    const local = createDocumentUpdate(base, committed);
    const external = createDocumentUpdate(base, next);
    if (!external.steps.length) return new Transform(committed);
    if (local.steps.length && overlaps(local.steps[0]!.getMap(), external.steps[0]!.getMap())) return;
    const step = external.steps[0]!.map(local.mapping);
    if (!step || (protectedInput && overlaps(protectedInput, step.getMap(), committed))) return;
    const merged = new Transform(committed);
    return merged.maybeStep(step).failed ? undefined : merged;
  };
  // A late response can be based on the value before composition, even when
  // received in the commit frame. Prefer a current/preedit snapshot, then try
  // the composition-start snapshot; both paths reject conflicting ranges.
  return rebase(requested) ?? (requested.eq(started) ? undefined : rebase(started));
}
