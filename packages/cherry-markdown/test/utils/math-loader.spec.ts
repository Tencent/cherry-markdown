import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { initMathEngines } from '../../src/utils/math-loader';

const { loadCSSMock, loadScriptMock } = vi.hoisted(() => ({
  loadCSSMock: vi.fn(),
  loadScriptMock: vi.fn(),
}));

vi.mock('../../src/utils/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/dom')>();
  return { ...actual, loadCSS: loadCSSMock, loadScript: loadScriptMock };
});

interface TestEngine {
  $cherry: {
    previewer: {
      getDom: () => HTMLElement;
      isPreviewerHidden: () => boolean;
      options: { previewerCache: { html: string } };
    };
  };
  asyncRenderHandler: {
    md: string;
    done: ReturnType<typeof vi.fn>;
  };
}

function initMathEnginesForTest(engine: TestEngine, opts: Parameters<typeof initMathEngines>[1]) {
  // @ts-expect-error Test fixture implements only the Engine fields read by math-loader.
  initMathEngines(engine, opts);
}

function createEngine(className: string, hidden = false): TestEngine {
  const previewerDom = document.createElement('div');
  previewerDom.innerHTML = [
    `<div data-sign="block-sign" class="Cherry-Math ${className}" data-type="mathBlock" data-lines="2" data-content="x%2B1"></div>`,
    `<span data-sign="inline-sign" class="Cherry-InlineMath ${className}" data-type="inlineMath" data-lines="1" data-content="y%2B1"></span>`,
  ].join('');
  const md = [
    `<div data-sign="block-sign" class="Cherry-Math ${className}" data-type="mathBlock" data-lines="2" data-content="x%2B1"></div>`,
    `<span data-sign="inline-sign" class="Cherry-InlineMath ${className}" data-type="inlineMath" data-lines="1" data-content="y%2B1"></span>`,
  ].join('');

  return {
    $cherry: {
      previewer: {
        getDom: () => previewerDom,
        isPreviewerHidden: () => hidden,
        options: { previewerCache: { html: '' } },
      },
    },
    asyncRenderHandler: {
      md,
      done: vi.fn(),
    },
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
  Reflect.deleteProperty(window, 'katex');
  Reflect.deleteProperty(window, 'MathJax');
  loadCSSMock.mockReset();
  loadScriptMock.mockReset();
});

