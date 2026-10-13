import { describe, expect, it, vi } from 'vitest';
import { reconcileSerializedMarkdown } from '../src/markdown-reconcile';

describe('source reconciliation', () => {
  it('rejects a unique textual match when it refers to a different document block', () => {
    const matchesDocument = vi.fn(() => false);
    expect(
      reconcileSerializedMarkdown('raw repeated', 'normalized repeated', 'normalized changed', matchesDocument),
    ).toBe('normalized changed');
    expect(matchesDocument).toHaveBeenCalledWith('raw changed');
  });

  it('does not reparse unchanged source or already canonical source', () => {
    const matchesDocument = vi.fn();
    expect(reconcileSerializedMarkdown('Original', 'Canonical', 'Canonical', matchesDocument)).toBe('Original');
    expect(reconcileSerializedMarkdown('Canonical', 'Canonical', 'Changed', matchesDocument)).toBe('Changed');
    expect(matchesDocument).not.toHaveBeenCalled();
  });
});
