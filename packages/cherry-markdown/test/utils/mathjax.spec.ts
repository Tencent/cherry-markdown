import { afterEach, describe, expect, it } from 'vite-plus/test';
import { configureMathJax, escapeFormulaPunctuations, LoadMathModule, renderMathFallback } from '../../src/utils/mathjax';

interface MathHost {
  $externals: {
    katex: { name: string };
    MathJax: { name: string };
  };
  katex?: { name: string };
  MathJax?: { name: string };
}

afterEach(() => {
  Reflect.deleteProperty(window, 'MathJax');
  Reflect.deleteProperty(window, 'katex');
});

describe('utils/mathjax', () => {
  it('loads explicitly injected MathJax and KaTeX modules onto a syntax host', () => {
    const host: MathHost = {
      $externals: {
        katex: { name: 'injected-katex' },
        MathJax: { name: 'injected-mathjax' },
      },
    };
    Object.assign(window, {
      katex: { name: 'window-katex' },
      MathJax: { name: 'window-mathjax' },
    });

    LoadMathModule.call(host);

    expect(host.katex).toEqual({ name: 'injected-katex' });
    expect(host.MathJax).toEqual({ name: 'injected-mathjax' });
  });

  it('configures MathJax with the standard safe extension set', () => {
    const mathJax = {};
    Object.assign(window, { MathJax: mathJax });

    configureMathJax(false);

    expect(mathJax).toMatchObject({
      startup: { elements: ['.Cherry-Math', '.Cherry-InlineMath'], typeset: true },
      tex: {
        tags: 'ams',
        packages: { '[+]': ['noerrors', 'cancel', 'color', 'boldsymbol'] },
        macros: { bm: ['{\\boldsymbol{#1}}', 1] },
      },
      options: { enableMenu: false, processHtmlClass: 'tex2jax_process' },
      loader: { load: ['ui/safe'] },
    });
  });

  it('adds optional MathJax input and TeX extensions when plugins are enabled', () => {
    const mathJax = {};
    Object.assign(window, { MathJax: mathJax });

    configureMathJax(true);

    expect(mathJax).toMatchObject({
      loader: {
        load: ['input/asciimath', '[tex]/noerrors', '[tex]/cancel', '[tex]/color', '[tex]/boldsymbol', 'ui/safe'],
      },
    });
  });

  it('does not fail before MathJax has been injected by its loader', () => {
    expect(() => configureMathJax(true)).not.toThrow();
    expect(window.MathJax).toBeUndefined();
  });

  it('escapes Markdown punctuation while encoding HTML-sensitive formula characters', () => {
    const formula = escapeFormulaPunctuations('x_1 + <tag> & "quoted"');

    expect(formula).toBe('x\\_1 \\+ &lt;tag&gt; &amp; &quot;quoted&quot;');
  });

  it('renders raw source and highlights illegal control characters in red', () => {
    expect(renderMathFallback('\x08oldsymbol a', false)).toBe(
      '$<span class="cherry-math-error" style="color:red">\\x08</span>oldsymbol a$',
    );
  });

  it('escapes HTML-sensitive characters in the fallback source', () => {
    expect(renderMathFallback('a < b', false)).toBe('$a &lt; b$');
  });

  it('wraps block formulas with display delimiters', () => {
    expect(renderMathFallback('x + y', true)).toBe('$$x + y$$');
  });
});
