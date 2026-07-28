import { describe, expect, it, vi } from 'vitest';
import Emoji from '../../../src/core/hooks/Emoji';

interface EmojiConfig {
  useUnicode?: boolean;
  upperCase?: boolean;
  customResourceURL?: string;
  customRenderer?: (name: string) => string;
}

function createEmoji(config?: EmojiConfig) {
  return config === undefined ? new Emoji() : new Emoji({ config });
}

function setEmojiCode(hook: Emoji, name: string, code: string) {
  Object.defineProperty(hook.options.emojis, name, { value: code, configurable: true });
}

describe('core/hooks/Emoji', () => {
  it('keeps default values when option types are invalid', () => {
    const hook = Reflect.construct(Emoji, [
      {
        config: {
          useUnicode: 'false',
          upperCase: 1,
          customResourceURL: 42,
          customRenderer: 'renderer',
        },
      },
    ]);

    expect(hook.options.useUnicode).toBe(true);
    expect(hook.options.upperCase).toBe(false);
    expect(hook.options.customHandled).toBe(false);
    expect(hook.options.resourceURL).toContain('github.githubassets.com');
  });

  it('returns ordinary text unchanged without running replacements', () => {
    const hook = createEmoji();

    expect(hook.makeHtml('plain text')).toBe('plain text');
    expect(hook.makeHtml(':not closed')).toBe(':not closed');
  });

  it('renders BMP, astral, and multi-code-point emoji as Unicode', () => {
    const hook = createEmoji();

    expect(hook.makeHtml(':airplane:')).toBe('✈');
    expect(hook.makeHtml(':smile:')).toBe('😄');
    expect(hook.makeHtml(':afghanistan:')).toBe('🇦🇫');
    expect(hook.makeHtml(':asterisk:')).toBe('*⃣');
  });

  it('leaves unknown names and unsupported marker characters unchanged', () => {
    const hook = createEmoji();

    expect(hook.makeHtml(':not_a_cherry_emoji:')).toBe(':not_a_cherry_emoji:');
    expect(hook.makeHtml(':-1: :+1: :bad-name:')).toContain(':bad-name:');
  });

  it('renders lowercase image resources by default', () => {
    const hook = createEmoji({ useUnicode: false });
    const html = hook.makeHtml(':smile:');

    expect(html).toContain('class="emoji"');
    expect(html).toContain('/1f604.png?v8');
    expect(html).toContain('alt="smile"');
  });

  it('uses uppercase codes and replaces every custom URL placeholder', () => {
    const hook = createEmoji({
      useUnicode: false,
      upperCase: true,
      customResourceURL: '/emoji/${code}/copy-${code}.png',
    });

    expect(hook.makeHtml(':afghanistan:')).toContain('/emoji/1F1E6-1F1EB/copy-1F1E6-1F1EB.png');
  });

  it('ignores a custom resource URL while Unicode rendering is enabled', () => {
    const hook = createEmoji({ useUnicode: true, customResourceURL: '/unused/${code}.png' });

    expect(hook.options.resourceURL).toContain('github.githubassets.com');
    expect(hook.makeHtml(':smile:')).toBe('😄');
  });

  it('runs a custom renderer before checking whether an emoji name is known', () => {
    const customRenderer = vi.fn((name: string) => `<span data-emoji="${name}">${name}</span>`);
    const hook = createEmoji({ customRenderer });

    expect(hook.makeHtml(':custom_name:')).toBe('<span data-emoji="custom_name">custom_name</span>');
    expect(customRenderer).toHaveBeenCalledWith('custom_name');
  });

  it('flushes large multi-code-point sequences without truncating output', () => {
    const hook = createEmoji();
    const codePointCount = 0x3fff;
    setEmojiCode(hook, 'long_sequence', Array.from({ length: codePointCount }, () => '61').join('-'));

    expect(hook.makeHtml(':long_sequence:')).toBe('a'.repeat(codePointCount));
  });
});
