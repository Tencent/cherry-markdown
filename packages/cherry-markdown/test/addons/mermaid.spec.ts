import { afterEach, describe, expect, it, vi } from 'vitest';
import MermaidCodeEngine from '../../src/addons/cherry-code-block-mermaid-plugin';
import CherryEngine from '../../src/index.engine.core';

const { loadScriptMock } = vi.hoisted(() => ({ loadScriptMock: vi.fn() }));

vi.mock('@/utils/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/dom')>();
  return { ...actual, loadScript: loadScriptMock };
});

const SVG_CODE = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><text>A to B</text></svg>';

interface MermaidInstallOptions {
  engine: {
    syntax: {
      codeBlock?: { customRenderer: { mermaid: MermaidCodeEngine } };
    };
  };
}

function appendMeasuredSvg(container: HTMLElement, graphId: string) {
  const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  shadow.id = graphId;
  Object.defineProperty(shadow, 'getBBox', {
    value: () => ({ x: 0, y: 0, width: 320, height: 180 }),
  });
  container.appendChild(shadow);
}

function createEngine() {
  const wrapperDom = document.createElement('div');
  document.body.appendChild(wrapperDom);
  return {
    $cherry: {
      wrapperDom,
      options: { engine: { global: { flowSessionContext: false } } },
      status: { editor: 'show' },
    },
    hash: vi.fn((source: string) => `hash-${source}`),
    asyncRenderHandler: {
      add: vi.fn(),
      done: vi.fn(),
    },
  };
}

