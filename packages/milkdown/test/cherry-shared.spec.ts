import { describe, expect, it, vi } from 'vitest';
import { copyToClip, image, isValidScheme } from '../src/generated/cherry-helpers.js';
import { imageLayoutState, imageAltText, replaceImageAltText } from '../src/native-layout';
import { findCherryInlineMatches } from '../src/wysiwyg/transform';

describe('shared Cherry behavior', () => {
  it.each([
    'javascript:alert(1)',
    'j&#97;vascript:alert(1)',
    'java&#x73;cript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,test',
  ])('uses Cherry link policy for %s', (href) => {
    expect(isValidScheme(href)).toBe(false);
  });

  it.each(['https://example.com/a%20b', '/relative', '#anchor', 'mailto:me@example.com'])(
    'retains allowed Cherry links: %s',
    (href) => {
      expect(isValidScheme(href)).toBe(true);
    },
  );

  it('reads image state from Cherry helpers and preserves unrelated alt text', () => {
    const alt = 'dog#60%#auto#border#R#float-left';
    const classes = image.processExtendStyleInAlt(alt).extendClasses;
    expect(classes).toContain('cherry-img-deco-border');
    expect(imageLayoutState(alt)).toEqual({ alignment: 'float-left', border: true, shadow: false, radius: true });
    expect(imageAltText(alt)).toBe('dog');
    expect(replaceImageAltText(alt, 'cat')).toBe('cat#60%#auto#border#R#float-left');
  });

  it.each([
    ['x==literal==x', []],
    ['!!red color!!/literal/', ['cherry_color']],
    ['!!red color!!\\!!blue escaped!!', ['cherry_color']],
    ['x ==highlight== y', ['cherry_highlight']],
    ['\t/unchanged/\t', []],
    [' /underlined/ ', ['cherry_underline']],
    [' {中文|zhongwen} ', ['cherry_ruby']],
    ['\\!!red escaped!!', []],
    ['\\^escaped^', []],
    ['!!red !!!yellow nested!!!!!', ['cherry_color']],
  ] as const)('uses Cherry grammar boundaries: %s', (source, types) => {
    expect(findCherryInlineMatches(source).map(({ type }) => type)).toEqual(types);
  });

  it('uses Cherry clipboard fallback and removes its temporary copy listener', async () => {
    const clipboard = { write: vi.fn().mockRejectedValue(new Error('Permission denied')) };
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(_items: Record<string, Blob>) {}
      },
    );
    const command = vi.fn(() => true);
    const originalCommand = document.execCommand;
    document.execCommand = command;
    const remove = vi.spyOn(document, 'removeEventListener');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await copyToClip('link or code');
      expect(command).toHaveBeenCalledWith('copy');
      expect(remove).toHaveBeenCalledWith('copy', expect.any(Function));
      command.mockReturnValue(false);
      await expect(copyToClip('retry')).rejects.toThrow('Copy command was unsuccessful');
    } finally {
      remove.mockRestore();
      warn.mockRestore();
      document.execCommand = originalCommand;
      if (original) Object.defineProperty(navigator, 'clipboard', original);
      else Reflect.deleteProperty(navigator, 'clipboard');
      vi.unstubAllGlobals();
    }
  });
});

describe('Cherry grammar after Markdown decoding', () => {
  it('preserves escaped delimiters next to active syntax and entities', async () => {
    const { createTestEditor } = await import('./helpers/create-editor');
    const el = document.body.appendChild(document.createElement('div'));
    const instance = await createTestEditor({ el, value: '&amp; \\!!red escaped!! and !!blue active!!' });
    try {
      expect(el.querySelectorAll('[data-cherry-mark="cherry_color"]')).toHaveLength(1);
      expect(el.querySelector('[data-cherry-mark="cherry_color"]')?.textContent).toBe('active');
      expect(el.textContent).toContain('& !!red escaped!! and active');
    } finally {
      await instance.destroy();
      el.remove();
    }
  });
});
