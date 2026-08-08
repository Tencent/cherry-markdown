import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createPreviewer } from './helpers/previewer';

const initializationMocks = vi.hoisted(() => ({
  lazyInstances: [] as Array<{ doLazyLoad: ReturnType<typeof vi.fn> }>,
  bubbleInstances: [] as Array<{ destroy: ReturnType<typeof vi.fn> }>,
}));

vi.mock('../src/utils/lazyLoadImg', () => ({
  default: class TestLazyLoadImg {
    doLazyLoad = vi.fn();
    destroy = vi.fn();

    constructor() {
      initializationMocks.lazyInstances.push(this);
    }
  },
}));

vi.mock('../src/toolbars/PreviewerBubble', () => ({
  default: class TestPreviewerBubble {
    destroy = vi.fn();

    constructor() {
      initializationMocks.bubbleInstances.push(this);
    }
  },
}));

describe('Previewer initialization', () => {
  afterEach(() => {
    initializationMocks.lazyInstances.length = 0;
    initializationMocks.bubbleInstances.length = 0;
    vi.restoreAllMocks();
  });

  it('initializes editor integrations, lazy loading, and mobile preview', () => {
    const { previewer, cherry } = createPreviewer();
    Reflect.set(cherry.options.previewer, 'isMobilePreview', true);
    const codemirrorModule = { name: 'codemirror' };
    class TestEditor {
      static codemirrorModule = codemirrorModule;
    }
    const editor = new TestEditor();
    const bindScroll = vi.spyOn(previewer, 'bindScroll').mockImplementation(() => {});
    const bindDrag = vi.spyOn(previewer, 'bindDrag').mockImplementation(() => {});
    const bindClick = vi.spyOn(previewer, 'bindClick').mockImplementation(() => {});
    const onMouseDown = vi.spyOn(previewer, 'onMouseDown').mockImplementation(() => {});
    const onSizeChange = vi.spyOn(previewer, 'onSizeChange').mockImplementation(() => {});
    const mobile = vi.spyOn(previewer, 'changePreviewToMobile').mockImplementation(() => {});

    previewer.init(editor as never);

    expect(bindScroll).toHaveBeenCalledOnce();
    expect(bindDrag).toHaveBeenCalledOnce();
    expect(bindClick).toHaveBeenCalledOnce();
    expect(onMouseDown).toHaveBeenCalledOnce();
    expect(onSizeChange).toHaveBeenCalledOnce();
    expect(mobile).toHaveBeenCalledWith(true);
    expect(Reflect.get(previewer, 'editor')).toBe(editor);
    expect(Reflect.get(previewer, 'codemirrorModule')).toBe(codemirrorModule);
    expect(initializationMocks.lazyInstances).toHaveLength(1);
    expect(initializationMocks.lazyInstances[0].doLazyLoad).toHaveBeenCalledOnce();
    expect(initializationMocks.bubbleInstances).toHaveLength(1);
  });

  it('initializes stream mode without editor or CodeMirror bindings', () => {
    const { previewer } = createPreviewer();
    const bindClick = vi.spyOn(previewer, 'bindClick').mockImplementation(() => {});
    const onMouseDown = vi.spyOn(previewer, 'onMouseDown').mockImplementation(() => {});
    const mobile = vi.spyOn(previewer, 'changePreviewToMobile').mockImplementation(() => {});

    previewer.initWithoutEditor();

    expect(Reflect.get(previewer, 'editor')).toBeNull();
    expect(Reflect.get(previewer, 'codemirrorModule')).toBeNull();
    expect(bindClick).toHaveBeenCalledOnce();
    expect(onMouseDown).toHaveBeenCalledOnce();
    expect(mobile).not.toHaveBeenCalled();
    expect(initializationMocks.lazyInstances[0].doLazyLoad).toHaveBeenCalledOnce();
    expect(initializationMocks.bubbleInstances).toHaveLength(1);
  });

  it('constructs and exposes a preview bubble directly', () => {
    const { previewer } = createPreviewer();

    previewer.$initPreviewerBubble();
    previewer.bindClick();

    expect(initializationMocks.bubbleInstances).toHaveLength(1);
    expect(Reflect.get(previewer, 'previewerBubble')).toBe(initializationMocks.bubbleInstances[0]);
  });

  it('uses null CodeMirror state and mobile wrapping for a minimal editor or stream', () => {
    const first = createPreviewer();
    vi.spyOn(first.previewer, 'bindScroll').mockImplementation(() => {});
    vi.spyOn(first.previewer, 'bindDrag').mockImplementation(() => {});
    vi.spyOn(first.previewer, 'bindClick').mockImplementation(() => {});
    vi.spyOn(first.previewer, 'onMouseDown').mockImplementation(() => {});
    vi.spyOn(first.previewer, 'onSizeChange').mockImplementation(() => {});
    const minimalEditor = {};
    first.previewer.init(Reflect.construct(Object, [minimalEditor]));
    expect(Reflect.get(first.previewer, 'codemirrorModule')).toBeNull();

    const second = createPreviewer();
    Reflect.set(second.cherry.options.previewer, 'isMobilePreview', true);
    vi.spyOn(second.previewer, 'bindClick').mockImplementation(() => {});
    vi.spyOn(second.previewer, 'onMouseDown').mockImplementation(() => {});
    const mobile = vi.spyOn(second.previewer, 'changePreviewToMobile').mockImplementation(() => {});
    second.previewer.initWithoutEditor();
    expect(mobile).toHaveBeenCalledWith(true);
  });

  it('provides callable no-op lazy-load callbacks by default', () => {
    const { previewer } = createPreviewer();
    const image = document.createElement('img');
    const options = previewer.options.lazyLoadImg;

    expect(options.beforeLoadOneImgCallback?.(image)).toBeUndefined();
    expect(options.failLoadOneImgCallback?.(image)).toBeUndefined();
    expect(options.afterLoadOneImgCallback?.(image)).toBeUndefined();
    expect(options.afterLoadAllImgCallback?.()).toBeUndefined();
  });
});
