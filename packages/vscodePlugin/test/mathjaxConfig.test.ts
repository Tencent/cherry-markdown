import { describe, expect, test } from 'vitest';
import { getVSCodeMathJaxConfig, MATHJAX_MODULE, waitForMathJax } from '../src/mathjaxConfig';

describe('VS Code MathJax configuration', () => {
  test('uses the full MathJax bundle without triggering network component loads', () => {
    const config = getVSCodeMathJaxConfig();

    expect(config.loader.load).toEqual([]);
    expect(MATHJAX_MODULE).toBe('mathjax/es5/tex-svg-full.js');
    expect(config.tex.packages['[+]']).toContain('boldsymbol');
    expect(config.tex.macros.bm).toEqual(['{\\boldsymbol{#1}}', 1]);
  });

  test('does not block preview when MathJax startup fails', async () => {
    const startup = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('startup failed')), 0),
    );

    await expect(waitForMathJax({ startup: { promise: startup } })).resolves.toBeUndefined();
  });
});
