import { describe, expect, it, vi } from 'vite-plus/test';
import { preserveRecoveredListSource, reconcileSerializedMarkdown, sameSerializedMarkdown } from '../src/markdown-reconcile';

describe('source reconciliation', () => {
  it('finds the unique valid insertion among repeated text without normalizing unrelated source', () => {
    const raw = 'Title\r\n=====\r\n\r\n* Same\r\n* Same\r\n\r\n__Same__\r\n';
    const previous = '# Title\n\n- Same\n- Same\n\n**Same**\n';
    const next = '# Title\n\n- Same\n- Same!\n\n**Same**\n';
    const expected = 'Title\r\n=====\r\n\r\n* Same\r\n* Same!\r\n\r\n__Same__\r\n';
    expect(reconcileSerializedMarkdown(raw, previous, next, (candidate) => candidate === expected)).toBe(expected);
  });

  it('does not choose arbitrarily when several proposed insertions validate', () => {
    const raw = 'X one\nX one\n';
    const previous = 'Y one\nY one\n';
    const next = 'Y one\nY one!\n';
    expect(reconcileSerializedMarkdown(raw, previous, next, (candidate) => candidate.includes('one!'))).toBe(next);
  });

  it('bounds full-document validation for repeated candidates', () => {
    const raw = 'Title\n=====\n\n' + Array.from({ length: 15 }, () => '* Same').join('\n');
    const previous = '# Title\n\n' + Array.from({ length: 15 }, () => '- Same').join('\n');
    const next = previous.slice(0, -1) + '!e';
    const validate = vi.fn(() => false);
    expect(reconcileSerializedMarkdown(raw, previous, next, validate)).toBe(next);
    expect(validate.mock.calls.length).toBeLessThanOrEqual(27);
  });

  it('rejects a mapped location when the complete document does not match', () => {
    const raw = 'Title\n=====\n\n' + Array.from({ length: 17 }, () => '* Same').join('\n');
    const previous = '# Title\n\n' + Array.from({ length: 17 }, () => '- Same').join('\n');
    const next = previous + '!';
    const map = vi.fn(() => raw.indexOf('Same') + 4);
    const validate = vi.fn(() => false);
    expect(reconcileSerializedMarkdown(raw, previous, next, validate, map)).toBe(next);
    expect(map).toHaveBeenCalledOnce();
    expect(validate).toHaveBeenCalledWith(raw.replace('Same', 'Same!'));
  });

  it.each([3_200, 20_000])('falls back when a %i-character document exceeds its validation budget', (size) => {
    const suffix = '\n\n' + 'x'.repeat(size);
    const raw = 'Title\n=====\n\n' + Array.from({ length: 15 }, () => '* Same').join('\n') + suffix;
    const previous = '# Title\n\n' + Array.from({ length: 15 }, () => '- Same').join('\n') + suffix;
    const marker = previous.lastIndexOf('Same');
    const next = previous.slice(0, marker + 4) + '!' + previous.slice(marker + 4);
    const validate = vi.fn(() => false);
    expect(reconcileSerializedMarkdown(raw, previous, next, validate)).toBe(next);
    expect(validate.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('restores recovered list formatting only when the whole candidate is valid', () => {
    expect(preserveRecoveredListSource('* Item\r\n\r\n', '- Item!\n', (text) => text === '* Item!\r\n\r\n')).toBe(
      '* Item!\r\n\r\n',
    );
    expect(preserveRecoveredListSource('* Item\n', '- Item!\n', () => false)).toBe('- Item!\n');
    expect(preserveRecoveredListSource('* Item\r\nNext\n', '- Item!\nNext\n', () => true)).toBe('- Item!\nNext\n');
    expect(preserveRecoveredListSource('* Item\n', '- Item!\n\nExtra\n', () => true)).toBe('- Item!\n\nExtra\n');
  });
  it('compares CRLF and LF without ignoring internal content or lone carriage returns', () => {
    expect(sameSerializedMarkdown('A\r\n\r\nB\r\n', 'A\n\nB\n')).toBe(true);
    expect(sameSerializedMarkdown('A\r\nB', 'A\nC')).toBe(false);
    expect(sameSerializedMarkdown('A\rB', 'A\nB')).toBe(false);
  });
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

  it('preserves a missing final newline when editing at the end of the document', () => {
    const matchesDocument = vi.fn((markdown: string) => markdown === 'Initial text edited');
    expect(
      reconcileSerializedMarkdown('Initial text', 'Initial text\n', 'Initial text edited\n', matchesDocument),
    ).toBe('Initial text edited');
    expect(reconcileSerializedMarkdown('Initial text', 'Initial text\n', 'Initial text edited\n', () => false)).toBe(
      'Initial text edited\n',
    );
    expect(
      reconcileSerializedMarkdown(
        'Initial text edited',
        'Initial text edited\n',
        'Initial text\n',
        (markdown) => markdown === 'Initial text',
      ),
    ).toBe('Initial text');
  });

  it('preserves a missing final newline when appending and undoing a final block', () => {
    const raw = 'Before\n\nAfter';
    const before = `${raw}\n`;
    const after = `${before}\n| A |\n| - |\n| 1 |\n\n`;
    const appended = after.replace(/\n+$/, '');
    expect(reconcileSerializedMarkdown(raw, before, after, (candidate) => candidate === appended)).toBe(appended);
    expect(reconcileSerializedMarkdown(appended, after, before, (candidate) => candidate === raw)).toBe(raw);
    expect(reconcileSerializedMarkdown(raw, before, after, () => false)).toBe(after);
  });

  it('does not discard an intentional trailing empty line', () => {
    const matchesDocument = vi.fn(() => true);
    expect(reconcileSerializedMarkdown('Text', 'Text\n', 'Text\n\n', matchesDocument)).toBe('Text\n\n');
  });
});
