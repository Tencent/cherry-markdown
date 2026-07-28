import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createPreviewer, createRect } from './helpers/previewer';

function attachEditor(previewer: ReturnType<typeof createPreviewer>['previewer']) {
  const editorDom = document.createElement('div');
  const requestMeasure = vi.fn();
  const scrollToLineNum = vi.fn();
  const editor = {
    options: { editorDom },
    editor: { view: { requestMeasure } },
    scrollToLineNum,
  };
  Reflect.set(previewer, 'editor', editor);
  return { editor, editorDom, requestMeasure, scrollToLineNum };
}

function setLayoutRects(editorDom: HTMLElement, previewerDom: HTMLElement) {
  vi.spyOn(editorDom, 'getBoundingClientRect').mockReturnValue(createRect(10, 20, 600, 400));
  vi.spyOn(previewerDom, 'getBoundingClientRect').mockReturnValue(createRect(610, 20, 400, 400));
  Object.defineProperty(editorDom, 'offsetTop', { configurable: true, value: 20 });
}

describe('Previewer layout and modes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('clamps real and virtual layouts to the configured minimum width', () => {
    const { previewer, previewerDom, emit } = createPreviewer();
    const { editorDom } = attachEditor(previewer);
    setLayoutRects(editorDom, previewerDom);

    expect(previewer.calculateRealLayout(100)).toEqual({
      editorPercentage: '20%',
      previewerPercentage: '80%',
    });
    expect(previewer.calculateRealLayout(500)).toEqual({
      editorPercentage: '50%',
      previewerPercentage: '50%',
    });
    expect(previewer.calculateRealLayout(900)).toEqual({
      editorPercentage: '80%',
      previewerPercentage: '20%',
    });
    expect(previewer.calculateVirtualLayout(10, 50)).toEqual({ startWidth: 10, leftWidth: 200, rightWidth: 800 });
    expect(previewer.calculateVirtualLayout(10, 950)).toEqual({ startWidth: 10, leftWidth: 800, rightWidth: 200 });
    expect(previewer.calculateVirtualLayout(10, 510)).toEqual({ startWidth: 10, leftWidth: 500, rightWidth: 500 });

    previewer.setRealLayout('', '');
    expect(editorDom.style.width).toBe('50%');
    expect(previewerDom.style.width).toBe('50%');
    expect(emit).toHaveBeenCalledWith('layoutChange');
  });

  it('synchronizes real element rectangles into masks and the drag line', () => {
    const { previewer, previewerDom } = createPreviewer();
    const { editorDom } = attachEditor(previewer);
    setLayoutRects(editorDom, previewerDom);

    previewer.syncVirtualLayoutFromReal();

    expect(previewer.options.virtualDragLineDom.style.cssText).toContain('left: 600px');
    expect(previewer.options.virtualDragLineDom.style.cssText).toContain('top: 20px');
    expect(previewer.options.editorMaskDom.style.width).toBe('600px');
    expect(previewer.options.previewerMaskDom.style.left).toBe('600px');
    expect(previewer.options.previewerMaskDom.style.width).toBe('400px');

    vi.spyOn(previewerDom, 'getBoundingClientRect').mockReturnValue(createRect(0, 20, 0, 400));
    previewer.syncVirtualLayoutFromReal();
    expect(previewer.options.previewerMaskDom.style.left).toBe('0px');
    expect(previewer.options.previewerMaskDom.style.width).toBe('0px');

    previewer.setVirtualLayout(25, 300, 700);
    expect(previewer.options.editorMaskDom.style.left).toBe('0px');
    expect(previewer.options.editorMaskDom.style.width).toBe('300px');
    expect(previewer.options.virtualDragLineDom.style.left).toBe('300px');
    expect(previewer.options.previewerMaskDom.style.width).toBe('700px');
  });

  it('returns early when stream mode has no editor layout', () => {
    const { previewer, previewerDom, emit } = createPreviewer();
    vi.spyOn(previewerDom, 'getBoundingClientRect').mockReturnValue(createRect(0, 0, 400, 400));

    expect(previewer.syncVirtualLayoutFromReal()).toBeUndefined();
    expect(previewer.calculateRealLayout(100)).toEqual({ editorPercentage: '25%', previewerPercentage: '75%' });
    expect(previewer.calculateVirtualLayout(0, 100)).toEqual({ startWidth: 0, leftWidth: 100, rightWidth: 300 });
    previewer.setRealLayout('40%', '60%');

    expect(previewer.options.previewerDom.style.width).toBe('60%');
    expect(emit).toHaveBeenCalledWith('layoutChange');
  });

  it('updates drag masks and commits pane widths through mouse interaction', () => {
    const { previewer, previewerDom } = createPreviewer();
    const { editorDom, requestMeasure } = attachEditor(previewer);
    setLayoutRects(editorDom, previewerDom);

    previewer.bindDrag();
    previewer.options.virtualDragLineDom.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, bubbles: true }));

    expect(previewer.options.virtualDragLineDom.classList.contains('cherry-drag--show')).toBe(true);
    expect(previewer.options.editorMaskDom.classList.contains('cherry-editor-mask--show')).toBe(true);
    expect(editorDom.classList.contains('no-select')).toBe(true);

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 410, bubbles: true }));
    expect(previewer.options.editorMaskDom.style.width).toBe('400px');

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 510, bubbles: true }));
    expect(editorDom.style.width).toBe('50%');
    expect(previewerDom.style.width).toBe('50%');
    expect(previewer.options.virtualDragLineDom.classList.contains('cherry-drag--show')).toBe(false);
    expect(requestMeasure).toHaveBeenCalledOnce();
  });

  it('switches between edit-only and preview-only while preserving cached HTML', () => {
    const { previewer, previewerDom, emit } = createPreviewer();
    const { editorDom, requestMeasure } = attachEditor(previewer);
    setLayoutRects(editorDom, previewerDom);
    previewer.refresh('<p data-sign="cached" data-lines="1">cached content</p>');

    previewer.editOnly();

    expect(previewerDom.classList.contains('cherry-previewer--hidden')).toBe(true);
    expect(editorDom.classList.contains('cherry-editor--full')).toBe(true);
    expect(previewer.options.previewerCache.html).toContain('cached content');
    expect(emit).toHaveBeenCalledWith('previewerClose');
    expect(emit).toHaveBeenCalledWith('editorOpen');

    previewer.previewOnly();
    vi.runOnlyPendingTimers();

    expect(previewerDom.classList.contains('cherry-previewer--full')).toBe(true);
    expect(editorDom.classList.contains('cherry-editor--hidden')).toBe(true);
    expect(previewerDom.textContent).toBe('cached content');
    expect(previewer.options.previewerCache.htmlChanged).toBe(false);
    expect(emit).toHaveBeenCalledWith('previewerOpen');
    expect(emit).toHaveBeenCalledWith('editorClose');
    expect(requestMeasure).toHaveBeenCalledTimes(2);
  });

  it('recovers the stored dual-pane layout and applies pending HTML', () => {
    const { previewer, previewerDom, emit } = createPreviewer();
    const { editorDom, requestMeasure } = attachEditor(previewer);
    setLayoutRects(editorDom, previewerDom);
    previewer.options.previewerCache.layout = {
      editorPercentage: '35%',
      previewerPercentage: '65%',
    };
    previewer.doHtmlCache('<p data-sign="pending" data-lines="1">pending</p>');
    previewerDom.classList.add('cherry-previewer--hidden');
    editorDom.classList.add('cherry-editor--full');

    previewer.recoverPreviewer();
    vi.runOnlyPendingTimers();

    expect(editorDom.style.width).toBe('35%');
    expect(previewerDom.style.width).toBe('65%');
    expect(previewerDom.classList.contains('cherry-previewer--hidden')).toBe(false);
    expect(previewerDom.textContent).toBe('pending');
    expect(previewer.options.previewerCache.htmlChanged).toBe(false);
    expect(emit).toHaveBeenCalledWith('previewerOpen');
    expect(emit).toHaveBeenCalledWith('editorOpen');
    expect(requestMeasure).toHaveBeenCalledOnce();
  });

  it('delegates float preview creation and recovery to Cherry', () => {
    const { previewer, previewerDom, cherry } = createPreviewer();
    const { editorDom } = attachEditor(previewer);
    setLayoutRects(editorDom, previewerDom);
    const createFloatPreviewer = vi.fn();
    const clearFloatPreviewer = vi.fn();
    Reflect.set(cherry, 'createFloatPreviewer', createFloatPreviewer);
    Reflect.set(cherry, 'clearFloatPreviewer', clearFloatPreviewer);
    vi.spyOn(previewer, 'recoverPreviewer').mockImplementation(() => {});

    previewer.floatPreviewer();
    expect(createFloatPreviewer).toHaveBeenCalledOnce();
    expect(editorDom.style.width).toBe('100%');
    expect(previewerDom.style.width).toBe('100%');

    previewer.recoverFloatPreviewer();
    expect(previewer.recoverPreviewer).toHaveBeenCalledWith(true);
    expect(clearFloatPreviewer).toHaveBeenCalledOnce();
  });

  it('reports float and configured float-on-close state', () => {
    const { previewer, wrapperDom } = createPreviewer();

    expect(previewer.isPreviewerFloat()).toBe(false);
    wrapperDom.insertAdjacentHTML('beforeend', '<div class="float-previewer-wrap"></div>');
    expect(previewer.isPreviewerFloat()).toBe(true);
    expect(previewer.isPreviewerNeedFloat()).toBe(false);
    previewer.options.floatWhenClosePreviewer = true;
    expect(previewer.isPreviewerNeedFloat()).toBe(true);
  });

  it('removes editor-only controls for non-editable flow previews', () => {
    const { previewer, previewerDom, wrapperDom, cherry } = createPreviewer();
    const { editorDom } = attachEditor(previewer);
    setLayoutRects(editorDom, previewerDom);
    wrapperDom.appendChild(editorDom);
    Reflect.set(cherry.options.engine.global, 'flowSessionContext', true);
    previewer.options.enablePreviewerBubble = false;
    const toolbarDom = document.createElement('div');
    wrapperDom.appendChild(toolbarDom);
    Reflect.set(cherry, 'toolbar', { options: { dom: toolbarDom } });
    ['cherry-dropdown', 'cherry-suggester-panel'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      wrapperDom.appendChild(element);
    });

    previewer.$dealEditAndPreviewOnly(false);

    expect(editorDom.isConnected).toBe(false);
    expect(toolbarDom.isConnected).toBe(false);
    expect(wrapperDom.querySelector('.cherry-dropdown')).toBeNull();
    expect(wrapperDom.querySelector('.cherry-suggester-panel')).toBeNull();
  });

  it('uses an existing edit cache and tolerates editor measurement failures', () => {
    const { previewer, previewerDom } = createPreviewer();
    const { editorDom } = attachEditor(previewer);
    setLayoutRects(editorDom, previewerDom);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Reflect.set(previewer, 'editor', {
      options: { editorDom },
      editor: {
        view: {
          requestMeasure: () => {
            throw new Error('measure failed');
          },
        },
      },
    });
    previewer.options.previewerCache.html = '<p>already cached</p>';
    previewer.options.previewerCache.layout = { editorPercentage: '40%', previewerPercentage: '60%' };

    previewer.editOnly();
    previewer.recoverPreviewer();
    vi.runOnlyPendingTimers();

    expect(previewer.options.previewerCache.html).toBe('');
    expect(warning).toHaveBeenCalledTimes(2);
  });
});

