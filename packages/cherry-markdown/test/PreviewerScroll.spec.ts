import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPreviewer, createRect } from './helpers/previewer';

function defineDimension(element: Element, property: string, value: number | boolean) {
  Object.defineProperty(element, property, { configurable: true, value, writable: true });
}

function addMeasuredBlock(container: HTMLElement, lines: number, offsetTop: number, height: number) {
  const block = document.createElement('p');
  block.dataset.sign = `block-${offsetTop}`;
  block.dataset.lines = String(lines);
  block.style.margin = '0';
  defineDimension(block, 'offsetTop', offsetTop);
  vi.spyOn(block, 'getBoundingClientRect').mockReturnValue(createRect(0, offsetTop, 300, height));
  container.appendChild(block);
  return block;
}

describe('Previewer line positioning and highlighting', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calculates block offsets for single-line, multiline, string, null, and out-of-range positions', () => {
    const { previewer, previewerDom } = createPreviewer();
    defineDimension(previewerDom, 'offsetTop', 0);
    defineDimension(previewerDom, 'scrollHeight', 500);
    addMeasuredBlock(previewerDom, 2, 10, 100);
    addMeasuredBlock(previewerDom, 3, 110, 150);
    const nested = document.createElement('span');
    nested.dataset.sign = 'nested';
    nested.dataset.lines = '10';
    previewerDom.firstElementChild?.appendChild(nested);

    expect(previewer.$getTopByLineNum(null)).toBe(500);
    expect(previewer.$getTopByLineNum('1' as never, 0.5)).toBe(35);
    expect(previewer.$getTopByLineNum(3)).toBe(110);
    expect(previewer.$getTopByLineNum(99)).toBe(500);
  });

  it('highlights only the top-level block for the active editor line', () => {
    const { previewer, previewerDom, cherry, highlightLine } = createPreviewer();
    highlightLine.mockRestore();
    Reflect.set(cherry, 'status', { previewer: 'show', editor: 'show' });
    const first = addMeasuredBlock(previewerDom, 2, 0, 100);
    const second = addMeasuredBlock(previewerDom, 3, 100, 150);
    const nested = document.createElement('span');
    nested.dataset.sign = 'nested';
    nested.dataset.lines = '20';
    first.appendChild(nested);
    first.classList.add('cherry-highlight-line');

    previewer.highlightLine(3);

    expect(first.classList.contains('cherry-highlight-line')).toBe(false);
    expect(second.classList.contains('cherry-highlight-line')).toBe(true);
    expect(Reflect.get(previewer, 'highlightLineNum')).toBe(3);

    Reflect.set(cherry, 'status', { previewer: 'hide', editor: 'show' });
    previewer.highlightLine(1);
    expect(previewerDom.querySelector('.cherry-highlight-line')).toBeNull();

    Reflect.set(cherry, 'status', { previewer: 'show', editor: 'show' });
    expect(previewer.highlightLine(99)).toBeUndefined();
    expect(previewerDom.querySelector('.cherry-highlight-line')).toBeNull();
  });

  it('delegates line and offset scrolling to the animation helper', () => {
    const { previewer, highlightLine } = createPreviewer();
    const getTop = vi.spyOn(previewer, '$getTopByLineNum').mockReturnValue(240);
    const animate = vi.spyOn(previewer, '$scrollAnimation').mockImplementation(() => {});

    previewer.scrollToLineNumWithOffset(8, 40);
    previewer.scrollToLineNum(9, 0.25);

    expect(getTop).toHaveBeenNthCalledWith(1, 8);
    expect(animate).toHaveBeenNthCalledWith(1, 200);
    expect(highlightLine).toHaveBeenCalledWith(8);
    expect(getTop).toHaveBeenNthCalledWith(2, 9, 0.25);
    expect(animate).toHaveBeenNthCalledWith(2, 240);
  });
});

