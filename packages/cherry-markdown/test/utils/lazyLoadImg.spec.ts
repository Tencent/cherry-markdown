import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LazyLoadImg from '../../src/utils/lazyLoadImg';
import { createRect } from '../helpers/previewer';

function createLazyLoad(options = {}) {
  const previewerDom = document.createElement('div');
  vi.spyOn(previewerDom, 'getBoundingClientRect').mockReturnValue(createRect(0, 0, 500, 500));
  const callbacks = {
    beforeLoadOneImgCallback: vi.fn(() => true),
    failLoadOneImgCallback: vi.fn(),
    afterLoadOneImgCallback: vi.fn(),
    afterLoadAllImgCallback: vi.fn(),
  };
  const previewer = { getDomContainer: () => previewerDom };
  const lazyLoad = new LazyLoadImg({ noLoadImgNum: 0, ...callbacks, ...options }, previewer as never);
  return { lazyLoad, previewerDom, callbacks };
}

describe('utils/lazyLoadImg state and HTML conversion', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('tracks loaded, loading, and repeated failure state', () => {
    const { lazyLoad } = createLazyLoad({ maxTryTimesPerSrc: 1 });
    lazyLoad.srcLoadedList.push('loaded.png');
    lazyLoad.srcLoadingList.push('loading.png');

    expect(lazyLoad.isLoaded('loaded.png')).toBe(true);
    expect(lazyLoad.isLoaded('missing.png')).toBe(false);
    expect(lazyLoad.isLoading('loading.png')).toBe(true);
    expect(lazyLoad.isLoading('missing.png')).toBe(false);
    lazyLoad.loadFailed('failed.png');
    expect(lazyLoad.isFailLoadedMax('failed.png')).toBe(false);
    lazyLoad.loadFailed('failed.png');
    expect(lazyLoad.isFailLoadedMax('failed.png')).toBe(true);
  });

  it('reports each newly completed all-images state once', () => {
    const { lazyLoad, callbacks } = createLazyLoad();
    lazyLoad.srcLoadedList.push('one.png');

    expect(lazyLoad.isLoadedAllDone()).toBe(true);
    expect(lazyLoad.isLoadedAllDone()).toBe(false);
    expect(callbacks.afterLoadAllImgCallback).toHaveBeenCalledOnce();
  });

  it('provides callable default lifecycle callbacks', () => {
    const previewerDom = document.createElement('div');
    const lazyLoad: LazyLoadImg = Reflect.construct(LazyLoadImg, [{}, { getDomContainer: () => previewerDom }]);
    const image = document.createElement('img');

    expect(lazyLoad.options.beforeLoadOneImgCallback(image)).toBeUndefined();
    expect(lazyLoad.options.failLoadOneImgCallback(image)).toBeUndefined();
    expect(lazyLoad.options.afterLoadOneImgCallback(image)).toBeUndefined();
    expect(lazyLoad.options.afterLoadAllImgCallback()).toBeUndefined();
  });

  it('converts data-src and strips duplicate src attributes', () => {
    const { lazyLoad } = createLazyLoad();
    const html = '<img class="photo" src="loading.gif" data-src="photo.png" alt="photo">';

    expect(lazyLoad.changeDataSrc2Src(html)).toBe('<img class="photo" src="photo.png" alt="photo">');
    expect(lazyLoad.$removeSrc('class="photo" src="old.png" alt="photo"')).toBe(' class="photo" alt="photo"');
  });

  it('restores only data-src images known to be loaded', () => {
    const { lazyLoad } = createLazyLoad();
    lazyLoad.srcLoadedList.push('loaded.png');
    const loaded = '<img data-src="loaded.png" alt="loaded">';
    const pending = '<img data-src="pending.png" alt="pending">';

    expect(lazyLoad.changeLoadedDataSrc2Src(loaded)).toContain('src="loaded.png"');
    expect(lazyLoad.changeLoadedDataSrc2Src(pending)).toBe(pending);
  });

  it('respects eager counts, loaded sources, forced conversion, and loading placeholders', () => {
    const { lazyLoad } = createLazyLoad({ noLoadImgNum: 1 });
    lazyLoad.srcLoadedList.push('loaded.png');
    const html = [
      '<img src="eager.png">',
      '<img src="loaded.png">',
      '<img src="lazy.png">',
      '<img data-src="existing.png" src="placeholder.png">',
    ].join('');

    const converted = lazyLoad.changeSrc2DataSrc(html);
    expect(converted).toContain('<img src="eager.png">');
    expect(converted).toContain('<img src="loaded.png">');
    expect(converted).toContain('<img data-src="lazy.png">');
    expect(converted).toContain('<img data-src="existing.png" src="placeholder.png">');

    lazyLoad.options.loadingImgPath = 'loading.gif';
    expect(lazyLoad.changeSrc2DataSrc('<img class="photo" src="forced.png">', true)).toBe(
      '<img class="photo" src="loading.gif" data-src="forced.png">',
    );
    lazyLoad.options.noLoadImgNum = -1;
    expect(lazyLoad.changeSrc2DataSrc('<img src="disabled.png">')).toBe('<img src="disabled.png">');
  });
});

