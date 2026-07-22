import { describe, expect, it } from 'vitest';
import BackgroundColor from '../../../src/core/hooks/BackgroundColor';
import Color from '../../../src/core/hooks/Color';
import Size from '../../../src/core/hooks/Size';
import Sub from '../../../src/core/hooks/Sub';
import Sup from '../../../src/core/hooks/Sup';
import Underline from '../../../src/core/hooks/Underline';

describe('core/hooks inline typography', () => {
  it('renders font and background colors while preserving escaped syntax', () => {
    const color = new Color({});
    const background = new BackgroundColor({});

    expect(color.makeHtml('!!#ff0000 red!! and !!blue named!!')).toBe(
      '<span style="color:#ff0000">red</span> and <span style="color:blue">named</span>',
    );
    expect(background.makeHtml('!!!#00ff00 green!!! and !!!yellow named!!!')).toBe(
      '<span style="background-color:#00ff00">green</span> and <span style="background-color:yellow">named</span>',
    );
    expect(color.makeHtml('\\!!red escaped!!')).toBe('\\!!red escaped!!');
    expect(background.makeHtml('\\!!!red escaped!!!')).toBe('\\!!!red escaped!!!');
    expect(color.makeHtml(background.makeHtml('\\!!!blue escaped!!!'))).toBe('\\!!!blue escaped!!!');
  });

  it('renders one- and two-digit font sizes and rejects malformed syntax', () => {
    const hook = new Size({});

    expect(hook.makeHtml('!9 small! !24 large!')).toBe(
      '<span style="font-size:9px;line-height:1em;">small</span> <span style="font-size:24px;line-height:1em;">large</span>',
    );
    expect(hook.makeHtml('plain text')).toBe('plain text');
    expect(hook.makeHtml('!123 too-large!')).toBe('!123 too-large!');
    expect(hook.makeHtml('\\!24 escaped!')).toBe('\\!24 escaped!');
  });

  it('renders superscript and subscript without consuming escaped markers', () => {
    const sup = new Sup({});
    const sub = new Sub({});

    expect(sup.makeHtml('x^2^')).toBe('x<sup>2</sup>');
    expect(sub.makeHtml('H^^2^^O')).toBe('H<sub>2</sub>O');
    expect(sup.makeHtml('\\^kept^')).toBe('\\^kept^');
    expect(sup.makeHtml('^ leading^')).toBe('^ leading^');
    expect(sub.makeHtml('\\^^kept^^')).toBe('\\^^kept^^');
    expect(sup.makeHtml(sub.makeHtml('\\^^kept^^'))).toBe('\\^^kept^^');
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
