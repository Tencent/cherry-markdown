import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCompositionGate } from '../src/composition-gate';

afterEach(() => vi.useRealTimers());
describe('external writes during composition', () => {
  it('applies ordinary writes immediately and coalesces composition writes after native input', () => {
    vi.useFakeTimers();
    const surface = document.createElement('div');
    const gate = createCompositionGate(surface);
    const ordinary = vi.fn();
    const obsolete = vi.fn();
    const latest = vi.fn();
    gate.run(ordinary);
    expect(ordinary).toHaveBeenCalledOnce();
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
    gate.run(obsolete);
    gate.run(latest);
    expect(latest).not.toHaveBeenCalled();
    surface.dispatchEvent(new CompositionEvent('compositionend'));
    expect(latest).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(obsolete).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledOnce();
    expect(gate.active).toBe(false);
    gate.destroy();
  });

  it('cancels pending writes when destroyed and does not react to later events', () => {
    vi.useFakeTimers();
    const surface = document.createElement('div');
    const gate = createCompositionGate(surface);
    const write = vi.fn();
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
    gate.run(write);
    surface.dispatchEvent(new CompositionEvent('compositionend'));
    gate.destroy();
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
    vi.runOnlyPendingTimers();
    expect(write).not.toHaveBeenCalled();
    expect(gate.active).toBe(false);
  });

  it('retains the pending write across consecutive compositions', () => {
    vi.useFakeTimers();
    const surface = document.createElement('div');
    const gate = createCompositionGate(surface);
    const write = vi.fn();
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
    gate.run(write);
    surface.dispatchEvent(new CompositionEvent('compositionend'));
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
    vi.runOnlyPendingTimers();
    expect(write).not.toHaveBeenCalled();
    surface.dispatchEvent(new CompositionEvent('compositionend'));
    vi.runOnlyPendingTimers();
    expect(write).toHaveBeenCalledOnce();
    gate.destroy();
  });

  it('holds the start snapshot through the commit frame and clears it on completion or destruction', () => {
    vi.useFakeTimers();
    const surface = document.createElement('div');
    const capture = vi.fn(() => ({ revision: 1 }));
    const gate = createCompositionGate(surface, capture);
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
    const { snapshot } = gate;
    gate.run(() => expect(gate.snapshot).toBe(snapshot));
    surface.dispatchEvent(new CompositionEvent('compositionend'));
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
    expect(capture).toHaveBeenCalledOnce();
    surface.dispatchEvent(new CompositionEvent('compositionend'));
    vi.runOnlyPendingTimers();
    expect(gate.snapshot).toBeUndefined();
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
    expect(capture).toHaveBeenCalledTimes(2);
    gate.destroy();
    expect(gate.snapshot).toBeUndefined();
  });
});