describe('utils/math-loader', () => {
  it('loads KaTeX assets and backfills pending block and inline math placeholders', async () => {
    const engine = createEngine('cherry-katex-need-render', true);
    const renderToString = vi.fn(
      (content: string, options: { displayMode: boolean }) =>
        `<span class="katex-rendered" data-display="${String(options.displayMode)}">${content}</span>`,
    );
    loadScriptMock.mockImplementationOnce(() => {
      Object.assign(window, { katex: { renderToString } });
      return Promise.resolve();
    });

    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'katex', src: '/katex.js', css: '/katex.css' },
          inlineMath: { engine: 'katex' },
        },
      },
    });

    await vi.waitFor(() => expect(engine.asyncRenderHandler.done).toHaveBeenCalledTimes(2));

    expect(loadCSSMock).toHaveBeenCalledWith('/katex.css', 'katex-css');
    expect(loadScriptMock).toHaveBeenCalledWith('/katex.js', 'katex-js');
    expect(renderToString).toHaveBeenCalledWith('x+1', { throwOnError: false, displayMode: true });
    expect(renderToString).toHaveBeenCalledWith('y+1', { throwOnError: false, displayMode: false });
    expect(engine.$cherry.previewer.getDom().querySelector('.cherry-katex-need-render')).toBeNull();
    expect(engine.asyncRenderHandler.md).toContain('class="katex-rendered" data-display="true">x+1</span>');
    expect(engine.asyncRenderHandler.md).toContain('class="katex-rendered" data-display="false">y+1</span>');
    expect(engine.$cherry.previewer.options.previewerCache.html).toBe(engine.asyncRenderHandler.md);
  });

  it('loads MathJax, waits for startup, and renders inline math with inline layout options', async () => {
    const engine = createEngine('cherry-mathjax-need-render');
    const tex2svg = vi.fn((content: string, options?: { display?: boolean }) => {
      const svg = document.createElement('svg');
      svg.innerHTML = `<text>${content}:${options?.display === false ? 'inline' : 'display'}</text>`;
      return svg;
    });
    loadScriptMock.mockImplementationOnce(() => {
      Object.assign(window, { MathJax: { startup: { promise: Promise.resolve() }, tex2svg } });
      return Promise.resolve();
    });

    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'MathJax', src: '/mathjax.js', plugins: true },
          inlineMath: { engine: 'MathJax' },
        },
      },
    });

    await vi.waitFor(() => expect(engine.asyncRenderHandler.done).toHaveBeenCalledTimes(2));

    expect(loadScriptMock).toHaveBeenCalledWith('/mathjax.js', 'mathjax-js');
    expect(tex2svg).toHaveBeenCalledWith('x+1');
    expect(tex2svg).toHaveBeenCalledWith('y+1', { em: 12, ex: 6, display: false });
    expect(engine.asyncRenderHandler.done).toHaveBeenCalledWith('math-block-block-sign');
    expect(engine.asyncRenderHandler.done).toHaveBeenCalledWith('math-inline-inline-sign');
    expect(engine.asyncRenderHandler.md).toContain('<text>x+1:display</text>');
    expect(engine.asyncRenderHandler.md).toContain('<text>y+1:inline</text>');
    expect(engine.$cherry.previewer.options.previewerCache.html).toBe('');
  });

  it('does not load formula assets when syntax is disabled or an engine is already available', () => {
    const engine = createEngine('cherry-katex-need-render');

    initMathEnginesForTest(engine, {
      externals: {},
      engine: { syntax: { mathBlock: {}, inlineMath: {} } },
    });

    Object.assign(window, { katex: { renderToString: vi.fn() } });
    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'katex', src: '/katex.js', css: '/katex.css' },
          inlineMath: { engine: 'katex' },
        },
      },
    });

    expect(loadCSSMock).not.toHaveBeenCalled();
    expect(loadScriptMock).not.toHaveBeenCalled();
  });

  it('clears MathJax placeholders when a single formula renderer throws', async () => {
    const engine = createEngine('cherry-mathjax-need-render');
    loadScriptMock.mockImplementationOnce(() => {
      Object.assign(window, {
        MathJax: {
          startup: { promise: Promise.resolve() },
          tex2svg: () => {
            throw new Error('invalid formula');
          },
        },
      });
      return Promise.resolve();
    });

    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'MathJax' },
          inlineMath: { engine: 'MathJax', src: '/mathjax-inline.js' },
        },
      },
    });

    await vi.waitFor(() => expect(engine.asyncRenderHandler.done).toHaveBeenCalledTimes(2));

    expect(loadScriptMock).toHaveBeenCalledWith('/mathjax-inline.js', 'mathjax-js');
    expect(engine.$cherry.previewer.getDom().querySelector('.cherry-mathjax-need-render')).toBeNull();
    expect(engine.asyncRenderHandler.md).not.toContain('cherry-mathjax-need-render');
    expect(engine.asyncRenderHandler.md).toContain('$$x+1$$');
    expect(engine.asyncRenderHandler.md).toContain('$y+1$');
  });

  it('renders MathJax immediately when a loaded version has no startup promise', async () => {
    const engine = createEngine('cherry-mathjax-need-render');
    loadScriptMock.mockImplementationOnce(() => {
      Object.assign(window, {
        MathJax: {
          tex2svg: (content: string) => {
            const svg = document.createElement('svg');
            svg.innerHTML = `<text>${content}</text>`;
            return svg;
          },
        },
      });
      return Promise.resolve();
    });

    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'MathJax', src: '/mathjax.js' },
          inlineMath: { engine: 'MathJax' },
        },
      },
    });

    await vi.waitFor(() => expect(engine.asyncRenderHandler.done).toHaveBeenCalledTimes(2));
    expect(engine.asyncRenderHandler.md).toContain('<text>x+1</text>');
  });

  it('leaves placeholders stable when a loaded script has not registered its engine yet', async () => {
    const mathJaxEngine = createEngine('cherry-mathjax-need-render');
    const katexEngine = createEngine('cherry-katex-need-render');
    loadScriptMock.mockResolvedValue(undefined);

    initMathEnginesForTest(mathJaxEngine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'MathJax', src: '/mathjax.js' },
          inlineMath: { engine: 'MathJax' },
        },
      },
    });
    initMathEnginesForTest(katexEngine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'katex', src: '/katex.js' },
          inlineMath: { engine: 'katex' },
        },
      },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(mathJaxEngine.asyncRenderHandler.done).not.toHaveBeenCalled();
    expect(katexEngine.asyncRenderHandler.done).not.toHaveBeenCalled();
    expect(mathJaxEngine.$cherry.previewer.getDom().querySelector('.cherry-mathjax-need-render')).not.toBeNull();
    expect(katexEngine.$cherry.previewer.getDom().querySelector('.cherry-katex-need-render')).not.toBeNull();
  });

  it('skips script requests when MathJax is already injected or no formula source is configured', () => {
    const engine = createEngine('cherry-mathjax-need-render');
    Object.assign(window, { MathJax: {} });

    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'MathJax', src: '/mathjax.js' },
          inlineMath: { engine: 'MathJax' },
        },
      },
    });

    Reflect.deleteProperty(window, 'MathJax');
    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'MathJax' },
          inlineMath: { engine: 'MathJax' },
        },
      },
    });

    expect(loadScriptMock).not.toHaveBeenCalled();
  });

  it('accepts disabled syntax entries and does not load KaTeX without a source URL', () => {
    const engine = createEngine('cherry-katex-need-render');

    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: false,
          inlineMath: { engine: 'katex' },
        },
      },
    });

    expect(loadCSSMock).not.toHaveBeenCalled();
    expect(loadScriptMock).not.toHaveBeenCalled();
  });

  it('does not hang when MathJax disappears while its startup promise resolves', async () => {
    const engine = createEngine('cherry-mathjax-need-render');
    loadScriptMock.mockImplementationOnce(() => {
      const startup = Promise.resolve().then(() => {
        Reflect.deleteProperty(window, 'MathJax');
      });
      Object.assign(window, { MathJax: { startup, tex2svg: vi.fn() } });
      return Promise.resolve();
    });

    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'MathJax', src: '/mathjax.js' },
          inlineMath: { engine: 'MathJax' },
        },
      },
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(engine.asyncRenderHandler.done).not.toHaveBeenCalled();
    expect(engine.$cherry.previewer.getDom().querySelector('.cherry-mathjax-need-render')).not.toBeNull();
  });

  it('keeps placeholders pending until a loaded MathJax exposes tex2svg', async () => {
    const engine = createEngine('cherry-mathjax-need-render');
    loadScriptMock.mockImplementationOnce(() => {
      Object.assign(window, { MathJax: { startup: { promise: Promise.resolve() } } });
      return Promise.resolve();
    });

    initMathEnginesForTest(engine, {
      externals: {},
      engine: {
        syntax: {
          mathBlock: { engine: 'MathJax', src: '/mathjax.js' },
          inlineMath: false,
        },
      },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(engine.asyncRenderHandler.done).not.toHaveBeenCalled();
    expect(engine.$cherry.previewer.getDom().querySelector('.cherry-mathjax-need-render')).not.toBeNull();
  });
});
