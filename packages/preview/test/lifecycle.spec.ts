import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Previewer from '../src/index';

describe('@cherry-markdown/preview lifecycle contract', () => {
  beforeEach(() => {
    // @ts-expect-error build constant
    globalThis.BUILD_ENV = 'production';
  });

  it('owns the Markdown to HTML composition', () => {
    const dom = document.createElement('div');
    const previewer = new Previewer({ previewerDom: dom, lazyLoadImg: { autoLoadImgNum: -1 } });
    previewer.setMarkdown('# Preview');
    expect(previewer.getMarkdown()).toBe('# Preview');
    expect(previewer.getHtml()).toContain('Preview');
  });

  it('uses an injected engine and keeps Markdown and HTML state consistent', () => {
    const dom = document.createElement('div');
    const engine = { makeHtml: vi.fn((markdown: string) => `<p data-sign="p-1">${markdown}</p>`) };
    const previewer = new Previewer({ previewerDom: dom, engineInstance: engine, lazyLoadImg: { autoLoadImgNum: -1 } });

    expect(previewer.setMarkdown('injected')).toBe('<p data-sign="p-1">injected</p>');
    expect(engine.makeHtml).toHaveBeenCalledWith('injected');
    expect(previewer.getMarkdown()).toBe('injected');
    expect(previewer.getHtml()).toContain('injected');
  });

  it('stops DOM updates after destroy', () => {
    const dom = document.createElement('div');
    const previewer = new Previewer({ previewerDom: dom, lazyLoadImg: { autoLoadImgNum: -1 } });
    previewer.setMarkdown('before');
    const before = dom.innerHTML;

    previewer.destroy();
    previewer.setMarkdown('after');

    expect(dom.innerHTML).toBe(before);
  });
});
