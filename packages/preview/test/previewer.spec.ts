import { describe, expect, it, beforeEach } from 'vite-plus/test';
import Previewer from '../src/index';

describe('@cherry-markdown/preview', () => {
  beforeEach(() => {
    // @ts-expect-error 构建注入的全局变量
    globalThis.BUILD_ENV = 'production';
  });

  it('exposes the Previewer constructor', () => {
    expect(typeof Previewer).toBe('function');
  });

  it('creates a previewer with a dom container', () => {
    const dom = document.createElement('div');
    const previewer = new Previewer({ previewerDom: dom });
    expect(previewer.getDomContainer()).toBe(dom);
  });

  it('updates the preview dom with html content', () => {
    const dom = document.createElement('div');
    const previewer = new Previewer({ previewerDom: dom, lazyLoadImg: { autoLoadImgNum: -1 } });
    previewer.update('<h1 data-sign="h1-1">Hello</h1><p data-sign="p-1">World</p>');
    expect(dom.querySelector('h1')?.textContent).toBe('Hello');
    expect(dom.querySelector('p')?.textContent).toBe('World');
  });

  it('returns html via getValue', () => {
    const dom = document.createElement('div');
    const previewer = new Previewer({ previewerDom: dom, lazyLoadImg: { autoLoadImgNum: -1 } });
    previewer.update('<p data-sign="p-1">Hi</p>');
    expect(previewer.getValue()).toContain('Hi');
  });
});
