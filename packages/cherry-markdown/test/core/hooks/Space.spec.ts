import { describe, expect, it } from 'vite-plus/test';
import Space from '../../../src/core/hooks/Space';

describe('core/hooks/Space', () => {
  it('converts each character in consecutive whitespace to a non-breaking space', () => {
    const hook = new Space({});

    expect(hook.makeHtml('left  right')).toBe('left&nbsp;&nbsp;right');
    expect(hook.makeHtml('left \t right')).toBe('left&nbsp;&nbsp;&nbsp;right');
  });

  it('leaves isolated whitespace unchanged', () => {
    const hook = new Space({});

    expect(hook.makeHtml('left right')).toBe('left right');
  });
});