describe('Previewer scroll synchronization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('maps preview top, bottom, and intermediate scrolling back to editor lines', () => {
    const { previewer, previewerDom } = createPreviewer();
    const scrollToLineNum = vi.fn();
    Reflect.set(previewer, 'editor', { scrollToLineNum });
    defineDimension(previewerDom, 'offsetHeight', 100);
    defineDimension(previewerDom, 'scrollHeight', 1000);
    vi.spyOn(previewerDom, 'getBoundingClientRect').mockReturnValue(createRect(0, 0, 300, 100));
    const first = addMeasuredBlock(previewerDom, 2, -20, 100);
    addMeasuredBlock(previewerDom, 3, 80, 150);
    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue(createRect(0, -20, 300, 100));

    previewer.bindScroll();

    previewerDom.scrollTop = 0;
    previewerDom.dispatchEvent(new Event('scroll'));
    expect(scrollToLineNum).toHaveBeenLastCalledWith(0, 0, 1);

    previewerDom.scrollTop = 900;
    previewerDom.dispatchEvent(new Event('scroll'));
    expect(scrollToLineNum).toHaveBeenLastCalledWith(null);

    previewerDom.scrollTop = 100;
    previewerDom.dispatchEvent(new Event('scroll'));
    expect(scrollToLineNum).toHaveBeenLastCalledWith(0, 2, 0.2);

    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue(createRect(0, 20, 300, 100));
    previewerDom.dispatchEvent(new Event('scroll'));
    expect(scrollToLineNum).toHaveBeenLastCalledWith(0, 0, 1);
  });

  it('suppresses scroll feedback while updating, animating, or destroyed', () => {
    const { previewer, previewerDom } = createPreviewer();
    const scrollToLineNum = vi.fn();
    Reflect.set(previewer, 'editor', { scrollToLineNum });
    defineDimension(previewerDom, 'offsetHeight', 100);
    defineDimension(previewerDom, 'scrollHeight', 1000);
    previewerDom.scrollTop = 100;
    previewer.bindScroll();

    Reflect.set(previewer, 'applyingDomChanges', true);
    previewerDom.dispatchEvent(new Event('scroll'));
    Reflect.set(previewer, 'applyingDomChanges', false);
    Reflect.set(previewer, 'disableScrollListener', true);
    previewerDom.dispatchEvent(new Event('scroll'));
    Reflect.set(previewer, 'disableScrollListener', false);
    Reflect.set(previewer, 'isDestroyed', true);
    previewerDom.dispatchEvent(new Event('scroll'));

    expect(scrollToLineNum).not.toHaveBeenCalled();
  });

  it('cancels active animation on wheel and removes the scroll listener', () => {
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);
    const { previewer, previewerDom } = createPreviewer();
    Reflect.set(previewer, 'animation', { timer: 42 });
    Reflect.set(previewer, 'disableScrollListener', true);
    previewer.bindScroll();

    previewerDom.dispatchEvent(new WheelEvent('wheel'));

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(Reflect.get(previewer, 'animation').timer).toBe(0);
    expect(Reflect.get(previewer, 'disableScrollListener')).toBe(false);
    previewer.removeScroll();
    expect(Reflect.get(previewer, 'scrollHandler')).toBeNull();

    Reflect.set(previewer, 'isDestroyed', true);
    Reflect.set(previewer, 'animation', { timer: 21 });
    previewerDom.dispatchEvent(new WheelEvent('wheel'));
    expect(cancelAnimationFrame).not.toHaveBeenCalledWith(21);
  });

  it('uses the preview element or its nearest scrollable ancestor', () => {
    const { previewer, previewerDom, wrapperDom } = createPreviewer();
    defineDimension(previewerDom, 'scrollHeight', window.innerHeight);
    defineDimension(previewerDom, 'clientHeight', window.innerHeight);
    defineDimension(wrapperDom, 'scrollHeight', 400);
    defineDimension(wrapperDom, 'clientHeight', 200);

    expect(previewer.getDomCanScroll()).toBe(wrapperDom);
    defineDimension(previewerDom, 'scrollHeight', window.innerHeight + 100);
    expect(previewer.getDomCanScroll()).toBe(previewerDom);

    const detached = document.createElement('div');
    defineDimension(detached, 'scrollHeight', 100);
    defineDimension(detached, 'clientHeight', window.innerHeight);
    expect(previewer.getDomCanScroll(detached)).toBeUndefined();
  });

  it('returns HTML or BODY when resolving document-level scrolling', () => {
    const { previewer } = createPreviewer();
    defineDimension(document.body, 'scrollHeight', window.innerHeight);
    defineDimension(document.body, 'clientHeight', window.innerHeight);
    defineDimension(document.documentElement, 'scrollHeight', window.innerHeight + 100);
    defineDimension(document.documentElement, 'clientHeight', window.innerHeight);

    expect(previewer.getDomCanScroll(document.body)).toBe(document.documentElement);
    defineDimension(document.documentElement, 'scrollHeight', window.innerHeight);
    expect(previewer.getDomCanScroll(document.body)).toBe(document.body);
  });

  it('scrolls to an absolute top with the requested browser behavior', () => {
    const { previewer, previewerDom } = createPreviewer();
    const scrollTo = vi.fn();
    Reflect.set(previewerDom, 'scrollTo', scrollTo);
    defineDimension(previewerDom, 'scrollHeight', 300);
    defineDimension(previewerDom, 'clientHeight', 100);

    previewer.scrollToTop(125, 'instant');

    expect(scrollTo).toHaveBeenCalledWith({ top: 125, left: 0, behavior: 'instant' });
  });
});

