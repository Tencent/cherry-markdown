import { describe, expect, test } from 'vitest';
import { calculateTextReplacement } from '../src/textEdit';

describe('calculateTextReplacement', () => {
  test('does not edit identical text', () => {
    expect(calculateTextReplacement('same', 'same')).toBeUndefined();
  });

  test.each([
    ['abc', 'abXc', { startOffset: 2, endOffset: 2, text: 'X' }],
    ['abc', 'ac', { startOffset: 1, endOffset: 2, text: '' }],
    ['abc', 'aXc', { startOffset: 1, endOffset: 2, text: 'X' }],
    ['', '# title', { startOffset: 0, endOffset: 0, text: '# title' }],
    ['old', '', { startOffset: 0, endOffset: 3, text: '' }],
    ['a\r\nb', 'a\r\n中文b', { startOffset: 3, endOffset: 3, text: '中文' }],
    ['a😀b', 'a😃b', { startOffset: 2, endOffset: 3, text: '\ude03' }],
  ])('calculates a minimal replacement for %s', (current, next, expected) => {
    expect(calculateTextReplacement(current, next)).toEqual(expected);
  });
});
