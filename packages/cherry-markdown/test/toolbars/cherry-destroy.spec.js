import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Cherry from '../../src/Cherry';
import Toc from '../../src/toolbars/Toc';

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('Cherry destruction', () => {
  it.each([false, true])('cancels owned work and destroys once when noMountEl=%s', (noMountEl) => {
    vi.useFakeTimers();
    const host = document.body.appendChild(document.createElement('div'));
    const sibling = host.appendChild(document.createElement('span'));
    const mount = host.appendChild(document.createElement('div'));
    const wrapper = mount.appendChild(document.createElement('div'));
    const pendingRender = vi.fn();
    const pendingHash = vi.fn();
    const toc = Object.create(Toc.prototype);
    toc.destroy = vi.fn();
    const cherry = Object.assign(Object.create(Cherry.prototype), {
      noMountEl,
      cherryDom: mount,
      wrapperDom: wrapper,
      toc,
      timer: setTimeout(pendingRender, 100),
      autoScrollByHashTimer: setTimeout(pendingHash, 100),
      editor: { destroy: vi.fn() },
      $event: { clearAll: vi.fn() },
    });
    cherry.editor.destroy.mockImplementation(() => {
      expect(toc.destroy).toHaveBeenCalledOnce();
    });

    cherry.destroy();
    cherry.destroy();
    vi.runAllTimers();
    expect(pendingRender).not.toHaveBeenCalled();
    expect(pendingHash).not.toHaveBeenCalled();
    expect(cherry.editor.destroy).toHaveBeenCalledOnce();
    expect(cherry.$event.clearAll).toHaveBeenCalledOnce();
    expect(toc.destroy).toHaveBeenCalledOnce();
    expect(sibling.isConnected).toBe(true);
    expect(wrapper.isConnected).toBe(false);
    expect(mount.isConnected).toBe(!noMountEl);
  });
});
