import { describe, expect, it, vi } from 'vitest';
import Size from '../../../src/toolbars/hooks/Size';
import { createMenuContext } from '../../helpers/menu';

function createSize(doc = 'text') {
  const context = createMenuContext(doc);
  return { context, size: new Size(context.cherry as never) };
}

describe('toolbars/hooks Size', () => {
  it('exposes all size submenu and shortcut mappings', () => {
    const { size } = createSize();

    expect(size.getSubMenuConfig()).toHaveLength(4);
    expect(size.shortKeyMap).toEqual({
      'Alt-Digit1': '12',
      'Alt-Digit2': '17',
      'Alt-Digit3': '24',
      'Alt-Digit4': '32',
    });
    expect(size._getFlagStr('Alt-Digit3')).toBe('###');
    expect(size._getFlagStr('')).toBe('#');
    expect(size.$testIsSize('!24 text!')).toBe(true);
    expect(size.$testIsSize('text')).toBe(false);
    expect(size.$getSizeByShortKey('24')).toBe('24');
    expect(size.$getSizeByShortKey('Alt-Digit2')).toBe('17');
    expect(size.$getSizeByShortKey('unknown')).toBe('17');
  });

  it('adds each supported size around plain Markdown text', () => {
    for (const [shortcut, expected] of [
      ['Alt-Digit1', '!12 text!'],
      ['Alt-Digit2', '!17 text!'],
      ['Alt-Digit3', '!24 text!'],
      ['Alt-Digit4', '!32 text!'],
    ]) {
      const { size } = createSize();
      expect(size.onClick('text', shortcut)).toBe(expected);
      expect(size.afterClickCb).toBeTypeOf('function');
    }
  });

  it('removes matching size syntax and changes non-matching size syntax', () => {
    const matching = createSize('!24 text!').size;
    expect(matching.onClick('!24 text!', 'Alt-Digit3')).toBe('text');

    const changed = createSize('!12 text!').size;
    expect(changed.onClick('!12 text!', 'Alt-Digit3')).toBe('!24 text!');
    expect(changed.afterClickCb).toBeTypeOf('function');
  });

  it('handles multiline sizes and default content for an empty document', () => {
    const multiline = createSize('!12 first!\n!12 second!').size;
    expect(multiline.onClick('!12 first!\n!12 second!', 'Alt-Digit4')).toBe('!32 first!\n!32 second!');

    const empty = createSize('').size;
    expect(empty.onClick('', 'unknown')).toBe('!17 字号!');
  });

  it('registers cleanup selection callbacks for inserted or changed sizes', () => {
    const { size } = createSize();
    const cleanup = vi.fn();
    size.setLessSelection = cleanup;
    size.onClick('text', 'Alt-Digit3');
    size.$afterClick();

    expect(cleanup).toHaveBeenCalledWith('!24 ', '!');
  });
});
