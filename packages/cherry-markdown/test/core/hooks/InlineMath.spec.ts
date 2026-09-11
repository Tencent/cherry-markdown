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

function createInlineMath(
  engine: 'katex' | 'MathJax',
  selfClosing = false,
  flowSessionContext = false,
  texDelimiter?: boolean,
) {
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
  const config: { engine: 'katex' | 'MathJax'; TeXDelimiter?: boolean } = { engine };
  if (texDelimiter !== undefined) {
    config.TeXDelimiter = texDelimiter;
  }
  const hook = new InlineMath({ config, cherry });
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

  it('falls back to raw source with red-highlighted control chars when MathJax throws', () => {
    const tex2svg = vi.fn(() => {
      throw new Error('invalid formula');
    });
    const { hook } = createInlineMath('MathJax');
    setExternals(hook, { MathJax: { tex2svg } });

    const html = hook.restoreCache(hook.toHtml('~D\x08oldsymbol a~D', '', '\x08oldsymbol a'));

    expect(html).toContain('cherry-math-error');
    expect(html).toContain('\\x08');
    expect(html).toContain('oldsymbol a');
    expect(html).not.toContain('<mjx-container');
  });

  it('falls back to raw source when KaTeX rendering throws', () => {
    const renderToString = vi.fn(() => {
      throw new Error('invalid formula');
    });
    const { hook } = createInlineMath('katex');
    setExternals(hook, { katex: { renderToString } });

    const html = hook.restoreCache(hook.toHtml('~Dx~D', '', 'x'));

    expect(html).toContain('$x$');
    expect(html).not.toContain('class="katex"');
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

  it('renders TeX inline formula delimiters directly', () => {
    const { hook } = createInlineMath('MathJax');
    hook.engine = 'node';

    const html = hook.restoreCache(hook.beforeMakeHtml('value \\(x^2\\)'));

    expect(html).toContain('$x\\^2$');
    expect(html).toContain('data-formula-source="x%5E2"');
  });

  it('keeps escaped, empty, and unclosed TeX inline delimiters unchanged', () => {
    const { hook } = createInlineMath('MathJax');

    expect(hook.beforeMakeHtml('\\\\(not math\\\\)')).toBe('\\\\(not math\\\\)');
    expect(hook.beforeMakeHtml('\\( \\)')).toBe('\\( \\)');
    expect(hook.beforeMakeHtml('before \\(unclosed')).toBe('before \\(unclosed');
  });

  it('does not recognize TeX inline delimiters when TeXDelimiter is disabled', () => {
    const { hook } = createInlineMath('MathJax', false, false, false);
    hook.engine = 'node';

    // \(..\) 不再被归一化为 $..$
    expect(hook.beforeMakeHtml('value \\(x^2\\)')).toBe('value \\(x^2\\)');

    // 原生 $..$（Engine 编码后的 ~D..~D）仍能正常渲染
    const html = hook.restoreCache(hook.beforeMakeHtml('value ~Dx^2~D'));
    expect(html).toContain('$x\\^2$');
    expect(html).toContain('data-formula-source="x%5E2"');
  });

  it('does not close unfinished \\( when TeXDelimiter is disabled even in self-closing mode', () => {
    const selfClosing = createInlineMath('MathJax', true, false, false).hook;
    const flow = createInlineMath('MathJax', false, true, false).hook;
    selfClosing.engine = 'node';
    flow.engine = 'node';

    // selfClosing / flow 场景下不再对 \( 做补开
    expect(selfClosing.beforeMakeHtml('value \\(x^2')).toBe('value \\(x^2');
    expect(flow.beforeMakeHtml('value \\(x^2CHERRYFLOWSESSIONCURSOR')).toContain('\\(x^2');

    // 原生 ~D 半开公式的 selfClosing 兜底仍然生效
    const nativeSelfClosing = selfClosing.restoreCache(selfClosing.beforeMakeHtml('value ~Dx^2'));
    expect(nativeSelfClosing).toContain('$x\\^2$');
  });

  it('preserves TeX delimiters in existing formulas and normalizes bare \\(..\\)', () => {
    const { hook } = createInlineMath('MathJax');
    hook.engine = 'node';

    // 原生 ~D..~D（Engine 编码后的 $..$）作为“保护壳”：内部的 \(x\) 不会被误当公式定界符
    const formulaHtml = hook.restoreCache(hook.beforeMakeHtml('~D\\(x\\)~D'));
    expect(formulaHtml).toContain('data-formula-source="%5C(x%5C)"');

    // 单元测试直接调用 InlineMath.beforeMakeHtml 时不经过 LinkFormatter，
    // 因此 [text](url) 里的 \(..\) 会像普通文本一样被 InlineMath 归一化——
    // “链接内字符转义”的保护职责已迁移到 LinkFormatter（见 LinkFormatter.spec.ts）。
    const linkHtml = hook.restoreCache(hook.beforeMakeHtml('[\\(label\\)](\\(url\\) "title \\[text\\]")'));
    expect(linkHtml).toContain('data-formula-source="label"');
    expect(linkHtml).toContain('data-formula-source="url"');
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

    const texSelfClosingHtml = selfClosing.restoreCache(selfClosing.beforeMakeHtml('value \\(x^2'));
    const texFlowHtml = flow.restoreCache(flow.beforeMakeHtml('value \\(x^2CHERRYFLOWSESSIONCURSOR'));

    expect(texSelfClosingHtml).toContain('data-formula-source="x%5E2"');
    expect(texFlowHtml).toContain('data-formula-source="x%5E2"');
    expect(texFlowHtml).toContain('CHERRYFLOWSESSIONCURSOR');
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

  it('keeps TeX inline formulas within a single Markdown table cell', () => {
    const { hook } = createInlineMath('MathJax');
    hook.engine = 'node';
    const markdown = '| Left | Right |\n| --- | --- |\n| \\(x | y\\) |\n| \\(z\\) | plain |';

    const html = hook.restoreCache(hook.beforeMakeHtml(markdown));

    expect(html.match(/class="Cherry-InlineMath"/g)).toHaveLength(1);
    expect(html).toContain('data-formula-source="z"');
    expect(html).toContain('\\(x');
    expect(html).toContain('y\\)');
  });
});
