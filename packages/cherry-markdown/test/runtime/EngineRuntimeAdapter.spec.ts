import { describe, expect, it, vi } from 'vite-plus/test';
import createEngineRuntimeAdapter from '../../src/runtime/EngineRuntimeAdapter';

function createHost(hidden = false) {
  const previewDom = document.createElement('div');
  const emit = vi.fn();
  const refresh = vi.fn();
  const clearFlowSessionCursor = vi.fn();
  const host: any = {
    lastMarkdownText: '# fallback',
    getLocales: () => ({ copy: 'copy' }),
    previewer: {
      refresh,
      getDom: () => previewDom,
      isPreviewerHidden: () => hidden,
      options: { previewerCache: { html: '' } },
    },
    $event: { emit },
    clearFlowSessionCursor,
  };
  return { host, previewDom, emit, refresh, clearFlowSessionCursor };
}

describe('EngineRuntimeAdapter', () => {
  it('bridges host state without exposing it to Engine logic', () => {
    const fixture = createHost();
    const runtime = createEngineRuntimeAdapter(fixture.host, { suggester: class {} });

    expect(runtime.getMarkdown()).toBe('# fallback');
    expect(runtime.getLocales()).toEqual({ copy: 'copy' });
    runtime.onHtmlChange({ markdownText: '# next', html: '<h1>next</h1>' });
    expect(fixture.refresh).toHaveBeenCalledWith('<h1>next</h1>');
    expect(fixture.emit).toHaveBeenCalledWith('afterChange', {
      markdownText: '# next',
      html: '<h1>next</h1>',
    });
  });

  it('applies presentation metadata and async math only in the host adapter', () => {
    const fixture = createHost(true);
    fixture.previewDom.innerHTML =
      '<span class="pending Cherry-Math" data-content="x%5E2"></span>';
    const runtime = createEngineRuntimeAdapter(fixture.host);

    runtime.onFrontMatter({ fontSize: '18px' });
    runtime.renderPendingMath({ className: 'pending', render: (content, display) => `${content}:${display}` });
    runtime.onAsyncRender({ markdownText: '$$x^2$$', html: '<span>x²</span>' });

    expect(fixture.previewDom.style.fontSize).toBe('18px');
    expect(fixture.previewDom.querySelector('.pending')).toBeNull();
    expect(fixture.previewDom.textContent).toBe('x^2:true');
    expect(fixture.host.previewer.options.previewerCache.html).toBe('<span>x²</span>');
    expect(fixture.emit).toHaveBeenCalledWith('afterAsyncRender', {
      markdownText: '$$x^2$$',
      html: '<span>x²</span>',
    });
  });
});
