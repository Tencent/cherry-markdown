import { describe, expect, it, vi } from 'vitest';
import MenuBase from '../../src/toolbars/MenuBase';
import { createMenuContext, type TestSelection } from '../helpers/menu';

const createMenu = (doc = 'text', selections: TestSelection[] = [{ anchor: 0, head: doc.length }]) => {
  const context = createMenuContext(doc, selections);
  const menu = new MenuBase(context.cherry as never);
  return { menu, ...context };
};

describe('toolbars/MenuBase', () => {
  it('initializes menu metadata and cache state', () => {
    const { menu } = createMenu();

    expect(menu.name).toBe('custom');
    expect(menu.iconName).toBe('custom');
    expect(menu.getSubMenuConfig()).toEqual([]);
    expect(menu.hasCacheOnce()).toBe(false);

    menu.setName('bold', 'strong');
    menu.setCacheOnce({ value: 1 });
    expect(menu.name).toBe('bold');
    expect(menu.hasCacheOnce()).toBe(true);
    expect(menu.getAndCleanCacheOnce()).toEqual({ value: 1 });
    expect(menu.hasCacheOnce()).toBe(false);
    expect(menu.updateMarkdown).toBe(true);
  });

  it('creates icon font, SVG, and image icons', () => {
    const { menu } = createMenu();
    const iconFont = menu.createIconFontIcon('bold', { className: 'active' });
    const svg = menu.createSvgIcon({
      type: 'svg',
      content: '<svg viewBox="0 0 1 1"></svg>',
      iconStyle: 'color:red',
      iconClassName: 'custom-svg',
    });
    const image = menu.createImageIcon({
      type: 'image',
      content: '/icon.png',
      iconStyle: 'width:16px',
      iconClassName: 'custom-image',
    });

    expect(iconFont.className).toContain('ch-icon-bold');
    expect(iconFont.className).toContain('active');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('style')).toBe('color:red');
    expect(svg.getAttribute('class')).toBe('custom-svg');
    expect(image.getAttribute('src')).toBe('/icon.png');
    expect(image.className).toContain('custom-image');
    const invalidSvg = { type: 'image' };
    const invalidImage = { type: 'svg' };
    expect(() => menu.createSvgIcon(invalidSvg as never)).toThrow('except options.type is "svg"');
    expect(() => menu.createImageIcon(invalidImage as never)).toThrow('except options.type is "image"');
  });

  it('creates primary and secondary menu buttons', () => {
    const { menu } = createMenu();
    const primary = menu.createBtn();
    const secondary = menu.createBtn(true);

    expect(primary.className).toContain('cherry-toolbar-button');
    expect(primary.querySelector('i')?.className).toContain('cherry-menu-custom');
    expect(menu.dom).toBe(primary);
    expect(secondary.className).toBe('cherry-dropdown-item');
    expect(secondary.textContent).toContain('custom');
  });

  it('supports element, SVG, image, iconfont, and invalid custom button icons', () => {
    const cases = [
      { icon: document.createElement('b'), expectedType: 'element' },
      { icon: { type: 'svg', content: '<svg></svg>' }, expectedType: 'svg' },
      { icon: { type: 'image', content: '/image.png' }, expectedType: 'image' },
      { icon: { type: 'iconfont', content: 'star' }, expectedType: 'iconfont' },
    ];

    for (const { icon, expectedType } of cases) {
      const context = createMenuContext();
      context.cherry.$currentMenuOptions.icon = icon as never;
      const menu = new MenuBase(context.cherry as never);
      expect(menu.createBtn().children).toHaveLength(1);
      expect(menu.iconType).toBe(expectedType);
    }

    const context = createMenuContext();
    const invalidIcon = { type: 'unknown', content: '' };
    context.cherry.$currentMenuOptions.icon = invalidIcon as never;
    expect(() => new MenuBase(context.cherry as never).createBtn()).toThrow('except customIcon.type');
  });

  it('creates submenu controls and separators', () => {
    const { menu } = createMenu();
    const onClick = vi.fn();
    const iconButton = menu.createSubBtnByConfig({ name: 'bold', iconName: 'bold', onclick: onClick });
    const imageButton = menu.createSubBtnByConfig({ name: 'image', icon: '/image.png', onclick: onClick });
    const plainButton = menu.createSubBtnByConfig({ name: 'plain', onclick: onClick });
    const separatorConfig = { name: '|' };
    const separator = menu.createSubBtnByConfig(separatorConfig as never);

    iconButton.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(iconButton.querySelector('i')).not.toBeNull();
    expect(imageButton.querySelector('img')?.getAttribute('src')).toBe('/image.png');
    expect(plainButton.querySelector('i')).toBeNull();
    expect(plainButton.textContent).toContain('plain');
    expect(separator.className).toBe('cherry-dropdown-separator');
  });

  it('replaces multiple selections and maps resulting ranges', () => {
    const { menu, getState, dispatch } = createMenu('one two', [
      { anchor: 0, head: 3 },
      { anchor: 4, head: 7 },
    ]);

    menu.$replaceSelectionsWithCursor(['1', 'second']);

    expect(getState().doc.toString()).toBe('1 second');
    expect(getState().selection.ranges.map(({ from, to }) => [from, to])).toEqual([
      [0, 1],
      [2, 8],
    ]);
    expect(dispatch).toHaveBeenCalledOnce();
  });

  it('fires synchronous menu actions and restores editor focus', () => {
    const { menu, getState, focus } = createMenu('text');
    const event = { stopPropagation: vi.fn() };
    menu.onClick = vi.fn((selection) => `**${selection}**`);

    menu.fire(event as never, 'Control-KeyB');

    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(getState().doc.toString()).toBe('**text**');
    expect(focus).toHaveBeenCalledOnce();
  });

  it('resolves asynchronous actions before replacing selections', async () => {
    const { menu, getState, focus } = createMenu('text');
    menu.onClick = vi.fn(async (selection) => selection.toUpperCase());

    menu.fire();
    await vi.waitFor(() => expect(getState().doc.toString()).toBe('TEXT'));

    expect(focus).toHaveBeenCalledOnce();
  });

  it('does not update Markdown for bubble or display-only menus', () => {
    const bubble = createMenu('text');
    bubble.menu.bubbleMenu = true;
    bubble.menu.onClick = vi.fn(() => 'changed');
    bubble.menu.fire();
    expect(bubble.getState().doc.toString()).toBe('text');

    const displayOnly = createMenu('text');
    displayOnly.menu.updateMarkdown = false;
    displayOnly.menu.onClick = vi.fn(() => 'changed');
    displayOnly.menu.fire();
    expect(displayOnly.getState().doc.toString()).toBe('text');
  });

  it('reports forward and backward selection ranges as line and column pairs', () => {
    const forward = createMenu('first\nsecond', [{ anchor: 1, head: 9 }]);
    const backward = createMenu('first\nsecond', [{ anchor: 9, head: 1 }]);

    expect(forward.menu.$getSelectionRange()).toEqual({ begin: { line: 0, ch: 1 }, end: { line: 1, ch: 3 } });
    expect(backward.menu.$getSelectionRange()).toEqual({ begin: { line: 0, ch: 1 }, end: { line: 1, ch: 3 } });
  });

  it('runs one-shot after-click callbacks only for single selections', () => {
    const single = createMenu();
    const callback = vi.fn();
    single.menu.registerAfterClickCb(callback);
    single.menu.$afterClick();
    single.menu.$afterClick();
    expect(callback).toHaveBeenCalledOnce();

    const multiple = createMenu('ab', [{ anchor: 0 }, { anchor: 1 }]);
    const ignored = vi.fn();
    multiple.menu.isSelections = true;
    multiple.menu.registerAfterClickCb(ignored);
    multiple.menu.$afterClick();
    expect(ignored).not.toHaveBeenCalled();
  });

  it('expands and restores selections around inline and multiline syntax', () => {
    const inline = createMenu('**text**', [{ anchor: 2, head: 6 }]);
    inline.menu.getMoreSelection('**', '**', () => true);
    expect(inline.getState().selection.main).toMatchObject({ from: 0, to: 8 });

    const restored = createMenu('plain', [{ anchor: 1, head: 4 }]);
    restored.menu.getMoreSelection('*', '*', () => false);
    expect(restored.getState().selection.main).toMatchObject({ from: 1, to: 4 });

    const multiline = createMenu('before\ntarget\nafter', [{ anchor: 8, head: 12 }]);
    multiline.menu.getMoreSelection('\n', '\n');
    expect(multiline.getState().selection.main).toMatchObject({ from: 0, to: 19 });
  });

  it('gets selected text, words, lines, and preserves multiple selections', () => {
    const selected = createMenu('hello world', [{ anchor: 0, head: 5 }]);
    expect(selected.menu.getSelection('hello')).toBe('hello');

    const word = createMenu('hello world', [{ anchor: 7 }]);
    expect(word.menu.getSelection('')).toBe('world');

    const line = createMenu('first\nsecond', [{ anchor: 8 }]);
    expect(line.menu.getSelection('', 'line')).toBe('second');

    const multiple = createMenu('ab', [{ anchor: 0 }, { anchor: 1 }]);
    multiple.menu.isSelections = true;
    expect(multiple.menu.getSelection('kept')).toBe('kept');
  });

  it('rejects incompatible icon updates and respects no-icon menus', () => {
    const { menu } = createMenu();
    menu.createBtn();
    menu.iconType = 'image';
    expect(menu.updateMenuIcon('star')).toBe(false);
    menu.noIcon = true;
    expect(menu.updateMenuIcon('star')).toBe(false);
  });

  it('finds toolbar parents, reports positions, and toggles visibility', () => {
    const { menu } = createMenu();
    const toolbar = document.createElement('div');
    toolbar.className = 'cherry-toolbar';
    const side = document.createElement('div');
    side.className = 'toolbar-left';
    toolbar.appendChild(side);
    side.appendChild(menu.createBtn());
    Object.defineProperties(menu.dom, {
      offsetLeft: { configurable: true, value: 20 },
      offsetTop: { configurable: true, value: 10 },
    });

    expect(MenuBase.getTargetParentByButton(menu.dom)).toBe(toolbar);
    expect(menu.getMenuPosition()).toEqual({ left: 20, top: 10, width: 0, height: 0 });
    menu.hide();
    expect(menu.dom.style.display).toBe('none');
    menu.show();
    expect(menu.dom.style.display).toBe('block');
    expect(menu.getActiveSubMenuIndex(document.createElement('div'))).toBe(-1);
    expect(menu.shortcutKeys).toEqual([]);
  });

  it('resolves menu positions for fixed and sidebar layouts', () => {
    const { menu } = createMenu();
    const bubbleParent = document.createElement('div');
    bubbleParent.className = 'cherry-bubble';
    bubbleParent.appendChild(menu.createBtn());
    Object.defineProperties(menu.dom, {
      offsetLeft: { configurable: true, value: 18 },
      offsetTop: { configurable: true, value: 12 },
    });
    Object.defineProperty(menu.dom, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 18,
        top: 12,
        width: 32,
        height: 24,
        x: 18,
        y: 12,
        right: 50,
        bottom: 36,
        toJSON: () => ({}),
      }),
    });

    const fixedPosition = menu.getMenuPosition();
    expect(fixedPosition.left).toBe(18);
    expect(fixedPosition.top).toBe(12);
    expect(fixedPosition.width).toBe(32);
    expect(fixedPosition.height).toBe(24);

    const sidebar = document.createElement('div');
    sidebar.className = 'cherry-sidebar';
    Object.defineProperties(sidebar, {
      offsetLeft: { configurable: true, value: 300 },
    });
    const toolbarLeft = document.createElement('div');
    toolbarLeft.className = 'toolbar-left';
    const sidebarList = document.createElement('div');
    sidebarList.className = 'cherry-sidebar-list';
    const sidebarButton = menu.createBtn();
    Object.defineProperties(sidebarButton, {
      offsetLeft: { configurable: true, value: 16 },
      offsetTop: { configurable: true, value: 40 },
    });
    Object.defineProperty(sidebarButton, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 16,
        top: 40,
        width: 28,
        height: 20,
        x: 16,
        y: 40,
        right: 44,
        bottom: 60,
        toJSON: () => ({}),
      }),
    });
    toolbarLeft.appendChild(sidebarList);
    sidebarList.appendChild(sidebarButton);
    sidebar.appendChild(toolbarLeft);

    expect(MenuBase.getTargetParentByButton(sidebarButton)).toBe(sidebar);
    menu.dom = sidebarButton;
    const sidebarPosition = menu.getMenuPosition();
    expect(sidebarPosition.left).toBe(198);
    expect(sidebarPosition.top).toBe(50);
    expect(sidebarPosition.width).toBe(28);
    expect(sidebarPosition.height).toBe(20);
  });
});
