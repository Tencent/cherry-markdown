import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Paragraph from '../../../src/core/hooks/Paragraph';
import { hashHex } from '../../../src/utils/hash';

const sentenceMake = (markdown: string) => ({
  sign: hashHex(markdown),
  html: markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
});

function createParagraph(classicBr = false, htmlWhiteListAppend = '') {
  const hook = new Paragraph({ globalConfig: { classicBr } });
  Object.defineProperty(hook, '$engine', {
    value: { htmlWhiteListAppend },
  });
  return hook;
}

describe('core/hooks/Paragraph', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('returns empty input and does not wrap whitespace-only input', () => {
    const hook = createParagraph();

    expect(hook.makeHtml('', sentenceMake)).toBe('');
    expect(hook.makeHtml('   ', sentenceMake)).not.toContain('<p');
  });

  it('renders inline Markdown, line breaks, signatures, and line counts', () => {
    const hook = createParagraph();
    const html = hook.makeHtml('first **strong**\nsecond', sentenceMake);

    expect(html).toContain('<p ');
    expect(html).toContain('data-type="p"');
    expect(html).toContain('data-lines="2"');
    expect(html).toContain('<strong>strong</strong><br>second');
  });

  it('preserves source newlines without br elements in classic mode', () => {
    const hook = createParagraph(true);
    const html = hook.makeHtml('first\nsecond', sentenceMake);

    expect(html).toContain('first\nsecond');
    expect(html).not.toContain('<br>');
  });

  it('leaves a complete paragraph cache placeholder untouched', () => {
    const hook = createParagraph();
    const placeholder = '~~C1Icached_L2$';

    expect(hook.makeHtml(placeholder, sentenceMake)).toBe(placeholder);
  });

  it('renders text around a nested paragraph cache without wrapping the cache', () => {
    const hook = createParagraph();
    const placeholder = '~~C1Icached_L2$';
    const html = hook.makeHtml(`before\n${placeholder}\nafter`, sentenceMake);

    expect(html.match(/data-type="p"/g)).toHaveLength(2);
    expect(html).toContain(placeholder);
    expect(html).toContain('>before</p>');
    expect(html).toContain('>after</p>');
  });
});
