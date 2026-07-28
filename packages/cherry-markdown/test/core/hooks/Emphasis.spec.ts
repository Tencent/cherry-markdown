import { describe, expect, it, vi } from 'vitest';
import Emphasis from '../../../src/core/hooks/Emphasis';

const sentenceMake = vi.fn((markdown: string) => ({ html: `<span>${markdown}</span>`, sign: markdown }));

function createEmphasis(allowWhitespace?: boolean) {
  return allowWhitespace === undefined ? new Emphasis() : new Emphasis({ config: { allowWhitespace } });
}

describe('core/hooks/Emphasis', () => {
  it('constructs with defaults and reports matching flavors', () => {
    const hook = createEmphasis();

    expect(hook.allowWhitespace).toBeUndefined();
    expect(hook.test('*text*', 'asterisk')).toBe(true);
    expect(hook.test('_text_', 'underscore')).toBe(true);
    expect(hook.test('plain', 'asterisk')).toBe(false);
  });

  it.each([
    ['*one*', '<em><span>one</span></em>'],
    ['**two**', '<strong><span>two</span></strong>'],
    ['***three***', '<strong><em><span>three</span></em></strong>'],
    ['****four****', '<strong><strong><span>four</span></strong></strong>'],
    ['*****five*****', '<strong><strong><em><span>five</span></em></strong></strong>'],
  ])('renders asterisk marker depth in %s', (markdown, expected) => {
    const hook = createEmphasis(false);

    expect(hook.makeHtml(markdown, sentenceMake)).toBe(expected);
  });

  it.each([
    ['_one_', '<em><span>one</span></em>'],
    ['__two__', '<strong><span>two</span></strong>'],
    ['___three___', '<strong><em><span>three</span></em></strong>'],
    ['____four____', '<strong><strong><span>four</span></strong></strong>'],
  ])('renders underscore marker depth in %s', (markdown, expected) => {
    const hook = createEmphasis(false);

    expect(hook.makeHtml(markdown, sentenceMake)).toBe(expected);
  });

  it('adds right padding only to odd asterisk emphasis ending in Chinese', () => {
    const hook = createEmphasis(false);

    expect(hook.makeHtml('*中文*', sentenceMake)).toContain('<em class="cherry-right-padding">');
    expect(hook.makeHtml('**中文**', sentenceMake)).not.toContain('cherry-right-padding');
    expect(hook.makeHtml('*text*', sentenceMake)).not.toContain('cherry-right-padding');
  });

  it('preserves underscores emitted by nested sentence rendering', () => {
    const hook = createEmphasis(false);
    const nested = vi.fn(() => ({ html: '<code>snake_case</code>', sign: 'nested' }));

    expect(hook.makeHtml('*value*', nested)).toBe('<em><code>snake_case</code></em>');
  });

  it('keeps escaped asterisks, intraword underscores, and blank underscore content literal', () => {
    const hook = createEmphasis(true);

    expect(hook.makeHtml('\\*literal*', sentenceMake)).toBe('\\*literal*');
    expect(hook.makeHtml('snake_case_value', sentenceMake)).toBe('snake_case_value');
    expect(hook.makeHtml('_   _', sentenceMake)).toBe('_   _');
  });

  it('supports whitespace and multiline content when configured', () => {
    const enabled = createEmphasis(true);
    const disabled = createEmphasis(false);

    expect(enabled.makeHtml('*leading and trailing *', sentenceMake)).toContain('<em>');
    expect(enabled.makeHtml('before **line one\nline two** after', sentenceMake)).toContain(
      '<strong><span>line one\nline two</span></strong>',
    );
    expect(disabled.makeHtml('*leading and trailing *', sentenceMake)).toBe('*leading and trailing *');
  });

  it('handles emphasis after indentation and punctuation with allowWhitespace', () => {
    const hook = createEmphasis(true);

    expect(hook.makeHtml('  *item*', sentenceMake)).toBe('  <em><span>item</span></em>');
    expect(hook.makeHtml('word, *item*', sentenceMake)).toContain(', <em><span>item</span></em>');
    expect(hook.makeHtml('prefix** strong **suffix', sentenceMake)).toContain('<strong><span> strong </span></strong>');
  });
});
