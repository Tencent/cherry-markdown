import { describe, expect, it } from 'vitest';
import Strikethrough from '../../../src/core/hooks/Strikethrough';

describe('core/hooks/Strikethrough', () => {
  it('renders ordinary strikethrough syntax and preserves escaped markers', () => {
    const hook = new Strikethrough();

    expect(hook.makeHtml('before ~T~Tremoved~T~T after')).toBe('before <del>removed</del> after');
    expect(hook.makeHtml('\\~T~Tkept~T~T')).toBe('\\~T~Tkept~T~T');
    expect(hook.makeHtml('plain text')).toBe('plain text');
  });

  it('requires whitespace around markers when configured', () => {
    const hook = new Strikethrough({ config: { needWhitespace: true } });

    expect(hook.needWhitespace).toBe(true);
    expect(hook.makeHtml('before ~T~Tremoved~T~T after')).toBe('before <del>removed</del> after');
    expect(hook.makeHtml('before~T~Tkept~T~Tafter')).toBe('before~T~Tkept~T~Tafter');
  });
});
