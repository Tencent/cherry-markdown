import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Toc from '../../src/toolbars/Toc';

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('floating TOC ownership', () => {
  it.each(['element', 'window'])('releases pending updates and %s listeners before its editor is destroyed', (kind) => {
    vi.useFakeTimers();
    const events = new Map();
    const wrapper = document.body.appendChild(document.createElement('div'));
    const scroll = kind === 'window' ? document.documentElement : wrapper;
    const cherry = {
      editor: { editor: {} },
      wrapperDom: wrapper,
      locale: { toc: 'Contents' },
      $event: {
        on: (name, callback) => events.set(name, callback),
        off: (name, callback) => {
          if (events.get(name) === callback) events.delete(name);
        },
      },
      previewer: { getDomCanScroll: () => scroll },
    };
    const toc = new Toc({ $cherry: cherry });
    const update = vi.spyOn(toc, 'updateTocList');
    const resize = vi.spyOn(toc, '$switchModel');
    events.get('afterChange')();
    toc.destroy();
    cherry.previewer = null;
    expect(() => vi.runAllTimers()).not.toThrow();
    window.dispatchEvent(new Event('resize'));
    (kind === 'window' ? window : scroll).dispatchEvent(new Event('scroll'));
    expect(update).not.toHaveBeenCalled();
    expect(resize).not.toHaveBeenCalled();
    expect(events.size).toBe(0);
    expect(wrapper.querySelector('.cherry-flex-toc')).toBeNull();
  });
});
