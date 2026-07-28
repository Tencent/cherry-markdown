import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Color from '../../../src/toolbars/hooks/Color';
import { createMenuContext } from '../../helpers/menu';

function createColor(doc = 'text') {
  const context = createMenuContext(doc);
  const wrapperDom = document.createElement('div');
  Object.assign(context.editor, { options: { wrapperDom } });
  const color = new Color(context.cherry as never);
  return { context, color, wrapperDom, picker: color.bubbleColor };
}

function setRect(element: Element, rect: { left: number; top: number; width: number; height: number }) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    ...rect,
    bottom: rect.top + rect.height,
    right: rect.left + rect.width,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  });
}

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('toolbars/hooks Color', () => {
  it('parses all supported color combinations and rebuilds their Markdown', () => {
    const { color } = createColor();

    expect(color.parseAppliedColors('!!#111111 !!!#222222 text!!!!!')).toEqual({
      textColor: '#111111',
      bgColor: '#222222',
      text: 'text',
    });
    expect(color.parseAppliedColors('!!!#222222 !!#111111 text!!!!!')).toMatchObject({
      textColor: '#111111',
      bgColor: '#222222',
    });
    expect(color.parseAppliedColors('!!!#222222 text!!!')).toEqual({
      textColor: null,
      bgColor: '#222222',
      text: 'text',
    });
    expect(color.parseAppliedColors('!!#111111 text!!')).toEqual({
      textColor: '#111111',
      bgColor: null,
      text: 'text',
    });
    expect(color.parseAppliedColors('plain')).toEqual({ textColor: null, bgColor: null, text: 'plain' });

    expect(color.buildStyleString('#111111', '#222222', 'text')).toBe('!!#111111 !!!#222222 text!!!!!');
    expect(color.buildStyleString(null, '#222222', 'text')).toBe('!!!#222222 text!!!');
    expect(color.buildStyleString('#111111', null, 'text')).toBe('!!#111111 text!!');
    expect(color.buildStyleString(null, null, '')).toBe('');
  });

  it('renders text and background color shortcuts into Markdown', () => {
    const text = createColor('text').color;
    const background = createColor('text').color;

    expect(text.onClick('text', 'color: #123456', undefined)).toBe('!!#123456 text!!');
    expect(background.onClick('text', 'background-color: #abcdef', undefined)).toBe('!!!#abcdef text!!!');

    const existing = createColor('!!#111111 text!!').color;
    expect(existing.onClick('!!#111111 text!!', 'background-color: #222222', undefined)).toBe(
      '!!#111111 !!!#222222 text!!!!!',
    );
  });

  it('applies cached colors and clears existing color syntax', () => {
    const colored = createColor('text').color;
    colored.setCacheOnce({ type: 'text', color: '#00ff00' });
    expect(colored.onClick('text', '', undefined)).toBe('!!#00ff00 text!!');

    const cleared = createColor('!!!#222222 text!!!');
    cleared.color.setCacheOnce({ type: 'clear' });
    expect(cleared.color.onClick('!!!#222222 text!!!', '', undefined)).toBe('text');
    expect(cleared.picker.dom.style.display).toBe('none');
  });

  it('opens the picker at toolbar and bubble positions, then toggles it closed', () => {
    const { color, picker } = createColor();
    const toolbar = document.createElement('button');
    toolbar.className = 'cherry-toolbar-color';
    const target = document.createElement('span');
    toolbar.append(target);
    setRect(toolbar, { left: 12, top: 20, width: 30, height: 10 });
    Object.defineProperty(toolbar, 'offsetHeight', { value: 10 });
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: target });

    color.onClick('text', '', event as never);
    expect(picker.dom.style.left).toBe('12px');
    expect(picker.dom.style.top).toBe('30px');
    expect(picker.dom.style.display).toBe('block');

    color.onClick('text', '', event as never);
    expect(picker.dom.style.display).toBe('none');

    const bubble = document.createElement('div');
    bubble.className = 'cherry-bubble';
    const bubbleToolbar = document.createElement('button');
    bubbleToolbar.className = 'cherry-toolbar-color';
    bubble.append(bubbleToolbar);
    setRect(bubble, { left: 5, top: 7, width: 40, height: 20 });
    Object.defineProperty(bubble, 'offsetHeight', { value: 20 });
    Object.defineProperty(bubbleToolbar, 'offsetHeight', { value: 10 });
    Object.defineProperty(bubbleToolbar, 'offsetLeft', { value: 2 });
    const bubbleEvent = new MouseEvent('click');
    Object.defineProperty(bubbleEvent, 'target', { value: bubbleToolbar });

    color.onClick('text', '', bubbleEvent as never);
    expect(picker.dom.style.left).toBe('64px');
    expect(picker.dom.style.top).toBe('35px');
  });

  it('switches picker tabs and applies preset colors to final Markdown', () => {
    const { context, color, picker } = createColor('text');
    const open = document.createElement('button');
    open.className = 'cherry-toolbar-color';
    const target = document.createElement('span');
    open.append(target);
    setRect(open, { left: 0, top: 0, width: 1, height: 1 });
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: target });
    color.onClick('text', '', event as never);

    const backgroundTab = picker.dom.querySelector('[data-type="background"]');
    backgroundTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(picker.currentType).toBe('background');

    const preset = picker.dom.querySelector('.cherry-color-preset-item');
    expect(preset).not.toBeNull();
    preset?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(context.getState().doc.toString()).toMatch(/^!!!#[0-9a-f]+ text!!!$/i);
    expect(localStorage.getItem('cherry-recent-colors')).toContain('#');
  });

  it('handles clear actions and recent-color selection from the picker', () => {
    const { context, color, picker } = createColor('!!#111111 text!!');
    picker.toggle({ left: 0, top: 0, $color: color });
    const clear = picker.dom.querySelector('.cherry-color-clear');
    clear?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(context.getState().doc.toString()).toBe('text');

    picker.toggle({ left: 0, top: 0, $color: color });
    const recent = picker.dom.querySelector('.cherry-color-recent-item');
    expect(recent).not.toBeNull();
    recent?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  it('updates HSV colors from saturation and hue coordinates', () => {
    const { color, picker } = createColor();
    picker.toggle({ left: 0, top: 0, $color: color });
    const saturation = picker.dom.querySelector('.cherry-color-saturation');
    const hue = picker.dom.querySelector('.cherry-color-hue');
    expect(saturation).not.toBeNull();
    expect(hue).not.toBeNull();
    if (!saturation || !hue) return;
    setRect(saturation, { left: 10, top: 10, width: 100, height: 50 });
    setRect(hue, { left: 0, top: 0, width: 120, height: 10 });

    const saturationEvent = new MouseEvent('mousedown', { clientX: 60, clientY: 35, bubbles: true });
    saturation.dispatchEvent(saturationEvent);
    expect(picker.isDragging).toBe('saturation');
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 10 }));
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(picker.isDragging).toBe('');

    const hueEvent = new MouseEvent('mousedown', { clientX: 60, clientY: 5, bubbles: true });
    hue.dispatchEvent(hueEvent);
    expect(picker.isDragging).toBe('hue');
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(localStorage.getItem('cherry-recent-colors')).toContain('#');
  });

  it('preserves other submenu visibility while hiding the picker', () => {
    const { color, picker } = createColor();
    picker.dom.style.display = 'block';
    const hideAll = vi.fn();

    color.hideOtherSubMenu(hideAll);

    expect(hideAll).toHaveBeenCalledOnce();
    expect(picker.dom.style.display).toBe('block');
  });
});
