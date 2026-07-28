import { describe, expect, it } from 'vitest';
import Size from '../../../src/core/hooks/Size';
import Underline from '../../../src/core/hooks/Underline';

describe('core/hooks inline typography', () => {
  it('renders one- and two-digit font sizes and rejects malformed syntax', () => {
    const hook = new Size({});

    expect(hook.makeHtml('!9 small! !24 large!')).toBe(
      '<span style="font-size:9px;line-height:1em;">small</span> <span style="font-size:24px;line-height:1em;">large</span>',
    );
    expect(hook.makeHtml('plain text')).toBe('plain text');
    expect(hook.makeHtml('!123 too-large!')).toBe('!123 too-large!');
    expect(hook.makeHtml('\\!24 escaped!')).toBe('\\!24 escaped!');
  });

  it('renders only whitespace-bounded underline syntax', () => {
    const hook = new Underline({});

    expect(hook.makeHtml('before /underlined/ after')).toBe(
      'before <span style="text-decoration: underline;">underlined</span> after',
    );
    expect(hook.makeHtml('/start/')).toBe('<span style="text-decoration: underline;">start</span>');
    expect(hook.makeHtml('word/kept/word')).toBe('word/kept/word');
    expect(hook.makeHtml('/line\nbreak/')).toBe('/line\nbreak/');
  });
});
