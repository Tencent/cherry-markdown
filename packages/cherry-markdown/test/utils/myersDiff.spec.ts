import { describe, expect, it } from 'vitest';
import MyersDiff from '@/utils/myersDiff';

describe('utils/myersDiff edge cases', () => {
  it('treats values without a length as empty sequences', () => {
    expect(new MyersDiff({}, {}).doDiff()).toEqual([]);
  });

  it('keeps preceding deletes and merges the final delete with an insertion', () => {
    expect(new MyersDiff('ax', 'abcd').doDiff()).toEqual([
      { type: 'delete', oldIndex: 1, newIndex: 0 },
      { type: 'delete', oldIndex: 2, newIndex: 0 },
      { type: 'update', oldIndex: 3, newIndex: 1 },
    ]);
  });
});