afterEach(() => {
  document.body.innerHTML = '';
  delete window.mermaid;
  delete window.mermaidAPI;
  loadScriptMock.mockReset();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('addons/MermaidCodeEngine', () => {
  it('installs a custom code block renderer', () => {
    const initialize = vi.fn();
    const mermaidAPI = {
      initialize,
      render(_id: string, _source: string, callback: (svg: string) => void, _canvas: HTMLElement) {
        callback(SVG_CODE);
      },
    };
    const options: MermaidInstallOptions = { engine: { syntax: {} } };

    MermaidCodeEngine.install(options, { mermaidAPI });

    expect(options.engine.syntax.codeBlock?.customRenderer.mermaid).toBeInstanceOf(MermaidCodeEngine);
    expect(initialize).toHaveBeenCalledOnce();
  });

  it('renders Mermaid v9 SVG synchronously and caches the result', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const engine = createEngine();
    const initialize = vi.fn();
    const render = vi.fn((graphId: string, _source: string, callback: (svg: string) => void, canvas: HTMLElement) => {
      appendMeasuredSvg(canvas, graphId);
      callback(SVG_CODE);
    });
    const renderer = new MermaidCodeEngine({ mermaidAPI: { initialize, render } });

    const html = renderer.render('graph TD; A-->B', 'diagram', engine, {});
    const cached = renderer.render('graph TD; A-->B', 'another-sign', engine, {});

    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 320 180"');
    expect(html).toContain('max-width: 100%');
    expect(cached).toBe(html);
    expect(render).toHaveBeenCalledOnce();
  });

  it('converts rendered SVG to an image when configured', () => {
    const engine = createEngine();
    const initialize = vi.fn();
    const render = vi.fn((graphId: string, _source: string, callback: (svg: string) => void, canvas: HTMLElement) => {
      appendMeasuredSvg(canvas, graphId);
      callback(SVG_CODE);
    });
    const renderer = new MermaidCodeEngine({ mermaidAPI: { initialize, render } });

    const html = renderer.render('graph TD; A-->B', 'diagram', engine, { mermaidConfig: { svg2img: true } });

    expect(html).toContain('class="svg-img"');
    expect(html).toContain('data:image/svg+xml,');
  });

  it('renders Mermaid v10 asynchronously and completes placeholders', async () => {
    const engine = createEngine();
    const initialize = vi.fn();
    const render = vi.fn(async (graphId: string, _source: string, canvas: HTMLElement) => {
      appendMeasuredSvg(canvas, graphId);
      return { svg: SVG_CODE };
    });
    Object.assign(window, { mermaid: { initialize, render } });
    const renderer = new MermaidCodeEngine();
    const fallback = vi.fn(() => '<div data-sign="diagram" data-type="codeBlock">source</div>');
    const updateCache = vi.fn();

    const initial = renderer.render('graph TD; A-->B', 'diagram', engine, { fallback, updateCache });

    expect(initial).toContain('source');
    await vi.waitFor(() => expect(updateCache).toHaveBeenCalledWith(expect.stringContaining('<svg')));
    expect(engine.asyncRenderHandler.add).toHaveBeenCalledOnce();
    expect(engine.asyncRenderHandler.done).toHaveBeenCalledOnce();
    expect(engine.$cherry.wrapperDom.querySelector('svg')).toBeNull();
  });

  it('falls back to source when asynchronous rendering fails', async () => {
    const engine = createEngine();
    const initialize = vi.fn();
    const render = vi.fn(async () => {
      throw new Error('invalid diagram');
    });
    Object.assign(window, { mermaid: { initialize, render } });
    const renderer = new MermaidCodeEngine();
    const fallback = vi.fn(() => '<pre>invalid source</pre>');
    const updateCache = vi.fn();

    expect(renderer.render('invalid', 'diagram', engine, { fallback, updateCache })).toBe('<pre>invalid source</pre>');

    await vi.waitFor(() => expect(updateCache).toHaveBeenCalledWith('<pre>invalid source</pre>'));
    expect(engine.asyncRenderHandler.done).toHaveBeenCalledOnce();
  });

  it('evicts old successful cache entries and coordinates render slots', async () => {
    const renderer = new MermaidCodeEngine();
    renderer.contentRenderCacheMax = 1;

    renderer.$setCachedRenderHtml('first', undefined, '<svg>first</svg>');
    renderer.$setCachedRenderHtml('ignored', undefined, '<pre>not rendered</pre>');
    renderer.$setCachedRenderHtml('second', undefined, '<svg>second</svg>');

    expect(renderer.$getCachedRenderHtml('first', undefined)).toBe('');
    expect(renderer.$getCachedRenderHtml('second', undefined)).toBe('<svg>second</svg>');

    await renderer.acquireRenderSlot();
    let acquired = false;
    const waiting = renderer.acquireRenderSlot().then(() => {
      acquired = true;
    });
    expect(acquired).toBe(false);
    renderer.releaseRenderSlot();
    await waiting;
    expect(acquired).toBe(true);
    renderer.releaseRenderSlot();
    expect(renderer.activeRenderCount).toBe(0);
  });

  it('selects the top-level async API when a nested API also exists', () => {
    const initialize = vi.fn();
    const render = vi.fn(async (_id: string, _source: string, _canvas: HTMLElement) => ({ svg: SVG_CODE }));
    const nestedInitialize = vi.fn();
    const nestedRender = vi.fn(async (_id: string, _source: string, _canvas: HTMLElement) => ({ svg: SVG_CODE }));
    Object.assign(window, {
      mermaid: {
        initialize,
        render,
        mermaidAPI: { initialize: nestedInitialize, render: nestedRender },
      },
    });

    const renderer = new MermaidCodeEngine();

    expect(renderer.mermaidAPIRefs).toBe(window.mermaid);
    expect(initialize).toHaveBeenCalledOnce();
    expect(nestedInitialize).not.toHaveBeenCalled();
  });

  it('mounts reusable and isolated canvases in configured containers', () => {
    const customContainer = document.createElement('section');
    document.body.appendChild(customContainer);
    const renderer = new MermaidCodeEngine({ mermaidCanvasAppendDom: customContainer });
    const engine = createEngine();

    renderer.mountMermaidCanvas(engine);
    const shared = renderer.mermaidCanvas;
    renderer.mountMermaidCanvas(engine);
    expect(renderer.mermaidCanvas).toBe(shared);
    expect(customContainer.contains(shared)).toBe(true);

    // @ts-expect-error The renderer only needs the minimal engine fields provided by this fixture.
    const isolated = renderer.createAsyncRenderCanvas(engine);
    expect(customContainer.contains(isolated)).toBe(true);
    renderer.destroyAsyncRenderCanvas(isolated);
    expect(customContainer.contains(isolated)).toBe(false);
    expect(() => renderer.destroyAsyncRenderCanvas(isolated)).not.toThrow();
  });

  it('normalizes existing viewBoxes and degrades malformed SVG safely', () => {
    const renderer = new MermaidCodeEngine();
    const host = document.createElement('div');
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    shadow.id = 'viewbox-graph';
    Object.defineProperty(shadow, 'getBBox', { value: () => ({ width: 99, height: 88 }) });
    host.appendChild(shadow);
    document.body.appendChild(host);
    const originalViewBox = Object.getOwnPropertyDescriptor(SVGSVGElement.prototype, 'viewBox');
    Object.defineProperty(SVGSVGElement.prototype, 'viewBox', {
      configurable: true,
      get: () => ({ baseVal: { width: 640, height: 360 } }),
    });

    try {
      const normalized = renderer.processSvgCode(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%" markerUnits="0" x="NaN"><br></svg>',
        'viewbox-graph',
      );
      expect(normalized).toContain('width="640"');
      expect(normalized).toContain('height="360"');
      expect(normalized).not.toContain('markerUnits="0"');
      expect(normalized).not.toContain('x="NaN"');
      expect(normalized).toContain('<br/>');
    } finally {
      if (originalViewBox) {
        Object.defineProperty(SVGSVGElement.prototype, 'viewBox', originalViewBox);
      } else {
        Reflect.deleteProperty(SVGSVGElement.prototype, 'viewBox');
      }
    }

    expect(renderer.convertMermaidSvgToImg('<not-svg data-test="fallback">content</not-svg>', 'missing')).toContain(
      '<not-svg',
    );
    expect(renderer.convertMermaidSvgToImg('<svg data-test="fallback">content</svg>', 'missing')).toContain(
      'max-width:100%',
    );
  });

  it('uses the previous synchronous render only for active flow sessions', () => {
    const engine = createEngine();
    const renderError = { str: 'diagram parse error' };
    const render = vi.fn(() => {
      throw renderError;
    });
    const renderer = new MermaidCodeEngine({ mermaidAPI: { initialize: vi.fn(), render } });
    renderer.lastRenderedCode = '<svg>previous</svg>';

    engine.$cherry.options.engine.global.flowSessionContext = true;
    expect(renderer.syncRender('graph', 'invalid', 'sign', engine)).toBe('<svg>previous</svg>');

    engine.$cherry.options.engine.global.flowSessionContext = false;
    expect(renderer.syncRender('graph', 'invalid', 'sign', engine)).toBe('diagram parse error');
  });

  it('replaces ordinary and toolbar placeholders while preserving source panels', () => {
    const engine = createEngine();
    engine.$cherry.wrapperDom.innerHTML = [
      '<section class="ordinary"><div data-sign="diagram" data-type="codeBlock">source</div></section>',
      '<figure data-type="mermaid"><div class="cherry-mermaid-source-toolbar-panel" data-mode="preview"><div data-sign="toolbar" data-type="codeBlock">preview source</div></div><div data-mode="source"><div data-sign="toolbar" data-type="codeBlock">kept source</div></div></figure>',
    ].join('');
    const renderer = new MermaidCodeEngine();
    const updateCache = vi.fn();

    renderer.handleAsyncRenderDone('ordinary-id', 'diagram', engine, { updateCache }, '<svg>ordinary</svg>');
    expect(engine.$cherry.wrapperDom.querySelector('.ordinary')?.innerHTML).toBe('<svg>ordinary</svg>');
    const ordinaryDoneOptions = engine.asyncRenderHandler.done.mock.calls[0][1];
    expect(ordinaryDoneOptions.replacer('<div data-sign="diagram" data-type="codeBlock">source</div>')).toBe(
      '<svg>ordinary</svg>',
    );

    renderer.handleAsyncRenderDone(
      'toolbar-id',
      'toolbar',
      engine,
      { updateCache, showSourceToolbar: true },
      '<svg>toolbar</svg>',
    );
    expect(engine.$cherry.wrapperDom.querySelector('[data-mode="preview"]')?.innerHTML).toBe('<svg>toolbar</svg>');
    expect(engine.$cherry.wrapperDom.querySelector('[data-mode="source"]')?.textContent).toContain('kept source');
    const toolbarDoneOptions = engine.asyncRenderHandler.done.mock.calls[1][1];
    expect(toolbarDoneOptions.replacer('unchanged markdown')).toBe('unchanged markdown');
    expect(updateCache).toHaveBeenCalledTimes(2);
  });

  it('resolves delayed globals and tolerates repeated initialization errors', () => {
    const renderer = new MermaidCodeEngine();
    expect(renderer.tryResolveMermaidAPIRefs()).toBe(false);

    const initialize = vi.fn(() => {
      throw new Error('already initialized');
    });
    const render = vi.fn((_id: string, _source: string, callback: (svg: string) => void) => callback(SVG_CODE));
    Object.assign(window, { mermaidAPI: { initialize, render } });

    expect(renderer.tryResolveMermaidAPIRefs()).toBe(true);
    expect(renderer.tryResolveMermaidAPIRefs()).toBe(true);
    expect(renderer.mermaidAPIRefs).toBe(window.mermaidAPI);
  });

  it('loads configured Mermaid scripts once and resets state after failures', async () => {
    const renderer = new MermaidCodeEngine();
    const initialize = vi.fn();
    const render = vi.fn(async (_id: string, _source: string, _canvas: HTMLElement) => ({ svg: SVG_CODE }));
    let resolveLoad: (() => void) | undefined;
    loadScriptMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    expect(renderer.ensureMermaidLoaded({ mermaidConfig: {} })).toBe(false);
    expect(renderer.ensureMermaidLoaded({ mermaidConfig: { src: 123 } })).toBe(false);
    expect(renderer.ensureMermaidLoaded({ mermaidConfig: { src: '/mermaid.js' } })).toBe(true);
    expect(renderer.ensureMermaidLoaded({ mermaidConfig: { src: '/mermaid.js' } })).toBe(true);
    Object.assign(window, { mermaid: { initialize, render } });
    resolveLoad?.();
    await vi.waitFor(() => expect(renderer.mermaidScriptLoaded).toBe(true));
    expect(renderer.mermaidAPIRefs).toBe(window.mermaid);

    delete window.mermaid;
    const failed = new MermaidCodeEngine();
    loadScriptMock.mockRejectedValueOnce(new Error('network'));
    expect(failed.ensureMermaidLoaded({ mermaidConfig: { src: '/failed.js' } })).toBe(true);
    await vi.waitFor(() => expect(failed.mermaidScriptLoading).toBe(false));
    expect(failed.mermaidScriptLoaded).toBe(false);
  });

  it('returns cached async HTML and completes exhausted initialization retries', () => {
    const engine = createEngine();
    const renderer = new MermaidCodeEngine();
    // @ts-expect-error The cache helper only needs hash() from this minimal engine fixture.
    renderer.$setCachedRenderHtml('cached', engine, '<svg>cached</svg>');
    const cachedProps = { fallback: vi.fn(() => '<pre>source</pre>'), updateCache: vi.fn() };
    expect(renderer.asyncRender('cached-id', 'cached', 'cached-sign', engine, cachedProps)).toBe('<svg>cached</svg>');

    const fallback = vi.fn(() => '<pre>missing Mermaid</pre>');
    const updateCache = vi.fn();
    expect(() =>
      renderer.asyncRender('missing-id', 'missing', 'missing-sign', engine, { fallback, updateCache }, 60),
    ).toThrow('Package mermaid or mermaidAPI not found');
    expect(updateCache).toHaveBeenCalledWith('<pre>missing Mermaid</pre>');
    expect(engine.asyncRenderHandler.done).toHaveBeenCalledWith('missing-id', expect.any(Object));
  });

  it('keeps the last async image after a preview-only flow failure', async () => {
    const engine = createEngine();
    engine.$cherry.options.engine.global.flowSessionContext = true;
    engine.$cherry.status.editor = 'hide';
    const render = vi.fn(async () => {
      throw new Error('incomplete stream');
    });
    Object.assign(window, { mermaid: { initialize: vi.fn(), render } });
    const renderer = new MermaidCodeEngine();
    renderer.lastRenderedCode = '<svg>last valid diagram</svg>';
    const fallback = vi.fn(() => '<pre>stream source</pre>');

    expect(renderer.asyncRender('stream-id', 'stream', 'stream-sign', engine, { fallback, updateCache: vi.fn() })).toBe(
      '<pre>stream source</pre>',
    );
    await vi.waitFor(() => expect(renderer.needReturnLastRenderedCode).toBe(true));
    expect(engine.asyncRenderHandler.done).not.toHaveBeenCalled();
  });

  it('renders a fenced Mermaid block through CherryEngine', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const initialize = vi.fn();
    const render = vi.fn((graphId: string, _source: string, callback: (svg: string) => void, canvas: HTMLElement) => {
      appendMeasuredSvg(canvas, graphId);
      callback(SVG_CODE);
    });
    const options: MermaidInstallOptions = { engine: { syntax: {} } };
    MermaidCodeEngine.install(options, { mermaidAPI: { initialize, render } });
    const engine = new CherryEngine(options);
    const container = document.createElement('div');
    // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
    container.innerHTML = engine.makeHtml('```mermaid\ngraph TD; A-->B\n```');
    const figure = container.querySelector('figure[data-type="mermaid"]');
    const svg = figure?.querySelector('svg');

    expect(figure).not.toBeNull();
    expect(figure?.querySelector('pre')).toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 320 180');
    expect(svg?.textContent).toBe('A to B');
  });

  it('covers fallback containers, generated signs, and explicit loader guards', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.12345678);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const engine = createEngine();
    const initialize = vi.fn();
    const render = vi.fn((graphId: string, _source: string, callback: (svg: string) => void, canvas: HTMLElement) => {
      appendMeasuredSvg(canvas, graphId);
      callback(SVG_CODE);
    });
    const explicit = new MermaidCodeEngine({ mermaidAPI: { initialize, render } });
    expect(explicit.ensureMermaidLoaded({ mermaidConfig: { src: '/unused.js' } })).toBe(false);
    expect(explicit.render('graph TD; A-->B', '', engine, {})).toContain('<svg');

    const bodyEngine = {
      ...engine,
      $cherry: { ...engine.$cherry, wrapperDom: undefined },
    };
    const bodyRenderer = new MermaidCodeEngine();
    // @ts-expect-error This fixture intentionally omits wrapperDom to verify the document.body fallback.
    const canvas = bodyRenderer.createAsyncRenderCanvas(bodyEngine);
    expect(canvas.parentElement).toBe(document.body);
    bodyRenderer.destroyAsyncRenderCanvas(canvas);

    const missing = new MermaidCodeEngine();
    const fallback = vi.fn(() => '<pre>waiting</pre>');
    expect(
      missing.asyncRender('waiting-id', 'waiting', 'waiting-sign', engine, {
        fallback,
        updateCache: vi.fn(),
      }),
    ).toBe('<pre>waiting</pre>');
    expect(engine.asyncRenderHandler.add).toHaveBeenCalledWith('waiting-id');
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    vi.clearAllTimers();

    const asyncRender = vi.fn(async (_id: string, _source: string, canvasElement: HTMLElement) => {
      appendMeasuredSvg(canvasElement, 'flow-return-id');
      return { svg: SVG_CODE };
    });
    Object.assign(window, { mermaid: { initialize: vi.fn(), render: asyncRender } });
    const flowing = new MermaidCodeEngine();
    flowing.needReturnLastRenderedCode = true;
    flowing.lastRenderedCode = '<svg>last</svg>';
    expect(
      flowing.asyncRender('flow-return-id', 'flow source', 'flow-sign', engine, {
        fallback: vi.fn(() => '<pre>source</pre>'),
        updateCache: vi.fn(),
        mermaidConfig: { svg2img: null },
      }),
    ).toBe('<svg>last</svg>');
    await vi.runAllTimersAsync();
    await vi.waitFor(() =>
      expect(engine.asyncRenderHandler.done).toHaveBeenCalledWith('flow-return-id', expect.any(Object)),
    );
  });
});
