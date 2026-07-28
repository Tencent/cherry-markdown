import { describe, expect, it, vi } from 'vite-plus/test';
import {
  createElement,
  elementsFromPoint,
  getBlockTopAndHeightWithMargin,
  getHTML,
  loadCSS,
  loadScript,
} from '../../src/utils/dom';

const setRect = (element: Element, rect: Partial<DOMRect>) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    }),
  });
};

describe('utils/dom', () => {
  it('merges block margins with and without siblings', () => {
    const container = document.createElement('div');
    const first = document.createElement('section');
    const middle = document.createElement('section');
    const last = document.createElement('section');
    container.append(first, middle, last);

    first.style.marginTop = '10px';
    first.style.marginBottom = '5px';
    middle.style.marginTop = '12px';
    middle.style.marginBottom = '8px';
    last.style.marginTop = '6px';
    last.style.marginBottom = '4px';

    Object.defineProperty(first, 'offsetTop', { configurable: true, value: 30 });
    Object.defineProperty(middle, 'offsetTop', { configurable: true, value: 50 });
    Object.defineProperty(last, 'offsetTop', { configurable: true, value: 70 });
    setRect(first, { height: 20 });
    setRect(middle, { height: 24 });
    setRect(last, { height: 28 });

    expect(getBlockTopAndHeightWithMargin(first)).toEqual({ height: 35, offsetTop: 20 });
    expect(getBlockTopAndHeightWithMargin(middle)).toEqual({ height: 39, offsetTop: 43 });
    expect(getBlockTopAndHeightWithMargin(last)).toEqual({ height: 32, offsetTop: 64 });
  });

  it('handles isolated blocks and negative margin collapse', () => {
    const block = document.createElement('section');
    document.body.appendChild(block);

    block.style.marginTop = '-4px';
    block.style.marginBottom = '-6px';
    Object.defineProperty(block, 'offsetTop', { configurable: true, value: 18 });
    setRect(block, { height: 10 });

    expect(getBlockTopAndHeightWithMargin(block)).toEqual({ height: 0, offsetTop: 14 });

    block.remove();
  });

  it('merges negative margins between sibling blocks', () => {
    const container = document.createElement('div');
    const previous = document.createElement('section');
    const current = document.createElement('section');
    const next = document.createElement('section');
    container.append(previous, current, next);
    document.body.appendChild(container);

    previous.style.marginBottom = '-5px';
    current.style.marginTop = '3px';
    current.style.marginBottom = '-9px';
    next.style.marginTop = '-4px';
    Object.defineProperty(current, 'offsetTop', { configurable: true, value: 20 });
    setRect(current, { height: 10 });

    expect(getBlockTopAndHeightWithMargin(current)).toEqual({ height: 4, offsetTop: 17 });

    container.remove();
  });

  it('uses native and fallback elementFromPoint implementations', () => {
    const nativeDesc = Object.getOwnPropertyDescriptor(document, 'elementsFromPoint');
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [document.createElement('div')],
    });
    expect(elementsFromPoint(1, 2)).toHaveLength(1);
    if (nativeDesc) {
      Object.defineProperty(document, 'elementsFromPoint', nativeDesc);
    } else {
      Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: undefined });
    }

    const first = document.createElement('div');
    const second = document.createElement('div');
    const elementsFromPointDesc = Object.getOwnPropertyDescriptor(document, 'elementsFromPoint');
    const msElementsFromPointDesc = Object.getOwnPropertyDescriptor(document, 'msElementsFromPoint');
    const elementFromPointDesc = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');

    try {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: vi
          .fn()
          .mockImplementationOnce(() => first)
          .mockImplementationOnce(() => second)
          .mockImplementationOnce(() => second),
      });
      Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: undefined });
      Object.defineProperty(document, 'msElementsFromPoint', { configurable: true, value: undefined });

      const result = elementsFromPoint(3, 4);
      expect(result).toEqual([first, second]);
      expect(first.style.pointerEvents).toBe('');
      expect(second.style.pointerEvents).toBe('');
    } finally {
      if (elementFromPointDesc) {
        Object.defineProperty(document, 'elementFromPoint', elementFromPointDesc);
      }
      if (elementsFromPointDesc) {
        Object.defineProperty(document, 'elementsFromPoint', elementsFromPointDesc);
      }
      if (msElementsFromPointDesc) {
        Object.defineProperty(document, 'msElementsFromPoint', msElementsFromPointDesc);
      }
    }
  });

  it('uses msElementsFromPoint when the native API is unavailable', () => {
    const nativeDesc = Object.getOwnPropertyDescriptor(document, 'elementsFromPoint');
    const msDesc = Object.getOwnPropertyDescriptor(document, 'msElementsFromPoint');
    const first = document.createElement('div');
    const second = document.createElement('div');

    try {
      Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: undefined });
      Object.defineProperty(document, 'msElementsFromPoint', {
        configurable: true,
        value: vi.fn().mockReturnValue([first, second]),
      });

      expect(elementsFromPoint(7, 8)).toEqual([first, second]);

      Object.defineProperty(document, 'msElementsFromPoint', {
        configurable: true,
        value: vi.fn().mockReturnValue(null),
      });
      expect(elementsFromPoint(7, 8)).toBeNull();
    } finally {
      if (nativeDesc) {
        Object.defineProperty(document, 'elementsFromPoint', nativeDesc);
      } else {
        Object.defineProperty(document, 'elementsFromPoint', { configurable: true, value: undefined });
      }
      if (msDesc) {
        Object.defineProperty(document, 'msElementsFromPoint', msDesc);
      } else {
        Object.defineProperty(document, 'msElementsFromPoint', { configurable: true, value: undefined });
      }
    }
  });

  it('serializes elements and creates nodes with attributes', () => {
    const wrapper = document.createElement('div');
    const child = document.createElement('span');
    child.innerHTML = 'value';
    wrapper.appendChild(child);

    expect(getHTML(null)).toBe('');
    expect(getHTML(wrapper)).toBe('<div></div>');
    expect(getHTML(wrapper, true)).toBe('<div><span>value</span></div>');

    const button = createElement('button', 'btn primary', {
      title: 'Title',
      'data-role': 'action',
    });
    expect(button.className).toBe('btn primary');
    expect(button.getAttribute('title')).toBe('Title');
    expect(button.dataset.role).toBe('action');
  });

  it('loads scripts and stylesheets once per id', async () => {
    const script = document.createElement('script');
    script.id = 'existing-script';
    document.head.appendChild(script);
    await expect(loadScript('/existing.js', 'existing-script')).resolves.toBeUndefined();

    document.head.innerHTML = '';
    const appendSpy = vi.spyOn(document.head, 'appendChild');
    const scriptPromise = loadScript('/app.js', 'app-script');
    const inserted = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement;
    expect(inserted.src).toContain('/app.js');
    inserted.onload?.(undefined);
    await expect(scriptPromise).resolves.toBeUndefined();
    appendSpy.mockRestore();

    const link = document.createElement('link');
    link.id = 'existing-style';
    document.head.appendChild(link);
    expect(loadCSS('/existing.css', 'existing-style')).toBeUndefined();

    document.head.innerHTML = '';
    const linkSpy = vi.spyOn(document.head, 'appendChild');
    expect(loadCSS('/style.css', 'style-id')).toBeUndefined();
    const insertedLink = linkSpy.mock.calls[0]?.[0] as HTMLLinkElement;
    expect(insertedLink.href).toContain('/style.css');

    linkSpy.mockRestore();
  });
});
