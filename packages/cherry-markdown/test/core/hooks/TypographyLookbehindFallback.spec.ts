import { describe, expect, it, vi } from 'vite-plus/test';
import BackgroundColor from '../../../src/core/hooks/BackgroundColor';
import Color from '../../../src/core/hooks/Color';
import Size from '../../../src/core/hooks/Size';
import Sub from '../../../src/core/hooks/Sub';
import Sup from '../../../src/core/hooks/Sup';

vi.mock('../../../src/utils/regexp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/regexp')>();
  return { ...actual, isLookbehindSupported: () => false };
});

describe('core/hooks typography lookbehind fallback', () => {
  it('renders colors and sizes without native lookbehind support', () => {
    const color = new Color({});
    const background = new BackgroundColor({});
    const size = new Size({});

    expect(color.makeHtml('x!!red text!!')).toBe('x<span style="color:red">text</span>');
    expect(background.makeHtml('x!!!blue text!!!')).toBe('x<span style="background-color:blue">text</span>');
    expect(size.makeHtml('x!18 text!')).toBe('x<span style="font-size:18px;line-height:1em;">text</span>');
  });

  it('renders script syntax and preserves escaped fallback markers', () => {
    const sup = new Sup({});
    const sub = new Sub({});

    expect(sup.makeHtml('x^up^')).toBe('x<sup>up</sup>');
    expect(sub.makeHtml('x^^down^^')).toBe('x<sub>down</sub>');
    expect(sup.makeHtml('\\^kept^')).toBe('\\^kept^');
    expect(sub.makeHtml('\\^^kept^^')).toBe('\\^^kept^^');
  });
});
