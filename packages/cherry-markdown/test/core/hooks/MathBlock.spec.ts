import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import MathBlock from '../../../src/core/hooks/MathBlock';
import { hashHex } from '../../../src/utils/hash';

interface MathExternals {
  katex?: {
    renderToString: (formula: string, options: { throwOnError: boolean; displayMode: boolean }) => string;
  };
  MathJax?: {
    tex2svg?: (formula: string) => Element;
  };
}

function createMathBlock(engine: 'katex' | 'MathJax', selfClosing = false, flowSessionContext = false) {
  const cherry = {
    options: {
      engine: {
        syntax: {
          mathBlock: { selfClosing },
        },
        global: { flowSessionContext },
      },
    },
  };
  const hook = new MathBlock({ config: { engine }, cherry });
  const add = vi.fn();
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
      asyncRenderHandler: { add },
    },
  });
  return { hook, add };
}

function setExternals(hook: MathBlock, externals: MathExternals) {
  Object.defineProperty(hook, '$externals', { value: externals, configurable: true });
}

function mathJaxNode(content: string) {
  const node = document.createElement('mjx-container');
  node.innerHTML = content;
  return node;
}

describe('core/hooks/MathBlock', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('defaults to MathJax in browser environments', () => {
    const cherry = {
      options: {
        engine: {
          syntax: { mathBlock: { selfClosing: false } },
          global: { flowSessionContext: false },
        },
      },
    };

    expect(new MathBlock({ config: {}, cherry }).engine).toBe('MathJax');
  });

  it('renders block formulas with KaTeX display mode', () => {
    const renderToString = vi.fn(() => '<span class="katex-display">rendered</span>');
    const { hook, add } = createMathBlock('katex');
    setExternals(hook, { katex: { renderToString } });

    const cacheKey = hook.toHtml('\n~D~Dx^2~D~D\n', '\n', '', 'x^2');
    const html = hook.restoreCache(cacheKey);

    expect(renderToString).toHaveBeenCalledWith('x^2', { throwOnError: false, displayMode: true });
    expect(html).toContain('class="Cherry-Math"');
    expect(html).toContain('<span class="katex-display">rendered</span>');
    expect(html).toContain('data-formula-source="x%5E2"');
    expect(add).not.toHaveBeenCalled();
  });

  it('registers an asynchronous KaTeX placeholder when the renderer is unavailable', () => {
    const { hook, add } = createMathBlock('katex');
    setExternals(hook, {});
    const wholeMatch = '~D~Dx~D~D';

    const html = hook.restoreCache(hook.toHtml(wholeMatch, '', '', 'x'));

    expect(html).toContain('cherry-katex-need-render');
    expect(html).toContain('data-content="x"');
    expect(add).toHaveBeenCalledWith(`math-block-${hashHex(wholeMatch)}`);
  });

  it('reuses the last valid KaTeX block for a self-closing error', () => {
    const renderToString = vi
      .fn()
      .mockReturnValueOnce('<span class="katex-display">valid</span>')
      .mockReturnValueOnce('<span class="katex-error">invalid</span>');
    const { hook } = createMathBlock('katex', true);
    setExternals(hook, { katex: { renderToString } });

    hook.restoreCache(hook.toHtml('~D~Dvalid~D~D', '', '', 'valid'));
    const html = hook.restoreCache(hook.toHtml('~D~Dinvalid~D~D', '', '', 'invalid'));

    expect(html).toContain('<span class="katex-display">valid</span>');
    expect(html).not.toContain('katex-error');
  });

  it('renders block formulas with MathJax', () => {
    const tex2svg = vi.fn(() => mathJaxNode('<svg><text>rendered</text></svg>'));
    const { hook, add } = createMathBlock('MathJax');
    setExternals(hook, { MathJax: { tex2svg } });

    const html = hook.restoreCache(hook.toHtml('~D~Dx+y~D~D', '', '', 'x+y'));

    expect(tex2svg).toHaveBeenCalledWith('x+y');
    expect(html).toContain('<mjx-container><svg><text>rendered</text></svg></mjx-container>');
    expect(add).not.toHaveBeenCalled();
  });

  it('registers an asynchronous MathJax placeholder when tex2svg is unavailable', () => {
    const { hook, add } = createMathBlock('MathJax');
    setExternals(hook, { MathJax: {} });
    const wholeMatch = '~D~Dx~D~D';

    const html = hook.restoreCache(hook.toHtml(wholeMatch, '', '', 'x'));

    expect(html).toContain('cherry-mathjax-need-render');
    expect(add).toHaveBeenCalledWith(`math-block-${hashHex(wholeMatch)}`);
  });

  it('reuses the last valid MathJax block after a render exception', () => {
    const tex2svg = vi
      .fn()
      .mockReturnValueOnce(mathJaxNode('<svg><text>valid</text></svg>'))
      .mockImplementationOnce(() => {
        throw new Error('invalid formula');
      });
    const { hook } = createMathBlock('MathJax', true);
    setExternals(hook, { MathJax: { tex2svg } });

    hook.restoreCache(hook.toHtml('~D~Dvalid~D~D', '', '', 'valid'));
    const html = hook.restoreCache(hook.toHtml('~D~Dinvalid~D~D', '', '', 'invalid'));

    expect(html).toContain('<text>valid</text>');
  });

  it('reuses the last valid MathJax block for an merror node', () => {
    const tex2svg = vi
      .fn()
      .mockReturnValueOnce(mathJaxNode('<svg><text>valid</text></svg>'))
      .mockReturnValueOnce(mathJaxNode('<svg data-mml-node="merror"></svg>'));
    const { hook } = createMathBlock('MathJax', true);
    setExternals(hook, { MathJax: { tex2svg } });

    hook.restoreCache(hook.toHtml('~D~Dvalid~D~D', '', '', 'valid'));
    const html = hook.restoreCache(hook.toHtml('~D~Dinvalid~D~D', '', '', 'invalid'));

    expect(html).toContain('<text>valid</text>');
    expect(html).not.toContain('merror');
  });

  it('renders escaped source when running with the node engine', () => {
    const { hook } = createMathBlock('MathJax');
    hook.engine = 'node';

    const html = hook.restoreCache(hook.toHtml('~D~Dx<y & z~D~D', '', '', 'x<y & z'));

    expect(html).toContain('$$x&lt;y &amp; z$$');
    expect(html).toContain('data-formula-source="x%3Cy%20%26%20z"');
  });

  it('calculates zero lines for an inline-positioned block match', () => {
    const { hook } = createMathBlock('MathJax');
    hook.engine = 'node';

    const html = hook.restoreCache(hook.toHtml('~D~Dx~D~Dtail', '', '', 'x'));

    expect(html).toContain('data-lines="0"');
    expect(html.endsWith('tail')).toBe(false);
  });

  it('closes unfinished block formulas in self-closing and flow modes', () => {
    const selfClosing = createMathBlock('MathJax', true).hook;
    const flow = createMathBlock('MathJax', false, true).hook;
    selfClosing.engine = 'node';
    flow.engine = 'node';

    const selfClosingHtml = selfClosing.restoreCache(selfClosing.beforeMakeHtml('~D~Dx^2'));
    const flowHtml = flow.restoreCache(flow.beforeMakeHtml('~D~Dx^2CHERRYFLOWSESSIONCURSOR'));

    expect(selfClosingHtml).toContain('$$x\\^2$$');
    expect(selfClosingHtml).toContain('data-formula-source="x%5E2"');
    expect(flowHtml).toContain('$$x\\^2$$');
    expect(flowHtml).toContain('CHERRYFLOWSESSIONCURSOR');
  });

  it('keeps escaped formula markers unchanged', () => {
    const { hook } = createMathBlock('MathJax');
    hook.engine = 'node';
    const markdown = '\\~D~Dnot formula\\~D~D';

    expect(hook.makeMath(markdown)).toBe(markdown);
  });

  it('keeps already rendered block content stable', () => {
    const { hook } = createMathBlock('MathJax');

    expect(hook.makeHtml('already rendered')).toBe('already rendered');
  });
});
