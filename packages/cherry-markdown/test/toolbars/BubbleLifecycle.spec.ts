import { describe, expect, it, vi } from 'vite-plus/test';
import Bubble from '../../src/toolbars/Bubble';
import EventBus from '../../src/Event';

describe('external selection Bubble cleanup', () => {
  it('preserves other listeners when no source selection listeners were registered', () => {
    const events = new EventBus('bubble-cleanup');
    const listener = vi.fn();
    const names = ['afterChange', 'layoutChange', 'onScroll', 'beforeSelectionChange'];
    names.forEach((name) => events.on(name, listener));
    const bubble = Object.create(Bubble.prototype);
    bubble.$cherry = { $event: events };
    bubble.options = { observeSelection: false };
    bubble.destroy();
    names.forEach((name) => events.emit(name, undefined));
    expect(listener).toHaveBeenCalledTimes(names.length);
    names.forEach((name) => events.off(name, listener));
  });
});
