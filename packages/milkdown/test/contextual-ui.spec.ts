import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createContextFrame,
  placeContextBubble,
  preserveContextSelection,
  watchContextViewport,
} from '../src/wysiwyg/contextual-ui';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('contextual control behavior contract', () => {
  it.each(['text', 'link', 'image'] as const)(
    'preserves the original %s placement formula at viewport edges',
    (kind) => {
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1200);
      vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800);
      const bubble = document.createElement('div');
      const arrow = kind === 'image' ? undefined : document.createElement('span');
      vi.spyOn(bubble, 'offsetWidth', 'get').mockReturnValue(240);
      vi.spyOn(bubble, 'offsetHeight', 'get').mockReturnValue(48);
      const gap = kind === 'text' ? 10 : 8;
      const bounds = { image: 'both', link: 'bottom', text: 'none' } as const;

      for (const left of [0, 100, 1100]) {
        for (const top of [0, 40, 200, 780, 1000]) {
          const rect = { left, top, bottom: top + 24, width: 80 };
          const above = top - 48 - gap >= 8;
          const expectedLeft = Math.max(8, Math.min(1200 - 240 - 8, left + 80 / 2 - 240 / 2));
          const rawTop = above ? top - 48 - gap : rect.bottom + gap;
          let expectedTop = rawTop;
          if (kind === 'image') expectedTop = Math.max(8, Math.min(800 - 48 - 8, rawTop));
          else if (kind === 'link' && !above) expectedTop = Math.min(800 - 48 - 8, rawTop);
          placeContextBubble(bubble, rect, { gap, bounds: bounds[kind], arrow });
          expect(bubble.style.left).toBe(`${expectedLeft}px`);
          expect(bubble.style.top).toBe(`${expectedTop}px`);
          if (arrow) {
            expect(bubble.classList.contains('is-below')).toBe(!above);
            expect(arrow.className).toBe(above ? 'cherry-bubble-bottom' : 'cherry-bubble-top');
          } else expect(bubble.className).toBe('');
        }
      }
    },
  );

  it('preserves selection without taking over pointer propagation', () => {
    const target = document.createElement('button');
    const parent = document.createElement('div');
    parent.append(target);
    const parentPointer = vi.fn();
    parent.addEventListener('pointerdown', parentPointer);
    target.addEventListener('pointerdown', preserveContextSelection);
    const event = new Event('pointerdown', { bubbles: true, cancelable: true });
    expect(target.dispatchEvent(event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(parentPointer).toHaveBeenCalledOnce();
  });

  it('captures nested scroll and keeps scroll/resize policies independent', () => {
    const scroll = vi.fn();
    const resize = vi.fn();
    const target = document.createElement('div');
    document.body.append(target);
    const release = watchContextViewport(document, scroll, resize);
    target.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(scroll).toHaveBeenCalledOnce();
    expect(resize).toHaveBeenCalledOnce();
    release();
    release();
    target.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(scroll).toHaveBeenCalledOnce();
    expect(resize).toHaveBeenCalledOnce();
  });

  it('keeps forms open while long URL inputs scroll internally', () => {
    const scroll = vi.fn();
    const form = document.body.appendChild(document.createElement('form'));
    form.className = 'cherry-milkdown-context-form';
    const input = form.appendChild(document.createElement('input'));
    const release = watchContextViewport(document, scroll);
    try {
      input.dispatchEvent(new Event('scroll'));
      expect(scroll).not.toHaveBeenCalled();
      window.dispatchEvent(new Event('scroll'));
      expect(scroll).toHaveBeenCalledOnce();
    } finally {
      release();
      form.remove();
    }
  });

  it('destroying one subscription does not remove a sibling control subscription', () => {
    const first = vi.fn();
    const second = vi.fn();
    const releaseFirst = watchContextViewport(document, first);
    const releaseSecond = watchContextViewport(document, second);
    releaseFirst();
    window.dispatchEvent(new Event('resize'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    releaseSecond();
  });

  it('subscribes to the owning document window, not the global editor window', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const callback = vi.fn();
    const release = watchContextViewport(iframe.contentDocument!, callback);
    window.dispatchEvent(new Event('resize'));
    expect(callback).not.toHaveBeenCalled();
    iframe.contentWindow!.dispatchEvent(new Event('resize'));
    expect(callback).toHaveBeenCalledOnce();
    release();
  });

  it('coalesces updates and cancels positioning before teardown', () => {
    vi.useFakeTimers();
    const update = vi.fn();
    const frame = createContextFrame(update);
    frame.schedule();
    frame.schedule();
    vi.advanceTimersByTime(16);
    expect(update).toHaveBeenCalledOnce();
    frame.schedule();
    frame.cancel();
    frame.cancel();
    vi.advanceTimersByTime(16);
    expect(update).toHaveBeenCalledOnce();
  });

  it('keeps scheduled positioning work isolated between controls', () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();
    const firstFrame = createContextFrame(first);
    const secondFrame = createContextFrame(second);
    firstFrame.schedule();
    secondFrame.schedule();
    firstFrame.cancel();
    vi.advanceTimersByTime(16);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
