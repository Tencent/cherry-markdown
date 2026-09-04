import { describe, expect, it } from 'vite-plus/test';
import MathDelimiter from '../../../src/core/hooks/MathDelimiter';

function createMathDelimiter(inlineMath: object | false = {}, mathBlock: object | false = {}) {
  return new MathDelimiter({
    cherry: {
      options: {
        engine: {
          syntax: { inlineMath, mathBlock },
        },
      },
    },
  });
}

describe('core/hooks/MathDelimiter', () => {
  it('normalizes TeX inline and display delimiters', () => {
    const hook = createMathDelimiter();

    expect(hook.beforeMakeHtml('Inline \\(x + y\\).')).toBe('Inline ~Dx + y~D.');
    expect(hook.beforeMakeHtml('\\[\nx + y\n\\]')).toBe('~D~D\nx + y\n~D~D');
    expect(hook.beforeMakeHtml('\\(x\\)\\(y\\)')).toBe('~Dx~D~Dy~D');
  });

  it('keeps escaped and unclosed delimiters unchanged', () => {
    const hook = createMathDelimiter();

    expect(hook.beforeMakeHtml('\\\\(not math\\\\)')).toBe('\\\\(not math\\\\)');
    expect(hook.beforeMakeHtml('before \\(unclosed')).toBe('before \\(unclosed');
    expect(hook.beforeMakeHtml('before \\[unclosed')).toBe('before \\[unclosed');
    expect(hook.beforeMakeHtml('\\(unclosed, then \\[y\\]')).toBe('\\(unclosed, then ~D~Dy~D~D');
    expect(hook.beforeMakeHtml('\\( \\) and \\[\n\\]')).toBe('\\( \\) and \\[\n\\]');
  });

  it('does not normalize TeX delimiters inside existing dollar formulas', () => {
    const hook = createMathDelimiter();

    expect(hook.beforeMakeHtml('~D~D\\(x\\)~D~D and ~D\\[y\\]~D')).toBe(
      '~D~D\\(x\\)~D~D and ~D\\[y\\]~D',
    );
  });

  it('respects disabled inline and block math syntax', () => {
    const inlineDisabled = createMathDelimiter(false, {});
    const blockDisabled = createMathDelimiter({}, false);

    expect(inlineDisabled.beforeMakeHtml('\\(x\\) and \\[y\\]')).toBe('\\(x\\) and ~D~Dy~D~D');
    expect(blockDisabled.beforeMakeHtml('\\(x\\) and \\[y\\]')).toBe('~Dx~D and \\[y\\]');
  });

  it('preserves delimiters in link destinations while converting link text', () => {
    const hook = createMathDelimiter();

    expect(hook.beforeMakeHtml('[\\(label\\)](\\(url\\) "title \\[text\\]")')).toBe(
      '[~Dlabel~D](\\(url\\) "title \\[text\\]")',
    );
  });
});
