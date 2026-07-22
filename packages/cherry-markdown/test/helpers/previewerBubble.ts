import { vi } from 'vitest';
import PreviewerBubble from '../../src/toolbars/PreviewerBubble';
import { createPreviewer } from './previewer';

export function createPreviewerBubble() {
  const fixture = createPreviewer();
  const on = vi.fn();
  const off = vi.fn();
  Reflect.set(fixture.cherry, '$event', { on, off, emit: fixture.emit });
  Reflect.set(fixture.cherry, 'getStatus', () => ({ editor: 'show', previewer: 'show' }));
  fixture.previewer.options.enablePreviewerBubble = true;
  Reflect.set(fixture.previewer, 'editor', { editor: {} });
  const bubble = new PreviewerBubble(fixture.previewer);
  return { ...fixture, bubble, on, off };
}
