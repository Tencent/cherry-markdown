import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import InlineMath from '../../../src/core/hooks/InlineMath';
import { hashHex } from '../../../src/utils/hash';

interface MathExternals {
  katex?: {
    renderToString: (formula: string, options: { throwOnError: boolean }) => string;
  };
  MathJax?: {
    tex2svg?: (formula: string, options: { em: number; ex: number; display: boolean }) => Element;
  };
}

function createInlineMath(engine: 'katex' | 'MathJax', selfClosing = false, flowSessionContext = false) {
  const cherry = {
    options: {
      engine: {
        syntax: {
          inlineMath: { selfClosing },
        },
        global: { flowSessionContext },
      },
    },
  };
  const hook = new InlineMath({ config: { engine }, cherry });
  const add = vi.fn();
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
      asyncRenderHandler: { add },
    },
  });
  return { hook, add };
}

function setExternals(hook: InlineMath, externals: MathExternals) {
  Object.defineProperty(hook, '$externals', { value: externals, configurable: true });
}

function mathJaxNode(content: string) {
  const node = document.createElement('mjx-container');
  node.innerHTML = content;
  return node;
}

describe('core/hooks/InlineMath', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('defaults to MathJax in browser environments', () => {
    const cherry = {
      options: {
        engine: {
          syntax: { inlineMath: { selfClosing: false } },
          global: { flowSessionContext: false },
        },
      },
    };

    expect(new InlineMath({ config: {}, cherry }).engine).toBe('MathJax');
  });

  it('renders inline formulas with KaTeX and preserves rendering options', () => {
    const renderToString = vi.fn(() => '<span class="katex">rendered</span>');
    const { hook, add } = createInlineMath('katex');
    setExternals(hook, { katex: { renderToString } });

    const cacheKey = hook.toHtml('~Dx^2~D', '', 'x^2');
    const html = hook.restoreCache(cacheKey);

    expect(renderToString).toHaveBeenCalledWith('x^2', { throwOnError: false });
    expect(html).toContain('class="Cherry-InlineMath"');
    expect(html).toContain('data-formula-source="x%5E2"');
    expect(html).toContain('<span class="katex">rendered</span>');
    expect(add).not.toHaveBeenCalled();
  });

  it('registers an asynchronous KaTeX placeholder when the renderer is unavailable', () => {
    const { hook, add } = createInlineMath('katex');
    setExternals(hook, {});

    const html = hook.restoreCache(hook.toHtml('~Dx~D', '', 'x'));
    const sign = hashHex('~Dx~D');

    expect(html).toContain('cherry-katex-need-render');
    expect(html).toContain('data-content="x"');
    expect(add).toHaveBeenCalledWith(`math-inline-${sign}`);
  });

  it('reuses the last valid KaTeX output for a self-closing error', () => {
    const renderToString = vi
      .fn()
      .mockReturnValueOnce('<span class="katex">valid</span>')
      .mockReturnValueOnce('<span class="katex-error">invalid</span>');
    const { hook } = createInlineMath('katex', true);
    setExternals(hook, { katex: { renderToString } });

    hook.restoreCache(hook.toHtml('~Dvalid~D', '', 'valid'));
    const html = hook.restoreCache(hook.toHtml('~Dinvalid~D', '', 'invalid'));

    expect(html).toContain('<span class="katex">valid</span>');
    expect(html).not.toContain('katex-error');
  });

  it('renders inline formulas with MathJax using inline layout options', () => {
    const tex2svg = vi.fn(() => mathJaxNode('<svg><text>rendered</text></svg>'));
    const { hook, add } = createInlineMath('MathJax');
    setExternals(hook, { MathJax: { tex2svg } });

    const html = hook.restoreCache(hook.toHtml(' ~Dx+y~D', ' ', 'x+y'));

    expect(tex2svg).toHaveBeenCalledWith('x+y', { em: 12, ex: 6, display: false });
    expect(html).toContain('<mjx-container><svg><text>rendered</text></svg></mjx-container>');
    expect(html.startsWith(' ')).toBe(true);
    expect(add).not.toHaveBeenCalled();
  });

  it('registers an asynchronous MathJax placeholder when tex2svg is unavailable', () => {
    const { hook, add } = createInlineMath('MathJax');
    setExternals(hook, { MathJax: {} });

    const html = hook.restoreCache(hook.toHtml('~Dx~D', '', 'x'));

    expect(html).toContain('cherry-mathjax-need-render');
    expect(add).toHaveBeenCalledWith(`math-inline-${hashHex('~Dx~D')}`);
  });

  it('reuses the last valid MathJax output for a self-closing error node', () => {
    const tex2svg = vi
      .fn()
      .mockReturnValueOnce(mathJaxNode('<svg><text>valid</text></svg>'))
      .mockReturnValueOnce(mathJaxNode('<svg data-mml-node="merror"></svg>'));
    const { hook } = createInlineMath('MathJax', true);
    setExternals(hook, { MathJax: { tex2svg } });

    hook.restoreCache(hook.toHtml('~Dvalid~D', '', 'valid'));
    const html = hook.restoreCache(hook.toHtml('~Dinvalid~D', '', 'invalid'));

    expect(html).toContain('<text>valid</text>');
    expect(html).not.toContain('merror');
  });

  it('renders escaped source when running with the node engine', () => {
    const { hook } = createInlineMath('MathJax');
    hook.engine = 'node';

    const html = hook.restoreCache(hook.toHtml('~Dx<y & z~D', '', 'x<y & z'));

    expect(html).toContain('$x&lt;y &amp; z$');
    expect(html).toContain('data-formula-source="x%3Cy%20%26%20z"');
  });

  it('counts multiline inline formula source and keeps makeHtml stable', () => {
    const { hook } = createInlineMath('MathJax');
    hook.engine = 'node';

    const html = hook.restoreCache(hook.toHtml('~Dx\ny~D', '', 'x\ny'));

    expect(html).toContain('data-lines="3"');
    expect(hook.makeHtml('already rendered')).toBe('already rendered');
  });

  it('returns empty matches unchanged and ignores text without formula markers', () => {
    const { hook } = createInlineMath('MathJax');

    expect(hook.toHtml('~D~D', '', '')).toBe('~D~D');
    expect(hook.makeInlineMath('plain text')).toBe('plain text');
  });

  it('closes an unfinished inline formula in self-closing and flow modes', () => {
    const selfClosing = createInlineMath('MathJax', true).hook;
    const flow = createInlineMath('MathJax', false, true).hook;
    selfClosing.engine = 'node';
    flow.engine = 'node';

    const selfClosingHtml = selfClosing.restoreCache(selfClosing.beforeMakeHtml('value ~Dx^2'));
    const flowHtml = flow.restoreCache(flow.beforeMakeHtml('value ~Dx^2CHERRYFLOWSESSIONCURSOR'));

    expect(selfClosingHtml).toContain('$x\\^2$');
    expect(selfClosingHtml).toContain('data-formula-source="x%5E2"');
    expect(flowHtml).toContain('$x\\^2$');
    expect(flowHtml).toContain('CHERRYFLOWSESSIONCURSOR');
  });

  it('turns block formulas inside table cells into inline formulas', () => {
    const { hook } = createInlineMath('MathJax');
    hook.engine = 'node';

    const transformed = hook.transformBlockMathToInlineMath('cell ~D~Dx+y~D~D tail');
    const html = hook.restoreCache(hook.makeInlineMath(transformed));

    expect(html).toContain('$x\\+y$');
    expect(html).toContain('data-formula-source="x%2By"');
    expect(html).not.toContain('~D~D');
  });

  it('renders formulas independently inside Markdown table cells', () => {
    const { hook } = createInlineMath('MathJax');
    hook.engine = 'node';
    const markdown = '| Formula | Value |\n| --- | --- |\n| ~D~Dx+y~D~D | ~Dz~D |';

    const html = hook.restoreCache(hook.beforeMakeHtml(markdown));

    expect(html.match(/class="Cherry-InlineMath"/g)).toHaveLength(2);
    expect(html).toContain('data-formula-source="x%2By"');
    expect(html).toContain('data-formula-source="z"');
  });
});
