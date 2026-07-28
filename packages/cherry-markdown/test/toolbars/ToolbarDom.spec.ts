import { beforeEach, describe, expect, it, vi } from 'vitest';
import Toolbar from '../../src/toolbars/Toolbar';

vi.mock('../../src/toolbars/HookCenter', () => ({
  default: class HookCenter {},
}));

const createToolbar = () => {
  const wrapperDom = document.createElement('div');
  const toolbarDom = document.createElement('div');
  wrapperDom.appendChild(toolbarDom);
  document.body.appendChild(wrapperDom);

  const toolbar = Object.create(Toolbar.prototype);
  toolbar.options = { dom: toolbarDom };
  toolbar.$cherry = {
    nameSpace: 'toolbar-dom-test',
    wrapperDom,
    $event: {
      emit: vi.fn(),
    },
  };
  toolbar.subMenus = {};
  toolbar.currentActiveSubMenu = null;
  toolbar.shortcutKeyMap = {};
  toolbar.menus = {
    hooks: {},
    level2MenusName: {},
  };

  return { toolbar, toolbarDom, wrapperDom };
};

describe('toolbars/Toolbar DOM behavior', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('switches the toolbar DOM between preview-only and visible states', () => {
    const { toolbar, toolbarDom } = createToolbar();

    toolbar.previewOnly();
    expect(toolbarDom.classList.contains('preview-only')).toBe(true);
    expect(toolbar.$cherry.$event.emit).toHaveBeenCalledWith('toolbarHide');

    toolbar.showToolbar();
    expect(toolbarDom.classList.contains('preview-only')).toBe(false);
    expect(toolbar.$cherry.$event.emit).toHaveBeenCalledWith('toolbarShow');
  });

  it('creates, positions, activates, and toggles a submenu', () => {
    const { toolbar, wrapperDom } = createToolbar();
    const childButton = document.createElement('button');
    childButton.className = 'cherry-dropdown-item';
    const childFire = vi.fn();

    toolbar.menus.level2MenusName.insert = ['table'];
    toolbar.menus.hooks.insert = {
      dom: document.createElement('button'),
      positionModel: 'fixed',
      getMenuPosition: () => ({ left: 20, top: 30, width: 40, height: 10 }),
      getActiveSubMenuIndex: () => 0,
    };
    toolbar.menus.hooks.table = {
      createBtn: () => childButton,
      fire: childFire,
    };

    toolbar.toggleSubMenu('insert');

    const submenu = wrapperDom.querySelector('.cherry-dropdown');
    expect(submenu).not.toBeNull();
    expect(submenu?.getAttribute('name')).toBe('insert');
    expect(submenu?.getAttribute('style')).toContain('position: fixed');
    expect(submenu?.getAttribute('style')).toContain('top: 40px');
    expect(childButton.classList.contains('cherry-dropdown-item__selected')).toBe(true);
    expect(toolbar.currentActiveSubMenu).toBe('insert');

    childButton.click();
    expect(childFire).toHaveBeenCalledOnce();
    expect(submenu?.getAttribute('style')).toContain('display: none');

    toolbar.toggleSubMenu('insert');
    expect(submenu?.getAttribute('style')).toContain('display: block');
    toolbar.toggleSubMenu('insert');
    expect(submenu?.getAttribute('style')).toContain('display: none');
    expect(toolbar.currentActiveSubMenu).toBeNull();
  });

  it('hides every submenu under the current Cherry instance', () => {
    const { toolbar, wrapperDom } = createToolbar();
    const first = document.createElement('div');
    const second = document.createElement('div');
    first.className = 'cherry-dropdown';
    second.className = 'cherry-dropdown';
    wrapperDom.append(first, second);
    toolbar.currentActiveSubMenu = 'insert';

    toolbar.hideAllSubMenu();

    expect(first.style.display).toBe('none');
    expect(second.style.display).toBe('none');
    expect(toolbar.currentActiveSubMenu).toBeNull();
  });

  it('reads both supported submenu configuration forms', () => {
    const { toolbar } = createToolbar();
    toolbar.menus.level2MenusName.insert = ['table'];
    toolbar.menus.hooks.configured = { subMenuConfig: [{ name: 'one' }] };

    expect(toolbar.level2MenuList('insert')).toEqual(['table']);
    expect(toolbar.hasConfigMenuList('configured')).toEqual([{ name: 'one' }]);
    expect(toolbar.hasConfigMenuList('missing')).toEqual([]);
    expect(toolbar.isHasSubMenu('insert')).toBe(true);
    expect(toolbar.isHasSubMenu('configured')).toBe(true);
    expect(toolbar.isHasSubMenu('missing')).toBe(false);
  });

  it('collects menu information unless local shortcut configuration takes precedence', () => {
    const { toolbar } = createToolbar();
    toolbar.options.shortcutKey = {};
    toolbar.toolbarHandlers = { bold: vi.fn() };
    toolbar.shortcutKeyMap = { 'Control-KeyB': 'bold' };

    toolbar.collectMenuInfo({
      toolbarHandlers: { italic: vi.fn() },
      shortcutKeyMap: { 'Control-KeyI': 'italic' },
      menus: { hooks: { italic: { fire: vi.fn() } } },
    });

    expect(toolbar.toolbarHandlers).toHaveProperty('italic');
    expect(toolbar.menus.hooks).toHaveProperty('italic');
    expect(toolbar.shortcutKeyMap).toHaveProperty('Control-KeyI');

    toolbar.options.shortcutKey = { bold: 'Control-B' };
    toolbar.collectMenuInfo({
      toolbarHandlers: {},
      shortcutKeyMap: { 'Control-KeyU': 'underline' },
      menus: { hooks: {} },
    });
    expect(toolbar.shortcutKeyMap).not.toHaveProperty('Control-KeyU');
  });

  it('updates shortcut mappings and persists only valid changes', () => {
    const { toolbar } = createToolbar();
    toolbar.shortcutKeyMap = { 'Control-KeyB': { hookName: 'bold', aliasName: 'bold' } };
    localStorage.clear();

    expect(toolbar.updateShortcutKeyMap('Control-KeyB', 'Control-KeyB')).toBe(false);
    expect(toolbar.updateShortcutKeyMap('Control-KeyI', 'Control-KeyU')).toBe(false);
    expect(toolbar.updateShortcutKeyMap('Control-KeyB', 'Control-KeyM')).toBeUndefined();
    expect(toolbar.shortcutKeyMap).toEqual({
      'Control-KeyM': { hookName: 'bold', aliasName: 'bold' },
    });
    expect(localStorage.getItem('toolbar-dom-test-cherry-shortcut-keymap')).toContain('Control-KeyM');
  });

  it('normalizes legacy shortcuts before applying replacement settings', () => {
    const { toolbar } = createToolbar();
    toolbar.$cherry.locale = { bold: 'Bold' };
    toolbar.$cherry.options = {
      toolbars: {
        shortcutKey: {
          'Ctrl-b': 'bold',
          'Alt-1': 'header',
        },
        shortcutKeySettings: {
          isReplace: true,
          shortcutKeyMap: {
            'Control-KeyI': { hookName: 'italic', aliasName: 'italic' },
          },
        },
      },
    };

    toolbar.collectShortcutKey();

    expect(toolbar.shortcutKeyMap).toEqual({
      'Control-KeyI': { hookName: 'italic', aliasName: 'italic' },
    });
  });

  it('merges menu and user shortcut settings without reading the cache when requested', () => {
    const { toolbar } = createToolbar();
    toolbar.$cherry.locale = {};
    toolbar.$cherry.options = {
      toolbars: {
        shortcutKey: {},
        shortcutKeySettings: {
          isReplace: false,
          shortcutKeyMap: {
            'Control-KeyU': { hookName: 'underline', aliasName: 'underline' },
          },
        },
      },
    };
    toolbar.menus.allMenusName = ['bold', 'italic'];
    toolbar.menus.hooks.bold = {
      shortcutKeys: ['Control-KeyB'],
      shortcutKeyMap: {
        'Control-KeyB': { hookName: 'bold', aliasName: 'duplicate' },
        'Meta-KeyB': { hookName: 'bold', aliasName: 'platform' },
      },
    };
    toolbar.menus.hooks.italic = {
      shortcutKeys: null,
      shortcutKeyMap: null,
    };

    toolbar.collectShortcutKey(false);

    expect(toolbar.shortcutKeyMap).toEqual({
      'Control-KeyB': 'bold',
      'Meta-KeyB': { hookName: 'bold', aliasName: 'platform' },
      'Control-KeyU': { hookName: 'underline', aliasName: 'underline' },
    });
  });

  it('lets cached shortcuts replace matching menu actions', () => {
    const { toolbar } = createToolbar();
    toolbar.$cherry.locale = {};
    toolbar.$cherry.options = {
      toolbars: {
        shortcutKey: {},
        shortcutKeySettings: {
          isReplace: false,
          shortcutKeyMap: {},
        },
      },
    };
    toolbar.menus.allMenusName = ['bold'];
    toolbar.menus.hooks.bold = {
      shortcutKeys: null,
      shortcutKeyMap: {
        'Control-KeyB': { hookName: 'bold', aliasName: 'strong' },
      },
    };
    localStorage.setItem(
      'toolbar-dom-test-cherry-shortcut-keymap',
      JSON.stringify({
        'Meta-KeyB': { hookName: 'bold', aliasName: 'strong' },
        'Control-KeyI': { hookName: 'italic', aliasName: 'italic' },
      }),
    );

    toolbar.collectShortcutKey();

    expect(toolbar.shortcutKeyMap).toEqual({
      'Meta-KeyB': { hookName: 'bold', aliasName: 'strong' },
      'Control-KeyI': { hookName: 'italic', aliasName: 'italic' },
    });
  });

  it('updates submenu selection for multiple menus and ignores missing menus', () => {
    const { toolbar } = createToolbar();
    const first = document.createElement('div');
    const second = document.createElement('div');
    first.innerHTML = '<button class="cherry-dropdown-item"></button><button class="cherry-dropdown-item"></button>';
    second.innerHTML = '<button class="cherry-dropdown-item"></button>';
    toolbar.subMenus = { first, second };
    toolbar.menus.hooks.first = { getActiveSubMenuIndex: () => [0, 1] };
    toolbar.menus.hooks.second = { getActiveSubMenuIndex: () => undefined };

    toolbar.activeSubMenuItem(['first', 'missing', 'second']);

    expect(first.querySelectorAll('.cherry-dropdown-item__selected')).toHaveLength(2);
    expect(second.querySelectorAll('.cherry-dropdown-item__selected')).toHaveLength(0);
  });

  it('exposes toolbar handlers and matches or fires configured shortcuts', () => {
    const { toolbar } = createToolbar();
    const fire = vi.fn();
    toolbar.menus.allMenusName = ['missing', 'bold'];
    toolbar.menus.hooks.bold = { fire };
    toolbar.collectToolbarHandler();

    toolbar.toolbarHandlers.bold('strong', vi.fn());
    expect(fire).toHaveBeenCalledWith(undefined, 'strong');

    const event = new KeyboardEvent('keydown', {
      key: 'b',
      code: 'KeyB',
      ctrlKey: true,
    });
    toolbar.shortcutKeyMap = { 'Control-KeyB': 'bold' };
    expect(toolbar.matchShortcutKey(event)).toBe(true);
    expect(toolbar.fireShortcutKey(event)).toBe(true);
    expect(fire).toHaveBeenLastCalledWith(event, 'Control-KeyB');

    toolbar.shortcutKeyMap = {};
    expect(toolbar.matchShortcutKey(event)).toBe(false);
    expect(toolbar.fireShortcutKey(event)).toBe(false);

    localStorage.setItem('toolbar-dom-test-disable-cherry-shortcut-key', 'disable');
    toolbar.shortcutKeyMap = { 'Control-KeyB': { hookName: 'bold' } };
    expect(toolbar.fireShortcutKey(event)).toBe(false);
  });
});
