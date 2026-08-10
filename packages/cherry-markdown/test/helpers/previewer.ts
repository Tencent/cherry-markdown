import { vi } from 'vite-plus/test';
import Previewer from '../../src/Previewer';

export function createRect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({ x, y, width, height }),
  };
}

export function createPreviewer() {
  const previewerDom = document.createElement('div');
  previewerDom.className = 'cherry-previewer';
  const wrapperDom = document.createElement('div');
  wrapperDom.setAttribute('data-inline-code-theme', 'red');
  wrapperDom.setAttribute('data-code-block-theme', 'dark');
  wrapperDom.appendChild(previewerDom);
  const emit = vi.fn();
  const cherry = {
    getInstanceId: vi.fn(() => 'previewer-test'),
    wrapperDom,
    cherryDom: wrapperDom,
    options: {
      previewer: { isMobilePreview: false },
      engine: { global: { flowSessionContext: false } },
    },
    $event: { emit },
    getFirstLineText: vi.fn(() => 'document'),
    getMarkdown: vi.fn(() => '# Document'),
  };
  const previewer: Previewer = Reflect.construct(Previewer, [
    {
      $cherry: cherry,
      previewerDom,
    },
  ]);
  const lazyLoadImg = {
    changeSrc2DataSrc: vi.fn((html: string) => html.replace(/ src=/g, ' data-src=')),
    changeDataSrc2Src: vi.fn((html: string) => html.replace(/ data-src=/g, ' src=')),
    changeLoadedDataSrc2Src: vi.fn((html: string) => html),
    destroy: vi.fn(),
  };
  Reflect.set(previewer, 'lazyLoadImg', lazyLoadImg);
  const highlightLine = vi.spyOn(previewer, 'highlightLine').mockImplementation(() => {});

  return { previewer, previewerDom, wrapperDom, cherry, emit, lazyLoadImg, highlightLine };
}
