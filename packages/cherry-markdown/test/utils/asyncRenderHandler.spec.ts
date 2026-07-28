import { describe, expect, it, vi } from 'vite-plus/test';
import AsyncRenderHandler from '../../src/utils/async-render-handler';

describe('utils/async-render-handler', () => {
  it('emits immediately when synchronous rendering has no pending work', () => {
    const emit = vi.fn();
    const engine = { $event: { emit } };
    const handler = new AsyncRenderHandler(engine as never);

    handler.handleSyncRenderStart('# title');
    handler.handleSyncRenderCompleted('<h1>title</h1>');

    expect(emit).toHaveBeenCalledWith('afterAsyncRender', {
      markdownText: '# title',
      html: '<h1>title</h1>',
    });
  });

  it('waits for every renderer and applies replacements in completion order', () => {
    const emit = vi.fn();
    const engine = { $event: { emit } };
    const handler = new AsyncRenderHandler(engine as never);
    handler.handleSyncRenderStart('source');
    handler.add('diagram');
    handler.add('formula');
    handler.handleSyncRenderCompleted('<diagram/><formula/>');

    expect(emit).not.toHaveBeenCalled();
    handler.done('missing');
    expect(emit).not.toHaveBeenCalled();

    handler.done('formula', { replacer: (html) => html.replace('<formula/>', '<math/>') });
    expect(emit).not.toHaveBeenCalled();
    handler.done('diagram', { replacer: (html) => html.replace('<diagram/>', '<svg/>') });

    expect(emit).toHaveBeenCalledOnce();
    expect(emit).toHaveBeenCalledWith('afterAsyncRender', {
      markdownText: 'source',
      html: '<svg/><math/>',
    });
  });

  it('uses the engine callback when no event module is available', () => {
    const afterAsyncRender = vi.fn();
    const engine = { options: { callback: { afterAsyncRender } } };
    const handler = new AsyncRenderHandler(engine as never);

    handler.handleSyncRenderStart('markdown');
    handler.handleSyncRenderCompleted('html');

    expect(afterAsyncRender).toHaveBeenCalledWith('markdown', 'html');
  });

  it('clears pending renderers and accumulated content', () => {
    const engine = { options: {} };
    const handler = new AsyncRenderHandler(engine as never);
    handler.handleSyncRenderStart('markdown');
    handler.handleSyncRenderCompleted('html');
    handler.add('pending');

    handler.clear();

    expect(handler.pendingRenderers.size).toBe(0);
    expect(handler.originMd).toBe('');
    expect(handler.md).toBe('');
  });

  it('uses the identity replacer when completion options are omitted', () => {
    const emit = vi.fn();
    const engine = { $event: { emit } };
    const handler = new AsyncRenderHandler(engine as never);
    handler.handleSyncRenderStart('source');
    handler.add('diagram');
    handler.handleSyncRenderCompleted('<svg>diagram</svg>');

    handler.done('diagram');

    expect(handler.md).toBe('<svg>diagram</svg>');
    expect(emit).toHaveBeenCalledWith('afterAsyncRender', {
      markdownText: 'source',
      html: '<svg>diagram</svg>',
    });
  });
});