describe('utils/lazyLoadImg loading lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads a visible image and runs success callbacks', () => {
    const { lazyLoad, previewerDom, callbacks } = createLazyLoad();
    const image = document.createElement('img');
    image.dataset.src = 'visible.png';
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue(createRect(0, 20, 100, 100));
    previewerDom.appendChild(image);
    vi.spyOn(lazyLoad, 'tryLoadOneImg').mockImplementation((_src, success) => success());

    expect(lazyLoad.loadOneImg()).toBe(false);

    expect(image.getAttribute('src')).toBe('visible.png');
    expect(image.hasAttribute('data-src')).toBe(false);
    expect(lazyLoad.srcLoadedList).toContain('visible.png');
    expect(callbacks.afterLoadOneImgCallback).toHaveBeenCalledWith(image);
  });

  it('skips offscreen, missing, duplicate, and over-concurrency candidates', () => {
    const { lazyLoad, previewerDom } = createLazyLoad({ autoLoadImgNum: 0, maxNumPerTime: 1 });
    const offscreen = document.createElement('img');
    offscreen.dataset.src = 'offscreen.png';
    vi.spyOn(offscreen, 'getBoundingClientRect').mockReturnValue(createRect(0, 900, 100, 100));
    const missing = document.createElement('img');
    missing.setAttribute('data-src', '');
    vi.spyOn(missing, 'getBoundingClientRect').mockReturnValue(createRect(0, 20, 100, 100));
    previewerDom.append(offscreen, missing);
    expect(lazyLoad.loadOneImg()).toBe(false);

    offscreen.dataset.src = 'loading.png';
    vi.spyOn(offscreen, 'getBoundingClientRect').mockReturnValue(createRect(0, 20, 100, 100));
    lazyLoad.srcLoadingList.push('loading.png');
    lazyLoad.loadingImgNum = 1;
    expect(lazyLoad.loadOneImg()).toBe(false);

    lazyLoad.srcLoadingList = [];
    offscreen.dataset.src = 'concurrent.png';
    expect(lazyLoad.loadOneImg()).toBe(false);
  });

  it('retains the original source when the before-load callback removes data-src', () => {
    const beforeLoad = vi.fn((image: HTMLImageElement) => {
      image.removeAttribute('data-src');
      return true;
    });
    const { lazyLoad, previewerDom } = createLazyLoad({ beforeLoadOneImgCallback: beforeLoad });
    const image = document.createElement('img');
    image.dataset.src = 'original.png';
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue(createRect(0, 20, 100, 100));
    previewerDom.appendChild(image);
    const tryLoad = vi.spyOn(lazyLoad, 'tryLoadOneImg').mockImplementation(() => {});

    lazyLoad.loadOneImg();

    expect(tryLoad).toHaveBeenCalledWith('original.png', expect.any(Function), expect.any(Function));
  });

  it('wires native image load and error events to supplied callbacks', () => {
    const { lazyLoad } = createLazyLoad();
    const created: HTMLImageElement[] = [];
    const nativeCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = nativeCreate(tagName);
      if (tagName === 'img') created.push(element);
      return element;
    });
    const success = vi.fn();
    const failure = vi.fn();

    lazyLoad.tryLoadOneImg('success.png', success, failure);
    created[0].onload?.(new Event('load'));
    lazyLoad.tryLoadOneImg('failure.png', success, failure);
    created[1].onerror?.(new Event('error'));

    expect(success).toHaveBeenCalledOnce();
    expect(failure).toHaveBeenCalledOnce();
  });

  it('starts one polling loop and destroys all timers and references', () => {
    const { lazyLoad } = createLazyLoad({ maxNumPerTime: 2 });
    const loadOneImg = vi.spyOn(lazyLoad, 'loadOneImg').mockReturnValue(false);
    const allDone = vi.spyOn(lazyLoad, 'isLoadedAllDone').mockReturnValue(false);

    lazyLoad.doLazyLoad();
    lazyLoad.doLazyLoad();
    expect(loadOneImg).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1000);
    expect(allDone).toHaveBeenCalled();

    lazyLoad.destroy();
    lazyLoad.destroy();
    expect(lazyLoad.isDestroyed).toBe(true);
    expect(lazyLoad.srcLoadedList).toEqual([]);
    expect(Reflect.get(lazyLoad, 'previewer')).toBeNull();
    expect(Reflect.get(lazyLoad, 'previewerDom')).toBeNull();
    expect(Reflect.get(lazyLoad, 'options')).toBeNull();

    const stopped = createLazyLoad().lazyLoad;
    stopped.doLazyLoad();
    stopped.isDestroyed = true;
    vi.advanceTimersByTime(1000);
    stopped.isDestroyed = false;
    stopped.destroy();
  });
});
