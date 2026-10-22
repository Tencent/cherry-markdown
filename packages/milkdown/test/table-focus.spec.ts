import { describe, expect, it } from 'vitest';
import { tableWordRange } from '../src/wysiwyg/table-focus';

describe('table text selection', () => {
  it('selects a numeric word without touching adjacent values', () => {
    expect(tableWordRange('1 2', 0)).toEqual({ from: 0, to: 1 });
    expect(tableWordRange('1 2', 2)).toEqual({ from: 2, to: 3 });
  });
  it('selects one word in a multiword label', () => {
    expect(tableWordRange('Sales revenue', 8)).toEqual({ from: 6, to: 13 });
  });
  it('does not select inline atom placeholders', () => {
    expect(tableWordRange('\ufffc value', 0)).toBeUndefined();
  });
});
