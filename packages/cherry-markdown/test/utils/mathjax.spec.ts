import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoadMathModule, configureMathJax, escapeFormulaPunctuations } from '../../src/utils/mathjax';

describe('mathjax 工具函数', () => {
  describe('LoadMathModule', () => {
    it('浏览器环境下从 window 加载模块', () => {
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

    it('配置带插件的 MathJax', () => {
      configureMathJax(true);
      // @ts-ignore
      expect(window.MathJax).toBeDefined();
      // @ts-ignore
      expect(window.MathJax.loader.load).toContain('input/asciimath');
      // @ts-ignore
      expect(window.MathJax.loader.load).toContain('[tex]/noerrors');
    });

    it('配置不带插件的 MathJax', () => {
      configureMathJax(false);
      // @ts-ignore
      expect(window.MathJax).toBeDefined();
      // @ts-ignore
      expect(window.MathJax.loader.load).toEqual(['ui/safe']);
    });
  });

  describe('escapeFormulaPunctuations', () => {
    it('转义公式中的标点符号', () => {
      const result = escapeFormulaPunctuations('x+y=z');
      expect(result).toBe('x\\+y\\=z');
    });

    it('转义特殊标点符号', () => {
      const result = escapeFormulaPunctuations('x,y;z');
      expect(result).toBe('x\\,y\\;z');
    });

    it('不转义空格', () => {
      const result = escapeFormulaPunctuations('x + y');
      expect(result).toBe('x \\+ y');
    });

    it('转义多个标点符号', () => {
      const result = escapeFormulaPunctuations('a+b=c,d;e');
      expect(result).toBe('a\\+b\\=c\\,d\\;e');
    });

    it('空字符串返回空字符串', () => {
      const result = escapeFormulaPunctuations('');
      expect(result).toBe('');
    });

    it('不包含标点符号时返回原字符串', () => {
      const result = escapeFormulaPunctuations('abc123');
      expect(result).toBe('abc123');
    });
  });
});