describe('Previewer observer and lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('updates toolbar positions from ResizeObserver and ignores callbacks after destroy', () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    class TestResizeObserver {
      observe = observe;
      disconnect = disconnect;

      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
    }
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    const { previewer, cherry, emit } = createPreviewer();
    const toolbar = { updateSubMenuPosition: vi.fn() };
    const sidebar = { updateSubMenuPosition: vi.fn() };
    Reflect.set(cherry, 'toolbar', toolbar);
    Reflect.set(cherry, 'sidebar', sidebar);
    vi.spyOn(previewer, 'syncVirtualLayoutFromReal').mockImplementation(() => {});

    previewer.onSizeChange();
    expect(observe).toHaveBeenCalledWith(cherry.wrapperDom);
    resizeCallback?.([], Reflect.get(previewer, 'resizeObserver'));
    expect(previewer.syncVirtualLayoutFromReal).toHaveBeenCalledOnce();
    expect(toolbar.updateSubMenuPosition).toHaveBeenCalledOnce();
    expect(sidebar.updateSubMenuPosition).toHaveBeenCalledOnce();
    expect(emit).toHaveBeenCalledWith('editor.size.change');

    previewer.onSizeChange();
    expect(disconnect).toHaveBeenCalledOnce();
    Reflect.set(previewer, 'isDestroyed', true);
    resizeCallback?.([], Reflect.get(previewer, 'resizeObserver'));
    expect(previewer.syncVirtualLayoutFromReal).toHaveBeenCalledOnce();
  });

  it('registers callback arrays and rejects missing callbacks', () => {
    const { previewer } = createPreviewer();
    const first = vi.fn();
    const second = vi.fn();

    previewer.registerAfterUpdate([first, second]);
    previewer.afterUpdate();

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(() => previewer.registerAfterUpdate(undefined)).toThrow('registerAfterUpdate params are undefined');
  });

  it('destroys listeners, observers, rendering helpers, timers, and object references once', () => {
    vi.useFakeTimers();
    const { previewer, lazyLoadImg } = createPreviewer();
    const removeScroll = vi.spyOn(previewer, 'removeScroll').mockImplementation(() => {});
    const disconnect = vi.fn();
    const bubbleDestroy = vi.fn();
    Reflect.set(previewer, 'resizeObserver', { disconnect });
    Reflect.set(previewer, 'previewerBubble', { destroy: bubbleDestroy });
    Reflect.set(previewer, 'wheelHandler', vi.fn());
    Reflect.set(
      previewer,
      'syncScrollLockTimer',
      window.setTimeout(() => {}, 100),
    );
    Reflect.set(previewer, 'animation', { timer: requestAnimationFrame(() => {}) });

    previewer.destroy();

    expect(removeScroll).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(lazyLoadImg.destroy).toHaveBeenCalledOnce();
    expect(bubbleDestroy).toHaveBeenCalledOnce();
    expect(Reflect.get(previewer, 'syncScrollLockTimer')).toBe(0);
    expect(Reflect.get(previewer, '$cherry')).toBeNull();
    expect(Reflect.get(previewer, 'editor')).toBeNull();
    expect(Reflect.get(previewer, 'options')).toBeNull();

    previewer.destroy();
    expect(removeScroll).toHaveBeenCalledOnce();
  });
});