describe('Previewer anchor scrolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns false for missing anchors and scrolls to nested signed anchors', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const { previewer, previewerDom } = createPreviewer();
    const scrollTo = vi.fn();
    Reflect.set(previewerDom, 'scrollTo', scrollTo);
    defineDimension(previewerDom, 'scrollHeight', 500);
    defineDimension(previewerDom, 'clientHeight', 100);
    defineDimension(previewerDom, 'offsetTop', 0);
    vi.spyOn(previewerDom, 'getBoundingClientRect').mockReturnValue(createRect(0, 0, 300, 100));
    const block = addMeasuredBlock(previewerDom, 2, 100, 100);
    block.id = 'block';
    const target = document.createElement('strong');
    target.id = 'target heading';
    defineDimension(target, 'offsetTop', 140);
    block.appendChild(target);
    const image = document.createElement('img');
    defineDimension(image, 'complete', true);
    block.appendChild(image);

    expect(previewer.scrollToId('missing')).toBe(false);
    expect(previewer.scrollToId('#target heading', 'instant')).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 130, left: 0, behavior: 'instant' });

    expect(previewer.scrollToId('block', 'instant')).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 90, left: 0, behavior: 'instant' });

    vi.runAllTimers();
    await Promise.resolve();
    expect(scrollTo).toHaveBeenCalled();
  });

  it('uses bounding rectangles for anchors outside signed blocks and smooth fallback handling', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const { previewer, previewerDom } = createPreviewer();
    const scrollTo = vi.fn();
    Reflect.set(previewerDom, 'scrollTo', scrollTo);
    defineDimension(previewerDom, 'scrollHeight', 500);
    defineDimension(previewerDom, 'clientHeight', 100);
    previewerDom.scrollTop = 20;
    vi.spyOn(previewerDom, 'getBoundingClientRect').mockReturnValue(createRect(0, 10, 300, 100));
    const target = document.createElement('div');
    target.id = 'plain:anchor';
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(createRect(0, 80, 100, 20));
    previewerDom.appendChild(target);

    expect(previewer.scrollToId('plain:anchor', 'smooth')).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 80, left: 0, behavior: 'smooth' });

    previewerDom.dispatchEvent(new Event('scrollend'));

    vi.runAllTimers();
    await Promise.resolve();
  });

  it('waits for incomplete images before final anchor correction', async () => {
    let frameCallback: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    });
    const { previewer, previewerDom } = createPreviewer();
    const scrollTo = vi.fn();
    Reflect.set(previewerDom, 'scrollTo', scrollTo);
    defineDimension(previewerDom, 'scrollHeight', 500);
    defineDimension(previewerDom, 'clientHeight', 100);
    vi.spyOn(previewerDom, 'getBoundingClientRect').mockReturnValue(createRect(0, 0, 300, 100));
    const target = document.createElement('div');
    target.id = 'image-target';
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(createRect(0, 100, 100, 20));
    const image = document.createElement('img');
    defineDimension(image, 'complete', false);
    previewerDom.append(target, image);

    expect(previewer.scrollToId('image-target', 'instant')).toBe(true);
    frameCallback?.(0);
    vi.advanceTimersByTime(100);
    image.dispatchEvent(new Event('load'));
    await Promise.resolve();
    frameCallback?.(16);

    expect(scrollTo).toHaveBeenCalled();
  });

  it('scrolls to heading indexes only when a matching heading exists', () => {
    const { previewer, previewerDom } = createPreviewer();
    previewerDom.innerHTML = '<h1 id="one">One</h1><h2 id="two">Two</h2>';
    const scrollToId = vi.spyOn(previewer, 'scrollToId').mockReturnValue(true);

    previewer.scrollToHeadByIndex(1);
    previewer.scrollToHeadByIndex(9);

    expect(scrollToId).toHaveBeenCalledOnce();
    expect(scrollToId).toHaveBeenCalledWith('two');
  });

  it('animates toward the latest destination and restores scroll feedback when complete', () => {
    let frameCallback: FrameRequestCallback | undefined;
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 7;
    });
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);
    const { previewer, previewerDom } = createPreviewer();
    defineDimension(previewerDom, 'scrollHeight', 500);
    previewerDom.scrollTop = 0;
    const scrollTo = vi.fn((_left: number | null, top: number) => {
      previewerDom.scrollTop = top;
    });
    Reflect.set(previewerDom, 'scrollTo', scrollTo);

    previewer.$scrollAnimation(12);
    previewer.$scrollAnimation(8);
    for (let index = 0; index < 20 && Reflect.get(previewer, 'animation').timer; index++) {
      frameCallback?.(index * 16);
    }

    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalled();
    expect(previewerDom.scrollTop).toBe(8);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(Reflect.get(previewer, 'disableScrollListener')).toBe(false);
  });

  it('emits submenu cleanup after preview mouse down', () => {
    const { previewer, previewerDom, emit } = createPreviewer();

    previewer.onMouseDown();
    previewerDom.dispatchEvent(new MouseEvent('mousedown'));
    vi.runAllTimers();

    expect(emit).toHaveBeenCalledWith('cleanAllSubMenus');
  });
});
