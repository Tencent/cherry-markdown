import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import debounce from '@/utils/toolkit/debounce';

describe('utils/toolkit/debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('延迟内多次调用只执行最后一次', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 400);
    debounced(1);
    debounced(2);
    debounced(3);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('cancel 阻止 pending 执行', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 400);
    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(400);
    expect(fn).not.toHaveBeenCalled();
  });
});
