import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createPreviewerBubble } from '../helpers/previewerBubble';

vi.mock('../../src/utils/dialog', () => ({
  drawioDialog: vi.fn((_url, _style, _xml, callback) => callback({ xmlData: '<updated />', base64: 'NEW_DATA' })),
}));

describe('toolbars/PreviewerBubble draw.io click integration', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('opens draw.io editing and dispatches the encoded replacement syntax', () => {
    const { bubble, previewerDom, cherry } = createPreviewerBubble();
    const dispatch = vi.fn();
    Reflect.set(bubble, 'editor', {
      editor: {
        view: {
          state: { selection: { main: { from: 2, to: 8 } } },
          dispatch,
        },
      },
    });
    Reflect.set(cherry, 'status', { editor: 'show', previewer: 'show' });
    Reflect.set(cherry.options, 'drawioIframeUrl', '/drawio');
    Reflect.set(cherry.options, 'drawioIframeStyle', 'height: 500px');
    vi.spyOn(bubble, 'beginChangeDrawioImg').mockReturnValue(true);
    const image = document.createElement('img');
    image.dataset.type = 'drawio';
    image.dataset.xml = encodeURIComponent('<old />');
    image.src = 'data:image/png;base64,OLD_DATA';
    previewerDom.appendChild(image);

    image.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: {
          from: 2,
          to: 8,
          insert: '(NEW_DATA){data-type=drawio data-xml=%3Cupdated%20%2F%3E}',
        },
      }),
    );
  });

  it('stops draw.io click processing when Markdown selection cannot be found', () => {
    const { bubble, previewerDom, cherry } = createPreviewerBubble();
    Reflect.set(cherry, 'status', { editor: 'show', previewer: 'show' });
    const begin = vi.spyOn(bubble, 'beginChangeDrawioImg').mockReturnValue(false);
    const image = document.createElement('img');
    image.dataset.type = 'drawio';
    previewerDom.appendChild(image);

    image.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(begin).toHaveBeenCalledWith(image);
  });
});
