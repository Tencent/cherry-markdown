import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoadMathModule, configureMathJax, escapeFormulaPunctuations } from '../../src/utils/mathjax';

describe('mathjax 工具函数', () => {
  describe('LoadMathModule', () => {
    it('从 window 加载模块', () => {
      // @ts-ignore
      window.katex = 'mock-katex';
      // @ts-ignore
      window.MathJax = 'mock-mathjax';

      const instance = {
        $externals: undefined,
        katex: null,
        MathJax: null,
      };

      LoadMathModule.call(instance);
      expect(instance.katex).toBe('mock-katex');
      expect(instance.MathJax).toBe('mock-mathjax');
    });

    it('从 $externals 加载模块', () => {
      // @ts-ignore
      window.katex = 'window-katex';
      // @ts-ignore
      window.MathJax = 'window-mathjax';

      const instance = {
        $externals: {
          katex: 'externals-katex',
          MathJax: 'externals-mathjax',
        },
        katex: null,
        MathJax: null,
      };

      LoadMathModule.call(instance);
      expect(instance.katex).toBe('externals-katex');
      expect(instance.MathJax).toBe('externals-mathjax');
    });
  });

  describe('configureMathJax', () => {
    beforeEach(() => {
      // @ts-ignore
      window.MathJax = undefined;
    });

    it('配置 MathJax', () => {
      const cases = [
        [true, ['input/asciimath', '[tex]/noerrors']],
        [false, ['ui/safe']],
      ];
      cases.forEach(([withPlugins, expectedContains]) => {
        configureMathJax(withPlugins as boolean);
        // @ts-ignore
        expect(window.MathJax).toBeDefined();
        // @ts-ignore
        if (Array.isArray(expectedContains)) {
          expectedContains.forEach((item) => expect(window.MathJax.loader.load).toContain(item));
        }
      });
    });
  });

  describe('escapeFormulaPunctuations', () => {
    it('转义公式中的标点符号', () => {
      const cases = [
        ['x+y=z', 'x\\+y\\=z'],
        ['x,y;z', 'x\\,y\\;z'],
        ['x + y', 'x \\+ y'],
        ['a+b=c,d;e', 'a\\+b\\=c\\,d\\;e'],
        ['', ''],
        ['abc123', 'abc123'],
      ];
      cases.forEach(([input, expected]) => {
        expect(escapeFormulaPunctuations(input as string)).toBe(expected);
      });
    });
  });
});
