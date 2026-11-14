import { afterEach, expect, it, vi } from 'vite-plus/test';
import { createCompositionGate } from '../src/composition-gate';

afterEach(() => vi.unstubAllGlobals());

it('keeps a deferred update until a restarted composition finishes after duplicate end events', () => {
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  };
  const surface = document.createElement('div');
  const gate = createCompositionGate(surface);
  const update = vi.fn();
  surface.dispatchEvent(new CompositionEvent('compositionstart'));
  gate.run(update);
  surface.dispatchEvent(new CompositionEvent('compositionend'));
  surface.dispatchEvent(new CompositionEvent('compositionend'));
  surface.dispatchEvent(new CompositionEvent('compositionstart'));
  flush();
  expect(update).not.toHaveBeenCalled();
  expect(gate.active).toBe(true);
  surface.dispatchEvent(new CompositionEvent('compositionend'));
  flush();
  expect(update).toHaveBeenCalledOnce();
  gate.destroy();
});

it('captures a new snapshot when applying an update starts another composition synchronously', () => {
  let scheduled: FrameRequestCallback | undefined;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    scheduled = callback;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  const surface = document.createElement('div');
  let documentRevision = 1;
  const gate = createCompositionGate(surface, () => documentRevision);
  surface.dispatchEvent(new CompositionEvent('compositionstart'));
  gate.run(() => {
    documentRevision = 2;
    surface.dispatchEvent(new CompositionEvent('compositionstart'));
  });
  surface.dispatchEvent(new CompositionEvent('compositionend'));
  scheduled!(0);
  expect(gate.active).toBe(true);
  expect(gate.snapshot).toBe(2);
  gate.destroy();
});

it('cancels deferred updates and listeners on destruction', () => {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const surface = document.createElement('div');
  const gate = createCompositionGate(surface);
  const update = vi.fn();
  surface.dispatchEvent(new CompositionEvent('compositionstart'));
  gate.run(update);
  surface.dispatchEvent(new CompositionEvent('compositionend'));
  surface.dispatchEvent(new CompositionEvent('compositionend'));
  gate.destroy();
  expect(frames.size).toBe(0);
  expect(update).not.toHaveBeenCalled();
  surface.dispatchEvent(new CompositionEvent('compositionstart'));
  expect(gate.active).toBe(false);
});
